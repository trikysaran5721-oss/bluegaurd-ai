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

/**
 * Preserve Technical Terms across translation (PFZ, SST, chlorophyll, GPS, vessel, geofence, IMBL)
 */
function protectTechnicalTerms(text: string): { protectedText: string; termMap: Record<string, string> } {
  const terms = ['PFZ', 'SST', 'chlorophyll', 'GPS', 'vessel', 'geofence', 'IMBL', 'Tropical Depression 02B'];
  const termMap: Record<string, string> = {};
  let protectedText = text;

  terms.forEach((term, index) => {
    const placeholder = `__TECH_TERM_${index}__`;
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    if (regex.test(protectedText)) {
      termMap[placeholder] = term;
      protectedText = protectedText.replace(regex, placeholder);
    }
  });

  return { protectedText, termMap };
}

function restoreTechnicalTerms(translatedText: string, termMap: Record<string, string>): string {
  let restored = translatedText;
  Object.entries(termMap).forEach(([placeholder, originalTerm]) => {
    restored = restored.replace(new RegExp(placeholder, 'g'), originalTerm);
  });
  return restored;
}

export async function POST(request: Request) {
  try {
    const sarvamApiKey = process.env.SARVAM_API_KEY;
    const body = await request.json();
    const text = body.text || body.input || '';
    const srcLang = SARVAM_LANG_MAP[body.source_language_code || body.source_lang || 'en-IN'] || 'en-IN';
    const tgtLang = SARVAM_LANG_MAP[body.target_language_code || body.target_lang || 'ta-IN'] || 'ta-IN';

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

    const { protectedText, termMap } = protectTechnicalTerms(text);

    if (sarvamApiKey) {
      try {
        const payload = {
          input: protectedText,
          source_language_code: srcLang,
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
          const rawTranslation = data.translated_text || text;
          const finalTranslation = restoreTechnicalTerms(rawTranslation, termMap);

          return NextResponse.json({
            translated_text: finalTranslation,
            source_language_code: srcLang,
            target_language_code: tgtLang,
            is_demo_mode: false,
            provider: 'Sarvam Translate (mayura:v1)'
          });
        } else {
          const errText = await sarvamRes.text();
          console.warn('[Sarvam Translate API Error]:', errText);
        }
      } catch (sarvamErr) {
        console.error('[Sarvam Translate Exception]:', sarvamErr);
      }
    }

    // Demo Mode Translation Fallback
    const demoTranslations: Record<string, string> = {
      'ta-IN': `[தமிழ் மொழிபெயர்ப்பு]: ${text}`,
      'hi-IN': `[हिंदी अनुवाद]: ${text}`,
      'te-IN': `[తెలుగు అనువాదం]: ${text}`,
      'ml-IN': `[മലയാളം വിവർത്തനം]: ${text}`,
      'kn-IN': `[ಕನ್ನಡ ಅನುವಾದ]: ${text}`,
      'bn-IN': `[বাংলা অনুবাদ]: ${text}`,
      'mr-IN': `[मराठी भाषांतर]: ${text}`,
      'gu-IN': `[ગુજરાતી અનુવાદ]: ${text}`
    };

    return NextResponse.json({
      translated_text: demoTranslations[tgtLang] || text,
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
