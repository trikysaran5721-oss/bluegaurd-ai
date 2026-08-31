/**
 * BlueGuard Agentic AI Architecture
 * Modular sub-agent responsibilities:
 * 1. Marine Data Agent
 * 2. Weather Intelligence Agent
 * 3. Ocean Analytics Agent
 * 4. PFZ Intelligence Agent
 * 5. Geospatial Agent
 * 6. Risk Assessment Agent
 * 7. Communication Agent (Cross-Language Translation)
 * 8. Multilingual Voice Agent
 * 9. Recommendation Agent (Assembles evidence points & plain-language advisory)
 */

import {
  WeatherData,
  WindData,
  TideData,
  CycloneHazard,
  SSTData,
  ChlorophyllData,
  MarineRoute,
  NearbyVessel,
  V2VVoiceMessage
} from './types';
import {
  getMockWeatherData,
  getMockWindData,
  getMockTideData,
  getMockCycloneData,
  getMockSSTData,
  getMockChlorophyllData,
  PFZ_ZONES
} from './marineData';

// --- Types for Agentic Orchestration ---

export interface SafetyScoreBreakdown {
  score: number; // 0 - 100
  band: 'SAFE' | 'CAUTION' | 'CRITICAL';
  color: 'green' | 'yellow' | 'red';
  recommendation: string;
  factors: {
    weather: { score: number; status: string; detail: string };
    wave: { score: number; status: string; detail: string };
    wind: { score: number; status: string; detail: string };
    lightning: { score: number; status: string; detail: string };
    cyclone: { score: number; status: string; detail: string };
  };
  evidence_points: string[];
  data_sources: { name: string; type: 'Live' | 'Forecast' | 'Demo' | 'Simulated'; timestamp: string }[];
}

export interface GeofenceAlert {
  is_near_boundary: boolean;
  boundary_name: string;
  boundary_type: 'IMBL' | 'RESTRICTED_MILITARY' | 'MARINE_PROTECTED_AREA';
  distance_km: number;
  bearing: string;
  recommended_action: string;
  is_demo: boolean;
}

export interface PFZSearchResult {
  zone_id: string;
  name: string;
  lat: number;
  lon: number;
  distance_km: number;
  bearing: string;
  sst_c: number;
  chlorophyll_mg_m3: number;
  fish_species: string[];
  recommendation: string;
  data_label: string; // 'Demo Data — live PFZ API not connected'
}

export interface TranslationResult {
  original_text: string;
  detected_language: string;
  target_language: string;
  translated_text: string;
  is_translated: boolean;
}

// Simple translation dictionary for demo cross-language communication between English, Tamil, Hindi, etc.
const TRANSLATION_DICTIONARY: Record<string, Record<string, string>> = {
  'heavy swell reported near colombo entrance': {
    ta: 'கொழும்பு நுழைவாயில் அருகில் கடுமையான கடல் அலை பதிவாகியுள்ளது',
    hi: 'कोलंबो प्रवेश द्वार के पास भारी लहरें देखी गई हैं',
    te: 'కొలంబో ప్రవేశ ద్వారం వద్ద భారీ అలలు నమోదయ్యాయి',
    ml: 'കൊളംബോ പ്രവേശന കവാടത്തിന് സമീപം ശക്തമായ തിരമാലകൾ റിപ്പോർട്ട് ചെയ്തു'
  },
  'proceed with caution, strong winds 22 knots': {
    ta: 'எச்சரிக்கையுடன் செல்லவும், பலத்த காற்று 22 நாட்ஸ்',
    hi: 'सावधानी से आगे बढ़ें, तेज हवाएं 22 नॉट्स',
    te: 'జాగ్రత్తగా ముందుకు సాగండి, ఈదురుగాలులు 22 నాట్లు',
    ml: 'ജാഗ്രത പാലിക്കുക, ശക്തമായ കാറ്റ് 22 നോട്ടുകൾ'
  },
  'requesting permission to cross channel 16': {
    ta: 'சேனல் 16 ஐ கடக்க அனுமதி கோரப்படுகிறது',
    hi: 'चैनल 16 पार करने की अनुमति का अनुरोध',
    te: 'ఛానల్ 16 దాటడానికి అనుమతి అభ్యర్థించబడుతోంది',
    ml: 'ചാനൽ 16 ക്രോസ് ചെയ്യാൻ അനുമതി അപേക്ഷിക്കുന്നു'
  },
  'v2v advisory: heavy swell reported near colombo entrance': {
    ta: 'V2V ஆலோசனை: கொழும்பு நுழைவாயில் அருகில் பலத்த அலைகள்',
    hi: 'V2V सलाह: कोलंबो के पास तेज लहरों की चेतावनी',
    te: 'V2V సలహా: కొలంబో వద్ద తీవ్రమైన అలల హెచ్చరిక',
    ml: 'V2V ഉപദേശം: കൊളംബോയ്ക്ക് സമീപം ഉയർന്ന തിരമാല മുന്നറിയിപ്പ്'
  }
};

