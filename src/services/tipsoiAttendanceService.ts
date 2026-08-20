/**
 * TIPSOI (Inovace 360) Smart Attendance Solution Integration Service
 * Official API Documentation:
 * Live Base URL: https://api-inovace360.com/api/v1
 * Test Base URL: https://test.api-inovace360.com/api/v1
 * Endpoints:
 *  - GET /logs?api_token={{API_TOKEN}}&start={{start}}&end={{end}}&criteria=sync_time
 *  - GET /attendance_logs?api_token={{API_TOKEN}}&start={{start}}&end={{end}}
 *  - GET /people?api_token={{API_TOKEN}}
 *  - GET /devices?api_token={{API_TOKEN}}
 */

export interface TipsoiPunchRecord {
  id?: string | number;
  emp_id?: string | number;
  employee_id?: string | number;
  identifier?: string | number;
  user_id?: string | number;
  student_id?: string | number;
  person_id?: string | number;
  person_identifier?: string;
  card_no?: string | number;
  rfid?: string | number;
  name?: string;
  primary_display_text?: string;
  secondary_display_text?: string;
  punch_time?: string;
  logged_time?: string;
  sync_time?: string;
  time?: string;
  timestamp?: string;
  date?: string;
  punch_type?: string; // 'fingerprint', 'card', 'face', 'PUNCH'
  status?: string;
  device_name?: string;
  device_identifier?: string | number;
  location?: string;
  raw?: any;
}

export interface TipsoiDevice {
  id: number | string;
  identifier: string;
  device_category_id?: number;
  vendor_id?: string;
  location?: string;
  last_communication_at?: string;
  last_seen?: string;
  status?: string;
  connected?: number | boolean;
}

export interface TipsoiSyncResult {
  success: boolean;
  message: string;
  totalPunches: number;
  matchedStudents: number;
  unmatchedPunches: number;
  syncedDate: string;
  punches: TipsoiPunchRecord[];
  matchedDetails?: Array<{
    studentId: string;
    studentName: string;
    roll?: string;
    class?: string;
    punchTime: string;
    status: 'present' | 'late';
    punchType?: string;
    device?: string;
  }>;
  error?: string;
}

const DEFAULT_BASE_URL = 'https://api-inovace360.com/api/v1';
const DEFAULT_TOKEN = '6973-da50-6873-252b-6226-ff72-f48e-7790-4212-a803-fd39-6af0-fb95-e663-b3bf-d9f4';

// Helper to get and normalize Tipsoi config
export const getTipsoiConfig = () => {
  const envBaseUrl = import.meta.env.VITE_TIPSOI_BASE_URL || DEFAULT_BASE_URL;
  const envToken = import.meta.env.VITE_TIPSOI_API_TOKEN || DEFAULT_TOKEN;

  let storedBaseUrl = localStorage.getItem('tipsoi_base_url');
  let storedToken = localStorage.getItem('tipsoi_api_token');

  // Auto-upgrade legacy /clients URL to /api/v1 as per documentation
  if (storedBaseUrl && (storedBaseUrl.includes('/clients') || !storedBaseUrl.includes('/api/v1'))) {
    storedBaseUrl = storedBaseUrl.replace(/\/clients\/?$/, '/api/v1');
    if (!storedBaseUrl.includes('/api/v1')) {
      storedBaseUrl = `${storedBaseUrl.replace(/\/+$/, '')}/api/v1`;
    }
    localStorage.setItem('tipsoi_base_url', storedBaseUrl);
  }

  const activeBaseUrl = (storedBaseUrl || envBaseUrl).trim().replace(/\/+$/, '');
  const activeToken = (storedToken || envToken).trim();

  return {
    baseUrl: activeBaseUrl,
    apiToken: activeToken,
  };
};

/**
 * Normalizes identifier strings (removes symbols, spaces, case-insensitive)
 */
export const normalizeIdentifier = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

/**
 * Robust Date & Time extractor supporting YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, ISO strings, and Unix timestamps.
 */
