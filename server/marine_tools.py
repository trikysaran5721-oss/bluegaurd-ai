"""
BlueGuard Specialized Marine Data Tools & Calculation Engine
SIH Problem Statement: SIH26176
"""

import math
import datetime
from typing import Dict, Any, List, Optional

# Predefined Marine Coordinates & Demo Dataset
DEMO_PORTS = {
    "Chennai": {"lat": 13.0827, "lon": 80.2707, "country": "India"},
    "Colombo": {"lat": 6.9271, "lon": 79.8612, "country": "Sri Lanka"},
    "Kochi": {"lat": 9.9312, "lon": 76.2673, "country": "India"},
    "Mumbai": {"lat": 18.9401, "lon": 72.8347, "country": "India"},
    "Singapore": {"lat": 1.3521, "lon": 103.8198, "country": "Singapore"},
    "Visakhapatnam": {"lat": 17.6868, "lon": 83.2185, "country": "India"},
    "Male": {"lat": 4.1755, "lon": 73.5093, "country": "Maldives"},
    "Chittagong": {"lat": 22.3569, "lon": 91.7832, "country": "Bangladesh"}
}

DEMO_FLEET = [
    {
        "ship_id": "123456789012",
        "name": "INS BlueGuard Alpha",
        "lat": 13.0827,
        "lon": 80.2707,
        "heading": 84.0,
        "speed": 12.0,
        "destination": "Colombo",
        "status": "ONLINE",
        "handler": "Capt. Saran Kumar"
    },
    {
        "ship_id": "987654321098",
        "name": "MV Ocean Warrior",
        "lat": 11.5200,
        "lon": 80.8500,
        "heading": 142.0,
        "speed": 14.5,
        "destination": "Singapore",
        "status": "ONLINE",
        "handler": "Capt. Rajesh V"
    },
    {
        "ship_id": "456789123456",
        "name": "SS Neptune Breeze",
        "lat": 9.2100,
        "lon": 79.5400,
        "heading": 210.0,
        "speed": 9.8,
        "destination": "Colombo",
        "status": "ONLINE",
        "handler": "Capt. Ananya Sen"
    },
    {
        "ship_id": "789012345678",
        "name": "MV Maritime Voyager",
        "lat": 14.8500,
        "lon": 81.2000,
        "heading": 35.0,
        "speed": 11.2,
        "destination": "Visakhapatnam",
        "status": "OFFLINE",
        "handler": "Capt. Vikram Shah"
    },
    {
        "ship_id": "890123456789",
        "name": "INS Bay Sentinel",
        "lat": 8.1000,
        "lon": 77.5500,
        "heading": 275.0,
        "speed": 15.0,
        "destination": "Kochi",
        "status": "ONLINE",
        "handler": "Capt. Priya Menon"
    }
]

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in Nautical Miles between two GPS coordinates."""
    R_earth_nm = 3440.065  # Earth radius in Nautical Miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R_earth_nm * c, 1)

def get_current_position(ship_id: str) -> Dict[str, Any]:
    """Retrieve current ship position and navigation state."""
    for vessel in DEMO_FLEET:
        if vessel["ship_id"] == ship_id:
            return vessel
    return {
        "ship_id": ship_id,
        "name": f"Vessel {ship_id}",
        "lat": 13.0827,
        "lon": 80.2707,
        "heading": 84.0,
        "speed": 12.0,
        "destination": "Colombo",
        "status": "ONLINE",
        "handler": "Ship Handler"
    }

def get_weather(lat: float, lon: float) -> Dict[str, Any]:
    """Retrieve structured weather data (deterministic demo dataset tagged clearly)."""
    return {
        "is_demo_data": True,
        "temperature_c": 28.5,
        "condition": "Partly Cloudy with Scattered Squalls",
        "wind_speed_knots": 22.0,
        "wind_direction": "NE",
        "visibility_nm": 8.0,
        "humidity_pct": 78,
        "pressure_hpa": 1008.2,
        "rain_probability_pct": 40,
        "wave_height_meters": 2.1,
        "recorded_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

def get_wind(lat: float, lon: float) -> Dict[str, Any]:
    """Retrieve wind speed, direction, and severity indicators."""
    return {
        "is_demo_data": True,
        "wind_speed_knots": 22.0,
        "wind_direction_deg": 45,
        "wind_direction_cardinal": "NE",
        "gusts_knots": 28.5,
        "severity": "Moderate",
        "description": "Steady northeast breeze with localized gusting near coastal waters."
    }

def get_tide(lat: float, lon: float) -> Dict[str, Any]:
    """Retrieve deterministic tide data."""
    now = datetime.datetime.now(datetime.timezone.utc)
    return {
        "is_demo_data": True,
        "current_tide": "Ebbing",
        "tide_height_meters": 1.45,
        "tide_direction": "SE",
        "next_high_tide": (now + datetime.timedelta(hours=3, minutes=15)).strftime("%H:%M UTC"),
        "next_low_tide": (now + datetime.timedelta(hours=9, minutes=40)).strftime("%H:%M UTC"),
        "tidal_current_knots": 1.2
    }

def get_cyclone_hazards(lat: float, lon: float) -> Dict[str, Any]:
    """Retrieve active cyclone and maritime hazard advisory state."""
    return {
        "is_demo_data": True,
        "status": "CYCLONE WATCH",
        "hazard_name": "Tropical Depression 02B",
        "distance_nm": 120.0,
        "bearing_direction": "SE",
        "expected_max_wind_knots": 45.0,
        "affected_radius_nm": 150.0,
        "center_coordinates": {"lat": 11.2000, "lon": 82.5000},
        "advisory": "Cyclonic system moving NW at 8 knots. Ships in Bay of Bengal south sector advised caution."
    }

def get_sst(lat: float, lon: float) -> Dict[str, Any]:
    """Retrieve Sea Surface Temperature (SST) tagged DEMO MARINE DATA."""
    # Deterministic spatial variance based on latitude & longitude
    temp = round(28.5 + 1.4 * math.sin(lat / 4.0) + 0.8 * math.cos(lon / 5.0), 1)
    temp = max(26.5, min(31.5, temp))
    
    grad_status = "Thermal Front" if temp > 29.8 else ("Warm" if temp > 28.5 else "Cool")
    return {
        "is_demo_data": True,
        "temperature_c": temp,
        "min_c": 27.0,
        "max_c": 31.0,
        "gradient_status": grad_status,
        "recorded_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

def get_chlorophyll(lat: float, lon: float) -> Dict[str, Any]:
    """Retrieve Chlorophyll Concentration tagged DEMO MARINE DATA."""
    # Deterministic spatial calculation based on latitude & longitude
    conc = round(0.42 + 0.22 * math.cos(lat / 3.5) + 0.14 * math.sin(lon / 4.2), 2)
    conc = max(0.12, min(0.95, conc))

    level = "HIGH" if conc > 0.60 else ("MEDIUM" if conc >= 0.30 else "LOW")
    desc = f"{level.capitalize()} phytoplankton biomass concentration along coastal upwelling zone."
    
    return {
        "is_demo_data": True,
        "concentration_mg_m3": conc,
        "level": level,
        "description": desc,
        "recorded_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

def get_nearby_vessels(lat: float, lon: float, radius_nm: float = 20.0) -> List[Dict[str, Any]]:
    """Find nearby ships within configured radius in nautical miles."""
    nearby = []
    for vessel in DEMO_FLEET:
        dist = calculate_haversine_distance(lat, lon, vessel["lat"], vessel["lon"])
        if dist <= radius_nm and dist > 0.01:
            v_copy = dict(vessel)
            v_copy["distance_nm"] = dist
            nearby.append(v_copy)
    return nearby

def get_nearby_online_ships(lat: float, lon: float, radius_nm: float = 50.0) -> List[Dict[str, Any]]:
    """Filter online demo vessels within alert propagation radius."""
    online_ships = []
    for vessel in DEMO_FLEET:
        if vessel["status"] == "ONLINE":
            dist = calculate_haversine_distance(lat, lon, vessel["lat"], vessel["lon"])
            if dist <= radius_nm:
                v_copy = dict(vessel)
                v_copy["distance_nm"] = dist
                online_ships.append(v_copy)
    return online_ships

def get_area_marine_conditions(lat: float, lon: float) -> Dict[str, Any]:
    """Consolidated Area Intelligence for map click inspection."""
    return {
        "lat": lat,
        "lon": lon,
        "weather": get_weather(lat, lon),
        "wind": get_wind(lat, lon),
        "tide": get_tide(lat, lon),
        "cyclone": get_cyclone_hazards(lat, lon),
        "sst": get_sst(lat, lon),
        "chlorophyll": get_chlorophyll(lat, lon),
        "vessels": get_nearby_vessels(lat, lon, 25.0)
    }

def get_route(origin: str, destination: str) -> Dict[str, Any]:
    """Generate demo sea route between specified locations."""
    orig_coords = DEMO_PORTS.get(origin, {"lat": 13.0827, "lon": 80.2707})
    dest_coords = DEMO_PORTS.get(destination, {"lat": 6.9271, "lon": 79.8612})

    waypoints = [
        {"name": f"Departure: {origin}", "lat": orig_coords["lat"], "lon": orig_coords["lon"]},
        {"name": "Palk Strait Approach", "lat": 10.4000, "lon": 80.1000},
        {"name": "Trincomalee Offshore Passage", "lat": 8.6000, "lon": 81.6000},
        {"name": "Dondra Head Turning Point", "lat": 5.9000, "lon": 80.5000},
        {"name": f"Arrival: {destination}", "lat": dest_coords["lat"], "lon": dest_coords["lon"]}
    ]

    total_dist = 0.0
    for i in range(len(waypoints) - 1):
        total_dist += calculate_haversine_distance(
            waypoints[i]["lat"], waypoints[i]["lon"],
            waypoints[i+1]["lat"], waypoints[i+1]["lon"]
        )
    total_dist = round(total_dist, 1)

    speed_knots = 12.0
    eta_hours = round(total_dist / speed_knots, 1)
    eta_minutes = int(eta_hours * 60)

    return {
        "origin": origin,
        "destination": destination,
        "origin_coords": orig_coords,
        "destination_coords": dest_coords,
        "distance_nm": total_dist,
        "eta_hours": eta_hours,
        "eta_minutes": eta_minutes,
        "waypoints": waypoints,
        "is_demo_route": True
    }

def calculate_route_risk(route_info: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze route safety based on weather, wind, tide, SST, chlorophyll, cyclone, and traffic."""
    wind = get_wind(10.0, 80.0)
    cyclone = get_cyclone_hazards(10.0, 80.0)
    sst = get_sst(10.0, 80.0)
    chlorophyll = get_chlorophyll(10.0, 80.0)
    
    reasons = []
    risk_score = "SAFE"

    if cyclone["status"] in ["WATCH", "WARNING", "SEVERE"]:
        risk_score = "CAUTION"
        reasons.append(f"Active {cyclone['status']} ({cyclone['hazard_name']}) within {cyclone['distance_nm']} NM of route path.")

    if wind["wind_speed_knots"] > 20:
        if risk_score == "SAFE":
            risk_score = "CAUTION"
        reasons.append(f"Strong winds of {wind['wind_speed_knots']} knots ({wind['wind_direction_cardinal']}) along middle passage.")

    if wind["wind_speed_knots"] > 35:
        risk_score = "HIGH RISK"

    if sst["temperature_c"] > 30.0:
        reasons.append(f"Elevated Sea Surface Temp ({sst['temperature_c']}°C) detected near tropical front.")

    if not reasons:
        reasons.append("Favorable sea conditions and clear visibility along planned passage.")

    return {
        "risk_status": risk_score,
        "reasons": reasons,
        "sst_summary": f"{sst['temperature_c']}°C ({sst['gradient_status']})",
        "chlorophyll_summary": f"{chlorophyll['concentration_mg_m3']} mg/m³ ({chlorophyll['level']})",
        "recommendation": "Reduce speed and maintain continuous watchkeeper vigilance near Dondra Head." if risk_score != "SAFE" else "Proceed on course at planned economical speed."
    }

