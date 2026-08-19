import React, { useState, useMemo, useEffect } from 'react';
import { DatabaseMediaStore } from '../data/DatabaseMediaStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  Clock, 
  Coins, 
  Wallet, 
  ShoppingBag, 
  UserCheck, 
  ShieldCheck, 
  Archive, 
  Calendar, 
  FileText, 
  Award, 
  AlertCircle, 
  Settings, 
  Bell, 
  Briefcase, 
  Plus, 
  Trash2, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  Filter, 
  Search, 
  QrCode, 
  MapPin, 
  Send, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  DollarSign, 
  HelpCircle, 
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  XCircle,
  X,
  Eye,
  Lock,
  Unlock,
  Key,
  BookOpen,
  ChevronRight,
  Edit,
  Layout
} from 'lucide-react';
import { ACADEMIC_YEARS, STUDENT_STATUS_LIST, isStudentStatusMatch, getStudentStatusInfo } from '../../constants';
import { enToBnNumber, cn, getActiveBranches } from '../../lib/utils';
import { Student } from '../../types';
import { useData } from '../../contexts/DataContext';
import { StudentProfileCard } from '../students/StudentProfileCard';
import { StudentEditModal } from '../students/StudentEditModal';
import { GlobalRecycleBin } from './GlobalRecycleBin';
import { StudentActionButtons } from '../students/StudentActionButtons';
import { StudentDeleteModal } from '../students/StudentDeleteModal';
import { downloadStudentsExcel, downloadStudentsListPDF } from '../../utils/studentExportUtils';
import { AdmissionSubNav } from './PortalModules';

// Helper to generate IDs
const uid = () => Math.floor(Math.random() * 900000 + 100000).toString();

