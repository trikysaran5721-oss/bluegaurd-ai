'use client';

import React, { useEffect, useState } from 'react';
import { Waypoint, NearbyVessel, CycloneHazard, WindData, TideData, SSTData, ChlorophyllData } from '@/lib/types';
import { getMockSSTData, getMockChlorophyllData, getMockWeatherData, PFZ_ZONES } from '@/lib/marineData';
import { geospatialAgent } from '@/lib/agenticOrchestrator';
import { Shield, Navigation, Wind, Waves, AlertTriangle, Ship, Compass, Radio, Thermometer, Sprout, Sparkles, X, MessageSquarePlus, MapPin, Fish } from 'lucide-react';

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
  const [layers, setLayers] = useState({
    route: true,
    vessels: true,
    fishermanZone: true,
    wind: true,
    tide: true,
    cyclone: true,
    sst: true,
    chlorophyll: true,
    hazards: true,
    manual: true
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
      <div className="w-full h-full min-h-[450px] bg-slate-950 rounded-xl flex flex-col items-center justify-center border border-slate-800">
        <Compass className="w-12 h-12 text-cyan-400 animate-spin mb-3" />
        <p className="text-slate-400 text-sm font-medium">Initializing Marine Intelligence Command Map...</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Tooltip, useMapEvents } = require('react-leaflet');
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

  // Generate SST and Chlorophyll Heatmap Grid Points for Sea Area
  const sstGridPoints = [
    { lat: 13.0, lon: 80.5, temp: 28.5 },
    { lat: 11.8, lon: 80.9, temp: 29.2 },
    { lat: 10.4, lon: 80.1, temp: 29.8 },
    { lat: 8.6, lon: 81.6, temp: 30.4 },
    { lat: 7.2, lon: 80.0, temp: 31.0 },
    { lat: 6.9, lon: 79.8, temp: 28.9 },
  ];

  const chloroGridPoints = [
    { lat: 12.8, lon: 80.3, conc: 0.72, level: 'HIGH' },
    { lat: 11.2, lon: 80.4, conc: 0.48, level: 'MEDIUM' },
    { lat: 9.8, lon: 79.8, conc: 0.84, level: 'HIGH' },
    { lat: 8.2, lon: 81.2, conc: 0.32, level: 'MEDIUM' },
    { lat: 7.0, lon: 80.2, conc: 0.18, level: 'LOW' },
  ];

  function MapEvents() {
    useMapEvents({
      click(e: any) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        if (manualMode && onMapClick) {
          onMapClick(lat, lon);
        } else {
          // Open Area Intelligence Glass Overlay
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
    <div className="relative w-full h-full min-h-[480px] rounded-xl overflow-hidden border border-slate-800/80 shadow-2xl z-0">
      {/* Map Control Layers Header Bar */}
      <div className="absolute top-3 left-3 z-[100] glass-panel px-3 py-2 rounded-lg flex flex-wrap items-center gap-3 text-xs shadow-xl">
        <span className="font-semibold text-cyan-400 flex items-center gap-1.5 border-r border-slate-700 pr-3">
          <Navigation className="w-3.5 h-3.5" /> MAP LAYERS
        </span>
        <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={layers.route}
            onChange={(e) => setLayers({ ...layers, route: e.target.checked })}
            className="accent-cyan-500 rounded"
          />
          Route
        </label>
        <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={layers.vessels}
            onChange={(e) => setLayers({ ...layers, vessels: e.target.checked })}
            className="accent-teal-500 rounded"
          />
          Vessels
        </label>
        <label className="flex items-center gap-1 cursor-pointer text-emerald-300 hover:text-emerald-100 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
          <input
            type="checkbox"
            checked={layers.fishermanZone}
            onChange={(e) => setLayers({ ...layers, fishermanZone: e.target.checked })}
            className="accent-emerald-400 rounded"
          />
          Fisherman Zone
        </label>
        <label className="flex items-center gap-1 cursor-pointer text-amber-300 hover:text-amber-100">
          <input
            type="checkbox"
            checked={layers.sst}
            onChange={(e) => setLayers({ ...layers, sst: e.target.checked })}
            className="accent-amber-500 rounded"
          />
          SST
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
        <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={layers.wind}
            onChange={(e) => setLayers({ ...layers, wind: e.target.checked })}
            className="accent-cyan-400 rounded"
          />
          Wind
        </label>
        <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={layers.cyclone}
            onChange={(e) => setLayers({ ...layers, cyclone: e.target.checked })}
            className="accent-rose-500 rounded"
          />
          Cyclone
        </label>
      </div>

      {/* Demo Data Watermark Badge */}
      <div className="absolute top-3 right-3 z-[100] glass-panel px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold text-cyan-300 flex items-center gap-1 border border-cyan-500/30">
        <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> DEMO MARINE DATA
      </div>

      {/* SST Legend */}
      {layers.sst && (
        <div className="absolute bottom-4 right-4 z-[100] glass-panel p-2.5 rounded-xl border border-amber-500/30 font-mono text-[10px] text-amber-200 flex flex-col gap-1 shadow-lg">
          <div className="flex items-center gap-1 font-bold text-amber-300">
            <Thermometer className="w-3.5 h-3.5" /> SEA SURFACE TEMP (SST)
          </div>
          <div className="w-full h-2 rounded bg-gradient-to-r from-cyan-500 via-emerald-400 via-amber-400 to-red-500" />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>27°C (Low)</span>
            <span>31°C (High)</span>
          </div>
          <span className="text-[9px] text-slate-500 italic">DEMO MARINE DATA</span>
        </div>
      )}

      {/* Chlorophyll Legend */}
      {layers.chlorophyll && (
        <div className="absolute bottom-4 left-4 z-[100] glass-panel p-2.5 rounded-xl border border-emerald-500/30 font-mono text-[10px] text-emerald-200 flex flex-col gap-1 shadow-lg">
          <div className="flex items-center gap-1 font-bold text-emerald-300">
            <Sprout className="w-3.5 h-3.5" /> CHLOROPHYLL CONCENTRATION
          </div>
          <div className="w-full h-2 rounded bg-gradient-to-r from-teal-700 via-emerald-500 to-green-300" />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>0.18 mg/m³ (LOW)</span>
            <span>0.76 mg/m³ (HIGH)</span>
          </div>
          <span className="text-[9px] text-slate-500 italic">DEMO MARINE DATA</span>
        </div>
      )}

      {/* AREA INTELLIGENCE GLASS POPUP ON MAP CLICK */}
      {selectedArea && (
        <div className="absolute top-16 left-4 z-[1000] w-72 glass-panel p-4 rounded-2xl border-2 border-cyan-500/60 shadow-2xl animate-in fade-in zoom-in">
          <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2 mb-3">
            <h4 className="text-xs font-bold font-mono text-cyan-300 flex items-center gap-1.5 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> AREA INTELLIGENCE
            </h4>
            <button onClick={() => setSelectedArea(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 font-mono text-[11px] text-slate-300 mb-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <p><span className="text-slate-500">Latitude:</span> <span className="text-cyan-300">{selectedArea.lat.toFixed(4)}° N</span></p>
            <p><span className="text-slate-500">Longitude:</span> <span className="text-cyan-300">{selectedArea.lon.toFixed(4)}° E</span></p>
            <p><span className="text-slate-500">SST:</span> <span className="text-amber-300 font-bold">{selectedArea.sst.temperature_c}°C</span> ({selectedArea.sst.gradient_status})</p>
            <p><span className="text-slate-500">Chlorophyll:</span> <span className="text-emerald-400 font-bold">{selectedArea.chlorophyll.concentration_mg_m3} mg/m³</span> ({selectedArea.chlorophyll.level})</p>
            <p><span className="text-slate-500">Wind:</span> 22 knots NE</p>
            <p><span className="text-slate-500">Tide:</span> 1.45 m (Ebbing)</p>
            <p><span className="text-slate-500">Weather:</span> Partly Cloudy</p>
            <p><span className="text-slate-500">Cyclone:</span> <span className="text-cyan-300">Watch Active (02B)</span></p>
            <p className="text-[9px] text-slate-500 italic mt-1">DEMO MARINE DATA</p>
          </div>

          <button
            onClick={handleAskBlueGuardAreaClick}
            className="w-full py-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 rounded-xl text-white font-extrabold text-xs shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all flex items-center justify-center gap-1.5"
          >
            <MessageSquarePlus className="w-4 h-4" /> ASK BLUEGUARD
          </button>
        </div>
      )}

      <MapContainer
        center={[currentShip.lat, currentShip.lon]}
        zoom={7}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '480px' }}
      >
        <MapEvents />

        {/* Esri World Imagery Satellite Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com">Esri</a> World Imagery & NOAA Marine'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {/* SST Heatmap Layers */}
        {layers.sst &&
          sstGridPoints.map((pt, idx) => (
            <Circle
              key={`sst-${idx}`}
              center={[pt.lat, pt.lon]}
              radius={45000} // 45km radius
              pathOptions={{
                color: pt.temp > 30.0 ? '#ef4444' : pt.temp > 29.0 ? '#f59e0b' : '#06b6d4',
                fillColor: pt.temp > 30.0 ? '#f87171' : pt.temp > 29.0 ? '#fbbf24' : '#22d3ee',
                fillOpacity: 0.35,
                weight: 1
              }}
            >
              <Tooltip permanent={false}>
                🌡️ SST: {pt.temp}°C [DEMO DATA]
              </Tooltip>
            </Circle>
          ))}

        {/* Chlorophyll Heatmap Layers */}
        {layers.chlorophyll &&
          chloroGridPoints.map((pt, idx) => (
            <Circle
              key={`chloro-${idx}`}
              center={[pt.lat, pt.lon]}
              radius={35000} // 35km radius
              pathOptions={{
                color: pt.level === 'HIGH' ? '#10b981' : '#14b8a6',
                fillColor: pt.level === 'HIGH' ? '#34d399' : '#2dd4bf',
                fillOpacity: 0.30,
                weight: 1
              }}
            >
              <Tooltip permanent={false}>
                🌱 Chlorophyll: {pt.conc} mg/m³ ({pt.level}) [DEMO DATA]
              </Tooltip>
            </Circle>
          ))}

        {/* Current Ship Marker */}
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

        {/* Route Lines */}
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

        {/* Nearby Demo Fleet Vessels */}
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

        {/* Fisherman Zone Layer (🟢 Safe PFZ · 🟡 Caution · 🔴 Hazard/Restricted) */}
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
                  fillOpacity: 0.28,
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

                    <p className="text-[11px] text-slate-600 italic">
                      Demo Data — live PFZ API not connected
                    </p>

                    <div className="font-mono text-[11px] bg-slate-100 p-2 rounded space-y-0.5">
                      <p>📍 <strong>Distance from vessel:</strong> {distKm} km</p>
                      <p>🌡️ <strong>SST:</strong> {zone.sst_c}°C</p>
                      <p>🌿 <strong>Chlorophyll:</strong> {zone.chlorophyll} mg/m³</p>
                      <p>🌊 <strong>Waves / Wind:</strong> {zone.wave_m}m | {zone.wind_kts} kts</p>
                      <p>🐟 <strong>Species:</strong> {zone.fish_species.join(', ')}</p>
                    </div>

                    <p className="text-[11px] font-medium text-slate-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                      {zone.recommendation}
                    </p>

                    <div className="pt-1 flex items-center justify-between">
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
                        <Sparkles className="w-3 h-3 text-cyan-200" /> Ask Blue Guard AI About Zone
                      </button>
                    </div>
                  </div>
                </Popup>
              </Circle>
            );
          })}

        {/* International Maritime Boundary Line (IMBL) */}
        <Polyline
          positions={[
            [10.0, 79.5],
            [10.0, 80.0],
            [9.8, 80.25],
            [9.4, 80.0]
          ]}
          pathOptions={{ color: '#ef4444', weight: 3, dashArray: '6, 6', opacity: 0.9 }}
        >
          <Tooltip permanent={true}>
            ⚠️ International Maritime Boundary Line (IMBL) - India / Sri Lanka (Demo GIS)
          </Tooltip>
        </Polyline>

        {/* Cyclone Translucent Hazard Zone */}
        {layers.cyclone && cycloneData && (
          <Circle
            center={[cycloneData.center_coordinates.lat, cycloneData.center_coordinates.lon]}
            radius={cycloneData.affected_radius_nm * 1852} // Convert NM to meters
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
