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
          // Check for targetDate in logs
          const dateLog = logsObj[targetDate] || Object.values(logsObj)[0];
          const startTime = dateLog?.start || item.start || '';
          
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
            date: dateLog?.date || targetDate,
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

  // Filter punches matching the targetDate if date is present in timestamp
  if (allPunches.length > 0 && targetDate) {
    const filtered = allPunches.filter(p => {
      if (!p.punch_time && !p.date) return true;
      const punchDateStr = (p.punch_time || p.date || '').slice(0, 10);
      return !punchDateStr || punchDateStr === targetDate;
    });
    if (filtered.length > 0) {
      allPunches = filtered;
    }
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

    rawFields.forEach((f) => {
      if (f !== null && f !== undefined && f !== '') {
        const str = String(f).trim();
        candidateTokens.push(str);
        // If string contains separators like "Name-1234" or "Name_1001", add separated sub-parts
        if (str.includes('-') || str.includes('_') || str.includes(' ')) {
          const parts = str.split(/[-_\s]+/);
          parts.forEach(p => {
            if (p.trim()) candidateTokens.push(p.trim());
          });
        }
      }
    });

    let matchedStudent: any = null;

    for (const token of candidateTokens) {
      const normalized = normalizeIdentifier(token);
      if (!normalized) continue;

      // 1. Match by ID / Reg No
      if (studentById.has(normalized)) {
        matchedStudent = studentById.get(normalized);
        break;
      }

      // 2. Match by RFID / Card No
      if (studentByCard.has(normalized)) {
        matchedStudent = studentByCard.get(normalized);
        break;
      }

      // 3. Match by Mobile
      const cleanNum = token.replace(/[^0-9]/g, '');
      if (cleanNum.length >= 10 && studentByMobile.has(cleanNum)) {
        matchedStudent = studentByMobile.get(cleanNum);
        break;
      }

      // 4. Match by Roll
      if (studentByRoll.has(normalized)) {
        matchedStudent = studentByRoll.get(normalized);
        break;
      }

      // 5. Match by Name
      if (studentByName.has(normalized)) {
        matchedStudent = studentByName.get(normalized);
        break;
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
