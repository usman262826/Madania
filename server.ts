import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const PORT = 3000;
const HOST = '0.0.0.0';

// Supabase Client Config for 24/7 Server Worker
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vdzloqwaqmsniifeolfm.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkemxvcXdhcW1zbmlpZmVvbGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MDcwNDQsImV4cCI6MjEwMTE4MzA0NH0.aZKGpZrMxXkIGw8VkwLRdng2B0PkDWpK1v8Kgzx-M3A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Tipsoi and SMS Defaults
const DEFAULT_TIPSOI_BASE_URL = 'https://api-inovace360.com/api/v1';
const DEFAULT_TIPSOI_TOKEN = '6973-da50-6873-252b-6226-ff72-f48e-7790-4212-a803-fd39-6af0-fb95-e663-b3bf-d9f4';
const DEFAULT_SMS_KEY = 'a23Hnfiv06596m0p8r06RU8Tcs6eI49JQDL9T3Ug';

// Storage Key Constants
const STORAGE_KEYS = {
  SETTINGS: 'madrasah_attendance_settings_v3',
  RAW_PUNCHES: 'madrasah_raw_punches_v3',
  DAILY_ATTENDANCE: 'madrasah_student_attendance_v3',
  SENT_MESSAGES: 'madrasah_sent_sms_logs_v3',
  STUDENTS: 'madrasa_students_db',
  TEACHERS: 'madrasa_teachers_db',
  STAFF: 'madrasa_staff_db',
  TEACHER_ATTENDANCE: 'madrasah_teacher_attendance_records',
  STAFF_ATTENDANCE: 'madrasah_staff_attendance_records',
  LAST_SYNC_INFO: 'madrasah_tipsoi_last_sync_info_v3',
};

// Background Worker Status Tracking
let lastSyncTime: string | null = null;
let lastSyncPunchesCount = 0;
let totalSmsSentByServer = 0;
let lastSyncError: string | null = null;
let isSyncRunning = false;

// -------------------------------------------------------------
// HELPER FUNCTIONS FOR BACKGROUND WORKER
// -------------------------------------------------------------
const bnToEnDigits = (str: string): string => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = String(str || '');
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(bn[i], i.toString());
  }
  return res;
};

const normalizeIdentifier = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};

const normalizeSmsPhone = (rawPhone: string): string => {
  if (!rawPhone) return '';
  const eng = bnToEnDigits(String(rawPhone).trim());
  const numbers = eng.split(/[,;\s/]+/).map(p => {
    let clean = p.replace(/\D/g, '');
    if (clean.startsWith('8801') && clean.length === 13) return clean;
    if (clean.startsWith('01') && clean.length === 11) return `88${clean}`;
    if (clean.startsWith('1') && clean.length === 10) return `880${clean}`;
    return clean;
  }).filter(num => num.length >= 11);

  return numbers.join(',');
};

const fetchSupabaseState = async (key: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('madrasah_app_state')
      .select('data')
      .eq('id', key)
      .single();
    if (error || !data) return null;
    return data.data;
  } catch {
    return null;
  }
};

