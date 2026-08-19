import React, { useState, useMemo, useEffect } from 'react';
import { 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Calculator, 
  Sliders, 
  FileSpreadsheet, 
  Printer, 
  UploadCloud, 
  Sparkles, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Plus, 
  Edit3, 
  Save, 
  Trash2, 
  ChevronRight, 
  AlertCircle,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Building,
  Eye,
  Check,
  RefreshCw
} from 'lucide-react';
import { 
  TeacherAttendanceRecord, 
  TeacherSalaryRule, 
  TeacherMonthlySalary,
  DEFAULT_TEACHER_SALARY_RULE 
} from '../../types/attendance';
import { useData } from '../../contexts/DataContext';
import { enToBnNumber, cn, formatDateToDDMMYYYY } from '../../lib/utils';
import { calculateWorkingHours, calculateTeacherSalary } from '../../utils/attendanceCalculators';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const TeacherAttendance: React.FC = () => {
  const { staffMembers, teachers, madrasahBranding } = useData();
  const [activeTab, setActiveTab] = useState<'daily' | 'rules' | 'salary_gen' | 'biometric'>('daily');

  // Master Teacher List from Staff + Teachers
  const teacherList = useMemo(() => {
    const list: Array<{ id: string; name: string; designation: string; department: string; mobile?: string; salary?: number }> = [];
    const seen = new Set<string>();

    teachers.forEach((t: any) => {
      const id = String(t.id || t.mobile || Math.random());
      if (!seen.has(id)) {
        seen.add(id);
        list.push({
          id,
          name: t.name || 'শিক্ষক',
          designation: t.designation || 'ওস্তাদ/শিক্ষক',
          department: t.department || 'হিফজ ও কিতাব বিভাগ',
          mobile: t.mobile,
          salary: Number(t.salary || 18000)
        });
      }
    });

    staffMembers.forEach((s: any) => {
      const id = String(s.id || s.mobile);
      if (!seen.has(id)) {
        seen.add(id);
        list.push({
          id,
          name: s.name,
          designation: s.designation || 'কর্মচারী',
          department: s.department || 'সাধারণ প্রশাসন',
          mobile: s.mobile,
          salary: Number(s.salary || 15000)
        });
      }
    });

    if (list.length === 0) {
      // Sample fallback list
      list.push(
        { id: 'T-101', name: 'মুফতী মাহমুদুল হাসান', designation: 'প্রধান মুহাদ্দিস', department: 'হাদীস বিভাগ', salary: 25000 },
        { id: 'T-102', name: 'মাওলানা আহমাদুল্লাহ', designation: 'সহকারী শিক্ষক', department: 'নাহু-সরফ বিভাগ', salary: 18000 },
        { id: 'T-103', name: 'হাফেজ ক্বারী ইব্রাহীম', designation: 'হিফজুল কুরআন শিক্ষক', department: 'হিফজ বিভাগ', salary: 16000 },
        { id: 'T-104', name: 'মাওলানা জাকারিয়া', designation: 'আরবি প্রভাষক', department: 'আদব বিভাগ', salary: 20000 }
      );
    }

    return list;
  }, [teachers, staffMembers]);

  // Date & Month filters
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });
  const [searchTerm, setSearchTerm] = useState('');

  // -------------------------------------------------------------
  // TEACHER ATTENDANCE DB STATE
  // -------------------------------------------------------------
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendanceRecord[]>(() => {
    const saved = localStorage.getItem('madrasah_teacher_attendance_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('madrasah_teacher_attendance_records', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  // -------------------------------------------------------------
  // SALARY RULES STATE
  // -------------------------------------------------------------
  const [salaryRules, setSalaryRules] = useState<TeacherSalaryRule[]>(() => {
    const saved = localStorage.getItem('madrasah_teacher_salary_rules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [DEFAULT_TEACHER_SALARY_RULE];
  });

  useEffect(() => {
    localStorage.setItem('madrasah_teacher_salary_rules', JSON.stringify(salaryRules));
  }, [salaryRules]);

  // Editing Rule modal
  const [editingRule, setEditingRule] = useState<TeacherSalaryRule | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);

  // -------------------------------------------------------------
  // GENERATED MONTHLY SALARIES STATE
  // -------------------------------------------------------------
  const [monthlySalaries, setMonthlySalaries] = useState<TeacherMonthlySalary[]>(() => {
    const saved = localStorage.getItem('madrasah_teacher_monthly_salaries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('madrasah_teacher_monthly_salaries', JSON.stringify(monthlySalaries));
  }, [monthlySalaries]);

  // Printable Slip / Voucher Modal
  const [activeSlip, setActiveSlip] = useState<TeacherMonthlySalary | null>(null);

  // Payment Mark Modal
  const [payModalSalary, setPayModalSalary] = useState<TeacherMonthlySalary | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    method: 'নগদ (Cash)',
    paidDate: new Date().toISOString().split('T')[0],
    remarks: 'মাসিক বেতন পরিশোধিত'
  });

  // Current day attendance map for quick lookup
  const dayRecordsMap = useMemo(() => {
    const map: Record<string, TeacherAttendanceRecord> = {};
    attendanceRecords.forEach(r => {
      if (r.attendanceDate === selectedDate) {
        map[r.teacherId] = r;
      }
    });
    return map;
  }, [attendanceRecords, selectedDate]);

  // Update attendance for a single teacher
  const handleTeacherAttendanceChange = (
    teacher: { id: string; name: string; department: string },
    updates: Partial<TeacherAttendanceRecord>
  ) => {
    const existing = dayRecordsMap[teacher.id];
    const inTime = updates.inTime !== undefined ? updates.inTime : (existing?.inTime || '08:00');
    const outTime = updates.outTime !== undefined ? updates.outTime : (existing?.outTime || '16:30');
    const status = updates.status !== undefined ? updates.status : (existing?.status || 'present');
    const remarks = updates.remarks !== undefined ? updates.remarks : (existing?.remarks || '');

    const { workingHours } = calculateWorkingHours(inTime, outTime);
    const overtimeHours = Math.max(0, Number((workingHours - 8).toFixed(2)));

    const newRecord: TeacherAttendanceRecord = {
      id: existing?.id || `tatt-${teacher.id}-${selectedDate}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      department: teacher.department,
      attendanceDate: selectedDate,
      status,
      inTime,
      outTime,
      workingHours,
      overtimeHours,
      deductionAmount: 0,
      remarks,
      markedAt: new Date().toISOString()
    };

    const updated = attendanceRecords.filter(r => !(r.teacherId === teacher.id && r.attendanceDate === selectedDate));
    updated.push(newRecord);
    setAttendanceRecords(updated);
  };

  // Bulk mark all teachers present / absent
  const handleBulkTeacherAttendance = (status: 'present' | 'absent') => {
    const updated = attendanceRecords.filter(r => r.attendanceDate !== selectedDate);
    teacherList.forEach(t => {
      const inTime = status === 'present' ? '08:00' : '';
      const outTime = status === 'present' ? '16:30' : '';
      const workingHours = status === 'present' ? 8.5 : 0;
      const overtimeHours = status === 'present' ? 0.5 : 0;

      updated.push({
        id: `tatt-${t.id}-${selectedDate}`,
        teacherId: t.id,
        teacherName: t.name,
        department: t.department,
        attendanceDate: selectedDate,
        status,
        inTime,
        outTime,
        workingHours,
        overtimeHours,
        deductionAmount: 0,
        remarks: '',
        markedAt: new Date().toISOString()
      });
    });

    setAttendanceRecords(updated);
    toast.success(`সকল শিক্ষকের হাজিরা "${status === 'present' ? 'উপস্থিত' : 'অনুপস্থিত'}" করা হয়েছে!`);
  };

  // -------------------------------------------------------------
  // ONE-CLICK MONTHLY SALARY GENERATION ALGORITHM
  // -------------------------------------------------------------
  const handleGenerateMonthlySalary = () => {
    const generated: TeacherMonthlySalary[] = [];

    teacherList.forEach(teacher => {
      // Find rule for this teacher or default rule
      const rule = salaryRules.find(r => r.teacherId === teacher.id) || 
                   salaryRules.find(r => r.teacherId === 'default') || 
                   {
                     ...DEFAULT_TEACHER_SALARY_RULE,
                     baseSalary: teacher.salary || 18000
                   };

      const customRule: TeacherSalaryRule = {
        ...rule,
        baseSalary: teacher.salary || rule.baseSalary
      };

      const salaryObj = calculateTeacherSalary(
        teacher.id,
        teacher.name,
        teacher.department,
        teacher.designation,
        selectedMonth,
        attendanceRecords,
        customRule
      );

      generated.push(salaryObj);
    });

    // Replace or merge with existing for this month
    const otherMonths = monthlySalaries.filter(s => s.month !== selectedMonth);
    const updatedAll = [...otherMonths, ...generated];
    setMonthlySalaries(updatedAll);
    toast.success(`${selectedMonth} মাসের সকল শিক্ষক/কর্মীর বেতন স্বয়ংক্রিয়ভাবে গণনা ও প্রস্তুত করা হয়েছে!`);
  };

  // Filtered salaries for the selected month
  const currentMonthSalaries = useMemo(() => {
    return monthlySalaries.filter(s => s.month === selectedMonth);
  }, [monthlySalaries, selectedMonth]);

  // Biometric file upload simulator
  const handleBiometricUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        toast.success(`বায়োমেট্রিক ফাইল থেকে ${data.length} টি লগ সফলভাবে সিঙ্ক হয়েছে!`);
        // Seed into records
        const newRecords = [...attendanceRecords];
        data.forEach((row: any, idx) => {
          const tMatch = teacherList[idx % teacherList.length];
          if (tMatch) {
            newRecords.push({
              id: `bio-${tMatch.id}-${selectedDate}-${idx}`,
              teacherId: tMatch.id,
              teacherName: tMatch.name,
              department: tMatch.department,
              attendanceDate: selectedDate,
              status: 'present',
              inTime: row['InTime'] || '07:55',
              outTime: row['OutTime'] || '16:35',
              workingHours: 8.6,
              overtimeHours: 0.6,
              deductionAmount: 0,
              remarks: 'বায়োমেট্রিক পাঞ্চ লগ',
              markedAt: new Date().toISOString()
            });
          }
        });
        setAttendanceRecords(newRecords);
        setActiveTab('daily');
      } catch (err) {
        toast.error('ফাইল পড়তে সমস্যা হয়েছে। সঠিক এক্সেল বা CSV ফাইল দিন।');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 text-left font-hind-siliguri pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bento-card p-6 md:p-8 bg-card border border-border-main relative overflow-hidden rounded-[2rem] shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
              Teacher Attendance & Automated Salary Integration
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-main">
            শিক্ষক হাজিরা ও বেতন ব্যবস্থাপনা
          </h1>
          <p className="text-xs text-text-light/60 font-bold mt-1">
            ইন/আউট টাইম, কর্মঘণ্টা, বিলম্ব কর্তন, হাজিরা বোনাস ও ১-ক্লিকে স্বয়ংক্রিয় স্যালারি জেনারেটর
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <button
            onClick={() => setActiveTab('daily')}
            className={cn(
              "px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer",
              activeTab === 'daily'
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-step-bg text-text-light hover:text-text-main border border-border-main"
            )}
          >
            <Clock size={16} />
            <span>দৈনিক হাজিরা ও সময়</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={cn(
              "px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer",
              activeTab === 'rules'
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-step-bg text-text-light hover:text-text-main border border-border-main"
            )}
          >
            <Sliders size={16} />
            <span>বেতন রুলস কনফিগ</span>
          </button>

          <button
            onClick={() => setActiveTab('salary_gen')}
            className={cn(
              "px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer",
              activeTab === 'salary_gen'
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-step-bg text-text-light hover:text-text-main border border-border-main"
            )}
          >
            <Calculator size={16} />
            <span>অটো স্যালারি জেনারেটর</span>
          </button>

          <button
            onClick={() => setActiveTab('biometric')}
            className={cn(
              "px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer",
              activeTab === 'biometric'
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-step-bg text-text-light hover:text-text-main border border-border-main"
            )}
          >
            <UploadCloud size={16} />
            <span>বায়োমেট্রিক আপলোড</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DAILY TEACHER ATTENDANCE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bento-card p-5 bg-card border border-border-main rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-step-bg px-3.5 py-2.5 rounded-xl border border-border-main">
                <Calendar size={16} className="text-primary shrink-0" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-black text-xs outline-none cursor-pointer text-text-main"
                />
              </div>

              <button
                onClick={() => handleBulkTeacherAttendance('present')}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 size={15} />
                <span>সবাই উপস্থিত</span>
              </button>

              <button
                onClick={() => handleBulkTeacherAttendance('absent')}
                className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <XCircle size={15} />
                <span>সবাই অনুপস্থিত</span>
              </button>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/40" size={15} />
              <input 
                type="text" 
                placeholder="শিক্ষকের নাম খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 bg-step-bg border border-border-main rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Teacher Attendance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teacherList
              .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((teacher) => {
                const rec = dayRecordsMap[teacher.id];
                const status = rec?.status || 'present';
                const inTime = rec?.inTime || '08:00';
                const outTime = rec?.outTime || '16:30';
                const workingHours = rec?.workingHours || 8.5;
                const overtimeHours = rec?.overtimeHours || 0.5;

                return (
                  <div
                    key={teacher.id}
                    className={cn(
                      "p-5 rounded-2xl border transition-all bg-card space-y-4 shadow-sm",
                      status === 'present' ? "border-emerald-500/30" :
                      status === 'absent' ? "border-rose-500/40 bg-rose-500/5" :
                      status === 'late' ? "border-amber-500/40 bg-amber-500/5" :
                      "border-border-main"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-base">
                          {teacher.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-text-main">{teacher.name}</h4>
                          <p className="text-[11px] text-text-light/60 font-bold">
                            {teacher.designation} • {teacher.department}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-black text-text-light/50 uppercase block">মোট কর্মঘণ্টা</span>
                        <span className="text-xs font-black text-primary mt-0.5 inline-block">
                          {enToBnNumber(workingHours)} ঘণ্টা
                        </span>
                      </div>
                    </div>

                    {/* Status selection */}
                    <div className="grid grid-cols-5 gap-1.5 p-1 bg-step-bg rounded-xl border border-border-main/50">
                      {[
                        { id: 'present', label: 'উপস্থিত', icon: CheckCircle2, color: 'emerald' },
                        { id: 'late', label: 'দেরিতে', icon: Clock, color: 'amber' },
                        { id: 'absent', label: 'অনুপস্থিত', icon: XCircle, color: 'rose' },
                        { id: 'leave', label: 'ছুটি', icon: Check, color: 'blue' },
                        { id: 'on-duty', label: 'অন-ডিউটি', icon: Briefcase, color: 'purple' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTeacherAttendanceChange(teacher, { status: item.id as any })}
                          className={cn(
                            "py-1.5 rounded-lg text-[11px] font-black flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer",
                            status === item.id
                              ? item.id === 'present' ? "bg-emerald-600 text-white shadow-md" :
                                item.id === 'absent' ? "bg-rose-600 text-white shadow-md" :
                                item.id === 'late' ? "bg-amber-600 text-white shadow-md" :
                                item.id === 'leave' ? "bg-blue-600 text-white shadow-md" :
                                "bg-purple-600 text-white shadow-md"
                              : "text-text-light/70 hover:bg-card"
                          )}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* In / Out Time inputs & overtime indicator */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-bold">
                      <div className="space-y-1">
                        <label className="text-[10px] text-text-light/60">প্রবেশ সময় (In Time)</label>
                        <input 
                          type="time" 
                          value={inTime}
                          onChange={(e) => handleTeacherAttendanceChange(teacher, { inTime: e.target.value })}
                          className="w-full p-2 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-text-light/60">প্রস্থান সময় (Out Time)</label>
                        <input 
                          type="time" 
                          value={outTime}
                          onChange={(e) => handleTeacherAttendanceChange(teacher, { outTime: e.target.value })}
                          className="w-full p-2 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none"
                        />
                      </div>

                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] text-text-light/60">ওভারটাইম</label>
                        <div className="p-2 bg-step-bg border border-border-main rounded-xl text-xs font-black text-emerald-600 flex items-center justify-between">
                          <span>{overtimeHours > 0 ? `+${enToBnNumber(overtimeHours)} ঘ:` : 'নেই'}</span>
                          {overtimeHours > 0 && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/15 rounded">OT</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TEACHER SALARY RULES CONFIGURATION TAB */}
      {/* ========================================================================= */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bento-card p-6 bg-card border border-border-main rounded-2xl">
            <div>
              <h3 className="text-xl font-black text-text-main flex items-center gap-2">
                <Sliders className="text-primary" size={20} />
                <span>শিক্ষক বেতন হিসাবের নীতিমালা (Salary Calculation Rules)</span>
              </h3>
              <p className="text-xs text-text-light/60 font-bold mt-0.5">
                অনুপস্থিতি কর্তন, বিলম্ব ফি, পারফেক্ট হাজিরা বোনাস ও ওভারটাইম রেট কনফিগার করুন
              </p>
            </div>

            <button
              onClick={() => {
                setEditingRule({
                  id: `rule-${Date.now()}`,
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
                  effectiveFrom: new Date().toISOString().split('T')[0]
                });
                setShowRuleModal(true);
              }}
              className="px-4 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
            >
              <Plus size={16} />
              <span>নতুন বেতন নীতিমালা তৈরি করুন</span>
            </button>
          </div>

          {/* Rules Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salaryRules.map((rule) => (
              <div 
                key={rule.id}
                className="bento-card p-6 bg-card border border-border-main rounded-2xl space-y-4 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-border-main/50">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary">শিক্ষক / পলিসি</span>
                      <h4 className="text-base font-black text-text-main">
                        {rule.teacherId === 'default' ? 'ডিফল্ট সাধারণ নীতিমালা' : (teacherList.find(t => t.id === rule.teacherId)?.name || rule.teacherId)}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black">
                      {rule.teacherId === 'default' ? 'Global Default' : 'Custom'}
                    </span>
                  </div>

                  <div className="space-y-2 mt-4 text-xs font-bold">
                    <div className="p-2.5 bg-step-bg rounded-xl flex justify-between items-center">
                      <span className="text-text-light/60">অনুপস্থিতি কর্তন (দৈনিক):</span>
                      <span className="font-black text-rose-600">৳ {enToBnNumber(rule.dailyDeductionAbsent)}</span>
                    </div>

                    <div className="p-2.5 bg-step-bg rounded-xl flex justify-between items-center">
                      <span className="text-text-light/60">বিলম্ব কর্তন (প্রতি ঘণ্টা):</span>
                      <span className="font-black text-amber-600">৳ {enToBnNumber(rule.deductionPerHourLate)}</span>
                    </div>

                    <div className="p-2.5 bg-step-bg rounded-xl flex justify-between items-center">
                      <span className="text-text-light/60">হাজিরা বোনাস (%):</span>
                      <span className="font-black text-emerald-600">{enToBnNumber(rule.attendanceBonusPercentage)}%</span>
                    </div>

                    <div className="p-2.5 bg-step-bg rounded-xl flex justify-between items-center">
                      <span className="text-text-light/60">১০০% হাজিরা বোনাস:</span>
                      <span className="font-black text-emerald-600">৳ {enToBnNumber(rule.perfectAttendanceBonus)}</span>
                    </div>

                    <div className="p-2.5 bg-step-bg rounded-xl flex justify-between items-center">
                      <span className="text-text-light/60">ওভারটাইম রেট (ঘণ্টা):</span>
                      <span className="font-black text-primary">৳ {enToBnNumber(rule.otRate)}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-text-light/50 font-semibold mt-3">
                    কার্যকর তারিখ: {rule.effectiveFrom}
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border-main/50">
                  <button
                    onClick={() => {
                      setEditingRule({ ...rule });
                      setShowRuleModal(true);
                    }}
                    className="px-3 py-1.5 bg-step-bg hover:bg-primary hover:text-white text-text-main rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>এডিট</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AUTOMATED 1-CLICK MONTHLY SALARY GENERATOR TAB */}
      {/* ========================================================================= */}
      {activeTab === 'salary_gen' && (
        <div className="space-y-6">
          <div className="bento-card p-6 bg-card border border-border-main rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-step-bg px-3.5 py-2.5 rounded-xl border border-border-main">
                <Calendar size={16} className="text-primary shrink-0" />
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent font-black text-xs outline-none cursor-pointer text-text-main"
                />
              </div>

              <button
                onClick={handleGenerateMonthlySalary}
                className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-primary/25 cursor-pointer active:scale-95 transition-all"
              >
                <Sparkles size={16} />
                <span>হাজিরা অনুযায়ী ১-ক্লিকে বেতন প্রস্তুত করুন</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const dataRows = currentMonthSalaries.map((s, idx) => ({
                    'ক্রমিক': idx + 1,
                    'শিক্ষকের নাম': s.teacherName,
                    'বিভাগ': s.department,
                    'মূল বেতন': s.baseSalary,
                    'অনুপস্থিতি কর্তন': s.absentDeduction,
                    'বিলম্ব কর্তন': s.lateDeduction,
                    'বোনাস': s.attendanceBonus + s.perfectAttendanceBonus,
                    'ওভারটাইম': s.overtimePay,
                    'প্রদেয় নিট বেতন': s.netSalary,
                    'স্ট্যাটাস': s.paymentStatus === 'paid' ? 'পরিশোধিত' : 'বকেয়া'
                  }));
                  const ws = XLSX.utils.json_to_sheet(dataRows);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Teacher_Salary');
                  XLSX.writeFile(wb, `Teacher_Salary_${selectedMonth}.xlsx`);
                  toast.success('স্যালারি শিট ডাউনলোড সফল হয়েছে!');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>এক্সেল শিট</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-step-bg border border-border-main hover:bg-card text-text-main rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer size={15} />
                <span>প্রিন্ট</span>
              </button>
            </div>
          </div>

          {/* Salary Sheet Table */}
          <div className="bento-card bg-card border border-border-main rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-border-main/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-text-main">
                  {selectedMonth} মাসের শিক্ষক ও স্টাফদের চূড়ান্ত স্যালারি শিট
                </h3>
                <p className="text-xs text-text-light/50 font-bold mt-0.5">
                  মোট শিক্ষক/কর্মী: {enToBnNumber(currentMonthSalaries.length)} জন
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-hind-siliguri text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-step-bg border-b border-border-main text-[10px] font-black uppercase text-text-light/60 tracking-wider">
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4">ওস্তাদ/শিক্ষকের নাম</th>
                    <th className="p-4">পদবি ও বিভাগ</th>
                    <th className="p-4 text-center">উপস্থিতি খতিয়ান</th>
                    <th className="p-4 text-right">মূল বেতন</th>
                    <th className="p-4 text-right text-rose-600">মোট কর্তন</th>
                    <th className="p-4 text-right text-emerald-600">বোনাস ও OT</th>
                    <th className="p-4 text-right font-black text-primary">নিট প্রদেয়</th>
                    <th className="p-4 text-center">স্ট্যাটাস</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/40">
                  {currentMonthSalaries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-12 text-center text-text-light/40 font-black">
                        এই মাসের কোনো স্যালারি শিট প্রস্তুত করা হয়নি। উপরে "হাজিরা অনুযায়ী ১-ক্লিকে বেতন প্রস্তুত করুন" বাটনে ক্লিক করুন।
                      </td>
                    </tr>
                  ) : (
                    currentMonthSalaries.map((sal, idx) => (
                      <tr key={sal.id} className="hover:bg-step-bg/30 transition-colors">
                        <td className="p-4 text-center font-bold text-text-light/60">
                          {enToBnNumber(idx + 1)}
                        </td>
                        <td className="p-4 font-black text-text-main">
                          {sal.teacherName}
                        </td>
                        <td className="p-4 font-bold text-text-light/80">
                          {sal.designation || 'শিক্ষক'} • {sal.department}
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-step-bg rounded-lg">
                            উপ: {enToBnNumber(sal.breakdown?.presentDays || 0)} | অনু: {enToBnNumber(sal.breakdown?.absentDays || 0)} | দেরি: {enToBnNumber(sal.breakdown?.lateDays || 0)}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-text-main">
                          ৳ {enToBnNumber(sal.baseSalary)}
                        </td>
                        <td className="p-4 text-right font-black text-rose-600">
                          -৳ {enToBnNumber(sal.totalDeduction)}
                        </td>
                        <td className="p-4 text-right font-black text-emerald-600">
                          +৳ {enToBnNumber(sal.totalAddition)}
                        </td>
                        <td className="p-4 text-right font-black text-primary text-sm">
                          ৳ {enToBnNumber(sal.netSalary)}
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black",
                            sal.paymentStatus === 'paid' ? "bg-emerald-500/15 text-emerald-600" :
                            sal.paymentStatus === 'approved' ? "bg-blue-500/15 text-blue-600" :
                            "bg-amber-500/15 text-amber-600"
                          )}>
                            {sal.paymentStatus === 'paid' ? 'পরিশোধিত' : sal.paymentStatus === 'approved' ? 'অনুমোদিত' : 'অপেক্ষমান'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setActiveSlip(sal)}
                              className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors cursor-pointer"
                              title="বেতন স্লিপ / ভাউচার দেখুন"
                            >
                              <FileText size={15} />
                            </button>

                            {sal.paymentStatus !== 'paid' && (
                              <button
                                onClick={() => {
                                  setPayModalSalary(sal);
                                }}
                                className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black hover:bg-emerald-700 cursor-pointer"
                                title="বেতন প্রদান করুন"
                              >
                                পে করুন
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BIOMETRIC CSV UPLOAD TAB */}
      {/* ========================================================================= */}
      {activeTab === 'biometric' && (
        <div className="bento-card p-8 bg-card border border-border-main rounded-3xl space-y-6 max-w-2xl mx-auto text-center shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
            <UploadCloud size={32} />
          </div>

          <div>
            <h3 className="text-xl font-black text-text-main">বায়োমেট্রিক ও ডিজিটাল পাঞ্চ লগ আপলোড</h3>
            <p className="text-xs text-text-light/60 font-bold mt-1">
              ডিজিটাল হাজিরা মেশিন বা জেডকেটেকো ডিভাইস থেকে এক্সেল/CSV ফাইল নির্বাচন করুন
            </p>
          </div>

          <div className="p-8 border-2 border-dashed border-border-main rounded-2xl space-y-3 hover:border-primary/50 transition-colors">
            <input 
              type="file" 
              accept=".csv, .xlsx, .xls"
              onChange={handleBiometricUpload}
              className="hidden" 
              id="biometric-file-input"
            />
            <label 
              htmlFor="biometric-file-input"
              className="px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-xl font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-md shadow-primary/25"
            >
              <UploadCloud size={16} />
              <span>এক্সেল/CSV ফাইল বেছে নিন</span>
            </label>
            <p className="text-[10px] text-text-light/50 font-bold block">
              সমর্থিত ফরম্যাট: .xlsx, .csv (কলাম: UserID, InTime, OutTime, Date)
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SALARY RULES EDIT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showRuleModal && editingRule && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-3xl border border-border-main max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-center pb-3 border-b border-border-main/50">
                <h3 className="font-black text-lg text-text-main flex items-center gap-2">
                  <Sliders size={20} className="text-primary" />
                  <span>বেতন ও হাজিরা পলিসি কনফিগার</span>
                </h3>
                <button onClick={() => setShowRuleModal(false)} className="p-1 cursor-pointer">
                  <XCircle size={20} className="text-text-light/50 hover:text-rose-500" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-bold">
                <div className="space-y-1">
                  <label className="text-text-main">শিক্ষক নির্বাচন করুন (ঐচ্ছিক)</label>
                  <select
                    value={editingRule.teacherId}
                    onChange={(e) => setEditingRule({ ...editingRule, teacherId: e.target.value })}
                    className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                  >
                    <option value="default">ডিফল্ট সাধারণ পলিসি (সকলের জন্য)</option>
                    {teacherList.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-text-light/70">দৈনিক অনুপস্থিতি কর্তন (৳)</label>
                    <input 
                      type="number"
                      value={editingRule.dailyDeductionAbsent}
                      onChange={(e) => setEditingRule({ ...editingRule, dailyDeductionAbsent: Number(e.target.value) })}
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-text-light/70">বিলম্ব কর্তন প্রতি ঘণ্টা (৳)</label>
                    <input 
                      type="number"
                      value={editingRule.deductionPerHourLate}
                      onChange={(e) => setEditingRule({ ...editingRule, deductionPerHourLate: Number(e.target.value) })}
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-text-light/70">হাজিরা বোনাস হার (%)</label>
                    <input 
                      type="number"
                      value={editingRule.attendanceBonusPercentage}
                      onChange={(e) => setEditingRule({ ...editingRule, attendanceBonusPercentage: Number(e.target.value) })}
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-text-light/70">১০০% হাজিরা বোনাস (৳)</label>
                    <input 
                      type="number"
                      value={editingRule.perfectAttendanceBonus}
                      onChange={(e) => setEditingRule({ ...editingRule, perfectAttendanceBonus: Number(e.target.value) })}
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-text-light/70">ওভারটাইম প্রতি ঘণ্টা (৳)</label>
                    <input 
                      type="number"
                      value={editingRule.otRate}
                      onChange={(e) => setEditingRule({ ...editingRule, otRate: Number(e.target.value) })}
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-text-light/70">কার্যকর তারিখ</label>
                    <input 
                      type="date"
                      value={editingRule.effectiveFrom}
                      onChange={(e) => setEditingRule({ ...editingRule, effectiveFrom: e.target.value })}
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-main/50">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-5 py-2.5 bg-step-bg text-text-light rounded-xl text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idx = salaryRules.findIndex(r => r.id === editingRule.id || (r.teacherId === editingRule.teacherId && editingRule.teacherId !== 'default'));
                    let updated;
                    if (idx !== -1) {
                      updated = [...salaryRules];
                      updated[idx] = editingRule;
                    } else {
                      updated = [...salaryRules, editingRule];
                    }
                    setSalaryRules(updated);
                    setShowRuleModal(false);
                    toast.success('বেতন পলিসি সংরক্ষিত হয়েছে!');
                  }}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/25 cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* SALARY PAYMENT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {payModalSalary && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-3xl border border-border-main max-w-md w-full p-6 md:p-8 space-y-5 shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-center pb-3 border-b border-border-main/50">
                <h3 className="font-black text-lg text-text-main flex items-center gap-2">
                  <DollarSign size={20} className="text-emerald-500" />
                  <span>বেতন পরিশোধ ও ভাউচার প্রদান</span>
                </h3>
                <button onClick={() => setPayModalSalary(null)} className="p-1 cursor-pointer">
                  <XCircle size={20} className="text-text-light/50" />
                </button>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <div className="p-3 bg-step-bg rounded-xl">
                  <span className="text-text-light/60 block text-[10px]">শিক্ষক:</span>
                  <p className="text-sm font-black text-text-main">{payModalSalary.teacherName}</p>
                  <p className="text-primary font-black text-base mt-1">প্রদেয় নিট: ৳ {enToBnNumber(payModalSalary.netSalary)}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-text-light/70">পরিশোধের মাধ্যম (Payment Method)</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                  >
                    <option value="নগদ (Cash)">নগদ (Cash)</option>
                    <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                    <option value="নগদ (Nagad)">নগদ (Nagad)</option>
                    <option value="ব্যাংক একাউন্ট">ব্যাংক একাউন্ট</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-text-light/70">পরিশোধের তারিখ</label>
                  <input 
                    type="date"
                    value={paymentForm.paidDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paidDate: e.target.value })}
                    className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-light/70">মন্তব্য</label>
                  <input 
                    type="text"
                    value={paymentForm.remarks}
                    onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                    className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-main/50">
                <button
                  type="button"
                  onClick={() => setPayModalSalary(null)}
                  className="px-4 py-2 bg-step-bg text-text-light rounded-xl text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = monthlySalaries.map(s => {
                      if (s.id === payModalSalary.id) {
                        return {
                          ...s,
                          paymentStatus: 'paid' as const,
                          paidDate: paymentForm.paidDate,
                          paymentMethod: paymentForm.method,
                          remarks: paymentForm.remarks
                        };
                      }
                      return s;
                    });
                    setMonthlySalaries(updated);
                    setPayModalSalary(null);
                    toast.success('বেতন সফলভাবে পরিশোধিত হিসেবে মার্ক করা হয়েছে!');
                  }}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  পরিশোধ সম্পন্ন করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PRINTABLE SALARY SLIP / VOUCHER MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeSlip && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-3xl border border-border-main max-w-xl w-full p-8 space-y-6 shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-center pb-3 border-b border-border-main/50">
                <h3 className="font-black text-base text-text-main flex items-center gap-2">
                  <Printer size={18} className="text-primary" />
                  <span>শিক্ষক মাসিক বেতন স্লিপ</span>
                </h3>
                <button onClick={() => setActiveSlip(null)} className="p-1 cursor-pointer">
                  <XCircle size={18} className="text-text-light/50" />
                </button>
              </div>

              {/* Printable Slip Content */}
              <div className="p-6 bg-white dark:bg-zinc-900 border border-border-main rounded-2xl space-y-4 text-xs font-hind-siliguri text-zinc-800 dark:text-zinc-200">
                {/* Header */}
                <div className="text-center border-b pb-4 border-zinc-200 dark:border-zinc-800 space-y-1">
                  <h2 className="text-lg font-black text-primary">{madrasahBranding?.madrasahName || 'আল মাদানিয়া মাদ্রাসা'}</h2>
                  <p className="text-[10px] text-zinc-500 font-bold">{madrasahBranding?.address || 'ঢাকা, বাংলাদেশ'} | ওস্তাদ বেতন ভাউচার</p>
                  <p className="text-xs font-black text-zinc-700 dark:text-zinc-300">মাস: {activeSlip.month}</p>
                </div>

                {/* Teacher Info */}
                <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
                  <div>
                    <span className="text-zinc-500 text-[10px]">শিক্ষকের নাম:</span>
                    <p className="font-black text-sm text-zinc-900 dark:text-white">{activeSlip.teacherName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500 text-[10px]">পদবি ও বিভাগ:</span>
                    <p className="font-bold">{activeSlip.designation || 'শিক্ষক'} • {activeSlip.department}</p>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-[11px] font-bold flex justify-between">
                  <span>উপস্থিত: {enToBnNumber(activeSlip.breakdown?.presentDays || 0)} দিন</span>
                  <span>অনুপস্থিত: {enToBnNumber(activeSlip.breakdown?.absentDays || 0)} দিন</span>
                  <span>দেরি: {enToBnNumber(activeSlip.breakdown?.lateDays || 0)} দিন</span>
                  <span>ওভারটাইম: {enToBnNumber(activeSlip.breakdown?.totalOvertimeHours || 0)} ঘণ্টা</span>
                </div>

                {/* Earnings & Deductions Table */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-2 bg-zinc-100 dark:bg-zinc-800 p-2 font-black border-b border-zinc-200 dark:border-zinc-800">
                    <span>বিবরণ</span>
                    <span className="text-right">পরিমাণ (টাকা)</span>
                  </div>

                  <div className="p-2.5 space-y-1.5">
                    <div className="flex justify-between">
                      <span>মূল বেতন (Basic)</span>
                      <span className="font-bold">৳ {enToBnNumber(activeSlip.baseSalary)}</span>
                    </div>
                    {activeSlip.attendanceBonus > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>হাজিরা বোনাস</span>
                        <span>+৳ {enToBnNumber(activeSlip.attendanceBonus)}</span>
                      </div>
                    )}
                    {activeSlip.perfectAttendanceBonus > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>১০০% পারফেক্ট হাজিরা বোনাস</span>
                        <span>+৳ {enToBnNumber(activeSlip.perfectAttendanceBonus)}</span>
                      </div>
                    )}
                    {activeSlip.overtimePay > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>ওভারটাইম ভাতা</span>
                        <span>+৳ {enToBnNumber(activeSlip.overtimePay)}</span>
                      </div>
                    )}
                    {activeSlip.absentDeduction > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>অনুপস্থিতির জন্য কর্তন</span>
                        <span>-৳ {enToBnNumber(activeSlip.absentDeduction)}</span>
                      </div>
                    )}
                    {activeSlip.lateDeduction > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>বিলম্বে উপস্থিতির কর্তন</span>
                        <span>-৳ {enToBnNumber(activeSlip.lateDeduction)}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 bg-primary/10 p-3 font-black text-sm border-t border-zinc-200 dark:border-zinc-800 text-primary">
                    <span>প্রদেয় সর্বমোট নিট বেতন</span>
                    <span className="text-right">৳ {enToBnNumber(activeSlip.netSalary)}</span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 pt-10 text-center text-[10px] font-bold text-zinc-500">
                  <div className="border-t pt-1 border-zinc-400">শিক্ষকের স্বাক্ষর</div>
                  <div className="border-t pt-1 border-zinc-400">হিসাবরক্ষক</div>
                  <div className="border-t pt-1 border-zinc-400">মুহতামিম / প্রিন্সিপাল</div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Printer size={15} />
                  <span>প্রিন্ট করুন</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
