'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Radio, Mic, MicOff, Upload, Play, Pause, Volume2, ShieldAlert, CheckCircle2, X, RefreshCw, RadioReceiver } from 'lucide-react';
import { V2VVoiceMessage, ShipProfile } from '@/lib/types';
import { emergencyRealtimeNetwork } from '@/lib/emergencyRealtime';
import { demoStorage } from '@/lib/supabase';
import { audioService } from '@/lib/audioService';

interface V2VCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const V2VCommunicationModal: React.FC<V2VCommunicationModalProps> = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState<ShipProfile | null>(null);
  const [voiceMessages, setVoiceMessages] = useState<V2VVoiceMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const user = demoStorage.getUser();
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser({
        ship_id: '123456789012',
        google_user_id: 'demo_handler',
        display_name: 'MV Ocean Watcher',
        email: 'handler@blueguard.maritime',
        preferred_language: 'en',
        latitude: 13.0827,
        longitude: 80.2707,
        heading: 145,
        speed: 14.2,
        destination: 'Colombo',
        online_status: 'ONLINE'
      });
    }

    // Default initial mock radio dispatches
    setVoiceMessages([
      {
        id: 'v2v_demo_1',
        sender_ship_id: '987654321098',
        sender_name: 'MV Ocean Warrior',
        audio_url: '', // Demo placeholder
        duration_sec: 4,
        timestamp: new Date(Date.now() - 360000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        channel: 'Channel 16',
        note: 'Radio Check: Advisory on NE winds near Dondra Head'
      }
    ]);

    // Subscribe to incoming V2V voice messages over Supabase Realtime
    emergencyRealtimeNetwork.onV2VVoiceReceived((newVoiceMsg) => {
      console.log('[V2V UI] Received voice dispatch:', newVoiceMsg);
      setVoiceMessages((prev) => [newVoiceMsg, ...prev]);
      setStatusMessage(`🎙️ New radio voice dispatch received from Ship ${newVoiceMsg.sender_ship_id}`);
      
      // Auto play audio dispatch if audio URL present
      if (newVoiceMsg.audio_url) {
        playAudio(newVoiceMsg.id, newVoiceMsg.audio_url);
      }
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const [recordedAudioPreview, setRecordedAudioPreview] = useState<string | null>(null);

  const startRecording = async () => {
    audioService.unlockAudioContext();
    setRecordedAudioPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setRecordedAudioPreview(base64Audio);
          setStatusMessage('🎧 Voice recorded! Click Listen Preview to verify or Broadcast to send.');
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      setStatusMessage('❌ Microphone permission denied or unavailable');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    audioService.unlockAudioContext();
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64Audio = reader.result as string;
      broadcastVoice(base64Audio, 5, `Uploaded Audio File: ${file.name}`);
    };
  };

  const broadcastVoice = (audioDataUrl: string, durationSec: number, note: string) => {
    const shipId = currentUser?.ship_id || '123456789012';
    const shipName = currentUser?.display_name || `Ship ${shipId}`;

    const newMsg: V2VVoiceMessage = {
      id: 'v2v_' + Date.now(),
      sender_ship_id: shipId,
      sender_name: shipName,
      audio_url: audioDataUrl,
      duration_sec: durationSec,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: 'Channel 16',
      note: note
    };

    // Add locally to feed
    setVoiceMessages((prev) => [newMsg, ...prev]);

    // Broadcast across Supabase Realtime to all connected devices globally
    emergencyRealtimeNetwork.broadcastV2VVoiceMessage(newMsg);
    setStatusMessage('📡 Radio voice message broadcasted to all online vessels!');
  };

  const playAudio = (id: string, audioUrl: string) => {
    audioService.unlockAudioContext();

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }

    if (activePlayingId === id) {
      setActivePlayingId(null);
      return;
    }

    if (!audioUrl) {
      // Demo tone fallback if no base64 audio
      audioService.speak('This is a simulated vessel radio transmission on Channel 16.', 'en');
      return;
    }

    const audio = new Audio(audioUrl);
    activeAudioRef.current = audio;
    setActivePlayingId(id);

    audio.play().catch((err) => {
      console.warn('Audio play failed:', err);
      setActivePlayingId(null);
    });

    audio.onended = () => {
      setActivePlayingId(null);
      activeAudioRef.current = null;
    };
  };

  const testBurstAlarm = () => {
    audioService.unlockAudioContext();
    audioService.playEmergencyAlarm();
    setStatusMessage('🔊 Testing loud dual-tone emergency alarm burst!');
    setTimeout(() => {
      audioService.stopEmergencyAlarm();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 rounded-xl border border-cyan-400/40 text-cyan-400 animate-pulse">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">V2V MARITIME RADIO HUB</h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  CHANNEL 16 ACTIVE
                </span>
              </div>
              <p className="text-xs text-cyan-300/80">Direct Vessel-to-Vessel Voice & Telemetry Communication Mesh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Device Profile Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">THIS DEVICE VESSEL IDENTIFIER</div>
              <div className="text-base font-bold text-cyan-300 flex items-center gap-2">
                <span>{currentUser?.display_name || 'MV BlueGuard Watchkeeper'}</span>
                <span className="text-xs text-slate-400">(Ship ID: {currentUser?.ship_id})</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={testBurstAlarm}
                className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
              >
                <Volume2 className="w-4 h-4" />
                Test Alarm Siren
              </button>
            </div>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div className="p-3 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-xs text-cyan-200 flex items-center justify-between">
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage('')} className="text-cyan-400 hover:text-white font-bold ml-2">✕</button>
            </div>
          )}

          {/* Voice Dispatch Controls (Recording & File Upload) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Record Voice Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-cyan-500/30 flex flex-col items-center justify-center text-center space-y-3">
              <div className="text-sm font-semibold text-cyan-200 uppercase tracking-wider flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                Record Voice Radio Dispatch
              </div>
              <p className="text-xs text-slate-400">Record a live voice message and broadcast to all online ships across laptops.</p>

              {isRecording ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-2xl font-mono font-bold text-red-400 animate-pulse">
                    00:0{recordingTime}
                  </div>
                  <button
                    onClick={stopRecording}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/50 flex items-center gap-2 transition transform active:scale-95"
                  >
                    <MicOff className="w-5 h-5" />
                    Stop Recording
                  </button>
                </div>
              ) : recordedAudioPreview ? (
                <div className="space-y-3 w-full">
                  <div className="text-xs text-emerald-300 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Recording Ready for Preview
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => playAudio('preview', recordedAudioPreview)}
                      className="px-4 py-2 bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/50 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Play className="w-4 h-4" /> Listen Preview
                    </button>
                    <button
                      onClick={() => {
                        broadcastVoice(recordedAudioPreview, recordingTime || 4, 'Recorded Voice Radio Dispatch');
                        setRecordedAudioPreview(null);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5"
                    >
                      <Radio className="w-4 h-4" /> Broadcast Dispatch
                    </button>
                    <button
                      onClick={() => {
                        setRecordedAudioPreview(null);
                        startRecording();
                      }}
                      className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                    >
                      Re-record
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/50 flex items-center gap-2 transition transform active:scale-95"
                >
                  <Mic className="w-5 h-5" />
                  Hold/Press to Record
                </button>
              )}
            </div>

            {/* Upload Audio File Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-cyan-500/30 flex flex-col items-center justify-center text-center space-y-3">
              <div className="text-sm font-semibold text-cyan-200 uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                Upload Audio File
              </div>
              <p className="text-xs text-slate-400">Select an audio file (MP3, WAV, WEBM) to transmit over V2V Channel 16.</p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="audio/*"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl border border-slate-500/40 flex items-center gap-2 transition transform active:scale-95"
              >
                <Upload className="w-5 h-5 text-cyan-400" />
                Choose Audio File & Send
              </button>
            </div>
          </div>

          {/* Inter-Ship Radio Voice Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <RadioReceiver className="w-4 h-4" />
                Inter-Ship Voice Dispatches ({voiceMessages.length})
              </span>
              <span>Updated via Supabase Realtime</span>
            </div>

            {voiceMessages.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/30 rounded-xl border border-slate-700/50 text-slate-400 text-sm">
                No voice dispatches received yet. Record or upload a voice message above to transmit.
              </div>
            ) : (
              <div className="space-y-3">
                {voiceMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 rounded-xl bg-slate-800/70 border border-cyan-500/30 hover:border-cyan-400 transition flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{msg.sender_name}</span>
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                          #{msg.sender_ship_id}
                        </span>
                        <span className="text-xs text-slate-400">{msg.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300">{msg.note}</p>
                    </div>

                    <button
                      onClick={() => playAudio(msg.id, msg.audio_url)}
                      className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition ${
                        activePlayingId === msg.id
                          ? 'bg-amber-500 text-black animate-pulse'
                          : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40'
                      }`}
                    >
                      {activePlayingId === msg.id ? (
                        <>
                          <Pause className="w-4 h-4" /> Playing Dispatch...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" /> Play Voice Dispatch
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 bg-slate-950 border-t border-cyan-500/20 flex items-center justify-between text-xs text-slate-400">
          <span>Supported Formats: Base64 Audio, WebM, WAV, MP3</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Realtime WebSocket Active
          </span>
        </div>

      </div>
    </div>
  );
};
