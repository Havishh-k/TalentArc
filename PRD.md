# PRD.md — Product Requirements Document
## Intelligent Candidate Discovery Engine
### India Runs Hackathon · Solo Sprint · 10-Day PoC

---

## 1. Executive Summary & Hackathon Win Strategy

### What We Are Building
A standalone **AI Sourcing Engine** that ingests a raw job description and returns a ranked, explainable shortlist of candidates in under 3 seconds — with zero manual keyword filtering. The system replaces gut-feel recruiter matching with a transparent, multi-signal scoring pipeline.

### Why This Wins
Hackathon judges evaluate on three axes: **technical depth**, **demonstrable ROI**, and **polish of the live demo**. This PoC is engineered to dominate all three:

| Judge Criterion | Our Signal | Mechanism |
|---|---|---|
| Technical Depth | Semantic vector search + custom scoring matrix | ChromaDB embeddings + weighted Python scorer |
| Demonstrable ROI | Bias reduction + retention risk flagging | Blind Sourcing toggle + Predictive Risk badge |
| Demo Polish | Sub-3s ranked output with AI justification | Pre-seeded mock data + streaming UX |

### Winning Demo Script (90 seconds)
1. Paste a senior ML Engineer JD → hit **"Find Candidates"**
2. Show ranked cards appear with match % and 2-sentence AI justification
3. Toggle **Blind Mode** → show names/photos redact live
4. Open a candidate's **Gap Radar Chart** → explain skill gap visually
5. Point to the **Retention Risk** badge on a top candidate → "This system saves not just sourcing time, but prevents future churn."

---

## 2. Target Persona

**Name:** Priya Nair  
**Title:** Senior Talent Partner / AI-Augmented Recruiter  
**Company:** Mid-to-large Indian tech firm (500–5000 employees)  
**Context:** Priya reviews 80–120 candidate profiles per open role. She spends 40% of her week on manual profile scanning. Her KPIs are time-to-shortlist, offer acceptance rate, and 12-month retention of hired candidates.

### Pain Points
- Manual keyword search misses qualified candidates with non-standard titles
- No visibility into _why_ a candidate ranked above another
- Unconscious bias in early screening skews toward familiar profile patterns
- No signal on whether a shortlisted candidate will leave within 6 months

### What Success Looks Like for Priya
> "I paste a JD, see the top 10 candidates with a clear reason for each, and I'm confident the list isn't biased toward names or institutions I recognize."

---

## 3. Core User Flow

```
[1] INPUT PHASE
    ├── User lands on single-page dashboard
    ├── Pastes or types Job Description into textarea (300–2000 chars)
    └── Optionally uploads candidate pool (JSON) OR uses pre-seeded mock data

[2] CONFIGURATION PHASE
    ├── Scoring Weight Sliders (Semantic Fit / Career Metadata / Behavioral Velocity)
    ├── Blind Sourcing Toggle (ON hides: Name, Photo, Institution, Gender signals)
    └── Result Count Selector (Top 5 / Top 10 / Top 20)

[3] PROCESSING PHASE
    ├── Frontend sends POST /api/search
    ├── Backend embeds JD → queries ChromaDB → retrieves top-N candidates
    ├── Scoring matrix computes composite score
    └── LLM call generates 2-sentence justification per candidate

[4] OUTPUT PHASE
    ├── Ranked Candidate Cards (sorted by composite score descending)
    ├── Per-card: Score breakdown bar, AI justification text, Retention Risk badge
    ├── Click any card → expand Gap Radar Chart
    └── Export shortlist as JSON (one-click)
```

---

## 4. Feature Specifications

---

### Feature 1: Semantic Matching Engine

**Description:** Vector-based search that compares the embedded job description against embedded candidate project histories stored in ChromaDB.

**Acceptance Criteria:**
- [ ] JD text is embedded using `sentence-transformers/all-MiniLM-L6-v2` (or equivalent API call) on every search request
- [ ] Each candidate's `projects` and `skills` fields are pre-embedded and persisted in ChromaDB at data-seed time
- [ ] ChromaDB returns the top-N candidates by cosine similarity
- [ ] Semantic similarity score is normalized to a 0–100 scale and exposed in the API response as `semantic_score`
- [ ] Search completes in under 2 seconds for a pool of 200 mock candidates

**Out of Scope:** Real-time candidate ingestion, LinkedIn scraping, resume PDF parsing.

---

### Feature 2: Multi-Factor Scoring Algorithm

**Description:** A Python scoring matrix that combines three independent signals into a single composite score.

**Signals:**

| Signal | Weight (Default) | Slider Range | Source Field |
|---|---|---|---|
| Semantic Fit | 50% | 20–80% | ChromaDB cosine similarity |
| Career Metadata | 30% | 10–60% | `years_experience`, `title_progression` |
| Behavioral Velocity | 20% | 5–40% | `promotion_speed_months` |

