import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function FileUpload({ onUploadSuccess, compact = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;

    if (!file.name.match(/\.(xlsx|csv|json)$/i)) {
      setError('Only .xlsx, .csv, and .json files are supported.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be under 2MB.');
      return;
    }

    setError(null);
    setSuccess(false);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.detail || 'Failed to upload file.');
      } else {
        setSuccess(true);
        if (onUploadSuccess) onUploadSuccess(data.imported_count);
        setTimeout(() => setIsModalOpen(false), 2000); // Close after 2s
      }
    } catch (err) {
      setError('Connection error while uploading.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event) => {
    processFile(event.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <>
      <div className={compact ? "relative" : "mb-6"}>
        <button
          onClick={() => { setIsModalOpen(true); setSuccess(false); setError(null); }}
          className={compact 
            ? `px-3 py-1.5 rounded-full flex items-center justify-center gap-2 text-[11px] font-semibold transition-all duration-200 border bg-brand-primary/10 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/20 cursor-pointer shadow-sm uppercase tracking-wide`
            : `w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 border border-dashed bg-surface-bg border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 hover:border-brand-primary cursor-pointer`
          }
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Upload Data
        </button>
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-panel border border-surface-border rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-fade-slide-up">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <h2 className="text-lg font-bold text-text-primary mb-1">Upload Data</h2>
            <p className="text-sm text-text-secondary mb-6">Drop your JSON, CSV, or XLSX file here to inject candidates.</p>
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-200 ${isDragActive ? 'border-brand-primary bg-brand-primary/10' : 'border-surface-border hover:border-brand-primary/50 hover:bg-surface-elevated'}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".xlsx,.csv,.json" 
                className="hidden" 
              />
              {isUploading ? (
                <div className="w-full flex flex-col items-center">
                  <p className="text-sm font-medium text-text-primary mb-2">Processing Upload...</p>
                  <p className="text-xs text-text-tertiary mb-4">Extracting vectors and indexing candidates</p>
                  <div className="w-full h-1.5 bg-surface-border rounded-full overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full bg-brand-primary rounded-full animate-[shimmer_1.5s_infinite] w-[40%]"></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-surface-bg flex items-center justify-center mb-4 shadow-sm">
                    <svg className="w-6 h-6 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  </div>
                  <p className="text-sm font-medium text-text-primary">Click to upload or drag and drop</p>
                  <p className="text-xs text-text-tertiary mt-1">.xlsx, .csv, or .json (max 2MB)</p>
                </>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 rounded border border-risk-high/30 bg-risk-high/10 flex items-start gap-2">
                <svg className="w-4 h-4 text-risk-high shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span className="text-xs text-risk-high font-medium leading-relaxed">{error}</span>
              </div>
            )}
            
            {success && !error && (
              <div className="mt-4 p-3 rounded border border-risk-low/30 bg-risk-low/10 flex items-center gap-2">
                <svg className="w-4 h-4 text-risk-low" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <span className="text-xs text-risk-low font-medium">Successfully imported candidates!</span>
              </div>
            )}
          </div>
        </div>
      , document.body)}
    </>
  );
}
