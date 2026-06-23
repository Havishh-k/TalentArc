import React from 'react';

export function SearchControls({ topN, onTopNChange, blindMode, onBlindModeChange, onSearch, loading, jdLength, isWeightsValid }) {
  
  const isJdValid = jdLength >= 50;
  const isValid = isJdValid && isWeightsValid;

  let buttonContent = (
    <>
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
      Find Top Candidates
    </>
  );

  if (loading) {
    buttonContent = (
      <>
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Analyzing Database...
      </>
    );
  } else if (!isJdValid) {
    buttonContent = `Job Description too short (${jdLength}/50)`;
  } else if (!isWeightsValid) {
    buttonContent = 'Weights must equal 100%';
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="h-px bg-surface-border flex-1" />
        <h2 className="font-semibold text-sm uppercase tracking-widest text-text-tertiary whitespace-nowrap">Filters</h2>
        <div className="h-px bg-surface-border flex-1" />
      </div>

      <div className="flex items-center justify-between py-2 mb-2">
        <span className="text-sm text-text-primary">Results</span>
        <div className="flex gap-4">
          {[5, 10, 20].map(n => (
            <label key={n} className="flex items-center gap-1.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${topN === n ? 'border-brand-primary bg-brand-primary' : 'border-surface-border bg-surface-bg group-hover:border-text-secondary'}`}>
                {topN === n && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <input
                type="radio"
                name="topN"
                value={n}
                checked={topN === n}
                onChange={() => onTopNChange(n)}
                className="hidden"
              />
              <span className={`text-sm transition-colors ${topN === n ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>{n}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between py-3 mb-6">
        <div>
          <p className="text-sm font-medium text-text-primary">Blind Sourcing Mode</p>
          <p className="text-xs text-text-secondary mt-0.5">Redacts names, photos, institutions</p>
        </div>
        <button
          onClick={() => onBlindModeChange(!blindMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-surface-panel shadow-inner ${blindMode ? 'bg-brand-primary' : 'bg-surface-border'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${blindMode ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <button
        onClick={onSearch}
        disabled={!isValid || loading}
        className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 font-semibold text-[15px] transition-all duration-300
          ${!isValid ? 'bg-surface-elevated/50 border border-surface-border text-text-tertiary cursor-not-allowed' : 
            loading ? 'bg-brand-primary/80 border border-brand-primary text-white cursor-wait shadow-glow-sm' : 
            'bg-brand-primary hover:bg-brand-glow border border-brand-glow text-white shadow-glow-sm hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0'}`}
      >
        {buttonContent}
      </button>
    </div>
  );
}
