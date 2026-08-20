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

    // Secondary relational table mirror for student_invoices if key matches
    if ((key === 'madrasah-invoices-db' || key === 'madrasah-student-fees-db') && Array.isArray(data)) {
      try {
        const rows = data.map((inv: any) => ({
          id: String(inv.id || inv.invoiceNo),
          invoice_no: inv.invoiceNo || '',
          student_id: String(inv.studentId || ''),
          student_name: inv.studentName || '',
          student_roll: String(inv.studentRoll || ''),
          student_class: inv.studentClass || '',
          subtotal: Number(inv.subtotal || 0),
          discount: Number(inv.discount || 0),
          net_amount: Number(inv.netAmount || 0),
          paid_amount: Number(inv.paidAmount || 0),
          due_amount: Number(inv.dueAmount || 0),
          status: inv.status || 'paid',
          payment_method: inv.paymentMethod || 'ক্যাশ',
          invoice_month: inv.month || '',
          invoice_year: String(inv.year || ''),
          comment: inv.comment || '',
          created_at: inv.date ? new Date(inv.date).toISOString() : new Date().toISOString()
        }));

        if (rows.length > 0) {
          await supabase.from('student_invoices').upsert(rows, { onConflict: 'id' });
        }
      } catch (rErr) {
        // Relational mirror table fail is non-blocking
        console.warn('Relational student_invoices sync warning:', rErr);
      }
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
