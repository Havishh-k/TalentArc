# Technical Requirements Document (TRD)

**Project:** TalentArc — Redrob AI "India Runs" Hackathon
**Version:** 1.0
**Date:** June 30, 2026
**Status:** Draft — pending sign-off

---

## 1. System Architecture

Two execution modes, hard-separated, sharing one codebase:

- **Phase 2 — Offline Pre-computation.** Network allowed, unconstrained runtime. Produces `llm_features.parquet`.
- **Phase 3 — Offline Ranking.** No network, no GPU, ≤5 min, ≤16 GB RAM, ≤5 GB disk. Consumes `candidates.jsonl` + `llm_features.parquet`, produces `submission.csv` + `compliance_audit.json`.

Both modes import the same `talentarc_core/` package. The live FastAPI demo (`app.py`) also imports it, so the sandbox, the live demo, and the graded `rank.py` are provably the same engine — this is the answer to "walk through your architecture" at Stage 5.

```
candidates.jsonl ──► data/loader.py ──► pii_mask.py ──► honeypot_detector.py
                                                              │
                          ┌───────────────────────────────────┘
                          ▼
            [Phase 2, offline, network-on]          [Phase 3, offline, network-off]
            llm/agents.py (A/B/C, Claude)            scoring/career_velocity.py
                          │                            scoring/composite.py
                          ▼                                      │
              llm_features.parquet ───────────────────────────────┤
                                                                   ▼
                                              counterfactual_auditor.py
                                                                   │
                                          ┌────────────────────────┴───────────────┐
                                          ▼                                        ▼
                                  submission.csv                      compliance_audit.json
```

## 2. Module / Phase Breakdown

| Phase | Modules | Owner | Timeline | Blocker |
|---|---|---|---|---|
| 1 — Foundation | `data/loader.py`, `compliance/pii_mask.py`, `compliance/honeypot_detector.py` | Manas Sawant, Divyashree Gudla | 2 days | `candidate_schema.json` → Pandas/PyArrow dtype mapping must be locked before ingestion logic is written |
| 2 — LLM Extraction | `llm/agents.py` (Agent A/B/C), checkpointed caching with `tenacity` | Farhan Sayed | 3 days | API budget/rate limits confirmed before running the 3,000–5,000 candidate funnel |
| 3 — Scoring & Auditor | `scoring/career_velocity.py`, `scoring/composite.py`, `compliance/counterfactual_auditor.py`, `rank.py` | Om Parab (Lead) | 3 days | Phase 1 and 2 outputs must be stable before combiner logic can be tested |
| 4 — Frontend & Sandbox | `ConsentGateway.jsx`, `ComplianceDashboard.jsx`, HF Spaces wrapper | Jayprakash Maurya, Madhura Navele | 4 days | `compliance_audit.json` structure must be finalized before the dashboard can render it |

## 3. Data Schemas

### 3.1 `candidate_schema.json` → Pandas/PyArrow Mapping

| JSON field | Pandas dtype | Notes |
|---|---|---|
| `candidate_id` | `category` | Fixed `CAND_XXXXXXX` pattern |
| `profile.years_of_experience` | `float32` | |
| `profile.current_company_size`, `education.tier` | `category` | Fixed enum — masked before embedding |
| `career_history` | exploded long-format rows (see below) | One row per role, not nested-in-cell |
| `redrob_signals.*` | mixed (`bool`, `float32`, `int32`) | All 23 fields are schema-required — see §6 note on imputation |

### 3.2 `llm_features.parquet` — Exploded Long Format

Confirmed shape: `candidate_id, skill_name, action_verb, verified_boolean, verb_strength_score`.

| Column | dtype | Notes |
|---|---|---|
| `candidate_id` | `category` | |
| `skill_name` | `category` | |
| `action_verb` | `category` | |
| `verified_boolean` | `bool` | |
| `verb_strength_score` | `float32` | 0.0–1.0 |

