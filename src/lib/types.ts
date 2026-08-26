export interface ShipProfile {
  id?: string;
  ship_id: string;
  google_user_id: string;
  display_name: string;
  email: string;
  preferred_language: 'en' | 'hi';
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  destination: string;
  online_status: 'ONLINE' | 'LIMITED' | 'OFFLINE';
  handler_name?: string;
  created_at?: string;
}

export interface DemoPort {
  name: string;
  lat: number;
  lon: number;
  country: string;
}

export interface Waypoint {
  id?: string;
  name: string;
  lat: number;
  lon: number;
}

export interface MarineRoute {
  origin: string;
  destination: string;
  origin_coords: { lat: number; lon: number };
  destination_coords: { lat: number; lon: number };
  distance_nm: number;
  eta_hours: number;
  eta_minutes: number;
  waypoints: Waypoint[];
  is_demo_route: boolean;
  risk_score: 'SAFE' | 'CAUTION' | 'HIGH RISK';
  risk_reasons: string[];
}

export interface WeatherData {
  is_demo_data: boolean;
  temperature_c: number;
  condition: string;
  wind_speed_knots: number;
  wind_direction: string;
  visibility_nm: number;
  humidity_pct: number;
  pressure_hpa: number;
  rain_probability_pct: number;
  wave_height_meters: number;
  recorded_at: string;
}

export interface WindData {
  is_demo_data: boolean;
  wind_speed_knots: number;
  wind_direction_deg: number;
  wind_direction_cardinal: string;
  gusts_knots: number;
  severity: 'Light' | 'Moderate' | 'Strong' | 'Gale' | 'Severe';
  description: string;
}

export interface TideData {
  is_demo_data: boolean;
  current_tide: 'Rising' | 'Ebbing' | 'High Tide' | 'Low Tide';
  tide_height_meters: number;
  tide_direction: string;
  next_high_tide: string;
  next_low_tide: string;
  tidal_current_knots: number;
}

export interface CycloneHazard {
  is_demo_data: boolean;
  status: 'NO SIGNIFICANT CYCLONE' | 'WATCH' | 'WARNING' | 'SEVERE';
  hazard_name: string;
  distance_nm: number;
  bearing_direction: string;
  expected_max_wind_knots: number;
  affected_radius_nm: number;
  center_coordinates: { lat: number; lon: number };
  advisory: string;
}

export interface SSTData {
  is_demo_data: boolean;
  temperature_c: number;
  min_c: number;
  max_c: number;
  gradient_status: string;
  recorded_at: string;
}

export interface ChlorophyllData {
  is_demo_data: boolean;
  concentration_mg_m3: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  recorded_at: string;
}

export interface AreaIntelligence {
  lat: number;
  lon: number;
  sst: SSTData;
  chlorophyll: ChlorophyllData;
  weather: WeatherData;
  wind: WindData;
  tide: TideData;
  cyclone: CycloneHazard;
}

export interface ScenarioSimulation {
  simulation_title?: string;
  wind_speed_increase_kts: number;
  simulated_risk: 'SAFE' | 'CAUTION' | 'HIGH RISK';
  affected_section: string;
  recommendation: string;
  disclaimer?: string;
}

export interface RouteComparison {
  route_a: any;
  route_b: any;
  sst_a?: SSTData;
  sst_b?: SSTData;
  chlorophyll_a?: ChlorophyllData;
  chlorophyll_b?: ChlorophyllData;
  comparison_insight: string;
  recommended_option: 'A' | 'B';
}

export interface NearbyVessel {
  ship_id: string;
  name: string;
  lat: number;
  lon: number;
  heading: number;
  speed: number;
  destination: string;
  status: 'ONLINE' | 'OFFLINE';
  distance_nm: number;
  handler: string;
}

export interface EmergencyAlert {
  id: string;
  sender_ship_id: string;
  sender_name: string;
  severity: 'CRITICAL' | 'ADVISORY' | 'INFORMATIONAL';
  alert_type: string;
  message: string;
  latitude: number;
  longitude: number;
  destination: string;
  timestamp: string;
  acknowledged?: boolean;
}

export interface V2VVoiceMessage {
  id: string;
  sender_ship_id: string;
  sender_name: string;
  audio_url: string;
  duration_sec: number;
  timestamp: string;
  channel: string;
  note?: string;
}

export interface TravelTrip {
  id: string;
  ship_id: string;
  origin: string;
  destination: string;
  distance_nm: number;
  eta_minutes: number;
  risk_score: 'SAFE' | 'CAUTION' | 'HIGH RISK';
  started_at: string;
  ended_at?: string;
  weather_summary: string;
  wind_summary: string;
  tide_summary: string;
  alerts_count: number;
}
