# Product Requirements Document (PRD)

**Project:** TalentArc — Redrob AI "India Runs" Hackathon
**Challenge:** Intelligent Candidate Discovery & Ranking Challenge (Problem Statement 7)
**Version:** 1.0
**Date:** June 30, 2026
**Status:** Draft — pending sign-off

---

## 1. Vision

Build a predictive candidate-ranking system that defeats the "Optimization Trap" — the structural flaw in legacy keyword/embedding-based ATS systems that rewards self-marketing (keyword stuffing, prestige signaling) over genuine competence. TalentArc does this through Concept Decoupling (verifying skill claims against narrative ownership evidence) and Mathematical Career Velocity (chronology-derived, prestige-agnostic progression scoring), wrapped in a compliance layer that proves — not just claims — fairness under India's DPDP Act and MeitY AI Governance Guidelines.

## 2. Stakeholders & Personas

| Stakeholder | Role |
|---|---|
| Om Parab | Engineering Lead — Phase 3 (Mathematical Scoring & Auditor) |
| Farhan Sayed | Phase 2 (Agentic LLM Extraction Engine) |
| Manas Sawant, Divyashree Gudla | Phase 1 (Data Pipeline & Validator) |
| Jayprakash Maurya, Madhura Navele | Phase 4 (Frontend UI & Sandbox) |
| Dr. Geeta Sahu, Dr. Umesh Koyande | Mentors — PRD/TRD sign-off, methodology review |
| Redrob AI judges | External evaluators — Stages 1–5 of the hackathon pipeline |

| Persona | Description | What they need from the system |
|---|---|---|
| Technical Recruiter | End-user of the live demo / sandbox | A ranked shortlist with grounded, specific reasoning they can act on without re-reading 100K profiles |
| Candidate (Data Principal) | Whose profile is being scored | Itemized notice of what's processed and why, even though this dataset is synthetic — the pattern must be real |
| Compliance Auditor | Reviews fairness claims (internally, and effectively the judges at Stage 4/5) | Mathematical proof, not assertion, that prestige/demographic markers don't move a score |

## 3. Problem Statement

Recruiters drown in volume; legacy keyword filters miss genuine fit and reward resume optimization over real competence. The hackathon asks for a system that interprets nuanced job descriptions, sees past surface keywords to contextual relevance, and integrates profile, career, and behavioral-activity signals into a ranked shortlist — without falling into the same keyword-matching trap it's meant to replace.

## 4. Goals & Success Criteria

- `submission.csv` contains exactly 100 uniquely ranked candidates, in the exact column order/format `validate_submission.py` expects, passing it with **zero errors**.
- Honeypot rate in the top 100 stays under the 10% Stage 3 disqualification threshold.
- Every top-100 candidate carries a Counterfactual Twin test result with **Delta < 1e-9** — a mathematical, not asserted, fairness proof.
- A working sandbox (HF Spaces) reproduces ranking on a ≤100-candidate sample within the same 5-minute/CPU-only budget.
- The live demo surfaces the compliance story visibly (Consent Gateway + Audit Dashboard), not just in backend logs.

## 5. Key Features / Deliverables

| Feature | What it does | Why it exists |
|---|---|---|
| Action-Object Decoupling Engine | LLM agent verifies each claimed skill against narrative ownership evidence (verb strength, not just presence) | Directly neutralizes keyword stuffing — the core Optimization Trap |
| Closed-form Career Velocity Calculator | Pure date-arithmetic scoring of promotion cadence, scope expansion, stack recency — no LLM call | Prestige-agnostic; cannot be gamed by adjectives, only by genuine chronology |
| Honeypot Detector | Rule-based flags for schema-detectable impossible profiles (expert proficiency at 0 months, overlapping tenure, salary min > max) | Required to stay under the 10% Stage 3 disqualification threshold |
| Counterfactual Twin Auditor | Re-runs the deterministic scoring functions on prestige/name-swapped twins of each top-100 candidate, asserts score invariance | Mathematical proof of no leakage path, not a claim |
| DPDP Consent Gateway (UI) | Itemized notice + accept/decline gate before the live demo processes a search | Simulates DPDP Section 6 consent pattern for the jury — explicitly *simulated*, see Scope below |
| Explainability Dashboard & Audit Log | `compliance_audit.json` + a rendered dashboard showing pass rate / max delta / sample swaps | Surfaces the proof rather than asserting it in prose |
| Sandbox Demo (HF Spaces) | Small-sample, end-to-end reproduction of the ranking pipeline | Required submission artifact (Section 10.5) |

