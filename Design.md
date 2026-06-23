# Design.md — UI/UX & Design System
## Intelligent Candidate Discovery Engine
### India Runs Hackathon · Solo Sprint · 10-Day PoC

---

## 1. Visual Identity

### Design Direction
The visual language is **Precision Intelligence** — the aesthetic of a high-stakes analytical instrument, not a consumer app. Think Bloomberg Terminal meets Figma: dark substrate with surgical accent colors, data-dense but never cluttered. Every visual element should signal that the AI is *working* — scores are not guesses, they are computed outputs.

The signature element is the **Score Breakdown Bar**: a 3-segment horizontal bar showing Semantic / Career / Velocity as distinct colored fills inside a single container. This bar appears on every candidate card and is the visual fingerprint of the product.

---

### Color Palette

```css
/* tailwind.config.js — extend colors */
colors: {
  surface: {
    bg:       '#0F1117',   /* App background — near-black, not pure black */
    panel:    '#1A1D27',   /* Card / sidebar backgrounds */
    elevated: '#22263A',   /* Hovered cards, open panels */
    border:   '#2E3250',   /* Subtle dividers */
  },
  brand: {
    primary:  '#6C63FF',   /* Indigo-violet — primary CTA, rank badges */
    glow:     '#8B85FF',   /* Lighter tint for hover states */
  },
  score: {
    semantic: '#6C63FF',   /* Indigo — Semantic Fit segment */
    career:   '#3ECFCF',   /* Cyan — Career Metadata segment */
    velocity: '#A78BFA',   /* Violet — Behavioral Velocity segment */
  },
  risk: {
    low:      '#22C55E',   /* Green */
    medium:   '#F59E0B',   /* Amber */
    high:     '#EF4444',   /* Red */
  },
  gap: {
    fill:     '#F59E0B',   /* Amber fill for radar chart gap areas */
  },
  text: {
    primary:  '#F1F5F9',   /* Near-white headings */
    secondary:'#94A3B8',   /* Muted body text, labels */
    tertiary: '#475569',   /* Disabled states, placeholders */
  },
  state: {
    success:  '#22C55E',
    warning:  '#F59E0B',
    error:    '#EF4444',
  }
}
```

---

### Typography

```css
/* Import in index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

| Role | Font | Weight | Size | Tailwind Class |
|---|---|---|---|---|
| App title | Inter | 700 | 20px | `font-bold text-xl tracking-tight` |
| Section label | Inter | 600 | 13px | `font-semibold text-sm uppercase tracking-widest` |
| Candidate name | Inter | 600 | 15px | `font-semibold text-[15px]` |
| Candidate title | Inter | 400 | 13px | `font-normal text-sm text-text-secondary` |
| AI Justification | Inter | 400 | 13px | `font-normal text-sm leading-relaxed text-text-secondary` |
| Score number | JetBrains Mono | 500 | 20px | `font-mono font-medium text-xl` |
| Score label | Inter | 500 | 11px | `font-medium text-[11px] uppercase tracking-wider` |
| Rank number | JetBrains Mono | 700 | 14px | `font-mono font-bold text-sm` |
| Slider value | JetBrains Mono | 500 | 13px | `font-mono text-sm` |
| Button | Inter | 600 | 14px | `font-semibold text-sm` |

---

### Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{jsx,js,ts,tsx}"],
  theme: {
    extend: {
      colors: { /* paste palette above */ },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 0 0 1px rgba(108, 99, 255, 0.0), 0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 0 0 1px rgba(108, 99, 255, 0.3), 0 8px 32px rgba(108, 99, 255, 0.12)',
        'glow-sm': '0 0 12px rgba(108, 99, 255, 0.25)',
      },
      keyframes: {
        'fade-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        'expand-panel': {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '600px', opacity: '1' },
        }
      },
      animation: {
        'fade-slide-up': 'fade-slide-up 0.3s ease-out forwards',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        'expand-panel': 'expand-panel 0.35s cubic-bezier(0.4,0,0.2,1) forwards',
      },
    },
  },
  plugins: [],
}
```

