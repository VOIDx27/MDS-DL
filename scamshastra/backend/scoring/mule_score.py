"""
Mule Probability Score (MPS) Engine
════════════════════════════════════

Scores each Account node 0.0 → 1.0 across five signals:
  1. VelocityScore   (w=0.25)  — inbound transfer spike vs baseline
  2. PassThroughScore(w=0.25)  — % of inbound forwarded within 4 hours
  3. TopologyScore   (w=0.20)  — fan-in/fan-out asymmetry
  4. AgeVolumeScore  (w=0.15)  — new account + high throughput
  5. DeviceScore     (w=0.15)  — multi-VPA device sharing

Each signal returns a normalized 0.0–1.0 score.
The composite MPS is the weighted sum.
"""

from datetime import datetime
from typing import Optional

from neo4j import Session

from scoring.constants import MPSWeight, MPSThreshold, MPSParams
from scoring.models import MPSResponse, MPSVerdict, SignalDetail


# ─── Cypher Queries ───────────────────────────────────────────────────────────

_Q_ACCOUNT_INFO = """
MATCH (a:Account {id: $account_id})
RETURN a.id         AS id,
       a.vpa        AS vpa,
       a.accountAge AS accountAge,
       a.deviceIds  AS deviceIds,
       a.muleScore  AS currentMuleScore,
       a.isFlagged  AS isFlagged
"""

_Q_VELOCITY_BASELINE = """
MATCH (a:Account {id: $account_id})
MATCH (:Account)-[s:SENT]->(a)
WHERE s.timestamp > datetime() - duration({days: $baseline_days})
RETURN count(s)                                        AS total_inbound,
       toFloat(count(s)) / toFloat($baseline_days)    AS avg_daily_inbound
"""

_Q_VELOCITY_CURRENT = """
MATCH (a:Account {id: $account_id})
MATCH (:Account)-[s:SENT]->(a)
WHERE s.timestamp > datetime() - duration({hours: $window_hours})
RETURN count(s) AS recent_inbound
"""

_Q_PASS_THROUGH = """
MATCH (a:Account {id: $account_id})
OPTIONAL MATCH (:Account)-[inb:SENT]->(a)
WHERE inb.timestamp > datetime() - duration({hours: $window_hours})
WITH a, coalesce(sum(inb.amount), 0.0) AS total_inbound
OPTIONAL MATCH (a)-[out:SENT]->(:Account)
WHERE out.timestamp > datetime() - duration({hours: $window_hours})
WITH total_inbound, coalesce(sum(out.amount), 0.0) AS total_outbound
RETURN total_inbound, total_outbound,
       CASE WHEN total_inbound > 0
            THEN total_outbound / total_inbound
            ELSE 0.0
       END AS passthrough_ratio
"""

_Q_TOPOLOGY = """
MATCH (a:Account {id: $account_id})
OPTIONAL MATCH (src:Account)-[:SENT]->(a)
WITH a, count(DISTINCT src) AS fan_in
OPTIONAL MATCH (a)-[:SENT]->(dst:Account)
WITH fan_in, count(DISTINCT dst) AS fan_out
RETURN fan_in, fan_out
"""

_Q_AGE_VOLUME = """
MATCH (a:Account {id: $account_id})
WITH a, a.accountAge AS age_days
OPTIONAL MATCH (a)-[s:SENT]->()
WITH age_days,
     coalesce(sum(s.amount), 0.0) AS total_sent,
     CASE WHEN age_days > 0 THEN age_days ELSE 1 END AS safe_age
RETURN age_days,
       total_sent / toFloat(safe_age) AS daily_volume
"""

_Q_DEVICE_VPAS = """
MATCH (a:Account {id: $account_id})-[:USES]->(d:Device)
RETURN d.imei AS imei, size(d.registeredVpas) AS vpa_count
"""

