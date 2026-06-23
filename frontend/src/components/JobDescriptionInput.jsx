import React from 'react';

export function JobDescriptionInput({ value, onChange }) {
  return (
    <div>
      <h2 className="font-semibold text-sm uppercase tracking-widest text-text-tertiary mb-2.5">Job Description</h2>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste or type your job description here..."
          className="w-full min-h-[140px] bg-surface-bg border border-surface-border rounded-lg p-3 font-mono text-sm text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary resize-y"
        />
        <div className="absolute bottom-3 right-3 text-xs text-text-tertiary font-mono bg-surface-bg/80 backdrop-blur px-1">
          {value.length} / 2000 chars
        </div>
      </div>
    </div>
  );
}