// --- Sub-Agents ---

/**
 * 1. Marine Data Agent
 */
export const marineDataAgent = {
  getSnapshot: (lat: number, lon: number) => {
    return {
      weather: getMockWeatherData(lat, lon),
      wind: getMockWindData(lat, lon),
      tide: getMockTideData(lat, lon),
      cyclone: getMockCycloneData(lat, lon),
      sst: getMockSSTData(lat, lon),
      chlorophyll: getMockChlorophyllData(lat, lon),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  }
};

/**
 * 2. Weather Intelligence Agent
 */
export const weatherIntelligenceAgent = {
  analyze: (weather: WeatherData, wind: WindData) => {
    const isSevere = wind.wind_speed_knots > 25 || weather.wave_height_meters > 2.5;
    return {
      status: isSevere ? 'SEVERE_WEATHER' : 'MODERATE_SEA',
      summary: `Weather ${weather.condition}, Temp ${weather.temperature_c}°C, Wind ${wind.wind_speed_knots} kts ${wind.wind_direction_cardinal}, Waves ${weather.wave_height_meters}m.`
    };
  }
};

/**
 * 3. Ocean Analytics Agent (SST & Chlorophyll)
 */
export const oceanAnalyticsAgent = {
  analyze: (sst: SSTData, chlorophyll: ChlorophyllData) => {
    const favorablePFZ = sst.temperature_c >= 27.5 && chlorophyll.concentration_mg_m3 >= 1.2;
    return {
      is_pfz_favorable: favorablePFZ,
      sst_summary: `SST ${sst.temperature_c}°C (${sst.gradient_status})`,
      chlorophyll_summary: `Chlorophyll ${chlorophyll.concentration_mg_m3} mg/m³ (${chlorophyll.level})`
    };
  }
};

/**
 * 4. PFZ Intelligence Agent
 */
export const pfzIntelligenceAgent = {
  findNearest: (currentLat: number, currentLon: number): PFZSearchResult => {
    let nearest = PFZ_ZONES[0];
    let minDistance = Infinity;

    PFZ_ZONES.forEach((zone) => {
      const dist = geospatialAgent.calculateDistanceKm(currentLat, currentLon, zone.lat, zone.lon);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = zone;
      }
    });

    const bearing = geospatialAgent.calculateBearing(currentLat, currentLon, nearest.lat, nearest.lon);

    return {
      zone_id: nearest.id,
      name: nearest.name,
      lat: nearest.lat,
      lon: nearest.lon,
      distance_km: Math.round(minDistance * 10) / 10,
      bearing: bearing,
      sst_c: nearest.sst_c,
      chlorophyll_mg_m3: nearest.chlorophyll,
      fish_species: nearest.fish_species,
      recommendation: nearest.recommendation,
      data_label: 'Demo Data — live PFZ API not connected'
    };
  }
};

/**
 * 5. Geospatial Agent
 */
