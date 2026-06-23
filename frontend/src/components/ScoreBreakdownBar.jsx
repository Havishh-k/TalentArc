import React from 'react';

export function ScoreBreakdownBar({ scores, weights }) {
  // Normalize the score width by weights so they visually represent the composite sum
  const semanticWidth = (scores.semantic_score / 100) * weights.semantic * 100;
  const careerWidth = (scores.career_score / 100) * weights.career * 100;
  const velocityWidth = (scores.velocity_score / 100) * weights.velocity * 100;

  return (
    <div className="mt-4">
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-surface-bg">
        <div
          className="bg-score-semantic rounded-l-full transition-all duration-500"
          style={{ width: `${semanticWidth}%` }}
        />
        <div
          className="bg-score-career transition-all duration-500"
          style={{ width: `${careerWidth}%` }}
        />
        <div
          className="bg-score-velocity rounded-r-full transition-all duration-500"
          style={{ width: `${velocityWidth}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-score-semantic font-mono uppercase tracking-wider">Semantic {scores.semantic_score.toFixed(1)}</span>
        <span className="text-[10px] text-score-career font-mono uppercase tracking-wider">Career {scores.career_score.toFixed(1)}</span>
        <span className="text-[10px] text-score-velocity font-mono uppercase tracking-wider">Velocity {scores.velocity_score.toFixed(1)}</span>
      </div>
    </div>
  );
}