def simulate_what_if_scenario(origin: str = "Chennai", destination: str = "Colombo", extra_wind_kts: float = 12.0) -> Dict[str, Any]:
    """Simulate a 'What If?' scenario (e.g. wind increases to 34 knots). Labeled explicitly as SIMULATION."""
    base_wind = 22.0
    simulated_wind = base_wind + extra_wind_kts

    simulated_risk = "HIGH RISK" if simulated_wind >= 30.0 else "CAUTION"
    affected_section = "Middle passage / Dondra Head offshore turning point"

    return {
        "is_simulation": True,
        "simulation_title": f"WHAT IF WIND INCREASES BY +{extra_wind_kts} KTS (To {simulated_wind} Kts)?",
        "base_wind_kts": base_wind,
        "simulated_wind_kts": simulated_wind,
        "simulated_risk": simulated_risk,
        "affected_section": affected_section,
        "recommendation": f"SIMULATION ADVISORY: Risk escalates to {simulated_risk}. Consider reviewing alternative passage closer to Sri Lanka coastline or delaying transit by 6 hours.",
        "disclaimer": "SCENARIO / SIMULATION ONLY - Do not treat as real forecast."
    }

def compare_routes(origin: str = "Chennai", dest_a: str = "Colombo", dest_b: str = "Kochi") -> Dict[str, Any]:
    """Compare Route A vs Route B across all marine variables."""
    route_a = get_route(origin, dest_a)
    route_b = get_route(origin, dest_b)

    risk_a = calculate_route_risk(route_a)
    risk_b = calculate_route_risk(route_b)

    sst_a = get_sst(route_a["destination_coords"]["lat"], route_a["destination_coords"]["lon"])
    sst_b = get_sst(route_b["destination_coords"]["lat"], route_b["destination_coords"]["lon"])

    chloro_a = get_chlorophyll(route_a["destination_coords"]["lat"], route_a["destination_coords"]["lon"])
    chloro_b = get_chlorophyll(route_b["destination_coords"]["lat"], route_b["destination_coords"]["lon"])

    comparison_insight = (
        f"Route B ({origin} → {dest_b}) currently exhibits lower wind exposure ({risk_b['risk_status']}) "
        f"compared to Route A ({origin} → {dest_a}), despite Route B being {route_b['distance_nm']} NM vs {route_a['distance_nm']} NM."
    )

    return {
        "route_a": {
            "name": f"{origin} → {dest_a}",
            "distance_nm": route_a["distance_nm"],
            "wind": "22 knots NE",
            "sst": f"{sst_a['temperature_c']}°C",
            "chlorophyll": f"{chloro_a['concentration_mg_m3']} mg/m³",
            "risk": risk_a["risk_status"],
            "vessels": 4
        },
        "route_b": {
            "name": f"{origin} → {dest_b}",
            "distance_nm": route_b["distance_nm"],
            "wind": "14 knots E",
            "sst": f"{sst_b['temperature_c']}°C",
            "chlorophyll": f"{chloro_b['concentration_mg_m3']} mg/m³",
            "risk": risk_b["risk_status"],
            "vessels": 2
        },
        "comparison_insight": comparison_insight,
        "recommended_option": "B" if risk_b["risk_status"] == "SAFE" else "A"
    }

