"""
Fraud Ring Detection Engine
════════════════════════════

Uses the Neo4j Graph Data Science (GDS) Louvain modularity algorithm
to discover communities in the transaction graph, then scores each
community for fraud-ring characteristics.

Ring scoring criteria:
  1. Intra-ring transaction density >3× cohort baseline
  2. ≥30% of members have MPS >0.65
  3. Ring activation within a 72-hour window

Ring classification by member count:
  MICRO (<5) | SMALL (5–20) | MEDIUM (21–100) | LARGE (100+)
"""

import uuid
from datetime import timedelta

from neo4j import Session

from scoring.constants import (
    RingParams,
    classify_ring_size,
)
from scoring.models import (
    DetectedRing,
    RingClassification,
    RingDetectionResponse,
    RingMember,
)


# ─── Cypher: GDS Graph Projection ────────────────────────────────────────────

_Q_DROP_PROJECTION = """
CALL gds.graph.drop('fraudgraph-ring-detection', false)
YIELD graphName
RETURN graphName
"""

_Q_CREATE_PROJECTION = """
CALL gds.graph.project(
    'fraudgraph-ring-detection',
    'Account',
    {
        SENT: {
            orientation: 'NATURAL',
            properties: ['amount', 'timestamp']
        }
    }
)
YIELD graphName, nodeCount, relationshipCount
RETURN graphName, nodeCount, relationshipCount
"""

# ─── Cypher: Louvain Community Detection ──────────────────────────────────────

_Q_LOUVAIN = """
CALL gds.louvain.stream('fraudgraph-ring-detection', {
    seedProperty: 'communityId',
    concurrency: 4
})
YIELD nodeId, communityId
WITH gds.util.asNode(nodeId) AS account, communityId
RETURN communityId,
       account.id        AS account_id,
       account.vpa       AS vpa,
       account.muleScore AS mule_score,
       account.bank      AS bank,
       account.isFlagged AS is_flagged
ORDER BY communityId, mule_score DESC
"""

# ─── Cypher: Intra-ring Transaction Stats ─────────────────────────────────────

_Q_RING_STATS = """
UNWIND $member_ids AS mid1
UNWIND $member_ids AS mid2
WITH mid1, mid2
WHERE mid1 <> mid2
MATCH (a:Account {id: mid1})-[s:SENT]->(b:Account {id: mid2})
RETURN count(s)                                      AS intra_txn_count,
       coalesce(sum(s.amount), 0.0)                  AS total_value,
       min(s.timestamp)                              AS first_txn,
       max(s.timestamp)                              AS last_txn
"""

# ─── Cypher: Global Baseline (avg txns per account pair) ─────────────────────

_Q_GLOBAL_BASELINE = """
MATCH ()-[s:SENT]->()
WITH count(s) AS total_edges
MATCH (a:Account)
WITH total_edges, count(a) AS total_accounts
RETURN total_edges,
       total_accounts,
       CASE WHEN total_accounts > 1
            THEN toFloat(total_edges) / (toFloat(total_accounts) * (toFloat(total_accounts) - 1))
            ELSE 0.0
       END AS baseline_density
"""


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _clamp(val: float) -> float:
    return max(0.0, min(1.0, val))


def _score_ring(
    members: list[RingMember],
    intra_txn_count: int,
    total_value: float,
    activation_hours: float | None,
    baseline_density: float,
) -> float:
    """
    Composite ring score from three criteria:
      1. Density factor     — intra-ring density vs global baseline
      2. Flagged fraction   — % of members with elevated MPS
      3. Activation burst   — activity concentrated in 72h window
    """

    member_count = len(members)
    if member_count < 2:
        return 0.0

    # ── 1. Density score ──────────────────────────────────────────────────
    # Possible pairs in the ring
    possible_pairs = member_count * (member_count - 1)
    ring_density = intra_txn_count / possible_pairs if possible_pairs > 0 else 0.0

    if baseline_density > 0:
        density_ratio = ring_density / baseline_density
    else:
        density_ratio = ring_density * 10  # no baseline = use raw

    density_threshold = RingParams.DENSITY_FACTOR  # 3.0
    density_score = _clamp(density_ratio / (density_threshold * 2))
    if density_ratio >= density_threshold:
        density_score = _clamp(0.6 + 0.4 * min((density_ratio - density_threshold) / density_threshold, 1.0))

    # ── 2. Flagged member score ───────────────────────────────────────────
    flagged = sum(1 for m in members if m.mule_score >= RingParams.MPS_FLAGGED_THRESHOLD)
    flagged_pct = flagged / member_count

    if flagged_pct >= RingParams.MIN_FLAGGED_PERCENT:
        flagged_score = _clamp(0.5 + 0.5 * min(flagged_pct / 0.6, 1.0))
    else:
        flagged_score = _clamp(flagged_pct / RingParams.MIN_FLAGGED_PERCENT * 0.4)

    # ── 3. Activation burst score ─────────────────────────────────────────
    if activation_hours is not None and activation_hours > 0:
        window = RingParams.ACTIVATION_WINDOW_HRS  # 72h
        if activation_hours <= window:
            # Shorter burst = more suspicious
            burst_score = _clamp(1.0 - (activation_hours / window) * 0.5)
        else:
            burst_score = _clamp(0.3 * window / activation_hours)
    else:
        burst_score = 0.1  # no temporal data

    # ── Composite (weighted average) ──────────────────────────────────────
    composite = (
        0.40 * density_score +
        0.35 * flagged_score +
        0.25 * burst_score
    )
    return round(_clamp(composite), 4)