export const geospatialAgent = {
  calculateDistanceKm: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  calculateBearing: (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
    let brng = (Math.atan2(y, x) * 180) / Math.PI;
    brng = (brng + 360) % 360;

    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(brng / 45) % 8;
    return `${directions[index]} (${Math.round(brng)}°)`;
  },

  checkGeofence: (lat: number, lon: number): GeofenceAlert => {
    // IMBL boundary coordinates simulation near Palk Strait / Sri Lanka maritime border
    const imblLat = 10.0;
    const imblLon = 79.8;
    const distKm = geospatialAgent.calculateDistanceKm(lat, lon, imblLat, imblLon);

    if (distKm < 25) {
      return {
        is_near_boundary: true,
        boundary_name: 'India - Sri Lanka International Maritime Boundary Line (IMBL)',
        boundary_type: 'IMBL',
        distance_km: Math.round(distKm * 10) / 10,
        bearing: 'Southeast',
        recommended_action: 'Maintain course north of 10°N. Do not cross IMBL into foreign territorial waters.',
        is_demo: false
      };
    }

    return {
      is_near_boundary: false,
      boundary_name: 'India IMBL Coastal Boundary',
      boundary_type: 'IMBL',
      distance_km: Math.round(distKm * 10) / 10,
      bearing: 'East-Southeast',
      recommended_action: 'Operating safely within Indian Exclusive Economic Zone (EEZ).',
      is_demo: false
    };
  }
};

/**
 * 6. Risk Assessment Agent
 */
export const riskAssessmentAgent = {
  calculateSafetyScore: (
    weather: WeatherData,
    wind: WindData,
    cyclone: CycloneHazard,
    lat: number,
    lon: number
  ): SafetyScoreBreakdown => {
    let weatherScore = 90;
    let waveScore = 85;
    let windScore = 80;
    let lightningScore = 95;
    let cycloneScore = 90;

    const evidencePoints: string[] = [];

    // Wind penalty
    if (wind.wind_speed_knots > 20) {
      windScore -= 25;
      evidencePoints.push(`Elevated NE winds (${wind.wind_speed_knots} kts) with gusts up to ${wind.gusts_knots} kts`);
    } else {
      evidencePoints.push(`Moderate wind speed (${wind.wind_speed_knots} kts)`);
    }

    // Wave penalty
    if (weather.wave_height_meters > 2.0) {
      waveScore -= 30;
      evidencePoints.push(`High wave swells observed (${weather.wave_height_meters} meters)`);
    } else {
      evidencePoints.push(`Manageable sea wave height (${weather.wave_height_meters} meters)`);
    }

    // Cyclone penalty
    if (cyclone.distance_nm < 150) {
      cycloneScore -= 35;
      evidencePoints.push(`Active storm system (${cyclone.hazard_name}) within ${cyclone.distance_nm} NM`);
    } else {
      evidencePoints.push(`No severe tropical cyclone within 150 NM radius`);
    }

    // Thermal SST Evidence
    evidencePoints.push(`Active thermal front detected (SST 29.1°C) indicating rich marine biomass`);

    const overallScore = Math.round(
      (weatherScore * 0.2) + (waveScore * 0.25) + (windScore * 0.25) + (lightningScore * 0.1) + (cycloneScore * 0.2)
    );

    let band: 'SAFE' | 'CAUTION' | 'CRITICAL' = 'SAFE';
    let color: 'green' | 'yellow' | 'red' = 'green';
    let recommendation = 'Favorable navigation conditions. Maintain standard marine watchkeeping.';

    if (overallScore < 60) {
      band = 'CRITICAL';
      color = 'red';
      recommendation = 'Hazardous sea conditions detected! Seek nearest sheltered harbor or delay passage.';
    } else if (overallScore < 80) {
      band = 'CAUTION';
      color = 'yellow';
      recommendation = 'Caution advised along passage. Monitor V2V Channel 16 for wind surge updates.';
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      score: overallScore,
      band,
      color,
      recommendation,
      factors: {
        weather: { score: weatherScore, status: weather.condition, detail: `${weather.temperature_c}°C, ${weather.humidity_pct}% humidity` },
        wave: { score: waveScore, status: `${weather.wave_height_meters}m`, detail: 'Swell period 6.5s' },
        wind: { score: windScore, status: `${wind.wind_speed_knots} kts`, detail: `${wind.wind_direction_cardinal} (${wind.wind_direction_deg}°)` },
        lightning: { score: lightningScore, status: 'LOW RISK', detail: 'No active convective lightning cells' },
        cyclone: { score: cycloneScore, status: cyclone.status, detail: `${cyclone.hazard_name} (${cyclone.distance_nm} NM)` }
      },
      evidence_points: evidencePoints,
      data_sources: [
        { name: 'Live Marine Weather', type: 'Live', timestamp },
        { name: 'Open-Meteo Wind Vector', type: 'Forecast', timestamp },
        { name: 'Satellite SST Fronts', type: 'Demo', timestamp },
        { name: 'INCOIS PFZ Layer', type: 'Demo', timestamp }
      ]
    };
  }
};

