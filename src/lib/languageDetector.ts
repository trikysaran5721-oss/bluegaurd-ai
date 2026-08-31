// Automatic Multilingual Language Detector for BlueGuard AI

export interface LanguageDetectionResult {
  code: string; // 'en' | 'ta' | 'hi' | 'te' | 'ml' | 'kn' | 'bn' | 'mr' | 'gu'
  fullCode: string; // 'en-IN' | 'ta-IN' | etc.
  label: string; // 'Tamil (தமிழ்)', 'Hindi (हिंदी)', etc.
  confidence: number;
}

export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || !text.trim()) {
    return { code: 'en', fullCode: 'en-IN', label: 'English', confidence: 1.0 };
  }

  const str = text.trim();

  // 1. Unicode Script Matching
  const hasTamil = /[\u0B80-\u0BFF]/.test(str);
  const hasDevanagari = /[\u0900-\u097F]/.test(str);
  const hasTelugu = /[\u0C00-\u0C7F]/.test(str);
  const hasMalayalam = /[\u0D00-\u0D7F]/.test(str);
  const hasKannada = /[\u0C80-\u0CFF]/.test(str);
  const hasBengali = /[\u0980-\u09FF]/.test(str);
  const hasGujarati = /[\u0A80-\u0AFF]/.test(str);

  if (hasTamil) {
    return { code: 'ta', fullCode: 'ta-IN', label: 'Tamil (தமிழ்)', confidence: 0.98 };
  }
  if (hasDevanagari) {
    // Check Marathi specific words or default Hindi
    const isMarathi = /\b(आहे|नाही|काय|कसे|सांगा)\b/i.test(str);
    if (isMarathi) {
      return { code: 'mr', fullCode: 'mr-IN', label: 'Marathi (मराठी)', confidence: 0.95 };
    }
    return { code: 'hi', fullCode: 'hi-IN', label: 'Hindi (हिंदी)', confidence: 0.98 };
  }
  if (hasTelugu) {
    return { code: 'te', fullCode: 'te-IN', label: 'Telugu (తెలుగు)', confidence: 0.98 };
  }
  if (hasMalayalam) {
    return { code: 'ml', fullCode: 'ml-IN', label: 'Malayalam (മലയാളം)', confidence: 0.98 };
  }
  if (hasKannada) {
    return { code: 'kn', fullCode: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)', confidence: 0.98 };
  }
  if (hasBengali) {
    return { code: 'bn', fullCode: 'bn-IN', label: 'Bengali (বাংলা)', confidence: 0.98 };
  }
  if (hasGujarati) {
    return { code: 'gu', fullCode: 'gu-IN', label: 'Gujarati (ગુજરાતી)', confidence: 0.98 };
  }

  // 2. Romanized Transliteration Vocabulary Matching
  const lower = str.toLowerCase();

  // Romanized Tamil keywords
  const taWords = ['vanakkam', 'mazhai', 'kaatru', 'kadal', 'meen', 'ellai', 'yepdi', 'eppadi', 'irukku', 'poga', 'vazhi', 'vaanilai', 'enku', 'engu'];
  if (taWords.some((w) => lower.includes(w))) {
    return { code: 'ta', fullCode: 'ta-IN', label: 'Tamil (தமிழ்)', confidence: 0.90 };
  }

  // Romanized Hindi keywords
  const hiWords = ['mausam', 'hawa', 'kya', 'kaise', 'machli', 'rasta', 'surakshit', 'kahan', 'batao', 'hai'];
  if (hiWords.some((w) => lower.includes(w))) {
    return { code: 'hi', fullCode: 'hi-IN', label: 'Hindi (हिंदी)', confidence: 0.90 };
  }

  // Romanized Telugu keywords
  const teWords = ['ela', 'vundi', 'galulu', 'chepalu', 'samudram', 'namaskaram'];
  if (teWords.some((w) => lower.includes(w))) {
    return { code: 'te', fullCode: 'te-IN', label: 'Telugu (తెలుగు)', confidence: 0.90 };
  }

  // Default English
  return { code: 'en', fullCode: 'en-IN', label: 'English', confidence: 0.85 };
}
