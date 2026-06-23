import React, { useEffect, useState } from 'react';
import { X, MapPin, Briefcase, GraduationCap, Code, Star, CheckCircle, Github } from 'lucide-react';

export function CandidateProfileDrawer({ isOpen, onClose, candidate, blindMode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  const raw = candidate?.raw_data;
  if (!raw) return null;

  const personal = raw.personal || {};
  const career = raw.career_history || [];
  const education = raw.education || [];
  const projects = raw.projects || [];
  const skills = raw.skills || [];
  const behavioral = raw.behavioral_metadata || {};

  // Masking Logic
  const displayName = blindMode ? `Candidate #${candidate.rank}` : personal.full_name;
  
  const getMaskedInstitution = (index) => {
    return blindMode ? `Institution ${String.fromCharCode(64 + candidate.rank)}` : education[index]?.institution;
  };

  const renderAvatar = () => {
    if (blindMode) {
      return (
        <div className="w-16 h-16 rounded bg-surface-border flex items-center justify-center shadow-card shrink-0">
          <div className="w-8 h-8 rounded-full bg-brand-primary/50 mix-blend-screen" />
        </div>
      );
    }
    return (
      <div className="w-16 h-16 rounded bg-surface-border flex items-center justify-center shrink-0 overflow-hidden shadow-card relative">
        {personal.display_photo_url ? (
          <img src={personal.display_photo_url} alt={personal.full_name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl font-bold text-text-primary">
            {personal.full_name?.charAt(0)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-screen w-[450px] z-50 bg-surface-panel border-l border-surface-border shadow-card transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-surface-border bg-surface-bg/50 backdrop-blur-md flex items-start justify-between shrink-0">
          <div className="flex gap-4 items-center">
            {renderAvatar()}
            <div>
              <h2 className="text-xl font-bold text-text-primary tracking-tight mb-1">
                {displayName}
              </h2>
              <p className="text-sm text-text-secondary flex items-center gap-2 mb-1">
                <Briefcase size={14} className="text-brand-primary" />
                {personal.current_title} at {blindMode ? 'Company' : personal.current_company}
              </p>
              <p className="text-xs text-text-tertiary flex items-center gap-2">
                <MapPin size={14} />
                {personal.location} &bull; {personal.years_experience} yrs exp
              </p>
              {!blindMode && personal.github_handle && (
                <p className="text-xs text-text-tertiary flex items-center gap-2 mt-1">
                  <Github size={14} />
                  github.com/{personal.github_handle}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-md hover:bg-surface-border text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-1">Composite</span>
              <div className="text-2xl font-bold text-text-primary tracking-tight">
                {candidate.composite_score.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          
          {/* Skills */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-text-secondary flex items-center gap-2 mb-4">
              <Code size={16} className="text-brand-primary" />
              Technical Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <span key={skill} className="px-2.5 py-1 text-xs font-mono bg-surface-border/50 text-text-primary rounded border border-surface-border">
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* Projects */}
          {projects.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-text-secondary flex items-center gap-2 mb-4">
                <Star size={16} className="text-brand-primary" />
                Key Projects
              </h3>
              <div className="space-y-4">
                {projects.map((proj, idx) => (
                  <div key={idx} className="p-4 rounded border border-surface-border bg-surface-bg/30">
                    <h4 className="text-sm font-bold text-text-primary mb-2">{proj.title}</h4>
                    <p className="text-sm text-text-secondary leading-relaxed mb-3">{proj.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.technologies?.map(tech => (
                        <span key={tech} className="px-2 py-0.5 text-[10px] font-mono bg-brand-primary/10 text-brand-primary rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Career History */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-text-secondary flex items-center gap-2 mb-4">
              <Briefcase size={16} className="text-brand-primary" />
              Career History
            </h3>
            <div className="relative border-l border-surface-border ml-2 space-y-6">
              {career.map((job, idx) => (
                <div key={idx} className="pl-6 relative">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(78,205,196,0.4)]" />
                  <h4 className="text-sm font-bold text-text-primary">{job.title}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-text-secondary">{blindMode ? 'Company' : job.company}</span>
                    <span className="text-xs font-mono text-text-tertiary">
                      {job.start_month} &rarr; {job.end_month || 'Present'}
                    </span>
                  </div>
                  {job.tenure_months && (
                    <p className="text-xs text-text-tertiary mt-1">Tenure: {Math.floor(job.tenure_months/12)}y {job.tenure_months%12}m</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-text-secondary flex items-center gap-2 mb-4">
              <GraduationCap size={16} className="text-brand-primary" />
              Education
            </h3>
            <div className="space-y-4">
              {education.map((edu, idx) => (
                <div key={idx} className="p-4 rounded border border-surface-border bg-surface-bg/30">
                  <h4 className="text-sm font-bold text-text-primary">{edu.degree}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-text-secondary">{getMaskedInstitution(idx)}</span>
                    <span className="text-xs font-mono text-text-tertiary">{edu.graduation_year}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Behavioral Stats */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-text-secondary flex items-center gap-2 mb-4">
              <CheckCircle size={16} className="text-brand-primary" />
              Behavioral Insights
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded border border-surface-border bg-surface-bg/30">
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Avg Tenure</p>
                <p className="text-sm font-bold text-text-primary font-mono">{behavioral.avg_tenure_months?.toFixed(1)} mos</p>
              </div>
              <div className="p-3 rounded border border-surface-border bg-surface-bg/30">
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Promo Speed</p>
                <p className="text-sm font-bold text-text-primary font-mono">{behavioral.promotion_speed_months} mos</p>
              </div>
              <div className="p-3 rounded border border-surface-border bg-surface-bg/30">
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Total Companies</p>
                <p className="text-sm font-bold text-text-primary font-mono">{behavioral.num_companies_total}</p>
              </div>
              <div className="p-3 rounded border border-surface-border bg-surface-bg/30">
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">GitHub Velocity</p>
                <p className="text-sm font-bold text-text-primary font-mono">{behavioral.github_velocity_index?.toFixed(1) || 'N/A'}</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
