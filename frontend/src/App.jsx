import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchPanel } from './components/SearchPanel';
import { ResultsList } from './components/ResultsList';
import { ConsentGateway } from './components/ConsentGateway';
import { ComplianceDashboard } from './components/ComplianceDashboard';
import { useSearch } from './hooks/useSearch';

function App() {
  const [hasConsented, setHasConsented] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [auditData, setAuditData] = useState(null);

  const [searchState, setSearchState] = useState({
    job_description: '',
    weights: {
      semantic: 50,
      career: 30,
      velocity: 20,
      github_velocity: 0,
    },
    top_n: 10,
    blind_mode: false,
  });

  const { search, loading, error, results } = useSearch();

  // Load audit data (mocking the fetch for the hackathon demo)
  useEffect(() => {
    // In production, this would be a fetch to /api/audit
    setAuditData({
      methodology: "Tests for prestige/name leakage in masked scoring functions.",
      scope: "top_100",
      tolerance: 1e-09,
      summary: { candidates_tested: 2, pass: 2, fail: 0, max_observed_delta: 0.0 },
      results: [
        { candidate_id: "CAND_0000001", rank: 1, fields_swapped: ["profile.anonymized_name", "education.tier", "education.institution", "company", "profile.current_company_size"], max_delta: 0.0, pass: true },
        { candidate_id: "CAND_0000002", rank: 2, fields_swapped: ["profile.anonymized_name", "education.tier", "education.institution", "company", "profile.current_company_size"], max_delta: 0.0, pass: true }
      ]
    });
  }, []);

  const handleSearch = () => {
    search({
      job_description: searchState.job_description,
      weights: {
        semantic: searchState.weights.semantic / 100,
        career: searchState.weights.career / 100,
        velocity: searchState.weights.velocity / 100,
        github_velocity: (searchState.weights.github_velocity || 0) / 100,
      },
      top_n: searchState.top_n,
      blind_mode: searchState.blind_mode,
    });
  };

  if (!hasConsented) {
    return <ConsentGateway onAccept={() => setHasConsented(true)} />;
  }

  return (
    <div className="h-screen overflow-hidden bg-surface-bg text-text-primary flex flex-col font-sans">
      <Header 
        onUploadSuccess={(count) => console.log(`Uploaded ${count} candidates`)} 
        onOpenCompliance={() => setShowCompliance(true)}
      />
      
      {showCompliance && (
        <ComplianceDashboard 
          auditData={auditData} 
          onClose={() => setShowCompliance(false)} 
        />
      )}

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
          poolDensity={results?.pool_density_percentage}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default App;
