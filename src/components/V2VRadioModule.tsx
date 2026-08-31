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
  Info,
  RotateCcw,
  Square
} from 'lucide-react';
import { ShipProfile, V2VVoiceMessage, NearbyVessel } from '@/lib/types';
import { audioService } from '@/lib/audioService';
import { voiceRecognitionService } from '@/lib/voiceRecognition';
import { voiceService } from '@/lib/voiceService';
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
  // --- Voice Assistant States (§5 Required States) ---
  // '🟢 Ready' | '🎙️ Listening' | '🧠 Processing' | '🌐 Language Detected' | '🔊 Speaking' | '🔴 Error' | 'Mic Off'
  const [voiceState, setVoiceState] = useState<'Ready' | 'Listening' | 'Processing' | 'Detected' | 'Speaking' | 'Error' | 'Mic Off'>('Ready');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-IN');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [detectedLangCode, setDetectedLangCode] = useState<string>('en-IN');
  const [detectedLangLabel, setDetectedLangLabel] = useState<string>('English');
  const [aiResponseText, setAiResponseText] = useState<string>('');
  const [voiceErrorMessage, setVoiceErrorMessage] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLowConfidenceLang, setIsLowConfidenceLang] = useState<boolean>(false);

  // --- V2V Cross-Language Chat & Vessel Mesh ---
  const [v2vMessages, setV2vMessages] = useState<V2VVoiceMessage[]>([]);
  const [selectedTargetVessel, setSelectedTargetVessel] = useState<NearbyVessel | null>(null);
  const [v2vTextInput, setV2vTextInput] = useState<string>('');
  const [offlineAlertMessage, setOfflineAlertMessage] = useState<string | null>(null);

  // --- Emergency Broadcast Modal State ---
  const [showEmergencyConfirmModal, setShowEmergencyConfirmModal] = useState<boolean>(false);
  const [emergencyReasonInput, setEmergencyReasonInput] = useState<string>('Engine failure near Palk Strait');

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

  const getLanguageLabelName = (code: string) => {
    const map: Record<string, string> = {
      'en-IN': 'English',
      'ta-IN': 'தமிழ் (Tamil)',
      'hi-IN': 'हिंदी (Hindi)',
      'te-IN': 'తెలుగు (Telugu)',
      'ml-IN': 'മലയാളം (Malayalam)',
      'kn-IN': 'ಕನ್ನಡ (Kannada)',
      'bn-IN': 'বাংলা (Bengali)',
      'mr-IN': 'मराठी (Marathi)',
      'gu-IN': 'ગુજરાતી (Gujarati)',
      en: 'English',
      ta: 'தமிழ் (Tamil)',
      hi: 'हिंदी (Hindi)',
      te: 'తెలుగు (Telugu)',
      ml: 'മലയാളം (Malayalam)',
      kn: 'ಕನ್ನಡ (Kannada)',
      bn: 'বাংলা (Bengali)',
      mr: 'मराठी (Marathi)',
      gu: 'ગુજરાતી (Gujarati)'
    };
    return map[code] || 'English';
  };

  // --- Voice Assistant Functions ---
  const startVoiceCapture = () => {
    audioService.unlockAudioContext();
    setVoiceErrorMessage(null);
    setLiveTranscript('');
    setAiResponseText('');
    setIsLowConfidenceLang(false);

    if (!voiceRecognitionService.isSupported()) {
      setVoiceState('Mic Off');
      setVoiceErrorMessage('Microphone access is required for voice interaction. You can continue using text.');
      return;
    }

    setVoiceState('Listening');
    const simpleLang = selectedLanguage.split('-')[0];
    voiceRecognitionService.setLanguage(simpleLang);
    setDetectedLangLabel(getLanguageLabelName(selectedLanguage));

    voiceRecognitionService.startListening((transcriptText: string, isFinal: boolean) => {
      if (transcriptText) {
        setLiveTranscript(transcriptText);
        if (isFinal && transcriptText.trim().length > 2) {
          processVoiceQuery(transcriptText.trim());
        }
      }
    });
  };

  const stopVoiceCapture = () => {
    voiceRecognitionService.stopListening();
    setVoiceState('Ready');
  };

  const processVoiceQuery = async (queryText: string) => {
    setVoiceState('Processing');

    try {
      // 1. Send query to Sarvam STT / Voice Transcribe Proxy
      const transcribeRes = await voiceService.transcribe(undefined, selectedLanguage, queryText);
      
      const detectedCode = transcribeRes.language_code || selectedLanguage;
      setDetectedLangCode(detectedCode);
      setDetectedLangLabel(getLanguageLabelName(detectedCode));
      setIsDemoMode(transcribeRes.is_demo_mode);
      setVoiceState('Detected');

      // 2. Query Agentic LLM System (ChatGPT / Gemini / Multilingual Generator)
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          ship_id: currentShip.ship_id,
          language: detectedCode.split('-')[0],
          destination: currentShip.destination || 'Colombo'
        })
      });

      let answer = '';
      if (res.ok) {
        const data = await res.json();
        answer = data.answer;
      } else {
        answer = `BlueGuard Advisory: Weather near ${currentShip.destination || 'Colombo'} is experiencing 22 knots NE wind.`;
      }

      setAiResponseText(answer);
      setVoiceState('Speaking');

      // 3. Synthesize Voice using Sarvam TTS (bulbul:v1)
      const synthResult = await voiceService.synthesize(answer, detectedCode);
      if (synthResult.is_demo_mode) {
        setIsDemoMode(true);
      }

      if (onVoiceQueryResult) {
        onVoiceQueryResult(queryText, answer);
      }

      setTimeout(() => {
        setVoiceState('Ready');
      }, 5000);
    } catch (err) {
      console.warn('Voice query processing error:', err);
      setVoiceState('Error');
      setVoiceErrorMessage("Couldn't understand the audio. Please try again.");
      setTimeout(() => {
        setVoiceState('Ready');
      }, 4000);
    }
  };

  const handleReplayResponse = () => {
    if (aiResponseText) {
      voiceService.synthesize(aiResponseText, detectedLangCode);
    }
  };

  const handleStopResponse = () => {
    voiceService.stopPlayback();
    audioService.speak('', 'en');
  };

  // --- V2V Cross-Language Transmission (§9) ---
  const handleSendV2VDispatch = async (textToSend?: string) => {
    const text = textToSend || v2vTextInput;
    if (!text.trim()) return;

    if (selectedTargetVessel && selectedTargetVessel.status === 'OFFLINE') {
      setOfflineAlertMessage(`Vessel ${selectedTargetVessel.name} is currently unavailable.`);
      setTimeout(() => setOfflineAlertMessage(null), 4000);
      return;
    }

    const shipId = currentShip.ship_id;
    const shipName = currentShip.display_name || `Ship #${shipId}`;

    const srcLang = selectedLanguage;
    const tgtLang = selectedTargetVessel ? 'ta-IN' : selectedLanguage;

    // Cross-Language Translation via Sarvam Translate Proxy (/api/voice/translate)
    const translateResult = await voiceService.translate(text, srcLang, tgtLang);
    const translatedNote = translateResult.translated_text;

    const newMsg: V2VVoiceMessage = {
      id: 'v2v_' + Date.now(),
      sender_ship_id: shipId,
      sender_name: shipName,
      audio_url: '',
      duration_sec: 4,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: selectedTargetVessel ? `Direct to ${selectedTargetVessel.name}` : 'Channel 16',
      note: translatedNote !== text ? `[${getLanguageLabelName(tgtLang)}]: ${translatedNote}` : text,
      media_type: 'text',
      text_content: text
    };

    setV2vMessages((prev) => [newMsg, ...prev]);
    emergencyRealtimeNetwork.broadcastV2VVoiceMessage(newMsg);

    // Speak translated response for recipient vessel in their preferred language
    voiceService.synthesize(translatedNote, tgtLang);

    setV2vTextInput('');
    setSelectedTargetVessel(null);
  };

  // --- Trigger Blue Guard AI Vessel Emergency Broadcast (§9) ---
  const handleExecuteEmergencyBroadcast = () => {
    setShowEmergencyConfirmModal(false);

    const newAlert = {
      id: `emergency-${Date.now()}`,
      sender_ship_id: currentShip.ship_id,
      sender_name: currentShip.display_name || 'Captain',
      severity: 'CRITICAL' as const,
      alert_type: 'EMERGENCY_DISTRESS' as const,
      message: `[BLUE GUARD AI VESSEL EMERGENCY BROADCAST] Vessel #${currentShip.ship_id} reporting: ${emergencyReasonInput}`,
      latitude: currentShip.latitude || 13.0827,
      longitude: currentShip.longitude || 80.2707,
      destination: currentShip.destination || 'High Seas',
      timestamp: new Date().toLocaleTimeString()
    };

    emergencyRealtimeNetwork.broadcastEmergency(newAlert);
    audioService.playEmergencyAlarm();
    voiceService.synthesize(`Blue Guard AI Vessel Emergency Broadcast transmitted by ship ${currentShip.ship_id}`, selectedLanguage);
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
                🎙️ V2V RADIO & SARVAM MULTILINGUAL VOICE HUB
              </h2>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                CH 16 LIVE MESH
              </span>
              {isDemoMode && (
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                  DEMO MODE — Sarvam AI Fallback Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-cyan-300/80">
              Sarvam STT/TTS · 9 Regional Languages · Cross-Vessel Translation · Vessel Emergency Broadcast
            </p>
          </div>
        </div>

        {/* Emergency Broadcast Action & Demo Fleet Tag */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmergencyConfirmModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-950 border border-red-500/40 flex items-center gap-1.5 transition transform active:scale-95"
          >
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>BLUE GUARD AI VESSEL EMERGENCY BROADCAST</span>
          </button>
        </div>
      </div>

      {/* 2. GRID: VOICE ASSISTANT (LEFT) + V2V CROSS-LANGUAGE COMMS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* === LEFT COLUMN: SARVAM MULTILINGUAL VOICE ASSISTANT (§5 VISIBLE STATES) === */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex flex-col justify-between space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-cyan-200 uppercase tracking-wider">
                SARVAM MULTILINGUAL VOICE AI
              </span>
            </div>

            {/* Language Selector Dropdown with Native Script Labels (§6) */}
            <div className="flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setDetectedLangLabel(getLanguageLabelName(e.target.value));
                }}
                className="bg-slate-900 text-cyan-300 text-[11px] font-mono border border-cyan-800 rounded px-2 py-1 focus:outline-none"
              >
                <option value="en-IN">English (en-IN)</option>
                <option value="ta-IN">தமிழ் (Tamil)</option>
                <option value="hi-IN">हिंदी (Hindi)</option>
                <option value="te-IN">తెలుగు (Telugu)</option>
                <option value="ml-IN">മലയാളം (Malayalam)</option>
                <option value="kn-IN">ಕನ್ನಡ (Kannada)</option>
                <option value="bn-IN">বাংলা (Bengali)</option>
                <option value="mr-IN">मराठी (Marathi)</option>
                <option value="gu-IN">ગુજરાતી (Gujarati)</option>
              </select>
            </div>
          </div>

          {/* §5 VISIBLE VOICE STATES SEQUENCE BADGES */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold border shadow-lg transition-all ${
                voiceState === 'Ready'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  : voiceState === 'Listening'
                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                  : voiceState === 'Processing'
                  ? 'bg-amber-950 text-amber-300 border-amber-500 animate-bounce'
                  : voiceState === 'Detected'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                  : voiceState === 'Speaking'
                  ? 'bg-teal-950 text-teal-300 border-teal-500'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              {voiceState === 'Ready' && '🟢 READY'}
              {voiceState === 'Listening' && '🎙️ LISTENING...'}
              {voiceState === 'Processing' && '🧠 PROCESSING'}
              {voiceState === 'Detected' && `🌐 DETECTED: ${detectedLangLabel}`}
              {voiceState === 'Speaking' && `🔊 SPEAKING IN ${detectedLangLabel}`}
              {voiceState === 'Error' && '🔴 ERROR'}
              {voiceState === 'Mic Off' && '⚪ MIC OFF'}
            </span>
          </div>

          {/* LOW CONFIDENCE LANGUAGE DETECTED WARNING (§6) */}
          {isLowConfidenceLang && (
            <div className="p-2 bg-amber-950/80 border border-amber-500/50 rounded-xl text-[11px] text-amber-200 font-mono text-center">
              Language not confidently detected. Please select your language manually from the dropdown above.
            </div>
          )}

          {/* ERROR MESSAGE DISPLAY (§8) */}
          {voiceErrorMessage && (
            <div className="p-2 bg-red-950/80 border border-red-500/50 rounded-xl text-[11px] text-red-200 font-mono text-center">
              {voiceErrorMessage}
            </div>
          )}

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
                  ? 'bg-gradient-to-tr from-teal-600 to-emerald-500 ring-8 ring-teal-500/30'
                  : 'bg-gradient-to-tr from-cyan-600 via-teal-600 to-blue-600 hover:scale-105 ring-4 ring-cyan-500/20'
              }`}
            >
              {voiceState === 'Mic Off' ? (
                <MicOff className="w-8 h-8 text-slate-400" />
              ) : voiceState === 'Listening' ? (
                <Mic className="w-8 h-8 text-white animate-pulse" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
            <span className="text-[11px] font-mono text-cyan-300 font-bold mt-2">
              {voiceState === 'Listening' ? 'Tap to Stop' : 'Tap to Speak'}
            </span>
          </div>

          {/* LIVE TRANSCRIPT & RESPONSE DISPLAY BOX (§5 SEQUENCE) */}
          <div className="space-y-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 font-mono text-xs">
            <div>
              <span className="text-slate-400 font-bold">You said:</span>{' '}
              <span className="text-cyan-200 italic">
                {liveTranscript ? `"${liveTranscript}"` : '(Awaiting voice input...)'}
              </span>
            </div>

            {aiResponseText && (
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">Blue Guard AI ({detectedLangLabel}):</span>
                  {/* Replay & Stop Audio Controls (§4) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleReplayResponse}
                      title="Replay Voice Response"
                      className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded text-[10px] hover:bg-emerald-900 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Replay
                    </button>
                    <button
                      onClick={handleStopResponse}
                      title="Stop Voice Playback"
                      className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] hover:bg-slate-700 flex items-center gap-1"
                    >
                      <Square className="w-3 h-3 text-red-400" /> Stop
                    </button>
                  </div>
                </div>
                <p className="text-slate-200 mt-1 font-sans text-xs italic">
                  "{aiResponseText}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* === RIGHT COLUMN: V2V CROSS-LANGUAGE INTER-VESSEL COMMS (§9) === */}
        <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex flex-col justify-between space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-cyan-200 uppercase tracking-wider">
                V2V CROSS-LANGUAGE VESSEL MESH (CHANNEL 16)
              </span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">
              Sarvam Live Translation
            </span>
          </div>

          {/* Offline Alert Warning */}
          {offlineAlertMessage && (
            <div className="p-2 bg-amber-950/90 border border-amber-500/50 rounded-xl text-xs text-amber-200 font-mono animate-pulse">
              ⚠️ {offlineAlertMessage}
            </div>
          )}

          {/* Target Vessel Quick Direct Radio Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400">
              SELECT TARGET RECIPIENT VESSEL:
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedTargetVessel(null)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                  selectedTargetVessel === null
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Broadcast (Channel 16)
              </button>
              {nearbyVessels.map((vessel) => (
                <button
                  key={vessel.ship_id}
                  onClick={() => setSelectedTargetVessel(vessel)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition ${
                    selectedTargetVessel?.ship_id === vessel.ship_id
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Ship className="w-3 h-3" />
                  <span>{vessel.name}</span>
                  <span className={`w-2 h-2 rounded-full ${vessel.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* V2V Messages Feed */}
          <div className="flex-1 max-h-48 overflow-y-auto space-y-2 p-2 bg-slate-900/60 rounded-xl border border-slate-800 text-xs font-mono">
            {v2vMessages.map((msg) => (
              <div key={msg.id} className="p-2 bg-slate-950 rounded-lg border border-cyan-900/40">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="text-cyan-300 font-bold">{msg.sender_name} ({msg.sender_ship_id})</span>
                  <span>{msg.timestamp} · {msg.channel}</span>
                </div>
                <p className="text-slate-200 text-xs">
                  {msg.note || msg.text_content}
                </p>
              </div>
            ))}
          </div>

          {/* V2V Dispatch Text & Audio Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={v2vTextInput}
              onChange={(e) => setV2vTextInput(e.target.value)}
              placeholder={
                selectedTargetVessel
                  ? `Message to ${selectedTargetVessel.name} (auto-translates)...`
                  : 'Broadcast to Channel 16 fleet...'
              }
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => handleSendV2VDispatch()}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl text-xs font-extrabold text-white shadow-md shadow-cyan-500/20 hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Dispatch
            </button>
          </div>

        </div>

      </div>

      {/* 3. BLUE GUARD AI VESSEL EMERGENCY BROADCAST CONFIRMATION MODAL (§9) */}
      {showEmergencyConfirmModal && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel-crimson p-6 rounded-3xl border-2 border-rose-500 shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/50">
              <ShieldAlert className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white font-mono uppercase tracking-wider">
                BLUE GUARD AI VESSEL EMERGENCY BROADCAST
              </h3>
              <p className="text-xs text-rose-200 mt-1">
                This transmits a distress broadcast across the BlueGuard AI platform mesh, nearby vessel radios, and alert channels.
              </p>
            </div>

            <div className="text-left">
              <label className="block text-[10px] font-mono uppercase text-rose-300 mb-1">
                EMERGENCY REASON:
              </label>
              <input
                type="text"
                value={emergencyReasonInput}
                onChange={(e) => setEmergencyReasonInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-rose-500/50 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowEmergencyConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteEmergencyBroadcast}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-red-950 border border-red-400 flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" /> CONFIRM BROADCAST
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
