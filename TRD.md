# TRD.md — Technical Requirements Document
## Intelligent Candidate Discovery Engine
### India Runs Hackathon · Solo Sprint · 10-Day PoC

---

## 1. API Contract

All endpoints are served by FastAPI at base URL `http://localhost:8000/api`.  
All requests/responses use `Content-Type: application/json`.

---

### Endpoint 1: `POST /api/search`

**Purpose:** Primary search endpoint. Accepts a job description and scoring weights; returns ranked candidate shortlist with scores and justifications.

**Request Body:**
```json
{
  "job_description": "string (300–2000 chars, required)",
  "weights": {
    "semantic": 0.50,
    "career": 0.30,
    "velocity": 0.20
  },
  "top_n": 10,
  "blind_mode": false
}
```

**Validation Rules:**
- `weights.semantic + weights.career + weights.velocity` must equal `1.0` (±0.01 tolerance)
- `top_n` must be in `[5, 10, 20]`
- `job_description` must be non-empty string, min 50 chars

**Response Body (200 OK):**
```json
{
  "search_id": "uuid-string",
  "jd_skills_extracted": ["Python", "MLOps", "System Design", "SQL", "FastAPI"],
  "total_candidates_scanned": 50,
  "results": [
    {
      "rank": 1,
      "candidate_id": "c001",
      "display_name": "Arjun Mehta",
      "display_title": "Senior ML Engineer",
      "display_institution": "IIT Bombay",
      "composite_score": 87.4,
      "score_breakdown": {
        "semantic_score": 91.2,
        "career_score": 82.0,
        "velocity_score": 78.5
      },
      "justification": "string (2 sentences, LLM-generated)",
      "retention_risk": {
        "tier": "LOW",
        "score": 0.25,
        "signals_triggered": []
      },
      "radar_data": [
        { "skill": "Python", "candidate_score": 9, "jd_required": 9 },
        { "skill": "MLOps", "candidate_score": 7, "jd_required": 9 },
        { "skill": "System Design", "candidate_score": 8, "jd_required": 7 }
      ],
      "blind_mode_applied": false
    }
  ],
  "latency_ms": 1240
}
```

**Error Responses:**
```json
{ "detail": "weights must sum to 1.0" }   // 422
{ "detail": "job_description too short" }  // 422
{ "detail": "vector store unavailable" }   // 503
```

---

### Endpoint 2: `GET /api/candidates`

**Purpose:** Returns the full candidate pool (for frontend mock data validation and optional manual browsing).

**Query Parameters:**
- `limit` (int, default 50, max 200)
- `offset` (int, default 0)

**Response Body (200 OK):**
```json
{
  "total": 50,
  "candidates": [ /* array of CandidateProfile objects — see Data Schema */ ]
}
```

---

### Endpoint 3: `POST /api/seed`

**Purpose:** Populates ChromaDB with pre-embedded candidate profiles from the mock dataset. Idempotent — safe to call multiple times; clears and re-seeds the collection.

**Request Body:** `{}` (empty — seeds from internal `mock_candidates.json`)

**Response Body (200 OK):**
```json
{
  "seeded_count": 50,
  "collection_name": "candidates",
  "status": "success"
}
```

---

### Endpoint 4: `GET /api/health`

**Purpose:** Liveness check for the frontend to verify backend and ChromaDB connectivity before enabling the search button.

**Response Body (200 OK):**
```json
{
  "status": "healthy",
  "chromadb": "connected",
  "candidates_indexed": 50,
  "timestamp": "2026-06-22T10:30:00Z"
}
```

---

## 2. Data Schema

### CandidateProfile (Canonical Object)

This is the ground-truth schema for `mock_candidates.json`. Every field marked `required` must be present for all 50 seeded candidates.

