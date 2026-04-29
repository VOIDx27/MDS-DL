"""
Layering Risk Score (LRS) Engine
═════════════════════════════════

Scores transaction paths between two accounts for layering behaviour.

Four multiplicative signals:
  1. HopScore           — path has ≥3 hops within a 12-hour window
  2. VelocityScore      — each intermediate node holds funds <30 minutes
  3. BankDiversityScore — each hop uses a different issuing bank
  4. GeoDiversityScore  — each hop crosses a different Indian state

Formula:  LRS = HopScore × VelocityScore × BankDiversityScore × GeoDiversityScore

Because signals are multiplicative, ALL four must be elevated for a high LRS.
A single clean signal pulls the composite score down — this reduces false positives.
"""

from neo4j import Session

from scoring.constants import LRSParams, LRSThreshold
from scoring.models import (
    LRSResponse,
    LRSSignals,
    LRSVerdict,
    PathHop,
    PathScoreRequest,
)


# ─── Cypher Queries ───────────────────────────────────────────────────────────

_Q_RESOLVE_ACCOUNT = """
MATCH (a:Account)
WHERE a.id = $identifier OR a.vpa = $identifier
RETURN a.id AS id, a.vpa AS vpa
LIMIT 1
"""

# Find all paths between source and target up to MAX_HOPS.
# We collect edge properties along the path so we can score each hop.
_Q_FIND_PATHS = """
MATCH path = (src:Account {id: $source_id})-[:SENT*1..$max_hops]->(tgt:Account {id: $target_id})
WITH path,
     relationships(path) AS rels,
     nodes(path)         AS accts,
     [r IN relationships(path) | r.timestamp] AS timestamps
// Only keep paths whose full span fits within the time window
WHERE duration.between(head(timestamps), last(timestamps)).hours <= $window_hours
// Order by fewest hops (most direct layering) then by recency
ORDER BY length(path), last(timestamps) DESC
LIMIT 5
UNWIND range(0, size(rels) - 1) AS idx
WITH path,
     idx,
     accts[idx]            AS from_acct,
     accts[idx + 1]        AS to_acct,
     rels[idx]             AS rel
// Fetch matching Transaction node for extra metadata
OPTIONAL MATCH (tx:Transaction {utr: rel.utr})
RETURN
    id(path)                   AS path_id,
    length(path)               AS hop_count,
    idx                        AS hop_index,
    from_acct.id               AS from_id,
    from_acct.vpa              AS from_vpa,
    to_acct.id                 AS to_id,
    to_acct.vpa                AS to_vpa,
    rel.amount                 AS amount,
    rel.timestamp              AS timestamp,
    coalesce(tx.bank, '')      AS bank,
    coalesce(tx.city, '')      AS city,
    coalesce(tx.state, '')     AS state
ORDER BY path_id, hop_index
"""


# ─── Signal Calculators ──────────────────────────────────────────────────────

def _clamp(val: float) -> float:
    return max(0.0, min(1.0, val))


def _calc_hop_score(hop_count: int) -> float:
    """
    HopScore: more hops within the window → higher risk.
    3 hops = 0.6, 5 hops = 0.85, 7+ hops = 1.0.
    Below 3 hops = low risk (0.1–0.4).
    """
    min_hops = LRSParams.MIN_HOPS  # 3
    if hop_count < 2:
        return 0.1
    elif hop_count < min_hops:
        return 0.2 + 0.2 * (hop_count - 2)
    else:
        # [3, 7+] → [0.6, 1.0]
        return _clamp(0.6 + 0.1 * (hop_count - min_hops))


def _calc_velocity_score(hops: list[PathHop]) -> float:
    """
    VelocityScore: each intermediate account should hold funds <30 minutes.
    Score = fraction of hops where hold time < threshold.
    """
    if len(hops) < 2:
        return 0.0

    rapid_count = 0
    total_intermediate = 0

    for i in range(len(hops) - 1):
        # Hold time = time between receiving and forwarding
        current_ts = hops[i].timestamp
        next_ts = hops[i + 1].timestamp
        hold_minutes = (next_ts - current_ts).total_seconds() / 60.0

        # Store hold time on the hop for the response
        hops[i].hold_minutes = round(hold_minutes, 1)

        total_intermediate += 1
        if hold_minutes < LRSParams.MAX_HOLD_MINUTES:
            rapid_count += 1

    if total_intermediate == 0:
        return 0.0

    fraction_rapid = rapid_count / total_intermediate

    # Boost: if ALL intermediaries are rapid, that's very suspicious
    if fraction_rapid >= 1.0:
        return 1.0
    elif fraction_rapid >= 0.8:
        return _clamp(0.8 + 0.2 * (fraction_rapid - 0.8) / 0.2)
    else:
        return _clamp(fraction_rapid)


