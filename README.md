# BLUEGUARD — Agentic AI Marine Information Assistant

> **SIH Problem Statement SIH26176**  
> *"Your Intelligent Marine Watchkeeper"*

---

## 🌊 Overview & Core Vision

**BlueGuard** is a software-first Agentic AI Marine Information Assistant built for marine ship handlers and operators. BlueGuard provides real-time marine tool telemetry, interactive satellite route navigation, voice interaction in English and Hindi, proactive watchkeeper hazard warnings, and a multi-session real-time ship-to-ship emergency distress broadcast network.

> **IMPORTANT SAFETY PRINCIPLE:**  
> BlueGuard **NEVER** claims to autonomously control or steer a real vessel. The system acts as an intelligent advisory watchkeeper; the human ship handler remains responsible for navigational decisions.

---

## ✨ Key Features & Capability Matrix

- 🎙️ **Wake Phrase Voice Activation ("BlueGuard"):**
  - Microphone expands from floating corner icon into a glowing emerald central orb with audio waveform animation.
  - Bilingual voice recognition and Text-to-Speech synthesis in **English** and **Hindi**.
  - Supports continuous follow-up questions without repeating the trigger word.

- 🧠 **Agentic AI & Specialized Marine Tools:**
  - OpenAI LLM function calling loop executing backend marine data tools:
    `get_current_position()`, `get_weather()`, `get_wind()`, `get_tide()`, `get_cyclone_hazards()`, `get_nearby_vessels()`, `calculate_route_risk()`, `get_route()`, `create_emergency_alert()`, `get_nearby_online_ships()`.

- 🗺️ **Interactive Satellite Marine Navigation Map:**
  - Leaflet marine map satellite rendering.
  - Interactive route polylines, waypoints, vessel markers with heading rotation, wind directional vectors, tide indicators, and translucent cyclone hazard circles.

- 📍 **Destination Entry & Manual Sea Route Builder:**
  - Predefined marine coordinate port system (Chennai, Colombo, Kochi, Mumbai, Singapore, Visakhapatnam, Male, Chittagong).
  - Manual route creator allowing users to click interactive map points to create custom waypoint passages with distance in NM, risk evaluation, and route saving.

- 🚨 **Real-Time Ship-to-Ship Emergency Broadcast Network:**
  - WebSockets & BroadcastChannel mesh connecting active demo browser sessions representing ships (`123456789012`, `987654321098`, etc.).
  - Voice command `"BlueGuard, send the emergency alert"` opens distress confirmation dialog.
  - On broadcast, receiving ships play synthesized maritime siren alarm audio, highlight sender marker on map, and display full-screen crimson emergency metadata (Ship ID, Handler Name, GPS Coordinates, Destination, Emergency Message).
  - Browser autoplay unlock fallback button `"ENABLE ALERT AUDIO"`.

- 🎨 **Distinct Visual UI Themes per Page:**
  - **Login:** Midnight Navy + Electric Cyan with animated background
  - **Dashboard:** Ocean Blue + Teal + Emerald Command Center
  - **Voice Assistant:** Deep Navy + Emerald Green Glow
  - **Emergency Overlay:** Black/Navy + Crimson Red + Emergency Orange
  - **Travel History:** Deep Indigo + Violet Timeline
  - **Fleet Hub:** Slate + Navy Maritime Operations Grid
  - **Profile/Settings:** Slate + Steel Blue

- 📶 **Offline / Limited Connectivity Mode:**
  - Displays cached marine datasets, routes, ship IDs, and history with clear notice banner when offline.

---

## 🏗️ Architecture & Technology Stack

```
                       HUMAN SHIP HANDLER
                               |
                        Voice / Text ("BlueGuard")
                               |
                        FRONTEND (Next.js 16 + React 19)
             [Satellite Map | Voice Mic | Realtime Siren | UI Themes]
                               |
             +-----------------+-----------------+
             |                                   |
    FastAPI BACKEND (Python 3.12)       SUPABASE / LOCAL STORAGE
    [Agentic OpenAI Tool Loop]          [Profiles | Ships | History]
             |
   +---------+---------+
   |                   |
OpenAI GPT-4o       Specialized Marine Tools
                   [Weather | Wind | Tide | Cyclone | Vessels]
                               |
                    Real-time WebSocket Hub
                               |
                 MULTI-SESSION DEMO VESSELS
               [Ship 123456789012 <-> Ship 987654321098]
```

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Leaflet, Web Audio API, Web Speech API.
- **Backend:** Python FastAPI, Uvicorn, OpenAI API client, WebSockets, Pydantic.
- **Database:** Supabase PostgreSQL (`schema.sql`) + local storage fallback.

---

## ⚙️ Setup & Execution Instructions

### 1. Prerequisites
- Node.js (v20+)
- Python (3.10+)

### 2. Environment Variables (.env.local)
Copy `.env.example` to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 3. Running the Python Backend Server
```bash
cd server
python main.py
```
*Runs on `http://localhost:8000` with interactive API docs at `http://localhost:8000/docs`.*

### 4. Running the Next.js Frontend
```bash
cmd /c npm run dev
```
*Access BlueGuard at `http://localhost:3000`.*

---

## ⏱️ 5-Minute SIH Evaluation Demo Flow

1. Open `http://localhost:3000/login`.
2. Click **Continue with Google** or select quick demo ship `Ship 123456789012`.
3. First-time login prompts for 12-digit Ship ID registration with numeric validation.
4. Dashboard opens displaying the satellite marine command center map.
5. Select destination **Colombo** to view sea route, distance (324 NM), and risk status (**CAUTION**).
6. View live floating widgets: Weather (28.5°C), Wind (22 kts NE), Tide (1.45m Ebbing), Cyclone Watch.
7. Click the floating corner microphone or say **"BlueGuard"**. Watch the mic transform and expand into a glowing emerald orb with waveform animation.
8. Ask: *"What is the weather on my route?"* -> BlueGuard speaks back the weather report.
9. Open a second browser window to `http://localhost:3000/login` and log in as `Ship 987654321098`.
10. In Tab 1, say: *"BlueGuard, send the emergency alert"* or click the distress button.
11. Confirm distress alert.
12. **Observe Tab 2 instantly trigger emergency siren alarm audio and display the full-screen crimson distress interface with Ship 123456789012 metadata!**
13. Click **Acknowledge Emergency** on Tab 2.
14. Navigate to **Travel History** to view saved timeline voyages, or toggle **Offline Mode**.