_Q_UPDATE_MULE_SCORE = """
MATCH (a:Account {id: $account_id})
SET a.muleScore = $score,
    a.isFlagged = $flagged
RETURN a.id AS id
"""


# ─── Signal Calculators ──────────────────────────────────────────────────────

def _clamp(val: float) -> float:
    """Clamp to [0.0, 1.0]."""
    return max(0.0, min(1.0, val))


def _calc_velocity(session: Session, account_id: str) -> tuple[float, str]:
    """
    VelocityScore: compare recent 24h inbound count to 30-day baseline.
    Score = min(1.0, (recent / (baseline × spike_factor))).
    If recent > spike_factor × baseline → score approaches 1.0.
    """
    baseline_row = session.run(
        _Q_VELOCITY_BASELINE,
        account_id=account_id,
        baseline_days=MPSParams.VELOCITY_BASELINE_DAYS,
    ).single()

    current_row = session.run(
        _Q_VELOCITY_CURRENT,
        account_id=account_id,
        window_hours=MPSParams.VELOCITY_WINDOW_HOURS,
    ).single()

    if not baseline_row or not current_row:
        return 0.0, "No transaction data available"

    avg_daily = baseline_row["avg_daily_inbound"] or 0.0
    recent = current_row["recent_inbound"] or 0

    if avg_daily == 0:
        # No baseline — if any recent activity, moderate suspicion
        score = _clamp(0.3 * recent) if recent > 0 else 0.0
        return score, f"No baseline; {recent} recent inbound txns"

    ratio = recent / avg_daily
    spike_threshold = MPSParams.VELOCITY_SPIKE_FACTOR

    if ratio >= spike_threshold:
        # Normalize: ratio/spike_threshold maps [3x, 6x+] → [0.7, 1.0]
        score = _clamp(0.7 + 0.3 * min((ratio - spike_threshold) / spike_threshold, 1.0))
    else:
        # Below spike: linear scale [0, 3x] → [0.0, 0.5]
        score = _clamp(0.5 * ratio / spike_threshold)

    explanation = (
        f"{recent} inbound in {MPSParams.VELOCITY_WINDOW_HOURS}h vs "
        f"{avg_daily:.1f}/day baseline ({ratio:.1f}x)"
    )
    return score, explanation


def _calc_pass_through(session: Session, account_id: str) -> tuple[float, str]:
    """
    PassThroughScore: % of inbound funds forwarded within the window.
    Mule accounts receive and immediately forward ≥85% of funds.
    """
    row = session.run(
        _Q_PASS_THROUGH,
        account_id=account_id,
        window_hours=MPSParams.PASSTHROUGH_WINDOW_HOURS,
    ).single()

    if not row:
        return 0.0, "No transaction data available"

    inbound = row["total_inbound"] or 0.0
    outbound = row["total_outbound"] or 0.0
    ratio = row["passthrough_ratio"] or 0.0

    if inbound == 0:
        return 0.0, "No inbound funds in window"

    threshold = MPSParams.PASSTHROUGH_THRESHOLD  # 0.85

    if ratio >= threshold:
        # High pass-through: [0.85, 1.0] → [0.75, 1.0]
        score = _clamp(0.75 + 0.25 * (ratio - threshold) / (1.0 - threshold))
    elif ratio >= 0.5:
        # Moderate: [0.5, 0.85] → [0.3, 0.75]
        score = _clamp(0.3 + 0.45 * (ratio - 0.5) / (threshold - 0.5))
    else:
        # Low pass-through: [0, 0.5] → [0.0, 0.3]
        score = _clamp(0.3 * ratio / 0.5)

    explanation = (
        f"₹{outbound:,.0f} forwarded out of ₹{inbound:,.0f} inbound "
        f"({ratio:.0%} pass-through in {MPSParams.PASSTHROUGH_WINDOW_HOURS}h)"
    )
    return score, explanation


