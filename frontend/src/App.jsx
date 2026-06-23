import React, { useState } from 'react';
import { Header } from './components/Header';
import { SearchPanel } from './components/SearchPanel';
import { ResultsList } from './components/ResultsList';
import { useSearch } from './hooks/useSearch';

function App() {
  const [searchState, setSearchState] = useState({
    job_description: '',
    weights: {
      semantic: 50,
      career: 30,
      velocity: 20,
    },
    top_n: 10,
    blind_mode: false,
  });

  const { search, loading, error, results } = useSearch();

  const handleSearch = () => {
    search({
      job_description: searchState.job_description,
      weights: {
        semantic: searchState.weights.semantic / 100,
        career: searchState.weights.career / 100,
        velocity: searchState.weights.velocity / 100,
      },
      top_n: searchState.top_n,
      blind_mode: searchState.blind_mode,
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-surface-bg text-text-primary flex flex-col font-sans">
      <Header onUploadSuccess={(count) => console.log(`Uploaded ${count} candidates`)} />
      
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-slide-up">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-state-error/10 border border-state-error/20 shadow-card backdrop-blur">
            <svg className="w-5 h-5 text-state-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <p className="text-sm font-semibold text-state-error">Search failed</p>
              <p className="text-xs text-text-secondary mt-0.5">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 h-[calc(100vh-65px)] overflow-hidden">
        <SearchPanel 
          searchState={searchState} 
          onSearchStateChange={setSearchState} 
          onSearch={handleSearch}
          loading={loading}
        />
        <ResultsList 
          results={results?.results}
          weights={searchState.weights}
          blindMode={searchState.blind_mode}
          jdSkills={results?.jd_skills_extracted}
          totalScanned={results?.total_candidates_scanned}
          latencyMs={results?.latency_ms}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default App;
