import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  User, 
  CheckCircle2, 
  Clock, 
  Plus, 
  XCircle, 
  Cpu, 
  Eye, 
  Edit, 
  Edit3,
  Trash2,
  ArrowRight,
  Printer,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Student } from '../../types';
import { useData } from '../../contexts/DataContext';
import { enToBnNumber, cn, getActiveBranches, isClassMatch, isBranchMatch } from '../../lib/utils';
import { STUDENT_STATUS_LIST, isStudentStatusMatch, getStudentStatusInfo } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { processAndCompressImage } from '../../utils/imageUtils';
import { StudentActionButtons } from './StudentActionButtons';
import { StudentEditModal } from './StudentEditModal';
import { downloadStudentsExcel, downloadStudentsListPDF } from '../../utils/studentExportUtils';

interface StudentUpdateAllProps {
  students: Student[];
  onNavigateToFeeCollection?: (studentId: string) => void;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error';
  text: string;
}

const InlineFeeInput = ({ 
  initialValue, 
  onSave, 
  className = "w-full bg-transparent font-black outline-none text-slate-900 dark:text-slate-100 text-right pr-0.5 text-xs" 
}: { 
  initialValue: number | string; 
  onSave: (val: string) => void;
  className?: string;
}) => {
  const [value, setValue] = useState(initialValue.toString());

  useEffect(() => {
    setValue(initialValue.toString());
  }, [initialValue]);

  return (
    <input 
      type="number"
      className={className}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={(e) => {
        if (e.target.value !== initialValue.toString()) {
          onSave(e.target.value);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          if ((e.target as HTMLInputElement).value !== initialValue.toString()) {
            onSave((e.target as HTMLInputElement).value);
          }
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
};

const InlineTextInput = ({ 
  initialValue, 
  onSave, 
  onSaveEnter,
  className,
  maxLength,
  placeholder
}: { 
  initialValue: string; 
  onSave: (val: string) => void;
  onSaveEnter?: (val: string) => void;
  className?: string;
  maxLength?: number;
  placeholder?: string;
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <input 
      type="text"
      className={className}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
      onBlur={(e) => {
        if (e.target.value !== initialValue) {
          onSave(e.target.value);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          if ((e.target as HTMLInputElement).value !== initialValue) {
            onSave((e.target as HTMLInputElement).value);
          }
          if (onSaveEnter) {
            onSaveEnter((e.target as HTMLInputElement).value);
          }
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
};

export const StudentUpdateAll: React.FC<StudentUpdateAllProps> = ({ 
  students: propStudents,
  onNavigateToFeeCollection 
}) => {
  const { studentOverrides, classFeeMapping, invoices, updateData, deleteData, branches, jamatList, madrasahBranding } = useData();

  const activeBranches = useMemo(() => {
    return getActiveBranches(branches);
  }, [branches]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [jamatFilter, setJamatFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditable, setIsEditable] = useState(false);
  const itemsPerPage = 15;

  // Toast Notification State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Function to add a Toast
  const showToast = (type: 'success' | 'warning' | 'error', text: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Combine prop students with local overrides
  const students = useMemo(() => {
    return propStudents.map(s => {
      const sId = s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '';
      if (sId && studentOverrides[sId]) {
        return { ...s, ...studentOverrides[sId] };
      }
      return s;
    });
  }, [propStudents, studentOverrides]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (s.isDeleted) return false;

      const sId = String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || s.studentId || '');
      const sName = (s['শিক্ষার্থীর নাম'] || s.name || '').toString().toLowerCase();
      const sFather = (s['পিতার নাম'] || s.fatherName || '').toString().toLowerCase();
      const sMother = (s['মাতার নাম'] || s.motherName || '').toString().toLowerCase();
      const sClass = (s['জামাত/শ্রেণী'] || s.class || '').toString().toLowerCase();
      const sRoll = String(s['রোল নম্বর'] || s.roll || '');
      const sBranch = s[' শাখা'] || s['শাখা'] || s.branch || 'ক';
      const sMobile = (s['মোবাইল (মা)'] || s['মোবাইল (বাবা/ভাই)'] || s['অভিভাবকের মোবাইল'] || s.mobile || s.phone || '').toString();
      const sBirthReg = (s['জন্ম নিবন্ধন সনদ নম্বর'] || s['এনআইডি/জন্ম সনদ'] || s.birthRegNo || '').toString();
      const sDob = (s['জন্ম তারিখ'] || s.dob || '').toString();
      const sAddress = (s['বর্তমান ঠিকানা'] || s['স্থায়ী ঠিকানা'] || s.address || '').toString().toLowerCase();
      const sStatus = s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || s['শিক্ষার্থী ধরণ'] || s.status || '';

      const term = searchTerm.toLowerCase().trim();

      const matchesSearch = 
        !term ||
        sId.toLowerCase().includes(term) || 
        sName.includes(term) ||
        sFather.includes(term) ||
        sMother.includes(term) ||
        sMobile.includes(term) ||
        sRoll.includes(term) ||
        sBirthReg.includes(term) ||
        sDob.includes(term) ||
        sAddress.includes(term);

      const matchesJamat = jamatFilter === 'all' || isClassMatch(s, jamatFilter);
      const matchesBranch = branchFilter === 'all' || isBranchMatch(sBranch, branchFilter);
      const matchesStatus = statusFilter === 'all' || isStudentStatusMatch(sStatus, statusFilter);

      return matchesSearch && matchesJamat && matchesBranch && matchesStatus;
    });
  }, [students, searchTerm, jamatFilter, branchFilter, statusFilter]);

  // Pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, jamatFilter, branchFilter, statusFilter]);

  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentStudents = useMemo(() => {
    return filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredStudents, currentPage]);

  // Selected Student for Profile View Modal
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Editing Student Modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Helper to get default tuition based on core 13-head structure
  const getJamatDefaultTuition = (sClass: string, sBranch: string) => {
    if (!classFeeMapping || !classFeeMapping[sClass]) return 0;
    const isRes = sBranch && (sBranch.includes('আবাসিক') || sBranch === 'আবাসিক' || sBranch === 'হাফেজ');
    if (isRes && classFeeMapping[sClass]['5'] !== undefined) {
      return classFeeMapping[sClass]['5'];
    }
    return classFeeMapping[sClass]['4'] !== undefined ? classFeeMapping[sClass]['4'] : (classFeeMapping[sClass]['1'] || 0);
  };

  // In-line Tuition fee update
  const handleInlineTuitionChange = async (studentId: string, value: string) => {
    const student = students.find(s => (s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '') === studentId);
    if (!student) return;

    const sClass = student['জামাত/শ্রেণী'] || student.class || '';
    const sBranch = student['শাখা'] || student.branch || 'ক';
    const newFee = Number(value) || 0;

    const defaultFee = getJamatDefaultTuition(sClass, sBranch);

    const updatedStudentData = {
      ...student,
      id: studentId,
      'রেজিস্ট্রেশন/আইডি নম্বর': studentId,
      tuitionFee: newFee,
      'মাসিক বেতন': newFee,
      'মাসিক ফি': newFee
    };

    await updateData('students', updatedStudentData, studentId);

    if (newFee === defaultFee) {
      showToast('success', `${student['शिक्षার্থীর নাম'] || student['শিক্ষার্থীর নাম'] || 'শিক্ষার্থী'}-এর বেতন ডিফল্ট রেটে (৳${enToBnNumber(defaultFee)}) সেট করা হয়েছে।`);
    } else {
      showToast('warning', `${student['शिक्षার্থীর নাম'] || student['শিক্ষার্থীর নাম'] || 'শিক্ষার্থী'}-এর কাস্টম বেতন ৳${enToBnNumber(newFee)} সেট করা হয়েছে।`);
    }
  };

  // In-line Branch update
  const handleInlineBranchChange = async (studentId: string, value: string) => {
    const student = students.find(s => (s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '') === studentId);
    if (!student) return;

    const updatedStudentData = {
      ...student,
      id: studentId,
      'রেজিস্ট্রেশন/আইডি নম্বর': studentId,
      'শাখা': value,
      branch: value
    };
    await updateData('students', updatedStudentData, studentId);
    showToast('success', `${student['শিক্ষার্থীর নাম'] || 'শিক্ষার্থী'}-এর শাখা '${value}' সফলভাবে আপডেট করা হয়েছে।`);
  };

  // In-line Status update
  const handleInlineStatusChange = async (studentId: string, value: string) => {
    const student = students.find(s => (s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '') === studentId);
    if (!student) return;

    const updatedStudentData = {
      ...student,
      id: studentId,
      'রেজিস্ট্রেশন/আইডি নম্বর': studentId,
      'শিক্ষার্থী ধরণ/স্ট্যাটাস': value
    };
    await updateData('students', updatedStudentData, studentId);
    showToast('success', `${student['শিক্ষার্থীর নাম'] || 'শিক্ষার্থী'}-এর অবস্থা (স্ট্যাটাস) '${value}' সফলভাবে আপডেট করা হয়েছে।`);
  };

  // In-line Khoraki update
  const handleInlineKhorakiChange = async (studentId: string, value: string) => {
    const student = students.find(s => (s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '') === studentId);
    if (!student) return;

    const newFee = Number(value) || 0;

    const updatedStudentData = {
      ...student,
      id: studentId,
      'রেজিস্ট্রেশন/আইডি নম্বর': studentId,
      khorakiFee: newFee,
      'খোরাকী': newFee,
      'খোরাকী ফি': newFee
    };

    await updateData('students', updatedStudentData, studentId);
    showToast('success', `${student['শিক্ষার্থীর নাম'] || 'শিক্ষার্থী'}-এর খোরাকী ফি ৳${enToBnNumber(newFee)} আপডেট করা হয়েছে।`);
  };

  // In-line RFID update
  const handleInlineRfidChange = async (studentId: string, value: string) => {
    const student = students.find(s => (s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '') === studentId);
    if (!student) return;

    const cleanValue = value.trim();
    const updatedStudentData = {
      ...student,
      id: studentId,
      'রেজিস্ট্রেশন/আইডি নম্বর': studentId,
      rfid: cleanValue
    };
    await updateData('students', updatedStudentData, studentId);
  };

  const handleInlineRfidSave = (studentId: string, value: string) => {
    const student = students.find(s => (s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '') === studentId);
    if (!student) return;

    if (value && value.length !== 12) {
      showToast('error', 'RFID নম্বর অবশ্যই ১২ ডিজিটের হতে হবে।');
      return;
    }

    showToast('success', `${student['শিক্ষার্থীর নাম'] || 'শিক্ষার্থী'}-এর RFID কার্ড (${enToBnNumber(value)}) সফলভাবে আপডেট করা হয়েছে।`);
  };

  // Full Edit Modal Save
  const handleDeleteStudent = async (studentId: string, name: string) => {
    if (window.confirm(`আপনি কি নিশ্চিতভাবে "${name}"-এর সকল তথ্য পুরো ডাটাবেস থেকে ডিলিট করতে চান? এই কাজ পুনরায় ফিরিয়ে আনা সম্ভব নয়!`)) {
      await deleteData('students', studentId);
      showToast('error', `শিক্ষার্থী "${name}"-এর সকল তথ্য ডাটাবেস থেকে মুছে ফেলা হয়েছে।`);
      setEditingStudent(null);
      setViewingStudent(null);
    }
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const sId = editingStudent['রেজিস্ট্রেশন/আইডি নম্বর'] || editingStudent.id || '';
    if (!sId) return;

    const sClass = editingStudent['জামাত/শ্রেণী'] || editingStudent.class || '';
    const sBranch = editingStudent['শাখা'] || editingStudent.branch || 'ক';
    const inputFee = Number(editingStudent.tuitionFee) || 0;
    const inputKhoraki = Number(editingStudent.khorakiFee !== undefined ? editingStudent.khorakiFee : (editingStudent['খোরাকী'] || editingStudent['খোরাকী ফি'] || 0)) || 0;

    const defaultFee = getJamatDefaultTuition(sClass, sBranch);

    const student = students.find(s => (s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '') === sId);
    const updatedStudentData: any = {
      ...student,
      'শিক্ষার্থীর নাম': editingStudent['শিক্ষার্থীর নাম'] || editingStudent.name,
      'পিতার নাম': editingStudent['পিতার নাম'] || editingStudent.fatherName,
      'মাতার নাম': editingStudent['মাতার নাম'] || editingStudent.motherName,
      'অভিভাবকের মোবাইল': editingStudent['অভিভাবকের মোবাইল'] || editingStudent.mobile,
      'জামাত/শ্রেণী': sClass,
      'রোল নম্বর': editingStudent['রোল নম্বর'] || editingStudent.roll,
      'শাখা': sBranch,
      branch: sBranch,
      'শিক্ষার্থী ধরণ/স্ট্যাটাস': editingStudent['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || 'চলমান শিক্ষার্থী',
      rfid: editingStudent.rfid || '',
      photoUrl: editingStudent.photoUrl || '',
      tuitionFee: inputFee,
      'মাসিক বেতন': inputFee,
      'মাসিক ফি': inputFee,
      khorakiFee: inputKhoraki,
      'খোরাকী': inputKhoraki,
      'খোরাকী ফি': inputKhoraki
    };

    await updateData('students', updatedStudentData, sId);

    if (inputFee === defaultFee) {
      showToast('success', `${editingStudent['শিক্ষার্থীর নাম'] || 'শিক্ষার্থী'}-এর তথ্য ও ডিফল্ট বেতন (৳${enToBnNumber(defaultFee)}) সফলভাবে আপডেট করা হয়েছে।`);
    } else {
      showToast('warning', `${editingStudent['শিক্ষার্থীর নাম'] || 'শিক্ষার্থী'}-এর তথ্য ও কাস্টম বেতন ৳${enToBnNumber(inputFee)} সফলভাবে আপডেট করা হয়েছে।`);
    }

    setEditingStudent(null);
  };

  // Helper calculations for specific student (Transactions summary)
  const getStudentTransactionStats = (studentId: string) => {
    const studentInvoices = invoices.filter(inv => inv.studentId === studentId);
    const totalBilled = studentInvoices.reduce((sum, inv) => sum + (inv.netAmount || 0), 0);
    const totalPaid = studentInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const totalDue = studentInvoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
    const recentHistory = studentInvoices.slice(0, 6); // Last 6 transactions

    return {
      totalBilled,
      totalPaid,
      totalDue,
      recentHistory
    };
  };

  return (
    <div className="space-y-6 font-hind-siliguri text-left">
      
      {/* Toast Notification Popups */}
      <div className="fixed top-5 right-5 z-[100] space-y-3 w-80 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 100 }}
              className={cn(
                "p-4 rounded-xl shadow-xl border flex items-start gap-3 pointer-events-auto",
                toast.type === 'success' ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600" :
                toast.type === 'warning' ? "bg-amber-500/10 border-amber-500/25 text-amber-600" :
                "bg-rose-500/10 border-rose-500/25 text-rose-600"
              )}
            >
              {toast.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : 
               toast.type === 'warning' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : 
               <XCircle size={18} className="shrink-0 mt-0.5" />}
              <div className="text-xs font-bold leading-relaxed">{toast.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Title Section */}
      <div className="p-6 bg-card border border-border-main rounded-[2rem] shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-text-main tracking-tighter flex items-center gap-3">
            <User className="text-primary" /> সকল শিক্ষার্থী আপডেট
          </h2>
          <p className="text-xs text-text-light/50 mt-1 uppercase tracking-wider">All Students Bulk Updates & Real-time Customization Panel</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs font-black select-none shrink-0">
            মোট শিক্ষার্থী: {enToBnNumber(totalItems.toString())} জন
          </div>
          
          <button
            onClick={() => {
              downloadStudentsListPDF(filteredStudents, 'সকল_শিক্ষার্থী_তালিকা', {
                name: madrasahBranding?.madrasahName,
                address: madrasahBranding?.address,
                phone: madrasahBranding?.phone,
                logoUrl: madrasahBranding?.logoUrl
              });
              showToast('success', 'পিডিএফ ফাইল প্রিন্ট/ডাউনলোড প্রস্তুত হচ্ছে।');
            }}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-500/20 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            title="সকল শিক্ষার্থীর ডাটা পিডিএফ শিট ডাউনলোড"
          >
            <Printer size={13} />
            <span>পিডিএফ ডাউনলোড</span>
          </button>
          
          <button
            onClick={() => {
              downloadStudentsExcel(filteredStudents, 'Students_Update_All');
              showToast('success', 'এক্সেল ফাইল সফলভাবে ডাউনলোড শুরু হয়েছে।');
            }}
            className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/20 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            title="সকল শিক্ষার্থীর ডাটা এক্সেল শিট ডাউনলোড"
          >
            <Printer size={13} />
            <span>এক্সেল ডাউনলোড</span>
          </button>
          
          <button
            onClick={() => {
              setIsEditable(!isEditable);
              showToast(
                !isEditable ? 'warning' : 'success',
                !isEditable 
                  ? 'এডিট মোড চালু হয়েছে! এখন সরাসরি টেবিলে শাখা, বেতন, স্ট্যাটাস ও RFID পরিবর্তন করতে পারবেন।' 
                  : 'এডিট মোড বন্ধ করা হয়েছে।'
              );
            }}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-1.5",
              isEditable 
                ? "bg-amber-500 hover:bg-amber-600 text-white" 
                : "bg-primary hover:bg-primary/90 text-white"
            )}
          >
            <Edit size={13} />
            {isEditable ? 'এডিট মোড বন্ধ করুন' : 'এক ক্লিকে এডিট করুন'}
          </button>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 bg-card border border-border-main p-5 rounded-[2rem] shadow-lg">
        {/* Live Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light/40" size={18} />
          <input 
            type="text" 
            placeholder="নাম, আইডি, রোল বা মোবাইল দিয়ে খুঁজুন..."
            className="w-full pl-12 pr-4 py-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-main"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Jamat Selector */}
        <div>
          <select 
            className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none cursor-pointer text-text-main"
            value={jamatFilter}
            onChange={(e) => setJamatFilter(e.target.value)}
          >
            <option value="all">সকল জামাত/শ্রেণী</option>
            {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>

        {/* Branch Selector */}
        <div>
          <select 
            className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none cursor-pointer text-text-main"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="all">সকল শাখা</option>
            {activeBranches.length > 0 ? (
              activeBranches.map(b => (
                <option key={b} value={b}>শাখা: {b}</option>
              ))
            ) : (
              <>
                <option value="ক">শাখা: ক</option>
                <option value="খ">শাখা: খ</option>
                <option value="গ">শাখা: গ</option>
                <option value="কওমি">কওমি</option>
                <option value="হাফেজ">হাফেজ</option>
                <option value="নূরানি">নূরানি</option>
              </>
            )}
          </select>
        </div>

        {/* Status / Type Selector */}
        <div>
          <select 
            className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none cursor-pointer text-text-main"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">সকল অবস্থা বা ধরণ</option>
            {STUDENT_STATUS_LIST.map((st, idx) => (
              <option key={idx} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid/Table Content Container */}
      <div className="bg-card border border-border-main rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Desktop View Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary text-white border-b border-border-main text-left">
                <th className="py-4.5 px-4 text-xs font-black text-white/95 uppercase tracking-wider w-[100px]">আইডি নম্বর</th>
                <th className="py-4.5 px-4 text-xs font-black text-white/95 uppercase tracking-wider min-w-[190px]">শিক্ষার্থীর নাম</th>
                <th className="py-4.5 px-3 text-xs font-black text-white/95 uppercase tracking-wider w-[80px]">রোল নম্বর</th>
                <th className="py-4.5 px-4 text-xs font-black text-white/95 uppercase tracking-wider min-w-[160px]">অভিভাবকের তথ্য</th>
                <th className="py-4.5 px-4 text-xs font-black text-white/95 uppercase tracking-wider w-[130px]">মোবাইল নম্বর</th>
                <th className="py-4.5 px-3 text-xs font-black text-white/95 uppercase tracking-wider w-[140px]">শাখা</th>
                <th className="py-4.5 px-4 text-xs font-black text-white/95 uppercase tracking-wider w-[140px]">মাসিক বেতন</th>
                <th className="py-4.5 px-4 text-xs font-black text-white/95 uppercase tracking-wider w-[140px]">খোরাকী</th>
                <th className="py-4.5 px-4 text-xs font-black text-white/95 uppercase tracking-wider w-[160px]">শিক্ষার্থীর অবস্থা</th>
                <th className="py-4.5 px-4 text-xs font-black text-white/95 uppercase tracking-wider w-[180px]">RFID কার্ড</th>
                <th className="py-4.5 px-4 text-xs font-black text-white/95 uppercase tracking-wider text-right pr-6 w-[150px]">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/40 text-xs">
              {currentStudents.map((s) => {
                const sId = s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '';
                const sName = s['শিক্ষার্থীর নাম'] || s.name || '';
                const sClass = s['জামাত/শ্রেণী'] || s.class || '';
                const sRoll = s['রোল নম্বর'] || s.roll || '';
                const sBranch = s['শাখা'] || s.branch || 'ক';
                const sFather = s['পিতার নাম'] || s.fatherName || '';
                const sMother = s['মাতার নাম'] || s.motherName || '';
                const sMobile = s['অভিভাবকের মোবাইল'] || s.mobile || '';
                const rfid = s.rfid || '';

                // Get custom fee if exists, otherwise load defaults from class mapping using the helper
                let currentTuition = 0;
                let isCustomFee = false;
                if (s.tuitionFee !== undefined && s.tuitionFee !== null && s.tuitionFee !== '') {
                  currentTuition = Number(s.tuitionFee);
                  isCustomFee = currentTuition !== getJamatDefaultTuition(sClass, sBranch);
                } else if (s['মাসিক বেতন'] !== undefined && s['মাসিক বেতন'] !== null && s['মাসিক বেতন'] !== '') {
                  currentTuition = Number(s['মাসিক বেতন']);
                  isCustomFee = currentTuition !== getJamatDefaultTuition(sClass, sBranch);
                } else if (sId && studentOverrides[sId]?.tuitionFee !== undefined && studentOverrides[sId]?.tuitionFee !== null) {
                  currentTuition = Number(studentOverrides[sId].tuitionFee);
                  isCustomFee = currentTuition !== getJamatDefaultTuition(sClass, sBranch);
                } else {
                  currentTuition = getJamatDefaultTuition(sClass, sBranch);
                }

                let currentKhoraki = 0;
                if (s.khorakiFee !== undefined && s.khorakiFee !== null && s.khorakiFee !== '') {
                  currentKhoraki = Number(s.khorakiFee);
                } else if (s['खोরাকী'] !== undefined && s['खोরাকী'] !== null && s['खोরাকী'] !== '') {
                  currentKhoraki = Number(s['खोরাকী']);
                } else if (s['খোরাকী'] !== undefined && s['খোরাকী'] !== null && s['খোরাকী'] !== '') {
                  currentKhoraki = Number(s['খোরাকী']);
                } else if (s['খোরাকী ফি'] !== undefined && s['খোরাকী ফি'] !== null && s['খোরাকী ফি'] !== '') {
                  currentKhoraki = Number(s['খোরাকী ফি']);
                } else if (sId && studentOverrides[sId]?.khorakiFee !== undefined && studentOverrides[sId]?.khorakiFee !== null) {
                  currentKhoraki = Number(studentOverrides[sId].khorakiFee);
                }

                return (
                  <tr key={sId} className="hover:bg-primary/[0.02] transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-text-light/50 tracking-wider">#{enToBnNumber(String(sId || '').slice(-6))}</span>
                    </td>
                    <td className="py-4 px-4 font-black text-text-main text-sm">
                      <div>
                        <p className="truncate max-w-[180px]">{sName}</p>
                        <span className="text-[10px] font-bold text-text-light/45 block mt-0.5">{sClass}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 font-black text-text-main text-center">
                      <span className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black whitespace-nowrap min-w-[55px] shadow-sm">
                        {enToBnNumber(sRoll)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-text-light/80 font-medium">
                      <div className="space-y-0.5">
                        <p className="truncate max-w-[150px]" title={`পিতা: ${sFather}`}>পিতা: {sFather || '—'}</p>
                        <p className="text-[10px] text-text-light/45 truncate max-w-[150px]" title={`মাতা: ${sMother}`}>মাতা: {sMother || '—'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-text-main font-mono">
                      {sMobile ? enToBnNumber(sMobile) : '—'}
                    </td>
                    
                    {/* Branch Selector / Badge */}
                    <td className="py-4 px-3 min-w-[140px]">
                      {!isEditable ? (
                        <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary/5 text-primary border border-primary/20 rounded-full font-black text-xs whitespace-nowrap min-w-[75px] shadow-sm">
                          শাখা: {sBranch}
                        </span>
                      ) : (
                        <select 
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-black outline-none cursor-pointer focus:ring-2 focus:ring-primary/40 shadow-sm transition-all min-w-[110px]"
                          value={sBranch}
                          onChange={(e) => handleInlineBranchChange(sId, e.target.value)}
                        >
                          {activeBranches.length > 0 ? (
                            activeBranches.map(b => (
                              <option key={b} value={b} className="bg-card text-text-main font-bold">শাখা: {b}</option>
                            ))
                          ) : (
                            <>
                              <option value="ক" className="bg-card text-text-main font-bold">শাখা: ক</option>
                              <option value="খ" className="bg-card text-text-main font-bold">শাখা: খ</option>
                              <option value="গ" className="bg-card text-text-main font-bold">শাখা: গ</option>
                              <option value="কওমি" className="bg-card text-text-main font-bold">কওমি</option>
                              <option value="হাফেজ" className="bg-card text-text-main font-bold">হাফেজ</option>
                              <option value="নূরানি" className="bg-card text-text-main font-bold">নূরানি</option>
                            </>
                          )}
                        </select>
                      )}
                    </td>
                    
                    {/* Tuition Fee Badge / Editor */}
                    <td className="py-4 px-4 min-w-[120px]">
                      {!isEditable ? (
                        <span className={cn(
                          "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black border whitespace-nowrap min-w-[90px] shadow-md transition-all",
                          isCustomFee 
                            ? "bg-[#f59e0b] text-slate-950 border-2 border-[#f59e0b]/20 font-black" 
                            : "bg-[#0d555c] dark:bg-[#14b8a6] text-white dark:text-slate-950 border border-[#0d555c]/20 dark:border-[#14b8a6]/20 font-black"
                        )} title={isCustomFee ? "কাস্টম নির্ধারিত মাসিক বেতন" : "ক্লাসের ডিফল্ট মাসিক বেতন"}>
                          ৳ {enToBnNumber(currentTuition.toString())}
                        </span>
                      ) : (
                        <div className={cn(
                          "flex items-center border rounded-xl py-1.5 px-3 bg-white dark:bg-slate-800 w-28 shadow-sm",
                          isCustomFee 
                            ? "border-amber-500 ring-2 ring-amber-500/10" 
                            : "border-slate-300 dark:border-slate-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
                        )}>
                          <span className="text-xs font-black text-slate-400 mr-1.5">৳</span>
                          <InlineFeeInput 
                            initialValue={currentTuition}
                            onSave={(val) => handleInlineTuitionChange(sId, val)}
                          />
                        </div>
                      )}
                    </td>

                    {/* Khoraki Fee Badge / Editor */}
                    <td className="py-4 px-4 min-w-[120px]">
                      {!isEditable ? (
                        <span className={cn(
                          "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black border whitespace-nowrap min-w-[90px] shadow-md transition-all",
                          currentKhoraki > 0 
                            ? "bg-purple-600 dark:bg-purple-500 text-white border border-purple-500/20 font-black" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-bold"
                        )} title="নির্ধারিত খোরাকী ফি">
                          ৳ {enToBnNumber(currentKhoraki.toString())}
                        </span>
                      ) : (
                        <div className="flex items-center border rounded-xl py-1.5 px-3 bg-white dark:bg-slate-800 w-28 shadow-sm border-slate-300 dark:border-slate-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                          <span className="text-xs font-black text-slate-400 mr-1.5">৳</span>
                          <InlineFeeInput 
                            initialValue={currentKhoraki}
                            onSave={(val) => handleInlineKhorakiChange(sId, val)}
                          />
                        </div>
                      )}
                    </td>

                    {/* Student Status Badge / Selector */}
                    <td className="py-4 px-4 min-w-[190px]">
                      {(() => {
                        const sStatus = s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || s.status || '';
                        const stInfo = getStudentStatusInfo(sStatus);
                        return !isEditable ? (
                          <span 
                            title={stInfo.label}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border whitespace-nowrap min-w-[125px] shadow-sm",
                              stInfo.badgeBg,
                              stInfo.badgeText,
                              stInfo.badgeBorder
                            )}
                          >
                            <span className={cn("w-2 h-2 rounded-full shrink-0", stInfo.isEnrolled ? "bg-emerald-500" : "bg-rose-500")}></span>
                            <span className="truncate max-w-[150px]">{stInfo.shortTitle}</span>
                          </span>
                        ) : (
                          <select 
                            className="px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer outline-none focus:ring-2 focus:ring-primary/40 shadow-sm transition-all w-full min-w-[170px] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 font-hind-siliguri"
                            value={sStatus || STUDENT_STATUS_LIST[3]}
                            onChange={(e) => handleInlineStatusChange(sId, e.target.value)}
                          >
                            {STUDENT_STATUS_LIST.map((opt) => (
                              <option key={opt} value={opt} className="bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-50 font-bold">
                                {opt}
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </td>

                    {/* RFID Card Badge / Editor */}
                    <td className="py-4 px-4">
                      {!isEditable ? (
                        rfid ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15 rounded-full font-mono font-black text-[10px]">
                            <Cpu size={11} className="stroke-[2.5]" />
                            {enToBnNumber(rfid)}
                          </span>
                        ) : (
                          <span className="text-text-light/35 font-bold italic">কার্ড নেই</span>
                        )
                      ) : (
                        <div className="flex items-center border border-border-main rounded-xl py-1.5 px-2.5 bg-card w-[160px]">
                          <Cpu size={12} className="text-primary/50 shrink-0 mr-1.5" />
                          <InlineTextInput 
                            maxLength={12}
                            placeholder="RFID নম্বর লিখুন..."
                            className="w-full bg-transparent font-mono font-black text-[10px] outline-none text-text-main"
                            initialValue={rfid}
                            onSave={(val) => {
                              handleInlineRfidChange(sId, val);
                              handleInlineRfidSave(sId, val);
                            }}
                            onSaveEnter={(val) => handleInlineRfidSave(sId, val)}
                          />
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right pr-6">
                      <StudentActionButtons 
                        student={s}
                        onView={() => setViewingStudent(s)}
                        onEdit={() => setEditingStudent(s)}
                        showEdit={true}
                        showDelete={false}
                        size="sm"
                      />
                    </td>
                  </tr>
                );
              })}

              {currentStudents.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-24 text-center">
                    <User size={36} className="mx-auto text-text-light/20 mb-3" />
                    <p className="text-sm font-black text-text-main italic opacity-50">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card Grid */}
        <div className="lg:hidden p-4 space-y-4 bg-step-bg/15">
          {currentStudents.length > 0 ? (
            currentStudents.map((s, idx) => {
              const sId = s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || '';
              const sName = s['শিক্ষার্থীর নাম'] || s.name || '';
              const sClass = s['জামাত/শ্রেণী'] || s.class || '';
              const sRoll = s['রোল নম্বর'] || s.roll || '';
              const sBranch = s['শাখা'] || s.branch || 'ক';
              const sFather = s['পিতার নাম'] || s.fatherName || '';
              const sMobile = s['অভিভাবকের মোবাইল'] || s.mobile || '';
              const rfid = s.rfid || '';

              let currentTuition = 0;
              let isCustomFee = false;
              if (s.tuitionFee !== undefined && s.tuitionFee !== null && s.tuitionFee !== '') {
                currentTuition = Number(s.tuitionFee);
                isCustomFee = currentTuition !== getJamatDefaultTuition(sClass, sBranch);
              } else if (s['মাসিক বেতন'] !== undefined && s['মাসিক বেতন'] !== null && s['মাসিক বেতন'] !== '') {
                currentTuition = Number(s['মাসিক বেতন']);
                isCustomFee = currentTuition !== getJamatDefaultTuition(sClass, sBranch);
              } else if (sId && studentOverrides[sId]?.tuitionFee !== undefined && studentOverrides[sId]?.tuitionFee !== null) {
                currentTuition = Number(studentOverrides[sId].tuitionFee);
                isCustomFee = currentTuition !== getJamatDefaultTuition(sClass, sBranch);
              } else {
                currentTuition = getJamatDefaultTuition(sClass, sBranch);
              }

              let currentKhoraki = 0;
              if (s.khorakiFee !== undefined && s.khorakiFee !== null && s.khorakiFee !== '') {
                currentKhoraki = Number(s.khorakiFee);
              } else if (s['খোরাকী'] !== undefined && s['খোরাকী'] !== null && s['খোরাকী'] !== '') {
                currentKhoraki = Number(s['খোরাকী']);
              } else if (s['খোরাকী ফি'] !== undefined && s['খোরাকী ফি'] !== null && s['খোরাকী ফি'] !== '') {
                currentKhoraki = Number(s['খোরাকী ফি']);
              } else if (sId && studentOverrides[sId]?.khorakiFee !== undefined && studentOverrides[sId]?.khorakiFee !== null) {
                currentKhoraki = Number(studentOverrides[sId].khorakiFee);
              }

              return (
                <div 
                  key={`${sId}-${idx}`}
                  className="p-4 bg-card border border-border-main rounded-2.5xl shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start border-b border-border-main/50 pb-2.5">
                    <div>
                      <h4 className="font-extrabold text-sm text-text-main">{sName}</h4>
                      <p className="text-[10px] font-bold text-text-light/50 mt-0.5">
                        ID: #{enToBnNumber(String(sId || '').slice(-6))} | রোল: {enToBnNumber(sRoll)}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-primary/5 text-primary border border-primary/15 rounded-lg text-[9px] font-black shrink-0">
                      {sClass}
                    </span>
                  </div>

                  {/* Badges / Editable Fields */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-text-light/40 font-bold block mb-0.5">পিতার নাম:</span>
                        <span className="font-extrabold text-text-main truncate block">{sFather || '—'}</span>
                      </div>
                      <div>
                        <span className="text-text-light/40 font-bold block mb-0.5">মোবাইল নম্বর:</span>
                        <span className="font-extrabold text-text-main font-mono block">{sMobile ? enToBnNumber(sMobile) : '—'}</span>
                      </div>
                    </div>

                    {/* Interactive Branch & Status in Edit Mode */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] font-bold text-text-light/40 block mb-1">শাখা:</span>
                        {!isEditable ? (
                          <span className="inline-block px-2.5 py-1 bg-primary/5 text-primary border border-primary/15 rounded-lg font-black text-[10px]">
                            শাখা {sBranch}
                          </span>
                        ) : (
                          <select 
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg font-black text-[10px] cursor-pointer outline-none w-full shadow-sm"
                            value={sBranch}
                            onChange={(e) => handleInlineBranchChange(sId, e.target.value)}
                          >
                            {activeBranches.length > 0 ? (
                              activeBranches.map(b => (
                                <option key={b} value={b} className="bg-card text-text-main">শাখা: {b}</option>
                              ))
                            ) : (
                              <>
                                <option value="ক" className="bg-card text-text-main">শাখা: ক</option>
                                <option value="খ" className="bg-card text-text-main">শাখা: খ</option>
                                <option value="গ" className="bg-card text-text-main">শাখা: গ</option>
                              </>
                            )}
                          </select>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-text-light/40 block mb-1">অবস্থা:</span>
                        {(() => {
                          const sStatus = s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || s.status || '';
                          const stInfo = getStudentStatusInfo(sStatus);
                          return !isEditable ? (
                            <span 
                              title={stInfo.label}
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border truncate max-w-full",
                                stInfo.badgeBg,
                                stInfo.badgeText,
                                stInfo.badgeBorder
                              )}
                            >
                              <span className="truncate">{stInfo.shortTitle}</span>
                            </span>
                          ) : (
                            <select 
                              className="px-2 py-1.5 rounded-lg text-[10px] font-black border cursor-pointer outline-none w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border-slate-300 dark:border-slate-600 font-hind-siliguri"
                              value={sStatus || STUDENT_STATUS_LIST[3]}
                              onChange={(e) => handleInlineStatusChange(sId, e.target.value)}
                            >
                              {STUDENT_STATUS_LIST.map((opt) => (
                                <option key={opt} value={opt} className="bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-50 font-bold">
                                  {opt}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-border-main/30 pt-3 items-center">
                      <div>
                        <span className="text-[10px] font-bold text-text-light/40 block mb-1">মাসিক বেতন:</span>
                        {!isEditable ? (
                          <span className={cn(
                            "inline-block font-black text-xs px-2.5 py-1 rounded-lg border shadow-sm",
                            isCustomFee 
                              ? "bg-[#f59e0b] text-slate-950 border-[#f59e0b]/20 font-black" 
                              : "bg-[#0d555c] dark:bg-[#14b8a6] text-white dark:text-slate-950 border border-[#0d555c]/20 dark:border-[#14b8a6]/20 font-black"
                          )}>
                            ৳{enToBnNumber(currentTuition.toString())}
                          </span>
                        ) : (
                          <div className={cn(
                            "flex items-center border rounded-xl py-1 px-2 bg-white dark:bg-slate-800 w-full shadow-sm",
                            isCustomFee 
                              ? "border-amber-500 ring-2 ring-amber-500/10" 
                              : "border-slate-300 dark:border-slate-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
                          )}>
                            <span className="text-[10px] font-bold text-slate-400 mr-0.5">৳</span>
                            <InlineFeeInput 
                              initialValue={currentTuition}
                              onSave={(val) => handleInlineTuitionChange(sId, val)}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-text-light/40 block mb-1">খোরাকী:</span>
                        {!isEditable ? (
                          <span className={cn(
                            "inline-block font-black text-xs px-2.5 py-1 rounded-lg border shadow-sm",
                            currentKhoraki > 0
                              ? "bg-purple-600 dark:bg-purple-500 text-white border border-purple-500/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200"
                          )}>
                            ৳{enToBnNumber(currentKhoraki.toString())}
                          </span>
                        ) : (
                          <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-xl py-1 px-2 bg-white dark:bg-slate-800 w-full shadow-sm focus-within:border-primary">
                            <span className="text-[10px] font-bold text-slate-400 mr-0.5">৳</span>
                            <InlineFeeInput 
                              initialValue={currentKhoraki}
                              onSave={(val) => handleInlineKhorakiChange(sId, val)}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-text-light/40 block mb-1">RFID কার্ড:</span>
                        {!isEditable ? (
                          rfid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/5 text-indigo-600 border border-indigo-500/15 rounded-lg font-mono font-black text-[10px] truncate max-w-full">
                              {enToBnNumber(rfid)}
                            </span>
                          ) : (
                            <span className="text-text-light/35 font-semibold italic text-[10px]">কার্ড নেই</span>
                          )
                        ) : (
                          <div className="flex items-center border border-border-main rounded-xl py-1 px-1.5 bg-card">
                            <Cpu size={10} className="text-primary/50 shrink-0 mr-0.5" />
                            <InlineTextInput 
                              maxLength={12}
                              placeholder="RFID..."
                              className="w-full bg-transparent font-mono font-black text-[9px] outline-none text-text-main"
                              initialValue={rfid}
                              onSave={(val) => {
                                handleInlineRfidChange(sId, val);
                                handleInlineRfidSave(sId, val);
                              }}
                              onSaveEnter={(val) => handleInlineRfidSave(sId, val)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-border-main/30">
                    <span className="text-[10px] font-bold text-text-light/50">
                      ID: #{enToBnNumber(String(sId || '').slice(-6))}
                    </span>
                    <StudentActionButtons 
                      student={s}
                      onView={() => setViewingStudent(s)}
                      onEdit={() => setEditingStudent(s)}
                      showEdit={true}
                      showDelete={false}
                      size="sm"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-16 text-center select-none bg-card border border-dashed border-border-main/80 rounded-2.5xl">
              <User size={36} className="mx-auto text-text-light/20 mb-2" />
              <p className="text-xs font-black text-text-light/40 uppercase tracking-wider">কোন শিক্ষার্থী পাওয়া যায়নি</p>
            </div>
          )}
        </div>

        {/* Pagination Block */}
        {totalPages > 1 && (
          <div className="p-5 border-t border-border-main/50 flex justify-between items-center bg-step-bg/20">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-card border border-border-main rounded-xl text-xs font-black text-text-light hover:text-primary disabled:opacity-40 disabled:hover:text-text-light transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ChevronLeft size={14} /> পূর্ববর্তী
            </button>
            <span className="text-xs font-black text-text-light/75">
              পৃষ্ঠা {enToBnNumber(currentPage.toString())} / {enToBnNumber(totalPages.toString())} (মোট {enToBnNumber(totalItems.toString())} জন)
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-card border border-border-main rounded-xl text-xs font-black text-text-light hover:text-primary disabled:opacity-40 disabled:hover:text-text-light transition-all cursor-pointer flex items-center gap-1.5"
            >
              পরবর্তী <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* --- MODULE A: VIEW LEDGER & TRANSACTIONS MODAL --- */}
      <AnimatePresence>
        {viewingStudent && (() => {
          const sId = viewingStudent.id || viewingStudent['রেজিস্ট্রেশন/আইডি নম্বর'] || '';
          const stats = getStudentTransactionStats(sId);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden text-left bg-black/60 backdrop-blur-sm animate-fade-in select-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-3xl bg-card border border-border-main rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[90vh] z-10"
              >
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex justify-between items-center border-b border-border-main pb-4">
                    <div>
                      <h3 className="text-xl font-black text-text-main">শিক্ষার্থীর বিবরণ ও লেনদেন খতিয়ান</h3>
                      <p className="text-[10px] text-text-light/50 font-bold uppercase tracking-wider mt-0.5">Student Academic Profile & Ledger History</p>
                    </div>
                    <button 
                      onClick={() => setViewingStudent(null)}
                      className="p-2 hover:bg-step-bg rounded-lg border border-transparent hover:border-border-main transition-all cursor-pointer"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>

                  {/* Profile details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-4.5 bg-step-bg/30 border border-border-main/55 rounded-2xl">
                    <div className="flex flex-col items-center text-center p-2.5">
                      <div className="w-20 h-20 bg-card border border-primary/20 rounded-[1.5rem] flex items-center justify-center font-bold text-lg overflow-hidden shadow-md">
                        {viewingStudent.photoUrl ? (
                          <img src={viewingStudent.photoUrl} alt="Photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={32} className="text-text-light/30" />
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm text-text-main mt-2.5">{viewingStudent['শিক্ষার্থীর নাম'] || viewingStudent.name}</h4>
                      <p className="text-[10px] font-bold text-text-light/50">ID: #{enToBnNumber(String(sId || '').slice(-6))}</p>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-text-light/40 font-bold block">জামাত / শ্রেণী:</span>
                        <span className="font-extrabold text-text-main">{viewingStudent['জামাত/শ্রেণী'] || viewingStudent.class}</span>
                      </div>
                      <div>
                        <span className="text-text-light/40 font-bold block">রোল ও শাখা:</span>
                        <span className="font-extrabold text-text-main">রোল No: {enToBnNumber(viewingStudent['রোল নম্বর'] || viewingStudent.roll || '')} | শাখা: {viewingStudent['শাখা'] || 'ক'}</span>
                      </div>
                      <div>
                        <span className="text-text-light/40 font-bold block">পিতার নাম:</span>
                        <span className="font-extrabold text-text-main">{viewingStudent['পিতার নাম'] || viewingStudent.fatherName || '—'}</span>
                      </div>
                      <div>
                        <span className="text-text-light/40 font-bold block">মোবাইল নম্বর:</span>
                        <span className="font-extrabold text-text-main">{viewingStudent['অভিভাবকের মোবাইল'] || viewingStudent.mobile || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Transactions Summary Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl text-center">
                      <span className="text-[9px] font-black uppercase text-primary/60 tracking-wider block mb-0.5">মোট বিলকৃত (৳)</span>
                      <span className="font-black text-sm text-text-main">৳{enToBnNumber(stats.totalBilled)}</span>
                    </div>
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-center">
                      <span className="text-[9px] font-black uppercase text-emerald-600/60 tracking-wider block mb-0.5">মোট পরিশোধিত (৳)</span>
                      <span className="font-black text-sm text-emerald-600">৳{enToBnNumber(stats.totalPaid)}</span>
                    </div>
                    <div className="p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl text-center">
                      <span className="text-[9px] font-black uppercase text-rose-600/60 tracking-wider block mb-0.5">অবশিষ্ট বকেয়া (৳)</span>
                      <span className="font-black text-sm text-rose-600">৳{enToBnNumber(stats.totalDue)}</span>
                    </div>
                  </div>

                  {/* Transaction List Table */}
                  <div className="space-y-2.5">
                    <h4 className="font-black text-xs text-text-main uppercase tracking-wider">সাম্প্রতিক লেনদেনের তালিকা (সর্বোচ্চ ৬টি)</h4>
                    <div className="overflow-x-auto border border-border-main rounded-xl">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-step-bg text-left border-b border-border-main">
                            <th className="py-2.5 px-3 font-black text-text-light/75">ইনভয়েস</th>
                            <th className="py-2.5 px-3 font-black text-text-light/75">তারিখ</th>
                            <th className="py-2.5 px-3 font-black text-text-light/75">খাতসমূহ</th>
                            <th className="py-2.5 px-3 text-right font-black text-text-light/75">মোট বিল</th>
                            <th className="py-2.5 px-3 text-right font-black text-text-light/75">পরিশোধিত</th>
                            <th className="py-2.5 px-3 text-right font-black text-text-light/75">বকেয়া</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-main/30 font-medium">
                          {stats.recentHistory.map((inv: any) => (
                            <tr key={inv.id}>
                              <td className="py-2.5 px-3 font-mono font-bold text-primary">{inv.invoiceNo}</td>
                              <td className="py-2.5 px-3 text-[11px]">{inv.date}</td>
                              <td className="py-2.5 px-3 text-text-light/80 truncate max-w-[150px]" title={inv.items.map((i: any) => i.headName).join(', ')}>
                                {inv.items.map((i: any) => i.headName).join(', ')}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-text-main">৳{enToBnNumber(inv.netAmount)}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-success">৳{enToBnNumber(inv.paidAmount)}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-error">৳{enToBnNumber(inv.dueAmount)}</td>
                            </tr>
                          ))}

                          {stats.recentHistory.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-xs text-text-light/40 italic">কোনো লেনদেনের ইতিহাস পাওয়া যায়নি।</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Redirection / Action Shortcuts */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border-main justify-end">
                    <button 
                      onClick={() => {
                        window.print();
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1 border border-slate-200"
                    >
                      <span>🖨️</span> প্রিন্ট করুন
                    </button>
                    <button 
                      onClick={() => {
                        showToast('success', 'ভর্তি ইনভয়েস জেনারেট করা হয়েছে! প্রিন্ট কপি লোড হচ্ছে...');
                        setTimeout(() => {
                          window.print();
                        }, 500);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-sm shadow-amber-500/15"
                    >
                      <span>📄</span> ভর্তি ইনভয়েস
                    </button>
                    {onNavigateToFeeCollection && (
                      <button 
                        onClick={() => {
                          onNavigateToFeeCollection(sId);
                          setViewingStudent(null);
                        }}
                        className="px-4 py-2 bg-primary text-white font-black text-xs rounded-xl hover:scale-103 transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-primary/10"
                      >
                        <span>🧾</span> ফি সংগ্রহ / ইনভয়েস
                      </button>
                    )}
                    <button 
                      onClick={() => setViewingStudent(null)}
                      className="px-4 py-2 bg-step-bg hover:bg-card border border-border-main text-text-main font-bold text-xs rounded-xl cursor-pointer"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* --- MODULE B: PROFILE EDIT MODAL --- */}
      <AnimatePresence>
        {editingStudent && (
          <StudentEditModal 
            student={editingStudent} 
            onClose={() => setEditingStudent(null)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
};
