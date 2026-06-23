"""Scoring service — career metadata, behavioral velocity, and composite score calculations.

All formulas follow the TRD specification exactly.
"""


def compute_career_score(candidate: dict) -> float:
    """Compute career metadata score (0-100) from experience, title progression, and tenure stability."""
    p = candidate["behavioral_metadata"]

    # Sub-signal 1: Years experience (normalized to 0-100, capped at 12 years = 100)
    exp_score = min(candidate["personal"]["years_experience"] / 12.0, 1.0) * 100

    # Sub-signal 2: Title progression (already 0-10, scale to 0-100)
    title_score = p["title_progression_score"] * 10

    # Sub-signal 3: Tenure stability (avg tenure > 18 months = full marks)
    tenure_score = min(p["avg_tenure_months"] / 18.0, 1.0) * 100

    # Weighted average of sub-signals
    career_score = (exp_score * 0.4) + (title_score * 0.35) + (tenure_score * 0.25)
    return round(career_score, 1)


def compute_velocity_score(candidate: dict) -> float:
    """Compute behavioral velocity score (0-100) from promotion speed.

    Faster promotion = higher score.
    Ideal: promoted within 12 months. >36 months = low score.
    """
    p = candidate["behavioral_metadata"]
    promo_months = p["promotion_speed_months"]

    if promo_months <= 12:
        promo_score = 100.0
    elif promo_months <= 36:
        promo_score = 100 - ((promo_months - 12) / 24) * 60
    else:
        promo_score = 40.0  # floor

    return round(promo_score, 1)


def compute_composite(
    semantic: float,
    career: float,
    velocity: float,
    weights: dict,
) -> float:
    """Compute weighted composite score from three signals."""
    composite = (
        weights["semantic"] * semantic
        + weights["career"] * career
        + weights["velocity"] * velocity
    )
    return round(composite, 1)