**Composite Score Formula:**
```
composite = (w_semantic × semantic_score)
          + (w_career × career_score)
          + (w_velocity × velocity_score)
```
All weights must sum to 1.0; frontend sliders enforce this constraint.

**Acceptance Criteria:**
- [ ] Each signal produces a normalized 0–100 sub-score
- [ ] Composite score is a float, rounded to 1 decimal, exposed as `composite_score`
- [ ] Changing slider values and re-submitting produces a different ranked order (demonstrable live)
- [ ] Score breakdown (per-signal) is returned in the API response for frontend visualization

---

### Feature 3: Explainable Output UI

**Description:** A React dashboard that renders ranked candidate cards, each with an AI-generated 2-sentence justification.

**Acceptance Criteria:**
- [ ] Candidates are displayed in a scrollable ranked list, sorted by `composite_score` descending
- [ ] Each card displays: Rank number, Candidate name (if Blind Mode OFF), Role title, Composite score as a percentage badge, Score breakdown as a 3-segment horizontal bar, 2-sentence AI justification text
- [ ] Justification is generated by an LLM call (Anthropic API or OpenAI) using a strict prompt template; it must reference the specific JD and specific candidate signals
- [ ] Cards render within 500ms of API response receipt (no skeleton flash beyond that)
- [ ] Clicking a card expands a detail panel with the Gap Radar Chart

---

### Feature 4: Blind Sourcing Toggle

**Description:** A UI toggle that redacts identity-revealing fields to reduce screening bias.

**Fields Redacted When Blind Mode is ON:**
- Candidate full name → replaced with "Candidate #[rank]"
- Profile photo → replaced with a neutral avatar
- University/Institution name → replaced with "Institution [X]"
- Any gender pronouns in justification text (backend must be prompted accordingly)

**Acceptance Criteria:**
- [ ] Toggle is visible above the results list, OFF by default
- [ ] Toggling ON/OFF re-renders the list instantly (no new API call required; purely frontend state)
- [ ] When Blind Mode is ON at search time, the LLM prompt explicitly instructs the model to avoid gendered language in the justification

---

### Feature 5: Automated Gap Analysis Radar Chart

**Description:** A per-candidate radar chart visualizing skill coverage against JD requirements.

**Acceptance Criteria:**
- [ ] JD parsing extracts up to 8 key skill dimensions (e.g., "Python", "MLOps", "Communication", "System Design") — extracted via LLM call at search time
- [ ] Each skill dimension is scored 0–10 for the candidate based on their profile data
- [ ] Chart is rendered using Recharts `<RadarChart>` component
- [ ] Chart renders inside the expanded card detail panel
- [ ] A gap is defined as any dimension where candidate score < 6; gaps are highlighted in amber

---

### Feature 6: Predictive Retention Risk Score

**Description:** A lightweight heuristic model that flags candidates with signals of short tenure risk.

**Risk Signal Formula:**
```python
retention_risk = (
    (1.0 if avg_tenure_months < 14 else 0.0) * 0.40 +
    (1.0 if num_companies_last_3yr > 2 else 0.0) * 0.35 +
    (1.0 if promotion_speed_months > 30 else 0.0) * 0.25
)
# Risk tiers: LOW < 0.35, MEDIUM 0.35–0.65, HIGH > 0.65
```

**Acceptance Criteria:**
- [ ] Retention risk tier (LOW / MEDIUM / HIGH) is computed server-side and included in every candidate response object
- [ ] A color-coded badge is displayed on each candidate card: GREEN (Low), AMBER (Medium), RED (High)
- [ ] Hovering the badge shows a tooltip listing the specific risk signals that triggered the rating

---

## 5. Non-Goals (Explicit Scope Exclusions)

The following are explicitly out of scope for this 10-day PoC. Adding any of these will kill the timeline:

- User authentication / login / JWT sessions
- Email or calendar integrations
- ATS (Applicant Tracking System) sync or webhooks
- Resume PDF upload and parsing
- Real-time candidate data ingestion from external sources
- Multi-user / multi-tenant support
- Mobile responsive layout (desktop-first only)
- Deployment to production infrastructure

---

## 6. Success Metrics (Demo Day)

| Metric | Target |
|---|---|
| Search latency (JD → ranked list) | < 3 seconds (mock data pool of 50) |
| Justification relevance | Judged qualitatively; must reference JD keywords |
| Slider re-rank demonstrability | Changing weights must visibly reorder top 3 candidates |
| Blind Mode functionality | Toggle must redact all 4 identity signals live |
| Radar Chart render | Must appear on card expand with correct gap highlighting |
| Retention badge accuracy | Must reflect underlying data correctly for all 3 tiers |
