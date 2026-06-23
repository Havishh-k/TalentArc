import { useState, useCallback } from 'react';

export function useImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const importFile = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errData;
        try {
          errData = await response.json();
        } catch {
          throw new Error(`Upload failed with status ${response.status}`);
        }
        
        if (errData.detail) {
           if (errData.detail.detail) {
               throw new Error(errData.detail.detail);
           }
           if (typeof errData.detail === 'string') {
               throw new Error(errData.detail);
           }
        }
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return { importFile, reset, loading, error, result };
}
