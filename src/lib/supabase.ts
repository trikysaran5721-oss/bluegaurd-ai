import { createClient } from '@supabase/supabase-js';
import { ShipProfile } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejyexzqgvrinjqflsihb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeWV4enFndnJpbmpxZmxzaWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDY4MjIsImV4cCI6MjEwMzMyMjgyMn0.-FKZHZo6zcE768u6KOIN6mjKdfZpsWm8VkwxvfpyucA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const USER_KEY = 'blueguard_current_user';
const SHIP_PROFILES_KEY = 'blueguard_ship_profiles';

export const demoStorage = {
  getUser: (): ShipProfile | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  setUser: (profile: ShipProfile) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(profile));

    const profiles = demoStorage.getAllProfiles();
    profiles[profile.google_user_id] = profile;
    profiles[profile.ship_id] = profile;
    localStorage.setItem(SHIP_PROFILES_KEY, JSON.stringify(profiles));
  },

  getAllProfiles: (): Record<string, ShipProfile> => {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem(SHIP_PROFILES_KEY);
    return data ? JSON.parse(data) : {};
  },

  logout: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
  }
};