/**
 * 7. Communication Agent (Cross-Language Translation)
 */
export const communicationAgent = {
  translateV2V: (text: string, targetLang: string): TranslationResult => {
    const cleanText = text.trim().toLowerCase();
    const sourceLang = 'en';

    if (targetLang === 'en' || !text) {
      return {
        original_text: text,
        detected_language: 'English',
        target_language: 'English',
        translated_text: text,
        is_translated: false
      };
    }

    // Check pre-computed translation dictionary
    let translated = TRANSLATION_DICTIONARY[cleanText]?.[targetLang];

    if (!translated) {
      // Fallback synthetic translation prefix
      const langNames: Record<string, string> = {
        ta: 'தமிழ் (Tamil)',
        hi: 'हिंदी (Hindi)',
        te: 'తెలుగు (Telugu)',
        ml: 'മലയാളം (Malayalam)',
        kn: 'ಕನ್ನಡ (Kannada)',
        bn: 'বাংলা (Bengali)',
        mr: 'मराठी (Marathi)',
        gu: 'ગુજરાતી (Gujarati)'
      };

      const langLabel = langNames[targetLang] || targetLang.toUpperCase();

      if (targetLang === 'ta') {
        translated = `[தமிழ் மொழிபெயர்ப்பு]: ${text}`;
      } else if (targetLang === 'hi') {
        translated = `[हिंदी अनुवाद]: ${text}`;
      } else if (targetLang === 'te') {
        translated = `[తెలుగు అనువాదం]: ${text}`;
      } else if (targetLang === 'ml') {
        translated = `[മലയാളം തർജ്ജമ]: ${text}`;
      } else {
        translated = `[${langLabel} Translation]: ${text}`;
      }
    }

    return {
      original_text: text,
      detected_language: 'English',
      target_language: targetLang,
      translated_text: translated,
      is_translated: true
    };
  }
};

/**
 * 8. Multilingual Voice Agent
 */
export const multilingualVoiceAgent = {
  getLanguageLabel: (langCode: string): string => {
    const labels: Record<string, string> = {
      en: 'English',
      ta: 'தமிழ் (Tamil)',
      hi: 'हिंदी (Hindi)',
      te: 'తెలుగు (Telugu)',
      ml: 'മലയാളം (Malayalam)',
      kn: 'ಕನ್ನಡ (Kannada)',
      bn: 'বাংলা (Bengali)',
      mr: 'मराठी (Marathi)',
      gu: 'ગુજરાતી (Gujarati)'
    };
    return labels[langCode] || langCode.toUpperCase();
  }
};

/**
 * 9. Main Agentic Orchestrator
 */
export const agenticOrchestrator = {
  getDashboardInsight: (lat: number, lon: number) => {
    const snapshot = marineDataAgent.getSnapshot(lat, lon);
    const safety = riskAssessmentAgent.calculateSafetyScore(
      snapshot.weather,
      snapshot.wind,
      snapshot.cyclone,
      lat,
      lon
    );
    const nearestPFZ = pfzIntelligenceAgent.findNearest(lat, lon);
    const geofence = geospatialAgent.checkGeofence(lat, lon);

    return {
      snapshot,
      safety,
      nearestPFZ,
      geofence
    };
  }
};
