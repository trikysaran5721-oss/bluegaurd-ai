import { DemoPort, MarineRoute, WeatherData, WindData, TideData, CycloneHazard, NearbyVessel, TravelTrip, Waypoint, SSTData, ChlorophyllData, AreaIntelligence, ScenarioSimulation, RouteComparison } from './types';

export const DEMO_PORTS: Record<string, DemoPort> = {
  Chennai: { name: 'Chennai', lat: 13.0827, lon: 80.2707, country: 'India' },
  Colombo: { name: 'Colombo', lat: 6.9271, lon: 79.8612, country: 'Sri Lanka' },
  Kochi: { name: 'Kochi', lat: 9.9312, lon: 76.2673, country: 'India' },
  Mumbai: { name: 'Mumbai', lat: 18.9401, lon: 72.8347, country: 'India' },
  Singapore: { name: 'Singapore', lat: 1.3521, lon: 103.8198, country: 'Singapore' },
  Visakhapatnam: { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185, country: 'India' },
  Male: { name: 'Male', lat: 4.1755, lon: 73.5093, country: 'Maldives' },
  Chittagong: { name: 'Chittagong', lat: 22.3569, lon: 91.7832, country: 'Bangladesh' }
};

export const INITIAL_DEMO_FLEET: NearbyVessel[] = [
  {
    ship_id: "123456789012",
    name: "INS BlueGuard Alpha",
    lat: 13.0827,
    lon: 80.2707,
    heading: 84.0,
    speed: 12.0,
    destination: "Colombo",
    status: "ONLINE",
    distance_nm: 0,
    handler: "Capt. Saran Kumar"
  },
  {
    ship_id: "987654321098",
    name: "MV Ocean Warrior",
    lat: 11.5200,
    lon: 80.8500,
    heading: 142.0,
    speed: 14.5,
    destination: "Singapore",
    status: "ONLINE",
    distance_nm: 4.2,
    handler: "Capt. Rajesh V"
  },
  {
    ship_id: "456789123456",
    name: "SS Neptune Breeze",
    lat: 9.2100,
    lon: 79.5400,
    heading: 210.0,
    speed: 9.8,
    destination: "Colombo",
    status: "ONLINE",
    distance_nm: 7.8,
    handler: "Capt. Ananya Sen"
  },
  {
    ship_id: "789012345678",
    name: "MV Maritime Voyager",
    lat: 14.8500,
    lon: 81.2000,
    heading: 35.0,
    speed: 11.2,
    destination: "Visakhapatnam",
    status: "OFFLINE",
    distance_nm: 14.6,
    handler: "Capt. Vikram Shah"
  },
  {
    ship_id: "890123456789",
    name: "INS Bay Sentinel",
    lat: 8.1000,
    lon: 77.5500,
    heading: 275.0,
    speed: 15.0,
    destination: "Kochi",
    status: "ONLINE",
    distance_nm: 22.4,
    handler: "Capt. Priya Menon"
  }
];

export function calculateDistanceNM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R_earth_nm = 3440.065;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dphi / 2) * Math.sin(dphi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) * Math.sin(dlambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R_earth_nm * c * 10) / 10;
}

export function generateSeaRoute(originName: string, destinationName: string): MarineRoute {
  const orig = DEMO_PORTS[originName] || DEMO_PORTS['Chennai'];
  const dest = DEMO_PORTS[destinationName] || DEMO_PORTS['Colombo'];

  const waypoints: Waypoint[] = [
    { name: `Departure: ${orig.name}`, lat: orig.lat, lon: orig.lon },
    { name: 'Palk Strait Waypoint', lat: 10.4000, lon: 80.1000 },
    { name: 'Trincomalee Offshore Passage', lat: 8.6000, lon: 81.6000 },
    { name: 'Dondra Head Turning Point', lat: 5.9000, lon: 80.5000 },
    { name: `Arrival: ${dest.name}`, lat: dest.lat, lon: dest.lon }
  ];

  let totalDist = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDist += calculateDistanceNM(
      waypoints[i].lat,
      waypoints[i].lon,
      waypoints[i + 1].lat,
      waypoints[i + 1].lon
    );
  }
  totalDist = Math.round(totalDist * 10) / 10;

  const speedKnots = 12.0;
  const etaHours = Math.round((totalDist / speedKnots) * 10) / 10;
  const etaMinutes = Math.round(etaHours * 60);

  return {
    origin: orig.name,
    destination: dest.name,
    origin_coords: { lat: orig.lat, lon: orig.lon },
    destination_coords: { lat: dest.lat, lon: dest.lon },
    distance_nm: totalDist,
    eta_hours: etaHours,
    eta_minutes: etaMinutes,
    waypoints,
    is_demo_route: true,
    risk_score: 'CAUTION',
    risk_reasons: [
      'Strong northeast winds (22 knots) active near middle passage.',
      'Active Cyclone Watch (Tropical Depression 02B) 120 NM southeast.',
      'SST gradient indicates warm water front (29.1°C) near Palk Strait.'
    ]
  };
}

