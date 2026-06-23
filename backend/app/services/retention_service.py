"""Retention risk heuristic model.

Formula and thresholds follow the TRD Step 6 / PRD Feature 6 specification exactly.
"""


def compute_retention_risk(candidate: dict) -> dict:
    """Compute retention risk tier, score, and triggered signals."""
    p = candidate["behavioral_metadata"]
    signals = []
    score = 0.0

    if p["avg_tenure_months"] < 14:
        score += 0.40
        signals.append("Short average tenure (< 14 months)")

    if p["num_companies_last_3yr"] > 2:
        score += 0.35
        signals.append("3+ companies in last 3 years")

    if p["promotion_speed_months"] > 30:
        score += 0.25
        signals.append("Slow promotion trajectory (> 30 months)")

    if score < 0.35:
        tier = "LOW"
    elif score <= 0.65:
        tier = "MEDIUM"
    else:
        tier = "HIGH"

    return {"tier": tier, "score": round(score, 2), "signals_triggered": signals}
