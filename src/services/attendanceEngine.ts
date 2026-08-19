import { 
  RawPunchRecord, 
  ProcessedPunchEvent, 
  StudentAttendanceRecord, 
  AttendanceSettings, 
  SentMessageLog, 
  AttendanceAuditLog, 
  DEFAULT_ATTENDANCE_SETTINGS 
} from '../types/attendance';
import { Student } from '../types';
import { enToBnNumber } from '../lib/utils';
import { fetchTipsoiAttendanceLogs, TipsoiPunchRecord, normalizeIdentifier } from './tipsoiAttendanceService';

// Storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'madrasah_attendance_settings_v3',
  RAW_PUNCHES: 'madrasah_raw_punches_v3',
  PROCESSED_EVENTS: 'madrasah_processed_punch_events_v3',
  DAILY_ATTENDANCE: 'madrasah_student_attendance_v3',
  SENT_MESSAGES: 'madrasah_sent_sms_logs_v3',
  SMS_BUNDLE: 'madrasah_sms_bundle_v3',
  AUDIT_LOGS: 'madrasah_attendance_audit_logs_v3',
  LAST_SYNC_INFO: 'madrasah_tipsoi_last_sync_info_v3',
  CANCELLED_STUDENTS: 'madrasah_cancelled_students_v3',
};

// Event Emitter for real-time live React UI updates
type AttendanceListener = () => void;
const listeners = new Set<AttendanceListener>();

export const subscribeToAttendanceUpdates = (listener: AttendanceListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const notifyAttendanceUpdate = () => {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.warn('Listener error:', e);
    }
  });
};

// -------------------------------------------------------------
// SETTINGS HELPERS
// -------------------------------------------------------------
export const getAttendanceSettings = (): AttendanceSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_ATTENDANCE_SETTINGS,
        ...parsed,
        general: { ...DEFAULT_ATTENDANCE_SETTINGS.general, ...(parsed.general || {}) },
        student: { ...DEFAULT_ATTENDANCE_SETTINGS.student, ...(parsed.student || {}) },
        residentialSchedule: { ...DEFAULT_ATTENDANCE_SETTINGS.residentialSchedule, ...(parsed.residentialSchedule || {}) },
        nonResidentialSchedule: { ...DEFAULT_ATTENDANCE_SETTINGS.nonResidentialSchedule, ...(parsed.nonResidentialSchedule || {}) },
        teacherRule: { ...DEFAULT_ATTENDANCE_SETTINGS.teacherRule, ...(parsed.teacherRule || {}) },
        messaging: { ...DEFAULT_ATTENDANCE_SETTINGS.messaging, ...(parsed.messaging || {}) },
      };
    }
  } catch (e) {
    console.error('Error reading attendance settings:', e);
  }
  return DEFAULT_ATTENDANCE_SETTINGS;
};

export const saveAttendanceSettings = (settings: AttendanceSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  notifyAttendanceUpdate();
};

// -------------------------------------------------------------
// RAW PUNCH LAYER
// -------------------------------------------------------------
export const getRawPunches = (): RawPunchRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.RAW_PUNCHES);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveRawPunches = (punches: RawPunchRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.RAW_PUNCHES, JSON.stringify(punches));
};

// -------------------------------------------------------------
// PROCESSED DAILY ATTENDANCE LAYER
// -------------------------------------------------------------
export const getDailyAttendanceDb = (): Record<string, Record<string, StudentAttendanceRecord>> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_ATTENDANCE);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const saveDailyAttendanceDb = (db: Record<string, Record<string, StudentAttendanceRecord>>) => {
  localStorage.setItem(STORAGE_KEYS.DAILY_ATTENDANCE, JSON.stringify(db));
  notifyAttendanceUpdate();
};

// -------------------------------------------------------------
// AUDIT LOGS LAYER
// -------------------------------------------------------------
export const getAuditLogs = (): AttendanceAuditLog[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const addAuditLog = (log: Omit<AttendanceAuditLog, 'id' | 'modifiedAt'>) => {
  const logs = getAuditLogs();
  const newLog: AttendanceAuditLog = {
    ...log,
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    modifiedAt: new Date().toISOString(),
  };
  logs.unshift(newLog);
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 500))); // Keep last 500
  notifyAttendanceUpdate();
};