```json
{
  "candidate_id": "c001",
  "personal": {
    "full_name": "Arjun Mehta",
    "display_photo_url": "/avatars/c001.png",
    "current_title": "Senior ML Engineer",
    "current_company": "Flipkart",
    "location": "Bengaluru, India",
    "years_experience": 6.5
  },
  "education": [
    {
      "institution": "IIT Bombay",
      "degree": "B.Tech Computer Science",
      "graduation_year": 2018
    }
  ],
  "career_history": [
    {
      "company": "Flipkart",
      "title": "Senior ML Engineer",
      "start_month": "2022-03",
      "end_month": null,
      "tenure_months": 27
    },
    {
      "company": "Swiggy",
      "title": "ML Engineer",
      "start_month": "2020-01",
      "end_month": "2022-02",
      "tenure_months": 25
    },
    {
      "company": "Infosys",
      "title": "Software Engineer",
      "start_month": "2018-07",
      "end_month": "2019-12",
      "tenure_months": 17
    }
  ],
  "skills": ["Python", "PyTorch", "MLflow", "Kubernetes", "SQL", "Spark", "FastAPI"],
  "projects": [
    {
      "title": "Real-time Fraud Detection Pipeline",
      "description": "Built and deployed an ensemble model using XGBoost and LSTM for transaction anomaly detection, reducing false positives by 34% on 50M daily events.",
      "technologies": ["Python", "Kafka", "Kubernetes", "XGBoost"]
    },
    {
      "title": "Recommendation Engine Rewrite",
      "description": "Redesigned collaborative filtering system using two-tower neural architecture, lifting CTR by 12% across 8M users.",
      "technologies": ["PyTorch", "Airflow", "Redis", "Spark"]
    }
  ],
  "behavioral_metadata": {
    "avg_tenure_months": 23.0,
    "num_companies_total": 3,
    "num_companies_last_3yr": 1,
    "promotion_speed_months": 24,
    "title_progression_score": 8.0
  },
  "computed_at_seed": {
    "embedding_model": "all-MiniLM-L6-v2",
    "embedded_text_preview": "Senior ML Engineer Flipkart Python PyTorch MLflow Real-time Fraud Detection..."
  }
}
```

### Field Definitions

| Field | Type | Notes |
|---|---|---|
| `candidate_id` | string | Unique, format `c001`–`c050` |
| `years_experience` | float | Computed from career_history |
| `avg_tenure_months` | float | Mean of all tenure_months values |
| `num_companies_last_3yr` | int | Job hops in last 36 months; key retention signal |
| `promotion_speed_months` | int | Months from first role to first promotion |
| `title_progression_score` | float | 0–10; manually assigned based on seniority ladder |
| `embedded_text_preview` | string | First 100 chars of the text that was embedded (debug field) |

### Embedded Text Construction (at seed time)

The string passed to the embedding model is constructed as:
```python
def build_embed_text(candidate: dict) -> str:
    skills = " ".join(candidate["skills"])
    projects = " ".join([
        f"{p['title']} {p['description']} {' '.join(p['technologies'])}"
        for p in candidate["projects"]
    ])
    return f"{candidate['personal']['current_title']} {skills} {projects}"
```

---

## 3. AI / Vector Pipeline Logic

### Step 1: JD Embedding (Per Search Request)

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_jd(jd_text: str) -> list[float]:
    # Returns a 384-dimensional vector
    return model.encode(jd_text).tolist()
```

**Alternative (if sentence-transformers too heavy):** Use `openai.embeddings.create(model="text-embedding-3-small", input=jd_text)` — 1536-dim, negligible latency, ~$0.00002 per call.

---

### Step 2: ChromaDB Vector Search

```python
import chromadb

client = chromadb.Client()
collection = client.get_collection("candidates")

def vector_search(jd_embedding: list[float], top_n: int) -> dict:
    results = collection.query(
        query_embeddings=[jd_embedding],
        n_results=top_n,
        include=["documents", "metadatas", "distances"]
    )
    return results

# ChromaDB returns cosine distance (0=identical, 2=opposite)
# Convert to similarity score (0–100):
def distance_to_score(distance: float) -> float:
    similarity = 1 - (distance / 2)  # normalize to 0–1
    return round(similarity * 100, 1)
```

---

### Step 3: Career Metadata Score

```python
def compute_career_score(candidate: dict) -> float:
    p = candidate["behavioral_metadata"]
    
    # Sub-signal 1: Years experience (normalized to 0–100, capped at 12 years = 100)
    exp_score = min(candidate["personal"]["years_experience"] / 12.0, 1.0) * 100
    
    # Sub-signal 2: Title progression (already 0–10, scale to 0–100)
    title_score = p["title_progression_score"] * 10
    
    # Sub-signal 3: Tenure stability (avg tenure > 18 months = full marks)
    tenure_score = min(p["avg_tenure_months"] / 18.0, 1.0) * 100
    
    # Weighted average of sub-signals
    career_score = (exp_score * 0.4) + (title_score * 0.35) + (tenure_score * 0.25)
    return round(career_score, 1)
```

---

### Step 4: Behavioral Velocity Score

```python
def compute_velocity_score(candidate: dict) -> float:
    p = candidate["behavioral_metadata"]
    
    # Faster promotion = higher score
    # Ideal: promoted within 12 months. >36 months = low score.
    promo_months = p["promotion_speed_months"]
    if promo_months <= 12:
        promo_score = 100.0
    elif promo_months <= 36:
        promo_score = 100 - ((promo_months - 12) / 24) * 60
    else:
        promo_score = 40.0  # floor
    
    return round(promo_score, 1)
