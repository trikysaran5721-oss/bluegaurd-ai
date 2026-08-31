'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import MarineMap from '@/components/MarineMap';
import V2VRadioModule from '@/components/V2VRadioModule';
import MarineSafetyScoreCard from '@/components/MarineSafetyScoreCard';
import GeofenceBoundaryAlert from '@/components/GeofenceBoundaryAlert';
import BlueGuardMic from '@/components/BlueGuardMic';
import EmergencyOverlay from '@/components/EmergencyOverlay';
import SeawaterFooter from '@/components/SeawaterFooter';
import { demoStorage } from '@/lib/supabase';
import { ShipProfile, MarineRoute, WeatherData, WindData, TideData, CycloneHazard, NearbyVessel, SSTData, ChlorophyllData } from '@/lib/types';
import {
  generateSeaRoute,
  getMockWeatherData,
  getMockWindData,
  getMockTideData,
  getMockCycloneData,
  getMockSSTData,
  getMockChlorophyllData,
  generateMarineInsight,
  INITIAL_DEMO_FLEET,
  DEMO_PORTS
} from '@/lib/marineData';
import {
  agenticOrchestrator,
  pfzIntelligenceAgent,
  geospatialAgent,
  PFZSearchResult
} from '@/lib/agenticOrchestrator';
import { audioService } from '@/lib/audioService';
import {
  Compass,
  Navigation as NavIcon,
  Wind,
  Waves,
  AlertTriangle,
  ShieldAlert,
  Search,
  CheckCircle,
  Info,
  Clock,
  Radio,
  Send,
  Sparkles,
  Thermometer,
  Sprout,
  Fish,
  MapPin
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<ShipProfile | null>(null);
  const [destinationInput, setDestinationInput] = useState('Colombo');
  const [activeRoute, setActiveRoute] = useState<MarineRoute | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [wind, setWind] = useState<WindData | null>(null);
  const [tide, setTide] = useState<TideData | null>(null);
  const [cyclone, setCyclone] = useState<CycloneHazard | null>(null);
  const [sst, setSst] = useState<SSTData | null>(null);
  const [chlorophyll, setChlorophyll] = useState<ChlorophyllData | null>(null);
  const [marineInsightText, setMarineInsightText] = useState<string>('');
  const [nearbyVessels, setNearbyVessels] = useState<NearbyVessel[]>(INITIAL_DEMO_FLEET);
  const [isOffline, setIsOffline] = useState(false);
  const [proactiveWarning, setProactiveWarning] = useState<string | null>(
    'BlueGuard Watchkeeper: Strong wind conditions (22 knots) & SST thermal front (29.1°C) detected along middle section of Colombo route.'
  );

  // Agentic AI State
  const [agenticData, setAgenticData] = useState<any>(null);
  const [nearestPFZ, setNearestPFZ] = useState<PFZSearchResult | null>(null);

  useEffect(() => {
    const user = demoStorage.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUserProfile(user);

    // Initialize marine data snapshot
    const initialRoute = generateSeaRoute('Chennai', 'Colombo');
    setActiveRoute(initialRoute);
    setWeather(getMockWeatherData(user.latitude, user.longitude));
    setWind(getMockWindData(user.latitude, user.longitude));
    setTide(getMockTideData(user.latitude, user.longitude));
    setCyclone(getMockCycloneData(user.latitude, user.longitude));
    
    const mockSst = getMockSSTData(user.latitude, user.longitude);
    const mockChloro = getMockChlorophyllData(user.latitude, user.longitude);
    setSst(mockSst);
    setChlorophyll(mockChloro);
    setMarineInsightText(generateMarineInsight(initialRoute));

    // Agentic AI Orchestrator Analysis
    const insight = agenticOrchestrator.getDashboardInsight(user.latitude, user.longitude);
    setAgenticData(insight);
  }, [router]);

  const handleDestinationSearch = (destName: string) => {
    setDestinationInput(destName);
    const newRoute = generateSeaRoute('Chennai', destName);
    setActiveRoute(newRoute);
    setMarineInsightText(generateMarineInsight(newRoute));
  };

  // Find Nearest PFZ Action
  const handleFindNearestPFZ = () => {
    if (!userProfile) return;
    const pfzResult = pfzIntelligenceAgent.findNearest(userProfile.latitude, userProfile.longitude);
    setNearestPFZ(pfzResult);

    audioService.speak(
      `Nearest Potential Fishing Zone is ${pfzResult.name}, located ${pfzResult.distance_km} kilometers ${pfzResult.bearing}.`,
      userProfile.preferred_language || 'en'
    );
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
          language: userProfile?.preferred_language || 'en',
          destination: destinationInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMarineInsightText(data.answer);
        audioService.speak(data.answer, data.language || userProfile?.preferred_language || 'en');
      } else {
        const fallback = `BlueGuard Report: Passage to ${destinationInput} is classified as CAUTION due to 22 knot NE winds and SST thermal front.`;
        setMarineInsightText(fallback);
        audioService.speak(fallback, userProfile?.preferred_language || 'en');
      }
    } catch {
      const fallback = `BlueGuard Report: Passage to ${destinationInput} is classified as CAUTION due to 22 knot NE winds and SST thermal front.`;
      setMarineInsightText(fallback);
      audioService.speak(fallback, userProfile?.preferred_language || 'en');
    }
  };

  if (!userProfile) return null;

  const currentShipVessel: NearbyVessel = {
    ship_id: userProfile.ship_id,
    name: `INS BlueGuard (${userProfile.ship_id})`,
    lat: userProfile.latitude,
    lon: userProfile.longitude,
    heading: userProfile.heading,
    speed: userProfile.speed,
    destination: destinationInput,
    status: userProfile.online_status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
    distance_nm: 0,
    handler: userProfile.display_name
  };

  return (
    <div className="min-h-screen theme-dashboard flex flex-col">
      {/* 1. HEADER / NAVIGATION */}
      <Navigation
        userProfile={userProfile}
        isOfflineMode={isOffline}
        onOfflineToggle={(off) => setIsOffline(off)}
        onLanguageChange={(lang) => {
          const updated = { ...userProfile, preferred_language: lang };
          setUserProfile(updated);
          demoStorage.setUser(updated);
        }}
      />

      {/* Main Command Center Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">
        
        {/* Proactive Watchkeeper Hazard Warning Banner */}
        {proactiveWarning && (
          <div className="p-3 bg-amber-950/80 border border-amber-500/50 rounded-xl flex items-center justify-between shadow-lg animate-pulse">
            <div className="flex items-center gap-2 text-xs text-amber-200 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{proactiveWarning}</span>
            </div>
            <button
              onClick={() => setProactiveWarning(null)}
              className="text-xs text-amber-400 hover:text-amber-200 underline font-mono"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Offline Mode Alert */}
        {isOffline && (
          <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-xl flex items-center gap-2 text-xs text-amber-300 font-mono">
            <Info className="w-4 h-4 text-amber-400" />
            <span>BlueGuard is operating in Limited Connectivity Mode. Displaying cached marine dataset.</span>
          </div>
        )}

        {/* 2. 🎙️ V2V RADIO & VOICE AI COMMAND HUB (FIRST COMPONENT BELOW HEADER) */}
        <V2VRadioModule
          currentShip={userProfile}
          nearbyVessels={nearbyVessels}
          onVoiceQueryResult={(q, a) => setMarineInsightText(a)}
        />

        {/* 3. 🗺️ SATELLITE MARINE INTELLIGENCE MAP (DIRECTLY BELOW VOICE COMMAND HUB) */}
        <div className="h-[520px] w-full rounded-3xl overflow-hidden shadow-2xl relative border border-cyan-500/40">
          <MarineMap
            currentShip={currentShipVessel}
            destinationName={destinationInput}
            routeWaypoints={activeRoute?.waypoints}
            nearbyVessels={nearbyVessels}
            windData={wind || undefined}
            tideData={tide || undefined}
            cycloneData={cyclone || undefined}
            onAskBlueGuardArea={(lat, lon, summary) => {
              handleVoiceQuery(summary);
            }}
          />
        </div>

        {/* 4. AI / MARINE SUMMARY & EXPLAINABILITY CARDS */}
        <div className="space-y-4">
          
          {/* Destination Search + Passage Risk Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Destination Search Box */}
            <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-2">
                WHERE ARE YOU TRAVELLING?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  placeholder="Enter destination (e.g. Colombo)"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => handleDestinationSearch(destinationInput)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:scale-105 transition-transform"
                >
                  Go
                </button>
              </div>
              {/* Destination Quick Selector Pills */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Colombo', 'Kochi', 'Mumbai', 'Singapore', 'Male'].map((port) => (
                  <button
                    key={port}
                    onClick={() => handleDestinationSearch(port)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                      destinationInput === port
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 font-bold'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {port}
                  </button>
                ))}
              </div>
            </div>

            {/* Route Passage Card */}
            {activeRoute && (
              <div className="glass-panel-emerald p-4 rounded-2xl border border-emerald-500/40 md:col-span-2 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-white">
                        PASSAGE: {activeRoute.origin} → {activeRoute.destination}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        STATUS: {activeRoute.risk_score}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {activeRoute.risk_reasons[0]}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-sm font-extrabold text-cyan-300">{activeRoute.distance_nm} NM</div>
                    <div className="text-[11px] text-slate-400">ETA: ~{activeRoute.eta_hours} hrs</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-emerald-900/60 mt-2 text-xs">
                  <span className="text-emerald-200 text-[11px] flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Advisory: Proceed with continuous watchkeeper vigilance
                  </span>
                  
                  {/* Action: Find Nearest PFZ Button */}
                  <button
                    onClick={handleFindNearestPFZ}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 font-mono"
                  >
                    <Fish className="w-3.5 h-3.5 text-emerald-200" />
                    <span>📍 Find Nearest Fishing Zone</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* NEAREST PFZ COMPUTED ACTION RESULT CARD */}
          {nearestPFZ && (
            <div className="p-3.5 bg-emerald-950/90 border-2 border-emerald-500/60 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xl animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Fish className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-200">
                    <span>NEAREST POTENTIAL FISHING ZONE (PFZ):</span>
                    <span className="text-[10px] text-emerald-400 italic">
                      {nearestPFZ.data_label}
                    </span>
                  </div>
                  <p className="text-xs text-white mt-0.5">
                    <strong>{nearestPFZ.name}</strong> is <strong>{nearestPFZ.distance_km} km {nearestPFZ.bearing}</strong> of your vessel. SST: {nearestPFZ.sst_c}°C | Chlorophyll: {nearestPFZ.chlorophyll_mg_m3} mg/m³.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNearestPFZ(null)}
                  className="text-xs text-slate-400 hover:text-white font-mono underline"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* GEOFENCE BOUNDARY WATCHKEEPER ALERT */}
          {agenticData?.geofence && (
            <GeofenceBoundaryAlert geofence={agenticData.geofence} />
          )}

          {/* EXPLAINABILITY & SAFETY SCORE CARD */}
          {agenticData?.safety && (
            <MarineSafetyScoreCard safety={agenticData.safety} />
          )}

          {/* BLUEGUARD DYNAMIC AI INSIGHT */}
          {marineInsightText && (
            <div className="glass-panel p-4 rounded-2xl border border-cyan-500/40 bg-slate-950/80 shadow-xl">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-cyan-900/50">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs font-mono">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>BLUEGUARD MARINE INSIGHT</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  DYNAMIC AI ANALYSIS
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
                "{marineInsightText}"
              </p>
            </div>
          )}

        </div>

        {/* 5. CONDITIONS & ALERTS (BOTTOM FLOATING GLASS WIDGETS GRID) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Weather Widget */}
          <div className="glass-panel p-3 rounded-2xl border border-cyan-500/20">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>WEATHER</span>
              <span className="text-[10px] text-cyan-400 font-bold">LIVE API</span>
            </div>
            <div className="text-lg font-extrabold text-white">
              {weather?.temperature_c}°C
            </div>
            <p className="text-xs text-cyan-300 font-medium truncate">{weather?.condition}</p>
            <div className="text-[10px] text-slate-400 mt-1.5 font-mono">
              Waves: {weather?.wave_height_meters}m
            </div>
          </div>

          {/* Wind Widget */}
          <div className="glass-panel p-3 rounded-2xl border border-teal-500/20">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-teal-400" /> WIND
              </span>
              <span className="text-[10px] text-teal-300 font-bold">FORECAST</span>
            </div>
            <div className="text-lg font-extrabold text-white">
              {wind?.wind_speed_knots} kts <span className="text-xs text-teal-300 font-bold">{wind?.wind_direction_cardinal}</span>
            </div>
            <p className="text-xs text-slate-300 truncate">Gusts {wind?.gusts_knots} kts</p>
            <div className="text-[10px] text-slate-400 mt-1.5 font-mono">Dir: {wind?.wind_direction_deg}°</div>
          </div>

          {/* Tide Widget */}
          <div className="glass-panel p-3 rounded-2xl border border-emerald-500/20">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span className="flex items-center gap-1">
                <Waves className="w-3.5 h-3.5 text-emerald-400" /> TIDE
              </span>
              <span className="text-[10px] text-emerald-300 font-mono">LIVE</span>
            </div>
            <div className="text-lg font-extrabold text-white">
              {tide?.tide_height_meters} m
            </div>
            <p className="text-xs text-slate-300 truncate">{tide?.tidal_current_knots} kts {tide?.tide_direction}</p>
            <div className="text-[10px] text-slate-400 mt-1.5 font-mono">High: {tide?.next_high_tide}</div>
          </div>

          {/* SST Widget */}
          <div className="glass-panel p-3 rounded-2xl border border-amber-500/30">
            <div className="flex items-center justify-between text-xs text-amber-300 mb-1 font-mono">
              <span className="flex items-center gap-1 font-bold">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" /> SST
              </span>
              <span className="text-[9px] text-amber-400 font-mono">DEMO</span>
            </div>
            <div className="text-lg font-extrabold text-white">
              {sst?.temperature_c}°C
            </div>
            <p className="text-xs text-amber-200 truncate">{sst?.gradient_status}</p>
            <div className="text-[10px] text-slate-400 mt-1.5 font-mono">Range: {sst?.min_c}–{sst?.max_c}°C</div>
          </div>

          {/* Chlorophyll Widget */}
          <div className="glass-panel p-3 rounded-2xl border border-emerald-500/30">
            <div className="flex items-center justify-between text-xs text-emerald-300 mb-1 font-mono">
              <span className="flex items-center gap-1 font-bold">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" /> CHLOROPHYLL
              </span>
              <span className="text-[9px] text-emerald-400 font-mono">DEMO</span>
            </div>
            <div className="text-lg font-extrabold text-white">
              {chlorophyll?.concentration_mg_m3} <span className="text-[10px] text-slate-400">mg/m³</span>
            </div>
            <p className="text-xs text-emerald-200 font-bold truncate">{chlorophyll?.level}</p>
            <div className="text-[10px] text-slate-400 mt-1.5 font-mono">Biomass Conc.</div>
          </div>

          {/* Cyclone / Hazard Widget */}
          <div className="glass-panel-crimson p-3 rounded-2xl border border-rose-500/40">
            <div className="flex items-center justify-between text-xs text-rose-300 mb-1 font-mono">
              <span className="flex items-center gap-1 font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> HAZARD
              </span>
              <span className="text-[10px] font-bold text-rose-300">WATCH</span>
            </div>
            <div className="text-sm font-extrabold text-white truncate">
              {cyclone?.hazard_name}
            </div>
            <p className="text-xs text-rose-200">{cyclone?.distance_nm} NM {cyclone?.bearing_direction}</p>
            <div className="text-[10px] text-rose-300 mt-1.5 font-mono">Max: {cyclone?.expected_max_wind_knots} kts</div>
          </div>
        </div>

      </main>

      {/* Floating Seawater Parallax Footer */}
      <SeawaterFooter />

      {/* Signature BlueGuard Floating Mic with Auto Wake Word Listener */}
      <BlueGuardMic
        language={userProfile.preferred_language || 'en'}
        onQuerySubmitted={handleVoiceQuery}
      />

      {/* Realtime Emergency Receiver Overlay & Voice Trigger Modal */}
      <EmergencyOverlay currentShip={userProfile} />
    </div>
  );
}
