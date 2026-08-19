import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vdzloqwaqmsniifeolfm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkemxvcXdhcW1zbmlpZmVvbGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MDcwNDQsImV4cCI6MjEwMTE4MzA0NH0.aZKGpZrMxXkIGw8VkwLRdng2B0PkDWpK1v8Kgzx-M3A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Health check helper to verify Supabase connectivity
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('madrasah_app_state').select('id').limit(1);
    return !error;
  } catch (err) {
    console.warn('Supabase health check warning:', err);
    return false;
  }
}

/**
 * Safely upsert any state entity into Supabase madrasah_app_state
 */
export async function syncStateToSupabase(key: string, data: any): Promise<boolean> {
  if (!key) return false;
  try {
    const payload = {
      id: key,
      data: data,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase
      .from('madrasah_app_state')
      .upsert(payload, { onConflict: 'id' });
    
    if (error) {
      console.warn(`Supabase upsert error for key ${key}:`, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`Supabase network sync exception for key ${key}:`, e);
    return false;
  }
}

/**
 * Bulk fetch all state entities from Supabase for ultra-fast single-roundtrip hydration
 */
export async function fetchAllStatesFromSupabase(): Promise<Record<string, any> | null> {
  try {
    const { data, error } = await supabase.from('madrasah_app_state').select('*');
    if (error || !data) {
      console.warn('Failed to bulk fetch from madrasah_app_state:', error?.message);
      return null;
    }
    const result: Record<string, any> = {};
    data.forEach((row: any) => {
      if (row.id) {
        result[row.id] = row.data;
      }
    });
    return result;
  } catch (e) {
    console.warn('Supabase fetch exception:', e);
    return null;
  }
}

/**
 * Delete a state entry from Supabase
 */
export async function deleteStateFromSupabase(key: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('madrasah_app_state').delete().eq('id', key);
    return !error;
  } catch (e) {
    console.warn('Supabase delete exception for key ${key}:', e);
    return false;
  }
}
