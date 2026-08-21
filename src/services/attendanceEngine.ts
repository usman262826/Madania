import { 
  RawPunchRecord, 
  ProcessedPunchEvent, 
  StudentAttendanceRecord, 
  AttendanceSettings, 
  SentMessageLog, 
  AttendanceAuditLog, 
  TeacherAttendanceRecord,
  StaffAttendanceRecord,
  StaffLeaveRequest,
  DEFAULT_ATTENDANCE_SETTINGS 
} from '../types/attendance';
import { Student } from '../types';
import { enToBnNumber } from '../lib/utils';
import { 
  fetchTipsoiAttendanceLogs, 
  TipsoiPunchRecord, 
  normalizeIdentifier, 
  matchPunchesToStaffAndTeachers,
  MatchedStaffPunchResult,
  extractDateAndHHMM
} from './tipsoiAttendanceService';
import { 
  sendSmsNetBd, 
  getSmsNetBdBalance, 
  DEFAULT_SMS_NET_BD_API_KEY 
} from './smsService';

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
  TEACHER_ATTENDANCE: 'madrasah_teacher_attendance_records',
  TEACHER_SALARY_RULES: 'madrasah_teacher_salary_rules',
  STAFF_ATTENDANCE: 'madrasah_staff_attendance_records',
  STAFF_LEAVE_REQUESTS: 'madrasah_staff_leave_requests',
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
// DATA CLEANUP / GARBAGE REMOVAL HELPER
// -------------------------------------------------------------
export const clearAllAttendanceAndMessagingData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.RAW_PUNCHES);
    localStorage.removeItem(STORAGE_KEYS.PROCESSED_EVENTS);
    localStorage.removeItem(STORAGE_KEYS.DAILY_ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.SENT_MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.TEACHER_ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.STAFF_ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.STAFF_LEAVE_REQUESTS);
    notifyAttendanceUpdate();
    return true;
  } catch (e) {
    console.error('Error clearing data:', e);
    return false;
  }
};

// -------------------------------------------------------------
// SETTINGS HELPERS
// -------------------------------------------------------------
export const getAttendanceSettings = (): AttendanceSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      const settings: AttendanceSettings = {
        ...DEFAULT_ATTENDANCE_SETTINGS,
        ...parsed,
        general: { ...DEFAULT_ATTENDANCE_SETTINGS.general, ...(parsed.general || {}) },
        student: { ...DEFAULT_ATTENDANCE_SETTINGS.student, ...(parsed.student || {}) },
        residentialSchedule: { ...DEFAULT_ATTENDANCE_SETTINGS.residentialSchedule, ...(parsed.residentialSchedule || {}) },
        nonResidentialSchedule: { ...DEFAULT_ATTENDANCE_SETTINGS.nonResidentialSchedule, ...(parsed.nonResidentialSchedule || {}) },
        teacherRule: { ...DEFAULT_ATTENDANCE_SETTINGS.teacherRule, ...(parsed.teacherRule || {}) },
        staffRule: { ...DEFAULT_ATTENDANCE_SETTINGS.staffRule, ...(parsed.staffRule || {}) },
        messaging: { 
          ...DEFAULT_ATTENDANCE_SETTINGS.messaging, 
          ...(parsed.messaging || {}),
          smsProvider: parsed.messaging?.smsProvider === 'mock_gateway' || !parsed.messaging?.smsProvider 
            ? 'sms_net_bd' 
            : parsed.messaging.smsProvider,
          providerApiKey: parsed.messaging?.providerApiKey || DEFAULT_SMS_NET_BD_API_KEY,
        },
      };
      return settings;
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

export const clearSentMessageLogs = () => {
  localStorage.removeItem(STORAGE_KEYS.SENT_MESSAGES);
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

  // 1. Priority 1: Exact Registration / ID Number match
  for (const s of students) {
    const sId = normalizeIdentifier(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || s['আবেদন নং']);
    if (sId && sId === clean) return s;
    // Also match numeric ID ignoring leading zeroes e.g. "00101" vs "101"
    if (sId && /^\d+$/.test(sId) && /^\d+$/.test(clean) && parseInt(sId, 10) === parseInt(clean, 10)) {
      return s;
    }
  }

  // 2. Priority 2: Exact RFID / Card Number match
  for (const s of students) {
    const sCard = normalizeIdentifier(s['কার্ড নম্বর'] || s.card_no || s.rfid || s['RFID']);
    if (sCard && sCard === clean) return s;
  }

  // 3. Priority 3: Exact Mobile Number (requires at least 10 digits)
  const cleanPhone = String(token).replace(/\D/g, '');
  if (cleanPhone.length >= 10) {
    for (const s of students) {
      const sMobileMom = String(s['মোবাইল (মা)'] || '').replace(/\D/g, '');
      const sMobileDad = String(s['মোবাইল (বাবা/ভাই)'] || s['অভিভাবকের মোবাইল'] || s.mobile || '').replace(/\D/g, '');
      if ((sMobileMom && sMobileMom === cleanPhone) || (sMobileDad && sMobileDad === cleanPhone)) {
        return s;
      }
    }
  }

  return null;
};