```

---

### Step 5: Composite Score Calculation

```python
def compute_composite(
    semantic: float,
    career: float,
    velocity: float,
    weights: dict
) -> float:
    composite = (
        weights["semantic"] * semantic +
        weights["career"] * career +
        weights["velocity"] * velocity
    )
    return round(composite, 1)
```

---

### Step 6: Retention Risk Calculation

```python
def compute_retention_risk(candidate: dict) -> dict:
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
```

---

### Step 7: LLM Justification Generation

```python
import anthropic

client = anthropic.Anthropic()

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

def generate_justification(candidate: dict, jd_summary: str, scores: dict, rank: int, blind_mode: bool) -> str:
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
    
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",  # Fast + cheap for PoC
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text.strip()
```

**LLM Calls per search:** `top_n` calls to `claude-haiku-4-5-20251001` (one per candidate). For `top_n=10`, this is ~10 parallel async calls. Use `asyncio.gather()` to parallelize.

---

### Step 8: JD Skill Extraction

```python
SKILL_EXTRACT_PROMPT = """Extract the top 6–8 key technical and soft skills required by this job description.
Return ONLY a JSON array of strings. No explanation.
Example: ["Python", "MLOps", "System Design", "SQL", "Communication"]

Job Description: {jd_text}"""

def extract_jd_skills(jd_text: str) -> list[str]:
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=100,
        messages=[{"role": "user", "content": SKILL_EXTRACT_PROMPT.format(jd_text=jd_text[:1000])}]
    )
    import json
    return json.loads(message.content[0].text.strip())
```

---

### Step 9: Radar Chart Data Construction

```python
def build_radar_data(candidate: dict, jd_skills: list[str]) -> list[dict]:
    radar = []
    candidate_skills_lower = {s.lower() for s in candidate["skills"]}
    project_text = " ".join([
        p["description"] + " " + " ".join(p["technologies"])
        for p in candidate["projects"]
    ]).lower()
    
    for skill in jd_skills:
        skill_lower = skill.lower()
        if skill_lower in candidate_skills_lower:
            c_score = 9
        elif skill_lower in project_text:
            c_score = 6
        else:
            c_score = 2  # weak signal
        
        # JD required score is always 8 (normalize all JD skills to equal weight)
        radar.append({
            "skill": skill,
            "candidate_score": c_score,
            "jd_required": 8
        })
    
    return radar
