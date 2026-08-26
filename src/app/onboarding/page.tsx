'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { demoStorage } from '@/lib/supabase';
import { ShipProfile } from '@/lib/types';
import { Shield, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [shipIdInput, setShipIdInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Strict Requirement Validation Rules
    if (!/^\d+$/.test(shipIdInput)) {
      setErrorMessage('Ship ID can contain numbers only.');
      return;
    }

    if (shipIdInput.length !== 12) {
      setErrorMessage('Ship ID must contain exactly 12 digits.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newProfile: ShipProfile = {
        google_user_id: `google-user-${shipIdInput}`,
        ship_id: shipIdInput,
        display_name: `Ship Handler ${shipIdInput.slice(0, 4)}`,
        email: `handler.${shipIdInput}@blueguard.maritime`,
        preferred_language: 'en',
        latitude: 13.0827,
        longitude: 80.2707,
        heading: 84.0,
        speed: 12.0,
        destination: 'Colombo',
        online_status: 'ONLINE'
      };

      demoStorage.setUser(newProfile);
      router.push('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen theme-login flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel-cyan p-8 rounded-3xl shadow-2xl border border-cyan-500/40 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 mx-auto mb-4">
          <div className="w-full h-full bg-slate-950 rounded-[12px] flex items-center justify-center">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-white tracking-wide mb-1">
          WELCOME TO BLUEGUARD
        </h2>
        <p className="text-xs text-slate-400 mb-6 font-mono">
          First-time Ship Registration
        </p>

        <form onSubmit={handleRegister} className="text-left space-y-4">
          <div>
            <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">
              Enter your Ship ID
            </label>
            <input
              type="text"
              value={shipIdInput}
              onChange={(e) => {
                setShipIdInput(e.target.value.trim());
                setErrorMessage('');
              }}
              placeholder="e.g. 123456789012"
              className="w-full px-4 py-3 bg-slate-950/90 border border-slate-700 rounded-xl text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono text-center">
              Must be exactly 12 numeric digits
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-200 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Registering Vessel...' : 'Register Ship & Proceed'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
