// Voice Recognition & Trigger Word ("BlueGuard") Detection Service

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

          const combined = (finalTranscript || interimTranscript).toLowerCase().trim();

          // Check for wake phrase "BlueGuard" / "Hey BlueGuard" in various regional transliterations
          const isWake =
            combined.includes('blueguard') ||
            combined.includes('blue guard') ||
            combined.includes('hey blueguard') ||
            combined.includes('hey blue guard') ||
            combined.includes('블ूगार्ड') ||
            combined.includes('புளூகார்ட்') ||
            combined.includes('ப்ளூ கார்ட்') ||
            combined.includes('ब्लूगार्ड');

          if (isWake) {
            if (!this.isWakeWordActive && this.onWakeWordTriggered) {
              this.isWakeWordActive = true;
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

          if (this.onTranscriptCallback) {
            this.onTranscriptCallback(finalTranscript || interimTranscript, Boolean(finalTranscript));
          }
        };

        this.recognition.onerror = (event: any) => {
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

  private updateLangCode() {
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
    this.recognition.lang = langCodeMap[this.currentLanguage] || 'en-US';
  }

  public setLanguage(lang: string) {
    this.currentLanguage = lang;
    this.updateLangCode();
  }

  /**
   * Request microphone permissions on site open & start background wake-word listening
   */
  public requestMicPermissionAndListen(onWakeWord: TriggerCallback) {
    this.onWakeWordTriggered = onWakeWord;
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

  public startListening(
    onTranscript: VoiceCallback,
    onWakeWord: TriggerCallback,
    onEmergency?: EmergencyVoiceCallback
  ) {
    this.onTranscriptCallback = onTranscript;
    this.onWakeWordTriggered = onWakeWord;
    this.onEmergencyTriggered = onEmergency || null;
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
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  public resetWakeWordState() {
    this.isWakeWordActive = false;
  }
}

export const voiceRecognitionService = new VoiceRecognitionService();
