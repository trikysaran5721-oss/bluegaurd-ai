'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import MarineMap from '@/components/MarineMap';
import SeawaterFooter from '@/components/SeawaterFooter';
import { demoStorage } from '@/lib/supabase';
import { ShipProfile, Waypoint, NearbyVessel, ScenarioSimulation } from '@/lib/types';
import { calculateDistanceNM, INITIAL_DEMO_FLEET, getMockWhatIfScenario, getMockSSTData, getMockChlorophyllData } from '@/lib/marineData';
import { Navigation as NavIcon, Plus, Trash2, Undo2, Save, Play, CheckCircle2, AlertTriangle, Bookmark, HelpCircle, Thermometer, Sprout, Wind, Waves, ShieldAlert, Sparkles } from 'lucide-react';

interface SavedRouteItem {
  id: string;
  name: string;
  waypoints: Waypoint[];
  distance_nm: number;
  risk: string;
}

export default function RouteBuilderPage() {
  const [userProfile, setUserProfile] = useState<ShipProfile | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    { name: 'Start: Chennai Port', lat: 13.0827, lon: 80.2707 }
  ]);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [scenarioResult, setScenarioResult] = useState<ScenarioSimulation | null>(null);
  const [routeName, setRouteName] = useState('Custom Chennai Passage');
  const [savedRoutes, setSavedRoutes] = useState<SavedRouteItem[]>([]);

  useEffect(() => {
    const user = demoStorage.getUser();
    setUserProfile(user);

    setSavedRoutes([
      {
        id: 'saved-1',
        name: 'Chennai → Colombo Safe Offshore Passage',
        waypoints: [
          { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
          { name: 'Offshore Waypoint 1', lat: 10.4, lon: 80.1 },
          { name: 'Colombo', lat: 6.9271, lon: 79.8612 }
        ],
        distance_nm: 340.5,
        risk: 'SAFE'
      }
    ]);
  }, []);

  const handleMapClick = (lat: number, lon: number) => {
    const count = waypoints.length;
    const newWp: Waypoint = {
      name: `Waypoint ${count}`,
      lat: Math.round(lat * 10000) / 10000,
      lon: Math.round(lon * 10000) / 10000
    };
    setWaypoints((prev) => [...prev, newWp]);
    setAnalysisResult(null);
  };

  const handleUndo = () => {
    if (waypoints.length > 1) {
      setWaypoints((prev) => prev.slice(0, prev.length - 1));
      setAnalysisResult(null);
    }
  };

  const handleClear = () => {
    setWaypoints([{ name: 'Start: Chennai Port', lat: 13.0827, lon: 80.2707 }]);
    setAnalysisResult(null);
  };

  const calculateTotalDistance = () => {
    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      total += calculateDistanceNM(
        waypoints[i].lat,
        waypoints[i].lon,
        waypoints[i + 1].lat,
        waypoints[i + 1].lon
      );
    }
    return Math.round(total * 10) / 10;
  };

  const handleAnalyzeRoute = () => {
    const dist = calculateTotalDistance();
    const sst = getMockSSTData(13.0827, 80.2707);
    const chloro = getMockChlorophyllData(13.0827, 80.2707);

    setAnalysisResult({
      distance: dist,
      weather: 'Moderate',
      wind: '22 knots NE',
      tide: '1.8 m',
      sst: `${sst.temperature_c}°C (${sst.gradient_status})`,
      chlorophyll: `${chloro.concentration_mg_m3} mg/m³ (${chloro.level})`,
      cyclone: 'No major cyclone hazard detected',
      nearby_vessels: 4,
      overall_risk: dist > 300 ? 'CAUTION' : 'SAFE'
    });
  };

  const handleRunWhatIf = () => {
    const sim = getMockWhatIfScenario(12);
    setScenarioResult(sim);
  };

  const handleSaveRoute = () => {
    const dist = calculateTotalDistance();
    const newSaved: SavedRouteItem = {
      id: `saved-${Date.now()}`,
      name: routeName || `Manual Route ${savedRoutes.length + 1}`,
      waypoints,
      distance_nm: dist,
      risk: dist > 300 ? 'CAUTION' : 'SAFE'
    };

    setSavedRoutes((prev) => [newSaved, ...prev]);
    alert(`Route "${newSaved.name}" saved successfully!`);
  };

  if (!userProfile) return null;

  const currentShipVessel: NearbyVessel = {
    ship_id: userProfile.ship_id,
    name: `INS BlueGuard (${userProfile.ship_id})`,
    lat: userProfile.latitude,
    lon: userProfile.longitude,
    heading: userProfile.heading,
    speed: userProfile.speed,
    destination: 'Custom Route',
    status: 'ONLINE',
    distance_nm: 0,
    handler: userProfile.display_name
  };

  return (
    <div className="min-h-screen theme-dashboard flex flex-col">
      <Navigation userProfile={userProfile} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">
        {/* Header Title */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-teal-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent flex items-center gap-2">
              <NavIcon className="w-6 h-6 text-teal-400" /> MANUAL SEA ROUTE CREATOR & ROUTE INTELLIGENCE
            </h1>
            <p className="text-xs text-slate-400">Click anywhere on the satellite map to add custom waypoints</p>
          </div>

          {/* Action Control Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={waypoints.length <= 1}
              className="px-3 py-2 rounded-xl glass-button text-xs text-slate-300 font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Undo2 className="w-4 h-4 text-cyan-400" /> Undo Point
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-2 rounded-xl glass-button text-xs text-rose-300 font-semibold flex items-center gap-1.5 hover:bg-rose-950/40"
            >
              <Trash2 className="w-4 h-4 text-rose-400" /> Clear Route
            </button>
            <button
              onClick={handleAnalyzeRoute}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <Play className="w-4 h-4" /> Analyze Route
            </button>
            <button
              onClick={handleRunWhatIf}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" /> WHAT IF?
            </button>
          </div>
        </div>

        {/* BLUEGUARD ROUTE INTELLIGENCE SUMMARY DISPLAY */}
        {analysisResult && (
          <div className="p-5 glass-panel-emerald rounded-2xl border-2 border-emerald-500/50 space-y-3 font-mono text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
              <span className="font-extrabold text-emerald-300 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> BLUEGUARD ROUTE INTELLIGENCE
              </span>
              <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-500 rounded font-bold">
                OVERALL: {analysisResult.overall_risk}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-200">
              <div><span className="text-slate-500 uppercase">Distance:</span> <p className="font-bold text-cyan-300">{analysisResult.distance} NM</p></div>
              <div><span className="text-slate-500 uppercase">Weather:</span> <p className="font-bold text-slate-200">{analysisResult.weather}</p></div>
              <div><span className="text-slate-500 uppercase">Wind:</span> <p className="font-bold text-teal-300">{analysisResult.wind}</p></div>
              <div><span className="text-slate-500 uppercase">Tide:</span> <p className="font-bold text-emerald-400">{analysisResult.tide}</p></div>
              <div><span className="text-slate-500 uppercase">SST:</span> <p className="font-bold text-amber-300">{analysisResult.sst}</p></div>
              <div><span className="text-slate-500 uppercase">Chlorophyll:</span> <p className="font-bold text-emerald-300">{analysisResult.chlorophyll}</p></div>
              <div><span className="text-slate-500 uppercase">Cyclone:</span> <p className="font-bold text-slate-300">{analysisResult.cyclone}</p></div>
              <div><span className="text-slate-500 uppercase">Nearby Vessels:</span> <p className="font-bold text-cyan-300">{analysisResult.nearby_vessels} Ships</p></div>
            </div>
          </div>
        )}

        {/* WHAT IF SIMULATION RESULT */}
        {scenarioResult && (
          <div className="p-5 glass-panel rounded-2xl border-2 border-amber-500/50 space-y-2 font-mono text-xs bg-slate-950/90 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-amber-900/60 pb-2">
              <span className="font-extrabold text-amber-300 text-sm">{scenarioResult.simulation_title}</span>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-bold">
                SCENARIO / SIMULATION
              </span>
            </div>
            <p className="text-slate-300"><span className="text-slate-500">Simulated Risk:</span> <span className="font-bold text-red-400">{scenarioResult.simulated_risk}</span></p>
            <p className="text-slate-300"><span className="text-slate-500">Affected Section:</span> {scenarioResult.affected_section}</p>
            <p className="text-amber-200 font-sans italic">"{scenarioResult.recommendation}"</p>
          </div>
        )}

        {/* Main Grid: Interactive Map + Waypoint Sequence Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Interactive Satellite Map (2 cols) */}
          <div className="lg:col-span-2 h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <MarineMap
              currentShip={currentShipVessel}
              routeWaypoints={waypoints}
              nearbyVessels={INITIAL_DEMO_FLEET}
              manualMode={true}
              onMapClick={handleMapClick}
            />
          </div>

          {/* Waypoints Sequence & Save Panel */}
          <div className="glass-panel p-4 rounded-2xl border border-teal-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <h3 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider">
                  WAYPOINT PATH ({waypoints.length})
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {calculateTotalDistance()} NM
                </span>
              </div>

              {/* Waypoint Cards List */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {waypoints.map((wp, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-teal-400 mr-2">#{idx + 1}</span>
                      <span className="text-slate-200 font-medium">{wp.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {wp.lat.toFixed(2)}°, {wp.lon.toFixed(2)}°
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Route Section */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="Route Name"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleSaveRoute}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Manual Route
              </button>
            </div>
          </div>
        </div>

        {/* Saved Routes List Section */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-cyan-400" /> SAVED MANUAL ROUTES
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedRoutes.map((sr) => (
              <div key={sr.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-200">{sr.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Waypoints: {sr.waypoints.length} | Distance: {sr.distance_nm} NM
                  </p>
                </div>
                <button
                  onClick={() => setWaypoints(sr.waypoints)}
                  className="px-3 py-1 bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg font-bold hover:bg-cyan-600/50"
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SeawaterFooter />
    </div>
  );
}
