'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  RadioTower,
  Play,
  Pause,
  Volume2,
  Mic,
  MicOff,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  MessageSquare,
  Send,
  X,
  ChevronDown,
  ShieldAlert,
  CornerDownRight,
  Sparkles
} from 'lucide-react';
import { V2VVoiceMessage, ShipProfile } from '@/lib/types';
import { emergencyRealtimeNetwork } from '@/lib/emergencyRealtime';
import { demoStorage } from '@/lib/supabase';
import { audioService } from '@/lib/audioService';

export default function V2VFloatingWidget() {
  const [currentUser, setCurrentUser] = useState<ShipProfile | null>(null);
  const [dispatches, setDispatches] = useState<V2VVoiceMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasUnreadAlert, setHasUnreadAlert] = useState(false);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  // Reply State
  const [replyingTo, setReplyingTo] = useState<V2VVoiceMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyMediaType, setReplyMediaType] = useState<'text' | 'voice' | 'image' | 'video' | 'audio'>('text');
  
  // Voice Recording Preview State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioPreview, setRecordedAudioPreview] = useState<string | null>(null);
  
  // Upload Previews
  const [uploadedMediaPreview, setUploadedMediaPreview] = useState<string | null>(null);
  const [uploadedMediaType, setUploadedMediaType] = useState<'audio' | 'image' | 'video' | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const user = demoStorage.getUser();
    if (user) {
      setCurrentUser(user);
    }

    // Default initial mock radio dispatch
    const initialMsg: V2VVoiceMessage = {
      id: 'v2v_initial_1',
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

    setDispatches([initialMsg]);

    // Listen for incoming V2V broadcasts via Supabase Realtime
    emergencyRealtimeNetwork.onV2VVoiceReceived((newDispatch) => {
      console.log('[V2V FLOATING WIDGET] Received dispatch:', newDispatch);
      setDispatches((prev) => [newDispatch, ...prev]);
      setHasUnreadAlert(true);

      // Play audio automatically if audio URL present
      if (newDispatch.audio_url || (newDispatch.media_type === 'audio' && newDispatch.media_url)) {
        playAudio(newDispatch.id, newDispatch.audio_url || newDispatch.media_url || '');
      }
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Play / Pause Audio helper
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
      audioService.speak('Vessel radio transmission received on Channel 16.', 'en');
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

  // Start Voice Recording with PREVIEW
  const startVoiceRecording = async () => {
    audioService.unlockAudioContext();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setRecordedAudioPreview(reader.result as string);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // File Upload Handler (Audio, Image, Video)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'audio' | 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setUploadedMediaPreview(reader.result as string);
      setUploadedMediaType(fileType);
    };
  };

  // Broadcast Message or Reply
  const handleSendDispatch = () => {
    const shipId = currentUser?.ship_id || '123456789012';
    const shipName = currentUser?.display_name || `Ship ${shipId}`;

    let mediaType: 'audio' | 'image' | 'video' | 'text' = 'text';
    let mediaUrl = '';
    let textContent = replyText;

    if (recordedAudioPreview) {
      mediaType = 'audio';
      mediaUrl = recordedAudioPreview;
    } else if (uploadedMediaPreview && uploadedMediaType) {
      mediaType = uploadedMediaType;
      mediaUrl = uploadedMediaPreview;
    }

    const newDispatch: V2VVoiceMessage = {
      id: 'v2v_' + Date.now(),
      sender_ship_id: shipId,
      sender_name: shipName,
      audio_url: mediaType === 'audio' ? mediaUrl : '',
      duration_sec: recordingSeconds || 5,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: 'Channel 16',
      note: textContent || (replyingTo ? `Reply to #${replyingTo.sender_ship_id}` : 'V2V Broadcast'),
      media_type: mediaType,
      media_url: mediaUrl,
      text_content: textContent,
      reply_to_id: replyingTo?.id,
      reply_to_sender: replyingTo ? replyingTo.sender_name : undefined,
      reply_to_snippet: replyingTo ? (replyingTo.text_content || replyingTo.note) : undefined
    };

    // Add locally & broadcast over Supabase Realtime
    setDispatches((prev) => [newDispatch, ...prev]);
    emergencyRealtimeNetwork.broadcastV2VVoiceMessage(newDispatch);

    // Reset Form
    setReplyText('');
    setRecordedAudioPreview(null);
    setUploadedMediaPreview(null);
    setUploadedMediaType(null);
    setReplyingTo(null);
    setRecordingSeconds(0);
  };

  return (
    <aside aria-label="Vessel Radio Dispatch Widget" className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      
      {/* 1. PERSISTENT FLOATING ALERT BUTTON (WHEN COLLAPSED) */}
      {!isExpanded && (
        <button
          onClick={() => {
            setIsExpanded(true);
            setHasUnreadAlert(false);
          }}
          className="relative group p-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl shadow-2xl shadow-cyan-950 border border-cyan-400/50 flex items-center gap-3 transition transform hover:scale-105 active:scale-95"
        >
          <div className="relative flex items-center justify-center">
            <RadioTower className="w-6 h-6 text-cyan-200 animate-pulse" />
            {hasUnreadAlert && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              </span>
            )}
          </div>

          <div className="text-left font-mono pr-1">
            <div className="text-xs font-bold tracking-wider flex items-center gap-1.5">
              <span>V2V RADIO DISPATCH</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40">LIVE</span>
            </div>
            <p className="text-[10px] text-cyan-200">Click to listen & chat with nearby ships</p>
          </div>

          {dispatches.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-cyan-300 text-xs font-mono font-bold border border-cyan-800">
              {dispatches.length}
            </span>
          )}
        </button>
      )}

      {/* 2. EXPANDED FLOATING V2V DISPATCH & CHAT DRAWER */}
      {isExpanded && (
        <div className="w-[360px] sm:w-[420px] max-h-[560px] bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-3xl shadow-2xl shadow-slate-950 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 border-b border-cyan-500/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-500/20 rounded-lg text-cyan-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-white tracking-wide flex items-center gap-2">
                  <span>V2V RADIO FEED</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 rounded font-mono">CH 16</span>
                </div>
                <p className="text-[10px] text-cyan-300/80">Real-time Inter-Ship Voice & Chat Mesh</p>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages & Dispatches Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 max-h-[300px] bg-slate-950/70">
            {dispatches.map((msg) => {
              const isMine = msg.sender_ship_id === currentUser?.ship_id;
              return (
                <div
                  key={msg.id}
                  className={`p-3 rounded-2xl border text-xs space-y-2 transition ${
                    isMine
                      ? 'bg-cyan-950/50 border-cyan-500/40 ml-4'
                      : 'bg-slate-800/80 border-slate-700/80 mr-4'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{msg.sender_name}</span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                        #{msg.sender_ship_id}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  </div>

                  {/* Reply Quote Badge if present */}
                  {msg.reply_to_sender && (
                    <div className="p-2 rounded-xl bg-slate-900/90 border-l-2 border-cyan-400 text-[10px] text-slate-300 flex items-center gap-1.5">
                      <CornerDownRight className="w-3 h-3 text-cyan-400 shrink-0" />
                      <div>
                        <span className="text-cyan-300 font-bold">Replying to {msg.reply_to_sender}:</span>
                        <p className="truncate text-slate-400">{msg.reply_to_snippet}</p>
                      </div>
                    </div>
                  )}

                  {/* Message Content rendering based on media type */}
                  {msg.text_content && (
                    <p className="text-slate-200 leading-relaxed font-sans">{msg.text_content}</p>
                  )}

                  {/* Audio Dispatch / Voice Record */}
                  {(msg.audio_url || msg.media_type === 'audio') && (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/80 border border-cyan-500/30">
                      <button
                        onClick={() => playAudio(msg.id, msg.audio_url || msg.media_url || '')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                          activePlayingId === msg.id
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                        }`}
                      >
                        {activePlayingId === msg.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {activePlayingId === msg.id ? 'Playing Voice...' : 'Play Radio Voice'}
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">{msg.duration_sec || 4}s</span>
                    </div>
                  )}

                  {/* Image Dispatch */}
                  {msg.media_type === 'image' && msg.media_url && (
                    <div className="rounded-xl overflow-hidden border border-cyan-500/30">
                      <img src={msg.media_url} alt="V2V Upload" className="w-full max-h-48 object-cover" />
                    </div>
                  )}

                  {/* Video Dispatch */}
                  {msg.media_type === 'video' && msg.media_url && (
                    <div className="rounded-xl overflow-hidden border border-cyan-500/30">
                      <video src={msg.media_url} controls className="w-full max-h-48" />
                    </div>
                  )}

                  {/* Reply Button */}
                  <div className="flex items-center justify-end pt-1">
                    <button
                      onClick={() => {
                        setReplyingTo(msg);
                        setReplyMediaType('text');
                      }}
                      className="text-[10px] text-cyan-300 hover:text-white flex items-center gap-1 font-mono hover:underline"
                    >
                      <CornerDownRight className="w-3 h-3" /> Reply to this dispatch
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Composer & Reply Box */}
          <div className="p-3 bg-slate-900 border-t border-cyan-500/30 space-y-2.5">
            
            {/* Target Reply Banner */}
            {replyingTo && (
              <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-cyan-300">
                  <CornerDownRight className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Replying to <strong>{replyingTo.sender_name}</strong></span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-cyan-400 hover:text-white">✕</button>
              </div>
            )}

            {/* Media Mode Selector */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setReplyMediaType('text')}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                    replyMediaType === 'text' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Text
                </button>

                <button
                  onClick={() => setReplyMediaType('voice')}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                    replyMediaType === 'voice' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" /> Voice
                </button>

                <button
                  onClick={() => {
                    setReplyMediaType('audio');
                    fileInputRef.current?.click();
                  }}
                  className="p-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5 text-teal-400" /> Sound
                </button>

                <button
                  onClick={() => {
                    setReplyMediaType('image');
                    fileInputRef.current?.click();
                  }}
                  className="p-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 flex items-center gap-1"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> Image
                </button>

                <button
                  onClick={() => {
                    setReplyMediaType('video');
                    fileInputRef.current?.click();
                  }}
                  className="p-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 flex items-center gap-1"
                >
                  <VideoIcon className="w-3.5 h-3.5 text-amber-400" /> Video
                </button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const targetType = replyMediaType === 'image' ? 'image' : replyMediaType === 'video' ? 'video' : 'audio';
                handleFileUpload(e, targetType);
              }}
              accept={
                replyMediaType === 'image'
                  ? 'image/*'
                  : replyMediaType === 'video'
                  ? 'video/*'
                  : 'audio/*'
              }
              className="hidden"
            />

            {/* Voice Recording Controls with PREVIEW */}
            {replyMediaType === 'voice' && (
              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2 text-center">
                {isRecording ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-rose-400 font-bold animate-pulse">
                      🎙️ RECORDING: 00:0{recordingSeconds}
                    </span>
                    <button
                      onClick={stopVoiceRecording}
                      className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg"
                    >
                      Stop & Preview
                    </button>
                  </div>
                ) : recordedAudioPreview ? (
                  <div className="space-y-2">
                    <div className="text-[11px] text-emerald-300 font-bold flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Recording Ready to Preview & Broadcast
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => playAudio('preview', recordedAudioPreview)}
                        className="px-3 py-1 bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5" /> Listen Preview
                      </button>
                      <button
                        onClick={() => {
                          setRecordedAudioPreview(null);
                          startVoiceRecording();
                        }}
                        className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs"
                      >
                        Re-record
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={startVoiceRecording}
                    className="w-full py-2 bg-cyan-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                  >
                    <Mic className="w-4 h-4" /> Start Voice Recording
                  </button>
                )}
              </div>
            )}

            {/* Upload Preview Badge */}
            {uploadedMediaPreview && (
              <div className="p-2 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs flex items-center justify-between">
                <span className="text-cyan-300 font-bold capitalize">
                  {uploadedMediaType} Attached
                </span>
                <button
                  onClick={() => {
                    setUploadedMediaPreview(null);
                    setUploadedMediaType(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Text Input & Send Button */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type radio chat message or note..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              />

              <button
                onClick={handleSendDispatch}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950 transition transform active:scale-95"
              >
                <Send className="w-3.5 h-3.5" /> Broadcast
              </button>
            </div>

          </div>

        </div>
      )}

    </aside>
  );
}
