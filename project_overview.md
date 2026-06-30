# TalentArc: Complete Feature & Architecture Overview

This document serves as a comprehensive guide to everything currently built into the TalentArc platform, covering both the frontend user experience and the backend engine. Use this document as the master source of truth for the project's current state.

---

## 1. Core Platform Features

### AI Semantic Search Engine
- **Concept:** Instead of keyword matching, users paste an unstructured Job Description. The system converts it into high-dimensional vector embeddings and performs a nearest-neighbor search across the entire candidate database to find candidates conceptually matched to the role.
- **Engine:** ChromaDB (Vector Database) using the lightweight `all-MiniLM-L6-v2` ONNX embedding model for extreme speed and low memory footprint.

### Multi-Pillar Scoring System
Each candidate receives a `Composite Score` out of 100%, driven by 4 distinct pillars that the user can custom-weight via sliders:
1. **Semantic Fit:** The cosine similarity between the candidate's resume/profile and the Job Description.
2. **Career Metadata:** A heuristic score based on years of experience, current job title seniority, and location relevance.
3. **Behavioral Velocity:** Measures career momentum (e.g., promotions, short tenures vs long tenures, rapid skill acquisition).
4. **GitHub Open-Source:** Analyzes open-source contributions, commit velocity, and repository activity for engineering roles.

### Role Presets
Users can instantly configure the scoring weights for specific personas:
- **Eng Manager:** Prioritizes GitHub Open-Source (40%) and Semantic Fit (40%).
- **Talent Partner:** Balanced approach prioritizing Career Metadata (30%) and Semantic Fit (40%).
- **Founder:** High emphasis on Behavioral Velocity (30%) and Semantic Fit (40%).

### Blind Sourcing Mode (Bias Prevention)
A global toggle that instantly redacts Personally Identifiable Information (PII) across the entire platform.
- Replaces names with `Candidate #[Rank]`.
- Replaces university names with `Institution [Letter]`.
- Applies to all UI elements, including the deep-dive drawers.

### Flight Risk / Retention Analysis
- The backend evaluates a candidate's historical tenure data to classify them as `Low`, `Medium`, or `High` flight risk. 
- Displayed as a color-coded chip directly on the candidate card.

### LLM Justification Engine
- **Integration:** Anthropic API (Claude Haiku).
- **Functionality:** For every candidate returned in the search, the LLM generates a concise, 2-sentence justification explaining *exactly* why they are a fit for the role, referencing specific skills and the candidate's composite score.
- **Blind-Mode Aware:** If Blind Mode is on, the LLM strictly uses gender-neutral pronouns (they/their) and avoids mentioning names.

---

## 2. Frontend Architecture (React + Vite)

### UI/UX Design System
- **Framework:** React + Vite + Tailwind CSS.
- **Aesthetics:** Dark mode by default, glassmorphism, smooth CSS transitions (`animate-fade-slide-up`, `animate-expand-panel`).
- **Icons:** `lucide-react` library.

### Key Components
- **`Sidebar.jsx`:** The command center. Contains the Job Description textarea, scoring sliders, presets, and the primary "Analyze Database" CTA.
- **`ResultsList.jsx`:** Maps over the search payload to render candidate cards.
- **`CandidateCard.jsx`:** The primary list item. Shows display name, role, flight risk badge, a visual `ScoreBreakdownBar`, the LLM justification accordion, and the "View Full Profile" button.
- **`CandidateProfileDrawer.jsx`:** A sleek, slide-in overlay from the right side of the screen. Provides a deep-dive into the raw candidate data (Career timeline, Education lists, Project details, Skill chips). It inherently respects the `blindMode` state.
- **`FileUpload.jsx`:** A drag-and-drop zone in the "Manage Pool" tab for importing `.csv` or `.xlsx` candidate rosters directly into the database.

---

## 3. Backend Architecture (FastAPI)

### API Endpoints
- `GET /api/health`: Instant ping to check if the server and ChromaDB are alive.
- `POST /api/search`: The heavy-lifter. Takes the JD and weights, embeds the JD, queries ChromaDB, scores candidates, queries the LLM for justifications in parallel, and returns the sorted payload.
- `POST /api/import`: Accepts file uploads (`.csv` / `.xlsx`), parses them, embeds the profiles, and upserts them into ChromaDB.
- `POST /api/candidates/clone`: Finds candidates similar to a specific target candidate ID.

### Infrastructure & Optimizations
- **OOM Protection:** Explicit environment variables (`OMP_NUM_THREADS=1`) and replacing PyTorch with `onnxruntime` ensures the backend operates safely within the 512MB RAM limit of Render's free tier.
- **Background Seeding:** Auto-seeding of mock data happens in a background thread to prevent Render's 60-second port binding timeouts during cold starts.
- **LLM Caching:** Local deterministic caching (`llm_cache.json`) for LLM justifications to save API costs during duplicate searches.
- **Asynchronous Processing:** Uses `asyncio.gather()` to fetch LLM justifications for all candidates in parallel, drastically reducing latency.

---

## 4. Deployment Pipeline
- **Frontend:** Deployed on Vercel (`vercel.json` configured specifically to target the frontend directory).
- **Backend:** Deployed as a Web Service on Render (`requirements.txt`, `uvicorn` startup command).