// -------------------------------------------------------------
// HELPER: Parse and extract time info (HH:mm) and timestamp
// -------------------------------------------------------------
export const parsePunchTime = (rawTimeStr: string, fallbackDate?: string): { timeHHMM: string; dateYYYYMMDD: string; fullTimestampMs: number } => {
  return extractDateAndHHMM(rawTimeStr, fallbackDate);
};

// -------------------------------------------------------------
// CORE ENGINE: Process Raw Punches into Daily Attendance & Messaging
// -------------------------------------------------------------
export const processAttendanceEngine = (
  rawPunches: RawPunchRecord[],
  students: Student[],
  targetDate: string = new Date().toISOString().split('T')[0],
  passedSettings: AttendanceSettings = getAttendanceSettings()
): {
  processedDailyRecords: Record<string, StudentAttendanceRecord>;
  sentMessagesCount: number;
  newDuplicatesCount: number;
} => {
  // Always fetch the freshest settings directly from localStorage to prevent stale closures in useEffect
  const settings = getAttendanceSettings();
  const dailyDb = getDailyAttendanceDb();
  const dayRecords: Record<string, StudentAttendanceRecord> = { ...(dailyDb[targetDate] || {}) };
  const existingSentLogs = getSentMessageLogs();
  
  // To avoid blasting historical SMS, only allow automated SMS for TODAY
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = targetDate === todayStr;
  
  // Filter raw punches strictly for targetDate using robust date normalizer
  const dayPunches = rawPunches.filter(p => {
    const rawStr = p.punchTime || p.loggedTime || p.syncTime || '';
    const parsed = extractDateAndHHMM(rawStr, targetDate);
    return parsed.dateYYYYMMDD === targetDate;
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
    const isStudentBlocked = settings.messaging.individualStudentOverrides?.[sId]?.enabled === false;
    
    // Safety checks:
    // 1. settings.messaging.enabled is ON
    // 2. targetDate is TODAY (do not blast SMS when viewing historical data)
    // 3. Student is not individually blocked
    // 4. Guardian phone exists
    if (settings.messaging.enabled && isToday && !isStudentBlocked && guardianPhone) {
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

        const messageLogId = `SMS-${Date.now()}-${sId}`;
        addSentMessageLog({
          messageId: messageLogId,
          studentId: sId,
          studentName: sName,
          guardianName,
          phone: guardianPhone,
          event: eventKey,
          content,
          deliveryStatus: 'delivered',
          ruleId: uniqueRuleId,
        });

        sentMessagesCount++;

        // Trigger real live API call via sms.net.bd
        if (settings.messaging.smsProvider === 'sms_net_bd' || !settings.messaging.smsProvider) {
          sendSmsNetBd({
            to: guardianPhone,
            msg: content,
            apiKey: settings.messaging.providerApiKey || DEFAULT_SMS_NET_BD_API_KEY,
            senderId: settings.messaging.senderId,
          }).then(res => {
            const logs = getSentMessageLogs();
            const targetIdx = logs.findIndex(l => l.messageId === messageLogId);
            if (targetIdx >= 0) {
              logs[targetIdx].deliveryStatus = res.success ? 'delivered' : 'failed';
              if (res.requestId) {
                logs[targetIdx].messageId = `REQ-${res.requestId}`;
              }
              localStorage.setItem(STORAGE_KEYS.SENT_MESSAGES, JSON.stringify(logs.slice(0, 1000)));
              notifyAttendanceUpdate();
            }
          }).catch(err => {
            console.error('Automated SMS net bd dispatch error:', err);
          });
        }
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
// REAL-TIME AUTO SYNC & POLLING SERVICE FOR STUDENTS, TEACHERS & STAFF
// -------------------------------------------------------------
let syncTimer: any = null;

export const startAttendanceAutoSync = (
  studentsProvider: () => Student[],
  teachersProvider?: () => any[],
  staffProvider?: () => any[],
  intervalSeconds?: number
) => {
  if (syncTimer) clearInterval(syncTimer);

  const settings = getAttendanceSettings();
  const interval = (intervalSeconds || settings.general.autoSyncIntervalSeconds || 30) * 1000;

  const performSync = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const students = studentsProvider ? studentsProvider() : [];
      const teachers = teachersProvider ? teachersProvider() : [];
      const staffList = staffProvider ? staffProvider() : [];

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

        if (newPunchesAdded > 0) {
          saveRawPunches(rawExisting);
        }

        // 1. Run Processing Engine for Students
        if (students && students.length > 0) {
          processAttendanceEngine(rawExisting, students, today, settings);
        }

        // 2. Run Processing Engine for Teachers & Staff
        if ((teachers && teachers.length > 0) || (staffList && staffList.length > 0)) {
          processStaffAndTeacherAttendanceEngine(punches, teachers, staffList, today, settings);
        }

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

/**
 * One-click unified sync function for a specific date across Students, Teachers, and Staff
 */
export const syncAllAttendanceForDate = async (
  date: string,
  students: Student[] = [],
  teachers: any[] = [],
  staffList: any[] = [],
  settings: AttendanceSettings = getAttendanceSettings()
): Promise<{
  success: boolean;
  totalPunches: number;
  studentMatched: number;
  teacherMatched: number;
  staffMatched: number;
  error?: string;
}> => {
  try {
    const { punches } = await fetchTipsoiAttendanceLogs(date);
    if (!punches || punches.length === 0) {
      return {
        success: true,
        totalPunches: 0,
        studentMatched: 0,
        teacherMatched: 0,
        staffMatched: 0
      };
    }

    // Ingest into Raw Layer
    const rawExisting = getRawPunches();
    const existingIds = new Set(rawExisting.map(r => `${r.userId}_${r.punchTime}`));

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
          punchTime: punchTime || `${date} 08:00:00`,
          loggedTime: p.logged_time,
          syncTime: p.sync_time,
          receivedTime: new Date().toISOString(),
          punchType: p.punch_type || 'fingerprint',
          rawApiData: p.raw || p,
          processingStatus: 'processed',
        });
      }
    });

    saveRawPunches(rawExisting);

    let studentMatchedCount = 0;
    if (students.length > 0) {
      const studentEngineResult = processAttendanceEngine(rawExisting, students, date, settings);
      studentMatchedCount = Object.values(studentEngineResult.processedDailyRecords).filter(r => r.status === 'present' || r.status === 'late').length;
    }

    let teacherMatchedCount = 0;
    let staffMatchedCount = 0;
    if (teachers.length > 0 || staffList.length > 0) {
      const staffEngineResult = processStaffAndTeacherAttendanceEngine(punches, teachers, staffList, date, settings);
      teacherMatchedCount = staffEngineResult.teacherSummary.present + staffEngineResult.teacherSummary.late;
      staffMatchedCount = staffEngineResult.staffSummary.present + staffEngineResult.staffSummary.late;
    }

    updateSyncStatusInfo({
      connected: true,
      lastSyncTime: new Date().toISOString(),
      lastReceivedPunchTime: punches[punches.length - 1]?.punch_time || new Date().toISOString(),
      totalPunchesToday: punches.length,
      lastError: null,
    });

    notifyAttendanceUpdate();

    return {
      success: true,
      totalPunches: punches.length,
      studentMatched: studentMatchedCount,
      teacherMatched: teacherMatchedCount,
      staffMatched: staffMatchedCount
    };
  } catch (err: any) {
    console.error('Unified Tipsoi sync error:', err);
    return {
      success: false,
      totalPunches: 0,
      studentMatched: 0,
      teacherMatched: 0,
      staffMatched: 0,
      error: err?.message || 'টিপসই সিঙ্কে ত্রুটি'
    };
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

  const settings = getAttendanceSettings();

  return {
    totalPurchased,
    usedCount,
    remainingBalance,
    sentToday,
    sentThisMonth,
    failedCount,
    deliveryRate,
    gatewayName: settings.messaging.smsProvider === 'sms_net_bd' ? 'SMS.NET.BD Official Gateway' : 'SMS Gateway',
    senderId: settings.messaging.senderId || 'SMS.NET.BD',
  };
};

export const addSmsBundle = (addedCredits: number) => {
  const current = getSmsAccountStats();
  const updatedTotal = (current.totalPurchased || 5000) + addedCredits;
  localStorage.setItem(STORAGE_KEYS.SMS_BUNDLE, JSON.stringify({ totalPurchased: updatedTotal }));
  notifyAttendanceUpdate();
};

// -------------------------------------------------------------
// TEACHER ATTENDANCE DB LAYER
// -------------------------------------------------------------
export const getTeacherAttendanceDb = (): TeacherAttendanceRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TEACHER_ATTENDANCE);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading teacher attendance db:', e);
  }
  return [];
};

