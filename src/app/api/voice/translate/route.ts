import { NextResponse } from 'next/server';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || "sk_txs4qqro_FPF9Hxl7iXvMSE8yhkr5O8vG";

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
    const body = await request.json();
    const text = body.text || body.input || '';
    const srcRaw = body.source_language_code || body.source_lang || 'auto';
    const tgtRaw = body.target_language_code || body.target_lang || 'ta-IN';

    const srcLang = srcRaw === 'auto' ? 'en-IN' : (SARVAM_LANG_MAP[srcRaw] || 'en-IN');
    const tgtLang = SARVAM_LANG_MAP[tgtRaw] || 'ta-IN';

    if (!text.trim()) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    if (srcLang === tgtLang) {
      return NextResponse.json({
        translated_text: text,
        source_language_code: srcLang,
        target_language_code: tgtLang,
        is_demo_mode: false
      });
    }

    // Call Live Sarvam Translate API (mayura:v1)
    try {
      const payload = {
        input: text,
        source_language_code: srcLang,
        target_language_code: tgtLang,
        mode: 'formal',
        model: 'mayura:v1'
      };

      const sarvamRes = await fetch('https://api.sarvam.ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': SARVAM_API_KEY
        },
        body: JSON.stringify(payload)
      });

      if (sarvamRes.ok) {
        const data = await sarvamRes.json();
        if (data.translated_text) {
          return NextResponse.json({
            translated_text: data.translated_text,
            source_language_code: srcLang,
            target_language_code: tgtLang,
            is_demo_mode: false,
            provider: 'Sarvam AI Translate (mayura:v1)'
          });
        }
      } else {
        const errText = await sarvamRes.text();
        console.warn('[Sarvam Translate Error]:', errText);
      }
    } catch (sarvamErr) {
      console.error('[Sarvam Translate Exception]:', sarvamErr);
    }

    return NextResponse.json({
      translated_text: text,
      source_language_code: srcLang,
      target_language_code: tgtLang,
      is_demo_mode: true,
      provider: 'Sarvam AI Fallback'
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}
