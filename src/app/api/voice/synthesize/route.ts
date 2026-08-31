import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    const sarvamApiKey = process.env.SARVAM_API_KEY || "sk_txs4qqro_FPF9Hxl7iXvMSE8yhkr5O8vG";
    const body = await request.json();
    const text = body.text || '';
    const rawLang = body.target_language_code || body.language || 'ta-IN';
    const targetLangCode = rawLang.includes('-') ? rawLang : `${rawLang}-IN`;

    if (!text.trim()) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    // 1. Try python sarvamai SDK first
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'sarvam_bridge.py');
      const inputJson = JSON.stringify({ text, target_language_code: targetLangCode });
      const command = `python "${scriptPath}" synthesize`;
      const output = execSync(command, {
        input: inputJson,
        env: { ...process.env, SARVAM_API_KEY: sarvamApiKey },
        encoding: 'utf-8',
        timeout: 8000
      });
      const parsed = JSON.parse(output.trim());
      if (parsed.audio_base64) {
        return NextResponse.json({
          audio_base64: parsed.audio_base64,
          target_language_code: targetLangCode,
          is_demo_mode: false,
          provider: parsed.provider || 'SarvamAI Python SDK 0.1.31a4 (bulbul)'
        });
      }
    } catch (sdkErr) {
      console.warn('Sarvam Python SDK fallback to REST:', sdkErr);
    }

    // 2. HTTP REST Fallback
    if (sarvamApiKey) {
      try {
        const payload = {
          inputs: [text.slice(0, 500)],
          target_language_code: targetLangCode,
          speaker: 'kavitha',
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
              provider: 'Sarvam REST API (bulbul:v1)'
            });
          }
        }
      } catch (err) {
        console.warn('Sarvam REST API call failed:', err);
      }
    }

    return NextResponse.json({
      audio_base64: null,
      target_language_code: targetLangCode,
      is_demo_mode: true,
      provider: 'Sarvam Demo Voice Engine'
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Voice response unavailable.' },
      { status: 500 }
    );
  }
}
