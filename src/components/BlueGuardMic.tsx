'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, Send, Globe } from 'lucide-react';
import { voiceRecognitionService } from '@/lib/voiceRecognition';
import { audioService } from '@/lib/audioService';

interface BlueGuardMicProps {
  language?: string;
  onQuerySubmitted?: (query: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: '🇬🇧 English', speechLang: 'en-US' },
  { code: 'ta', label: '🇮🇳 Tamil (தமிழ்)', speechLang: 'ta-IN' },
  { code: 'hi', label: '🇮🇳 Hindi (हिंदी)', speechLang: 'hi-IN' },
  { code: 'te', label: '🇮🇳 Telugu (తెలుగు)', speechLang: 'te-IN' },
  { code: 'ml', label: '🇮🇳 Malayalam (മലയാളം)', speechLang: 'ml-IN' },
  { code: 'kn', label: '🇮🇳 Kannada (ಕನ್ನಡ)', speechLang: 'kn-IN' },
  { code: 'bn', label: '🇮🇳 Bengali (বাংলা)', speechLang: 'bn-IN' },
  { code: 'mr', label: '🇮🇳 Marathi (मराठी)', speechLang: 'mr-IN' },
  { code: 'gu', label: '🇮🇳 Gujarati (ગુજરાતી)', speechLang: 'gu-IN' }
];

