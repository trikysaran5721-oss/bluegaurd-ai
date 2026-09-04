'use client';

import React, { useEffect, useState } from 'react';
import { Waypoint, NearbyVessel, CycloneHazard, WindData, TideData, SSTData, ChlorophyllData } from '@/lib/types';
import { getMockSSTData, getMockChlorophyllData, getMockWeatherData, PFZ_ZONES } from '@/lib/marineData';
import { geospatialAgent } from '@/lib/agenticOrchestrator';
import {
  Shield,
  Navigation,
  Wind,
  Waves,
  AlertTriangle,
  Ship,
  Compass,
  Radio,
  Thermometer,
  Sprout,
  Sparkles,
  X,
  MessageSquarePlus,
  Layers,
  MapPin,
  Globe,
  Eye,
  ShieldAlert
} from 'lucide-react';

interface MarineMapProps {
  currentShip: NearbyVessel;
  destinationName?: string;
  routeWaypoints?: Waypoint[];
  nearbyVessels?: NearbyVessel[];
  windData?: WindData;
  tideData?: TideData;
  cycloneData?: CycloneHazard;
  manualMode?: boolean;
  onMapClick?: (lat: number, lon: number) => void;
  highlightedShipId?: string | null;
  onAskBlueGuardArea?: (lat: number, lon: number, summary: string) => void;
}

// India - Sri Lanka International Maritime Boundary Line (IMBL) Precise Coordinates
const INDIA_SRILANKA_IMBL_COORDS: [number, number][] = [
  [10.30, 80.10], // Palk Strait North Entry
  [10.08, 79.86], // Palk Strait North
  [9.75, 79.54],  // Kachchatheevu North
  [9.50, 79.40],  // Palk Bay / Adam's Bridge Line
  [9.15, 79.25],  // Rameswaram South / Gulf of Mannar Entrance
  [8.60, 79.00],  // Gulf of Mannar Central
  [7.90, 78.50]   // Indian Ocean Deep South Boundary
];

// India - Maldives Maritime Boundary Line (South Arabian Sea)
const INDIA_MALDIVES_IMBL_COORDS: [number, number][] = [
  [7.20, 76.80],
  [6.80, 75.90],
  [6.20, 74.80]
];

// Sea Bathymetry Depth Contours for Visual Depth Differentiation
const BATHYMETRY_DEPTH_ZONES = [
  {
    name: 'Palk Bay Shallow Shoals (0 - 10m)',
    depthMeters: 7,
    color: '#06b6d4', // Bright Turquoise Cyan
    coords: [
      [10.10, 78.90],
      [10.20, 79.80],
      [9.40, 79.70],
      [9.20, 79.10]
    ] as [number, number][]
  },
  {
    name: 'Gulf of Mannar Continental Shelf (10 - 50m)',
    depthMeters: 32,
    color: '#0284c7', // Medium Ocean Blue
    coords: [
      [9.15, 78.20],
      [9.10, 79.20],
      [8.30, 78.80],
      [8.40, 77.80]
    ] as [number, number][]
  },
  {
    name: 'Bay of Bengal Deep Oceanic Slope (50 - 500m)',
    depthMeters: 240,
    color: '#1e40af', // Deep Royal Cobalt
    coords: [
      [11.50, 80.00],
      [12.00, 81.50],
      [9.50, 81.80],
      [9.60, 80.40]
    ] as [number, number][]
  },
  {
    name: 'Abyssal Deep Oceanic Trench (>1000m)',
    depthMeters: 1450,
    color: '#0f172a', // Midnight Dark Navy
    coords: [
      [7.50, 80.00],
      [8.00, 82.50],
      [5.50, 82.00],
      [5.50, 79.00]
    ] as [number, number][]
  }
];