export const extractDateAndHHMM = (
  rawTimeStr: any,
  fallbackDate: string = new Date().toISOString().split('T')[0]
): { dateYYYYMMDD: string; timeHHMM: string; fullTimestampMs: number } => {
  let dateYYYYMMDD = fallbackDate;
  let timeHHMM = '08:00';
  let fullTimestampMs = Date.now();

  if (rawTimeStr === null || rawTimeStr === undefined || rawTimeStr === '') {
    const ms = new Date(`${dateYYYYMMDD}T${timeHHMM}:00`).getTime();
    return { dateYYYYMMDD, timeHHMM, fullTimestampMs: isNaN(ms) ? Date.now() : ms };
  }

  // Handle Unix timestamp numeric or numeric string
  if (typeof rawTimeStr === 'number' || (/^\d+$/.test(String(rawTimeStr).trim()) && String(rawTimeStr).trim().length >= 9)) {
    let num = Number(rawTimeStr);
    if (num < 1e11) num *= 1000; // convert seconds to ms
    const d = new Date(num);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return {
        dateYYYYMMDD: `${y}-${m}-${day}`,
        timeHHMM: `${hh}:${mm}`,
        fullTimestampMs: d.getTime()
      };
    }
  }

  const str = String(rawTimeStr).trim();

  // Handle ISO format e.g. "2026-08-19T08:30:15"
  if (str.includes('T')) {
    const [dPart, tPart] = str.split('T');
    if (dPart && /^\d{4}-\d{2}-\d{2}$/.test(dPart)) {
      dateYYYYMMDD = dPart;
    }
    if (tPart) {
      const cleanT = tPart.split('.')[0].split('Z')[0];
      const parts = cleanT.split(':');
      if (parts.length >= 2) {
        timeHHMM = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      fullTimestampMs = parsed.getTime();
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      dateYYYYMMDD = `${y}-${m}-${day}`;
    }
    return { dateYYYYMMDD, timeHHMM, fullTimestampMs };
  }

  // Handle space separated e.g. "2026-08-19 08:30:15" or "19/08/2026 08:30:15"
  if (str.includes(' ')) {
    const parts = str.split(/\s+/);
    const dateSegment = parts[0];
    const timeSegment = parts[1];

    if (dateSegment) {
      if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(dateSegment)) {
        const [y, m, d] = dateSegment.split(/[-/]/);
        dateYYYYMMDD = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      } else if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(dateSegment)) {
        const [d, m, y] = dateSegment.split(/[-/]/);
        dateYYYYMMDD = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }

    if (timeSegment) {
      const tParts = timeSegment.split(':');
      if (tParts.length >= 2) {
        timeHHMM = `${tParts[0].padStart(2, '0')}:${tParts[1].padStart(2, '0')}`;
      }
    }

    const ms = new Date(`${dateYYYYMMDD}T${timeHHMM}:00`).getTime();
    return { dateYYYYMMDD, timeHHMM, fullTimestampMs: isNaN(ms) ? Date.now() : ms };
  }

  // Handle date-only "YYYY-MM-DD" or "DD/MM/YYYY"
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split(/[-/]/);
    dateYYYYMMDD = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const ms = new Date(`${dateYYYYMMDD}T${timeHHMM}:00`).getTime();
    return { dateYYYYMMDD, timeHHMM, fullTimestampMs: isNaN(ms) ? Date.now() : ms };
  }
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(str)) {
    const [d, m, y] = str.split(/[-/]/);
    dateYYYYMMDD = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const ms = new Date(`${dateYYYYMMDD}T${timeHHMM}:00`).getTime();
    return { dateYYYYMMDD, timeHHMM, fullTimestampMs: isNaN(ms) ? Date.now() : ms };
  }

  // Handle time-only "08:30:15" or "08:30"
  if (/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(str)) {
    const tParts = str.split(':');
    timeHHMM = `${tParts[0].padStart(2, '0')}:${tParts[1].padStart(2, '0')}`;
    dateYYYYMMDD = fallbackDate;
    const ms = new Date(`${dateYYYYMMDD}T${timeHHMM}:00`).getTime();
    return { dateYYYYMMDD, timeHHMM, fullTimestampMs: isNaN(ms) ? Date.now() : ms };
  }

  const ms = new Date(`${dateYYYYMMDD}T${timeHHMM}:00`).getTime();
  return { dateYYYYMMDD, timeHHMM, fullTimestampMs: isNaN(ms) ? Date.now() : ms };
};

/**
 * Helper to fetch via server-side proxy to completely bypass browser CORS limitations,
 * with direct fetch fallback.
 */
async function fetchViaProxyOrDirect(targetUrl: string, apiToken: string): Promise<any> {
  const proxyUrl = `/api/tipsoi-proxy?url=${encodeURIComponent(targetUrl)}&api_token=${encodeURIComponent(apiToken)}`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'api_token': apiToken,
    'api-token': apiToken,
    'X-API-TOKEN': apiToken,
    'Authorization': `Bearer ${apiToken}`
  };

  // Attempt 1: Server-side proxy (guaranteed no CORS)
  try {
    const proxyRes = await fetch(proxyUrl, {
      method: 'GET',
      headers,
    });
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return data;
    }
  } catch {
    // Fall through to direct fetch
  }

  // Attempt 2: Direct fetch
  try {
    const directRes = await fetch(targetUrl, {
      method: 'GET',
      headers,
      mode: 'cors'
    });
    if (directRes.ok) {
      return await directRes.json();
    }
  } catch (directErr) {
    console.warn('Direct fetch error:', directErr);
  }

  return null;
}

/**
 * Check connection and get registered devices from Tipsoi API
 */
export const checkTipsoiConnection = async (): Promise<{
  connected: boolean;
  devices: TipsoiDevice[];
  totalPeople?: number;
  message: string;
}> => {
  const { baseUrl, apiToken } = getTipsoiConfig();
  if (!apiToken) {
    return { connected: false, devices: [], message: 'API টোকেন দেওয়া হয়নি।' };
  }

  try {
    const devicesUrl = `${baseUrl}/devices?api_token=${apiToken}`;
    const devicesData = await fetchViaProxyOrDirect(devicesUrl, apiToken);

    let devices: TipsoiDevice[] = [];
    if (Array.isArray(devicesData)) {
      devices = devicesData;
    } else if (devicesData?.data && Array.isArray(devicesData.data)) {
      devices = devicesData.data;
    }

    // Also optionally test people endpoint
    const peopleUrl = `${baseUrl}/people?api_token=${apiToken}`;
    const peopleData = await fetchViaProxyOrDirect(peopleUrl, apiToken);
    let totalPeople = 0;
    if (Array.isArray(peopleData)) {
      totalPeople = peopleData.length;
    } else if (peopleData?.payload && Array.isArray(peopleData.payload)) {
      totalPeople = peopleData.payload.length;
    } else if (peopleData?.data && Array.isArray(peopleData.data)) {
      totalPeople = peopleData.data.length;
    }

    if (devices.length > 0 || totalPeople > 0 || devicesData) {
      return {
        connected: true,
        devices,
        totalPeople,
        message: `টিপসই ক্লাউড সংযুক্ত রয়েছে। ${devices.length}টি ডিভাইস এবং ${totalPeople} জন নিবন্ধিত ব্যক্তি পাওয়া গেছে।`
      };
    }

    return {
      connected: false,
      devices: [],
      message: 'টিপসই সার্ভার থেকে কোনো ডিভাইস তথ্য পাওয়া যায়নি।'
    };
  } catch (err: any) {
    return {
      connected: false,
      devices: [],
      message: `সংযোগ ব্যর্থ: ${err?.message || 'নেটওয়ার্ক ত্রুটি'}`
    };
  }
};

