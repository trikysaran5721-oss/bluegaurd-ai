// Web Audio & Speech Synthesis Service for BlueGuard Emergency Alarming

class AudioService {
  private audioCtx: AudioContext | null = null;
  private isAlarmPlaying = false;
  private activeOscillators: OscillatorNode[] = [];
  private alarmInterval: any = null;
  private speechSynth: SpeechSynthesis | null = null;
  private fallbackAudio: HTMLAudioElement | null = null;

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
      
      // Ensure context is active
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

          // High-decibel dual-tone maritime siren sweep (960Hz / 480Hz)
          osc1.frequency.setValueAtTime(960, now);
          osc1.frequency.linearRampToValueAtTime(480, now + 0.4);
          osc1.frequency.linearRampToValueAtTime(960, now + 0.8);

          osc2.frequency.setValueAtTime(480, now);
          osc2.frequency.linearRampToValueAtTime(240, now + 0.4);
          osc2.frequency.linearRampToValueAtTime(480, now + 0.8);

          // Max volume (0.90 gain)
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

  public speak(text: string, language: string = 'en') {
    if (!this.speechSynth || typeof window === 'undefined') return;

    try {
      this.speechSynth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const langMap: Record<string, string> = {
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

      const targetLangCode = langMap[language] || 'en-US';
      utterance.lang = targetLangCode;

      const voices = this.speechSynth.getVoices();
      const matchedVoice = voices.find((v) =>
        v.lang.toLowerCase().includes(language) ||
        v.lang.toLowerCase().includes(targetLangCode.toLowerCase())
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      this.speechSynth.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
    }
  }
}

export const audioService = new AudioService();
