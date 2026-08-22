import express from 'express';
import path from 'path';
import crypto from 'crypto';
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
const DEFAULT_SMS_KEY = 's3qQPmfL2bcBmt03K26v';
const DEFAULT_SMS_SENDER_ID = '8809648910612';

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

    const payload = {
       api_key: apiKey || DEFAULT_SMS_KEY,
       senderid: "8809648910612",
       number: targetPhone,
       message: msg
    };

    const res = await fetch('http://bulksmsbd.net/api/smsapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    let json: any = {};
    try { json = JSON.parse(text); } catch { }
    
    const isOk = json && (json.response_code === 202 || text.includes('202'));
    return { success: isOk, json: json || text };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
};

// -------------------------------------------------------------
// SERVER-SIDE 24/7 ATTENDANCE & HIGH-SPEED SMS WORKER
// -------------------------------------------------------------
let cachedSettings: any = null;
let cachedStudents: any[] | null = null;
const cachedRawPunchesMap = new Map<string, any>();
const cachedSentLogsSet = new Set<string>();
let isCacheLoaded = false;

// Refresh in-memory cache periodically from Supabase
async function refreshServerCache() {
  try {
    const settings = await fetchSupabaseState(STORAGE_KEYS.SETTINGS);
    if (settings) cachedSettings = settings;

    const students = await fetchSupabaseState(STORAGE_KEYS.STUDENTS);
    if (students && Array.isArray(students)) cachedStudents = students;

    const existingPunches = await fetchSupabaseState(STORAGE_KEYS.RAW_PUNCHES);
    if (Array.isArray(existingPunches)) {
      existingPunches.forEach((p: any) => {
        if (p && p.id) cachedRawPunchesMap.set(p.id, p);
      });
    }

    const sentLogs = await fetchSupabaseState(STORAGE_KEYS.SENT_MESSAGES);
    if (Array.isArray(sentLogs)) {
      sentLogs.forEach((l: any) => {
        if (l && l.ruleId) cachedSentLogsSet.add(l.ruleId);
      });
    }

    isCacheLoaded = true;
  } catch (err) {
    console.warn('[Server Cache Refresh Error]:', err);
  }
}

// Helper to convert time string HH:MM to minutes
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

