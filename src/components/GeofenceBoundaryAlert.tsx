'use client';

import React from 'react';
import { GeofenceAlert } from '@/lib/agenticOrchestrator';
import { ShieldAlert, Compass, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';

interface GeofenceBoundaryAlertProps {
  geofence: GeofenceAlert;
}

export default function GeofenceBoundaryAlert({ geofence }: GeofenceBoundaryAlertProps) {
  if (!geofence) return null;

  return (
    <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-lg ${
      geofence.is_near_boundary
        ? 'bg-amber-950/90 border-amber-500/60 text-amber-200 animate-pulse'
        : 'bg-slate-900/90 border-slate-800 text-slate-300'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${geofence.is_near_boundary ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
          {geofence.is_near_boundary ? (
            <ShieldAlert className="w-5 h-5 animate-bounce" />
          ) : (
            <Compass className="w-5 h-5" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 font-mono text-xs font-extrabold">
            <span>GEOFENCE WATCHKEEPER:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] ${
              geofence.is_near_boundary ? 'bg-amber-500 text-slate-950 font-black' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {geofence.is_near_boundary ? 'PROXIMITY WARNING' : 'CLEAR'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Demo GIS Boundary</span>
          </div>
          <p className="text-xs font-sans mt-0.5">
            {geofence.boundary_name} — <strong>{geofence.distance_km} km</strong> {geofence.bearing}. {geofence.recommended_action}
          </p>
        </div>
      </div>

      <div className="text-right font-mono text-[11px]">
        <div className="text-slate-400">IMBL Clearance</div>
        <div className="text-cyan-300 font-extrabold">{geofence.distance_km} km</div>
      </div>
    </div>
  );
}