Categorical dtypes on the three string columns are what bring this from a naive ~150–200 MB raw-string estimate down to ~60 MB at full-funnel scale. Same schema applies whether the row came from Agent A (LLM, funnel-scoped) or the spaCy fallback (full 100K) — uniform join logic in `rank.py` regardless of source.

### 3.3 `compliance_audit.json`

```json
{
  "methodology": "Tests for prestige/name leakage in masked scoring functions; LLM-derived features are cache-frozen and never re-queried during audit.",
  "scope": "top_100",
  "tolerance": 1e-9,
  "summary": { "candidates_tested": 100, "pass": 100, "fail": 0, "max_observed_delta": 0.0 },
  "results": [
    { "candidate_id": "CAND_0042871", "rank": 1, "fields_swapped": ["anonymized_name", "current_company", "institution", "education.tier"], "twins_tested": 4, "max_delta": 0.0, "pass": true }
  ]
}
```

### 3.4 `submission.csv`

`candidate_id,rank,score,reasoning` — exactly 100 data rows, rank 1–100 each exactly once, score non-increasing by rank, ties broken by `candidate_id` ascending. Validated by `validate_submission.py` as a CI gate before every submission attempt.

## 4. Tech Stack & Dependencies

| Library | Purpose | Phase |
|---|---|---|
| FastAPI, React/Vite | Live demo + sandbox UI | 4 |
| ChromaDB (embedded/persistent mode), `onnxruntime` + `all-MiniLM-L6-v2` | Local, offline semantic similarity — no server process | 3 |
| `anthropic` SDK (Haiku) | Agent A/B/C calls — **importable only in Phase 2 code paths** | 2 |
| `pandas`, `pyarrow` | Feature cache, vectorized 100K-row scoring | 1, 3 |
| `spaCy` (`en_core_web_sm`) | Local fallback verb-object parsing for funnel misses | 3 |
| `jsonschema` | Validate ingestion against `candidate_schema.json` | 1 |
| `tenacity` | Backoff/retry for Claude rate limits during precompute | 2 |
| `pytest` | Unit tests against `sample_candidates.json` | 1–3 |

No Celery/Redis — pre-computation is a one-shot checkpointed script, not a recurring queue.

## 5. Constraint Mapping

| Hackathon constraint | How satisfied | Verified by |
|---|---|---|
| ≤5 min ranking runtime | All Phase 3 ops are vectorized pandas/numpy + local ONNX embedding; no LLM calls in this path | Local timed dry run + 3× independent smoke test |
| ≤16 GB RAM | Categorical parquet dtypes, streaming JSONL ingestion (never load full 465 MB at once) | Memory profiling during dry run |
| CPU only / no GPU | No GPU dependency anywhere in `rank.py`'s import graph | Code review |
| No network during ranking | `anthropic` SDK and any `requests`/`httpx` calls scoped only to Phase 2 modules; CI asserts no socket opens during a `rank.py` test run | Automated CI check |
| ≤5 GB disk | `llm_features.parquet` (~60–100 MB) + embeddings well under budget | Disk usage check in CI |
| Honeypot rate ≤10% in top 100 | `honeypot_detector.py` runs before scoring; flagged candidates excluded or penalized (open item — see PRD Clarifying Q3 from prior review) | Audit log + Stage 3 reproduction |

## 6. Data Formats & Preprocessing Standards

- **Ingestion:** `.jsonl`, streamed — never load the full 465 MB payload into memory at once.
- **Feature cache:** `.parquet`, categorical dtypes on `candidate_id`/`skill_name`/`action_verb`.
- **PII masking:** runs immediately on load, stripping `institution`, `current_company`, `education.tier` before any embedding or LLM call.
- **Honeypot pruning:** flags impossible combinations and removes them from the active scoring dataframe before composite scoring runs.