const saveSupabaseState = async (key: string, data: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('madrasah_app_state')
      .upsert({ id: key, data, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
};

const sendSmsNetBdServer = async (apiKey: string, to: string, msg: string) => {
  try {
    const targetPhone = normalizeSmsPhone(to);
    if (!targetPhone) return { success: false, reason: 'invalid_phone' };

    const params = new URLSearchParams();
    params.append('api_key', apiKey || DEFAULT_SMS_KEY);
    params.append('msg', msg);
    params.append('to', targetPhone);

    const res = await fetch('https://api.sms.net.bd/sendsms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const json: any = await res.json();
    const isOk = json && (json.error === 0 || json.status === 'success' || json.request_id);
    return { success: isOk, json };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
};

// -------------------------------------------------------------
// SERVER-SIDE 24/7 ATTENDANCE & SMS WORKER
// -------------------------------------------------------------
async function runBackgroundAttendanceSync() {
  if (isSyncRunning) return;
  isSyncRunning = true;

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Load state from Supabase
    const settings = (await fetchSupabaseState(STORAGE_KEYS.SETTINGS)) || {};
    const students = (await fetchSupabaseState(STORAGE_KEYS.STUDENTS)) || [];
    const existingRawPunches = (await fetchSupabaseState(STORAGE_KEYS.RAW_PUNCHES)) || [];
    const existingDailyAttendance = (await fetchSupabaseState(STORAGE_KEYS.DAILY_ATTENDANCE)) || {};
    const existingSentLogs = (await fetchSupabaseState(STORAGE_KEYS.SENT_MESSAGES)) || [];

    const baseUrl = (settings.tipsoiBaseUrl || process.env.VITE_TIPSOI_BASE_URL || DEFAULT_TIPSOI_BASE_URL).replace(/\/+$/, '');
    const apiToken = (settings.tipsoiApiToken || process.env.VITE_TIPSOI_API_TOKEN || DEFAULT_TIPSOI_TOKEN).trim();
    const smsApiKey = settings?.messaging?.smsApiKey || process.env.VITE_SMS_NET_BD_API_KEY || DEFAULT_SMS_KEY;

    // Fetch Tipsoi punches for today
    const startStr = `${todayStr} 00:00:00`;
    const endStr = `${todayStr} 23:59:59`;
    const tipsoiUrl = `${baseUrl}/logs?api_token=${apiToken}&start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}&criteria=sync_time`;

    let punches: any[] = [];
    try {
      const tipsoiRes = await fetch(tipsoiUrl);
      if (tipsoiRes.ok) {
        const json: any = await tipsoiRes.json();
        punches = json.data || json.logs || (Array.isArray(json) ? json : []);
      } else {
        // Fallback endpoint
        const altUrl = `${baseUrl}/attendance_logs?api_token=${apiToken}&start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`;
        const altRes = await fetch(altUrl);
        if (altRes.ok) {
          const altJson: any = await altRes.json();
          punches = altJson.data || altJson.logs || (Array.isArray(altJson) ? altJson : []);
        }
      }
    } catch (fErr: any) {
      lastSyncError = fErr?.message || 'Tipsoi API Fetch Failed';
    }

    lastSyncTime = new Date().toISOString();
    lastSyncPunchesCount = punches.length;

    if (punches.length === 0) {
      isSyncRunning = false;
      return;
    }

    // Convert Tipsoi punches into standardized raw punch objects
    const formattedRawPunches: any[] = punches.map((p: any) => {
      const punchTime = p.punch_time || p.logged_time || p.sync_time || p.time || p.timestamp || `${todayStr} 00:00:00`;
      const rawId = p.id || p.emp_id || p.person_identifier || p.user_id || p.card_no || p.rfid || '';
      return {
        id: `punch_${rawId}_${punchTime}`.replace(/[^a-zA-Z0-9_]/g, '_'),
        userId: String(p.emp_id || p.person_identifier || p.user_id || p.card_no || p.rfid || ''),
        punchTime,
        deviceName: p.device_name || p.location || 'বায়োমেট্রিক ডিভাইস',
        punchType: p.punch_type || 'fingerprint',
        raw: p,
      };
    });

    // Merge punches with existing raw punches avoiding duplicates
    const punchMap = new Map<string, any>();
    existingRawPunches.forEach((p: any) => punchMap.set(p.id, p));
    let hasNewPunches = false;

    formattedRawPunches.forEach((p: any) => {
      if (!punchMap.has(p.id)) {
        punchMap.set(p.id, p);
        hasNewPunches = true;
      }
    });

    const updatedRawPunches = Array.from(punchMap.values());

    // Evaluate attendance and send SMS for new events if messaging enabled
    const messagingEnabled = settings?.messaging?.enabled !== false;
    const rules = settings?.messaging?.rules || { entry: true, exit: true, late: true, absent: false };
    const templates = settings?.messaging?.templates || {};

    let smsSentInThisCycle = 0;
    const dayRecords: Record<string, any> = { ...(existingDailyAttendance[todayStr] || {}) };
    const sentLogsList = [...existingSentLogs];

    if (Array.isArray(students) && students.length > 0) {
      // Group punches by matched student
      const punchesByStudent = new Map<string, any[]>();

      updatedRawPunches.forEach((punch: any) => {
        const uToken = normalizeIdentifier(punch.userId);
        if (!uToken) return;

        // Match student by ID, Card, or Phone
        const matched = students.find((s: any) => {
          const sId = normalizeIdentifier(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || s['আবেদন নং']);
          const sCard = normalizeIdentifier(s['কার্ড নম্বর'] || s.card_no || s.rfid);
          const sMomPhone = String(s['মোবাইল (মা)'] || '').replace(/\D/g, '');
          const sDadPhone = String(s['মোবাইল (বাবা/ভাই)'] || s['অভিভাবকের মোবাইল'] || s.mobile || '').replace(/\D/g, '');

          return (
            (sId && sId === uToken) ||
            (sCard && sCard === uToken) ||
            (sMomPhone && uToken.length >= 10 && sMomPhone === uToken) ||
            (sDadPhone && uToken.length >= 10 && sDadPhone === uToken)
          );
        });

        if (matched) {
          const matchedId = String(matched.id || matched['রেজিস্ট্রেশন/আইডি নম্বর'] || matched['রেজিস্ট্রেশন/আইডি']);
          if (!punchesByStudent.has(matchedId)) punchesByStudent.set(matchedId, []);
          punchesByStudent.get(matchedId)!.push(punch);
        }
      });

      // Process each student
      for (const student of students) {
        const sId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || student['রেজিস্ট্রেশন/আইডি'] || student['আবেদন নং'] || '').trim();
        if (!sId) continue;

        const sName = student['শিক্ষার্থীর নাম'] || student.name || 'শিক্ষার্থী';
        const sClass = student['জামাত/শ্রেণী'] || student['জামাত'] || student.class || '';
        const sRoll = student['রোল নম্বর'] || student['রোল'] || student.roll || '';
        const guardianName = student['পিতার নাম'] || student['অভিভাবকের নাম'] || student.fatherName || 'অভিভাবক';
        const guardianPhone = student['মোবাইল (বাবা/ভাই)'] || student['মোবাইল (মা)'] || student['অভিভাবকের মোবাইল'] || student.mobile || '';

        const studentPunches = punchesByStudent.get(sId) || [];
        if (studentPunches.length === 0) continue;

        // Extract times
        const times = studentPunches.map((p: any) => {
          const rawT = p.punchTime || '';
          const parts = rawT.split(' ');
          const timeHHMM = parts.length > 1 ? parts[1].substring(0, 5) : '00:00';
          return { timeHHMM, raw: rawT };
        }).sort((a, b) => a.timeHHMM.localeCompare(b.timeHHMM));

        const firstEntryTime = times[0]?.timeHHMM;
        const lastExitTime = times.length > 1 ? times[times.length - 1]?.timeHHMM : undefined;
        const status = 'present';

        dayRecords[sId] = {
          id: `att_${sId}_${todayStr}`,
          studentId: sId,
          studentName: sName,
          roll: sRoll,
          class: sClass,
          attendanceDate: todayStr,
          status,
          firstEntryTime,
          lastExitTime,
          lastPunchTime: times[times.length - 1]?.timeHHMM,
          totalPunches: studentPunches.length,
          markedBy: 'TIPSOI_SERVER_CRON',
          markedAt: new Date().toISOString(),
        };

        // SMS Dispatch Logic
        if (messagingEnabled && guardianPhone) {
          // Entry SMS
          if (rules.entry && firstEntryTime) {
            const ruleId = `sms_${sId}_${todayStr}_entry`;
            const alreadySent = sentLogsList.some((l: any) => l.ruleId === ruleId);

            if (!alreadySent) {
              const defaultTemplate = 'সম্মানিত {guardian_name}, আপনার সন্তান {student_name} (শ্রেণী: {class}) আজ {time} মিনিটে মাদ্রাসায় উপস্থিত হয়েছে।';
              const template = templates.entry || defaultTemplate;
              const content = template
                .replace(/{student_name}/g, sName)
                .replace(/{guardian_name}/g, guardianName)
                .replace(/{date}/g, todayStr)
                .replace(/{time}/g, firstEntryTime)
                .replace(/{entry_time}/g, firstEntryTime)
                .replace(/{class}/g, sClass);

              const smsResult = await sendSmsNetBdServer(smsApiKey, guardianPhone, content);
              if (smsResult.success) {
                sentLogsList.unshift({
                  id: `msg_srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  studentId: sId,
                  studentName: sName,
                  guardianName,
                  phone: guardianPhone,
                  event: 'entry',
                  content,
                  deliveryStatus: 'delivered',
                  ruleId,
                  sentTime: new Date().toISOString(),
                });
                smsSentInThisCycle++;
                totalSmsSentByServer++;
              }
            }
          }

          // Exit SMS
          if (rules.exit && lastExitTime && times.length > 1) {
            const ruleId = `sms_${sId}_${todayStr}_exit`;
            const alreadySent = sentLogsList.some((l: any) => l.ruleId === ruleId);

            if (!alreadySent) {
              const defaultTemplate = 'সম্মানিত {guardian_name}, আপনার সন্তান {student_name} (শ্রেণী: {class}) আজ {time} মিনিটে মাদ্রাসা থেকে প্রস্থান করেছে।';
              const template = templates.exit || defaultTemplate;
              const content = template
                .replace(/{student_name}/g, sName)
                .replace(/{guardian_name}/g, guardianName)
                .replace(/{date}/g, todayStr)
                .replace(/{time}/g, lastExitTime)
                .replace(/{exit_time}/g, lastExitTime)
                .replace(/{class}/g, sClass);

              const smsResult = await sendSmsNetBdServer(smsApiKey, guardianPhone, content);
              if (smsResult.success) {
                sentLogsList.unshift({
                  id: `msg_srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  studentId: sId,
                  studentName: sName,
                  guardianName,
                  phone: guardianPhone,
                  event: 'exit',
                  content,
                  deliveryStatus: 'delivered',
                  ruleId,
                  sentTime: new Date().toISOString(),
                });
                smsSentInThisCycle++;
                totalSmsSentByServer++;
              }
            }
          }
        }
      }
    }

    // Persist updated records back to Supabase
    if (hasNewPunches || smsSentInThisCycle > 0) {
      existingDailyAttendance[todayStr] = dayRecords;
      await saveSupabaseState(STORAGE_KEYS.RAW_PUNCHES, updatedRawPunches.slice(-2000));
      await saveSupabaseState(STORAGE_KEYS.DAILY_ATTENDANCE, existingDailyAttendance);
      await saveSupabaseState(STORAGE_KEYS.SENT_MESSAGES, sentLogsList.slice(0, 1000));

      await saveSupabaseState(STORAGE_KEYS.LAST_SYNC_INFO, {
        connected: true,
        lastSyncTime: new Date().toISOString(),
        totalPunchesToday: updatedRawPunches.length,
        lastError: null,
        activeDevicesCount: 1,
        serverWorkerActive: true,
      });
    }

  } catch (err: any) {
    lastSyncError = err?.message || String(err);
    console.error('[24/7 Attendance Worker Error]:', err);
  } finally {
    isSyncRunning = false;
  }
}

// Start 24/7 Background Poller (runs every 25 seconds)
setInterval(() => {
  runBackgroundAttendanceSync();
}, 25000);

// Run initial sync cycle on server boot
setTimeout(() => {
  runBackgroundAttendanceSync();
}, 3000);

// -------------------------------------------------------------
// EXPRESS SERVER SETUP
// -------------------------------------------------------------
async function startServer() {
  const app = express();

  app.use(express.json());

  // API Endpoints
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Madrasah ERP 24/7 Background Sync & Attendance Engine',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/background-status', (_req, res) => {
    res.json({
      active: true,
      lastSyncTime,
      lastSyncPunchesCount,
      totalSmsSentByServer,
      lastSyncError,
      isSyncRunning,
    });
  });

  app.post('/api/trigger-sync', async (_req, res) => {
    runBackgroundAttendanceSync();
    res.json({ message: 'Sync triggered successfully', status: 'initiated' });
  });

  // Vite Development Middleware vs Production Static File Server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Madrasah ERP] Server running on http://${HOST}:${PORT}`);
    console.log(`[Madrasah ERP] 24/7 Attendance & SMS Poller initialized!`);
  });
}

startServer();
