import React, { useState } from 'react';
import { JobDescriptionInput } from './JobDescriptionInput';
import { ScoringSliders } from './ScoringSliders';
import { SearchControls } from './SearchControls';
import { CandidateImportPanel } from './import/CandidateImportPanel';

export function SearchPanel({ searchState, onSearchStateChange, onSearch, loading }) {
  const [activeTab, setActiveTab] = useState('search');

  const handleJdChange = (jd) => onSearchStateChange({ ...searchState, job_description: jd });
  const handleWeightsChange = (weights) => onSearchStateChange({ ...searchState, weights });
  const handleTopNChange = (top_n) => onSearchStateChange({ ...searchState, top_n });
  const handleBlindModeChange = (blind_mode) => onSearchStateChange({ ...searchState, blind_mode });

  const sum = searchState.weights.semantic + searchState.weights.career + searchState.weights.velocity + (searchState.weights.github_velocity || 0);
  const isWeightsValid = sum === 100;
  const jdLength = searchState.job_description.trim().length;

  return (
    <div className="w-[420px] flex-shrink-0 bg-surface-panel border-r border-surface-border search-panel z-10 shadow-xl flex flex-col h-full">
      <div className="flex border-b border-surface-border">
        <button 
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'search' ? 'text-brand-glow border-b-2 border-brand-glow bg-surface-elevated/30' : 'text-text-secondary hover:text-text-primary bg-transparent'}`}
          onClick={() => setActiveTab('search')}
        >
          Search
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'manage' ? 'text-brand-glow border-b-2 border-brand-glow bg-surface-elevated/30' : 'text-text-secondary hover:text-text-primary bg-transparent'}`}
          onClick={() => setActiveTab('manage')}
        >
          Manage Pool
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-8 flex flex-col gap-4">
        {activeTab === 'search' ? (
          <>
            <JobDescriptionInput value={searchState.job_description} onChange={handleJdChange} />
            <ScoringSliders weights={searchState.weights} onChange={handleWeightsChange} />
            <SearchControls
              topN={searchState.top_n}
              onTopNChange={handleTopNChange}
              blindMode={searchState.blind_mode}
              onBlindModeChange={handleBlindModeChange}
              onSearch={onSearch}
              loading={loading}
              jdLength={jdLength}
              isWeightsValid={isWeightsValid}
            />
          </>
        ) : (
          <CandidateImportPanel />
        )}
      </div>
    </div>
  );
}