export function getMockWeatherData(lat: number, lon: number): WeatherData {
  return {
    is_demo_data: true,
    temperature_c: 28.5,
    condition: 'Partly Cloudy with Scattered Squalls',
    wind_speed_knots: 22.0,
    wind_direction: 'NE',
    visibility_nm: 8.0,
    humidity_pct: 78,
    pressure_hpa: 1008.2,
    rain_probability_pct: 40,
    wave_height_meters: 2.1,
    recorded_at: new Date().toISOString()
  };
}

export function getMockWindData(lat: number, lon: number): WindData {
  return {
    is_demo_data: true,
    wind_speed_knots: 22.0,
    wind_direction_deg: 45,
    wind_direction_cardinal: 'NE',
    gusts_knots: 28.5,
    severity: 'Moderate',
    description: 'Steady northeast breeze with localized gusting near coastal waters.'
  };
}

export function getMockTideData(lat: number, lon: number): TideData {
  const now = new Date();
  const nextHigh = new Date(now.getTime() + 3 * 3600 * 1000 + 15 * 60 * 1000);
  const nextLow = new Date(now.getTime() + 9 * 3600 * 1000 + 40 * 60 * 1000);

  return {
    is_demo_data: true,
    current_tide: 'Ebbing',
    tide_height_meters: 1.45,
    tide_direction: 'SE',
    next_high_tide: nextHigh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    next_low_tide: nextLow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tidal_current_knots: 1.2
  };
}

export function getMockCycloneData(lat: number, lon: number): CycloneHazard {
  return {
    is_demo_data: true,
    status: 'WATCH',
    hazard_name: 'Tropical Depression 02B',
    distance_nm: 120.0,
    bearing_direction: 'SE',
    expected_max_wind_knots: 45.0,
    affected_radius_nm: 150.0,
    center_coordinates: { lat: 11.2, lon: 82.5 },
    advisory: 'Cyclonic system moving NW at 8 knots. Ships in Bay of Bengal south sector advised caution.'
  };
}

export function getMockSSTData(lat: number, lon: number): SSTData {
  const temp = Math.round((28.5 + 1.4 * Math.sin(lat / 4.0) + 0.8 * Math.cos(lon / 5.0)) * 10) / 10;
  const clampedTemp = Math.max(26.5, Math.min(31.5, temp));
  const gradient = clampedTemp > 29.8 ? 'Thermal Front' : clampedTemp > 28.5 ? 'Warm' : 'Cool';

  return {
    is_demo_data: true,
    temperature_c: clampedTemp,
    min_c: 27.0,
    max_c: 31.0,
    gradient_status: gradient,
    recorded_at: new Date().toISOString()
  };
}

export function getMockChlorophyllData(lat: number, lon: number): ChlorophyllData {
  const conc = Math.round((0.42 + 0.22 * Math.cos(lat / 3.5) + 0.14 * Math.sin(lon / 4.2)) * 100) / 100;
  const clampedConc = Math.max(0.12, Math.min(0.95, conc));
  const level = clampedConc > 0.60 ? 'HIGH' : clampedConc >= 0.30 ? 'MEDIUM' : 'LOW';

  return {
    is_demo_data: true,
    concentration_mg_m3: clampedConc,
    level,
    description: `${level} phytoplankton biomass concentration along coastal upwelling zone.`,
    recorded_at: new Date().toISOString()
  };
}

export function getMockAreaIntelligence(lat: number, lon: number): AreaIntelligence {
  return {
    lat,
    lon,
    sst: getMockSSTData(lat, lon),
    chlorophyll: getMockChlorophyllData(lat, lon),
    weather: getMockWeatherData(lat, lon),
    wind: getMockWindData(lat, lon),
    tide: getMockTideData(lat, lon),
    cyclone: getMockCycloneData(lat, lon)
  };
}

