import pytest
from app.services.scoring_service import compute_career_score, compute_velocity_score, compute_composite
from app.services.retention_service import compute_retention_risk
from app.services.radar_service import build_radar_data

def test_compute_career_score():
    candidate_perfect = {
        "personal": {"years_experience": 12.0},
        "behavioral_metadata": {
            "title_progression_score": 10.0,
            "avg_tenure_months": 18.0
        }
    }
    # (1.0 * 100 * 0.4) + (10.0 * 10 * 0.35) + (1.0 * 100 * 0.25) = 40 + 35 + 25 = 100.0
    assert compute_career_score(candidate_perfect) == 100.0

    candidate_mid = {
        "personal": {"years_experience": 6.0},
        "behavioral_metadata": {
            "title_progression_score": 5.0,
            "avg_tenure_months": 9.0
        }
    }
    # (0.5 * 100 * 0.4) + (5.0 * 10 * 0.35) + (0.5 * 100 * 0.25) = 20 + 17.5 + 12.5 = 50.0
    assert compute_career_score(candidate_mid) == 50.0

def test_compute_velocity_score():
    candidate_fast = {"behavioral_metadata": {"promotion_speed_months": 12}}
    assert compute_velocity_score(candidate_fast) == 100.0

    candidate_mid = {"behavioral_metadata": {"promotion_speed_months": 24}}
    # 100 - ((24-12)/24)*60 = 100 - (12/24)*60 = 100 - 30 = 70.0
    assert compute_velocity_score(candidate_mid) == 70.0

    candidate_slow = {"behavioral_metadata": {"promotion_speed_months": 40}}
    assert compute_velocity_score(candidate_slow) == 40.0

def test_compute_composite():
    weights = {"semantic": 0.5, "career": 0.3, "velocity": 0.2}
    semantic = 80.0
    career = 90.0
    velocity = 70.0
    # 0.5*80 + 0.3*90 + 0.2*70 = 40 + 27 + 14 = 81.0
    assert compute_composite(semantic, career, velocity, weights) == 81.0

def test_retention_risk():
    candidate_high_risk = {
        "behavioral_metadata": {
            "avg_tenure_months": 10,  # < 14 (+0.40)
            "num_companies_last_3yr": 3, # > 2 (+0.35)
            "promotion_speed_months": 36 # > 30 (+0.25)
        }
    }
    # score = 0.4 + 0.35 + 0.25 = 1.0 (HIGH)
    risk = compute_retention_risk(candidate_high_risk)
    assert risk["tier"] == "HIGH"
    assert risk["score"] == 1.0
    assert len(risk["signals_triggered"]) == 3

    candidate_low_risk = {
        "behavioral_metadata": {
            "avg_tenure_months": 36,
            "num_companies_last_3yr": 1,
            "promotion_speed_months": 24
        }
    }
    risk = compute_retention_risk(candidate_low_risk)
    assert risk["tier"] == "LOW"
    assert risk["score"] == 0.0
    assert len(risk["signals_triggered"]) == 0

def test_build_radar_data():
    candidate = {
        "skills": ["Python", "SQL"],
        "projects": [
            {
                "description": "Used PyTorch for deep learning.",
                "technologies": ["PyTorch", "Docker"]
            }
        ]
    }
    jd_skills = ["Python", "PyTorch", "AWS"]
    
    radar = build_radar_data(candidate, jd_skills)
    assert len(radar) == 3
    
    python_entry = next(r for r in radar if r["skill"] == "Python")
    assert python_entry["candidate_score"] == 9 # Explicit skill
    
    pytorch_entry = next(r for r in radar if r["skill"] == "PyTorch")
    assert pytorch_entry["candidate_score"] == 6 # Project description
    
    aws_entry = next(r for r in radar if r["skill"] == "AWS")
    assert aws_entry["candidate_score"] == 2 # No signal