// -------------------------------------------------------------
// SENT MESSAGES / SMS LOGS
// -------------------------------------------------------------
export const getSentMessageLogs = (): SentMessageLog[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SENT_MESSAGES);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const addSentMessageLog = (msg: Omit<SentMessageLog, 'id' | 'sentTime'>) => {
  const list = getSentMessageLogs();
  const newMsg: SentMessageLog = {
    ...msg,
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    sentTime: new Date().toISOString(),
  };
  list.unshift(newMsg);
  localStorage.setItem(STORAGE_KEYS.SENT_MESSAGES, JSON.stringify(list.slice(0, 1000)));
  notifyAttendanceUpdate();
};

// -------------------------------------------------------------
// SYNC MONITORING STATE
// -------------------------------------------------------------
export interface TipsoiSyncStatusInfo {
  connected: boolean;
  lastSyncTime: string | null;
  lastReceivedPunchTime: string | null;
  totalPunchesToday: number;
  failedRequests: number;
  pendingProcessing: number;
  lastError: string | null;
  activeDevicesCount: number;
}

export const getSyncStatusInfo = (): TipsoiSyncStatusInfo => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_SYNC_INFO);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    connected: true,
    lastSyncTime: null,
    lastReceivedPunchTime: null,
    totalPunchesToday: 0,
    failedRequests: 0,
    pendingProcessing: 0,
    lastError: null,
    activeDevicesCount: 1,
  };
};

export const updateSyncStatusInfo = (patch: Partial<TipsoiSyncStatusInfo>) => {
  const current = getSyncStatusInfo();
  const updated = { ...current, ...patch };
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC_INFO, JSON.stringify(updated));
  notifyAttendanceUpdate();
};

// -------------------------------------------------------------
// HELPER: Resolve Student from identifier tokens
// -------------------------------------------------------------
export const findStudentForIdentifier = (token: string, students: Student[]): Student | null => {
  if (!token) return null;
  const clean = normalizeIdentifier(token);
  if (!clean) return null;

  for (const s of students) {
    const sId = normalizeIdentifier(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || s['আবেদন নং']);
    const sRoll = normalizeIdentifier(s['রোল নম্বর'] || s['রোল'] || s.roll);
    const sCard = normalizeIdentifier(s['কার্ড নম্বর'] || s.card_no || s.rfid || s['RFID']);
    const sMobileMom = String(s['মোবাইল (মা)'] || '').replace(/\D/g, '');
    const sMobileDad = String(s['মোবাইল (বাবা/ভাই)'] || s['অভিভাবকের মোবাইল'] || s.mobile || '').replace(/\D/g, '');
    const sName = normalizeIdentifier(s['শিক্ষার্থীর নাম'] || s.name);

    if (sId && (sId === clean || sId.endsWith(clean) || clean.endsWith(sId))) return s;
    if (sCard && sCard === clean) return s;
    if (sRoll && sRoll === clean) return s;
    if (sMobileMom && sMobileMom.endsWith(clean)) return s;
    if (sMobileDad && sMobileDad.endsWith(clean)) return s;
    if (sName && (sName === clean || sName.includes(clean))) return s;
  }
  return null;
};

// -------------------------------------------------------------
// HELPER: Parse and extract time info (HH:mm) and timestamp
// -------------------------------------------------------------
export const parsePunchTime = (rawTimeStr: string): { timeHHMM: string; dateYYYYMMDD: string; fullTimestampMs: number } => {
  let dateStr = new Date().toISOString().split('T')[0];
  let timeStr = '08:00';
  let timestampMs = Date.now();

  if (!rawTimeStr) {
    return { timeHHMM: timeStr, dateYYYYMMDD: dateStr, fullTimestampMs: timestampMs };
  }

  try {
    const str = String(rawTimeStr).trim();
    if (str.includes(' ')) {
      const [d, t] = str.split(' ');
      if (d && d.length >= 8) dateStr = d.slice(0, 10);
      if (t) timeStr = t.slice(0, 5);
      const parsedD = new Date(str.replace(' ', 'T'));
      if (!isNaN(parsedD.getTime())) timestampMs = parsedD.getTime();
    } else if (str.includes('T')) {
      dateStr = str.split('T')[0];
      timeStr = str.split('T')[1]?.slice(0, 5) || '08:00';
      const parsedD = new Date(str);
      if (!isNaN(parsedD.getTime())) timestampMs = parsedD.getTime();
    } else if (str.includes(':')) {
      timeStr = str.slice(0, 5);
    }
  } catch {}

  return { timeHHMM: timeStr, dateYYYYMMDD: dateStr, fullTimestampMs: timestampMs };
};

