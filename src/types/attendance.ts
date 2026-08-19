export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'half-day' | 'on-duty' | 'temporarily_cancelled' | 'missing_exit';

export type MarkingCriteriaType = 'percentage' | 'fixed_points' | 'custom_formula';

export type StudentCategory = 'আবাসিক' | 'অনাবাসিক' | 'ডে-কেয়ার' | 'হিফজ' | 'কিতাব' | 'অন্যান্য';

// -------------------------------------------------------------
// RAW PUNCH LAYER (Never deleted or modified)
// -------------------------------------------------------------
export interface RawPunchRecord {
  id: string;
  deviceId: string;
  deviceName?: string;
  userId: string; // Identifier from device
  studentId?: string; // Resolved student ID if matched
  teacherId?: string; // Resolved teacher/staff ID if matched
  userType: 'student' | 'teacher' | 'staff' | 'unmatched';
  punchTime: string; // "YYYY-MM-DD HH:mm:ss" or ISO
  loggedTime?: string;
  syncTime?: string;
  receivedTime: string;
  punchType?: string; // 'fingerprint' | 'card' | 'face' | 'rfid' | 'manual'
  rawApiData?: any;
  processingStatus: 'processed' | 'duplicate_30s' | 'outside_window' | 'failed' | 'ignored';
  errorLog?: string;
}

// -------------------------------------------------------------
// PROCESSED PUNCH EVENT (Odd = Entry, Even = Exit)
// -------------------------------------------------------------
export interface ProcessedPunchEvent {
  id: string;
  rawPunchId: string;
  userId: string;
  studentId?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  type: 'entry' | 'exit';
  sequenceNumber: number; // 1 = Entry, 2 = Exit, 3 = Entry, 4 = Exit...
  isDuplicate: boolean;
  isManual: boolean;
  manualReason?: string;
  manualBy?: string;
  sessionName?: 'morning_entry' | 'lunch_exit' | 'lunch_return' | 'afternoon_exit' | 'evening_return' | 'night_exit' | 'general';
  device?: string;
}

// -------------------------------------------------------------
// DAILY PROCESSED STUDENT ATTENDANCE RECORD
// -------------------------------------------------------------
export interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  roll?: string;
  class: string;
  branch?: string;
  department?: string;
  category: StudentCategory;
  attendanceDate: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'leave' | 'half-day' | 'temporarily_cancelled';
  attendanceMark: number;
  markingCriteriaId?: string;
  markingType?: MarkingCriteriaType;
  
  // Real-time Punch Analytics
  firstEntryTime?: string; // "06:25"
  lastExitTime?: string; // "21:30"
  lastPunchTime?: string; // "21:30"
  totalPunches: number;
  validPunches: number;
  totalEntries: number;
  totalExits: number;
  isLate: boolean;
  lateMinutes: number;
  isMissingExit: boolean;
  isEarlyExit: boolean;
  
  // Absence & Cancellation Rule Tracking
  consecutiveAbsenceDays: number;
  isWarningTriggered?: boolean;
  isAdmissionCancelled?: boolean; // Triggered at >= 3 consecutive days
  
  // Timeline of all punches for the day
  timeline: Array<{
    time: string;
    type: 'entry' | 'exit' | 'duplicate' | 'manual';
    device?: string;
    note?: string;
  }>;
  
  remarks?: string;
  markedBy?: string; // 'TIPSOI_API' | 'ADMIN_MANUAL'
  markedAt: string;
  modifiedAt?: string;
}

// -------------------------------------------------------------
// AUDIT LOG FOR MANUAL CORRECTIONS
// -------------------------------------------------------------
export interface AttendanceAuditLog {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  action: 'create' | 'update' | 'delete' | 'restore' | 'cancel_admission';
  modifiedBy: string;
  modifiedAt: string;
  previousStatus?: string;
  newStatus: string;
  previousData?: any;
  newData?: any;
  reason: string;
}

