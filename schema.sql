-- ====================================================
-- BLUEGUARD DATABASE SCHEMA FOR SUPABASE POSTGRESQL
-- SIH Problem Statement: SIH26176
-- Agentic AI Marine Information Assistant
-- ====================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_user_id TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    ship_id VARCHAR(12) UNIQUE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ships Table
CREATE TABLE IF NOT EXISTS public.ships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id VARCHAR(12) UNIQUE NOT NULL,
    owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION NOT NULL DEFAULT 13.0827,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 80.2707,
    heading DOUBLE PRECISION NOT NULL DEFAULT 84.0,
    speed DOUBLE PRECISION NOT NULL DEFAULT 12.0,
    destination TEXT DEFAULT 'Colombo',
    online_status TEXT DEFAULT 'ONLINE',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Trips / Travel History Table
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id VARCHAR(12) NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    route_geojson JSONB,
    distance_nm DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    eta_minutes INT NOT NULL DEFAULT 0,
    risk_score VARCHAR(20) DEFAULT 'SAFE',
    weather_summary TEXT,
    wind_summary TEXT,
    tide_summary TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- 5. Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_ship_id VARCHAR(12) NOT NULL,
    sender_name TEXT NOT NULL DEFAULT 'Ship Handler',
    severity VARCHAR(20) NOT NULL DEFAULT 'CRITICAL',
    alert_type VARCHAR(50) DEFAULT 'EMERGENCY_DISTRESS',
    message TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    destination TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Alert Recipients Table
CREATE TABLE IF NOT EXISTS public.alert_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
    receiver_ship_id VARCHAR(12) NOT NULL,
    delivered_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ
);

-- 7. Route Waypoints Table
CREATE TABLE IF NOT EXISTS public.route_waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    sequence_number INT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    name TEXT
);

-- 8. Saved Routes Table
CREATE TABLE IF NOT EXISTS public.saved_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id VARCHAR(12) NOT NULL,
    name TEXT NOT NULL,
    waypoints_json JSONB NOT NULL,
    distance_nm DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    risk_analysis TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Marine Snapshots Table
CREATE TABLE IF NOT EXISTS public.marine_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    weather_json JSONB NOT NULL,
    wind_json JSONB NOT NULL,
    tide_json JSONB NOT NULL,
    cyclone_json JSONB NOT NULL,
    snapshot_time TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Agent Sessions Table
CREATE TABLE IF NOT EXISTS public.agent_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id VARCHAR(12) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Agent Messages Table
CREATE TABLE IF NOT EXISTS public.agent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.agent_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    tool_calls JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id VARCHAR(12) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'INFORMATIONAL',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_ships_ship_id ON public.ships(ship_id);
CREATE INDEX IF NOT EXISTS idx_trips_ship_id ON public.trips(ship_id);
CREATE INDEX IF NOT EXISTS idx_alerts_sender ON public.alerts(sender_ship_id);
CREATE INDEX IF NOT EXISTS idx_alert_recipients_receiver ON public.alert_recipients(receiver_ship_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow public access for demo purposes / RLS permissive policies
CREATE POLICY "Public profiles access" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public ships access" ON public.ships FOR ALL USING (true);
CREATE POLICY "Public trips access" ON public.trips FOR ALL USING (true);
CREATE POLICY "Public alerts access" ON public.alerts FOR ALL USING (true);
CREATE POLICY "Public alert_recipients access" ON public.alert_recipients FOR ALL USING (true);
CREATE POLICY "Public saved_routes access" ON public.saved_routes FOR ALL USING (true);
CREATE POLICY "Public notifications access" ON public.notifications FOR ALL USING (true);
