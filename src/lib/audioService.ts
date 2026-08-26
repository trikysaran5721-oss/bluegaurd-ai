// Web Audio & Speech Synthesis Service for BlueGuard Emergency Alarming

class AudioService {
  private audioCtx: AudioContext | null = null;
  private isAlarmPlaying = false;
  private activeOscillators: OscillatorNode[] = [];
  private speechSynth: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.speechSynth = window.speechSynthesis || null;
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
      this.audioCtx.resume();
    }
    return this.audioCtx?.state === 'running';
  }

  public playEmergencyAlarm() {
    this.initContext();
    if (!this.audioCtx) return;

    this.stopEmergencyAlarm();
    this.isAlarmPlaying = true;

    try {
      const now = this.audioCtx.currentTime;

      // High-low dual tone siren sound generator
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      // Modulate frequency to create alarming siren pulse
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.linearRampToValueAtTime(440, now + 0.4);
      osc1.frequency.linearRampToValueAtTime(880, now + 0.8);

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.linearRampToValueAtTime(220, now + 0.4);
      osc2.frequency.linearRampToValueAtTime(440, now + 0.8);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 3.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 3.0);
      osc2.stop(now + 3.0);

      this.activeOscillators = [osc1, osc2];

      setTimeout(() => {
        this.isAlarmPlaying = false;
      }, 3000);
    } catch (err) {
      console.warn('Audio alarm playback error:', err);
    }
  }

  public stopEmergencyAlarm() {
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.activeOscillators = [];
    this.isAlarmPlaying = false;
  }

  public speak(text: string, language: 'en' | 'hi' = 'en') {
    if (!this.speechSynth || typeof window === 'undefined') return;

    this.speechSynth.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-US';
    }

    // Try finding exact language voice if available
    const voices = this.speechSynth.getVoices();
    const matchedVoice = voices.find((v) =>
      language === 'hi' ? v.lang.includes('hi') || v.name.includes('Hindi') : v.lang.includes('en')
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    this.speechSynth.speak(utterance);
  }
}

export const audioService = new AudioService();
