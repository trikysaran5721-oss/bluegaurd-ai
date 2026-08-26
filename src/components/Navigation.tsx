'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShipProfile } from '@/lib/types';
import { demoStorage } from '@/lib/supabase';
import { V2VCommunicationModal } from './V2VCommunicationModal';
import {
  Shield,
  Compass,
  Navigation as NavIcon,
  History,
  Radio,
  Mic,
  AlertTriangle,
  User,
  Settings,
  Globe,
  Wifi,
  WifiOff,
  LogOut,
  Play,
  Sparkles,
  RadioTower
} from 'lucide-react';

interface NavigationProps {
  userProfile: ShipProfile | null;
  onLanguageChange?: (lang: 'en' | 'hi') => void;
  onOfflineToggle?: (isOffline: boolean) => void;
  isOfflineMode?: boolean;
}

export default function Navigation({
  userProfile,
  onLanguageChange,
  onOfflineToggle,
  isOfflineMode = false
}: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'hi'>(userProfile?.preferred_language || 'en');
  const [isV2VOpen, setIsV2VOpen] = useState(false);

  const handleLangToggle = (newLang: 'en' | 'hi') => {
    setLang(newLang);
    if (onLanguageChange) onLanguageChange(newLang);
  };

  const handleLogout = () => {
    demoStorage.logout();
    router.push('/login');
  };

  const navItems = [
    { label: 'Command Center', href: '/dashboard', icon: Compass },
    { label: 'Marine Intelligence', href: '/intelligence', icon: Sparkles },
    { label: 'Route Builder', href: '/route', icon: NavIcon },
    { label: 'Travel History', href: '/history', icon: History },
    { label: 'Fleet Hub', href: '/fleet', icon: Radio },
    { label: 'Voice Assistant', href: '/assistant', icon: Mic },
    { label: 'Profile', href: '/profile', icon: User },
    { label: '5-Min Judge Demo', href: '/admin-demo', icon: Play }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                  BLUEGUARD
                </h1>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800 font-mono">
                  SIH26176
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Your Intelligent Marine Watchkeeper</p>
            </div>
          </Link>

          {/* Center: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-200' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: V to V Radio Button, Ship ID, Status, Language, Logout */}
          <div className="flex items-center gap-3">
            
            {/* V to V (Vessel to Vessel Radio) Button */}
            <button
              onClick={() => setIsV2VOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-950 flex items-center gap-1.5 border border-cyan-400/40 transition transform active:scale-95"
            >
              <RadioTower className="w-4 h-4 text-cyan-200 animate-pulse" />
              <span>V to V Radio</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </button>

            {/* Ship ID Badge */}
            {userProfile?.ship_id && (
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Ship ID</span>
                <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
                  {userProfile.ship_id}
                </span>
              </div>
            )}

            {/* Connectivity Status Button */}
            <button
              onClick={() => onOfflineToggle && onOfflineToggle(!isOfflineMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                isOfflineMode
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {isOfflineMode ? (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" /> LIMITED
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" /> ONLINE
                </>
              )}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => handleLangToggle('en')}
                className={`px-2 py-0.5 rounded ${lang === 'en' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
              >
                EN
              </button>
              <button
                onClick={() => handleLangToggle('hi')}
                className={`px-2 py-0.5 rounded ${lang === 'hi' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
              >
                हिंदी
              </button>
            </div>

            {/* Logout */}
            {userProfile && (
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* V2V Communication Modal */}
      <V2VCommunicationModal isOpen={isV2VOpen} onClose={() => setIsV2VOpen(false)} />
    </>
  );
}