```

---

## 4. 10-Day Solo Sprint Plan

### Guiding Principles
- **Backend first, UI wired same day.** Never let backend and frontend drift more than 1 day apart.
- **Mock data is infrastructure.** Day 1 mock data seeds every downstream task.
- **Demo the full happy path by Day 7.** Days 8–10 are polish + add-ons.

---

### Day 1 — Foundation & Mock Data

**Morning (4h) — Backend:**
- Initialize Antigravity workspace: `backend/` and `frontend/` directories
- Set up `FastAPI` app skeleton with CORS, health endpoint
- Install: `chromadb`, `sentence-transformers`, `anthropic`, `pydantic`, `uvicorn`
- Write `mock_candidates.json` with 15 diverse candidates (enough to demo ranking variance)

**Afternoon (3h) — Backend:**
- Implement `POST /api/seed` endpoint
- Write `embedding_service.py` — build embed text + embed via sentence-transformers
- Seed ChromaDB collection, verify via `GET /api/health`

**Evening (1h) — Frontend:**
- Bootstrap Vite + React + Tailwind project
- Verify dev server runs, proxy `/api` → `localhost:8000`

**Deliverable:** Health endpoint returns `candidates_indexed: 15`. Seeding confirmed.

---

### Day 2 — Core Search Pipeline

**Morning (4h) — Backend:**
- Implement full `POST /api/search` handler (without LLM justification yet)
- Wire: embed JD → vector search → career score → velocity score → composite score → retention risk
- Return mock justification string `"[Justification pending]"` as placeholder

**Afternoon (3h) — Backend:**
- Unit test scoring functions with 3 known candidates
- Verify reranking when `weights` object changes (key demo feature)
- Implement `GET /api/candidates`

**Evening (1h) — Validation:**
- Test all endpoints via curl/Postman
- Confirm response schema matches TRD contract exactly

**Deliverable:** `/api/search` returns ranked JSON with scores. No UI yet.

---

### Day 3 — React Shell + Search Input

**Full day (8h) — Frontend:**
- Build `App.jsx` layout: left panel (input) + right panel (results)
- Build `JobDescriptionInput.jsx` — textarea + character counter + submit button
- Build `ScoringSliders.jsx` — 3 range sliders with live percentage display + sum-to-100 enforcement
- Build `SearchControls.jsx` — Top-N selector + Blind Mode toggle
- Wire `useSearch.js` hook: POST to `/api/search`, manage loading/error/data state

**Deliverable:** Submitting a JD calls the backend and logs the response to console.

---

### Day 4 — Candidate Cards + Score Breakdown

**Full day (8h) — Frontend:**
- Build `CandidateCard.jsx` — rank badge, name, title, composite score
- Build `ScoreBreakdownBar.jsx` — 3-segment horizontal bar using Tailwind widths (no chart library needed)
- Build `RetentionBadge.jsx` — color-coded pill with tooltip on hover
- Build `ResultsList.jsx` — renders array of CandidateCards
- Wire Blind Mode state: conditional rendering of name/institution/avatar

**Deliverable:** Full ranked list renders from real API data. Blind toggle works.

---

### Day 5 — LLM Justification Integration

**Morning (3h) — Backend:**
- Implement `generate_justification()` using Anthropic Haiku
- Implement `extract_jd_skills()` for skill extraction
- Add `asyncio.gather()` to parallelize justification calls
- Return `jd_skills_extracted` and real justification strings in search response

**Afternoon (2h) — Backend:**
- Test justification quality with 3 different JDs
- Add a 3-second timeout guard for LLM calls; fall back to template string if timeout

**Afternoon/Evening (3h) — Frontend:**
- Build `JustificationText.jsx` — display justification with subtle fade-in animation
- Add shimmer loading skeleton while waiting for API response
- Show `jd_skills_extracted` as tags above the results list

**Deliverable:** Full E2E flow working: JD in → ranked cards + AI justification out.

---

### Day 6 — Radar Chart (Gap Analysis)

**Morning (4h) — Backend:**
- Implement `build_radar_data()` using `jd_skills` and candidate profiles
- Include `radar_data` array in each candidate result object
- Expand mock data to 30 candidates (more variance for demo)

**Afternoon (4h) — Frontend:**
- Build `GapRadarChart.jsx` using Recharts `<RadarChart>`
- Configure: JD Required line (blue) + Candidate Score fill (purple, 60% opacity)
- Highlight gap areas (candidate < 6) with amber fill
- Build `CandidateDetailPanel.jsx` — slides open on card click, contains radar + full profile

**Deliverable:** Click a candidate card → radar chart animates in with gap highlighting.

---

### Day 7 — Integration Polish + Full Happy Path

**Full day (8h):**
- Fix all broken wiring between Day 1–6 components
- Add loading states: spinner while API is called, skeleton cards before data arrives
- Add error state: red banner if API fails with error message
- Verify full demo script works end-to-end (90-second script from PRD)
- Expand mock data to 50 candidates
- Tweak scoring so that weight slider changes visibly reorder top 3 candidates

**Deliverable:** Complete, demoable happy path. This is the freeze point for core features.

---

### Day 8 — UI Polish + Design System

**Full day (8h) — Frontend:**
- Apply full design system from `Design.md` (color, typography, spacing)
- Add hover animations on candidate cards (subtle lift + shadow)
- Add animated entrance for results list (staggered fade-in per card)
- Polish header: app logo, tagline, health status indicator
- Add "Export Shortlist" button → downloads results as `shortlist.json`
- Responsive layout fine-tuning (sidebar collapses cleanly)

**Deliverable:** UI looks premium. Screenshots are demo-ready.

---

### Day 9 — Edge Cases + Presentation Prep

**Morning (4h) — Backend + Frontend:**
- Handle edge case: JD < 50 chars → friendly validation error
- Handle edge case: ChromaDB cold start → health check gates search button
- Handle edge case: LLM timeout → fallback justification renders
- Add `search_id` to results panel for traceability

**Afternoon (4h) — Presentation:**
- Write 3-slide judge deck: Problem → Solution → Live Demo
- Record 2-minute backup screen recording in case of live demo failure
- Prepare 3 compelling JD examples for live demo (ML Engineer, Product Manager, Data Analyst)

**Deliverable:** Hardened PoC. Presentation drafted.

---

### Day 10 — Buffer + Final Rehearsal

**Morning (4h):**
- Buffer day: catch up any slipped Day 8–9 tasks
- Final round of UI tweaks based on cold-eyes review
- Verify all 6 acceptance criteria from PRD can be ticked off live

**Afternoon (4h):**
- Full rehearsal of 90-second demo script x3
- Submit all required hackathon deliverables (code repo, deck, video)

---

### Sprint Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| sentence-transformers too slow on local CPU | Medium | Switch to OpenAI embeddings API (1 line change) |
| LLM API rate limit during live demo | Low | Pre-cache justifications for the 3 demo JD examples |
| ChromaDB data loss on restart | Low | `/api/seed` is idempotent; call it in app startup |
| Radar chart rendering bugs in Recharts | Medium | Spike on Day 1 evening; fallback to simple bar chart |
| Weight sliders don't reorder top 3 | Medium | Manually tune mock data on Day 7 to ensure visible variance |