**Imputation note — flagging an inconsistency to resolve before Phase 1 sign-off:** the sprint plan calls for filling missing `github_activity_score` with `0.0`. Per `candidate_schema.json`, this field already uses an explicit sentinel (`-1` = no GitHub linked) and is a *required* field within `redrob_signals` — so a genuinely null value in valid data shouldn't occur at all; if it does, that's a schema violation, not ordinary missingness. Recommend: validate all 23 `redrob_signals` fields via `jsonschema` in `loader.py` first, and treat any record with a truly missing required field as a candidate for honeypot/malformed-row quarantine rather than silently imputing `0.0` (which would conflate "linked GitHub, zero activity" with "no GitHub" — exactly the kind of subtle inconsistency the honeypot detector is designed to catch). The `last_active_date` heavy-penalty-default approach is fine to keep as a defensive fallback, with the same reframing: it's a guard against malformed input, not expected behavior.

## 7. External Data Sources & Integration

| Source | Purpose | License/DPDP note | Integration point | Risk flag |
|---|---|---|---|---|
| O*NET / ESCO | Skill-adjacency ontology (e.g., "Pandas" → "Data Architecture") | CC-BY, government-backed — generic taxonomy, not tied to any real person | Static lookup during Phase 2 skill mapping | None |
| Crunchbase Open Data / YC Directory | Employer-tier classification (Enterprise/Series A/Bootstrapped) | Static company-level reference data, not personal data | `data/loader.py` lookup table, appends `employer_tier` | None |
| GitHub Archive (public commits) | Proposed to augment `github_activity_score` | — | — | **Recommend dropping.** Two independent problems: (1) the candidate pool is synthetic/anonymized per the dataset's own README ("simulated platform activity") — there is no real GitHub identity to look up for a synthetic candidate, so the integration doesn't have a valid target; (2) our own Strategic Blueprint research explicitly concluded that the Section 3(c)(ii) "publicly available data" exemption is fragile and does **not** cover scraping/aggregating public data for algorithmic profiling — it isn't a blanket pass. Relying on it here directly contradicts that finding. `redrob_signals.github_activity_score` is already provided in the dataset and is sufficient; no external scrape is needed or defensible. |

## 8. `talentarc_core/` Structure

```
talentarc_core/
  data/loader.py
  compliance/pii_mask.py
  compliance/honeypot_detector.py
  compliance/counterfactual_auditor.py
  scoring/career_velocity.py
  scoring/composite.py
  llm/agents.py            # Agent A/B/C, Phase 2 only
rank.py                    # CLI entrypoint, Phase 3
precompute.py               # CLI entrypoint, Phase 2
app.py                      # FastAPI live demo, imports talentarc_core
frontend/ConsentGateway.jsx
frontend/ComplianceDashboard.jsx
```

## 9. Testing & Validation Plan

- Unit tests for loader, masking, honeypot detector, and the Counterfactual Auditor's 1e-9 tolerance assertion — all run against `sample_candidates.json` before scaling to 100K.
- `validate_submission.py` wired into CI as a hard gate before any submission attempt.
- Full dry run of Phase 1 → 3 on the 50-record sample to confirm end-to-end connectivity.
- 3× independent timed smoke test of `rank.py` on the full 100K pool, ideally on different machines, to confirm runtime/memory margin before consuming a real submission slot.

## 10. Risks & Mitigations (Technical)

| Risk | Mitigation |
|---|---|
| Funnel misses a true top-100 candidate | Bias the funnel toward recall (3,000–5,000 candidates, multiple independent filter paths); treat any fallback-reasoning hit in testing as a signal to widen, not a steady state |
| Accidental network call leaks into `rank.py`'s path | CI assertion that no socket opens during a `rank.py` test run |
| GitHub Archive scrape (see §7) undermines compliance credibility | Drop the integration; rely on the dataset's existing `github_activity_score` |
| `github_activity_score`/`last_active_date` imputation conflates malformed data with real signal | Validate required fields via `jsonschema` first; route true nulls to honeypot quarantine, not silent fill |
