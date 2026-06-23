import React from 'react';

export function ScoreBreakdownBar({ scores, weights }) {
  const semanticWeight = weights.semantic || 0;
  const careerWeight = weights.career || 0;
  const velocityWeight = weights.velocity || 0;
  const githubWeight = weights.github_velocity || 0;

  return (
    <div className="mt-4">
      <div className="flex w-full h-2 rounded-full overflow-hidden gap-0.5">
        {semanticWeight > 0 && (
          <div className="h-full bg-surface-bg" style={{ width: `${semanticWeight}%` }}>
            <div className="h-full bg-score-semantic transition-all duration-500" style={{ width: `${scores.semantic_score || 0}%` }} />
          </div>
        )}
        {careerWeight > 0 && (
          <div className="h-full bg-surface-bg" style={{ width: `${careerWeight}%` }}>
            <div className="h-full bg-score-career transition-all duration-500" style={{ width: `${scores.career_score || 0}%` }} />
          </div>
        )}
        {velocityWeight > 0 && (
          <div className="h-full bg-surface-bg" style={{ width: `${velocityWeight}%` }}>
            <div className="h-full bg-score-velocity transition-all duration-500" style={{ width: `${scores.velocity_score || 0}%` }} />
          </div>
        )}
        {githubWeight > 0 && (
          <div className="h-full bg-surface-bg" style={{ width: `${githubWeight}%` }}>
            <div className="h-full bg-brand-glow transition-all duration-500" style={{ width: `${scores.github_velocity_score || 0}%` }} />
          </div>
        )}
      </div>
      <div className="flex w-full gap-0.5 mt-1.5">
        {semanticWeight > 0 && (
          <div style={{ width: `${semanticWeight}%` }} className="text-[10px] text-score-semantic font-mono uppercase tracking-wider truncate">
            Semantic {(scores.semantic_score || 0).toFixed(1)}
          </div>
        )}
        {careerWeight > 0 && (
          <div style={{ width: `${careerWeight}%` }} className="text-[10px] text-score-career font-mono uppercase tracking-wider truncate">
            Career {(scores.career_score || 0).toFixed(1)}
          </div>
        )}
        {velocityWeight > 0 && (
          <div style={{ width: `${velocityWeight}%` }} className="text-[10px] text-score-velocity font-mono uppercase tracking-wider truncate">
            Velocity {(scores.velocity_score || 0).toFixed(1)}
          </div>
        )}
        {githubWeight > 0 && (
          <div style={{ width: `${githubWeight}%` }} className="text-[10px] text-brand-glow font-mono uppercase tracking-wider truncate">
            GitHub {(scores.github_velocity_score || 0).toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
}
