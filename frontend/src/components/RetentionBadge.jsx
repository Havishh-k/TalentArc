import React from 'react';

const tierConfig = {
  LOW:    { label: 'Low Risk',    color: 'text-risk-low bg-risk-low/10 border-risk-low/20' },
  MEDIUM: { label: 'Med Risk',    color: 'text-risk-medium bg-risk-medium/10 border-risk-medium/20' },
  HIGH:   { label: 'High Risk',   color: 'text-risk-high bg-risk-high/10 border-risk-high/20' },
};

export function RetentionBadge({ tier, signals }) {
  const config = tierConfig[tier] || tierConfig.LOW;

  return (
    <div className="relative group">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${config.color} cursor-help`}>
        <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
        {config.label}
      </span>

      {/* Tooltip on hover */}
      <div className="absolute right-0 top-full mt-1.5 w-56 bg-surface-elevated border border-surface-border rounded-lg p-3 shadow-card invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150 z-10">
        <p className="text-xs font-semibold text-text-primary mb-1.5">Retention Signals</p>
        {!signals || signals.length === 0 ? (
          <p className="text-xs text-text-secondary">No risk signals detected</p>
        ) : (
          signals.map(s => (
            <p key={s} className="text-xs text-risk-medium flex items-center gap-1.5 mb-1 last:mb-0">
              <span className="text-[10px]">⚠</span> {s}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
