import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../../contexts/DataContext';

import { 
  Plus, 
  Trash2, 
  Coins, 
  Grid, 
  Edit,
  Save, 
  CheckCircle2, 
  AlertTriangle,
  Settings,
  HelpCircle,
  Copy,
  Info,
  Check,
  X,
  XCircle,
  Tag,
  RefreshCw,
  TrendingUp,
  Sliders,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { JAMAT_LIST } from '../../constants';
import { enToBnNumber, cn } from '../../lib/utils';

export interface FeeHead {
  id: string;
  name: string;
  allowDiscount?: boolean;
  defaultDiscount?: number;
  discountType?: 'amount' | 'percent';
  frequency?: 'monthly_mandatory' | 'monthly_optional' | 'yearly' | 'one_time' | 'occasional';
  applicableTo?: 'all' | 'residential' | 'non_residential' | 'day_care';
  dueDay?: number;
}

interface ClassFeeMapping {
  [jamatName: string]: {
    [headId: string]: number;
  };
}

export const FeesCostPackageManager: React.FC = () => {
  // Toast Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { feeHeads, classFeeMapping, updateData, deleteData } = useData();
  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // Fee Heads State (Maintains list of expense categories)

  // Class Fee Mapping State (Keyed by Jamat, containing headId -> Rate mapping)

  // Sync state to LocalStorage

  // Add Fee Head State
  const [newHeadName, setNewHeadName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Global Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [draftMapping, setDraftMapping] = useState<ClassFeeMapping>({});
  const [draftHeads, setDraftHeads] = useState<FeeHead[]>([]);
  const [syncRows, setSyncRows] = useState<Set<string>>(new Set());

  // Enter Edit Mode
  // Scrollable container ref
  const scrollRef = useRef<HTMLDivElement>(null);

  // Drag to scroll logic
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Mouse wheel horizontal scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    // If not holding shift and scrolling vertically, translate to horizontal
    if (e.deltaY !== 0 && e.deltaX === 0) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleStartGlobalEdit = () => {
    setDraftMapping(JSON.parse(JSON.stringify(classFeeMapping)));
    setDraftHeads([...feeHeads]);
    setSyncRows(new Set());
    setIsEditing(true);
  };

  // Save All Changes
  const handleSaveGlobalEdit = async () => {
    // Validate empty names
    for (const h of draftHeads) {
      if (!h.name.trim()) {
        showToast('error', 'কোনো খাতের নাম ফাঁকা রাখা যাবে না!');
        return;
      }
    }
    
    // Check for duplicate names
    const names = draftHeads.map(h => h.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      showToast('error', 'একাধিক খাতের একই নাম ব্যবহার করা যাবে না!');
      return;
    }

    // Save to backend via context
    await updateData('fee_heads_all', draftHeads);
    await updateData('class_fee_mappings_all', draftMapping);

    setIsEditing(false);
    showToast('success', 'সকল পরিবর্তন সফলভাবে সংরক্ষণ করা হয়েছে।');
  };
  const handleCancelGlobalEdit = () => {
    setIsEditing(false);
  };

  const handleDraftRateChange = (headId: string, jamat: string, val: number) => {
    setDraftMapping(prev => {
      const next = JSON.parse(JSON.stringify(prev)); // deep copy to ensure immutability
      if (syncRows.has(headId)) {
        JAMAT_LIST.forEach(j => {
          if (!next[j]) next[j] = {};
          next[j][headId] = val;
        });
      } else {
        if (!next[jamat]) next[jamat] = {};
        next[jamat][headId] = val;
      }
      return next;
    });
  };

  const handleDraftHeadNameChange = (headId: string, val: string) => {
    setDraftHeads(prev => prev.map(h => h.id === headId ? { ...h, name: val } : h));
  };

  const handleDraftHeadDiscountToggle = (headId: string) => {
    setDraftHeads(prev => prev.map(h => {
      if (h.id === headId) {
        const currentAllowed = h.allowDiscount !== false;
        return { ...h, allowDiscount: !currentAllowed };
      }
      return h;
    }));
  };

  const handleDraftHeadDiscountChange = (headId: string, field: 'defaultDiscount' | 'discountType', val: any) => {
    setDraftHeads(prev => prev.map(h => {
      if (h.id === headId) {
        return { ...h, [field]: val };
      }
      return h;
    }));
  };

  const handleDraftHeadConfigChange = (headId: string, field: 'frequency' | 'applicableTo' | 'dueDay', val: any) => {
    setDraftHeads(prev => prev.map(h => {
      if (h.id === headId) {
        return { ...h, [field]: val };
      }
      return h;
    }));
  };

  const toggleSyncRow = (headId: string) => {
    setSyncRows(prev => {
      const next = new Set(prev);
      if (next.has(headId)) next.delete(headId);
      else next.add(headId);
      return next;
    });
  };

  // Handle adding a new custom cost head (can be done anytime, even in edit mode, but better handled gracefully)
  const handleAddFeeHead = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newHeadName.trim();
    if (!name) return;

    const exists = (isEditing ? draftHeads : feeHeads).some(h => h.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      showToast('error', 'এই খাতের নামটি ইতিমধ্যে বিদ্যমান!');
      return;
    }

    const newId = Math.random().toString(36).substr(2, 9);
    const newHead: FeeHead = { 
      id: newId, 
      name, 
      frequency: 'monthly_mandatory', 
      applicableTo: 'all', 
      dueDay: 12, 
      allowDiscount: true 
    };
    
    if (isEditing) {
      setDraftHeads([...draftHeads, newHead]);
      setDraftMapping(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        JAMAT_LIST.forEach(jamat => {
          if (!next[jamat]) next[jamat] = {};
          next[jamat][newId] = 0;
        });
        return next;
      });
    } else {
      const initialDraftMapping = JSON.parse(JSON.stringify(classFeeMapping));
      const initialDraftHeads = [...feeHeads];
      
      const updatedHeads = [...initialDraftHeads, newHead];
      const updatedMapping = { ...initialDraftMapping };
      JAMAT_LIST.forEach(jamat => {
        if (!updatedMapping[jamat]) updatedMapping[jamat] = {};
        updatedMapping[jamat][newId] = 0;
      });

      setDraftHeads(updatedHeads);
      setDraftMapping(updatedMapping);
      setSyncRows(new Set());
      setIsEditing(true);
    }

    setNewHeadName('');
    setShowAddForm(false);
    showToast('success', `নতুন খরচের খাত "${name}" সফলভাবে যুক্ত হয়েছে! সংরক্ষণ মোড চালু করা হয়েছে।`);
  };

  // Handle deleting a cost head in edit mode
  const handleDeleteDraftFeeHead = (id: string, name: string) => {
    const isSystemHead = Number(id) >= 1 && Number(id) <= 13;
    if (isSystemHead) {
      showToast('error', 'মাদ্রাসার ডিফল্ট ১৩টি খরচের খাত ডিলিট করা সম্ভব নয়।');
      return;
    }
    if (window.confirm(`আপনি কি নিশ্চিত যে "${name}" খাতটি সম্পূর্ণ মুছে ফেলতে চান?`)) {
      setDraftHeads(draftHeads.filter(h => h.id !== id));
      setDraftMapping(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        JAMAT_LIST.forEach(jamat => {
          if (next[jamat]) {
            delete next[jamat][id];
          }
        });
        return next;
      });
      showToast('success', 'খাতটি মুছে ফেলা হয়েছে (সংরক্ষণ করলে কার্যকর হবে)।');
    }
  };

  // Reset defaults
  const handleRestoreDefaults = () => {
    if (window.confirm("আপনি কি নিশ্চিত যে সকল জামাতের খরচের প্যাকেজ ও বেতন কাঠামো ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান? এতে আপনার সমস্ত কাস্টম এন্ট্রি ও পরিবর্তনের হার মুছে যাবে।")) {
      localStorage.removeItem('madrasah-class-fee-mapping');
      localStorage.removeItem('madrasah-fee-heads');
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col gap-4 font-hind-siliguri text-left w-full min-w-0 overflow-hidden sm:overflow-visible">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-2 max-w-sm",
              toast.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-rose-500/10 border-rose-500/20 text-rose-600"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span className="text-xs font-bold">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Title Bar */}
      <div className="p-5 sm:p-6 bg-card border border-border-main rounded-[2rem] shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full min-w-0">
        <div>
          <h2 className="text-3xl font-black text-text-main tracking-tighter flex items-center gap-3">
            <Coins className="text-primary animate-pulse" /> খরচের প্যাকেজ বা বিবরণ
          </h2>
          <p className="text-xs text-text-light/50 mt-1 uppercase tracking-wider font-bold">
            জামাত ভিত্তিক খরচ ও বেতনের কাস্টম সেটিংস মডিউল
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:scale-103 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-primary/10"
          >
            <Plus size={14} /> নতুন খরচের খাত যোগ করুন
          </button>
          <button 
            onClick={handleRestoreDefaults}
            className="px-4 py-2.5 border border-border-main hover:border-error/30 hover:bg-error/5 text-text-light hover:text-error rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw size={12} /> ডিফল্ট সেটিংস রিসেট
          </button>
        </div>
      </div>

      {/* New Category Add Form Drawer/Panel */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddFeeHead} className="p-6 bg-step-bg border border-border-main rounded-3xl flex flex-col md:flex-row items-end gap-4 shadow-inner">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-black text-text-main">নতুন খরচের খাতের নাম লিখুন</label>
                <input 
                  type="text"
                  required
                  placeholder="যেমন: ইমারত নির্মাণ ফি, পরীক্ষা ফর্ম ফি, কুতুবখানা ফি..."
                  className="w-full px-4 py-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:ring-2 focus:ring-primary/20 transition-all"
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  type="submit"
                  className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl cursor-pointer transition-all"
                >
                  খাত যুক্ত করুন
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-3 bg-card border border-border-main text-text-light hover:text-text-main font-bold text-xs rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Matrix Container */}
      <div className="bg-card border border-border-main rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-8 shadow-2xl relative w-full min-w-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/3 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2 px-1 sm:px-0">
            <div>
              <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                <Grid size={18} className="text-primary" /> জামাতভিত্তিক খরচ কাঠামো ম্যাট্রিক্স
              </h3>
              <p className="text-[10px] font-bold text-text-light/50 uppercase tracking-wider mt-1">
                সিস্টেমের সকল জামাতের সাথে খরচের খাতসমূহের সুনির্দিষ্ট ম্যাপিং (নিচে ডানে স্ক্রল করুন)
              </p>
            </div>
            
            {!isEditing ? (
              <button 
                onClick={handleStartGlobalEdit}
                className="w-full sm:w-auto justify-center px-4 py-3 sm:py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Edit size={14} /> এডিট করুন
              </button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleCancelGlobalEdit}
                  className="flex-1 sm:flex-none justify-center px-4 py-3 sm:py-2 bg-card border border-border-main text-text-light hover:text-text-main font-bold text-xs rounded-xl cursor-pointer shadow-sm"
                >
                  বাতিল
                </button>
                <button 
                  onClick={handleSaveGlobalEdit}
                  className="flex-1 sm:flex-none justify-center px-4 py-3 sm:py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl hover:scale-102 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Save size={14} /> সেভ করুন
                </button>
              </div>
            )}
          </div>

          {/* TABLE MATRIX */}
          <div className="relative border border-border-main rounded-2xl sm:rounded-3xl bg-card shadow-lg overflow-hidden w-full min-w-0">
            {/* Scroll Indicator Shadow */}
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-black/10 to-transparent pointer-events-none z-20" />
            
            <div 
              className={cn("overflow-x-auto custom-scrollbar select-none", isDragging ? "cursor-grabbing" : "cursor-grab")}
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onWheel={handleWheel}
            >
              <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-border-main">
                  <th className="py-4 px-3 sm:px-5 text-xs font-black text-white/95 uppercase tracking-wider text-left sticky left-0 bg-slate-900 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.2)] min-w-[110px] sm:min-w-[130px] md:min-w-[200px]">
                    খরচের খাত
                  </th>
                  <th className="py-4 px-3 text-[10px] font-black text-white/95 uppercase tracking-wider text-center min-w-[150px] border-l border-slate-800">
                    ছাড়ের নিয়ম / বিষয়
                  </th>
                  <th className="py-4 px-3 text-[10px] font-black text-white/95 uppercase tracking-wider text-center min-w-[200px] border-l border-slate-800">
                    খাতের ধরণ ও ফ্রিকোয়েন্সি
                  </th>
                  {JAMAT_LIST.map((jamat, idx) => (
                    <th key={jamat} className="py-4 px-2 sm:px-3 text-[10px] font-black text-white/80 uppercase tracking-wider text-center min-w-[85px] sm:min-w-[90px] border-l border-slate-800">
                      <div className="truncate w-full max-w-[110px] mx-auto" title={jamat}>
                        {jamat.split(' (')[0]}
                      </div>
                      <span className="text-[8px] text-white/40 block mt-0.5">
                        {jamat.includes('(') ? jamat.split('(')[1].replace(')', '') : 'জামাত'}
                      </span>
                    </th>
                  ))}
                  {isEditing && (
                    <th className="py-4 px-3 sm:px-4 text-[10px] sm:text-xs font-black text-white/95 uppercase tracking-wider text-right min-w-[100px] border-l border-slate-800 md:sticky md:right-0 bg-slate-900 md:z-20 md:shadow-[-4px_0_12px_rgba(0,0,0,0.15)]">
                      একক রেট
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/40 text-xs">
                {(isEditing ? draftHeads : feeHeads).map(head => {
                  const isSystemHead = Number(head.id) >= 1 && Number(head.id) <= 13;
                  const isSyncRow = syncRows.has(head.id);

                  return (
                    <tr key={head.id} className={cn("transition-colors group", isEditing ? "hover:bg-primary/5" : "hover:bg-primary/[0.015]")}>
                      {/* Cost Category Name (Sticky Left Column) */}
                      <td className="py-3 sm:py-4 px-3 sm:px-5 border-r border-border-main/50 sticky left-0 bg-card group-hover:bg-slate-50/50 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.08)] min-w-[110px] sm:min-w-[130px] md:min-w-[200px] align-middle">
                        <div className="flex flex-col justify-center min-h-[48px]">
                          {isEditing && !isSystemHead ? (
                            <input
                              type="text"
                              value={head.name}
                              onChange={(e) => handleDraftHeadNameChange(head.id, e.target.value)}
                              className="w-full px-2 py-1.5 sm:py-1 bg-step-bg border border-border-main focus:border-primary focus:ring-1 focus:ring-primary/20 rounded outline-none text-xs font-bold transition-all"
                              placeholder="খাতের নাম"
                            />
                          ) : (
                            <span className="font-black text-text-main text-[11px] sm:text-sm leading-tight">{head.name}</span>
                          )}
                          {isSystemHead ? (
                            <span className="text-[7px] sm:text-[8px] font-black text-primary/70 uppercase tracking-widest mt-1">ডিফল্ট খাত</span>
                          ) : (
                            <span className="text-[7px] sm:text-[8px] font-black text-amber-600 uppercase tracking-widest mt-1">কাস্টম খাত</span>
                          )}
                        </div>
                      </td>

                      {/* Discount Rules Column */}
                      <td className="py-2 px-3 border-r border-border-main/50 align-middle min-w-[160px]">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5 p-1.5 bg-step-bg rounded-xl border border-border-main/50">
                            <button
                              type="button"
                              onClick={() => handleDraftHeadDiscountToggle(head.id)}
                              className={cn(
                                "w-full px-2 py-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all border",
                                head.allowDiscount !== false
                                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20"
                              )}
                            >
                              {head.allowDiscount !== false ? (
                                <>
                                  <CheckCircle2 size={12} /> <span>ছাড় প্রযোজ্য</span>
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} /> <span>ছাড় নিষিদ্ধ</span>
                                </>
                              )}
                            </button>

                            {head.allowDiscount !== false && (
                              <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border-main/60">
                                <span className="text-[9px] font-bold text-text-light/60 pl-1 whitespace-nowrap">অটো:</span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="০"
                                  value={head.defaultDiscount || ''}
                                  onChange={(e) => handleDraftHeadDiscountChange(head.id, 'defaultDiscount', Number(e.target.value) || 0)}
                                  className="w-14 px-1.5 py-0.5 bg-step-bg border border-border-main rounded text-[10px] font-black text-center text-text-main outline-none focus:border-primary"
                                />
                                <select
                                  value={head.discountType || 'amount'}
                                  onChange={(e) => handleDraftHeadDiscountChange(head.id, 'discountType', e.target.value)}
                                  className="px-1 py-0.5 bg-step-bg border border-border-main rounded text-[10px] font-black text-text-main cursor-pointer outline-none"
                                >
                                  <option value="amount">৳</option>
                                  <option value="percent">%</option>
                                </select>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            {head.allowDiscount === false ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-600 rounded-lg text-[10px] font-black border border-rose-500/20 whitespace-nowrap">
                                <XCircle size={12} /> ছাড় নিষিদ্ধ
                              </span>
                            ) : (head.defaultDiscount || 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-700 rounded-lg text-[10px] font-black border border-emerald-500/20 whitespace-nowrap">
                                <Tag size={12} /> অটো ছাড়: {head.discountType === 'percent' ? `${enToBnNumber(head.defaultDiscount!)}%` : `৳${enToBnNumber(head.defaultDiscount!)}`}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-500/20 whitespace-nowrap">
                                <CheckCircle2 size={11} /> ছাড় অনুমোদিত
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Frequency & Rules Column */}
                      <td className="py-2 px-3 border-r border-border-main/50 align-middle min-w-[200px]">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5 p-1.5 bg-step-bg rounded-xl border border-border-main/50">
                            <div>
                              <label className="text-[9px] font-bold text-text-light/60 block mb-0.5">ফ্রিকোয়েন্সি:</label>
                              <select
                                value={head.frequency || 'monthly_mandatory'}
                                onChange={(e) => handleDraftHeadConfigChange(head.id, 'frequency', e.target.value)}
                                className="w-full px-2 py-1 bg-card border border-border-main rounded text-[10px] font-bold text-text-main cursor-pointer outline-none focus:border-primary"
                              >
                                <option value="monthly_mandatory">প্রতি মাসে বাধ্যতামূলক</option>
                                <option value="monthly_optional">প্রতি মাসে অপশনাল</option>
                                <option value="yearly">বাৎসরিক ফি</option>
                                <option value="one_time">এককালীন / ভর্তি ফি</option>
                                <option value="occasional">প্রয়োজনে / বিশেষ</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-1">
                              <div className="flex-1">
                                <label className="text-[9px] font-bold text-text-light/60 block mb-0.5">প্রযোজ্য:</label>
                                <select
                                  value={head.applicableTo || 'all'}
                                  onChange={(e) => handleDraftHeadConfigChange(head.id, 'applicableTo', e.target.value)}
                                  className="w-full px-1.5 py-1 bg-card border border-border-main rounded text-[10px] font-bold text-text-main cursor-pointer outline-none focus:border-primary"
                                >
                                  <option value="all">সকল বিভাগ</option>
                                  <option value="residential">শুধু আবাসিক</option>
                                  <option value="non_residential">শুধু অনাবাসিক</option>
                                  <option value="day_care">শুধু ডে-কেয়ার</option>
                                </select>
                              </div>
                              <div className="w-16">
                                <label className="text-[9px] font-bold text-text-light/60 block mb-0.5">শেষ তারিখ:</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="31"
                                  placeholder="১২"
                                  value={head.dueDay || 12}
                                  onChange={(e) => handleDraftHeadConfigChange(head.id, 'dueDay', Number(e.target.value) || 12)}
                                  className="w-full px-1 py-1 bg-card border border-border-main rounded text-[10px] font-bold text-center text-text-main outline-none focus:border-primary"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1 text-center">
                            {head.frequency === 'monthly_mandatory' || !head.frequency ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-700 rounded-lg text-[10px] font-black border border-amber-500/20 whitespace-nowrap">
                                প্রতি মাসে আবশ্যক
                              </span>
                            ) : head.frequency === 'yearly' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-700 rounded-lg text-[10px] font-black border border-indigo-500/20 whitespace-nowrap">
                                বাৎসরিক ফি
                              </span>
                            ) : head.frequency === 'one_time' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 text-purple-700 rounded-lg text-[10px] font-black border border-purple-500/20 whitespace-nowrap">
                                এককালীন ভর্তি ফি
                              </span>
                            ) : head.frequency === 'monthly_optional' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-500/10 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-500/20 whitespace-nowrap">
                                মাসিক অপশনাল
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-500/10 text-sky-700 rounded-lg text-[10px] font-bold border border-sky-500/20 whitespace-nowrap">
                                প্রয়োজনে প্রযোজ্য
                              </span>
                            )}

                            <div className="flex items-center gap-1 text-[9px] font-bold text-text-light/60">
                              <span>
                                {head.applicableTo === 'residential'
                                  ? 'আবাসিক'
                                  : head.applicableTo === 'non_residential'
                                  ? 'অনাবাসিক'
                                  : head.applicableTo === 'day_care'
                                  ? 'ডে-কেয়ার'
                                  : 'সকল'}
                              </span>
                              <span>•</span>
                              <span>শেষ: {enToBnNumber(head.dueDay || 12)} তারিখ</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Jamat Rate Columns */}
                      {JAMAT_LIST.map(jamat => {
                        const currentRate = isEditing 
                          ? (draftMapping[jamat]?.[head.id] || 0)
                          : (classFeeMapping[jamat]?.[head.id] || 0);

                        return (
                          <td key={jamat} className="py-2 px-1.5 sm:px-2 text-center border-l border-border-main/30 font-black text-text-main align-middle">
                            {isEditing ? (
                              <div className={cn("flex items-center justify-center bg-step-bg border rounded transition-colors focus-within:border-primary", isSyncRow ? "border-primary/40 bg-primary/5" : "border-border-main/50")}>
                                <span className="text-[10px] text-text-light/50 pl-1.5 sm:pl-2">৳</span>
                                <input
                                  type="number"
                                  className="w-full bg-transparent text-center px-1 py-2 sm:py-1.5 outline-none font-bold text-xs"
                                  value={currentRate || ''}
                                  onChange={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : 0;
                                    handleDraftRateChange(head.id, jamat, val);
                                  }}
                                />
                              </div>
                            ) : (
                              currentRate > 0 ? (
                                <span className="inline-block px-1.5 sm:px-2 py-1 bg-primary/5 text-primary rounded-lg text-[11px] sm:text-xs">
                                  ৳{enToBnNumber(currentRate)}
                                </span>
                              ) : (
                                <span className="text-text-light/35 font-bold text-[11px] sm:text-xs">৳০</span>
                              )
                            )}
                          </td>
                        );
                      })}

                      {/* Row Action Column (Only in Edit Mode) */}
                      {isEditing && (
                        <td className="py-2 px-2 sm:px-4 border-l border-border-main/30 md:sticky md:right-0 bg-card group-hover:bg-slate-50/50 md:z-20 align-middle">
                          <div className="flex flex-col gap-2 items-end justify-center">
                            <label className="flex items-center gap-1.5 cursor-pointer bg-step-bg px-2 py-2 sm:py-1.5 rounded-lg border border-border-main hover:border-primary/30 transition-all select-none">
                              <input 
                                type="checkbox" 
                                checked={isSyncRow}
                                onChange={() => toggleSyncRow(head.id)}
                                className="w-4 h-4 sm:w-3.5 sm:h-3.5 rounded text-primary border-border-main focus:ring-primary/20 cursor-pointer"
                              />
                              <span className="text-[9px] sm:text-[10px] font-bold text-text-main whitespace-nowrap">সব জামাতে</span>
                            </label>

                            {!isSystemHead && (
                              <button 
                                onClick={() => handleDeleteDraftFeeHead(head.id, head.name)}
                                className="w-full justify-center px-2 py-1.5 sm:py-1 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-100 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 size={10} /> ডিলিট
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>

          {/* Footer Guide text */}
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl text-xs font-bold text-primary/80 flex items-start gap-2.5 leading-relaxed">
            <HelpCircle size={15} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p>এখানে নির্ধারিত প্রতি জামাতের খরচের রেটসমূহ মূল ভর্তি মডিউল, বেতন আদায় মডিউল ও রসিদ তৈরিতে সরাসরি স্বয়ংক্রিয়ভাবে লোড হবে।</p>
              <p className="text-[10px] text-text-light/50">যেকোনো সময় রিসেট করতে "ডিফল্ট সেটিংস রিসেট" বাটন ব্যবহার করতে পারেন।</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};