// -------------------------------------------------------------
// CORE ENGINE: Process Raw Punches into Daily Attendance & Messaging
// -------------------------------------------------------------
export const processAttendanceEngine = (
  rawPunches: RawPunchRecord[],
  students: Student[],
  targetDate: string = new Date().toISOString().split('T')[0],
  settings: AttendanceSettings = getAttendanceSettings()
): {
  processedDailyRecords: Record<string, StudentAttendanceRecord>;
  sentMessagesCount: number;
  newDuplicatesCount: number;
} => {
  const dailyDb = getDailyAttendanceDb();
  const dayRecords: Record<string, StudentAttendanceRecord> = { ...(dailyDb[targetDate] || {}) };
  const existingSentLogs = getSentMessageLogs();
  
  // Filter raw punches for targetDate
  const dayPunches = rawPunches.filter(p => {
    const pDate = p.punchTime.includes(' ') ? p.punchTime.split(' ')[0] : p.punchTime.slice(0, 10);
    return !pDate || pDate === targetDate;
  });

  // Group raw punches by Student
  const punchesByStudent = new Map<string, RawPunchRecord[]>();

  dayPunches.forEach(punch => {
    let studentId = punch.studentId;
    if (!studentId && punch.userId) {
      const matched = findStudentForIdentifier(punch.userId, students);
      if (matched) {
        studentId = String(matched.id || matched['রেজিস্ট্রেশন/আইডি নম্বর'] || matched['রেজিস্ট্রেশন/আইডি']);
        punch.studentId = studentId;
      }
    }

    if (studentId) {
      if (!punchesByStudent.has(studentId)) {
        punchesByStudent.set(studentId, []);
      }
      punchesByStudent.get(studentId)!.push(punch);
    }
  });

  let newDuplicatesCount = 0;
  let sentMessagesCount = 0;

  // Process each student's punches for targetDate
  students.forEach(student => {
    const sId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || student['রেজিস্ট্রেশন/আইডি'] || student['আবেদন নং'] || '').trim();
    if (!sId) return;

    const sName = student['শিক্ষার্থীর নাম'] || student.name || 'শিক্ষার্থী';
    const sClass = student['জামাত/শ্রেণী'] || student['জামাত'] || student.class || '';
    const sRoll = student['রোল নম্বর'] || student['রোল'] || student.roll || '';
    const sBranch = student['শাখা'] || student.branch || '';
    const sDept = student['বিভাগ'] || student.department || '';
    const sCategory = (student['ক্যাটাগরি'] || student.category || student['আবাসিক/অনাবাসিক'] || 'অনাবাসিক') as any;
    const guardianName = student['পিতার নাম'] || student['অভিভাবকের নাম'] || student.fatherName || 'অভিভাবক';
    const guardianPhone = student['মোবাইল (বাবা/ভাই)'] || student['মোবাইল (মা)'] || student['অভিভাবকের মোবাইল'] || student.mobile || '';

    const studentPunches = punchesByStudent.get(sId) || [];

    // Sort chronologically
    studentPunches.sort((a, b) => {
      const tA = parsePunchTime(a.punchTime).fullTimestampMs;
      const tB = parsePunchTime(b.punchTime).fullTimestampMs;
      return tA - tB;
    });

    // ---------------------------------------------------------
    // Rule 1: 30-Second Duplicate Punch Protection
    // ---------------------------------------------------------
    const validPunches: Array<{ punch: RawPunchRecord; timeHHMM: string; ms: number }> = [];
    const timeline: Array<{ time: string; type: 'entry' | 'exit' | 'duplicate' | 'manual'; device?: string; note?: string }> = [];

    const dupThresholdMs = (settings.general.duplicateThresholdSeconds || 30) * 1000;

    studentPunches.forEach((p) => {
      const { timeHHMM, fullTimestampMs } = parsePunchTime(p.punchTime);
      
      // Check if within window (e.g. 05:00 - 22:30)
      if (timeHHMM < settings.general.windowStart || timeHHMM > settings.general.windowEnd) {
        p.processingStatus = 'outside_window';
        timeline.push({
          time: timeHHMM,
          type: 'duplicate',
          device: p.deviceName,
          note: 'উইন্ডোর বাইরে পাঞ্চ (বাতিল)'
        });
        return;
      }

      if (validPunches.length > 0) {
        const lastValid = validPunches[validPunches.length - 1];
        const timeDiff = Math.abs(fullTimestampMs - lastValid.ms);

        if (timeDiff < dupThresholdMs) {
          p.processingStatus = 'duplicate_30s';
          newDuplicatesCount++;
          timeline.push({
            time: timeHHMM,
            type: 'duplicate',
            device: p.deviceName,
            note: '৩০ সেকেন্ড ডুপ্লিকেট পাঞ্চ ফিল্টার'
          });
          return;
        }
      }

      // Valid punch
      p.processingStatus = 'processed';
      validPunches.push({ punch: p, timeHHMM, ms: fullTimestampMs });
    });

    // ---------------------------------------------------------
    // Rule 2: Odd = Entry, Even = Exit sequence
    // ---------------------------------------------------------
    let firstEntryTime: string | undefined;
    let lastExitTime: string | undefined;
    let lastPunchTime: string | undefined;
    let totalEntries = 0;
    let totalExits = 0;

    validPunches.forEach((vp, index) => {
      const isOddPunch = (index % 2 === 0); // 0th index is 1st punch = Entry
      const eventType = isOddPunch ? 'entry' : 'exit';

      if (isOddPunch) {
        totalEntries++;
        if (!firstEntryTime) firstEntryTime = vp.timeHHMM;
      } else {
        totalExits++;
        lastExitTime = vp.timeHHMM;
      }

      lastPunchTime = vp.timeHHMM;

      timeline.push({
        time: vp.timeHHMM,
        type: eventType,
        device: vp.punch.deviceName || 'বায়োমেট্রিক ডিভাইস',
        note: isOddPunch ? 'মাদ্রাসায় প্রবেশ (Entry)' : 'মাদ্রাসা থেকে প্রস্থান (Exit)'
      });
    });

    // ---------------------------------------------------------
    // Rule 3: Daily Attendance Determination (Valid punch = Present)
    // ---------------------------------------------------------
    const existingRec = dayRecords[sId];
    const hasValidPunch = validPunches.length > 0;
    
    // Check if manually modified
    const isManual = existingRec?.markedBy === 'ADMIN_MANUAL';

    let status: 'present' | 'absent' | 'late' | 'leave' | 'half-day' | 'temporarily_cancelled' = 'absent';
    let isLate = false;
    let lateMinutes = 0;
    let isMissingExit = false;

    if (hasValidPunch) {
      status = 'present';

      // Check Late Rule
      const standardEntry = settings.student.standardEntry || '06:30';
      if (firstEntryTime && firstEntryTime > standardEntry) {
        const [fH, fM] = firstEntryTime.split(':').map(Number);
        const [sH, sM] = standardEntry.split(':').map(Number);
        const diffMins = (fH * 60 + fM) - (sH * 60 + sM);
        
        if (diffMins > (settings.student.lateThresholdMinutes || 0)) {
          isLate = true;
          lateMinutes = diffMins;
          status = 'late';
        }
      }

      // Check Missing Exit (if odd number of punches and past non-residential exit)
      if (validPunches.length % 2 !== 0) {
        isMissingExit = true;
      }
    } else if (isManual && existingRec) {
      status = existingRec.status;
    }

    // ---------------------------------------------------------
    // Rule 4: Consecutive Absence Tracking (2 Days = Warning, 3+ Days = Temporary Cancellation)
    // ---------------------------------------------------------
    let consecutiveAbsenceDays = 0;
    if (status === 'absent') {
      // Look back at previous dates in dailyDb
      consecutiveAbsenceDays = calculateConsecutiveAbsence(sId, targetDate, dailyDb);
    }

    const isWarningTriggered = (consecutiveAbsenceDays === (settings.student.warningAbsenceDays || 2));
    const isAdmissionCancelled = (consecutiveAbsenceDays >= (settings.student.cancellationAbsenceDays || 3));

    if (isAdmissionCancelled && status === 'absent') {
      status = 'temporarily_cancelled';
    }

    // Mark evaluation score
    const attendanceMark = status === 'present' ? 100 : status === 'late' ? 75 : status === 'leave' ? 100 : 0;

    const record: StudentAttendanceRecord = {
      id: `att_${sId}_${targetDate}`,
      studentId: sId,
      studentName: sName,
      roll: sRoll,
      class: sClass,
      branch: sBranch,
      department: sDept,
      category: sCategory,
      attendanceDate: targetDate,
      status,
      attendanceMark,
      firstEntryTime,
      lastExitTime,
      lastPunchTime,
      totalPunches: studentPunches.length,
      validPunches: validPunches.length,
      totalEntries,
      totalExits,
      isLate,
      lateMinutes,
      isMissingExit,
      isEarlyExit: false,
      consecutiveAbsenceDays,
      isWarningTriggered,
      isAdmissionCancelled,
      timeline,
      markedBy: hasValidPunch ? 'TIPSOI_API' : isManual ? 'ADMIN_MANUAL' : 'TIPSOI_API',
      markedAt: existingRec?.markedAt || new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    dayRecords[sId] = record;

    // ---------------------------------------------------------
    // Rule 5: Automated Messaging Dispatch Engine
    // ---------------------------------------------------------
    if (settings.messaging.enabled && guardianPhone) {
      const msgRules = settings.messaging.rules;
      const templates = settings.messaging.templates;

      // Helper to dispatch SMS safely with duplicate protection
      const dispatchMessage = (
        eventKey: 'late' | 'absent' | 'warning2Days' | 'cancellation3Days' | 'entry' | 'exit' | 'missingExit',
        templateStr: string
      ) => {
        const uniqueRuleId = `sms_${sId}_${targetDate}_${eventKey}`;
        
        // Prevent Duplicate SMS for the same event on same day
        const alreadySent = existingSentLogs.some(l => l.ruleId === uniqueRuleId);
        if (alreadySent) return;

        // Populate placeholders
        const content = templateStr
          .replace(/{student_name}/g, sName)
          .replace(/{guardian_name}/g, guardianName)
          .replace(/{date}/g, targetDate)
          .replace(/{time}/g, lastPunchTime || firstEntryTime || '')
          .replace(/{entry_time}/g, firstEntryTime || '')
          .replace(/{exit_time}/g, lastExitTime || '')
          .replace(/{late_minutes}/g, enToBnNumber(lateMinutes))
          .replace(/{absence_days}/g, enToBnNumber(consecutiveAbsenceDays))
          .replace(/{class}/g, sClass)
          .replace(/{jamat}/g, sClass)
          .replace(/{category}/g, sCategory);

        addSentMessageLog({
          messageId: `SMS-${Date.now()}-${sId}`,
          studentId: sId,
          studentName: sName,
          guardianName,
          phone: guardianPhone,
          event: eventKey,
          content,
          deliveryStatus: 'sent',
          ruleId: uniqueRuleId,
        });

        sentMessagesCount++;
      };

      // Trigger 1: 3+ Days Consecutive Absence -> Temporary Cancellation Alert
      if (isAdmissionCancelled && msgRules.cancellation3Days) {
        dispatchMessage('cancellation3Days', templates.cancellation3Days);
      }
      // Trigger 2: 2 Days Consecutive Absence -> Warning
      else if (isWarningTriggered && msgRules.warning2Days) {
        dispatchMessage('warning2Days', templates.warning2Days);
      }
      // Trigger 3: Absent Today
      else if (status === 'absent' && msgRules.absent && consecutiveAbsenceDays === 1) {
        dispatchMessage('absent', templates.absent);
      }
      // Trigger 4: Late Entry
      else if (isLate && msgRules.late) {
        dispatchMessage('late', templates.late);
      }
      // Trigger 5: Entry SMS (if enabled for category)
      else if (hasValidPunch && totalEntries === 1 && totalExits === 0 && msgRules.entry) {
        if (sCategory === 'অনাবাসিক' ? msgRules.nonResidentialRules.entry : msgRules.residentialRules.entry) {
          dispatchMessage('entry', templates.entry);
        }
      }
      // Trigger 6: Exit SMS
      else if (lastExitTime && msgRules.exit) {
        if (sCategory === 'অনাবাসিক' ? msgRules.nonResidentialRules.exit : msgRules.residentialRules.nightExit) {
          dispatchMessage('exit', templates.exit);
        }
      }
    }
  });

  dailyDb[targetDate] = dayRecords;
  saveDailyAttendanceDb(dailyDb);
  saveRawPunches(rawPunches);

  return {
    processedDailyRecords: dayRecords,
    sentMessagesCount,
    newDuplicatesCount,
  };
};

