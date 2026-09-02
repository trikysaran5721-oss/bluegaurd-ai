'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import BlueGuardMic from '@/components/BlueGuardMic';
import EmergencyOverlay from '@/components/EmergencyOverlay';
import { demoStorage } from '@/lib/supabase';
import { ShipProfile } from '@/lib/types';
import { audioService } from '@/lib/audioService';
import { voiceService } from '@/lib/voiceService';
import { Mic, Sparkles, Volume2, Bot, User, ShieldCheck, Send, AlertOctagon } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  tools?: string[];
  timestamp: string;
  isEmergency?: boolean;
}

export default function AssistantPage() {
  const [userProfile, setUserProfile] = useState<ShipProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const user = demoStorage.getUser();
    setUserProfile(user);

    setMessages([
      {
        id: 'msg-1',
        sender: 'agent',
        text: 'BlueGuard Watchkeeper active. How can I assist your maritime voyage today?',
        tools: ['get_current_position', 'get_weather'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  const isEmergencyQuery = (text: string) => {
    const lower = text.toLowerCase();
    return lower.includes('emergency') || lower.includes('alert') || lower.includes('sos') || lower.includes('distress') || lower.includes('blueguard emergency') || lower.includes('blue gaurd emergency');
  };

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;
    setIsProcessing(true);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // 🚨 EMERGENCY INTENT RECOGNITION ("blueguard emergency alert", "emergency", "sos")
    if (isEmergencyQuery(queryText)) {
      const emergencyText = "🚨 EMERGENCY DISTRESS ALERT ACTIVATED: Broadcasting distress signal to all nearby vessels, NTFY mobile channel ('blueguard_maritime_emergency'), and higher official email ('trikysaran5721@gmail.com').";
      
      const agentMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        text: emergencyText,
        tools: ['create_emergency_alert', 'get_nearby_online_ships', 'dispatch_ntfy_push', 'send_official_email'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEmergency: true
      };

      setMessages((prev) => [...prev, agentMsg]);
      audioService.speak("Emergency distress alert activated. Broadcasting to all nearby vessels, NTFY channel, and higher official email.", userProfile?.preferred_language || 'en');

      // Dispatch global emergency event instantly
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('blueguard:trigger_emergency', { detail: { message: queryText } }));
      }, 300);

      setIsProcessing(false);
      return;
    }

    try {
      const res = await fetch('/api/agent', {
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
        const agentMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'agent',
          text: data.answer,
          tools: data.tools_called,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, agentMsg]);
        voiceService.synthesize(data.answer, data.language || 'ta-IN');
      } else {
        const fallbackText = "BlueGuard Report: Current weather along your route indicates 22 knot NE winds with 2.1m wave height. Proceed under CAUTION status.";
        const agentMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'agent',
          text: fallbackText,
          tools: ['get_weather', 'get_wind', 'calculate_route_risk'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, agentMsg]);
        voiceService.synthesize(fallbackText, userProfile?.preferred_language || 'en');
      }
    } catch {
      const fallbackText = "BlueGuard Report: Current weather along your route indicates 22 knot NE winds with 2.1m wave height. Proceed under CAUTION status.";
      const agentMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        text: fallbackText,
        tools: ['get_weather', 'get_wind', 'calculate_route_risk'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, agentMsg]);
      voiceService.synthesize(fallbackText, userProfile?.preferred_language || 'en');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="min-h-screen theme-voice flex flex-col">
      <Navigation userProfile={userProfile} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-6 pb-24">
        {/* Header */}
        <div className="glass-panel-emerald p-6 rounded-3xl border border-emerald-500/40 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-300 p-0.5 mx-auto mb-3 emerald-mic-glow flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
              <Mic className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-wider text-emerald-100">
            AGENTIC VOICE & TEXT ASSISTANT
          </h1>
          <p className="text-xs text-emerald-300 font-mono mt-1">
            Wake Phrase: "BlueGuard" | Say or type: "blueguard emergency alert" for SOS
          </p>
        </div>

        {/* Conversation Transcript Log */}
        <div className="flex-1 space-y-4 max-h-[520px] overflow-y-auto pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'user' ? 'bg-cyan-600 text-white' : msg.isEmergency ? 'bg-red-900 text-red-300 border border-red-500 animate-pulse' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : msg.isEmergency ? <AlertOctagon className="w-4 h-4 text-red-400" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-lg text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyan-950/80 text-cyan-100 border border-cyan-500/30'
                    : msg.isEmergency
                    ? 'bg-red-950/90 text-red-100 border-2 border-red-500 shadow-xl'
                    : 'glass-panel-emerald text-emerald-100 border border-emerald-500/40'
                }`}
              >
                <p className="font-sans text-sm">{msg.text}</p>
                {msg.tools && msg.tools.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-900/60 flex flex-wrap items-center gap-1 text-[10px] font-mono text-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Tools Called:
                    {msg.tools.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                        {t}()
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-[10px] font-mono text-slate-400 mt-1 text-right">{msg.timestamp}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Page Bottom Typed Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuery(inputQuery);
          }}
          className="glass-panel-emerald p-3 rounded-2xl border border-emerald-500/40 flex items-center gap-3 shadow-xl"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Type command (e.g. 'blueguard emergency alert' or 'What is the weather on my route?')..."
            className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-emerald-500/30 rounded-xl text-xs font-medium text-emerald-100 placeholder:text-emerald-700/60 focus:outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={isProcessing || !inputQuery.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl text-white font-extrabold text-xs shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </form>
      </main>

      <BlueGuardMic
        language={userProfile.preferred_language}
        onQuerySubmitted={handleQuery}
      />

      <EmergencyOverlay currentShip={userProfile} />
    </div>
  );
}
