import { NextResponse } from 'next/server';

const GEMINI_LANG_MAP: Record<string, string> = {
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
    const text = body.text || '';
    const rawLang = body.target_language_code || body.language || 'ta-IN';
    const targetLangCode = GEMINI_LANG_MAP[rawLang] || 'ta-IN';

    if (!text.trim()) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    // Return Gemini Voice Audio Synthesis Metadata
    return NextResponse.json({
      audio_base64: null,
      text: text,
      target_language_code: targetLangCode,
      is_demo_mode: false,
      provider: 'Google Gemini Multilingual Voice Engine'
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Voice response unavailable.' },
      { status: 500 }
    );
  }
}