// -------------------------------------------------------------
// ATTENDANCE MARKING CRITERIA
// -------------------------------------------------------------
export interface AttendanceMarkingCriteria {
  id: string;
  class: string; // e.g. "নাহবেমীর", "সরফ-১", "সব জামাত / সাধারণ"
  markingType: MarkingCriteriaType;
  presentMark: number;
  lateMark: number;
  absentMark: number;
  halfDayMark: number;
  leaveMark: number;
  customFormula?: string;
  effectiveFrom: string;
  createdBy?: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// ATTENDANCE & MESSAGING SETTINGS / RULE ENGINE
// -------------------------------------------------------------
export interface AttendanceSettings {
  general: {
    windowStart: string; // "05:00"
    windowEnd: string; // "22:30"
    timezone: string; // "Asia/Dhaka"
    duplicateThresholdSeconds: number; // 30
    autoSyncIntervalSeconds: number; // 30
  };
  student: {
    standardEntry: string; // "06:30"
    lateThresholdMinutes: number; // 0
    warningAbsenceDays: number; // 2
    cancellationAbsenceDays: number; // 3
  };
  residentialSchedule: {
    morningEntryStart: string; // "05:00"
    morningStandardEntry: string; // "06:30"
    lunchExitStart: string; // "12:45"
    lunchReturnTarget: string; // "14:00"
    afternoonExitStart: string; // "16:45"
    eveningReturnMaghribOffsetMins: number; // 10
    eveningReturnTarget: string; // "18:15"
    nightExitTime: string; // "21:30"
  };
  nonResidentialSchedule: {
    entryTime: string; // "06:30"
    exitTime: string; // "21:15"
  };
  teacherRule: {
    weeklyOffDay1: string; // "Friday" (ছুটি)
    weeklyOffDay2: string; // "Tuesday" (Configurable)
    weeklyOffDay3: string; // "Thursday" (Configurable)
    standardInTime: string; // "08:00"
    standardOutTime: string; // "16:30"
    lateGraceMinutes: number; // 15
    lateDeductionPerLate: number; // 100
    dailySalaryDeductionPerAbsent: number; // 600
    earlyExitDeduction: number; // 150
  };
  staffRule: {
    weeklyOffDay1: string; // "Friday"
    weeklyOffDay2: string; // "Saturday" or other
    standardInTime: string; // "08:30"
    standardOutTime: string; // "17:00"
    lateGraceMinutes: number; // 15
    lateDeductionPerLate: number; // 100
    dailySalaryDeductionPerAbsent: number; // 500
    overtimeHourlyRate: number; // 100
    minWorkingHoursForFullDay: number; // 7
    minWorkingHoursForHalfDay: number; // 4
  };
  messaging: {
    enabled: boolean;
    smsProvider: 'mock_gateway' | 'greenweb' | 'bulk_sms_bd' | 'custom_api';
    providerApiKey?: string;
    senderId?: string;
    rules: {
      late: boolean;
      absent: boolean;
      warning2Days: boolean;
      cancellation3Days: boolean;
      entry: boolean;
      exit: boolean;
      missingExit: boolean;
      residentialRules: {
        entry: boolean;
        lunchExit: boolean;
        lunchReturn: boolean;
        nightExit: boolean;
      };
      nonResidentialRules: {
        entry: boolean;
        exit: boolean;
      };
    };
    templates: {
      late: string;
      absent: string;
      warning2Days: string;
      cancellation3Days: string;
      entry: string;
      exit: string;
      missingExit: string;
    };
    individualStudentOverrides: Record<string, { 
      enabled: boolean; 
      customEvents?: ('late' | 'absent' | 'warning' | 'entry' | 'exit')[]; 
    }>;
  };
}

// -------------------------------------------------------------
// AUTOMATED SMS LOG
// -------------------------------------------------------------
export interface SentMessageLog {
  id: string;
  messageId: string;
  studentId: string;
  studentName: string;
  guardianName: string;
  phone: string;
  event: 'late' | 'absent' | 'warning2Days' | 'cancellation3Days' | 'entry' | 'exit' | 'missingExit' | 'special';
  content: string;
  sentTime: string;
  deliveryStatus: 'sent' | 'delivered' | 'failed' | 'queued';
  ruleId: string;
  error?: string;
}

// -------------------------------------------------------------
// MONTHLY / YEARLY SUMMARY
// -------------------------------------------------------------
export interface AttendanceMonthlySummary {
  id: string;
  studentId: string;
  studentName: string;
  roll?: string;
  class: string;
  month: string; // YYYY-MM
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  halfDayCount: number;
  missingExitCount: number;
  consecutiveAbsenceMax: number;
  totalMarks: number;
  averageMarks: number;
  attendancePercentage: number;
  generatedAt: string;
}

// -------------------------------------------------------------
// TEACHER ATTENDANCE & SALARY TYPES
// -------------------------------------------------------------
export interface TeacherAttendanceRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  department: string;
  attendanceDate: string; // YYYY-MM-DD
  dayOfWeek?: string;
  isWeeklyOff?: boolean; // Friday or configured off days
  status: 'present' | 'absent' | 'late' | 'leave' | 'half-day' | 'on-duty' | 'weekly_off';
  inTime?: string; // "08:00"
  outTime?: string; // "16:30"
  workingHours: number;
  overtimeHours: number;
  deductionAmount: number;
  remarks?: string;
  markedBy?: string;
  markedAt: string;
}

