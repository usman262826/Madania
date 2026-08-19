import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Printer, 
  FileSpreadsheet, 
  Radio, 
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { TeacherAttendanceRecord, StaffAttendanceRecord } from '../../types/attendance';
import { enToBnNumber, cn, formatDateToDDMMYYYY } from '../../lib/utils';
import * as XLSX from 'xlsx';

interface TeacherStaffAttendanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: {
    id: string;
    name: string;
    designation?: string;
    department?: string;
    mobile?: string;
    salary?: number;
    type: 'teacher' | 'staff';
  } | null;
  selectedDate: string;
  allRecords: (TeacherAttendanceRecord | StaffAttendanceRecord)[];
  madrasahBranding?: {
    name?: string;
    nameEnglish?: string;
    address?: string;
    logo?: string;
    phone?: string;
  };
}

export const TeacherStaffAttendanceReportModal: React.FC<TeacherStaffAttendanceReportModalProps> = ({
  isOpen,
  onClose,
  person,
  selectedDate,
  allRecords,
  madrasahBranding
}) => {
  // Always declare all hooks at the top unconditionally
  const [reportType, setReportType] = useState<'daily' | 'range' | 'monthly' | 'raw_punches'>('daily');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date(selectedDate || new Date().toISOString().split('T')[0]);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date(selectedDate || new Date().toISOString().split('T')[0]);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });

  // Filter records belonging to this person
  const personRecords = useMemo(() => {
    if (!person || !person.id) return [];
    return allRecords.filter(r => {
      const recPersonId = (r as TeacherAttendanceRecord).teacherId || (r as StaffAttendanceRecord).staffId;
      return String(recPersonId) === String(person.id);
    });
  }, [person, allRecords]);

  // Daily record for the selected date
  const selectedDayRecord = useMemo(() => {
    if (!person || !person.id) return null;
    return personRecords.find(r => r.attendanceDate === selectedDate) || null;
  }, [personRecords, selectedDate]);

  // Range or Monthly records
  const filteredRangeRecords = useMemo(() => {
    if (!person) return [];
    if (reportType === 'monthly') {
      return personRecords.filter(r => r.attendanceDate.startsWith(selectedMonth));
    }
    if (reportType === 'range') {
      return personRecords.filter(r => r.attendanceDate >= customStartDate && r.attendanceDate <= customEndDate);
    }
    return personRecords;
  }, [personRecords, reportType, selectedMonth, customStartDate, customEndDate]);

  // Statistics calculation
  const stats = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let leave = 0;
    let weeklyOff = 0;
    let totalWorkingHours = 0;
    let totalOvertimeHours = 0;
    let totalDeductions = 0;

    filteredRangeRecords.forEach(r => {
      if (r.status === 'present') present++;
      else if (r.status === 'late') { late++; present++; }
      else if (r.status === 'absent') absent++;
      else if (r.status === 'leave') leave++;
      else if ((r as any).isWeeklyOff || (r as any).status === 'weekly_off') weeklyOff++;

      const wh = (r as TeacherAttendanceRecord).workingHours || (r as StaffAttendanceRecord).totalHours || 0;
      const ot = r.overtimeHours || 0;
      const ded = r.deductionAmount || 0;

      totalWorkingHours += wh;
      totalOvertimeHours += ot;
      totalDeductions += ded;
    });

    const totalDays = filteredRangeRecords.length;
    const attendancePercentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    return {
      totalDays,
      present,
      late,
      absent,
      leave,
      weeklyOff,
      totalWorkingHours: Number(totalWorkingHours.toFixed(1)),
      totalOvertimeHours: Number(totalOvertimeHours.toFixed(1)),
      totalDeductions,
      attendancePercentage
    };
  }, [filteredRangeRecords]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!person || filteredRangeRecords.length === 0) return;

    const dataToExport = filteredRangeRecords.map((r, idx) => ({
      'ক্রমিক': idx + 1,
      'তারিখ': formatDateToDDMMYYYY(r.attendanceDate),
      'নাম': person.name,
      'পদবী': person.designation || '',
      'বিভাগ': person.department || '',
      'উপস্থিতি স্ট্যাটাস': r.status === 'present' ? 'উপস্থিত' : r.status === 'late' ? 'দেরিতে উপস্থিত' : r.status === 'leave' ? 'ছুটি' : 'অনুপস্থিত',
      'প্রবেশ সময় (In)': r.inTime || '—',
      'প্রস্থান সময় (Out)': r.outTime || '—',
      'মোট কর্মঘণ্টা': (r as TeacherAttendanceRecord).workingHours || (r as StaffAttendanceRecord).totalHours || 0,
      'ওভারটাইম': r.overtimeHours || 0,
      'কর্তন (টাকা)': r.deductionAmount || 0,
      'মন্তব্য': r.remarks || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance_Report');
    XLSX.writeFile(wb, `${person.name}_${reportType}_attendance_report.xlsx`);
  };

  if (!isOpen || !person) return null;

  const isTeacher = person.type === 'teacher';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-hind-siliguri animate-fade-in print:p-0 print:bg-white">
      <div className="bg-card w-full max-w-4xl rounded-3xl border border-border-main shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-main flex items-center justify-between bg-step-bg print:hidden">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black shadow-md",
              isTeacher ? "bg-emerald-600 shadow-emerald-600/20" : "bg-primary shadow-primary/20"
            )}>
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-text-main leading-tight">
                  {person.name}
                </h3>
                <span className={cn(
                  "px-2.5 py-0.5 text-[10px] font-black rounded-full border",
                  isTeacher 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                )}>
                  {isTeacher ? 'শিক্ষক / ওস্তাদ' : 'স্টাফ / কর্মচারী'}
                </span>
              </div>
              <p className="text-xs text-text-light/70 font-bold mt-0.5">
                {person.designation || 'কর্মকর্তা'} • {person.department || 'সাধারণ বিভাগ'} • আইডি: {person.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="p-2.5 rounded-xl border border-border-main bg-card hover:bg-step-bg text-emerald-600 transition-colors cursor-pointer"
              title="এক্সেল ডাউনলোড"
            >
              <FileSpreadsheet size={16} />
            </button>
            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl border border-border-main bg-card hover:bg-step-bg text-text-main transition-colors cursor-pointer"
              title="প্রিন্ট করুন"
            >
              <Printer size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl border border-border-main bg-card hover:bg-border-main/50 text-text-light hover:text-text-main transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          
          {/* Printable Madrasah Letterhead */}
          <div className="hidden print:block text-center border-b pb-4 mb-4">
            <h2 className="text-2xl font-black text-black">{madrasahBranding?.name || 'মাদরাসা বায়োমেট্রিক হাজিরা সিস্টেম'}</h2>
            <p className="text-sm text-gray-600">{madrasahBranding?.address || ''}</p>
            <h3 className="text-lg font-black mt-2 underline">{person.name} এর ব্যক্তিগত বায়োমেট্রিক হাজিরা রিপোর্ট</h3>
            <p className="text-xs text-gray-500 mt-1">পদবী: {person.designation} | বিভাগ: {person.department} | আইডি: {person.id}</p>
          </div>

          {/* Filter Controls (Screen Only) */}
          <div className="bg-step-bg p-4 rounded-2xl border border-border-main space-y-3 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Tab selector */}
              <div className="flex items-center p-1 bg-card border border-border-main rounded-xl">
                <button
                  type="button"
                  onClick={() => setReportType('daily')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                    reportType === 'daily'
                      ? "bg-primary text-white shadow-xs"
                      : "text-text-light hover:text-text-main"
                  )}
                >
                  দৈনিক রিপোর্ট ({selectedDate})
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('monthly')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                    reportType === 'monthly'
                      ? "bg-primary text-white shadow-xs"
                      : "text-text-light hover:text-text-main"
                  )}
                >
                  মাসিক সারসংক্ষেপ
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('range')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                    reportType === 'range'
                      ? "bg-primary text-white shadow-xs"
                      : "text-text-light hover:text-text-main"
                  )}
                >
                  তারিখের রেঞ্জ
                </button>
              </div>

              {/* Dynamic Filter Inputs */}
              {reportType === 'monthly' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-light">মাস নির্বাচন:</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-1.5 bg-card border border-border-main rounded-xl text-xs font-black text-text-main outline-none"
                  />
                </div>
              )}

              {reportType === 'range' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-light">হতে:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1 bg-card border border-border-main rounded-xl text-xs font-black text-text-main outline-none"
                  />
                  <span className="text-xs font-bold text-text-light">পর্যন্ত:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1 bg-card border border-border-main rounded-xl text-xs font-black text-text-main outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Daily View Mode */}
          {reportType === 'daily' && (
            <div className="space-y-4">
              {selectedDayRecord ? (
                <div className="space-y-4">
                  {/* Daily Highlight Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-card border border-border-main rounded-2xl">
                      <span className="text-[11px] font-black text-text-light/60 uppercase block">স্ট্যাটাস</span>
                      <span className={cn(
                        "inline-block mt-1 px-2.5 py-1 rounded-xl text-xs font-black",
                        selectedDayRecord.status === 'present' ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" :
                        selectedDayRecord.status === 'late' ? "bg-amber-500/15 text-amber-600 border border-amber-500/30" :
                        selectedDayRecord.status === 'leave' ? "bg-blue-500/15 text-blue-600 border border-blue-500/30" :
                        "bg-red-500/15 text-red-600 border border-red-500/30"
                      )}>
                        {selectedDayRecord.status === 'present' ? 'উপস্থিত' :
                         selectedDayRecord.status === 'late' ? 'দেরিতে উপস্থিত' :
                         selectedDayRecord.status === 'leave' ? 'ছুটিতে' : 'অনুপস্থিত'}
                      </span>
                    </div>

                    <div className="p-4 bg-card border border-border-main rounded-2xl">
                      <span className="text-[11px] font-black text-text-light/60 uppercase block">প্রবেশ (In-Time)</span>
                      <span className="text-lg font-black text-text-main mt-1 block font-mono">
                        {selectedDayRecord.inTime || '—'}
                      </span>
                    </div>

                    <div className="p-4 bg-card border border-border-main rounded-2xl">
                      <span className="text-[11px] font-black text-text-light/60 uppercase block">প্রস্থান (Out-Time)</span>
                      <span className="text-lg font-black text-text-main mt-1 block font-mono">
                        {selectedDayRecord.outTime || '—'}
                      </span>
                    </div>

                    <div className="p-4 bg-card border border-border-main rounded-2xl">
                      <span className="text-[11px] font-black text-text-light/60 uppercase block">মোট কাজের সময়</span>
                      <span className="text-lg font-black text-emerald-600 mt-1 block">
                        {enToBnNumber((selectedDayRecord as TeacherAttendanceRecord).workingHours || (selectedDayRecord as StaffAttendanceRecord).totalHours || 0)} ঘণ্টা
                      </span>
                    </div>
                  </div>

                  {/* Punch Details & Calculation Breakdown */}
                  <div className="p-4 bg-card border border-border-main rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-text-main flex items-center gap-2">
                      <Radio size={14} className="text-primary" />
                      বায়োমেট্রিক পাঞ্চ বিবরণ ও হিসাব
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-step-bg rounded-xl border border-border-main/60">
                        <span className="text-[10px] text-text-light/60 block uppercase font-bold">ওভারটাইম ঘণ্টা</span>
                        <span className="text-sm font-black text-text-main font-mono">
                          {enToBnNumber(selectedDayRecord.overtimeHours || 0)} ঘণ্টা
                        </span>
                      </div>
                      <div className="p-3 bg-step-bg rounded-xl border border-border-main/60">
                        <span className="text-[10px] text-text-light/60 block uppercase font-bold">দেরি বা অনুপস্থিতি কর্তন</span>
                        <span className="text-sm font-black text-red-600 font-mono">
                          ৳ {enToBnNumber(selectedDayRecord.deductionAmount || 0)}
                        </span>
                      </div>
                      <div className="p-3 bg-step-bg rounded-xl border border-border-main/60">
                        <span className="text-[10px] text-text-light/60 block uppercase font-bold">সিস্টেম মন্তব্য</span>
                        <span className="text-xs font-bold text-text-main truncate block">
                          {selectedDayRecord.remarks || 'স্বাভাবিক উপস্থিতি'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center border border-dashed border-border-main rounded-3xl bg-step-bg/40">
                  <Clock size={32} className="mx-auto text-text-light/40 mb-2" />
                  <p className="text-sm font-black text-text-main">
                    {selectedDate} তারিখে কোনো বায়োমেট্রিক হাজিরা পাওয়া যায়নি
                  </p>
                  <p className="text-xs text-text-light/60 mt-1">
                    ডিভাইসে পাঞ্চ না থাকলে অথবা সিঙ্ক না করা থাকলে এই তারিখের রেকর্ড খালি থাকবে।
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Range & Monthly Summary Statistics */}
          {(reportType === 'monthly' || reportType === 'range') && (
            <div className="space-y-4">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <span className="text-[10px] font-black text-emerald-600 uppercase block">উপস্থিত দিবস</span>
                  <span className="text-xl font-black text-emerald-600 mt-0.5 block">
                    {enToBnNumber(stats.present)} দিন
                  </span>
                </div>
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <span className="text-[10px] font-black text-amber-600 uppercase block">দেরিতে উপস্থিতি</span>
                  <span className="text-xl font-black text-amber-600 mt-0.5 block">
                    {enToBnNumber(stats.late)} দিন
                  </span>
                </div>
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <span className="text-[10px] font-black text-red-600 uppercase block">অনুপস্থিত দিবস</span>
                  <span className="text-xl font-black text-red-600 mt-0.5 block">
                    {enToBnNumber(stats.absent)} দিন
                  </span>
                </div>
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <span className="text-[10px] font-black text-blue-600 uppercase block">মোট ওভারটাইম</span>
                  <span className="text-xl font-black text-blue-600 mt-0.5 block">
                    {enToBnNumber(stats.totalOvertimeHours)} ঘণ্টা
                  </span>
                </div>
              </div>

              {/* Attendance Records Table */}
              <div className="border border-border-main rounded-2xl overflow-hidden bg-card">
                <div className="p-3 bg-step-bg border-b border-border-main flex items-center justify-between">
                  <span className="text-xs font-black text-text-main">
                    বিস্তারিত দৈনিক হাজিরার বিবরণী ({enToBnNumber(filteredRangeRecords.length)} টি রেকর্ড)
                  </span>
                  <span className="text-[11px] font-bold text-text-light/60">
                    উপস্থিতির হার: {enToBnNumber(stats.attendancePercentage)}%
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-border-main text-xs">
                  {filteredRangeRecords.length === 0 ? (
                    <div className="p-8 text-center text-text-light/50 font-bold">
                      নির্বাচিত সময়ে কোনো রেকর্ড পাওয়া যায়নি
                    </div>
                  ) : (
                    filteredRangeRecords.map((rec, i) => (
                      <div key={i} className="p-3 flex items-center justify-between hover:bg-step-bg/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-step-bg text-text-light font-bold text-[10px] flex items-center justify-center border border-border-main">
                            {i + 1}
                          </span>
                          <div>
                            <span className="font-black text-text-main block">
                              {formatDateToDDMMYYYY(rec.attendanceDate)}
                            </span>
                            <span className="text-[10px] text-text-light/60 font-mono">
                              ইন: {rec.inTime || '—'} | আউট: {rec.outTime || '—'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-text-light/70">
                            {enToBnNumber((rec as TeacherAttendanceRecord).workingHours || (rec as StaffAttendanceRecord).totalHours || 0)} ঘণ্টা
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-black rounded-lg",
                            rec.status === 'present' ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" :
                            rec.status === 'late' ? "bg-amber-500/15 text-amber-600 border border-amber-500/30" :
                            rec.status === 'leave' ? "bg-blue-500/15 text-blue-600 border border-blue-500/30" :
                            "bg-red-500/15 text-red-600 border border-red-500/30"
                          )}>
                            {rec.status === 'present' ? 'উপস্থিত' :
                             rec.status === 'late' ? 'দেরিতে' :
                             rec.status === 'leave' ? 'ছুটি' : 'অনুপস্থিত'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border-main bg-step-bg flex items-center justify-between print:hidden">
          <span className="text-xs font-bold text-text-light/60">
            রিয়েল-টাইম টিপসই বায়োমেট্রিক ডাটাবেস সমন্বয়
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-primary text-white font-black text-xs rounded-xl cursor-pointer hover:bg-primary-light transition-all"
          >
            সম্পন্ন করুন
          </button>
        </div>
      </div>
    </div>
  );
};
