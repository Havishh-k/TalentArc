import React from 'react';

function SliderRow({ label, value, onChange, colorClass }) {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm text-text-primary">{label}</label>
        <span className="font-mono text-sm text-text-secondary">[{value.toString().padStart(3, ' ')}%]</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className={`w-full h-1.5 bg-surface-border rounded-lg appearance-none cursor-pointer accent-current ${colorClass}`}
        style={{ color: 'currentColor' }}
      />
    </div>
  );
}

export function ScoringSliders({ weights, onChange }) {
  const sum = weights.semantic + weights.career + weights.velocity + (weights.github_velocity || 0);
  const isTargetSum = sum === 100;

  const handleSemanticChange = (val) => onChange({ ...weights, semantic: val });
  const handleCareerChange = (val) => onChange({ ...weights, career: val });
  const handleVelocityChange = (val) => onChange({ ...weights, velocity: val });
  const handleGithubChange = (val) => onChange({ ...weights, github_velocity: val });

  const applyPreset = (preset) => {
    onChange(preset);
  };

  const presets = [
    { label: "Eng Manager", weights: { semantic: 40, career: 30, velocity: 10, github_velocity: 20 } },
    { label: "Talent Partner", weights: { semantic: 60, career: 20, velocity: 10, github_velocity: 10 } },
    { label: "Founder", weights: { semantic: 20, career: 20, velocity: 40, github_velocity: 20 } },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <div className="h-px bg-surface-border flex-1" />
        <h2 className="font-semibold text-sm uppercase tracking-widest text-text-tertiary whitespace-nowrap">Scoring Weights</h2>
        <div className="h-px bg-surface-border flex-1" />
      </div>

      <div className="flex gap-2 mb-4 justify-between">
        {presets.map((p, idx) => (
          <button 
            key={idx} 
            onClick={() => applyPreset(p.weights)}
            className="text-xs bg-surface-panel border border-surface-border px-2 py-1.5 rounded-md hover:bg-surface-elevated text-text-secondary transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <SliderRow label="Semantic Fit" value={weights.semantic} onChange={handleSemanticChange} colorClass="text-score-semantic" />
      <SliderRow label="Career Metadata" value={weights.career} onChange={handleCareerChange} colorClass="text-score-career" />
      <SliderRow label="Behavioral Velocity" value={weights.velocity} onChange={handleVelocityChange} colorClass="text-score-velocity" />
      <SliderRow label="GitHub Open-Source" value={weights.github_velocity || 0} onChange={handleGithubChange} colorClass="text-brand-glow" />

      <div className={`mt-1 text-right font-mono text-xs ${isTargetSum ? 'text-state-success' : 'text-state-error'}`}>
        Total: {sum}% {isTargetSum ? '✓' : '✗'}
      </div>
    </div>
  );
}
