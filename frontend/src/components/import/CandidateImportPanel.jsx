import React from 'react';
import { useImport } from '../../hooks/useImport';
import { FileDropZone } from './FileDropZone';
import { ImportResultBanner } from './ImportResultBanner';
import { SkipReasonsList } from './SkipReasonsList';

export function CandidateImportPanel() {
  const { importFile, reset, loading, error, result } = useImport();

  const handleFileSelect = async (file) => {
    await importFile(file);
  };

  return (
    <div className="bg-surface-bg rounded-xl p-6 shadow-card border border-surface-border">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Manage Candidate Pool</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Upload a structured Excel (.xlsx) or CSV file to batch-import candidate profiles into the database.
          </p>
        </div>
        <a 
          href="#"
          onClick={(e) => { e.preventDefault(); window.open((import.meta.env.VITE_API_URL || '') + '/api/health', '_blank'); }} 
          target="_blank"
          className="text-brand-glow hover:text-white text-sm font-medium transition-colors"
        >
          Check System Status &rarr;
        </a>
      </div>

      <div className="mb-6">
        <div className="bg-surface-panel p-4 rounded-md text-sm text-text-secondary border border-surface-border">
          <strong className="text-text-primary">Required Columns:</strong> full_name, current_title, current_company, years_experience, skills, project_1_title, project_1_description, avg_tenure_months, num_companies_last_3yr, promotion_speed_months, title_progression_score.
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-state-error/10 border border-state-error/30 text-state-error px-4 py-3 rounded-md">
          <p className="font-medium text-sm">Error: {error.message}</p>
        </div>
      )}

      {!result && (
        <FileDropZone onFileSelect={handleFileSelect} disabled={loading} />
      )}

      {loading && (
        <div className="mt-8 flex flex-col items-center justify-center text-brand-glow">
          <svg className="animate-spin mb-4 h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-medium">Processing batch upload. Generating embeddings...</span>
        </div>
      )}

      {result && (
        <div className="mt-6 animate-fadeIn">
          <ImportResultBanner result={result} />
          <SkipReasonsList skipReasons={result.skip_reasons} />
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={reset}
              className="bg-surface-elevated py-2 px-4 border border-surface-border rounded-md shadow-sm text-sm font-medium text-text-primary hover:bg-surface-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors focus:ring-offset-surface-bg"
            >
              Upload Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
