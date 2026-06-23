"""Radar chart data construction for skill gap analysis.

Logic follows TRD Step 9 specification exactly.
"""


def build_radar_data(candidate: dict, jd_skills: list[str]) -> list[dict]:
    """Build radar chart data comparing candidate skills against JD requirements.

    Scoring heuristic:
    - 9 if skill is in candidate's explicit skills list
    - 6 if skill appears in project descriptions/technologies
    - 2 if no signal found (weak match)

    JD required score is always 8 (normalized equal weight).
    """
    candidate_skills_lower = {s.lower() for s in candidate["skills"]}
    project_text = " ".join(
        [
            p["description"] + " " + " ".join(p["technologies"])
            for p in candidate["projects"]
        ]
    ).lower()

    radar = []
    for skill in jd_skills:
        skill_lower = skill.lower()
        if skill_lower in candidate_skills_lower:
            c_score = 9
        elif skill_lower in project_text:
            c_score = 6
        else:
            c_score = 2  # weak signal

        radar.append({
            "skill": skill,
            "candidate_score": c_score,
            "jd_required": 8,
        })

    return radar