---

## 2. Key Views — Layout Descriptions

---

### View 1: Application Shell

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                             │
│  ◈ CandidateIQ  [tagline: AI-Powered Talent Signal Engine]  ● Live  │
│  bg-surface-bg  border-b border-surface-border                      │
├──────────────────────────┬──────────────────────────────────────────┤
│                          │                                          │
│   SEARCH PANEL           │   RESULTS PANEL                         │
│   (fixed left, 380px)    │   (flex-1, scrollable)                  │
│                          │                                          │
│   bg-surface-panel       │   bg-surface-bg                         │
│   border-r               │                                          │
│   border-surface-border  │                                          │
│                          │                                          │
│                          │                                          │
└──────────────────────────┴──────────────────────────────────────────┘

Tailwind layout:
<div className="min-h-screen bg-surface-bg text-text-primary">
  <Header />
  <div className="flex h-[calc(100vh-56px)]">
    <SearchPanel className="w-[380px] flex-shrink-0 border-r border-surface-border overflow-y-auto" />
    <ResultsPanel className="flex-1 overflow-y-auto p-6" />
  </div>
</div>
```

---

### View 2: Search Panel (Left Column)

```
┌────────────────────────────────────┐
│                                    │
│  JOB DESCRIPTION                   │  ← section label (uppercase, text-tertiary)
│  ┌──────────────────────────────┐  │
│  │ Paste or type your job       │  │  ← textarea, min-h-[160px]
│  │ description here...          │  │     bg-surface-bg, border border-surface-border
│  │                              │  │     focus:border-brand-primary focus:ring-1
│  │                              │  │     font-mono text-sm
│  └──────────────────────────────┘  │
│  342 / 2000 characters             │  ← right-aligned, text-tertiary text-xs
│                                    │
│  ── SCORING WEIGHTS ────────────── │  ← divider + label
│                                    │
│  Semantic Fit          [  50%  ]   │  ← SliderRow
│  ████████████░░░░░░░░              │     label left, mono value right
│                                    │     track: bg-surface-border
│  Career Metadata       [  30%  ]   │     thumb: bg-brand-primary
│  ████████░░░░░░░░░░░░              │
│                                    │
│  Behavioral Velocity   [  20%  ]   │
│  █████░░░░░░░░░░░░░░░              │
│                                    │
│  Total: 100% ✓                     │  ← WeightSumIndicator
│                                    │     text-state-success if sum=100
│                                    │     text-state-error if sum≠100
│  ── FILTERS ──────────────────── ──│
│                                    │
│  Results  ○ 5   ● 10   ○ 20       │  ← TopNSelector (radio buttons)
│                                    │
│  Blind Sourcing Mode               │
│  Reduce screening bias    [●  OFF] │  ← BlindModeToggle
│                                    │
│  ┌──────────────────────────────┐  │
│  │   ◈  Find Candidates         │  │  ← SearchButton
│  └──────────────────────────────┘  │     bg-brand-primary, rounded-lg
│                                    │     hover:bg-brand-glow
│                                    │     disabled:opacity-40
└────────────────────────────────────┘
```

**SearchButton States:**
```jsx
// IDLE
<button className="w-full bg-brand-primary hover:bg-brand-glow text-white 
  font-semibold py-3 rounded-lg transition-all duration-200 
  flex items-center justify-center gap-2 shadow-glow-sm hover:shadow-card-hover">
  <SparkleIcon /> Find Candidates
</button>

// LOADING
<button disabled className="w-full bg-brand-primary opacity-75 
  text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2">
  <SpinnerIcon className="animate-spin" /> Analyzing...
</button>

// DISABLED (weights ≠ 100)
<button disabled className="w-full bg-surface-border text-text-tertiary 
  font-semibold py-3 rounded-lg cursor-not-allowed">
  Weights must equal 100%