export interface TeacherSalaryRule {
  id: string;
  teacherId: string; // teacher id or 'default'
  teacherName?: string;
  baseSalary: number;
  dailyDeductionAbsent: number;
  dailyDeductionLate: number;
  deductionPerHourLate: number;
  attendanceBonusPercentage: number; // e.g. 5 for 5%
  perfectAttendanceBonus: number; // e.g. 1000
  minWorkingHours: number; // default 8
  maxWorkingHours: number; // default 9
  otRate: number; // e.g. 150 per hour
  effectiveFrom: string;
}

export interface TeacherMonthlySalary {
  id: string;
  teacherId: string;
  teacherName: string;
  department: string;
  designation?: string;
  month: string; // YYYY-MM
  baseSalary: number;
  
  // Deductions
  absentDeduction: number;
  lateDeduction: number;
  otherDeduction: number;
  totalDeduction: number;
  
  // Additions / Bonuses
  attendanceBonus: number;
  perfectAttendanceBonus: number;
  overtimePay: number;
  otherAllowance: number;
  totalAddition: number;
  
  // Final
  netSalary: number;
  paymentStatus: 'pending' | 'approved' | 'paid';
  paidDate?: string;
  paymentMethod?: string;
  remarks?: string;
  calculatedAt: string;
  
  // Detailed summary
  breakdown: {
    workingDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    leaveDays: number;
    weeklyOffDays: number;
    onDutyDays: number;
    halfDays: number;
    totalWorkingHours: number;
    totalOvertimeHours: number;
    lateHours: number;
  };
}

// -------------------------------------------------------------
// STAFF & HR ATTENDANCE & LEAVE TYPES
// -------------------------------------------------------------
export interface StaffAttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  designation: string;
  department: string;
  attendanceDate: string; // YYYY-MM-DD
  inTime?: string;
  outTime?: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'half-day' | 'on-duty';
  totalHours: number;
  overtimeHours: number;
  deductionAmount: number;
  remarks?: string;
  markedAt: string;
}

export type LeaveType = 'casual' | 'sick' | 'emergency' | 'unpaid';

export interface StaffLeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  designation?: string;
  department?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysApplied: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalDate?: string;
  supervisorStatus?: 'pending' | 'approved' | 'rejected';
  hrStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  appliedAt: string;
}

export interface StaffLeaveBalance {
  id: string;
  staffId: string;
  staffName?: string;
  year: number;
  
  casualLeaveAllocated: number;
  casualLeaveUsed: number;
  casualLeaveBalance: number;
  
  sickLeaveAllocated: number;
  sickLeaveUsed: number;
  sickLeaveBalance: number;
  
  emergencyLeaveAllocated: number;
  emergencyLeaveUsed: number;
  emergencyLeaveBalance: number;
}

export interface StaffMonthlySalary {
  id: string;
  staffId: string;
  staffName: string;
  designation: string;
  department?: string;
  baseSalary: number;
  
  absentDays: number;
  absentDeduction: number;
  lateDays: number;
  lateDeduction: number;
  unpaidLeaveDays: number;
  leaveDeduction: number;
  loanDeduction: number;
  otherDeduction: number;
  
  overtimeHours: number;
  overtimePay: number;
  bonus: number;
  allowance: number;
  
  grossSalary: number;
  netSalary: number;
  paymentStatus: 'pending' | 'approved' | 'paid';
  paymentDate?: string;
  paymentMethod?: string;
  month: string;
  calculatedAt: string;
  remarks?: string;
}

