'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import SeawaterFooter from '@/components/SeawaterFooter';
import { demoStorage } from '@/lib/supabase';
import { ShipProfile } from '@/lib/types';
import { audioService } from '@/lib/audioService';
import { emergencyRealtimeNetwork } from '@/lib/emergencyRealtime';
import { Play, CheckCircle2, AlertOctagon, Radio, Shield, Mic, WifiOff, MapPin, ArrowRight } from 'lucide-react';

export default function AdminDemoPage() {
  const [userProfile, setUserProfile] = useState<ShipProfile | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const user = demoStorage.getUser();
    setUserProfile(user);
  }, []);

  const demoSteps = [
    { num: 1, title: 'Open BlueGuard', action: 'System loaded on port 3000' },
    { num: 2, title: 'Google OAuth Sign-In', action: 'Click Continue with Google' },
    { num: 3, title: '12-Digit Ship Registration', action: 'Registered Ship ID: 123456789012' },
    { num: 4, title: 'Command Center Dashboard', action: 'Loaded satellite marine map' },
    { num: 5, title: 'Destination & Route Creation', action: 'Destination set to Colombo (324 NM)' },
    { num: 6, title: 'Marine Data Tools Sync', action: 'Weather: 28.5°C | Wind: 22 kts NE | Tide: 1.45m' },
    { num: 7, title: 'Wake Phrase "BlueGuard"', action: 'Mic transforms with emerald glow' },
    { num: 8, title: 'Voice Query: Weather', action: 'Spoken answer: 22 knot NE winds' },
    { num: 9, title: 'Voice Query: Route Safety', action: 'Spoken answer: Route set to CAUTION' },
    { num: 10, title: 'Multi-Session Ship B (987654321098)', action: 'Connected to Emergency Broadcast Network' },
    { num: 11, title: 'Voice Emergency Alert Command', action: '"BlueGuard, send the emergency alert"' },
    { num: 12, title: 'Ship B Siren Alarm & Full Screen', action: 'Crimson distress interface activated' },
    { num: 13, title: 'Alert Acknowledgement', action: 'Ship B acknowledges alert' },
    { num: 14, title: 'Travel History & Offline Mode', action: 'Persisted voyage logs & cached data view' }
  ];

  const handleSimulateStep = (stepNum: number) => {
    setCurrentStep(stepNum);

    if (stepNum === 8) {
      audioService.speak("Current wind conditions along your route are 22 knots from the northeast.", "en");
    } else if (stepNum === 9) {
      audioService.speak("Your current route is classified as CAUTION. Strong northeast winds are present near Dondra Head.", "en");
    } else if (stepNum === 11 || stepNum === 12) {
      const demoAlert = {
        id: `alert-${Date.now()}`,
        sender_ship_id: '123456789012',
        sender_name: 'Capt. Saran Kumar',
        severity: 'CRITICAL' as const,
        alert_type: 'EMERGENCY_DISTRESS',
        message: 'Emergency assistance required. Heavy squall damage reported.',
        latitude: 13.0827,
        longitude: 80.2707,
        destination: 'Colombo',
        timestamp: new Date().toLocaleTimeString()
      };
      emergencyRealtimeNetwork.broadcastEmergency(demoAlert);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="min-h-screen theme-dashboard flex flex-col">
      <Navigation userProfile={userProfile} />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col gap-6">
        {/* Banner */}
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/40 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent flex items-center gap-2">
              <Play className="w-7 h-7 text-cyan-400" /> SIH 5-MINUTE JUDGE DEMO CONTROLLER
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Problem Statement SIH26176 — Step-by-step evaluation workflow runner
            </p>
          </div>

          <div className="text-right font-mono">
            <span className="text-xs text-cyan-300 bg-cyan-950 px-3 py-1.5 rounded-xl border border-cyan-800 font-bold">
              STEP {currentStep} OF 14
            </span>
          </div>
        </div>

        {/* Interactive Steps List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {demoSteps.map((step) => {
            const isCompleted = step.num < currentStep;
            const isCurrent = step.num === currentStep;
            return (
              <div
                key={step.num}
                onClick={() => handleSimulateStep(step.num)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'glass-panel-cyan border-cyan-400 shadow-lg shadow-cyan-500/20 scale-[1.01]'
                    : isCompleted
                    ? 'bg-slate-950/60 border-emerald-950 text-slate-400'
                    : 'glass-panel border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-cyan-300 flex items-center gap-2">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-bold">
                        {step.num}
                      </span>
                    )}
                    {step.title}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-extrabold uppercase">
                      ACTIVE STEP
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 font-mono pl-7">{step.action}</p>
              </div>
            );
          })}
        </div>

        {/* Multi-Tab Testing Instructions */}
        <div className="p-5 glass-panel-crimson rounded-2xl border border-rose-500/40 text-xs text-rose-200">
          <h4 className="font-extrabold text-sm text-red-200 mb-2 flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-400" /> Multi-Session Ship Emergency Broadcast Test
          </h4>
          <p className="mb-2">
            To demonstrate real-time distress alerts between two ships:
          </p>
          <ol className="list-decimal list-inside space-y-1 font-mono text-[11px] text-slate-300">
            <li>Open a second browser tab to <span className="text-cyan-300 font-bold">http://localhost:3000/login</span></li>
            <li>Select quick demo ship <span className="text-emerald-300 font-bold">Ship 987654321098</span></li>
            <li>In Tab 1 (Ship 123456789012), click "Voice Assistant" or say "BlueGuard, send the emergency alert"</li>
            <li>Observe Tab 2 instantly play emergency siren alarm and display full-screen crimson distress details!</li>
          </ol>
        </div>
      </main>

      <SeawaterFooter />
    </div>
  );
}
