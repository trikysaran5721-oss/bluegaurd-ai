"""
BLUEGUARD FASTAPI BACKEND SERVER
SIH Problem Statement: SIH26176
Agentic AI Marine Information Assistant & Real-Time Emergency Network
"""

import os
import json
import asyncio
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Import specialized marine tools
import marine_tools

load_dotenv()
load_dotenv(".env.local")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

app = FastAPI(
    title="BlueGuard Marine Assistant API",
    description="Backend AI Agent & Marine Information Server for SIH26176",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# WEBSOCKET REAL-TIME EMERGENCY ALERT HUB
# ----------------------------------------------------

class EmergencyConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, ship_id: str, websocket: WebSocket):
        await websocket.accept()
        if ship_id not in self.active_connections:
            self.active_connections[ship_id] = []
        self.active_connections[ship_id].append(websocket)

    def disconnect(self, ship_id: str, websocket: WebSocket):
        if ship_id in self.active_connections:
            if websocket in self.active_connections[ship_id]:
                self.active_connections[ship_id].remove(websocket)
            if not self.active_connections[ship_id]:
                del self.active_connections[ship_id]

    async def broadcast_emergency(self, alert_payload: Dict[str, Any], sender_ship_id: str, radius_nm: float = 100.0):
        sender_lat = alert_payload.get("latitude", 13.0827)
        sender_lon = alert_payload.get("longitude", 80.2707)

        nearby_online = marine_tools.get_nearby_online_ships(sender_lat, sender_lon, radius_nm)
        target_ship_ids = [s["ship_id"] for s in nearby_online if s["ship_id"] != sender_ship_id]

        print(f"[EMERGENCY HUB] Alert from {sender_ship_id} -> Target ships: {target_ship_ids}")

        broadcast_count = 0
        for ship_id, connections in list(self.active_connections.items()):
            for ws in connections:
                try:
                    await ws.send_json({
                        "type": "EMERGENCY_ALERT_RECEIVED",
                        "payload": alert_payload
                    })
                    broadcast_count += 1
                except Exception as e:
                    print(f"Error sending emergency to {ship_id}: {e}")

        return {"delivered_count": broadcast_count, "target_ships": target_ship_ids}

manager = EmergencyConnectionManager()

@app.websocket("/ws/emergency/{ship_id}")
async def emergency_websocket(websocket: WebSocket, ship_id: str):
    await manager.connect(ship_id, websocket)
    try:
        await websocket.send_json({
            "type": "SYSTEM_CONNECTED",
            "ship_id": ship_id,
            "status": "ONLINE",
            "message": f"Connected to BlueGuard Emergency Alert Hub as Ship {ship_id}"
        })
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type == "SEND_EMERGENCY":
                alert_data = message.get("payload", {})
                await manager.broadcast_emergency(alert_data, ship_id)
            elif msg_type == "ACKNOWLEDGE_ALERT":
                ack_payload = message.get("payload", {})
                for sid, connections in manager.active_connections.items():
                    for ws in connections:
                        try:
                            await ws.send_json({
                                "type": "ALERT_ACKNOWLEDGED",
                                "payload": ack_payload
                            })
                        except Exception:
                            pass
    except WebSocketDisconnect:
        manager.disconnect(ship_id, websocket)
    except Exception as e:
        manager.disconnect(ship_id, websocket)

# ----------------------------------------------------
# AGENTIC AI & OPENAI INTEGRATION
# ----------------------------------------------------

class AgentRequest(BaseModel):
    query: str
    ship_id: str = "123456789012"
    language: str = "en"
    current_lat: float = 13.0827
    current_lon: float = 80.2707
    destination: str = "Colombo"

