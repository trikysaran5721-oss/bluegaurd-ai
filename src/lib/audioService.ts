// Centralized Audio, Alarm Siren & Multilingual Voice Service for BlueGuard AI

class AudioService {
  private audioContext: AudioContext | null = null;
  private isAlarmPlaying = false;
  private alarmInterval: any = null;
  private activeOscillators: OscillatorNode[] = [];
  private speechSynth: SpeechSynthesis | null = null;
  private activeAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.speechSynth = window.speechSynthesis || null;

      // Auto-unlock AudioContext on first user touch/click interaction
      const unlockAudio = () => {
        if (!this.audioContext) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            this.audioContext = new AudioCtx();
          }
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };

      window.addEventListener('click', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
    }
  }

  public unlockAudioContext() {
    if (typeof window === 'undefined') return;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.audioContext = new AudioCtx();
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public isContextSuspended(): boolean {
    return Boolean(this.audioContext && this.audioContext.state === 'suspended');
  }

  /**
   * Universal Multilingual Speech Synthesis (Same-Origin /api/voice/synthesize MP3 Stream)
   */
  public speak(text: string, language: string = 'en') {
    if (!text || typeof window === 'undefined') return;

    // Stop any existing active voice playback
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }

    const cleanText = text.replace(/[*_#~`]/g, '').trim().slice(0, 250);
    if (!cleanText) return;

    try {
      const encodedText = encodeURIComponent(cleanText);
      const langCode = language || 'en';
      
      // Use relative /api/voice/synthesize MP3 audio stream (Same origin, zero CORS errors!)
      const audioUrl = `/api/voice/synthesize?text=${encodedText}&lang=${encodeURIComponent(langCode)}`;

      const audio = new Audio(audioUrl);
      this.activeAudio = audio;

      audio.play().catch((err) => {
        console.warn('Backend MP3 Audio Stream fallback to SpeechSynthesis:', err);
        this.speakBrowserSynth(cleanText, langCode);
      });
      return;
    } catch (err) {
      console.warn('Audio stream error:', err);
    }

    this.speakBrowserSynth(cleanText, language);
  }

  private speakBrowserSynth(text: string, targetLang: string) {
    if (!this.speechSynth) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const langMap: Record<string, string> = {
        en: 'en-US',
        ta: 'ta-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        ml: 'ml-IN',
        kn: 'kn-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        'en-IN': 'en-US',
        'ta-IN': 'ta-IN',
        'hi-IN': 'hi-IN',
        'te-IN': 'te-IN',
        'ml-IN': 'ml-IN',
        'kn-IN': 'kn-IN',
        'bn-IN': 'bn-IN',
        'mr-IN': 'mr-IN',
        'gu-IN': 'gu-IN'
      };

      utterance.lang = langMap[targetLang] || targetLang || 'en-US';

      // Pick matching voice if available
      const voices = this.speechSynth.getVoices();
      const matchingVoice = voices.find((v) => v.lang.startsWith(targetLang.split('-')[0]));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      this.speechSynth.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
    }
  }

  public playEmergencyAlarm() {
    if (this.isAlarmPlaying || typeof window === 'undefined') return;
    this.isAlarmPlaying = true;

    const playSirenPulse = () => {
      if (!this.isAlarmPlaying) return;

      try {
        if (!this.audioContext) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) this.audioContext = new AudioCtx();
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }

        if (!this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.4);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.8);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.1);

        this.activeOscillators.push(osc);
      } catch (err) {
        console.warn('Siren pulse Web Audio error:', err);
      }
    };

    playSirenPulse();
    this.alarmInterval = setInterval(playSirenPulse, 1200);
  }

  public stopEmergencyAlarm() {
    this.isAlarmPlaying = false;
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.activeOscillators = [];
  }
}

export const audioService = new AudioService();
