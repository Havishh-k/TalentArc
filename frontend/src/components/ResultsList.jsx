import React, { useState, useRef, useEffect } from 'react';
import { CandidateCard } from './CandidateCard';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function ShimmerCard() {
  return (
    <div className="bg-surface-panel border border-surface-border rounded-xl p-5 mb-4 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-surface-border"></div>
          <div className="w-10 h-10 rounded-full bg-surface-border"></div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-surface-border rounded"></div>
            <div className="h-3 w-48 bg-surface-border rounded"></div>
          </div>
        </div>
        <div className="h-8 w-16 bg-surface-border rounded"></div>
      </div>
      <div className="h-2 w-full bg-surface-border rounded-full mb-4"></div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-surface-border rounded"></div>
        <div className="h-3 w-5/6 bg-surface-border rounded"></div>
      </div>
    </div>
  );
}

export function ResultsList({ results, weights, blindMode, jdSkills, totalScanned, latencyMs, loading, poolDensity }) {
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 bg-surface-bg">
        <div className="bg-surface-panel border border-surface-border rounded-xl p-4 mb-6 animate-pulse">
          <div className="h-4 w-48 bg-surface-border rounded mb-3"></div>
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-surface-border rounded-full"></div>
            <div className="h-5 w-20 bg-surface-border rounded-full"></div>
            <div className="h-5 w-14 bg-surface-border rounded-full"></div>
          </div>
        </div>
        {[...Array(5)].map((_, i) => <ShimmerCard key={i} />)}
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-6 bg-surface-bg">
        <div className="w-12 h-12 rounded-full bg-surface-panel flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <p className="text-base font-semibold text-text-secondary">Ready to search</p>
        <p className="text-sm text-text-tertiary mt-1 max-w-xs">
          Enter a job description and configure scoring weights to find the best candidates.
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-6 bg-surface-bg">
        <svg className="w-12 h-12 text-text-tertiary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <p className="text-base font-semibold text-text-secondary">No candidates found</p>
        <p className="text-sm text-text-tertiary mt-1 max-w-xs">
          Try broadening your job description or adjusting the scoring weights.
        </p>
      </div>
    );
  }

  const getExportData = () => {
    return results.map((r, i) => ({
      Rank: i + 1,
      Name: blindMode ? "Candidate " + (i + 1) : r.display_name || "Unknown",
      Score: r.composite_score != null ? `${Number(r.composite_score).toFixed(1)}%` : "N/A",
      Title: r.display_title || "Unknown",
      Institution: blindMode ? "Redacted" : r.display_institution || "Unknown",
      "Semantic Match": r.score_breakdown?.semantic_score != null ? `${Number(r.score_breakdown.semantic_score).toFixed(1)}%` : "N/A",
      "Career Match": r.score_breakdown?.career_score != null ? `${Number(r.score_breakdown.career_score).toFixed(1)}%` : "N/A",
      "Velocity Match": r.score_breakdown?.velocity_score != null ? `${Number(r.score_breakdown.velocity_score).toFixed(1)}%` : "N/A",
      Justification: r.justification || ""
    }));
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "shortlist.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setExportDropdownOpen(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(fieldName => `"${String(row[fieldName] || '').replace(/"/g, '""')}"`).join(","))
    ].join("\r\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "shortlist.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setExportDropdownOpen(false);
  };

  const handleExportXLSX = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shortlist");
    XLSX.writeFile(wb, "shortlist.xlsx");
    setExportDropdownOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    const data = getExportData();
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(fieldName => row[fieldName]));
    
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("TalentArc Candidate Shortlist", 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 22);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: [50, 50, 50] },
      headStyles: { fillColor: [108, 99, 255], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: {
        0: { cellWidth: 12 }, // Rank
        1: { cellWidth: 25, fontStyle: 'bold' }, // Name
        2: { cellWidth: 15, fontStyle: 'bold', textColor: [34, 197, 94] }, // Score
        // Justification is the last column
        8: { cellWidth: 80 } 
      }
    });
    doc.save("shortlist.pdf");
    setExportDropdownOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-surface-bg">
      {poolDensity != null && poolDensity < 15.0 && (
        <div className="mb-6 bg-state-warning/10 border border-state-warning/30 text-state-warning p-4 rounded-xl shadow-sm animate-fade-slide-up flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="font-semibold text-sm">⚠ Restrictive Criteria Warning</h4>
            <p className="text-xs opacity-90 mt-1">
              Only {poolDensity.toFixed(1)}% of candidates meet the high-quality threshold (75+ composite score). Your current scoring weights may be too strict for this talent pool. Consider using the <b>Talent Partner</b> preset.
            </p>
          </div>
        </div>
      )}

      <div className="bg-surface-panel border border-surface-border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-text-primary">
            Showing top {results.length} of {totalScanned} candidates
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-tertiary font-mono">Scanned in {(latencyMs / 1000).toFixed(2)}s</span>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-bg border border-surface-border hover:bg-surface-elevated hover:border-brand-primary text-text-secondary hover:text-brand-primary transition-all shadow-sm"
              >
                ↓ Export Shortlist
                <svg className={`w-3.5 h-3.5 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              
              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-surface-panel border border-surface-border rounded-lg shadow-xl overflow-hidden z-50 animate-fade-slide-up">
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-2.5 text-xs font-medium text-text-secondary hover:text-brand-primary hover:bg-surface-elevated transition-colors border-b border-surface-border">Export as PDF</button>
                  <button onClick={handleExportXLSX} className="w-full text-left px-4 py-2.5 text-xs font-medium text-text-secondary hover:text-brand-primary hover:bg-surface-elevated transition-colors border-b border-surface-border">Export as XLSX</button>
                  <button onClick={handleExportCSV} className="w-full text-left px-4 py-2.5 text-xs font-medium text-text-secondary hover:text-brand-primary hover:bg-surface-elevated transition-colors border-b border-surface-border">Export as CSV</button>
                  <button onClick={handleExportJSON} className="w-full text-left px-4 py-2.5 text-xs font-medium text-text-secondary hover:text-brand-primary hover:bg-surface-elevated transition-colors">Export as JSON</button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {jdSkills && jdSkills.length > 0 && (
          <div>
            <p className="text-xs text-text-secondary mb-2">Skills detected:</p>
            <div className="flex flex-wrap gap-2">
              {jdSkills.map(skill => (
                <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-glow border border-brand-primary/20">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {results.map((candidate, i) => (
          <CandidateCard
            key={candidate.candidate_id}
            candidate={candidate}
            weights={weights}
            blindMode={blindMode}
            style={{ animationDelay: `${i * 60}ms` }}
            className="opacity-0 animate-fade-slide-up"
          />
        ))}
      </div>
    </div>
  );
}
