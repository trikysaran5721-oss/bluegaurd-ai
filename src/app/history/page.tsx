'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { demoStorage } from '@/lib/supabase';
import { ShipProfile, TravelTrip } from '@/lib/types';
import { getInitialTrips } from '@/lib/marineData';
import { History, Calendar, MapPin, Wind, Waves, AlertTriangle, ShieldCheck, Clock, ArrowRight } from 'lucide-react';

export default function HistoryPage() {
  const [userProfile, setUserProfile] = useState<ShipProfile | null>(null);
  const [trips, setTrips] = useState<TravelTrip[]>([]);

  useEffect(() => {
    const user = demoStorage.getUser();
    setUserProfile(user);
    setTrips(getInitialTrips());
  }, []);

  if (!userProfile) return null;

  return (
    <div className="min-h-screen theme-history flex flex-col">
      <Navigation userProfile={userProfile} />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col gap-6">
        {/* Header Banner */}
        <div className="glass-panel-violet p-6 rounded-3xl border border-violet-500/40 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-violet-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent flex items-center gap-2">
              <History className="w-7 h-7 text-violet-400" /> MARITIME TRAVEL HISTORY LOG
            </h1>
            <p className="text-xs text-violet-200 mt-1">
              Historical passage logs, environmental snapshots & emergency event records
            </p>
          </div>

          <div className="text-right font-mono hidden sm:block">
            <span className="text-2xl font-extrabold text-violet-300">{trips.length}</span>
            <p className="text-[10px] text-slate-400 uppercase">Logged Voyages</p>
          </div>
        </div>

        {/* Timeline Sequence */}
        <div className="relative border-l-2 border-violet-800/60 ml-4 sm:ml-8 pl-6 space-y-6">
          {trips.map((trip, idx) => (
            <div key={trip.id} className="relative group">
              {/* Timeline Indicator Node */}
              <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-violet-600 border-4 border-slate-950 flex items-center justify-center shadow-lg shadow-violet-500/50">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>

              {/* Trip Card */}
              <div className="glass-panel-violet p-5 rounded-2xl border border-violet-500/30 hover:border-violet-400 transition-all shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-900/60 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-white">
                      {trip.origin} → {trip.destination}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                        trip.risk_score === 'SAFE'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      RISK: {trip.risk_score}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-violet-300">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(trip.started_at).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {/* Trip Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-violet-950">
                    <span className="text-[10px] text-slate-400 block uppercase">Distance</span>
                    <span className="font-mono font-bold text-cyan-300">{trip.distance_nm} NM</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-violet-950">
                    <span className="text-[10px] text-slate-400 block uppercase">Passage Time</span>
                    <span className="font-mono font-bold text-slate-200">{Math.round(trip.eta_minutes / 60)} hrs</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-violet-950">
                    <span className="text-[10px] text-slate-400 block uppercase">Weather Log</span>
                    <span className="font-medium text-violet-200 truncate block">{trip.weather_summary}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-violet-950">
                    <span className="text-[10px] text-slate-400 block uppercase">Alerts Recorded</span>
                    <span className="font-mono font-bold text-rose-400">{trip.alerts_count} Events</span>
                  </div>
                </div>

                {/* Environmental Details */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-violet-900/40">
                  <span>Wind: {trip.wind_summary}</span>
                  <span>Tide: {trip.tide_summary}</span>
                  <span className="text-emerald-400 font-bold">COMPLETED VOYAGE</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
