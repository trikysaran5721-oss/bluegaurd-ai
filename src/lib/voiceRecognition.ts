// Single Master Voice Recognition & Wake Word ("Hey BlueGuard") Service

export interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

type VoiceCallback = (transcript: string, isFinal: boolean) => void;
type TriggerCallback = () => void;
type EmergencyVoiceCallback = () => void;

class VoiceRecognitionService {
  private recognition: any = null;
  private isListening = false;
  private isWakeWordActive = false;
  private onTranscriptCallback: VoiceCallback | null = null;
  private onWakeWordTriggered: TriggerCallback | null = null;
  private onEmergencyTriggered: EmergencyVoiceCallback | null = null;
  private currentLanguage: string = 'en';

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.updateLangCode();

        this.recognition.onresult = (event: SpeechRecognitionResultEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptChunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptChunk;
            } else {
              interimTranscript += transcriptChunk;
            }
          }

          const rawText = finalTranscript || interimTranscript;
          const combined = rawText.toLowerCase().trim();

          // Check for wake phrase "BlueGuard" / "Hey BlueGuard" in various regional transliterations
          const isWake =
            combined.includes('blueguard') ||
            combined.includes('blue guard') ||
            combined.includes('hey blueguard') ||
            combined.includes('hey blue guard') ||
            combined.includes('புளூகார்ட்') ||
            combined.includes('ப்ளூ கார்ட்') ||
            combined.includes('ब्लूगार्ड');

          if (isWake && !this.isWakeWordActive) {
            this.isWakeWordActive = true;
            if (this.onWakeWordTriggered) {
              this.onWakeWordTriggered();
            }

            // Check for emergency voice command
            if (
              combined.includes('send emergency') ||
              combined.includes('emergency alert') ||
              combined.includes('ஆபத்து') ||
              combined.includes('आपत्कालीन')
            ) {
              if (this.onEmergencyTriggered) {
                this.onEmergencyTriggered();
              }
            }
          }

          // Strip wake word phrase from query text if present
          let cleanTranscript = rawText
            .replace(/hey blueguard/gi, '')
            .replace(/blueguard/gi, '')
            .replace(/blue guard/gi, '')
            .replace(/புளூகார்ட்/gi, '')
            .replace(/ब्लूगार्ड/gi, '')
            .trim();

          if (this.onTranscriptCallback && (cleanTranscript || rawText)) {
            this.onTranscriptCallback(cleanTranscript || rawText, Boolean(finalTranscript));
          }
        };

        this.recognition.onerror = (event: any) => {
          // Gracefully ignore no-speech or network errors so mic stays active silently
          if (event.error === 'no-speech' || event.error === 'network' || event.error === 'aborted') {
            return;
          }
          console.warn('[VOICE RECOGNITION ERROR]', event.error);
        };

        this.recognition.onend = () => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch {}
          }
        };
      }
    }
  }

  public updateLangCode() {
    if (!this.recognition) return;
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
    const targetCode = langCodeMap[this.currentLanguage] || 'en-US';
    this.recognition.lang = targetCode;
  }

  public setLanguage(lang: string) {
    this.currentLanguage = lang;
    this.updateLangCode();
    // Restart recognition with new language if active
    if (this.isListening && this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  /**
   * Request mic permission on startup & begin continuous background wake word listening
   */
  public requestMicPermissionAndListen(onWakeWord: TriggerCallback, onTranscript?: VoiceCallback) {
    this.onWakeWordTriggered = onWakeWord;
    if (onTranscript) {
      this.onTranscriptCallback = onTranscript;
    }
    this.isListening = true;

    if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          if (this.recognition) {
            try {
              this.recognition.start();
            } catch {}
          }
        })
        .catch((err) => {
          console.warn('Microphone permission request failed:', err);
        });
    }
  }

  public setTranscriptCallback(cb: VoiceCallback | null) {
    this.onTranscriptCallback = cb;
  }

  public startListening(
    onTranscript: VoiceCallback,
    onWakeWord?: TriggerCallback,
    onEmergency?: EmergencyVoiceCallback
  ) {
    this.onTranscriptCallback = onTranscript;
    if (onWakeWord) this.onWakeWordTriggered = onWakeWord;
    if (onEmergency) this.onEmergencyTriggered = onEmergency;
    this.isListening = true;

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch {}
    }
  }

  public stopListening() {
    this.isListening = false;
    this.isWakeWordActive = false;
    this.onTranscriptCallback = null;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  public resetWakeWordState() {
    this.isWakeWordActive = false;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && (Boolean((window as any).SpeechRecognition) || Boolean((window as any).webkitSpeechRecognition));
  }
}

export const voiceRecognitionService = new VoiceRecognitionService();
