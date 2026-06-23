import React from 'react';

export function ImportResultBanner({ result }) {
  if (!result) return null;

  const isSuccess = result.status === 'success';
  const bgColor = isSuccess ? 'bg-state-success/10' : 'bg-state-error/10';
  const borderColor = isSuccess ? 'border-state-success/30' : 'border-state-error/30';
  const textColor = isSuccess ? 'text-text-primary' : 'text-text-primary';
  const iconColor = isSuccess ? 'text-state-success' : 'text-state-error';

  return (
    <div className={`p-4 mt-6 border rounded-md ${bgColor} ${borderColor} ${textColor}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {isSuccess ? (
            <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${isSuccess ? 'text-state-success' : 'text-state-error'}`}>
            {isSuccess ? 'Import Successful' : 'Import Completed with Errors'}
          </h3>
          <div className="mt-2 text-sm text-text-secondary">
            <p>
              Processed {result.rows_received} rows in {(result.processing_time_ms / 1000).toFixed(2)}s.
              <br />
              Successfully imported: <span className="font-semibold text-state-success">{result.rows_imported}</span> candidates.
              <br />
              Skipped: <span className="font-semibold text-state-error">{result.rows_skipped}</span> rows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
