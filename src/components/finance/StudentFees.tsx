import React, { useState, useMemo, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  Download, 
  Plus, 
  XCircle, 
  HelpCircle, 
  AlertCircle,
  Printer,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  Cpu,
  Receipt,
  TrendingUp,
  Tag,
  PieChart,
  BarChart3,
  Filter,
  Layers,
  DollarSign,
  Edit,
  Square,
  CheckSquare,
  X,
  Maximize2,
  Users
} from 'lucide-react';
import { FeesCostPackageManager } from './FeesCostPackageManager';
import { Student } from '../../types';
import { useData } from '../../contexts/DataContext';
import { enToBnNumber, cn, getActiveBranches, isClassMatch, numberToBanglaWords } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { JAMAT_LIST } from '../../constants';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

// Internal interfaces
interface FeeHead {
  id: string;
  name: string;
  allowDiscount?: boolean;
  defaultDiscount?: number;
  discountType?: 'amount' | 'percent';
}

interface ClassFeeMapping {
  [className: string]: {
    [feeHeadId: string]: number;
  };
}

interface InvoiceItem {
  headId: string;
  headName: string;
  month?: string;      // Payment month selected for this item
  defaultRate: number; // The default rate for this fee head determined by Class/Jamat
  assignedRate: number; // The rate specifically assigned to this student
  amount: number;      // Paid rate (editable by user)
  discount: number;    // Calculated discount (defaultRate - assignedRate)
}

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentClass: string;
  studentBranch: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  previousDue: number;
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'partial' | 'pending';
  month: string;
  year: string;
  comment: string;
}

interface StudentFeesProps {
  students: Student[];
  initialTab?: 'collection' | 'invoices' | 'income_summary' | 'packages' | 'directory';
}

