'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Radio, ShieldAlert, Wifi, Compass, Sparkles, Navigation as NavIcon, History, Mic, User } from 'lucide-react';

export default function SeawaterFooter() {
  return (
    <footer className="relative w-full overflow-hidden bg-slate-950 pt-16 text-slate-300 select-none">
      
      {/* 🌊 1. STAGE 1: SURFACE TRANSITION LIGHTING & BLUR */}
      <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-slate-950 via-slate-900/60 to-transparent z-10 pointer-events-none" />

      {/* 🌊 2. STAGE 2: 4-5 ANIMATED SEAWATER PARALLAX WAVE LAYERS */}
      <div className="relative w-full h-32 sm:h-40 overflow-hidden pointer-events-none -mb-1">

        {/* Wave Surface Reflective Edge Glow */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent z-20 shadow-[0_0_15px_rgba(0,242,254,0.6)]" />

        {/* LAYER 1: Deepest Ocean Base Wave (Slowest 24s) */}
        <div className="absolute bottom-0 w-[200%] h-full animate-water-drift-slow opacity-25 text-cyan-900">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,50 L1200,120 L0,120 Z" />
          </svg>
        </div>

        {/* LAYER 2: Translucent Mid-Tone Water (Medium 18s) */}
        <div className="absolute bottom-0 w-[200%] h-[90%] animate-water-drift-mid opacity-35 text-teal-800">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M0,30 C200,100 450,0 650,70 C850,130 1050,20 1200,60 L1200,120 L0,120 Z" />
          </svg>
        </div>

        {/* LAYER 3: Cyan Bioluminescent Wave (12s) */}
        <div className="absolute bottom-0 w-[200%] h-[80%] animate-water-drift-fast opacity-45 text-cyan-700/80">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M0,50 C300,10 500,90 750,30 C1000,-10 1100,70 1200,40 L1200,120 L0,120 Z" />
          </svg>
        </div>

        {/* LAYER 4: Light Catching Surface Foam Highlight Wave (8s) */}
        <div className="absolute bottom-0 w-[200%] h-[65%] animate-water-drift-surface opacity-60 text-sky-500/40">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M0,40 C250,90 400,20 600,80 C800,10 1000,75 1200,35 L1200,120 L0,120 Z" />
          </svg>
        </div>

        {/* LAYER 5: Ultra-Low Opacity Foreground Ripple (6s Desktop) */}
        <div className="hidden md:block absolute bottom-0 w-[200%] h-[50%] animate-water-drift-ripple opacity-20 text-cyan-300">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M0,60 C180,20 380,80 580,40 C780,100 980,30 1200,70 L1200,120 L0,120 Z" />
          </svg>
        </div>

        {/* Floating Underwater Plankton / Bioluminescence Particles */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300/60 blur-[1px] bottom-4 left-[15%] animate-particle-float" />
          <div className="absolute w-2 h-2 rounded-full bg-teal-300/40 blur-[1px] bottom-8 left-[35%] animate-particle-float-delayed" />
          <div className="absolute w-1 h-1 rounded-full bg-sky-200/70 bottom-2 left-[55%] animate-particle-float" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400/30 blur-[2px] bottom-10 left-[75%] animate-particle-float-delayed" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-300/50 blur-[1px] bottom-6 left-[90%] animate-particle-float" />
        </div>
      </div>

      {/* 🌊 3. STAGE 3: DEEP OCEAN BED CONTENT LAYER */}
      <div className="relative z-20 bg-gradient-to-b from-slate-950 via-[#030914] to-[#01040a] border-t border-cyan-500/20 px-4 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Platform Branding & Status */}
          <div className="space-y-4">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                    BLUEGUARD
                  </h2>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800 font-mono">
                    SIH26176
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Agentic AI Marine Information Assistant</p>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering vessel captains, coastal authorities, and naval watchkeepers with real-time marine intelligence, sea route safety scoring, and vessel-to-vessel emergency mesh networks.
            </p>

            {/* System Status Indicator */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/40 text-xs text-emerald-300 font-mono font-semibold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>MARINE SYSTEM ONLINE</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-widest font-mono">Platform Modules</h3>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li>
                <Link href="/dashboard" className="hover:text-cyan-300 flex items-center gap-2 transition-colors">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" /> Command Center
                </Link>
              </li>
              <li>
                <Link href="/intelligence" className="hover:text-cyan-300 flex items-center gap-2 transition-colors">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Marine Intelligence
                </Link>
              </li>
              <li>
                <Link href="/route" className="hover:text-cyan-300 flex items-center gap-2 transition-colors">
                  <NavIcon className="w-3.5 h-3.5 text-cyan-400" /> Sea Route Builder
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-cyan-300 flex items-center gap-2 transition-colors">
                  <History className="w-3.5 h-3.5 text-cyan-400" /> Vessel Travel History
                </Link>
              </li>
              <li>
                <Link href="/fleet" className="hover:text-cyan-300 flex items-center gap-2 transition-colors">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" /> Fleet Hub & V2V Radio
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="hover:text-cyan-300 flex items-center gap-2 transition-colors">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" /> Voice Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: High-Seas Emergency & Radio Mesh */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-rose-300 uppercase tracking-widest font-mono">Emergency Network</h3>
            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <ShieldAlert className="w-4 h-4" /> Global V2V Channel 16
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Real-time inter-ship emergency broadcast active via Supabase Cloud Realtime mesh.
              </p>
              <div className="text-[10px] font-mono text-cyan-300 pt-1 border-t border-rose-900/40">
                NTFY: <span className="text-emerald-400 font-bold">blueguard_maritime_emergency</span>
              </div>
            </div>
          </div>

          {/* Col 4: Hackathon / SIH Notice & Credentials */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-widest font-mono">Hackathon Information</h3>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 text-xs space-y-1.5 font-mono">
              <p className="text-slate-400">Problem Statement:</p>
              <p className="text-white font-bold">SIH26176 - Marine AI</p>
              <p className="text-slate-400 pt-2">Repository:</p>
              <a 
                href="https://github.com/trikysaran5721-oss/bluegaurd-ai" 
                target="_blank" 
                rel="noreferrer"
                className="text-cyan-400 underline truncate block hover:text-cyan-300"
              >
                trikysaran5721-oss/bluegaurd-ai
              </a>
            </div>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 BlueGuard Marine Intelligence (SIH26176). All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Built for High-Seas Operations</span>
            <span>•</span>
            <span className="text-cyan-400 font-mono">Web Audio & Realtime Enabled</span>
          </div>
        </div>

      </div>

    </footer>
  );
}
