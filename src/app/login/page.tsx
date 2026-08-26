'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { demoStorage } from '@/lib/supabase';
import { ShipProfile } from '@/lib/types';
import { Shield, Anchor, Compass, Lock, ArrowRight, Radio } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingUser, setExistingUser] = useState<ShipProfile | null>(null);

  useEffect(() => {
    const user = demoStorage.getUser();
    if (user && user.ship_id) {
      setExistingUser(user);
    }
  }, []);

  const handleGoogleLogin = (demoShipId?: string, demoName?: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (existingUser && !demoShipId) {
        router.push('/dashboard');
        return;
      }

      // If logging in with demo profile directly
      if (demoShipId) {
        const profile: ShipProfile = {
          google_user_id: `google-user-${demoShipId}`,
          ship_id: demoShipId,
          display_name: demoName || `Capt. Vessel ${demoShipId.slice(0, 4)}`,
          email: `captain.${demoShipId}@blueguard.maritime`,
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
      } else {
        // Go to Ship ID registration page for new users
        router.push('/onboarding');
      }
    }, 600);
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
          Agentic AI Marine Information Assistant
        </p>
        <p className="text-xs text-slate-400 italic mb-8">
          "Navigate smarter. Respond faster."
        </p>

        {/* Existing Returning User Card */}
        {existingUser ? (
          <div className="mb-6 p-4 bg-slate-900/80 rounded-2xl border border-cyan-500/40 text-left">
            <div className="text-xs text-slate-400">Welcome back,</div>
            <div className="text-base font-extrabold text-cyan-300">{existingUser.display_name}</div>
            <div className="text-xs font-mono text-slate-400 mt-1">Ship ID: <span className="text-emerald-400 font-bold">{existingUser.ship_id}</span></div>
            <button
              onClick={() => handleGoogleLogin(existingUser.ship_id, existingUser.display_name)}
              className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              Continue to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Continue with Google Button */
          <button
            onClick={() => handleGoogleLogin()}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-white text-slate-950 font-extrabold text-sm shadow-xl hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-6"
          >
            {/* Google SVG Logo */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mb-8">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Secure authentication powered by Supabase & Google</span>
        </div>

        {/* Demo Fleet Quick Login Switcher for SIH Hackathon Evaluation */}
        <div className="pt-6 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            ⚡ Quick Demo Ship Switcher (SIH Evaluation)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleGoogleLogin('123456789012', 'Capt. Saran Kumar')}
              className="p-2 rounded-lg bg-slate-900/90 text-cyan-300 font-mono border border-cyan-800/60 hover:bg-cyan-950 transition-colors"
            >
              Ship 123456789012
            </button>
            <button
              onClick={() => handleGoogleLogin('987654321098', 'Capt. Rajesh V')}
              className="p-2 rounded-lg bg-slate-900/90 text-teal-300 font-mono border border-teal-800/60 hover:bg-teal-950 transition-colors"
            >
              Ship 987654321098
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
