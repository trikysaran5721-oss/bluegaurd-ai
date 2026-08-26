'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import EmergencyOverlay from '@/components/EmergencyOverlay';
import { demoStorage } from '@/lib/supabase';
import { ShipProfile, NearbyVessel } from '@/lib/types';
import { INITIAL_DEMO_FLEET } from '@/lib/marineData';
import { Radio, Ship, Compass, MapPin, Navigation as NavIcon, AlertTriangle, ShieldCheck, Wifi, WifiOff } from 'lucide-react';

export default function FleetHubPage() {
  const [userProfile, setUserProfile] = useState<ShipProfile | null>(null);
  const [fleet, setFleet] = useState<NearbyVessel[]>(INITIAL_DEMO_FLEET);

  useEffect(() => {
    const user = demoStorage.getUser();
    setUserProfile(user);
  }, []);

  if (!userProfile) return null;

  return (
    <div className="min-h-screen theme-fleet flex flex-col">
      <Navigation userProfile={userProfile} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-6">
        {/* Header Title */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-700/80 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-slate-200 via-teal-200 to-cyan-300 bg-clip-text text-transparent flex items-center gap-2">
              <Radio className="w-7 h-7 text-cyan-400 animate-pulse" /> DEMO MARITIME FLEET HUB
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Connected vessel network & real-time ship-to-ship radio telemetry
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-cyan-300 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-700">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            4 ONLINE / 1 OFFLINE
          </div>
        </div>

        {/* Fleet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fleet.map((vessel) => {
            const isCurrent = vessel.ship_id === userProfile.ship_id;
            return (
              <div
                key={vessel.ship_id}
                className={`glass-panel p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'border-cyan-500/80 shadow-lg shadow-cyan-500/20 bg-slate-900/90'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                      <Ship className="w-4 h-4 text-cyan-400" /> {vessel.name}
                    </h3>
                    <p className="text-[11px] font-mono text-cyan-300 font-bold mt-0.5">
                      Ship ID: {vessel.ship_id}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border ${
                      vessel.status === 'ONLINE'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {vessel.status === 'ONLINE' ? (
                      <>
                        <Wifi className="w-3 h-3 text-emerald-400" /> ONLINE
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3 text-slate-500" /> OFFLINE
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Master / Handler:</span>
                    <span className="font-sans font-semibold text-slate-200">{vessel.handler}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">GPS Coordinates:</span>
                    <span className="text-emerald-400">{vessel.lat.toFixed(4)}° N, {vessel.lon.toFixed(4)}° E</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Heading / Speed:</span>
                    <span>{vessel.heading}° | {vessel.speed} kts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Destination:</span>
                    <span className="font-sans text-cyan-200">{vessel.destination}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Distance from current:</span>
                    <span className="font-bold text-cyan-300">
                      {isCurrent ? '0 NM (YOU)' : `${vessel.distance_nm} NM`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <EmergencyOverlay currentShip={userProfile} />
    </div>
  );
}
