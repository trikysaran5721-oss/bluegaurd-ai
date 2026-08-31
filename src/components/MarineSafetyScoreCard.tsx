'use client';

import React, { useState } from 'react';
import { SafetyScoreBreakdown } from '@/lib/agenticOrchestrator';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Wind,
  Waves,
  Zap,
  CloudLightning,
  Clock,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

interface MarineSafetyScoreCardProps {
  safety: SafetyScoreBreakdown;
}

export default function MarineSafetyScoreCard({ safety }: MarineSafetyScoreCardProps) {
  const [showEvidenceDetails, setShowEvidenceDetails] = useState<boolean>(false);

  const getBandStyles = () => {
    if (safety.band === 'SAFE') {
      return {
        badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/60',
        scoreColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        accentBg: 'glass-panel-emerald',
        icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />
      };
    } else if (safety.band === 'CAUTION') {
      return {
        badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/60',
        scoreColor: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        accentBg: 'glass-panel-amber',
        icon: <AlertTriangle className="w-6 h-6 text-amber-400" />
      };
    } else {
      return {
        badgeBg: 'bg-rose-950 text-rose-300 border-rose-500/60',
        scoreColor: 'text-rose-400',
        borderColor: 'border-rose-500/40',
        accentBg: 'glass-panel-crimson',
        icon: <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
      };
    }
  };

  const styles = getBandStyles();

  return (
    <section aria-label="Marine Safety Score & Explainability" className={`glass-panel p-4 rounded-3xl border ${styles.borderColor} shadow-2xl space-y-3`}>
      {/* 1. SCORE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-cyan-900/40">
        <div className="flex items-center gap-3">
          {styles.icon}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white font-mono uppercase tracking-wider">
                MARINE SAFETY INDEX & EXPLAINABILITY
              </h3>
              <span className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded border ${styles.badgeBg}`}>
                {safety.band} ({safety.score}/100)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-sans">
              {safety.recommendation}
            </p>
          </div>
        </div>

        {/* Big Score Badge */}
        <div className="flex items-baseline gap-1 font-mono">
          <span className={`text-3xl font-black ${styles.scoreColor}`}>{safety.score}</span>
          <span className="text-xs text-slate-400 font-bold">/100</span>
        </div>
      </div>

      {/* 2. FACTOR BREAKDOWN GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
        {/* Weather Factor */}
        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>WEATHER</span>
            <span className="text-cyan-300 font-bold">{safety.factors.weather.score}</span>
          </div>
          <div className="font-extrabold text-white truncate text-[11px]">
            {safety.factors.weather.status}
          </div>
          <div className="text-[9px] text-slate-400 truncate">{safety.factors.weather.detail}</div>
        </div>

        {/* Wave Factor */}
        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>WAVE SWELL</span>
            <span className="text-emerald-400 font-bold">{safety.factors.wave.score}</span>
          </div>
          <div className="font-extrabold text-white truncate text-[11px]">
            {safety.factors.wave.status}
          </div>
          <div className="text-[9px] text-slate-400 truncate">{safety.factors.wave.detail}</div>
        </div>

        {/* Wind Factor */}
        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>WIND VECTOR</span>
            <span className="text-amber-400 font-bold">{safety.factors.wind.score}</span>
          </div>
          <div className="font-extrabold text-white truncate text-[11px]">
            {safety.factors.wind.status}
          </div>
          <div className="text-[9px] text-slate-400 truncate">{safety.factors.wind.detail}</div>
        </div>

        {/* Lightning Factor */}
        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>LIGHTNING</span>
            <span className="text-emerald-400 font-bold">{safety.factors.lightning.score}</span>
          </div>
          <div className="font-extrabold text-white truncate text-[11px]">
            {safety.factors.lightning.status}
          </div>
          <div className="text-[9px] text-slate-400 truncate">{safety.factors.lightning.detail}</div>
        </div>

        {/* Cyclone Factor */}
        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>CYCLONE</span>
            <span className="text-rose-400 font-bold">{safety.factors.cyclone.score}</span>
          </div>
          <div className="font-extrabold text-white truncate text-[11px]">
            {safety.factors.cyclone.status}
          </div>
          <div className="text-[9px] text-slate-400 truncate">{safety.factors.cyclone.detail}</div>
        </div>
      </div>

      {/* 3. EXPLAINABILITY "WHY THIS RECOMMENDATION?" ACCORDION */}
      <div className="pt-1">
        <button
          onClick={() => setShowEvidenceDetails(!showEvidenceDetails)}
          className="w-full p-2 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-cyan-300 font-bold transition"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Why this recommendation? (Concrete Evidence Points & Data Sources)</span>
          </span>
          {showEvidenceDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showEvidenceDetails && (
          <div className="mt-2 p-3 bg-slate-950 rounded-2xl border border-cyan-900/60 space-y-3 animate-in fade-in">
            
            {/* EVIDENCE POINTS */}
            <div>
              <h4 className="text-[11px] font-mono font-bold text-cyan-300 uppercase mb-1.5">
                Key AI Reasoning Evidence:
              </h4>
              <ul className="space-y-1 text-xs text-slate-300 font-sans">
                {safety.evidence_points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DATA SOURCE CITATIONS WITH REQUIRED LABELS */}
            <div>
              <h4 className="text-[11px] font-mono font-bold text-cyan-300 uppercase mb-1.5">
                Connected Data Sources & Veracity Citations:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                {safety.data_sources.map((ds, idx) => (
                  <div key={idx} className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-300 font-bold">{ds.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        ds.type === 'Live' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        ds.type === 'Forecast' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {ds.type}
                      </span>
                      <span className="text-slate-500">{ds.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

    </section>
  );
}
