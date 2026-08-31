// Web Audio, Speech Synthesis & Google AI Voice Service for BlueGuard Emergency & Multilingual AI

class AudioService {
  private audioCtx: AudioContext | null = null;
  private isAlarmPlaying = false;
  private activeOscillators: OscillatorNode[] = [];
  private alarmInterval: any = null;
  private speechSynth: SpeechSynthesis | null = null;
  private activeAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.speechSynth = window.speechSynthesis || null;

      // Auto-unlock AudioContext on first user interaction anywhere on screen
      const unlockHandler = () => {
        this.unlockAudioContext();
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
      };

      window.addEventListener('click', unlockHandler, { once: true });
      window.addEventListener('keydown', unlockHandler, { once: true });
      window.addEventListener('touchstart', unlockHandler, { once: true });
    }
  }

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public isContextSuspended(): boolean {
    this.initContext();
    return !this.audioCtx || this.audioCtx.state === 'suspended';
  }

  public unlockAudioContext(): boolean {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx?.state === 'running';
  }

  public playEmergencyAlarm() {
    this.unlockAudioContext();
    this.stopEmergencyAlarm();
    this.isAlarmPlaying = true;

    const playSirenPulse = () => {
      if (!this.isAlarmPlaying) return;
      
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      try {
        if (this.audioCtx && this.audioCtx.state === 'running') {
          const now = this.audioCtx.currentTime;

          const osc1 = this.audioCtx.createOscillator();
          const osc2 = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc1.type = 'sawtooth';
          osc2.type = 'square';

          osc1.frequency.setValueAtTime(960, now);
          osc1.frequency.linearRampToValueAtTime(480, now + 0.4);
          osc1.frequency.linearRampToValueAtTime(960, now + 0.8);

          osc2.frequency.setValueAtTime(480, now);
          osc2.frequency.linearRampToValueAtTime(240, now + 0.4);
          osc2.frequency.linearRampToValueAtTime(480, now + 0.8);

          gain.gain.setValueAtTime(0.90, now);
          gain.gain.exponentialRampToValueAtTime(0.08, now + 1.1);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.1);
          osc2.stop(now + 1.1);

          this.activeOscillators = [osc1, osc2];
        }
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

  /**
   * Universal Multilingual Speech Synthesis (Google AI Voice Stream + SpeechSynthesis Fallback)
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

    const langCodeMap: Record<string, string> = {
      en: 'en',
      ta: 'ta',
      hi: 'hi',
      te: 'te',
      ml: 'ml',
      kn: 'kn',
      bn: 'bn',
      mr: 'mr',
      gu: 'gu'
    };

    const targetLang = langCodeMap[language] || 'en';

    // 1. Try Google Voice Audio Stream for crystal-clear native regional voice (Tamil, Hindi, Telugu, etc.)
    try {
      const cleanText = text.replace(/[*_#~`]/g, '').trim().slice(0, 200);
      const encodedText = encodeURIComponent(cleanText);
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetLang}&client=tw-ob&q=${encodedText}`;

      const audio = new Audio(ttsUrl);
      this.activeAudio = audio;

      audio.play().catch((err) => {
        console.warn('Google Voice Audio Stream fallback to SpeechSynthesis:', err);
        this.speakBrowserSynth(text, targetLang);
      });
      return;
    } catch (err) {
      console.warn('Audio stream error:', err);
    }

    // 2. Fallback to Browser SpeechSynthesis
    this.speakBrowserSynth(text, targetLang);
  }

  private speakBrowserSynth(text: string, targetLang: string) {
    if (!this.speechSynth) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const fullLangMap: Record<string, string> = {
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

      const langCode = fullLangMap[targetLang] || 'en-US';
      utterance.lang = langCode;

      const voices = this.speechSynth.getVoices();
      const matchedVoice = voices.find((v) =>
        v.lang.toLowerCase().includes(targetLang) ||
        v.lang.toLowerCase().includes(langCode.toLowerCase())
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      this.speechSynth.speak(utterance);
    } catch (err) {
      console.warn('Browser SpeechSynthesis error:', err);
    }
  }
}

export const audioService = new AudioService();
