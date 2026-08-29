'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { demoStorage } from '@/lib/supabase';
import { ShipProfile } from '@/lib/types';
import { Shield, Anchor, Compass, Lock, ArrowRight, Radio, Ship, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [shipIdInput, setShipIdInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingUser, setExistingUser] = useState<ShipProfile | null>(null);

  useEffect(() => {
    const user = demoStorage.getUser();
    if (user && user.ship_id) {
      setExistingUser(user);
      setShipIdInput(user.ship_id);
    }
  }, []);

  const handleShipIdLogin = (e?: React.FormEvent, customShipId?: string) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const targetShipId = (customShipId || shipIdInput).trim();

    // Validate 12-digit number format
    if (!/^\d{12}$/.test(targetShipId)) {
      setErrorMessage('⚠️ Ship ID must be exactly 12 numeric digits (e.g., 123456789012)');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const profile: ShipProfile = {
        google_user_id: `ship-user-${targetShipId}`,
        ship_id: targetShipId,
        display_name: targetShipId === '123456789012' ? 'Capt. Saran Kumar' : targetShipId === '987654321098' ? 'Capt. Rajesh V' : `MV INS BlueGuard (${targetShipId.slice(0, 4)})`,
        email: `captain.${targetShipId}@blueguard.maritime`,
        preferred_language: 'en',
        latitude: 13.0827,
        longitude: 80.2707,
        heading: 84.0,
        speed: 12.0,
        destination: 'Colombo',
        online_status: 'ONLINE'
      };

      demoStorage.setUser(profile);
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen theme-login flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animated Subtle Waves */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main Glass Login Container */}
      <div className="w-full max-w-md glass-panel-cyan p-8 rounded-3xl shadow-2xl border border-cyan-500/30 accent-cyan-glow relative z-10 text-center">
        {/* Brand Logo & Header */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 mx-auto mb-4 shadow-xl shadow-cyan-500/30">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent mb-1">
          BLUEGUARD
        </h1>
        <p className="text-xs text-cyan-300 font-medium tracking-wide uppercase mb-2">
          MARITIME COMMAND & V2V DISPATCH PORTAL
        </p>
        <p className="text-xs text-slate-400 italic mb-6">
          "Enter your 12-Digit Ship ID to authenticate vessel session"
        </p>

        {/* 12-Digit Ship ID Login Form */}
        <form onSubmit={handleShipIdLogin} className="space-y-4 mb-6 text-left">
          <div>
            <label className="block text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Ship className="w-4 h-4 text-cyan-400" /> 12-Digit Ship Registration ID
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={12}
                value={shipIdInput}
                onChange={(e) => {
                  setErrorMessage('');
                  setShipIdInput(e.target.value.replace(/\D/g, ''));
                }}
                placeholder="Enter 12 digits (e.g. 123456789012)"
                className="w-full px-4 py-3 bg-slate-950/90 border border-cyan-500/50 rounded-xl font-mono text-sm text-cyan-200 tracking-widest focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all placeholder:text-slate-600"
              />
              <span className="absolute right-3 top-3 text-xs font-mono text-slate-500">
                {shipIdInput.length}/12
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 text-white font-extrabold text-sm shadow-xl hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>AUTHENTICATE VESSEL SESSION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mb-6">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Vessel authentication via 12-Digit Maritime Ship ID</span>
        </div>

        {/* Quick Demo Ship Switcher */}
        <div className="pt-5 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            ⚡ Quick Demo Ship Login (SIH Evaluation)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setShipIdInput('123456789012');
                handleShipIdLogin(undefined, '123456789012');
              }}
              className="p-2.5 rounded-xl bg-slate-900/90 text-cyan-300 font-mono border border-cyan-800/60 hover:bg-cyan-950 transition-colors flex flex-col items-center"
            >
              <span className="font-bold text-white">Ship A</span>
              <span className="text-[10px] text-cyan-400">123456789012</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShipIdInput('987654321098');
                handleShipIdLogin(undefined, '987654321098');
              }}
              className="p-2.5 rounded-xl bg-slate-900/90 text-teal-300 font-mono border border-teal-800/60 hover:bg-teal-950 transition-colors flex flex-col items-center"
            >
              <span className="font-bold text-white">Ship B</span>
              <span className="text-[10px] text-teal-400">987654321098</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
