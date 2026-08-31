'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  RadioTower,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Send,
  ShieldAlert,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  Ship,
  Languages,
  Info
} from 'lucide-react';
import { ShipProfile, V2VVoiceMessage, NearbyVessel } from '@/lib/types';
import { audioService } from '@/lib/audioService';
import { emergencyRealtimeNetwork } from '@/lib/emergencyRealtime';
import { communicationAgent, multilingualVoiceAgent } from '@/lib/agenticOrchestrator';

interface V2VRadioModuleProps {
  currentShip: ShipProfile;
  nearbyVessels: NearbyVessel[];
  onVoiceQueryResult?: (query: string, answer: string) => void;
}

export default function V2VRadioModule({
  currentShip,
  nearbyVessels,
  onVoiceQueryResult
}: V2VRadioModuleProps) {
  // --- Voice Assistant States (5 Required States) ---
  // 'Voice Ready' | 'Listening' | 'Processing' | 'Speaking' | 'Mic Off'
  const [voiceState, setVoiceState] = useState<'Voice Ready' | 'Listening' | 'Processing' | 'Speaking' | 'Mic Off'>('Voice Ready');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [detectedLangLabel, setDetectedLangLabel] = useState<string>('English');
  const [aiResponseText, setAiResponseText] = useState<string>('');
  const [voiceErrorMessage, setVoiceErrorMessage] = useState<string | null>(null);

  // --- V2V Cross-Language Chat & Vessel Mesh ---
  const [v2vMessages, setV2vMessages] = useState<V2VVoiceMessage[]>([]);
  const [selectedTargetVessel, setSelectedTargetVessel] = useState<NearbyVessel | null>(null);
  const [v2vTextInput, setV2vTextInput] = useState<string>('');
  const [activeAudioPlayingId, setActiveAudioPlayingId] = useState<string | null>(null);
  const [offlineAlertMessage, setOfflineAlertMessage] = useState<string | null>(null);

  // --- Emergency Broadcast Modal State ---
  const [showEmergencyConfirmModal, setShowEmergencyConfirmModal] = useState<boolean>(false);
  const [emergencyReasonInput, setEmergencyReasonInput] = useState<string>('Engine failure near Palk Strait');

  const recognitionRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 1. Initial V2V Messages Feed
    const initialMsg: V2VVoiceMessage = {
      id: 'v2v_init_1',
      sender_ship_id: '987654321098',
      sender_name: 'MV Ocean Warrior',
      audio_url: '',
      duration_sec: 4,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: 'Channel 16',
      note: 'V2V Advisory: Heavy swell reported near Colombo entrance',
      media_type: 'text',
      text_content: 'V2V Advisory: Heavy swell reported near Colombo entrance'
    };
    setV2vMessages([initialMsg]);

    // 2. Subscribe to incoming V2V dispatches over Supabase Realtime
    emergencyRealtimeNetwork.onV2VVoiceReceived((msg) => {
      setV2vMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [msg, ...prev];
      });
    });
  }, []);

  // --- Voice Assistant Functions ---
  const startVoiceCapture = () => {
    audioService.unlockAudioContext();
    setVoiceErrorMessage(null);
    setLiveTranscript('');
    setAiResponseText('');

    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceState('Mic Off');
      setVoiceErrorMessage('Microphone access is required for Voice AI. You can continue using text chat.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;

      // Set language code
      const langCodeMap: Record<string, string> = {
        en: 'en-US',
        ta: 'ta-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        ml: 'ml-IN',
        kn: 'kn-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        gu: 'gu-IN'
      };

      recognition.lang = langCodeMap[selectedLanguage] || 'en-US';
      setVoiceState('Listening');

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setLiveTranscript(transcript);
        setDetectedLangLabel(multilingualVoiceAgent.getLanguageLabel(selectedLanguage));
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceState('Mic Off');
          setVoiceErrorMessage('Microphone access is required for Voice AI. You can continue using text chat.');
        } else {
          setVoiceState('Voice Ready');
          setVoiceErrorMessage("Couldn't understand the audio. Please try again.");
        }
      };

      recognition.onend = () => {
        if (liveTranscript.trim()) {
          processVoiceQuery(liveTranscript);
        } else {
          setVoiceState('Voice Ready');
        }
      };

      recognition.start();
    } catch (err) {
      setVoiceState('Mic Off');
      setVoiceErrorMessage('Microphone access is required for Voice AI. You can continue using text chat.');
    }
  };

  const stopVoiceCapture = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceState('Voice Ready');
  };

  const processVoiceQuery = async (queryText: string) => {
    setVoiceState('Processing');

    setTimeout(() => {
      let answer = `BlueGuard Report for ${currentShip.display_name}: Passages near ${currentShip.destination} are clear. Wind is 22 kts NE with SST at 28.5°C.`;
      const qLower = queryText.toLowerCase();

      if (qLower.includes('fish') || qLower.includes('pfz') || qLower.includes('tuna')) {
        answer = `Fishing Advisory: Nearest PFZ zone is Palk Bay North (18.5 km). SST is 28.8°C with high chlorophyll biomass (1.45 mg/m³). High yield expected for Yellowfin Tuna & Sardine.`;
      } else if (qLower.includes('weather') || qLower.includes('wind') || qLower.includes('wave')) {
        answer = `Weather Advisory: 22 knots NE wind with wave height 2.1 meters. Tropical Depression 02B is active 120 NM southeast. Proceed with caution.`;
      } else if (qLower.includes('border') || qLower.includes('imbl') || qLower.includes('sri lanka')) {
        answer = `Geofence Alert: You are operating 18 km north of the India-Sri Lanka IMBL boundary line. Maintain course north of 10°N.`;
      }

      setAiResponseText(answer);
      setVoiceState('Speaking');

      audioService.speak(answer, selectedLanguage as any);

      if (onVoiceQueryResult) {
        onVoiceQueryResult(queryText, answer);
      }

      setTimeout(() => {
        setVoiceState('Voice Ready');
      }, 5000);
    }, 1200);
  };

  // --- V2V Cross-Language Transmission ---
  const handleSendV2VDispatch = (textToSend?: string) => {
    const text = textToSend || v2vTextInput;
    if (!text.trim()) return;

    if (selectedTargetVessel && selectedTargetVessel.status === 'OFFLINE') {
      setOfflineAlertMessage(`Vessel ${selectedTargetVessel.name} is currently unavailable.`);
      setTimeout(() => setOfflineAlertMessage(null), 4000);
      return;
    }

    const shipId = currentShip.ship_id;
    const shipName = currentShip.display_name || `Ship #${shipId}`;

    // Perform Cross-Language Translation if target vessel uses another language
    const targetLang = selectedTargetVessel ? 'ta' : selectedLanguage;
    const translation = communicationAgent.translateV2V(text, targetLang);

    const newMsg: V2VVoiceMessage = {
      id: 'v2v_' + Date.now(),
      sender_ship_id: shipId,
      sender_name: shipName,
      audio_url: '',
      duration_sec: 4,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: selectedTargetVessel ? `Direct to ${selectedTargetVessel.name}` : 'Channel 16',
      note: translation.is_translated ? translation.translated_text : text,
      media_type: 'text',
      text_content: text
    };

    setV2vMessages((prev) => [newMsg, ...prev]);
    emergencyRealtimeNetwork.broadcastV2VVoiceMessage(newMsg);

    // Speak translated response if cross-language
    if (translation.is_translated) {
      audioService.speak(translation.translated_text, targetLang as any);
    }

    setV2vTextInput('');
    setSelectedTargetVessel(null);
  };

  // --- Trigger Platform Emergency Broadcast ---
  const handleExecuteEmergencyBroadcast = () => {
    setShowEmergencyConfirmModal(false);

    const newAlert = {
      id: `emergency-${Date.now()}`,
      sender_ship_id: currentShip.ship_id,
      sender_name: currentShip.display_name || 'Captain',
      severity: 'CRITICAL' as const,
      alert_type: 'EMERGENCY_DISTRESS' as const,
      message: `[PLATFORM EMERGENCY BROADCAST] ${emergencyReasonInput}`,
      latitude: currentShip.latitude || 13.0827,
      longitude: currentShip.longitude || 80.2707,
      destination: currentShip.destination || 'High Seas',
      timestamp: new Date().toLocaleTimeString()
    };

    emergencyRealtimeNetwork.broadcastEmergency(newAlert);
    audioService.playEmergencyAlarm();
    audioService.speak(`Platform emergency broadcast transmitted by ship ${currentShip.ship_id}`, 'en');
  };

  return (
    <section aria-label="V2V Radio & Voice AI Module" className="w-full glass-panel p-4 rounded-3xl border border-cyan-500/40 shadow-2xl space-y-4">
      
      {/* 1. MODULE HEADER & PLATFORM BADGES */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cyan-900/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-cyan-600 to-teal-500 rounded-xl text-white shadow-lg shadow-cyan-500/30">
            <RadioTower className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-white tracking-wider font-mono">
                🎙️ V2V RADIO & VOICE AI COMMAND HUB
              </h2>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                CH 16 LIVE MESH
              </span>
            </div>
            <p className="text-[11px] text-cyan-300/80">
              Inter-Vessel Voice Relay · Cross-Language Translation · Multi-Agent Intelligence
            </p>
          </div>
        </div>

        {/* Emergency Broadcast Action & Demo Fleet Tag */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            Simulated V2V Fleet Mesh
          </span>
          <button
            onClick={() => setShowEmergencyConfirmModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-950 border border-red-500/40 flex items-center gap-1.5 transition transform active:scale-95"
          >
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>PLATFORM EMERGENCY BROADCAST</span>
          </button>
        </div>
      </div>

      {/* 2. GRID: VOICE ASSISTANT (LEFT) + V2V CROSS-LANGUAGE COMMS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* === LEFT COLUMN: VOICE ASSISTANT (5 STATES) === */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex flex-col justify-between space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-cyan-200 uppercase tracking-wider">
                AGENTIC VOICE ASSISTANT
              </span>
            </div>

            {/* Language Selector Dropback */}
            <div className="flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-slate-900 text-cyan-300 text-[11px] font-mono border border-cyan-800 rounded px-2 py-1 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="ml">മലയാളം (Malayalam)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
              </select>
            </div>
          </div>

          {/* 5 VISUAL STATES BADGE */}
          <div className="flex items-center justify-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold border shadow-lg transition-all ${
                voiceState === 'Voice Ready'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                  : voiceState === 'Listening'
                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                  : voiceState === 'Processing'
                  ? 'bg-amber-950 text-amber-300 border-amber-500 animate-bounce'
                  : voiceState === 'Speaking'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              STATE: {voiceState.toUpperCase()}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Lang: <strong className="text-cyan-300">{detectedLangLabel}</strong>
            </span>
          </div>

          {/* CENTRAL TAP TO SPEAK BUTTON */}
          <div className="flex flex-col items-center justify-center py-2">
            <button
              onClick={() => {
                if (voiceState === 'Listening') {
                  stopVoiceCapture();
                } else {
                  startVoiceCapture();
                }
              }}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition transform active:scale-95 ${
                voiceState === 'Listening'
                  ? 'bg-gradient-to-tr from-rose-600 to-red-500 ring-8 ring-rose-500/30 animate-pulse'
                  : voiceState === 'Processing'
                  ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 ring-8 ring-amber-500/30'
                  : voiceState === 'Speaking'
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 ring-8 ring-emerald-500/30'
                  : 'bg-gradient-to-tr from-cyan-600 via-teal-600 to-blue-600 hover:scale-105 ring-4 ring-cyan-500/20'
              }`}
            >
              {voiceState === 'Mic Off' ? (
                <MicOff className="w-8 h-8 text-slate-400" />
              ) : voiceState === 'Listening' ? (
                <Mic className="w-8 h-8 text-white animate-bounce" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
            <p className="text-[11px] font-mono text-cyan-300 mt-2">
              {voiceState === 'Listening' ? 'Tap to Stop Listening' : 'Tap Central Mic to Ask BlueGuard AI'}
            </p>
          </div>

          {/* Fallback Error Message Box */}
          {voiceErrorMessage && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{voiceErrorMessage}</span>
            </div>
          )}

          {/* Transcript & AI Response Area */}
          {(liveTranscript || aiResponseText) && (
            <div className="p-3 bg-slate-900/90 rounded-xl border border-cyan-800 space-y-2 text-xs">
              {liveTranscript && (
                <p className="text-cyan-200 font-mono">
                  <strong className="text-cyan-400">Speech Input:</strong> "{liveTranscript}"
                </p>
              )}
              {aiResponseText && (
                <p className="text-emerald-200 font-sans leading-relaxed">
                  <strong className="text-emerald-400">AI Advisory:</strong> "{aiResponseText}"
                </p>
              )}
            </div>
          )}

        </div>

        {/* === RIGHT COLUMN: V2V VESSEL MESH & CROSS-LANGUAGE COMMS === */}
        <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex flex-col justify-between space-y-3">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-cyan-200 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-cyan-400" /> NEARBY VESSEL ROSTER (CROSS-LANGUAGE V2V)
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              {nearbyVessels.length} Vessels Online
            </span>
          </div>

          {/* Offline Warning Banner */}
          {offlineAlertMessage && (
            <div className="p-2 bg-amber-950/90 border border-amber-500/50 rounded-xl text-xs text-amber-300 font-mono flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" />
              <span>{offlineAlertMessage}</span>
            </div>
          )}

          {/* NEARBY VESSELS HORIZONTAL ROSTER */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {nearbyVessels.slice(0, 4).map((vessel) => {
              const isSelected = selectedTargetVessel?.ship_id === vessel.ship_id;
              const isOffline = vessel.status === 'OFFLINE';
              return (
                <button
                  key={vessel.ship_id}
                  onClick={() => {
                    if (isOffline) {
                      setOfflineAlertMessage(`Vessel ${vessel.name} is currently unavailable.`);
                      setTimeout(() => setOfflineAlertMessage(null), 4000);
                      return;
                    }
                    setSelectedTargetVessel(isSelected ? null : vessel);
                  }}
                  className={`p-2 rounded-xl text-left border text-[11px] font-mono transition ${
                    isOffline
                      ? 'bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-cyan-950 border-cyan-400 font-bold text-white shadow-lg'
                      : 'bg-slate-900 border-slate-800 hover:border-cyan-600 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-cyan-300">{vessel.name}</span>
                    <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-slate-600' : 'bg-emerald-400 animate-pulse'}`} />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {vessel.distance_nm} NM | #{vessel.ship_id.slice(-4)}
                  </div>
                  {isOffline && (
                    <div className="text-[9px] text-rose-400 font-semibold mt-0.5">UNAVAILABLE</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* V2V MESSAGES LOG (WITH SIDE-BY-SIDE TRANSLATION) */}
          <div className="flex-1 max-h-[160px] overflow-y-auto space-y-2 p-2 bg-slate-900/60 rounded-xl border border-slate-800 font-sans text-xs">
            {v2vMessages.map((msg) => (
              <div key={msg.id} className="p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-mono text-[10px] text-cyan-300">
                  <span>{msg.sender_name} (#{msg.sender_ship_id})</span>
                  <span className="text-slate-500">{msg.timestamp}</span>
                </div>
                <p className="text-slate-200">{msg.text_content || msg.note}</p>
                {msg.note && msg.note !== msg.text_content && (
                  <p className="text-[11px] text-emerald-300 font-mono bg-emerald-950/60 p-1 rounded border border-emerald-800">
                    🌐 <strong>Translated Text:</strong> {msg.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* COMPOSER & TRANSMIT BUTTON */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={v2vTextInput}
              onChange={(e) => setV2vTextInput(e.target.value)}
              placeholder={
                selectedTargetVessel
                  ? `Direct message to ${selectedTargetVessel.name}...`
                  : 'Broadcast to Channel 16 fleet...'
              }
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-sans"
            />
            <button
              onClick={() => handleSendV2VDispatch()}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950 font-mono"
            >
              <Send className="w-3.5 h-3.5" />
              <span>TRANSMIT</span>
            </button>
          </div>

        </div>

      </div>

      {/* 3. PLATFORM EMERGENCY BROADCAST CONFIRMATION MODAL */}
      {showEmergencyConfirmModal && (
        <div className="fixed inset-0 z-[5000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border-2 border-red-500/60 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400 border-b border-red-900/60 pb-3">
              <ShieldAlert className="w-7 h-7 text-red-500 animate-pulse" />
              <div>
                <h3 className="text-base font-extrabold font-mono text-white">
                  CONFIRM PLATFORM EMERGENCY BROADCAST
                </h3>
                <p className="text-xs text-red-300">Requires Captain Confirmation Step</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              You are about to transmit a high-priority distress broadcast across the <strong>Platform V2V Emergency Mesh</strong> to all ships within 50 NM.
            </p>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Emergency Distress Reason:
              </label>
              <input
                type="text"
                value={emergencyReasonInput}
                onChange={(e) => setEmergencyReasonInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-red-500/50 rounded-xl text-xs text-red-200 font-mono"
              />
            </div>

            <div className="p-2.5 bg-red-950/60 rounded-xl border border-red-800 text-[11px] text-red-300 font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Broadcast includes Vessel ID #{currentShip.ship_id} & current GPS coordinates.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEmergencyConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteEmergencyBroadcast}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-red-950 flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" /> CONFIRM & BROADCAST DISTRESS
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
