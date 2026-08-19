import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  BookOpen, 
  Send, 
  Sliders, 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  Sparkles, 
  Award, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Eye, 
  HelpCircle, 
  ChevronRight, 
  AlertCircle,
  BarChart2,
  CalendarDays,
  ShieldCheck,
  Zap,
  Download,
  Radio,
  RefreshCw,
  FileText,
  Activity,
  History,
  Check,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Home,
  UserCheck
} from 'lucide-react';
import { Student } from '../../types';
import { 
  AttendanceMarkingCriteria, 
  StudentAttendanceRecord, 
  AttendanceMonthlySummary,
  DEFAULT_STUDENT_MARKING_CRITERIA,
  AttendanceSettings,
  RawPunchRecord,
  AttendanceAuditLog
} from '../../types/attendance';
import { useData } from '../../contexts/DataContext';
import { enToBnNumber, cn, isClassMatch, formatDateToDDMMYYYY } from '../../lib/utils';
import { calculateStudentMark, generateStudentAttendanceSMS } from '../../utils/attendanceCalculators';
import { TipsoiSyncModal } from './TipsoiSyncModal';
import { AttendanceMessaging } from './AttendanceMessaging';
import { StudentAttendanceReportModal } from './StudentAttendanceReportModal';
import { 
  getDailyAttendanceDb, 
  saveDailyAttendanceDb,
  getAttendanceSettings, 
  saveAttendanceSettings,
  getRawPunches,
  saveRawPunches,
  getAuditLogs,
  addAuditLog,
  getSyncStatusInfo,
  updateSyncStatusInfo,
  subscribeToAttendanceUpdates,
  processAttendanceEngine,
  updateStudentAttendanceManual,
  restoreCancelledStudentAdmission,
  parsePunchTime
} from '../../services/attendanceEngine';
import { fetchTipsoiAttendanceLogs } from '../../services/tipsoiAttendanceService';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

interface StudentAttendanceProps {
  students: Student[];
  initialTab?: 'daily' | 'criteria' | 'monthly_report' | 'profile' | 'messaging' | 'audit_logs' | 'settings';
}

