import React from 'react';

export function SkipReasonsList({ skipReasons }) {
  if (!skipReasons || skipReasons.length === 0) return null;

  return (
    <div className="mt-6 border border-state-warning/30 rounded-md overflow-hidden">
      <div className="bg-state-warning/10 px-4 py-3 border-b border-state-warning/30">
        <h3 className="text-sm font-medium text-state-warning">
          Skipped Rows ({skipReasons.length})
        </h3>
        <p className="mt-1 text-xs text-text-secondary">
          The following rows were omitted from the import due to missing or invalid data.
        </p>
      </div>
      <div className="bg-surface-elevated max-h-60 overflow-y-auto">
        <ul className="divide-y divide-surface-border">
          {skipReasons.map((skip, idx) => (
            <li key={idx} className="px-4 py-3 flex text-sm">
              <span className="font-mono text-text-secondary w-20 flex-shrink-0">Row {skip.row}</span>
              <span className="font-medium text-text-primary w-32 truncate flex-shrink-0" title={skip.candidate_id || 'N/A'}>
                {skip.candidate_id || 'N/A'}
              </span>
              <span className="text-state-error flex-1">{skip.reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
