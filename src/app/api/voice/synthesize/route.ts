import { NextResponse } from 'next/server';

const LANG_MAP: Record<string, string> = {
  en: 'en',
  ta: 'ta',
  hi: 'hi',
  te: 'te',
  ml: 'ml',
  kn: 'kn',
  bn: 'bn',
  mr: 'mr',
  gu: 'gu',
  'en-IN': 'en',
  'ta-IN': 'ta',
  'hi-IN': 'hi',
  'te-IN': 'te',
  'ml-IN': 'ml',
  'kn-IN': 'kn',
  'bn-IN': 'bn',
  'mr-IN': 'mr',
  'gu-IN': 'gu'
};

async function fetchAudioStream(text: string, lang: string): Promise<Buffer | null> {
  try {
    const cleanText = text.replace(/[*_#~`]/g, '').trim().slice(0, 300);
    if (!cleanText) return null;

    const shortLang = LANG_MAP[lang] || lang.split('-')[0] || 'en';
    const encodedText = encodeURIComponent(cleanText);

    const endpoints = [
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=${shortLang}&client=gtx&q=${encodedText}`,
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=${shortLang}&client=tw-ob&q=${encodedText}`,
      `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${shortLang}&q=${encodedText}`
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'audio/mpeg, audio/*;q=0.9, */*;q=0.8',
            'Referer': 'https://translate.google.com/'
          }
        });

        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const buf = Buffer.from(arrayBuffer);
          if (buf.length > 100) {
            return buf;
          }
        }
      } catch (err) {
        console.warn(`[TTS Proxy Endpoint Warning ${endpoint}]:`, err);
      }
    }
  } catch (err) {
    console.warn('[TTS Proxy Fetch Error]:', err);
  }
  return null;
}

// GET Route: Returns direct audio/mpeg MP3 stream for HTML5 Audio player
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text') || '';
    const lang = searchParams.get('lang') || 'en';

    if (!text.trim()) {
      return new NextResponse('Missing text parameter', { status: 400 });
    }

    const audioBuffer = await fetchAudioStream(text, lang);
    if (audioBuffer) {
      return new NextResponse(new Uint8Array(audioBuffer), {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    return new NextResponse('TTS generation failed', { status: 500 });
  } catch (err) {
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// POST Route: Returns JSON base64 audio string or URL metadata
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body.text || '';
    const rawLang = body.target_language_code || body.language || 'en';
    const shortLang = LANG_MAP[rawLang] || rawLang.split('-')[0] || 'en';

    if (!text.trim()) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    const audioBuffer = await fetchAudioStream(text, shortLang);
    if (audioBuffer) {
      const base64Audio = audioBuffer.toString('base64');
      return NextResponse.json({
        audio_base64: base64Audio,
        audio_url: `/api/voice/synthesize?text=${encodeURIComponent(text.slice(0, 150))}&lang=${shortLang}`,
        text: text,
        target_language_code: shortLang,
        is_demo_mode: false,
        provider: 'Google AI Multilingual Voice Stream'
      });
    }

    return NextResponse.json({
      audio_base64: null,
      audio_url: null,
      text: text,
      target_language_code: shortLang,
      is_demo_mode: true
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Voice response unavailable.' },
      { status: 500 }
    );
  }
}