/**
 * Fetch raw punches/attendance logs from Tipsoi API for a specific date or date range.
 * Supports:
 * 1. GET /logs (Page 2 of documentation)
 * 2. GET /attendance_logs (Page 5 of documentation)
 */
export const fetchTipsoiAttendanceLogs = async (
  date: string, // YYYY-MM-DD
  endDate?: string // Optional YYYY-MM-DD
): Promise<{ punches: TipsoiPunchRecord[]; rawResponse?: any }> => {
  const { baseUrl, apiToken } = getTipsoiConfig();
  const targetDate = date || new Date().toISOString().split('T')[0];
  const targetEndDate = endDate || targetDate;

  // Build full URLs according to Tipsoi official API specification
  const targetUrls = [
    // Endpoint 1: /logs (Detailed punch stream with criteria=sync_time or logged_time)
    `${baseUrl}/logs?api_token=${apiToken}&start=${targetDate}&end=${targetEndDate}&criteria=sync_time&per_page=500`,
    `${baseUrl}/logs?api_token=${apiToken}&start=${targetDate}%2000:00:00&end=${targetEndDate}%2023:59:59&criteria=sync_time&per_page=500`,
    `${baseUrl}/logs?api_token=${apiToken}&start=${targetDate}&end=${targetEndDate}`,
    
    // Endpoint 2: /attendance_logs (Aggregated daily logs)
    `${baseUrl}/attendance_logs?api_token=${apiToken}&start=${targetDate}&end=${targetEndDate}&per_page=500`,
    `${baseUrl}/attendance_logs?api_token=${apiToken}&start=${targetDate}%2000:00:00&end=${targetEndDate}%2023:59:59&per_page=500`,

    // Endpoint 3: Direct without query api_token if header is used
    `${baseUrl}/logs?start=${targetDate}&end=${targetEndDate}`,
    `${baseUrl}/attendance_logs?start=${targetDate}&end=${targetEndDate}`
  ];

  let allPunches: TipsoiPunchRecord[] = [];
  let successResponse: any = null;

  for (const url of targetUrls) {
    try {
      const json = await fetchViaProxyOrDirect(url, apiToken);
      if (!json) continue;

      successResponse = json;

      // Case A: /logs response format (Doc Page 2-4: { data: [ { sync_time, logged_time, person_identifier, rfid, type, ... } ] })
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        const records = json.data.map((item: any) => {
          const punchTime = item.logged_time || item.sync_time || item.punch_time || item.time || '';
          return {
            id: item.uid || item.id || item.person_id,
            emp_id: item.person_identifier || item.person_id || item.rfid,
            employee_id: item.person_identifier || item.person_id,
            identifier: item.person_identifier || item.person_id || item.rfid,
            person_id: item.person_id,
            person_identifier: item.person_identifier,
            user_id: item.person_id,
            student_id: item.person_identifier || item.person_id,
            card_no: item.rfid,
            rfid: item.rfid,
            name: item.primary_display_text || item.secondary_display_text || item.name || '',
            primary_display_text: item.primary_display_text,
            secondary_display_text: item.secondary_display_text,
            punch_time: punchTime,
            logged_time: item.logged_time,
            sync_time: item.sync_time,
            time: punchTime,
            date: item.logged_time ? item.logged_time.split(' ')[0] : targetDate,
            punch_type: item.type || 'fingerprint',
            status: 'present',
            device_name: item.device_identifier ? `ডিভাইস-${item.device_identifier}` : 'টিপসই বায়োমেট্রিক ডিভাইস',
            device_identifier: item.device_identifier,
            location: item.location || '',
            raw: item
          };
        });

        if (records.length > 0) {
          allPunches = records;
          break;
        }
      }

      // Case B: /attendance_logs response format (Doc Page 5-7: { days: [...], attendances: { data: [ { person_identifier, name, rfid, logs: { '2025-03-02': { start, end, hours } } } ] } })
      if (json.attendances?.data && Array.isArray(json.attendances.data) && json.attendances.data.length > 0) {
        const parsedList: TipsoiPunchRecord[] = [];
        json.attendances.data.forEach((item: any) => {
          const logsObj = item.logs || {};
          // Check for targetDate in logs ONLY — do not fall back to other days or random items!
          const dateLog = logsObj[targetDate];
          if (!dateLog) return;
          
          const startTime = dateLog.start || dateLog.in || dateLog.logged_time || dateLog.time || '';
          if (!startTime) return;
          
          parsedList.push({
            id: item.person_id || item.project_id,
            emp_id: item.person_identifier || item.person_id,
            employee_id: item.person_identifier,
            identifier: item.person_identifier || item.person_id || item.rfid,
            person_id: item.person_id,
            person_identifier: item.person_identifier,
            card_no: item.rfid,
            rfid: item.rfid,
            name: item.name || item.primary_display_text || '',
            primary_display_text: item.primary_display_text,
            secondary_display_text: item.secondary_display_text,
            punch_time: startTime,
            logged_time: startTime,
            date: targetDate,
            punch_type: 'biometric',
            status: 'present',
            device_name: 'টিপসই স্মার্ট ডিভাইস',
            raw: item
          });
        });

        if (parsedList.length > 0) {
          allPunches = parsedList;
          break;
        }
      }

      // Case C: direct array of logs
      if (Array.isArray(json) && json.length > 0) {
        allPunches = json.map((item: any) => ({
          id: item.id || item.uid,
          emp_id: item.person_identifier || item.identifier || item.emp_id || item.user_id,
          employee_id: item.person_identifier || item.identifier,
          identifier: item.person_identifier || item.identifier || item.rfid,
          person_id: item.person_id,
          person_identifier: item.person_identifier || item.identifier,
          card_no: item.rfid || item.card_no,
          rfid: item.rfid || item.card_no,
          name: item.name || item.primary_display_text || '',
          punch_time: item.logged_time || item.punch_time || item.time || '',
          logged_time: item.logged_time,
          sync_time: item.sync_time,
          date: item.date || targetDate,
          punch_type: item.type || 'fingerprint',
          status: 'present',
          device_name: item.device_identifier ? `ডিভাইস-${item.device_identifier}` : 'টিপসই বায়োমেট্রিক',
          raw: item
        }));
        break;
      }
    } catch (e) {
      console.warn(`Attempt failed for ${url}:`, e);
    }
  }

  // Filter punches matching the targetDate strictly
  if (allPunches.length > 0 && targetDate) {
    const filtered = allPunches.filter(p => {
      const rawStr = p.punch_time || p.logged_time || p.sync_time || p.time || p.date || '';
      if (!rawStr) return false;
      const parsed = extractDateAndHHMM(rawStr, targetDate);
      if (parsed.dateYYYYMMDD !== targetDate) return false;

      // Normalize punch_time on the object so downstream handlers get uniform YYYY-MM-DD HH:mm:ss
      p.punch_time = `${parsed.dateYYYYMMDD} ${parsed.timeHHMM}:00`;
      p.date = parsed.dateYYYYMMDD;
      return true;
    });
    allPunches = filtered;
  }

  return { punches: allPunches, rawResponse: successResponse };
};