// -------------------------------------------------------------
// DEFAULT PRESETS
// -------------------------------------------------------------
export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  general: {
    windowStart: '05:00',
    windowEnd: '22:30',
    timezone: 'Asia/Dhaka',
    duplicateThresholdSeconds: 30,
    autoSyncIntervalSeconds: 30,
  },
  student: {
    standardEntry: '06:30',
    lateThresholdMinutes: 0,
    warningAbsenceDays: 2,
    cancellationAbsenceDays: 3,
  },
  residentialSchedule: {
    morningEntryStart: '05:00',
    morningStandardEntry: '06:30',
    lunchExitStart: '12:45',
    lunchReturnTarget: '14:00',
    afternoonExitStart: '16:45',
    eveningReturnMaghribOffsetMins: 10,
    eveningReturnTarget: '18:15',
    nightExitTime: '21:30',
  },
  nonResidentialSchedule: {
    entryTime: '06:30',
    exitTime: '21:15',
  },
  teacherRule: {
    weeklyOffDay1: 'Friday',
    weeklyOffDay2: 'Tuesday',
    weeklyOffDay3: 'Thursday',
    standardInTime: '08:00',
    standardOutTime: '16:30',
    lateGraceMinutes: 15,
    lateDeductionPerLate: 100,
    dailySalaryDeductionPerAbsent: 600,
    earlyExitDeduction: 150,
  },
  staffRule: {
    weeklyOffDay1: 'Friday',
    weeklyOffDay2: 'Saturday',
    standardInTime: '08:30',
    standardOutTime: '17:00',
    lateGraceMinutes: 15,
    lateDeductionPerLate: 100,
    dailySalaryDeductionPerAbsent: 500,
    overtimeHourlyRate: 100,
    minWorkingHoursForFullDay: 7,
    minWorkingHoursForHalfDay: 4,
  },
  messaging: {
    enabled: true,
    smsProvider: 'mock_gateway',
    providerApiKey: '',
    senderId: 'ALMADANIA',
    rules: {
      late: true,
      absent: true,
      warning2Days: true,
      cancellation3Days: true,
      entry: false,
      exit: false,
      missingExit: true,
      residentialRules: {
        entry: false,
        lunchExit: true,
        lunchReturn: false,
        nightExit: true,
      },
      nonResidentialRules: {
        entry: true,
        exit: true,
      },
    },
    templates: {
      late: 'মুহতারাম {guardian_name}, আপনার সন্তান {student_name} আজ {date} তারিখে {time} টায় ({late_minutes} মিনিট দেরিতে) মাদ্রাসায় উপস্থিত হয়েছে। - দারুল উলূম মাদানিয়া',
      absent: 'মুহতারাম {guardian_name}, আপনার সন্তান {student_name} (জামাত: {jamat}) আজ {date} তারিখে মাদ্রাসায় অনুপস্থিত রয়েছে। - দারুল উলূম মাদানিয়া',
      warning2Days: 'সতর্কবার্তা: মুহতারাম {guardian_name}, আপনার সন্তান {student_name} বিগত ২ দিন ধরে মাদ্রাসায় অনুপস্থিত রয়েছে। দ্রুত যোগাযোগ করার অনুরোধ করা যাচ্ছে। - দারুল উলূম মাদানিয়া',
      cancellation3Days: 'জরুরী বিজ্ঞপ্তি: মুহতারাম {guardian_name}, আপনার সন্তান {student_name} একটানা ৩ দিনের বেশি অনুপস্থিত থাকায় সাময়িক ভর্তি বাতিল নিয়মের আওতায় এসেছে। পুনর্বহালের জন্য অফিসে যোগাযোগ করুন। - দারুল উলূম মাদানিয়া',
      entry: 'মুহতারাম {guardian_name}, আপনার সন্তান {student_name} আজ {date} তারিখে {time} টায় মাদ্রাসায় প্রবেশ করেছে। - দারুল উলূম মাদানিয়া',
      exit: 'মুহতারাম {guardian_name}, আপনার সন্তান {student_name} আজ {date} তারিখে {time} টায় মাদ্রাসা থেকে প্রস্থান করেছে। - দারুল উলূম মাদানিয়া',
      missingExit: 'মুহতারাম {guardian_name}, আপনার সন্তান {student_name}-এর আজকের প্রস্থান (Exit Punch) রেকর্ড পাওয়া যায়নি। - দারুল উলূম মাদানিয়া',
    },
    individualStudentOverrides: {},
  },
};

export const DEFAULT_STUDENT_MARKING_CRITERIA: AttendanceMarkingCriteria[] = [
  {
    id: 'crit-default-pct',
    class: 'সব জামাত / সাধারণ',
    markingType: 'percentage',
    presentMark: 100,
    lateMark: 75,
    absentMark: 0,
    halfDayMark: 50,
    leaveMark: 100,
    effectiveFrom: '2026-01-01',
    createdBy: 'প্রশাসক'
  },
  {
    id: 'crit-nahbemir',
    class: 'নাহবেমীর',
    markingType: 'percentage',
    presentMark: 100,
    lateMark: 75,
    absentMark: 0,
    halfDayMark: 50,
    leaveMark: 100,
    effectiveFrom: '2026-01-01',
    createdBy: 'প্রশাসক'
  },
  {
    id: 'crit-saraf-1',
    class: 'সরফ-১',
    markingType: 'fixed_points',
    presentMark: 10,
    lateMark: 7,
    absentMark: 0,
    halfDayMark: 5,
    leaveMark: 10,
    effectiveFrom: '2026-01-01',
    createdBy: 'প্রশাসক'
  }
];

export const DEFAULT_TEACHER_SALARY_RULE: TeacherSalaryRule = {
  id: 'rule-default',
  teacherId: 'default',
  baseSalary: 18000,
  dailyDeductionAbsent: 600,
  dailyDeductionLate: 100,
  deductionPerHourLate: 150,
  attendanceBonusPercentage: 5,
  perfectAttendanceBonus: 1000,
  minWorkingHours: 8,
  maxWorkingHours: 9,
  otRate: 150,
  effectiveFrom: '2026-01-01'
};

export const DEFAULT_STAFF_LEAVE_ALLOCATIONS = {
  casual: 12,
  sick: 10,
  emergency: 5
};