def _calc_bank_diversity(hops: list[PathHop]) -> float:
    """
    BankDiversityScore: layering often uses different banks at each hop.
    Score = unique banks / total hops.
    """
    if not hops:
        return 0.0

    banks = [h.bank for h in hops if h.bank]
    if not banks:
        return 0.0

    unique_banks = len(set(banks))
    total = len(banks)

    diversity = unique_banks / total
    return _clamp(diversity)


def _calc_geo_diversity(hops: list[PathHop]) -> float:
    """
    GeoDiversityScore: layering crosses different Indian states.
    Score = unique states / total hops.
    """
    if not hops:
        return 0.0

    states = [h.state for h in hops if h.state]
    if not states:
        return 0.0

    unique_states = len(set(states))
    total = len(states)

    diversity = unique_states / total
    return _clamp(diversity)


# ─── Path Reconstruction ─────────────────────────────────────────────────────

def _reconstruct_best_path(rows: list[dict]) -> tuple[int, list[PathHop]]:
    """
    From the raw Cypher rows, reconstruct the best (shortest, most recent)
    path as a list of PathHop objects.
    """
    if not rows:
        return 0, []

    # Group by path_id, take the first (already ordered by preference)
    best_path_id = rows[0]["path_id"]
    hop_count = rows[0]["hop_count"]

    hops = []
    for r in rows:
        if r["path_id"] != best_path_id:
            break
        hops.append(PathHop(
            from_vpa=r["from_vpa"],
            to_vpa=r["to_vpa"],
            amount=r["amount"],
            bank=r["bank"],
            city=r["city"],
            state=r["state"],
            timestamp=r["timestamp"],
            hold_minutes=None,
        ))

    return hop_count, hops


# ─── Composite Scorer ─────────────────────────────────────────────────────────

def compute_lrs(session: Session, request: PathScoreRequest) -> LRSResponse:
    """
    Compute the Layering Risk Score for a transaction path
    between source and target accounts.
    """

    # ── Resolve account identifiers (accept id OR vpa) ────────────────────
    src = session.run(_Q_RESOLVE_ACCOUNT, identifier=request.source_id).single()
    if not src:
        raise ValueError(f"Source account '{request.source_id}' not found")

    tgt = session.run(_Q_RESOLVE_ACCOUNT, identifier=request.target_id).single()
    if not tgt:
        raise ValueError(f"Target account '{request.target_id}' not found")

    source_id = src["id"]
    target_id = tgt["id"]

    # ── Find paths ────────────────────────────────────────────────────────
    rows = session.run(
        _Q_FIND_PATHS,
        source_id=source_id,
        target_id=target_id,
        max_hops=LRSParams.MAX_HOPS,
        window_hours=LRSParams.PATH_WINDOW_HOURS,
    ).data()

    if not rows:
        # No path found — return clean score
        return LRSResponse(
            source_id=request.source_id,
            target_id=request.target_id,
            lrs=0.0,
            verdict=LRSVerdict.CLEAR,
            hop_count=0,
            path=[],
            signals=LRSSignals(
                hop_score=0.0,
                velocity_score=0.0,
                bank_diversity_score=0.0,
                geo_diversity_score=0.0,
            ),
            metadata={"note": "No transaction path found between accounts"},
        )

    # ── Reconstruct path ──────────────────────────────────────────────────
    hop_count, hops = _reconstruct_best_path(rows)

    # ── Calculate signals ─────────────────────────────────────────────────
    hop_score = _calc_hop_score(hop_count)
    velocity_score = _calc_velocity_score(hops)
    bank_div_score = _calc_bank_diversity(hops)
    geo_div_score = _calc_geo_diversity(hops)

    # ── Composite LRS (multiplicative) ────────────────────────────────────
    lrs = round(hop_score * velocity_score * bank_div_score * geo_div_score, 4)
    lrs = _clamp(lrs)

    # ── Verdict ───────────────────────────────────────────────────────────
    if lrs >= LRSThreshold.CONFIRMED_LAYERING:
        verdict = LRSVerdict.CONFIRMED_LAYERING
    elif lrs >= LRSThreshold.POTENTIAL_LAYERING:
        verdict = LRSVerdict.POTENTIAL_LAYERING
    else:
        verdict = LRSVerdict.CLEAR

    return LRSResponse(
        source_id=request.source_id,
        target_id=request.target_id,
        lrs=lrs,
        verdict=verdict,
        hop_count=hop_count,
        path=hops,
        signals=LRSSignals(
            hop_score=round(hop_score, 4),
            velocity_score=round(velocity_score, 4),
            bank_diversity_score=round(bank_div_score, 4),
            geo_diversity_score=round(geo_div_score, 4),
        ),
        metadata={
            "engine_version": "1.0.0",
            "formula": "LRS = HopScore × VelocityScore × BankDiversityScore × GeoDiversityScore",
            "thresholds": {
                "potential_layering": LRSThreshold.POTENTIAL_LAYERING,
                "confirmed_layering": LRSThreshold.CONFIRMED_LAYERING,
            },
        },
    )
