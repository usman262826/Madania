import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Printer, 
  Coins, 
  DollarSign, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Layers, 
  HeartHandshake, 
  Receipt, 
  Tag, 
  User, 
  ArrowUpRight, 
  X,
  CreditCard,
  Building2,
  FileSpreadsheet,
  ShoppingBag
} from 'lucide-react';
import { enToBnNumber, cn } from '../../lib/utils';
import { useData } from '../../contexts/DataContext';

// Helper UID
const uid = () => 'INC-' + Math.floor(100000 + Math.random() * 900000);

export interface IncomeRecord {
  id: string;
  title: string;
  category: 'student_fee' | 'general' | 'lillah' | 'donation' | 'rent' | 'other';
  categoryLabel: string;
  amount: number;
  date: string;
  sourceOrDonor?: string;
  phone?: string;
  paymentMethod: 'ক্যাশ' | 'ব্যাংক' | 'বিকাশ' | 'নগদ' | 'রকেট' | 'চেক';
  note?: string;
  receivedBy?: string;
}

export const IncomeManager: React.FC = () => {
  const { incomeRecords, invoices, expenses, updateData, deleteData } = useData();

  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'summary' | 'new' | 'general' | 'lillah' | 'donations'>('summary');

  // Merge fee invoices into aggregated income items
  const allCombinedRecords = useMemo(() => {
    const list: IncomeRecord[] = [...(incomeRecords || [])];

    // Blend invoices
    (invoices || []).forEach((inv: any) => {
      (inv.items || []).forEach((item: any, idx: number) => {
        list.push({
          id: `INV-${inv.invoiceNo || inv.id}-${idx}`,
          title: item.headName || 'শিক্ষার্থী ফি',
          category: 'student_fee',
          categoryLabel: 'শিক্ষার্থী ফি (ইনভয়েস)',
          amount: item.amount || 0,
          date: inv.date || new Date().toISOString().split('T')[0],
          sourceOrDonor: `${inv.studentName || 'শিক্ষার্থী'} (${inv.studentClass || ''})`,
          paymentMethod: 'ক্যাশ',
          note: `ইনভয়েস নং: ${inv.invoiceNo || ''}`
        });
      });
    });

    return list;
  }, [incomeRecords, invoices]);

  // Search & Filter State for Summary & Ledgers
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedSectorView, setSelectedSectorView] = useState<string | null>(null);

  // Form State for Adding Income
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'student_fee' | 'general' | 'lillah' | 'donation' | 'rent' | 'other'>('general');
  const [newAmount, setNewAmount] = useState('');
  const [newDonor, setNewDonor] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'ক্যাশ' | 'ব্যাংক' | 'বিকাশ' | 'নগদ' | 'রকেট' | 'চেক'>('ক্যাশ');
  const [newNote, setNewNote] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<IncomeRecord | null>(null);

  // Reset Add Form
  const resetForm = () => {
    setNewTitle('');
    setNewCategory('general');
    setNewAmount('');
    setNewDonor('');
    setNewPhone('');
    setNewPaymentMethod('ক্যাশ');
    setNewNote('');
    setNewDate(new Date().toISOString().split('T')[0]);
  };

  // Handle Create Income Record
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount || parseFloat(newAmount) <= 0) {
      alert('অনুগ্রহ করে আয়ের খাত শিরোনাম এবং সঠিক টাকার পরিমাণ প্রদান করুন।');
      return;
    }

    const categoryLabelMap = {
      student_fee: 'শিক্ষার্থী ফি',
      general: 'সাধারণ আয়',
      lillah: 'লিল্লাহ ও যাকাত',
      donation: 'অনুদান ও চাঁদা',
      rent: 'দোকান ও স্থাবর আয়',
      other: 'অন্যান্য আয়'
    };

    const newRecord: IncomeRecord = {
      id: uid(),
      title: newTitle.trim(),
      category: newCategory,
      categoryLabel: categoryLabelMap[newCategory],
      amount: parseFloat(newAmount),
      date: newDate,
      sourceOrDonor: newDonor.trim() || 'সাধারণ রসিদ',
      phone: newPhone.trim(),
      paymentMethod: newPaymentMethod,
      note: newNote.trim(),
      receivedBy: 'ক্যাশিয়ার'
    };

    await updateData('income_records', newRecord);
    resetForm();
    setActiveTab('summary');
  };

  // Delete Income Record
  const handleDeleteIncome = async (id: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই আয়ের এন্ট্রিটি মুছে ফেলতে চান?')) {
      await deleteData('income_records', id);
    }
  };

  // Helper to extract exact 1-12 month number from record date/month
  const getRecordMonthNumber = (rec: { date?: string; month?: string; [key: string]: any }): number => {
    const bnMonths = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const bnAltMonths = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    
    if (rec.month && typeof rec.month === 'string') {
      const trimmed = rec.month.trim();
      const idx1 = bnMonths.indexOf(trimmed);
      if (idx1 !== -1) return idx1 + 1;
      const idx2 = bnAltMonths.indexOf(trimmed);
      if (idx2 !== -1) return idx2 + 1;
    }

    if (!rec.date) return 0;
    const str = String(rec.date).trim();
    const engStr = str.replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d).toString());

    let match = engStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      const m = parseInt(match[2], 10);
      if (m >= 1 && m <= 12) return m;
    }

    match = engStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (match) {
      const m = parseInt(match[2], 10);
      if (m >= 1 && m <= 12) return m;
    }

    const d = new Date(engStr);
    if (!isNaN(d.getTime())) {
      return d.getMonth() + 1;
    }

    return 0;
  };

  // Filtered List based on Search and Filter criteria
  const filteredRecords = useMemo(() => {
    return allCombinedRecords.filter(rec => {
      const matchesSearch = 
        rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.sourceOrDonor && rec.sourceOrDonor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.note && rec.note.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = categoryFilter === 'all' || rec.category === categoryFilter;

      let matchesMonth = true;
      if (selectedMonth !== 'all') {
        const monthNum = getRecordMonthNumber(rec).toString();
        matchesMonth = monthNum === selectedMonth;
      }

      let matchesSector = true;
      if (selectedSectorView) {
        matchesSector = rec.title === selectedSectorView;
      }

      return matchesSearch && matchesCat && matchesMonth && matchesSector;
    });
  }, [allCombinedRecords, searchTerm, categoryFilter, selectedMonth, selectedSectorView]);

  // Sector-Wise Aggregation (কোন বিবরণ/খাতে কত টাকা উঠল)
  const sectorSummary = useMemo(() => {
    const map: Record<string, { 
      title: string; 
      categoryLabel: string; 
      totalAmount: number; 
      count: number; 
      lastDate: string;
      category: string;
    }> = {};

    filteredRecords.forEach(rec => {
      const key = rec.title;
      if (!map[key]) {
        map[key] = {
          title: key,
          categoryLabel: rec.categoryLabel,
          category: rec.category,
          totalAmount: 0,
          count: 0,
          lastDate: rec.date
        };
      }
      map[key].totalAmount += rec.amount;
      map[key].count += 1;
      if (rec.date > map[key].lastDate) {
        map[key].lastDate = rec.date;
      }
    });

    const list = Object.values(map);
    list.sort((a, b) => b.totalAmount - a.totalAmount);
    return list;
  }, [filteredRecords]);

  // Grand Totals
  const grandTotalIncome = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRecords]);

  const topSector = useMemo(() => {
    return sectorSummary[0] || null;
  }, [sectorSummary]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['আইডি', 'খাত বিবরণী', 'ক্যাটাগরি', 'পরিমাণ (৳)', 'তারিখ', 'দাতার নাম/উৎস', 'পদ্ধতি', 'নোট'];
    const rows = filteredRecords.map(r => [
      r.id,
      `"${r.title}"`,
      r.categoryLabel,
      r.amount,
      r.date,
      `"${r.sourceOrDonor || ''}"`,
      r.paymentMethod,
      `"${r.note || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Income_Summary_Madrasah_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 text-left font-hind-siliguri animate-fade-in pb-12">
      {/* --- TOP HEADER & NAVIGATION TOOLBAR --- */}
      <div className="bg-card p-6 rounded-[2.5rem] border border-border-main shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-main/50 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                <Wallet size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-text-main">আয় ব্যবস্থাপনা ও বিবরণী সমূহের সামারি</h2>
                <p className="text-xs font-bold text-text-light/60 mt-0.5">
                  সকল আয়ের খাতের রিয়েল-টাইম সামারি, বিবরণী অনুযায়ী সংগৃহীত টাকা ও অর্থায়ন খতিয়ান
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => { setActiveTab('new'); resetForm(); }}
              className="px-5 py-3 bg-primary text-white font-black text-xs rounded-2xl hover:bg-primary-light transition-all active:scale-95 shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> নতুন নগদ আয় যুক্ত করুন
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-step-bg p-1.5 rounded-2xl border border-border-main overflow-x-auto gap-1.5 scrollbar-none">
          <button
            onClick={() => { setActiveTab('summary'); setSelectedSectorView(null); }}
            className={cn(
              "px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2",
              activeTab === 'summary' ? "bg-card text-primary shadow-sm" : "text-text-light/70 hover:text-text-main"
            )}
          >
            <PieChart size={16} /> আয় সামারি ও খাত বিশ্লেষণ
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={cn(
              "px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2",
              activeTab === 'new' ? "bg-card text-primary shadow-sm" : "text-text-light/70 hover:text-text-main"
            )}
          >
            <Plus size={16} /> নতুন নগদ গ্রহণ এন্ট্রি
          </button>
          <button
            onClick={() => { setActiveTab('general'); setCategoryFilter('general'); }}
            className={cn(
              "px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2",
              activeTab === 'general' ? "bg-card text-primary shadow-sm" : "text-text-light/70 hover:text-text-main"
            )}
          >
            <Coins size={16} /> সাধারণ আয় রেজিস্টার
          </button>
          <button
            onClick={() => { setActiveTab('lillah'); setCategoryFilter('lillah'); }}
            className={cn(
              "px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2",
              activeTab === 'lillah' ? "bg-card text-primary shadow-sm" : "text-text-light/70 hover:text-text-main"
            )}
          >
            <Building2 size={16} /> লিল্লাহ ও যাকাত আয়
          </button>
          <button
            onClick={() => { setActiveTab('donations'); setCategoryFilter('donation'); }}
            className={cn(
              "px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2",
              activeTab === 'donations' ? "bg-card text-primary shadow-sm" : "text-text-light/70 hover:text-text-main"
            )}
          >
            <HeartHandshake size={16} /> অনুদান ও চাঁদা খতিয়ান
          </button>
        </div>
      </div>

      {/* --- TAB 1: ALL INCOME SUMMARY & SECTOR BREAKDOWN --- */}
      {activeTab === 'summary' && (
        <div className="space-y-8 animate-fade-in">
          {/* SEARCH & FILTERS PANEL */}
          <div className="bg-card p-6 rounded-[2rem] border border-border-main shadow-md space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border-main/40">
              <span className="text-xs font-black text-text-main flex items-center gap-2 uppercase tracking-wider">
                <Filter size={15} className="text-primary" /> ফিল্টারিং ও অনুসন্ধান টুলবার
              </span>
              {selectedSectorView && (
                <button
                  onClick={() => setSelectedSectorView(null)}
                  className="text-xs font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X size={14} /> খাত ফিল্টার মুছুন ({selectedSectorView})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-main">খাত বা দাতার নামে খুঁজুন</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="যেমন: ভর্তি ফি, ভাড়া, অনুদান..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2.5 pl-9 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:border-primary"
                  />
                  <Search size={15} className="absolute left-3 top-3 text-text-light/50" />
                </div>
              </div>

              {/* Source Category filter */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-main">মূল আয়ের ক্যাটাগরি</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none cursor-pointer focus:border-primary"
                >
                  <option value="all">সকল ক্যাটাগরি</option>
                  <option value="student_fee">শিক্ষার্থী ফি (টিউশন/ভর্তি)</option>
                  <option value="general">সাধারণ আয়</option>
                  <option value="lillah">লিল্লাহ ও যাকাত</option>
                  <option value="donation">অনুদান ও চাঁদা</option>
                  <option value="rent">দোকান ও স্থাবর আয়</option>
                  <option value="other">অন্যান্য আয়</option>
                </select>
              </div>

              {/* Month filter */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-main">নির্দিষ্ট মাস</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full p-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none cursor-pointer focus:border-primary"
                >
                  <option value="all">সকল মাস</option>
                  <option value="1">জানুয়ারি</option>
                  <option value="2">ফেব্রুয়ারি</option>
                  <option value="3">মার্চ</option>
                  <option value="4">এপ্রিল</option>
                  <option value="5">মে</option>
                  <option value="6">জুন</option>
                  <option value="7">জুলাই</option>
                  <option value="8">আগস্ট</option>
                  <option value="9">সেপ্টেম্বর</option>
                  <option value="10">অক্টোবর</option>
                  <option value="11">নভেম্বর</option>
                  <option value="12">ডিসেম্বর</option>
                </select>
              </div>

              {/* Export Actions */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <button
                  onClick={handleExportCSV}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <FileSpreadsheet size={15} /> এক্সেল এক্সপোর্ট ডাউনলোড
                </button>
              </div>
            </div>
          </div>

          {/* KPI METRICS STRIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-card border border-border-main rounded-[2rem] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
                <Wallet size={70} />
              </div>
              <span className="text-[10px] font-black text-text-light/50 uppercase tracking-widest block mb-1">সর্বমোট অর্জিত আয়</span>
              <h3 className="text-3xl font-black text-success">৳{enToBnNumber(grandTotalIncome)}</h3>
              <p className="text-[11px] font-bold text-text-light/60 mt-2 flex items-center gap-1">
                <TrendingUp size={13} className="text-success" /> সকল রসিদ ও খাতের সর্বমোট
              </p>
            </div>

            <div className="p-6 bg-card border border-border-main rounded-[2rem] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-500">
                <BarChart3 size={70} />
              </div>
              <span className="text-[10px] font-black text-text-light/50 uppercase tracking-widest block mb-1">মোট সক্রিয় খাতের সংখ্যা</span>
              <h3 className="text-3xl font-black text-text-main">{enToBnNumber(sectorSummary.length)} টি</h3>
              <p className="text-[11px] font-bold text-text-light/60 mt-2">
                ভিন্ন ভিন্ন বিবরণী খাত
              </p>
            </div>

            <div className="p-6 bg-card border border-border-main rounded-[2rem] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-sky-500">
                <Receipt size={70} />
              </div>
              <span className="text-[10px] font-black text-text-light/50 uppercase tracking-widest block mb-1">মোট রসিদ / ট্রানজেকশন</span>
              <h3 className="text-3xl font-black text-sky-600">{enToBnNumber(filteredRecords.length)} টি</h3>
              <p className="text-[11px] font-bold text-text-light/60 mt-2">
                অনলাইন ও ক্যাশ এন্ট্রি
              </p>
            </div>

            <div className="p-6 bg-card border border-border-main rounded-[2rem] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500">
                <PieChart size={70} />
              </div>
              <span className="text-[10px] font-black text-text-light/50 uppercase tracking-widest block mb-1">শীর্ষ আয়ের খাত</span>
              <h3 className="text-lg font-black text-primary truncate" title={topSector?.title || 'N/A'}>
                {topSector?.title || 'নেই'}
              </h3>
              <p className="text-[11px] font-black text-amber-600 mt-2">
                ৳{enToBnNumber(topSector?.totalAmount || 0)}
              </p>
            </div>
          </div>

          {/* --- "কোন বিবরণ/খাতে কত টাকা উঠল" - VISUAL SECTOR CARDS GRID --- */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-text-main flex items-center gap-2">
                  <BarChart3 className="text-primary" size={22} /> কোন বিবরণীতে কত টাকা সংগৃহীত হলো (খাতভিত্তিক কার্ড)
                </h3>
                <p className="text-xs font-bold text-text-light/60 mt-0.5">
                  প্রতিটি খাত বা বিবরণের বিপরীত মোট আদায়কৃত টাকা ও শতক হিসাব
                </p>
              </div>
              <span className="text-xs font-bold text-text-light/60">
                মোট {enToBnNumber(sectorSummary.length)} টি খাত প্রদর্শিত
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sectorSummary.map(sec => {
                const percentage = grandTotalIncome > 0 ? Math.round((sec.totalAmount / grandTotalIncome) * 100) : 0;
                const isSelected = selectedSectorView === sec.title;

                return (
                  <div
                    key={sec.title}
                    onClick={() => setSelectedSectorView(isSelected ? null : sec.title)}
                    className={cn(
                      "p-6 bg-card border rounded-[2rem] space-y-4 transition-all cursor-pointer hover:shadow-xl relative group",
                      isSelected 
                        ? "border-primary ring-2 ring-primary/20 bg-primary/[0.02]" 
                        : "border-border-main hover:border-primary/50 shadow-xs"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 pr-2">
                        <span className="px-2.5 py-0.5 bg-primary/10 text-primary font-black text-[10px] rounded-full uppercase tracking-wider inline-block">
                          {sec.categoryLabel}
                        </span>
                        <h4 className="font-black text-base text-text-main group-hover:text-primary transition-colors leading-tight">
                          {sec.title}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-xl">
                          {enToBnNumber(percentage)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-border-main/40">
                      <div>
                        <span className="text-[10px] font-black text-text-light/50 uppercase block">মোট সংগৃহীত টাকা</span>
                        <span className="text-2xl font-black text-success font-mono">৳{enToBnNumber(sec.totalAmount)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-text-light/50 uppercase block">রসিদ সংখ্যা</span>
                        <span className="text-sm font-black text-text-main">{enToBnNumber(sec.count)} টি</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-step-bg h-2.5 rounded-full overflow-hidden p-0.5 border border-border-main/30">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-700" 
                          style={{ width: `${Math.min(100, Math.max(3, percentage))}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-text-light/50">
                        <span>সর্বশেষ আয়: {enToBnNumber(sec.lastDate)}</span>
                        <span>{isSelected ? 'ফিল্টার করা হচ্ছে' : 'বিস্তারিত দেখতে ক্লিক করুন ➔'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {sectorSummary.length === 0 && (
                <div className="col-span-3 text-center py-16 bg-card border border-border-main rounded-[2rem] space-y-2">
                  <p className="text-sm font-black text-text-main">কোনো খাতের ডাটা পাওয়া যায়নি!</p>
                  <p className="text-xs text-text-light/50">অনুগ্রহ করে সার্চ বা ফিল্টারিং পরিবর্তন করুন।</p>
                </div>
              )}
            </div>
          </div>

          {/* DETAILED TRANSACTION & SECTOR SUMMARY TABLE */}
          <div className="bg-card p-6 rounded-[2.5rem] border border-border-main shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-border-main/50">
              <div>
                <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                  <Layers className="text-primary" size={20} /> বিস্তারিত আয়ের লেনদেন খতিয়ান তালিকা
                </h3>
                <p className="text-xs font-bold text-text-light/60 mt-0.5">
                  ফিল্টারকৃত সকল আয় ভাউচার ও রসিদ সমূহের রিয়েল-টাইম তালিকা
                </p>
              </div>
              <span className="px-3 py-1 bg-step-bg rounded-xl font-black text-xs text-text-main">
                মোট টাকা: <span className="text-success">৳{enToBnNumber(grandTotalIncome)}</span>
              </span>
            </div>

            <div className="overflow-x-auto border border-border-main rounded-2xl">
              <table className="w-full text-xs text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-step-bg border-b border-border-main text-text-light/70 uppercase tracking-wider font-black text-[10px]">
                    <th className="py-4 px-4">আইডি</th>
                    <th className="py-4 px-4">খাত বিবরণী</th>
                    <th className="py-4 px-4">ক্যাটাগরি</th>
                    <th className="py-4 px-4">দাতার নাম / উৎস</th>
                    <th className="py-4 px-4 text-center">পদ্ধতি</th>
                    <th className="py-4 px-4 text-center">তারিখ</th>
                    <th className="py-4 px-4 text-right">পরিমাণ (টাকা)</th>
                    <th className="py-4 px-4 text-center w-24">রসিদ / অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/40 font-semibold text-text-main">
                  {filteredRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-primary/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">{rec.id}</td>
                      <td className="py-3.5 px-4 font-black">{rec.title}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 bg-primary/10 text-primary font-bold text-[10px] rounded-md">
                          {rec.categoryLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-text-light/80">
                        {rec.sourceOrDonor || 'সাধারণ রসিদ'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-text-light/70">
                        {rec.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-text-light/60">
                        {enToBnNumber(rec.date)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-success font-mono text-sm">
                        ৳{enToBnNumber(rec.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingReceipt(rec)}
                            className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="রসিদ দেখুন ও প্রিন্ট করুন"
                          >
                            <Printer size={14} />
                          </button>
                          {!rec.id.startsWith('INV-') && (
                            <button
                              onClick={() => handleDeleteIncome(rec.id)}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-xs font-bold text-text-light/50 italic">
                        কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: CREATE NEW INCOME VOUCHER ENTRY --- */}
      {activeTab === 'new' && (
        <div className="max-w-3xl mx-auto bg-card p-8 rounded-[2.5rem] border border-border-main shadow-2xl space-y-6 animate-fade-in text-left">
          <div className="border-b border-border-main/50 pb-4">
            <h3 className="text-xl font-black text-text-main flex items-center gap-2">
              <Plus className="text-primary" size={22} /> নতুন নগদ ও অনলাইন আয় গ্রহণ এন্ট্রি
            </h3>
            <p className="text-xs font-bold text-text-light/60 mt-0.5">
              মাদ্রাসার সমস্ত সাধারণ আয়, অনুদান, লিল্লাহ ফান্ড ও ভাড়ার টাকার ক্যাশবুক রসিদ এন্ট্রি
            </p>
          </div>

          <form onSubmit={handleAddIncome} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-text-main">আয়ের খাত বিবরণী / শিরোনাম *</label>
              <input
                type="text"
                required
                placeholder="যেমন: মাসিক সাধারণ অনুদান, লাইব্রেরি ফান্ড, দোকান ভাড়া..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-3.5 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-light/60">দ্রুত খাত নির্বাচন করুন (Presets):</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'মাসিক সাধারণ অনুদান', 
                  'লিল্লাহ তহবিল ও যাকাত', 
                  'মাদ্রাসা দোকান ভাড়া', 
                  'মসজিদ ও ওজুখানা ফান্ড', 
                  'ফরম বিক্রি ও ভর্তি বই', 
                  'পুরাতন মালামাল বিক্রি'
                ].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewTitle(p)}
                    className="px-3 py-1.5 bg-step-bg hover:bg-primary/10 hover:text-primary border border-border-main/60 rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-text-main">মূল ক্যাটাগরি *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full p-3.5 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none cursor-pointer"
                >
                  <option value="general">সাধারণ আয় (General Income)</option>
                  <option value="lillah">লিল্লাহ ও যাকাত (Lillah & Zakat)</option>
                  <option value="donation">অনুদান ও চাঁদা (Donations)</option>
                  <option value="rent">দোকান ও স্থাবর আয় (Rent & Property)</option>
                  <option value="student_fee">শিক্ষার্থী ফি (Fee Collection)</option>
                  <option value="other">অন্যান্য আয় (Other)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-text-main">টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  placeholder="যেমন: 5000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full p-3.5 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none font-mono focus:ring-2 focus:ring-primary text-success text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-text-main">দাতার নাম / প্রদানকারী উৎস</label>
                <input
                  type="text"
                  placeholder="যেমন: হাজী আব্দুর রহিম"
                  value={newDonor}
                  onChange={(e) => setNewDonor(e.target.value)}
                  className="w-full p-3.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-text-main">মোবাইল নম্বর (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: 01711001122"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-3.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-text-main">পেমেন্ট মেথড</label>
                <select
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                  className="w-full p-3.5 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none cursor-pointer"
                >
                  <option value="ক্যাশ">নগদ (Cash)</option>
                  <option value="ব্যাংক">ব্যাংক ট্রান্সফার (Bank)</option>
                  <option value="বিকাশ">বিকাশ (bKash)</option>
                  <option value="নগদ">নগদ মোবাইল মানি (Nagad)</option>
                  <option value="রকেট">রকেট (Rocket)</option>
                  <option value="চেক">ব্যাংক চেক (Cheque)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-text-main">গ্রহণের তারিখ</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-3.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-text-main">নোট / মন্তব্য (ঐচ্ছিক)</label>
              <textarea
                rows={2}
                placeholder="অতিরিক্ত কোনো বিশেষ তথ্য থাকলে লিখুন..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-medium outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                className="flex-1 py-4 bg-primary text-white font-black text-xs rounded-2xl hover:bg-primary-light active:scale-98 transition-all cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> নতুন আয় রসিদ সংরক্ষণ করুন
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className="px-6 py-4 bg-step-bg hover:bg-border-main/50 text-text-main font-black text-xs rounded-2xl transition-all cursor-pointer"
              >
                বাতিল করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- TAB 3, 4, 5: DIRECT CATEGORY LEDGERS (GENERAL, LILLAH, DONATIONS) --- */}
      {(activeTab === 'general' || activeTab === 'lillah' || activeTab === 'donations') && (
        <div className="bg-card p-6 rounded-[2.5rem] border border-border-main shadow-lg space-y-6 animate-fade-in">
          <div className="flex justify-between items-center pb-4 border-b border-border-main/50">
            <div>
              <h3 className="text-xl font-black text-text-main">
                {activeTab === 'general' ? 'সাধারণ আয় রেজিস্ট্রার' :
                 activeTab === 'lillah' ? 'লিল্লাহ ফান্ড ও যাকাত খতিয়ান' : 'অনুদান ও চাঁদা কালেকশন খতিয়ান'}
              </h3>
              <p className="text-xs font-bold text-text-light/60 mt-0.5">
                উক্ত ক্যাটাগরির আওতায় সংরক্ষিত সকল আয়ের ফিল্টারকৃত তালিকা
              </p>
            </div>

            <button
              onClick={() => { setActiveTab('new'); setNewCategory(activeTab === 'lillah' ? 'lillah' : activeTab === 'donations' ? 'donation' : 'general'); }}
              className="px-4 py-2.5 bg-primary text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> এই খাতা নতুন এন্ট্রি
            </button>
          </div>

          <div className="overflow-x-auto border border-border-main rounded-2xl">
            <table className="w-full text-xs text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase tracking-wider font-black text-[10px]">
                  <th className="p-4">আইডি</th>
                  <th className="p-4">খাত বিবরণ</th>
                  <th className="p-4">দাতার নাম / উৎস</th>
                  <th className="p-4">পদ্ধতি</th>
                  <th className="p-4 text-center">তারিখ</th>
                  <th className="p-4 text-right">পরিমাণ (টাকা)</th>
                  <th className="p-4 text-center">রসিদ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/40 font-semibold text-text-main">
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-primary/[0.02]">
                    <td className="p-4 font-mono font-bold text-primary">{rec.id}</td>
                    <td className="p-4 font-black">{rec.title}</td>
                    <td className="p-4 font-bold text-text-light/70">{rec.sourceOrDonor || 'সাধারণ'}</td>
                    <td className="p-4 font-bold text-text-light/60">{rec.paymentMethod}</td>
                    <td className="p-4 text-center font-bold text-text-light/60">{enToBnNumber(rec.date)}</td>
                    <td className="p-4 text-right font-black text-success font-mono">৳{enToBnNumber(rec.amount)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setViewingReceipt(rec)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                      >
                        <Printer size={15} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs font-bold text-text-light/50">
                      এই বিভাগে কোনো রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- OFFICIAL RECEIPT PRINT MODAL OVERLAY --- */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-hind-siliguri">
          <div className="bg-card w-full max-w-lg rounded-[2.5rem] border border-border-main shadow-2xl p-6 sm:p-8 space-y-6 relative animate-scale-up text-left">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-border-main/50 pb-4">
              <div>
                <h3 className="text-lg font-black text-text-main">দারুল উলুম মাদানিয়া মাদ্রাসা</h3>
                <p className="text-[10px] font-bold text-text-light/60 uppercase">আদায়কৃত নগদ আয় রশিদ ভাউচার</p>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1.5 text-text-light hover:text-text-main rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Receipt Card Details */}
            <div className="p-5 bg-step-bg rounded-2xl border border-border-main/60 space-y-3 font-medium text-xs">
              <div className="flex justify-between">
                <span className="text-text-light/60">রসিদ নম্বর:</span>
                <span className="font-mono font-bold text-primary">{viewingReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light/60">আয়ের খাত / বিবরণ:</span>
                <span className="font-black text-text-main">{viewingReceipt.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light/60">ক্যাটাগরি:</span>
                <span className="font-bold">{viewingReceipt.categoryLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light/60">দাতার নাম / প্রদানকারী:</span>
                <span className="font-bold">{viewingReceipt.sourceOrDonor || 'সাধারণ'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light/60">পেমেন্ট মেথড:</span>
                <span className="font-bold">{viewingReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-t border-border-main/40 pt-2">
                <span className="text-text-light/60">গ্রহণের তারিখ:</span>
                <span className="font-bold">{enToBnNumber(viewingReceipt.date)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-border-main/40 pt-2 text-base font-black">
                <span className="text-text-main">মোট আদায়কৃত টাকা:</span>
                <span className="text-success font-mono text-xl">৳{enToBnNumber(viewingReceipt.amount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2.5 bg-primary text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md hover:bg-primary-light cursor-pointer"
              >
                <Printer size={14} /> রসিদ প্রিন্ট করুন
              </button>
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2.5 bg-step-bg hover:bg-border-main/40 text-text-main font-bold text-xs rounded-xl cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
