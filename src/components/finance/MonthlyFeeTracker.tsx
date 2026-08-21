import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Printer,
  Download,
  FileSpreadsheet,
  Send,
  UserCheck,
  UserX,
  CreditCard,
  Eye,
  Settings,
  ChevronRight,
  TrendingUp,
  PieChart,
  RefreshCw,
  X,
  FileText,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowUpDown,
  Building2,
  Users,
  ShieldCheck,
  Info,
  BadgePercent,
  TrendingDown,
  CalendarCheck,
  CalendarX,
  FileCheck2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useData } from '../../contexts/DataContext';
import { Student } from '../../types';
import { JAMAT_LIST, DEFAULT_BRANCHES } from '../../constants';
import { enToBnNumber, bnToEnNumber, cn } from '../../lib/utils';
import {
  BENGALI_MONTHS,
  YEARS_LIST,
  calculateMonthlyFeeLedger,
  StudentMonthLedgerRecord,
  getStudentBillingStartInfo,
  MonthLedgerSummary,
  FeeHeadMonthSummary
} from '../../utils/studentFeeTrackerUtils';
import { sendSMS } from '../../services/smsService';

interface MonthlyFeeTrackerProps {
  students: Student[];
  onNavigateToCollection?: (studentId: string) => void;
}

export const MonthlyFeeTracker: React.FC<MonthlyFeeTrackerProps> = ({
  students,
  onNavigateToCollection,
}) => {
  const { feeHeads, classFeeMapping, invoices, studentOverrides, updateData, madrasahBranding } = useData();

  // --- Date & Filter States ---
  const currentMonthName = useMemo(() => {
    const currentMonthIdx = new Date().getMonth();
    return BENGALI_MONTHS[currentMonthIdx] || 'জানুয়ারি';
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);
  const [selectedYear, setSelectedYear] = useState<string>('২০২৬');
  const [selectedJamat, setSelectedJamat] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // 'all' | 'residential' | 'non_residential' | 'day_care'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timingFilter, setTimingFilter] = useState<'all' | 'on_time' | 'late'>('all'); // On time (<=12th) vs Late (>12th)
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'partial' | 'unpaid' | 'discounts' | 'heads' | 'billing_start'>('all');

  // --- Modal & Action States ---
  const [selectedRecordForNotice, setSelectedRecordForNotice] = useState<StudentMonthLedgerRecord | null>(null);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<StudentMonthLedgerRecord | null>(null);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsTargetRecords, setSmsTargetRecords] = useState<StudentMonthLedgerRecord[]>([]);
  const [smsCustomText, setSmsCustomText] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Billing Start Setup Multi-Select State ---
  const [selectedStudentIdsForBilling, setSelectedStudentIdsForBilling] = useState<string[]>([]);
  const [bulkStartMonth, setBulkStartMonth] = useState<string>('জানুয়ারি');
  const [bulkStartYear, setBulkStartYear] = useState<string>('২০২৬');

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Calculate Full Month Ledger (for active month & year) ---
  const monthLedger: MonthLedgerSummary = useMemo(() => {
    return calculateMonthlyFeeLedger(
      students,
      invoices,
      feeHeads,
      classFeeMapping,
      selectedMonth,
      selectedYear,
      studentOverrides
    );
  }, [students, invoices, feeHeads, classFeeMapping, selectedMonth, selectedYear, studentOverrides]);

  // --- Filtered Records based on UI Filters (Jamat, Category, Search, Timing) ---
  const filteredRecords = useMemo(() => {
    return monthLedger.records.filter((rec) => {
      // Jamat Filter
      if (selectedJamat !== 'all' && rec.studentClass !== selectedJamat) {
        return false;
      }
      // Category Filter
      if (selectedCategory !== 'all' && rec.category !== selectedCategory) {
        return false;
      }

      // Timing Filter (সময়মতো vs দেরিতে পরিশোধ)
      if (timingFilter === 'on_time') {
        if (!rec.latestPaymentDate) return false;
        const dayMatch = rec.latestPaymentDate.match(/(\d{1,2})[\/\-\.]/);
        const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
        if (day > 12) return false;
      } else if (timingFilter === 'late') {
        if (!rec.latestPaymentDate) return false;
        const dayMatch = rec.latestPaymentDate.match(/(\d{1,2})[\/\-\.]/);
        const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
        if (day <= 12) return false;
      }

      // Tab Status Filter
      if (activeTab === 'paid' && (rec.paymentStatus !== 'paid' || rec.totalPaid <= 0)) {
        return false;
      }
      if (activeTab === 'partial' && rec.paymentStatus !== 'partial') {
        return false;
      }
      if (activeTab === 'unpaid' && (rec.paymentStatus !== 'unpaid' && rec.dueAmount <= 0)) {
        return false;
      }
      if (activeTab === 'discounts' && rec.totalDiscount <= 0) {
        return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = rec.studentName.toLowerCase().includes(q);
        const matchRoll = rec.studentRoll.toLowerCase().includes(q);
        const matchId = rec.studentId.toLowerCase().includes(q);
        const matchPhone = rec.studentPhone.toLowerCase().includes(q);
        const matchFather = rec.studentFather.toLowerCase().includes(q);
        const matchClass = rec.studentClass.toLowerCase().includes(q);
        return matchName || matchRoll || matchId || matchPhone || matchFather || matchClass;
      }

      return true;
    });
  }, [monthLedger.records, selectedJamat, selectedCategory, timingFilter, activeTab, searchQuery]);

  // --- Dynamic Summary Metrics strictly computed from filtered scope ---
  const dynamicStats = useMemo(() => {
    // Base pool of eligible records matching the demographic filters (Jamat & Category & Search)
    const basePool = monthLedger.records.filter((rec) => {
      if (selectedJamat !== 'all' && rec.studentClass !== selectedJamat) return false;
      if (selectedCategory !== 'all' && rec.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = rec.studentName.toLowerCase().includes(q);
        const matchRoll = rec.studentRoll.toLowerCase().includes(q);
        const matchId = rec.studentId.toLowerCase().includes(q);
        const matchPhone = rec.studentPhone.toLowerCase().includes(q);
        const matchFather = rec.studentFather.toLowerCase().includes(q);
        const matchClass = rec.studentClass.toLowerCase().includes(q);
        return matchName || matchRoll || matchId || matchPhone || matchFather || matchClass;
      }
      return true;
    });

    const eligibleCount = basePool.length;
    let totalExpectedGross = 0; // মোট ধার্য ফি (প্যাকেজ অনুযায়ী মোট ধার্য)
    let totalDiscount = 0;      // মোট ছাড়
    let totalNetPayable = 0;    // প্রকৃত প্রদেয় (ধার্য - ছাড়)
    let totalCollected = 0;     // মোট আদায়
    let totalDue = 0;           // মোট বকেয়া (ঘাটতি)
    let fullyPaidCount = 0;
    let partiallyPaidCount = 0;
    let unpaidCount = 0;
    let overdueCount = 0;
    let onTimePaidCount = 0;
    let latePaidCount = 0;

    let exemptCount = 0;

    basePool.forEach((r) => {
      totalExpectedGross += r.totalExpected;
      totalDiscount += r.totalDiscount;
      totalNetPayable += r.netPayable;
      totalCollected += r.totalPaid;
      totalDue += r.dueAmount;

      if (r.paymentStatus === 'paid' && r.totalPaid > 0) {
        fullyPaidCount++;
      } else if (r.paymentStatus === 'partial') {
        partiallyPaidCount++;
      } else if (r.paymentStatus === 'exempt') {
        exemptCount++;
      } else {
        unpaidCount++;
      }

      if (r.isOverdue) {
        overdueCount++;
      }

      if (r.latestPaymentDate) {
        const dayMatch = r.latestPaymentDate.match(/(\d{1,2})[\/\-\.]/);
        const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
        if (day <= 12) {
          onTimePaidCount++;
        } else {
          latePaidCount++;
        }
      }
    });

    const collectionRate = totalNetPayable > 0 ? Math.min(100, Math.round((totalCollected / totalNetPayable) * 100)) : (totalCollected > 0 ? 100 : 0);
    const dueRate = totalNetPayable > 0 ? Math.max(0, 100 - collectionRate) : 0;

    return {
      eligibleCount,
      totalExpectedGross,
      totalDiscount,
      totalNetPayable,
      totalCollected,
      totalDue,
      fullyPaidCount,
      partiallyPaidCount,
      unpaidCount,
      exemptCount,
      overdueCount,
      onTimePaidCount,
      latePaidCount,
      collectionRate,
      dueRate,
      discountStudentsCount: basePool.filter(r => r.totalDiscount > 0).length,
    };
  }, [monthLedger.records, selectedJamat, selectedCategory, searchQuery]);

  // --- Filtered Head Summaries ---
  const filteredHeadSummaries = useMemo(() => {
    const headMap: Record<string, { expected: number; discount: number; netPayable: number; collected: number; due: number; paidCount: number; unpaidCount: number }> = {};

    feeHeads.forEach((h) => {
      headMap[String(h.id)] = {
        expected: 0,
        discount: 0,
        netPayable: 0,
        collected: 0,
        due: 0,
        paidCount: 0,
        unpaidCount: 0,
      };
    });

    const basePool = monthLedger.records.filter((rec) => {
      if (selectedJamat !== 'all' && rec.studentClass !== selectedJamat) return false;
      if (selectedCategory !== 'all' && rec.category !== selectedCategory) return false;
      return true;
    });

    basePool.forEach((rec) => {
      rec.expectedItems.forEach((item) => {
        const hId = item.headId;
        if (!headMap[hId]) {
          headMap[hId] = { expected: 0, discount: 0, netPayable: 0, collected: 0, due: 0, paidCount: 0, unpaidCount: 0 };
        }
        const itemPaid = rec.paidHeadBreakdown[hId] || (rec.paymentStatus === 'paid' && rec.totalPaid > 0 ? item.netPayable : 0);
        const itemDue = Math.max(0, item.netPayable - itemPaid);

        headMap[hId].expected += item.defaultRate;
        headMap[hId].discount += item.discount;
        headMap[hId].netPayable += item.netPayable;
        headMap[hId].collected += Math.min(item.netPayable, itemPaid);
        headMap[hId].due += itemDue;

        if (itemPaid >= item.netPayable && item.netPayable > 0 && itemPaid > 0) {
          headMap[hId].paidCount++;
        } else {
          headMap[hId].unpaidCount++;
        }
      });
    });

    return feeHeads.map((h) => {
      const hId = String(h.id);
      const stat = headMap[hId] || { expected: 0, discount: 0, netPayable: 0, collected: 0, due: 0, paidCount: 0, unpaidCount: 0 };
      const colRate = stat.netPayable > 0 ? Math.min(100, Math.round((stat.collected / stat.netPayable) * 100)) : (stat.collected > 0 ? 100 : 0);

      return {
        headId: hId,
        headName: h.name,
        frequency: h.frequency || 'monthly_mandatory',
        applicableTo: h.applicableTo || 'all',
        totalExpected: stat.expected,
        totalDiscount: stat.discount,
        totalNetPayable: stat.netPayable,
        totalCollected: stat.collected,
        totalDue: stat.due,
        paidStudentsCount: stat.paidCount,
        unpaidStudentsCount: stat.unpaidCount,
        collectionRate: colRate,
      };
    });
  }, [feeHeads, monthLedger.records, selectedJamat, selectedCategory]);

  // --- Quick Status Collections ---
  const paidRecords = useMemo(() => filteredRecords.filter(r => r.paymentStatus === 'paid' && r.totalPaid > 0), [filteredRecords]);
  const partialRecords = useMemo(() => filteredRecords.filter(r => r.paymentStatus === 'partial'), [filteredRecords]);
  const unpaidRecords = useMemo(() => filteredRecords.filter(r => r.paymentStatus === 'unpaid' || (r.dueAmount > 0 && r.paymentStatus !== 'paid')), [filteredRecords]);

  // --- Handle Custom Billing Start Save for Single Student ---
  const handleSaveStudentBillingStart = async (studentId: string, month: string, year: string) => {
    try {
      const currentOverrides = studentOverrides || {};
      const updatedOverrides = {
        ...currentOverrides,
        [studentId]: {
          ...(currentOverrides[studentId] || {}),
          feeStartMonth: month,
          feeStartYear: year,
        },
      };
      await updateData('student_overrides', updatedOverrides);
      showToast('success', 'শিক্ষার্থীর বেতন শুরুর মাস ও বছর সফলভাবে আপডেট হয়েছে!');
    } catch (err) {
      console.error(err);
      showToast('error', 'সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  // --- Handle Bulk Billing Start Save ---
  const handleApplyBulkBillingStart = async () => {
    if (selectedStudentIdsForBilling.length === 0) {
      showToast('error', 'অনুগ্রহ করে অন্তত একজন শিক্ষার্থী নির্বাচন করুন।');
      return;
    }
    try {
      const currentOverrides = studentOverrides || {};
      const updatedOverrides = { ...currentOverrides };

      selectedStudentIdsForBilling.forEach((sId) => {
        updatedOverrides[sId] = {
          ...(updatedOverrides[sId] || {}),
          feeStartMonth: bulkStartMonth,
          feeStartYear: bulkStartYear,
        };
      });

      await updateData('student_overrides', updatedOverrides);
      setSelectedStudentIdsForBilling([]);
      showToast('success', `${enToBnNumber(selectedStudentIdsForBilling.length)} জন শিক্ষার্থীর বেতন শুরুর মাস (${bulkStartMonth} ${bulkStartYear}) সফলভাবে নির্ধারণ করা হয়েছে!`);
    } catch (err) {
      console.error(err);
      showToast('error', 'বাল্ক আপডেট ব্যর্থ হয়েছে।');
    }
  };

  // --- Open SMS Modal ---
  const handleOpenSmsModal = (target: StudentMonthLedgerRecord[] | StudentMonthLedgerRecord) => {
    const list = Array.isArray(target) ? target : [target];
    const validRecs = list.filter(r => r.studentPhone && r.studentPhone.trim().length >= 10);

    if (validRecs.length === 0) {
      showToast('error', 'নির্বাচিত শিক্ষার্থীদের কোনো বৈধ মোবাইল নম্বর পাওয়া যায়নি!');
      return;
    }

    setSmsTargetRecords(validRecs);
    if (validRecs.length === 1) {
      const r = validRecs[0];
      setSmsCustomText(
        `শ্রদ্ধেয় অভিভাবক, জামিয়া থেকে জানানো যাচ্ছে যে, আপনার সন্তান ${r.studentName} (রোল: ${enToBnNumber(r.studentRoll)}, জামাত: ${r.studentClass})-এর ${selectedMonth} ${selectedYear} মাসের ফি বাবদ মোট ৳${enToBnNumber(r.dueAmount)} টাকা বকেয়া রয়েছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন।`
      );
    } else {
      setSmsCustomText(
        `শ্রদ্ধেয় অভিভাবক, আপনার সন্তান [নাম]-এর ${selectedMonth} ${selectedYear} মাসের বকেয়া ফি ৳[টাকা] দ্রুত মাদ্রাসার অফিসে পরিশোধ করার জন্য অনুরোধ করা হলো। - জামিয়া মাদানিয়া`
      );
    }
    setSmsModalOpen(true);
  };

  // --- Send SMS Action ---
  const handleSendSmsAction = async () => {
    if (!smsCustomText.trim()) {
      showToast('error', 'মেসেজের বিবরণ লিখুন!');
      return;
    }
    setSmsSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const rec of smsTargetRecords) {
      try {
        let msg = smsCustomText
          .replace(/\[নাম\]/g, rec.studentName)
          .replace(/\[টাকা\]/g, enToBnNumber(rec.dueAmount))
          .replace(/\[রোল\]/g, enToBnNumber(rec.studentRoll))
          .replace(/\[জামাত\]/g, rec.studentClass)
          .replace(/\[মাস\]/g, selectedMonth);

        const res = await sendSMS(rec.studentPhone, msg);
        if (res.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        failCount++;
      }
    }

    setSmsSending(false);
    setSmsModalOpen(false);

    if (successCount > 0) {
      showToast('success', `${enToBnNumber(successCount)} জন অভিভাবকের মোবাইলে বকেয়া নোটিশ SMS সফলভাবে পাঠানো হয়েছে!`);
    } else {
      showToast('error', 'SMS পাঠানো ব্যর্থ হয়েছে। অনুগ্রহ করে সেটিংস চেক করুন।');
    }
  };

  // --- Export to Excel ---
  const handleExportExcel = () => {
    const data = filteredRecords.map((r, i) => ({
      'ক্রমিক': i + 1,
      'শিক্ষার্থীর নাম': r.studentName,
      'রোল নং': r.studentRoll,
      'জামাত / শ্রেণী': r.studentClass,
      'শাখা/ক্যাটাগরি': r.categoryLabel,
      'বেতন শুরুর মাস': `${r.billingStartInfo.startMonth} ${r.billingStartInfo.startYear}`,
      'পিতার নাম': r.studentFather,
      'মোবাইল নং': r.studentPhone,
      'মূল ধার্য ফি (৳)': r.totalExpected,
      'বিশেষ ছাড় (৳)': r.totalDiscount,
      'প্রকৃত প্রদেয় (৳)': r.netPayable,
      'আদায়কৃত টাকা (৳)': r.totalPaid,
      'অবশিষ্ট বকেয়া (৳)': r.dueAmount,
      'পরিশোধের অবস্থা':
        r.paymentStatus === 'paid'
          ? 'পরিশোধিত'
          : r.paymentStatus === 'partial'
          ? 'আংশিক পরিশোধিত'
          : r.paymentStatus === 'exempt'
          ? 'মওকুফ'
          : 'বকেয়া',
      'সর্বশেষ ইনভয়েস': r.latestInvoiceNo || '-',
      'সর্বশেষ আদায়ের তারিখ': r.latestPaymentDate || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${selectedMonth}_${selectedYear}_ফি_খতিয়ান`);
    XLSX.writeFile(wb, `Student_Fees_${selectedMonth}_${selectedYear}.xlsx`);
    showToast('success', 'Excel ফাইল সফলভাবে ডাউনলোড হয়েছে!');
  };

  // --- Export to PDF ---
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      doc.setFontSize(14);
      doc.text(`Monthly Fee Collection & Due Ledger - ${selectedMonth} ${selectedYear}`, 14, 18);
      doc.setFontSize(9);
      doc.text(`Madrasah: ${madrasahBranding?.madrasahName || 'Jamia Islamia'} | Generated: ${new Date().toLocaleString()}`, 14, 24);

      const tableColumn = [
        'SL',
        'Student Name',
        'Roll',
        'Class',
        'Category',
        'Gross Rate',
        'Discount',
        'Net Payable',
        'Paid (TK)',
        'Due (TK)',
        'Status',
        'Phone'
      ];

      const tableRows = filteredRecords.map((r, i) => [
        (i + 1).toString(),
        r.studentName,
        r.studentRoll,
        r.studentClass,
        r.categoryLabel,
        r.totalExpected.toString(),
        r.totalDiscount.toString(),
        r.netPayable.toString(),
        r.totalPaid.toString(),
        r.dueAmount.toString(),
        r.paymentStatus.toUpperCase(),
        r.studentPhone || '-'
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 28,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [13, 85, 92] },
      });

      doc.save(`Monthly_Fee_Ledger_${selectedMonth}_${selectedYear}.pdf`);
      showToast('success', 'PDF ফাইল সফলভাবে তৈরি হয়েছে!');
    } catch (e) {
      console.error(e);
      showToast('error', 'PDF তৈরিতে সমস্যা হয়েছে। প্রিন্ট অপশন ব্যবহার করুন।');
    }
  };

  // --- Trigger Browser Print for Official Pad View ---
  const handlePrintOfficialPad = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 font-hind-siliguri text-left w-full min-w-0 pb-16">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 max-w-md",
              toast.type === 'success'
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 bg-white"
                : "bg-rose-500/10 border-rose-500/30 text-rose-700 bg-white"
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            )}
            <span className="text-xs font-bold">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TOP HEADER & CONTROLS --- */}
      <div className="p-5 bg-card border border-border-main rounded-xl shadow-sm relative overflow-hidden flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border-main/50 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20 shadow-inner">
                <Calendar size={24} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
                  মাসিক বেতন ও ফি খতিয়ান
                  <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-black border border-primary/20">
                    রিয়েলটাইম লাইভ ট্র্যাকার
                  </span>
                </h2>
                <p className="text-xs text-text-light/70 font-semibold mt-0.5">
                  শিক্ষার্থীদের বেতন শুরুর মাস ভিত্তিক ধার্য, আদায়কৃত ফি, ছাড়ের সামারি, অবশিষ্ট বকেয়া ও খাতওয়ারি পর্যবেক্ষণ
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={handlePrintOfficialPad}
              className="px-3.5 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="মাদ্রাসার অফিসিয়াল প্যাডে ফিল্টারকৃত খতিয়ান রিপোর্ট প্রিন্ট করুন"
            >
              <Printer size={14} /> রিপোর্ট প্রিন্ট
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Excel ফরম্যাটে ডাউনলোড করুন"
            >
              <FileSpreadsheet size={14} /> Excel
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-500/30 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="PDF ফরম্যাটে এক্সপোর্ট করুন"
            >
              <Download size={14} /> PDF
            </button>

            <button
              onClick={() => handleOpenSmsModal(unpaidRecords.concat(partialRecords))}
              disabled={unpaidRecords.length === 0 && partialRecords.length === 0}
              className="px-3.5 py-2 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="সকল বকেয়া শিক্ষার্থীদের অভিভাবককে এক ক্লিকে SMS পাঠান"
            >
              <Send size={14} /> বকেয়া SMS পাঠান ({enToBnNumber(unpaidRecords.length + partialRecords.length)})
            </button>
          </div>
        </div>

        {/* Filters Bar: Month, Year, Jamat, Category, Timing, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Month Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-text-main flex items-center gap-1">
              <Calendar size={13} className="text-primary" /> হিসাবের মাস:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-2 bg-step-bg border border-border-main rounded-lg text-xs font-black text-text-main outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-inner"
            >
              {BENGALI_MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m} {m === currentMonthName ? '(চলমান মাস)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-text-main flex items-center gap-1">
              <Clock size={13} className="text-primary" /> শিক্ষাবর্ষ / বছর:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-2 bg-step-bg border border-border-main rounded-lg text-xs font-black text-text-main outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-inner"
            >
              {YEARS_LIST.map((y) => (
                <option key={y} value={y}>
                  {y} ঈসায়ী
                </option>
              ))}
            </select>
          </div>

          {/* Jamat / Class Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-text-main flex items-center gap-1">
              <Building2 size={13} className="text-primary" /> জামাত / শ্রেণী:
            </label>
            <select
              value={selectedJamat}
              onChange={(e) => setSelectedJamat(e.target.value)}
              className="w-full p-2 bg-step-bg border border-border-main rounded-lg text-xs font-black text-text-main outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-inner"
            >
              <option value="all">সকল জামাত</option>
              {JAMAT_LIST.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* Category / Branch Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-text-main flex items-center gap-1">
              <Filter size={13} className="text-primary" /> বিভাগ / শাখা:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-step-bg border border-border-main rounded-lg text-xs font-black text-text-main outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-inner"
            >
              <option value="all">সকল শাখা / বিভাগ</option>
              <option value="residential">আবাসিক</option>
              <option value="non_residential">অনাবাসিক</option>
              <option value="day_care">ডে-কেয়ার</option>
            </select>
          </div>

          {/* Timing Filter: সময়মতো vs দেরিতে পরিশোধ */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-text-main flex items-center gap-1">
              <Clock size={13} className="text-primary" /> আদায়ের সময়কাল:
            </label>
            <select
              value={timingFilter}
              onChange={(e) => setTimingFilter(e.target.value as any)}
              className="w-full p-2 bg-step-bg border border-border-main rounded-lg text-xs font-black text-text-main outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-inner"
            >
              <option value="all">সকল সময়কাল</option>
              <option value="on_time">সময় মতো (১২ তারিখের মধ্যে)</option>
              <option value="late">দেরিতে (১২ তারিখের পরে)</option>
            </select>
          </div>

          {/* Search Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-text-main flex items-center gap-1">
              <Search size={13} className="text-primary" /> শিক্ষার্থী সার্চ:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="নাম, রোল, আইডি বা ফোন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-step-bg border border-border-main rounded-lg text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-text-light/50 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-text-light/40 hover:text-text-main"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {monthLedger.totalCollectedAmount === 0 ? (
        <div className="p-12 bg-card border border-border-main rounded-xl text-center space-y-4 shadow-sm flex flex-col items-center justify-center">
          <div className="p-4 bg-amber-500/10 text-amber-600 rounded-full border border-amber-500/20">
            <AlertTriangle size={36} />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-lg font-black text-text-main">কোনো ফি সংগ্রহের তথ্য নেই</h3>
            <p className="text-xs text-text-light/70 font-semibold leading-relaxed">
              {selectedMonth} {selectedYear} ঈসায়ী শিক্ষাবর্ষে এখন পর্যন্ত কোনো ফি বা বেতন আদায় করা হয়নি। তথ্য প্রদর্শনের জন্য অনুগ্রহ করে অর্থ সংগ্রহ মডিউলে গিয়ে সংশ্লিষ্ট মাসের ফি আদায় সম্পন্ন করুন।
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* --- BENTO METRIC STAT CARDS (FILTER SENSITIVE) --- */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {/* Total Expected Gross */}
        <div className="p-3.5 bg-card border border-border-main rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-light/60 mb-1.5">
            <span className="text-[11px] font-bold">মোট ধার্য ফি</span>
            <DollarSign size={15} className="text-primary" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-text-main">
              ৳{enToBnNumber(dynamicStats.totalExpectedGross)}
            </span>
            <p className="text-[10px] text-text-light/60 font-semibold mt-0.5">
              মোট {enToBnNumber(dynamicStats.eligibleCount)} জন
            </p>
          </div>
        </div>

        {/* Total Discount */}
        <div
          onClick={() => setActiveTab('discounts')}
          className={cn(
            "p-3.5 bg-card border rounded-xl shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01]",
            activeTab === 'discounts' ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5" : "border-border-main"
          )}
        >
          <div className="flex items-center justify-between text-indigo-700 mb-1.5">
            <span className="text-[11px] font-bold">বিশেষ ছাড়</span>
            <BadgePercent size={15} className="text-indigo-600" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-indigo-700">
              ৳{enToBnNumber(dynamicStats.totalDiscount)}
            </span>
            <p className="text-[10px] text-indigo-600/70 font-semibold mt-0.5">
              {enToBnNumber(dynamicStats.discountStudentsCount)} জনের ছাড়
            </p>
          </div>
        </div>

        {/* Total Net Payable (প্রকৃত প্রদেয়) */}
        <div className="p-3.5 bg-card border border-border-main rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-light/60 mb-1.5">
            <span className="text-[11px] font-bold">প্রকৃত প্রদেয় বিল</span>
            <Layers size={15} className="text-primary" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-text-main">
              ৳{enToBnNumber(dynamicStats.totalNetPayable)}
            </span>
            <p className="text-[10px] text-text-light/60 font-semibold mt-0.5">
              ধার্য - ছাড়
            </p>
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 mb-1.5">
            <span className="text-[11px] font-bold">মোট আদায়</span>
            <CheckCircle2 size={15} className="text-emerald-600" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-emerald-700">
              ৳{enToBnNumber(dynamicStats.totalCollected)}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <div className="flex-1 bg-emerald-500/20 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${dynamicStats.collectionRate}%` }}
                />
              </div>
              <span className="text-[9px] font-black text-emerald-700">
                {enToBnNumber(dynamicStats.collectionRate)}%
              </span>
            </div>
          </div>
        </div>

        {/* Total Due / Shortage (ঘাটতি ও বকেয়া) */}
        <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-700 mb-1.5">
            <span className="text-[11px] font-bold">ঘাটতি ও বকেয়া</span>
            <AlertTriangle size={15} className="text-rose-600" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-rose-700">
              ৳{enToBnNumber(dynamicStats.totalDue)}
            </span>
            <p className="text-[10px] text-rose-600/70 font-semibold mt-0.5">
              বকেয়া {enToBnNumber(dynamicStats.dueRate)}%
            </p>
          </div>
        </div>

        {/* Fully Paid Count */}
        <div
          onClick={() => setActiveTab('paid')}
          className={cn(
            "p-3.5 bg-card border rounded-xl shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01]",
            activeTab === 'paid' ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5" : "border-border-main"
          )}
        >
          <div className="flex items-center justify-between text-text-light/60 mb-1.5">
            <span className="text-[11px] font-bold">পরিশোধিত</span>
            <UserCheck size={15} className="text-emerald-600" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-emerald-600">
              {enToBnNumber(dynamicStats.fullyPaidCount)} জন
            </span>
            <p className="text-[10px] text-text-light/60 font-semibold mt-0.5">১০০% পরিশোধ করেছে</p>
          </div>
        </div>

        {/* Partially Paid Count */}
        <div
          onClick={() => setActiveTab('partial')}
          className={cn(
            "p-3.5 bg-card border rounded-xl shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01]",
            activeTab === 'partial' ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5" : "border-border-main"
          )}
        >
          <div className="flex items-center justify-between text-text-light/60 mb-1.5">
            <span className="text-[11px] font-bold">আংশিক পরিশোধ</span>
            <Clock size={15} className="text-amber-600" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-amber-600">
              {enToBnNumber(dynamicStats.partiallyPaidCount)} জন
            </span>
            <p className="text-[10px] text-text-light/60 font-semibold mt-0.5">কিছু টাকা বাকি আছে</p>
          </div>
        </div>

        {/* Fully Unpaid Count */}
        <div
          onClick={() => setActiveTab('unpaid')}
          className={cn(
            "p-3.5 bg-card border rounded-xl shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01]",
            activeTab === 'unpaid' ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5" : "border-border-main"
          )}
        >
          <div className="flex items-center justify-between text-text-light/60 mb-1.5">
            <span className="text-[11px] font-bold">সম্পূর্ণ বকেয়া</span>
            <UserX size={15} className="text-rose-600" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-rose-600">
              {enToBnNumber(dynamicStats.unpaidCount)} জন
            </span>
            <p className="text-[10px] text-text-light/60 font-semibold mt-0.5">এখনও ফি দেয়নি</p>
          </div>
        </div>
      </div>

      {/* --- TIMING ANALYSIS & ON-TIME / LATE BAR --- */}
      <div className="p-3.5 bg-card border border-border-main rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-primary" />
          <span className="font-black text-text-main">আদায় সময় পর্যবেক্ষণ (১২ তারিখ স্ট্যান্ডার্ড):</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-bold">
          <div
            onClick={() => setTimingFilter(timingFilter === 'on_time' ? 'all' : 'on_time')}
            className={cn(
              "px-3 py-1.5 rounded-lg border cursor-pointer transition-all flex items-center gap-1.5",
              timingFilter === 'on_time'
                ? "bg-emerald-600 text-white border-emerald-700"
                : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
            )}
          >
            <CalendarCheck size={14} />
            <span>সময়মতো পরিশোধ (১২ তারিখের মধ্যে): <strong>{enToBnNumber(dynamicStats.onTimePaidCount)} জন</strong></span>
          </div>

          <div
            onClick={() => setTimingFilter(timingFilter === 'late' ? 'all' : 'late')}
            className={cn(
              "px-3 py-1.5 rounded-lg border cursor-pointer transition-all flex items-center gap-1.5",
              timingFilter === 'late'
                ? "bg-rose-600 text-white border-rose-700"
                : "bg-rose-500/10 text-rose-700 border-rose-500/20 hover:bg-rose-500/20"
            )}
          >
            <CalendarX size={14} />
            <span>দেরিতে পরিশোধ (১২ তারিখের পরে): <strong>{enToBnNumber(dynamicStats.latePaidCount)} জন</strong></span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-700 border border-purple-500/20 flex items-center gap-1.5">
            <AlertTriangle size={14} />
            <span>১২ তারিখ পার হওয়া বকেয়া শিক্ষার্থী: <strong>{enToBnNumber(dynamicStats.overdueCount)} জন</strong></span>
          </div>
        </div>
      </div>

      {/* --- SUB NAVIGATION TABS --- */}
      <div className="flex flex-wrap gap-1.5 border-b border-border-main/50 pb-2.5">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            "px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === 'all'
              ? "bg-primary text-white shadow-xs"
              : "bg-card text-text-light/75 hover:bg-step-bg hover:text-text-main border border-border-main/50"
          )}
        >
          <Users size={13} /> সকল শিক্ষার্থী খতিয়ান ({enToBnNumber(dynamicStats.eligibleCount)})
        </button>

        <button
          onClick={() => setActiveTab('paid')}
          className={cn(
            "px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === 'paid'
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-card text-emerald-700 hover:bg-emerald-500/10 border border-emerald-500/20"
          )}
        >
          <CheckCircle2 size={13} /> পরিশোধিত তালিকা ({enToBnNumber(dynamicStats.fullyPaidCount)})
        </button>

        <button
          onClick={() => setActiveTab('partial')}
          className={cn(
            "px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === 'partial'
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-card text-amber-700 hover:bg-amber-500/10 border border-amber-500/20"
          )}
        >
          <Clock size={13} /> আংশিক পরিশোধিত / শর্টেজ ({enToBnNumber(dynamicStats.partiallyPaidCount)})
        </button>

        <button
          onClick={() => setActiveTab('unpaid')}
          className={cn(
            "px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === 'unpaid'
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-card text-rose-700 hover:bg-rose-500/10 border border-rose-500/20"
          )}
        >
          <AlertTriangle size={13} /> সম্পূর্ণ বকেয়া / অপরিশোধিত ({enToBnNumber(dynamicStats.unpaidCount)})
        </button>

        <button
          onClick={() => setActiveTab('discounts')}
          className={cn(
            "px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === 'discounts'
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-card text-indigo-700 hover:bg-indigo-500/10 border border-indigo-500/20"
          )}
        >
          <BadgePercent size={13} /> ছাড় ও বিশেষ রেয়ায়েত হিসাব ({enToBnNumber(dynamicStats.discountStudentsCount)})
        </button>

        <button
          onClick={() => setActiveTab('heads')}
          className={cn(
            "px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === 'heads'
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-card text-purple-700 hover:bg-purple-500/10 border border-purple-500/20"
          )}
        >
          <PieChart size={13} /> খাতওয়ারি আয় ও পর্যবেক্ষণ সামারি
        </button>

        <button
          onClick={() => setActiveTab('billing_start')}
          className={cn(
            "px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ml-auto",
            activeTab === 'billing_start'
              ? "bg-text-main text-white shadow-xs"
              : "bg-card text-text-main hover:bg-step-bg border border-border-main"
          )}
        >
          <Settings size={13} /> বেতন শুরুর মাস নির্ধারণ পোর্টাল
        </button>
      </div>

      {/* --- TAB 5: FEE HEADS MONTHLY ANALYTICS SUMMARY --- */}
      {activeTab === 'heads' && (
        <div className="space-y-4">
          <div className="p-5 bg-card border border-border-main rounded-xl shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                  <PieChart size={18} className="text-purple-600" />
                  {selectedMonth} {selectedYear} মাসের খাতভিত্তিক আয় ও পর্যবেক্ষণ খতিয়ান
                </h3>
                <p className="text-xs text-text-light/60 font-semibold mt-0.5">
                  কোন খাতে কত টাকা ধার্য ছিল, কত ছাড় দেওয়া হলো, কত টাকা আদায় হলো এবং অবশিষ্ট ঘাটতি/বকেয়া কত
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredHeadSummaries.map((head) => (
                <div
                  key={head.headId}
                  className="p-4 bg-step-bg/40 border border-border-main/60 rounded-xl shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2.5">
                      <div>
                        <h4 className="font-black text-text-main text-sm">{head.headName}</h4>
                        <span className="text-[10px] text-text-light/60 font-bold">
                          {head.frequency === 'monthly_mandatory'
                            ? 'প্রতি মাসে আবশ্যক'
                            : head.frequency === 'yearly'
                            ? 'বাৎসরিক ফি'
                            : head.frequency === 'one_time'
                            ? 'এককালীন ভর্তি ফি'
                            : 'অন্যান্য'}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-black border",
                          head.collectionRate >= 80
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                            : head.collectionRate >= 40
                            ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                        )}
                      >
                        {enToBnNumber(head.collectionRate)}% আদায়
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs py-2 border-y border-border-main/40 my-2.5">
                      <div className="flex justify-between">
                        <span className="text-text-light/60 font-bold">মূল ধার্য ফি:</span>
                        <span className="font-black text-text-main">৳{enToBnNumber(head.totalExpected)}</span>
                      </div>
                      {head.totalDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-indigo-600 font-bold">বিশেষ ছাড়:</span>
                          <span className="font-black text-indigo-600">৳{enToBnNumber(head.totalDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-text-main font-bold">প্রকৃত প্রদেয়:</span>
                        <span className="font-black text-text-main">৳{enToBnNumber(head.totalNetPayable)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700 font-bold">আদায়কৃত টাকা:</span>
                        <span className="font-black text-emerald-700">৳{enToBnNumber(head.totalCollected)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-700 font-bold">অবশিষ্ট ঘাটতি/বকেয়া:</span>
                        <span className="font-black text-rose-700">৳{enToBnNumber(head.totalDue)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold text-text-light/60 pt-1">
                    <span>পরিশোধ করেছে: {enToBnNumber(head.paidStudentsCount)} জন</span>
                    <span>বাকি আছে: {enToBnNumber(head.unpaidStudentsCount)} জন</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: DISCOUNT AND EXEMPTION ANALYSIS TABLE --- */}
      {activeTab === 'discounts' && (
        <div className="bg-card border border-border-main rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border-main/50">
            <div>
              <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                <BadgePercent size={18} className="text-indigo-600" />
                শিক্ষার্থীদের ফি ছাড় ও বিশেষ রেয়ায়েত বিবরণী
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 font-bold border border-indigo-500/20">
                  {enToBnNumber(filteredRecords.filter(r => r.totalDiscount > 0).length)} জন শিক্ষার্থী
                </span>
              </h3>
              <p className="text-xs text-text-light/60 font-semibold mt-0.5">
                মূল প্যাকেজ রেট থেকে শিক্ষার্থী প্রোফাইলে কম নির্ধারণ করার ফলে মোট কত টাকা ছাড় দেওয়া হচ্ছে এবং কত টাকা কম জমা হচ্ছে
              </p>
            </div>

            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs font-black text-indigo-900">
              সর্বমোট ছাড়ের পরিমাণ: ৳{enToBnNumber(dynamicStats.totalDiscount)}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border-main shadow-inner">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-black tracking-wider">
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-4 min-w-[150px]">শিক্ষার্থীর নাম</th>
                  <th className="py-3 px-3 text-center min-w-[70px]">রোল</th>
                  <th className="py-3 px-4 min-w-[120px]">জামাত</th>
                  <th className="py-3 px-3 min-w-[80px]">শাখা</th>
                  <th className="py-3 px-3 text-right min-w-[90px]">প্যাকেজ রেট (৳)</th>
                  <th className="py-3 px-3 text-right min-w-[90px] text-indigo-400">ছাড়কৃত টাকা (৳)</th>
                  <th className="py-3 px-3 text-right min-w-[90px]">প্রকৃত প্রদেয় (৳)</th>
                  <th className="py-3 px-3 text-right min-w-[90px] text-emerald-400">আদায় (৳)</th>
                  <th className="py-3 px-3 text-right min-w-[90px] text-rose-400">বকেয়া (৳)</th>
                  <th className="py-3 px-4 text-center min-w-[100px]">অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/50 bg-card">
                {filteredRecords.filter(r => r.totalDiscount > 0).length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-text-light/50 font-bold">
                      নির্বাচিত ফিল্টারে কোনো ছাড়প্রাপ্ত শিক্ষার্থীর তথ্য পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredRecords
                    .filter(r => r.totalDiscount > 0)
                    .map((record, index) => (
                      <tr key={record.studentId} className="hover:bg-primary/5 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-text-light/60">
                          {enToBnNumber(index + 1)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-black text-text-main text-[13px] block">
                            {record.studentName}
                          </span>
                          <span className="text-[10px] text-text-light/60 font-bold">
                            আইডি: {enToBnNumber(record.studentId)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-extrabold text-text-main">
                          {enToBnNumber(record.studentRoll)}
                        </td>
                        <td className="py-3 px-4 font-bold text-text-main">{record.studentClass}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black border bg-slate-500/10 text-slate-700 border-slate-500/20">
                            {record.categoryLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-text-main">
                          ৳{enToBnNumber(record.totalExpected)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-indigo-700 bg-indigo-500/5">
                          ৳{enToBnNumber(record.totalDiscount)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-text-main">
                          ৳{enToBnNumber(record.netPayable)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-600">
                          ৳{enToBnNumber(record.totalPaid)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-rose-600">
                          {record.dueAmount > 0 ? `৳${enToBnNumber(record.dueAmount)}` : '০'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {record.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-md text-[10px] font-black border border-emerald-500/20">
                              <CheckCircle2 size={11} /> পরিশোধিত
                            </span>
                          ) : record.paymentStatus === 'partial' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-700 rounded-md text-[10px] font-black border border-amber-500/20">
                              <Clock size={11} /> আংশিক
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-700 rounded-md text-[10px] font-black border border-rose-500/20">
                              <AlertTriangle size={11} /> বকেয়া
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 6: BILLING START MANAGEMENT PORTAL --- */}
      {activeTab === 'billing_start' && (
        <div className="space-y-4">
          <div className="p-5 bg-card border border-border-main rounded-xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-border-main/50">
              <div>
                <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                  <Settings size={18} className="text-primary" />
                  শিক্ষার্থীদের বেতন শুরুর মাস নির্ধারণ ও কাস্টমাইজেশন পোর্টাল
                </h3>
                <p className="text-xs text-text-light/60 font-semibold mt-0.5">
                  স্বয়ংক্রিয়ভাবে ভর্তির মাস থেকে হিসাব হয়। প্রয়োজন অনুযায়ী এখান থেকে যে কোনো শিক্ষার্থীর বেতন শুরুর মাস পরিবর্তন করা যাবে।
                </p>
              </div>

              {/* Bulk Actions */}
              {selectedStudentIdsForBilling.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 bg-primary/5 p-2.5 rounded-lg border border-primary/20">
                  <span className="text-xs font-black text-primary">
                    নির্বাচিত: {enToBnNumber(selectedStudentIdsForBilling.length)} জন
                  </span>
                  <select
                    value={bulkStartMonth}
                    onChange={(e) => setBulkStartMonth(e.target.value)}
                    className="px-2 py-1 bg-card border border-border-main rounded-md text-xs font-bold text-text-main outline-none"
                  >
                    {BENGALI_MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={bulkStartYear}
                    onChange={(e) => setBulkStartYear(e.target.value)}
                    className="px-2 py-1 bg-card border border-border-main rounded-md text-xs font-bold text-text-main outline-none"
                  >
                    {YEARS_LIST.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleApplyBulkBillingStart}
                    className="px-3.5 py-1 bg-primary text-white text-xs font-black rounded-md hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                  >
                    বাল্ক সেট করুন
                  </button>
                  <button
                    onClick={() => setSelectedStudentIdsForBilling([])}
                    className="px-2 py-1 bg-card border border-border-main text-text-light hover:text-text-main text-xs font-bold rounded-md"
                  >
                    বাতিল
                  </button>
                </div>
              )}
            </div>

            {/* Table for Billing Start Customization */}
            <div className="overflow-x-auto rounded-lg border border-border-main shadow-inner">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-black">
                    <th className="py-3 px-3 text-center w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedStudentIdsForBilling.length > 0 &&
                          selectedStudentIdsForBilling.length === students.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIdsForBilling(students.map((s) => String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'])));
                          } else {
                            setSelectedStudentIdsForBilling([]);
                          }
                        }}
                        className="rounded cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                    <th className="py-3 px-3">রোল নং</th>
                    <th className="py-3 px-4">জামাত / শ্রেণী</th>
                    <th className="py-3 px-4">ভর্তি / মঞ্জুর তারিখ</th>
                    <th className="py-3 px-4">বর্তমান শুরুর হিসাব</th>
                    <th className="py-3 px-4 text-center">শুরুর মাস পরিবর্তন</th>
                    <th className="py-3 px-4 text-center">বছর</th>
                    <th className="py-3 px-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/50 bg-card">
                  {students.map((student) => {
                    const sId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || '');
                    const sName = student['শিক্ষার্থীর নাম'] || student.name || '';
                    const sRoll = student['রোল নম্বর'] || student.roll || '';
                    const sClass = student['জামাত/শ্রেণী'] || student.class || '';
                    const admDate =
                      student['মঞ্জুরকৃত তারিখ'] ||
                      student['ভর্তির তারিখ'] ||
                      student['তারিখ'] ||
                      student.admissionDate ||
                      '-';

                    const startInfo = getStudentBillingStartInfo(student, studentOverrides, invoices);
                    const isSelected = selectedStudentIdsForBilling.includes(sId);

                    return (
                      <tr
                        key={sId}
                        className={cn(
                          "hover:bg-primary/5 transition-colors",
                          isSelected && "bg-primary/5"
                        )}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedStudentIdsForBilling((prev) =>
                                prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
                              );
                            }}
                            className="rounded cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-4 font-black text-text-main">{sName}</td>
                        <td className="py-2.5 px-3 font-bold text-text-light">{enToBnNumber(sRoll)}</td>
                        <td className="py-2.5 px-4 font-bold text-text-main">{sClass}</td>
                        <td className="py-2.5 px-4 font-bold text-text-light/80">{admDate}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-black text-[10px] border",
                              startInfo.isCustom
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                                : "bg-primary/10 text-primary border-primary/20"
                            )}
                          >
                            {startInfo.startMonth} {startInfo.startYear}
                            <span className="text-[9px] opacity-75">
                              ({startInfo.isCustom ? 'কাস্টম' : 'অটো'})
                            </span>
                          </span>
                        </td>

                        {/* Month Selector */}
                        <td className="py-2.5 px-4 text-center">
                          <select
                            defaultValue={startInfo.startMonth}
                            id={`month-sel-${sId}`}
                            className="p-1 bg-step-bg border border-border-main rounded-md text-xs font-bold text-text-main outline-none cursor-pointer"
                          >
                            {BENGALI_MONTHS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Year Selector */}
                        <td className="py-2.5 px-4 text-center">
                          <select
                            defaultValue={startInfo.startYear}
                            id={`year-sel-${sId}`}
                            className="p-1 bg-step-bg border border-border-main rounded-md text-xs font-bold text-text-main outline-none cursor-pointer"
                          >
                            {YEARS_LIST.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Save Action */}
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => {
                              const monthEl = document.getElementById(`month-sel-${sId}`) as HTMLSelectElement;
                              const yearEl = document.getElementById(`year-sel-${sId}`) as HTMLSelectElement;
                              if (monthEl && yearEl) {
                                handleSaveStudentBillingStart(sId, monthEl.value, yearEl.value);
                              }
                            }}
                            className="px-3 py-1 bg-primary hover:bg-primary/90 text-white font-black text-xs rounded-md shadow-xs transition-all cursor-pointer"
                          >
                            সেভ
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN STUDENT LEDGER TABLE (TABS: ALL, PAID, PARTIAL, UNPAID) --- */}
      {activeTab !== 'heads' && activeTab !== 'billing_start' && activeTab !== 'discounts' && (
        <div className="bg-card border border-border-main rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                {activeTab === 'paid'
                  ? 'পরিশোধিত শিক্ষার্থীদের তালিকা'
                  : activeTab === 'partial'
                  ? 'আংশিক পরিশোধিত / শর্টেজ তালিকা'
                  : activeTab === 'unpaid'
                  ? 'সম্পূর্ণ বকেয়া / অপরিশোধিত শিক্ষার্থীদের তালিকা'
                  : 'সকল শিক্ষার্থীর মাসিক বেতন ও ফি খতিয়ান'}
                <span className="text-xs px-2 py-0.5 rounded-md bg-step-bg text-text-light font-bold border border-border-main">
                  {enToBnNumber(filteredRecords.length)} জন প্রদর্শিত
                </span>
              </h3>
            </div>

            {/* Quick Filter Info */}
            <div className="text-xs font-bold text-text-light/70 flex items-center gap-2">
              <span>মাস: <strong className="text-primary">{selectedMonth} {selectedYear}</strong></span>
              <span>•</span>
              <span>জামাত: <strong>{selectedJamat === 'all' ? 'সকল' : selectedJamat}</strong></span>
              <span>•</span>
              <span>শাখা: <strong>{selectedCategory === 'all' ? 'সকল' : selectedCategory === 'residential' ? 'আবাসিক' : selectedCategory === 'day_care' ? 'ডে-কেয়ার' : 'অনাবাসিক'}</strong></span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-lg border border-border-main shadow-inner">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-black tracking-wider">
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-4 min-w-[150px]">শিক্ষার্থীর নাম</th>
                  <th className="py-3 px-3 text-center min-w-[70px]">রোল</th>
                  <th className="py-3 px-4 min-w-[120px]">জামাত / শ্রেণী</th>
                  <th className="py-3 px-3 min-w-[80px]">বিভাগ/শাখা</th>
                  <th className="py-3 px-3 text-right min-w-[90px]">ধার্য ফি</th>
                  <th className="py-3 px-3 text-right min-w-[75px]">ছাড়</th>
                  <th className="py-3 px-3 text-right min-w-[90px] text-emerald-400">আদায়কৃত</th>
                  <th className="py-3 px-3 text-right min-w-[90px] text-rose-400">বকেয়া</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">পরিশোধের তারিখ</th>
                  <th className="py-3 px-4 text-center min-w-[100px]">অবস্থা</th>
                  <th className="py-3 px-4 text-center min-w-[130px]">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/50 bg-card">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-text-light/50 font-bold">
                      নির্বাচিত ফিল্টারে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => (
                    <tr
                      key={record.studentId}
                      className={cn(
                        "hover:bg-primary/5 transition-colors group",
                        record.isOverdue && "bg-rose-500/[0.02]"
                      )}
                    >
                      <td className="py-3 px-3 text-center font-bold text-text-light/60">
                        {enToBnNumber(index + 1)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-black text-text-main text-[13px] leading-tight">
                            {record.studentName}
                          </span>
                          <span className="text-[10px] text-text-light/60 font-bold mt-0.5">
                            আইডি: {enToBnNumber(record.studentId)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-text-main">
                        {enToBnNumber(record.studentRoll)}
                      </td>
                      <td className="py-3 px-4 font-bold text-text-main">
                        {record.studentClass}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-black border",
                            record.category === 'residential'
                              ? "bg-purple-500/10 text-purple-700 border-purple-500/20"
                              : record.category === 'day_care'
                              ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                              : "bg-slate-500/10 text-slate-700 border-slate-500/20"
                          )}
                        >
                          {record.categoryLabel}
                        </span>
                      </td>

                      {/* Total Expected */}
                      <td className="py-3 px-3 text-right font-black text-text-main">
                        ৳{enToBnNumber(record.totalExpected)}
                      </td>

                      {/* Discount */}
                      <td className="py-3 px-3 text-right font-bold text-indigo-600">
                        {record.totalDiscount > 0 ? `৳${enToBnNumber(record.totalDiscount)}` : '-'}
                      </td>

                      {/* Total Paid */}
                      <td className="py-3 px-3 text-right font-black text-emerald-600">
                        ৳{enToBnNumber(record.totalPaid)}
                      </td>

                      {/* Total Due */}
                      <td className="py-3 px-3 text-right font-black text-rose-600">
                        {record.dueAmount > 0 ? `৳${enToBnNumber(record.dueAmount)}` : '০'}
                      </td>

                      {/* Payment Date & Timing Tag */}
                      <td className="py-3 px-3 text-center">
                        {record.latestPaymentDate ? (
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-text-main text-[11px]">
                              {record.latestPaymentDate}
                            </span>
                            {(() => {
                              const dayMatch = record.latestPaymentDate.match(/(\d{1,2})[\/\-\.]/);
                              const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
                              return day <= 12 ? (
                                <span className="text-[9px] text-emerald-700 font-black">সময়মতো</span>
                              ) : (
                                <span className="text-[9px] text-rose-700 font-black">দেরিতে</span>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-text-light/40 font-bold">-</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center">
                        {record.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-md text-[10px] font-black border border-emerald-500/20 whitespace-nowrap">
                            <CheckCircle2 size={11} /> পরিশোধিত
                          </span>
                        ) : record.paymentStatus === 'partial' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-700 rounded-md text-[10px] font-black border border-amber-500/20 whitespace-nowrap">
                            <Clock size={11} /> আংশিক
                          </span>
                        ) : record.paymentStatus === 'exempt' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-500/10 text-sky-700 rounded-md text-[10px] font-black border border-sky-500/20 whitespace-nowrap">
                            <Sparkles size={11} /> মওকুফ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-700 rounded-md text-[10px] font-black border border-rose-500/20 whitespace-nowrap">
                            <AlertTriangle size={11} /> বকেয়া
                          </span>
                        )}
                        {record.isOverdue && (
                          <span className="block text-[8px] font-black text-rose-600 uppercase tracking-wider mt-0.5">
                            ১২ তারিখ পার
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View Breakdown */}
                          <button
                            type="button"
                            onClick={() => setSelectedRecordForDetail(record)}
                            className="p-1.5 bg-sky-500/10 hover:bg-sky-500 text-sky-600 hover:text-white rounded-md transition-all cursor-pointer"
                            title="খাতভিত্তিক বিস্তারিত বিবরণ ও হিসাব দেখুন"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Print Due Notice Slip (if due) */}
                          {record.dueAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedRecordForNotice(record)}
                              className="p-1.5 bg-purple-500/10 hover:bg-purple-500 text-purple-700 hover:text-white rounded-md transition-all cursor-pointer"
                              title="অভিভাবকের বকেয়া নোটিশ স্লিপ তৈরি ও প্রিন্ট"
                            >
                              <FileText size={13} />
                            </button>
                          )}

                          {/* Send Single SMS */}
                          {record.dueAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenSmsModal(record)}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-white rounded-md transition-all cursor-pointer"
                              title="অভিভাবককে বকেয়া SMS পাঠান"
                            >
                              <Send size={13} />
                            </button>
                          )}

                          {/* Quick Collect Payment */}
                          {record.dueAmount > 0 && onNavigateToCollection && (
                            <button
                              type="button"
                              onClick={() => onNavigateToCollection(record.studentId)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-md transition-all cursor-pointer shadow-xs flex items-center gap-1"
                              title="ফি জমা নিন"
                            >
                              <CreditCard size={11} /> জমা
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
      )}

      {/* --- MODAL 1: STUDENT FEE DETAIL & BREAKDOWN MODAL --- */}
      <AnimatePresence>
        {selectedRecordForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-card border border-border-main shadow-2xl rounded-2xl p-5 text-left"
            >
              <div className="flex justify-between items-start pb-3 border-b border-border-main mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-500/10 text-sky-600 rounded-xl border border-sky-500/20">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-text-main leading-tight">
                      {selectedRecordForDetail.studentName}
                    </h3>
                    <p className="text-xs text-text-light/60 font-medium">
                      রোল: {enToBnNumber(selectedRecordForDetail.studentRoll)} • জামাত: {selectedRecordForDetail.studentClass} • {selectedMonth} {selectedYear}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecordForDetail(null)}
                  className="p-1.5 hover:bg-step-bg rounded-lg text-text-light/50 hover:text-text-main transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Student Metadata */}
              <div className="grid grid-cols-2 gap-2 bg-step-bg/40 p-2.5 rounded-xl border border-border-main/50 text-xs mb-3">
                <div>
                  <span className="text-text-light/60 font-bold block">পিতার নাম:</span>
                  <span className="font-bold text-text-main">{selectedRecordForDetail.studentFather || '-'}</span>
                </div>
                <div>
                  <span className="text-text-light/60 font-bold block">মোবাইল নং:</span>
                  <span className="font-bold text-text-main">{selectedRecordForDetail.studentPhone || '-'}</span>
                </div>
                <div>
                  <span className="text-text-light/60 font-bold block">শাখা/ক্যাটাগরি:</span>
                  <span className="font-bold text-primary">{selectedRecordForDetail.categoryLabel}</span>
                </div>
                <div>
                  <span className="text-text-light/60 font-bold block">বেতন শুরু:</span>
                  <span className="font-bold text-text-main">
                    {selectedRecordForDetail.billingStartInfo.startMonth} {selectedRecordForDetail.billingStartInfo.startYear}
                  </span>
                </div>
              </div>

              {/* Head-by-Head Breakdown Table */}
              <div className="space-y-2 mb-3">
                <h4 className="text-xs font-black text-text-main">খাতভিত্তিক ধার্য, ছাড় ও আদায়ের বিবরণ:</h4>
                <div className="overflow-x-auto rounded-lg border border-border-main/60">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-step-bg font-black text-text-main">
                      <tr>
                        <th className="p-2">খাতের নাম</th>
                        <th className="p-2 text-right">ধার্য (৳)</th>
                        <th className="p-2 text-right">ছাড় (৳)</th>
                        <th className="p-2 text-right">জমা (৳)</th>
                        <th className="p-2 text-right text-rose-600">বাকি (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main/40">
                      {selectedRecordForDetail.expectedItems.map((item) => {
                        const paidAmt = selectedRecordForDetail.paidHeadBreakdown[item.headId] || (selectedRecordForDetail.paymentStatus === 'paid' ? item.netPayable : 0);
                        const dueAmt = Math.max(0, item.netPayable - paidAmt);
                        return (
                          <tr key={item.headId} className="hover:bg-step-bg/20">
                            <td className="p-2 font-bold text-text-main">{item.headName}</td>
                            <td className="p-2 text-right font-bold text-text-main">{enToBnNumber(item.defaultRate)}</td>
                            <td className="p-2 text-right font-bold text-indigo-600">{enToBnNumber(item.discount)}</td>
                            <td className="p-2 text-right font-black text-emerald-600">{enToBnNumber(paidAmt)}</td>
                            <td className="p-2 text-right font-black text-rose-600">{enToBnNumber(dueAmt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Reference Info */}
              {selectedRecordForDetail.latestInvoiceNo ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-xs flex justify-between items-center text-emerald-800 mb-3">
                  <span>সর্বশেষ ইনভয়েস: <strong>{selectedRecordForDetail.latestInvoiceNo}</strong></span>
                  <span>তারিখ: <strong>{selectedRecordForDetail.latestPaymentDate || '-'}</strong> ({selectedRecordForDetail.latestPaymentMethod || 'নগদ'})</span>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-xs text-amber-800 mb-3 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                  <span>এই মাসের জন্য এখনও কোনো আদায় ইনভয়েস পাওয়া যায়নি।</span>
                </div>
              )}

              {/* Total Summary Row */}
              <div className="flex justify-between items-center bg-primary/5 p-3 rounded-xl border border-primary/20 text-xs mb-4">
                <div>
                  <span className="text-text-light font-bold block">মোট প্রদেয়:</span>
                  <span className="text-base font-black text-text-main">৳{enToBnNumber(selectedRecordForDetail.netPayable)}</span>
                </div>
                <div>
                  <span className="text-emerald-700 font-bold block">মোট আদায়:</span>
                  <span className="text-base font-black text-emerald-700">৳{enToBnNumber(selectedRecordForDetail.totalPaid)}</span>
                </div>
                <div>
                  <span className="text-rose-700 font-bold block">অবশিষ্ট বকেয়া:</span>
                  <span className="text-base font-black text-rose-700">৳{enToBnNumber(selectedRecordForDetail.dueAmount)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecordForDetail(null)}
                  className="px-4 py-2 bg-step-bg text-text-main font-black text-xs rounded-lg hover:bg-card border border-border-main cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                {selectedRecordForDetail.dueAmount > 0 && onNavigateToCollection && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedRecordForDetail.studentId;
                      setSelectedRecordForDetail(null);
                      onNavigateToCollection(id);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white font-black text-xs rounded-lg hover:bg-emerald-700 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <CreditCard size={13} /> ফি জমা নিন
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: STUDENT DUE REMINDER NOTICE SLIP MODAL & PRINT --- */}
      <AnimatePresence>
        {selectedRecordForNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-card border border-border-main shadow-2xl rounded-2xl p-5 text-left"
            >
              <div className="flex justify-between items-start pb-3 border-b border-border-main mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-xl border border-purple-500/20">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-text-main leading-tight">
                      বকেয়া নোটিশ স্লিপ (Due Reminder Notice)
                    </h3>
                    <p className="text-xs text-text-light/60 font-medium">
                      অভিভাবকের বরাবরে প্রেরণের জন্য প্রদেয় অফিসিয়াল নোটিশ
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecordForNotice(null)}
                  className="p-1.5 hover:bg-step-bg rounded-lg text-text-light/50 hover:text-text-main transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Printable Notice Paper Layout */}
              <div id="printable-due-notice" className="p-5 bg-white text-slate-900 rounded-xl border border-slate-300 shadow-sm space-y-3.5 text-xs font-hind-siliguri">
                <div className="text-center border-b border-slate-300 pb-3">
                  <h2 className="text-lg font-black text-primary">{madrasahBranding?.madrasahName || 'জামিয়া ইসলামিয়া মাদ্রাসা'}</h2>
                  <p className="text-[10px] text-slate-600 font-bold">{madrasahBranding?.address || 'মাদ্রাসার অফিস ও হিসাব বিভাগ'}</p>
                  <span className="inline-block px-3 py-0.5 bg-rose-100 text-rose-800 rounded-md font-black text-[10px] mt-1 border border-rose-300">
                    জরুরি বকেয়া ফি পরিশোধের তাগিদপত্র
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="font-bold">শিক্ষার্থীর নাম:</span> <strong>{selectedRecordForNotice.studentName}</strong>
                  </div>
                  <div>
                    <span className="font-bold">রোল নম্বর:</span> <strong>{enToBnNumber(selectedRecordForNotice.studentRoll)}</strong>
                  </div>
                  <div>
                    <span className="font-bold">জামাত / শ্রেণী:</span> <strong>{selectedRecordForNotice.studentClass}</strong>
                  </div>
                  <div>
                    <span className="font-bold">শাখা/ক্যাটাগরি:</span> <strong>{selectedRecordForNotice.categoryLabel}</strong>
                  </div>
                  <div>
                    <span className="font-bold">পিতার নাম:</span> <strong>{selectedRecordForNotice.studentFather || '-'}</strong>
                  </div>
                  <div>
                    <span className="font-bold">হিসাবের মাস:</span> <strong>{selectedMonth} {selectedYear}</strong>
                  </div>
                </div>

                <p className="leading-relaxed text-slate-700 font-medium text-justify">
                  শ্রদ্ধেয় অভিভাবক, আপনার অবগতির জন্য জানানো যাচ্ছে যে, উপরোক্ত শিক্ষার্থীর <strong>{selectedMonth} {selectedYear}</strong> মাসের নির্ধারিত ফি বাবদ সর্বমোট <strong>৳{enToBnNumber(selectedRecordForNotice.dueAmount)}</strong> টাকা বকেয়া রয়েছে। মাদ্রাসার নিয়ম অনুযায়ী প্রতি মাসের ১২ তারিখের মধ্যে সকল ফি পরিশোধ করা আবশ্যক। অনুগ্রহ করে আগামী ৩ কার্যদিবসের মধ্যে মাদ্রাসার হিসাব বিভাগে যোগাযোগ করে উক্ত বকেয়া পরিশোধ করার জন্য বিনীত অনুরোধ করা হলো।
                </p>

                <div className="flex justify-between items-center bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <span className="font-black text-rose-900 text-sm">মোট বকেয়া টাকার পরিমাণ:</span>
                  <span className="font-black text-rose-900 text-base">৳{enToBnNumber(selectedRecordForNotice.dueAmount)}</span>
                </div>

                <div className="flex justify-between items-end pt-5 text-[10px] text-slate-500 font-bold">
                  <div>তারিখ: {new Date().toLocaleDateString('bn-BD')}</div>
                  <div className="text-center">
                    <div className="w-28 border-b border-slate-400 mb-1" />
                    <span>হিসাবরক্ষক / মুহতামিম</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border-main mt-3">
                <button
                  type="button"
                  onClick={() => setSelectedRecordForNotice(null)}
                  className="px-4 py-2 bg-step-bg text-text-main font-black text-xs rounded-lg hover:bg-card border border-border-main cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const noticeEl = document.getElementById('printable-due-notice');
                    if (noticeEl) {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Due Notice - ${selectedRecordForNotice.studentName}</title>
                              <style>
                                body { font-family: 'Hind Siliguri', sans-serif; padding: 20px; }
                                .box { border: 1px solid #ccc; padding: 20px; border-radius: 8px; max-width: 500px; margin: 0 auto; }
                              </style>
                            </head>
                            <body>
                              <div class="box">${noticeEl.innerHTML}</div>
                              <script>window.print(); window.close();</script>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Printer size={13} /> প্রিন্ট স্লিপ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 3: SMS SENDING MODAL --- */}
      <AnimatePresence>
        {smsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-card border border-border-main shadow-2xl rounded-2xl p-5 text-left"
            >
              <div className="flex justify-between items-start pb-3 border-b border-border-main mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-text-main leading-tight">
                      অভিভাবকদের মোবাইলে বকেয়া SMS পাঠান
                    </h3>
                    <p className="text-xs text-text-light/60 font-medium">
                      SMS.NET.BD গেটওয়ে দিয়ে সরাসরি SMS প্রেরণ
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSmsModalOpen(false)}
                  className="p-1.5 hover:bg-step-bg rounded-lg text-text-light/50 hover:text-text-main transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3.5 mb-5">
                <div className="bg-step-bg/50 p-2.5 rounded-xl border border-border-main/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-text-light">প্রাপক শিক্ষার্থী সংখ্যা:</span>
                  <span className="font-black text-primary text-sm">{enToBnNumber(smsTargetRecords.length)} জন</span>
                </div>

                <div>
                  <label className="text-xs font-black text-text-main block mb-1">
                    মেসেজের টেক্সট (কাস্টমাইজযোগ্য):
                  </label>
                  <textarea
                    rows={4}
                    value={smsCustomText}
                    onChange={(e) => setSmsCustomText(e.target.value)}
                    className="w-full p-2.5 bg-step-bg border border-border-main rounded-lg text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-amber-500/20"
                    placeholder="মেসেজের বডি..."
                  />
                  <span className="text-[10px] text-text-light/50 block mt-1">
                    ট্যাগসমূহ: [নাম] = শিক্ষার্থীর নাম, [টাকা] = বকেয়া টাকা, [রোল] = রোল নম্বর
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-main">
                <button
                  type="button"
                  onClick={() => setSmsModalOpen(false)}
                  className="px-4 py-2 bg-step-bg text-text-main font-black text-xs rounded-lg hover:bg-card border border-border-main cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={smsSending}
                  onClick={handleSendSmsAction}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black text-xs rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {smsSending ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> পাঠানো হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Send size={13} /> SMS পাঠান
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HIDDEN PRINT STYLES FOR OFFICIAL REPORT --- */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #official-pad-report, #official-pad-report * {
            visibility: visible;
          }
          #official-pad-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      </>
      )}

      {/* Official Pad Printable Report with Header and Logo (Visible on print) */}
      <div id="official-pad-report" className="hidden print:block font-hind-siliguri text-slate-900 p-8">
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
          {madrasahBranding?.logoUrl && (
            <img
              src={madrasahBranding.logoUrl}
              alt="Logo"
              className="h-16 w-16 mx-auto mb-2 object-contain"
              referrerPolicy="no-referrer"
            />
          )}
          <h1 className="text-2xl font-black">{madrasahBranding?.madrasahName || 'জামিয়া ইসলামিয়া দারুল উলূম মাদরাসা'}</h1>
          <p className="text-xs font-bold text-slate-600 mt-0.5">{madrasahBranding?.address || 'ঢাকা, বাংলাদেশ'} • মোবাইল: {madrasahBranding?.phone || '০১৭০০-০০০০০০'}</p>
          <p className="text-sm font-black mt-2 text-primary">মাসিক বেতন ও ফি আদায় খতিয়ান রিপোর্ট</p>
          
          <div className="flex justify-between items-center text-xs font-bold mt-3 px-2 border-t border-slate-300 pt-2">
            <span>হিসাবের মাস: <strong>{selectedMonth} {selectedYear}</strong></span>
            <span>জামাত: <strong>{selectedJamat === 'all' ? 'সকল জামাত' : selectedJamat}</strong></span>
            <span>শাখা/বিভাগ: <strong>{selectedCategory === 'all' ? 'সকল' : selectedCategory === 'residential' ? 'আবাসিক' : selectedCategory === 'day_care' ? 'ডে-কেয়ার' : 'অনাবাসিক'}</strong></span>
            <span>প্রিন্টের তারিখ: <strong>{new Date().toLocaleDateString('bn-BD')}</strong></span>
          </div>
        </div>

        {/* Summary Stats on Pad */}
        <div className="grid grid-cols-5 gap-2 border border-slate-400 p-3 rounded-md text-xs mb-5 text-center font-bold bg-slate-50">
          <div>মোট শিক্ষার্থী: <strong>{enToBnNumber(dynamicStats.eligibleCount)} জন</strong></div>
          <div>মূল ধার্য: <strong>৳{enToBnNumber(dynamicStats.totalExpectedGross)}</strong></div>
          <div>মোট ছাড়: <strong>৳{enToBnNumber(dynamicStats.totalDiscount)}</strong></div>
          <div>মোট আদায়: <strong className="text-emerald-800">৳{enToBnNumber(dynamicStats.totalCollected)}</strong></div>
          <div>মোট ঘাটতি/বকেয়া: <strong className="text-rose-800">৳{enToBnNumber(dynamicStats.totalDue)}</strong></div>
        </div>

        {/* Records Table on Pad */}
        <table className="w-full border-collapse text-xs text-left">
          <thead>
            <tr className="border-b-2 border-slate-900 bg-slate-100 font-black">
              <th className="py-2 px-1 text-center w-8">#</th>
              <th className="py-2 px-2">শিক্ষার্থীর নাম</th>
              <th className="py-2 px-1 text-center">রোল</th>
              <th className="py-2 px-2">জামাত</th>
              <th className="py-2 px-1">শাখা</th>
              <th className="py-2 px-2 text-right">ধার্য</th>
              <th className="py-2 px-2 text-right">ছাড়</th>
              <th className="py-2 px-2 text-right">প্রদেয়</th>
              <th className="py-2 px-2 text-right">আদায়</th>
              <th className="py-2 px-2 text-right">বকেয়া</th>
              <th className="py-2 px-2 text-center">পরিশোধের তারিখ</th>
              <th className="py-2 px-2 text-center">অবস্থা</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {filteredRecords.map((r, i) => (
              <tr key={r.studentId}>
                <td className="py-1.5 px-1 text-center">{enToBnNumber(i + 1)}</td>
                <td className="py-1.5 px-2 font-bold">{r.studentName}</td>
                <td className="py-1.5 px-1 text-center">{enToBnNumber(r.studentRoll)}</td>
                <td className="py-1.5 px-2">{r.studentClass}</td>
                <td className="py-1.5 px-1">{r.categoryLabel}</td>
                <td className="py-1.5 px-2 text-right">৳{enToBnNumber(r.totalExpected)}</td>
                <td className="py-1.5 px-2 text-right">{r.totalDiscount > 0 ? `৳${enToBnNumber(r.totalDiscount)}` : '-'}</td>
                <td className="py-1.5 px-2 text-right font-bold">৳{enToBnNumber(r.netPayable)}</td>
                <td className="py-1.5 px-2 text-right font-bold text-emerald-800">৳{enToBnNumber(r.totalPaid)}</td>
                <td className="py-1.5 px-2 text-right font-bold text-rose-800">৳{enToBnNumber(r.dueAmount)}</td>
                <td className="py-1.5 px-2 text-center text-[10px]">{r.latestPaymentDate || '-'}</td>
                <td className="py-1.5 px-2 text-center font-bold text-[10px]">
                  {r.paymentStatus === 'paid' ? 'পরিশোধিত' : r.paymentStatus === 'partial' ? 'আংশিক' : r.paymentStatus === 'exempt' ? 'মওকুফ' : 'বকেয়া'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Official Signatures */}
        <div className="flex justify-between items-end pt-16 text-xs font-bold">
          <div className="text-center">
            <div className="w-36 border-b border-slate-900 mb-1" />
            <span>প্রস্তুতকারক</span>
          </div>
          <div className="text-center">
            <div className="w-36 border-b border-slate-900 mb-1" />
            <span>হিসাবরক্ষক</span>
          </div>
          <div className="text-center">
            <div className="w-36 border-b border-slate-900 mb-1" />
            <span>মুহতামিম / প্রিন্সিপাল</span>
          </div>
        </div>
      </div>

    </div>
  );
};