# Tool Declarations for OpenAI Function Calling Engine
OPENAI_TOOLS_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_current_position",
            "description": "Retrieve current ship GPS position, heading, speed, and navigation status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ship_id": {"type": "string", "description": "12-digit Ship ID"}
                },
                "required": ["ship_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Retrieve structured weather report including temperature, visibility, rain probability, and sea condition.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {"type": "number", "description": "Latitude"},
                    "lon": {"type": "number", "description": "Longitude"}
                },
                "required": ["lat", "lon"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_wind",
            "description": "Retrieve current wind speed in knots, wind direction, gustiness, and severity.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {"type": "number", "description": "Latitude"},
                    "lon": {"type": "number", "description": "Longitude"}
                },
                "required": ["lat", "lon"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_tide",
            "description": "Retrieve tidal state, height, direction, and upcoming high/low tide predictions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {"type": "number", "description": "Latitude"},
                    "lon": {"type": "number", "description": "Longitude"}
                },
                "required": ["lat", "lon"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_cyclone_hazards",
            "description": "Retrieve active cyclone warnings, tropical depressions, and severe maritime hazards.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {"type": "number", "description": "Latitude"},
                    "lon": {"type": "number", "description": "Longitude"}
                },
                "required": ["lat", "lon"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_sst",
            "description": "Retrieve Sea Surface Temperature (SST) in Celsius and thermal gradient status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {"type": "number", "description": "Latitude"},
                    "lon": {"type": "number", "description": "Longitude"}
                },
                "required": ["lat", "lon"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_chlorophyll",
            "description": "Retrieve Chlorophyll biomass concentration in mg/m3 and productivity level (LOW/MEDIUM/HIGH).",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {"type": "number", "description": "Latitude"},
                    "lon": {"type": "number", "description": "Longitude"}
                },
                "required": ["lat", "lon"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_area_marine_conditions",
            "description": "Retrieve consolidated marine area intelligence (weather, wind, tide, SST, chlorophyll, cyclone, vessels).",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {"type": "number", "description": "Latitude"},
                    "lon": {"type": "number", "description": "Longitude"}
                },
                "required": ["lat", "lon"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_nearby_vessels",
            "description": "Retrieve list of nearby ships, their distances, speeds, headings, and destinations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {"type": "number", "description": "Latitude"},
                    "lon": {"type": "number", "description": "Longitude"},
                    "radius_nm": {"type": "number", "description": "Search radius in Nautical Miles"}
                },
                "required": ["lat", "lon"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_route",
            "description": "Calculate sea route between origin and destination with distance and waypoints.",
            "parameters": {
                "type": "object",
                "properties": {
                    "origin": {"type": "string", "description": "Origin port name"},
                    "destination": {"type": "string", "description": "Destination port name"}
                },
                "required": ["origin", "destination"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_route_risk",
            "description": "Evaluate total route risk considering weather, wind, tide, SST, chlorophyll, cyclone hazards, and traffic.",
            "parameters": {
                "type": "object",
                "properties": {
                    "origin": {"type": "string", "description": "Origin port"},
                    "destination": {"type": "string", "description": "Destination port"}
                },
                "required": ["origin", "destination"]
            }
        }
    }
]
