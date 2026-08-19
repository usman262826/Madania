import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Radio, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Briefcase, 
  Edit3, 
  Eye, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldCheck, 
  UserCheck, 
  ArrowUpDown, 
  FileSpreadsheet, 
  SlidersHorizontal,
  Sparkles,
  Layers,
  Save,
  X,
  Trash2,
  Check
} from 'lucide-react';
import { 
  TeacherAttendanceRecord, 
  StaffAttendanceRecord 
} from '../../types/attendance';
import { enToBnNumber, cn } from '../../lib/utils';
import { calculateWorkingHours } from '../../utils/attendanceCalculators';
import { 
  subscribeToAttendanceUpdates, 
  getRawPunches,
  getAttendanceSettings,
  syncAllAttendanceForDate,
  clearAllAttendanceAndMessagingData
} from '../../services/attendanceEngine';
import { TipsoiSyncModal } from './TipsoiSyncModal';
import { TeacherStaffAttendanceReportModal } from './TeacherStaffAttendanceReportModal';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface TeacherAttendanceDashboardProps {
  teachers: any[];
  staffMembers: any[];
  madrasahBranding?: any;
}

export const TeacherAttendanceDashboard: React.FC<TeacherAttendanceDashboardProps> = ({
  teachers,
  staffMembers,
  madrasahBranding
}) => {
  // Date State
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState<'all' | 'teacher' | 'staff'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);

  // Modals
  const [showTipsoiModal, setShowTipsoiModal] = useState(false);
  const [viewingPerson, setViewingPerson] = useState<any>(null);
  const [overridePerson, setOverridePerson] = useState<any>(null);

  // Manual Override Form State
  const [overrideForm, setOverrideForm] = useState({
    status: 'present' as 'present' | 'absent' | 'late' | 'leave' | 'half-day' | 'on-duty',
    inTime: '08:00',
    outTime: '16:30',
    remarks: 'প্রশাসনিক ম্যানুয়াল ওভাররাইড'
  });

  // Master Personnel List
  const allPersonnel = useMemo(() => {
    const list: Array<{ 
      id: string; 
      name: string; 
      designation: string; 
      department: string; 
      mobile?: string; 
      roleType: 'teacher' | 'staff';
      salary?: number;
    }> = [];
    const seen = new Set<string>();

    teachers.forEach((t: any) => {
      const id = String(t.id || t.mobile || Math.random());
      if (!seen.has(id)) {
        seen.add(id);
        list.push({
          id,
          name: t.name || 'শিক্ষক',
          designation: t.designation || 'ওস্তাদ/শিক্ষক',
          department: t.department || 'শিক্ষা ও কিতাব বিভাগ',
          mobile: t.mobile,
          roleType: 'teacher',
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
          roleType: 'staff',
          salary: Number(s.salary || 15000)
        });
      }
    });

    if (list.length === 0) {
      list.push(
        { id: 'T-101', name: 'মুফতী মাহমুদুল হাসান', designation: 'প্রধান মুহাদ্দিস', department: 'হাদীস বিভাগ', roleType: 'teacher', salary: 25000 },
        { id: 'T-102', name: 'মাওলানা আহমাদুল্লাহ', designation: 'সহকারী শিক্ষক', department: 'নাহু-সরফ বিভাগ', roleType: 'teacher', salary: 18000 },
        { id: 'STF-01', name: 'হাফেজ মোশাররফ হোসেন', designation: 'অফিস সহকারী', department: 'হিসাব শাখা', roleType: 'staff', salary: 16000 },
        { id: 'STF-02', name: 'মোঃ আব্দুল কুদ্দুস', designation: 'বাবুর্চি প্রধান', department: 'বোর্ডিং কিচেন', roleType: 'staff', salary: 14000 }
      );
    }

    return list;
  }, [teachers, staffMembers]);

  // Departments List
  const departments = useMemo(() => {
    const set = new Set<string>();
    allPersonnel.forEach(p => set.add(p.department));
    return Array.from(set);
  }, [allPersonnel]);

  // Attendance Records State
  const [teacherRecords, setTeacherRecords] = useState<TeacherAttendanceRecord[]>(() => {
    const saved = localStorage.getItem('madrasah_teacher_attendance_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [staffRecords, setStaffRecords] = useState<StaffAttendanceRecord[]>(() => {
    const saved = localStorage.getItem('madrasah_staff_attendance_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    const saved = localStorage.getItem('madrasah_last_biometric_sync');
    return saved || 'স্বয়ংক্রিয় লাইভ সিঙ্ক সক্রিয়';
  });

  const reloadAllAttendance = () => {
    try {
      const savedTeachers = localStorage.getItem('madrasah_teacher_attendance_records');
      if (savedTeachers) setTeacherRecords(JSON.parse(savedTeachers));

      const savedStaff = localStorage.getItem('madrasah_staff_attendance_records');
      if (savedStaff) setStaffRecords(JSON.parse(savedStaff));

      const savedSync = localStorage.getItem('madrasah_last_biometric_sync');
      if (savedSync) setLastSyncTime(savedSync);
    } catch (e) {
      console.error(e);
    }
  };

  // Subscribe to real-time attendance engine events
  useEffect(() => {
    const unsubscribe = subscribeToAttendanceUpdates(() => {
      reloadAllAttendance();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // One-click live sync from Tipsoi API
  const handleLiveSync = async () => {
    setIsLiveSyncing(true);
    try {
      let studentsList: any[] = [];
      try {
        const saved = localStorage.getItem('madrasah_students');
        if (saved) studentsList = JSON.parse(saved);
      } catch {}

      const result = await syncAllAttendanceForDate(selectedDate, studentsList, teachers, staffMembers);
      if (result.success) {
        toast.success(`টিপসই সিঙ্ক সফল! শিক্ষক: ${enToBnNumber(result.teacherMatched)} জন, কর্মী: ${enToBnNumber(result.staffMatched)} জন`, {
          duration: 4000
        });
        reloadAllAttendance();
      } else {
        toast.error(result.error || 'টিপসই এপিআই থেকে ডেটা ফেচ করতে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      toast.error(err?.message || 'সিঙ্ক ব্যর্থ হয়েছে');
    } finally {
      setIsLiveSyncing(false);
    }
  };

  // Clear All Data
  const handleClearAllData = () => {
    const ok = clearAllAttendanceAndMessagingData();
    if (ok) {
      toast.success('সকল ডামি ও টেস্ট ডাটা সফলভাবে মুছে ফেলা হয়েছে');
      setShowClearDataModal(false);
      reloadAllAttendance();
    } else {
      toast.error('ডাটা মুছতে ব্যর্থ হয়েছে');
    }
  };

  // Settings & Shift Metrics
  const settings = useMemo(() => getAttendanceSettings(), []);

  // Raw punches for selected date
  const dayPunches = useMemo(() => {
    const allPunches = getRawPunches();
    return allPunches.filter(p => p.punchTime.startsWith(selectedDate));
  }, [selectedDate]);

  // Map of combined records for today
  const combinedRoster = useMemo(() => {
    return allPersonnel.map(person => {
      let record: any = null;
      if (person.roleType === 'teacher') {
        record = teacherRecords.find(r => r.teacherId === person.id && r.attendanceDate === selectedDate);
      } else {
        record = staffRecords.find(r => r.staffId === person.id && r.attendanceDate === selectedDate);
      }

      // Count person's punches today
      const punches = dayPunches.filter(p => p.personId === person.id);
      const punchCount = punches.length;

      const status = record?.status || (punchCount > 0 ? 'present' : 'absent');
      const inTime = record?.inTime || (punches.length > 0 ? punches[0].punchTime.substring(11, 16) : '08:00');
      const outTime = record?.outTime || (punches.length > 1 ? punches[punches.length - 1].punchTime.substring(11, 16) : '16:30');
      
      const { workingHours } = calculateWorkingHours(inTime, outTime);
      const overtimeHours = record?.overtimeHours || Math.max(0, Number((workingHours - 8).toFixed(2)));
      const isOverridden = record?.remarks?.includes('ম্যানুয়াল') || record?.remarks?.includes('ওভাররাইড');

      // Shift rules
      const standardIn = person.roleType === 'teacher' 
        ? settings.teacherRule.standardInTime 
        : settings.staffRule.standardInTime;
      const standardOut = person.roleType === 'teacher'
        ? settings.teacherRule.standardOutTime
        : settings.staffRule.standardOutTime;

      return {
        ...person,
        recordId: record?.id,
        status,
        inTime: status === 'absent' ? '--:--' : inTime,
        outTime: status === 'absent' ? '--:--' : outTime,
        workingHours: status === 'absent' ? 0 : workingHours,
        overtimeHours: status === 'absent' ? 0 : overtimeHours,
        punchCount,
        isOverridden,
        remarks: record?.remarks || (punchCount > 0 ? 'টিপসই বায়োমেট্রিক পাঞ্চ' : 'অনুপস্থিত'),
        standardIn,
        standardOut
      };
    });
  }, [allPersonnel, teacherRecords, staffRecords, selectedDate, dayPunches, settings]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return combinedRoster.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.designation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = filterDepartment === 'all' || p.department === filterDepartment;
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchRole = filterRole === 'all' || p.roleType === filterRole;

      return matchSearch && matchDept && matchStatus && matchRole;
    });
  }, [combinedRoster, searchTerm, filterDepartment, filterStatus, filterRole]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = combinedRoster.length;
    const present = combinedRoster.filter(r => r.status === 'present').length;
    const late = combinedRoster.filter(r => r.status === 'late').length;
    const absent = combinedRoster.filter(r => r.status === 'absent').length;
    const leave = combinedRoster.filter(r => r.status === 'leave' || r.status === 'on-duty').length;
    const totalOT = combinedRoster.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    return { total, present, late, absent, leave, totalOT };
  }, [combinedRoster]);

  // Open Override Dialog
  const handleOpenOverride = (person: any) => {
    setOverridePerson(person);
    setOverrideForm({
      status: person.status === '--:--' ? 'present' : (person.status || 'present'),
      inTime: person.inTime === '--:--' ? '08:00' : person.inTime,
      outTime: person.outTime === '--:--' ? '16:30' : person.outTime,
      remarks: person.remarks || 'প্রশাসনিক ম্যানুয়াল ওভাররাইড'
    });
  };

  // Save Manual Override
  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overridePerson) return;

    const { workingHours } = calculateWorkingHours(overrideForm.inTime, overrideForm.outTime);
    const overtimeHours = Math.max(0, Number((workingHours - 8).toFixed(2)));

    if (overridePerson.roleType === 'teacher') {
      const existing = teacherRecords.filter(
        r => !(r.teacherId === overridePerson.id && r.attendanceDate === selectedDate)
      );
      const newRec: TeacherAttendanceRecord = {
        id: overridePerson.recordId || `tatt-${overridePerson.id}-${selectedDate}`,
        teacherId: overridePerson.id,
        teacherName: overridePerson.name,
        department: overridePerson.department,
        attendanceDate: selectedDate,
        status: overrideForm.status,
        inTime: overrideForm.inTime,
        outTime: overrideForm.outTime,
        workingHours,
        overtimeHours,
        deductionAmount: 0,
        remarks: `${overrideForm.remarks} (ম্যানুয়াল ওভাররাইড)`,
        markedAt: new Date().toISOString()
      };
      const updated = [...existing, newRec];
      setTeacherRecords(updated);
      localStorage.setItem('madrasah_teacher_attendance_records', JSON.stringify(updated));
    } else {
      const existing = staffRecords.filter(
        r => !(r.staffId === overridePerson.id && r.attendanceDate === selectedDate)
      );
      const newRec: StaffAttendanceRecord = {
        id: overridePerson.recordId || `satt-${overridePerson.id}-${selectedDate}`,
        staffId: overridePerson.id,
        staffName: overridePerson.name,
        designation: overridePerson.designation,
        department: overridePerson.department,
        attendanceDate: selectedDate,
        status: overrideForm.status,
        inTime: overrideForm.inTime,
        outTime: overrideForm.outTime,
        totalHours: workingHours,
        overtimeHours,
        deductionAmount: 0,
        remarks: `${overrideForm.remarks} (ম্যানুয়াল ওভাররাইড)`,
        markedAt: new Date().toISOString()
      };
      const updated = [...existing, newRec];
      setStaffRecords(updated);
      localStorage.setItem('madrasah_staff_attendance_records', JSON.stringify(updated));
    }

    toast.success(`${overridePerson.name}-এর হাজিরা সফলভাবে ওভাররাইড করা হয়েছে!`);
    setOverridePerson(null);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows = filteredRoster.map((r, i) => ({
      'ক্রমিক': i + 1,
      'নাম': r.name,
      'পদবী': r.designation,
      'বিভাগ': r.department,
      'টাইপ': r.roleType === 'teacher' ? 'শিক্ষক' : 'কর্মী',
      'তারিখ': selectedDate,
      'স্ট্যাটাস': r.status === 'present' ? 'উপস্থিত' : r.status === 'late' ? 'দেরিতে' : r.status === 'absent' ? 'অনুপস্থিত' : 'ছুটি',
      'প্রবেশ সময়': r.inTime,
      'প্রস্থান সময়': r.outTime,
      'মোট ঘণ্টা': r.workingHours,
      'ওভারটাইম': r.overtimeHours,
      'পাঞ্চ সংখ্যা': r.punchCount,
      'মন্তব্য': r.remarks
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teacher_Staff_Attendance');
    XLSX.writeFile(wb, `Attendance_Dashboard_${selectedDate}.xlsx`);
    toast.success('এক্সেল শীট সফলভাবে ডাউনলোড হয়েছে!');
  };

  return (
    <div className="space-y-6 text-left font-hind-siliguri pb-12">
      {/* Top Banner with Shift Metrics & Live Tipsoi Sync Status */}
      <div className="bento-card p-6 md:p-8 bg-card border border-border-main relative overflow-hidden rounded-[2rem] shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">
                Live Biometric Attendance & Shift Dashboard
              </p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-main">
              শিক্ষক ও কর্মী হাজিরা ড্যাশবোর্ড
            </h1>
            <p className="text-xs text-text-light/70 font-bold mt-1">
              টিপসই রিয়েল-টাইম এপিআই সিঙ্ক, দৈনিক শিফট মেট্রিক্স এবং তাৎক্ষণিক ম্যানুয়াল ওভাররাইড কন্ট্রোল
            </p>
          </div>

          {/* Action and Device Live State */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs font-black text-emerald-600">
              <Radio size={15} className="animate-pulse" />
              <div className="text-left">
                <span className="text-[10px] text-emerald-600/70 block uppercase leading-none">ডিভাইস সিঙ্ক স্ট্যাটাস</span>
                <span className="text-[11px] leading-tight font-black">{lastSyncTime}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLiveSync}
              disabled={isLiveSyncing}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <RefreshCw size={15} className={cn(isLiveSyncing && "animate-spin")} />
              <span>{isLiveSyncing ? 'সিঙ্ক হচ্ছে...' : '১-ক্লিক লাইভ সিঙ্ক'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTipsoiModal(true)}
              className="px-4 py-2.5 bg-step-bg hover:bg-card border border-border-main text-text-main rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <Radio size={15} className="text-primary" />
              <span>টিপসই সেটিংস ও সিঙ্ক</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 bg-step-bg hover:bg-card border border-border-main text-text-main rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              <span>এক্সেল</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClearDataModal(true)}
              className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              title="ডামি / টেস্ট ডাটা মুছে ফেলুন"
            >
              <Trash2 size={14} />
              <span>ডাটা মুছুন</span>
            </button>
          </div>
        </div>

        {/* Daily Shift Information Bar */}
        <div className="mt-6 pt-5 border-t border-border-main grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-text-light/80">
          <div className="p-3 bg-step-bg rounded-xl border border-border-main/60">
            <span className="text-[10px] text-text-light/50 uppercase block font-black">শিক্ষক শিফট সময়</span>
            <span className="text-xs font-black text-text-main mt-0.5 block">
              {settings.teacherRule.standardInTime} - {settings.teacherRule.standardOutTime} (গ্রেস {enToBnNumber(settings.teacherRule.lateGraceMinutes)} মি.)
            </span>
          </div>
          <div className="p-3 bg-step-bg rounded-xl border border-border-main/60">
            <span className="text-[10px] text-text-light/50 uppercase block font-black">কর্মী শিফট সময়</span>
            <span className="text-xs font-black text-text-main mt-0.5 block">
              {settings.staffRule.standardInTime} - {settings.staffRule.standardOutTime} (গ্রেস {enToBnNumber(settings.staffRule.lateGraceMinutes)} মি.)
            </span>
          </div>
          <div className="p-3 bg-step-bg rounded-xl border border-border-main/60">
            <span className="text-[10px] text-text-light/50 uppercase block font-black">সাপ্তাহিক সাধারণ ছুটি</span>
            <span className="text-xs font-black text-primary mt-0.5 block">
              {settings.teacherRule.weeklyOffDay1 === 'Friday' ? 'শুক্রবার (জুমাবার)' : settings.teacherRule.weeklyOffDay1}
            </span>
          </div>
          <div className="p-3 bg-step-bg rounded-xl border border-border-main/60">
            <span className="text-[10px] text-text-light/50 uppercase block font-black">অনুপস্থিতি ও বিলম্ব রুলস</span>
            <span className="text-xs font-black text-amber-600 mt-0.5 block">
              স্বয়ংক্রিয় বেতন সমন্বয় সক্রিয়
            </span>
          </div>
        </div>
      </div>

      {/* Summary KPI Tiles (Clickable Interactive Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Members */}
        <button
          type="button"
          onClick={() => {
            setFilterStatus('all');
            setFilterRole('all');
            toast.success('সকল শিক্ষক ও কর্মীর তালিকা প্রদর্শিত হচ্ছে');
          }}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer",
            filterStatus === 'all' && filterRole === 'all'
              ? "bg-primary/10 border-primary ring-2 ring-primary/20"
              : "bg-card border-border-main hover:border-primary/40"
          )}
        >
          <span className="text-[10px] font-black text-text-light/60 uppercase block">মোট সদস্য</span>
          <span className="text-xl font-black text-text-main mt-0.5 block">
            {enToBnNumber(metrics.total)} জন
          </span>
          <span className="text-[9px] text-primary font-bold mt-1 block">সব দেখুন ➔</span>
        </button>

        {/* Present */}
        <button
          type="button"
          onClick={() => {
            setFilterStatus('present');
            toast.success('উপস্থিত শিক্ষক ও কর্মচারীদের তালিকা');
          }}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer",
            filterStatus === 'present'
              ? "bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30"
              : "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40"
          )}
        >
          <span className="text-[10px] font-black text-emerald-600 uppercase block">সময়মতো উপস্থিত</span>
          <span className="text-xl font-black text-emerald-600 mt-0.5 block">
            {enToBnNumber(metrics.present)} জন
          </span>
          <span className="text-[9px] text-emerald-600 font-bold mt-1 block">উপস্থিত তালিকা ➔</span>
        </button>

        {/* Late */}
        <button
          type="button"
          onClick={() => {
            setFilterStatus('late');
            toast.success('দেরিতে উপস্থিতদের তালিকা');
          }}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer",
            filterStatus === 'late'
              ? "bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30"
              : "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40"
          )}
        >
          <span className="text-[10px] font-black text-amber-600 uppercase block">দেরিতে প্রবেশ</span>
          <span className="text-xl font-black text-amber-600 mt-0.5 block">
            {enToBnNumber(metrics.late)} জন
          </span>
          <span className="text-[9px] text-amber-600 font-bold mt-1 block">বিলম্ব তালিকা ➔</span>
        </button>

        {/* Absent */}
        <button
          type="button"
          onClick={() => {
            setFilterStatus('absent');
            toast.success('অনুপস্থিতদের তালিকা');
          }}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer",
            filterStatus === 'absent'
              ? "bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30"
              : "bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40"
          )}
        >
          <span className="text-[10px] font-black text-rose-600 uppercase block">অনুপস্থিত</span>
          <span className="text-xl font-black text-rose-600 mt-0.5 block">
            {enToBnNumber(metrics.absent)} জন
          </span>
          <span className="text-[9px] text-rose-600 font-bold mt-1 block">অনুপস্থিত তালিকা ➔</span>
        </button>

        {/* Leave */}
        <button
          type="button"
          onClick={() => {
            setFilterStatus('leave');
            toast.success('ছুটিপ্রাপ্তদের তালিকা');
          }}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer",
            filterStatus === 'leave'
              ? "bg-blue-500/20 border-blue-500 ring-2 ring-blue-500/30"
              : "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40"
          )}
        >
          <span className="text-[10px] font-black text-blue-600 uppercase block">ছুটি / অন-ডিউটি</span>
          <span className="text-xl font-black text-blue-600 mt-0.5 block">
            {enToBnNumber(metrics.leave)} জন
          </span>
          <span className="text-[9px] text-blue-600 font-bold mt-1 block">ছুটি তালিকা ➔</span>
        </button>

        {/* Total Overtime */}
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
          <span className="text-[10px] font-black text-purple-600 uppercase block">মোট ওভারটাইম</span>
          <span className="text-xl font-black text-purple-600 mt-0.5 block">
            {enToBnNumber(metrics.totalOT.toFixed(1))} ঘণ্টা
          </span>
          <span className="text-[9px] text-purple-600 font-bold mt-1 block">শিফট অতিরিক্ত</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bento-card p-4 bg-card border border-border-main rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-step-bg px-3 py-2 rounded-xl border border-border-main">
            <Calendar size={15} className="text-primary shrink-0" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-black text-xs outline-none cursor-pointer text-text-main"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center bg-step-bg p-1 rounded-xl border border-border-main text-xs font-bold">
            <button
              onClick={() => setFilterRole('all')}
              className={cn("px-2.5 py-1 rounded-lg transition-all cursor-pointer", filterRole === 'all' ? "bg-primary text-white font-black" : "text-text-light")}
            >
              সকল
            </button>
            <button
              onClick={() => setFilterRole('teacher')}
              className={cn("px-2.5 py-1 rounded-lg transition-all cursor-pointer", filterRole === 'teacher' ? "bg-primary text-white font-black" : "text-text-light")}
            >
              শিক্ষক
            </button>
            <button
              onClick={() => setFilterRole('staff')}
              className={cn("px-2.5 py-1 rounded-lg transition-all cursor-pointer", filterRole === 'staff' ? "bg-primary text-white font-black" : "text-text-light")}
            >
              কর্মী
            </button>
          </div>

          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="p-2 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main cursor-pointer"
          >
            <option value="all">সকল বিভাগ</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main cursor-pointer"
          >
            <option value="all">সকল স্ট্যাটাস</option>
            <option value="present">উপস্থিত</option>
            <option value="late">দেরিতে</option>
            <option value="absent">অনুপস্থিত</option>
            <option value="leave">ছুটি</option>
            <option value="on-duty">অন-ডিউটি</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/40" size={14} />
          <input 
            type="text" 
            placeholder="নাম বা পদবী খুঁজুন..."
            className="w-full pl-8 pr-3 py-2 bg-step-bg border border-border-main rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Real-time Personnel Attendance Table */}
      <div className="bento-card bg-card border border-border-main rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-step-bg border-b border-border-main font-black text-text-light/70 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">সদস্য</th>
                <th className="p-3.5">টাইপ ও বিভাগ</th>
                <th className="p-3.5 text-center">শিডিউল শিফট</th>
                <th className="p-3.5 text-center">ইন / আউট সময়</th>
                <th className="p-3.5 text-center">কর্মঘণ্টা ও ওটি</th>
                <th className="p-3.5 text-center">পাঞ্চ কাউন্ট</th>
                <th className="p-3.5 text-center">স্ট্যাটাস</th>
                <th className="p-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50 font-bold text-text-main">
              {filteredRoster.map((person) => (
                <tr key={person.id} className="hover:bg-step-bg/60 transition-colors">
                  {/* Name & ID */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black flex items-center justify-center text-xs">
                        {person.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-black block">{person.name}</span>
                        <span className="text-[10px] text-text-light/60 font-semibold">{person.designation}</span>
                      </div>
                    </div>
                  </td>

                  {/* Role and Department */}
                  <td className="p-3.5">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black inline-block mb-0.5",
                      person.roleType === 'teacher' ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"
                    )}>
                      {person.roleType === 'teacher' ? 'শিক্ষক' : 'কর্মী'}
                    </span>
                    <span className="text-[11px] text-text-light/70 block">{person.department}</span>
                  </td>

                  {/* Scheduled Shift */}
                  <td className="p-3.5 text-center text-[11px]">
                    <span className="font-bold text-text-light/80 block">{person.standardIn} - {person.standardOut}</span>
                    <span className="text-[9px] text-text-light/50">৮.০০ ঘণ্টা শিফট</span>
                  </td>

                  {/* In & Out Time */}
                  <td className="p-3.5 text-center">
                    <div className="inline-flex items-center gap-1.5 bg-step-bg px-2.5 py-1 rounded-lg border border-border-main text-[11px] font-black">
                      <span className="text-emerald-600">{person.inTime}</span>
                      <span className="text-text-light/40">•</span>
                      <span className="text-rose-600">{person.outTime}</span>
                    </div>
                  </td>

                  {/* Working Hours & OT */}
                  <td className="p-3.5 text-center">
                    <span className="font-black text-text-main block">{enToBnNumber(person.workingHours)} ঘণ্টা</span>
                    {person.overtimeHours > 0 ? (
                      <span className="text-[10px] font-black text-emerald-600">+OT {enToBnNumber(person.overtimeHours)} ঘ:</span>
                    ) : (
                      <span className="text-[10px] text-text-light/40">--</span>
                    )}
                  </td>

                  {/* Punch Count */}
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 bg-step-bg rounded-md border border-border-main font-black text-[11px]">
                      {enToBnNumber(person.punchCount)} বার
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="p-3.5 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-black",
                        person.status === 'present' ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20" :
                        person.status === 'late' ? "bg-amber-500/15 text-amber-600 border border-amber-500/20" :
                        person.status === 'absent' ? "bg-rose-500/15 text-rose-600 border border-rose-500/20" :
                        "bg-blue-500/15 text-blue-600 border border-blue-500/20"
                      )}>
                        {person.status === 'present' ? 'উপস্থিত' :
                         person.status === 'late' ? 'দেরিতে' :
                         person.status === 'absent' ? 'অনুপস্থিত' :
                         person.status === 'leave' ? 'ছুটি' : 'অন-ডিউটি'}
                      </span>
                      {person.isOverridden && (
                        <span className="text-[9px] text-primary font-bold">ওভাররাইড</span>
                      )}
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenOverride(person)}
                        className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                        title="ম্যানুয়াল ওভাররাইড করুন"
                      >
                        <Edit3 size={13} />
                        <span className="hidden sm:inline text-[10px]">ওভাররাইড</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewingPerson({ ...person, type: person.roleType })}
                        className="p-1.5 bg-step-bg hover:bg-border-main text-text-light hover:text-text-main rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-colors border border-border-main"
                        title="সম্পূর্ণ হাজিরা রিপোর্ট দেখুন"
                      >
                        <Eye size={13} />
                        <span className="hidden sm:inline text-[10px]">ভিউ</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRoster.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-text-light/50 font-bold">
                    কোন রেকর্ড খুঁজে পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override Modal Dialog */}
      <AnimatePresence>
        {overridePerson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border-main rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border-main pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="text-primary" size={18} />
                  <h3 className="font-black text-base text-text-main">হাজিরা ম্যানুয়াল ওভাররাইড</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOverridePerson(null)}
                  className="p-1.5 text-text-light hover:text-text-main rounded-lg hover:bg-step-bg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-3 bg-step-bg rounded-xl border border-border-main flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center text-sm">
                  {overridePerson.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-xs text-text-main">{overridePerson.name}</h4>
                  <p className="text-[10px] text-text-light/60 font-bold">
                    {overridePerson.designation} • {overridePerson.department}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveOverride} className="space-y-4">
                {/* Status Selection */}
                <div>
                  <label className="text-xs font-black text-text-main block mb-1.5">হাজিরা স্ট্যাটাস</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'present', label: 'উপস্থিত' },
                      { id: 'late', label: 'দেরিতে' },
                      { id: 'absent', label: 'অনুপস্থিত' },
                      { id: 'leave', label: 'ছুটি' },
                      { id: 'on-duty', label: 'অন-ডিউটি' },
                      { id: 'half-day', label: 'অর্ধদিবস' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setOverrideForm({ ...overrideForm, status: st.id as any })}
                        className={cn(
                          "py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                          overrideForm.status === st.id 
                            ? "bg-primary text-white shadow-md shadow-primary/20" 
                            : "bg-step-bg text-text-light border border-border-main hover:bg-card"
                        )}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* In and Out Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-text-light/80 block mb-1">প্রবেশ সময় (In Time)</label>
                    <input 
                      type="time" 
                      value={overrideForm.inTime}
                      onChange={(e) => setOverrideForm({ ...overrideForm, inTime: e.target.value })}
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-text-light/80 block mb-1">প্রস্থান সময় (Out Time)</label>
                    <input 
                      type="time" 
                      value={overrideForm.outTime}
                      onChange={(e) => setOverrideForm({ ...overrideForm, outTime: e.target.value })}
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                    />
                  </div>
                </div>

                {/* Reason & Remarks */}
                <div>
                  <label className="text-[11px] font-bold text-text-light/80 block mb-1">ওভাররাইডের কারণ ও মন্তব্য</label>
                  <input 
                    type="text" 
                    value={overrideForm.remarks}
                    onChange={(e) => setOverrideForm({ ...overrideForm, remarks: e.target.value })}
                    placeholder="যেমন: অফিসিয়াল দায়িত্ব পালন, পাঞ্চ মিস ইত্যাদি"
                    className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-main">
                  <button
                    type="button"
                    onClick={() => setOverridePerson(null)}
                    className="px-4 py-2 bg-step-bg border border-border-main text-text-light rounded-xl text-xs font-black cursor-pointer hover:bg-card"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-primary/25 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>সংরক্ষণ করুন</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tipsoi Biometric Sync Modal */}
      {showTipsoiModal && (
        <TipsoiSyncModal
          isOpen={showTipsoiModal}
          onClose={() => setShowTipsoiModal(false)}
          selectedDate={selectedDate}
          teachers={teachers}
          staffMembers={staffMembers}
          defaultScope="all"
        />
      )}

      {/* Detailed Individual Attendance Report Modal */}
      {viewingPerson && (
        <TeacherStaffAttendanceReportModal
          isOpen={!!viewingPerson}
          onClose={() => setViewingPerson(null)}
          person={viewingPerson}
          selectedDate={selectedDate}
          allRecords={viewingPerson.roleType === 'teacher' ? teacherRecords : staffRecords}
          madrasahBranding={madrasahBranding}
        />
      )}

      {/* Clear Test & Dummy Data Confirmation Modal */}
      <AnimatePresence>
        {showClearDataModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 className="font-black text-base text-text-main">হাজিরা ও মেসেজিং ডাটা মুছবেন?</h3>
                  <p className="text-[11px] text-text-light/70 font-bold">সকল টেস্ট এবং ডামি রেকর্ড মুছে ফেলা হবে</p>
                </div>
              </div>

              <p className="text-xs text-text-light/80 leading-relaxed font-bold bg-rose-500/5 p-3 rounded-xl border border-rose-500/20">
                এই অপশনটি নিশ্চিত করলে স্থানীয় ডাটাবেস থেকে পূর্বের সকল টেস্ট পাঞ্চ, শিক্ষক ও কর্মী হাজিরা রেকর্ড এবং এসএমএস লগ মুছে যাবে। এরপর টিপসই এপিআই থেকে ফ্রেশ রিয়েল-টাইম ডাটা সিঙ্ক করা যাবে।
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearDataModal(false)}
                  className="px-4 py-2 bg-step-bg border border-border-main text-text-light rounded-xl text-xs font-black cursor-pointer hover:bg-card"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleClearAllData}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-600/25 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>হ্যাঁ, সম্পূর্ণ মুছে দিন</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