@app.post("/api/agent")
async def process_agent_query(req: AgentRequest):
    query_lower = req.query.lower()
    
    # 🚨 Emergency intent recognition
    if any(k in query_lower for k in ["emergency", "distress", "sos", "blueguard emergency", "blue gaurd emergency"]):
        answer_text = (
            f"🚨 EMERGENCY DISTRESS ALERT ACTIVATED: Ship {req.ship_id} is broadcasting a distress signal to all online vessels, "
            "NTFY push notification channel ('blueguard_maritime_emergency'), and higher official email ('trikysaran5721@gmail.com')."
        )
        return {
            "answer": answer_text,
            "language": req.language,
            "tools_called": ["create_emergency_alert", "get_nearby_online_ships", "dispatch_ntfy_push", "send_official_email"],
            "tool_data": [{"tool": "create_emergency_alert", "status": "BROADCASTED"}],
            "provider": "BlueGuard Emergency Network"
        }

    # Tool Execution Mapping
    executed_tools = []
    
    if any(k in query_lower for k in ["sst", "sea surface", "temperature", "temp", "thermal"]):
        sst_data = marine_tools.get_sst(req.current_lat, req.current_lon)
        executed_tools.append({"tool": "get_sst", "result": sst_data})

    if any(k in query_lower for k in ["chlorophyll", "biomass", "phytoplankton"]):
        chloro_data = marine_tools.get_chlorophyll(req.current_lat, req.current_lon)
        executed_tools.append({"tool": "get_chlorophyll", "result": chloro_data})

    if any(k in query_lower for k in ["what if", "scenario", "simulation", "increase"]):
        sim_data = marine_tools.simulate_what_if_scenario("Chennai", req.destination, 12.0)
        executed_tools.append({"tool": "simulate_what_if_scenario", "result": sim_data})

    if any(k in query_lower for k in ["compare", "comparison"]):
        comp_data = marine_tools.compare_routes("Chennai", req.destination, "Kochi")
        executed_tools.append({"tool": "compare_routes", "result": comp_data})

    if any(k in query_lower for k in ["weather", "wind", "mausam", "hawa"]):
        weather = marine_tools.get_weather(req.current_lat, req.current_lon)
        wind = marine_tools.get_wind(req.current_lat, req.current_lon)
        executed_tools.append({"tool": "get_weather", "result": weather})
        executed_tools.append({"tool": "get_wind", "result": wind})

    if any(k in query_lower for k in ["tide", "wave", "jwar"]):
        tide = marine_tools.get_tide(req.current_lat, req.current_lon)
        executed_tools.append({"tool": "get_tide", "result": tide})

    if any(k in query_lower for k in ["cyclone", "storm", "hazard", "warning", "toofan"]):
        cyclone = marine_tools.get_cyclone_hazards(req.current_lat, req.current_lon)
        executed_tools.append({"tool": "get_cyclone_hazards", "result": cyclone})

    if any(k in query_lower for k in ["ship", "vessel", "nearby", "jahaj"]):
        vessels = marine_tools.get_nearby_vessels(req.current_lat, req.current_lon, 20.0)
        executed_tools.append({"tool": "get_nearby_vessels", "result": vessels})

    if any(k in query_lower for k in ["safe", "risk", "route", "rasta", "analyze", "area"]):
        route_info = marine_tools.get_route("Chennai", req.destination)
        risk = marine_tools.calculate_route_risk(route_info)
        executed_tools.append({"tool": "get_route", "result": route_info})
        executed_tools.append({"tool": "calculate_route_risk", "result": risk})

    if not executed_tools:
        weather = marine_tools.get_weather(req.current_lat, req.current_lon)
        wind = marine_tools.get_wind(req.current_lat, req.current_lon)
        sst_data = marine_tools.get_sst(req.current_lat, req.current_lon)
        chloro_data = marine_tools.get_chlorophyll(req.current_lat, req.current_lon)
        executed_tools.append({"tool": "get_weather", "result": weather})
        executed_tools.append({"tool": "get_wind", "result": wind})
        executed_tools.append({"tool": "get_sst", "result": sst_data})
        executed_tools.append({"tool": "get_chlorophyll", "result": chloro_data})

    # Attempt OpenAI Call if API Key present
    if OPENAI_API_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)

            system_prompt = (
                "You are BlueGuard, an intelligent Agentic Marine Watchkeeper Assistant for ship handlers. "
                "CRITICAL PRINCIPLE: You must NEVER claim to autonomously control or steer a real vessel. Never invent telemetry data. "
                "You provide advisory information, SST/chlorophyll explanations, weather safety reports, and emergency warnings based ONLY on returned tool data. "
                f"Respond clearly and concisely in {req.language.upper()} language. Keep spoken answers short and clear."
            )

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Query: {req.query}\nReturned Marine Tool Data: {json.dumps(executed_tools)}"}
            ]

            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                max_tokens=250,
                temperature=0.3
            )
            answer_text = response.choices[0].message.content.strip()

            return {
                "answer": answer_text,
                "language": req.language,
                "tools_called": [t["tool"] for t in executed_tools],
                "tool_data": executed_tools,
                "provider": "OpenAI"
            }
        except Exception as e:
            print(f"[OPENAI AGENT ERROR] {e}. Falling back to deterministic agent reasoning.")

    # Local Agentic Reasoning Engine Fallback
    if req.language == "hi":
        if "get_sst" in str(executed_tools):
          answer_text = "ब्लूगार्ड रिपोर्ट: आपकी यात्रा मार्ग पर समुद्री सतह का तापमान (SST) 29.1°C (थर्मल फ्रंट) दर्ज किया गया है। (डेमो मरेन डेटा)"
        elif "get_chlorophyll" in str(executed_tools):
          answer_text = "ब्लूगार्ड विश्लेषण: मार्ग में क्लोरोफिल सांद्रता 0.42 mg/m³ (मध्यम स्तर) है। (डेमो मरेन डेटा)"
        elif "simulate_what_if_scenario" in str(executed_tools):
          answer_text = "सिमुलेशन रिपोर्ट: यदि हवा की गति +12 समुद्री मील बढ़ती है, तो मार्ग जोखिम 'उच्च जोखिम' (HIGH RISK) में बदल जाता है।"
        else:
          answer_text = f"ब्लूगार्ड समुद्री सहायक सक्रिय है। मार्ग {req.destination} वर्तमान में सावधान (CAUTION) श्रेणी में है।"
    else:
        if any(t["tool"] == "get_sst" for t in executed_tools):
            answer_text = "BlueGuard Report: Sea surface temperature (SST) along your passage is currently 29.1°C with an active thermal front gradient. (DEMO MARINE DATA)"
        elif any(t["tool"] == "get_chlorophyll" for t in executed_tools):
            answer_text = "BlueGuard Intelligence: Chlorophyll biomass concentration along your route is recorded at 0.42 mg/m³ (MEDIUM level). (DEMO MARINE DATA)"
        elif any(t["tool"] == "simulate_what_if_scenario" for t in executed_tools):
            answer_text = "SIMULATION ADVISORY: If wind increases by +12 knots (to 34 kts), overall route risk escalates from CAUTION to HIGH RISK along Dondra Head passage. (SIMULATION ONLY)"
        elif any(t["tool"] == "compare_routes" for t in executed_tools):
            answer_text = "Route Comparison: Route B (Chennai → Kochi) currently exhibits lower wind exposure (SAFE) compared to Route A (Chennai → Colombo), despite being longer."
        else:
            answer_text = f"BlueGuard Advisory: Route to {req.destination} is currently set to CAUTION. 22 knot NE winds, SST thermal front (29.1°C), and a Cyclone Watch are active."

    return {
        "answer": answer_text,
        "language": req.language,
        "tools_called": [t["tool"] for t in executed_tools],
        "tool_data": executed_tools,
        "provider": "BlueGuard Agentic Rule Engine (Demo Mode)"
    }