# ─── Main Detection Function ─────────────────────────────────────────────────

def detect_rings(session: Session) -> RingDetectionResponse:
    """
    Run Louvain community detection on the full SENT graph,
    score each community, and return suspicious rings.
    """

    # ── 1. Project the graph into GDS ─────────────────────────────────────
    # Drop any stale projection first
    try:
        session.run(_Q_DROP_PROJECTION).consume()
    except Exception:
        pass  # projection didn't exist

    projection = session.run(_Q_CREATE_PROJECTION).single()
    if not projection:
        raise RuntimeError("Failed to create GDS graph projection")

    node_count = projection["nodeCount"]
    rel_count = projection["relationshipCount"]

    # ── 2. Get global baseline density ────────────────────────────────────
    baseline = session.run(_Q_GLOBAL_BASELINE).single()
    baseline_density = baseline["baseline_density"] if baseline else 0.0

    # ── 3. Run Louvain ────────────────────────────────────────────────────
    rows = session.run(_Q_LOUVAIN).data()

    if not rows:
        # Clean up projection
        try:
            session.run(_Q_DROP_PROJECTION).consume()
        except Exception:
            pass
        return RingDetectionResponse(
            total_communities=0,
            suspicious_rings=0,
            rings=[],
            metadata={"node_count": node_count, "rel_count": rel_count},
        )

    # ── 4. Group by community ─────────────────────────────────────────────
    communities: dict[int, list[RingMember]] = {}
    for r in rows:
        cid = r["communityId"]
        member = RingMember(
            account_id=r["account_id"],
            vpa=r["vpa"],
            mule_score=r["mule_score"] or 0.0,
            bank=r["bank"] or "",
            is_flagged=r["is_flagged"] or False,
        )
        communities.setdefault(cid, []).append(member)

    total_communities = len(communities)

    # ── 5. Score each community ───────────────────────────────────────────
    detected_rings: list[DetectedRing] = []

    for cid, members in communities.items():
        if len(members) < 2:
            continue  # singletons aren't rings

        member_ids = [m.account_id for m in members]

        # Get intra-ring transaction stats
        stats = session.run(_Q_RING_STATS, member_ids=member_ids).single()
        intra_txn_count = stats["intra_txn_count"] if stats else 0
        total_value = stats["total_value"] if stats else 0.0
        first_txn = stats["first_txn"] if stats else None
        last_txn = stats["last_txn"] if stats else None

        # Activation window
        activation_hours = None
        if first_txn and last_txn:
            delta = last_txn - first_txn
            if hasattr(delta, "total_seconds"):
                activation_hours = delta.total_seconds() / 3600.0
            else:
                # neo4j duration
                activation_hours = float(delta.hours_minutes_seconds_nanoseconds[0])

        # Score the ring
        ring_score = _score_ring(
            members=members,
            intra_txn_count=intra_txn_count,
            total_value=total_value,
            activation_hours=activation_hours,
            baseline_density=baseline_density,
        )

        flagged_count = sum(
            1 for m in members if m.mule_score >= RingParams.MPS_FLAGGED_THRESHOLD
        )

        ring = DetectedRing(
            ring_id=f"RING-{uuid.uuid4().hex[:8]}",
            community_id=cid,
            classification=classify_ring_size(len(members)),
            member_count=len(members),
            flagged_count=flagged_count,
            flagged_percent=round(flagged_count / len(members), 4),
            intra_ring_density=round(
                intra_txn_count / max(len(members) * (len(members) - 1), 1), 4
            ),
            estimated_value=round(total_value, 2),
            activation_window_hours=round(activation_hours, 2) if activation_hours else None,
            ring_score=ring_score,
            members=members,
        )
        detected_rings.append(ring)

    # ── 6. Filter to suspicious rings only ────────────────────────────────
    # A ring is suspicious if score > 0.3 OR flagged_percent > 0.2
    suspicious = [
        r for r in detected_rings
        if r.ring_score > 0.3 or r.flagged_percent > 0.2
    ]
    suspicious.sort(key=lambda r: r.ring_score, reverse=True)

    # ── 7. Clean up GDS projection ────────────────────────────────────────
    try:
        session.run(_Q_DROP_PROJECTION).consume()
    except Exception:
        pass

    return RingDetectionResponse(
        total_communities=total_communities,
        suspicious_rings=len(suspicious),
        rings=suspicious,
        metadata={
            "engine_version": "1.0.0",
            "algorithm": "Louvain modularity (Neo4j GDS)",
            "node_count": node_count,
            "rel_count": rel_count,
            "baseline_density": round(baseline_density, 6),
            "scoring_criteria": {
                "density_factor": RingParams.DENSITY_FACTOR,
                "min_flagged_percent": RingParams.MIN_FLAGGED_PERCENT,
                "activation_window_hrs": RingParams.ACTIVATION_WINDOW_HRS,
            },
        },
    )