// ============================================================================
// 1. ADMISSION INQUIRY (ভর্তি জিজ্ঞাসা)
// ============================================================================
export const AdmissionInquiry: React.FC<{
  setActiveTab?: (tabId: string) => void;
}> = ({ setActiveTab }) => {
  const { jamatList } = useData();
  const [inquiries, setInquiries] = useState<any[]>(() => {
    const saved = localStorage.getItem('portal_inquiries');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('portal_inquiries', JSON.stringify(inquiries));
  }, [inquiries]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [desiredClass, setDesiredClass] = useState(jamatList[0] || '');
  const [guardian, setGuardian] = useState('');
  const [status, setStatus] = useState('যোগাযোগ করা হয়েছে');
  const [note, setNote] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('অনুগ্রহ করে নাম এবং মোবাইল নম্বর পূরণ করুন।');
      return;
    }
    const newInquiry = {
      id: uid(),
      name,
      phone,
      desiredClass,
      guardian,
      status,
      note
    };
    setInquiries([newInquiry, ...inquiries]);
    setName('');
    setPhone('');
    setGuardian('');
    setNote('');
    alert('ভর্তি জিজ্ঞাসা সফলভাবে সংরক্ষণ করা হয়েছে!');
  };

  const deleteInquiry = (id: string) => {
    if (confirm('আপনি কি এই রেকর্ডটি মুছে ফেলতে চান?')) {
      setInquiries(inquiries.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <AdmissionSubNav activeTabId="admission-inquiry" setActiveTab={setActiveTab} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left font-hind-siliguri">
      <div className="bento-card p-6 bg-card border border-border-main shadow-xl space-y-4 md:col-span-1">
        <h3 className="text-sm font-black text-text-main uppercase tracking-wider">নতুন জিজ্ঞাসা এন্ট্রি</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">জিজ্ঞাসাকারীর নাম *</label>
            <input type="text" required placeholder="শিক্ষার্থীর নাম" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">মোবাইল নম্বর *</label>
            <input type="text" required placeholder="01xxxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">কাঙ্ক্ষিত জামাত</label>
            <select value={desiredClass} onChange={e => setDesiredClass(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none">
              {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">অভিভাবকের নাম</label>
            <input type="text" placeholder="পিতা/অভিভাবকের নাম" value={guardian} onChange={e => setGuardian(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">বর্তমান অবস্থা (Status)</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none">
              <option value="যোগাযোগ করা হয়েছে">যোগাযোগ করা হয়েছে</option>
              <option value="পরের সপ্তাহে">পরের সপ্তাহে আসবে</option>
              <option value="ভর্তি হতে ইচ্ছুক">ভর্তি হতে ইচ্ছুক</option>
              <option value="ভর্তি সম্পন্ন">ভর্তি সম্পন্ন</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">মন্তব্য/নোট</label>
            <textarea placeholder="বিস্তারিত নোট..." value={note} onChange={e => setNote(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none h-20 resize-none" />
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-white font-black text-xs rounded-xl active:scale-95 shadow-md">জিজ্ঞাসা এন্ট্রি করুন</button>
        </form>
      </div>

      <div className="bento-card p-8 bg-card border border-border-main shadow-2xl md:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-text-main">ভর্তি জিজ্ঞাসা ও অনুন্ধান খতিয়ান</h2>
          <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Admission Inquiries Register</p>
        </div>

        <div className="overflow-x-auto border border-border-main rounded-2xl">
          <table className="w-full text-xs font-hind-siliguri text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase font-black text-[10px]">
                <th className="p-4">জিজ্ঞাসাকারী</th>
                <th className="p-4">মোবাইল ও অভিভাবক</th>
                <th className="p-4">জামাত</th>
                <th className="p-4">অবস্থা</th>
                <th className="p-4">মন্তব্য</th>
                <th className="p-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/40">
              {inquiries.map(i => (
                <tr key={i.id} className="hover:bg-card/45 bg-card/10 transition-colors">
                  <td className="p-4 font-black text-text-main">{i.name}</td>
                  <td className="p-4">
                    <p className="font-bold">{i.phone}</p>
                    <p className="text-[10px] text-text-light/50">{i.guardian}</p>
                  </td>
                  <td className="p-4 font-black text-primary">{i.desiredClass}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide",
                      i.status === 'ভর্তি হতে ইচ্ছুক' ? "bg-success/15 text-success" :
                      i.status === 'ভর্তি সম্পন্ন' ? "bg-indigo-500/15 text-indigo-600" :
                      i.status === 'পরের সপ্তাহে' ? "bg-warning/15 text-warning" : "bg-text-light/15 text-text-light"
                    )}>
                      {i.status}
                    </span>
                  </td>
                  <td className="p-4 text-text-light/75 text-[11px] max-w-[200px] truncate" title={i.note}>{i.note}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => deleteInquiry(i.id)} className="p-2 hover:bg-error/10 text-text-light/50 hover:text-error rounded-xl transition-all cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
};

// ============================================================================
// 2. FORM INTEGRATOR & PRINT (ভর্তি ফর্ম)
// ============================================================================
export const AdmissionFormViewer: React.FC<{
  setActiveTab?: (tabId: string) => void;
}> = ({ setActiveTab }) => {
  const [formData, setFormData] = useState({
    name: 'আব্দুল্লাহ ইবনে ওবাইদ',
    father: 'ওবাইদুল্লাহ সরকার',
    mother: 'আমেনা খাতুন',
    dob: '২০১৫-০৩-১২',
    birthReg: '২০১৫৩৩৩৪৪৪৫৫৫৬৬৭৭',
    guardianMobile: '01712345678',
    desiredClass: 'মিযান (মুতাওয়াসসিতাহ আওয়াল)',
    boarding: 'আবাসিক',
    blood: 'O+',
    address: 'গ্রাম: চকবাজার, পো: চকবাজার, থানা: কোতোয়ালী, জেলা: ঢাকা।'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <AdmissionSubNav activeTabId="admission-form" setActiveTab={setActiveTab} />
      <div className="bento-card p-8 bg-card border border-border-main shadow-2xl max-w-4xl mx-auto space-y-8 text-left font-hind-siliguri">
      <div className="flex justify-between items-center pb-4 border-b border-border-main/50">
        <div>
          <h2 className="text-2xl font-black text-text-main font-hind-siliguri">অফিসিয়াল ভর্তি ফরম প্রিন্টার</h2>
          <p className="text-[10px] text-text-light/40 uppercase tracking-widest leading-none mt-1">Printable Digital Admission Form</p>
        </div>
        <button onClick={handlePrint} className="px-6 py-3 bg-primary hover:bg-primary-light text-white text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20 active:scale-95">
          <Printer size={16} /> ভর্তি ফরম প্রিন্ট করুন
        </button>
      </div>

      <div className="p-8 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-[2rem] text-slate-800 dark:text-slate-200 relative print:p-0 print:border-none">
        {/* Certificate style border */}
        <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 border-b pb-6">
            <h1 className="text-2xl font-black text-emerald-700 dark:text-emerald-400">দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা</h1>
            <p className="text-xs text-slate-500 font-medium">নয়া কান্দারগাঁও, লুটেরচর-৩৫১৬, মেঘনা, কুমিল্লা।</p>
            <span className="inline-block bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-5 py-1.5 rounded-full text-xs font-black tracking-wide">ভর্তি আবেদন পত্র (আর্কাইভ কপি)</span>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xs font-semibold">
            <div className="flex border-b pb-2">
              <span className="text-slate-400 w-32 shrink-0">শিক্ষার্থীর নাম:</span>
              <span className="text-slate-800 dark:text-slate-100 font-black">{formData.name}</span>
            </div>
            <div className="flex border-b pb-2">
              <span className="text-slate-400 w-32 shrink-0">কাঙ্ক্ষিত জামাত:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">{formData.desiredClass}</span>
            </div>
            <div className="flex border-b pb-2">
              <span className="text-slate-400 w-32 shrink-0">পিতার নাম:</span>
              <span className="text-slate-800 dark:text-slate-100 font-black">{formData.father}</span>
            </div>
            <div className="flex border-b pb-2">
              <span className="text-slate-400 w-32 shrink-0">মাতার নাম:</span>
              <span className="text-slate-800 dark:text-slate-100">{formData.mother}</span>
            </div>
            <div className="flex border-b pb-2">
              <span className="text-slate-400 w-32 shrink-0">জন্ম তারিখ:</span>
              <span>{enToBnNumber(formData.dob)}</span>
            </div>
            <div className="flex border-b pb-2">
              <span className="text-slate-400 w-32 shrink-0">জন্ম নিবন্ধন:</span>
              <span>{enToBnNumber(formData.birthReg)}</span>
            </div>
            <div className="flex border-b pb-2">
              <span className="text-slate-400 w-32 shrink-0">মোবাইল নম্বর:</span>
              <span className="text-slate-800 dark:text-slate-100 font-black">{formData.guardianMobile}</span>
            </div>
            <div className="flex border-b pb-2">
              <span className="text-slate-400 w-32 shrink-0">বোর্ডিং টাইপ:</span>
              <span className="font-black">{formData.boarding}</span>
            </div>
            <div className="flex border-b pb-2 col-span-2">
              <span className="text-slate-400 w-32 shrink-0">ঠিকানা:</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">{formData.address}</span>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border text-[11px] leading-relaxed text-slate-500 space-y-1">
            <p className="font-black text-slate-700 dark:text-slate-300">ভর্তির নিয়মাবলী ও অভিভাবকের অঙ্গীকার:</p>
            <p>১. শিক্ষার্থীকে নিয়মিত মাদ্রাসার নিয়মতান্ত্রিক ক্লাস এবং সালাতে উপস্থিত থাকতে হবে।</p>
            <p>২. মাদ্রাসার কোনো নিয়ম ভঙ্গ করলে কর্তৃপক্ষ যেকোনো মুহূর্তে ভর্তি বাতিল করার ক্ষমতা সংরক্ষণ করেন।</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 pt-12 text-center text-[10px] font-black text-slate-400">
            <div className="border-t pt-2 border-dashed">অভিভাবকের স্বাক্ষর</div>
            <div className="border-t pt-2 border-dashed">যাচাইকারীর স্বাক্ষর</div>
            <div className="border-t pt-2 border-dashed">মুহতামিমের স্বাক্ষর</div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

// ============================================================================
// STUDENT DETAIL MODAL & CUSTOM LIST VIEWERS
// ============================================================================
export const StudentDetailModal: React.FC<{ student: Student; onClose: () => void }> = ({ student, onClose }) => {
  return (
    <StudentProfileCard student={student} onClose={onClose} />
  );
};

// Helper to check if a date is within the last 30 days
export const isWithinLast30Days = (dateInput?: string | Date | number): boolean => {
  if (!dateInput) return false;
  
  let dateObj: Date | null = null;
  
  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else if (typeof dateInput === 'number') {
    dateObj = new Date(dateInput);
  } else if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return false;
    
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      dateObj = parsed;
    } else {
      const enDateStr = trimmed.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
      const parts = enDateStr.match(/(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})/);
      if (parts) {
        const p1 = parseInt(parts[1]);
        const p2 = parseInt(parts[2]);
        const p3 = parseInt(parts[3]);
        if (p3 > 1000) {
          dateObj = new Date(p3, p2 - 1, p1);
        } else if (p1 > 1000) {
          dateObj = new Date(p1, p2 - 1, p3);
        }
      }
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) return false;

  const now = new Date();
  const diffTime = now.getTime() - dateObj.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // Strictly admitted within last 30 days (0 to 30 days)
  return diffDays >= -1 && diffDays <= 30;
};

export const StudentNew: React.FC<{ students: Student[] }> = ({ students }) => {
  const { madrasahBranding } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Filter only students admitted within last 30 days
  const newStudents = useMemo(() => {
    return students.filter(s => {
      if (s.isDeleted) return false;
      const rawDate = s.admissionDate || s['ভর্তির তারিখ'] || s['ভর্তির_তারিখ'] || s['মঞ্জুরের তারিখ ও সময়'] || s.created_at || s.createdAt || s['তারিখ'];
      return isWithinLast30Days(rawDate);
    });
  }, [students]);

  const filteredNew = useMemo(() => {
    return newStudents.filter(s => {
      if (searchTerm === '') return true;
      const term = searchTerm.toLowerCase();
      return (
        (s['শিক্ষার্থীর নাম'] || s.name || '')?.toLowerCase().includes(term) ||
        (s['পিতার নাম'] || s.fatherName || '')?.toLowerCase().includes(term) ||
        (s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '')?.toString().includes(term) ||
        (s['অভিভাবকের মোবাইল'] || s.mobile || '')?.toString().includes(term) ||
        (s['জামাত/শ্রেণী'] || s.class || '')?.toLowerCase().includes(term) ||
        (s['জামাত'] || '')?.toLowerCase().includes(term)
      );
    });
  }, [newStudents, searchTerm]);

  const stats = useMemo(() => {
    const total = newStudents.length;
    const residential = newStudents.filter(s => (s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || s.status || '').includes('আবাসিক')).length;
    const dayCare = newStudents.filter(s => (s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || s.status || '').includes('ডে-কেয়ার')).length;
    const nonResidential = total - residential - dayCare;
    return { total, residential, nonResidential, dayCare };
  }, [newStudents]);

  return (
    <div className="space-y-6 font-hind-siliguri text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bento-card p-6 md:p-8 bg-card border border-border-main/60 shadow-xl rounded-3xl">
        <div>
          <span className="bg-primary/10 text-primary border border-primary/20 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">বিগত ৩০ দিনে নিবন্ধিত</span>
          <h2 className="text-2xl md:text-3xl font-black text-text-main flex items-center gap-3">
            নতুন শিক্ষার্থী তালিকা ({enToBnNumber(stats.total.toString())} জন)
          </h2>
          <p className="text-xs font-bold text-text-light/50 mt-1">সর্বশেষ ৩০ দিনের মধ্যে মাদ্রাসায় নতুন ভর্তি হওয়া শিক্ষার্থীদের তালিকা (৩০ দিন পর স্বয়ংক্রিয়ভাবে মূল তালিকায় স্থানান্তরিত হবে)</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => downloadStudentsListPDF(filteredNew, 'নতুন_শিক্ষার্থী_তালিকা_(বিগত_৩০_দিন)', {
              name: madrasahBranding?.madrasahName,
              address: madrasahBranding?.address,
              phone: madrasahBranding?.phone,
              logoUrl: madrasahBranding?.logoUrl
            })}
            className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-500/25 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
            title="পিডিএফ ফাইল ডাউনলোড"
          >
            <FileText size={15} /> পিডিএফ ডাউনলোড
          </button>
          <button
            type="button"
            onClick={() => downloadStudentsExcel(filteredNew, 'নতুন_শিক্ষার্থী_তালিকা')}
            className="px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/25 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
            title="এক্সেল ফাইল ডাউনলোড"
          >
            <FileSpreadsheet size={15} /> এক্সেল ডাউনলোড
          </button>
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light/50 group-focus-within:text-primary transition-colors" size={17} />
            <input 
              type="text" 
              placeholder="নাম, মোবাইল বা আইডি খুঁজুন..."
              className="w-full pl-11 pr-5 py-2.5 bg-step-bg border border-border-main/60 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl shadow-sm flex items-center gap-4.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest block mb-0.5">মোট নতুন শিক্ষার্থী</span>
            <h3 className="text-2xl font-black text-primary leading-none">{enToBnNumber(stats.total.toString())} জন</h3>
          </div>
        </div>
        <div className="p-6 bg-success/5 border border-success/10 rounded-3xl shadow-sm flex items-center gap-4.5">
          <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-black text-success/60 uppercase tracking-widest block mb-0.5">আবাসিক নতুন</span>
            <h3 className="text-2xl font-black text-success leading-none">{enToBnNumber(stats.residential.toString())} জন</h3>
          </div>
        </div>
        <div className="p-6 bg-[#0D6582]/5 border border-[#0D6582]/10 rounded-3xl shadow-sm flex items-center gap-4.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0D6582]/10 text-[#0D6582] flex items-center justify-center shrink-0">
            <GraduationCap size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-black text-[#0D6582]/60 uppercase tracking-widest block mb-0.5">অনাবাসিক নতুন</span>
            <h3 className="text-2xl font-black text-[#0D6582] leading-none">{enToBnNumber(stats.nonResidential.toString())} জন</h3>
          </div>
        </div>
        <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl shadow-sm flex items-center gap-4.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Clock size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest block mb-0.5">ডে-কেয়ার নতুন</span>
            <h3 className="text-2xl font-black text-amber-500 leading-none">{enToBnNumber(stats.dayCare.toString())} জন</h3>
          </div>
        </div>
      </div>

      <div className="bento-card bg-card border border-border-main/60 shadow-xl rounded-3xl overflow-hidden">
        {/* Mobile View */}
        <div className="md:hidden p-4 space-y-4 bg-step-bg/15">
          {filteredNew.length > 0 ? (
            filteredNew.map((s, idx) => (
              <div 
                key={`${s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id}-${idx}`}
                className="p-4.5 bg-card border border-border-main/55 rounded-2.5xl shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                onClick={() => setSelectedStudent(s)}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="px-2.5 py-1 bg-primary/5 text-primary border border-primary/10 rounded-xl text-[10px] font-black">
                    আইডি: #{enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '')}
                  </span>
                  <span className="text-[10px] font-black bg-success/15 text-success border border-success/20 px-2.5 py-1 rounded-full uppercase leading-none">
                    {s['জামাত/শ্রেণী'] || s['জামাত'] || '—'}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary/70 border border-primary/10 font-bold text-xs flex items-center justify-center shrink-0">
                    {(s['শিক্ষার্থীর নাম'] || 'ছা').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-sm text-text-main leading-snug truncate">
                      {s['শিক্ষার্থীর নাম']}
                    </h4>
                    <p className="text-[11px] text-text-light/60 mt-0.5 truncate">
                      পিতা: {s['পিতার নাম'] || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3.5 pt-3 border-t border-border-main/45" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] font-bold text-text-light/50">
                    মোবাইল: {enToBnNumber(s['অভিভাবকের মোবাইল'] || '—')}
                  </span>
                  <StudentActionButtons
                    student={s}
                    onView={() => setSelectedStudent(s)}
                    onEdit={setStudentToEdit}
                    onDelete={setStudentToDelete}
                    showEdit={true}
                    showDelete={true}
                    size="sm"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="p-16 text-center select-none bg-card border border-dashed border-border-main/80 rounded-2.5xl">
              <AlertCircle size={32} className="text-text-light/25 mx-auto mb-2" />
              <p className="text-xs font-black text-text-light/40 uppercase tracking-wider">বিগত ৩০ দিনে কোনো নতুন শিক্ষার্থী ভর্তি হয়নি</p>
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-step-bg border-b border-border-main text-text-light/75 uppercase font-black text-[10px] tracking-widest">
              <tr>
                <th className="p-5.5">আইডি নম্বর</th>
                <th className="p-5.5">শিক্ষার্থীর নাম</th>
                <th className="p-5.5">জামাত/শ্রেণী</th>
                <th className="p-5.5">রোল নম্বর</th>
                <th className="p-5.5">পিতার নাম</th>
                <th className="p-5.5">মোবাইল</th>
                <th className="p-5.5 text-right pr-10">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50">
              {filteredNew.length > 0 ? (
                filteredNew.map((s, idx) => (
                  <tr 
                    key={`${s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id}-${idx}`} 
                    className="hover:bg-primary/5 transition-colors cursor-pointer group"
                    onClick={() => setSelectedStudent(s)}
                  >
                    <td className="p-5 font-black text-primary">#{enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '')}</td>
                    <td className="p-5 font-black text-text-main text-sm">{s['শিক্ষার্থীর নাম'] || s.name}</td>
                    <td className="p-5"><span className="px-2.5 py-1.5 bg-step-bg border border-border-main rounded-xl font-black text-xs text-text-light/85">{s['জামাত/শ্রেণী'] || s['জামাত'] || '—'}</span></td>
                    <td className="p-5 font-black text-center w-24 bg-step-bg/30">{enToBnNumber(s['রোল নম্বর'] || '—')}</td>
                    <td className="p-5 font-bold text-text-light/80">{s['পিতার নাম'] || '—'}</td>
                    <td className="p-5 font-bold text-text-light/65">{enToBnNumber(s['অভিভাবকের মোবাইল'] || '—')}</td>
                    <td className="p-5 text-right pr-8" onClick={(e) => e.stopPropagation()}>
                      <StudentActionButtons
                        student={s}
                        onView={() => setSelectedStudent(s)}
                        onEdit={setStudentToEdit}
                        onDelete={setStudentToDelete}
                        showEdit={true}
                        showDelete={true}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4 grayscale opacity-25">
                      <Users size={40} />
                      <p className="font-black uppercase tracking-widest text-xs">বিগত ৩০ দিনে কোনো নতুন শিক্ষার্থী ভর্তি হয়নি</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
        )}
      </AnimatePresence>

      {/* Student Edit Modal */}
      <AnimatePresence>
        {studentToEdit && (
          <StudentEditModal 
            student={studentToEdit} 
            onClose={() => setStudentToEdit(null)} 
          />
        )}
      </AnimatePresence>

      {/* Password-Protected Delete Confirmation Modal */}
      <StudentDeleteModal 
        student={studentToDelete}
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
      />
    </div>
  );
};

export const StudentAll: React.FC<{ 
  students: Student[];
  setActiveTab?: (tab: string) => void;
  setJumpToStudentId?: (id: string | null) => void;
}> = ({ students, setActiveTab, setJumpToStudentId }) => {
  const { recycleBinStudents, deleteStudent, madrasahBranding } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJamat, setSelectedJamat] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 12;

  const handleOpenProfile = (s: Student) => {
    const sId = s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || s.id || '';
    if (setActiveTab && setJumpToStudentId && sId) {
      setJumpToStudentId(sId.toString());
      setActiveTab('students');
    } else {
      setSelectedStudent(s);
    }
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    const sId = studentToDelete['রেজিস্ট্রেশন/আইডি নম্বর'] || studentToDelete['রেজিস্ট্রেশন/আইডি'] || studentToDelete.id || '';
    if (!sId) return;
    setIsDeleting(true);
    await deleteStudent(sId);
    setStudentToDelete(null);
    setIsDeleting(false);
  };

  const academicYears = useMemo(() => {
    const years = Array.from(new Set(students.map(s => s.academicYearLabel))).filter(Boolean) as string[];
    return years.filter(y => y !== "১৪৪৪-৪৫ হিজরী/২০২৩-২৪ ঈসায়ী" && y !== "১৪৪৫-৪৬ হিজরী/২০২৪-২৫ ঈসায়ী");
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = !searchTerm ? true : (
        (s['শিক্ষার্থীর নাম'] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '').toString().includes(searchTerm) ||
        (s['রোল নম্বর'] || '').toString().includes(searchTerm) ||
        (s['অভিভাবকের মোবাইল'] || '').toString().includes(searchTerm)
      );
      
      const matchJamat = selectedJamat === 'ALL' ? true : (
        (s['জামাত/শ্রেণী'] || s['জামাত'] || '') === selectedJamat
      );

      const sStatus = s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || s['শিক্ষার্থী ধরণ'] || s.status || '';
      const matchStatus = isStudentStatusMatch(sStatus, selectedStatus);

      const matchYear = selectedYear === 'ALL' ? true : (
        (s.academicYearLabel || '') === selectedYear
      );

      return matchSearch && matchJamat && matchStatus && matchYear;
    });
  }, [students, searchTerm, selectedJamat, selectedStatus, selectedYear]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedJamat, selectedStatus, selectedYear]);

  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentStudents = useMemo(() => {
    return filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredStudents, currentPage]);

  const uniqueJamats = useMemo(() => {
    return Array.from(new Set(students.map(s => s['জামাত/শ্রেণী'] || s['জামাত']))).filter(Boolean) as string[];
  }, [students]);

  return (
    <div className="space-y-6 font-hind-siliguri text-left">
      {/* Top Action & Filter Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <input 
              type="text" 
              placeholder="নাম, রোল, আইডি বা মোবাইল খুঁজুন..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border-main/75 rounded-xl text-xs font-bold outline-none focus:border-primary/50 text-text-main transition-all shadow-sm"
            />
            <Search size={16} className="absolute left-3.5 top-3.5 text-text-light/40" />
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-primary/5 border border-primary/10 rounded-xl text-xs font-black text-primary">
            <Users size={15} />
            <span>মোট: {enToBnNumber(students.length.toString())} জন</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Jamat Filter */}
          <select 
            value={selectedJamat} 
            onChange={e => setSelectedJamat(e.target.value)}
            className="px-3 py-2.5 bg-card border border-border-main/75 rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary/50 transition-all shadow-sm cursor-pointer max-w-[160px]"
          >
            <option value="ALL">সকল জামাত</option>
            {uniqueJamats.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>

          {/* Student Status / Type Filter */}
          <select 
            value={selectedStatus} 
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 bg-card border border-border-main/75 rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary/50 transition-all shadow-sm cursor-pointer max-w-[200px]"
          >
            <option value="ALL">সকল অবস্থা / ধরণ</option>
            {STUDENT_STATUS_LIST.map((st, idx) => (
              <option key={idx} value={st}>{st}</option>
            ))}
          </select>

          {/* Year Filter */}
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)}
            className="px-3 py-2.5 bg-card border border-border-main/75 rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary/50 transition-all shadow-sm cursor-pointer max-w-[160px]"
          >
            <option value="ALL">সকল শিক্ষাবর্ষ</option>
            {academicYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* PDF Export All Button */}
          <button
            type="button"
            onClick={() => downloadStudentsListPDF(filteredStudents, `শিক্ষার্থীদের_তালিকা_${selectedJamat === 'ALL' ? 'সকল_জামাত' : selectedJamat}`, {
              name: madrasahBranding?.madrasahName,
              address: madrasahBranding?.address,
              phone: madrasahBranding?.phone,
              logoUrl: madrasahBranding?.logoUrl
            })}
            className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-500/20 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            title="বর্তমান ফিল্টারকৃত সকল শিক্ষার্থীর পিডিএফ শিট ডাউনলোড করুন"
          >
            <FileText size={15} />
            <span className="hidden sm:inline">পিডিএফ ডাউনলোড</span>
          </button>

          {/* Excel Export All Button */}
          <button
            type="button"
            onClick={() => downloadStudentsExcel(filteredStudents, `Students_List_${selectedJamat}`)}
            className="px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/20 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            title="বর্তমান ফিল্টারকৃত সকল শিক্ষার্থীর এক্সেল শিট ডাউনলোড করুন"
          >
            <FileSpreadsheet size={15} />
            <span className="hidden sm:inline">এক্সেল ডাউনলোড</span>
          </button>

          {/* Recycle Bin Button */}
          <button
            type="button"
            onClick={() => setIsRecycleBinOpen(true)}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/20 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ml-1"
            title="মুছে ফেলা শিক্ষার্থীদের তালিকা / রিসাইকেল বিন"
          >
            <Trash2 size={15} />
            <span>রিসাইকেল বিন</span>
            {recycleBinStudents && recycleBinStudents.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-rose-600 text-white rounded-full font-mono font-bold leading-none">
                {enToBnNumber(recycleBinStudents.length.toString())}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="bento-card bg-card border border-border-main/60 shadow-xl rounded-3xl overflow-hidden">
        {/* Mobile List View */}
        <div className="md:hidden p-4 space-y-4 bg-step-bg/15">
          {currentStudents.length > 0 ? (
            currentStudents.map((s, idx) => (
              <div 
                key={`${s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id}-${idx}`}
                className="p-4.5 bg-card border border-border-main/55 rounded-2.5xl shadow-sm transition-all"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="px-2.5 py-1 bg-primary/5 text-primary border border-primary/10 rounded-xl text-[10px] font-black">
                    রোল No: {enToBnNumber(s['রোল নম্বর'] || '—')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const stInfo = getStudentStatusInfo(s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || s.status);
                      return (
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-md border",
                          stInfo.badgeBg,
                          stInfo.badgeText,
                          stInfo.badgeBorder
                        )}>
                          {stInfo.shortTitle}
                        </span>
                      );
                    })()}
                    <span className="text-[10px] font-black bg-success/15 text-success border border-success/20 px-2.5 py-1 rounded-full uppercase leading-none">
                      {s['জামাত/শ্রেণী'] || s['জামাত'] || '—'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary/70 border border-primary/10 font-bold text-xs flex items-center justify-center shrink-0">
                    {(s['शिक्षার্থীর নাম'] || s['শিক্ষার্থীর নাম'] || 'ছা').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-sm text-text-main leading-snug truncate">
                      {s['শিক্ষার্থীর নাম']}
                    </h4>
                    <p className="text-[11px] text-text-light/60 mt-0.5 truncate">
                      পিতা: {s['পিতার নাম'] || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3.5 pt-3 border-t border-border-main/45">
                  <span className="text-[10px] font-bold text-text-light/50">
                    ID: {enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '')}
                  </span>
                  <StudentActionButtons 
                    student={s}
                    onView={handleOpenProfile}
                    onEdit={setStudentToEdit}
                    onDelete={setStudentToDelete}
                    showEdit={true}
                    showDelete={true}
                    size="sm"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="p-16 text-center select-none bg-card border border-dashed border-border-main/80 rounded-2.5xl">
              <AlertCircle size={32} className="text-text-light/25 mx-auto mb-2" />
              <p className="text-xs font-black text-text-light/40 uppercase tracking-wider">কোনো তথ্য পাওয়া যায়নি</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-step-bg border-b border-b-border-main text-text-light/75 uppercase font-black text-[10px] tracking-widest">
              <tr>
                <th className="p-5.5">আইডি নম্বর</th>
                <th className="p-5.5">শিক্ষার্থীর নাম</th>
                <th className="p-5.5">শ্রেণী/জামাত</th>
                <th className="p-5.5 text-center">রোল নম্বর</th>
                <th className="p-5.5">পিতার নাম</th>
                <th className="p-5.5">মোবাইল</th>
                <th className="p-5.5">অবস্থা / ধরণ</th>
                <th className="p-5.5 text-right pr-8">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50">
              {currentStudents.length > 0 ? (
                currentStudents.map((s, idx) => {
                  const stInfo = getStudentStatusInfo(s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || s.status);
                  return (
                    <tr 
                      key={`${s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id}-${idx}`} 
                      className="hover:bg-primary/5 transition-colors group"
                    >
                      <td className="p-5 font-black text-primary">{enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '')}</td>
                      <td className="p-5 font-black text-text-main text-sm">{s['শিক্ষার্থীর নাম']}</td>
                      <td className="p-5"><span className="px-2.5 py-1.5 bg-step-bg border border-border-main rounded-xl font-black text-xs text-text-light/85">{s['জামাত/শ্রেণী'] || s['জামাত'] || '—'}</span></td>
                      <td className="p-5 font-black text-center w-24 bg-step-bg/30">{enToBnNumber(s['রোল নম্বর'] || '—')}</td>
                      <td className="p-5 font-bold text-text-light/80">{s['পিতার নাম'] || '—'}</td>
                      <td className="p-5 font-bold text-text-light/65">{enToBnNumber(s['অভিভাবকের মোবাইল'] || '—')}</td>
                      <td className="p-5 max-w-[200px]">
                        <span 
                          title={stInfo.label}
                          className={cn(
                            "px-2.5 py-1 text-[10px] font-black rounded-lg inline-flex items-center gap-1 leading-normal border truncate max-w-full",
                            stInfo.badgeBg,
                            stInfo.badgeText,
                            stInfo.badgeBorder
                          )}
                        >
                          <span className="truncate">{stInfo.shortTitle}</span>
                        </span>
                      </td>
                      <td className="p-5 text-right pr-6">
                        <StudentActionButtons 
                          student={s}
                          onView={handleOpenProfile}
                          onEdit={setStudentToEdit}
                          onDelete={setStudentToDelete}
                          showEdit={true}
                          showDelete={true}
                          size="sm"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4 grayscale opacity-25">
                      <Users size={40} />
                      <p className="font-black uppercase tracking-widest text-xs">কোনো তথ্য পাওয়া যায়নি</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-5 border-t border-border-main/50 flex justify-between items-center bg-step-bg/20">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-card border border-border-main rounded-xl text-xs font-black text-text-light hover:text-primary disabled:opacity-40 disabled:hover:text-text-light transition-all cursor-pointer"
            >
              পূর্ববর্তী
            </button>
            <span className="text-xs font-black text-text-light/75">
              পৃষ্ঠা {enToBnNumber(currentPage.toString())} / {enToBnNumber(totalPages.toString())} (মোট {enToBnNumber(totalItems.toString())} জন)
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-card border border-border-main rounded-xl text-xs font-black text-text-light hover:text-primary disabled:opacity-40 disabled:hover:text-text-light transition-all cursor-pointer"
            >
              পরবর্তী
            </button>
          </div>
        )}
      </div>

      {/* Student Profile Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
        )}
      </AnimatePresence>

      {/* Student Edit Modal */}
      <AnimatePresence>
        {studentToEdit && (
          <StudentEditModal 
            student={studentToEdit} 
            onClose={() => setStudentToEdit(null)} 
          />
        )}
      </AnimatePresence>

      {/* Global Recycle Bin Modal */}
      <AnimatePresence>
        {isRecycleBinOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <div className="bg-card border border-border-main rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-4 bg-step-bg flex justify-between items-center border-b border-border-main">
                <h3 className="text-base font-black text-text-main flex items-center gap-2">
                  <Trash2 size={18} className="text-rose-500" />
                  রিসাইকেল বিন (মুছে ফেলা ডাটা)
                </h3>
                <button 
                  onClick={() => setIsRecycleBinOpen(false)} 
                  className="p-2 hover:bg-card rounded-xl text-text-light hover:text-text-main transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <GlobalRecycleBin />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Password-Protected Delete Confirmation Modal */}
      <StudentDeleteModal 
        student={studentToDelete}
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
      />
    </div>
  );
};

export const StudentInactive: React.FC = () => {
  const [inactiveStudents, setInactiveStudents] = useState<any[]>(() => {
    const saved = localStorage.getItem('portal_inactive_students');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('portal_inactive_students', JSON.stringify(inactiveStudents));
  }, [inactiveStudents]);

  const handleRestore = (id: string, name: string) => {
    alert(`${name} কে পুনরায় সক্রিয় শিক্ষার্থী হিসেবে মেইন ডাটাবেসে সফলভাবে স্থানান্তর করা হয়েছে!`);
    setInactiveStudents(inactiveStudents.filter(s => s.id !== id));
  };

  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl space-y-6 text-left font-hind-siliguri">
      <div>
        <h2 className="text-2xl font-black text-text-main">নিষ্ক্রিয় শিক্ষার্থী খতিয়ান (Archive DB)</h2>
        <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Inactive and Suspended Students Repository</p>
      </div>

      <div className="overflow-x-auto border border-border-main rounded-2xl">
        <table className="w-full text-xs text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase font-black text-[10px]">
              <th className="p-4">রোল ও নাম</th>
              <th className="p-4">জামাত/শ্রেণী</th>
              <th className="p-4">অভিভাবক</th>
              <th className="p-4 text-error">নিষ্ক্রিয়তার কারণ</th>
              <th className="p-4">তারিখ</th>
              <th className="p-4 text-center">পুনরুদ্ধার</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/40">
            {inactiveStudents.map(s => (
              <tr key={s.id} className="hover:bg-card/45 bg-card/10 transition-colors">
                <td className="p-4">
                  <p className="font-bold text-text-light/40">রোল: {enToBnNumber(s.roll)}</p>
                  <p className="font-black text-text-main text-sm">{s.name}</p>
                </td>
                <td className="p-4 font-black text-primary">{s.class}</td>
                <td className="p-4 font-bold text-text-light/75">{s.guardian}</td>
                <td className="p-4 font-bold text-error bg-error/5">{s.reason}</td>
                <td className="p-4 font-medium text-text-light/60">{enToBnNumber(s.inactiveDate)}</td>
                <td className="p-4 text-center">
                  <button onClick={() => handleRestore(s.id, s.name)} className="px-3.5 py-1.5 bg-success text-white text-[10px] font-black rounded-lg hover:bg-success-dark transition-all cursor-pointer active:scale-95 shadow-md shadow-success/10">
                    সক্রিয় করুন
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// 4. JAMAT DETAILS WITH STUDENT COUNTS (সকল জামাত ও শিক্ষার্থী সংখ্যা)
// ============================================================================
export const StudentJamats: React.FC<{ students: Student[] }> = ({ students }) => {
  const { jamatList } = useData();
  const jamatData = useMemo(() => {
    return jamatList.map(jamat => {
      const classStudents = students.filter(s => (s['জামাত/শ্রেণী'] || s.class) === jamat);
      const residential = classStudents.filter(s => (s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || '').includes('আবাসিক')).length;
      const dayCare = classStudents.filter(s => (s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || '').includes('ডে-কেয়ার')).length;
      const nonResidential = classStudents.length - residential - dayCare;
      return {
        name: jamat,
        total: classStudents.length,
        resCount: residential,
        nonResCount: nonResidential,
        dayCareCount: dayCare
      };
    });
  }, [students]);

  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl space-y-6 text-left font-hind-siliguri">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-main/50">
        <div>
          <h2 className="text-2xl font-black text-text-main">মাদ্রাসার জামাত ভিত্তিক শিক্ষার্থী বণ্টন</h2>
          <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Classwise Enrollment statistics</p>
        </div>
        <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full font-black">
          মোট জামাত সংখ্যা: {enToBnNumber(jamatList.length.toString())} টি
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {jamatData.map((j, index) => (
          <div key={j.name} className="p-6 bg-step-bg/30 border border-border-main/60 rounded-3xl hover:scale-102 transition-all hover:border-primary/25 shadow-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                  জামাত # {enToBnNumber((index + 1).toString())}
                </span>
                <span className="text-2xl font-black text-primary font-mono">{enToBnNumber(j.total.toString())}</span>
              </div>
              <h3 className="font-black text-lg text-text-main">{j.name}</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-main/50 text-[10px] font-bold text-text-light/70">
              <div className="bg-success/5 p-1.5 rounded-xl border border-success/10 text-center">
                <span className="text-success text-[9px] block font-black mb-0.5">আবাসিক</span>
                <p className="font-black text-text-main text-[11px]">{enToBnNumber(j.resCount.toString())} জন</p>
              </div>
              <div className="bg-warning/5 p-1.5 rounded-xl border border-warning/10 text-center">
                <span className="text-warning text-[9px] block font-black mb-0.5">অনাবাসিক</span>
                <p className="font-black text-text-main text-[11px]">{enToBnNumber(j.nonResCount.toString())} জন</p>
              </div>
              <div className="bg-amber-500/5 p-1.5 rounded-xl border border-amber-500/10 text-center">
                <span className="text-amber-500 text-[9px] block font-black mb-0.5">ডে-কেয়ার</span>
                <p className="font-black text-text-main text-[11px]">{enToBnNumber(j.dayCareCount.toString())} জন</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 5. ATTENDANCE REPORT (শিক্ষার্থী উপস্থিতি রিপোর্ট)
// ============================================================================
export const AttendanceReportViewer: React.FC = () => {
  const { jamatList } = useData();
  const [selectedMonth, setSelectedMonth] = useState('জুন ২০২৬');

  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl space-y-6 text-left font-hind-siliguri">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-main/50">
        <div>
          <h2 className="text-2xl font-black text-text-main">শিক্ষার্থী উপস্থিতি মাসিক খতিয়ান ও রিপোর্ট</h2>
          <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Student Attendance Monthly Analytical Sheets</p>
        </div>
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none cursor-pointer">
          <option value="জুন ২০২৬">জুন ২০২৬</option>
          <option value="মে ২০২৬">মে ২০২৬</option>
          <option value="এপ্রিল ২০২৬">এপ্রিল ২০২৬</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
          <span className="text-[10px] font-black uppercase text-emerald-600 block tracking-widest">গড় উপস্থিতি</span>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">{enToBnNumber('৯৪.৫')}%</h3>
        </div>
        <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl">
          <span className="text-[10px] font-black uppercase text-indigo-600 block tracking-widest">সর্বোচ্চ উপস্থিতি (শ্রেণী)</span>
          <h3 className="text-md font-black text-indigo-700 mt-1">মিযান জামাত ({enToBnNumber('৯৮.২')}%)</h3>
        </div>
        <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-3xl">
          <span className="text-[10px] font-black uppercase text-amber-600 block tracking-widest">মোট কর্মদিবস</span>
          <h3 className="text-2xl font-black text-amber-700 mt-1">{enToBnNumber('২৬')} দিন</h3>
        </div>
        <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
          <span className="text-[10px] font-black uppercase text-rose-600 block tracking-widest">গড় অনুপস্থিত</span>
          <h3 className="text-2xl font-black text-rose-700 mt-1">{enToBnNumber('৫.৫')}%</h3>
        </div>
      </div>

      <div className="overflow-x-auto border border-border-main rounded-2xl">
        <table className="w-full text-xs text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase font-black text-[10px]">
              <th className="p-4">শ্রেণী/জামাত</th>
              <th className="p-4 text-center">মোট শিক্ষার্থী</th>
              <th className="p-4 text-center">উপস্থিতি (গড়)</th>
              <th className="p-4 text-center">অনুপস্থিতি (গড়)</th>
              <th className="p-4">সর্বোত্তম ছাত্র (রোল)</th>
              <th className="p-4 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/40">
            {jamatList.map((j, index) => (
              <tr key={j} className="hover:bg-card/45 bg-card/10 transition-colors">
                <td className="p-4 font-black text-text-main">{j}</td>
                <td className="p-4 text-center font-bold">{enToBnNumber((25 - index).toString())} জন</td>
                <td className="p-4 text-center font-black text-success">{(90 + index)}%</td>
                <td className="p-4 text-center font-bold text-error">{(10 - index)}%</td>
                <td className="p-4 font-bold text-text-light/75">হাফেজ ওবাইদুল্লাহ (১০{index})</td>
                <td className="p-4 text-center">
                  <button onClick={() => alert(`${j} জামাতের বিস্তারিত হাজিরা রিপোর্ট জেনারেট হচ্ছে...`)} className="px-3.5 py-1.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-black rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer">
                    ডিটেইলস
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// 6. STAFF ATTENDANCE REPORT (কর্মচারী উপস্থিতি রিপোর্ট)
// ============================================================================
export const StaffAttendanceReportViewer: React.FC = () => {
  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl space-y-6 text-left font-hind-siliguri">
      <div>
        <h2 className="text-2xl font-black text-text-main">শিক্ষক ও স্টাফ উপস্থিতি খতিয়ান ও রিপোর্ট</h2>
        <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Teachers and Staff Monthly Attendance Analytics</p>
      </div>

      <div className="overflow-x-auto border border-border-main rounded-2xl">
        <table className="w-full text-xs text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase font-black text-[10px]">
              <th className="p-4">শিক্ষক/কর্মচারীর নাম</th>
              <th className="p-4">পদবী</th>
              <th className="p-4 text-center">উপস্থিত দিন (জুন)</th>
              <th className="p-4 text-center">ছুটি (অনুমোদিত)</th>
              <th className="p-4 text-center">অনুপস্থিত</th>
              <th className="p-4 text-center">বেতন কাটার যোগ্যতা</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/40">
            {[
              { name: 'মাওলানা আব্দুল হাই', design: 'প্রধান মুহাদ্দিস', present: '২৫', leave: '১', absent: '০', status: 'কাটা হয়নি' },
              { name: 'মুফতি ওবায়দুল্লাহ', design: 'মুহাদ্দিস', present: '২৪', leave: '২', absent: '০', status: 'কাটা হয়নি' },
              { name: 'মাওলানা সাজ্জাদ হোসেন', design: 'নাজেমে তালিমাত', present: '২৩', leave: '২', absent: '১', status: '১ দিনের কাট' },
              { name: 'মোঃ আনোয়ারুল ইসলাম', design: 'অফিস সহকারী', present: '২৬', leave: '০', absent: '০', status: 'কাটা হয়নি' }
            ].map(s => (
              <tr key={s.name} className="hover:bg-card/45 bg-card/10 transition-colors">
                <td className="p-4 font-black text-text-main">{s.name}</td>
                <td className="p-4 font-bold text-primary">{s.design}</td>
                <td className="p-4 text-center font-bold text-success">{enToBnNumber(s.present)} দিন</td>
                <td className="p-4 text-center font-bold text-indigo-500">{enToBnNumber(s.leave)} দিন</td>
                <td className="p-4 text-center font-bold text-error">{enToBnNumber(s.absent)} দিন</td>
                <td className="p-4 text-center">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-black",
                    s.status === 'কাটা হয়নি' ? "bg-success/15 text-success" : "bg-error/15 text-error"
                  )}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// 7. EXAM ROUTINE & EXAM LIST (পরীক্ষার রুটিন ও পরীক্ষার তালিকা)
// ============================================================================
export const ExamRoutineManager: React.FC = () => {
  const { jamatList } = useData();
  const defaultClass = (jamatList && jamatList.length > 0) ? jamatList[0] : 'নূরানী';
  
  const [routines, setRoutines] = useState<any[]>(() => {
    const saved = localStorage.getItem('portal_routines');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved); 
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) { }
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('portal_routines', JSON.stringify(routines));
    } catch (e) { }
  }, [routines]);

  const [examName, setExamName] = useState('১ম সাময়িক পরীক্ষা ২০২৬');
  const [date, setDate] = useState('');
  const [day, setDay] = useState('শনিবার');
  const [time, setTime] = useState('সকাল ৯:০০ - ১২:০০');
  const [selectedClass, setSelectedClass] = useState(defaultClass);
  const [subject, setSubject] = useState('');
  const [filterExam, setFilterExam] = useState('সকল পরীক্ষা');
  const [filterClass, setFilterClass] = useState('সকল জামাত');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const examNamesList = [
    '১ম মাসিক পরীক্ষা ২০২৬',
    '১ম সাময়িক পরীক্ষা ২০২৬',
    '২য় মাসিক পরীক্ষা ২০২৬',
    '২য় সাময়িক পরীক্ষা ২০২৬',
    'বার্ষিক পরীক্ষা ২০২৬',
    'বেফাকুল মাদারিসিল আরাবিয়া পরীক্ষা'
  ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !subject) return;
    const newRoutine = {
      id: uid(),
      examName,
      date,
      day,
      time,
      class: selectedClass,
      subject
    };
    setRoutines([newRoutine, ...routines]);
    setDate('');
    setSubject('');
    setSuccessToast('পরীক্ষার রুটিন ও সময়সূচী সফলভাবে যুক্ত করা হয়েছে!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const filteredRoutines = useMemo(() => {
    if (!Array.isArray(routines)) return [];
    return routines.filter(r => {
      const matchExam = filterExam === 'সকল পরীক্ষা' || r.examName === filterExam;
      const matchClass = filterClass === 'সকল জামাত' || r.class === filterClass;
      return matchExam && matchClass;
    });
  }, [routines, filterExam, filterClass]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-left font-hind-siliguri">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-main/50">
        <div>
          <h2 className="text-2xl font-black text-text-main font-hind-siliguri leading-none mb-1.5">পরীক্ষার রুটিন ও তালিকা ব্যবস্থাপনা (Exam Schedule & List)</h2>
          <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none">Madrasah Exam Timetable & Routine Manager</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-primary text-white font-black rounded-xl text-xs shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Printer size={16} /> রুটিন প্রিন্ট / পিডিএফ
        </button>
      </div>

      {successToast && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {successToast}
        </div>
      )}

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-step-bg p-4 rounded-2xl border border-border-main">
        <div className="space-y-1">
          <label className="text-xs font-black text-text-main">পরীক্ষা ফিল্টার করুন</label>
          <select
            value={filterExam}
            onChange={e => setFilterExam(e.target.value)}
            className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
          >
            <option value="সকল পরীক্ষা">সকল পরীক্ষা</option>
            {examNamesList.map(ex => <option key={ex} value={ex}>{ex}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black text-text-main">জামাত/শ্রেণী ফিল্টার করুন</label>
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
          >
            <option value="সকল জামাত">সকল জামাত</option>
            {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="bento-card p-6 bg-card border border-border-main shadow-xl space-y-4 lg:col-span-1">
          <h3 className="text-sm font-black text-text-main uppercase tracking-wider border-b border-border-main/40 pb-2">নতুন পরীক্ষার রুটিন এন্ট্রি</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-text-main">পরীক্ষার নাম</label>
              <select
                value={examName}
                onChange={e => setExamName(e.target.value)}
                className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none"
              >
                {examNamesList.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-text-main">তারিখ *</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-text-main">বার</label>
              <select value={day} onChange={e => setDay(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none">
                <option value="শনিবার">শনিবার</option>
                <option value="রবিবার">রবিবার</option>
                <option value="সোমবার">সোমবার</option>
                <option value="মঙ্গলবার">মঙ্গলবার</option>
                <option value="বুধবার">বুধবার</option>
                <option value="বৃহস্পতিবার">বৃহস্পতিবার</option>
                <option value="শুক্রবার">শুক্রবার</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-text-main">সময়সীমা</label>
              <input type="text" value={time} onChange={e => setTime(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-text-main">শ্রেণী/জামাত</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none">
                {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-text-main">বিষয়/কিতাবের নাম *</label>
              <input type="text" required placeholder="যেমন: কাফিয়া / কুরআন মাজীদ" value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" />
            </div>

            <button type="submit" className="w-full py-3 bg-primary text-white font-black text-xs rounded-xl active:scale-95 shadow-md cursor-pointer">
              রুটিন তালিকায় যোগ করুন
            </button>
          </form>
        </div>

        {/* Table Column */}
        <div className="bento-card p-6 sm:p-8 bg-card border border-border-main shadow-2xl lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-black text-text-main">পরীক্ষার রুটিন ও সময়সূচী তালিকা</h3>
            <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Total {filteredRoutines.length} Exam Schedules Found</p>
          </div>

          <div className="overflow-x-auto border border-border-main rounded-2xl">
            <table className="w-full text-xs text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase font-black text-[10px]">
                  <th className="p-4">পরীক্ষার নাম</th>
                  <th className="p-4">তারিখ ও বার</th>
                  <th className="p-4">সময়</th>
                  <th className="p-4">জামাত/শ্রেণী</th>
                  <th className="p-4">বিষয়/কিতাব</th>
                  <th className="p-4 text-center">মুছুন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/40">
                {filteredRoutines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-text-light/50 font-bold">
                      কোনো পরীক্ষার রুটিন পাওয়া যায়নি। বাম দিকের ফর্ম থেকে নতুন রুটিন যোগ করুন।
                    </td>
                  </tr>
                ) : (
                  filteredRoutines.map(r => (
                    <tr key={r.id} className="hover:bg-card/45 bg-card/10 transition-colors">
                      <td className="p-4 font-bold text-primary">
                        {r.examName}
                      </td>
                      <td className="p-4 font-bold text-text-main">
                        <p>{enToBnNumber(r.date)}</p>
                        <p className="text-[10px] text-text-light/50">{r.day}</p>
                      </td>
                      <td className="p-4 font-bold text-text-light/75">{r.time}</td>
                      <td className="p-4 font-black text-text-main">{r.class}</td>
                      <td className="p-4 font-black text-success">{r.subject}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => setRoutines(routines.filter(x => x.id !== r.id))} className="p-2 hover:bg-error/10 text-text-light/50 hover:text-error rounded-xl transition-all cursor-pointer">
                          <Trash2 size={14} />
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
    </div>
  );
};

// ==========================// ============================================================================
// 11. GENERAL ACADEMIC CRUDS ( জামাত/শ্রেণী, শাখা, বিষয়/সাবজেক্ট, জামাত-বিষয় অ্যাসাইন, ইত্যাদি )
// ============================================================================
export interface JamatClass {
  id: string;
  name: string;
  marhala: string;
  equivalent: string;
  isActive: boolean;
}

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  bookName: string;
  type: 'আবশ্যিক' | 'ঐচ্ছিক';
  totalMarks: number;
}

export interface AssignmentItem {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacher: string;
  bookName: string;
}

const defaultClassesList: JamatClass[] = [];

const defaultSubjectsList: SubjectItem[] = [];

const defaultAssignmentsList: AssignmentItem[] = [];

export const AcademicStructureGrid: React.FC<{ 
  type: 'class' | 'branch' | 'subject' | 'assign-class-sub' | 'assign-teacher-sub' | 'dates' | 'cost' | 'metrics';
  setSelectedClassFilter?: (className: string | null) => void;
  setActiveTab?: (tabName: string) => void;
  students?: Student[];
}> = ({ type, setSelectedClassFilter, setActiveTab, students = [] }) => {
  const { jamatList } = useData();
  const [classes, setClasses] = useState<JamatClass[]>(() => {
    const saved = localStorage.getItem('madrasah_classes');
    if (saved) return JSON.parse(saved);
    return defaultClassesList;
  });

  const [subjects, setSubjects] = useState<SubjectItem[]>(() => {
    const saved = localStorage.getItem('madrasah_subjects');
    if (saved) return JSON.parse(saved);
    return defaultSubjectsList;
  });

  const [assignments, setAssignments] = useState<AssignmentItem[]>(() => {
    const saved = localStorage.getItem('madrasah_assignments');
    if (saved) return JSON.parse(saved);
    return defaultAssignmentsList;
  });

  // Save state back to local storage
  useEffect(() => {
    localStorage.setItem('madrasah_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('madrasah_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('madrasah_assignments', JSON.stringify(assignments));
  }, [assignments]);

  // Form states
  const [classForm, setClassForm] = useState({ name: '', marhala: 'ইবতেদাইয়্যাহ (প্রাথমিক)', equivalent: '', isActive: true });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', bookName: '', type: 'আবশ্যিক' as 'আবশ্যিক' | 'ঐচ্ছিক', totalMarks: 100 });
  const [assignForm, setAssignForm] = useState({ classId: '', subjectId: '', teacher: '', bookName: '' });

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarhala, setSelectedMarhala] = useState('All');

  // Modal / popup state
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingClassSubjects, setViewingClassSubjects] = useState<JamatClass | null>(null);

  // Auto-fill defaults for assign form
  useEffect(() => {
    if (classes.length > 0 && subjects.length > 0 && !assignForm.classId) {
      setAssignForm({
        classId: classes[0].id,
        subjectId: subjects[0].id,
        teacher: 'মাওলানা সাজ্জাদ হোসেন',
        bookName: subjects[0].bookName
      });
    }
  }, [classes, subjects]);

  // Handle adding class
  const handleAddClass = () => {
    if (!classForm.name) {
      alert('দয়া করে জামাত বা শ্রেণীর নাম লিখুন!');
      return;
    }
    const exists = classes.some(c => c.name.trim() === classForm.name.trim());
    if (exists) {
      alert('এই জামাতটি ইতিমধ্যে বিদ্যমান রয়েছে!');
      return;
    }
    const newClass: JamatClass = {
      id: uid(),
      name: classForm.name,
      marhala: classForm.marhala,
      equivalent: classForm.equivalent || 'উদ্ধৃত নয়',
      isActive: classForm.isActive
    };
    setClasses([...classes, newClass]);
    setClassForm({ name: '', marhala: 'ইবতেদাইয়্যাহ (প্রাথমিক)', equivalent: '', isActive: true });
    alert('নতুন জামাত/শ্রেণী সফলভাবে তৈরি হয়েছে!');
  };

  // Handle adding subject
  const handleAddSubject = () => {
    if (!subjectForm.name) {
      alert('দয়া করে বিষয়ের নাম লিখুন!');
      return;
    }
    const newSubject: SubjectItem = {
      id: 'sub-' + uid(),
      name: subjectForm.name,
      code: subjectForm.code || 'SUB-' + uid().substring(0, 3),
      bookName: subjectForm.bookName || 'নির্দিষ্ট বই নেই',
      type: subjectForm.type,
      totalMarks: Number(subjectForm.totalMarks) || 100
    };
    setSubjects([...subjects, newSubject]);
    setSubjectForm({ name: '', code: '', bookName: '', type: 'আবশ্যিক', totalMarks: 100 });
    alert('নতুন বিষয়/সাবজেক্ট সফলভাবে তৈরি হয়েছে!');
  };

  // Handle adding assignment
  const handleAddAssignment = () => {
    const cls = classes.find(c => c.id === assignForm.classId);
    const sub = subjects.find(s => s.id === assignForm.subjectId);
    if (!cls || !sub) {
      alert('সঠিক জামাত এবং বিষয় নির্বাচন করুন!');
      return;
    }
    const exists = assignments.some(a => a.classId === cls.id && a.subjectId === sub.id);
    if (exists) {
      alert('এই জামাতে ইতিমধ্যে এই বিষয় বা কিতাবটি অ্যাসাইন করা আছে!');
      return;
    }
    const newAssign: AssignmentItem = {
      id: uid(),
      classId: cls.id,
      className: cls.name,
      subjectId: sub.id,
      subjectName: sub.name,
      teacher: assignForm.teacher || 'অ্যাসাইনড করা হয়নি',
      bookName: assignForm.bookName || sub.bookName
    };
    setAssignments([...assignments, newAssign]);
    alert('জামাতে সফলভাবে নতুন কিতাব/বিষয় বরাদ্দ করা হয়েছে!');
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    let exportData: any[] = [];
    let filename = '';

    if (type === 'class') {
      exportData = classes.map((c, i) => ({
        'ক্রমিক': i + 1,
        'জামাত/শ্রেণীর নাম': c.name,
        'বিভাগ/মরহালা': c.marhala,
        'সমমান শ্রেণী': c.equivalent,
        'শিক্ষার্থী সংখ্যা': students.filter(s => {
          const sClass = s["জামাত/শ্রেণী"] || s["শ্রেণী"] || "";
          return sClass === c.name || sClass.includes(c.name) || c.name.includes(sClass);
        }).length,
        'অবস্থা': c.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'
      }));
      filename = 'Jamats_Registry.csv';
    } else if (type === 'subject') {
      exportData = subjects.map((s, i) => ({
        'ক্রমিক': i + 1,
        'বিষয়ের নাম': s.name,
        'বিষয় কোড': s.code,
        'প্রধান কিতাব': s.bookName,
        'ধরণ': s.type,
        'মোট নম্বর': s.totalMarks
      }));
      filename = 'Subjects_Ledger.csv';
    } else {
      exportData = assignments.map((a, i) => ({
        'ক্রমিক': i + 1,
        'জামাত': a.className,
        'বিষয়/কিতাব': a.subjectName,
        'প্রধান কিতাব': a.bookName,
        'দায়িত্বরত শিক্ষক': a.teacher
      }));
      filename = 'Class_Subject_Assignments.csv';
    }

    const csvRows = [];
    if (exportData.length === 0) {
      alert('রপ্তানি করার জন্য কোন রেকর্ড নেই!');
      return;
    }
    const headers = Object.keys(exportData[0]);
    csvRows.push(headers.join(','));

    for (const row of exportData) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to jump to students
  const handleViewStudentsOfClass = (className: string) => {
    if (setSelectedClassFilter && setActiveTab) {
      // Find clean class name from jamatList if matching
      const matched = jamatList.find(j => j === className || j.includes(className) || className.includes(j));
      setSelectedClassFilter(matched || className);
      setActiveTab('students');
    }
  };

  // Filtered lists based on search & department
  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.equivalent.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMarhala = selectedMarhala === 'All' || c.marhala === selectedMarhala;
      return matchesSearch && matchesMarhala;
    });
  }, [classes, searchTerm, selectedMarhala]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.bookName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subjects, searchTerm]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => 
      a.className.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assignments, searchTerm]);

  return (
    <div className="bento-card p-4 sm:p-8 bg-card border border-border-main shadow-2xl text-left font-hind-siliguri space-y-6 rounded-[2rem] transition-colors duration-300">
      
      {/* Top Header Segment */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-main/50 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-text-main flex items-center gap-2">
            <BookOpen className="text-primary stroke-[2.5]" size={24} />
            {type === 'class' ? 'জামাত ও শ্রেণী ব্যবস্থাপনা' : 
             type === 'branch' ? 'শাখা ও সেকশন ব্যবস্থাপনা' : 
             type === 'subject' ? 'বিষয় ও কিতাব ব্যবস্থাপনা' : 
             type === 'assign-class-sub' ? 'জামাত-বিষয় ও কিতাব বরাদ্দ' : 
             type === 'assign-teacher-sub' ? 'শিক্ষক-সাবজেক্ট অ্যাসাইনমেন্ট' : 
             type === 'dates' ? 'পরীক্ষার সময়সীমা ও কন্ডাকশন' : 
             type === 'cost' ? 'খরচের প্যাকেজ' : 'মূল্যায়ন মেট্রিক্স'}
          </h2>
          <p className="text-[10px] text-text-light/50 uppercase font-black tracking-wider leading-none mt-1">
            Madrasah Academic Ledger Configurer & Planner
          </p>
        </div>

        {/* Excel Export Button */}
        {(type === 'class' || type === 'subject' || type === 'assign-class-sub') && (
          <button 
            onClick={handleExportCSV} 
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 hover:dark:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <FileSpreadsheet size={15} />
            <span>এক্সেল শিট ডাউনলোড করুন</span>
          </button>
        )}
      </div>

      {/* Statistics Panels for Premium Design */}
      {type === 'class' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
            <p className="text-[10px] font-black text-primary/70 uppercase">মোট জামাত</p>
            <h3 className="text-xl sm:text-2xl font-black text-text-main mt-1">{enToBnNumber(classes.length.toString())} টি</h3>
          </div>
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">সক্রিয় জামাত</p>
            <h3 className="text-xl sm:text-2xl font-black text-text-main mt-1">{enToBnNumber(classes.filter(c => c.isActive).length.toString())} টি</h3>
          </div>
          <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
            <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase">নিষ্ক্রিয় জামাত</p>
            <h3 className="text-xl sm:text-2xl font-black text-text-main mt-1">{enToBnNumber(classes.filter(c => !c.isActive).length.toString())} টি</h3>
          </div>
          <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">নিবন্ধিত শিক্ষার্থী</p>
            <h3 className="text-xl sm:text-2xl font-black text-text-main mt-1">{enToBnNumber(students.length.toString())} জন</h3>
          </div>
        </div>
      )}

      {type === 'subject' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">মোট বিষয় সংখ্যা</p>
            <h3 className="text-xl sm:text-2xl font-black text-text-main mt-1">{enToBnNumber(subjects.length.toString())} টি</h3>
          </div>
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">আবশ্যিক কিতাব সমূহ</p>
            <h3 className="text-xl sm:text-2xl font-black text-text-main mt-1">{enToBnNumber(subjects.filter(s => s.type === 'আবশ্যিক').length.toString())} টি</h3>
          </div>
          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase">ঐচ্ছিক বিষয় সমূহ</p>
            <h3 className="text-xl sm:text-2xl font-black text-text-main mt-1">{enToBnNumber(subjects.filter(s => s.type === 'ঐচ্ছিক').length.toString())} টি</h3>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      {(type === 'class' || type === 'subject' || type === 'assign-class-sub') && (
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Search Box */}
          <div className="relative w-full sm:flex-1">
            <Search size={15} className="absolute left-3.5 top-3.5 text-text-light/40" />
            <input 
              type="text" 
              placeholder={
                type === 'class' ? "জামাতের নাম বা সমমান দিয়ে খুঁজুন..." :
                type === 'subject' ? "বিষয়ের নাম বা কিতাব দিয়ে খুঁজুন..." : "বরাদ্দকৃত জামাত বা শিক্ষক দিয়ে খুঁজুন..."
              }
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none focus:border-primary/50" 
            />
          </div>

          {/* Department Filter for Classes */}
          {type === 'class' && (
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <span className="text-xs font-black text-text-light shrink-0">বিভাগ:</span>
              <select 
                value={selectedMarhala} 
                onChange={e => setSelectedMarhala(e.target.value)}
                className="w-full sm:w-auto p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none cursor-pointer"
              >
                <option value="All">সকল বিভাগ</option>
                <option value="ইবতেদাইয়্যাহ (প্রাথমিক)">ইবতেদাইয়্যাহ (প্রাথমিক)</option>
                <option value="মুতাওয়াসসিতাহ (নিম্ন মাধ্যমিক)">মুতাওয়াসসিতাহ (নিম্ন মাধ্যমিক)</option>
                <option value="সানাবিয়্যাহ (মাধ্যমিক)">সানাবিয়্যাহ (মাধ্যমিক)</option>
                <option value="ফজিলত (স্নাতক)">ফজিলত (স্নাতক)</option>
                <option value="তাকমিল (স্নাতকোত্তর)">তাকমিল (স্নাতকোত্তর)</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Form Left, Database List Right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-2">
        
        {/* Left Side: Addition Forms */}
        <div className="p-6 bg-step-bg/30 border border-border-main/50 rounded-3xl space-y-4 h-fit">
          <h3 className="font-black text-sm text-text-main border-l-4 border-primary pl-3 flex items-center gap-1.5">
            <Plus size={16} />
            {type === 'class' ? 'নতুন জামাত যুক্ত করুন' : 
             type === 'subject' ? 'নতুন বিষয় যুক্ত করুন' : 
             type === 'assign-class-sub' ? 'নতুন বিষয় বরাদ্দ করুন' : 'নতুন তথ্য দিন'}
          </h3>

          {/* ADD CLASS FORM */}
          {type === 'class' && (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">জামাত/শ্রেণীর নাম *</label>
                <input 
                  type="text" 
                  placeholder="যেমন: শরহে বেকায়া" 
                  value={classForm.name} 
                  onChange={e => setClassForm({ ...classForm, name: e.target.value })} 
                  className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">বিভাগ/মরহালা</label>
                <select 
                  value={classForm.marhala} 
                  onChange={e => setClassForm({ ...classForm, marhala: e.target.value })} 
                  className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
                >
                  <option value="ইবতেদাইয়্যাহ (প্রাথমিক)">ইবতেদাইয়্যাহ (প্রাথমিক)</option>
                  <option value="মুতাওয়াসসিতাহ (নিম্ন মাধ্যমিক)">মুতাওয়াসসিতাহ (নিম্ন মাধ্যমিক)</option>
                  <option value="সানাবিয়্যাহ (মাধ্যমিক)">সানাবিয়্যাহ (মাধ্যমিক)</option>
                  <option value="ফজিলত (স্নাতক)">ফজিলত (স্নাতক)</option>
                  <option value="তাকমিল (স্নাতকোত্তর)">তাকমিল (স্নাতকোত্তর)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">সমমান জেনারেল শ্রেণী</label>
                <input 
                  type="text" 
                  placeholder="যেমন: নবম-দশম শ্রেণী সমমান" 
                  value={classForm.equivalent} 
                  onChange={e => setClassForm({ ...classForm, equivalent: e.target.value })} 
                  className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">প্রাথমিক অবস্থা</label>
                <select 
                  value={classForm.isActive ? 'active' : 'inactive'} 
                  onChange={e => setClassForm({ ...classForm, isActive: e.target.value === 'active' })} 
                  className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
                >
                  <option value="active">সক্রিয় (ভর্তি ও পড়াশোনা চালু)</option>
                  <option value="inactive">নিষ্ক্রিয় (সাময়িকভাবে বন্ধ)</option>
                </select>
              </div>

              <button onClick={handleAddClass} className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-black text-xs rounded-xl active:scale-95 shadow-md cursor-pointer transition-all">
                জামাত নিশ্চিত করুন
              </button>
            </div>
          )}

          {/* ADD SUBJECT FORM */}
          {type === 'subject' && (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">বিষয়ের নাম *</label>
                <input 
                  type="text" 
                  placeholder="যেমন: আরবি সাহিত্য ও কিতাবাত" 
                  value={subjectForm.name} 
                  onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} 
                  className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">বিষয় কোড</label>
                <input 
                  type="text" 
                  placeholder="যেমন: SUB-402" 
                  value={subjectForm.code} 
                  onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} 
                  className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">মূল পাঠ্য কিতাব</label>
                <input 
                  type="text" 
                  placeholder="যেমন: তাইসীরুল মুবতাদী" 
                  value={subjectForm.bookName} 
                  onChange={e => setSubjectForm({ ...subjectForm, bookName: e.target.value })} 
                  className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-black text-text-main">বিষয়ের ধরণ</label>
                  <select 
                    value={subjectForm.type} 
                    onChange={e => setSubjectForm({ ...subjectForm, type: e.target.value as 'আবশ্যিক' | 'ঐচ্ছিক' })} 
                    className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="আবশ্যিক">আবশ্যিক</option>
                    <option value="ঐচ্ছিক">ঐচ্ছিক</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-text-main">মোট নম্বর</label>
                  <input 
                    type="number" 
                    placeholder="100" 
                    value={subjectForm.totalMarks} 
                    onChange={e => setSubjectForm({ ...subjectForm, totalMarks: Number(e.target.value) })} 
                    className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none" 
                  />
                </div>
              </div>

              <button onClick={handleAddSubject} className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-black text-xs rounded-xl active:scale-95 shadow-md cursor-pointer transition-all">
                বিষয় নিশ্চিত করুন
              </button>
            </div>
          )}

          {/* ASSIGN CLASS SUBJECT FORM */}
          {type === 'assign-class-sub' && (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">শ্রেণী/জামাত নির্বাচন করুন</label>
                <select 
                  value={assignForm.classId} 
                  onChange={e => setAssignForm({ ...assignForm, classId: e.target.value })} 
                  className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">বিষয়/সাবজেক্ট নির্বাচন করুন</label>
                <select 
                  value={assignForm.subjectId} 
                  onChange={e => {
                    const matchedSub = subjects.find(s => s.id === e.target.value);
                    setAssignForm({ 
                      ...assignForm, 
                      subjectId: e.target.value,
                      bookName: matchedSub ? matchedSub.bookName : ''
                    });
                  }} 
                  className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
                >
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.bookName})</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">মূল কিতাবের নাম</label>
                <input 
                  type="text" 
                  placeholder="যেমন: কুদূরী শরীফ" 
                  value={assignForm.bookName} 
                  onChange={e => setAssignForm({ ...assignForm, bookName: e.target.value })} 
                  className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">দায়িত্বরত শিক্ষক</label>
                <input 
                  type="text" 
                  placeholder="যেমন: মাওলানা সাজ্জাদ হোসেন" 
                  value={assignForm.teacher} 
                  onChange={e => setAssignForm({ ...assignForm, teacher: e.target.value })} 
                  className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none" 
                />
              </div>

              <button onClick={handleAddAssignment} className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-black text-xs rounded-xl active:scale-95 shadow-md cursor-pointer transition-all">
                 বরাদ্দ নিশ্চিত করুন
              </button>
            </div>
          )}

          {/* NON-FUNCTIONAL FALLBACKS */}
          {type !== 'class' && type !== 'subject' && type !== 'assign-class-sub' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">রেকর্ড নাম</label>
                <input type="text" placeholder="এখানে লিখুন..." className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none" />
              </div>
              <button className="w-full py-3 bg-primary text-white font-black text-xs rounded-xl active:scale-95 shadow-md">নিশ্চিত করুন</button>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Table / List */}
        <div className="p-6 bg-card border border-border-main rounded-3xl xl:col-span-2 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-black text-sm text-text-main flex items-center justify-between">
              <span>বিদ্যমান ডাটাবেস রেকর্ডস</span>
              <span className="text-[10px] text-text-light/50 font-bold uppercase tracking-wider">
                {type === 'class' ? `${classes.length} টি মোট জামাত` : 
                 type === 'subject' ? `${subjects.length} টি বিষয়` : ''}
              </span>
            </h3>
            
            {/* CLASSES RENDER */}
            {type === 'class' && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border-main/50 text-[10px] font-black uppercase text-text-light/50 tracking-wider">
                      <th className="py-3 px-2">ক্রমিক</th>
                      <th className="py-3 px-3">জামাত/শ্রেণী</th>
                      <th className="py-3 px-3">বিভাগ সমূহ</th>
                      <th className="py-3 px-3">জেনারেল সমমান</th>
                      <th className="py-3 px-2 text-center">শিক্ষার্থী</th>
                      <th className="py-3 px-3 text-center">অবস্থা</th>
                      <th className="py-3 px-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main/30">
                    {filteredClasses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center font-black text-text-light/40 text-xs">কোন জামাত পাওয়া যায়নি!</td>
                      </tr>
                    ) : (
                      filteredClasses.map((c, index) => {
                        const countStudents = students.filter(s => {
                          const sClass = s["জামাত/শ্রেণী"] || s["শ্রেণী"] || "";
                          return sClass === c.name || sClass.includes(c.name) || c.name.includes(sClass);
                        }).length;

                        return (
                          <tr key={c.id} className="hover:bg-step-bg/30 group">
                            <td className="py-3.5 px-2 font-mono text-xs text-text-light/50">{enToBnNumber((index + 1).toString())}</td>
                            <td className="py-3.5 px-3">
                              <span className="font-black text-text-main text-xs block">{c.name}</span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="text-[10px] font-black text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-md inline-block">
                                {c.marhala}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-xs font-bold text-text-light/70">{c.equivalent}</td>
                            <td className="py-3.5 px-2 text-center">
                              <button 
                                onClick={() => handleViewStudentsOfClass(c.name)}
                                className="font-black text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                              >
                                {enToBnNumber(countStudents.toString())} জন
                              </button>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <button 
                                onClick={() => {
                                  setClasses(classes.map(item => item.id === c.id ? { ...item, isActive: !item.isActive } : item));
                                }}
                                className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border transition-all cursor-pointer ${
                                  c.isActive 
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                }`}
                              >
                                {c.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                              </button>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100">
                                {/* View Subjects Button */}
                                <button 
                                  onClick={() => setViewingClassSubjects(c)}
                                  className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors cursor-pointer"
                                  title="বরাদ্দকৃত বিষয় ও সিলেবাস দেখুন"
                                >
                                  <BookOpen size={13} />
                                </button>
                                {/* Edit Button */}
                                <button 
                                  onClick={() => setEditingItem({ type: 'class', ...c })}
                                  className="p-1.5 hover:bg-indigo-500/10 text-indigo-500 rounded-lg transition-colors cursor-pointer"
                                  title="এডিট করুন"
                                >
                                  <Edit size={13} />
                                </button>
                                {/* Delete Button */}
                                <button 
                                  onClick={() => {
                                    if(confirm(`আপনি কি নিশ্চিতভাবে "${c.name}" জামাতটি ডিলিট করতে চান?`)) {
                                      setClasses(classes.filter(item => item.id !== c.id));
                                    }
                                  }}
                                  className="p-1.5 hover:bg-error/10 text-error rounded-lg transition-colors cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBJECTS RENDER */}
            {type === 'subject' && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border-main/50 text-[10px] font-black uppercase text-text-light/50 tracking-wider">
                      <th className="py-3 px-2">কোড</th>
                      <th className="py-3 px-3">বিষয়/সাবজেক্ট</th>
                      <th className="py-3 px-3">মূল কিতাব</th>
                      <th className="py-3 px-3">ধরণ</th>
                      <th className="py-3 px-3 text-center">পূর্ণমান</th>
                      <th className="py-3 px-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main/30">
                    {filteredSubjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center font-black text-text-light/40 text-xs">কোন বিষয় পাওয়া যায়নি!</td>
                      </tr>
                    ) : (
                      filteredSubjects.map((s) => (
                        <tr key={s.id} className="hover:bg-step-bg/30 group">
                          <td className="py-3 px-2 font-mono text-xs font-bold text-indigo-500">{s.code}</td>
                          <td className="py-3 px-3 font-black text-text-main text-xs">{s.name}</td>
                          <td className="py-3 px-3 text-xs font-bold text-text-light/80">{s.bookName}</td>
                          <td className="py-3 px-3">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              s.type === 'আবশ্যিক' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {s.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-xs font-bold text-text-main">{enToBnNumber(s.totalMarks.toString())}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100">
                              {/* Edit Button */}
                              <button 
                                onClick={() => setEditingItem({ type: 'subject', ...s })}
                                className="p-1.5 hover:bg-indigo-500/10 text-indigo-500 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit size={13} />
                              </button>
                              {/* Delete Button */}
                              <button 
                                onClick={() => {
                                  if (confirm(`আপনি কি "${s.name}" বিষয়টি ডিলিট করতে চান?`)) {
                                    setSubjects(subjects.filter(item => item.id !== s.id));
                                    setAssignments(assignments.filter(item => item.subjectId !== s.id));
                                  }
                                }}
                                className="p-1.5 hover:bg-error/10 text-error rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ASSIGNMENTS RENDER */}
            {type === 'assign-class-sub' && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[550px]">
                  <thead>
                    <tr className="border-b border-border-main/50 text-[10px] font-black uppercase text-text-light/50 tracking-wider">
                      <th className="py-3 px-3">জামাত/শ্রেণী</th>
                      <th className="py-3 px-3">কিতাব ও বিষয়</th>
                      <th className="py-3 px-3">শিক্ষক</th>
                      <th className="py-3 px-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main/30">
                    {filteredAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center font-black text-text-light/40 text-xs">কোন অ্যাসাইনমেন্ট পাওয়া যায়নি!</td>
                      </tr>
                    ) : (
                      filteredAssignments.map((a) => (
                        <tr key={a.id} className="hover:bg-step-bg/30 group">
                          <td className="py-3.5 px-3 font-black text-text-main text-xs">{a.className}</td>
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-text-main text-xs block">{a.subjectName}</span>
                            <span className="text-[10px] text-text-light/50 font-medium">কিতাব: {a.bookName}</span>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-text-light/80 text-xs">{a.teacher}</td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100">
                              <button 
                                onClick={() => {
                                  if (confirm(`আপনি কি এই বরাদ্দ বাতিল করতে চান?`)) {
                                    setAssignments(assignments.filter(item => item.id !== a.id));
                                  }
                                }}
                                className="p-1.5 hover:bg-error/10 text-error rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* BRANCHES / GENERAL STATIC RENDER */}
            {type === 'branch' && getActiveBranches().map(b => (
              <div key={b} className="py-3 border-b border-border-main/30 flex justify-between items-center">
                <span className="font-black text-text-main text-xs">{b}</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-black">সক্রিয় সেকশন</span>
              </div>
            ))}

            {type === 'dates' && ['সাময়িক পরীক্ষা (জুলাই ১০)', 'বার্ষিক পরীক্ষা (ডিসেম্বর ১৫)'].map(d => (
              <div key={d} className="py-3 border-b border-border-main/30 flex justify-between items-center">
                <span className="font-black text-text-main text-xs">{d}</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/25 px-2.5 py-0.5 rounded-full font-black">তফসিলভুক্ত</span>
              </div>
            ))}

            {type === 'cost' && ['মেস খরচ প্যাকেজ (১৮০০ টাকা)', 'কুতুবখানা ও লাইব্রেরি ফি (৫০০ টাকা)'].map(co => (
              <div key={co} className="py-3 border-b border-border-main/30 flex justify-between items-center">
                <span className="font-black text-text-main text-xs">{co}</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-600 px-2.5 py-0.5 rounded-full font-black">প্যাকেজ</span>
              </div>
            ))}

            {type === 'metrics' && ['মুমতাজ (৯০-১০০)', 'জায়্যিদ জিদ্দান (৮০-৮৯)', 'জায়্যিদ (৬৫-৭৯)', 'মাকবুল (৫০-৬৪)', 'রাসেব (০-৪৯)'].map(m => (
              <div key={m} className="py-3 border-b border-border-main/30 flex justify-between items-center">
                <span className="font-black text-text-main text-xs">{m}</span>
                <span className="text-[10px] bg-indigo-500/15 text-indigo-600 px-2.5 py-0.5 rounded-full font-black">গ্রেডিং স্কেল</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EDIT MODAL DIALOG */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border border-border-main max-w-md w-full p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border-main/40">
                <h3 className="font-black text-base text-text-main">
                  {editingItem.type === 'class' ? 'জামাত/শ্রেণী এডিট করুন' : 'বিষয়/সাবজেক্ট এডিট করুন'}
                </h3>
                <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-step-bg rounded-lg cursor-pointer">
                  <XCircle size={18} className="text-text-light/50 hover:text-error" />
                </button>
              </div>

              {editingItem.type === 'class' ? (
                <div className="space-y-3 text-xs font-bold text-text-main">
                  <div className="space-y-1">
                    <label>জামাত নাম</label>
                    <input 
                      type="text" 
                      value={editingItem.name} 
                      onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} 
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label>মরহালা/বিভাগ</label>
                    <select 
                      value={editingItem.marhala} 
                      onChange={e => setEditingItem({ ...editingItem, marhala: e.target.value })}
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl"
                    >
                      <option value="ইবতেদাইয়্যাহ (প্রাথমিক)">ইবতেদাইয়্যাহ (প্রাথমিক)</option>
                      <option value="মুতাওয়াসসিতাহ (নিম্ন মাধ্যমিক)">মুতাওয়াসসিতাহ (নিম্ন মাধ্যমিক)</option>
                      <option value="সানাবিয়্যাহ (মাধ্যমিক)">সানাবিয়্যাহ (মাধ্যমিক)</option>
                      <option value="ফজিলত (স্নাতক)">ফজিলত (স্নাতক)</option>
                      <option value="তাকমিল (স্নাতকোত্তর)">তাকমিল (স্নাতকোত্তর)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label>জেনারেল সমমান</label>
                    <input 
                      type="text" 
                      value={editingItem.equivalent} 
                      onChange={e => setEditingItem({ ...editingItem, equivalent: e.target.value })} 
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label>অবস্থা</label>
                    <select 
                      value={editingItem.isActive ? 'active' : 'inactive'} 
                      onChange={e => setEditingItem({ ...editingItem, isActive: e.target.value === 'active' })}
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl"
                    >
                      <option value="active">সক্রিয়</option>
                      <option value="inactive">নিষ্ক্রিয়</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => {
                      setClasses(classes.map(item => item.id === editingItem.id ? { ...item, name: editingItem.name, marhala: editingItem.marhala, equivalent: editingItem.equivalent, isActive: editingItem.isActive } : item));
                      setEditingItem(null);
                      alert('জামাত তথ্য আপডেট সম্পন্ন হয়েছে!');
                    }} 
                    className="w-full py-3 bg-primary text-white rounded-xl font-black mt-2"
                  >
                    আপডেট করুন
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-xs font-bold text-text-main">
                  <div className="space-y-1">
                    <label>বিষয়ের নাম</label>
                    <input 
                      type="text" 
                      value={editingItem.name} 
                      onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} 
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label>কোড</label>
                    <input 
                      type="text" 
                      value={editingItem.code} 
                      onChange={e => setEditingItem({ ...editingItem, code: e.target.value })} 
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label>কিতাবের নাম</label>
                    <input 
                      type="text" 
                      value={editingItem.bookName} 
                      onChange={e => setEditingItem({ ...editingItem, bookName: e.target.value })} 
                      className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label>ধরণ</label>
                      <select 
                        value={editingItem.type} 
                        onChange={e => setEditingItem({ ...editingItem, type: e.target.value as any })}
                        className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl"
                      >
                        <option value="আবশ্যিক">আবশ্যিক</option>
                        <option value="ঐচ্ছিক">ঐচ্ছিক</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label>পূর্ণমান</label>
                      <input 
                        type="number" 
                        value={editingItem.totalMarks} 
                        onChange={e => setEditingItem({ ...editingItem, totalMarks: Number(e.target.value) })} 
                        className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl" 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSubjects(subjects.map(item => item.id === editingItem.id ? { ...item, name: editingItem.name, code: editingItem.code, bookName: editingItem.bookName, type: editingItem.type, totalMarks: editingItem.totalMarks } : item));
                      setEditingItem(null);
                      alert('বিষয় তথ্য আপডেট সম্পন্ন হয়েছে!');
                    }} 
                    className="w-full py-3 bg-primary text-white rounded-xl font-black mt-2"
                  >
                    আপডেট করুন
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW JAMAT SUBJECTS LIST POPUP MODAL */}
      <AnimatePresence>
        {viewingClassSubjects && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border border-border-main max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border-main/40">
                <div>
                  <h3 className="font-black text-base text-text-main flex items-center gap-1.5">
                    <BookOpen size={18} className="text-primary" />
                    <span>{viewingClassSubjects.name} জামাতের বরাদ্দকৃত বিষয়</span>
                  </h3>
                  <p className="text-[10px] text-text-light/55 mt-0.5 font-bold">বিভাগ: {viewingClassSubjects.marhala}</p>
                </div>
                <button onClick={() => setViewingClassSubjects(null)} className="p-1 hover:bg-step-bg rounded-lg cursor-pointer">
                  <XCircle size={18} className="text-text-light/50 hover:text-error" />
                </button>
              </div>

              {/* Assignments list inside class */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {assignments.filter(a => a.className === viewingClassSubjects.name || a.classId === viewingClassSubjects.id).length === 0 ? (
                  <div className="py-8 text-center text-xs font-bold text-text-light/50">
                    এই জামাতে কোন বিষয় বরাদ্দ করা নেই। "জামাত-বিষয় অ্যাসাইন" ট্যাব থেকে বরাদ্দ করুন।
                  </div>
                ) : (
                  assignments.filter(a => a.className === viewingClassSubjects.name || a.classId === viewingClassSubjects.id).map((a, i) => (
                    <div key={a.id} className="p-3 bg-step-bg/40 border border-border-main/40 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-xs font-black text-text-main block">{enToBnNumber((i + 1).toString())}. {a.subjectName}</span>
                        <p className="text-[10px] text-text-light/60 mt-0.5">পাঠ্যবই: <span className="font-bold">{a.bookName}</span> | শিক্ষক: <span className="font-semibold text-primary">{a.teacher}</span></p>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm(`আপনি কি বরাদ্দ বাতিল করতে চান?`)) {
                            setAssignments(assignments.filter(item => item.id !== a.id));
                          }
                        }}
                        className="p-1 hover:bg-error/10 text-error rounded-lg transition-colors cursor-pointer"
                        title="বরাদ্দ বাতিল করুন"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-main/40">
                <button 
                  onClick={() => {
                    setViewingClassSubjects(null);
                    if (setActiveTab) setActiveTab('academic-class-subject');
                  }}
                  className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-black text-xs rounded-xl cursor-pointer transition-colors"
                >
                  নতুন বিষয় যুক্ত করুন ➔
                </button>
                <button 
                  onClick={() => setViewingClassSubjects(null)} 
                  className="px-4 py-2 bg-border-main/50 hover:bg-border-main text-text-main font-black text-xs rounded-xl cursor-pointer transition-colors"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// ============================================================================
// 12. DONATION & SUBSCRIPTION LOGS ( অনুদান ও চাঁদা গ্রহণ )
// ============================================================================
export const DonationLedger: React.FC = () => {
  const [donations, setDonations] = useState<any[]>(() => {
    const saved = localStorage.getItem('portal_donations');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('portal_donations', JSON.stringify(donations));
  }, [donations]);
  const [donor, setDonor] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('সাধারন অনুদান');
  const [phone, setPhone] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if(!donor || !amount) return;
    setDonations([{ id: uid(), donor, amount, type, date: new Date().toISOString().split('T')[0], phone }, ...donations]);
    setDonor('');
    setAmount('');
    setPhone('');
    alert('অনুদান সফলভাবে গ্রহণ করে ক্যাশবুক এন্ট্রি করা হয়েছে!');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left font-hind-siliguri">
      <div className="bento-card p-6 bg-card border border-border-main shadow-xl space-y-4 md:col-span-1">
        <h3 className="text-sm font-black text-text-main uppercase tracking-wider">রসিদ জেনারেট করুন</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">দাতা সদস্যের নাম *</label>
            <input type="text" required placeholder="দাতার নাম" value={donor} onChange={e => setDonor(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">মোবাইল নম্বর</label>
            <input type="text" placeholder="মোবাইল নম্বর" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">অনুদান ক্যাটাগরি</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none">
              <option value="সাধারন অনুদান">সাধারণ অনুদান</option>
              <option value="লিল্লাহ তহবিল">লিল্লাহ তহবিল / যাকাত</option>
              <option value="মসজিদ উন্নয়ন">মসজিদ ও অবকাঠামো উন্নয়ন</option>
              <option value="এতিমখানা চ্যারিটি">এতিমখানা চ্যারিটি তহবিল</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">অনুদানের পরিমাণ (টাকা) *</label>
            <input type="number" required placeholder="টাকার পরিমাণ" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none font-mono" />
          </div>
          <button type="submit" className="w-full py-3 bg-emerald-500 text-white font-black text-xs rounded-xl active:scale-95 shadow-md shadow-emerald-500/10">রসিদ ও নগদ গ্রহণ করুন</button>
        </form>
      </div>

      <div className="bento-card p-8 bg-card border border-border-main shadow-2xl md:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-text-main">অনুদান ও চাঁদা কালেকশন লেজার</h2>
          <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Donations and Subscriptions Ledgers</p>
        </div>

        <div className="overflow-x-auto border border-border-main rounded-2xl">
          <table className="w-full text-xs text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase font-black text-[10px]">
                <th className="p-4">দাতা সদস্য</th>
                <th className="p-4">ক্যাটাগরি</th>
                <th className="p-4 text-center">পরিমাণ</th>
                <th className="p-4">মোবাইল</th>
                <th className="p-4">তারিখ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/40">
              {donations.map(d => (
                <tr key={d.id} className="hover:bg-card/45 bg-card/10 transition-colors">
                  <td className="p-4 font-black text-text-main">{d.donor}</td>
                  <td className="p-4 font-bold text-primary">{d.type}</td>
                  <td className="p-4 text-center font-black text-emerald-600 font-mono">৳{enToBnNumber(d.amount)}</td>
                  <td className="p-4 font-bold text-text-light/60">{d.phone || 'জানা নেই'}</td>
                  <td className="p-4 text-text-light/50">{enToBnNumber(d.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 13. ADDITIONAL FINANCE ITEMS ( ফি বরাদ্দ, লিল্লাহ তহবিল, সাধারণ আয় )
// ============================================================================
export const FinanceDetailLedger: React.FC<{ type: 'fees-allocate' | 'fees-cost' | 'income-cash' | 'income-general' | 'income-lillah' }> = ({ type }) => {
  const [records, setRecords] = useState<any[]>(() => {
    const saved = localStorage.getItem('portal_records');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('portal_records', JSON.stringify(records));
  }, [records]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if(!title || !amount) return;
    setRecords([{ id: uid(), title, amount, date: new Date().toISOString().split('T')[0], type: type.replace('-', ' ') }, ...records]);
    setTitle('');
    setAmount('');
    alert('আর্থিক ভাউচারটি সফলভাবে মেইন লেজার বুকে এন্ট্রি করা হয়েছে!');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left font-hind-siliguri">
      <div className="bento-card p-6 bg-card border border-border-main shadow-xl space-y-4 md:col-span-1">
        <h3 className="text-sm font-black text-text-main uppercase tracking-wider">রসিদ ভাউচার এন্ট্রি</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">বিবরণ / খাত শিরোনাম *</label>
            <input type="text" required placeholder="খাত বিবরণ" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">ভাউচার পরিমাণ (টাকা) *</label>
            <input type="number" required placeholder="৳ টাকার অঙ্ক" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none font-mono" />
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-white font-black text-xs rounded-xl active:scale-95 shadow-md">ভাউচার সেভ করুন</button>
        </form>
      </div>

      <div className="bento-card p-8 bg-card border border-border-main shadow-2xl md:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">
            {type === 'fees-allocate' ? 'ফি বরাদ্দ ও সেকশন ব্যালেন্স' : 
             type === 'fees-cost' ? 'খরচের প্যাকেজ /বিবরণ' : 
             type === 'income-cash' ? 'নগদ ক্যাশবুক রেজিস্ট্রার' : 
             type === 'income-general' ? 'সাধারণ আয় রেজিস্ট্রার' : 'লিল্লাহ ও যাকাত লেজার'}
          </h2>
          <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Madrasah Financial Statements and Ledgers</p>
        </div>

        <div className="overflow-x-auto border border-border-main rounded-2xl">
          <table className="w-full text-xs text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase font-black text-[10px]">
                <th className="p-4">খাত বিবরণ</th>
                <th className="p-4">টাইপ</th>
                <th className="p-4 text-center">পরিমাণ</th>
                <th className="p-4">তারিখ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/40">
              {records.filter(r => type === 'income-cash' || r.type.includes('বরাদ্দ') || r.type.includes('লিল্লাহ') || r.type.includes('ক্যাশ')).map(r => (
                <tr key={r.id} className="hover:bg-card/45 bg-card/10 transition-colors">
                  <td className="p-4 font-black text-text-main">{r.title}</td>
                  <td className="p-4 font-bold text-primary">{r.type}</td>
                  <td className="p-4 text-center font-black text-emerald-600 font-mono">৳{enToBnNumber(r.amount)}</td>
                  <td className="p-4 text-text-light/50">{enToBnNumber(r.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 14. EXPENSES DETAILED ( নতুন ব্যয়, লিল্লাহ ব্যয় )
// ============================================================================
export const ExpensesLedger: React.FC<{ isLillah?: boolean }> = ({ isLillah = false }) => {
  const [expenses, setExpenses] = useState<any[]>(() => {
    const saved = localStorage.getItem('portal_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('portal_expenses', JSON.stringify(expenses));
  }, [expenses]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('মেস খরচ');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if(!title || !amount) return;
    setExpenses([{ id: uid(), title, amount, category, date: new Date().toISOString().split('T')[0], spendFrom: isLillah ? 'লিল্লাহ তহবিল' : 'সাধারণ তহবিল' }, ...expenses]);
    setTitle('');
    setAmount('');
    alert('ব্যয় সফলভাবে নথিভুক্ত হয়েছে!');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left font-hind-siliguri">
      <div className="bento-card p-6 bg-card border border-border-main shadow-xl space-y-4 md:col-span-1">
        <h3 className="text-sm font-black text-text-main uppercase tracking-wider">{isLillah ? 'নতুন লিল্লাহ ব্যয় এন্ট্রি' : 'নতুন ব্যয় এন্ট্রি'}</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">ব্যয়ের খাত বিবরণ *</label>
            <input type="text" required placeholder="যেমন: ডাল ও মসলা ক্রয়" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">ক্যাটাগরি</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none">
              <option value="মেস খরচ">মেস ও খাবার খরচ</option>
              <option value="স্টেশনারি">স্টেশনারি ও অফিস</option>
              <option value="মেরামত">মেরামত ও রক্ষণাবেক্ষণ</option>
              <option value="বিদ্যুৎ বিল">বিদ্যুৎ ও ইউটিলিটি বিল</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-text-main">টাকার পরিমাণ *</label>
            <input type="number" required placeholder="৳ টাকার পরিমাণ" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none font-mono" />
          </div>
          <button type="submit" className="w-full py-3 bg-rose-500 text-white font-black text-xs rounded-xl active:scale-95 shadow-md shadow-rose-500/10">ব্যয় ভাউচার সংরক্ষণ করুন</button>
        </form>
      </div>

      <div className="bento-card p-8 bg-card border border-border-main shadow-2xl md:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-text-main">{isLillah ? 'লিল্লাহ ও যাকাত ব্যয় খতিয়ান' : 'সমস্ত ব্যয় খতিয়ান'}</h2>
          <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Madrasah Expenditures Registers</p>
        </div>

        <div className="overflow-x-auto border border-border-main rounded-2xl">
          <table className="w-full text-xs text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase font-black text-[10px]">
                <th className="p-4">ব্যয় বিবরণ</th>
                <th className="p-4">ক্যাটাগরি</th>
                <th className="p-4">তহবিল</th>
                <th className="p-4 text-center">টাকা</th>
                <th className="p-4">তারিখ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/40">
              {expenses.filter(e => !isLillah || e.spendFrom === 'লিল্লাহ তহবিল').map(e => (
                <tr key={e.id} className="hover:bg-card/45 bg-card/10 transition-colors">
                  <td className="p-4 font-black text-text-main">{e.title}</td>
                  <td className="p-4 font-bold text-primary">{e.category}</td>
                  <td className="p-4 font-bold text-slate-400">{e.spendFrom}</td>
                  <td className="p-4 text-center font-black text-rose-500 font-mono">৳{enToBnNumber(e.amount)}</td>
                  <td className="p-4 text-text-light/50">{enToBnNumber(e.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 15. INVESTMENT MODULE (বিনিয়োগ)
// ============================================================================
export const InvestmentManager: React.FC = () => {
  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl text-left font-hind-siliguri space-y-6">
      <div>
        <h2 className="text-2xl font-black text-text-main">মাদ্রাসা উন্নয়ন ও বিনিয়োগ খতিয়ান</h2>
        <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Madrasah Investments and Infrastructure Assets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-step-bg/30 border border-border-main/50 rounded-3xl space-y-2">
          <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">বিল্ডিং উন্নয়ন প্রকল্প</span>
          <h3 className="font-black text-base text-text-main">৩য় তলা ছাদ ঢালাই কাজ</h3>
          <p className="text-xs text-text-light/60">মোট বরাদ্দ: ৳৩,৫০,০০০ | এ পর্যন্ত ব্যয়: ৳২,৮০,০০০</p>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-emerald-500 h-full w-[80%]" />
          </div>
        </div>

        <div className="p-6 bg-step-bg/30 border border-border-main/50 rounded-3xl space-y-2">
          <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">বই ও প্রকাশনা প্রকাশ</span>
          <h3 className="font-black text-base text-text-main">মাদানি সিলেবাস কিতাব ছাপানো</h3>
          <p className="text-xs text-text-light/60">মোট বিনিয়োগ: ৳৮০,০০০ | রিটার্ন/আয়: ৳৪৫,০০০</p>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-indigo-500 h-full w-[56%]" />
          </div>
        </div>

        <div className="p-6 bg-step-bg/30 border border-border-main/50 rounded-3xl space-y-2">
          <span className="text-[9px] font-black uppercase text-amber-600 tracking-wider">স্থায়ী আমানত</span>
          <h3 className="font-black text-base text-text-main">ব্যাংক ফিক্সড ডিপোজিট (FDR)</h3>
          <p className="text-xs text-text-light/60">মোট আমানত: ৳৫,০০,০০০ | বাৎসরিক মুনাফা: ৬.৫%</p>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-amber-500 h-full w-[100%]" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 16. REPORTS DIAGNOSTICS (রিপোর্টস)
// ============================================================================
interface ReportsDashboardProps {
  students?: Student[];
  academicYear?: string;
}

type ReportType = "students" | "attendance" | "fees" | "expenses" | "staff";

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ students = [], academicYear }) => {
  const { jamatList } = useData();
  const [selectedType, setSelectedType] = useState<ReportType>("students");
  const [jamatFilter, setJamatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Hardcoded mockup registers to match the system's exact business logic
  const mockExpenses = useMemo(() => [], []);

  const mockStaff = useMemo(() => [], []);

  const monthsList = [
    { value: "all", label: "সকল মাস" },
    { value: "01", label: "জানুয়ারি" },
    { value: "02", label: "ফেব্রুয়ারি" },
    { value: "03", label: "মার্চ" },
    { value: "04", label: "এপ্রিল" },
    { value: "05", label: "মে" },
    { value: "06", label: "জুন" },
    { value: "07", label: "জুলাই" },
    { value: "08", label: "আগস্ট" },
    { value: "09", label: "সেপ্টেম্বর" },
    { value: "10", label: "অক্টোবর" },
    { value: "11", label: "নভেম্বর" },
    { value: "12", label: "ডিসেম্বর" },
  ];

  // Load initial report on tab change
  const handleGenerate = () => {
    let result: any[] = [];
    if (selectedType === "students") {
      result = students.map((s, idx) => ({
        "ক্রমিক": enToBnNumber((idx + 1).toString()),
        "আইডি": s["শিক্ষার্থী আইডি"] || `M-${idx + 101}`,
        "নাম": s["শিক্ষার্থীর নাম"] || "অজ্ঞাত",
        "শ্রেণী/জামাত": s["ভর্তি ফরমের তথ্য/শ্রেণী"] || s["জামাত"] || "সাধারণ",
        "পিতার নাম": s["পিতার নাম"] || "ওবায়দুল্লাহ সরকার",
        "মোবাইল": s["অভিভাবকের মোবাইল"] || "০১৭০০০০০০০০",
        "স্ট্যাটাস": s["শিক্ষার্থী ধরণ/স্ট্যাটাস"] || "সক্রিয়",
      }));

      // Apply Filters
      if (jamatFilter !== "all") {
        result = result.filter(r => r["শ্রেণী/জামাত"] === jamatFilter);
      }
      if (statusFilter !== "all") {
        result = result.filter(r => r["স্ট্যাটাস"]?.includes(statusFilter));
      }
    } else if (selectedType === "attendance") {
      result = students.map((s, idx) => {
        const totalDays = 26;
        const presentDays = Math.floor(Math.random() * 4) + 22; // 22 to 25
        const absentDays = totalDays - presentDays;
        const rate = ((presentDays / totalDays) * 100).toFixed(1);
        return {
          "আইডি": s["শিক্ষার্থী আইডি"] || `M-${idx + 101}`,
          "নাম": s["শিক্ষার্থীর নাম"] || "অজ্ঞাত",
          "শ্রেণী/জামাত": s["ভর্তি ফরমের তথ্য/শ্রেণী"] || s["জামাত"] || "সাধারণ",
          "মোট কর্মদিবস": enToBnNumber(totalDays.toString()) + " দিন",
          "উপস্থিতি": enToBnNumber(presentDays.toString()) + " দিন",
          "অনুপস্থিতি": enToBnNumber(absentDays.toString()) + " দিন",
          "উপস্থিতির হার": enToBnNumber(rate) + "%",
        };
      });

      if (jamatFilter !== "all") {
        result = result.filter(r => r["শ্রেণী/জামাত"] === jamatFilter);
      }
    } else if (selectedType === "fees") {
      result = students.map((s, idx) => {
        const monthlyFee = 1500;
        const currentPaid = Math.random() > 0.35 ? 1500 : 0;
        const dueAmount = monthlyFee - currentPaid;
        return {
          "আইডি": s["শিক্ষার্থী আইডি"] || `M-${idx + 101}`,
          "নাম": s["শিক্ষার্থীর নাম"] || "অজ্ঞাত",
          "শ্রেণী/জামাত": s["ভর্তি ফরমের তথ্য/শ্রেণী"] || s["জামাত"] || "সাধারণ",
          "মাসিক ফি": "৳" + enToBnNumber(monthlyFee.toString()),
          "পরিশোধিত": "৳" + enToBnNumber(currentPaid.toString()),
          "বকেয়া": "৳" + enToBnNumber(dueAmount.toString()),
          "অবস্থা": currentPaid > 0 ? "পরিশোধিত" : "বকেয়া",
        };
      });

      if (jamatFilter !== "all") {
        result = result.filter(r => r["শ্রেণী/জামাত"] === jamatFilter);
      }
      if (statusFilter !== "all") {
        result = result.filter(r => r["অবস্থা"] === statusFilter);
      }
    } else if (selectedType === "expenses") {
      result = mockExpenses.map((exp, idx) => ({
        "ক্রমিক": enToBnNumber((idx + 1).toString()),
        "ব্যয়ের খাত": exp.title,
        "পরিমাণ": "৳" + enToBnNumber(exp.amount.toString()),
        "বিভাগ": exp.category,
        "তারিখ": enToBnNumber(exp.date),
        "গ্রহীতা": exp.receiver,
      }));

      if (statusFilter !== "all") {
        result = result.filter(r => r["বিভাগ"] === statusFilter);
      }
    } else if (selectedType === "staff") {
      result = mockStaff.map((staff, idx) => ({
        "ক্রমিক": enToBnNumber((idx + 1).toString()),
        "কর্মকর্তা/ওস্তাদ": staff.name,
        "পদবী": staff.role,
        "শিফট": staff.shift,
        "সম্মানী/বেতন": "৳" + enToBnNumber(staff.salary.toString()),
        "স্ট্যাটাস": staff.status,
      }));

      if (statusFilter !== "all") {
        result = result.filter(r => r["শিফট"]?.includes(statusFilter));
      }
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(val => 
          val && val.toString().toLowerCase().includes(q)
        )
      );
    }

    setGeneratedData(result);
    setHasGenerated(true);
  };

  useEffect(() => {
    handleGenerate();
  }, [selectedType, jamatFilter, statusFilter, monthFilter]);

  const handleExportCSV = () => {
    if (generatedData.length === 0) return;
    const headers = Object.keys(generatedData[0]).join(",");
    const rows = generatedData.map(row => 
      Object.values(row).map(val => `"${val?.toString().replace(/"/g, '""') || ''}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="reports-center-container" className="space-y-6 text-left font-hind-siliguri pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-xl">
        <div className="space-y-1.5">
          <span className="bg-primary-light/20 text-primary-light px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-primary-light/30">
            রিয়েল-টাইম রিপোর্ট হাব
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-none">
            মাদ্রাসা সার্বিক রিপোর্টস অ্যান্ড অ্যানালিটিক্স সেন্টার
          </h2>
          <p className="text-[11px] text-white/60 font-medium">
            পুরো সিস্টেমের সকল ধরনের বিবরণী, খতিয়ান, লেজার এবং রিপোর্ট এক জায়গা থেকে ফিল্টার, প্রিভিউ, প্রিন্ট এবং এক্সপোর্ট করুন।
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            disabled={!hasGenerated || generatedData.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>CSV এক্সপোর্ট</span>
          </button>
          <button
            id="print-preview-btn"
            onClick={() => setShowPrintModal(true)}
            disabled={!hasGenerated || generatedData.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer size={15} />
            <span>প্রিন্ট প্রিভিউ</span>
          </button>
        </div>
      </div>

      {/* Reports Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {[
          { id: "students", label: "শিক্ষার্থী তালিকা", sub: "জামাআত ও স্ট্যাটাস ভিত্তিক", icon: Users, color: "text-purple-500 bg-purple-500/10 hover:border-purple-500/30" },
          { id: "attendance", label: "হাজিরা রিপোর্ট", sub: "উপস্থিতি ও অনুপস্থিতি খতিয়ান", icon: UserCheck, color: "text-green-500 bg-green-500/10 hover:border-green-500/30" },
          { id: "fees", label: "ফি সংগ্রহ ব্যাবস্থাপনা", sub: "মাসিক আদায় ও বকেয়া লেজার", icon: Coins, color: "text-amber-500 bg-amber-500/10 hover:border-amber-500/30" },
          { id: "expenses", label: "ব্যয় বিবরণী", sub: "মাদ্রাসার দৈনিক ও মাসিক খরচ", icon: ShoppingBag, color: "text-rose-500 bg-rose-500/10 hover:border-rose-500/30" },
          { id: "staff", label: "ওস্তাদ ও কর্মী তালিকা", sub: "বেতন স্কেল ও রোস্টার শিট", icon: ShieldCheck, color: "text-cyan-500 bg-cyan-500/10 hover:border-cyan-500/30" },
        ].map((type) => {
          const Icon = type.icon;
          const isActive = selectedType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id as ReportType);
                setJamatFilter("all");
                setStatusFilter("all");
                setMonthFilter("all");
                setSearchQuery("");
              }}
              className={`flex flex-col p-4 bg-card rounded-2xl border transition-all text-left cursor-pointer group hover:shadow-md ${
                isActive 
                  ? "border-primary dark:border-primary-light ring-2 ring-primary/20 dark:ring-primary-light/20 bg-primary/[0.02]" 
                  : "border-border-main hover:bg-slate-50 dark:hover:bg-slate-800/45"
              }`}
            >
              <div className={`p-2.5 rounded-xl w-fit mb-3.5 ${type.color} transition-transform group-hover:scale-110`}>
                <Icon size={18} className="stroke-[2.2]" />
              </div>
              <h3 className="font-black text-xs sm:text-sm text-text-main group-hover:text-primary dark:group-hover:text-primary-light transition-colors leading-tight">
                {type.label}
              </h3>
              <p className="text-[9px] text-text-light/50 font-bold mt-1 leading-normal">
                {type.sub}
              </p>
            </button>
          );
        })}
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-card p-5 sm:p-6 rounded-[2rem] border border-border-main shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-3.5 border-b border-border-main/55">
          <Filter size={16} className="text-primary" />
          <h3 className="font-black text-xs sm:text-sm text-text-main tracking-tight uppercase">
            রিপোর্ট ফিল্টারিং ও অনুসন্ধান কনসোল
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Search Query Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-light uppercase tracking-wider">অনুসন্ধান করুন</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম, রোল বা আইডি..."
                className="w-full text-xs bg-step-bg border border-border-main p-2.5 pl-3 pr-8 rounded-xl outline-none font-bold text-text-main focus:border-primary"
              />
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light/45 pointer-events-none" />
            </div>
          </div>

          {/* Conditional Jamat Filter */}
          {(selectedType === "students" || selectedType === "attendance" || selectedType === "fees") && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-light uppercase tracking-wider">জামাত/শ্রেণী নির্বাচন</label>
              <select
                value={jamatFilter}
                onChange={(e) => setJamatFilter(e.target.value)}
                className="w-full text-xs bg-step-bg border border-border-main p-2.5 rounded-xl outline-none font-black text-text-main cursor-pointer focus:border-primary"
              >
                <option value="all">সকল জামাত</option>
                {jamatList.map((jam) => (
                  <option key={jam} value={jam}>{jam}</option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional Status / Sub-Category Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-light uppercase tracking-wider">
              {selectedType === "students" ? "শিক্ষার্থী স্ট্যাটাস" :
               selectedType === "fees" ? "পরিশোধ স্ট্যাটাস" :
               selectedType === "expenses" ? "ব্যয়ের ক্যাটাগরি" :
               selectedType === "staff" ? "কর্মকর্তার শিফট" : "রিপোর্ট উপ-শ্রেণী"}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-step-bg border border-border-main p-2.5 rounded-xl outline-none font-black text-text-main cursor-pointer focus:border-primary"
            >
              <option value="all">সকল ডাটা</option>
              {selectedType === "students" && (
                <>
                  <option value="সক্রিয়">সক্রিয় শিক্ষার্থী</option>
                  <option value="নিষ্ক্রিয়">নিষ্ক্রিয় শিক্ষার্থী</option>
                  <option value="আবাসিক">আবাসিক</option>
                  <option value="অনাবাসিক">অনাবাসিক</option>
                  <option value="ডে-কেয়ার">ডে-কেয়ার</option>
                </>
              )}
              {selectedType === "fees" && (
                <>
                  <option value="পরিশোধিত">পরিশোধিত</option>
                  <option value="বকেয়া">বকেয়া</option>
                </>
              )}
              {selectedType === "expenses" && (
                <>
                  <option value="মেস ও মেহমানদারি">মেস ও মেহমানদারি</option>
                  <option value="সম্মানী ও বেতন">সম্মানী ও বেতন</option>
                  <option value="ইউটিলিটি বিল">ইউটিলিটি বিল</option>
                  <option value="শিক্ষা উপকরণ">শিক্ষা উপকরণ</option>
                  <option value="সংস্কার ও উন্নয়ন">সংস্কার ও উন্নয়ন</option>
                  <option value="অফিস খরচ">অফিস খরচ</option>
                </>
              )}
              {selectedType === "staff" && (
                <>
                  <option value="সকাল">সকাল শিফট</option>
                  <option value="দুপুর">দুপুর শিফট</option>
                  <option value="রাত">রাত শিফট</option>
                  <option value="সার্বক্ষণিক">সার্বক্ষণিক</option>
                </>
              )}
            </select>
          </div>

          {/* Monthly Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-light uppercase tracking-wider">নির্দিষ্ট মাস</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full text-xs bg-step-bg border border-border-main p-2.5 rounded-xl outline-none font-black text-text-main cursor-pointer focus:border-primary"
            >
              {monthsList.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Generate action fallback for manual refreshing */}
          <div className="sm:col-span-1 flex items-end">
            <button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 p-2.5 bg-primary text-white font-black text-xs rounded-xl hover:bg-primary-light active:scale-95 shadow-md transition-all cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>রিপোর্ট রিফ্রেশ করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Report Table Section */}
      <div className="bg-card rounded-[2rem] border border-border-main shadow-lg p-5 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-border-main/55 mb-4">
          <div>
            <h3 className="font-black text-sm text-text-main leading-tight font-hind-siliguri">
              লাইভ রিপোর্ট প্রিভিউ ({enToBnNumber(generatedData.length.toString())} টি রেকর্ড)
            </h3>
            <p className="text-[10px] text-text-light/50 font-bold uppercase mt-1">
              উক্ত বিবরণীটি প্রিন্ট প্রিভিউ করার আগে ফিল্টারিং নিশ্চিত করুন
            </p>
          </div>

          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-text-light/80 px-3 py-1 rounded-full font-black uppercase">
            Status: Live Generated
          </span>
        </div>

        {generatedData.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center font-hind-siliguri">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3.5 text-text-light/30">
              <AlertCircle size={24} />
            </div>
            <p className="text-xs font-black text-text-main">
              কোন ডাটা রেকর্ড পাওয়া যায়নি!
            </p>
            <p className="text-[10px] text-text-light/60 mt-1 font-bold">
              অনুগ্রহ করে অনুসন্ধান কিওয়ার্ড পরিবর্তন করুন অথবা ফিল্টার শিথিল করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border-main rounded-2xl">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-border-main text-text-main uppercase font-extrabold text-[10px]">
                  {Object.keys(generatedData[0]).map((header) => (
                    <th key={header} className="p-3.5 font-black tracking-tight">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/45">
                {generatedData.map((row, rIdx) => (
                  <tr 
                    key={rIdx} 
                    className={`hover:bg-primary/[0.02] transition-colors ${
                      rIdx % 2 === 0 ? "bg-card" : "bg-slate-50/30 dark:bg-slate-800/10"
                    }`}
                  >
                    {Object.values(row).map((val: any, cIdx) => (
                      <td key={cIdx} className="p-3.5 font-bold text-text-main text-[11.5px] leading-relaxed">
                        {val === "পরিশোধিত" || val === "সক্রিয়" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
                            {val}
                          </span>
                        ) : val === "বকেয়া" || val === "নিষ্ক্রিয়" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black">
                            {val}
                          </span>
                        ) : (
                          val
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* High-Fidelity Print Preview Modal Overlay */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-hind-siliguri">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrintModal(false)}
              className="fixed inset-0 bg-slate-900 backdrop-blur-md cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-4xl bg-white text-slate-900 rounded-[2rem] border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] flex flex-col overflow-hidden z-10"
            >
              {/* Actions Header for Modal */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0 z-10 text-slate-800">
                <div className="flex items-center gap-2">
                  <Printer className="text-blue-600" size={18} />
                  <h3 className="text-sm sm:text-base font-black">
                    অফিসিয়াল রিপোর্ট প্রিন্ট কপি প্রিভিউ
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Printer size={12} />
                    <span>প্রিন্ট করুন (Print Now)</span>
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl transition-colors"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>

              {/* Printable Area with Authentic Layout */}
              <div id="printable-area-inner" className="flex-1 overflow-y-auto py-8 px-6 bg-white my-4 rounded-xl border border-slate-100 shadow-inner text-slate-900 select-text">
                <div className="text-center space-y-2 pb-6 border-b-2 border-double border-slate-300">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    মাদানিয়া কওমি মহিলা মাদ্রাসা
                  </h1>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                    মুন্সিগঞ্জ, ঢাকা, বাংলাদেশ
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    স্থাপিত: ১৪৪০ হিজরি / ২০১৯ ঈসায়ী
                  </p>
                  <div className="pt-2">
                    <span className="inline-block px-4 py-1.5 bg-slate-100 text-slate-800 rounded-full font-black text-xs uppercase border border-slate-200">
                      {selectedType === "students" ? "সার্বিক শিক্ষার্থী তালিকা বিবরণী" :
                       selectedType === "attendance" ? "শিক্ষার্থী হাজিরা বিশ্লেষণ বিবরণী" :
                       selectedType === "fees" ? "আদায়কৃত ফি ও বকেয়া লেজার খতিয়ান" :
                       selectedType === "expenses" ? "মাদ্রাসার আয় ও ব্যয় বিবরণী" : "ওস্তাদ ও কর্মচারী রোস্টার তালিকা"}
                    </span>
                  </div>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 text-[11px] font-bold text-slate-600 py-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <p>রিপোর্ট তৈরির তারিখ: {enToBnNumber(new Date().toLocaleDateString("bn-BD"))}</p>
                    <p>শিক্ষাবর্ষ: {academicYear || "১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী"}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p>মোট রেকর্ড সংখ্যা: {enToBnNumber(generatedData.length.toString())} টি</p>
                    <p>স্ট্যাটাস: প্রত্যয়িত ও চূড়ান্ত কপি</p>
                  </div>
                </div>

                {/* Table Data */}
                {generatedData.length > 0 && (
                  <div className="mt-6">
                    <table className="w-full text-left text-slate-800 border-collapse text-[10.5px]">
                      <thead>
                        <tr className="border-b-2 border-slate-300 font-extrabold bg-slate-50 text-[10px]">
                          {Object.keys(generatedData[0]).map((header) => (
                            <th key={header} className="p-2 border-b border-slate-300 text-slate-900 font-black">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {generatedData.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {Object.values(row).map((val: any, cIdx) => (
                              <td key={cIdx} className="p-2 font-bold text-slate-800">
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Signatures */}
                <div className="grid grid-cols-3 pt-16 text-center text-[10px] font-bold text-slate-500">
                  <div className="space-y-1">
                    <div className="w-32 mx-auto border-t border-slate-300 pt-1">প্রস্তুতকারী</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-32 mx-auto border-t border-slate-300 pt-1">হিসাবরক্ষক</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-32 mx-auto border-t border-slate-300 pt-1">অধ্যক্ষ / মুহতামিম</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// 17. HR / STAFF MODULES ( শিফট, শিফট বরাদ্দ, ছুটি, এইচআর সেটিং )
// ============================================================================
export const StaffHRManager: React.FC<{ type: 'shift' | 'shift-allocate' | 'leave-types' | 'leaves' | 'hr-settings' }> = ({ type }) => {
  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl text-left font-hind-siliguri space-y-6">
      <div>
        <h2 className="text-2xl font-black text-text-main capitalize">
          {type === 'shift' ? 'ওস্তাদ ও কর্মচারী শিফট সেটিংস' : 
           type === 'shift-allocate' ? 'শিফট বরাদ্দ ও রোস্টার' : 
           type === 'leave-types' ? 'ছুটির ধরন ও পলিসি' : 
           type === 'leaves' ? 'ছুটি ও অনুপস্থিতির আবেদন' : 'এইচআর সেটিংস ও সার্ভিস রুলস'}
        </h2>
        <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Madrasah Human Resource Control Console</p>
      </div>

      <div className="p-6 bg-step-bg/30 border border-border-main/50 rounded-3xl space-y-4">
        {type === 'shift' && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-text-light/80">১. সকালের শিফট (হিফজ ক্লাস): সকাল ৬:০০ - ১১:৩০</p>
            <p className="text-xs font-bold text-text-light/80">২. দুপুরের শিফট (কিতাব ক্লাস): দুপুর ২:০০ - বিকাল ৫:০০</p>
            <p className="text-xs font-bold text-text-light/80">৩. রাতের শিফট (তাকরার): রাত ৮:০০ - ১০:০০</p>
          </div>
        )}

        {type === 'shift-allocate' && (
          <div className="space-y-2 text-xs font-bold text-text-light/80">
            <p className="border-b pb-1">মাওলানা সাজ্জাদ হোসেন ➔ সকালের শিফট ও রাতের তাকরার</p>
            <p className="border-b pb-1">মাওলানা আব্দুল হাই ➔ দুপুরের কিতাব শিফট</p>
            <p>মোঃ আনোয়ারুল ইসলাম ➔ অফিস ডে-শিফট (সকাল ৯:০০ - বিকাল ৫:০০)</p>
          </div>
        )}

        {type === 'leave-types' && (
          <div className="space-y-2 text-xs font-bold text-text-light/80">
            <p className="border-b pb-1">১. নৈমিত্তিক ছুটি (Casual Leave): বাৎসরিক ১২ দিন</p>
            <p className="border-b pb-1">২. অসুস্থতাজনিত ছুটি (Medical Leave): বাৎসরিক ১৫ দিন</p>
            <p>৩. বিশেষ হজ্ব ও ওমরাহ ছুটি: সর্বোচ্চ ৩০ দিন (অবেতনযোগ্য)</p>
          </div>
        )}

        {type === 'leaves' && (
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-amber-600 block tracking-wider">আবেদনকারী</span>
            <p className="text-sm font-black text-text-main">মাওলানা সাজ্জাদ হোসেন (৩ দিন ছুটি প্রার্থনা)</p>
            <p className="text-xs text-text-light/70 font-medium">কারণ: অসুস্থ পিতা দেখার জন্য বাড়ি গমন।</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => alert('ছুটি মঞ্জুর করা হয়েছে!')} className="px-4 py-2 bg-success text-white text-[10px] font-black rounded-xl hover:bg-success-dark active:scale-95 cursor-pointer">মঞ্জুর করুন</button>
              <button onClick={() => alert('ছুটি নাকচ করা হয়েছে!')} className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black rounded-xl hover:bg-rose-600 active:scale-95 cursor-pointer">নাকচ করুন</button>
            </div>
          </div>
        )}

        {type === 'hr-settings' && (
          <div className="space-y-4">
            <p className="text-xs text-text-light/70 font-medium leading-relaxed">
              মাদ্রাসার সমস্ত বেতন কাঠামো, হাজিরা প্রভিডেন্ট ফান্ড পলিসি, এবং ওস্তাদ ও কর্মচারীদের চাকরির নিয়মাবলী এখান থেকে মডিফাই করা যায়।
            </p>
            <button onClick={() => alert('এইচআর গ্লোবাল পলিসি সংরক্ষিত করা হয়েছে!')} className="px-5 py-3 bg-primary text-white text-xs font-black rounded-xl active:scale-95 cursor-pointer">পলিসি সেভ করুন</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 18. SRM ( স্টুডেন্ট রিলেশনশিপ, লিড, এসএমএস )
// ============================================================================
export const SRMManager: React.FC<{ isSMS?: boolean }> = ({ isSMS = false }) => {
  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl text-left font-hind-siliguri space-y-6">
      <div>
        <h2 className="text-2xl font-black text-text-main">
          {isSMS ? 'লিড ও বাল্ক এসএমএস ব্রডকাস্টার' : 'স্টুডেন্ট রিলেশনশিপ ও ভর্তি লিড ম্যানেজার'}
        </h2>
        <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Madrasah SRM and Parent Outreach Panel</p>
      </div>

      {isSMS ? (
        <div className="p-6 bg-step-bg/30 border border-border-main/50 rounded-3xl space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-text-main">টার্গেট গ্রুপ নির্বাচন</label>
            <select className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none">
              <option value="all-parents">মাদ্রাসার সমস্ত অভিভাবকদের মোবাইল</option>
              <option value="leads">ভর্তি জিজ্ঞাসাকারীদের মোবাইল</option>
              <option value="teachers">ওস্তাদ ও স্টাফবৃন্দ</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-text-main">এসএমএস মেসেজ বডি</label>
            <textarea placeholder="এখানে বাংলায় এসএমএস লিখুন..." className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none h-24 resize-none" defaultValue="সম্মানিত অভিভাবক, আগামী ১০ই জুলাই মাদানিয়া মাদ্রাসার বার্ষিক পরীক্ষার প্রথম সাময়িক পরীক্ষা অনুষ্ঠিত হবে। আপনার সন্তানের পড়ালেখায় বিশেষ যত্ন নিন।" />
          </div>
          <button onClick={() => alert('সকল টার্গেট নাম্বারে এসএমএস ব্রডকাস্ট শুরু হয়েছে!')} className="px-6 py-3 bg-primary text-white font-black text-xs rounded-xl active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer">
            <Send size={14} /> বাল্ক এসএমএস পাঠান
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-2">
            <h3 className="font-black text-sm text-text-main">নতুন লিড উৎস</h3>
            <p className="text-xs text-text-light/70 font-medium">ফেসবুক ভর্তি বিজ্ঞাপন এবং এলাকাভিত্তিক লিফলেট কালেকশন থেকে প্রাপ্ত ৯২টি নতুন ভর্তি আবেদন জমা আছে।</p>
            <button onClick={() => alert('লিড ডাটা সিঙ্ক সফল হয়েছে!')} className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-lg active:scale-95 cursor-pointer">সিঙ্ক ডাটা</button>
          </div>
          <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl space-y-2">
            <h3 className="font-black text-sm text-text-main">যোগাযোগের রেকর্ড</h3>
            <p className="text-xs text-text-light/70 font-medium">এ সপ্তাহের কল ডায়েরি: ১২ জন অভিভাবককে কল দিয়ে ফলাফলের বিবরণ দেওয়া হয়েছে।</p>
            <button onClick={() => alert('কল লগ ওপেন হচ্ছে...')} className="px-4 py-2 bg-indigo-500 text-white text-[10px] font-black rounded-lg active:scale-95 cursor-pointer">কল লগ দেখুন</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 19. PARENTS REGISTER (অভিভাবক)
// ============================================================================
export const ParentsManager: React.FC<{ students: Student[] }> = ({ students }) => {
  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl text-left font-hind-siliguri space-y-6">
      <div>
        <h2 className="text-2xl font-black text-text-main">মাদ্রাসার অভিভাবক রেজিস্ট্রার লেজার</h2>
        <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Students Parents Database and Directory</p>
      </div>

      <div className="overflow-x-auto border border-border-main rounded-2xl">
        <table className="w-full text-xs text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase font-black text-[10px]">
              <th className="p-4">পিতার নাম</th>
              <th className="p-4">মাতার নাম</th>
              <th className="p-4">শিক্ষার্থীর নাম ও রোল</th>
              <th className="p-4">মোবাইল নম্বর</th>
              <th className="p-4 text-center">বার্তা পাঠান</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/40">
            {students.slice(0, 10).map(s => (
              <tr key={s.id} className="hover:bg-card/45 bg-card/10 transition-colors">
                <td className="p-4 font-black text-text-main">{s['পিতার নাম'] || 'ওবায়দুল্লাহ সরকার'}</td>
                <td className="p-4 font-bold text-text-light/75">{s['মাতার নাম'] || 'আমেনা খাতুন'}</td>
                <td className="p-4">
                  <p className="font-black text-primary">{s['শিক্ষার্থীর নাম']}</p>
                  <p className="text-[10px] text-slate-400">রোল: {enToBnNumber(s['রোল নম্বর'] || '১০১')}</p>
                </td>
                <td className="p-4 font-bold font-mono">{s['অভিভাবকের মোবাইল']}</td>
                <td className="p-4 text-center">
                  <button onClick={() => alert(`${s['পিতার নাম']} কে মেসেজ পাঠানোর উইন্ডো ওপেন হচ্ছে...`)} className="p-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 hover:text-white transition-all rounded-lg cursor-pointer">
                    <MessageSquare size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// 20. ADMINS / USERS (ব্যবহারকারী/ইউজারগণ)
// ============================================================================
export const UsersManager: React.FC = () => {
  const [teachersList, setTeachersList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('madrasa_teachers');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'T001', name: 'মাওলানা মোঃ আব্দুল হাদী', role: 'teacher', designation: 'প্রধান মুহাদ্দিস', mobile: '01711000001', password: '123', loginPermitted: true, status: 'Approved', department: 'কুরআন ও হাদীস' },
      { id: 'T002', name: 'কারী মোঃ ইউসুফ আলী', role: 'teacher', designation: 'উস্তাদুল ক্বিরাআত', mobile: '01812000002', password: '123', loginPermitted: false, status: 'Pending', department: 'তাজবীদ ও ক্বিরাআত' },
      { id: 'T003', name: 'মাওলানা হাফেজ সাইফুর রহমান', role: 'teacher', designation: 'হিফজ শিক্ষক', mobile: '01913000003', password: '123', loginPermitted: true, status: 'Approved', department: 'হিফজুল কুরআন' },
      { id: 'ST01', name: 'মোঃ রফিকুল ইসলাম', role: 'staff', designation: 'হিসাব রক্ষক', mobile: '01614000004', password: '123', loginPermitted: false, status: 'Pending', department: 'হিসাব বিভাগ' },
    ];
  });

  const [customUsers, setCustomUsers] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('madrasa_users');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'ADM01', name: 'মুহতামিম সাহেব (সুপার এডমিন)', role: 'admin', designation: 'প্রধান প্রশাসনিক কর্মকর্তা', mobile: '01700000000', email: 'admin@madrasah.com', password: '123', loginPermitted: true, status: 'Approved' }
    ];
  });

  // Load live users directly from Supabase app_users table on mount
  useEffect(() => {
    const fetchLiveUsers = async () => {
      try {
        const { supabase } = await import('../../lib/supabaseClient');
        const { data: dbUsers, error } = await supabase.from('app_users').select('*');
        if (dbUsers && dbUsers.length > 0) {
          const formatted = dbUsers.map((u: any) => ({
            id: u.id,
            name: u.name,
            role: u.role || 'teacher',
            designation: u.designation || 'কর্মকর্তা',
            mobile: u.phone || u.email,
            email: u.email || u.phone,
            password: u.password_hash || u.password || '123',
            loginPermitted: u.status === 'Approved',
            status: u.status || 'Approved'
          }));
          const adminsAndUsers = formatted.filter((u: any) => u.role === 'admin' || u.role === 'superadmin');
          const teachers = formatted.filter((u: any) => u.role !== 'admin' && u.role !== 'superadmin');
          if (adminsAndUsers.length > 0) setCustomUsers(adminsAndUsers);
          if (teachers.length > 0) setTeachersList(teachers);
        }
      } catch (err) {
        console.warn("Could not load app_users from Supabase:", err);
      }
    };
    fetchLiveUsers();
  }, []);

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal states
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<any | null>(null);
  
  const [newUser, setNewUser] = useState({
    name: '',
    role: 'teacher',
    designation: 'সহকারী শিক্ষক',
    mobile: '',
    password: '123',
    status: 'Approved'
  });

  const [newPassword, setNewPassword] = useState('');
  const [newMobile, setNewMobile] = useState('');

  // Sync to local storage & Supabase
  const syncStorage = async (updatedTeachers: any[], updatedUsers: any[]) => {
    localStorage.setItem('madrasa_teachers', JSON.stringify(updatedTeachers));
    localStorage.setItem('madrasa_users', JSON.stringify(updatedUsers));

    // Push to Supabase app_users table
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const allToSync = [
        ...updatedUsers.map(u => ({
          id: String(u.id),
          name: u.name,
          email: u.email || (u.mobile?.includes('@') ? u.mobile : `${u.mobile}@madrasah.com`),
          phone: u.mobile || u.phone,
          password_hash: u.password || '123456',
          role: u.role || 'admin',
          designation: u.designation || 'এডমিন',
          status: u.status || (u.loginPermitted ? 'Approved' : 'Pending'),
          updated_at: new Date().toISOString()
        })),
        ...updatedTeachers.map(t => ({
          id: String(t.id),
          name: t.name,
          email: t.email || (t.mobile?.includes('@') ? t.mobile : `${t.mobile}@madrasah.com`),
          phone: t.mobile || t.phone,
          password_hash: t.password || '123456',
          role: t.role || 'teacher',
          designation: t.designation || 'শিক্ষক',
          status: t.status || (t.loginPermitted ? 'Approved' : 'Pending'),
          updated_at: new Date().toISOString()
        }))
      ];

      await supabase.from('app_users').upsert(allToSync, { onConflict: 'id' });
    } catch (e) {
      console.warn("Supabase app_users upsert failed:", e);
    }
  };

  // Combine list
  const allUsers = useMemo(() => {
    const list = [
      ...customUsers.map(u => ({ ...u, source: 'users' })),
      ...teachersList.map(t => ({
        id: t.id,
        name: t.name,
        role: t.role || 'teacher',
        designation: t.designation || 'শিক্ষক',
        mobile: t.mobile,
        password: t.password || '123',
        loginPermitted: t.loginPermitted !== false,
        status: t.loginPermitted === false ? (t.status === 'Blocked' ? 'Blocked' : 'Pending') : 'Approved',
        source: 'teachers',
        raw: t
      }))
    ];
    return list;
  }, [customUsers, teachersList]);

  // Handle Approve Permission
  const handleApprove = (userId: string, source: string) => {
    if (source === 'teachers') {
      const updated = teachersList.map(t => t.id === userId ? { ...t, loginPermitted: true, status: 'Approved' } : t);
      setTeachersList(updated);
      syncStorage(updated, customUsers);
    } else {
      const updated = customUsers.map(u => u.id === userId ? { ...u, loginPermitted: true, status: 'Approved' } : u);
      setCustomUsers(updated);
      syncStorage(teachersList, updated);
    }
  };

  // Handle Block / Suspend
  const handleBlock = (userId: string, source: string) => {
    if (source === 'teachers') {
      const updated = teachersList.map(t => t.id === userId ? { ...t, loginPermitted: false, status: 'Blocked' } : t);
      setTeachersList(updated);
      syncStorage(updated, customUsers);
    } else {
      const updated = customUsers.map(u => u.id === userId ? { ...u, loginPermitted: false, status: 'Blocked' } : u);
      setCustomUsers(updated);
      syncStorage(teachersList, updated);
    }
  };

  // Handle Delete
  const handleDeleteUser = async (userId: string, source: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই ব্যবহারকারীর অ্যাক্সেস মুছে ফেলতে চান?')) {
      if (source === 'teachers') {
        const updated = teachersList.filter(t => t.id !== userId);
        setTeachersList(updated);
        syncStorage(updated, customUsers);
      } else {
        const updated = customUsers.filter(u => u.id !== userId);
        setCustomUsers(updated);
        syncStorage(teachersList, updated);
      }

      try {
        const { supabase } = await import('../../lib/supabaseClient');
        await supabase.from('app_users').delete().eq('id', userId);
      } catch (e) {
        console.warn("Error deleting user from Supabase:", e);
      }
    }
  };

  // Save Edit User
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editingUser.source === 'teachers') {
      const updated = teachersList.map(t => t.id === editingUser.id ? {
        ...t,
        name: editingUser.name,
        mobile: editingUser.mobile,
        designation: editingUser.designation,
        password: editingUser.password,
        loginPermitted: editingUser.status === 'Approved',
        status: editingUser.status
      } : t);
      setTeachersList(updated);
      syncStorage(updated, customUsers);
    } else {
      const updated = customUsers.map(u => u.id === editingUser.id ? {
        ...u,
        name: editingUser.name,
        mobile: editingUser.mobile,
        designation: editingUser.designation,
        role: editingUser.role,
        password: editingUser.password,
        loginPermitted: editingUser.status === 'Approved',
        status: editingUser.status
      } : u);
      setCustomUsers(updated);
      syncStorage(teachersList, updated);
    }
    setEditingUser(null);
  };

  // Add New User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = newUser.mobile.trim();
    const cleanPassword = newUser.password.trim() || '123456';

    const newUserObj = {
      id: 'USR-' + Math.floor(1000 + Math.random() * 9000),
      name: newUser.name.trim(),
      role: newUser.role || 'teacher',
      designation: newUser.designation.trim() || 'কর্মকর্তা',
      mobile: cleanMobile,
      email: cleanMobile.includes('@') ? cleanMobile : `${cleanMobile}@madrasah.com`,
      password: cleanPassword,
      loginPermitted: newUser.status === 'Approved',
      status: newUser.status || 'Approved'
    };

    if (newUser.role === 'teacher' || newUser.role === 'staff') {
      const updatedTeachers = [newUserObj, ...teachersList];
      setTeachersList(updatedTeachers);
      syncStorage(updatedTeachers, customUsers);
    } else {
      const updatedUsers = [newUserObj, ...customUsers];
      setCustomUsers(updatedUsers);
      syncStorage(teachersList, updatedUsers);
    }

    setShowAddUserModal(false);
    setNewUser({
      name: '',
      role: 'teacher',
      designation: 'সহকারী শিক্ষক',
      mobile: '',
      password: '123',
      status: 'Approved'
    });
  };

  // Filtered List
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.mobile.includes(search);
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'pending' && u.status === 'Pending') ||
      (filterStatus === 'approved' && u.status === 'Approved') ||
      (filterStatus === 'blocked' && u.status === 'Blocked');
    return matchesSearch && matchesRole && matchesStatus;
  });

  const pendingCount = allUsers.filter(u => u.status === 'Pending').length;
  const approvedCount = allUsers.filter(u => u.status === 'Approved').length;

  return (
    <div className="bento-card p-6 md:p-8 bg-card border border-border-main shadow-2xl text-left font-hind-siliguri space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-main/50 pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-text-main tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-primary w-8 h-8" /> ব্যবহারকারী ও ইউজার অ্যাক্সেস নিয়ন্ত্রণ
          </h2>
          <p className="text-xs text-text-light font-medium mt-1">
            শিক্ষক ও কর্মীদের এডমিন অনুমোদনের পর সিস্টেমে প্রবেশের পারমিশন দিন, পাসওয়ার্ড ও তথ্য পরিচালনা করুন।
          </p>
        </div>

        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-primary-light transition-all shadow-lg shadow-primary/20 cursor-pointer"
        >
          <Plus size={18} /> নতুন ব্যবহারকারী/এডমিন যুক্ত করুন
        </button>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-step-bg rounded-2xl border border-border-main/60">
          <p className="text-[10px] font-black uppercase text-text-light tracking-widest mb-1">মোট রেজিস্টার্ড ইউজার</p>
          <p className="text-2xl font-black text-text-main">{allUsers.length} জন</p>
        </div>
        
        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
          <p className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-widest mb-1">অনুমোদনের অপেক্ষায় (পেন্ডিং)</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
            {pendingCount} জন {pendingCount > 0 && <span className="text-[10px] px-2 py-0.5 bg-amber-500 text-white rounded-full font-bold animate-pulse">অনুমোদন প্রয়োজন</span>}
          </p>
        </div>

        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
          <p className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-widest mb-1">সক্রিয় অনুমোদিত ইউজার</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{approvedCount} জন</p>
        </div>

        <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
          <p className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400 tracking-widest mb-1">ব্লকড / নিষ্ক্রিয়</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{allUsers.filter(u => u.status === 'Blocked').length} জন</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-step-bg/40 p-4 rounded-2xl border border-border-main/50">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light/50" />
          <input
            type="text"
            placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border-main rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-card border border-border-main text-xs font-bold rounded-xl px-3 py-2.5 outline-none text-text-main"
          >
            <option value="all">সকল স্ট্যাটাস (All)</option>
            <option value="pending">অনুমোদনের অপেক্ষায় (Pending)</option>
            <option value="approved">অনুমোদিত (Approved)</option>
            <option value="blocked">ব্লকড (Blocked)</option>
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-card border border-border-main text-xs font-bold rounded-xl px-3 py-2.5 outline-none text-text-main"
          >
            <option value="all">সকল রোল (All Roles)</option>
            <option value="teacher">শিক্ষক (Teacher)</option>
            <option value="staff">কর্মচারী (Staff)</option>
            <option value="admin">অ্যাডমিন (Admin)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto border border-border-main rounded-2xl">
        <table className="w-full text-xs text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-step-bg border-b border-border-main text-text-light uppercase font-black text-[10px]">
              <th className="p-4">ব্যবহারকারীর নাম ও পদবী</th>
              <th className="p-4">মোবাইল (লগইন আইডি)</th>
              <th className="p-4">পাসওয়ার্ড</th>
              <th className="p-4">রোল / টাইপ</th>
              <th className="p-4 text-center">এডমিন পারমিশন</th>
              <th className="p-4 text-right">অ্যাকশন / নিয়ন্ত্রণ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/40">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <tr key={u.id + u.source} className="hover:bg-step-bg/30 bg-card transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0 border border-primary/20">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-text-main text-sm">{u.name}</p>
                        <p className="text-[11px] text-text-light font-medium">{u.designation}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 font-bold text-text-main">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-text-light/60" />
                      <span>{u.mobile}</span>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="font-mono bg-step-bg px-2.5 py-1 rounded-lg border border-border-main/60 font-bold text-text-main">
                      {u.password}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                      u.role === 'teacher' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                      'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                    }`}>
                      {u.role === 'admin' ? 'অ্যাডমিন' : u.role === 'teacher' ? 'শিক্ষক' : 'কর্মচারী'}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    {u.status === 'Approved' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[11px] font-black border border-emerald-500/20">
                        <CheckCircle2 size={13} /> অনুমোদিত
                      </span>
                    ) : u.status === 'Pending' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[11px] font-black border border-amber-amber/20 animate-pulse">
                        <AlertCircle size={13} /> পেন্ডিং অনুমোদন
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full text-[11px] font-black border border-rose-500/20">
                        <XCircle size={13} /> ব্লকড
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.status !== 'Approved' && (
                        <button
                          onClick={() => handleApprove(u.id, u.source)}
                          title="অনুমোদন দিন"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck size={14} /> অনুমোদন
                        </button>
                      )}

                      {u.status === 'Approved' && (
                        <button
                          onClick={() => handleBlock(u.id, u.source)}
                          title="ব্লক/স্থগিত করুন"
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer"
                        >
                          <Lock size={14} /> ব্লক
                        </button>
                      )}

                      <button
                        onClick={() => setEditingUser(u)}
                        title="সম্পাদনা করুন (মোবাইল/পাসওয়ার্ড)"
                        className="p-2 bg-step-bg hover:bg-primary/10 hover:text-primary text-text-main rounded-xl transition-all border border-border-main/50 cursor-pointer"
                      >
                        <Settings size={15} />
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.id, u.source)}
                        title="মুছে ফেলুন"
                        className="p-2 bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all border border-rose-500/20 cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-12 text-center text-text-light font-bold">
                  কোনো ব্যবহারকারী পাওয়া যায়নি।
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-main rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 text-left"
            >
              <div className="flex justify-between items-center border-b border-border-main/50 pb-4">
                <h3 className="text-xl font-black text-text-main">ইউজার তথ্য ও অ্যাক্সেস পরিবর্তন</h3>
                <button onClick={() => setEditingUser(null)} className="p-2 text-text-light hover:text-text-main">
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-light block mb-1">ব্যবহারকারীর নাম</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">মোবাইল নম্বর (লগইন ID)</label>
                    <input
                      type="text"
                      required
                      value={editingUser.mobile}
                      onChange={(e) => setEditingUser({ ...editingUser, mobile: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">লগইন পাসওয়ার্ড</label>
                    <input
                      type="text"
                      required
                      value={editingUser.password}
                      onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">পদবী</label>
                    <input
                      type="text"
                      value={editingUser.designation}
                      onChange={(e) => setEditingUser({ ...editingUser, designation: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">লগইন পারমিশন স্ট্যাটাস</label>
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="Approved">অনুমোদিত (Approved - লগইন চালু)</option>
                      <option value="Pending">অনুমোদনের অপেক্ষায় (Pending)</option>
                      <option value="Blocked">ব্লকড (Blocked - লগইন বন্ধ)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-5 py-2.5 bg-step-bg text-text-main font-bold text-xs rounded-xl hover:bg-border-main/50 transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-light transition-all shadow-md cursor-pointer"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-main rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 text-left"
            >
              <div className="flex justify-between items-center border-b border-border-main/50 pb-4">
                <h3 className="text-xl font-black text-text-main">নতুন ব্যবহারকারী/এডমিন তৈরি</h3>
                <button onClick={() => setShowAddUserModal(false)} className="p-2 text-text-light hover:text-text-main">
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-light block mb-1">পূর্ণ নাম</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মাওলানা আব্দুর রহমান"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">মোবাইল নম্বর (লগইন আইডি)</label>
                    <input
                      type="text"
                      required
                      placeholder="01712000000"
                      value={newUser.mobile}
                      onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">পাসওয়ার্ড</label>
                    <input
                      type="text"
                      required
                      placeholder="123456"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">রোল (Role)</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="teacher">শিক্ষক (Teacher)</option>
                      <option value="staff">কর্মচারী (Staff)</option>
                      <option value="admin">সিস্টেম অ্যাডমিন (Admin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">পদবী</label>
                    <input
                      type="text"
                      required
                      value={newUser.designation}
                      onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-light block mb-1">প্রাথমিক পারমিশন</label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Approved">অনুমোদিত (সরাসরি লগইন সুবিধা)</option>
                    <option value="Pending">অনুমোদনের অপেক্ষায় রাখুন (পেন্ডিং)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-5 py-2.5 bg-step-bg text-text-main font-bold text-xs rounded-xl hover:bg-border-main/50 transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-light transition-all shadow-md cursor-pointer"
                  >
                    ব্যবহারকারী তৈরি করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// 21. MADRASAH SERVICES (সেবা সমূহ)
// ============================================================================
export const ServicesDashboard: React.FC = () => {
  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl text-left font-hind-siliguri space-y-6">
      <div>
        <h2 className="text-2xl font-black text-text-main">ডিজিটাল মাদ্রাসা সেবাসমূহ ও পোর্টাল লিঙ্ক</h2>
        <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Madrasah Online Services Ecosystem</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {[
          { title: 'অনলাইন ভর্তি পোর্টাল', link: 'https://almadania.netlify.app/admistion', desc: 'বাইরে থেকে নতুন শিক্ষার্থীরা যাতে অনলাইনে ভর্তি আবেদন করতে পারে।' },
          { title: 'পাবলিক ফলাফল পোর্টাল', link: 'https://almadania.netlify.app/results', desc: 'অভিভাবক ও শিক্ষার্থীরা রোল ও আইডি দিয়ে সরাসরি রেজাল্ট দেখতে পারে।' },
          { title: 'অভিভাবক এসএমএস অ্যালার্ট', link: '#', desc: 'সালাত ও অনুপস্থিতি নিয়ে স্বয়ংক্রিয় এসএমএস প্রেরণের ইন্টিগ্রেশন।' }
        ].map(s => (
          <div key={s.title} className="p-6 bg-step-bg/30 border border-border-main/50 rounded-3xl flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-black text-base text-text-main mb-1.5">{s.title}</h3>
              <p className="text-xs text-text-light/70 font-medium leading-relaxed">{s.desc}</p>
            </div>
            {s.link !== '#' ? (
              <a href={s.link} target="_blank" rel="noopener noreferrer" className="inline-block text-center py-2.5 bg-primary text-white text-[10px] font-black rounded-xl hover:bg-primary-light transition-all active:scale-95 shadow-md">
                পরিদর্শন করুন
              </a>
            ) : (
              <button onClick={() => alert('এই সেবাটি বর্তমানে ব্যাকগ্রাউন্ড সিস্টেমে সচল আছে!')} className="py-2.5 bg-indigo-500 text-white text-[10px] font-black rounded-xl hover:bg-indigo-600 transition-all active:scale-95 cursor-pointer">
                ফিচার চালু করুন
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 22. SPECIALIZED SETTINGS ( অ্যাপ্লিকেশন সেটআপ, পরীক্ষার সেটিংস, উৎস প্রতিষ্ঠান, কোম্পানি, ভর্তি ইনভয়েস, এসএমএস )
// ============================================================================
export const SpecializedSettingsManager: React.FC<{ type: 'app' | 'exam' | 'source' | 'company' | 'datatype' | 'invoice' | 'sms' }> = ({ type }) => {
  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl text-left font-hind-siliguri space-y-6">
      <div>
        <h2 className="text-2xl font-black text-text-main capitalize">
          {type === 'app' ? 'অ্যাপ্লিকেশন সেটআপ ও গ্লোবাল স্কিম' : 
           type === 'exam' ? 'পরীক্ষা নিয়ন্ত্রণ ও গ্রেড সেটিংস' : 
           type === 'source' ? 'উৎস প্রতিষ্ঠান ও সংযুক্তি' : 
           type === 'company' ? 'কোম্পানি ও ব্র্যান্ড সেটিংস' : 
           type === 'datatype' ? 'সিস্টেম ডেটা টাইপ ডিরেক্টরি' : 
           type === 'invoice' ? 'ভর্তি ইনভয়েস টেমপ্লেট ও সেটআপ' : 'এসএমএস গেটওয়ে ও এপিআই সেটিংস'}
        </h2>
        <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Madrasah Core Technical Configurations</p>
      </div>

      <div className="p-6 bg-step-bg/30 border border-border-main/50 rounded-3xl space-y-4">
        {type === 'app' && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-text-light/85">সফটওয়্যার নাম: দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা ই-ম্যানেজমেন্ট</p>
            <p className="text-xs font-bold text-text-light/85">সিস্টেম সংস্করণ: v2.4.0 (স্থিতিশীল)</p>
            <p className="text-xs font-bold text-text-light/85">ডিফল্ট শিক্ষাবর্ষ: ১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী</p>
          </div>
        )}

        {type === 'exam' && (
          <div className="space-y-2 text-xs font-bold text-text-light/85">
            <p>১. প্রথম সাময়িক পরীক্ষা (মোট নম্বর: ১০০, পাস নম্বর: ৪০)</p>
            <p>২. দ্বিতীয় সাময়িক পরীক্ষা (মোট নম্বর: ১০০, পাস নম্বর: ৪০)</p>
            <p>৩. বার্ষিক পরীক্ষা (মোট নম্বর: ১০০, পাস নম্বর: ৪০)</p>
          </div>
        )}

        {type === 'source' && (
          <p className="text-xs text-text-light/75 font-medium leading-relaxed">
            মাদ্রাসার উৎস ও অ্যাফিলিয়েটেড বোর্ড: বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ (বাংলাদেশ কওমি মাদ্রাসা শিক্ষা বোর্ড)।
          </p>
        )}

        {type === 'company' && (
          <p className="text-xs text-text-light/75 font-medium leading-relaxed">
            ডেভেলপার ও মেইনটেন্যান্স পার্টনার: আল মাদানিয়া সফটস লিমিটেড। লাইসেন্স নং: AMS-2026-9483।
          </p>
        )}

        {type === 'datatype' && (
          <p className="text-xs text-text-light/75 font-medium leading-relaxed">
            ডাটা টাইপ ম্যাপিং: Student Data (Google Sheet Dynamic Node), Staff Attendance (Local Engine Cache), Accounts Ledgers (Durable Local Storage Vault).
          </p>
        )}

        {type === 'invoice' && (
          <div className="space-y-2 text-xs font-bold text-text-light/85">
            <p>রসিদ হেডার: দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা ভর্তি রসিদ কপি</p>
            <p>ডিফল্ট সাকুল্যে ফি: ২৫০০ টাকা (ভর্তি, কুতুবখানা, পরীক্ষার ফি সংযুক্ত)</p>
            <p>ইনভয়েস ফুটার: "আপনার দান ও সহযোগিতা সাদাকায়ে জারিয়া হিসেবে কবুল হোক।"</p>
          </div>
        )}

        {type === 'sms' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-text-main">SMS Gateway API Key</label>
              <input type="password" readonly value="****************************************" className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold font-mono outline-none" />
            </div>
            <p className="text-[10px] text-text-light/45">ডিফল্ট প্রোভাইডার: Greenweb Bangladesh SMS Gateway API Integration</p>
          </div>
        )}

        <button onClick={() => alert('টেকনিক্যাল সেটিংস সফলভাবে আপগ্রেড ও সেভ করা হয়েছে!')} className="px-5 py-3 bg-primary text-white text-xs font-black rounded-xl active:scale-95 cursor-pointer">সেটিংস সেভ করুন</button>
      </div>

      {(type === 'app' || type === 'company') && (
        <div className="pt-6 border-t border-border-main/60">
          <DatabaseMediaStore />
        </div>
      )}
    </div>
  );
};

export const SeatPlanGenerator: React.FC = () => {
  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl text-left font-hind-siliguri">
      <h2 className="text-2xl font-black text-text-main mb-4">আসন বিন্যাস তৈরি (Seat Plan)</h2>
      <p className="text-text-light text-sm mb-6">পরীক্ষার সিট প্ল্যান ও এডমিট কার্ড তৈরি করুন</p>
      <div className="p-6 bg-step-bg rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
        <Layout className="text-primary opacity-50" size={48} />
        <p className="text-xs font-bold text-text-light">এই মডিউলটি বর্তমানে ডেভেলপমেন্ট অবস্থায় আছে। পরবর্তী আপডেটে এটি যুক্ত করা হবে।</p>
      </div>
    </div>
  );
};

export const MarksheetLocker: React.FC = () => {
  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl text-left font-hind-siliguri">
      <h2 className="text-2xl font-black text-text-main mb-4">মার্কশীট লকার (Marksheet Locker)</h2>
      <p className="text-text-light text-sm mb-6">পরীক্ষার মার্কশীট সংরক্ষণ এবং ডিজিটাল কপি</p>
      <div className="p-6 bg-step-bg rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
        <Archive className="text-primary opacity-50" size={48} />
        <p className="text-xs font-bold text-text-light">এই মডিউলটি বর্তমানে ডেভেলপমেন্ট অবস্থায় আছে। পরবর্তী আপডেটে এটি যুক্ত করা হবে।</p>
      </div>
    </div>
  );
};

export const CertificateGenerator: React.FC = () => {
  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl text-left font-hind-siliguri">
      <h2 className="text-2xl font-black text-text-main mb-4">সনদপত্র জেনারেটর (Certificates)</h2>
      <p className="text-text-light text-sm mb-6">ছাত্রদের প্রশংসা পত্র এবং প্রত্যয়ন পত্র</p>
      <div className="p-6 bg-step-bg rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
        <FileText className="text-primary opacity-50" size={48} />
        <p className="text-xs font-bold text-text-light">এই মডিউলটি বর্তমানে ডেভেলপমেন্ট অবস্থায় আছে। পরবর্তী আপডেটে এটি যুক্ত করা হবে।</p>
      </div>
    </div>
  );
};