def _calc_topology(session: Session, account_id: str) -> tuple[float, str]:
    """
    TopologyScore: fan-in/fan-out asymmetry.
    Classic mule: receives from 1 source, forwards to 5+ destinations.
    """
    row = session.run(_Q_TOPOLOGY, account_id=account_id).single()

    if not row:
        return 0.0, "No topology data available"

    fan_in = row["fan_in"] or 0
    fan_out = row["fan_out"] or 0

    score = 0.0

    if fan_in == 0 and fan_out == 0:
        return 0.0, "No connections"

    # Pattern 1: concentrated source → many destinations (mule distribution)
    if fan_in <= MPSParams.TOPO_MAX_FANIN and fan_out >= MPSParams.TOPO_MIN_FANOUT:
        spread_ratio = fan_out / max(fan_in, 1)
        score = _clamp(0.6 + 0.4 * min(spread_ratio / 10.0, 1.0))
    # Pattern 2: many sources → few destinations (collector)
    elif fan_in >= MPSParams.TOPO_MIN_FANOUT and fan_out <= MPSParams.TOPO_MAX_FANIN:
        score = _clamp(0.5 + 0.3 * min(fan_in / 15.0, 1.0))
    # Pattern 3: balanced but high volume on both sides
    elif fan_in >= 3 and fan_out >= 3:
        score = _clamp(0.2 + 0.3 * min((fan_in + fan_out) / 20.0, 1.0))
    else:
        score = _clamp(0.1 * (fan_in + fan_out) / 5.0)

    explanation = f"fan-in={fan_in}, fan-out={fan_out}"
    return score, explanation


def _calc_age_volume(session: Session, account_id: str) -> tuple[float, str]:
    """
    AgeVolumeScore: new account (<30 days) with high daily throughput (>₹50,000).
    Both conditions must be present for a high score.
    """
    row = session.run(_Q_AGE_VOLUME, account_id=account_id).single()

    if not row:
        return 0.0, "No account data available"

    age_days = row["age_days"] or 0
    daily_vol = row["daily_volume"] or 0.0

    age_threshold = MPSParams.AGE_THRESHOLD_DAYS
    vol_threshold = MPSParams.VOLUME_DAILY_THRESHOLD

    # Age factor: new accounts score higher (30 → 0.0, 0 → 1.0)
    age_factor = _clamp(1.0 - (age_days / age_threshold)) if age_days < age_threshold else 0.0

    # Volume factor: high daily volume scores higher
    vol_factor = _clamp(daily_vol / vol_threshold)

    # Both conditions must co-occur — multiplicative with a floor
    score = _clamp(age_factor * vol_factor * 1.2)  # slight boost when both are high

    explanation = (
        f"Account age: {age_days}d, daily volume: ₹{daily_vol:,.0f} "
        f"(age_factor={age_factor:.2f}, vol_factor={vol_factor:.2f})"
    )
    return score, explanation


def _calc_device(session: Session, account_id: str) -> tuple[float, str]:
    """
    DeviceScore: multiple UPI VPAs registered on the same device IMEI.
    More VPAs on a single device → higher score.
    """
    rows = session.run(_Q_DEVICE_VPAS, account_id=account_id).data()

    if not rows:
        return 0.0, "No device linkage found"

    max_vpas = max(r["vpa_count"] for r in rows)
    total_devices = len(rows)
    threshold = MPSParams.DEVICE_VPA_THRESHOLD

    if max_vpas <= 1:
        score = 0.0
        explanation = f"{total_devices} device(s), 1 VPA each — clean"
    elif max_vpas <= threshold:
        score = _clamp(0.3 * max_vpas / threshold)
        explanation = f"Max {max_vpas} VPAs on a single device — low concern"
    else:
        # Strongly suspicious: multiple VPAs per device
        score = _clamp(0.5 + 0.5 * min((max_vpas - threshold) / 5.0, 1.0))
        imeis = [r["imei"] for r in rows if r["vpa_count"] > threshold]
        explanation = (
            f"Max {max_vpas} VPAs on device(s) {', '.join(imeis[:3])} — "
            f"multi-VPA device sharing detected"
        )

    return score, explanation