// High-Speed Async Punch Processing & Immediate SMS Dispatch
async function processNewPunchesAndSendSMS(rawPunchesInput: any[]) {
  if (!Array.isArray(rawPunchesInput) || rawPunchesInput.length === 0) return;

  const todayStr = new Date().toISOString().split('T')[0];

  // Load cache if not ready
  if (!isCacheLoaded || !cachedStudents) {
    await refreshServerCache();
  }

  const settings = cachedSettings || {};
  const students = cachedStudents || [];
  if (students.length === 0) return;

  const messagingEnabled = settings?.messaging?.enabled !== false;
  const rules = settings?.messaging?.rules || { entry: true, exit: true, late: true, absent: false };
  const templates = settings?.messaging?.templates || {};
  const smsApiKey = settings?.messaging?.providerApiKey || process.env.VITE_SMS_NET_BD_API_KEY || DEFAULT_SMS_KEY;
  const senderId = settings?.messaging?.senderId || DEFAULT_SMS_SENDER_ID;

  // Format incoming raw punches
  const formattedRawPunches: any[] = [];
  rawPunchesInput.forEach((p: any) => {
    if (!p) return;
    const punchTime = p.punch_time || p.logged_time || p.sync_time || p.time || p.timestamp || p.punchTime || `${todayStr} 00:00:00`;
    const rawId = p.id || p.emp_id || p.person_identifier || p.user_id || p.card_no || p.rfid || p.userId || '';
    if (!rawId) return;

    const punchId = `punch_${rawId}_${punchTime}`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Check if we already processed this punch
    if (!cachedRawPunchesMap.has(punchId)) {
      const punchObj = {
        id: punchId,
        userId: String(p.emp_id || p.person_identifier || p.user_id || p.card_no || p.rfid || p.userId || rawId),
        punchTime,
        deviceName: p.device_name || p.location || p.deviceName || 'বায়োমেট্রিক ডিভাইস',
        punchType: p.punch_type || p.punchType || 'fingerprint',
        raw: p,
      };
      cachedRawPunchesMap.set(punchId, punchObj);
      formattedRawPunches.push(punchObj);
    }
  });

  if (formattedRawPunches.length === 0) return;

  // Group newly formatted punches by matched student
  const punchesByStudent = new Map<string, any[]>();
  formattedRawPunches.forEach((punch: any) => {
    const uToken = normalizeIdentifier(punch.userId);
    if (!uToken) return;

    const matched = students.find((s: any) => {
      const sId = normalizeIdentifier(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || s['আবেদন নং']);
      const sRoll = normalizeIdentifier(s['রোল নম্বর'] || s['রোল'] || s.roll);
      const sCard = normalizeIdentifier(s['কার্ড নম্বর'] || s.card_no || s.rfid);
      const sMomPhone = String(s['মোবাইল (মা)'] || '').replace(/\D/g, '');
      const sDadPhone = String(s['মোবাইল (বাবা/ভাই)'] || s['অভিভাবকের মোবাইল'] || s.mobile || s['মোবাইল'] || '').replace(/\D/g, '');

      return (
        (sId && sId === uToken) ||
        (sId && /^\d+$/.test(sId) && /^\d+$/.test(uToken) && parseInt(sId, 10) === parseInt(uToken, 10)) ||
        (sRoll && sRoll === uToken) ||
        (sRoll && /^\d+$/.test(sRoll) && /^\d+$/.test(uToken) && parseInt(sRoll, 10) === parseInt(uToken, 10)) ||
        (sCard && sCard === uToken) ||
        (sMomPhone && uToken.length >= 10 && sMomPhone === uToken) ||
        (sDadPhone && uToken.length >= 10 && sDadPhone === uToken)
      );
    });

    if (matched) {
      const matchedId = String(matched.id || matched['রেজিস্ট্রেশন/আইডি নম্বর'] || matched['রেজিস্ট্রেশন/আইডি'] || matched['আবেদন নং'] || '').trim();
      if (!punchesByStudent.has(matchedId)) punchesByStudent.set(matchedId, []);
      punchesByStudent.get(matchedId)!.push(punch);
    }
  });

  if (punchesByStudent.size === 0) return;

  // Standard entry time for late calculation (default 06:30)
  const standardEntry = settings?.student?.standardEntry || settings?.nonResidentialSchedule?.entryTime || '06:30';
  const lateGraceMinutes = settings?.student?.lateThresholdMinutes || 0;
  const standardEntryMins = timeToMinutes(standardEntry) + lateGraceMinutes;

  // Load existing daily attendance and sent logs for today
  const existingDailyAttendance = (await fetchSupabaseState(STORAGE_KEYS.DAILY_ATTENDANCE)) || {};
  const dayRecords: Record<string, any> = { ...(existingDailyAttendance[todayStr] || {}) };
  const existingSentLogs = (await fetchSupabaseState(STORAGE_KEYS.SENT_MESSAGES)) || [];
  const updatedSentLogs = [...existingSentLogs];

  const smsPromises: Promise<any>[] = [];

  punchesByStudent.forEach((studentPunches, sId) => {
    const student = students.find((s: any) => String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || s['আবেদন নং'] || '').trim() === sId);
    if (!student) return;

    const sName = student['শিক্ষার্থীর নাম'] || student.name || 'শিক্ষার্থী';
    const sClass = student['জামাত/শ্রেণী'] || student['জামাত'] || student.class || '';
    const sRoll = student['রোল নম্বর'] || student['রোল'] || student.roll || '';
    const sCategory = student['আবাসিক অনাবাসিক'] || student.category || 'অনাবাসিক';
    const guardianName = student['পিতার নাম'] || student['অভিভাবকের নাম'] || student.fatherName || 'অভিভাবক';
    const guardianPhone = student['মোবাইল (বাবা/ভাই)'] || student['মোবাইল (মা)'] || student['অভিভাবকের মোবাইল'] || student.mobile || student['মোবাইল'] || student.phone || '';

    // Extract time strings
    const times = studentPunches.map((p: any) => {
      const rawT = p.punchTime || '';
      const parts = rawT.split(' ');
      const timeHHMM = parts.length > 1 ? parts[1].substring(0, 5) : '00:00';
      return { timeHHMM, raw: rawT };
    }).sort((a, b) => a.timeHHMM.localeCompare(b.timeHHMM));

    const firstEntryTime = times[0]?.timeHHMM || '00:00';
    const lastExitTime = times.length > 1 ? times[times.length - 1]?.timeHHMM : undefined;
    const firstEntryMins = timeToMinutes(firstEntryTime);

    const isLate = firstEntryMins > standardEntryMins;
    const lateMinutes = isLate ? firstEntryMins - standardEntryMins : 0;

    // Update day record
    const existingRec = dayRecords[sId] || {};
    dayRecords[sId] = {
      ...existingRec,
      id: `att_${sId}_${todayStr}`,
      studentId: sId,
      studentName: sName,
      roll: sRoll,
      class: sClass,
      category: sCategory,
      attendanceDate: todayStr,
      status: isLate ? 'late' : 'present',
      isLate,
      lateMinutes,
      firstEntryTime: existingRec.firstEntryTime || firstEntryTime,
      lastExitTime: lastExitTime || existingRec.lastExitTime,
      lastPunchTime: times[times.length - 1]?.timeHHMM,
      totalPunches: (existingRec.totalPunches || 0) + studentPunches.length,
      markedBy: 'TIPSOI_SERVER_247',
      markedAt: existingRec.markedAt || new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    // SMS Dispatch Logic
    const isStudentBlocked = settings?.messaging?.individualStudentOverrides?.[sId]?.enabled === false;

    if (messagingEnabled && !isStudentBlocked && guardianPhone) {
      // 1. Late Entry SMS
      if (isLate && rules.late !== false) {
        const ruleId = `sms_${sId}_${todayStr}_late`;
        if (!cachedSentLogsSet.has(ruleId)) {
          cachedSentLogsSet.add(ruleId);

          const defaultTemplate = 'সম্মানিত {guardian_name}, আপনার সন্তান {student_name} (শ্রেণী: {class}) আজ {time} মিনিটে মাদ্রাসায় বিলম্বে উপস্থিত হয়েছে ({late_minutes} মিনিট বিলম্ব)।';
          const templateStr = templates.late || defaultTemplate;
          const content = templateStr
            .replace(/{student_name}/g, sName)
            .replace(/{guardian_name}/g, guardianName)
            .replace(/{date}/g, todayStr)
            .replace(/{time}/g, firstEntryTime)
            .replace(/{entry_time}/g, firstEntryTime)
            .replace(/{late_minutes}/g, String(lateMinutes))
            .replace(/{class}/g, sClass)
            .replace(/{jamat}/g, sClass)
            .replace(/{category}/g, sCategory);

          const promise = sendSmsNetBdServer(smsApiKey, guardianPhone, content).then(res => {
            if (res.success) {
              totalSmsSentByServer++;
              updatedSentLogs.unshift({
                id: `msg_srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                studentId: sId,
                studentName: sName,
                guardianName,
                phone: guardianPhone,
                event: 'late',
                content,
                deliveryStatus: 'delivered',
                ruleId,
                sentTime: new Date().toISOString(),
              });
            }
          });
          smsPromises.push(promise);
        }
      }

      // 2. Standard Entry SMS (if not sent yet)
      if (rules.entry !== false) {
        const ruleId = `sms_${sId}_${todayStr}_entry`;
        if (!cachedSentLogsSet.has(ruleId)) {
          cachedSentLogsSet.add(ruleId);

          const defaultTemplate = 'সম্মানিত {guardian_name}, আপনার সন্তান {student_name} (শ্রেণী: {class}) আজ {time} মিনিটে মাদ্রাসায় উপস্থিত হয়েছে।';
          const templateStr = templates.entry || defaultTemplate;
          const content = templateStr
            .replace(/{student_name}/g, sName)
            .replace(/{guardian_name}/g, guardianName)
            .replace(/{date}/g, todayStr)
            .replace(/{time}/g, firstEntryTime)
            .replace(/{entry_time}/g, firstEntryTime)
            .replace(/{class}/g, sClass)
            .replace(/{jamat}/g, sClass)
            .replace(/{category}/g, sCategory);

          const promise = sendSmsNetBdServer(smsApiKey, guardianPhone, content).then(res => {
            if (res.success) {
              totalSmsSentByServer++;
              updatedSentLogs.unshift({
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
            }
          });
          smsPromises.push(promise);
        }
      }

      // 3. Exit SMS
      if (lastExitTime && rules.exit !== false) {
        const ruleId = `sms_${sId}_${todayStr}_exit`;
        if (!cachedSentLogsSet.has(ruleId)) {
          cachedSentLogsSet.add(ruleId);

          const defaultTemplate = 'সম্মানিত {guardian_name}, আপনার সন্তান {student_name} (শ্রেণী: {class}) আজ {time} মিনিটে মাদ্রাসা থেকে প্রস্থান করেছে।';
          const templateStr = templates.exit || defaultTemplate;
          const content = templateStr
            .replace(/{student_name}/g, sName)
            .replace(/{guardian_name}/g, guardianName)
            .replace(/{date}/g, todayStr)
            .replace(/{time}/g, lastExitTime)
            .replace(/{exit_time}/g, lastExitTime)
            .replace(/{class}/g, sClass)
            .replace(/{jamat}/g, sClass)
            .replace(/{category}/g, sCategory);

          const promise = sendSmsNetBdServer(smsApiKey, guardianPhone, content).then(res => {
            if (res.success) {
              totalSmsSentByServer++;
              updatedSentLogs.unshift({
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
            }
          });
          smsPromises.push(promise);
        }
      }
    }
  });

  // Await SMS dispatches
  if (smsPromises.length > 0) {
    await Promise.allSettled(smsPromises);
  }

  // Persist updated state to Supabase asynchronously
  existingDailyAttendance[todayStr] = dayRecords;
  const rawPunchesList = Array.from(cachedRawPunchesMap.values()).slice(-3000);

  saveSupabaseState(STORAGE_KEYS.RAW_PUNCHES, rawPunchesList);
  saveSupabaseState(STORAGE_KEYS.DAILY_ATTENDANCE, existingDailyAttendance);
  saveSupabaseState(STORAGE_KEYS.SENT_MESSAGES, updatedSentLogs.slice(0, 1000));
  saveSupabaseState(STORAGE_KEYS.LAST_SYNC_INFO, {
    connected: true,
    lastSyncTime: new Date().toISOString(),
    totalPunchesToday: rawPunchesList.length,
    lastError: null,
    activeDevicesCount: 1,
    serverWorkerActive: true,
  });
}

// 24/7 Background Poller function
async function runBackgroundAttendanceSync() {
  if (isSyncRunning) return;
  isSyncRunning = true;

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Read settings & credentials from cache or Supabase
    if (!isCacheLoaded) await refreshServerCache();

    const settings = cachedSettings || {};
    const baseUrl = (settings.tipsoiBaseUrl || process.env.VITE_TIPSOI_BASE_URL || DEFAULT_TIPSOI_BASE_URL).replace(/\/+$/, '');
    const apiToken = (settings.tipsoiApiToken || process.env.VITE_TIPSOI_API_TOKEN || DEFAULT_TIPSOI_TOKEN).trim();

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

    if (punches.length > 0) {
      await processNewPunchesAndSendSMS(punches);
    }
  } catch (err: any) {
    lastSyncError = err?.message || String(err);
    console.error('[24/7 Attendance Worker Error]:', err);
  } finally {
    isSyncRunning = false;
  }
}

// Start 24/7 High-Speed Background Poller (runs every 5 seconds)
setInterval(() => {
  runBackgroundAttendanceSync();
}, 5000);

// Periodically refresh cache every 2 minutes
setInterval(() => {
  refreshServerCache();
}, 120000);

// Boot initial sync
setTimeout(() => {
  refreshServerCache().then(() => runBackgroundAttendanceSync());
}, 2000);

// -------------------------------------------------------------
// SESSION SECURITY & AUTHENTICATION MEMORY STORE (1 HOUR INACTIVITY TIMEOUT)
// -------------------------------------------------------------
interface ServerSession {
  token: string;
  userId: string;
  userName: string;
  role: string;
  expiresAt: number;
  lastActive: number;
}

const activeSessions = new Map<string, ServerSession>();

// Cleanup expired sessions every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now > session.expiresAt || (now - session.lastActive > 3600000)) {
      activeSessions.delete(token);
    }
  }
}, 120000);

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.headers['x-session-token'] as string);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token required', code: 'UNAUTHORIZED' });
  }

  const session = activeSessions.get(token);
  const now = Date.now();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session token', code: 'INVALID_SESSION' });
  }

  // Check 1-hour inactivity timeout
  if (now > session.expiresAt || (now - session.lastActive > 3600000)) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Unauthorized: Session expired due to 1 hour of inactivity', code: 'SESSION_EXPIRED' });
  }

  // Touch session activity timestamp
  session.lastActive = now;
  session.expiresAt = now + 3600000; // extend by 1 hour

  (req as any).user = session;
  next();
};

// -------------------------------------------------------------
// EXPRESS SERVER SETUP
// -------------------------------------------------------------
async function startServer() {
  const app = express();

  app.use(express.json());

  // Public Health Endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Madrasah ERP 24/7 Background Sync & Attendance Engine',
      timestamp: new Date().toISOString(),
    });
  });

  // Authentication API Endpoints
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'ইমেইল/মোবাইল এবং পাসওয়ার্ড প্রদান করুন।' });
      }

      const cleanInput = String(email).trim().toLowerCase();
      const cleanPass = String(password).trim();

      let authenticatedUser: any = null;

      // 1. Database Check in Supabase app_users table
      try {
        const { data: dbUsers } = await supabase
          .from('app_users')
          .select('*')
          .or(`email.ilike.${cleanInput},phone.ilike.${cleanInput}`);

        if (dbUsers && dbUsers.length > 0) {
          const u = dbUsers[0];
          if (u.password_hash === cleanPass || u.password === cleanPass) {
            authenticatedUser = {
              id: u.id,
              name: u.name,
              role: u.role || 'admin',
              designation: u.designation || (u.role === 'admin' ? 'এডমিন' : 'কর্মকর্তা'),
              email: u.email || u.phone,
              mobile: u.phone || u.email,
              status: u.status || 'Approved',
              loginPermitted: u.status === 'Approved',
            };
          }
        }
      } catch (e) {
        console.warn("Server app_users check error:", e);
      }

      // 2. Database Check in madrasah_app_state sync
      if (!authenticatedUser) {
        try {
          const { data: stateData } = await supabase
            .from('madrasah_app_state')
            .select('*')
            .in('id', ['madrasa_users', 'madrasa_teachers']);

          let cloudUsers: any[] = [];
          if (stateData) {
            stateData.forEach((row: any) => {
              const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
              if (Array.isArray(parsed)) cloudUsers.push(...parsed);
            });
          }

          const matched = cloudUsers.find(u => {
            const uMobile = (u.mobile || '').toString().trim().toLowerCase();
            const uEmail = (u.email || '').toString().trim().toLowerCase();
            const uPhone = (u.phone || '').toString().trim().toLowerCase();
            const uId = (u.id || '').toString().trim().toLowerCase();

            return (uMobile === cleanInput || uEmail === cleanInput || uPhone === cleanInput || uId === cleanInput) &&
                   (u.password || '').toString().trim() === cleanPass;
          });

          if (matched) {
            authenticatedUser = {
              id: matched.id || 'USR-01',
              name: matched.name || 'ব্যবহারকারী',
              role: matched.role || 'teacher',
              designation: matched.designation || 'কর্মকর্তা',
              email: matched.email || matched.mobile || '',
              mobile: matched.mobile || matched.email || '',
              status: matched.status || (matched.loginPermitted ? 'Approved' : 'Pending'),
              loginPermitted: matched.loginPermitted !== false && matched.status !== 'Blocked' && matched.status !== 'Pending',
            };
          }
        } catch (e) {
          console.warn("Server madrasah_app_state check error:", e);
        }
      }

      // 3. Fallback System Super Admin Bootstrapping
      if (!authenticatedUser) {
        if ((cleanInput === 'admin@madrasah.com' || cleanInput === '01700000000' || cleanInput === 'admin') && cleanPass === '123456') {
          authenticatedUser = {
            id: 'ADM01',
            name: 'মুহতামিম সাহেব (সুপার এডমিন)',
            role: 'admin',
            designation: 'প্রধান প্রশাসনিক কর্মকর্তা',
            mobile: '01700000000',
            email: 'admin@madrasah.com',
            status: 'Approved',
            loginPermitted: true,
          };
        }
      }

      if (!authenticatedUser) {
        return res.status(401).json({ error: 'মোবাইল নম্বর/ইমেইল বা পাসওয়ার্ড ভুল। সঠিক তথ্য দিন।' });
      }

      if (authenticatedUser.loginPermitted === false || authenticatedUser.status === 'Pending' || authenticatedUser.status === 'Blocked') {
        return res.status(403).json({ error: 'আপনার একাউন্টটি এডমিনের অনুমোদনের অপেক্ষায় আছে অথবা নিষ্ক্রিয় করা হয়েছে।' });
      }

      // Generate Session Token & Set Expiration
      const token = crypto.randomBytes(32).toString('hex');
      const now = Date.now();
      const expiresAt = now + 3600000; // 1 Hour Session Lifetime

      activeSessions.set(token, {
        token,
        userId: authenticatedUser.id,
        userName: authenticatedUser.name,
        role: authenticatedUser.role,
        expiresAt,
        lastActive: now,
      });

      return res.json({
        success: true,
        token,
        expiresAt,
        user: authenticatedUser,
      });
    } catch (err: any) {
      console.error("Auth server error:", err);
      return res.status(500).json({ error: 'সার্ভার সিকিউরিটি ত্রুটি ঘটেছে।' });
    }
  });

  app.post('/api/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : (req.body?.token || req.headers['x-session-token']);

    if (!token) {
      return res.status(401).json({ valid: false, error: 'মেয়াদোত্তীর্ণ বা অনুপস্থিত সেশন টোকেন' });
    }

    const session = activeSessions.get(token as string);
    const now = Date.now();

    if (!session || now > session.expiresAt || (now - session.lastActive > 3600000)) {
      if (session) activeSessions.delete(token as string);
      return res.status(401).json({ valid: false, error: 'সেশন নিষ্ক্রিয় বা অবলুপ্ত' });
    }

    // Refresh Session Activity
    session.lastActive = now;
    session.expiresAt = now + 3600000;

    return res.json({
      valid: true,
      expiresAt: session.expiresAt,
      user: {
        id: session.userId,
        name: session.userName,
        role: session.role,
      },
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : (req.body?.token || req.headers['x-session-token']);

    if (token) {
      activeSessions.delete(token as string);
    }
    return res.json({ success: true, message: 'সেশন সফলভাবে বাতিল করা হয়েছে' });
  });

  // Protected Operational Endpoints Requiring Server Authentication
  app.get('/api/background-status', requireAuth, (_req, res) => {
    res.json({
      active: true,
      lastSyncTime,
      lastSyncPunchesCount,
      totalSmsSentByServer,
      lastSyncError,
      isSyncRunning,
    });
  });

  app.post('/api/trigger-sync', requireAuth, async (_req, res) => {
    runBackgroundAttendanceSync();
    res.json({ message: 'Sync triggered successfully', status: 'initiated' });
  });

  // -------------------------------------------------------------
  // INSTANT BIOMETRIC ATTENDANCE PUNCH WEBHOOK / PUSH ENDPOINTS
  // -------------------------------------------------------------
  app.all(['/api/attendance/punch', '/api/tipsoi/webhook', '/api/punch', '/api/push-punch'], async (req, res) => {
    // Immediately respond 200 OK to calling device/machine for zero delay
    res.status(200).json({
      success: true,
      status: 'received',
      message: 'বায়োমেট্রিক পাঞ্চ গ্রহণ করা হয়েছে। মেসেজিং ও এটেন্ডেন্স ব্যাকগ্রাউন্ডে প্রক্রিয়াজাত হচ্ছে।',
      timestamp: new Date().toISOString()
    });

    // Process punches asynchronously without delaying HTTP response
    try {
      const body = req.body || {};
      const rawList = Array.isArray(body) ? body : (body.data || body.logs || body.punches || body.records || [body]);
      if (Array.isArray(rawList) && rawList.length > 0) {
        processNewPunchesAndSendSMS(rawList).catch(err => {
          console.error('[Instant Punch Processing Error]:', err);
        });
      }
    } catch (e) {
      console.error('[Instant Punch Extract Error]:', e);
    }
  });

  // BulkSMSBD Official SMS API Proxies
  app.post('/api/sms/send', async (req, res) => {
    try {
      const apiKey = req.body?.api_key || req.body?.apiKey || DEFAULT_SMS_KEY;
      const senderId = req.body?.senderid || req.body?.senderId || DEFAULT_SMS_SENDER_ID;
      const rawNumber = req.body?.number || req.body?.to;
      const message = req.body?.message || req.body?.msg;

      const number = normalizeSmsPhone(rawNumber);
      if (!number || !message) {
        return res.status(400).json({
          response_code: 1003,
          error: 1003,
          success: false,
          msg: 'মোবাইল নম্বর ও মেসেজ টেক্সট আবশ্যক'
        });
      }

      const payload = {
        api_key: apiKey,
        senderid: senderId,
        number: number,
        message: message,
      };

      const upstream = await fetch('http://bulksmsbd.net/api/smsapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const dataText = await upstream.text();
      let json: any = {};
      try { json = JSON.parse(dataText); } catch { json = { msg: dataText }; }

      const isOk = json?.response_code === 202 || dataText.includes('202');
      return res.status(200).json({
        ...json,
        success: isOk,
        response_code: json?.response_code || (isOk ? 202 : 1005),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: 1005,
        response_code: 1005,
        msg: err?.message || 'সার্ভার থেকে SMS গেটওয়েতে সংযোগ ব্যর্থ হয়েছে',
      });
    }
  });

  app.post('/api/sms/send-many', async (req, res) => {
    try {
      const apiKey = req.body?.api_key || req.body?.apiKey || DEFAULT_SMS_KEY;
      const senderId = req.body?.senderid || req.body?.senderId || DEFAULT_SMS_SENDER_ID;
      const messages = req.body?.messages;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          response_code: 1003,
          error: 1003,
          success: false,
          msg: 'মেসেজ তালিকা আবশ্যক'
        });
      }

      const payload = {
        api_key: apiKey,
        senderid: senderId,
        messages: messages.map((m: any) => ({
          to: normalizeSmsPhone(m.to),
          message: m.message,
        })),
      };

      const upstream = await fetch('http://bulksmsbd.net/api/smsapimany', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const dataText = await upstream.text();
      let json: any = {};
      try { json = JSON.parse(dataText); } catch { json = { msg: dataText }; }

      const isOk = json?.response_code === 202 || dataText.includes('202');
      return res.status(200).json({
        ...json,
        success: isOk,
        response_code: json?.response_code || (isOk ? 202 : 1005),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: 1005,
        response_code: 1005,
        msg: err?.message || 'বাল্ক SMS সংযোগ ব্যর্থ হয়েছে',
      });
    }
  });

  app.all(['/api/sms/balance', '/api/sms-net-bd/balance'], async (req, res) => {
    try {
      const apiKey = req.query.api_key || req.body?.api_key || req.body?.apiKey || DEFAULT_SMS_KEY;
      const upstream = await fetch(`http://bulksmsbd.net/api/getBalanceApi?api_key=${encodeURIComponent(String(apiKey))}`);
      const dataText = await upstream.text();
      let json: any = {};
      try { json = JSON.parse(dataText); } catch { json = { balance: dataText }; }
      return res.status(200).json(json);
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: 1005,
        balance: 0,
        msg: err?.message || 'ব্যালেন্স লোড ব্যর্থ',
      });
    }
  });

  // Legacy sms-net-bd backward compatibility proxy
  app.all('/api/sms-net-bd/sendsms', async (req, res) => {
    try {
      const apiKey = req.query.api_key || req.body?.api_key || req.body?.apiKey || DEFAULT_SMS_KEY;
      const senderId = req.query.senderid || req.body?.senderid || DEFAULT_SMS_SENDER_ID;
      const rawNumber = req.query.to || req.body?.to || req.body?.number;
      const msg = req.query.msg || req.body?.msg || req.body?.message;

      const number = normalizeSmsPhone(rawNumber);
      const payload = {
        api_key: apiKey,
        senderid: senderId,
        number: number,
        message: msg,
      };

      const upstream = await fetch('http://bulksmsbd.net/api/smsapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const dataText = await upstream.text();
      let json: any = {};
      try { json = JSON.parse(dataText); } catch { json = { msg: dataText }; }
      return res.status(200).json(json);
    } catch (err: any) {
      return res.status(500).json({ error: 500, msg: err?.message || 'SMS Gateway Error' });
    }
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
