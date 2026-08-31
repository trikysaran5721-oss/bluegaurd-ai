import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    const sarvamApiKey = process.env.SARVAM_API_KEY || "sk_txs4qqro_FPF9Hxl7iXvMSE8yhkr5O8vG";
    const body = await request.json();
    const text = body.text || body.input || '';
    const srcLang = body.source_language_code || body.source_lang || 'auto';
    const tgtLang = body.target_language_code || body.target_lang || 'ta-IN';

    if (!text.trim()) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    // 1. Try python sarvamai SDK first
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'sarvam_bridge.py');
      const inputJson = JSON.stringify({ input: text, source_language_code: srcLang, target_language_code: tgtLang });
      const command = `python "${scriptPath}" translate`;
      const output = execSync(command, {
        input: inputJson,
        env: { ...process.env, SARVAM_API_KEY: sarvamApiKey },
        encoding: 'utf-8',
        timeout: 8000
      });
      const parsed = JSON.parse(output.trim());
      if (parsed.translated_text) {
        return NextResponse.json({
          translated_text: parsed.translated_text,
          source_language_code: srcLang,
          target_language_code: tgtLang,
          is_demo_mode: false,
          provider: parsed.provider || 'SarvamAI Python SDK 0.1.31a4 (mayura)'
        });
      }
    } catch (sdkErr) {
      console.warn('Sarvam Python SDK translate fallback to REST:', sdkErr);
    }

    // 2. HTTP REST Fallback
    if (sarvamApiKey) {
      try {
        const payload = {
          input: text,
          source_language_code: srcLang === 'auto' ? 'en-IN' : srcLang,
          target_language_code: tgtLang,
          speaker_gender: 'Female',
          mode: 'formal',
          model: 'mayura:v1',
          enable_preprocessing: true
        };

        const sarvamRes = await fetch('https://api.sarvam.ai/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': sarvamApiKey
          },
          body: JSON.stringify(payload)
        });

        if (sarvamRes.ok) {
          const data = await sarvamRes.json();
          return NextResponse.json({
            translated_text: data.translated_text || text,
            source_language_code: srcLang,
            target_language_code: tgtLang,
            is_demo_mode: false,
            provider: 'Sarvam REST API (mayura:v1)'
          });
        }
      } catch (err) {
        console.warn('Sarvam Translate REST call failed:', err);
      }
    }

    return NextResponse.json({
      translated_text: text,
      source_language_code: srcLang,
      target_language_code: tgtLang,
      is_demo_mode: true,
      provider: 'Sarvam Demo Translate Engine'
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}