# ─── Composite Scorer ─────────────────────────────────────────────────────────

def compute_mps(session: Session, account_id: str) -> MPSResponse:
    """
    Compute the Mule Probability Score for a single account.
    Returns the composite score, verdict, and full signal breakdown.
    """

    # ── Fetch account info ────────────────────────────────────────────────
    acct = session.run(_Q_ACCOUNT_INFO, account_id=account_id).single()
    if not acct:
        raise ValueError(f"Account {account_id} not found")

    vpa = acct["vpa"]

    # ── Calculate all five signals ────────────────────────────────────────
    vel_score, vel_exp     = _calc_velocity(session, account_id)
    pt_score, pt_exp       = _calc_pass_through(session, account_id)
    topo_score, topo_exp   = _calc_topology(session, account_id)
    av_score, av_exp       = _calc_age_volume(session, account_id)
    dev_score, dev_exp     = _calc_device(session, account_id)

    # ── Build signal details ──────────────────────────────────────────────
    signals = [
        SignalDetail(
            name="VelocityScore",
            raw_score=round(vel_score, 4),
            weight=MPSWeight.VELOCITY,
            weighted_score=round(vel_score * MPSWeight.VELOCITY, 4),
            explanation=vel_exp,
        ),
        SignalDetail(
            name="PassThroughScore",
            raw_score=round(pt_score, 4),
            weight=MPSWeight.PASS_THROUGH,
            weighted_score=round(pt_score * MPSWeight.PASS_THROUGH, 4),
            explanation=pt_exp,
        ),
        SignalDetail(
            name="TopologyScore",
            raw_score=round(topo_score, 4),
            weight=MPSWeight.TOPOLOGY,
            weighted_score=round(topo_score * MPSWeight.TOPOLOGY, 4),
            explanation=topo_exp,
        ),
        SignalDetail(
            name="AgeVolumeScore",
            raw_score=round(av_score, 4),
            weight=MPSWeight.AGE_VOLUME,
            weighted_score=round(av_score * MPSWeight.AGE_VOLUME, 4),
            explanation=av_exp,
        ),
        SignalDetail(
            name="DeviceScore",
            raw_score=round(dev_score, 4),
            weight=MPSWeight.DEVICE,
            weighted_score=round(dev_score * MPSWeight.DEVICE, 4),
            explanation=dev_exp,
        ),
    ]

    # ── Composite MPS ─────────────────────────────────────────────────────
    mps = round(sum(s.weighted_score for s in signals), 4)
    mps = _clamp(mps)

    # ── Verdict ───────────────────────────────────────────────────────────
    if mps >= MPSThreshold.AUTO_ALERT:
        verdict = MPSVerdict.AUTO_ALERT
    elif mps >= MPSThreshold.FLAG_FOR_REVIEW:
        verdict = MPSVerdict.FLAG_FOR_REVIEW
    else:
        verdict = MPSVerdict.CLEAR

    flagged_at = datetime.utcnow() if verdict != MPSVerdict.CLEAR else None

    # ── Persist score back to Neo4j ───────────────────────────────────────
    session.run(
        _Q_UPDATE_MULE_SCORE,
        account_id=account_id,
        score=mps,
        flagged=verdict != MPSVerdict.CLEAR,
    )

    return MPSResponse(
        account_id=account_id,
        vpa=vpa,
        mps=mps,
        verdict=verdict,
        signals=signals,
        flagged_at=flagged_at,
        metadata={
            "engine_version": "1.0.0",
            "weights": {
                "velocity": MPSWeight.VELOCITY,
                "pass_through": MPSWeight.PASS_THROUGH,
                "topology": MPSWeight.TOPOLOGY,
                "age_volume": MPSWeight.AGE_VOLUME,
                "device": MPSWeight.DEVICE,
            },
        },
    )