</button>
```

---

### View 3: Results Panel — Header Bar

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Showing 10 of 50 candidates   Scanned in 1.2s    [↓ Export]    │
│                                                                  │
│  Skills detected:                                                │
│  [Python] [MLOps] [System Design] [SQL] [FastAPI] [Spark]       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

JdSkillTags:
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full 
  text-xs font-medium bg-brand-primary/10 text-brand-glow 
  border border-brand-primary/20">
  {skill}
</span>
```

---

### View 4: Candidate Card (Collapsed)

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  #1   [avatar]  Arjun Mehta               87.4  ◉ LOW RISK       │
│                 Senior ML Engineer                                  │
│                 Flipkart · IIT Bombay                              │
│                                                                    │
│  Score Breakdown                                                   │
│  [████████████████████████  ][████████████  ][██████  ]          │
│   Semantic 91.2              Career 82.0      Velocity 78.5       │
│                                                                    │
│  Arjun's real-time fraud detection pipeline at Flipkart directly  │
│  aligns with the MLOps and distributed systems requirements in     │
│  this JD. With 6+ years of production ML experience, this        │
│  candidate's trajectory scores in the top decile for this role.   │
│                                                          ↓ Details │
└────────────────────────────────────────────────────────────────────┘

Card Tailwind classes:
bg-surface-panel border border-surface-border rounded-xl p-5
transition-all duration-200 cursor-pointer
hover:bg-surface-elevated hover:shadow-card-hover hover:-translate-y-0.5
animate-fade-slide-up
```

**Staggered entrance animation (ResultsList.jsx):**
```jsx
results.map((candidate, i) => (
  <CandidateCard
    key={candidate.candidate_id}
    candidate={candidate}
    style={{ animationDelay: `${i * 60}ms` }}
    className="opacity-0 animate-fade-slide-up"
  />
))
```

**Score Breakdown Bar (ScoreBreakdownBar.jsx):**
```jsx
<div className="flex h-2 rounded-full overflow-hidden gap-0.5">
  <div
    className="bg-score-semantic rounded-l-full"
    style={{ width: `${(semanticScore / 100) * weights.semantic * 100}%` }}
  />
  <div
    className="bg-score-career"
    style={{ width: `${(careerScore / 100) * weights.career * 100}%` }}
  />
  <div
    className="bg-score-velocity rounded-r-full"
    style={{ width: `${(velocityScore / 100) * weights.velocity * 100}%` }}
  />
</div>
<div className="flex justify-between mt-1.5">
  <span className="text-[10px] text-score-semantic font-mono">Semantic {semanticScore}</span>
  <span className="text-[10px] text-score-career font-mono">Career {careerScore}</span>
  <span className="text-[10px] text-score-velocity font-mono">Velocity {velocityScore}</span>
</div>
```

---

### View 5: Candidate Card (Expanded — Detail Panel)

```
┌────────────────────────────────────────────────────────────────────┐
│  [collapsed card content above — same as View 4]                  │
│                                                                    │
│  ── SKILL GAP ANALYSIS ─────────────────────────────────────────  │
│                                                                    │
│                      Python ●                                      │
│           System Design ●        ● MLOps                          │
│                                                                    │
│         Communication ●      ● SQL                                │
│                                                                    │
│              FastAPI ●          ● Spark                           │
│                                                                    │
│           [Candidate fill] vs [JD Required outline]               │
│           ⚠ Gaps: MLOps (7 vs 9), Communication (5 vs 8)         │
│                                                                    │
│  ── PROFILE METADATA ───────────────────────────────────────────  │
│  Avg Tenure   Promotions   Companies (3yr)   Progression          │
│  23 months    2             1                 ████████ 8/10        │
└────────────────────────────────────────────────────────────────────┘
```

**GapRadarChart.jsx (Recharts config):**
```jsx
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={260}>
  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
    <PolarGrid stroke="#2E3250" />
    <PolarAngleAxis
      dataKey="skill"
      tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'Inter' }}
    />
    <Radar
      name="JD Required"
      dataKey="jd_required"
      stroke="#6C63FF"
      fill="none"
      strokeWidth={1.5}
      strokeDasharray="4 2"
    />
    <Radar
      name="Candidate"
      dataKey="candidate_score"
      stroke="#3ECFCF"
      fill="#3ECFCF"
      fillOpacity={0.18}
      strokeWidth={2}
    />
  </RadarChart>
