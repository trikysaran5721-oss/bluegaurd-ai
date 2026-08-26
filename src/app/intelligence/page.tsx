'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import MarineMap from '@/components/MarineMap';
import BlueGuardMic from '@/components/BlueGuardMic';
import EmergencyOverlay from '@/components/EmergencyOverlay';
import { demoStorage } from '@/lib/supabase';
import { ShipProfile, MarineRoute, SSTData, ChlorophyllData, ScenarioSimulation, RouteComparison } from '@/lib/types';
import {
  generateSeaRoute,
  getMockSSTData,
  getMockChlorophyllData,
  getMockWhatIfScenario,
  getMockRouteComparison,
  generateMarineInsight,
  INITIAL_DEMO_FLEET,
  DEMO_PORTS
} from '@/lib/marineData';
import { audioService } from '@/lib/audioService';
import {
  Sparkles,
  Thermometer,
  Sprout,
  Wind,
  Waves,
  ShieldAlert,
  HelpCircle,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Send,
  Radio,
  Compass,
  ArrowRight
} from 'lucide-react';

export default function MarineIntelligencePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<ShipProfile | null>(null);
  const [activeRoute, setActiveRoute] = useState<MarineRoute | null>(null);
  const [sst, setSst] = useState<SSTData | null>(null);
  const [chlorophyll, setChlorophyll] = useState<ChlorophyllData | null>(null);
  const [insightText, setInsightText] = useState('');
  
  // Scenario Analysis state
  const [extraWindInput, setExtraWindInput] = useState<number>(12);
  const [scenarioResult, setScenarioResult] = useState<ScenarioSimulation | null>(null);

  // Route Comparison state
  const [destA, setDestA] = useState<string>('Colombo');
  const [destB, setDestB] = useState<string>('Kochi');
  const [comparisonResult, setComparisonResult] = useState<RouteComparison | null>(null);

  useEffect(() => {
    const user = demoStorage.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUserProfile(user);

    const route = generateSeaRoute('Chennai', 'Colombo');
    setActiveRoute(route);

    const mockSst = getMockSSTData(user.latitude, user.longitude);
    const mockChloro = getMockChlorophyllData(user.latitude, user.longitude);
    setSst(mockSst);
    setChlorophyll(mockChloro);
    setInsightText(generateMarineInsight(route));

    // Initialize initial What-If & Comparison
    setScenarioResult(getMockWhatIfScenario(12));
    setComparisonResult(getMockRouteComparison('Chennai', 'Colombo', 'Kochi'));
  }, [router]);

  const handleRunScenario = (windIncrease: number) => {
    setExtraWindInput(windIncrease);
    const sim = getMockWhatIfScenario(windIncrease);
    setScenarioResult(sim);
  };

  const handleCompareRoutes = () => {
    const comp = getMockRouteComparison('Chennai', destA, destB);
    setComparisonResult(comp);
  };

  const handleVoiceQuery = async (queryText: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${apiUrl}/api/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          ship_id: userProfile?.ship_id || '123456789012',
          language: userProfile?.preferred_language || 'en'
        })
      });

      if (res.ok) {
        const data = await res.json();
        audioService.speak(data.answer, data.language);
      } else {
        audioService.speak(
          "BlueGuard Intelligence: Current sea-surface temperature varies between 28.5°C and 30.1°C with medium chlorophyll levels.",
          userProfile?.preferred_language || 'en'
        );
      }
    } catch {
      audioService.speak(
        "BlueGuard Intelligence: Current sea-surface temperature varies between 28.5°C and 30.1°C with medium chlorophyll levels.",
        userProfile?.preferred_language || 'en'
      );
    }
  };

  if (!userProfile) return null;

  return (
    <div className="min-h-screen theme-dashboard flex flex-col">
      <Navigation userProfile={userProfile} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-6 pb-24">
        {/* Header Title Banner */}
        <div className="glass-panel-emerald p-6 rounded-3xl border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                MARINE INTELLIGENCE & DECISION-SUPPORT
              </h1>
              <p className="text-xs text-emerald-300 font-mono mt-0.5">
                Sea Surface Temp (SST) + Chlorophyll + Weather + Wind + Tide + Cyclone + Traffic
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-3 py-1 rounded-full border border-cyan-800 font-mono font-bold flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> DEMO MARINE DATASET
            </span>
          </div>
        </div>

        {/* 🤖 DYNAMIC MARINE INSIGHT CARD */}
        {insightText && (
          <div className="glass-panel p-5 rounded-2xl border-2 border-cyan-500/40 bg-slate-950/80 shadow-2xl">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-cyan-900/60">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs font-mono">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-bounce" />
                <span>DYNAMIC MARINE INSIGHT</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">CONFIDENCE: HIGH</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
              "{insightText}"
            </p>
          </div>
        )}

        {/* DOMINANT SATELLITE MAP WITH SST & CHLOROPHYLL HEATMAPS */}
        <div className="h-[480px] w-full rounded-2xl overflow-hidden shadow-2xl relative border border-slate-800">
          <MarineMap
            currentShip={{
              ship_id: userProfile.ship_id,
              name: `INS BlueGuard (${userProfile.ship_id})`,
              lat: userProfile.latitude,
              lon: userProfile.longitude,
              heading: userProfile.heading,
              speed: userProfile.speed,
              destination: 'Colombo',
              status: 'ONLINE',
              distance_nm: 0,
              handler: userProfile.display_name
            }}
            destinationName="Colombo"
            routeWaypoints={activeRoute?.waypoints}
            nearbyVessels={INITIAL_DEMO_FLEET}
            onAskBlueGuardArea={(lat, lon, summary) => {
              handleVoiceQuery(summary);
            }}
          />
        </div>

        {/* SECTION 1: WHAT IF? SCENARIO ANALYSIS SIMULATION */}
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-amber-900/50">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-amber-100 uppercase tracking-wider">
              "WHAT IF?" SCENARIO ANALYSIS SIMULATION
            </h3>
            <span className="ml-auto text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
              SIMULATION / SCENARIO
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-4 font-sans">
            Test how route safety changes under extreme weather or wind escalation. Results are clearly marked as simulated.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-xs font-mono text-slate-400">Simulate Wind Increase:</span>
            {[
              { label: '+6 Kts (28 Kts Total)', val: 6 },
              { label: '+12 Kts (34 Kts Total)', val: 12 },
              { label: '+20 Kts (42 Kts Total)', val: 20 }
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => handleRunScenario(opt.val)}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                  extraWindInput === opt.val
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {scenarioResult && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/50 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-300 text-sm">{scenarioResult.simulation_title}</span>
                <span className={`px-2.5 py-1 rounded font-bold ${
                  scenarioResult.simulated_risk === 'HIGH RISK' ? 'bg-red-950 text-red-300 border border-red-500' : 'bg-amber-950 text-amber-300 border border-amber-500'
                }`}>
                  SIMULATED RISK: {scenarioResult.simulated_risk}
                </span>
              </div>

              <p className="text-slate-300"><span className="text-slate-500">Affected Route Section:</span> {scenarioResult.affected_section}</p>
              <p className="text-amber-200 font-sans italic text-xs leading-relaxed">"{scenarioResult.recommendation}"</p>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
                <span>⚠️ {scenarioResult.disclaimer}</span>
                <span>DATA: DETERMINISTIC MARITIME MODEL</span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: ROUTE COMPARISON MATRIX */}
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/40 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyan-900/50">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-extrabold text-cyan-100 uppercase tracking-wider">
                ROUTE COMPARISON MATRIX
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <select
                value={destA}
                onChange={(e) => setDestA(e.target.value)}
                className="bg-slate-950 border border-cyan-500/40 rounded-lg px-2 py-1 text-cyan-200"
              >
                {Object.keys(DEMO_PORTS).map((p) => (
                  <option key={p} value={p}>Route A: {p}</option>
                ))}
              </select>
              <span className="text-slate-500">VS</span>
              <select
                value={destB}
                onChange={(e) => setDestB(e.target.value)}
                className="bg-slate-950 border border-cyan-500/40 rounded-lg px-2 py-1 text-cyan-200"
              >
                {Object.keys(DEMO_PORTS).map((p) => (
                  <option key={p} value={p}>Route B: {p}</option>
                ))}
              </select>
              <button
                onClick={handleCompareRoutes}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg"
              >
                Compare
              </button>
            </div>
          </div>

          {comparisonResult && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                      <th className="p-3">METRIC</th>
                      <th className="p-3 text-cyan-300">ROUTE A ({comparisonResult.route_a.name})</th>
                      <th className="p-3 text-teal-300">ROUTE B ({comparisonResult.route_b.name})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">Distance (NM)</td>
                      <td className="p-3 font-bold">{comparisonResult.route_a.distance_nm} NM</td>
                      <td className="p-3 font-bold">{comparisonResult.route_b.distance_nm} NM</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">Wind Exposure</td>
                      <td className="p-3 text-amber-300">{comparisonResult.route_a.wind}</td>
                      <td className="p-3 text-emerald-400">{comparisonResult.route_b.wind}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">SST Temperature</td>
                      <td className="p-3">{comparisonResult.route_a.sst}</td>
                      <td className="p-3">{comparisonResult.route_b.sst}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">Chlorophyll Biomass</td>
                      <td className="p-3">{comparisonResult.route_a.chlorophyll}</td>
                      <td className="p-3">{comparisonResult.route_b.chlorophyll}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">Nearby Vessels</td>
                      <td className="p-3">{comparisonResult.route_a.vessels} Ships</td>
                      <td className="p-3">{comparisonResult.route_b.vessels} Ships</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">Overall Risk Score</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500 rounded font-bold">{comparisonResult.route_a.risk}</span></td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 rounded font-bold">{comparisonResult.route_b.risk}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/40 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-200 font-sans italic leading-relaxed">
                  "{comparisonResult.comparison_insight}"
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <BlueGuardMic
        language={userProfile.preferred_language}
        onQuerySubmitted={handleVoiceQuery}
      />

      <EmergencyOverlay currentShip={userProfile} />
    </div>
  );
}
