"""
Scoring engine constants — weights, thresholds, and configuration.

All tuning knobs live here so analysts can adjust without touching logic.
"""

from enum import Enum


# ═══════════════════════════════════════════════════════════════════════════════
# MULE PROBABILITY SCORE (MPS)
# ═══════════════════════════════════════════════════════════════════════════════

class MPSWeight:
    """Signal weights for MPS — must sum to 1.0."""
    VELOCITY       = 0.25
    PASS_THROUGH   = 0.25
    TOPOLOGY       = 0.20
    AGE_VOLUME     = 0.15
    DEVICE         = 0.15


class MPSThreshold:
    """MPS action thresholds."""
    FLAG_FOR_REVIEW = 0.65
    AUTO_ALERT      = 0.85


class MPSParams:
    """Tunable parameters for individual MPS signals."""
    # VelocityScore
    VELOCITY_BASELINE_DAYS   = 30     # days to compute avg daily inbound
    VELOCITY_WINDOW_HOURS    = 24     # recent window for spike detection
    VELOCITY_SPIKE_FACTOR    = 3.0    # flag if current > factor × baseline

    # PassThroughScore
    PASSTHROUGH_WINDOW_HOURS = 4      # forwarding detection window
    PASSTHROUGH_THRESHOLD    = 0.85   # % of inbound forwarded = flagged

    # TopologyScore
    TOPO_MIN_FANOUT          = 5      # destinations to be suspicious
    TOPO_MAX_FANIN           = 1      # concentrated source pattern

    # AgeVolumeScore
    AGE_THRESHOLD_DAYS       = 30     # "new" account cutoff
    VOLUME_DAILY_THRESHOLD   = 50_000 # INR/day to trigger

    # DeviceScore
    DEVICE_VPA_THRESHOLD     = 2      # VPAs per device to be suspicious


# ═══════════════════════════════════════════════════════════════════════════════
# LAYERING RISK SCORE (LRS)
# ═══════════════════════════════════════════════════════════════════════════════

class LRSThreshold:
    """LRS action thresholds."""
    POTENTIAL_LAYERING  = 0.70
    CONFIRMED_LAYERING  = 0.85


class LRSParams:
    """Tunable parameters for LRS signals."""
    PATH_WINDOW_HOURS     = 12      # max time span for a layering path
    MIN_HOPS              = 3       # minimum hops to consider layering
    MAX_HOPS              = 10      # maximum search depth
    MAX_HOLD_MINUTES      = 30      # pass-through hold time threshold


# ═══════════════════════════════════════════════════════════════════════════════
# FRAUD RING DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

class RingSize(str, Enum):
    """Ring classification by member count."""
    MICRO  = "MICRO"    # < 5
    SMALL  = "SMALL"    # 5–20
    MEDIUM = "MEDIUM"   # 21–100
    LARGE  = "LARGE"    # 100+


class RingParams:
    """Tunable parameters for ring detection."""
    DENSITY_FACTOR         = 3.0    # intra-ring density vs cohort baseline
    MPS_FLAGGED_THRESHOLD  = 0.65   # MPS above this counts as "flagged"
    MIN_FLAGGED_PERCENT    = 0.30   # >=30% members flagged → ring suspicious
    ACTIVATION_WINDOW_HRS  = 72     # ring activation burst window
    LOUVAIN_SEED           = 42     # deterministic community detection


def classify_ring_size(member_count: int) -> RingSize:
    """Classify a ring by its member count."""
    if member_count < 5:
        return RingSize.MICRO
    elif member_count <= 20:
        return RingSize.SMALL
    elif member_count <= 100:
        return RingSize.MEDIUM
    else:
        return RingSize.LARGE
