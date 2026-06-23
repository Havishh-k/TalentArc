import React from 'react';

export function ScoreBreakdownBar({ scores, weights }) {
  // Normalize the score width by weights so they visually represent the composite sum
  const semanticWidth = (scores.semantic_score / 100) * (weights.semantic || 0);
  const careerWidth = (scores.career_score / 100) * (weights.career || 0);
  const velocityWidth = (scores.velocity_score / 100) * (weights.velocity || 0);
  const githubWidth = ((scores.github_velocity_score || 0) / 100) * (weights.github_velocity || 0);

  return (
    <div className="mt-4">
      <div className="flex w-full h-2 rounded-full overflow-hidden gap-0.5 bg-surface-border/30">
        {semanticWidth > 0 && (
          <div className="bg-score-semantic transition-all duration-500" style={{ width: `${semanticWidth}%` }} />
        )}
        {careerWidth > 0 && (
          <div className="bg-score-career transition-all duration-500" style={{ width: `${careerWidth}%` }} />
        )}
        {velocityWidth > 0 && (
          <div className="bg-score-velocity transition-all duration-500" style={{ width: `${velocityWidth}%` }} />
        )}
        {githubWidth > 0 && (
          <div className="bg-brand-glow transition-all duration-500" style={{ width: `${githubWidth}%` }} />
        )}
      </div>
      <div className="flex w-full gap-0.5 mt-1.5">
        {semanticWidth > 0 && (
          <div style={{ width: `${semanticWidth}%` }} className="text-[10px] text-score-semantic font-mono uppercase tracking-wider truncate">
            Semantic {scores.semantic_score?.toFixed(1)}
          </div>
        )}
        {careerWidth > 0 && (
          <div style={{ width: `${careerWidth}%` }} className="text-[10px] text-score-career font-mono uppercase tracking-wider truncate">
            Career {scores.career_score?.toFixed(1)}
          </div>
        )}
        {velocityWidth > 0 && (
          <div style={{ width: `${velocityWidth}%` }} className="text-[10px] text-score-velocity font-mono uppercase tracking-wider truncate">
            Velocity {scores.velocity_score?.toFixed(1)}
          </div>
        )}
        {githubWidth > 0 && (
          <div style={{ width: `${githubWidth}%` }} className="text-[10px] text-brand-glow font-mono uppercase tracking-wider truncate">
            GitHub {scores.github_velocity_score?.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
}