/**
 * Match Tipsoi Punch Logs to Madrasah Student Database based on:
 * - ID / Registration No (`id`, `রেজিস্ট্রেশন/আইডি নম্বর`, `রেজিস্ট্রেশন/আইডি`, `আবেদন নং`)
 * - Roll Number (`রোল নম্বর`, `রোল`, `roll`)
 * - Card / RFID No (`কার্ড নম্বর`, `rfid`, `card_no`)
 * - Mobile No (`মোবাইল (মা)`, `মোবাইল (বাবা/ভাই)`, `অভিভাবকের মোবাইল`, `mobile`)
 * - Student Name (`শিক্ষার্থীর নাম`, `name`)
 */
export const matchPunchesToStudents = (
  punches: TipsoiPunchRecord[],
  students: any[],
  targetDate: string,
  lateTimeThreshold: string = '08:30' // e.g. '08:30'
): {
  matchedRecords: Record<string, { status: 'present' | 'late'; punchTime: string; deviceName?: string }>;
  stats: { totalPunches: number; matchedCount: number; unmatchedPunches: TipsoiPunchRecord[] };
  matchedDetails: Array<{
    studentId: string;
    studentName: string;
    roll?: string;
    class?: string;
    punchTime: string;
    status: 'present' | 'late';
    punchType?: string;
    device?: string;
  }>;
} => {
  const matchedRecords: Record<string, { status: 'present' | 'late'; punchTime: string; deviceName?: string }> = {};
  const matchedDetails: Array<any> = [];
  const unmatchedPunches: TipsoiPunchRecord[] = [];

  // Build indexed student map
  const studentById = new Map<string, any>();
  const studentByRoll = new Map<string, any>();
  const studentByCard = new Map<string, any>();
  const studentByMobile = new Map<string, any>();
  const studentByName = new Map<string, any>();

  students.forEach((s) => {
    const sId = String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || s['আবেদন নং'] || '').trim();
    const sRoll = String(s['রোল নম্বর'] || s['রোল'] || s.roll || '').trim();
    const sCard = String(s['কার্ড নম্বর'] || s.card_no || s.rfid || s['RFID'] || '').trim();
    const sMobile = String(s['মোবাইল (মা)'] || s['মোবাইল (বাবা/ভাই)'] || s['অভিভাবকের মোবাইল'] || s.mobile || '').trim();
    const sName = String(s['শিক্ষার্থীর নাম'] || s.name || '').trim();

    if (sId) {
      studentById.set(normalizeIdentifier(sId), s);
      studentById.set(sId.toLowerCase(), s);
    }
    if (sRoll) {
      studentByRoll.set(normalizeIdentifier(sRoll), s);
      // If single digit e.g. "1" also map "01"
      if (/^\d+$/.test(sRoll)) {
        studentByRoll.set(normalizeIdentifier(sRoll.padStart(2, '0')), s);
        studentByRoll.set(normalizeIdentifier(parseInt(sRoll, 10).toString()), s);
      }
    }
    if (sCard) {
      studentByCard.set(normalizeIdentifier(sCard), s);
      studentByCard.set(sCard.toLowerCase(), s);
    }
    if (sMobile) {
      const cleanMob = sMobile.replace(/[^0-9]/g, '');
      if (cleanMob) studentByMobile.set(cleanMob, s);
    }
    if (sName) {
      studentByName.set(normalizeIdentifier(sName), s);
    }
  });

  punches.forEach((punch) => {
    // Collect all candidate identifier tokens
    const candidateTokens: string[] = [];

    const rawFields = [
      punch.person_identifier,
      punch.identifier,
      punch.emp_id,
      punch.employee_id,
      punch.user_id,
      punch.student_id,
      punch.card_no,
      punch.rfid,
      punch.name,
      punch.primary_display_text,
      punch.secondary_display_text,
    ];

    // Priority 1 Fields (Specific ID / Card tokens)
    const primaryFields = [
      punch.person_identifier,
      punch.identifier,
      punch.emp_id,
      punch.employee_id,
      punch.card_no,
      punch.rfid,
      punch.student_id,
    ];

    // Priority 2 Fields (Name / Display tokens)
    const secondaryFields = [
      punch.name,
      punch.primary_display_text,
      punch.secondary_display_text,
    ];

    let matchedStudent: any = null;

    // Check Primary Fields first against Student ID and Card maps
    for (const f of primaryFields) {
      if (!f) continue;
      const str = String(f).trim();
      const norm = normalizeIdentifier(str);
      if (!norm) continue;

      if (studentById.has(norm)) {
        matchedStudent = studentById.get(norm);
        break;
      }
      if (studentByCard.has(norm)) {
        matchedStudent = studentByCard.get(norm);
        break;
      }

      // Check separated tokens if string has dashes/underscores/spaces e.g. "STUDENT-1001"
      if (str.includes('-') || str.includes('_') || str.includes(' ')) {
        const parts = str.split(/[-_\s]+/);
        for (const p of parts) {
          const pNorm = normalizeIdentifier(p);
          if (pNorm && studentById.has(pNorm)) {
            matchedStudent = studentById.get(pNorm);
            break;
          }
          if (pNorm && studentByCard.has(pNorm)) {
            matchedStudent = studentByCard.get(pNorm);
            break;
          }
        }
        if (matchedStudent) break;
      }
    }

    // Check Secondary / Mobile / Exact Name match if not matched
    if (!matchedStudent) {
      for (const f of secondaryFields) {
        if (!f) continue;
        const str = String(f).trim();
        const norm = normalizeIdentifier(str);
        if (!norm) continue;

        // Mobile check
        const cleanNum = str.replace(/[^0-9]/g, '');
        if (cleanNum.length >= 10 && studentByMobile.has(cleanNum)) {
          matchedStudent = studentByMobile.get(cleanNum);
          break;
        }

        // Exact Name check (length > 3)
        if (norm.length > 3 && studentByName.has(norm)) {
          matchedStudent = studentByName.get(norm);
          break;
        }
      }
    }

    if (matchedStudent) {
      const sKey = String(matchedStudent.id || matchedStudent['রেজিস্ট্রেশন/আইডি নম্বর'] || matchedStudent['রেজিস্ট্রেশন/আইডি'] || '').trim();
      
      // Determine Punch Time
      const rawTime = punch.logged_time || punch.punch_time || punch.time || punch.sync_time || '';
      let formattedTime = '08:00';

      if (rawTime) {
        // e.g. "2024-05-14 12:56:07" or "12:56:07" or ISO string
        if (rawTime.includes(' ')) {
          const timePart = rawTime.split(' ')[1];
          formattedTime = timePart.slice(0, 5);
        } else if (rawTime.includes('T')) {
          const timePart = rawTime.split('T')[1]?.split('.')[0];
          formattedTime = timePart?.slice(0, 5) || '08:00';
        } else if (rawTime.includes(':')) {
          formattedTime = rawTime.slice(0, 5);
        }
      }

      // Check if late
      const isLate = formattedTime > lateTimeThreshold;
      const status: 'present' | 'late' = isLate ? 'late' : 'present';

      // Keep earlier punch time if already punched
      if (!matchedRecords[sKey] || formattedTime < matchedRecords[sKey].punchTime) {
        matchedRecords[sKey] = {
          status,
          punchTime: formattedTime,
          deviceName: punch.device_name || 'টিপসই বায়োমেট্রিক ডিভাইস'
        };

        const existingIndex = matchedDetails.findIndex(m => m.studentId === sKey);
        const detailItem = {
          studentId: sKey,
          studentName: matchedStudent['শিক্ষার্থীর নাম'] || matchedStudent.name || punch.name || 'শিক্ষার্থী',
          roll: matchedStudent['রোল নম্বর'] || matchedStudent['রোল'] || matchedStudent.roll || '',
          class: matchedStudent['জামাত/শ্রেণী'] || matchedStudent['জামাত'] || matchedStudent.class || '',
          punchTime: formattedTime,
          status,
          punchType: punch.punch_type || 'fingerprint',
          device: punch.device_name || 'ডিভাইস'
        };

        if (existingIndex >= 0) {
          matchedDetails[existingIndex] = detailItem;
        } else {
          matchedDetails.push(detailItem);
        }
      }
    } else {
      unmatchedPunches.push(punch);
    }
  });

  return {
    matchedRecords,
    stats: {
      totalPunches: punches.length,
      matchedCount: Object.keys(matchedRecords).length,
      unmatchedPunches
    },
    matchedDetails
  };
};

