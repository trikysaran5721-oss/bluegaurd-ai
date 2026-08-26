'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { demoStorage } from '@/lib/supabase';
import { ShipProfile } from '@/lib/types';
import { User, Shield, Globe, Mail, Calendar, Key, CheckCircle, Save } from 'lucide-react';

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<ShipProfile | null>(null);
  const [prefLang, setPrefLang] = useState<'en' | 'hi'>('en');

  useEffect(() => {
    const user = demoStorage.getUser();
    if (user) {
      setUserProfile(user);
      setPrefLang(user.preferred_language || 'en');
    }
  }, []);

  const handleSaveSettings = () => {
    if (userProfile) {
      const updated = { ...userProfile, preferred_language: prefLang };
      setUserProfile(updated);
      demoStorage.setUser(updated);
      alert('Profile preferences updated!');
    }
  };

  if (!userProfile) return null;

  return (
    <div className="min-h-screen theme-profile flex flex-col">
      <Navigation userProfile={userProfile} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-6">
        {/* Header */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-700 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-700 to-cyan-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl">
            {userProfile.display_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{userProfile.display_name}</h1>
            <p className="text-xs text-cyan-300 font-mono">Ship ID: {userProfile.ship_id}</p>
          </div>
        </div>

        {/* Profile Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Account Details */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <h3 className="font-extrabold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" /> GOOGLE ACCOUNT PROFILE
            </h3>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Email Address:</span>
              <span className="font-semibold text-slate-200">{userProfile.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Google User ID:</span>
              <span className="font-mono text-cyan-300 text-[11px]">{userProfile.google_user_id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Ship ID:</span>
              <span className="font-mono font-bold text-emerald-400">{userProfile.ship_id}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Account Status:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> VERIFIED MARITIME OPERATOR
              </span>
            </div>
          </div>

          {/* Preferences Settings */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h3 className="font-extrabold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" /> SYSTEM PREFERENCES
            </h3>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Preferred Voice & UI Language</label>
              <select
                value={prefLang}
                onChange={(e) => setPrefLang(e.target.value as 'en' | 'hi')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-cyan-400"
              >
                <option value="en">English (Voice & Text)</option>
                <option value="hi">हिंदी (Hindi Voice & Text)</option>
              </select>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
