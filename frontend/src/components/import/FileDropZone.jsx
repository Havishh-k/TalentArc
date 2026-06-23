import React, { useRef, useState } from 'react';

export function FileDropZone({ onFileSelect, disabled }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSelect(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSelect(file);
    }
  };

  const validateAndSelect = (file) => {
    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.");
      return;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv') {
      alert("Only .xlsx and .csv files are supported.");
      return;
    }
    onFileSelect(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
        disabled ? 'bg-surface-bg border-surface-border cursor-not-allowed opacity-50' :
        isDragOver ? 'border-brand-glow bg-brand-glow/10' : 'border-surface-border hover:border-brand-glow bg-surface-elevated/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
        disabled={disabled}
      />
      <div className="flex flex-col items-center justify-center">
        <svg className="w-12 h-12 text-brand-glow mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
        <p className="text-text-primary font-medium mb-1">Click to upload or drag and drop</p>
        <p className="text-text-secondary text-sm">.xlsx or .csv (MAX. 5MB)</p>
      </div>
    </div>
  );
}
