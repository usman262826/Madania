import React, { useState, useMemo } from 'react';
import { 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Filter, 
  Download, 
  Printer, 
  Search, 
  Eye, 
  Activity, 
  Award, 
  Phone, 
  ShieldCheck, 
  Edit3,
  ChevronRight, 
  RefreshCw, 
  FileSpreadsheet, 
  X, 
  Radio, 
  Layers, 
  Sparkles, 
  TrendingUp, 
  Check, 
  Zap,
  ArrowRight,
  CalendarDays,
  Hash,
  MapPin,
  Smartphone
} from 'lucide-react';
import { Student } from '../../types';
import { StudentAttendanceRecord, RawPunchRecord, AttendanceSettings } from '../../types/attendance';
import { enToBnNumber, cn, formatDateToDDMMYYYY } from '../../lib/utils';
import { getDailyAttendanceDb, getRawPunches, getAttendanceSettings } from '../../services/attendanceEngine';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface StudentAttendanceReportModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  madrasahBranding?: {
    name?: string;
    arabicName?: string;
    subTitle?: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
    website?: string;
  };
}

export const StudentAttendanceReportModal: React.FC<StudentAttendanceReportModalProps> = ({
  student,
  isOpen,
  onClose,
  defaultDate,
  madrasahBranding
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const initialDate = defaultDate || todayStr;

  // Filter Modes: 'single_day' | 'range' | 'monthly' | 'raw_punches'
  const [filterMode, setFilterMode] = useState<'single_day' | 'range' | 'monthly' | 'raw_punches'>('single_day');
  
  // Single day date
  const [selectedSingleDate, setSelectedSingleDate] = useState<string>(initialDate);

  // Range dates
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(todayStr);

  // Monthly date
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });

  // Expanded day details in table
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const sId = String(student?.id || student?.['রেজিস্ট্রেশন/আইডি নম্বর'] || '');
  const sName = student?.['শিক্ষার্থীর নাম'] || student?.name || 'শিক্ষার্থী';
  const sRoll = student?.['রোল নম্বর'] || student?.roll || '—';
  const sClass = student?.['জামাত/শ্রেণী'] || student?.class || '—';
  const sCategory = student?.category || student?.['ক্যাটাগরি'] || 'অনাবাসিক';
  const sDepartment = student?.['বিভাগ'] || student?.department || 'সাধারণ';
  const sPhone = student?.['অভিভাবকের মোবাইল'] || student?.['মোবাইল'] || student?.guardianPhone || student?.phone || '—';

  const dailyDb = getDailyAttendanceDb();
  const rawPunches = getRawPunches();
  const settings = getAttendanceSettings();

  // 1. Single Day Record
  const singleDayRecord: StudentAttendanceRecord | undefined = dailyDb[selectedSingleDate]?.[sId];

  // 2. Student's Raw Punches for Selected Single Date
  const singleDateRawPunches = useMemo(() => {
    if (!sId) return [];
    return rawPunches.filter(p => {
      const matchUser = String(p.userId) === sId || String(p.studentId) === sId;
      const punchDate = p.punchTime ? p.punchTime.split(' ')[0] : '';
      return matchUser && punchDate === selectedSingleDate;
    }).sort((a, b) => (a.punchTime || '').localeCompare(b.punchTime || ''));
  }, [rawPunches, sId, selectedSingleDate]);

  // 3. Range / Monthly Records calculation
  const periodRecords = useMemo(() => {
    if (!sId) return [];
    const recordsMap: Array<{ date: string; record?: StudentAttendanceRecord; punches: RawPunchRecord[] }> = [];

    let startD: Date;
    let endD: Date;

    if (filterMode === 'monthly') {
      const [y, m] = (selectedMonth || '2026-08').split('-').map(Number);
      startD = new Date(y, m - 1, 1);
      endD = new Date(y, m, 0); // Last day of month
    } else {
      startD = new Date(fromDate || todayStr);
      endD = new Date(toDate || todayStr);
    }

    const cur = new Date(startD);
    while (cur <= endD) {
      const dStr = cur.toISOString().split('T')[0];
      const rec = dailyDb[dStr]?.[sId];
      
      const dayPunches = rawPunches.filter(p => {
        const matchUser = String(p.userId) === sId || String(p.studentId) === sId;
        const pDate = p.punchTime ? p.punchTime.split(' ')[0] : '';
        return matchUser && pDate === dStr;
      }).sort((a, b) => (a.punchTime || '').localeCompare(b.punchTime || ''));

      recordsMap.push({
        date: dStr,
        record: rec,
        punches: dayPunches
      });

      cur.setDate(cur.getDate() + 1);
    }

    // Sort descending by date
    return recordsMap.sort((a, b) => b.date.localeCompare(a.date));
  }, [filterMode, selectedMonth, fromDate, toDate, dailyDb, rawPunches, sId, todayStr]);

  // Summary Statistics for period
  const periodStats = useMemo(() => {
    let totalDays = periodRecords.length;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let totalPunches = 0;
    let totalMarks = 0;

    periodRecords.forEach(({ record, punches }) => {
      totalPunches += (record?.totalPunches || punches.length || 0);
      if (record) {
        if (record.status === 'present') presentCount++;
        else if (record.status === 'late') lateCount++;
        else absentCount++;

        totalMarks += (record.attendanceMark || 0);
      } else if (punches.length > 0) {
        presentCount++;
        totalMarks += 10;
      } else {
        absentCount++;
      }
    });

    const activePresent = presentCount + lateCount;
    const presentPercentage = totalDays > 0 ? Math.round((activePresent / totalDays) * 100) : 0;

    return {
      totalDays,
      presentCount,
      lateCount,
      absentCount,
      activePresent,
      totalPunches,
      totalMarks,
      presentPercentage
    };
  }, [periodRecords]);

  // All student's raw punches across time
  const allStudentRawPunches = useMemo(() => {
    if (!sId) return [];
    return rawPunches.filter(p => {
      return String(p.userId) === sId || String(p.studentId) === sId;
    }).sort((a, b) => (b.punchTime || '').localeCompare(a.punchTime || ''));
  }, [rawPunches, sId]);

  // Early return after all hooks have executed
  if (!isOpen || !student) return null;

  // Handle Export to Excel
  const handleExportExcel = () => {
    try {
      const exportData = periodRecords.map(item => {
        const d = item.date;
        const rec = item.record;
        const statusStr = rec?.status === 'present' ? 'উপস্থিত' : 
                          rec?.status === 'late' ? 'দেরিতে উপস্থিত' : 
                          rec?.status === 'temporarily_cancelled' ? 'সাময়িক বাতিল' : 'অনুপস্থিত';
        return {
          'তারিখ': d,
          'শিক্ষার্থীর আইডি': sId,
          'শিক্ষার্থীর নাম': sName,
          'জামাত/শ্রেণী': sClass,
          'রোল': sRoll,
          'ক্যাটাগরি': sCategory,
          'স্ট্যাটাস': statusStr,
          'প্রথম প্রবেশের সময় (Entry)': rec?.firstEntryTime || (item.punches[0]?.punchTime?.split(' ')[1] || '—'),
          'সর্বশেষ প্রস্থানের সময় (Exit)': rec?.lastExitTime || '—',
          'মোট পাঞ্চ সংখ্যা': rec?.totalPunches || item.punches.length || 0,
          'লেট (মিনিট)': rec?.isLate ? rec.lateMinutes : 0,
          'প্রাপ্ত মার্কস': rec?.attendanceMark ?? (rec?.status === 'present' ? 10 : 0)
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
      XLSX.writeFile(wb, `${sName}_হাজিরা_রিপোর্ট_${selectedSingleDate}.xlsx`);
      toast.success('হাজিরা রিপোর্ট সফলভাবে এক্সপোর্ট হয়েছে!');
    } catch (e) {
      toast.error('এক্সপোর্ট করতে সমস্যা হয়েছে!');
    }
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[var(--color-card)] rounded-2xl md:rounded-3xl border border-[var(--color-border-main)] max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-[var(--color-border-main)] bg-[var(--color-bg)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-2xs">
              <User size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base md:text-lg text-[var(--color-text-main)]">
                  {sName} — ব্যক্তিগত হাজিরা ও পাঞ্চ রিপোর্ট
                </h3>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  sCategory === 'আবাসিক' 
                    ? "bg-purple-500/10 text-purple-600 border-purple-500/20" 
                    : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                )}>
                  {sCategory}
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-2 text-[11px] text-[var(--color-text-light)] font-mono">
                <span>আইডি: <strong className="text-[var(--color-text-main)]">{sId}</strong></span>
                <span>•</span>
                <span>রোল: <strong className="text-[var(--color-text-main)]">{enToBnNumber(sRoll)}</strong></span>
                <span>•</span>
                <span>জামাত: <strong className="text-[var(--color-text-main)]">{sClass}</strong></span>
                {sPhone !== '—' && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Phone size={10} />
                      {sPhone}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border-main)] hover:bg-teal-500/10 hover:text-teal-600 text-[var(--color-text-main)] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
              title="Excel এক্সপোর্ট করুন"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span className="hidden sm:inline">Excel এক্সপোর্ট</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-border-main)] hover:bg-[var(--color-border-main)] text-[var(--color-text-main)] transition-all shadow-2xs"
              title="প্রিন্ট করুন"
            >
              <Printer size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-border-main)] hover:bg-rose-500/10 hover:text-rose-600 text-[var(--color-text-light)] transition-all shadow-2xs"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* NAVIGATION & FILTER TABS */}
        <div className="px-5 py-2.5 bg-[var(--color-card)] border-b border-[var(--color-border-main)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[var(--color-bg)] p-1 rounded-xl border border-[var(--color-border-main)] text-xs font-bold">
            <button
              onClick={() => setFilterMode('single_day')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                filterMode === 'single_day' 
                  ? "bg-teal-600 text-white shadow-2xs" 
                  : "text-[var(--color-text-light)] hover:text-[var(--color-text-main)]"
              )}
            >
              <Calendar size={13} />
              <span>নির্বাচিত দিবস (ডিফল্ট)</span>
            </button>
            <button
              onClick={() => setFilterMode('range')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                filterMode === 'range' 
                  ? "bg-teal-600 text-white shadow-2xs" 
                  : "text-[var(--color-text-light)] hover:text-[var(--color-text-main)]"
              )}
            >
              <CalendarDays size={13} />
              <span>তারিখ রেঞ্জ</span>
            </button>
            <button
              onClick={() => setFilterMode('monthly')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                filterMode === 'monthly' 
                  ? "bg-teal-600 text-white shadow-2xs" 
                  : "text-[var(--color-text-light)] hover:text-[var(--color-text-main)]"
              )}
            >
              <TrendingUp size={13} />
              <span>মাসিক হিস্ট্রি</span>
            </button>
            <button
              onClick={() => setFilterMode('raw_punches')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                filterMode === 'raw_punches' 
                  ? "bg-teal-600 text-white shadow-2xs" 
                  : "text-[var(--color-text-light)] hover:text-[var(--color-text-main)]"
              )}
            >
              <Radio size={13} />
              <span>বায়োমেট্রিক লগস</span>
            </button>
          </div>

          {/* Filter Controls Depending on Mode */}
          <div className="flex items-center gap-2">
            {filterMode === 'single_day' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[var(--color-text-light)]">তারিখ:</span>
                <input
                  type="date"
                  value={selectedSingleDate}
                  onChange={(e) => setSelectedSingleDate(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-bold text-[var(--color-text-main)] shadow-2xs outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  onClick={() => setSelectedSingleDate(todayStr)}
                  className="px-2 py-1 rounded-lg bg-[var(--color-bg)] hover:bg-[var(--color-border-main)] text-[10px] font-bold text-teal-600 dark:text-teal-400 border border-[var(--color-border-main)]"
                >
                  আজ
                </button>
              </div>
            )}

            {filterMode === 'range' && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-[11px] font-bold text-[var(--color-text-light)]">হতে:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-2 py-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-bold text-[var(--color-text-main)]"
                />
                <span className="text-[11px] font-bold text-[var(--color-text-light)]">পর্যন্ত:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-2 py-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-bold text-[var(--color-text-main)]"
                />
              </div>
            )}

            {filterMode === 'monthly' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[var(--color-text-light)]">মাস:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-bold text-[var(--color-text-main)] shadow-2xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          
          {/* ========================================================================= */}
          {/* TAB 1: SINGLE DAY DETAILED REPORT (DEFAULT VIEW) */}
          {/* ========================================================================= */}
          {filterMode === 'single_day' && (
            <div className="space-y-5">
              
              {/* Daily Highlights Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Status Card */}
                <div className={cn(
                  "p-3.5 rounded-2xl border flex flex-col justify-between shadow-2xs",
                  singleDayRecord?.status === 'present' ? "bg-emerald-500/5 border-emerald-500/20" :
                  singleDayRecord?.status === 'late' ? "bg-amber-500/5 border-amber-500/20" :
                  singleDayRecord?.status === 'temporarily_cancelled' ? "bg-red-500/10 border-red-500/30" :
                  "bg-rose-500/5 border-rose-500/20"
                )}>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[var(--color-text-light)]">উপস্থিতি স্ট্যাটাস</span>
                    {singleDayRecord?.status === 'present' ? <CheckCircle2 size={16} className="text-emerald-600" /> :
                     singleDayRecord?.status === 'late' ? <Clock size={16} className="text-amber-600" /> :
                     <XCircle size={16} className="text-rose-600" />}
                  </div>
                  <div className="mt-2">
                    <span className={cn(
                      "text-base md:text-lg font-bold block",
                      singleDayRecord?.status === 'present' ? "text-emerald-700 dark:text-emerald-300" :
                      singleDayRecord?.status === 'late' ? "text-amber-700 dark:text-amber-300" :
                      singleDayRecord?.status === 'temporarily_cancelled' ? "text-red-700 dark:text-red-300" :
                      "text-rose-700 dark:text-rose-300"
                    )}>
                      {singleDayRecord?.status === 'present' ? 'উপস্থিত (Present)' :
                       singleDayRecord?.status === 'late' ? 'দেরিতে উপস্থিত (Late)' :
                       singleDayRecord?.status === 'temporarily_cancelled' ? 'সাময়িক বাতিল' :
                       'অনুপস্থিত (Absent)'}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-light)] block">
                      {selectedSingleDate === todayStr ? 'আজকের দিবস' : formatDateToDDMMYYYY(selectedSingleDate)}
                    </span>
                    {(() => {
                      const isManual = singleDayRecord?.markedBy === 'ADMIN_MANUAL' || (singleDayRecord?.timeline && singleDayRecord.timeline.some(t => t.type === 'manual'));
                      const isDevice = !isManual && (singleDayRecord?.totalPunches && singleDayRecord.totalPunches > 0 || (singleDayRecord?.markedBy === 'TIPSOI_API' && (singleDayRecord?.status === 'present' || singleDayRecord?.status === 'late')));

                      if (isDevice) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 whitespace-nowrap mt-1.5 shadow-2xs">
                            <ShieldCheck size={11} className="text-teal-600 dark:text-teal-400" />
                            <span>ডিভাইস ভেরিফাইড</span>
                          </span>
                        );
                      }
                      if (isManual) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap mt-1.5 shadow-2xs">
                            <Edit3 size={11} className="text-amber-600 dark:text-amber-400" />
                            <span>ম্যানুয়াল এন্ট্রি</span>
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* First Entry (In) Card */}
                <div className="p-3.5 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border-main)] flex flex-col justify-between shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[var(--color-text-light)]">
                    <span>প্রথম প্রবেশ (Entry)</span>
                    <Clock size={15} className="text-teal-600" />
                  </div>
                  <div className="mt-2">
                    <span className="text-base md:text-lg font-mono font-bold text-teal-700 dark:text-teal-300 block">
                      {singleDayRecord?.firstEntryTime || (singleDateRawPunches[0]?.punchTime ? singleDateRawPunches[0].punchTime.split(' ')[1] : '—')}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-light)]">
                      {singleDayRecord?.isLate ? (
                        <span className="text-amber-600 font-bold">+{enToBnNumber(singleDayRecord.lateMinutes)} মি. লেট</span>
                      ) : singleDayRecord?.firstEntryTime ? (
                        <span className="text-emerald-600 font-bold">যথাসময়ে প্রবেশ</span>
                      ) : 'কোনো পাঞ্চ নেই'}
                    </span>
                  </div>
                </div>

                {/* Last Exit (Out) Card */}
                <div className="p-3.5 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border-main)] flex flex-col justify-between shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[var(--color-text-light)]">
                    <span>সর্বশেষ প্রস্থান (Exit)</span>
                    <ArrowRight size={15} className="text-indigo-600" />
                  </div>
                  <div className="mt-2">
                    <span className="text-base md:text-lg font-mono font-bold text-indigo-700 dark:text-indigo-300 block">
                      {singleDayRecord?.lastExitTime || '—'}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-light)]">
                      {singleDayRecord?.lastExitTime ? (
                        <span className="text-indigo-600 font-bold">প্রস্থান সম্পন্ন</span>
                      ) : singleDayRecord?.isMissingExit ? (
                        <span className="text-rose-500 font-bold">আউট পাঞ্চ মিসিং</span>
                      ) : 'অনাবাসিক প্রস্থান'}
                    </span>
                  </div>
                </div>

                {/* Total Punches & Marks Card */}
                <div className="p-3.5 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border-main)] flex flex-col justify-between shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[var(--color-text-light)]">
                    <span>মোট পাঞ্চ সংখ্যা</span>
                    <Zap size={15} className="text-amber-600" />
                  </div>
                  <div className="mt-2">
                    <span className="text-base md:text-lg font-mono font-bold text-[var(--color-text-main)] block">
                      {enToBnNumber(singleDayRecord?.totalPunches || singleDateRawPunches.length || 0)} বার
                    </span>
                    <span className="text-[10px] text-[var(--color-text-light)]">
                      প্রাপ্ত মার্কস: <strong className="text-teal-600">{enToBnNumber(singleDayRecord?.attendanceMark ?? (singleDayRecord?.status === 'present' ? 10 : 0))}</strong>
                    </span>
                  </div>
                </div>

              </div>

              {/* Detailed Punch Timeline (কখন কখন পাশ করলো / পাঞ্চ করলো) */}
              <div className="bg-[var(--color-bg)] rounded-2xl border border-[var(--color-border-main)] p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--color-border-main)] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-teal-600" />
                    <h4 className="font-bold text-xs md:text-sm text-[var(--color-text-main)]">
                      উক্ত দিবসের বায়োমেট্রিক পাঞ্চ ইভেন্ট ও টাইমলাইন তালিকা ({formatDateToDDMMYYYY(selectedSingleDate)}):
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                    মোট পাঞ্চ: {enToBnNumber(singleDayRecord?.timeline?.length || singleDateRawPunches.length || 0)} টি
                  </span>
                </div>

                {/* Timeline items list */}
                {(() => {
                  const timeline = singleDayRecord?.timeline || [];
                  const rawList = singleDateRawPunches;

                  if (timeline.length === 0 && rawList.length === 0) {
                    return (
                      <div className="p-8 text-center bg-[var(--color-card)] rounded-xl border border-[var(--color-border-main)]">
                        <AlertCircle size={24} className="mx-auto text-gray-400 mb-2 opacity-60" />
                        <div className="text-xs font-bold text-[var(--color-text-main)]">
                          {selectedSingleDate} তারিখে এই শিক্ষার্থীর কোনো বায়োমেট্রিক পাঞ্চ রেকর্ড পাওয়া যায়নি।
                        </div>
                        <p className="text-[11px] text-[var(--color-text-light)] mt-1">
                          শিক্ষার্থী সেদিন মাদ্রাসায় অনুপস্থিত ছিলেন অথবা ডিভাইসে পাঞ্চ করেননি।
                        </p>
                      </div>
                    );
                  }

                  // Prefer structured timeline or map raw punches
                  const displayItems = timeline.length > 0 ? timeline : rawList.map((rp, idx) => ({
                    time: rp.punchTime ? rp.punchTime.split(' ')[1] : '—',
                    type: (idx % 2 === 0 ? 'entry' : 'exit') as any,
                    device: rp.deviceName || rp.deviceId || 'টিপসই ডিভাইস',
                    note: idx === 0 ? 'সকালের প্রবেশ পাঞ্চ' : 'প্রস্থান পাঞ্চ'
                  }));

                  return (
                    <div className="space-y-2">
                      {displayItems.map((item, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-all shadow-2xs",
                            item.type === 'entry' && "bg-teal-500/5 border-teal-500/20 text-teal-900 dark:text-teal-200",
                            item.type === 'exit' && "bg-indigo-500/5 border-indigo-500/20 text-indigo-900 dark:text-indigo-200",
                            item.type === 'duplicate' && "bg-gray-500/5 border-gray-500/20 text-gray-500 opacity-70",
                            item.type === 'manual' && "bg-amber-500/5 border-amber-500/20 text-amber-900 dark:text-amber-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-[var(--color-card)] border border-[var(--color-border-main)] flex items-center justify-center font-mono font-bold text-[11px] text-[var(--color-text-main)] shrink-0">
                              {enToBnNumber(idx + 1)}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-[var(--color-text-main)]">
                                {item.time}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                item.type === 'entry' ? "bg-teal-600 text-white" :
                                item.type === 'exit' ? "bg-indigo-600 text-white" :
                                item.type === 'manual' ? "bg-amber-600 text-white" :
                                "bg-gray-400 text-white"
                              )}>
                                {item.type === 'entry' ? 'প্রবেশ (IN)' :
                                 item.type === 'exit' ? 'প্রস্থান (OUT)' :
                                 item.type === 'manual' ? 'ম্যানুয়াল এন্ট্রি' : 'ডুপ্লিকেট'}
                              </span>
                            </div>

                            <span className="font-medium text-[11px] text-[var(--color-text-main)]">
                              {item.note || (item.type === 'entry' ? 'মাদ্রাসায় প্রবেশ রেকর্ড' : 'মাদ্রাসা প্রস্থান রেকর্ড')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-light)] font-mono pl-9 sm:pl-0">
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-teal-600" />
                              {item.device || 'বায়োমেট্রিক গেট-০১'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Admission & Absence Consecutive tracking */}
              {singleDayRecord && singleDayRecord.consecutiveAbsenceDays > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-900 dark:text-amber-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-600" />
                    <span>
                      টানা অনুপস্থিতি ট্র্যাকিং: <strong>{enToBnNumber(singleDayRecord.consecutiveAbsenceDays)} দিন</strong>
                    </span>
                  </div>
                  {singleDayRecord.isAdmissionCancelled && (
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">
                      ভর্তি সাময়িক স্থগিত/বাতিল
                    </span>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2 & 3: DATE RANGE / MONTHLY HISTORIC REPORT */}
          {/* ========================================================================= */}
          {(filterMode === 'range' || filterMode === 'monthly') && (
            <div className="space-y-5">
              
              {/* Period Stats Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-[var(--color-text-light)] uppercase block">মোট দিবস</span>
                  <span className="text-base md:text-lg font-bold text-[var(--color-text-main)] block mt-0.5">
                    {enToBnNumber(periodStats.totalDays)} দিন
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">উপস্থিতি</span>
                  <span className="text-base md:text-lg font-bold text-emerald-700 dark:text-emerald-300 block mt-0.5">
                    {enToBnNumber(periodStats.presentCount)} দিন
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase block">দেরি (Late)</span>
                  <span className="text-base md:text-lg font-bold text-amber-700 dark:text-amber-300 block mt-0.5">
                    {enToBnNumber(periodStats.lateCount)} দিন
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase block">অনুপস্থিত</span>
                  <span className="text-base md:text-lg font-bold text-rose-700 dark:text-rose-300 block mt-0.5">
                    {enToBnNumber(periodStats.absentCount)} দিন
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-center shadow-2xs col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase block">উপস্থিতির হার</span>
                  <span className="text-base md:text-lg font-bold text-teal-800 dark:text-teal-200 block mt-0.5">
                    {enToBnNumber(periodStats.presentPercentage)}%
                  </span>
                </div>
              </div>

              {/* Day-by-Day Table */}
              <div className="bg-[var(--color-bg)] rounded-2xl border border-[var(--color-border-main)] overflow-hidden shadow-2xs">
                <div className="p-3.5 border-b border-[var(--color-border-main)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={15} className="text-teal-600" />
                    <span className="font-bold text-xs text-[var(--color-text-main)]">
                      দিনভিত্তিক বিস্তারিত হাজিরা ও পাঞ্চ রেকর্ড:
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--color-text-light)]">
                    মোট {enToBnNumber(periodRecords.length)} টি তারিখ তালিকাভুক্ত
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[var(--color-card)] border-b border-[var(--color-border-main)] font-bold text-[var(--color-text-main)]">
                        <th className="p-2.5 text-center w-10">#</th>
                        <th className="p-2.5">তারিখ</th>
                        <th className="p-2.5">১ম প্রবেশ (In)</th>
                        <th className="p-2.5">সর্বশেষ প্রস্থান (Out)</th>
                        <th className="p-2.5 text-center">পাঞ্চ সংখ্যা</th>
                        <th className="p-2.5 text-center">স্ট্যাটাস</th>
                        <th className="p-2.5 text-center">উৎস</th>
                        <th className="p-2.5 text-center">দেরি (মি.)</th>
                        <th className="p-2.5 text-center">মার্ক</th>
                        <th className="p-2.5 text-right">পাঞ্চ বিবরণ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-main)]">
                      {periodRecords.map((item, index) => {
                        const rec = item.record;
                        const isExpanded = expandedDate === item.date;
                        const firstIn = rec?.firstEntryTime || (item.punches[0]?.punchTime ? item.punches[0].punchTime.split(' ')[1] : null);
                        const lastOut = rec?.lastExitTime || null;
                        const totalPunches = rec?.totalPunches || item.punches.length || 0;
                        const status = rec?.status || (totalPunches > 0 ? 'present' : 'absent');

                        return (
                          <React.Fragment key={item.date}>
                            <tr className={cn(
                              "hover:bg-[var(--color-card)]/80 transition-colors",
                              status === 'absent' && "bg-rose-500/5",
                              status === 'late' && "bg-amber-500/5"
                            )}>
                              <td className="p-2.5 text-center font-mono text-[11px] text-[var(--color-text-light)]">
                                {enToBnNumber(index + 1)}
                              </td>
                              <td className="p-2.5 font-bold text-[var(--color-text-main)]">
                                {formatDateToDDMMYYYY(item.date)}
                              </td>
                              <td className="p-2.5 font-mono text-teal-700 dark:text-teal-300 font-bold">
                                {firstIn || <span className="text-gray-400 font-normal">—</span>}
                              </td>
                              <td className="p-2.5 font-mono text-indigo-700 dark:text-indigo-300 font-bold">
                                {lastOut || <span className="text-gray-400 font-normal">—</span>}
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[11px]",
                                  totalPunches > 0 ? "bg-teal-500/10 text-teal-700 dark:text-teal-300" : "text-gray-400"
                                )}>
                                  {enToBnNumber(totalPunches)} বার
                                </span>
                              </td>
                              <td className="p-2.5 text-center">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                                  status === 'present' && "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                                  status === 'late' && "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                                  status === 'absent' && "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                )}>
                                  {status === 'present' ? 'উপস্থিত' : status === 'late' ? 'দেরি' : 'অনুপস্থিত'}
                                </span>
                              </td>
                              <td className="p-2.5 text-center">
                                {(() => {
                                  const isManual = rec?.markedBy === 'ADMIN_MANUAL' || (rec?.timeline && rec.timeline.some(t => t.type === 'manual'));
                                  const isDevice = !isManual && (totalPunches > 0 || (rec?.markedBy === 'TIPSOI_API' && (status === 'present' || status === 'late')));

                                  if (isDevice) {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 whitespace-nowrap shadow-2xs">
                                        <ShieldCheck size={10} className="text-teal-600 dark:text-teal-400" />
                                        <span>ডিভাইস</span>
                                      </span>
                                    );
                                  }
                                  if (isManual) {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap shadow-2xs">
                                        <Edit3 size={10} className="text-amber-600 dark:text-amber-400" />
                                        <span>ম্যানুয়াল</span>
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="text-[10px] text-slate-400">—</span>
                                  );
                                })()}
                              </td>
                              <td className="p-2.5 text-center font-mono">
                                {rec?.isLate ? (
                                  <span className="text-amber-600 font-bold">+{enToBnNumber(rec.lateMinutes)}</span>
                                ) : (
                                  <span className="text-gray-400">০</span>
                                )}
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-teal-700 dark:text-teal-300">
                                {enToBnNumber(rec?.attendanceMark ?? (status === 'present' ? 10 : 0))}
                              </td>
                              <td className="p-2.5 text-right">
                                {totalPunches > 0 ? (
                                  <button
                                    onClick={() => setExpandedDate(isExpanded ? null : item.date)}
                                    className="px-2 py-1 rounded bg-[var(--color-card)] hover:bg-teal-500/10 text-teal-600 text-[10px] font-bold border border-[var(--color-border-main)] transition-all"
                                  >
                                    {isExpanded ? 'লুকান' : 'পাঞ্চ সমূহ'}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-gray-400">—</span>
                                )}
                              </td>
                            </tr>

                            {/* Expanded Punches for this date */}
                            {isExpanded && (
                              <tr className="bg-teal-500/5">
                                <td colSpan={9} className="p-3">
                                  <div className="p-3 bg-[var(--color-card)] rounded-xl border border-teal-500/20 space-y-2">
                                    <div className="text-[11px] font-bold text-[var(--color-text-main)] flex items-center gap-1.5">
                                      <Clock size={13} className="text-teal-600" />
                                      <span>{formatDateToDDMMYYYY(item.date)} তারিখের সকল পাঞ্চের বিস্তারিত টাইমলাইন:</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                      {item.punches.map((p, pIdx) => (
                                        <div key={p.id || pIdx} className="p-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border-main)] flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center font-mono text-[10px]">
                                              {enToBnNumber(pIdx + 1)}
                                            </span>
                                            <span className="font-mono font-bold text-[var(--color-text-main)]">
                                              {p.punchTime ? p.punchTime.split(' ')[1] : '—'}
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-[var(--color-text-light)]">
                                            {p.deviceName || 'মেইন গেট'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: RAW BIOMETRIC PUNCH LOGS */}
          {/* ========================================================================= */}
          {filterMode === 'raw_punches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-[var(--color-text-main)] flex items-center gap-2">
                  <Radio size={15} className="text-teal-600" />
                  <span>ক্লাউড ডিভাইস হতে সংগৃহীত অপরিবর্তনযোগ্য পাঞ্চ লগস (Raw Punches):</span>
                </div>
                <span className="text-[11px] font-bold text-teal-600 font-mono">
                  মোট {enToBnNumber(allStudentRawPunches.length)} টি পাঞ্চ লগ
                </span>
              </div>

              {allStudentRawPunches.length === 0 ? (
                <div className="p-10 text-center bg-[var(--color-bg)] rounded-2xl border border-[var(--color-border-main)] text-xs text-[var(--color-text-light)]">
                  বায়োমেট্রিক ডিভাইসে এই শিক্ষার্থীর কোনো পাঞ্চ হিস্ট্রি সংরক্ষিত নেই।
                </div>
              ) : (
                <div className="bg-[var(--color-bg)] rounded-2xl border border-[var(--color-border-main)] overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[var(--color-card)] border-b border-[var(--color-border-main)] font-bold text-[var(--color-text-main)]">
                        <th className="p-2.5 text-center w-10">#</th>
                        <th className="p-2.5">পাঞ্চের তারিখ ও সময়</th>
                        <th className="p-2.5">ডিভাইস আইডি / নাম</th>
                        <th className="p-2.5">ইউজার আইডি (Device)</th>
                        <th className="p-2.5">পাঞ্চ মাধ্যম</th>
                        <th className="p-2.5 text-center">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-main)] font-mono">
                      {allStudentRawPunches.map((rp, idx) => (
                        <tr key={rp.id || idx} className="hover:bg-[var(--color-card)]/60">
                          <td className="p-2.5 text-center text-[11px] text-[var(--color-text-light)]">
                            {enToBnNumber(idx + 1)}
                          </td>
                          <td className="p-2.5 font-bold text-[var(--color-text-main)]">
                            {rp.punchTime || rp.receivedTime}
                          </td>
                          <td className="p-2.5 text-[var(--color-text-light)]">
                            {rp.deviceName || rp.deviceId || 'টিপসই ডিভাইস'}
                          </td>
                          <td className="p-2.5 text-teal-700 dark:text-teal-300 font-bold">
                            {rp.userId}
                          </td>
                          <td className="p-2.5 text-[var(--color-text-light)] font-sans text-[11px]">
                            {rp.punchType || 'ফিঙ্গারপ্রিন্ট/কার্ড'}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold font-sans",
                              rp.processingStatus === 'processed' ? "bg-emerald-500/10 text-emerald-600" :
                              rp.processingStatus === 'duplicate_30s' ? "bg-gray-500/10 text-gray-500 line-through" :
                              "bg-amber-500/10 text-amber-600"
                            )}>
                              {rp.processingStatus === 'processed' ? 'সফল (Processed)' :
                               rp.processingStatus === 'duplicate_30s' ? 'ডুপ্লিকেট ফিল্টার্ড' : rp.processingStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 border-t border-[var(--color-border-main)] bg-[var(--color-bg)] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[var(--color-text-light)] font-medium">
            * বায়োমেট্রিক ডিভাইসে পাঞ্চ করার সাথে সাথে রিয়েল-টাইমে এই রিপোর্ট আপডেট হয়।
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </motion.div>
    </div>
  );
};
