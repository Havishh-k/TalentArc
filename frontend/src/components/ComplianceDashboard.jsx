import React from 'react';
import { ShieldCheck, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

export function ComplianceDashboard({ auditData, onClose }) {
  if (!auditData) return null;

  const { summary, results, methodology } = auditData;
  const isPassing = summary.fail === 0;

  return (
    <div className="fixed inset-0 bg-surface-bg/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in font-sans">
      <div className="max-w-4xl w-full bg-surface-surface rounded-2xl border border-surface-border shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border bg-surface-elevated/50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isPassing ? 'bg-state-success/10 text-state-success' : 'bg-state-error/10 text-state-error'}`}>
              {isPassing ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Twin Auditor Report</h2>
              <p className="text-sm text-text-secondary mt-1">Live Counterfactual Assessment</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-bg border border-surface-border rounded-xl p-5">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Max Delta</p>
              <div className="text-2xl font-bold text-text-primary">{summary.max_observed_delta.toExponential(2)}</div>
              <p className="text-xs text-state-success mt-2 flex items-center gap-1">
                <CheckCircle2 size={12} /> Below {auditData.tolerance.toExponential(1)} tolerance
              </p>
            </div>
            <div className="bg-surface-bg border border-surface-border rounded-xl p-5">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Pass Rate</p>
              <div className="text-2xl font-bold text-state-success">
                {((summary.pass / summary.candidates_tested) * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-text-tertiary mt-2">
                {summary.pass} / {summary.candidates_tested} candidates passed
              </p>
            </div>
            <div className="bg-surface-bg border border-surface-border rounded-xl p-5">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Methodology</p>
              <div className="text-sm font-medium text-text-primary line-clamp-2 mt-1">
                {methodology}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText size={16} className="text-text-secondary" />
              Detailed Top 100 Breakdown
            </h3>
            <div className="bg-surface-bg border border-surface-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-elevated text-text-secondary text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Rank</th>
                    <th className="px-4 py-3 font-semibold">Candidate ID</th>
                    <th className="px-4 py-3 font-semibold">Fields Swapped</th>
                    <th className="px-4 py-3 font-semibold">Max Delta</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {results.slice(0, 10).map((result, idx) => (
                    <tr key={result.candidate_id} className="hover:bg-surface-elevated/50 transition-colors">
                      <td className="px-4 py-3 text-text-secondary">#{result.rank}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{result.candidate_id}</td>
                      <td className="px-4 py-3 text-text-tertiary">
                        <div className="flex flex-wrap gap-1">
                          {result.fields_swapped.slice(0, 2).map(f => (
                            <span key={f} className="px-2 py-0.5 bg-surface-elevated rounded text-[10px]">{f.split('.').pop()}</span>
                          ))}
                          {result.fields_swapped.length > 2 && <span className="px-2 py-0.5 bg-surface-elevated rounded text-[10px]">+{result.fields_swapped.length - 2} more</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                        {result.max_delta.toExponential(2)}
                      </td>
                      <td className="px-4 py-3">
                        {result.pass ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-state-success/10 text-state-success">
                            <CheckCircle2 size={14} /> Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-state-error/10 text-state-error">
                            <ShieldAlert size={14} /> Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {results.length > 10 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-center text-xs text-text-tertiary bg-surface-elevated/30">
                        ...and {results.length - 10} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
