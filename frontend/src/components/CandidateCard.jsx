import React, { useState } from 'react';
import { ScoreBreakdownBar } from './ScoreBreakdownBar';
import { RetentionBadge } from './RetentionBadge';

function BlindAvatar({ rank }) {
  return (
    <div className="w-10 h-10 rounded-full bg-surface-border flex items-center justify-center border border-surface-elevated shrink-0">
      <span className="font-mono text-sm text-text-secondary">#{rank}</span>
    </div>
  );
}



export function CandidateCard({ candidate, weights, blindMode, style, onSelect, className = '' }) {
  const [expanded, setExpanded] = useState(false);

  const displayName = blindMode ? `Candidate #${candidate.rank}` : candidate.display_name;
  const displayInstitution = blindMode 
    ? `Institution ${String.fromCharCode(64 + candidate.rank)}`
    : candidate.display_institution;

  const Avatar = blindMode ? (
    <BlindAvatar rank={candidate.rank} />
  ) : (
    <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30 shrink-0 text-brand-glow font-semibold">
      {displayName.charAt(0)}
    </div>
  );

  return (
    <div 
      style={style}
      onClick={() => setExpanded(!expanded)}
      className={`bg-surface-panel border border-surface-border rounded-xl p-5 transition-all duration-200 cursor-pointer hover:bg-surface-elevated hover:shadow-card-hover hover:-translate-y-0.5 ${className}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-6 h-6 rounded bg-surface-bg border border-surface-border shrink-0">
            <span className="font-mono font-bold text-xs text-text-secondary">#{candidate.rank}</span>
          </div>
          {Avatar}
          <div>
            <h3 className="font-semibold text-[15px] text-text-primary leading-tight">{displayName}</h3>
            <p className="font-normal text-sm text-text-secondary mt-0.5">
              {candidate.display_title} · {displayInstitution}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <RetentionBadge tier={candidate.retention_risk.tier} signals={candidate.retention_risk.signals_triggered} />
          
          <div className="flex flex-col items-end">
            <span className="font-mono font-bold text-2xl text-text-primary leading-none">
              {candidate.composite_score.toFixed(1)}
            </span>
            <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider mt-0.5">
              Match
            </span>
          </div>
        </div>
      </div>

      <ScoreBreakdownBar scores={candidate.score_breakdown} weights={weights} />

      {expanded && (
        <div className="mt-4 pt-4 border-t border-surface-border animate-expand-panel overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-3">AI Justification</h4>
          <p className="font-normal text-sm leading-relaxed text-text-secondary">
            {candidate.justification}
          </p>
          <div className="mt-4 text-right">
            <button 
              onClick={(e) => { e.stopPropagation(); if (onSelect) onSelect(candidate); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded transition-colors"
            >
              View Full Profile &rarr;
            </button>
          </div>
        </div>
      )}
      
      {!expanded && (
        <div className="mt-2 text-right">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">↓ Details</span>
        </div>
      )}
    </div>
  );
}
