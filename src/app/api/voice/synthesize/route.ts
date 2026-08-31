import { NextResponse } from 'next/server';

const SARVAM_LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  kn: 'kn-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  'en-IN': 'en-IN',
  'ta-IN': 'ta-IN',
  'hi-IN': 'hi-IN',
  'te-IN': 'te-IN',
  'ml-IN': 'ml-IN',
  'kn-IN': 'kn-IN',
  'bn-IN': 'bn-IN',
  'mr-IN': 'mr-IN',
  'gu-IN': 'gu-IN'
};

export async function POST(request: Request) {
  try {
    const sarvamApiKey = process.env.SARVAM_API_KEY;
    const body = await request.json();
    const text = body.text || '';
    const rawLang = body.target_language_code || body.language || 'en-IN';
    const targetLangCode = SARVAM_LANG_MAP[rawLang] || 'en-IN';
    const speaker = body.speaker || 'meera';

    if (!text.trim()) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    if (sarvamApiKey) {
      try {
        const payload = {
          inputs: [text.slice(0, 500)],
          target_language_code: targetLangCode,
          speaker: speaker,
          pitch: 0,
          pace: 1.05,
          loudness: 1.5,
          speech_sample_rate: 8000,
          enable_preprocessing: true,
          model: 'bulbul:v1'
        };

        const sarvamRes = await fetch('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': sarvamApiKey
          },
          body: JSON.stringify(payload)
        });

        if (sarvamRes.ok) {
          const data = await sarvamRes.json();
          const base64Audio = data.audios?.[0] || null;
          if (base64Audio) {
            return NextResponse.json({
              audio_base64: base64Audio,
              target_language_code: targetLangCode,
              is_demo_mode: false,
              provider: 'Sarvam TTS (bulbul:v1)'
            });
          }
        } else {
          const errText = await sarvamRes.text();
          console.warn('[Sarvam TTS API Error]:', errText);
        }
      } catch (sarvamErr) {
        console.error('[Sarvam TTS Exception]:', sarvamErr);
      }
    }

    // Demo Mode / Fallback Response
    return NextResponse.json({
      audio_base64: null,
      target_language_code: targetLangCode,
      is_demo_mode: true,
      provider: 'Sarvam Demo TTS Engine'
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Voice response unavailable. Showing text response instead.' },
      { status: 500 }
    );
  }
}