## 6. Scope Boundaries

| In scope | Out of scope |
|---|---|
| Mathematical proof that masking has no leakage path into deterministic scoring functions | Claiming the LLM agents (Agent A/B/C) are abstractly demographically invariant — not testable this way, and not claimed |
| Simulated DPDP-pattern consent UI for the live demo | Real consent infrastructure, Consent Manager integration, or any claim of literal regulatory compliance — the dataset is synthetic; there is no real Data Principal |
| Skill-taxonomy enrichment via O*NET/ESCO and employer-tier lookup via Crunchbase/YC (static reference tables, no real-person data) | Scraping GitHub Archive (or any source) for real-world data tied to specific candidates — see Risk #3, this candidate pool is synthetic and the action also contradicts our own DPDP research findings |

## 7. Constraints (Hackathon Rules)

| Constraint | Limit |
|---|---|
| Output | Exactly 100 ranked rows, `candidate_id,rank,score,reasoning`, .csv |
| Ranking-step runtime | ≤ 5 min wall-clock |
| Ranking-step memory | ≤ 16 GB RAM |
| Ranking-step compute | CPU only, no GPU |
| Ranking-step network | Off — no hosted LLM/API calls |
| Disk (intermediate) | ≤ 5 GB |
| Honeypot rate, top 100 | ≤ 10% or Stage 3 disqualification |
| Submission attempts | 3 max, last valid one counts |

Pre-computation (Phase 2, network-allowed) is explicitly exempt from the 5-minute/no-network limits per Section 10.3 — only the ranking step itself is constrained.

## 8. Risks (Product-Level)

1. **Funnel coverage gap** — the LLM pre-computation funnel may miss a true top-100 "hidden gem" candidate the JD explicitly wants surfaced, degrading both their score and their reasoning quality.
2. **Overclaiming compliance** — presenting the Consent Gateway or Counterfactual Auditor as literal regulatory compliance rather than a simulated/scoped proof is a credibility risk at Stage 5 if a judge probes the claim.
3. **GitHub Archive scraping plan contradicts our own blueprint** — see TRD §7 for detail; flagged here because it's a product-level legal/credibility risk, not just an engineering one.
4. **API budget** — Phase 2's funnel (3,000–5,000 candidates × 3 agent calls) needs confirmed Anthropic Haiku budget before execution.

## 9. Roadmap (High-Level)

| Phase | Owner(s) | Timeline | Key Output |
|---|---|---|---|
| 1 — Data Pipeline & Compliance Foundation | Manas Sawant, Divyashree Gudla | 2 days | `data/loader.py`, `pii_mask.py`, `honeypot_detector.py`, CI-integrated validator |
| 2 — Agentic LLM Extraction | Farhan Sayed | 3 days | `llm_features.parquet` (funnel-scoped) |
| 3 — Mathematical Scoring & Auditor | Om Parab (Lead) | 3 days | `rank.py`, `compliance/counterfactual_auditor.py`, `submission.csv`, `compliance_audit.json` |
| 4 — Frontend UI & Sandbox | Jayprakash Maurya, Madhura Navele | 4 days | Consent Gateway, Compliance Dashboard, HF Spaces sandbox |

## 10. Go/No-Go Checklist

- [ ] PRD and TRD reviewed and locked by Dr. Sahu and Dr. Koyande
- [ ] `candidate_schema.json` → Pandas/PyArrow dtype mapping finalized and tested
- [ ] `validate_submission.py` passes a dummy CSV
- [ ] Anthropic Haiku budget confirmed for ~5,000 funnel requests (×3 agents)
- [ ] Counterfactual Auditor's 1e-9 tolerance logic unit-tested
- [ ] Dry run of the full Phase 1→3 pipeline on the 50-record `sample_candidates.json` succeeds end-to-end