export function getMockWhatIfScenario(extraWindKts: number = 12.0): ScenarioSimulation {
  const baseWind = 22.0;
  const simWind = baseWind + extraWindKts;
  const simRisk = simWind >= 30.0 ? 'HIGH RISK' : 'CAUTION';

  return {
    wind_speed_increase_kts: extraWindKts,
    simulated_risk: simRisk,
    affected_section: 'Middle passage / Dondra Head offshore turning point',
    recommendation: `SIMULATION ADVISORY: Risk escalates to ${simRisk}. Consider reviewing alternative passage closer to Sri Lanka coastline or delaying transit by 6 hours.`
  };
}

export function getMockRouteComparison(origin: string = 'Chennai', destA: string = 'Colombo', destB: string = 'Kochi'): RouteComparison {
  const routeA = generateSeaRoute(origin, destA);
  const routeB = generateSeaRoute(origin, destB);

  const sstA = getMockSSTData(routeA.destination_coords.lat, routeA.destination_coords.lon);
  const sstB = getMockSSTData(routeB.destination_coords.lat, routeB.destination_coords.lon);

  const chloroA = getMockChlorophyllData(routeA.destination_coords.lat, routeA.destination_coords.lon);
  const chloroB = getMockChlorophyllData(routeB.destination_coords.lat, routeB.destination_coords.lon);

  return {
    route_a: routeA,
    route_b: routeB,
    sst_a: sstA,
    sst_b: sstB,
    chlorophyll_a: chloroA,
    chlorophyll_b: chloroB,
    comparison_insight: `Route B (${origin} → ${destB}) currently exhibits lower wind exposure (SAFE) compared to Route A (${origin} → ${destA}), despite Route B being longer (${routeB.distance_nm} NM vs ${routeA.distance_nm} NM).`,
    recommended_option: 'B'
  };
}

export function generateMarineInsight(route: MarineRoute): string {
  const sst = getMockSSTData(route.destination_coords.lat, route.destination_coords.lon);
  const chloro = getMockChlorophyllData(route.destination_coords.lat, route.destination_coords.lon);
  
  return `Your selected passage (${route.origin} → ${route.destination}) is currently classified as ${route.risk_score}. Moderate wind conditions (22 kts NE) are present along the middle section. Sea surface temperature varies across the passage (${sst.temperature_c}°C, ${sst.gradient_status}), with ${chloro.level} chlorophyll concentration (${chloro.concentration_mg_m3} mg/m³). Tropical Depression 02B (Watch status) is active 120 NM southeast. Consider reviewing speed and passage timing near Dondra Head.`;
}

export function getInitialTrips(): TravelTrip[] {
  return [
    {
      id: 'trip-101',
      ship_id: '123456789012',
      origin: 'Chennai',
      destination: 'Colombo',
      distance_nm: 324.0,
      eta_minutes: 1620,
      risk_score: 'CAUTION',
      started_at: '2026-08-20T08:30:00Z',
      ended_at: '2026-08-21T11:30:00Z',
      weather_summary: '28.5°C, Partly Cloudy, 2.1m waves',
      wind_summary: '22 kts NE winds',
      tide_summary: '1.45m Ebbing tide',
      alerts_count: 1
    },
    {
      id: 'trip-102',
      ship_id: '123456789012',
      origin: 'Mumbai',
      destination: 'Kochi',
      distance_nm: 512.5,
      eta_minutes: 2560,
      risk_score: 'SAFE',
      started_at: '2026-08-12T06:00:00Z',
      ended_at: '2026-08-14T00:40:00Z',
      weather_summary: '30.0°C, Clear skies, 1.2m waves',
      wind_summary: '11 kts NW winds',
      tide_summary: '0.8m High tide',
      alerts_count: 0
    },
    {
      id: 'trip-103',
      ship_id: '123456789012',
      origin: 'Kochi',
      destination: 'Male',
      distance_nm: 380.2,
      eta_minutes: 1900,
      risk_score: 'SAFE',
      started_at: '2026-08-01T14:15:00Z',
      ended_at: '2026-08-02T22:00:00Z',
      weather_summary: '29.2°C, Light haze, 1.5m waves',
      wind_summary: '14 kts W winds',
      tide_summary: '1.1m Low tide',
      alerts_count: 0
    }
  ];
}
