import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ScoreBreakdownBar } from './ScoreBreakdownBar';
import { RetentionBadge } from './RetentionBadge';

function BlindAvatar({ rank }) {
  return (
    <div className="w-10 h-10 rounded-full bg-surface-border flex items-center justify-center border border-surface-elevated shrink-0">
      <span className="font-mono text-sm text-text-secondary">#{rank}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-panel border border-surface-border rounded p-3 shadow-card">
        <p className="text-sm font-semibold text-text-primary mb-2">{payload[0].payload.skill}</p>
        <p className="text-xs text-brand-primary">Candidate: <span className="font-mono">{payload[0].value}</span></p>
        <p className="text-xs text-text-tertiary">JD Required: <span className="font-mono">{payload[1].value}</span></p>
      </div>
    );
  }
  return null;
};

export function CandidateCard({ candidate, weights, blindMode, style, className = '' }) {
  const [expanded, setExpanded] = useState(false);

  const displayName = blindMode ? `Candidate #${candidate.rank}` : candidate.display_name;
  const displayInstitution = blindMode 
    ? `Institution ${String.fromCharCode(64 + candidate.rank)}`
    : candidate.display_institution;

  const Avatar = blindMode ? (
    <BlindAvatar rank={candidate.rank} />
  ) : (
    <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30 shrink-0 text-brand-glow font-semibold">
      {displayName.charAt(0)}
    </div>
  );

  return (
    <div 
      style={style}
      onClick={() => setExpanded(!expanded)}
      className={`bg-surface-panel border border-surface-border rounded-xl p-5 transition-all duration-200 cursor-pointer hover:bg-surface-elevated hover:shadow-card-hover hover:-translate-y-0.5 ${className}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-6 h-6 rounded bg-surface-bg border border-surface-border shrink-0">
            <span className="font-mono font-bold text-xs text-text-secondary">#{candidate.rank}</span>
          </div>
          {Avatar}
          <div>
            <h3 className="font-semibold text-[15px] text-text-primary leading-tight">{displayName}</h3>
            <p className="font-normal text-sm text-text-secondary mt-0.5">
              {candidate.display_title} · {displayInstitution}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <RetentionBadge tier={candidate.retention_risk.tier} signals={candidate.retention_risk.signals_triggered} />
          
          <div className="flex flex-col items-end">
            <span className="font-mono font-bold text-2xl text-text-primary leading-none">
              {candidate.composite_score.toFixed(1)}
            </span>
            <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider mt-0.5">
              Match
            </span>
          </div>
        </div>
      </div>

      <ScoreBreakdownBar scores={candidate.score_breakdown} weights={weights} />

      <p className="font-normal text-sm leading-relaxed text-text-secondary mt-4">
        {candidate.justification}
      </p>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-surface-border animate-expand-panel overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-3">Skill Gap Analysis</h4>
          <div className="flex gap-6 h-64">
            <div className="flex-1 min-w-0" style={{ height: 256 }}>
              <ResponsiveContainer width="100%" height={256}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={candidate.radar_data}>
                  <PolarGrid stroke="#2E3250" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#475569', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
                  <Radar name="Candidate" dataKey="candidate_score" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.4} />
                  <Radar name="JD Requirement" dataKey="jd_required" stroke="#475569" fill="transparent" strokeDasharray="3 3" />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-48 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
              <p className="text-xs text-text-secondary mb-1">Key Discrepancies</p>
              {candidate.radar_data.map(rd => {
                const hasGap = rd.candidate_score < rd.jd_required - 2;
                return (
                  <div key={rd.skill} className={`px-2.5 py-1.5 rounded border text-xs flex items-center justify-between ${hasGap ? 'bg-risk-medium/10 border-risk-medium/20 text-risk-medium' : 'bg-surface-bg border-surface-border text-text-secondary'}`}>
                    <span className="truncate pr-2">{rd.skill}</span>
                    <span className="font-mono flex-shrink-0">{rd.candidate_score}/{rd.jd_required}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {!expanded && (
        <div className="mt-2 text-right">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">↓ Details</span>
        </div>
      )}
    </div>
  );
}