export interface MatchedStaffPunchResult {
  id: string; // Teacher or Staff member ID
  name: string;
  type: 'teacher' | 'staff';
  designation?: string;
  department?: string;
  mobile?: string;
  firstInTime?: string;
  lastOutTime?: string;
  allPunches: Array<{ time: string; device?: string; type?: string; raw?: any }>;
  status: 'present' | 'late' | 'absent' | 'leave' | 'weekly_off' | 'half-day' | 'on-duty';
  lateMinutes: number;
  workingHours: number;
  overtimeHours: number;
  deductionAmount: number;
  isWeeklyOff: boolean;
  rawPunches: TipsoiPunchRecord[];
}

/**
 * Match Tipsoi Punch Logs specifically to Teachers and Staff according to their rules & settings.
 */
export const matchPunchesToStaffAndTeachers = (
  punches: TipsoiPunchRecord[],
  teachers: any[],
  staffList: any[],
  targetDate: string = new Date().toISOString().split('T')[0],
  settings?: {
    teacherRule?: {
      standardInTime?: string;
      standardOutTime?: string;
      lateGraceMinutes?: number;
      weeklyOffDay1?: string;
      weeklyOffDay2?: string;
      weeklyOffDay3?: string;
      lateDeductionPerLate?: number;
      dailySalaryDeductionPerAbsent?: number;
    };
    staffRule?: {
      standardInTime?: string;
      standardOutTime?: string;
      lateGraceMinutes?: number;
      weeklyOffDay1?: string;
      weeklyOffDay2?: string;
      lateDeductionPerLate?: number;
      dailySalaryDeductionPerAbsent?: number;
      minWorkingHoursForFullDay?: number;
      minWorkingHoursForHalfDay?: number;
      overtimeHourlyRate?: number;
    };
  },
  approvedLeaveRequests: any[] = []
): {
  teacherResults: MatchedStaffPunchResult[];
  staffResults: MatchedStaffPunchResult[];
  unmatchedPunches: TipsoiPunchRecord[];
  summary: {
    totalPunches: number;
    totalTeachers: number;
    teachersPresent: number;
    teachersLate: number;
    teachersAbsent: number;
    totalStaff: number;
    staffPresent: number;
    staffLate: number;
    staffAbsent: number;
  };
} => {
  const teacherRule = {
    standardInTime: '08:00',
    standardOutTime: '16:30',
    lateGraceMinutes: 15,
    weeklyOffDay1: 'Friday',
    weeklyOffDay2: 'Tuesday',
    weeklyOffDay3: 'Thursday',
    lateDeductionPerLate: 100,
    dailySalaryDeductionPerAbsent: 600,
    ...(settings?.teacherRule || {})
  };

  const staffRule = {
    standardInTime: '08:30',
    standardOutTime: '17:00',
    lateGraceMinutes: 15,
    weeklyOffDay1: 'Friday',
    weeklyOffDay2: 'Saturday',
    lateDeductionPerLate: 100,
    dailySalaryDeductionPerAbsent: 500,
    minWorkingHoursForFullDay: 7,
    minWorkingHoursForHalfDay: 4,
    overtimeHourlyRate: 100,
    ...(settings?.staffRule || {})
  };

  // Day of week calculation
  const dObj = new Date(targetDate);
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = daysOfWeek[dObj.getDay()] || 'Friday';

  // Build index maps for Teachers and Staff
  const personMapById = new Map<string, { person: any; type: 'teacher' | 'staff' }>();
  const personMapByMobile = new Map<string, { person: any; type: 'teacher' | 'staff' }>();
  const personMapByName = new Map<string, { person: any; type: 'teacher' | 'staff' }>();
  const personMapByCard = new Map<string, { person: any; type: 'teacher' | 'staff' }>();

  teachers.forEach(t => {
    const id = String(t.id || t.mobile || '').trim();
    const cleanId = normalizeIdentifier(id);
    const name = normalizeIdentifier(t.name || '');
    const mobile = String(t.mobile || '').replace(/[^0-9]/g, '');
    const card = normalizeIdentifier(t.card_no || t.rfid || '');

    if (cleanId) personMapById.set(cleanId, { person: t, type: 'teacher' });
    if (mobile) personMapByMobile.set(mobile, { person: t, type: 'teacher' });
    if (name) personMapByName.set(name, { person: t, type: 'teacher' });
    if (card) personMapByCard.set(card, { person: t, type: 'teacher' });
  });

  staffList.forEach(s => {
    const id = String(s.id || s.mobile || '').trim();
    const cleanId = normalizeIdentifier(id);
    const name = normalizeIdentifier(s.name || '');
    const mobile = String(s.mobile || '').replace(/[^0-9]/g, '');
    const card = normalizeIdentifier(s.card_no || s.rfid || '');

    if (cleanId) personMapById.set(cleanId, { person: s, type: 'staff' });
    if (mobile) personMapByMobile.set(mobile, { person: s, type: 'staff' });
    if (name) personMapByName.set(name, { person: s, type: 'staff' });
    if (card) personMapByCard.set(card, { person: s, type: 'staff' });
  });

  // Group punches by matched person
  const punchesByPerson = new Map<string, { person: any; type: 'teacher' | 'staff'; punches: TipsoiPunchRecord[] }>();
  const unmatchedPunches: TipsoiPunchRecord[] = [];

  punches.forEach(punch => {
    const candidateTokens: string[] = [];
    const rawFields = [
      punch.person_identifier,
      punch.identifier,
      punch.emp_id,
      punch.employee_id,
      punch.user_id,
      punch.card_no,
      punch.rfid,
      punch.name,
      punch.primary_display_text,
      punch.secondary_display_text,
    ];

    rawFields.forEach(f => {
      if (f !== null && f !== undefined && f !== '') {
        const str = String(f).trim();
        candidateTokens.push(str);
        if (str.includes('-') || str.includes('_') || str.includes(' ')) {
          str.split(/[-_\s]+/).forEach(p => { if (p.trim()) candidateTokens.push(p.trim()); });
        }
      }
    });

    let matched: { person: any; type: 'teacher' | 'staff' } | null = null;

    for (const token of candidateTokens) {
      const normalized = normalizeIdentifier(token);
      if (!normalized) continue;

      if (personMapById.has(normalized)) {
        matched = personMapById.get(normalized)!;
        break;
      }
      if (personMapByCard.has(normalized)) {
        matched = personMapByCard.get(normalized)!;
        break;
      }
      const cleanNum = token.replace(/[^0-9]/g, '');
      if (cleanNum.length >= 10 && personMapByMobile.has(cleanNum)) {
        matched = personMapByMobile.get(cleanNum)!;
        break;
      }
      if (personMapByName.has(normalized)) {
        matched = personMapByName.get(normalized)!;
        break;
      }
    }

    if (matched) {
      const pId = String(matched.person.id || matched.person.mobile || matched.person.name);
      if (!punchesByPerson.has(pId)) {
        punchesByPerson.set(pId, { person: matched.person, type: matched.type, punches: [] });
      }
      punchesByPerson.get(pId)!.punches.push(punch);
    } else {
      unmatchedPunches.push(punch);
    }
  });

  // Helper to parse time string
  const extractHHMM = (rawTime: string): { hhmm: string; ms: number } => {
    let hhmm = '08:00';
    let ms = 0;
    if (!rawTime) return { hhmm, ms };
    try {
      if (rawTime.includes(' ')) {
        hhmm = rawTime.split(' ')[1].slice(0, 5);
        ms = new Date(rawTime.replace(' ', 'T')).getTime();
      } else if (rawTime.includes('T')) {
        hhmm = rawTime.split('T')[1].slice(0, 5);
        ms = new Date(rawTime).getTime();
      } else if (rawTime.includes(':')) {
        hhmm = rawTime.slice(0, 5);
      }
    } catch {}
    return { hhmm, ms };
  };

  // Process Teachers
  const teacherResults: MatchedStaffPunchResult[] = teachers.map(t => {
    const tId = String(t.id || t.mobile || t.name);
    const pData = punchesByPerson.get(tId);
    const personPunches = pData?.punches || [];

    const isWeeklyOff = (
      teacherRule.weeklyOffDay1 === dayOfWeek ||
      teacherRule.weeklyOffDay2 === dayOfWeek ||
      teacherRule.weeklyOffDay3 === dayOfWeek
    );

    // Sort punches chronologically
    const allPunchesWithTime = personPunches.map(p => {
      const raw = p.logged_time || p.punch_time || p.time || p.sync_time || '';
      const { hhmm, ms } = extractHHMM(raw);
      return { time: hhmm, ms, device: p.device_name || 'টিপসই ডিভাইস', type: p.punch_type || 'fingerprint', raw: p };
    }).sort((a, b) => a.ms - b.ms);

    if (allPunchesWithTime.length === 0) {
      // No punch today
      if (isWeeklyOff) {
        return {
          id: tId,
          name: t.name,
          type: 'teacher',
          designation: t.designation || 'ওস্তাদ/শিক্ষক',
          department: t.department || 'শিক্ষা বিভাগ',
          mobile: t.mobile,
          allPunches: [],
          status: 'weekly_off',
          lateMinutes: 0,
          workingHours: 0,
          overtimeHours: 0,
          deductionAmount: 0,
          isWeeklyOff: true,
          rawPunches: []
        };
      }

      return {
        id: tId,
        name: t.name,
        type: 'teacher',
        designation: t.designation || 'ওস্তাদ/শিক্ষক',
        department: t.department || 'শিক্ষা বিভাগ',
        mobile: t.mobile,
        allPunches: [],
        status: 'absent',
        lateMinutes: 0,
        workingHours: 0,
        overtimeHours: 0,
        deductionAmount: teacherRule.dailySalaryDeductionPerAbsent || 600,
        isWeeklyOff: false,
        rawPunches: []
      };
    }

    // Has punches!
    const firstIn = allPunchesWithTime[0].time;
    const lastOut = allPunchesWithTime.length > 1 ? allPunchesWithTime[allPunchesWithTime.length - 1].time : teacherRule.standardOutTime;

    // Calculate working hours
    const [inH, inM] = firstIn.split(':').map(Number);
    const [outH, outM] = lastOut.split(':').map(Number);
    let diffMins = (outH * 60 + outM) - (inH * 60 + inM);
    if (diffMins < 0) diffMins += 24 * 60;
    const workingHours = Number((diffMins / 60).toFixed(2));
    const overtimeHours = Math.max(0, Number((workingHours - 8).toFixed(2)));

    // Late calculation for Teacher: standardInTime + graceMinutes (e.g. 08:00 + 15 = 08:15)
    const [stdH, stdM] = teacherRule.standardInTime.split(':').map(Number);
    const graceLimitMins = stdH * 60 + stdM + teacherRule.lateGraceMinutes;
    const actualInMins = inH * 60 + inM;
    const lateMinutes = Math.max(0, actualInMins - (stdH * 60 + stdM));
    const isLate = actualInMins > graceLimitMins;

    const status: 'present' | 'late' | 'half-day' = 
      workingHours < 4 ? 'half-day' :
      isLate ? 'late' : 'present';

    const deductionAmount = isLate ? (teacherRule.lateDeductionPerLate || 100) : 0;

    return {
      id: tId,
      name: t.name,
      type: 'teacher',
      designation: t.designation || 'ওস্তাদ/শিক্ষক',
      department: t.department || 'শিক্ষা বিভাগ',
      mobile: t.mobile,
      firstInTime: firstIn,
      lastOutTime: lastOut,
      allPunches: allPunchesWithTime,
      status,
      lateMinutes,
      workingHours,
      overtimeHours,
      deductionAmount,
      isWeeklyOff,
      rawPunches: personPunches
    };
  });

  // Process Staff
  const staffResults: MatchedStaffPunchResult[] = staffList.map(s => {
    const sId = String(s.id || s.mobile || s.name);
    const pData = punchesByPerson.get(sId);
    const personPunches = pData?.punches || [];

    const isWeeklyOff = (
      staffRule.weeklyOffDay1 === dayOfWeek ||
      staffRule.weeklyOffDay2 === dayOfWeek
    );

    // Check if on approved leave
    const hasApprovedLeave = approvedLeaveRequests.some(l => 
      l.staffId === sId && 
      l.status === 'approved' &&
      targetDate >= l.startDate &&
      targetDate <= l.endDate
    );

    const allPunchesWithTime = personPunches.map(p => {
      const raw = p.logged_time || p.punch_time || p.time || p.sync_time || '';
      const { hhmm, ms } = extractHHMM(raw);
      return { time: hhmm, ms, device: p.device_name || 'টিপসই ডিভাইস', type: p.punch_type || 'fingerprint', raw: p };
    }).sort((a, b) => a.ms - b.ms);

    if (hasApprovedLeave) {
      return {
        id: sId,
        name: s.name,
        type: 'staff',
        designation: s.designation || 'কর্মচারী',
        department: s.department || 'সাধারণ প্রশাসন',
        mobile: s.mobile,
        allPunches: allPunchesWithTime,
        status: 'leave',
        lateMinutes: 0,
        workingHours: 0,
        overtimeHours: 0,
        deductionAmount: 0,
        isWeeklyOff: false,
        rawPunches: personPunches
      };
    }

    if (allPunchesWithTime.length === 0) {
      if (isWeeklyOff) {
        return {
          id: sId,
          name: s.name,
          type: 'staff',
          designation: s.designation || 'কর্মচারী',
          department: s.department || 'সাধারণ প্রশাসন',
          mobile: s.mobile,
          allPunches: [],
          status: 'weekly_off',
          lateMinutes: 0,
          workingHours: 0,
          overtimeHours: 0,
          deductionAmount: 0,
          isWeeklyOff: true,
          rawPunches: []
        };
      }

      return {
        id: sId,
        name: s.name,
        type: 'staff',
        designation: s.designation || 'কর্মচারী',
        department: s.department || 'সাধারণ প্রশাসন',
        mobile: s.mobile,
        allPunches: [],
        status: 'absent',
        lateMinutes: 0,
        workingHours: 0,
        overtimeHours: 0,
        deductionAmount: staffRule.dailySalaryDeductionPerAbsent || 500,
        isWeeklyOff: false,
        rawPunches: []
      };
    }

    // Has Punches!
    const firstIn = allPunchesWithTime[0].time;
    const lastOut = allPunchesWithTime.length > 1 ? allPunchesWithTime[allPunchesWithTime.length - 1].time : staffRule.standardOutTime;

    const [inH, inM] = firstIn.split(':').map(Number);
    const [outH, outM] = lastOut.split(':').map(Number);
    let diffMins = (outH * 60 + outM) - (inH * 60 + inM);
    if (diffMins < 0) diffMins += 24 * 60;
    const workingHours = Number((diffMins / 60).toFixed(2));
    const overtimeHours = Math.max(0, Number((workingHours - 8).toFixed(2)));

    // Late calculation for Staff: standardInTime + graceMinutes (e.g. 08:30 + 15 = 08:45)
    const [stdH, stdM] = staffRule.standardInTime.split(':').map(Number);
    const graceLimitMins = stdH * 60 + stdM + staffRule.lateGraceMinutes;
    const actualInMins = inH * 60 + inM;
    const lateMinutes = Math.max(0, actualInMins - (stdH * 60 + stdM));
    const isLate = actualInMins > graceLimitMins;

    const status: 'present' | 'late' | 'half-day' = 
      workingHours < staffRule.minWorkingHoursForHalfDay ? 'half-day' :
      isLate ? 'late' : 'present';

    const deductionAmount = isLate ? (staffRule.lateDeductionPerLate || 100) : 0;

    return {
      id: sId,
      name: s.name,
      type: 'staff',
      designation: s.designation || 'কর্মচারী',
      department: s.department || 'সাধারণ প্রশাসন',
      mobile: s.mobile,
      firstInTime: firstIn,
      lastOutTime: lastOut,
      allPunches: allPunchesWithTime,
      status,
      lateMinutes,
      workingHours,
      overtimeHours,
      deductionAmount,
      isWeeklyOff,
      rawPunches: personPunches
    };
  });

  return {
    teacherResults,
    staffResults,
    unmatchedPunches,
    summary: {
      totalPunches: punches.length,
      totalTeachers: teacherResults.length,
      teachersPresent: teacherResults.filter(t => t.status === 'present').length,
      teachersLate: teacherResults.filter(t => t.status === 'late').length,
      teachersAbsent: teacherResults.filter(t => t.status === 'absent').length,
      totalStaff: staffResults.length,
      staffPresent: staffResults.filter(s => s.status === 'present').length,
      staffLate: staffResults.filter(s => s.status === 'late').length,
      staffAbsent: staffResults.filter(s => s.status === 'absent').length,
    }
  };
};