// -------------------------------------------------------------
// HELPER: Consecutive Absence Calculator
// -------------------------------------------------------------
export const calculateConsecutiveAbsence = (
  studentId: string,
  currentDate: string,
  db: Record<string, Record<string, StudentAttendanceRecord>>
): number => {
  let count = 1; // Current day is absent
  const dateObj = new Date(currentDate);

  for (let i = 1; i <= 30; i++) {
    const prevDate = new Date(dateObj);
    prevDate.setDate(prevDate.getDate() - i);
    const prevDateStr = prevDate.toISOString().split('T')[0];

    // Skip Fridays (Weekly off)
    if (prevDate.getDay() === 5) continue;

    const dayRec = db[prevDateStr]?.[studentId];
    if (!dayRec) {
      // If no record, don't accumulate beyond known bounds
      break;
    }

    if (dayRec.status === 'absent' || dayRec.status === 'temporarily_cancelled') {
      count++;
    } else {
      break; // Streak broken
    }
  }

  return count;
};

// -------------------------------------------------------------
// REAL-TIME AUTO SYNC & POLLING SERVICE
// -------------------------------------------------------------
let syncTimer: any = null;

export const startAttendanceAutoSync = (
  studentsProvider: () => Student[],
  intervalSeconds?: number
) => {
  if (syncTimer) clearInterval(syncTimer);

  const settings = getAttendanceSettings();
  const interval = (intervalSeconds || settings.general.autoSyncIntervalSeconds || 30) * 1000;

  const performSync = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const students = studentsProvider();
      if (!students || students.length === 0) return;

      const { punches } = await fetchTipsoiAttendanceLogs(today);
      if (punches && punches.length > 0) {
        // Ingest into Raw Layer
        const rawExisting = getRawPunches();
        const existingIds = new Set(rawExisting.map(r => `${r.userId}_${r.punchTime}`));

        let newPunchesAdded = 0;
        punches.forEach(p => {
          const punchTime = p.logged_time || p.punch_time || p.time || p.sync_time || '';
          const userId = String(p.person_identifier || p.identifier || p.emp_id || p.user_id || p.card_no || '').trim();
          const key = `${userId}_${punchTime}`;

          if (!existingIds.has(key)) {
            existingIds.add(key);
            rawExisting.push({
              id: `raw_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              deviceId: String(p.device_identifier || 'TIPSOI-01'),
              deviceName: p.device_name || 'টিপসই স্মার্ট ডিভাইস',
              userId,
              userType: 'student',
              punchTime: punchTime || `${today} 08:00:00`,
              loggedTime: p.logged_time,
              syncTime: p.sync_time,
              receivedTime: new Date().toISOString(),
              punchType: p.punch_type || 'fingerprint',
              rawApiData: p.raw || p,
              processingStatus: 'processed',
            });
            newPunchesAdded++;
          }
        });

        // Run Processing Engine
        processAttendanceEngine(rawExisting, students, today, settings);

        updateSyncStatusInfo({
          connected: true,
          lastSyncTime: new Date().toISOString(),
          lastReceivedPunchTime: punches[punches.length - 1]?.punch_time || new Date().toISOString(),
          totalPunchesToday: punches.length,
          lastError: null,
        });
      } else {
        updateSyncStatusInfo({
          connected: true,
          lastSyncTime: new Date().toISOString(),
          lastError: null,
        });
      }
    } catch (err: any) {
      console.warn('Auto-sync error:', err);
      updateSyncStatusInfo({
        connected: false,
        lastError: err?.message || 'সিঙ্ক ব্যর্থ হয়েছে',
      });
    }
  };

  // Run initial sync
  performSync();

  // Set interval
  syncTimer = setInterval(performSync, Math.max(10000, interval));
};

export const stopAttendanceAutoSync = () => {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
};

// -------------------------------------------------------------
// MANUAL ENTRY / CORRECTION WITH AUDIT LOG
// -------------------------------------------------------------
export const updateStudentAttendanceManual = (
  studentId: string,
  date: string,
  newStatus: 'present' | 'absent' | 'late' | 'leave' | 'half-day' | 'temporarily_cancelled',
  reason: string,
  modifiedBy: string = 'এডমিন',
  students: Student[]
): boolean => {
  const dailyDb = getDailyAttendanceDb();
  const dayRecords = dailyDb[date] || {};
  const prevRec = dayRecords[studentId];
  const student = students.find(s => String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি']) === studentId);

  const studentName = student ? (student['শিক্ষার্থীর নাম'] || student.name || 'শিক্ষার্থী') : (prevRec?.studentName || 'শিক্ষার্থী');

  const updatedRec: StudentAttendanceRecord = {
    ...(prevRec || {
      id: `att_${studentId}_${date}`,
      studentId,
      studentName,
      class: student?.['জামাত/শ্রেণী'] || student?.['জামাত'] || student?.class || '',
      category: (student?.category || 'অনাবাসিক') as any,
      attendanceDate: date,
      totalPunches: 0,
      validPunches: 0,
      totalEntries: newStatus === 'present' || newStatus === 'late' ? 1 : 0,
      totalExits: 0,
      isLate: newStatus === 'late',
      lateMinutes: newStatus === 'late' ? 30 : 0,
      isMissingExit: false,
      isEarlyExit: false,
      consecutiveAbsenceDays: newStatus === 'absent' ? 1 : 0,
      timeline: [],
      markedAt: new Date().toISOString(),
    }),
    status: newStatus,
    attendanceMark: newStatus === 'present' ? 100 : newStatus === 'late' ? 75 : newStatus === 'leave' ? 100 : 0,
    markedBy: 'ADMIN_MANUAL',
    modifiedAt: new Date().toISOString(),
    remarks: reason,
  };

  // Add entry to timeline for audit clarity
  updatedRec.timeline = [
    ...(updatedRec.timeline || []),
    {
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      type: 'manual',
      note: `ম্যানুয়াল সংশোধন: ${newStatus} (কারণ: ${reason})`
    }
  ];

  dayRecords[studentId] = updatedRec;
  dailyDb[date] = dayRecords;
  saveDailyAttendanceDb(dailyDb);

  // Record in Audit Log
  addAuditLog({
    studentId,
    studentName,
    date,
    action: 'update',
    modifiedBy,
    previousStatus: prevRec?.status || 'none',
    newStatus,
    previousData: prevRec,
    newData: updatedRec,
    reason,
  });

  return true;
};

// -------------------------------------------------------------
// RE-ACTIVATE / RESTORE TEMPORARILY CANCELLED STUDENT
// -------------------------------------------------------------
export const restoreCancelledStudentAdmission = (
  studentId: string,
  restoredBy: string = 'এডমিন',
  reason: string = 'অফিস আবেদন মঞ্জুরিক্রমে পুনর্বহাল',
  students: Student[]
): boolean => {
  const today = new Date().toISOString().split('T')[0];
  const dailyDb = getDailyAttendanceDb();
  const dayRecords = dailyDb[today] || {};
  const currentRec = dayRecords[studentId];

  if (currentRec) {
    currentRec.status = 'present';
    currentRec.consecutiveAbsenceDays = 0;
    currentRec.isAdmissionCancelled = false;
    currentRec.isWarningTriggered = false;
    currentRec.modifiedAt = new Date().toISOString();
    currentRec.remarks = reason;
    dayRecords[studentId] = currentRec;
    dailyDb[today] = dayRecords;
    saveDailyAttendanceDb(dailyDb);
  }

  const student = students.find(s => String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর']) === studentId);
  const sName = student ? (student['শিক্ষার্থীর নাম'] || student.name || 'শিক্ষার্থী') : 'শিক্ষার্থী';

  addAuditLog({
    studentId,
    studentName: sName,
    date: today,
    action: 'restore',
    modifiedBy: restoredBy,
    previousStatus: 'temporarily_cancelled',
    newStatus: 'present',
    reason,
  });

  return true;
};

// -------------------------------------------------------------
// REAL-TIME BIOMETRIC ATTENDANCE SUMMARY FOR DASHBOARD
// -------------------------------------------------------------
export const getRealtimeDailyAttendanceStats = (
  students: Student[],
  date: string = new Date().toISOString().split('T')[0]
) => {
  const dailyDb = getDailyAttendanceDb();
  const dayRecords = dailyDb[date] || {};

  const totalEnrolled = students.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let missingExitCount = 0;
  let warningCount = 0;
  let cancelledCount = 0;
  let residentialPresent = 0;
  let nonResidentialPresent = 0;

  students.forEach(s => {
    const sId = String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || '');
    const rec = dayRecords[sId];
    const isRes = (s['শিক্ষার্থী ধরণ/ক্যাটাগরি'] || s.studentCategory || '').includes('আবাসিক') || 
                  (s['শিক্ষার্থী ধরণ'] || '').includes('আবাসিক');

    if (rec) {
      if (rec.status === 'present') {
        presentCount++;
        if (isRes) residentialPresent++;
        else nonResidentialPresent++;
      } else if (rec.status === 'late') {
        lateCount++;
        presentCount++;
        if (isRes) residentialPresent++;
        else nonResidentialPresent++;
      } else if (rec.status === 'absent') {
        absentCount++;
      } else if (rec.status === 'temporarily_cancelled') {
        cancelledCount++;
        absentCount++;
      }

      if (rec.isMissingExit) missingExitCount++;
      if (rec.isWarningTriggered) warningCount++;
    } else {
      absentCount++;
    }
  });

  const presentPercentage = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

  return {
    date,
    totalEnrolled,
    presentCount,
    absentCount,
    lateCount,
    missingExitCount,
    warningCount,
    cancelledCount,
    residentialPresent,
    nonResidentialPresent,
    presentPercentage,
  };
};

// -------------------------------------------------------------
// SMS BALANCE & ACCOUNT STATS LAYER
// -------------------------------------------------------------
export interface SmsAccountStats {
  totalPurchased: number;
  usedCount: number;
  remainingBalance: number;
  sentToday: number;
  sentThisMonth: number;
  failedCount: number;
  deliveryRate: number;
  gatewayName: string;
  senderId: string;
}

export const getSmsAccountStats = (): SmsAccountStats => {
  let totalPurchased = 5000;
  try {
    const savedBundle = localStorage.getItem(STORAGE_KEYS.SMS_BUNDLE);
    if (savedBundle) {
      const parsed = JSON.parse(savedBundle);
      if (typeof parsed.totalPurchased === 'number') {
        totalPurchased = parsed.totalPurchased;
      }
    }
  } catch (e) {}

  const logs = getSentMessageLogs();
  const usedCount = logs.length;
  const remainingBalance = Math.max(0, totalPurchased - usedCount);

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);

  let sentToday = 0;
  let sentThisMonth = 0;
  let failedCount = 0;

  logs.forEach(log => {
    const logDate = (log.sentTime || '').split('T')[0];
    if (logDate === todayStr) sentToday++;
    if (logDate.startsWith(thisMonthStr)) sentThisMonth++;
    if (log.deliveryStatus === 'failed') failedCount++;
  });

  const successCount = usedCount - failedCount;
  const deliveryRate = usedCount > 0 ? Math.round((successCount / usedCount) * 100) : 100;

  return {
    totalPurchased,
    usedCount,
    remainingBalance,
    sentToday,
    sentThisMonth,
    failedCount,
    deliveryRate,
    gatewayName: 'Teletalk / Greenweb SMS Gateway',
    senderId: 'MADRASA-INFO',
  };
};

export const addSmsBundle = (addedCredits: number) => {
  const current = getSmsAccountStats();
  const updatedTotal = (current.totalPurchased || 5000) + addedCredits;
  localStorage.setItem(STORAGE_KEYS.SMS_BUNDLE, JSON.stringify({ totalPurchased: updatedTotal }));
  notifyAttendanceUpdate();
};

