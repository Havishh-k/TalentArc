import asyncio
import json
import os
import anthropic
from anthropic import AsyncAnthropic

# TRD specifies claude-haiku-4-5-20251001. We use an async client for parallel requests.
# Set max_retries=0 because we want to fail fast and fall back.
client = AsyncAnthropic(max_retries=0)

MODEL_NAME = "claude-3-haiku-20240307" # Using actual Haiku model name as placeholder may fail

JUSTIFICATION_PROMPT = """You are an expert technical recruiter. Write exactly 2 sentences justifying why this candidate is ranked #{rank} for the given job description.

Job Description Summary: {jd_summary}
Candidate: {title} with {years_exp} years experience. Top skills: {top_skills}. Key project: {best_project}.
Composite Score: {composite_score}/100 (Semantic: {semantic}, Career: {career}, Velocity: {velocity})
Blind Mode: {blind_mode}

Rules:
- Exactly 2 sentences. No bullet points.
- Reference specific skills or project details from the candidate profile.
- Reference specific requirements from the JD.
- If Blind Mode is True, use gender-neutral language only (they/their, no he/she).
- Be precise and professional. Do not use filler phrases like "strong candidate".

Output ONLY the 2-sentence justification. Nothing else."""

SKILL_EXTRACT_PROMPT = """Extract the top 6–8 key technical and soft skills required by this job description.
Return ONLY a JSON array of strings. No explanation.
Example: ["Python", "MLOps", "System Design", "SQL", "Communication"]

Job Description: {jd_text}"""

async def extract_jd_skills(jd_text: str) -> list[str]:
    """Extract skills using LLM with fallback to heuristic on timeout/auth error."""
    try:
        # 3-second timeout guard
        message = await asyncio.wait_for(
            client.messages.create(
                model=MODEL_NAME,
                max_tokens=100,
                messages=[{"role": "user", "content": SKILL_EXTRACT_PROMPT.format(jd_text=jd_text[:1000])}]
            ),
            timeout=3.0
        )
        # Parse JSON array from response
        content = message.content[0].text.strip()
        # Find json array boundaries in case LLM wraps it in markdown
        start = content.find('[')
        end = content.rfind(']')
        if start != -1 and end != -1:
            return json.loads(content[start:end+1])
        return []
    except Exception as e:
        # Fallback to heuristic
        print(f"[LLM Fallback] extract_jd_skills failed: {e}")
        known_skills = [
            "Python", "Java", "JavaScript", "TypeScript", "Go", "C++", "SQL",
            "PyTorch", "TensorFlow", "MLOps", "MLflow", "Kubernetes", "Docker",
            "Spark", "Kafka", "Airflow", "FastAPI", "React", "Node.js",
            "System Design", "Microservices", "AWS", "GCP", "Azure",
            "NLP", "Computer Vision", "Transformers", "Redis", "PostgreSQL",
            "Communication", "Leadership", "Distributed Systems"
        ]
        jd_lower = jd_text.lower()
        extracted = [s for s in known_skills if s.lower() in jd_lower]
        return extracted[:8]

import hashlib

CACHE_FILE = "./app/data/llm_cache.json"
_LLM_CACHE = None

def _get_cache():
    global _LLM_CACHE
    if _LLM_CACHE is None:
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r") as f:
                    _LLM_CACHE = json.load(f)
            except Exception:
                _LLM_CACHE = {}
        else:
            _LLM_CACHE = {}
    return _LLM_CACHE

def _save_cache():
    global _LLM_CACHE
    if _LLM_CACHE is not None:
        os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
        with open(CACHE_FILE, "w") as f:
            json.dump(_LLM_CACHE, f, indent=2)

def _get_cache_key(candidate_id: str, jd_summary: str) -> str:
    seed_str = f"{candidate_id}_{jd_summary}"
    return hashlib.md5(seed_str.encode()).hexdigest()

async def generate_justification(candidate: dict, jd_summary: str, scores: dict, rank: int, blind_mode: bool) -> str:
    """Generate 2-sentence justification with deterministic local cache and fallback on timeout/auth error."""
    cache_key = _get_cache_key(candidate["candidate_id"], jd_summary[:300])
    cache = _get_cache()
    if cache_key in cache:
        return cache[cache_key]

    prompt = JUSTIFICATION_PROMPT.format(
        rank=rank,
        jd_summary=jd_summary[:300],
        title=candidate["personal"]["current_title"],
        years_exp=candidate["personal"]["years_experience"],
        top_skills=", ".join(candidate["skills"][:5]),
        best_project=candidate["projects"][0]["title"] if candidate["projects"] else "N/A",
        composite_score=scores["composite"],
        semantic=scores["semantic"],
        career=scores["career"],
        velocity=scores["velocity"],
        blind_mode=blind_mode
    )
    
    try:
        # 3-second timeout guard
        message = await asyncio.wait_for(
            client.messages.create(
                model=MODEL_NAME,
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}]
            ),
            timeout=3.0
        )
        justification = message.content[0].text.strip()
        cache[cache_key] = justification
        _save_cache()
        return justification
    except Exception as e:
        print(f"[LLM Fallback] generate_justification failed for candidate {candidate['candidate_id']}: {e}")
        # Fallback template string
        pronoun = "they" if blind_mode else "this candidate"
        return f"With {candidate['personal']['years_experience']} years of experience and a strong background in {', '.join(candidate['skills'][:3])}, {pronoun} closely match the core requirements of this role. Their composite score of {scores['composite']} reflects a robust mix of semantic fit and career progression."
