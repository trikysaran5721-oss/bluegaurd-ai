import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const sarvamApiKey = process.env.SARVAM_API_KEY;

    const contentType = request.headers.get('content-type') || '';
    let audioBlob: Blob | null = null;
    let languageCode = 'unknown';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as Blob | null;
      if (file) {
        audioBlob = file;
      }
      const lang = formData.get('language_code') as string | null;
      if (lang) languageCode = lang;
    } else {
      const json = await request.json();
      if (json.language_code) languageCode = json.language_code;
      if (json.text) {
        // Direct text pass-through for transcript confirmation
        return NextResponse.json({
          transcript: json.text,
          language_code: languageCode === 'unknown' ? 'en-IN' : languageCode,
          detected_language: languageCode === 'unknown' ? 'English' : languageCode,
          is_demo_mode: !sarvamApiKey
        });
      }
    }

    // Call Sarvam STT API if key is set & audio file provided
    if (sarvamApiKey && audioBlob) {
      try {
        const sarvamFormData = new FormData();
        sarvamFormData.append('file', audioBlob, 'speech.wav');
        sarvamFormData.append('model', 'saaras:v1');
        if (languageCode && languageCode !== 'unknown') {
          sarvamFormData.append('language_code', languageCode);
        } else {
          sarvamFormData.append('language_code', 'unknown');
        }

        const sarvamRes = await fetch('https://api.sarvam.ai/speech-to-text', {
          method: 'POST',
          headers: {
            'api-subscription-key': sarvamApiKey
          },
          body: sarvamFormData
        });

        if (sarvamRes.ok) {
          const data = await sarvamRes.json();
          return NextResponse.json({
            transcript: data.transcript || '',
            language_code: data.language_code || 'en-IN',
            detected_language: data.language_code || 'en-IN',
            is_demo_mode: false,
            provider: 'Sarvam STT (saaras:v1)'
          });
        } else {
          const errText = await sarvamRes.text();
          console.warn('[Sarvam STT API Error]:', errText);
        }
      } catch (sarvamErr) {
        console.error('[Sarvam STT Exception]:', sarvamErr);
      }
    }

    // Demo Mode Fallback if API key missing or network call fails
    return NextResponse.json({
      transcript: 'BlueGuard advisory: Passage to destination clear with 22 knot NE winds.',
      language_code: languageCode === 'unknown' ? 'en-IN' : languageCode,
      detected_language: 'English (Demo)',
      is_demo_mode: true,
      provider: 'Sarvam Demo Engine'
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Couldn't understand the audio. Please try again." },
      { status: 500 }
    );
  }
}
