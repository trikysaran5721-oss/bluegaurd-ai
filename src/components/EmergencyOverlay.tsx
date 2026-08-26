'use client';

import React, { useState, useEffect } from 'react';
import { EmergencyAlert, ShipProfile } from '@/lib/types';
import { audioService } from '@/lib/audioService';
import { emergencyRealtimeNetwork } from '@/lib/emergencyRealtime';
import { AlertOctagon, Volume2, ShieldAlert, CheckCircle2, XCircle, Radio, MapPin } from 'lucide-react';

interface EmergencyOverlayProps {
  currentShip: ShipProfile;
  onAlertAcknowledged?: (alertId: string) => void;
}

export default function EmergencyOverlay({ currentShip, onAlertAcknowledged }: EmergencyOverlayProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeReceivedAlert, setActiveReceivedAlert] = useState<EmergencyAlert | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const triggerEmergencyBroadcast = (customMessage?: string) => {
    const newAlert: EmergencyAlert = {
      id: `alert-${Date.now()}`,
      sender_ship_id: currentShip.ship_id,
      sender_name: currentShip.display_name || currentShip.handler_name || 'Capt. Saran Kumar',
      severity: 'CRITICAL',
      alert_type: 'EMERGENCY_DISTRESS',
      message: customMessage || 'Emergency distress signal activated by ship handler ("blueguard emergency alert").',
      latitude: currentShip.latitude || 13.0827,
      longitude: currentShip.longitude || 80.2707,
      destination: currentShip.destination || 'Colombo',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    // Broadcast across Supabase Realtime, WebSockets, BroadcastChannel, NTFY push, and FormSubmit email
    emergencyRealtimeNetwork.broadcastEmergency(newAlert);
    
    // Also trigger local alarm & display modal on sender ship
    setActiveReceivedAlert(newAlert);
    setAcknowledged(false);
    audioService.playEmergencyAlarm();
    audioService.speak(`Emergency distress alert broadcasted for ship ${currentShip.ship_id}`, 'en');
    setShowConfirmModal(false);
  };

  useEffect(() => {
    // 0. Auto-unlock AudioContext on first user click or keypress anywhere on the page
    const unlockAudioOnTouch = () => {
      audioService.unlockAudioContext();
      setAudioBlocked(false);
    };
    window.addEventListener('click', unlockAudioOnTouch);
    window.addEventListener('keydown', unlockAudioOnTouch);

    // 1. Listen for real-time incoming alerts from other demo ships across laptops
    emergencyRealtimeNetwork.onAlertReceived((alert) => {
      setActiveReceivedAlert(alert);
      setAcknowledged(false);

      const isSuspended = audioService.isContextSuspended();
      if (isSuspended) {
        setAudioBlocked(true);
      }
      // Always play alarm
      audioService.playEmergencyAlarm();
      audioService.speak(`Emergency alert received from ship ${alert.sender_ship_id}`, 'en');
    });

    emergencyRealtimeNetwork.onAlertAcknowledged((alertId, shipId) => {
      if (activeReceivedAlert && activeReceivedAlert.id === alertId) {
        setAcknowledged(true);
      }
    });

    // 2. Custom Window Event Listener for Voice & Typed "blueguard emergency alert" commands
    const handleGlobalEmergencyEvent = (e: any) => {
      const msg = e.detail?.message || 'Emergency distress signal activated.';
      triggerEmergencyBroadcast(msg);
    };

    window.addEventListener('blueguard:trigger_emergency', handleGlobalEmergencyEvent);
    return () => {
      window.removeEventListener('click', unlockAudioOnTouch);
      window.removeEventListener('keydown', unlockAudioOnTouch);
      window.removeEventListener('blueguard:trigger_emergency', handleGlobalEmergencyEvent);
    };
  }, [currentShip, activeReceivedAlert]);

  const handleEnableAudio = () => {
    const success = audioService.unlockAudioContext();
    setAudioBlocked(!success);
    audioService.playEmergencyAlarm();
    if (activeReceivedAlert) {
      audioService.speak(`Emergency alert received from ship ${activeReceivedAlert.sender_ship_id}`, 'en');
    }
  };

  const handleAcknowledge = () => {
    if (activeReceivedAlert) {
      emergencyRealtimeNetwork.acknowledgeAlert(activeReceivedAlert.id, currentShip.ship_id);
      audioService.stopEmergencyAlarm();
      setAcknowledged(true);
      if (onAlertAcknowledged) onAlertAcknowledged(activeReceivedAlert.id);

      setTimeout(() => {
        setActiveReceivedAlert(null);
      }, 2000);
    }
  };

  return (
    <>
      {/* Invisible Trigger Button for Backward Compatibility */}
      <button
        id="btn-emergency-trigger"
        onClick={() => triggerEmergencyBroadcast("Emergency distress signal activated via voice/typed command.")}
        className="hidden"
      />

      {/* 1. SENDER CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100000] theme-emergency flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in zoom-in">
          <div className="w-full max-w-lg glass-panel-crimson p-6 rounded-2xl shadow-2xl border-2 border-red-500/80 crimson-pulse">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertOctagon className="w-10 h-10 animate-bounce" />
              <div>
                <h3 className="text-2xl font-extrabold tracking-wider text-red-100">🚨 EMERGENCY ALERT</h3>
                <p className="text-xs text-red-300 font-mono">DISTRESS BROADCAST CONFIRMATION</p>
              </div>
            </div>

            <p className="text-slate-200 text-sm mb-6 leading-relaxed">
              Are you sure you want to broadcast an emergency distress alert to all online ships in your maritime radius, NTFY channel ('blueguard_maritime_emergency'), and higher official emails ('trikysaran5721@gmail.com', 'cliffrichards1404@gmail.com', 'yogeshramu67@gmail.com')?
            </p>

            <div className="bg-black/60 p-4 rounded-xl mb-6 border border-red-900/60 font-mono text-xs text-slate-300 space-y-1.5">
              <p><span className="text-slate-500">Sender Ship ID:</span> <span className="text-cyan-300 font-bold">{currentShip.ship_id}</span></p>
              <p><span className="text-slate-500">GPS Position:</span> {currentShip.latitude.toFixed(4)}° N, {currentShip.longitude.toFixed(4)}° E</p>
              <p><span className="text-slate-500">Destination:</span> {currentShip.destination}</p>
              <p><span className="text-slate-500">NTFY Channel:</span> <span className="text-emerald-400 font-bold">blueguard_maritime_emergency</span></p>
              <p><span className="text-slate-500">Official Emails:</span> <span className="text-amber-300 font-bold">trikysaran5721@gmail.com, cliffrichards1404@gmail.com, yogeshramu67@gmail.com</span></p>
              <p><span className="text-slate-500">Severity:</span> <span className="text-red-400 font-bold">CRITICAL</span></p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl glass-button text-slate-300 font-semibold text-xs hover:bg-slate-800"
              >
                CANCEL
              </button>
              <button
                onClick={() => triggerEmergencyBroadcast("Manual distress broadcast confirmed by ship handler.")}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white font-extrabold text-xs shadow-lg shadow-red-600/50 hover:scale-105 transition-all"
              >
                CONFIRM DISTRESS ALERT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FULL-SCREEN CRIMSON EMERGENCY DISTRESS INTERFACE (Active for Sender & Recipients) */}
      {activeReceivedAlert && (
        <div className="fixed inset-0 z-[100000] theme-emergency flex items-center justify-center p-4 backdrop-blur-2xl animate-in fade-in">
          <div className="w-full max-w-2xl glass-panel-crimson p-8 rounded-3xl border-4 border-red-600 shadow-2xl crimson-pulse">
            {/* Audio Blocked Fallback Button */}
            {audioBlocked && (
              <div className="mb-6 p-3 bg-amber-950/90 border border-amber-500/60 rounded-xl flex items-center justify-between">
                <span className="text-xs text-amber-200 font-semibold flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" /> Tap anywhere on screen to enable alarm sound
                </span>
                <button
                  onClick={handleEnableAudio}
                  className="px-3 py-1 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-amber-400"
                >
                  ENABLE ALERT AUDIO
                </button>
              </div>
            )}

            <div className="flex items-center gap-4 border-b border-red-900/60 pb-5 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-red-600/30 flex items-center justify-center border border-red-500">
                <AlertOctagon className="w-10 h-10 text-red-500 animate-bounce" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold tracking-wider text-red-100 flex items-center gap-2">
                  🚨 EMERGENCY ALERT ACTIVE
                </h2>
                <p className="text-xs text-red-300 font-mono tracking-widest uppercase">
                  HIGH SEAS MARITIME DISTRESS BROADCAST
                </p>
              </div>
            </div>

            {/* Emergency Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/80 p-5 rounded-2xl border border-red-900/80 mb-6 font-mono text-xs">
              <div>
                <p className="text-slate-500 uppercase">Sender Ship ID</p>
                <p className="text-base font-extrabold text-cyan-300">{activeReceivedAlert.sender_ship_id}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase">Handler / User</p>
                <p className="text-sm font-semibold text-slate-200">{activeReceivedAlert.sender_name}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase">GPS Location</p>
                <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {activeReceivedAlert.latitude.toFixed(4)}° N, {activeReceivedAlert.longitude.toFixed(4)}° E
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase">Destination</p>
                <p className="text-sm font-semibold text-slate-200">{activeReceivedAlert.destination}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800">
                <p className="text-slate-500 uppercase">NTFY Channel & Email Dispatch</p>
                <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                  ✅ Dispatched to NTFY ('blueguard_maritime_emergency') & Emails ('trikysaran5721@gmail.com', 'cliffrichards1404@gmail.com', 'yogeshramu67@gmail.com')
                </p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800">
                <p className="text-slate-500 uppercase">Distress Message</p>
                <p className="text-sm font-medium text-red-300 italic mt-1 font-sans">
                  "{activeReceivedAlert.message}"
                </p>
              </div>
            </div>

            {/* Acknowledgement Action */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Time: {activeReceivedAlert.timestamp}
              </span>

              {acknowledged ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-950/80 px-4 py-2 rounded-xl border border-emerald-500/40">
                  <CheckCircle2 className="w-5 h-5" /> ACKNOWLEDGED BY SHIP {currentShip.ship_id}
                </div>
              ) : (
                <button
                  onClick={handleAcknowledge}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white font-extrabold text-sm shadow-xl shadow-red-600/50 hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <ShieldAlert className="w-5 h-5" /> ACKNOWLEDGE EMERGENCY
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
