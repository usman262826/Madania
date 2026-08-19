import React, { useState, useMemo, useEffect } from 'react';
import { 
  UserRound, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Briefcase, 
  Sliders, 
  FileSpreadsheet, 
  Printer, 
  DollarSign, 
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
  Send,
  Award,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  StaffAttendanceRecord, 
  StaffLeaveRequest, 
  StaffLeaveBalance, 
  StaffMonthlySalary, 
  DEFAULT_STAFF_LEAVE_ALLOCATIONS 
} from '../../types/attendance';
import { Staff } from '../../types';
import { useData } from '../../contexts/DataContext';
import { enToBnNumber, cn, formatDateToDDMMYYYY } from '../../lib/utils';
import { calculateWorkingHours, calculateStaffPayroll, checkAndProcessLeave } from '../../utils/attendanceCalculators';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const StaffAttendance: React.FC = () => {
  const { staffMembers, teachers, madrasahBranding, updateData } = useData();
  const [activeTab, setActiveTab] = useState<'daily' | 'leaves' | 'leave_balances' | 'payroll' | 'reports'>('daily');

  // Unified Staff & Teachers List
  const allStaff = useMemo(() => {
    const list: Array<{ id: string; name: string; designation: string; department: string; mobile?: string; salary?: number }> = [];
    const seen = new Set<string>();

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

    teachers.forEach((t: any) => {
      const id = String(t.id || t.mobile);
      if (!seen.has(id)) {
        seen.add(id);
        list.push({
          id,
          name: t.name,
          designation: t.designation || 'ওস্তাদ/শিক্ষক',
          department: t.department || 'শিক্ষা বিভাগ',
          mobile: t.mobile,
          salary: Number(t.salary || 18000)
        });
      }
    });

    if (list.length === 0) {
      list.push(
        { id: 'STF-01', name: 'হাফেজ মোশাররফ হোসেন', designation: 'অফিস সহকারী ও হিসাবরক্ষক', department: 'হিসাব শাখা', salary: 16000 },
        { id: 'STF-02', name: 'মোঃ আব্দুল কুদ্দুস', designation: 'বাবুর্চি প্রধান', department: 'বোর্ডিং ও কিচেন', salary: 14000 },
        { id: 'STF-03', name: 'মোঃ রফিকুল ইসলাম', designation: 'নিরাপত্তা প্রহরী', department: 'নিরাপত্তা শাখা', salary: 12000 },
        { id: 'STF-04', name: 'হাফেজ শফিকুল ইসলাম', designation: 'সহকারী খাদেম', department: 'পরিচ্ছন্নতা শাখা', salary: 11000 }
      );
    }

    return list;
  }, [staffMembers, teachers]);

  // Date and filters
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });
  const [searchTerm, setSearchTerm] = useState('');

  // -------------------------------------------------------------
  // STAFF ATTENDANCE DB STATE
  // -------------------------------------------------------------
  const [attendanceRecords, setAttendanceRecords] = useState<StaffAttendanceRecord[]>(() => {
    const saved = localStorage.getItem('madrasah_staff_attendance_records');
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
    localStorage.setItem('madrasah_staff_attendance_records', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  // -------------------------------------------------------------
  // HR LEAVE REQUESTS DB STATE
  // -------------------------------------------------------------
  const [leaveRequests, setLeaveRequests] = useState<StaffLeaveRequest[]>(() => {
    const saved = localStorage.getItem('madrasah_staff_leave_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    // Initial sample leave requests
    return [
      {
        id: 'leave-101',
        staffId: 'STF-01',
        staffName: 'হাফেজ মোশাররফ হোসেন',
        designation: 'অফিস সহকারী',
        department: 'হিসাব শাখা',
        leaveType: 'casual',
        startDate: '2026-08-10',
        endDate: '2026-08-12',
        daysApplied: 3,
        reason: 'পারিবারিক জরুরি কাজ ও আত্মীয়র বিয়ে',
        status: 'approved',
        supervisorStatus: 'approved',
        hrStatus: 'approved',
        approvedBy: 'মুহতামিম',
        approvalDate: '2026-08-08',
        appliedAt: '2026-08-07T10:00:00Z'
      },
      {
        id: 'leave-102',
        staffId: 'STF-02',
        staffName: 'মোঃ আব্দুল কুদ্দুস',
        designation: 'বাবুর্চি প্রধান',
        department: 'বোর্ডিং ও কিচেন',
        leaveType: 'sick',
        startDate: '2026-08-15',
        endDate: '2026-08-16',
        daysApplied: 2,
        reason: 'জ্বর ও শারীরিক অসুস্থতা',
        status: 'pending',
        supervisorStatus: 'approved',
        hrStatus: 'pending',
        appliedAt: '2026-08-14T08:30:00Z'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('madrasah_staff_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  // -------------------------------------------------------------
  // LEAVE BALANCES DB STATE
  // -------------------------------------------------------------
  const [leaveBalances, setLeaveBalances] = useState<StaffLeaveBalance[]>(() => {
    const saved = localStorage.getItem('madrasah_staff_leave_balances');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('madrasah_staff_leave_balances', JSON.stringify(leaveBalances));
  }, [leaveBalances]);

  // Synchronize leave balances for any new staff members
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const updated = [...leaveBalances];
    let changed = false;

    allStaff.forEach(st => {
      const found = updated.find(b => b.staffId === st.id && b.year === currentYear);
      if (!found) {
        changed = true;
        // Count used approved leaves
        const approvedCasual = leaveRequests
          .filter(l => l.staffId === st.id && l.leaveType === 'casual' && l.status === 'approved')
          .reduce((sum, l) => sum + l.daysApplied, 0);

        const approvedSick = leaveRequests
          .filter(l => l.staffId === st.id && l.leaveType === 'sick' && l.status === 'approved')
          .reduce((sum, l) => sum + l.daysApplied, 0);

        const approvedEmergency = leaveRequests
          .filter(l => l.staffId === st.id && l.leaveType === 'emergency' && l.status === 'approved')
          .reduce((sum, l) => sum + l.daysApplied, 0);

        updated.push({
          id: `bal-${st.id}-${currentYear}`,
          staffId: st.id,
          staffName: st.name,
          year: currentYear,
          casualLeaveAllocated: DEFAULT_STAFF_LEAVE_ALLOCATIONS.casual,
          casualLeaveUsed: approvedCasual,
          casualLeaveBalance: Math.max(0, DEFAULT_STAFF_LEAVE_ALLOCATIONS.casual - approvedCasual),
          
          sickLeaveAllocated: DEFAULT_STAFF_LEAVE_ALLOCATIONS.sick,
          sickLeaveUsed: approvedSick,
          sickLeaveBalance: Math.max(0, DEFAULT_STAFF_LEAVE_ALLOCATIONS.sick - approvedSick),
          
          emergencyLeaveAllocated: DEFAULT_STAFF_LEAVE_ALLOCATIONS.emergency,
          emergencyLeaveUsed: approvedEmergency,
          emergencyLeaveBalance: Math.max(0, DEFAULT_STAFF_LEAVE_ALLOCATIONS.emergency - approvedEmergency),
        });
      }
    });

    if (changed) {
      setLeaveBalances(updated);
    }
  }, [allStaff, leaveRequests, leaveBalances]);

  // -------------------------------------------------------------
  // STAFF PAYROLL RECORDS STATE
  // -------------------------------------------------------------
  const [payrollRecords, setPayrollRecords] = useState<StaffMonthlySalary[]>(() => {
    const saved = localStorage.getItem('madrasah_staff_payroll_records');
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
    localStorage.setItem('madrasah_staff_payroll_records', JSON.stringify(payrollRecords));
  }, [payrollRecords]);

  // Modals state
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [newLeaveForm, setNewLeaveForm] = useState({
    staffId: '',
    leaveType: 'casual' as 'casual' | 'sick' | 'emergency' | 'unpaid',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const [activePaySlip, setActivePaySlip] = useState<StaffMonthlySalary | null>(null);

  // Day records map
  const dayRecordsMap = useMemo(() => {
    const map: Record<string, StaffAttendanceRecord> = {};
    attendanceRecords.forEach(r => {
      if (r.attendanceDate === selectedDate) {
        map[r.staffId] = r;
      }
    });
    return map;
  }, [attendanceRecords, selectedDate]);

  // Update attendance for a single staff member
  const handleStaffAttendanceChange = (
    staff: { id: string; name: string; designation: string; department: string },
    updates: Partial<StaffAttendanceRecord>
  ) => {
    const existing = dayRecordsMap[staff.id];
    const inTime = updates.inTime !== undefined ? updates.inTime : (existing?.inTime || '08:00');
    const outTime = updates.outTime !== undefined ? updates.outTime : (existing?.outTime || '17:00');
    const status = updates.status !== undefined ? updates.status : (existing?.status || 'present');
    const remarks = updates.remarks !== undefined ? updates.remarks : (existing?.remarks || '');

    const { workingHours } = calculateWorkingHours(inTime, outTime);
    const overtimeHours = Math.max(0, Number((workingHours - 8).toFixed(2)));

    const newRecord: StaffAttendanceRecord = {
      id: existing?.id || `satt-${staff.id}-${selectedDate}`,
      staffId: staff.id,
      staffName: staff.name,
      designation: staff.designation,
      department: staff.department,
      attendanceDate: selectedDate,
      status,
      inTime,
      outTime,
      totalHours: workingHours,
      overtimeHours,
      deductionAmount: 0,
      remarks,
      markedAt: new Date().toISOString()
    };

    const updated = attendanceRecords.filter(r => !(r.staffId === staff.id && r.attendanceDate === selectedDate));
    updated.push(newRecord);
    setAttendanceRecords(updated);
  };

  // Bulk mark all staff present / absent
  const handleBulkStaffAttendance = (status: 'present' | 'absent') => {
    const updated = attendanceRecords.filter(r => r.attendanceDate !== selectedDate);
    allStaff.forEach(s => {
      const inTime = status === 'present' ? '08:00' : '';
      const outTime = status === 'present' ? '17:00' : '';
      const totalHours = status === 'present' ? 9 : 0;
      const overtimeHours = status === 'present' ? 1 : 0;

      updated.push({
        id: `satt-${s.id}-${selectedDate}`,
        staffId: s.id,
        staffName: s.name,
        designation: s.designation,
        department: s.department,
        attendanceDate: selectedDate,
        status,
        inTime,
        outTime,
        totalHours,
        overtimeHours,
        deductionAmount: 0,
        remarks: '',
        markedAt: new Date().toISOString()
      });
    });

    setAttendanceRecords(updated);
    toast.success(`সকল কর্মীর হাজিরা "${status === 'present' ? 'উপস্থিত' : 'অনুপস্থিত'}" করা হয়েছে!`);
  };

  // Submit Leave Request
  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveForm.staffId) {
      toast.error('অনুগ্রহ করে কর্মী নির্বাচন করুন');
      return;
    }

    const st = allStaff.find(s => s.id === newLeaveForm.staffId);
    if (!st) return;

    const start = new Date(newLeaveForm.startDate);
    const end = new Date(newLeaveForm.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysApplied = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check balance
    const currentYear = new Date().getFullYear();
    const balance = leaveBalances.find(b => b.staffId === st.id && b.year === currentYear) || {
      id: '',
      staffId: st.id,
      year: currentYear,
      casualLeaveAllocated: 12,
      casualLeaveUsed: 0,
      casualLeaveBalance: 12,
      sickLeaveAllocated: 10,
      sickLeaveUsed: 0,
      sickLeaveBalance: 10,
      emergencyLeaveAllocated: 5,
      emergencyLeaveUsed: 0,
      emergencyLeaveBalance: 5
    };

    const check = checkAndProcessLeave(st.id, { leaveType: newLeaveForm.leaveType, daysApplied }, balance);
    if (!check.isValid) {
      toast.error(check.reason || 'পর্যাপ্ত ছুটি নেই!');
      return;
    }

    const newLeave: StaffLeaveRequest = {
      id: `leave-${Date.now()}`,
      staffId: st.id,
      staffName: st.name,
      designation: st.designation,
      department: st.department,
      leaveType: newLeaveForm.leaveType,
      startDate: newLeaveForm.startDate,
      endDate: newLeaveForm.endDate,
      daysApplied,
      reason: newLeaveForm.reason || 'ব্যক্তিগত ছুটি',
      status: 'pending',
      supervisorStatus: 'pending',
      hrStatus: 'pending',
      appliedAt: new Date().toISOString()
    };

    setLeaveRequests([newLeave, ...leaveRequests]);
    setShowApplyLeaveModal(false);
    toast.success('ছুটির আবেদন সফলভাবে সাবমিট হয়েছে এবং অনুমোদনের জন্য অপেক্ষমান!');
  };

  // Approve / Reject Leave
  const handleUpdateLeaveStatus = (leaveId: string, newStatus: 'approved' | 'rejected') => {
    const updated = leaveRequests.map(l => {
      if (l.id === leaveId) {
        return {
          ...l,
          status: newStatus,
          hrStatus: newStatus,
          supervisorStatus: newStatus,
          approvedBy: 'এইচআর ম্যানেজার / মুহতামিম',
          approvalDate: new Date().toISOString().split('T')[0]
        };
      }
      return l;
    });

    setLeaveRequests(updated);
    toast.success(`ছুটির আবেদন সফলভাবে "${newStatus === 'approved' ? 'অনুমোদিত' : 'বাতিল'}" করা হয়েছে!`);
  };

  // Generate Automated Staff Payroll
  const handleGeneratePayroll = () => {
    const generated: StaffMonthlySalary[] = [];

    allStaff.forEach(staff => {
      const payrollObj = calculateStaffPayroll(
        staff,
        selectedMonth,
        attendanceRecords,
        leaveRequests
      );
      generated.push(payrollObj);
    });

    const otherMonths = payrollRecords.filter(p => p.month !== selectedMonth);
    setPayrollRecords([...otherMonths, ...generated]);
    toast.success(`${selectedMonth} মাসের স্টাফ ও কর্মচারীদের পেরোল/বেতন প্রস্তুত হয়েছে!`);
  };

  const currentMonthPayrolls = useMemo(() => {
    return payrollRecords.filter(p => p.month === selectedMonth);
  }, [payrollRecords, selectedMonth]);

  return (
    <div className="space-y-6 text-left font-hind-siliguri pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bento-card p-6 md:p-8 bg-card border border-border-main relative overflow-hidden rounded-[2rem] shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
              Staff Attendance, Leave Management & Payroll
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-main">
            কর্মী হাজিরা, ছুটি ও পেরোল ব্যবস্থাপনা
          </h1>
          <p className="text-xs text-text-light/60 font-bold mt-1">
            দৈনিক হাজিরা, ক্যাজুয়াল/মেডিকেল লিভ ব্যালেন্স, ছুটি অনুমোদন ওয়ার্কফ্লো এবং স্বয়ংক্রিয় পেরোল
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
            <span>দৈনিক হাজিরা</span>
          </button>

          <button
            onClick={() => setActiveTab('leaves')}
            className={cn(
              "px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer",
              activeTab === 'leaves'
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-step-bg text-text-light hover:text-text-main border border-border-main"
            )}
          >
            <Briefcase size={16} />
            <span>ছুটি অনুমোদন</span>
          </button>

          <button
            onClick={() => setActiveTab('leave_balances')}
            className={cn(
              "px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer",
              activeTab === 'leave_balances'
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-step-bg text-text-light hover:text-text-main border border-border-main"
            )}
          >
            <Layers size={16} />
            <span>ছুটি ব্যালেন্স</span>
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={cn(
              "px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer",
              activeTab === 'payroll'
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-step-bg text-text-light hover:text-text-main border border-border-main"
            )}
          >
            <DollarSign size={16} />
            <span>অটো পেরোল</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DAILY STAFF ATTENDANCE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
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
                onClick={() => handleBulkStaffAttendance('present')}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 size={15} />
                <span>সবাই উপস্থিত</span>
              </button>

              <button
                onClick={() => handleBulkStaffAttendance('absent')}
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
                placeholder="কর্মীর নাম খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 bg-step-bg border border-border-main rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allStaff
              .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((staff) => {
                const rec = dayRecordsMap[staff.id];
                const status = rec?.status || 'present';
                const inTime = rec?.inTime || '08:00';
                const outTime = rec?.outTime || '17:00';
                const totalHours = rec?.totalHours || 9;
                const overtimeHours = rec?.overtimeHours || 1;

                return (
                  <div
                    key={staff.id}
                    className={cn(
                      "p-5 rounded-2xl border transition-all bg-card space-y-4 shadow-sm",
                      status === 'present' ? "border-emerald-500/30" :
                      status === 'absent' ? "border-rose-500/40 bg-rose-500/5" :
                      status === 'late' ? "border-amber-500/40 bg-amber-500/5" :
                      status === 'leave' ? "border-blue-500/40 bg-blue-500/5" :
                      "border-border-main"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-base">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-text-main">{staff.name}</h4>
                          <p className="text-[11px] text-text-light/60 font-bold">
                            {staff.designation} • {staff.department}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-black text-text-light/50 uppercase block">কর্মঘণ্টা</span>
                        <span className="text-xs font-black text-primary mt-0.5 inline-block">
                          {enToBnNumber(totalHours)} ঘণ্টা
                        </span>
                      </div>
                    </div>

                    {/* Status buttons */}
                    <div className="grid grid-cols-5 gap-1.5 p-1 bg-step-bg rounded-xl border border-border-main/50">
                      {[
                        { id: 'present', label: 'উপস্থিত' },
                        { id: 'late', label: 'দেরিতে' },
                        { id: 'absent', label: 'অনুপস্থিত' },
                        { id: 'leave', label: 'ছুটি' },
                        { id: 'on-duty', label: 'অন-ডিউটি' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleStaffAttendanceChange(staff, { status: item.id as any })}
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

                    {/* In / Out time */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-bold">
                      <div className="space-y-1">
                        <label className="text-[10px] text-text-light/60">প্রবেশ সময় (In Time)</label>
                        <input 
                          type="time" 
                          value={inTime}
                          onChange={(e) => handleStaffAttendanceChange(staff, { inTime: e.target.value })}
                          className="w-full p-2 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-text-light/60">প্রস্থান সময় (Out Time)</label>
                        <input 
                          type="time" 
                          value={outTime}
                          onChange={(e) => handleStaffAttendanceChange(staff, { outTime: e.target.value })}
                          className="w-full p-2 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none"
                        />
                      </div>

                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] text-text-light/60">ওভারটাইম</label>
                        <div className="p-2 bg-step-bg border border-border-main rounded-xl text-xs font-black text-emerald-600 flex items-center justify-between">
                          <span>{overtimeHours > 0 ? `+${enToBnNumber(overtimeHours)} ঘ:` : '০'}</span>
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
      {/* 2. HR LEAVE MANAGEMENT & APPROVAL WORKFLOW TAB */}
      {/* ========================================================================= */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bento-card p-6 bg-card border border-border-main rounded-2xl">
            <div>
              <h3 className="text-xl font-black text-text-main flex items-center gap-2">
                <Briefcase className="text-primary" size={20} />
                <span>ছুটি আবেদন ও অনুমোদন ওয়ার্কফ্লো</span>
              </h3>
              <p className="text-xs text-text-light/60 font-bold mt-0.5">
                ক্যাজুয়াল, মেডিকেল, ইমার্জেন্সি ও অবৈতনিক ছুটির আবেদন এবং অনুমোদন
              </p>
            </div>

            <button
              onClick={() => {
                setNewLeaveForm({
                  staffId: allStaff[0]?.id || '',
                  leaveType: 'casual',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                  reason: ''
                });
                setShowApplyLeaveModal(true);
              }}
              className="px-4 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
            >
              <Plus size={16} />
              <span>নতুন ছুটির আবেদন দাখিল</span>
            </button>
          </div>

          {/* Leave Requests Table */}
          <div className="bento-card bg-card border border-border-main rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-hind-siliguri text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-step-bg border-b border-border-main text-[10px] font-black uppercase text-text-light/60 tracking-wider">
                    <th className="p-4">কর্মী / আবেদনকারী</th>
                    <th className="p-4">ছুটির ধরন</th>
                    <th className="p-4 text-center">তারিখ ও সময়কাল</th>
                    <th className="p-4 text-center">দিন</th>
                    <th className="p-4">ছুটির কারণ</th>
                    <th className="p-4 text-center">স্ট্যাটাস</th>
                    <th className="p-4 text-center">অনুমোদন অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/40">
                  {leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-text-light/40 font-black">
                        কোন ছুটির আবেদন পাওয়া যায়নি!
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-step-bg/30 transition-colors">
                        <td className="p-4">
                          <p className="font-black text-text-main">{req.staffName}</p>
                          <span className="text-[10px] text-text-light/60 font-bold">{req.designation} • {req.department}</span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black",
                            req.leaveType === 'casual' ? "bg-blue-500/15 text-blue-600" :
                            req.leaveType === 'sick' ? "bg-amber-500/15 text-amber-600" :
                            req.leaveType === 'emergency' ? "bg-rose-500/15 text-rose-600" :
                            "bg-purple-500/15 text-purple-600"
                          )}>
                            {req.leaveType === 'casual' ? 'নৈমিত্তিক (Casual)' :
                             req.leaveType === 'sick' ? 'চিকিৎসা (Sick)' :
                             req.leaveType === 'emergency' ? 'জরুরি (Emergency)' : 'অবৈতনিক (Unpaid)'}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-text-main">
                          {req.startDate} থেকে {req.endDate}
                        </td>
                        <td className="p-4 text-center font-black text-primary">
                          {enToBnNumber(req.daysApplied)} দিন
                        </td>
                        <td className="p-4 font-medium text-text-light/80 max-w-[200px] truncate">
                          {req.reason}
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black",
                            req.status === 'approved' ? "bg-emerald-500/15 text-emerald-600" :
                            req.status === 'rejected' ? "bg-rose-500/15 text-rose-600" :
                            "bg-amber-500/15 text-amber-600"
                          )}>
                            {req.status === 'approved' ? 'অনুমোদিত' : req.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমান'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleUpdateLeaveStatus(req.id, 'approved')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-sm"
                              >
                                অনুমোদন করুন
                              </button>
                              <button
                                onClick={() => handleUpdateLeaveStatus(req.id, 'rejected')}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-sm"
                              >
                                বাতিল
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-text-light/50 font-bold">নিষ্পন্ন</span>
                          )}
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
      {/* 3. LEAVE BALANCES TRACKER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'leave_balances' && (
        <div className="space-y-6">
          <div className="bento-card p-6 bg-card border border-border-main rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-black text-text-main flex items-center gap-2">
                <Layers className="text-primary" size={20} />
                <span>বার্ষিক ছুটি ব্যালেন্স ও হিসেব ({new Date().getFullYear()})</span>
              </h3>
              <p className="text-xs text-text-light/60 font-bold mt-0.5">
                প্রত্যেক কর্মীর ক্যাজুয়াল (১২ দিন), মেডিকেল (১০ দিন) এবং ইমার্জেন্সি (৫ দিন) ছুটির ব্যালেন্স
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaveBalances.map((bal) => (
              <div 
                key={bal.id}
                className="bento-card p-6 bg-card border border-border-main rounded-2xl space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-border-main/50">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-sm">
                    {bal.staffName?.charAt(0) || 'ক'}
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-text-main">{bal.staffName}</h4>
                    <span className="text-[10px] text-text-light/60 font-bold">বছর: {bal.year}</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-bold">
                  {/* Casual Leave */}
                  <div className="p-3 bg-step-bg rounded-xl space-y-1.5">
                    <div className="flex justify-between text-text-main">
                      <span>নৈমিত্তিক ছুটি (Casual)</span>
                      <span className="font-black text-primary">{enToBnNumber(bal.casualLeaveBalance)} দিন বাকি</span>
                    </div>
                    <div className="w-full bg-border-main h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full" 
                        style={{ width: `${(bal.casualLeaveUsed / bal.casualLeaveAllocated) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-light/60 block">
                      ব্যবহৃত: {enToBnNumber(bal.casualLeaveUsed)} / বরাদ্দ: {enToBnNumber(bal.casualLeaveAllocated)} দিন
                    </span>
                  </div>

                  {/* Sick Leave */}
                  <div className="p-3 bg-step-bg rounded-xl space-y-1.5">
                    <div className="flex justify-between text-text-main">
                      <span>চিকিৎসা ছুটি (Sick)</span>
                      <span className="font-black text-emerald-600">{enToBnNumber(bal.sickLeaveBalance)} দিন বাকি</span>
                    </div>
                    <div className="w-full bg-border-main h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full" 
                        style={{ width: `${(bal.sickLeaveUsed / bal.sickLeaveAllocated) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-light/60 block">
                      ব্যবহৃত: {enToBnNumber(bal.sickLeaveUsed)} / বরাদ্দ: {enToBnNumber(bal.sickLeaveAllocated)} দিন
                    </span>
                  </div>

                  {/* Emergency Leave */}
                  <div className="p-3 bg-step-bg rounded-xl space-y-1.5">
                    <div className="flex justify-between text-text-main">
                      <span>জরুরি ছুটি (Emergency)</span>
                      <span className="font-black text-amber-600">{enToBnNumber(bal.emergencyLeaveBalance)} দিন বাকি</span>
                    </div>
                    <div className="w-full bg-border-main h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full" 
                        style={{ width: `${(bal.emergencyLeaveUsed / bal.emergencyLeaveAllocated) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-light/60 block">
                      ব্যবহৃত: {enToBnNumber(bal.emergencyLeaveUsed)} / বরাদ্দ: {enToBnNumber(bal.emergencyLeaveAllocated)} দিন
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. AUTOMATED STAFF PAYROLL GENERATOR TAB */}
      {/* ========================================================================= */}
      {activeTab === 'payroll' && (
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
                onClick={handleGeneratePayroll}
                className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-primary/25 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>হাজিরা ও ছুটির উপর ভিত্তি করে পেরোল জেনারেট করুন</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const dataRows = currentMonthPayrolls.map((p, idx) => ({
                    'ক্রমিক': idx + 1,
                    'কর্মীর নাম': p.staffName,
                    'পদবি': p.designation,
                    'বিভাগ': p.department,
                    'মূল বেতন': p.baseSalary,
                    'অনুপস্থিতি কর্তন': p.absentDeduction,
                    'ছুটি কর্তন': p.leaveDeduction,
                    'ওভারটাইম ভাতা': p.overtimePay,
                    'বোনাস': p.bonus,
                    'নিট প্রদেয় বেতন': p.netSalary,
                    'স্ট্যাটাস': p.paymentStatus === 'paid' ? 'পরিশোধিত' : 'অপেক্ষমান'
                  }));
                  const ws = XLSX.utils.json_to_sheet(dataRows);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Staff_Payroll');
                  XLSX.writeFile(wb, `Staff_Payroll_${selectedMonth}.xlsx`);
                  toast.success('পেরোল শিট ডাউনলোড সফল হয়েছে!');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>এক্সেল ডাউনলোড</span>
              </button>
            </div>
          </div>

          <div className="bento-card bg-card border border-border-main rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-border-main/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-text-main">
                  {selectedMonth} মাসের কর্মী ও কর্মচারীদের পেরোল বিবরণী
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-hind-siliguri text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-step-bg border-b border-border-main text-[10px] font-black uppercase text-text-light/60 tracking-wider">
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4">কর্মীর নাম</th>
                    <th className="p-4">পদবি ও বিভাগ</th>
                    <th className="p-4 text-right">মূল বেতন</th>
                    <th className="p-4 text-right text-rose-600">অনুপস্থিতি কর্তন</th>
                    <th className="p-4 text-right text-rose-600">অবৈতনিক ছুটি কর্তন</th>
                    <th className="p-4 text-right text-emerald-600">ওভারটাইম ভাতা</th>
                    <th className="p-4 text-right font-black text-primary">নিট প্রদেয়</th>
                    <th className="p-4 text-center">স্ট্যাটাস</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/40">
                  {currentMonthPayrolls.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-12 text-center text-text-light/40 font-black">
                        এই মাসের কোনো পেরোল প্রস্তুত করা হয়নি। উপরে "পেরোল জেনারেট করুন" বাটনে ক্লিক করুন।
                      </td>
                    </tr>
                  ) : (
                    currentMonthPayrolls.map((pay, idx) => (
                      <tr key={pay.id} className="hover:bg-step-bg/30 transition-colors">
                        <td className="p-4 text-center font-bold text-text-light/60">
                          {enToBnNumber(idx + 1)}
                        </td>
                        <td className="p-4 font-black text-text-main">
                          {pay.staffName}
                        </td>
                        <td className="p-4 font-bold text-text-light/80">
                          {pay.designation} • {pay.department}
                        </td>
                        <td className="p-4 text-right font-bold text-text-main">
                          ৳ {enToBnNumber(pay.baseSalary)}
                        </td>
                        <td className="p-4 text-right font-black text-rose-600">
                          -৳ {enToBnNumber(pay.absentDeduction)}
                        </td>
                        <td className="p-4 text-right font-black text-rose-600">
                          -৳ {enToBnNumber(pay.leaveDeduction)}
                        </td>
                        <td className="p-4 text-right font-black text-emerald-600">
                          +৳ {enToBnNumber(pay.overtimePay)}
                        </td>
                        <td className="p-4 text-right font-black text-primary text-sm">
                          ৳ {enToBnNumber(pay.netSalary)}
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black",
                            pay.paymentStatus === 'paid' ? "bg-emerald-500/15 text-emerald-600" :
                            "bg-amber-500/15 text-amber-600"
                          )}>
                            {pay.paymentStatus === 'paid' ? 'পরিশোধিত' : 'অপেক্ষমান'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setActivePaySlip(pay)}
                            className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors cursor-pointer"
                            title="পে-স্লিপ প্রিন্ট ভিউ"
                          >
                            <FileText size={15} />
                          </button>
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
      {/* LEAVE APPLY MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showApplyLeaveModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-3xl border border-border-main max-w-md w-full p-6 md:p-8 space-y-5 shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-center pb-3 border-b border-border-main/50">
                <h3 className="font-black text-lg text-text-main flex items-center gap-2">
                  <Briefcase size={20} className="text-primary" />
                  <span>ছুটির আবেদন ফরম</span>
                </h3>
                <button onClick={() => setShowApplyLeaveModal(false)} className="p-1 cursor-pointer">
                  <XCircle size={20} className="text-text-light/50" />
                </button>
              </div>

              <form onSubmit={handleApplyLeave} className="space-y-4 text-xs font-bold">
                <div className="space-y-1">
                  <label className="text-text-main">কর্মী / আবেদনকারী নির্বাচন করুন</label>
                  <select
                    value={newLeaveForm.staffId}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, staffId: e.target.value })}
                    className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                    required
                  >
                    {allStaff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-text-main">ছুটির ধরন (Leave Type)</label>
                  <select
                    value={newLeaveForm.leaveType}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, leaveType: e.target.value as any })}
                    className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                  >
                    <option value="casual">নৈমিত্তিক ছুটি (Casual Leave)</option>
                    <option value="sick">চিকিৎসা ছুটি (Sick Leave)</option>
                    <option value="emergency">জরুরি ছুটি (Emergency Leave)</option>
                    <option value="unpaid">অবৈতনিক ছুটি (Unpaid Leave)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-text-light/70">শুরুর তারিখ</label>
                    <input 
                      type="date"
                      value={newLeaveForm.startDate}
                      onChange={(e) => setNewLeaveForm({ ...newLeaveForm, startDate: e.target.value })}
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-text-light/70">শেষের তারিখ</label>
                    <input 
                      type="date"
                      value={newLeaveForm.endDate}
                      onChange={(e) => setNewLeaveForm({ ...newLeaveForm, endDate: e.target.value })}
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-text-light/70">ছুটির কারণ</label>
                  <textarea
                    rows={3}
                    value={newLeaveForm.reason}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, reason: e.target.value })}
                    className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl outline-none"
                    placeholder="ছুটির সুনির্দিষ্ট কারণ লিখুন..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border-main/50">
                  <button
                    type="button"
                    onClick={() => setShowApplyLeaveModal(false)}
                    className="px-4 py-2 bg-step-bg text-text-light rounded-xl text-xs font-bold cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                  >
                    আবেদন দাখিল করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PRINTABLE PAYSLIP MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activePaySlip && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-3xl border border-border-main max-w-lg w-full p-8 space-y-6 shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-center pb-3 border-b border-border-main/50">
                <h3 className="font-black text-base text-text-main flex items-center gap-2">
                  <Printer size={18} className="text-primary" />
                  <span>কর্মী পে-স্লিপ</span>
                </h3>
                <button onClick={() => setActivePaySlip(null)} className="p-1 cursor-pointer">
                  <XCircle size={18} className="text-text-light/50" />
                </button>
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900 border border-border-main rounded-2xl space-y-4 text-xs font-hind-siliguri text-zinc-800 dark:text-zinc-200">
                <div className="text-center border-b pb-4 border-zinc-200 dark:border-zinc-800 space-y-1">
                  <h2 className="text-lg font-black text-primary">{madrasahBranding?.madrasahName || 'আল মাদানিয়া মাদ্রাসা'}</h2>
                  <p className="text-[10px] text-zinc-500 font-bold">{madrasahBranding?.address || 'ঢাকা, বাংলাদেশ'} | কর্মী বেতন বিবরণী</p>
                  <p className="text-xs font-black text-zinc-700 dark:text-zinc-300">মাস: {activePaySlip.month}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <div>
                    <span className="text-zinc-500 text-[10px]">কর্মীর নাম:</span>
                    <p className="font-black text-sm text-zinc-900 dark:text-white">{activePaySlip.staffName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500 text-[10px]">পদবি ও বিভাগ:</span>
                    <p className="font-bold">{activePaySlip.designation} • {activePaySlip.department}</p>
                  </div>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-2 bg-zinc-100 dark:bg-zinc-800 p-2 font-black border-b border-zinc-200 dark:border-zinc-800">
                    <span>খাত</span>
                    <span className="text-right">টাকা</span>
                  </div>

                  <div className="p-2.5 space-y-1.5">
                    <div className="flex justify-between">
                      <span>মূল বেতন</span>
                      <span className="font-bold">৳ {enToBnNumber(activePaySlip.baseSalary)}</span>
                    </div>
                    {activePaySlip.overtimePay > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>ওভারটাইম ভাতা ({enToBnNumber(activePaySlip.overtimeHours)} ঘণ্টা)</span>
                        <span>+৳ {enToBnNumber(activePaySlip.overtimePay)}</span>
                      </div>
                    )}
                    {activePaySlip.absentDeduction > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>অনুপস্থিতি কর্তন ({enToBnNumber(activePaySlip.absentDays)} দিন)</span>
                        <span>-৳ {enToBnNumber(activePaySlip.absentDeduction)}</span>
                      </div>
                    )}
                    {activePaySlip.leaveDeduction > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>অবৈতনিক ছুটি কর্তন ({enToBnNumber(activePaySlip.unpaidLeaveDays)} দিন)</span>
                        <span>-৳ {enToBnNumber(activePaySlip.leaveDeduction)}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 bg-primary/10 p-3 font-black text-sm border-t border-zinc-200 dark:border-zinc-800 text-primary">
                    <span>প্রদেয় নিট বেতন</span>
                    <span className="text-right">৳ {enToBnNumber(activePaySlip.netSalary)}</span>
                  </div>
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