export default function MarineMap({
  currentShip,
  destinationName,
  routeWaypoints = [],
  nearbyVessels = [],
  windData,
  tideData,
  cycloneData,
  manualMode = false,
  onMapClick,
  highlightedShipId,
  onAskBlueGuardArea
}: MarineMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapTileStyle, setMapTileStyle] = useState<'google_hybrid' | 'google_sat' | 'voyager' | 'dark'>('google_hybrid');

  // STRICT Checkbox-driven Layer Visibility: Zones ONLY highlight when checkbox is explicitly checked!
  const [layers, setLayers] = useState({
    route: true,
    vessels: true,
    imblBorder: true,       // 🚩 India-Sri Lanka IMBL Border Warning Line
    fishermanZone: true,    // 🐟 Safe PFZ & Hazard Fishing Zones
    bathymetry: true,       // 🌊 Sea Depth Contours & Bathymetry
    sst: false,             // 🌡️ Sea Surface Temp Heatmap (Unchecked by default for clean map)
    chlorophyll: false,     // 🌱 Chlorophyll Biomass Heatmap (Unchecked by default)
    wind: false,            // 💨 Wind Forecast Overlays
    cyclone: true           // 🌀 Cyclone Hazard Radius
  });

  const [selectedArea, setSelectedArea] = useState<{
    lat: number;
    lon: number;
    sst: SSTData;
    chlorophyll: ChlorophyllData;
    weather: any;
  } | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full min-h-[500px] bg-slate-950 rounded-2xl flex flex-col items-center justify-center border border-slate-800">
        <Compass className="w-12 h-12 text-cyan-400 animate-spin mb-3" />
        <p className="text-slate-400 text-sm font-medium">Initializing Google Marine Intelligence Command Map...</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Polygon, Tooltip, useMapEvents } = require('react-leaflet');
  const L = require('leaflet');

  const createCustomIcon = (emoji: string, color: string, isHighlighted: boolean = false) => {
    const size = isHighlighted ? 44 : 36;
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: 2px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isHighlighted ? '22px' : '18px'};
          box-shadow: 0 0 ${isHighlighted ? '25px #ef4444' : '12px ' + color};
          ${isHighlighted ? 'animation: crimsonPulse 1s infinite;' : ''}
        ">
          ${emoji}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  const shipIcon = createCustomIcon('🚢', '#0284c7');
  const highlightedShipIcon = createCustomIcon('🚨', '#dc2626', true);
  const vesselIcon = createCustomIcon('🛥️', '#0d9488');
  const waypointIcon = createCustomIcon('📍', '#8b5cf6');
  const destIcon = createCustomIcon('🏁', '#10b981');

  // Tile Providers (Google Maps & Clean Marine Voyager Charts)
  const TILE_PROVIDERS = {
    google_hybrid: {
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps Hybrid Imagery & NOAA Marine'
    },
    google_sat: {
      url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps Satellite'
    },
    voyager: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO Voyager Clean Marine Chart'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO Dark Navy Chart'
    }
  };

  // SST Grid Points
  const sstGridPoints = [
    { lat: 13.0, lon: 80.5, temp: 28.5 },
    { lat: 11.8, lon: 80.9, temp: 29.2 },
    { lat: 10.4, lon: 80.1, temp: 29.8 },
    { lat: 8.6, lon: 81.6, temp: 30.4 }
  ];

  // Chlorophyll Grid Points
  const chloroGridPoints = [
    { lat: 12.8, lon: 80.3, conc: 0.72, level: 'HIGH' },
    { lat: 11.2, lon: 80.4, conc: 0.48, level: 'MEDIUM' },
    { lat: 9.8, lon: 79.8, conc: 0.84, level: 'HIGH' }
  ];

  function MapEvents() {
    useMapEvents({
      click(e: any) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        if (manualMode && onMapClick) {
          onMapClick(lat, lon);
        } else {
          const sst = getMockSSTData(lat, lon);
          const chlorophyll = getMockChlorophyllData(lat, lon);
          const weather = getMockWeatherData(lat, lon);
          setSelectedArea({ lat, lon, sst, chlorophyll, weather });
        }
      }
    });
    return null;
  }

  const polylinePositions = routeWaypoints.map((wp) => [wp.lat, wp.lon] as [number, number]);

  const handleAskBlueGuardAreaClick = () => {
    if (!selectedArea) return;
    const summary = `What is happening in this area (Latitude: ${selectedArea.lat.toFixed(2)}° N, Longitude: ${selectedArea.lon.toFixed(2)}° E)?`;
    if (onAskBlueGuardArea) {
      onAskBlueGuardArea(selectedArea.lat, selectedArea.lon, summary);
    } else {
      window.dispatchEvent(new CustomEvent('blueguard:ask_area', { detail: { lat: selectedArea.lat, lon: selectedArea.lon, summary } }));
    }
  };

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl z-0">
      {/* 1. TOP LEFT: GOOGLE MAPS TILE SWITCHER & LAYER CHECKBOXES BAR */}
      <div className="absolute top-3 left-3 z-[100] glass-panel px-3 py-2.5 rounded-xl flex flex-wrap items-center gap-3 text-xs shadow-2xl border border-cyan-500/40">
        
        {/* Map Tile Style Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <Globe className="w-3.5 h-3.5 text-cyan-400 ml-1" />
          <button
            onClick={() => setMapTileStyle('google_hybrid')}
            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${mapTileStyle === 'google_hybrid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Google Hybrid
          </button>
          <button
            onClick={() => setMapTileStyle('google_sat')}
            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${mapTileStyle === 'google_sat' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Google Sat
          </button>
          <button
            onClick={() => setMapTileStyle('voyager')}
            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${mapTileStyle === 'voyager' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Clean Map
          </button>
        </div>

        <span className="h-4 w-[1px] bg-slate-700" />

        {/* STRICT CHECKBOX-DRIVEN LAYER TOGGLES: HIGHLIGHT ZONES ONLY WHEN CHECKED! */}
        <label className="flex items-center gap-1.5 cursor-pointer text-red-300 font-extrabold bg-red-950/80 px-2.5 py-1 rounded-lg border border-red-500/60 shadow-md animate-pulse">
          <input
            type="checkbox"
            checked={layers.imblBorder}
            onChange={(e) => setLayers({ ...layers, imblBorder: e.target.checked })}
            className="accent-red-500 rounded w-3.5 h-3.5"
          />
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>India-Sri Lanka IMBL Border</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-emerald-300 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/50">
          <input
            type="checkbox"
            checked={layers.fishermanZone}
            onChange={(e) => setLayers({ ...layers, fishermanZone: e.target.checked })}
            className="accent-emerald-400 rounded w-3.5 h-3.5"
          />
          <span>Fisherman PFZ Zones</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-cyan-300 font-bold bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/50">
          <input
            type="checkbox"
            checked={layers.bathymetry}
            onChange={(e) => setLayers({ ...layers, bathymetry: e.target.checked })}
            className="accent-cyan-400 rounded w-3.5 h-3.5"
          />
          <span>Sea Depth Bathymetry</span>
        </label>

        <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={layers.route}
            onChange={(e) => setLayers({ ...layers, route: e.target.checked })}
            className="accent-cyan-500 rounded"
          />
          Route
        </label>

        <label className="flex items-center gap-1 cursor-pointer text-amber-300 hover:text-amber-100">
          <input
            type="checkbox"
            checked={layers.sst}
            onChange={(e) => setLayers({ ...layers, sst: e.target.checked })}
            className="accent-amber-500 rounded"
          />
          SST Heatmap
        </label>

        <label className="flex items-center gap-1 cursor-pointer text-emerald-300 hover:text-emerald-100">
          <input
            type="checkbox"
            checked={layers.chlorophyll}
            onChange={(e) => setLayers({ ...layers, chlorophyll: e.target.checked })}
            className="accent-emerald-500 rounded"
          />
          Chlorophyll
        </label>
      </div>

      {/* 2. TOP RIGHT: GOOGLE MAPS LIVE METRICS WATERMARK */}
      <div className="absolute top-3 right-3 z-[100] glass-panel px-3 py-1.5 rounded-xl text-[11px] uppercase tracking-wider font-mono font-extrabold text-cyan-300 flex items-center gap-2 border border-cyan-500/40">
        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> GOOGLE MAPS LIVE MARITIME MESH
      </div>

      {/* 3. BOTTOM RIGHT: SEA DEPTH BATHYMETRY LEGEND (When Bathymetry Enabled) */}
      {layers.bathymetry && (
        <div className="absolute bottom-4 right-4 z-[100] glass-panel p-3 rounded-xl border border-cyan-500/40 font-mono text-[10px] text-cyan-200 flex flex-col gap-1.5 shadow-2xl">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300 border-b border-cyan-900 pb-1">
            <Waves className="w-4 h-4 text-cyan-400 animate-bounce" /> SEA DEPTH CONTUORS (BATHYMETRY)
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#06b6d4] border border-white/40" />
              <span>0m - 10m: Shallow Palk Bay / Coastal Waters</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#0284c7] border border-white/40" />
              <span>10m - 50m: Continental Shelf Shelf Waters</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#1e40af] border border-white/40" />
              <span>50m - 500m: Bay of Bengal Oceanic Slope</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#0f172a] border border-white/40" />
              <span>&gt; 1000m: Deep Ocean Abyssal Trench</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. AREA INTELLIGENCE GLASS POPUP ON MAP CLICK */}
      {selectedArea && (
        <div className="absolute top-16 left-4 z-[1000] w-80 glass-panel p-4 rounded-2xl border-2 border-cyan-500/60 shadow-2xl animate-in fade-in zoom-in backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2 mb-3">
            <h4 className="text-xs font-bold font-mono text-cyan-300 flex items-center gap-1.5 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> AREA INTELLIGENCE
            </h4>
            <button onClick={() => setSelectedArea(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 font-mono text-[11px] text-slate-300 mb-4 bg-slate-950/90 p-3 rounded-xl border border-slate-800">
            <p><span className="text-slate-500">Latitude:</span> <span className="text-cyan-300">{selectedArea.lat.toFixed(4)}° N</span></p>
            <p><span className="text-slate-500">Longitude:</span> <span className="text-cyan-300">{selectedArea.lon.toFixed(4)}° E</span></p>
            <p><span className="text-slate-500">Sea Depth:</span> <span className="text-cyan-400 font-bold">14.5 meters (Shallow Shelf)</span></p>
            <p><span className="text-slate-500">SST:</span> <span className="text-amber-300 font-bold">{selectedArea.sst.temperature_c}°C</span> ({selectedArea.sst.gradient_status})</p>
            <p><span className="text-slate-500">Chlorophyll:</span> <span className="text-emerald-400 font-bold">{selectedArea.chlorophyll.concentration_mg_m3} mg/m³</span> ({selectedArea.chlorophyll.level})</p>
            <p><span className="text-slate-500">IMBL Distance:</span> <span className="text-red-400 font-bold">12.4 km to Sri Lanka Border</span></p>
            <p><span className="text-slate-500">Wind & Wave:</span> 22 kts NE | 1.8m Swell</p>
          </div>

          <button
            onClick={handleAskBlueGuardAreaClick}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 rounded-xl text-white font-extrabold text-xs shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all flex items-center justify-center gap-1.5"
          >
            <MessageSquarePlus className="w-4 h-4" /> ASK BLUEGUARD AI ABOUT THIS SPOT
          </button>
        </div>
      )}

      {/* 5. LEAFLET / GOOGLE MAP CONTAINER */}
      <MapContainer
        center={[currentShip.lat, currentShip.lon]}
        zoom={7}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '520px' }}
      >
        <MapEvents />

        {/* Dynamic Map Tiles (Google Maps Hybrid / Sat / Voyager) */}
        <TileLayer
          attribution={TILE_PROVIDERS[mapTileStyle].attribution}
          url={TILE_PROVIDERS[mapTileStyle].url}
        />

        {/* 🌊 SEA DEPTH BATHYMETRY POLYGON CONTOURS (ONLY IF CHECKBOX CHECKED!) */}
        {layers.bathymetry &&
          BATHYMETRY_DEPTH_ZONES.map((zone, idx) => (
            <Polygon
              key={`bathy-${idx}`}
              positions={zone.coords}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: 0.35,
                weight: 1.5
              }}
            >
              <Tooltip permanent={false}>
                🌊 {zone.name} (Estimated Depth: ~{zone.depthMeters}m)
              </Tooltip>
            </Polygon>
          ))}

        {/* 🚩 INDIA - SRI LANKA INTERNATIONAL MARITIME BOUNDARY LINE (IMBL) (ONLY IF CHECKBOX CHECKED!) */}
        {layers.imblBorder && (
          <>
            {/* Outer Glowing Danger Corridor Buffer */}
            <Polyline
              positions={INDIA_SRILANKA_IMBL_COORDS}
              pathOptions={{
                color: '#ef4444',
                weight: 12,
                opacity: 0.25
              }}
            />
            {/* Core Bright Crimson Border Line */}
            <Polyline
              positions={INDIA_SRILANKA_IMBL_COORDS}
              pathOptions={{
                color: '#dc2626',
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.95
              }}
            >
              <Tooltip permanent={true} direction="top">
                🚨 CRITICAL MARITIME BOUNDARY LINE: INDIA - SRI LANKA IMBL (DO NOT CROSS - ARREST HAZARD) 🇮🇳 🇱🇰
              </Tooltip>
            </Polyline>

            {/* India - Maldives Secondary Boundary Line */}
            <Polyline
              positions={INDIA_MALDIVES_IMBL_COORDS}
              pathOptions={{
                color: '#f59e0b',
                weight: 3,
                dashArray: '6, 6',
                opacity: 0.85
              }}
            >
              <Tooltip permanent={false}>
                ⚠️ India - Maldives Maritime Boundary Line 🇮🇳 🇲🇻
              </Tooltip>
            </Polyline>
          </>
        )}

        {/* 🐟 FISHERMAN PFZ ZONES (ONLY IF CHECKBOX CHECKED!) */}
        {layers.fishermanZone &&
          PFZ_ZONES.map((zone) => {
            const distKm = Math.round(
              geospatialAgent.calculateDistanceKm(currentShip.lat, currentShip.lon, zone.lat, zone.lon) * 10
            ) / 10;

            const color =
              zone.type === 'SAFE_PFZ'
                ? '#10b981'
                : zone.type === 'CAUTION_ZONE'
                ? '#f59e0b'
                : '#ef4444';

            return (
              <Circle
                key={zone.id}
                center={[zone.lat, zone.lon]}
                radius={zone.radius_km * 1000}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.32,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="p-2 text-slate-900 text-xs space-y-1.5 max-w-xs font-sans">
                    <div className="flex items-center justify-between font-mono border-b pb-1">
                      <span className="font-extrabold text-cyan-900 flex items-center gap-1">
                        🐟 {zone.name}
                      </span>
                      <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-bold">
                        {zone.type}
                      </span>
                    </div>

                    <div className="font-mono text-[11px] bg-slate-100 p-2 rounded space-y-0.5">
                      <p>📍 <strong>Distance:</strong> {distKm} km</p>
                      <p>🌡️ <strong>SST:</strong> {zone.sst_c}°C</p>
                      <p>🌿 <strong>Chlorophyll:</strong> {zone.chlorophyll} mg/m³</p>
                      <p>🐟 <strong>Species:</strong> {zone.fish_species.join(', ')}</p>
                    </div>

                    <button
                      onClick={() => {
                        if (onAskBlueGuardArea) {
                          onAskBlueGuardArea(
                            zone.lat,
                            zone.lon,
                            `Analyze fishing conditions for ${zone.name} (SST ${zone.sst_c}°C, Chlorophyll ${zone.chlorophyll} mg/m³).`
                          );
                        }
                      }}
                      className="w-full py-1 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded text-[11px] flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-200" /> Ask Blue Guard AI
                    </button>
                  </div>
                </Popup>
              </Circle>
            );
          })}

        {/* 🌡️ SST HEATMAP (ONLY IF CHECKBOX CHECKED!) */}
        {layers.sst &&
          sstGridPoints.map((pt, idx) => (
            <Circle
              key={`sst-${idx}`}
              center={[pt.lat, pt.lon]}
              radius={45000}
              pathOptions={{
                color: pt.temp > 30.0 ? '#ef4444' : pt.temp > 29.0 ? '#f59e0b' : '#06b6d4',
                fillColor: pt.temp > 30.0 ? '#f87171' : pt.temp > 29.0 ? '#fbbf24' : '#22d3ee',
                fillOpacity: 0.35,
                weight: 1
              }}
            >
              <Tooltip permanent={false}>
                🌡️ SST: {pt.temp}°C
              </Tooltip>
            </Circle>
          ))}

        {/* 🌱 CHLOROPHYLL HEATMAP (ONLY IF CHECKBOX CHECKED!) */}
        {layers.chlorophyll &&
          chloroGridPoints.map((pt, idx) => (
            <Circle
              key={`chloro-${idx}`}
              center={[pt.lat, pt.lon]}
              radius={35000}
              pathOptions={{
                color: pt.level === 'HIGH' ? '#10b981' : '#14b8a6',
                fillColor: pt.level === 'HIGH' ? '#34d399' : '#2dd4bf',
                fillOpacity: 0.30,
                weight: 1
              }}
            >
              <Tooltip permanent={false}>
                🌱 Chlorophyll: {pt.conc} mg/m³ ({pt.level})
              </Tooltip>
            </Circle>
          ))}

        {/* 🚢 CURRENT SHIP MARKER */}
        <Marker
          position={[currentShip.lat, currentShip.lon]}
          icon={highlightedShipId === currentShip.ship_id ? highlightedShipIcon : shipIcon}
        >
          <Popup className="custom-popup">
            <div className="p-1 text-slate-900 font-sans">
              <div className="font-bold text-sm text-cyan-800">🚢 INS BlueGuard ({currentShip.ship_id})</div>
              <div className="text-xs space-y-0.5 mt-1 text-slate-700">
                <p>Heading: <span className="font-semibold">{currentShip.heading}°</span></p>
                <p>Speed: <span className="font-semibold">{currentShip.speed} knots</span></p>
                <p>Destination: <span className="font-semibold">{destinationName || currentShip.destination}</span></p>
                <p>Status: <span className="font-bold text-emerald-600">ONLINE</span></p>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* 📍 ROUTE LINES (ONLY IF CHECKBOX CHECKED!) */}
        {layers.route && polylinePositions.length > 1 && (
          <>
            <Polyline
              positions={polylinePositions}
              pathOptions={{ color: '#06b6d4', weight: 4, opacity: 0.95, dashArray: '8, 8' }}
            />
            {routeWaypoints.map((wp, idx) => (
              <Marker
                key={`wp-${idx}`}
                position={[wp.lat, wp.lon]}
                icon={idx === routeWaypoints.length - 1 ? destIcon : waypointIcon}
              >
                <Tooltip permanent={false}>{wp.name}</Tooltip>
              </Marker>
            ))}
          </>
        )}

        {/* 🛥️ NEARBY FLEET VESSELS (ONLY IF CHECKBOX CHECKED!) */}
        {layers.vessels &&
          nearbyVessels.map((vessel) => {
            const isHigh = highlightedShipId === vessel.ship_id;
            return (
              <Marker
                key={vessel.ship_id}
                position={[vessel.lat, vessel.lon]}
                icon={isHigh ? highlightedShipIcon : vesselIcon}
              >
                <Popup>
                  <div className="p-1 text-slate-900 text-xs">
                    <p className="font-bold text-teal-800">{vessel.name}</p>
                    <p>Ship ID: <span className="font-mono">{vessel.ship_id}</span></p>
                    <p>Distance: <span className="font-semibold">{vessel.distance_nm} NM</span></p>
                    <p>Heading: {vessel.heading}° | Speed: {vessel.speed} kts</p>
                    <p>Destination: {vessel.destination}</p>
                    {isHigh && <p className="font-bold text-red-600 mt-1">🚨 EMERGENCY DISTRESS ACTIVE</p>}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 🌀 CYCLONE HAZARD ZONE (ONLY IF CHECKBOX CHECKED!) */}
        {layers.cyclone && cycloneData && (
          <Circle
            center={[cycloneData.center_coordinates.lat, cycloneData.center_coordinates.lon]}
            radius={cycloneData.affected_radius_nm * 1852}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#f87171',
              fillOpacity: 0.25,
              weight: 2,
              dashArray: '5, 5'
            }}
          >
            <Tooltip permanent={true}>
              🌀 {cycloneData.hazard_name} ({cycloneData.status})
            </Tooltip>
          </Circle>
        )}
      </MapContainer>
    </div>
  );
}