</ResponsiveContainer>
```

**Gap highlighting logic:**
```jsx
// Inside GapRadarChart, compute gaps:
const gaps = radarData.filter(d => d.candidate_score < d.jd_required - 2)
// Render gap warning below chart
{gaps.length > 0 && (
  <div className="flex items-center gap-2 mt-3 text-xs text-gap-fill">
    <WarningIcon className="w-3.5 h-3.5" />
    <span>Gap areas: {gaps.map(g => `${g.skill} (${g.candidate_score} vs ${g.jd_required})`).join(', ')}</span>
  </div>
)}
```

---

### View 6: Retention Risk Badge

```jsx
// RetentionBadge.jsx
const tierConfig = {
  LOW:    { label: 'Low Risk',    color: 'text-risk-low    bg-risk-low/10    border-risk-low/20' },
  MEDIUM: { label: 'Med Risk',    color: 'text-risk-medium bg-risk-medium/10 border-risk-medium/20' },
  HIGH:   { label: 'High Risk',   color: 'text-risk-high   bg-risk-high/10   border-risk-high/20' },
}

<div className="relative group">
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full 
    text-[11px] font-semibold border ${tierConfig[tier].color}`}>
    <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
    {tierConfig[tier].label}
  </span>

  {/* Tooltip on hover */}
  <div className="absolute right-0 top-full mt-1.5 w-56 bg-surface-elevated 
    border border-surface-border rounded-lg p-3 shadow-card
    invisible group-hover:visible opacity-0 group-hover:opacity-100
    transition-all duration-150 z-10">
    <p className="text-xs font-semibold text-text-primary mb-1.5">Retention Signals</p>
    {signals.length === 0
      ? <p className="text-xs text-text-secondary">No risk signals detected</p>
      : signals.map(s => (
          <p key={s} className="text-xs text-risk-medium flex items-center gap-1.5">
            <span>⚠</span> {s}
          </p>
        ))
    }
  </div>
</div>
```

---

### View 7: Blind Mode Toggle

```jsx
// BlindModeToggle.jsx
<div className="flex items-center justify-between py-3">
  <div>
    <p className="text-sm font-medium text-text-primary">Blind Sourcing Mode</p>
    <p className="text-xs text-text-secondary mt-0.5">Redacts names, photos, institutions</p>
  </div>
  <button
    onClick={() => setBlindMode(!blindMode)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full 
      transition-colors duration-200 focus:outline-none focus:ring-2 
      focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-surface-panel
      ${blindMode ? 'bg-brand-primary' : 'bg-surface-border'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white 
      shadow-sm transition-transform duration-200
      ${blindMode ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
</div>
```

**Blind Mode masking (CandidateIdentity.jsx):**
```jsx
const displayName = blindMode ? `Candidate #${rank}` : candidate.personal.full_name
const displayInstitution = blindMode
  ? `Institution ${String.fromCharCode(64 + rank)}`  // "Institution A", "Institution B"...
  : candidate.education[0]?.institution

const AvatarComponent = blindMode
  ? <BlindAvatar rank={rank} />   // Neutral geometric shape
  : <img src={candidate.personal.display_photo_url} />