export const StudentAttendance: React.FC<StudentAttendanceProps> = ({ 
  students, 
  initialTab = 'daily' 
}) => {
  const { jamatList, madrasahBranding } = useData();
  const [activeTab, setActiveTab] = useState<'daily' | 'criteria' | 'monthly_report' | 'profile' | 'messaging' | 'audit_logs' | 'settings'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Default date is strictly TODAY'S DATE (আজকের তারিখ)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedJamat, setSelectedJamat] = useState<string>('সব জামাত');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('সব বিভাগ');
  const [selectedCategory, setSelectedCategory] = useState<string>('সব ক্যাটাগরি');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('সব স্ট্যাটাস');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Real-time Database state
  const [dailyDb, setDailyDb] = useState<Record<string, Record<string, StudentAttendanceRecord>>>(() => getDailyAttendanceDb());
  const [settings, setSettings] = useState<AttendanceSettings>(() => getAttendanceSettings());
  const [syncInfo, setSyncInfo] = useState(() => getSyncStatusInfo());
  const [auditLogs, setAuditLogs] = useState<AttendanceAuditLog[]>(() => getAuditLogs());
  const [isSyncing, setIsSyncing] = useState(false);

  // Criteria State
  const [criteriaList, setCriteriaList] = useState<AttendanceMarkingCriteria[]>(() => {
    const saved = localStorage.getItem('madrasah_student_attendance_criteria');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_STUDENT_MARKING_CRITERIA;
  });

  // Modals & Drawers
  const [showTipsoiModal, setShowTipsoiModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<AttendanceMarkingCriteria | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  
  // Manual Modification Modal State
  const [manualEditStudent, setManualEditStudent] = useState<Student | null>(null);
  const [manualStatus, setManualStatus] = useState<'present' | 'absent' | 'late' | 'leave' | 'half-day' | 'temporarily_cancelled'>('present');
  const [manualReason, setManualReason] = useState('');
  const [manualAdminName, setManualAdminName] = useState('অফিস এডমিন');

  // Test Punch Simulation Modal State
  const [showTestPunchModal, setShowTestPunchModal] = useState(false);
  const [testPunchUserId, setTestPunchUserId] = useState(() => students[0]?.id || '101');
  const [testPunchTime, setTestPunchTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Subscribe to live background updates without page reload
  useEffect(() => {
    const unsubscribe = subscribeToAttendanceUpdates(() => {
      setDailyDb(getDailyAttendanceDb());
      setSettings(getAttendanceSettings());
      setSyncInfo(getSyncStatusInfo());
      setAuditLogs(getAuditLogs());
    });
    return () => unsubscribe();
  }, []);

  // Ensure today's attendance is synthesized if not present
  useEffect(() => {
    const raw = getRawPunches();
    processAttendanceEngine(raw, students, selectedDate, settings);
    setDailyDb(getDailyAttendanceDb());
  }, [selectedDate, students]);

  // Current selected day records
  const dayRecords = useMemo(() => {
    return dailyDb[selectedDate] || {};
  }, [dailyDb, selectedDate]);

  // Combined Student Table List with live record data
  const combinedList = useMemo(() => {
    return students.map(student => {
      const sId = String(student.id || student['রেজিস্ট্রーション/আইডি নম্বর'] || student['রেজিস্ট্রেশন/আইডি'] || student['আবেদন নং'] || '').trim();
      const rec = dayRecords[sId];
      const sCategory = student['ক্যাটাগরি'] || student.category || student['আবাসিক/অনাবাসিক'] || 'অনাবাসিক';

      return {
        student,
        record: rec || {
          id: `att_${sId}_${selectedDate}`,
          studentId: sId,
          studentName: student['শিক্ষার্থীর নাম'] || student.name || 'শিক্ষার্থী',
          roll: student['রোল নম্বর'] || student['রোল'] || student.roll || '',
          class: student['জামাত/শ্রেণী'] || student['জামাত'] || student.class || '',
          branch: student['শাখা'] || student.branch || '',
          department: student['বিভাগ'] || student.department || '',
          category: sCategory as any,
          attendanceDate: selectedDate,
          status: 'absent' as const,
          attendanceMark: 0,
          totalPunches: 0,
          validPunches: 0,
          totalEntries: 0,
          totalExits: 0,
          isLate: false,
          lateMinutes: 0,
          isMissingExit: false,
          isEarlyExit: false,
          consecutiveAbsenceDays: 1,
          timeline: [],
          markedBy: 'TIPSOI_API',
          markedAt: new Date().toISOString(),
        }
      };
    });
  }, [students, dayRecords, selectedDate]);

  // Filtered List
  const filteredList = useMemo(() => {
    return combinedList.filter(({ student, record }) => {
      // 1. Jamat Filter
      if (selectedJamat !== 'সব জামাত') {
        const sJamat = student['জামাত/শ্রেণী'] || student['জামাত'] || student.class;
        if (!isClassMatch(sJamat, selectedJamat)) return false;
      }

      // 2. Department Filter
      if (selectedDepartment !== 'সব বিভাগ') {
        const sDept = student['বিভাগ'] || student.department;
        if (sDept !== selectedDepartment) return false;
      }

      // 3. Category Filter (আবাসিক / অনাবাসিক)
      if (selectedCategory !== 'সব ক্যাটাগরি') {
        const sCat = student['ক্যাটাগরি'] || student.category || student['আবাসিক/অনাবাসিক'] || 'অনাবাসিক';
        if (sCat !== selectedCategory) return false;
      }

      // 4. Status Filter
      if (selectedStatusFilter !== 'সব স্ট্যাটাস') {
        if (selectedStatusFilter === 'present' && record.status !== 'present') return false;
        if (selectedStatusFilter === 'absent' && record.status !== 'absent') return false;
        if (selectedStatusFilter === 'late' && record.status !== 'late') return false;
        if (selectedStatusFilter === 'missing_exit' && !record.isMissingExit) return false;
        if (selectedStatusFilter === 'temporarily_cancelled' && record.status !== 'temporarily_cancelled') return false;
      }

      // 5. Search Term (Name / ID / Roll / Reg)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const sName = String(student['শিক্ষার্থীর নাম'] || student.name || '').toLowerCase();
        const sId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || student['রেজিস্ট্রেশন/আইডি'] || '').toLowerCase();
        const sRoll = String(student['রোল নম্বর'] || student['রোল'] || student.roll || '').toLowerCase();
        const sPhone = String(student['মোবাইল (বাবা/ভাই)'] || student.mobile || '').toLowerCase();
        
        if (!sName.includes(term) && !sId.includes(term) && !sRoll.includes(term) && !sPhone.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [combinedList, selectedJamat, selectedDepartment, selectedCategory, selectedStatusFilter, searchTerm]);

  // Statistics Summary for selected day
  const stats = useMemo(() => {
    const totalStudents = students.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let missingExitCount = 0;
    let cancelledCount = 0;
    let totalEntries = 0;
    let totalExits = 0;
    let residentialPresent = 0;
    let nonResidentialPresent = 0;

    combinedList.forEach(({ student, record }) => {
      const isRes = (student.category || student['ক্যাটাগরি'] || student['আবাসিক/অনাবাসিক']) === 'আবাসিক';

      if (record.status === 'present') {
        presentCount++;
        if (isRes) residentialPresent++;
        else nonResidentialPresent++;
      } else if (record.status === 'late') {
        presentCount++;
        lateCount++;
        if (isRes) residentialPresent++;
        else nonResidentialPresent++;
      } else if (record.status === 'temporarily_cancelled') {
        cancelledCount++;
        absentCount++;
      } else {
        absentCount++;
      }

      if (record.isMissingExit) missingExitCount++;
      totalEntries += (record.totalEntries || 0);
      totalExits += (record.totalExits || 0);
    });

    const presentPercentage = totalStudents > 0 ? Math.round(((presentCount) / totalStudents) * 100) : 0;

    return {
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      missingExitCount,
      cancelledCount,
      totalEntries,
      totalExits,
      residentialPresent,
      nonResidentialPresent,
      presentPercentage
    };
  }, [students, combinedList]);

  // Manual Trigger: Pull Tipsoi API Now
  const handleTriggerApiSync = async () => {
    setIsSyncing(true);
    toast.loading('টিপসই বায়োমেট্রিক ক্লাউড থেকে ডাটা সিঙ্ক হচ্ছে...', { id: 'sync-toast' });
    try {
      const { punches } = await fetchTipsoiAttendanceLogs(selectedDate);
      const raw = getRawPunches();
      const existingKeys = new Set(raw.map(r => `${r.userId}_${r.punchTime}`));

      let newCount = 0;
      punches.forEach(p => {
        const punchTime = p.logged_time || p.punch_time || p.time || p.sync_time || '';
        const userId = String(p.person_identifier || p.identifier || p.emp_id || p.user_id || p.card_no || '').trim();
        const key = `${userId}_${punchTime}`;

        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          raw.push({
            id: `raw_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            deviceId: String(p.device_identifier || 'TIPSOI-01'),
            deviceName: p.device_name || 'টিপসই স্মার্ট ডিভাইস',
            userId,
            userType: 'student',
            punchTime: punchTime || `${selectedDate} 08:00:00`,
            loggedTime: p.logged_time,
            syncTime: p.sync_time,
            receivedTime: new Date().toISOString(),
            punchType: p.punch_type || 'fingerprint',
            rawApiData: p.raw || p,
            processingStatus: 'processed',
          });
          newCount++;
        }
      });

      processAttendanceEngine(raw, students, selectedDate, settings);
      setDailyDb(getDailyAttendanceDb());

      updateSyncStatusInfo({
        connected: true,
        lastSyncTime: new Date().toISOString(),
        lastReceivedPunchTime: punches[punches.length - 1]?.punch_time || new Date().toISOString(),
        totalPunchesToday: punches.length,
        lastError: null,
      });

      toast.success(`সিঙ্ক সম্পন্ন! ${enToBnNumber(punches.length)}টি পাঞ্চ লগ প্রক্রিয়া করা হয়েছে (${enToBnNumber(newCount)}টি নতুন)।`, { id: 'sync-toast' });
    } catch (err: any) {
      toast.error(`সিঙ্ক ব্যর্থ: ${err?.message || 'নেটওয়ার্ক ত্রুটি'}`, { id: 'sync-toast' });
      updateSyncStatusInfo({
        connected: false,
        lastError: err?.message || 'নেটওয়ার্ক ত্রুটি',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Simulate Instant Test Biometric Punch
  const handleSimulateTestPunch = () => {
    const raw = getRawPunches();
    const timeFull = `${selectedDate} ${testPunchTime}:00`;

    const targetStudent = students.find(s => String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর']) === testPunchUserId);
    const userId = targetStudent ? String(targetStudent.id || targetStudent['রেজিস্ট্রেশন/আইডি নম্বর']) : testPunchUserId;

    raw.push({
      id: `raw_sim_${Date.now()}`,
      deviceId: 'TIPSOI-DEVICE-01',
      deviceName: 'টিপসই বায়োমেট্রিক ডিভাইস (ল্যাব/মেইন গেট)',
      userId,
      studentId: userId,
      userType: 'student',
      punchTime: timeFull,
      receivedTime: new Date().toISOString(),
      punchType: 'fingerprint',
      rawApiData: { simulated: true, time: timeFull },
      processingStatus: 'processed',
    });

    saveRawPunches(raw);
    processAttendanceEngine(raw, students, selectedDate, settings);
    setDailyDb(getDailyAttendanceDb());
    setShowTestPunchModal(false);
    toast.success(`টেস্ট পাঞ্চ সফলভাবে গৃহীত হয়েছে (${targetStudent?.name || userId})! রিয়েল-টাইমে টেবিল ও স্টেট আপডেট সম্পন্ন।`);
  };

  // Submit Manual Status Change with Audit Log
  const handleSaveManualAttendance = () => {
    if (!manualEditStudent) return;
    const sId = String(manualEditStudent.id || manualEditStudent['রেজিস্ট্রেশন/আইডি নম্বর']);
    
    updateStudentAttendanceManual(
      sId,
      selectedDate,
      manualStatus,
      manualReason || 'অফিসিয়াল কারণ',
      manualAdminName || 'এডমিন',
      students
    );

    setDailyDb(getDailyAttendanceDb());
    setManualEditStudent(null);
    setManualReason('');
    toast.success('হাজিরা স্ট্যাটাস সফলভাবে ম্যানুয়ালি আপডেট এবং অডিট লগে সংরক্ষণ করা হয়েছে!');
  };

  // Export to Excel (.xlsx) matching active filters
  const handleExportExcel = () => {
    const exportData = filteredList.map(({ student, record }, idx) => ({
      'ক্রমিক': enToBnNumber(idx + 1),
      'শিক্ষার্থীর নাম': student['শিক্ষার্থীর নাম'] || student.name,
      'আইডি/রেজি': student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || '',
      'রোল': student['রোল নম্বর'] || student.roll || '',
      'জামাত/শ্রেণী': student['জামাত/শ্রেণী'] || student.class || '',
      'বিভাগ': student['বিভাগ'] || student.department || '',
      'ক্যাটাগরি': student.category || 'অনাবাসিক',
      'তারিখ': record.attendanceDate,
      'প্রথম এন্ট্রি': record.firstEntryTime || '—',
      'শেষ এক্সিট': record.lastExitTime || '—',
      'মোট পাঞ্চ': enToBnNumber(record.totalPunches || 0),
      'দেরি (মিনিট)': record.isLate ? enToBnNumber(record.lateMinutes) : '০',
      'স্ট্যাটাস': record.status === 'present' ? 'উপস্থিত' : record.status === 'late' ? 'দেরিতে উপস্থিত' : record.status === 'temporarily_cancelled' ? 'সাময়িক বাতিল' : 'অনুপস্থিত',
      'মূল্যায়ন মার্কস': enToBnNumber(record.attendanceMark),
      'হাজিরার উৎস': record.markedBy === 'TIPSOI_API' ? 'টিপসই বায়োমেট্রিক' : 'ম্যানুয়াল এডমিন',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student_Attendance');
    XLSX.writeFile(wb, `Student_Attendance_${selectedDate}.xlsx`);
    toast.success('এক্সেল ফাইল সফলভাবে ডাউনলোড হয়েছে!');
  };

  // Export Printable PDF / Print View
  const handlePrintAttendance = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* TOP BAR & SYNC STATUS MONITOR */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <UserCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-main)]">
                  রিয়েল-টাইম শিক্ষার্থী বায়োমেট্রিক হাজিরা
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 text-[10px] font-bold border border-teal-500/20 animate-pulse">
                  লাইভ পাঞ্চ সিঙ্ক
                </span>
              </div>
              <p className="text-xs md:text-sm text-[var(--color-text-light)]">
                টিপসই API অটোমেটিক সিঙ্ক, ৩০ সেকেন্ড ডুপ্লিকেট ফিল্টার এবং ধারাবাহিক অনুপস্থিতি মনিটরিং
              </p>
            </div>
          </div>

          {/* Device Sync & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Live Connection Badge */}
            <div className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border",
              syncInfo.connected
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            )}>
              <div className={cn("w-2.5 h-2.5 rounded-full", syncInfo.connected ? "bg-emerald-500 animate-ping" : "bg-rose-500")} />
              <span>{syncInfo.connected ? "ডিভাইস কানেক্টেড (Live)" : "ডিভাইস সংযোগ বিচ্ছিন্ন"}</span>
            </div>

            {/* Test Punch Simulation Button */}
            <button
              onClick={() => setShowTestPunchModal(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1.5 border border-teal-500/30 transition-all"
            >
              <Zap size={14} className="text-amber-500" />
              <span>টেস্ট পাঞ্চ সিমুলেশন</span>
            </button>

            {/* Manual Sync Pull Button */}
            <button
              onClick={handleTriggerApiSync}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={14} className={cn(isSyncing && "animate-spin")} />
              <span>{isSyncing ? "সিঙ্ক হচ্ছে..." : "API রিফ্রেশ সিঙ্ক"}</span>
            </button>

            {/* Export Menu */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleExportExcel}
                className="p-2 rounded-xl bg-[var(--color-bg)] hover:bg-[var(--color-border-main)] text-emerald-600 border border-[var(--color-border-main)] transition-all"
                title="এক্সেল ডাউনলোড"
              >
                <FileSpreadsheet size={16} />
              </button>
              <button
                onClick={handlePrintAttendance}
                className="p-2 rounded-xl bg-[var(--color-bg)] hover:bg-[var(--color-border-main)] text-blue-600 border border-[var(--color-border-main)] transition-all"
                title="প্রিন্ট রিপোর্ট"
              >
                <Printer size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap gap-2 border-t border-[var(--color-border-main)] mt-5 pt-4">
          {[
            { id: 'daily', label: 'আজকের রিয়েল-টাইম হাজিরা তালিকা', icon: CalendarDays },
            { id: 'messaging', label: 'স্বয়ংক্রিয় SMS মেসেজিং ইঞ্জিন', icon: MessageSquare },
            { id: 'monthly_report', label: 'হাজিরা রিপোর্ট ও এনালিটিক্স', icon: BarChart2 },
            { id: 'criteria', label: 'মার্কিং ও মূল্যায়ন ক্রাইটেরিয়া', icon: Award },
            { id: 'audit_logs', label: `ম্যানুয়াল সংশোধন অডিট লগ (${enToBnNumber(auditLogs.length)})`, icon: History },
            { id: 'settings', label: 'হাজিরা রুল ইঞ্জিন সেটিংস', icon: SlidersHorizontal },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
                  isActive
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "bg-[var(--color-bg)] hover:bg-[var(--color-border-main)] text-[var(--color-text-main)]"
                )}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: REAL-TIME DAILY ATTENDANCE TABLE & DASHBOARD */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* SECTION 1: TODAY'S REAL-TIME SUMMARY STAT CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 md:gap-4">
            {/* Total Students */}
            <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-4 shadow-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <Users size={22} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-[var(--color-text-light)]">মোট শিক্ষার্থী</div>
                <div className="text-xl md:text-2xl font-bold text-[var(--color-text-main)]">
                  {enToBnNumber(stats.totalStudents)}
                </div>
              </div>
            </div>

            {/* Present Count */}
            <div className="bg-[var(--color-card)] rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">মোট উপস্থিত ({enToBnNumber(stats.presentPercentage)}%)</div>
                <div className="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {enToBnNumber(stats.presentCount)}
                </div>
              </div>
            </div>

            {/* Absent Count */}
            <div className="bg-[var(--color-card)] rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center font-bold">
                <XCircle size={22} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-rose-700 dark:text-rose-400">মোট অনুপস্থিত</div>
                <div className="text-xl md:text-2xl font-bold text-rose-700 dark:text-rose-300">
                  {enToBnNumber(stats.absentCount)}
                </div>
              </div>
            </div>

            {/* Late Count */}
            <div className="bg-[var(--color-card)] rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                <Clock size={22} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400">দেরিতে উপস্থিত (Late)</div>
                <div className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {enToBnNumber(stats.lateCount)}
                </div>
              </div>
            </div>

            {/* Missing Exit / Residential Split */}
            <div className="bg-[var(--color-card)] rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold">
                <Home size={22} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-purple-700 dark:text-purple-400">আবাসিক / অনাবাসিক</div>
                <div className="text-sm font-bold text-purple-900 dark:text-purple-300">
                  আবা: {enToBnNumber(stats.residentialPresent)} | অনাবা: {enToBnNumber(stats.nonResidentialPresent)}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: INDEPENDENT MULTI-FILTER BAR */}
          <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-4 md:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[var(--color-text-main)] flex items-center gap-2">
                <Filter size={15} className="text-teal-600" />
                <span>হাজিরা ফিল্টারিং ও সার্চ প্যানেল</span>
              </div>
              
              {/* Quick Date Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                    selectedDate === todayStr ? "bg-teal-600 text-white" : "bg-[var(--color-bg)] text-[var(--color-text-main)]"
                  )}
                >
                  আজকের তারিখ
                </button>
                <button
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setSelectedDate(yesterday.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-[var(--color-bg)] hover:bg-[var(--color-border-main)] text-[var(--color-text-main)]"
                >
                  গতকাল
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* Date picker */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-light)] block mb-1">তারিখ নির্বাচন:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-bold text-[var(--color-text-main)]"
                />
              </div>

              {/* Jamat Filter */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-light)] block mb-1">জামাত / শ্রেণী:</label>
                <select
                  value={selectedJamat}
                  onChange={(e) => setSelectedJamat(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-medium"
                >
                  <option value="সব জামাত">সব জামাত</option>
                  {jamatList.map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-light)] block mb-1">বিভাগ:</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-medium"
                >
                  <option value="সব বিভাগ">সব বিভাগ</option>
                  <option value="হিফজুল কুরআন বিভাগ">হিফজুল কুরআন বিভাগ</option>
                  <option value="কিতাব বিভাগ">কিতাব বিভাগ</option>
                  <option value="নূরানী ও নাজেরা বিভাগ">নূরানী ও নাজেরা বিভাগ</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-light)] block mb-1">ক্যাটাগরি:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-medium"
                >
                  <option value="সব ক্যাটাগরি">সব ক্যাটাগরি</option>
                  <option value="আবাসিক">আবাসিক</option>
                  <option value="অনাবাসিক">অনাবাসিক</option>
                  <option value="ডে-কেয়ার">ডে-কেয়ার</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-light)] block mb-1">স্ট্যাটাস:</label>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-medium"
                >
                  <option value="সব স্ট্যাটাস">সব স্ট্যাটাস</option>
                  <option value="present">উপস্থিত (Present)</option>
                  <option value="absent">অনুপস্থিত (Absent)</option>
                  <option value="late">দেরিতে উপস্থিত (Late)</option>
                  <option value="missing_exit">প্রস্থান মিসিং (Missing Exit)</option>
                  <option value="temporarily_cancelled">সাময়িক বাতিল (Warning)</option>
                </select>
              </div>

              {/* Search Field */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-light)] block mb-1">সার্চ (নাম/আইডি/রোল):</label>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="খুঁজুন..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: REAL-TIME ATTENDANCE TABLE */}
          <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border-main)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-xs md:text-sm text-[var(--color-text-main)]">
                  {selectedDate === todayStr ? "আজকের লাইভ পাঞ্চ ডাটা" : `${selectedDate} তারিখের ডাটা`} — মোট {enToBnNumber(filteredList.length)} জন শিক্ষার্থী প্রদর্শিত
                </span>
              </div>

              <div className="text-[11px] text-[var(--color-text-light)] font-medium">
                সর্বশেষ পাঞ্চ আপডেট: {syncInfo.lastReceivedPunchTime ? syncInfo.lastReceivedPunchTime.slice(11, 19) : 'রিয়েল-টাইম সক্রিয়'}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border-main)] font-bold text-[var(--color-text-main)]">
                    <th className="p-3 text-center w-12">ক্রমিক</th>
                    <th className="p-3">শিক্ষার্থীর নাম ও আইডি</th>
                    <th className="p-3">জামাত ও রোল</th>
                    <th className="p-3">ক্যাটাগরি</th>
                    <th className="p-3">প্রথম প্রবেশ (Entry)</th>
                    <th className="p-3">সর্বশেষ পাঞ্চ</th>
                    <th className="p-3">প্রস্থান (Exit)</th>
                    <th className="p-3 text-center">স্ট্যাটাস</th>
                    <th className="p-3 text-center">দেরি (মিনিট)</th>
                    <th className="p-3 text-center">মোট পাঞ্চ</th>
                    <th className="p-3 text-right">একশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-main)]">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-10 text-center text-xs text-[var(--color-text-light)]">
                        কোন শিক্ষার্থী পাওয়া যায়নি। ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
                      </td>
                    </tr>
                  ) : (
                    filteredList.map(({ student, record }, index) => {
                      const sId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || '');
                      const sRoll = student['রোল নম্বর'] || student.roll || '—';
                      const sClass = student['জামাত/শ্রেণী'] || student.class || '—';
                      const sCat = student.category || student['ক্যাটাগরি'] || 'অনাবাসিক';

                      return (
                        <tr 
                          key={sId || index} 
                          className={cn(
                            "hover:bg-[var(--color-bg)]/60 transition-colors",
                            record.isAdmissionCancelled && "bg-rose-500/5",
                            record.isLate && "bg-amber-500/5"
                          )}
                        >
                          {/* Index */}
                          <td className="p-3 text-center font-mono text-[11px] text-[var(--color-text-light)]">
                            {enToBnNumber(index + 1)}
                          </td>

                          {/* Name & ID */}
                          <td className="p-3">
                            <div 
                              onClick={() => setSelectedStudentForReport(student)}
                              className="font-bold text-[var(--color-text-main)] hover:text-teal-600 cursor-pointer flex items-center gap-1.5"
                            >
                              <span>{student['শিক্ষার্থীর নাম'] || student.name}</span>
                              {record.isAdmissionCancelled && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-bold">
                                  সাময়িক বাতিল
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--color-text-light)] font-mono">
                              আইডি: {sId}
                            </div>
                          </td>

                          {/* Jamat & Roll */}
                          <td className="p-3">
                            <div className="font-semibold text-[var(--color-text-main)]">{sClass}</div>
                            <div className="text-[10px] text-[var(--color-text-light)] font-mono">রোল: {enToBnNumber(sRoll)}</div>
                          </td>

                          {/* Category */}
                          <td className="p-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              sCat === 'আবাসিক' ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"
                            )}>
                              {sCat}
                            </span>
                          </td>

                          {/* First Entry */}
                          <td className="p-3 font-mono font-bold text-teal-700 dark:text-teal-300">
                            {record.firstEntryTime ? (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                {record.firstEntryTime}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-normal">—</span>
                            )}
                          </td>

                          {/* Last Punch */}
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                            {record.lastPunchTime || '—'}
                          </td>

                          {/* Exit */}
                          <td className="p-3 font-mono">
                            {record.lastExitTime ? (
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                {record.lastExitTime}
                              </span>
                            ) : record.isMissingExit ? (
                              <span className="text-rose-500 text-[10px] font-bold">মিসিং (Out নেই)</span>
                            ) : (
                              <span className="text-gray-400 font-normal">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-3 text-center">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                              record.status === 'present' && "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                              record.status === 'late' && "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                              record.status === 'absent' && "bg-rose-500/10 text-rose-600 border border-rose-500/20",
                              record.status === 'temporarily_cancelled' && "bg-red-600 text-white font-bold"
                            )}>
                              {record.status === 'present' && <CheckCircle2 size={11} />}
                              {record.status === 'late' && <Clock size={11} />}
                              {record.status === 'absent' && <XCircle size={11} />}
                              {record.status === 'present' ? 'উপস্থিত' : record.status === 'late' ? 'দেরিতে উপস্থিত' : record.status === 'temporarily_cancelled' ? 'সাময়িক বাতিল' : 'অনুপস্থিত'}
                            </span>
                          </td>

                          {/* Late Minutes */}
                          <td className="p-3 text-center font-mono">
                            {record.isLate ? (
                              <span className="text-amber-600 font-bold">
                                +{enToBnNumber(record.lateMinutes)} মি.
                              </span>
                            ) : (
                              <span className="text-gray-400">০</span>
                            )}
                          </td>

                          {/* Total Punches */}
                          <td className="p-3 text-center font-mono font-bold">
                            <span className="px-2 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border-main)]">
                              {enToBnNumber(record.totalPunches || 0)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Individual Student Attendance Report */}
                              <button
                                onClick={() => setSelectedStudentForReport(student)}
                                className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-600 hover:text-white text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center gap-1 transition-all border border-teal-500/20 shadow-2xs cursor-pointer"
                                title="ব্যক্তিগত সকল হাজিরা ও পাঞ্চ রিপোর্ট দেখুন"
                              >
                                <Eye size={13} />
                                <span>ভিউ</span>
                              </button>

                              {/* Manual Edit Button */}
                              <button
                                onClick={() => {
                                  setManualEditStudent(student);
                                  setManualStatus(record.status);
                                  setManualReason('');
                                }}
                                className="p-1.5 rounded-lg bg-[var(--color-bg)] hover:bg-amber-500/10 hover:text-amber-600 text-[var(--color-text-light)] transition-all border border-[var(--color-border-main)]"
                                title="ম্যানুয়াল সংশোধন"
                              >
                                <Edit3 size={14} />
                              </button>

                              {/* Restore Admission Button if cancelled */}
                              {record.isAdmissionCancelled && (
                                <button
                                  onClick={() => {
                                    restoreCancelledStudentAdmission(sId, 'এডমিন', 'মঞ্জুরীকৃত পুনর্বহাল', students);
                                    setDailyDb(getDailyAttendanceDb());
                                    toast.success('শিক্ষার্থীর ভর্তি সফলভাবে পুনর্বহাল করা হয়েছে!');
                                  }}
                                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-2xs"
                                  title="ভর্তি পুনর্বহাল করুন"
                                >
                                  পুনর্বহাল
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: AUTOMATIC MESSAGING ENGINE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'messaging' && (
        <AttendanceMessaging students={students} />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: ATTENDANCE REPORTS & ANALYTICS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'monthly_report' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--color-text-main)] mb-4 flex items-center gap-2">
              <BarChart2 className="text-teal-600" size={20} />
              মাসিক ও জামাতভিত্তিক উপস্থিতি পরিসংখ্যান ও এনালিটিক্স
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jamat-wise attendance bar chart */}
              <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)]">
                <div className="text-xs font-bold text-[var(--color-text-main)] mb-3">
                  জামাতভিত্তিক আজকের উপস্থিতির শতকরা হার (%)
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={jamatList.slice(0, 8).map(j => {
                        const inJamat = combinedList.filter(c => isClassMatch(c.student['জামাত/শ্রেণী'] || c.student.class, j));
                        const presentInJamat = inJamat.filter(c => c.record.status === 'present' || c.record.status === 'late').length;
                        const pct = inJamat.length > 0 ? Math.round((presentInJamat / inJamat.length) * 100) : 0;
                        return {
                          name: j.slice(0, 10),
                          উপস্থিতি_হার: pct,
                        };
                      })}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="উপস্থিতি_হার" fill="#0d555c" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category-wise Pie Chart */}
              <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] flex flex-col justify-between">
                <div className="text-xs font-bold text-[var(--color-text-main)] mb-3">
                  আবাসিক বনাম অনাবাসিক উপস্থিতি অনুপাত
                </div>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'আবাসিক উপস্থিত', value: stats.residentialPresent, color: '#8b5cf6' },
                          { name: 'অনাবাসিক উপস্থিত', value: stats.nonResidentialPresent, color: '#0d9488' },
                          { name: 'মোট অনুপস্থিত', value: stats.absentCount, color: '#ef4444' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#0d9488" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: MARKING CRITERIA */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'criteria' && (
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--color-text-main)] flex items-center gap-2">
              <Award className="text-teal-600" size={18} />
              হাজিরা মার্কিং ও মূল্যায়ন ক্রাইটেরিয়া
            </h3>
            <button
              onClick={() => {
                setEditingCriteria({
                  id: `crit_${Date.now()}`,
                  class: 'সব জামাত / সাধারণ',
                  markingType: 'percentage',
                  presentMark: 100,
                  lateMark: 75,
                  absentMark: 0,
                  halfDayMark: 50,
                  leaveMark: 100,
                  effectiveFrom: selectedDate,
                });
                setShowCriteriaModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>নতুন ক্রাইটেরিয়া যোগ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {criteriaList.map(crit => (
              <div key={crit.id} className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--color-text-main)]">{crit.class}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/20">
                    {crit.markingType}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border-main)] text-center shadow-2xs">
                    <span className="text-[10px] text-[var(--color-text-light)] block font-medium">উপস্থিত:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 text-xs font-mono">{enToBnNumber(crit.presentMark)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border-main)] text-center shadow-2xs">
                    <span className="text-[10px] text-[var(--color-text-light)] block font-medium">দেরি:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-300 text-xs font-mono">{enToBnNumber(crit.lateMark)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border-main)] text-center shadow-2xs">
                    <span className="text-[10px] text-[var(--color-text-light)] block font-medium">অনুপস্থিত:</span>
                    <span className="font-bold text-rose-700 dark:text-rose-300 text-xs font-mono">{enToBnNumber(crit.absentMark)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: MANUAL MODIFICATION AUDIT LOGS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'audit_logs' && (
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--color-text-main)] flex items-center gap-2">
              <History className="text-teal-600" size={18} />
              হাজিরা ম্যানুয়াল পরিবর্তন ও অডিট লগ খতিয়ান ({enToBnNumber(auditLogs.length)}টি)
            </h3>
          </div>

          <div className="overflow-x-auto border border-[var(--color-border-main)] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border-main)] font-bold text-[var(--color-text-main)]">
                  <th className="p-3">তারিখ ও সময়</th>
                  <th className="p-3">শিক্ষার্থীর নাম</th>
                  <th className="p-3">পরিবর্তনকারী</th>
                  <th className="p-3">পূর্ববর্তী স্ট্যাটাস</th>
                  <th className="p-3">নতুন স্ট্যাটাস</th>
                  <th className="p-3">পরিবর্তনের কারণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-main)]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-[var(--color-text-light)]">
                      কোন ম্যানুয়াল পরিবর্তন বা অডিট রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[var(--color-bg)]/50">
                      <td className="p-3 font-mono text-[11px] text-[var(--color-text-light)]">{log.modifiedAt.replace('T', ' ').slice(0, 19)}</td>
                      <td className="p-3 font-bold text-[var(--color-text-main)]">{log.studentName}</td>
                      <td className="p-3 font-medium text-teal-600 dark:text-teal-400">{log.modifiedBy}</td>
                      <td className="p-3 font-mono text-gray-500">{log.previousStatus || '—'}</td>
                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{log.newStatus}</td>
                      <td className="p-3 text-[var(--color-text-main)]">{log.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: CENTRAL ATTENDANCE SETTINGS & RULE ENGINE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'settings' && (
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-6 shadow-sm space-y-6 max-w-4xl">
          <h3 className="text-lg font-bold text-[var(--color-text-main)] flex items-center gap-2">
            <SlidersHorizontal className="text-teal-600" size={20} />
            সেন্ট্রাল হাজিরা রুল ইঞ্জিন ও শিডিউল কনফিগারেশন
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General & Window Settings */}
            <div className="p-5 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border-main)] space-y-4 shadow-xs">
              <div className="font-bold text-xs text-[var(--color-text-main)] flex items-center gap-2">
                <Clock size={16} className="text-teal-600" />
                <span>সাধারণ হাজিরা উইন্ডো:</span>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--color-text-light)]">উইন্ডো শুরুর সময়:</label>
                <input
                  type="time"
                  value={settings.general.windowStart}
                  onChange={(e) => {
                    const updated = { ...settings, general: { ...settings.general, windowStart: e.target.value } };
                    setSettings(updated);
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border-main)] text-xs font-mono font-bold text-[var(--color-text-main)] focus:outline-hidden focus:ring-1 focus:ring-teal-500 shadow-2xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--color-text-light)]">উইন্ডো সমাপ্তির সময়:</label>
                <input
                  type="time"
                  value={settings.general.windowEnd}
                  onChange={(e) => {
                    const updated = { ...settings, general: { ...settings.general, windowEnd: e.target.value } };
                    setSettings(updated);
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border-main)] text-xs font-mono font-bold text-[var(--color-text-main)] focus:outline-hidden focus:ring-1 focus:ring-teal-500 shadow-2xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--color-text-light)]">৩০ সেকেন্ড ডুপ্লিকেট পাঞ্চ ফিল্টার (সেকেন্ড):</label>
                <input
                  type="number"
                  value={settings.general.duplicateThresholdSeconds}
                  onChange={(e) => {
                    const updated = { ...settings, general: { ...settings.general, duplicateThresholdSeconds: Number(e.target.value) } };
                    setSettings(updated);
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border-main)] text-xs font-mono font-bold text-[var(--color-text-main)] focus:outline-hidden focus:ring-1 focus:ring-teal-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Student Standard Times */}
            <div className="p-5 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border-main)] space-y-4 shadow-xs">
              <div className="font-bold text-xs text-[var(--color-text-main)] flex items-center gap-2">
                <Users size={16} className="text-teal-600" />
                <span>শিক্ষার্থী এন্ট্রি ও লেইট রুল:</span>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--color-text-light)]">স্ট্যান্ডার্ড এন্ট্রি টাইম:</label>
                <input
                  type="time"
                  value={settings.student.standardEntry}
                  onChange={(e) => {
                    const updated = { ...settings, student: { ...settings.student, standardEntry: e.target.value } };
                    setSettings(updated);
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border-main)] text-xs font-mono font-bold text-[var(--color-text-main)] focus:outline-hidden focus:ring-1 focus:ring-teal-500 shadow-2xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--color-text-light)]">অনুপস্থিতি সতর্কবার্তা (দিন):</label>
                <input
                  type="number"
                  value={settings.student.warningAbsenceDays}
                  onChange={(e) => {
                    const updated = { ...settings, student: { ...settings.student, warningAbsenceDays: Number(e.target.value) } };
                    setSettings(updated);
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border-main)] text-xs font-mono font-bold text-[var(--color-text-main)] focus:outline-hidden focus:ring-1 focus:ring-teal-500 shadow-2xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--color-text-light)]">সাময়িক ভর্তি বাতিল সীমা (দিন):</label>
                <input
                  type="number"
                  value={settings.student.cancellationAbsenceDays}
                  onChange={(e) => {
                    const updated = { ...settings, student: { ...settings.student, cancellationAbsenceDays: Number(e.target.value) } };
                    setSettings(updated);
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border-main)] text-xs font-mono font-bold text-[var(--color-text-main)] focus:outline-hidden focus:ring-1 focus:ring-teal-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              saveAttendanceSettings(settings);
              toast.success('হাজিরা সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
            }}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            রুল ইঞ্জিন সেটিংস সংরক্ষণ করুন
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 0: INDIVIDUAL STUDENT ATTENDANCE & PUNCH REPORT MODAL */}
      {/* ------------------------------------------------------------- */}
      {selectedStudentForReport && (
        <StudentAttendanceReportModal
          student={selectedStudentForReport}
          isOpen={!!selectedStudentForReport}
          onClose={() => setSelectedStudentForReport(null)}
          defaultDate={selectedDate}
          madrasahBranding={madrasahBranding}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: STUDENT PROFILE PUNCH TIMELINE DRAWER */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {selectedStudentForProfile && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-base text-[var(--color-text-main)]">
                    {selectedStudentForProfile['শিক্ষার্থীর নাম'] || selectedStudentForProfile.name}
                  </h3>
                  <p className="text-xs text-[var(--color-text-light)] font-mono">
                    আইডি: {selectedStudentForProfile.id} | রোল: {selectedStudentForProfile.roll || '—'} | {selectedStudentForProfile.class}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudentForProfile(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                >
                  ✕
                </button>
              </div>

              {/* Today's Punch Timeline */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[var(--color-text-main)] flex items-center gap-1.5">
                  <Activity size={14} className="text-teal-600" />
                  <span>দৈনিক পাঞ্চ টাইমলাইন ও ইভেন্ট রেকর্ড ({selectedDate}):</span>
                </div>

                {(() => {
                  const sId = String(selectedStudentForProfile.id || selectedStudentForProfile['রেজিস্ট্রেশন/আইডি নম্বর']);
                  const rec = dayRecords[sId];
                  const timeline = rec?.timeline || [];

                  if (timeline.length === 0) {
                    return (
                      <div className="p-6 text-center text-xs text-[var(--color-text-light)] bg-[var(--color-bg)] rounded-xl">
                        আজকের তারিখে কোনো বায়োমেট্রিক পাঞ্চ পাওয়া যায়নি (অনুপস্থিত)।
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {timeline.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "p-2.5 rounded-xl border flex items-center justify-between text-xs",
                            item.type === 'entry' && "bg-teal-500/5 border-teal-500/20 text-teal-900 dark:text-teal-200",
                            item.type === 'exit' && "bg-indigo-500/5 border-indigo-500/20 text-indigo-900 dark:text-indigo-200",
                            item.type === 'duplicate' && "bg-gray-500/5 border-gray-500/20 text-gray-500 line-through opacity-70"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{item.time}</span>
                            <span className="font-semibold">{item.note || item.type}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">{item.device || 'ডিভাইস'}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedStudentForProfile(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--color-bg)] text-xs font-bold text-[var(--color-text-main)]"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: MANUAL ATTENDANCE CORRECTION WITH AUDIT LOG */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {manualEditStudent && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-base text-[var(--color-text-main)]">
                    ম্যানুয়াল হাজিরা সংশোধন
                  </h3>
                  <p className="text-xs text-[var(--color-text-light)]">
                    {manualEditStudent['শিক্ষার্থীর নাম'] || manualEditStudent.name}
                  </p>
                </div>
                <button
                  onClick={() => setManualEditStudent(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-main)] block mb-1">স্ট্যাটাস নির্ধারণ:</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-bold"
                  >
                    <option value="present">উপস্থিত (Present)</option>
                    <option value="late">দেরিতে উপস্থিত (Late)</option>
                    <option value="absent">অনুপস্থিত (Absent)</option>
                    <option value="leave">ছুটি (Leave)</option>
                    <option value="half-day">অর্ধদিবস (Half-Day)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--color-text-main)] block mb-1">পরিবর্তনের কারণ (অডিট লগের জন্য বাধ্যতামূলক):</label>
                  <textarea
                    rows={2}
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    placeholder="যেমন: অভিভাবকের ফোন আবেদন / ডিভাইস মিসিং"
                    className="w-full p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--color-text-main)] block mb-1">অনুমোদনকারী কর্মকর্তা:</label>
                  <input
                    type="text"
                    value={manualAdminName}
                    onChange={(e) => setManualAdminName(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => setManualEditStudent(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--color-bg)] text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleSaveManualAttendance}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2.5: CRITERIA EDIT / ADD MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showCriteriaModal && editingCriteria && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border-main)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <Award size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-text-main)]">
                      হাজিরা মার্কিং ক্রাইটেরিয়া কনফিগারেশন
                    </h3>
                    <p className="text-[11px] text-[var(--color-text-light)]">
                      জামাত ভিত্তিক উপস্থিতির নম্বর নির্ধারণ
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCriteriaModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-main)] block mb-1">জামাত / শ্রেণী:</label>
                  <input
                    type="text"
                    value={editingCriteria.class}
                    onChange={(e) => setEditingCriteria({ ...editingCriteria, class: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-bold text-[var(--color-text-main)]"
                    placeholder="যেমন: হিফজ বিভাগ / সব জামাত"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block mb-1">উপস্থিত মার্ক:</label>
                    <input
                      type="number"
                      value={editingCriteria.presentMark}
                      onChange={(e) => setEditingCriteria({ ...editingCriteria, presentMark: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-mono font-bold text-[var(--color-text-main)] text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block mb-1">দেরি মার্ক:</label>
                    <input
                      type="number"
                      value={editingCriteria.lateMark}
                      onChange={(e) => setEditingCriteria({ ...editingCriteria, lateMark: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-mono font-bold text-[var(--color-text-main)] text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block mb-1">অনুপস্থিত:</label>
                    <input
                      type="number"
                      value={editingCriteria.absentMark}
                      onChange={(e) => setEditingCriteria({ ...editingCriteria, absentMark: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-mono font-bold text-[var(--color-text-main)] text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-main)]">
                <button
                  onClick={() => setShowCriteriaModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--color-bg)] text-xs font-bold text-[var(--color-text-main)]"
                >
                  বাতিল
                </button>
                <button
                  onClick={() => {
                    const exists = criteriaList.find(c => c.id === editingCriteria.id);
                    const updated = exists 
                      ? criteriaList.map(c => c.id === editingCriteria.id ? editingCriteria : c)
                      : [...criteriaList, editingCriteria];
                    setCriteriaList(updated);
                    localStorage.setItem('madrasah_student_attendance_criteria', JSON.stringify(updated));
                    setShowCriteriaModal(false);
                    toast.success('ক্রাইটেরিয়া সফলভাবে সংরক্ষিত হয়েছে!');
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: TEST BIOMETRIC PUNCH SIMULATOR */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showTestPunchModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-text-main)]">
                      বায়োমেট্রিক পাঞ্চ সিমুলেটর (ল্যাব টেস্ট)
                    </h3>
                    <p className="text-[11px] text-[var(--color-text-light)]">
                      ইনস্ট্যান্ট পাঞ্চ পাঠিয়ে ৩০-সেকেন্ড ফিল্টার ও রিয়েল-টাইম টেবিল পরীক্ষা করুন
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTestPunchModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-main)] block mb-1">শিক্ষার্থী নির্বাচন:</label>
                  <select
                    value={testPunchUserId}
                    onChange={(e) => setTestPunchUserId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-medium"
                  >
                    {students.slice(0, 30).map(s => (
                      <option key={s.id} value={String(s.id)}>
                        {s['শিক্ষার্থীর নাম'] || s.name} ({s['জামাত/শ্রেণী'] || s.class}) - আইডি: {s.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--color-text-main)] block mb-1">পাঞ্চ সময় (HH:MM):</label>
                  <input
                    type="time"
                    value={testPunchTime}
                    onChange={(e) => setTestPunchTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => setShowTestPunchModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--color-bg)] text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleSimulateTestPunch}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Zap size={14} />
                  <span>পাঞ্চ ইনজেক্ট করুন</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
