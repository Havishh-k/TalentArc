import React, { useState } from 'react';

export function ConsentGateway({ onAccept }) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full bg-surface-panel p-10 rounded-2xl border border-surface-border shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-brand-primary/20 blur-3xl rounded-full pointer-events-none opacity-50"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30 shadow-glow-sm">
              <svg className="w-6 h-6 text-brand-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">Compliance Sandbox</h1>
              <p className="text-text-secondary mt-1 text-sm font-medium">Redrob AI Hackathon Edition</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-text-secondary mb-8">
            <p className="leading-relaxed">
              Welcome to the TalentArc DPDP-Compliant Sandbox. This environment is physically decoupled from live GitHub scraping to adhere to strict data privacy guidelines.
            </p>
            <div className="bg-surface-elevated p-5 rounded-xl border border-surface-border mt-6">
              <h3 className="text-text-primary text-sm font-semibold mb-3 uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-state-warning"></div>
                System Constraints
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-state-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span><strong>Phase 2 LLM Extractions</strong> are pre-computed (cached in Parquet) to prevent API timeouts on the strict 512MB RAM constraint.</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-state-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span><strong>Phase 3 Semantic Search</strong> executes completely offline on CPU using PyTorch ONNX runtime.</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-state-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span><strong>Demographic Data</strong> (Names, Institution Names, Exact Companies) is actively masked from the core ranking algorithms.</span>
                </li>
              </ul>
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-surface-border bg-surface-elevated/50 cursor-pointer hover:bg-surface-elevated transition-colors group">
            <div className="relative flex items-start mt-0.5">
              <input 
                type="checkbox" 
                className="peer sr-only"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-brand-primary border-brand-primary' : 'border-text-tertiary'}`}>
                <svg className={`w-3.5 h-3.5 text-white transition-opacity ${isChecked ? 'opacity-100' : 'opacity-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary group-hover:text-brand-glow transition-colors">
                I acknowledge these constraints
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Proceeding confirms understanding of the DPDP offline architecture.
              </p>
            </div>
          </label>

          <button
            onClick={onAccept}
            disabled={!isChecked}
            className={`w-full mt-6 py-4 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${
              isChecked 
                ? 'bg-brand-primary text-white hover:brightness-110 hover:shadow-brand-primary/25 active:scale-[0.98]' 
                : 'bg-surface-elevated text-text-tertiary cursor-not-allowed opacity-70'
            }`}
          >
            ENTER COMPLIANCE SANDBOX
          </button>
        </div>
      </div>
    </div>
  );
}