export default function BlueGuardMic({ language = 'en', onQuerySubmitted }: BlueGuardMicProps) {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedQuery, setTypedQuery] = useState('');
  const [activeLang, setActiveLang] = useState(language);

  useEffect(() => {
    setActiveLang(language);
    voiceRecognitionService.setLanguage(language);

    // Auto-request microphone permission on website open for wake word ("Hey BlueGuard")
    voiceRecognitionService.requestMicPermissionAndListen(
      () => {
        // Wake Word Triggered Callback
        setIsActive(true);
        setIsListening(true);
        setTranscript('');

        const greetings: Record<string, string> = {
          en: 'BlueGuard active. How can I assist your voyage?',
          ta: 'புளூகார்ட் தயார். உங்களுக்கு எவ்வாறு உதவ வேண்டும்?',
          hi: 'ब्लूगार्ड सक्रिय है। मैं आपकी सहायता कैसे कर सकता हूँ?',
          te: 'బ్లూగార్డ్ యాక్టివ్‌గా ఉంది. నేను మీకు ఎలా సహాయపడగలను?',
          ml: 'ബ്ലൂഗാർഡ് സജീവമാണ്. എങ്ങനെ സഹായിക്കണം?',
          kn: 'ಬ್ಲೂಗಾರ್ಡ್ ಸಕ್ರಿಯವಾಗಿದೆ. ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
          bn: 'ব্লুগার্ড সক্রিয়। কীভাবে আপনাকে সাহায্য করতে পারি?',
          mr: 'ब्लूगार्ड सक्रिय आहे. मी तुम्हाला कशी मदत करू शकतो?',
          gu: 'બ્લૂગાર્ડ સક્રિય છે. હું તમને કેવી રીતે મદદ કરી શકું?'
        };

        const greetingText = greetings[activeLang] || greetings.en;
        audioService.speak(greetingText, activeLang);
      },
      (text, isFinal) => {
        // Continuous Live Speech Transcript Receiver
        if (text && text.trim().length > 0) {
          setTranscript(text);

          if (isFinal && text.trim().length > 2) {
            handleFinalVoiceQuery(text.trim());
          }
        }
      }
    );
  }, [language]);

  const handleLanguageChange = (langCode: string) => {
    setActiveLang(langCode);
    voiceRecognitionService.setLanguage(langCode);
  };

  const isEmergencyQuery = (text: string) => {
    const lower = text.toLowerCase();
    return lower.includes('emergency') || lower.includes('alert') || lower.includes('sos') || lower.includes('distress') || lower.includes('blueguard emergency') || lower.includes('ஆபத்து') || lower.includes('आपदा');
  };

  const handleFinalVoiceQuery = (queryText: string) => {
    if (isEmergencyQuery(queryText)) {
      setIsActive(false);
      window.dispatchEvent(new CustomEvent('blueguard:trigger_emergency', { detail: { message: queryText } }));
    } else if (onQuerySubmitted) {
      onQuerySubmitted(queryText);
    }
  };

  const handleStartVoice = () => {
    setIsActive(true);
    setIsListening(true);
    setTranscript('');
    voiceRecognitionService.setLanguage(activeLang);

    voiceRecognitionService.startListening((text, isFinal) => {
      if (text && text.trim().length > 0) {
        setTranscript(text);
        if (isFinal && text.trim().length > 2) {
          handleFinalVoiceQuery(text.trim());
        }
      }
    });
  };

  const handleSendTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedQuery.trim()) {
      const query = typedQuery.trim();
      setTranscript(query);
      setTypedQuery('');
      handleFinalVoiceQuery(query);
    }
  };

  const handleClose = () => {
    setIsActive(false);
    setIsListening(false);
    voiceRecognitionService.resetWakeWordState();
  };

  return (
    <>
      {/* 1. CORNER FLOATING MICROPHONE ICON (When Idle) */}
      {!isActive && (
        <button
          onClick={handleStartVoice}
          title="Activate BlueGuard Voice Assistant ('Hey BlueGuard')"
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all group"
        >
          <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center relative">
            <Mic className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping" />
          </div>
        </button>
      )}

      {/* 2. DRAMATIC TRANSFORMED FULL SCREEN / CENTER ORB OVERLAY (When Active) */}
      {isActive && (
        <div className="fixed inset-0 z-[99999] theme-voice flex flex-col items-center justify-center p-6 backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-900/80 text-slate-400 hover:text-white border border-slate-700 transition-colors z-[100000]"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Central Glowing Mic Orb */}
          <div className="relative mb-4 flex items-center justify-center">
            <div className="absolute w-72 h-72 rounded-full border-2 border-emerald-500/30 mic-pulse-ring" />
            <div className="absolute w-60 h-60 rounded-full border border-emerald-400/40 animate-ping" />
            
            <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-300 p-1 emerald-mic-glow flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-full flex flex-col items-center justify-center p-4">
                <Mic className="w-12 h-12 text-emerald-400 animate-pulse mb-1" />
                <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-widest font-bold">
                  ● VOICE & TEXT ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* Title Banner */}
          <h2 className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent mb-1">
            BLUEGUARD MULTILINGUAL ASSISTANT
          </h2>
          
          {/* Microphone Language Selector Bar */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-xl mb-4 bg-slate-950/80 p-2 rounded-2xl border border-emerald-500/30">
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold mr-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" /> SPEECH LANG:
            </span>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono transition-all ${
                  activeLang === lang.code
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/40 scale-105'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Equalizer Waveform Animation */}
          <div className="flex items-center gap-1.5 h-6 mb-4">
            {[40, 75, 90, 50, 85, 100, 60, 80, 45, 95, 30].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                className="w-1.5 bg-emerald-400 rounded-full animate-pulse"
              />
            ))}
          </div>

          {/* Transcript Display Box */}
          <div className="w-full max-w-lg glass-panel-emerald p-4 rounded-2xl text-center border border-emerald-500/40 mb-3">
            <p className="text-emerald-100 text-sm font-medium min-h-[40px] flex items-center justify-center italic">
              {transcript ? `"${transcript}"` : activeLang === 'hi' ? 'आपकी आवाज या पाठ का इंतजार...' : activeLang === 'ta' ? 'உங்கள் குரல் கட்டளைக்காக காத்திருக்கிறது...' : activeLang === 'te' ? 'మీ సంభాషణ కోసం వేచి ఉంది...' : 'Listening... Speak your question in any language now.'}
            </p>
          </div>

          {/* Typeable Command Input Form */}
          <form onSubmit={handleSendTyped} className="w-full max-w-lg flex items-center gap-2 mb-4">
            <input
              type="text"
              value={typedQuery}
              onChange={(e) => setTypedQuery(e.target.value)}
              placeholder="Type in ANY language (e.g. 'வானிலை எப்படி', 'मौसम कैसा है', 'What is weather')..."
              className="flex-1 px-4 py-2.5 bg-slate-950/90 border border-emerald-500/50 rounded-xl text-xs font-semibold text-emerald-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl text-white font-extrabold text-xs shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </form>

          {/* Multilingual Sample Prompts Pills */}
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
            {[
              'blueguard emergency alert',
              'What is the weather on my route?',
              'வானிலை எப்படி உள்ளது?',
              'आज मौसम कैसा है?',
              'ఈ రోజు వాతావరణం ఎలా ఉంది?'
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(prompt);
                  handleFinalVoiceQuery(prompt);
                }}
                className={`glass-button text-xs px-3 py-1.5 rounded-full border ${
                  idx === 0 ? 'text-red-300 border-red-500/60 bg-red-950/40 hover:bg-red-900/60' : 'text-emerald-200 border-emerald-500/30 hover:border-emerald-400'
                }`}
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
