import { audioService } from './audioService';

export interface TranscribeResult {
  transcript: string;
  language_code: string;
  detected_language: string;
  is_demo_mode: boolean;
  provider?: string;
}

export interface SynthesizeResult {
  audio_base64: string | null;
  target_language_code: string;
  is_demo_mode: boolean;
  provider?: string;
}

export interface TranslateResult {
  translated_text: string;
  source_language_code: string;
  target_language_code: string;
  is_demo_mode: boolean;
  provider?: string;
}

class VoiceService {
  private activeAudioElement: HTMLAudioElement | null = null;

  /**
   * Send audio blob or text to backend proxy /api/voice/transcribe
   */
  public async transcribe(audioBlob?: Blob, languageCode: string = 'unknown', fallbackText?: string): Promise<TranscribeResult> {
    try {
      if (fallbackText) {
        const res = await fetch('/api/voice/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: fallbackText, language_code: languageCode })
        });
        if (res.ok) {
          return await res.json();
        }
      }

      if (audioBlob) {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.wav');
        formData.append('language_code', languageCode);

        const res = await fetch('/api/voice/transcribe', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          return await res.json();
        }
      }
    } catch (err) {
      console.warn('[VoiceService Transcribe Error]:', err);
    }

    return {
      transcript: fallbackText || "Couldn't understand the audio. Please try again.",
      language_code: languageCode === 'unknown' ? 'en-IN' : languageCode,
      detected_language: languageCode,
      is_demo_mode: true
    };
  }

  /**
   * Send response text to backend proxy /api/voice/synthesize and auto-play
   */
  public async synthesize(text: string, languageCode: string = 'en-IN'): Promise<SynthesizeResult> {
    try {
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_language_code: languageCode })
      });

      if (res.ok) {
        const data: SynthesizeResult = await res.json();
        if (data.audio_base64) {
          this.playBase64Audio(data.audio_base64);
        } else {
          // Play via fallback TTS
          audioService.speak(text, languageCode);
        }
        return data;
      }
    } catch (err) {
      console.warn('[VoiceService Synthesize Error]:', err);
    }

    // Fallback playback
    audioService.speak(text, languageCode);

    return {
      audio_base64: null,
      target_language_code: languageCode,
      is_demo_mode: true
    };
  }

  /**
   * Send text to backend proxy /api/voice/translate for cross-vessel communication
   */
  public async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
    try {
      const res = await fetch('/api/voice/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          source_language_code: sourceLang,
          target_language_code: targetLang
        })
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[VoiceService Translate Error]:', err);
    }

    return {
      translated_text: text,
      source_language_code: sourceLang,
      target_language_code: targetLang,
      is_demo_mode: true
    };
  }

  public playBase64Audio(base64Wav: string) {
    try {
      this.stopPlayback();
      const audioUrl = `data:audio/wav;base64,${base64Wav}`;
      const audio = new Audio(audioUrl);
      this.activeAudioElement = audio;
      audio.play().catch((err) => {
        console.warn('[Audio Playback Blocked]:', err);
      });
    } catch (err) {
      console.warn('[Play Base64 Error]:', err);
    }
  }

  public stopPlayback() {
    if (this.activeAudioElement) {
      this.activeAudioElement.pause();
      this.activeAudioElement = null;
    }
  }
}

export const voiceService = new VoiceService();