export const saveTeacherAttendanceDb = (records: TeacherAttendanceRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.TEACHER_ATTENDANCE, JSON.stringify(records));
  notifyAttendanceUpdate();
};

// -------------------------------------------------------------
// STAFF ATTENDANCE DB LAYER
// -------------------------------------------------------------
export const getStaffAttendanceDb = (): StaffAttendanceRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF_ATTENDANCE);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading staff attendance db:', e);
  }
  return [];
};

export const saveStaffAttendanceDb = (records: StaffAttendanceRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.STAFF_ATTENDANCE, JSON.stringify(records));
  notifyAttendanceUpdate();
};

// -------------------------------------------------------------
// STAFF LEAVE REQUESTS LAYER
// -------------------------------------------------------------
export const getStaffLeaveRequestsDb = (): StaffLeaveRequest[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF_LEAVE_REQUESTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading staff leave requests:', e);
  }
  return [];
};

export const saveStaffLeaveRequestsDb = (requests: StaffLeaveRequest[]) => {
  localStorage.setItem(STORAGE_KEYS.STAFF_LEAVE_REQUESTS, JSON.stringify(requests));
  notifyAttendanceUpdate();
};

// -------------------------------------------------------------
// REAL-TIME TEACHER & STAFF BIOMETRIC ATTENDANCE PROCESSOR
// -------------------------------------------------------------
export const processStaffAndTeacherAttendanceEngine = (
  rawPunches: TipsoiPunchRecord[],
  teachers: any[],
  staffList: any[],
  targetDate: string = new Date().toISOString().split('T')[0],
  settings: AttendanceSettings = getAttendanceSettings(),
  leaveRequests: StaffLeaveRequest[] = getStaffLeaveRequestsDb()
): {
  teacherRecords: TeacherAttendanceRecord[];
  staffRecords: StaffAttendanceRecord[];
  teacherSummary: { total: number; present: number; late: number; absent: number; weeklyOff: number };
  staffSummary: { total: number; present: number; late: number; absent: number; leave: number; weeklyOff: number };
} => {
  // Convert RawPunchRecords or TipsoiPunchRecords into TipsoiPunchRecord format
  const formattedPunches: TipsoiPunchRecord[] = rawPunches.map(p => {
    const timeStr = (p as any).punchTime || p.punch_time || p.logged_time || p.time || p.sync_time || '';
    return {
      id: p.id || (p as any).uid,
      emp_id: p.emp_id || (p as any).studentId || (p as any).userId,
      employee_id: p.employee_id || (p as any).studentId || (p as any).userId,
      identifier: p.identifier || (p as any).studentId || (p as any).userId,
      person_id: p.person_id || (p as any).userId,
      person_identifier: p.person_identifier || (p as any).studentId,
      card_no: p.card_no || (p as any).cardNo || p.rfid,
      rfid: p.rfid || p.card_no,
      name: p.name || (p as any).userName,
      punch_time: timeStr,
      logged_time: (p as any).punchTime || p.logged_time || timeStr,
      sync_time: p.sync_time,
      time: timeStr,
      punch_type: p.punch_type || (p as any).punchType || 'biometric',
      status: 'present',
      device_name: p.device_name || (p as any).deviceName || 'টিপসই বায়োমেট্রিক ডিভাইস',
      device_identifier: p.device_identifier || (p as any).deviceId,
      raw: (p as any).raw || p
    };
  });

  // Run teacher and staff matching with their customized policy settings
  const matchResult = matchPunchesToStaffAndTeachers(
    formattedPunches,
    teachers,
    staffList,
    targetDate,
    {
      teacherRule: settings.teacherRule,
      staffRule: settings.staffRule
    },
    leaveRequests
  );

  // Map to TeacherAttendanceRecords
  const currentTeachersDb = getTeacherAttendanceDb();
  const filteredTeacherDb = currentTeachersDb.filter(r => r.attendanceDate !== targetDate);

  const newTeacherRecords: TeacherAttendanceRecord[] = matchResult.teacherResults.map(tr => ({
    id: `tatt-${tr.id}-${targetDate}`,
    teacherId: tr.id,
    teacherName: tr.name,
    department: tr.department || 'শিক্ষা বিভাগ',
    attendanceDate: targetDate,
    isWeeklyOff: tr.isWeeklyOff,
    status: tr.status,
    inTime: tr.firstInTime || (tr.status === 'weekly_off' ? '' : settings.teacherRule?.standardInTime || '08:00'),
    outTime: tr.lastOutTime || (tr.status === 'weekly_off' ? '' : settings.teacherRule?.standardOutTime || '16:30'),
    workingHours: tr.workingHours,
    overtimeHours: tr.overtimeHours,
    deductionAmount: tr.deductionAmount,
    remarks: tr.isWeeklyOff ? 'সাপ্তাহিক ছুটি' : tr.status === 'late' ? `${enToBnNumber(tr.lateMinutes)} মিনিট বিলম্ব` : tr.status === 'present' ? 'টিপসই বায়োমেট্রিক উপস্থিত' : 'অনুপস্থিত',
    markedBy: 'টিপসই API বায়োমেট্রিক সিস্টেম',
    markedAt: new Date().toISOString()
  }));

  const updatedAllTeachers = [...filteredTeacherDb, ...newTeacherRecords];
  saveTeacherAttendanceDb(updatedAllTeachers);

  // Map to StaffAttendanceRecords
  const currentStaffDb = getStaffAttendanceDb();
  const filteredStaffDb = currentStaffDb.filter(r => r.attendanceDate !== targetDate);

  const newStaffRecords: StaffAttendanceRecord[] = matchResult.staffResults.map(sr => ({
    id: `satt-${sr.id}-${targetDate}`,
    staffId: sr.id,
    staffName: sr.name,
    designation: sr.designation || 'কর্মচারী',
    department: sr.department || 'সাধারণ প্রশাসন',
    attendanceDate: targetDate,
    status: (sr.status === 'weekly_off' ? 'present' : sr.status) as any,
    inTime: sr.firstInTime || (sr.status === 'weekly_off' || sr.status === 'leave' ? '' : settings.staffRule?.standardInTime || '08:30'),
    outTime: sr.lastOutTime || (sr.status === 'weekly_off' || sr.status === 'leave' ? '' : settings.staffRule?.standardOutTime || '17:00'),
    totalHours: sr.workingHours,
    overtimeHours: sr.overtimeHours,
    deductionAmount: sr.deductionAmount,
    remarks: sr.status === 'leave' ? 'ছুটিতে আছেন (অনুমোদিত)' : sr.isWeeklyOff ? 'সাপ্তাহিক ছুটি' : sr.status === 'late' ? `${enToBnNumber(sr.lateMinutes)} মিনিট বিলম্ব` : 'টিপসই উপস্থিতি',
    markedAt: new Date().toISOString()
  }));

  const updatedAllStaff = [...filteredStaffDb, ...newStaffRecords];
  saveStaffAttendanceDb(updatedAllStaff);

  // Audit log
  addAuditLog({
    studentId: 'ALL_STAFF_TEACHERS',
    studentName: 'শিক্ষক ও স্টাফবৃন্দ',
    date: targetDate,
    action: 'update',
    modifiedBy: 'টিপসই এপিআই রিয়েল-টাইম সিঙ্ক',
    newStatus: 'Synced',
    reason: `শিক্ষক (${enToBnNumber(newTeacherRecords.length)} জন) এবং স্টাফ (${enToBnNumber(newStaffRecords.length)} জন) এর বায়োমেট্রিক হাজিরা টিপসই এপিআই থেকে সিঙ্ক করা হয়েছে।`
  });

  return {
    teacherRecords: newTeacherRecords,
    staffRecords: newStaffRecords,
    teacherSummary: {
      total: newTeacherRecords.length,
      present: newTeacherRecords.filter(t => t.status === 'present').length,
      late: newTeacherRecords.filter(t => t.status === 'late').length,
      absent: newTeacherRecords.filter(t => t.status === 'absent').length,
      weeklyOff: newTeacherRecords.filter(t => t.status === 'weekly_off').length
    },
    staffSummary: {
      total: newStaffRecords.length,
      present: newStaffRecords.filter(s => s.status === 'present').length,
      late: newStaffRecords.filter(s => s.status === 'late').length,
      absent: newStaffRecords.filter(s => s.status === 'absent').length,
      leave: newStaffRecords.filter(s => s.status === 'leave').length,
      weeklyOff: newStaffRecords.filter(s => (s as any).status === 'weekly_off').length
    }
  };
};