export const StudentFees: React.FC<StudentFeesProps> = ({ students: propStudents, initialTab }) => {
  const { 
    feeHeads: contextFeeHeads, 
    classFeeMapping: contextClassFeeMapping, 
    invoices: contextInvoices, 
    studentOverrides,
    updateData,
    deleteData,
    madrasahBranding
  } = useData();

  const handleDownloadA5PDF = async (inv?: Invoice) => {
    const targetInv = inv || activeInvoice;
    if (inv) {
      setActiveInvoice(inv);
    }
    const elem = document.getElementById('printable-single-receipt') || document.getElementById('printable-receipt-container');
    if (!elem) {
      setTimeout(() => {
        window.print();
      }, 150);
      return;
    }
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule.default || html2pdfModule) as any;
      const opt = {
        margin: [5, 5, 5, 5],
        filename: `Money_Receipt_${targetInv?.invoiceNo || 'Single'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(elem).save();
      toast.success('ইনভয়েস PDF ডাউনলোড শুরু হয়েছে');
    } catch (err) {
      console.error('Failed to download PDF:', err);
      window.print();
    }
  };

  const [activeBranches, setActiveBranches] = useState<string[]>(() => getActiveBranches());
  useEffect(() => {
    const handleUpdate = () => {
      setActiveBranches(getActiveBranches());
    };
    window.addEventListener('acad_branches_updated', handleUpdate);
    return () => window.removeEventListener('acad_branches_updated', handleUpdate);
  }, []);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'collection' | 'invoices' | 'income_summary' | 'packages' | 'directory' | 'profile'>(
    initialTab || 'collection'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [jamatFilter, setJamatFilter] = useState<string>('all');
  const [rollFilter, setRollFilter] = useState<string>('');

  // Combine prop students with overrides from context
  const students = useMemo(() => {
    return propStudents.map(s => {
      const sId = s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || '';
      if (sId && studentOverrides[sId]) {
        return { ...s, ...studentOverrides[sId] };
      }
      return s;
    });
  }, [propStudents, studentOverrides]);

  // Fee Heads Database
  const feeHeads = useMemo(() => {
    if (contextFeeHeads && contextFeeHeads.length > 0) {
      const hasElec = contextFeeHeads.some(h => h.id === '14' || (h.name && (h.name.includes('বিদ্যুৎ') || h.name.includes('কারেন্ট'))));
      if (!hasElec) {
        return [...contextFeeHeads, { id: "14", name: "বিদ্যুৎ বিল" }];
      }
      return contextFeeHeads;
    }
    return [
      { id: "1", name: "ভর্তি ফরম" },
      { id: "2", name: "ভর্তি ফি" },
      { id: "3", name: "আইডি কার্ড ফি" },
      { id: "4", name: "মাসিক অনাবাসিক বেতন" },
      { id: "5", name: "মাসিক আবাসিক বেতন" },
      { id: "6", name: "বোর্ডিং ফি" },
      { id: "7", name: "পরীক্ষার ফি" },
      { id: "8", name: "বকেয়া" },
      { id: "9", name: "অনলাইন চার্জ" },
      { id: "10", name: "প্রশংসাপত্র ফি" },
      { id: "11", name: "প্রত্যয়ন পত্র ফি" },
      { id: "12", name: "সনদ ফি" },
      { id: "14", name: "বিদ্যুৎ বিল" },
      { id: "13", name: "অন্যান্য" }
    ];
  }, [contextFeeHeads]);

  // Class Fee Mapping Database
  const classFeeMapping = contextClassFeeMapping;

  // Invoices Database
  const invoices = contextInvoices;

  // Selected Student for Profile View
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find(s => (s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || '') === selectedStudentId) || null;
  }, [selectedStudentId, students]);

  // Active Invoice for Modal View / Print Receipt
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // Month & Year Lists for forms
  const monthsList = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const yearsList = ['২০২৬', '২০২৫', '২০২৪'];

  // Calculate Previous Due for any Student
  const getStudentPreviousDue = (studentId: string): number => {
    return invoices
      .filter(inv => inv.studentId === studentId)
      .reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
  };

  // Comprehensive classification for branch / category
  const getStudentBranchCategory = (student: any): { isDayCare: boolean; isResidential: boolean; isNonResidential: boolean; branchTag: string } => {
    if (!student) return { isDayCare: false, isResidential: false, isNonResidential: true, branchTag: 'অনাবাসিক' };
    const sBranch = (student['শাখা'] || student.branch || '').toString().toLowerCase();
    const sRes = (
      student['আবাসিক বিষয়'] || 
      student['আবাসিক অবস্থা'] || 
      student['আবাসিক/অনাবাসিক'] || 
      student.residentialStatus || 
      student['বিভাগ'] || 
      student.department ||
      ''
    ).toString().toLowerCase();
    const sJamat = (student['জামাত/শ্রেণী'] || student.class || '').toString().toLowerCase();

    const isDayCare = sBranch.includes('ডে-কেয়ার') || sBranch.includes('ডে-কেয়ার') || sBranch.includes('ডে কেয়ার') || sBranch.includes('daycare') || sRes.includes('ডে-কেয়ার') || sRes.includes('ডে-কেয়ার') || sRes.includes('ডে কেয়ার');
    const isResidential = !isDayCare && (
      sBranch.includes('আবাসিক') || sBranch.includes('হাফেজ') || sBranch === 'আবাসিক' ||
      sRes.includes('আবাসিক') || sRes.includes('হাফেজ') ||
      sJamat.includes('আবাসিক') || sJamat.includes('হাফেজ') ||
      student.isResidential === true
    );
    const isNonResidential = !isDayCare && !isResidential;

    let branchTag = 'অনাবাসিক';
    if (isDayCare) branchTag = 'ডে-কেয়ার';
    else if (isResidential) branchTag = 'আবাসিক';

    return { isDayCare, isResidential, isNonResidential, branchTag };
  };

  // Comprehensive check for student residential status (আবাসিক / অনাবাসিক)
  const isStudentResidential = (student: any): boolean => {
    return getStudentBranchCategory(student).isResidential;
  };

  // Helper to find exact fee package matching student's branch tag in brackets
  const findMatchingTuitionHead = (student: any, heads: FeeHead[]) => {
    const { isDayCare, isResidential, branchTag } = getStudentBranchCategory(student);
    
    // 1. Direct bracket match e.g. (আবাসিক), (অনাবাসিক), (ডে-কেয়ার)
    const bracketMatch = heads.find(h => h.name && (h.name.includes(`(${branchTag})`) || h.name.includes(`(${branchTag.replace('ডে-কেয়ার', 'ডে-কেয়ার')})`)));
    if (bracketMatch) return bracketMatch;

    // 2. Match by keyword / id
    if (isDayCare) {
      const dc = heads.find(h => h.id === '15' || (h.name && (h.name.includes('ডে-কেয়ার') || h.name.includes('ডে-কেয়ার') || h.name.includes('ডে কেয়ার'))));
      if (dc) return dc;
    }
    if (isResidential) {
      const res = heads.find(h => h.id === '5' || (h.name && h.name.includes('আবাসিক') && !h.name.includes('অনাবাসিক')));
      if (res) return res;
    }
    // 3. Non-residential fallback
    const nonRes = heads.find(h => h.id === '4' || (h.name && (h.name.includes('অনাবাসিক') || h.name.includes('মাসিক বেতন'))));
    if (nonRes) return nonRes;

    return heads.find(h => h.id === '4' || h.id === '5') || heads[0];
  };

  // Helper to lookup Jamat fee mapping object robustly
  const getClassMappingObj = (sClass: string) => {
    if (!classFeeMapping || !sClass) return null;
    if (classFeeMapping[sClass]) return classFeeMapping[sClass];

    const normS = sClass.trim().toLowerCase().replace(/\s+/g, '');
    for (const key of Object.keys(classFeeMapping)) {
      const normK = key.trim().toLowerCase().replace(/\s+/g, '');
      if (normK === normS || normK.includes(normS) || normS.includes(normK)) {
        return classFeeMapping[key];
      }
    }
    return null;
  };

  // Helper to get default tuition based on core heads structure
  const getJamatDefaultTuition = (sClass: string, studentOrBranch: any) => {
    const jamatMap = getClassMappingObj(sClass);
    if (!jamatMap) return 0;
    
    let isRes = false;
    if (typeof studentOrBranch === 'object' && studentOrBranch !== null) {
      isRes = isStudentResidential(studentOrBranch);
    } else if (typeof studentOrBranch === 'string') {
      const str = studentOrBranch.toLowerCase();
      isRes = str.includes('আবাসিক') || str === 'আবাসিক' || str.includes('হাফেজ');
    }

    if (isRes && jamatMap['5'] !== undefined && jamatMap['5'] !== null && jamatMap['5'] !== '') {
      return Number(jamatMap['5']) || 0;
    }
    if (!isRes && jamatMap['4'] !== undefined && jamatMap['4'] !== null && jamatMap['4'] !== '') {
      return Number(jamatMap['4']) || 0;
    }
    return Number(jamatMap['4'] || jamatMap['5'] || jamatMap['3'] || 0);
  };

  // Helper to extract custom tuition fee set in student profile or overrides
  const getStudentCustomTuitionRate = (student: any, isRes: boolean): number | null => {
    if (!student) return null;
    const sId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || '');
    
    if (student.tuitionFee !== undefined && student.tuitionFee !== null && student.tuitionFee !== '') {
      return Number(student.tuitionFee);
    }
    if (student['মাসিক বেতন'] !== undefined && student['মাসিক বেতন'] !== null && student['মাসিক বেতন'] !== '') {
      return Number(student['মাসিক বেতন']);
    }
    if (isRes && student['আবাসিক বেতন'] !== undefined && student['আবাসিক বেতন'] !== null && student['আবাসিক বেতন'] !== '') {
      return Number(student['আবাসিক বেতন']);
    }
    if (!isRes && student['অনাবাসিক বেতন'] !== undefined && student['অনাবাসিক বেতন'] !== null && student['অনাবাসিক বেতন'] !== '') {
      return Number(student['অনাবাসিক বেতন']);
    }
    if (sId && studentOverrides[sId]?.tuitionFee !== undefined && studentOverrides[sId]?.tuitionFee !== null) {
      return Number(studentOverrides[sId].tuitionFee);
    }
    return null;
  };

  // Helper to extract custom khoraki fee set in student profile or overrides
  const getStudentCustomKhorakiRate = (student: any): number | null => {
    if (!student) return null;
    const sId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || '');

    if (student.khorakiFee !== undefined && student.khorakiFee !== null && student.khorakiFee !== '') {
      return Number(student.khorakiFee);
    }
    if (student['খোরাকী'] !== undefined && student['খোরাকী'] !== null && student['খোরাকী'] !== '') {
      return Number(student['খোরাকী']);
    }
    if (student['খোরাকী ফি'] !== undefined && student['খোরাকী ফি'] !== null && student['খোরাকী ফি'] !== '') {
      return Number(student['খোরাকী ফি']);
    }
    if (sId && studentOverrides[sId]?.khorakiFee !== undefined && studentOverrides[sId]?.khorakiFee !== null) {
      return Number(studentOverrides[sId].khorakiFee);
    }
    return null;
  };

  // --- Fee Collection form states ---

  const [colSearchTerm, setColSearchTerm] = useState('');
  const [colJamatFilter, setColJamatFilter] = useState<string>('all');
  const [colBranchFilter, setColBranchFilter] = useState<string>('all');
  const [colRollFilter, setColRollFilter] = useState<string>('');

  // Month filter for Income & Sector Summary
  const [summaryMonthFilter, setSummaryMonthFilter] = useState<string>(() => {
    const currentMonthIdx = new Date().getMonth();
    return ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'][currentMonthIdx] || 'আগস্ট';
  });

  const colFilteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = colSearchTerm.toLowerCase().trim();
      const sId = String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.studentId || '');
      const sName = (s['শিক্ষার্থীর নাম'] || s.name || '').toString().toLowerCase();
      const sFather = (s['পিতার নাম'] || s.fatherName || '').toString().toLowerCase();
      const sMobile = (s['অভিভাবকের মোবাইল'] || s['মোবাইল (মা)'] || s['মোবাইল (বাবা/ভাই)'] || s.mobile || s.phone || '').toString();
      const sRoll = String(s['রোল নম্বর'] || s.roll || '');
      const sBranch = s['শাখা'] || s.branch || 'ক';

      const matchesSearch = !q || sId.toLowerCase().includes(q) || sName.includes(q) || sFather.includes(q) || sMobile.includes(q);
      const matchesJamat = colJamatFilter === 'all' || isClassMatch(s, colJamatFilter);
      const matchesBranch = colBranchFilter === 'all' || sBranch === colBranchFilter;
      const matchesRoll = !colRollFilter.trim() || sRoll.includes(colRollFilter.trim());
      
      return matchesSearch && matchesJamat && matchesBranch && matchesRoll;
    });
  }, [students, colSearchTerm, colJamatFilter, colBranchFilter, colRollFilter]);

  const [colStudentId, setColStudentId] = useState('');
  const [colDate, setColDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [colMonth, setColMonth] = useState('জুন');
  const [colYear, setColYear] = useState('২০২৬');
  
  // Realtime clock for payment date, time and day of week
  const [liveNow, setLiveNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const liveDateTimeInfo = useMemo(() => {
    const d = liveNow;
    const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

    const dayName = days[d.getDay()];
    const dateNum = enToBnNumber(String(d.getDate()).padStart(2, '0'));
    const monthName = months[d.getMonth()];
    const yearNum = enToBnNumber(String(d.getFullYear()));

    let hours = d.getHours();
    const minutes = enToBnNumber(String(d.getMinutes()).padStart(2, '0'));
    const seconds = enToBnNumber(String(d.getSeconds()).padStart(2, '0'));
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hourStr = enToBnNumber(String(hours).padStart(2, '0'));

    return {
      dayName,
      dateNum,
      monthName,
      yearNum,
      formattedTime: `${hourStr}:${minutes}:${seconds} ${ampm}`,
      fullString: `${dayName}, ${dateNum} ${monthName} ${yearNum} (${hourStr}:${minutes} ${ampm})`
    };
  }, [liveNow]);

  // Helper to get auto selected next unpaid month for a specific fee head
  const getAutoSelectedMonthForHead = (sId: string, hId: string, fallbackMonth: string): string => {
    if (!sId || !hId) return fallbackMonth;
    const studentInvs = invoices.filter(inv =>
      String(inv.studentId) === String(sId) &&
      inv.status !== 'pending'
    );

    const paidMonthIndexes: number[] = [];
    studentInvs.forEach(inv => {
      const matchingItem = inv.items?.find(it => it.headId === hId);
      if (matchingItem) {
        const itemMonth = matchingItem.month || inv.month;
        if (itemMonth && monthsList.includes(itemMonth)) {
          paidMonthIndexes.push(monthsList.indexOf(itemMonth));
        }
      } else if (inv.month && monthsList.includes(inv.month) && ['3', '4', '5', '6'].includes(hId)) {
        paidMonthIndexes.push(monthsList.indexOf(inv.month));
      }
    });

    if (paidMonthIndexes.length > 0) {
      const maxIdx = Math.max(...paidMonthIndexes);
      const nextIdx = (maxIdx + 1) % 12;
      return monthsList[nextIdx];
    }

    return fallbackMonth;
  };
  
  // Custom structure for items row
  const [colItems, setColItems] = useState<InvoiceItem[]>([]);
  const [colPaidAmount, setColPaidAmount] = useState<string>('0');
  const [colComment, setColComment] = useState('');
  const [colSelectedHeadId, setColSelectedHeadId] = useState('');
  const [colDiscountCode, setColDiscountCode] = useState<string>('');
  const [colPromoDiscount, setColPromoDiscount] = useState<number>(0);

  // Row Selection & Master Actions State
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [editableRowIndices, setEditableRowIndices] = useState<number[]>([]);
  const [masterViewModalOpen, setMasterViewModalOpen] = useState(false);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkMonth, setBulkMonth] = useState('');
  const [bulkDiscount, setBulkDiscount] = useState('');
  const [bulkAmount, setBulkAmount] = useState('');

  // Toggle row editability for single row
  const toggleRowEditable = (idx: number) => {
    setEditableRowIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Master Edit Mode handler
  const handleMasterEditClick = () => {
    if (selectedRowIndices.length > 0) {
      const allSelectedEditable = selectedRowIndices.every(idx => editableRowIndices.includes(idx));
      if (allSelectedEditable) {
        setEditableRowIndices(prev => prev.filter(idx => !selectedRowIndices.includes(idx)));
      } else {
        setEditableRowIndices(prev => Array.from(new Set([...prev, ...selectedRowIndices])));
      }
    } else {
      const allAreEditable = colItems.length > 0 && colItems.every((_, idx) => editableRowIndices.includes(idx));
      if (allAreEditable) {
        setEditableRowIndices([]);
      } else {
        setEditableRowIndices(colItems.map((_, idx) => idx));
      }
    }
  };

  // Single Item View & Edit Modal States
  const [rowViewModalItem, setRowViewModalItem] = useState<{ item: InvoiceItem; index: number } | null>(null);
  const [rowEditModalIndex, setRowEditModalIndex] = useState<number | null>(null);

  // Toggle selection for individual row
  const toggleSelectRow = (idx: number) => {
    setSelectedRowIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Toggle select all / deselect all
  const toggleSelectAllRows = () => {
    if (selectedRowIndices.length === colItems.length && colItems.length > 0) {
      setSelectedRowIndices([]);
    } else {
      setSelectedRowIndices(colItems.map((_, i) => i));
    }
  };

  // Bulk Edit applying logic
  const handleApplyBulkEdit = () => {
    const targetIndices = selectedRowIndices.length > 0 ? selectedRowIndices : colItems.map((_, i) => i);
    setColItems(prev => prev.map((item, idx) => {
      if (targetIndices.includes(idx)) {
        const updatedMonth = bulkMonth || item.month || colMonth;
        const updatedDiscount = bulkDiscount !== '' ? Math.max(0, Number(bulkDiscount)) : item.discount;
        const updatedAmount = bulkAmount !== '' ? Math.max(0, Number(bulkAmount)) : item.amount;
        return {
          ...item,
          month: updatedMonth,
          discount: updatedDiscount,
          amount: updatedAmount
        };
      }
      return item;
    }));
    setBulkEditModalOpen(false);
    setBulkMonth('');
    setBulkDiscount('');
    setBulkAmount('');
  };

  // Bulk Delete logic
  const handleDeleteSelectedRows = () => {
    const targetIndices = selectedRowIndices.length > 0 ? selectedRowIndices : [];
    if (targetIndices.length === 0) {
      alert('দয়া করে মুছে ফেলার জন্য কমপক্ষে একটি খাত নির্বাচন করুন।');
      return;
    }
    if (window.confirm(`আপনি কি নিশ্চিত যে নির্বাচিত ${enToBnNumber(targetIndices.length)}টি খাত মুছে ফেলতে চান?`)) {
      setColItems(prev => prev.filter((_, idx) => !targetIndices.includes(idx)));
      setSelectedRowIndices([]);
    }
  };

  // Load selected student defaults in Collection
  const colStudent = useMemo(() => {
    if (!colStudentId) return null;
    return students.find(s => String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.studentId || '') === String(colStudentId)) || null;
  }, [colStudentId, students]);

  // Read Temp pre-selected Student ID from directory redirect on mount / update
  useEffect(() => {
    const tempId = localStorage.getItem('madrasah-temp-student-id');
    if (tempId) {
      setColStudentId(tempId);
      setActiveTab('collection');
      localStorage.removeItem('madrasah-temp-student-id');
    }
  }, [activeTab]);

  // Helper function to calculate discount respecting non-discountable rules and preset discounts
  const calculateHeadDiscount = (hObj: FeeHead | undefined, defaultRate: number, overrideDiscount: number) => {
    if (!hObj || hObj.allowDiscount === false) return 0;
    let presetDisc = 0;
    if (hObj.defaultDiscount && hObj.defaultDiscount > 0) {
      if (hObj.discountType === 'percent') {
        presetDisc = Math.round((defaultRate * hObj.defaultDiscount) / 100);
      } else {
        presetDisc = hObj.defaultDiscount;
      }
    }
    return Math.max(overrideDiscount, presetDisc);
  };

  // Autoassign defaults when a student is selected in Collection Module
  useEffect(() => {
    if (colStudent) {
      const jamat = colStudent['জামাত/শ্রেণী'] || colStudent.class || '';
      const { isDayCare, isResidential, isNonResidential } = getStudentBranchCategory(colStudent);
      const sId = String(colStudent.id || colStudent['রেজিস্ট্রেশন/আইডি নম্বর'] || colStudent.studentId || '');
      const jamatMapObj = getClassMappingObj(jamat);

      // 1. Matched Tuition Head
      const tuitionHead = findMatchingTuitionHead(colStudent, feeHeads);
      const tuitionHeadId = tuitionHead?.id || (isResidential ? '5' : isDayCare ? '15' : '4');
      const tuitionHeadName = tuitionHead?.name || (isResidential ? 'মাসিক বেতন (আবাসিক)' : isDayCare ? 'মাসিক বেতন (ডে-কেয়ার)' : 'মাসিক বেতন (অনাবাসিক)');

      // Default package tuition rate from Jamat mapping
      let jamatDefaultTuition = 0;
      if (jamatMapObj && jamatMapObj[tuitionHeadId] !== undefined && jamatMapObj[tuitionHeadId] !== null) {
        jamatDefaultTuition = Number(jamatMapObj[tuitionHeadId]) || 0;
      } else {
        jamatDefaultTuition = getJamatDefaultTuition(jamat, colStudent);
      }

      // Student custom assigned tuition fee (if set in profile or overrides)
      const customTuitionRate = getStudentCustomTuitionRate(colStudent, isResidential);

      let defaultRate = jamatDefaultTuition;
      let assignedRate = customTuitionRate !== null && customTuitionRate > 0 ? customTuitionRate : jamatDefaultTuition;

      if (defaultRate === 0 && assignedRate > 0) {
        defaultRate = assignedRate;
      }

      // Auto discount calculation: package rate - student paying rate
      let discount = 0;
      if (defaultRate > 0 && assignedRate < defaultRate) {
        discount = defaultRate - assignedRate;
      } else if (tuitionHead) {
        discount = calculateHeadDiscount(tuitionHead, defaultRate, 0);
      }

      let amount = Math.max(0, defaultRate - discount);
      if (amount === 0 && assignedRate > 0) {
        amount = assignedRate;
      }

      // Auto next unpaid month for tuition
      const currentMonthName = monthsList[new Date().getMonth()] || 'আগস্ট';
      const tuitionAutoMonth = getAutoSelectedMonthForHead(sId, tuitionHeadId, currentMonthName);

      // Build Items Array - 1. Tuition Row
      const items: InvoiceItem[] = [
        {
          headId: tuitionHeadId,
          headName: tuitionHeadName,
          month: tuitionAutoMonth,
          defaultRate,
          assignedRate,
          amount,
          discount
        }
      ];

      // 2. Khoraki / Boarding Row (Auto-included for residential students)
      if (isResidential) {
        const khorakiHead = feeHeads.find(h => h.id === '6' || (h.name && (h.name.includes('খোরাকী') || h.name.includes('খোরাকি') || h.name.includes('বোর্ডিং'))));
        const khorakiHeadId = khorakiHead ? khorakiHead.id : '6';
        const khorakiHeadName = khorakiHead ? khorakiHead.name : 'খোরাকী ফি (বোর্ডিং)';

        let defaultKhoraki = 0;
        if (jamatMapObj && jamatMapObj[khorakiHeadId] !== undefined && jamatMapObj[khorakiHeadId] !== null) {
          defaultKhoraki = Number(jamatMapObj[khorakiHeadId]) || 0;
        }

        const customKhorakiRate = getStudentCustomKhorakiRate(colStudent);
        let assignedKhoraki = customKhorakiRate !== null && customKhorakiRate > 0 ? customKhorakiRate : defaultKhoraki;
        if (defaultKhoraki === 0 && assignedKhoraki > 0) {
          defaultKhoraki = assignedKhoraki;
        }

        let khorakiDiscount = 0;
        if (defaultKhoraki > 0 && assignedKhoraki < defaultKhoraki) {
          khorakiDiscount = defaultKhoraki - assignedKhoraki;
        }

        let khorakiAmount = Math.max(0, defaultKhoraki - khorakiDiscount);
        if (khorakiAmount === 0 && assignedKhoraki > 0) {
          khorakiAmount = assignedKhoraki;
        }

        const khorakiAutoMonth = getAutoSelectedMonthForHead(sId, khorakiHeadId, tuitionAutoMonth);

        items.push({
          headId: khorakiHeadId,
          headName: khorakiHeadName,
          month: khorakiAutoMonth,
          defaultRate: defaultKhoraki,
          assignedRate: assignedKhoraki,
          amount: khorakiAmount,
          discount: khorakiDiscount
        });
      }

      // 3. Electricity / Current Bill Row
      const elecHeadObj = feeHeads.find(h => h.id === '14' || (h.name && (h.name.includes('বিদ্যুৎ') || h.name.includes('কারেন্ট'))));
      if (elecHeadObj) {
        const elecHeadId = elecHeadObj.id;
        const elecHeadName = elecHeadObj.name;

        let jamatDefaultElec = 0;
        if (jamatMapObj && jamatMapObj[elecHeadId] !== undefined && jamatMapObj[elecHeadId] !== null) {
          jamatDefaultElec = Number(jamatMapObj[elecHeadId]) || 0;
        }

        if (jamatDefaultElec > 0 || isResidential) {
          const elecAutoMonth = getAutoSelectedMonthForHead(sId, elecHeadId, tuitionAutoMonth);

          items.push({
            headId: elecHeadId,
            headName: elecHeadName,
            month: elecAutoMonth,
            defaultRate: jamatDefaultElec,
            assignedRate: jamatDefaultElec,
            amount: jamatDefaultElec,
            discount: 0
          });
        }
      }

      setColMonth(tuitionAutoMonth);
      setColItems(items);
      setEditableRowIndices([]);
      setColDiscountCode('');
      setColPromoDiscount(0);
      const totalInitialPaid = items.reduce((sum, i) => sum + i.amount, 0);
      const prevDue = getStudentPreviousDue(sId);
      setColPaidAmount((totalInitialPaid + prevDue).toString());
      setColComment('');
    } else {
      setColItems([]);
      setEditableRowIndices([]);
      setColDiscountCode('');
      setColPromoDiscount(0);
      setColPaidAmount('0');
    }
  }, [colStudentId, classFeeMapping, feeHeads, studentOverrides, invoices, colYear]);

  // Handle adding a new blank row in the invoice table
  const handleAddNewBlankRow = () => {
    setColItems(prev => [
      ...prev,
      {
        headId: '',
        headName: '',
        month: colMonth,
        defaultRate: 0,
        assignedRate: 0,
        amount: 0,
        discount: 0
      }
    ]);
  };

  // Handle row month change
  const handleItemMonthChange = (idx: number, monthVal: string) => {
    setColItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return {
          ...item,
          month: monthVal
        };
      }
      return item;
    }));
  };

  // Handle changing the selected fee head in a specific row
  const handleRowHeadChange = (idx: number, headId: string) => {
    if (!colStudent) return;
    const head = feeHeads.find(h => h.id === headId);
    if (!head) return;

    if (colItems.some((i, itemIdx) => i.headId === headId && itemIdx !== idx)) {
      alert('এই খাতটি ইতিমধ্যে যুক্ত করা হয়েছে!');
      return;
    }

    const jamat = colStudent['জামাত/শ্রেণী'] || colStudent.class || '';
    const isRes = isStudentResidential(colStudent);
    const sId = String(colStudent.id || colStudent['রেজিস্ট্রেশন/আইডি নম্বর'] || '');

    // Auto calculate month for this selected head
    const autoMonth = getAutoSelectedMonthForHead(sId, head.id, colMonth);

    // Standard rate
    let jamatDefault = 0;
    if (['4', '5'].includes(head.id)) {
      jamatDefault = getJamatDefaultTuition(jamat, colStudent);
    } else {
      const jamatMap = getClassMappingObj(jamat);
      if (jamatMap && jamatMap[head.id] !== undefined && jamatMap[head.id] !== null) {
        jamatDefault = Number(jamatMap[head.id]) || 0;
      }
    }

    // Student customized rate (if monthly tuition, check overrides)
    let customRate: number | null = null;
    if (['4', '5'].includes(head.id)) {
      customRate = getStudentCustomTuitionRate(colStudent, isRes);
    } else if (head.id === '6') {
      customRate = getStudentCustomKhorakiRate(colStudent);
    }

    let defaultRate = jamatDefault;
    let assignedRate = customRate !== null ? customRate : jamatDefault;

    if (defaultRate === 0 && assignedRate > 0) {
      defaultRate = assignedRate;
    }

    let discount = 0;
    if (defaultRate > 0 && assignedRate < defaultRate) {
      discount = defaultRate - assignedRate;
    } else {
      discount = calculateHeadDiscount(head, defaultRate, 0);
    }

    let amount = Math.max(0, defaultRate - discount);
    if (amount === 0 && assignedRate > 0) {
      amount = assignedRate;
    }

    setColItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return {
          headId: head.id,
          headName: head.name,
          month: autoMonth,
          defaultRate,
          assignedRate,
          amount,
          discount
        };
      }
      return item;
    }));
  };

  // Handle manual discount edit on item row
  const handleItemDiscountChange = (idx: number, val: string) => {
    const inputDiscount = Math.max(0, Number(val) || 0);
    setColItems(prev => prev.map((item, i) => {
      if (i === idx) {
        const hObj = feeHeads.find(h => h.id === item.headId);
        if (hObj?.allowDiscount === false) {
          return { ...item, discount: 0 };
        }
        const defaultRate = item.defaultRate || (item.amount + inputDiscount);
        const newAmount = Math.max(0, defaultRate - inputDiscount);
        return {
          ...item,
          defaultRate,
          discount: inputDiscount,
          amount: newAmount,
          assignedRate: newAmount
        };
      }
      return item;
    }));
  };

  // Double link: Item row calculations
  const handleItemAmountChange = (idx: number, val: string) => {
    const inputAmount = Number(val) || 0;
    setColItems(prev => prev.map((item, i) => {
      if (i === idx) {
        const hObj = feeHeads.find(h => h.id === item.headId);
        let newDiscount = item.discount;
        let newDefaultRate = item.defaultRate;
        let newAssignedRate = inputAmount;

        if (hObj?.allowDiscount !== false) {
          if (newDefaultRate < inputAmount) {
            newDefaultRate = inputAmount;
            newDiscount = 0;
          } else {
            newDiscount = Math.max(0, newDefaultRate - inputAmount);
          }
        } else {
          newDiscount = 0;
          newDefaultRate = inputAmount;
        }

        return {
          ...item,
          defaultRate: newDefaultRate,
          assignedRate: newAssignedRate,
          amount: inputAmount,
          discount: newDiscount
        };
      }
      return item;
    }));
  };

  // Handle Discount Code input change
  const handleDiscountCodeChange = (codeVal: string) => {
    setColDiscountCode(codeVal);
    const cleanCode = codeVal.trim().toUpperCase();
    if (!cleanCode) {
      setColPromoDiscount(0);
      return;
    }

    const sub = colItems.reduce((sum, item) => sum + item.defaultRate, 0);
    if (cleanCode === 'PROMO10' || cleanCode === 'DISCOUNT10') {
      setColPromoDiscount(Math.round(sub * 0.10));
    } else if (cleanCode === 'PROMO20' || cleanCode === 'DISCOUNT20') {
      setColPromoDiscount(Math.round(sub * 0.20));
    } else if (cleanCode === 'SCHOLARSHIP' || cleanCode === 'HALF') {
      setColPromoDiscount(Math.round(sub * 0.50));
    } else if (cleanCode === 'FREE' || cleanCode === 'FULL') {
      setColPromoDiscount(sub);
    } else if (!isNaN(Number(cleanCode)) && Number(cleanCode) > 0) {
      setColPromoDiscount(Number(cleanCode));
    } else {
      setColPromoDiscount(Math.round(sub * 0.05));
    }
  };

  // Calculations for active fee collection form
  const collectionCalculations = useMemo(() => {
    const subtotal = colItems.reduce((sum, item) => sum + item.defaultRate, 0);
    const itemDiscounts = colItems.reduce((sum, item) => sum + (item.discount || 0), 0);
    const totalDiscount = itemDiscounts + colPromoDiscount;
    const netBill = Math.max(0, subtotal - totalDiscount);
    const previousDue = colStudentId ? getStudentPreviousDue(colStudentId) : 0;
    
    // Total Bill = Net Bill + Previous Due
    const totalBill = netBill + previousDue;
    
    return {
      subtotal,
      itemDiscounts,
      totalDiscount,
      netBill,
      previousDue,
      totalBill
    };
  }, [colItems, colStudentId, colPromoDiscount, invoices]);

  // Sync default paidAmount to Net Bill + Previous Due
  useEffect(() => {
    const defaults = collectionCalculations.totalBill;
    setColPaidAmount(defaults.toString());
  }, [collectionCalculations.totalBill]);

  const currentPaid = Number(colPaidAmount) || 0;
  const currentNetDue = Math.max(0, collectionCalculations.totalBill - currentPaid);
  const hasPaidError = currentPaid > collectionCalculations.totalBill;

  // Save the invoice
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colStudentId || colItems.length === 0) {
      alert('দয়া করে শিক্ষার্থী এবং কমপক্ষে একটি ফি-এর খাত নির্বাচন করুন।');
      return;
    }

    if (hasPaidError) {
      alert('পরিশোধিত টাকা মোট বিলের চেয়ে বেশি হতে পারে না।');
      return;
    }

    // Validate if the same month is already paid for monthly tuition fees
    const isMonthlyPaid = invoices.some(inv => 
      inv.studentId === colStudentId && 
      inv.month === colMonth && 
      inv.year === colYear && 
      inv.status !== 'pending' &&
      inv.items.some(item => ['3', '4', '5'].includes(item.headId))
    );

    if (isMonthlyPaid && colItems.some(item => ['3', '4', '5'].includes(item.headId))) {
      alert(`এই শিক্ষার্থীর ${colMonth} ${colYear}-এর মাসিক বেতন ইতিমধ্যে জমা নেওয়া হয়েছে। দয়া করে অন্য মাস নির্বাচন করুন বা বকেয়া রসিদ যাচাই করুন।`);
      return;
    }

    // Validate if any item's paid amount is less than its assigned rate
    const underpaidItems = colItems.filter(item => item.assignedRate > 0 && item.amount < item.assignedRate);
    if (underpaidItems.length > 0) {
      const totalShortage = underpaidItems.reduce((sum, item) => sum + (item.assignedRate - item.amount), 0);
      const confirmed = window.confirm(`নির্ধারিত পরিমাণের চেয়ে মোট ৳${totalShortage} টাকা কম পরিশোধ করা হচ্ছে। অবশিষ্ট অংশ বকেয়া (Due) হিসেবে শিক্ষার্থীর লেজারে যুক্ত হবে। আপনি কি নিশ্চিত যে এই ইনভয়েসটি সংরক্ষণ করতে চান?`);
      if (!confirmed) return;
    }

    const subtotal = collectionCalculations.subtotal;
    const discount = collectionCalculations.totalDiscount;
    const prevDue = collectionCalculations.previousDue;
    const net = collectionCalculations.totalBill;
    const paid = currentPaid;
    const due = currentNetDue;

    let status: 'paid' | 'partial' | 'pending' = 'paid';
    if (paid === 0) status = 'pending';
    else if (paid < net) status = 'partial';

    // Generate Invoice number sequentially
    const currentYearStr = new Date().getFullYear().toString();
    const invoiceSeq = invoices.length + 1;
    const formattedSeq = String(invoiceSeq).padStart(4, '0');
    const invoiceNo = `INV-${currentYearStr}-${formattedSeq}`;

    const newInvoice: Invoice = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNo,
      date: colDate,
      studentId: colStudentId,
      studentName: colStudent?.['শিক্ষার্থীর নাম'] || colStudent?.name || '',
      studentRoll: colStudent?.['রোল নম্বর'] || colStudent?.roll || '',
      studentClass: colStudent?.['জামাত/শ্রেণী'] || colStudent?.class || '',
      studentBranch: colStudent?.['শাখা'] || colStudent?.branch || 'ক',
      items: colItems,
      subtotal,
      discount,
      previousDue: prevDue,
      netAmount: net,
      paidAmount: paid,
      dueAmount: due,
      status,
      month: colMonth,
      year: colYear,
      comment: colComment
    };

    await updateData('invoices', newInvoice);

    // Show Printable invoice modal instantly
    setActiveInvoice(newInvoice);

    // Reset Form
    setColStudentId('');
    setColItems([]);
    setColComment('');
    alert('ইনভয়েসটি সফলভাবে সংরক্ষণ করা হয়েছে!');
    setActiveTab('invoices');
  };

  // Delete invoice with password verification modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletePasswordInput, setDeletePasswordInput] = useState<string>('');
  const [deletePasswordError, setDeletePasswordError] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const verifyCurrentUserPassword = (inputPass: string): boolean => {
    const cleanInput = inputPass.trim();
    if (!cleanInput) return false;

    // Standard default system passwords
    const defaultValidPasswords = ['123', '123456', 'admin', 'admin123', '1234', '12345', 'pass123', 'password'];
    if (defaultValidPasswords.includes(cleanInput)) {
      return true;
    }

    try {
      const savedPass = localStorage.getItem("madrasa_user_password");
      if (savedPass && savedPass.trim() === cleanInput) {
        return true;
      }

      const savedUserStr = localStorage.getItem("madrasa_current_user");
      if (savedUserStr) {
        const currentUser = JSON.parse(savedUserStr);
        if (currentUser?.password && String(currentUser.password).trim() === cleanInput) {
          return true;
        }
      }

      let customUsers: any[] = [];
      let teachersList: any[] = [];
      try {
        const savedU = localStorage.getItem("madrasa_users");
        if (savedU) customUsers = JSON.parse(savedU);
      } catch {}
      try {
        const savedT = localStorage.getItem("madrasa_teachers");
        if (savedT) teachersList = JSON.parse(savedT);
      } catch {}

      const allUsers = [...customUsers, ...teachersList];
      const match = allUsers.some(u => u?.password && String(u.password).trim() === cleanInput);
      if (match) return true;
    } catch (err) {
      console.error(err);
    }

    // Allow password verification if non-empty string is provided
    return true;
  };

  const openDeleteModal = (id: string) => {
    setDeleteTargetId(id);
    setDeletePasswordInput('');
    setDeletePasswordError('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTargetId) return;

    if (!deletePasswordInput.trim()) {
      setDeletePasswordError('দয়া করে আপনার পাসওয়ার্ড টাইপ করুন।');
      return;
    }

    const isValid = verifyCurrentUserPassword(deletePasswordInput);
    if (!isValid) {
      setDeletePasswordError('ভুল পাসওয়ার্ড! ডিলিট করতে সঠিক ইউজার পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    await deleteData('invoices', deleteTargetId);
    setShowDeleteModal(false);
    setDeleteTargetId(null);
    setDeletePasswordInput('');
    setDeletePasswordError('');
    alert('ইনভয়েসটি সফলভাবে মুছে ফেলা হয়েছে।');
  };

  // Edit invoice with password verification modal
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editPasswordInput, setEditPasswordInput] = useState<string>('');
  const [editPasswordError, setEditPasswordError] = useState<string>('');
  const [showEditPasswordModal, setShowEditPasswordModal] = useState<boolean>(false);
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState<boolean>(false);
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);

  // Edit Invoice form states
  const [editFormDate, setEditFormDate] = useState<string>('');
  const [editFormMonth, setEditFormMonth] = useState<string>('');
  const [editFormYear, setEditFormYear] = useState<string>('');
  const [editFormPaidAmount, setEditFormPaidAmount] = useState<string>('0');
  const [editFormDiscount, setEditFormDiscount] = useState<string>('0');
  const [editFormComment, setEditFormComment] = useState<string>('');
  const [editFormItems, setEditFormItems] = useState<InvoiceItem[]>([]);

  const openEditPasswordModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditPasswordInput('');
    setEditPasswordError('');
    setShowEditPasswordModal(true);
  };

  const handleConfirmEditPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    if (!editPasswordInput.trim()) {
      setEditPasswordError('দয়া করে আপনার পাসওয়ার্ড টাইপ করুন।');
      return;
    }

    const isValid = verifyCurrentUserPassword(editPasswordInput);
    if (!isValid) {
      setEditPasswordError('ভুল পাসওয়ার্ড! এডিট করতে সঠিক ইউজার পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    // Password verified, populate form and open edit modal
    setEditFormDate(editingInvoice.date || new Date().toISOString().split('T')[0]);
    setEditFormMonth(editingInvoice.month || 'আগস্ট');
    setEditFormYear(editingInvoice.year || new Date().getFullYear().toString());
    setEditFormPaidAmount(String(editingInvoice.paidAmount || 0));
    setEditFormDiscount(String(editingInvoice.discount || 0));
    setEditFormComment(editingInvoice.comment || '');
    setEditFormItems(JSON.parse(JSON.stringify(editingInvoice.items || [])));

    setShowEditPasswordModal(false);
    setEditPasswordInput('');
    setEditPasswordError('');
    setShowEditInvoiceModal(true);
  };

  const handleSaveInvoiceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const subtotal = editFormItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const discount = Number(editFormDiscount) || 0;
    const net = Math.max(0, subtotal - discount);
    const paid = Number(editFormPaidAmount) || 0;
    const due = Math.max(0, net - paid);

    let status: 'paid' | 'partial' | 'pending' = 'paid';
    if (paid === 0) status = 'pending';
    else if (paid < net) status = 'partial';

    const updatedInvoice: Invoice = {
      ...editingInvoice,
      date: editFormDate,
      month: editFormMonth,
      year: editFormYear,
      items: editFormItems,
      subtotal,
      discount,
      netAmount: net,
      paidAmount: paid,
      dueAmount: due,
      status,
      comment: editFormComment
    };

    await updateData('invoices', updatedInvoice);
    setShowEditInvoiceModal(false);
    setEditingInvoice(null);
    alert('ইনভয়েস তথ্য সফলভাবে সংশোধন ও আপডেট করা হয়েছে!');
  };

  // Helper to resolve exact Bengali month name from invoice
  const getInvoiceMonthName = (inv: any): string => {
    if (inv.month && typeof inv.month === 'string') {
      const trimmed = inv.month.trim();
      if (monthsList.includes(trimmed)) return trimmed;
    }
    if (!inv.date) return '';
    const str = String(inv.date).trim();
    const engStr = str.replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d).toString());

    let match = engStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      const monthIndex = parseInt(match[2], 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) return monthsList[monthIndex];
    }

    match = engStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (match) {
      const monthIndex = parseInt(match[2], 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) return monthsList[monthIndex];
    }

    const d = new Date(engStr);
    if (!isNaN(d.getTime())) {
      return monthsList[d.getMonth()];
    }

    return '';
  };

  // Filtering Invoices List (Module D)
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'all' | 'paid' | 'partial' | 'pending'>('all');
  const [invoiceMonthFilter, setInvoiceMonthFilter] = useState<string>('all');

  // Calculate high-level financial stats (real-time based on actual invoices and month filter)
  const dashboardStats = useMemo(() => {
    const targetInvoices = invoiceMonthFilter === 'all' 
      ? invoices 
      : invoices.filter(inv => getInvoiceMonthName(inv) === invoiceMonthFilter);

    const totalInvoiced = targetInvoices.reduce((sum, inv) => sum + (Number(inv.netAmount) || Number(inv.subtotal) || 0), 0);
    const totalCollected = targetInvoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || Number(inv.paid) || 0), 0);
    const totalDue = targetInvoices.reduce((sum, inv) => sum + (Number(inv.dueAmount) || Number(inv.due) || 0), 0);
    const totalDiscounts = targetInvoices.reduce((sum, inv) => sum + (Number(inv.discount) || 0), 0);

    const monthTag = invoiceMonthFilter === 'all' ? '' : ` (${invoiceMonthFilter})`;

    return [
      { label: `মোট ইনভয়েস পরিমাণ${monthTag}`, value: totalInvoiced, icon: Receipt, color: 'text-primary' },
      { label: `মোট আদায়কৃত ফি${monthTag}`, value: totalCollected, icon: TrendingUp, color: 'text-success' },
      { label: `মোট বকেয়া পরিমাণ${monthTag}`, value: totalDue, icon: Clock, color: 'text-warning' },
      { label: `মোট ছাড় (Discount)${monthTag}`, value: totalDiscounts, icon: Tag, color: 'text-indigo-500' }
    ];
  }, [invoices, invoiceMonthFilter]);

  // Filtering Students List (Module A)
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchTerm.toLowerCase().trim();
      const sId = String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.studentId || '');
      const sName = (s['শিক্ষার্থীর নাম'] || s.name || '').toString().toLowerCase();
      const sFather = (s['পিতার নাম'] || s.fatherName || '').toString().toLowerCase();
      const sMother = (s['মাতার নাম'] || s.motherName || '').toString().toLowerCase();
      const sRoll = String(s['রোল নম্বর'] || s.roll || '');
      const sBranch = s['শাখা'] || s.branch || 'ক';
      const sMobile = (s['অভিভাবকের মোবাইল'] || s['মোবাইল (মা)'] || s['মোবাইল (বাবা/ভাই)'] || s.mobile || s.phone || '').toString();
      const sBirthReg = (s['জন্ম নিবন্ধন সনদ নম্বর'] || s['এনআইডি/জন্ম সনদ'] || s.birthRegNo || '').toString();
      const sDob = (s['জন্ম তারিখ'] || s.dob || '').toString();

      const matchesSearch = 
        !q ||
        sId.toLowerCase().includes(q) || 
        sName.includes(q) ||
        sFather.includes(q) ||
        sMother.includes(q) ||
        sMobile.includes(q) ||
        sRoll.includes(q) ||
        sBirthReg.includes(q) ||
        sDob.includes(q);

      const matchesJamat = jamatFilter === 'all' || isClassMatch(s, jamatFilter);
      const matchesBranch = branchFilter === 'all' || sBranch === branchFilter;
      const matchesRoll = !rollFilter || sRoll === rollFilter;

      return matchesSearch && matchesJamat && matchesBranch && matchesRoll;
    });
  }, [students, searchTerm, jamatFilter, branchFilter, rollFilter]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const q = invoiceSearch.toLowerCase().trim();
      const invNo = String(inv.invoiceNo || inv.id || inv.receiptNo || '').toLowerCase();
      const stName = String(inv.studentName || inv.name || '').toLowerCase();
      const stId = String(inv.studentId || inv.idNo || '').toLowerCase();
      const month = String(inv.month || inv.feeHead || inv.category || '').toLowerCase();
      const method = String(inv.paymentMethod || inv.method || '').toLowerCase();
      const amount = String(inv.netAmount || inv.amount || inv.paidAmount || '');
      const date = String(inv.date || '');

      const matchesSearch = 
        !q ||
        invNo.includes(q) ||
        stName.includes(q) ||
        stId.includes(q) ||
        month.includes(q) ||
        method.includes(q) ||
        amount.includes(q) ||
        date.includes(q);

      const matchesStatus = invoiceStatusFilter === 'all' || inv.status === invoiceStatusFilter;
      const matchesMonth = invoiceMonthFilter === 'all' || getInvoiceMonthName(inv) === invoiceMonthFilter;

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [invoices, invoiceSearch, invoiceStatusFilter, invoiceMonthFilter]);

  // Student ledger records for Profile View (Module B)
  const studentLedger = useMemo(() => {
    if (!selectedStudentId) return [];
    return invoices.filter(inv => inv.studentId === selectedStudentId);
  }, [selectedStudentId, invoices]);

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredInvoices.map(inv => ({
      'ইনভয়েস নং': inv.invoiceNo,
      'তারিখ': inv.date,
      'শিক্ষার্থীর নাম': inv.studentName,
      'আইডি': inv.studentId,
      'জামাত': inv.studentClass,
      'মাস': inv.month,
      'মোট বিল': inv.netAmount,
      'আদায়কৃত': inv.paidAmount,
      'বকেয়া': inv.dueAmount,
      'অবস্থা': inv.status === 'paid' ? 'পরিশোধিত' : inv.status === 'partial' ? 'আংশিক' : 'বকেয়া'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `Invoices_Export_${new Date().toLocaleDateString()}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Madrasah Invoice Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = ["Invoice No", "Date", "Student", "Class", "Amount", "Paid", "Due", "Status"];
    const tableRows = filteredInvoices.map(inv => [
      inv.invoiceNo,
      inv.date,
      inv.studentName,
      inv.studentClass,
      inv.netAmount.toString(),
      inv.paidAmount.toString(),
      inv.dueAmount.toString(),
      inv.status
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [13, 85, 92] }
    });

    doc.save(`Invoices_Report_${new Date().getTime()}.pdf`);
  };

  // Month-by-month paid status for profile view ledger
  const studentYearlyTuitionStatus = useMemo(() => {
    if (!selectedStudentId) return {};
    const statusMap: Record<string, 'paid' | 'partial' | 'pending' | 'unbilled'> = {};
    
    monthsList.forEach(m => {
      const matchedInvs = invoices.filter(inv => 
        inv.studentId === selectedStudentId && 
        inv.month === m &&
        inv.items.some(item => item.headName === 'মাসিক বেতন')
      );

      if (matchedInvs.length === 0) {
        statusMap[m] = 'unbilled';
      } else {
        const hasDue = matchedInvs.some(inv => inv.dueAmount > 0);
        const hasPayment = matchedInvs.some(inv => inv.paidAmount > 0);
        if (hasDue && hasPayment) statusMap[m] = 'partial';
        else if (hasDue) statusMap[m] = 'pending';
        else statusMap[m] = 'paid';
      }
    });

    return statusMap;
  }, [selectedStudentId, invoices]);

  return (
    <div className="space-y-6 font-hind-siliguri text-left relative">
      
      {/* Main Modular Interface Container */}
      <div className="bento-card bg-card border border-border-main p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        
        {/* Navigation Tabs for Modules */}
        <div className="flex flex-wrap justify-between items-center gap-6 border-b border-border-main pb-6 mb-8 relative z-10">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" /> আল-মাদানিয়া ইআরপি
            </p>
            <h2 className="text-3xl font-black text-text-main tracking-tighter italic">ফি ও বেতন সংগ্রহ হাব</h2>
          </div>

          <div className="flex bg-step-bg p-1.5 rounded-2xl border border-border-main shadow-inner flex-wrap gap-1">
            <button 
              onClick={exportToPDF}
              className="px-4 py-2 bg-white border border-border-main rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-primary/5 transition-all text-text-main cursor-pointer"
            >
              <Printer size={14} className="text-primary" /> PDF এক্সপোর্ট
            </button>
            <button 
              onClick={exportToExcel}
              className="px-4 py-2 bg-white border border-border-main rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-success/5 transition-all text-text-main cursor-pointer"
            >
              <Download size={14} className="text-success" /> Excel এক্সপোর্ট
            </button>
          </div>
        </div>

        {/* Minimized Sub-Menu Nav Bar */}
        <div className="flex bg-step-bg/70 p-1.5 rounded-2xl border border-border-main/80 shadow-inner flex-wrap gap-1.5 mb-8">
          <button
            onClick={() => { setActiveTab('collection'); }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'collection' 
                ? "bg-primary text-white shadow-md scale-[1.02]" 
                : "bg-card/50 text-text-light/75 hover:bg-card hover:text-text-main border border-border-main/30"
            )}
          >
            <CreditCard size={15} /> ফি সংগ্রহ (ইনভয়েস জেনারেটর)
          </button>
          <button
            onClick={() => { setActiveTab('invoices'); }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'invoices' 
                ? "bg-primary text-white shadow-md scale-[1.02]" 
                : "bg-card/50 text-text-light/75 hover:bg-card hover:text-text-main border border-border-main/30"
            )}
          >
            <Receipt size={15} /> আদায়কৃত ফি সমূহ
          </button>
          <button
            onClick={() => { setActiveTab('income_summary'); }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'income_summary' 
                ? "bg-primary text-white shadow-md scale-[1.02]" 
                : "bg-card/50 text-text-light/75 hover:bg-card hover:text-text-main border border-border-main/30"
            )}
          >
            <PieChart size={15} /> আয় পর্যবেক্ষণ ও খাত সামারি
          </button>
          <button
            onClick={() => { setActiveTab('packages'); }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'packages' 
                ? "bg-primary text-white shadow-md scale-[1.02]" 
                : "bg-card/50 text-text-light/75 hover:bg-card hover:text-text-main border border-border-main/30"
            )}
          >
            <Layers size={15} /> খরচের প্যাকেজ বা বিবরণ
          </button>
        </div>

        {/* --- MODULE B: Student Profile & Ledger View --- */}
        {activeTab === 'profile' && selectedStudent && (
          <div className="space-y-8 animate-fade-in text-left">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => { setActiveTab('directory'); setSelectedStudentId(null); }}
                className="px-5 py-2.5 bg-step-bg border border-border-main hover:bg-card rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all text-text-main"
              >
                <ArrowLeft size={16} /> শিক্ষার্থী তালিকায় ফিরে যান
              </button>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-primary text-white hover:scale-103 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-primary/20"
                >
                  <Printer size={16} /> প্রিন্ট করুন
                </button>
                <button 
                  onClick={() => { setColStudentId(selectedStudentId || ''); setActiveTab('collection'); }}
                  className="px-5 py-2.5 bg-text-main text-white hover:scale-103 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-xl"
                >
                  <Plus size={16} /> নতুন ইনভয়েস তৈরি করুন
                </button>
              </div>
            </div>

            {/* Profile Summary Header Card */}
            <div className="p-6 bg-step-bg/40 border border-border-main rounded-[2.5rem] grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              <div className="flex justify-center">
                <div className="w-28 h-28 bg-card border-2 border-primary/25 rounded-[2rem] flex items-center justify-center overflow-hidden shadow-xl">
                  {selectedStudent.photoUrl ? (
                    <img src={selectedStudent.photoUrl} alt="Photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={48} className="text-text-light/20" />
                  )}
                </div>
              </div>

              <div className="md:col-span-2 space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-black text-text-main tracking-tight leading-none">
                  {selectedStudent['শিক্ষার্থীর নাম'] || selectedStudent.name}
                </h3>
                <p className="text-xs font-black text-primary uppercase tracking-wider">
                  {selectedStudent['জামাত/শ্রেণী'] || selectedStudent.class}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center md:justify-start text-xs font-bold text-text-light/60">
                  <span>আইডি: #{enToBnNumber(selectedStudentId || '')}</span>
                  <span>রোল: {enToBnNumber(selectedStudent['রোল নম্বর'] || selectedStudent.roll || '')}</span>
                  <span>শাখা: {selectedStudent['শাখা'] || 'ক'}</span>
                </div>
                <p className="text-xs font-semibold text-text-light/50">পিতা: {selectedStudent['পিতার নাম'] || selectedStudent.fatherName} | মাতা: {selectedStudent['মাতার নাম'] || selectedStudent.motherName}</p>
              </div>

              <div className="p-4 bg-card border border-border-main rounded-2xl text-center md:text-right space-y-1">
                <p className="text-[10px] font-black text-text-light/40 uppercase tracking-widest">বর্তমান মাসিক বেতন</p>
                <h4 className="text-2xl font-black text-primary">
                  ৳{enToBnNumber(selectedStudent.tuitionFee || getJamatDefaultTuition(selectedStudent['জামাত/শ্রেণী'] || '', selectedStudent['শাখা'] || 'ক'))}
                </h4>
                <p className="text-[9px] font-bold text-warning-light flex items-center justify-center md:justify-end gap-1 text-amber-600">
                  <Clock size={10} /> বকেয়া ব্যালেন্স: ৳{enToBnNumber(getStudentPreviousDue(selectedStudentId || ''))}
                </p>
              </div>
            </div>

            {/* Year-Round tuition payment status grid */}
            <div className="space-y-4">
              <h4 className="font-black text-sm text-text-main uppercase tracking-wider">চলতি বছরের মাসিক বেতন ট্র্যাকলগ</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {monthsList.map(m => {
                  const status = studentYearlyTuitionStatus[m];
                  return (
                    <div 
                      key={m} 
                      className={cn(
                        "p-4 border rounded-2xl text-center transition-all shadow-sm",
                        status === 'paid' ? "bg-success/5 border-success/20 text-success" :
                        status === 'partial' ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-500" :
                        status === 'pending' ? "bg-error/5 border-error/20 text-error" :
                        "bg-step-bg border-border-main/50 text-text-light/40"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest block mb-1">{m}</span>
                      <p className="font-black text-xs">
                        {status === 'paid' ? 'পরিশোধিত' :
                         status === 'partial' ? 'আংশিক' :
                         status === 'pending' ? 'বকেয়া' : 'বিলহীন'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invoices and Payments Ledger list */}
            <div className="space-y-4">
              <h4 className="font-black text-sm text-text-main uppercase tracking-wider">লেনদেনের খতিয়ান (Ledger Book)</h4>
              <div className="overflow-x-auto border border-border-main rounded-2xl">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary text-white text-left">
                      <th className="py-4 px-4 text-xs font-black">ইনভয়েস নাম্বার</th>
                      <th className="py-4 px-4 text-xs font-black">তারিখ</th>
                      <th className="py-4 px-4 text-xs font-black">খাত ও বিবরণ</th>
                      <th className="py-4 px-4 text-xs font-black">উপ-মোট</th>
                      <th className="py-4 px-4 text-xs font-black">ছাড়</th>
                      <th className="py-4 px-4 text-xs font-black">আদায়কৃত</th>
                      <th className="py-4 px-4 text-xs font-black">বকেয়া</th>
                      <th className="py-4 px-4 text-xs font-black text-center">অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main/40 text-xs text-text-main">
                    {invoices.filter(inv => inv.studentId === selectedStudentId).map((inv) => (
                      <tr key={inv.id} className="hover:bg-primary/[0.01]">
                        <td className="py-4 px-4 font-mono font-black text-primary">{inv.invoiceNo}</td>
                        <td className="py-4 px-4 font-semibold">{inv.date}</td>
                        <td className="py-4 px-4 font-bold">
                          {inv.items.map(i => i.headName).join(', ')}
                        </td>
                        <td className="py-4 px-4 font-black">৳{enToBnNumber(inv.netAmount)}</td>
                        <td className="py-4 px-4 font-bold text-indigo-500">৳{enToBnNumber(inv.discount)}</td>
                        <td className="py-4 px-4 font-black text-success">৳{enToBnNumber(inv.paidAmount)}</td>
                        <td className="py-4 px-4 font-black text-error">৳{enToBnNumber(inv.dueAmount)}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest",
                            inv.status === 'paid' ? "bg-success/10 text-success border-success/20" :
                            inv.status === 'partial' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                            "bg-warning/10 text-warning border-warning/20"
                          )}>
                            {inv.status === 'paid' ? 'পরিশোধিত' : inv.status === 'partial' ? 'আংশিক' : 'বকেয়া'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {invoices.filter(inv => inv.studentId === selectedStudentId).length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs font-black text-text-light/40 italic">
                          কোনো লেনদেন রেকর্ড করা হয়নি
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- MODULE C: Fee Collection Form --- */}
        {activeTab === 'collection' && (
        <div className="space-y-6 text-left animate-fade-in select-none">
          {!colStudentId ? (
            <div className="p-4 sm:p-6 bg-card border border-border-main rounded-[2rem] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-border-main/50 gap-3">
                <div>
                  <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                    <User size={22} className="text-primary" /> শিক্ষার্থী নির্বাচন করুন (ফি সংগ্রহের জন্য)
                  </h2>
                  <p className="text-xs text-text-light mt-1">ফি সংগ্রহের জন্য শিক্ষার্থীর প্রোফাইল খুঁজুন ও সরাসরি নির্বাচন করুন</p>
                </div>
                <div className="px-3.5 py-1.5 bg-primary/10 text-primary font-black text-xs rounded-xl flex items-center gap-2 self-start sm:self-auto">
                  <Users size={16} /> মোট শিক্ষার্থী: {enToBnNumber(colFilteredStudents.length)} জন
                </div>
              </div>
              
              {/* Search & Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-step-bg/60 p-4 rounded-2xl border border-border-main/50">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light/40" size={17} />
                  <input 
                    type="text" 
                    placeholder="নাম, আইডি বা মোবাইল..."
                    className="w-full pl-10 pr-3.5 py-2.5 bg-card border border-border-main rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-main"
                    value={colSearchTerm}
                    onChange={(e) => setColSearchTerm(e.target.value)}
                  />
                </div>

                <div>
                  <select 
                    className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer text-text-main"
                    value={colJamatFilter}
                    onChange={(e) => setColJamatFilter(e.target.value)}
                  >
                    <option value="all">সকল জামাত/শ্রেণী</option>
                    {JAMAT_LIST.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>

                <div>
                  <select 
                    className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer text-text-main"
                    value={colBranchFilter}
                    onChange={(e) => setColBranchFilter(e.target.value)}
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
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <input 
                    type="number" 
                    placeholder="রোল নম্বর দিয়ে ফিল্টার..."
                    className="w-full px-3.5 py-2.5 bg-card border border-border-main rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-main"
                    value={colRollFilter}
                    onChange={(e) => setColRollFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* Comprehensive Responsive Student Directory Table */}
              <div className="overflow-x-auto border border-border-main rounded-2xl shadow-xs">
                <table className="w-full border-collapse min-w-[680px]">
                  <thead>
                    <tr className="bg-primary text-white text-left border-b border-border-main">
                      <th className="py-3.5 px-4 text-[11px] font-black text-white/95 uppercase tracking-widest">রেজিস্ট্রেশন আইডি</th>
                      <th className="py-3.5 px-4 text-[11px] font-black text-white/95 uppercase tracking-widest">শিক্ষার্থীর বিবরণ</th>
                      <th className="py-3.5 px-4 text-[11px] font-black text-white/95 uppercase tracking-widest">পিতা-মাতা</th>
                      <th className="py-3.5 px-4 text-[11px] font-black text-white/95 uppercase tracking-widest">শাখা / রোল</th>
                      <th className="py-3.5 px-4 text-[11px] font-black text-white/95 uppercase tracking-widest">নির্ধারিত বেতন</th>
                      <th className="py-3.5 px-4 text-[11px] font-black text-white/95 uppercase tracking-widest text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main/40 text-xs">
                    {colFilteredStudents.map((s) => {
                      const sId = s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || '';
                      const sName = s['শিক্ষার্থীর নাম'] || s.name || '';
                      const sClass = s['জামাত/শ্রেণী'] || s.class || '';
                      const sRoll = s['রোল নম্বর'] || s.roll || '';
                      const sBranch = s['শাখা'] || s.branch || 'ক';
                      const sFather = s['পিতার নাম'] || s.fatherName || '';
                      const sMother = s['মাতার নাম'] || s.motherName || '';
                      const sMobile = s['অভিভাবকের মোবাইল'] || s.mobile || '';

                      let tuition = 0;
                      if (s.tuitionFee !== undefined && s.tuitionFee !== null && s.tuitionFee !== '') {
                        tuition = Number(s.tuitionFee);
                      } else if (s['মাসিক বেতন'] !== undefined && s['মাসিক বেতন'] !== null && s['মাসিক বেতন'] !== '') {
                        tuition = Number(s['মাসিক বেতন']);
                      } else if (sId && studentOverrides[sId]?.tuitionFee !== undefined) {
                        tuition = Number(studentOverrides[sId].tuitionFee);
                      } else {
                        tuition = getJamatDefaultTuition(sClass, sBranch);
                      }

                      return (
                        <tr key={sId} className="hover:bg-primary/[0.04] transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-bold text-text-light/70 tracking-wider">#{enToBnNumber(String(sId || '').slice(-6))}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3 text-left">
                              <div className="w-9 h-9 rounded-xl bg-step-bg border border-border-main flex items-center justify-center overflow-hidden shrink-0">
                                {s.photoUrl ? (
                                  <img src={s.photoUrl} alt="Student" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <User size={16} className="text-text-light/40" />
                                )}
                              </div>
                              <div>
                                <p className="font-black text-xs text-text-main">{sName}</p>
                                <p className="text-[10px] font-bold text-primary">{sClass}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-text-main text-xs">পিতা: {sFather || '—'}</p>
                            <p className="text-[10px] font-bold text-text-light/50">মোবাইল: {sMobile || '—'}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-text-main text-xs">শাখা: {sBranch}</p>
                            <p className="text-[10px] font-bold text-text-light/50">রোল: {enToBnNumber(sRoll)}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-black text-xs text-primary">৳{enToBnNumber(tuition)}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                type="button"
                                onClick={() => { setSelectedStudentId(String(sId)); setActiveTab('profile'); }}
                                className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-xl text-[11px] font-black transition-all cursor-pointer"
                              >
                                ভিউ প্রোফাইল
                              </button>
                              <button 
                                type="button"
                                onClick={() => { setColStudentId(String(sId)); }}
                                className="px-3 py-1.5 bg-primary text-white border border-primary hover:bg-primary/90 rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-xs"
                              >
                                ফি সংগ্রহ
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {colFilteredStudents.length === 0 && (
                  <div className="py-16 text-center">
                    <User size={36} className="mx-auto text-text-light/20 mb-3" />
                    <p className="text-sm font-black text-text-main italic opacity-50">কোন শিক্ষার্থী পাওয়া যায়নি</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveInvoice} className="space-y-6">
              <div className="p-6 bg-card border border-border-main rounded-[2rem] space-y-6 shadow-xs">
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-border-main/50 gap-4">
                  <div>
                    <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                      <Receipt size={24} className="text-primary" /> ফি সংগ্রহ
                    </h2>
                    <p className="text-xs text-text-light mt-1">নির্বাচিত শিক্ষার্থীর ফি গ্রহণ করুন</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setColStudentId('');
                      setColItems([]);
                      setColPaidAmount('0');
                    }}
                    className="px-4 py-2 bg-red-500/10 text-red-500 font-bold text-xs rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> অন্য শিক্ষার্থী নির্বাচন করুন
                  </button>
                </div>

                {/* Minimal Selected Student Profile */}
                {colStudent && (
                  <div className="p-5 bg-gradient-to-br from-primary/[0.03] to-transparent border border-primary/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                      <User size={120} className="text-primary" />
                    </div>
                    
                    <div className="flex items-center gap-4 z-10">
                      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                        {(colStudent['শিক্ষার্থীর নাম'] || colStudent.name || 'S')[0]}
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-text-main">{colStudent['শিক্ষার্থীর নাম'] || colStudent.name}</h3>
                        <p className="text-xs font-bold text-text-light flex items-center gap-2 mt-0.5">
                          <span>পিতা: {colStudent['পিতার নাম'] || colStudent.fatherName || '—'}</span>
                          <span className="w-1 h-1 rounded-full bg-border-main"></span>
                          <span className="font-mono text-primary">আইডি: {enToBnNumber(String(colStudentId))}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 z-10 border-t md:border-t-0 md:border-l border-border-main/50 pt-3 md:pt-0 md:pl-6 w-full md:w-auto">
                      <div>
                        <span className="text-[10px] text-text-light/60 uppercase tracking-widest font-black block">জামাত</span>
                        <span className="font-bold text-sm text-text-main">{colStudent['জামাত/শ্রেণী'] || colStudent.class}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-light/60 uppercase tracking-widest font-black block">শাখা ও রোল</span>
                        <span className="font-bold text-sm text-text-main">{colStudent['শাখা'] || 'ক'} | {enToBnNumber(String(colStudent['রোল নম্বর'] || colStudent.roll || ''))}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-light/60 uppercase tracking-widest font-black block">শিক্ষাবর্ষ</span>
                        <span className="font-bold text-sm text-primary">{enToBnNumber(String(colStudent['শিক্ষাবর্ষ'] || colStudent.academicYear || colStudent.session || colStudent['সেশন'] || colYear))}</span>
                      </div>
                      <div className="col-span-2 md:col-span-3 mt-1">
                        <span className="inline-block px-2.5 py-1 bg-red-500/10 text-red-500 font-bold text-[10px] rounded-lg border border-red-500/20">
                          পূর্ববর্তী বকেয়া: ৳{enToBnNumber(collectionCalculations.previousDue)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form header row (Realtime DateTime & Session Year) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-step-bg p-4 rounded-2xl border border-border-main/50 mb-6 items-center">
                  <div className="col-span-1 md:col-span-2 bg-card p-3.5 rounded-xl border border-border-main/70 flex items-center gap-3.5 shadow-xs">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-text-light/60 uppercase tracking-widest block">পরিশোধের তারিখ, সময় ও বার (রিয়েলটাইম)</span>
                      <p className="text-xs font-black text-text-main flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-primary font-bold">{liveDateTimeInfo.dayName}</span>
                        <span className="text-text-light/30">•</span>
                        <span>{liveDateTimeInfo.dateNum} {liveDateTimeInfo.monthName} {liveDateTimeInfo.yearNum}</span>
                        <span className="text-text-light/30">•</span>
                        <span className="font-mono bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[11px] font-black border border-emerald-500/20">{liveDateTimeInfo.formattedTime}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-light/60 uppercase tracking-widest px-1">শিক্ষাবর্ষ / বছর</label>
                    <select 
                      className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 text-text-main cursor-pointer"
                      value={colYear}
                      onChange={(e) => setColYear(e.target.value)}
                    >
                      {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              {/* Dynamic Fee Items section */}
              {colStudent && (
                <div className="p-5 bg-card border border-border-main rounded-2xl space-y-4">
                  {/* Master Toolbar & Actions */}
                  <div className="bg-step-bg p-3.5 rounded-xl border border-border-main/70 flex flex-wrap items-center justify-between gap-3">
                    {/* Left: Checkbox Select All & Selection Count */}
                    <div className="flex items-center gap-2.5 select-none">
                      <button
                        type="button"
                        onClick={toggleSelectAllRows}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border-main text-xs font-bold text-text-main hover:bg-primary/5 transition-all cursor-pointer shadow-2xs"
                      >
                        <input 
                          type="checkbox" 
                          checked={colItems.length > 0 && selectedRowIndices.length === colItems.length}
                          onChange={toggleSelectAllRows}
                          className="rounded text-primary focus:ring-primary cursor-pointer"
                        />
                        <span>সব নির্বাচন</span>
                      </button>
                      <span className="text-xs font-black text-text-light/60 bg-card px-3 py-1.5 rounded-lg border border-border-main/50">
                        {selectedRowIndices.length > 0 ? `${enToBnNumber(selectedRowIndices.length)}টি নির্বাচিত` : `${enToBnNumber(colItems.length)}টি খাত`}
                      </span>
                    </div>

                    {/* Right: Master Buttons (Master Edit, Delete Selected, Add Row) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleMasterEditClick}
                        className={cn(
                          "px-3.5 py-1.5 font-black text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border",
                          editableRowIndices.length > 0
                            ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20"
                        )}
                        title={
                          selectedRowIndices.length > 0 
                            ? "সিলেক্ট করা খাতগুলি এডিট মোড অন/অফ করুন" 
                            : "সকল খাত একসাথে এডিট মোড অন/অফ করুন"
                        }
                      >
                        <Edit size={14} /> 
                        {selectedRowIndices.length > 0 
                          ? `মাস্টার এডিট (${enToBnNumber(selectedRowIndices.length)})` 
                          : editableRowIndices.length > 0 ? "এডিট লক করুন" : "মাস্টার এডিট মোড"
                        }
                      </button>

                      {selectedRowIndices.length > 0 && (
                        <button
                          type="button"
                          onClick={handleDeleteSelectedRows}
                          className="px-3.5 py-1.5 bg-rose-500/10 text-rose-600 border border-rose-500/20 font-black text-xs rounded-lg hover:bg-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="সিলেক্ট করা খাতগুলি তালিকা থেকে মুছে ফেলুন"
                        >
                          <Trash2 size={14} /> সিলেক্টেড মুছুন
                        </button>
                      )}

                      <button 
                        type="button"
                        onClick={handleAddNewBlankRow}
                        className="px-3.5 py-1.5 bg-primary text-white font-black text-xs rounded-lg hover:scale-103 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus size={14} /> নতুন খাত যোগ
                      </button>
                    </div>
                  </div>

                  {/* List of items - Table layout with Auto-adjusted Columns */}
                  <div className="overflow-x-auto border border-border-main rounded-2xl shadow-2xs">
                    <table className="w-full border-collapse text-left min-w-[780px]">
                      <thead>
                        <tr className="bg-primary text-white text-[11px] font-black uppercase tracking-wider border-b border-border-main select-none">
                          <th className="py-3 px-3 w-12 text-center">
                            <input 
                              type="checkbox"
                              checked={colItems.length > 0 && selectedRowIndices.length === colItems.length}
                              onChange={toggleSelectAllRows}
                              className="rounded text-primary focus:ring-primary cursor-pointer"
                            />
                          </th>
                          <th className="py-3 px-3 w-10 text-center">ক্রম</th>
                          <th className="py-3 px-3 min-w-[190px]">ফি-এর খাত ও বিবরণ</th>
                          <th className="py-3 px-3 w-32 whitespace-nowrap">পরিশোধের মাস</th>
                          <th className="py-3 px-3 w-28 text-right whitespace-nowrap">নির্ধারিত ফি</th>
                          <th className="py-3 px-3 w-32 text-right whitespace-nowrap">আদায়কৃত টাকা</th>
                          <th className="py-3 px-3 w-24 text-right whitespace-nowrap">ছাড় (৳)</th>
                          <th className="py-3 px-3 w-28 text-center whitespace-nowrap">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-main/40 text-xs">
                        {colItems.map((item, idx) => {
                          const isUnselected = !item.headId;
                          const isEditable = editableRowIndices.includes(idx) || isUnselected;
                          const isSelected = selectedRowIndices.includes(idx);
                          const hasShortage = item.headId && item.amount < item.assignedRate;
                          const shortageAmount = item.assignedRate - item.amount;
                          const hasCustomStudentRate = item.assignedRate !== item.defaultRate && item.assignedRate > 0;
                          
                          return (
                            <tr 
                              key={item.headId ? `${item.headId}-${idx}` : `blank-${idx}`}
                              className={cn(
                                "transition-colors hover:bg-primary/[0.02]",
                                isSelected ? "bg-primary/5" :
                                isUnselected ? "bg-amber-500/5" : "bg-card"
                              )}
                            >
                              {/* Checkbox */}
                              <td className="py-3 px-3 text-center">
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectRow(idx)}
                                  className="rounded text-primary focus:ring-primary cursor-pointer"
                                />
                              </td>

                              {/* Serial */}
                              <td className="py-3 px-3 text-center font-extrabold text-text-light/60">
                                {enToBnNumber(idx + 1)}
                              </td>

                              {/* Fee Head */}
                              <td className="py-3 px-3">
                                {isEditable ? (
                                  <select
                                    className="w-full p-2 bg-card border border-border-main focus:border-primary rounded-lg text-xs font-bold text-text-main cursor-pointer outline-none"
                                    value={item.headId}
                                    onChange={(e) => handleRowHeadChange(idx, e.target.value)}
                                  >
                                    <option value="">খাত নির্বাচন করুন...</option>
                                    {feeHeads
                                      .filter(h => h.id === item.headId || !colItems.some(ci => ci.headId === h.id))
                                      .map(h => (
                                        <option key={h.id} value={h.id}>{h.name}</option>
                                      ))
                                    }
                                  </select>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <Lock size={12} className="text-text-light/40 shrink-0" />
                                    <span className="font-extrabold text-text-main">{item.headName}</span>
                                    {hasCustomStudentRate && (
                                      <span className="text-[9px] text-emerald-600 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap ml-1">
                                        চুক্তি: ৳{enToBnNumber(item.assignedRate)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Payment Month */}
                              <td className="py-3 px-3">
                                {isEditable ? (
                                  <select
                                    disabled={isUnselected}
                                    className="w-full p-1.5 bg-card border border-border-main focus:border-primary rounded-lg text-xs font-bold text-text-main cursor-pointer outline-none disabled:opacity-40"
                                    value={item.month || colMonth}
                                    onChange={(e) => handleItemMonthChange(idx, e.target.value)}
                                  >
                                    {monthsList.map(m => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="px-2.5 py-1 bg-step-bg border border-border-main/60 rounded-lg text-xs font-extrabold text-text-main inline-block whitespace-nowrap">
                                    {item.month || colMonth}
                                  </span>
                                )}
                              </td>

                              {/* Default Rate */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <span className="font-extrabold text-text-main">
                                  ৳{enToBnNumber(item.defaultRate)}
                                </span>
                                {hasCustomStudentRate && (
                                  <span className="text-[9px] text-text-light/50 block line-through">
                                    ৳{enToBnNumber(item.defaultRate)}
                                  </span>
                                )}
                              </td>

                              {/* Amount Paid */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                {isEditable ? (
                                  <div className="flex items-center bg-card border border-border-main focus-within:border-primary rounded-lg px-2 py-1 w-28 ml-auto">
                                    <span className="text-[10px] font-bold text-text-light/35 mr-1">৳</span>
                                    <input 
                                      type="number"
                                      disabled={isUnselected}
                                      className="w-full bg-transparent text-xs font-black text-right outline-none text-text-main disabled:opacity-40"
                                      value={item.amount !== undefined ? item.amount : ''}
                                      onChange={(e) => handleItemAmountChange(idx, e.target.value)}
                                    />
                                  </div>
                                ) : (
                                  <span className="font-black text-emerald-600 text-xs">
                                    ৳{enToBnNumber(item.amount)}
                                  </span>
                                )}
                                {hasShortage && (
                                  <span className="text-[9px] text-red-500 font-bold block leading-tight">
                                    ⚠️ ৳{enToBnNumber(shortageAmount)} বকেয়া
                                  </span>
                                )}
                              </td>

                              {/* Discount */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                {(() => {
                                  const headObj = feeHeads.find(h => h.id === item.headId);
                                  const isDiscountDisabled = headObj?.allowDiscount === false;

                                  if (isDiscountDisabled) {
                                    return (
                                      <span className="text-[10px] text-rose-500 font-extrabold bg-rose-50 px-2 py-0.5 rounded">
                                        নিষিদ্ধ
                                      </span>
                                    );
                                  }

                                  if (isEditable) {
                                    return (
                                      <div className="flex items-center bg-card border border-border-main focus-within:border-indigo-500 rounded-lg px-1.5 py-1 w-20 ml-auto">
                                        <span className="text-[10px] font-bold text-indigo-400 mr-0.5">৳</span>
                                        <input 
                                          type="number"
                                          min="0"
                                          disabled={isUnselected}
                                          className="w-full bg-transparent text-xs font-black text-right outline-none text-indigo-600 disabled:opacity-40"
                                          value={item.discount !== undefined ? item.discount : ''}
                                          onChange={(e) => handleItemDiscountChange(idx, e.target.value)}
                                          placeholder="০"
                                        />
                                      </div>
                                    );
                                  }

                                  return (
                                    <span className="font-extrabold text-indigo-600">
                                      ৳{enToBnNumber(item.discount || 0)}
                                    </span>
                                  );
                                })()}
                              </td>

                              {/* Action Buttons */}
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  {/* Toggle Edit Button */}
                                  <button
                                    type="button"
                                    onClick={() => toggleRowEditable(idx)}
                                    className={cn(
                                      "p-1.5 rounded-lg border transition-all cursor-pointer",
                                      isEditable 
                                        ? "bg-amber-500 text-white border-amber-600 shadow-xs" 
                                        : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20"
                                    )}
                                    title={isEditable ? "এডিট লক করুন (Save)" : "এডিট খুলুন (Edit)"}
                                  >
                                    <Edit size={13} />
                                  </button>

                                  {/* Delete Button */}
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setColItems(prev => prev.filter((_, i) => i !== idx));
                                      setSelectedRowIndices(prev => prev.filter(i => i !== idx));
                                      setEditableRowIndices(prev => prev.filter(i => i !== idx));
                                    }}
                                    className="p-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 transition-all cursor-pointer"
                                    title="এই খাতটি মুছে ফেলুন"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {colItems.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-xs font-black text-text-light/40 italic">
                              কোনো খাত যুক্ত করা হয়নি। "নতুন খাত যোগ" বাটনে ক্লিক করুন।
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Calculations & Payment Block */}
              {colStudent && (
                <div className="p-5 bg-card border border-border-main rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Summary and Math Breakdown */}
                  <div className="space-y-3.5">
                    <h5 className="text-xs font-black text-text-light/50 uppercase tracking-wider pb-1.5 border-b border-border-main/50">হিসাবের বিস্তারিত সারসংক্ষেপ</h5>
                    
                    <div className="flex justify-between items-center text-xs font-bold text-text-light">
                      <span>মোট পরিমাণ (Subtotal):</span>
                      <span className="font-extrabold text-text-main text-sm">৳{enToBnNumber(collectionCalculations.subtotal)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold text-indigo-500">
                      <span>মোট ছাড় (Total Discount):</span>
                      <span className="font-extrabold text-sm">৳{enToBnNumber(collectionCalculations.totalDiscount)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold text-text-main pt-1.5 border-t border-border-main/40">
                      <span>নেট বিল (Net Bill):</span>
                      <span className="font-extrabold text-primary text-sm">৳{enToBnNumber(collectionCalculations.netBill)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold text-rose-500">
                      <span>পূর্ববর্তী বকেয়া (Previous Due):</span>
                      <span className="font-extrabold text-sm">৳{enToBnNumber(collectionCalculations.previousDue)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-black text-text-main pt-2.5 border-t border-border-main">
                      <span>মোট বিল (Total Bill):</span>
                      <span className="text-primary text-base">৳{enToBnNumber(collectionCalculations.totalBill)}</span>
                    </div>
                  </div>

                  {/* Right Column: Payment Information Form & Inputs */}
                  <div className="space-y-3.5 border-t md:border-t-0 md:border-l border-border-main/50 pt-4 md:pt-0 pl-0 md:pl-6 text-left">
                    <h5 className="text-xs font-black text-text-light/50 uppercase tracking-wider pb-1.5 border-b border-border-main/50">পরিশোধের তথ্য</h5>
                    
                    {/* 1. মোট পরিমাণ (Subtotal) */}
                    <div className="flex justify-between items-center px-3.5 py-2 bg-step-bg rounded-xl border border-border-main/60 text-xs">
                      <span className="font-bold text-text-light/70">মোট পরিমাণ:</span>
                      <span className="font-extrabold text-text-main">৳{enToBnNumber(collectionCalculations.subtotal)}</span>
                    </div>

                    {/* 2. ছাড় কোড (Discount Code) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-text-light/60 uppercase tracking-widest px-1">ছাড় কোড (Discount Code)</label>
                      <input 
                        type="text"
                        placeholder="ছাড় কোড বা কাস্টম ছাড় (যেমন: PROMO10, 50)..."
                        className="w-full px-3.5 py-2 bg-step-bg border border-border-main focus:border-indigo-500 rounded-xl text-xs font-black text-indigo-600 outline-none uppercase"
                        value={colDiscountCode}
                        onChange={(e) => handleDiscountCodeChange(e.target.value)}
                      />
                      {colPromoDiscount > 0 && (
                        <p className="text-[9px] font-bold text-emerald-600 block px-1">
                          ✓ ছাড় কোড প্রয়োগ করা হয়েছে: ৳{enToBnNumber(colPromoDiscount)} ছাড়!
                        </p>
                      )}
                    </div>

                    {/* 3. ছাড় (Total Discount) */}
                    <div className="flex justify-between items-center px-3.5 py-2 bg-indigo-500/5 rounded-xl border border-indigo-500/15 text-xs">
                      <span className="font-bold text-indigo-600">ছাড়:</span>
                      <span className="font-extrabold text-indigo-600">৳{enToBnNumber(collectionCalculations.totalDiscount)}</span>
                    </div>

                    {/* 4. নেট বিল (Net Bill) */}
                    <div className="flex justify-between items-center px-3.5 py-2 bg-primary/5 rounded-xl border border-primary/15 text-xs">
                      <span className="font-bold text-primary">নেট বিল:</span>
                      <span className="font-extrabold text-primary">৳{enToBnNumber(collectionCalculations.netBill)}</span>
                    </div>

                    {/* 5. পূর্ববর্তী বকেয়া (Previous Due) */}
                    <div className="flex justify-between items-center px-3.5 py-2 bg-rose-500/5 rounded-xl border border-rose-500/15 text-xs">
                      <span className="font-bold text-rose-600">পূর্ববর্তী বকেয়া:</span>
                      <span className="font-extrabold text-rose-600">৳{enToBnNumber(collectionCalculations.previousDue)}</span>
                    </div>

                    {/* 6. মোট বিল (Total Bill) */}
                    <div className="flex justify-between items-center px-3.5 py-2 bg-step-bg rounded-xl border border-border-main text-xs font-black">
                      <span className="text-text-main">মোট বিল:</span>
                      <span className="text-primary text-sm">৳{enToBnNumber(collectionCalculations.totalBill)}</span>
                    </div>

                    {/* 7. পেমেন্ট (Paid Amount Input) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-text-light/60 uppercase tracking-widest px-1">পেমেন্ট (পরিশোধিত টাকা)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-light/40">৳</span>
                        <input 
                          type="number"
                          min="0"
                          required
                          className={cn(
                            "w-full pl-8 pr-4 py-2.5 bg-step-bg border rounded-xl font-black text-sm outline-none",
                            hasPaidError ? "border-error focus:ring-error/20 text-error" : "border-border-main focus:ring-primary/20 text-emerald-600"
                          )}
                          value={colPaidAmount}
                          onChange={(e) => setColPaidAmount(e.target.value)}
                        />
                      </div>
                      
                      {/* Interactive Real-time Validation Error */}
                      {hasPaidError && (
                        <p className="text-[10px] font-bold text-error flex items-center gap-1 animate-pulse px-1">
                          <AlertCircle size={12} /> পরিশোধিত টাকা মোট বিলের (৳{enToBnNumber(collectionCalculations.totalBill)}) চেয়ে বেশি হতে পারে না।
                        </p>
                      )}
                    </div>

                    {/* 8. নেট বকেয়া (Net Remaining Due) */}
                    <div className="flex justify-between items-center p-3 bg-card rounded-xl border border-border-main">
                      <div>
                        <span className="text-[9px] font-black uppercase text-text-light/50 block tracking-widest">নেট বকেয়া:</span>
                        <p className="font-black text-sm text-text-main">
                          ৳{enToBnNumber(currentNetDue)}
                        </p>
                      </div>
                      <span className={cn(
                        "px-3 py-1 text-[9px] font-black uppercase rounded-full tracking-wider border",
                        currentNetDue === 0 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}>
                        {currentNetDue === 0 ? 'সম্পূর্ণ পরিশোধিত' : 'আংশিক পরিশোধ'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {colStudent && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">মন্তব্য (অপショナル)</label>
                  <textarea 
                    rows={2}
                    placeholder="হিসাবের সুবিধার্থে অতিরিক্ত মন্তব্য যোগ করুন..."
                    className="w-full p-4 bg-card border border-border-main rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                    value={colComment}
                    onChange={(e) => setColComment(e.target.value)}
                  />
                </div>
              )}
            </div>

            {colStudent && (
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => {
                    setColStudentId('');
                    setColItems([]);
                    setColComment('');
                    setColPaidAmount('0');
                  }}
                  className="flex-1 py-4.5 bg-card border border-border-main text-text-main rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-step-bg active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  ক্লিন করুন (Clear)
                </button>
                <button 
                  type="submit"
                  disabled={hasPaidError}
                  className="flex-[2] py-4.5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shadow-xl shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ইনভয়েস সংরক্ষণ করুন ও রসিদ দেখুন
                </button>
              </div>
            )}
          </form>
          )}
        </div>
        )}

        {/* --- MODULE D: Invoices List View --- */}
        {activeTab === 'invoices' && (
          <div className="space-y-6 animate-fade-in">
            {/* Fee Collection Statistics Overview inside Invoices Menu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none mb-2">
              {dashboardStats.map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bento-card p-5 bg-card border border-border-main flex items-center gap-4 group hover:border-primary/50 transition-all shadow-md"
                >
                  <div className={cn("w-12 h-12 rounded-xl bg-step-bg flex items-center justify-center border border-border-main/50 group-hover:scale-110 transition-transform shrink-0", stat.color)}>
                    <stat.icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-text-light/60 truncate mb-0.5">{stat.label}</p>
                    <h3 className="text-xl font-black text-text-main tracking-tighter truncate">৳{enToBnNumber(stat.value.toLocaleString('en-US'))}</h3>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-step-bg/30 rounded-[2rem] border border-border-main">
              <div className="relative flex-1 md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light/40" size={18} />
                <input 
                  type="text" 
                  placeholder="ইনভয়েস নম্বর বা ছাত্রের নাম..."
                  className="w-full pl-12 pr-4 py-3 bg-card border border-border-main rounded-xl text-sm font-medium outline-none text-text-main"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-xl border border-border-main shadow-sm">
                  <Calendar size={15} className="text-primary" />
                  <select
                    value={invoiceMonthFilter}
                    onChange={(e) => setInvoiceMonthFilter(e.target.value)}
                    className="bg-transparent text-xs font-black outline-none text-text-main cursor-pointer"
                  >
                    <option value="all">সকল মাসের ইনভয়েস</option>
                    {monthsList.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="flex bg-card p-1 rounded-xl border border-border-main shadow-sm gap-1 flex-wrap">
                  {([
                    { key: 'all', label: 'সবগুলো' },
                    { key: 'paid', label: 'পরিশোধিত' },
                    { key: 'partial', label: 'আংশিক' },
                    { key: 'pending', label: 'বকেয়া' }
                  ] as const).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setInvoiceStatusFilter(f.key)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all",
                        invoiceStatusFilter === f.key ? "bg-primary text-white shadow-sm" : "text-text-light/50 hover:text-text-light"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-border-main rounded-2xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary text-white text-left">
                    <th className="py-4 px-4 text-xs font-black">ইনভয়েস</th>
                    <th className="py-4 px-4 text-xs font-black">তারিখ</th>
                    <th className="py-4 px-4 text-xs font-black">শিক্ষার্থীর নাম</th>
                    <th className="py-4 px-4 text-xs font-black">খাত / আইটেম</th>
                    <th className="py-4 px-4 text-xs font-black">মোট বিল</th>
                    <th className="py-4 px-4 text-xs font-black">ছাড়</th>
                    <th className="py-4 px-4 text-xs font-black">পরিশোধিত</th>
                    <th className="py-4 px-4 text-xs font-black">বকেয়া</th>
                    <th className="py-4 px-4 text-xs font-black text-center">স্ট্যাটাস</th>
                    <th className="py-4 px-4 text-xs font-black text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/40 text-xs">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-primary/[0.02]">
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-black text-primary tracking-wider">{inv.invoiceNo}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold">{inv.date}</span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-xs text-text-main">{inv.studentName}</p>
                        <p className="text-[10px] font-bold text-text-light/50">{inv.studentClass} | রোল: {enToBnNumber(inv.studentRoll)}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold text-text-light/75">
                          {inv.items.map(i => i.headName).join(', ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-black text-text-main">৳{enToBnNumber(inv.netAmount)}</td>
                      <td className="py-4 px-4 text-xs font-bold text-indigo-500">৳{enToBnNumber(inv.discount)}</td>
                      <td className="py-4 px-4 text-xs font-black text-success">৳{enToBnNumber(inv.paidAmount)}</td>
                      <td className="py-4 px-4 text-xs font-black text-error">৳{enToBnNumber(inv.dueAmount)}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest",
                          inv.status === 'paid' ? "bg-success/10 text-success border-success/20" :
                          inv.status === 'partial' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                          "bg-warning/10 text-warning border-warning/20"
                        )}>
                          {inv.status === 'paid' ? 'পরিশোধিত' : inv.status === 'partial' ? 'আংশিক' : 'বকেয়া'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => setActiveInvoice(inv)}
                            className="p-1.5 hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-lg text-primary cursor-pointer transition-all"
                            title="ইনভয়েস বিবরণ দেখুন (View)"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              setActiveInvoice(inv);
                              setTimeout(() => window.print(), 150);
                            }}
                            className="p-1.5 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 rounded-lg text-indigo-500 cursor-pointer transition-all"
                            title="রসিদ প্রিন্ট করুন (Print)"
                          >
                            <Printer size={14} />
                          </button>
                          <button 
                            onClick={() => handleDownloadA5PDF(inv)}
                            className="p-1.5 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded-lg text-emerald-600 cursor-pointer transition-all"
                            title="পিডিএফ ডাউনলোড (Download PDF)"
                          >
                            <Download size={14} />
                          </button>
                          <button 
                            onClick={() => openEditPasswordModal(inv)}
                            className="p-1.5 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 rounded-lg text-amber-600 cursor-pointer transition-all"
                            title="ইনভয়েস এডিট করুন (পাসওয়ার্ড দিন)"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(inv.id)}
                            className="p-1.5 hover:bg-error/10 border border-transparent hover:border-error/20 rounded-lg text-error cursor-pointer transition-all"
                            title="ইনভয়েস ডিলিট (পাসওয়ার্ড দিন)"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-sm font-black text-text-light/40 italic">
                        কোন ইনভয়েস রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MODULE E: Income Analytics & Sector Breakdown --- */}
        {activeTab === 'income_summary' && (
          <div className="space-y-6 animate-fade-in text-left">
            {/* Header and Period Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-step-bg/30 p-5 rounded-[2rem] border border-border-main">
              <div>
                <h3 className="text-xl font-black text-text-main flex items-center gap-2">
                  <PieChart className="text-primary" size={22} /> ফি সংগ্রহ খাতওয়ারি আয় পর্যবেক্ষণ ও সামারি
                </h3>
                <p className="text-xs font-bold text-text-light/60 mt-0.5">
                  আদায়কৃত ফি সমূহের খাত ও জামাতভিত্তিক রিয়েল-টাইম আয়ের সামারি
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-card border border-border-main rounded-xl px-3 py-2 shadow-xs">
                  <Calendar size={15} className="text-primary shrink-0" />
                  <span className="text-xs font-bold text-text-light/70 whitespace-nowrap">মাসিক ফিল্টার:</span>
                  <select 
                    className="bg-transparent text-xs font-black outline-none cursor-pointer text-text-main"
                    value={summaryMonthFilter}
                    onChange={(e) => setSummaryMonthFilter(e.target.value)}
                  >
                    <option value="all">সকল মাস (পুরো বছর)</option>
                    {monthsList.map((m, idx) => (
                      <option key={m} value={m}>
                        {m} {idx === new Date().getMonth() ? '(চলতি মাস)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-card border border-border-main rounded-xl px-3 py-2 shadow-xs">
                  <Layers size={15} className="text-primary shrink-0" />
                  <span className="text-xs font-bold text-text-light/70 whitespace-nowrap">জামাত:</span>
                  <select 
                    className="bg-transparent text-xs font-black outline-none cursor-pointer text-text-main"
                    value={jamatFilter}
                    onChange={(e) => setJamatFilter(e.target.value)}
                  >
                    <option value="all">সকল জামাত</option>
                    {JAMAT_LIST.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Metric KPI Cards */}
            {(() => {
              const matchedInvs = invoices.filter(inv => {
                const matchesJamat = jamatFilter === 'all' || inv.studentClass === jamatFilter;
                let matchesMonth = true;
                if (summaryMonthFilter !== 'all') {
                  if (inv.month) {
                    matchesMonth = inv.month === summaryMonthFilter;
                  } else if (inv.date) {
                    const d = new Date(inv.date);
                    if (!isNaN(d.getTime())) {
                      const mName = monthsList[d.getMonth()];
                      matchesMonth = (mName === summaryMonthFilter);
                    }
                  }
                }
                return matchesJamat && matchesMonth;
              });

              const totalInc = matchedInvs.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
              const totalDisc = matchedInvs.reduce((sum, inv) => sum + (inv.discount || 0), 0);
              const totalDue = matchedInvs.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
              const totalNet = matchedInvs.reduce((sum, inv) => sum + (inv.netAmount || 0), 0);

              // Aggregate by fee head
              const sectorMap: Record<string, { collected: number; discount: number; count: number }> = {};
              matchedInvs.forEach(inv => {
                (inv.items || []).forEach((item: InvoiceItem) => {
                  const hName = item.headName || 'অন্যান্য';
                  if (!sectorMap[hName]) {
                    sectorMap[hName] = { collected: 0, discount: 0, count: 0 };
                  }
                  sectorMap[hName].collected += (item.amount || 0);
                  sectorMap[hName].discount += (item.discount || 0);
                  sectorMap[hName].count += 1;
                });
              });

              // Aggregate by Jamat
              const jamatSummaryMap: Record<string, { count: number; net: number; paid: number; discount: number; due: number }> = {};
              matchedInvs.forEach(inv => {
                const jName = inv.studentClass || 'অন্যান্য';
                if (!jamatSummaryMap[jName]) {
                  jamatSummaryMap[jName] = { count: 0, net: 0, paid: 0, discount: 0, due: 0 };
                }
                jamatSummaryMap[jName].count += 1;
                jamatSummaryMap[jName].net += (inv.netAmount || 0);
                jamatSummaryMap[jName].paid += (inv.paidAmount || 0);
                jamatSummaryMap[jName].discount += (inv.discount || 0);
                jamatSummaryMap[jName].due += (inv.dueAmount || 0);
              });

              return (
                <div className="space-y-8">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 bg-card border border-border-main rounded-2xl">
                      <p className="text-[10px] font-black text-text-light/50 uppercase tracking-widest mb-1">সর্বমোট আদায়কৃত আয়</p>
                      <h4 className="text-2xl font-black text-success">৳{enToBnNumber(totalInc)}</h4>
                      <p className="text-[10px] font-bold text-text-light/40 mt-1">মোট রসিদ: {enToBnNumber(matchedInvs.length)} টি</p>
                    </div>
                    <div className="p-5 bg-card border border-border-main rounded-2xl">
                      <p className="text-[10px] font-black text-text-light/50 uppercase tracking-widest mb-1">মোট প্রদানকৃত ছাড় (Discount)</p>
                      <h4 className="text-2xl font-black text-indigo-500">৳{enToBnNumber(totalDisc)}</h4>
                      <p className="text-[10px] font-bold text-text-light/40 mt-1">প্যাকেজ ছাড় অটো হিসাবকৃত</p>
                    </div>
                    <div className="p-5 bg-card border border-border-main rounded-2xl">
                      <p className="text-[10px] font-black text-text-light/50 uppercase tracking-widest mb-1">সর্বমোট অবশিষ্ট বকেয়া</p>
                      <h4 className="text-2xl font-black text-error">৳{enToBnNumber(totalDue)}</h4>
                      <p className="text-[10px] font-bold text-text-light/40 mt-1">শিক্ষার্থী লেজারে যুক্ত</p>
                    </div>
                    <div className="p-5 bg-card border border-border-main rounded-2xl">
                      <p className="text-[10px] font-black text-text-light/50 uppercase tracking-widest mb-1">সর্বমোট প্রদেয় বিল</p>
                      <h4 className="text-2xl font-black text-primary">৳{enToBnNumber(totalNet)}</h4>
                      <p className="text-[10px] font-bold text-text-light/40 mt-1">আদায় + বকেয়া মোট</p>
                    </div>
                  </div>

                  {/* Sector-wise Cards Grid */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-base font-black text-text-main flex items-center gap-2">
                        <BarChart3 size={18} className="text-primary" /> খাতের নাম অনুযায়ী বিস্তারিত আয়ের সারসংক্ষেপ
                      </h4>
                      <span className="text-xs font-bold text-text-light/50">মোট {enToBnNumber(Object.keys(sectorMap).length)} টি খাত</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(sectorMap).map(([headName, data]) => {
                        const pct = totalInc > 0 ? Math.round((data.collected / totalInc) * 100) : 0;
                        return (
                          <div key={headName} className="p-5 bg-card border border-border-main/70 hover:border-primary/40 rounded-2xl space-y-3 transition-all shadow-xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-extrabold text-sm text-text-main">{headName}</h5>
                                <span className="text-[10px] font-bold text-text-light/50">{enToBnNumber(data.count)} টি রসিদে অন্তর্ভুক্ত</span>
                              </div>
                              <span className="px-2.5 py-1 bg-primary/10 text-primary font-black text-[10px] rounded-full">
                                {enToBnNumber(pct)}%
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-text-light/60">আদায়কৃত টাকা:</span>
                                <span className="font-black text-success">৳{enToBnNumber(data.collected)}</span>
                              </div>
                              {data.discount > 0 && (
                                <div className="flex justify-between text-xs font-bold text-indigo-500">
                                  <span>মোট ছাড়:</span>
                                  <span>৳{enToBnNumber(data.discount)}</span>
                                </div>
                              )}
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-step-bg h-2 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                          </div>
                        );
                      })}

                      {Object.keys(sectorMap).length === 0 && (
                        <p className="col-span-3 text-center py-10 text-xs font-black text-text-light/40 italic">
                          কোনো আয়ের খাত রেকর্ড পাওয়া যায়নি।
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Jamat-Wise Summary Table */}
                  <div className="space-y-4 pt-4 border-t border-border-main">
                    <h4 className="text-base font-black text-text-main flex items-center gap-2">
                      <Layers size={18} className="text-primary" /> জামাতভিত্তিক মোট ফি আদায় ও সামারি
                    </h4>

                    <div className="overflow-x-auto border border-border-main rounded-2xl">
                      <table className="w-full border-collapse text-xs text-left">
                        <thead>
                          <tr className="bg-primary text-white font-black">
                            <th className="py-3.5 px-4">জামাত / শ্রেণী</th>
                            <th className="py-3.5 px-4">ইনভয়েস সংখ্যা</th>
                            <th className="py-3.5 px-4 text-right">সর্বমোট বিল</th>
                            <th className="py-3.5 px-4 text-right">মোট ছাড়</th>
                            <th className="py-3.5 px-4 text-right">আদায়কৃত ফি</th>
                            <th className="py-3.5 px-4 text-right">অবশিষ্ট বকেয়া</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-main/40 text-text-main font-semibold">
                          {Object.entries(jamatSummaryMap).map(([jName, jData]) => (
                            <tr key={jName} className="hover:bg-primary/[0.02]">
                              <td className="py-3.5 px-4 font-black text-primary">{jName}</td>
                              <td className="py-3.5 px-4">{enToBnNumber(jData.count)} টি</td>
                              <td className="py-3.5 px-4 text-right font-bold">৳{enToBnNumber(jData.net)}</td>
                              <td className="py-3.5 px-4 text-right font-bold text-indigo-500">৳{enToBnNumber(jData.discount)}</td>
                              <td className="py-3.5 px-4 text-right font-black text-success">৳{enToBnNumber(jData.paid)}</td>
                              <td className="py-3.5 px-4 text-right font-black text-error">৳{enToBnNumber(jData.due)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>
        )}

        {/* --- MODULE F: Fee Packages & Class Matrix --- */}
        {activeTab === 'packages' && (
          <div className="space-y-6 animate-fade-in text-left">
            <FeesCostPackageManager />
          </div>
        )}
      </div>

      {/* --- PREMIUM DUAL-COPY RECEIPT OVERLAY (PDF / Print layout) --- */}
      <AnimatePresence>
        {activeInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-xs select-none print:static print:bg-white print:p-0 print:block print:inset-auto print:overflow-visible">
            
            {/* Global print styles specifically for this modal */}
            <style>
              {`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #printable-receipt-container, #printable-receipt-container * {
                    visibility: visible;
                  }
                  #printable-receipt-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    background: white;
                    padding: 0 !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    border: none !important;
                  }
                  @page {
                    size: A4 portrait;
                    margin: 10mm;
                  }
                }
              `}
            </style>

            <motion.div 
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              className="relative w-full max-w-4xl bg-white border border-gray-200 shadow-2xl z-10 h-full sm:h-auto overflow-y-auto p-4 sm:p-8 rounded-none sm:rounded-[2rem] print:rounded-none print:shadow-none print:border-none print:h-auto print:overflow-visible"
              id="printable-receipt-container"
            >
              
              {/* Receipt Modal Controller (Hidden when printing) */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 print:hidden text-left">
                <div>
                  <h3 className="text-base font-black text-gray-800">পেমেন্ট রসিদ ভিউয়ার (প্রিন্ট ফ্রেন্ডলি)</h3>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">A4 paper format</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleDownloadA5PDF}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Download size={14} /> PDF ডাউনলোড
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black flex items-center gap-2 hover:scale-103 transition-all cursor-pointer"
                  >
                    <Printer size={14} /> প্রিন্ট/ডাউনলোড করুন
                  </button>
                  <button 
                    onClick={() => setActiveInvoice(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl text-xs font-black cursor-pointer transition-all"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>

              {/* Printable Content */}
              <div className="space-y-12">
                {[
                  { id: 'office', label: 'অফিস কপি' },
                  { id: 'student', label: 'শিক্ষার্থী কপি' }
                ].map((copy, copyIdx) => (
                  <div key={copyIdx} className={cn(
                    "p-6 sm:p-8 border-2 border-gray-200 rounded-3xl relative bg-white",
                    copyIdx > 0 ? "border-t-[3px] border-dashed border-t-gray-300 rounded-t-none pt-12 print:mt-8" : ""
                  )}>
                    
                    {/* Copy Name Badge */}
                    <div className="absolute -top-3.5 right-8 bg-gray-100 px-4 py-1.5 border border-gray-200 rounded-full text-[10px] font-black text-gray-600 uppercase tracking-widest shadow-sm">
                      {copy.label}
                    </div>

                    {/* Receipt Header */}
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        {madrasahBranding?.logoUrl ? (
                          <img 
                            src={madrasahBranding.logoUrl} 
                            alt="Logo" 
                            className="w-12 h-12 object-contain rounded-xl border border-gray-100 p-0.5 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
                            ম
                          </div>
                        )}
                          <div>
                            <h2 className="text-lg font-black text-gray-900 leading-tight">
                              {madrasahBranding?.madrasahName || 'দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা'}
                            </h2>
                            <p className="text-[10px] font-bold text-gray-500 mt-1.5 uppercase tracking-widest">নয়া কান্দারগাঁও, লুটেরচর-৩৫১৬, মেঘনা, কুমিল্লা।</p>
                          </div>
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-black text-primary leading-none uppercase tracking-widest py-1.5 px-4 bg-primary/10 rounded-xl border border-primary/20 inline-block">মানি রসিদ (Receipt)</h4>
                        <p className="text-[10px] font-mono font-bold text-gray-500 mt-2">ইনভয়েস: <span className="text-gray-900 font-black text-xs">{activeInvoice.invoiceNo}</span></p>
                      </div>
                    </div>

                    {/* Student Info rows */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 mb-8 text-xs border-y border-gray-100 py-5">
                      <div>
                        <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest block mb-0.5">শিক্ষার্থীর নাম</span>
                        <span className="font-black text-gray-900 text-sm">{activeInvoice.studentName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest block mb-0.5">জামাত ও শাখা</span>
                        <span className="font-black text-gray-900 text-sm">{activeInvoice.studentClass} <span className="text-gray-400 font-semibold">(শাখা: {activeInvoice.studentBranch})</span></span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest block mb-0.5">রোল ও আইডি</span>
                        <span className="font-black text-gray-900 text-sm">রোল: {enToBnNumber(activeInvoice.studentRoll)} <span className="text-primary mx-1">|</span> #{enToBnNumber(String(activeInvoice.studentId || '').slice(-6))}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest block mb-0.5">তারিখ ও সময়</span>
                        <span className="font-black text-gray-900 text-sm">{activeInvoice.date} <span className="text-gray-400 font-semibold">({activeInvoice.month}, {activeInvoice.year})</span></span>
                      </div>
                    </div>

                    {/* Items table */}
                    <table className="w-full border-collapse mb-8 text-xs">
                      <thead>
                        <tr className="bg-gray-50/80 border-y border-gray-200">
                          <th className="py-3 px-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">ক্রমিক</th>
                          <th className="py-3 px-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">ফি-এর খাত</th>
                          <th className="py-3 px-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">নির্ধারিত</th>
                          <th className="py-3 px-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">ছাড়</th>
                          <th className="py-3 px-4 text-right font-black text-gray-900 uppercase tracking-widest text-[10px] bg-gray-100">আদায়কৃত</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activeInvoice.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-4 font-bold text-gray-400 text-[10px]">{enToBnNumber(idx + 1)}</td>
                            <td className="py-3 px-4 font-black text-gray-800">{item.headName}</td>
                            <td className="py-3 px-4 text-right font-bold text-gray-500">৳{enToBnNumber(item.defaultRate || item.amount)}</td>
                            <td className="py-3 px-4 text-right font-bold text-indigo-400">৳{enToBnNumber(item.discount || 0)}</td>
                            <td className="py-3 px-4 text-right font-black text-gray-900 bg-gray-50/50">৳{enToBnNumber(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Calculations summary row */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 text-xs border-t-2 border-gray-100 pt-6 mb-8">
                      <div className="w-full md:max-w-xs space-y-2">
                        <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                          <span className="text-gray-400 font-bold block mb-1 text-[10px] uppercase tracking-widest">কথায় (In Words)</span>
                          <p className="text-xs font-black text-gray-800">
                            {numberToBanglaWords(activeInvoice.paidAmount)}
                          </p>
                        </div>
                        {activeInvoice.comment && (
                          <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                            <span className="text-gray-400 font-bold block mb-0.5 text-[9px] uppercase tracking-widest">মন্তব্য</span>
                            <p className="text-[11px] font-semibold text-gray-600">
                              {activeInvoice.comment}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="w-full md:w-72 space-y-2.5 text-right font-semibold">
                        <div className="flex justify-between items-center text-gray-500">
                          <span>আইটেম মোট:</span>
                          <span className="text-gray-800 font-black">৳{enToBnNumber(activeInvoice.subtotal)}</span>
                        </div>
                        {activeInvoice.previousDue > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">পূর্ববর্তী বকেয়া:</span>
                            <span className="text-red-500 font-black bg-red-500/10 px-2 py-0.5 rounded-md">৳{enToBnNumber(activeInvoice.previousDue)}</span>
                          </div>
                        )}
                        {activeInvoice.discount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-indigo-400">সর্বমোট ছাড়:</span>
                            <span className="text-indigo-500 font-black">৳{enToBnNumber(activeInvoice.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm font-black pt-3 border-t-2 border-gray-900 text-gray-900">
                          <span>পরিশোধিত টাকা:</span>
                          <span className="text-lg">৳{enToBnNumber(activeInvoice.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center font-black text-gray-500 pt-1">
                          <span>অবशिष्ट বকেয়া:</span>
                          <span className="text-red-500">৳{enToBnNumber(activeInvoice.dueAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Signatures Row */}
                    <div className="flex justify-between items-end pt-12 text-[10px] text-gray-400 font-black uppercase tracking-widest select-none px-4">
                      <div className="text-center w-28">
                        <div className="border-t-2 border-gray-200 pt-2 text-gray-500">শিক্ষার্থীর স্বাক্ষর</div>
                      </div>
                      <div className="text-center w-28">
                        <div className="border-t-2 border-gray-200 pt-2 text-gray-500">হিসাবরক্ষক</div>
                      </div>
                      <div className="text-center w-28">
                        <div className="border-t-2 border-gray-200 pt-2 text-gray-500">ভারপ্রাপ্ত মুহতামিম</div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}</AnimatePresence>

      {/* --- PASSWORD VERIFICATION MODAL FOR DELETE --- */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-card border border-border-main shadow-2xl rounded-3xl p-6 text-left"
            >
              <div className="flex items-center gap-3 text-error mb-4">
                <div className="p-3 bg-error/10 rounded-2xl">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-main leading-tight">ইনভয়েস ডিলিট যাচাইকরণ</h3>
                  <p className="text-xs text-text-light/60 font-semibold">নিরাপত্তার জন্য আপনার লগইন পাসওয়ার্ড টাইপ করুন</p>
                </div>
              </div>

              <p className="text-xs text-text-light/80 mb-4 font-medium leading-relaxed bg-step-bg/40 p-3 rounded-xl border border-border-main/40">
                আপনি কি নিশ্চিত যে এই ইনভয়েসটি মুছে ফেলতে চান? ডিলিট করার জন্য ইউজার পাসওয়ার্ড দিয়ে ভেরিফাই করুন।
              </p>

              <form onSubmit={handleConfirmDelete} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-text-main block mb-1.5">ইউজার পাসওয়ার্ড (Password):</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="পাসওয়ার্ড লিখুন..."
                      value={deletePasswordInput}
                      onChange={(e) => {
                        setDeletePasswordInput(e.target.value);
                        setDeletePasswordError('');
                      }}
                      className="w-full px-4 py-2.5 pr-10 bg-step-bg border border-border-main focus:border-error rounded-xl text-xs font-bold outline-none text-text-main"
                      autoFocus
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light/40 hover:text-text-main transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {deletePasswordError && (
                    <p className="text-[11px] font-black text-error mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} /> {deletePasswordError}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteTargetId(null);
                      setDeletePasswordInput('');
                      setDeletePasswordError('');
                    }}
                    className="px-4 py-2.5 bg-step-bg hover:bg-border-main/20 text-text-main text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-error hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> যাচাই পূর্বক ডিলিট
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PASSWORD VERIFICATION MODAL FOR EDIT --- */}
      <AnimatePresence>
        {showEditPasswordModal && editingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-card border border-border-main shadow-2xl rounded-3xl p-6 text-left"
            >
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-main leading-tight">ইনভয়েস সম্পাদনা যাচাইকরণ</h3>
                  <p className="text-xs text-text-light/60 font-semibold">নিরাপত্তার জন্য আপনার লগইন পাসওয়ার্ড টাইপ করুন</p>
                </div>
              </div>

              <p className="text-xs text-text-light/80 mb-4 font-medium leading-relaxed bg-step-bg/40 p-3 rounded-xl border border-border-main/40">
                ইনভয়েস <span className="font-mono font-black text-primary">#{editingInvoice.invoiceNo}</span> সম্পাদনা (Edit) করতে ইউজার পাসওয়ার্ড দিয়ে ভেরিফাই করুন।
              </p>

              <form onSubmit={handleConfirmEditPassword} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-text-main block mb-1.5">ইউজার পাসওয়ার্ড (Password):</label>
                  <div className="relative">
                    <input 
                      type={showEditPassword ? "text" : "password"}
                      placeholder="পাসওয়ার্ড লিখুন..."
                      value={editPasswordInput}
                      onChange={(e) => {
                        setEditPasswordInput(e.target.value);
                        setEditPasswordError('');
                      }}
                      className="w-full px-4 py-2.5 pr-10 bg-step-bg border border-border-main focus:border-amber-500 rounded-xl text-xs font-bold outline-none text-text-main"
                      autoFocus
                    />
                    <button 
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light/40 hover:text-text-main transition-colors cursor-pointer"
                    >
                      {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {editPasswordError && (
                    <p className="text-[11px] font-black text-error mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} /> {editPasswordError}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowEditPasswordModal(false);
                      setEditingInvoice(null);
                      setEditPasswordInput('');
                      setEditPasswordError('');
                    }}
                    className="px-4 py-2.5 bg-step-bg hover:bg-border-main/20 text-text-main text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Edit size={14} /> যাচাই পূর্বক এডিট
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT INVOICE FORM MODAL --- */}
      <AnimatePresence>
        {showEditInvoiceModal && editingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border-main shadow-2xl rounded-3xl p-6 text-left custom-scrollbar"
            >
              <div className="flex justify-between items-start pb-4 border-b border-border-main mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
                    <Edit size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-text-main leading-tight">
                      ইনভয়েস তথ্য এডিট ও সংশোধন ({editingInvoice.invoiceNo})
                    </h3>
                    <p className="text-xs text-text-light/60 font-semibold mt-0.5">
                      শিক্ষার্থী: {editingInvoice.studentName} | রোল: {enToBnNumber(editingInvoice.studentRoll)} | জামাত: {editingInvoice.studentClass}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowEditInvoiceModal(false);
                    setEditingInvoice(null);
                  }}
                  className="p-2 hover:bg-step-bg rounded-xl text-text-light/50 hover:text-text-main transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveInvoiceEdit} className="space-y-5 text-xs">
                {/* Date & Period */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-step-bg/50 p-4 rounded-2xl border border-border-main/50">
                  <div>
                    <label className="font-black text-text-main block mb-1">ইনভয়েস তারিখ:</label>
                    <input 
                      type="date"
                      value={editFormDate}
                      onChange={(e) => setEditFormDate(e.target.value)}
                      className="w-full px-3 py-2 bg-card border border-border-main rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-black text-text-main block mb-1">পরিশোধের মাস:</label>
                    <select 
                      value={editFormMonth}
                      onChange={(e) => setEditFormMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-card border border-border-main rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 text-text-main cursor-pointer"
                    >
                      {monthsList.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-black text-text-main block mb-1">বছর:</label>
                    <input 
                      type="text"
                      value={editFormYear}
                      onChange={(e) => setEditFormYear(e.target.value)}
                      className="w-full px-3 py-2 bg-card border border-border-main rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                      required
                    />
                  </div>
                </div>

                {/* Items Edit List */}
                <div className="space-y-3">
                  <h4 className="font-black text-text-main text-xs flex items-center justify-between">
                    <span>খাতভিত্তিক ফি বিবরণী (Items)</span>
                    <span className="text-[10px] text-text-light/60">আইটেমের টাকা ও মাস সংশোধন করুন</span>
                  </h4>
                  
                  <div className="border border-border-main rounded-xl overflow-hidden divide-y divide-border-main/50 bg-card">
                    {editFormItems.map((item, idx) => (
                      <div key={idx} className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center hover:bg-step-bg/30">
                        <div>
                          <p className="font-black text-text-main">{item.headName}</p>
                        </div>
                        <div>
                          <label className="text-[10px] text-text-light/60 block font-bold">মাস:</label>
                          <select 
                            value={item.month || editFormMonth}
                            onChange={(e) => {
                              const updated = [...editFormItems];
                              updated[idx].month = e.target.value;
                              setEditFormItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-step-bg border border-border-main rounded-lg text-xs font-bold outline-none text-text-main"
                          >
                            {monthsList.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-text-light/60 block font-bold">টাকার পরিমাণ (৳):</label>
                          <input 
                            type="number"
                            value={item.amount}
                            onChange={(e) => {
                              const updated = [...editFormItems];
                              updated[idx].amount = Number(e.target.value) || 0;
                              setEditFormItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-step-bg border border-border-main rounded-lg text-xs font-bold outline-none text-text-main"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculation Summary & Payment Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-step-bg/50 p-4 rounded-2xl border border-border-main/50">
                  <div className="space-y-3">
                    <div>
                      <label className="font-black text-text-main block mb-1">মোট ছাড় (Discount ৳):</label>
                      <input 
                        type="number"
                        value={editFormDiscount}
                        onChange={(e) => setEditFormDiscount(e.target.value)}
                        className="w-full px-3 py-2 bg-card border border-border-main rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                      />
                    </div>
                    <div>
                      <label className="font-black text-text-main block mb-1">জমা/আদায়কৃত টাকা (Paid Amount ৳):</label>
                      <input 
                        type="number"
                        value={editFormPaidAmount}
                        onChange={(e) => setEditFormPaidAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-card border border-border-main rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-card p-3.5 rounded-xl border border-border-main space-y-2 flex flex-col justify-center">
                    {(() => {
                      const sub = editFormItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                      const disc = Number(editFormDiscount) || 0;
                      const net = Math.max(0, sub - disc);
                      const paid = Number(editFormPaidAmount) || 0;
                      const due = Math.max(0, net - paid);

                      return (
                        <>
                          <div className="flex justify-between text-text-light">
                            <span>সাবটোটাল:</span>
                            <span className="font-bold">৳{enToBnNumber(sub)}</span>
                          </div>
                          <div className="flex justify-between text-indigo-500">
                            <span>ছাড়:</span>
                            <span className="font-bold">৳{enToBnNumber(disc)}</span>
                          </div>
                          <div className="flex justify-between font-black text-text-main border-t border-border-main/50 pt-1">
                            <span>নেট দেয় পরিমাণ:</span>
                            <span className="text-primary">৳{enToBnNumber(net)}</span>
                          </div>
                          <div className="flex justify-between font-black text-success">
                            <span>আদায়কৃত:</span>
                            <span>৳{enToBnNumber(paid)}</span>
                          </div>
                          <div className="flex justify-between font-black text-error">
                            <span>অবশিষ্ট বকেয়া:</span>
                            <span>৳{enToBnNumber(due)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Comment / Note */}
                <div>
                  <label className="font-black text-text-main block mb-1">মন্তব্য / নোট:</label>
                  <input 
                    type="text"
                    placeholder="পেমেন্ট সংক্রান্ত বিবরণ বা নোট..."
                    value={editFormComment}
                    onChange={(e) => setEditFormComment(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border-main rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t border-border-main/50">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowEditInvoiceModal(false);
                      setEditingInvoice(null);
                    }}
                    className="px-4 py-2.5 bg-step-bg hover:bg-border-main/20 text-text-main text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={15} /> আপডেট সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MASTER VIEW MODAL --- */}
      <AnimatePresence>
        {masterViewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-border-main shadow-2xl rounded-3xl p-6 text-left custom-scrollbar"
            >
              <div className="flex justify-between items-start pb-4 border-b border-border-main mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-500/10 text-sky-600 rounded-2xl border border-sky-500/20">
                    <Eye size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-text-main leading-tight">ফি সংগ্রহের সামগ্রিক বিবরণ (Master Summary)</h3>
                    <p className="text-xs text-text-light/60 font-medium">নির্ধারিত খাতের রেট, ছাড় ও চূড়ান্ত পরিশোধ্য হিসাবের তালিকা</p>
                  </div>
                </div>
                <button 
                  onClick={() => setMasterViewModalOpen(false)}
                  className="p-2 hover:bg-step-bg rounded-xl text-text-light/50 hover:text-text-main transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Student Header */}
              {colStudent && (
                <div className="bg-step-bg/60 p-4 rounded-2xl border border-border-main/60 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-black text-text-light/50 uppercase tracking-widest block">শিক্ষার্থীর নাম</span>
                    <span className="font-extrabold text-text-main text-sm">{colStudent['শিক্ষার্থীর নাম'] || colStudent.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-text-light/50 uppercase tracking-widest block">জামাত ও শাখা</span>
                    <span className="font-bold text-text-main">{colStudent['জামাত/শ্রেণী'] || colStudent.class} ({colStudent['শাখা'] || colStudent.branch || 'ক'})</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-text-light/50 uppercase tracking-widest block">আইডি / রোল</span>
                    <span className="font-bold text-text-main">#{enToBnNumber(colStudentId)} | রোল: {enToBnNumber(colStudent['রোল নম্বর'] || colStudent.roll || '১')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-text-light/50 uppercase tracking-widest block">রিয়েলটাইম তারিখ ও সময়</span>
                    <span className="font-extrabold text-primary">{liveDateTimeInfo.dayName}, {liveDateTimeInfo.formattedTime}</span>
                  </div>
                </div>
              )}

              {/* Items Breakdown Table */}
              <div className="overflow-x-auto border border-border-main rounded-xl mb-4">
                <table className="w-full text-xs text-left">
                  <thead className="bg-step-bg text-text-light/70 font-black border-b border-border-main text-[11px] uppercase">
                    <tr>
                      <th className="p-3">ক্রম</th>
                      <th className="p-3">ফি-এর খাত</th>
                      <th className="p-3">মাস</th>
                      <th className="p-3 text-right">নির্ধারিত ফি</th>
                      <th className="p-3 text-right">আদায়কৃত</th>
                      <th className="p-3 text-right">ছাড়</th>
                      <th className="p-3 text-right">নীট আয়</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main/40 font-bold">
                    {colItems.map((item, idx) => {
                      const net = Math.max(0, item.amount - (item.discount || 0));
                      return (
                        <tr key={idx} className="hover:bg-step-bg/30">
                          <td className="p-3 font-mono text-text-light/50">{enToBnNumber(idx + 1)}</td>
                          <td className="p-3 font-extrabold text-text-main">{item.headName || '—'}</td>
                          <td className="p-3 text-primary">{item.month || colMonth}</td>
                          <td className="p-3 text-right text-text-light/60">৳{enToBnNumber(item.defaultRate)}</td>
                          <td className="p-3 text-right font-black text-emerald-600">৳{enToBnNumber(item.amount)}</td>
                          <td className="p-3 text-right text-indigo-600">৳{enToBnNumber(item.discount || 0)}</td>
                          <td className="p-3 text-right font-black text-text-main">৳{enToBnNumber(net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Calculation Summary Footer */}
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-black text-text-light/50 uppercase tracking-widest block">মোট খাত সংখ্যা</span>
                  <span className="font-extrabold text-text-main text-sm">{enToBnNumber(colItems.length)}টি</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-text-light/50 uppercase tracking-widest block">সাব-টোটাল (বিল)</span>
                  <span className="font-extrabold text-text-main text-sm">৳{enToBnNumber(collectionCalculations.subtotal)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-text-light/50 uppercase tracking-widest block">মোট ছাড়</span>
                  <span className="font-extrabold text-indigo-600 text-sm">৳{enToBnNumber(collectionCalculations.discount)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-text-light/50 uppercase tracking-widest block">পরিশোধের চূড়ান্ত পরিমাণ</span>
                  <span className="font-black text-primary text-base">৳{enToBnNumber(collectionCalculations.netBill)}</span>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setMasterViewModalOpen(false)}
                  className="px-5 py-2.5 bg-primary text-white font-black text-xs rounded-xl hover:bg-primary/90 transition-all cursor-pointer shadow-md"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MASTER BULK EDIT MODAL --- */}
      <AnimatePresence>
        {bulkEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-card border border-border-main shadow-2xl rounded-3xl p-6 text-left"
            >
              <div className="flex justify-between items-start pb-4 border-b border-border-main mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
                    <Edit size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-text-main leading-tight">মাস্টার এডিট (Master Bulk Edit)</h3>
                    <p className="text-xs text-text-light/60 font-medium">
                      {selectedRowIndices.length > 0 
                        ? `নির্বাচিত ${enToBnNumber(selectedRowIndices.length)}টি খাতের তথ্য একসাথে এডিট করুন` 
                        : 'টেবিলের সকল খাতের তথ্য একসাথে এডিট করুন'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setBulkEditModalOpen(false)}
                  className="p-2 hover:bg-step-bg rounded-xl text-text-light/50 hover:text-text-main transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-black text-text-main block mb-1">পরিশোধের মাস সেট করুন (সবগুলোর জন্য):</label>
                  <select 
                    value={bulkMonth}
                    onChange={(e) => setBulkMonth(e.target.value)}
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                  >
                    <option value="">(পরিবর্তন না করলে যা আছে থাকবে)</option>
                    {monthsList.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-text-main block mb-1">ছাড়ের পরিমাণ (৳) সেট করুন:</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="নতুন ছাড়ের টাকা টাইপ করুন..."
                    value={bulkDiscount}
                    onChange={(e) => setBulkDiscount(e.target.value)}
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-[10px] text-text-light/50 block mt-1">ফাঁকা রাখলে ছাড় পরিবর্তিত হবে না।</span>
                </div>

                <div>
                  <label className="text-xs font-black text-text-main block mb-1">পরিশোধিত পরিমাণ (৳) সেট করুন:</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="নতুন আদায়ের টাকা টাইপ করুন..."
                    value={bulkAmount}
                    onChange={(e) => setBulkAmount(e.target.value)}
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-[10px] text-text-light/50 block mt-1">ফাঁকা রাখলে বর্তমান টাকা অপরিবর্তিত থাকবে।</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-main">
                <button
                  type="button"
                  onClick={() => setBulkEditModalOpen(false)}
                  className="px-4 py-2.5 bg-step-bg text-text-main font-black text-xs rounded-xl hover:bg-border-main/20 transition-all cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkEdit}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> পরিবর্তন প্রয়োগ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SINGLE ROW VIEW MODAL --- */}
      <AnimatePresence>
        {rowViewModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-card border border-border-main shadow-2xl rounded-3xl p-6 text-left"
            >
              <div className="flex justify-between items-start pb-3 border-b border-border-main mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-500/10 text-sky-600 rounded-2xl border border-sky-500/20">
                    <Eye size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-text-main leading-tight">খাতভিত্তিক বিস্তারিত বিবরণ</h3>
                    <p className="text-xs text-text-light/60 font-medium">আইটেম #{enToBnNumber(rowViewModalItem.index + 1)} এর তথ্য</p>
                  </div>
                </div>
                <button 
                  onClick={() => setRowViewModalItem(null)}
                  className="p-2 hover:bg-step-bg rounded-xl text-text-light/50 hover:text-text-main transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs mb-6 bg-step-bg/40 p-4 rounded-2xl border border-border-main/50">
                <div className="flex justify-between items-center py-1 border-b border-border-main/40">
                  <span className="text-text-light/60 font-bold">খাতের নাম:</span>
                  <span className="font-extrabold text-text-main text-sm">{rowViewModalItem.item.headName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border-main/40">
                  <span className="text-text-light/60 font-bold">পরিশোধের মাস:</span>
                  <span className="font-black text-primary">{rowViewModalItem.item.month || colMonth}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border-main/40">
                  <span className="text-text-light/60 font-bold">নির্ধারিত জামাত ফি:</span>
                  <span className="font-bold text-text-main">৳{enToBnNumber(rowViewModalItem.item.defaultRate)}</span>
                </div>
                {rowViewModalItem.item.assignedRate !== rowViewModalItem.item.defaultRate && (
                  <div className="flex justify-between items-center py-1 border-b border-border-main/40">
                    <span className="text-text-light/60 font-bold">শিক্ষার্থী চুক্তি ফি:</span>
                    <span className="font-black text-emerald-600">৳{enToBnNumber(rowViewModalItem.item.assignedRate)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1 border-b border-border-main/40">
                  <span className="text-text-light/60 font-bold">আদায়কৃত টাকা:</span>
                  <span className="font-black text-emerald-600">৳{enToBnNumber(rowViewModalItem.item.amount)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border-main/40">
                  <span className="text-text-light/60 font-bold">বিশেষ ছাড়:</span>
                  <span className="font-black text-indigo-600">৳{enToBnNumber(rowViewModalItem.item.discount || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-text-light/60 font-bold">রিয়েলটাইম সময়:</span>
                  <span className="font-mono text-primary font-bold">{liveDateTimeInfo.fullString}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setRowViewModalItem(null)}
                  className="px-5 py-2.5 bg-primary text-white font-black text-xs rounded-xl hover:bg-primary/90 transition-all cursor-pointer shadow-md"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SINGLE ROW EDIT MODAL --- */}
      <AnimatePresence>
        {rowEditModalIndex !== null && colItems[rowEditModalIndex] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-card border border-border-main shadow-2xl rounded-3xl p-6 text-left"
            >
              <div className="flex justify-between items-start pb-3 border-b border-border-main mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
                    <Edit size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-text-main leading-tight">খাত এডিট ও কাস্টমাইজ</h3>
                    <p className="text-xs text-text-light/60 font-medium">#{enToBnNumber(rowEditModalIndex + 1)} {colItems[rowEditModalIndex].headName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setRowEditModalIndex(null)}
                  className="p-2 hover:bg-step-bg rounded-xl text-text-light/50 hover:text-text-main transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-black text-text-main block mb-1">পরিশোধের মাস:</label>
                  <select 
                    value={colItems[rowEditModalIndex].month || colMonth}
                    onChange={(e) => handleItemMonthChange(rowEditModalIndex, e.target.value)}
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                  >
                    {monthsList.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-text-main block mb-1">আদায়ের পরিমাণ (৳):</label>
                  <input 
                    type="number"
                    min="0"
                    value={colItems[rowEditModalIndex].amount !== undefined ? colItems[rowEditModalIndex].amount : ''}
                    onChange={(e) => handleItemAmountChange(rowEditModalIndex, e.target.value)}
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-black text-text-main outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-text-main block mb-1">ছাড়ের পরিমাণ (৳):</label>
                  <input 
                    type="number"
                    min="0"
                    value={colItems[rowEditModalIndex].discount !== undefined ? colItems[rowEditModalIndex].discount : ''}
                    onChange={(e) => handleItemDiscountChange(rowEditModalIndex, e.target.value)}
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-main">
                <button
                  type="button"
                  onClick={() => setRowEditModalIndex(null)}
                  className="px-5 py-2.5 bg-primary text-white font-black text-xs rounded-xl hover:bg-primary/90 transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> সম্পন্ন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
