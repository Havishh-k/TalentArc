import React, { useEffect, useState } from 'react';

import { FileUpload } from './FileUpload';
import { ShieldCheck } from 'lucide-react';

export function Header({ onUploadSuccess, onOpenCompliance }) {
  const [health, setHealth] = useState('offline');

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || '';
    fetch(`${API_BASE}/api/health`)
      .then(res => res.ok ? setHealth('healthy') : setHealth('offline'))
      .catch(() => setHealth('offline'));
  }, []);

  const isHealthy = health === 'healthy';

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-surface-bg/80 backdrop-blur-md border-b border-surface-border shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shadow-glow-sm">
          <div className="w-3.5 h-3.5 bg-white rounded-[2px] rotate-45 transform transition-transform group-hover:rotate-90" />
        </div>
        <div>
          <h1 className="font-bold text-[22px] tracking-tight text-text-primary leading-none">TalentArc</h1>
          <p className="text-xs text-brand-glow font-medium mt-1 tracking-wide uppercase">AI-Powered Talent Signal Engine</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {onOpenCompliance && (
          <button 
            onClick={onOpenCompliance}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-panel border border-surface-border hover:bg-surface-border transition-colors text-sm font-medium text-text-secondary hover:text-brand-primary"
          >
            <ShieldCheck size={16} />
            <span className="hidden sm:inline">Compliance Audit</span>
          </button>
        )}
        <FileUpload onSuccess={onUploadSuccess} />
        
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface-panel border border-surface-border shadow-inner">
          <span className="relative flex h-2.5 w-2.5">
            {isHealthy && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isHealthy ? 'bg-risk-low shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-risk-high shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
          </span>
          <span className="text-xs text-text-secondary font-mono tracking-wide">
            {isHealthy ? 'System Online' : 'System Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