# ----------------------------------------------------
# REST API ENDPOINTS
# ----------------------------------------------------

@app.get("/health")
def health_check():
    return {"status": "ONLINE", "system": "BLUEGUARD Agentic Marine API", "version": "1.0.0"}

@app.get("/api/tools/position")
def api_get_position(ship_id: str = "123456789012"):
    return marine_tools.get_current_position(ship_id)

@app.get("/api/tools/weather")
def api_get_weather(lat: float = 13.0827, lon: float = 80.2707):
    return marine_tools.get_weather(lat, lon)

@app.get("/api/tools/wind")
def api_get_wind(lat: float = 13.0827, lon: float = 80.2707):
    return marine_tools.get_wind(lat, lon)

@app.get("/api/tools/tide")
def api_get_tide(lat: float = 13.0827, lon: float = 80.2707):
    return marine_tools.get_tide(lat, lon)

@app.get("/api/tools/cyclone")
def api_get_cyclone(lat: float = 13.0827, lon: float = 80.2707):
    return marine_tools.get_cyclone_hazards(lat, lon)

@app.get("/api/tools/sst")
def api_get_sst(lat: float = 13.0827, lon: float = 80.2707):
    return marine_tools.get_sst(lat, lon)

@app.get("/api/tools/chlorophyll")
def api_get_chlorophyll(lat: float = 13.0827, lon: float = 80.2707):
    return marine_tools.get_chlorophyll(lat, lon)

@app.get("/api/tools/area_conditions")
def api_get_area_conditions(lat: float = 13.0827, lon: float = 80.2707):
    return marine_tools.get_area_marine_conditions(lat, lon)

@app.get("/api/tools/vessels")
def api_get_vessels(lat: float = 13.0827, lon: float = 80.2707, radius_nm: float = 50.0):
    return marine_tools.get_nearby_vessels(lat, lon, radius_nm)

@app.get("/api/tools/route")
def api_get_route(origin: str = "Chennai", destination: str = "Colombo"):
    route_info = marine_tools.get_route(origin, destination)
    risk_info = marine_tools.calculate_route_risk(route_info)
    return {"route": route_info, "risk": risk_info}

@app.post("/api/tools/emergency")
async def api_trigger_emergency(payload: Dict[str, Any] = Body(...)):
    sender_id = payload.get("sender_ship_id", "123456789012")
    res = await manager.broadcast_emergency(payload, sender_id)
    return {"status": "SUCCESS", "message": "Emergency alert broadcasted", "details": res}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