```

---

## 3. Interaction States

### Loading State — Skeleton Cards

```jsx
// LoadingSkeleton.jsx — renders 3 placeholder cards while API responds
const SkeletonCard = () => (
  <div className="bg-surface-panel border border-surface-border rounded-xl p-5 
    overflow-hidden relative">
    {/* Shimmer overlay */}
    <div className="absolute inset-0 bg-gradient-to-r 
      from-transparent via-surface-elevated/40 to-transparent
      animate-shimmer bg-[length:400px_100%]" />
    
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-surface-border" />
      <div className="flex-1">
        <div className="h-3.5 bg-surface-border rounded w-36 mb-2" />
        <div className="h-3 bg-surface-border rounded w-24" />
      </div>
      <div className="w-14 h-8 bg-surface-border rounded-lg" />
    </div>
    <div className="h-2 bg-surface-border rounded w-full mb-4" />
    <div className="h-3 bg-surface-border rounded w-full mb-2" />
    <div className="h-3 bg-surface-border rounded w-4/5" />
  </div>
)
```

### Error State

```jsx
<div className="flex items-start gap-3 p-4 rounded-xl 
  bg-state-error/10 border border-state-error/20">
  <ErrorIcon className="w-5 h-5 text-state-error flex-shrink-0 mt-0.5" />
  <div>
    <p className="text-sm font-semibold text-state-error">Search failed</p>
    <p className="text-xs text-text-secondary mt-0.5">{error.message}</p>
    <button onClick={retry} className="text-xs text-brand-primary hover:underline mt-2">
      Try again
    </button>
  </div>
</div>
```

### Empty State (No Results)

```jsx
<div className="flex flex-col items-center justify-center h-64 text-center">
  <SearchIcon className="w-12 h-12 text-text-tertiary mb-4" />
  <p className="text-base font-semibold text-text-secondary">No candidates found</p>
  <p className="text-sm text-text-tertiary mt-1 max-w-xs">
    Try broadening your job description or adjusting the scoring weights.
  </p>
</div>
```

### Health Status Dot (Header)

```jsx
const HealthStatusDot = ({ status }) => {
  const isHealthy = status === 'healthy'
  return (
    <div className="flex items-center gap-1.5">
      <span className={`relative flex h-2 w-2`}>
        {isHealthy && (
          <span className="animate-ping absolute inline-flex h-full w-full 
            rounded-full bg-risk-low opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 
          ${isHealthy ? 'bg-risk-low' : 'bg-risk-high'}`} />
      </span>
      <span className="text-xs text-text-tertiary font-mono">
        {isHealthy ? 'Live' : 'Offline'}
      </span>
    </div>
  )
}
```

### Composite Score Badge

```jsx
// CompositeScoreBadge.jsx
// The score font is monospace to avoid layout shift as numbers change
<div className="flex flex-col items-end">
  <span className="font-mono font-bold text-2xl text-text-primary leading-none">
    {score.toFixed(1)}
  </span>
  <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider mt-0.5">
    Match
  </span>
</div>
```

---

## 4. Responsive Behavior

This PoC targets desktop-only (min-width: 1024px). The two-column layout is fixed. Do not spend time on mobile breakpoints.

However, apply these minimum safeguards:
```css
/* Prevent horizontal overflow on narrower laptops (1024px) */
@media (max-width: 1280px) {
  .search-panel { width: 320px; }
}
```

---

## 5. Demo-Day Checklist: Visual Polish

Before submitting, verify these visual items are complete:

- [ ] Dark background renders correctly (no flash of white on page load)
- [ ] Score Breakdown Bar segments are visually distinct colors at all weight values
- [ ] Staggered card entrance animation plays on every new search result
- [ ] Blind Mode toggle animates smoothly (no jump)
- [ ] Radar Chart gap areas render in amber
- [ ] Retention badges show correct colors for all 3 tiers
- [ ] Loading skeleton appears within 100ms of search submit
- [ ] Health dot pulses green when backend is running
- [ ] Hover on any card shows subtle lift + border glow
- [ ] JD skill pills render above results list with correct brand tint
