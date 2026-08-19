import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { enToBnNumber } from '../../lib/utils';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Layers, 
  User, 
  Receipt, 
  DollarSign, 
  UserCheck, 
  Briefcase, 
  BookOpen, 
  FileText, 
  ShieldAlert,
  Info,
  CheckCircle2,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export const GlobalRecycleBin: React.FC = () => {
  const { 
    recycleBinItems, 
    restoreRecycleItem, 
    permanentDeleteRecycleItem, 
    emptyGlobalRecycleBin 
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionType, setActionType] = useState<'restore' | 'permanent-delete' | 'clear-all'>('restore');
  const [adminPassword, setAdminPassword] = useState('');

  // 30 days retention calculation helper
  const getItemExpiryInfo = (deletedAtStr: string) => {
    const deletedDate = new Date(deletedAtStr || Date.now());
    const expiryDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    
    return {
      deletedDateFormatted: deletedDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' }),
      daysLeft
    };
  };

  const getModuleIconAndColor = (type: string) => {
    switch (type) {
      case 'students':
        return { icon: User, color: 'text-sky-600 bg-sky-500/10 border-sky-500/20', label: 'শিক্ষার্থী' };
      case 'invoices':
        return { icon: Receipt, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', label: 'ফি ইনভয়েস' };
      case 'expenses':
        return { icon: DollarSign, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', label: 'ব্যয় ভাউচার' };
      case 'income':
      case 'income_records':
        return { icon: Receipt, color: 'text-green-600 bg-green-500/10 border-green-500/20', label: 'আয় রেকর্ড' };
      case 'staff_members':
      case 'teachers':
        return { icon: Briefcase, color: 'text-purple-600 bg-purple-500/10 border-purple-500/20', label: 'শিক্ষক / স্টাফ' };
      case 'acad_classes':
      case 'acad_branches':
      case 'acad_departments':
      case 'acad_subjects':
        return { icon: BookOpen, color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20', label: 'একাডেমিক ডাটা' };
      default:
        return { icon: FileText, color: 'text-rose-600 bg-rose-500/10 border-rose-500/20', label: 'সাধারণ ডাটা' };
    }
  };

  const filteredItems = useMemo(() => {
    return recycleBinItems.filter(item => {
      // Type filter
      if (selectedTypeFilter !== 'all' && item.type !== selectedTypeFilter) {
        return false;
      }
      // Search term filter
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      const title = (item.title || '').toLowerCase();
      const sub = (item.subtitle || '').toLowerCase();
      const typeLabel = (item.typeLabel || '').toLowerCase();
      return title.includes(q) || sub.includes(q) || typeLabel.includes(q);
    });
  }, [recycleBinItems, searchTerm, selectedTypeFilter]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = { all: recycleBinItems.length };
    recycleBinItems.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return counts;
  }, [recycleBinItems]);

  const handleRestore = async (item: any) => {
    try {
      await restoreRecycleItem(item.id);
      setShowConfirmModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDelete = async (item: any) => {
    const defaultValidPasswords = ['123', '123456', 'admin', 'admin123', '1234', '12345', 'pass123', 'password'];
    if (!defaultValidPasswords.includes(adminPassword.trim())) {
      toast.error('ভুল পাসওয়ার্ড! অ্যাডমিন পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    try {
      await permanentDeleteRecycleItem(item.id);
      setShowConfirmModal(false);
      setSelectedItem(null);
      setAdminPassword('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    const defaultValidPasswords = ['123', '123456', 'admin', 'admin123', '1234', '12345', 'pass123', 'password'];
    if (!defaultValidPasswords.includes(adminPassword.trim())) {
      toast.error('ভুল পাসওয়ার্ড! অ্যাডমিন পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    try {
      await emptyGlobalRecycleBin();
      setShowConfirmModal(false);
      setSelectedItem(null);
      setAdminPassword('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-left font-hind-siliguri animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bento-card p-6 md:p-8 bg-card border border-border-main shadow-xl rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
              <Trash2 size={12} /> গ্লোবাল সিস্টেম রিসাইকেল বিন (System Trash)
            </span>
            <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1">
              <Clock size={12} /> ৩০ দিন পর অটো-ডিলিট
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-text-main flex items-center gap-3">
            মুছে ফেলা তথ্যের কেন্দ্রীয় সংরক্ষণাগার
          </h2>
          <p className="text-xs font-semibold text-text-light/70 leading-relaxed">
            মাদ্রাসা সিস্টেমের যেকোনো মডিউল (শিক্ষার্থী, ফি রসিদ, আয়, ব্যয় ভাউচার, শিক্ষক বা একাডেমিক ডাটা) মুছে ফেললে তা ৩০ দিনের জন্য এই রিসাইকেল বিনে সুরক্ষিত থাকে। প্রয়োজন অনুযায়ী যেকোনো সময় সম্পূর্ণ তথ্যসহ পুনরুদ্ধার (Restore) করা যাবে।
          </p>
        </div>

        {/* Global Action & Total Count */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          <div className="px-5 py-3.5 bg-step-bg border border-border-main rounded-2xl flex items-center justify-between sm:justify-start gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-light/50 block">মোট ডাটা</span>
              <span className="text-xl font-black text-primary">{enToBnNumber(recycleBinItems.length)} টি</span>
            </div>
            <div className="w-px h-8 bg-border-main" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-light/50 block">ধারণ সময়</span>
              <span className="text-xs font-black text-amber-600">৩০ দিন পর্যন্ত</span>
            </div>
          </div>

          {recycleBinItems.length > 0 && (
            <button
              onClick={() => {
                setActionType('clear-all');
                setShowConfirmModal(true);
              }}
              className="px-5 py-3.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/30 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Trash2 size={16} /> রিসাইকেল বিন খালি করুন
            </button>
          )}
        </div>
      </div>

      {/* Module Filter Pills & Search */}
      <div className="bento-card p-4 bg-card border border-border-main shadow-lg rounded-2xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedTypeFilter === 'all'
                ? 'bg-primary text-white shadow-md'
                : 'bg-step-bg text-text-light hover:text-text-main border border-border-main'
            }`}
          >
            <Layers size={14} /> সমস্ত ডাটা ({enToBnNumber(stats.all || 0)})
          </button>
          {stats.students ? (
            <button
              onClick={() => setSelectedTypeFilter('students')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedTypeFilter === 'students'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-step-bg text-text-light hover:text-text-main border border-border-main'
              }`}
            >
              <User size={14} /> শিক্ষার্থী ({enToBnNumber(stats.students)})
            </button>
          ) : null}
          {stats.invoices ? (
            <button
              onClick={() => setSelectedTypeFilter('invoices')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedTypeFilter === 'invoices'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-step-bg text-text-light hover:text-text-main border border-border-main'
              }`}
            >
              <Receipt size={14} /> ফি ইনভয়েস ({enToBnNumber(stats.invoices)})
            </button>
          ) : null}
          {stats.expenses ? (
            <button
              onClick={() => setSelectedTypeFilter('expenses')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedTypeFilter === 'expenses'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-step-bg text-text-light hover:text-text-main border border-border-main'
              }`}
            >
              <DollarSign size={14} /> খরচ ({enToBnNumber(stats.expenses)})
            </button>
          ) : null}
          {stats.income || stats.income_records ? (
            <button
              onClick={() => setSelectedTypeFilter('income')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedTypeFilter === 'income'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-step-bg text-text-light hover:text-text-main border border-border-main'
              }`}
            >
              <Receipt size={14} /> আয় সমূহ ({enToBnNumber((stats.income || 0) + (stats.income_records || 0))})
            </button>
          ) : null}
          {stats.staff_members || stats.teachers ? (
            <button
              onClick={() => setSelectedTypeFilter('staff_members')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedTypeFilter === 'staff_members'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-step-bg text-text-light hover:text-text-main border border-border-main'
              }`}
            >
              <Briefcase size={14} /> শিক্ষক/স্টাফ ({enToBnNumber((stats.staff_members || 0) + (stats.teachers || 0))})
            </button>
          ) : null}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light/50" size={16} />
          <input
            type="text"
            placeholder="নাম, রসিদ নং বা বিবরণ দিয়ে খুঁজুন..."
            className="w-full pl-11 pr-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Deleted Items Table */}
      <div className="bento-card bg-card border border-border-main shadow-xl rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-step-bg border-b border-border-main text-text-light/70 uppercase font-black text-[10px]">
                <th className="py-4 px-5">মডিউল / ধরণ</th>
                <th className="py-4 px-5">মুছে ফেলা তথ্যের শিরোনাম ও বিবরণ</th>
                <th className="py-4 px-5">মুছে ফেলার তারিখ</th>
                <th className="py-4 px-5">অটো-ডিলিট কাউন্টডাউন</th>
                <th className="py-4 px-5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/40">
              {filteredItems.map((item: any) => {
                const { icon: ModIcon, color, label } = getModuleIconAndColor(item.type);
                const expiry = getItemExpiryInfo(item.deletedAt);

                return (
                  <tr key={item.id} className="hover:bg-primary/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${color}`}>
                        <ModIcon size={12} /> {item.typeLabel || label}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-black text-text-main text-sm">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[11px] font-semibold text-text-light/60 mt-0.5">{item.subtitle}</p>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-bold text-text-main block">{expiry.deletedDateFormatted}</span>
                      <span className="text-[10px] font-mono text-text-light/50">
                        {new Date(item.deletedAt || Date.now()).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <div>
                          <span className="font-black text-amber-600 block">
                            {enToBnNumber(expiry.daysLeft)} দিন বাকি
                          </span>
                          <span className="text-[9px] font-bold text-text-light/50">
                            (৩০ দিন পূর্ণ হলে বিলুপ্ত হবে)
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setActionType('restore');
                            setShowConfirmModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-500/20 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                          title="পুনরুদ্ধার করুন"
                        >
                          <RotateCcw size={14} /> রিস্টোর
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setActionType('permanent-delete');
                            setShowConfirmModal(true);
                          }}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/20 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                          title="চিরতরে মুছে ফেলুন"
                        >
                          <Trash2 size={14} /> স্থায়ী ডিলিট
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm font-black text-text-light/40 italic">
                    {searchTerm 
                      ? 'অনুসন্ধান অনুযায়ী কোনো মুছে ফেলা ডাটা পাওয়া যায়নি।' 
                      : 'রিসাইকেল বিন বর্তমানে খালি। কোনো মুছে ফেলা তথ্যের রেকর্ড নেই।'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Password Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="bg-card border border-border-main shadow-2xl rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                actionType === 'restore' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
              }`}>
                {actionType === 'restore' ? <RotateCcw size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-black text-text-main">
                  {actionType === 'restore' 
                    ? 'ডাটা পুনরুদ্ধার (Restore)' 
                    : actionType === 'permanent-delete' 
                    ? 'স্থায়ীভাবে মুছে ফেলা' 
                    : 'সম্পূর্ণ রিসাইকেল বিন খালি করা'}
                </h3>
                <p className="text-xs text-text-light/60 font-semibold">
                  {actionType === 'restore' 
                    ? 'তথ্যটি পুনরায় মূল ডাটাবেজ ও সংশ্লিষ্ট মডিউলে ফিরিয়ে নেওয়া হবে।' 
                    : 'এই কাজটি অপরিবর্তনীয় এবং ডাটাবেস থেকে স্থায়ীভাবে বিলুপ্ত হবে।'}
                </p>
              </div>
            </div>

            {selectedItem && (
              <div className="bg-step-bg p-3.5 rounded-2xl border border-border-main text-xs space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-light/50">নির্বাচিত তথ্য</span>
                <p className="font-black text-text-main">{selectedItem.title}</p>
                {selectedItem.subtitle && (
                  <p className="text-text-light/70">{selectedItem.subtitle}</p>
                )}
              </div>
            )}

            {actionType !== 'restore' && (
              <div className="space-y-2">
                <label className="text-xs font-black text-text-light/70 uppercase tracking-wider block">
                  নিরাপত্তা নিশ্চিতকরণে অ্যাডমিন পাসওয়ার্ড দিন
                </label>
                <input
                  type="password"
                  placeholder="অ্যাডমিন পাসওয়ার্ড (যেমন: 123 বা admin)..."
                  className="w-full px-4 py-3 bg-step-bg border border-border-main rounded-xl text-sm font-black outline-none text-text-main focus:border-rose-500"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedItem(null);
                  setAdminPassword('');
                }}
                className="flex-1 py-3 bg-step-bg hover:bg-card border border-border-main text-text-main rounded-xl font-black text-xs cursor-pointer transition-all"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  if (actionType === 'restore') {
                    handleRestore(selectedItem);
                  } else if (actionType === 'permanent-delete') {
                    handlePermanentDelete(selectedItem);
                  } else {
                    handleClearAll();
                  }
                }}
                className={`flex-1 py-3 text-white rounded-xl font-black text-xs cursor-pointer transition-all shadow-md ${
                  actionType === 'restore' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionType === 'restore' ? 'হ্যাঁ, রিস্টোর করুন' : 'নিশ্চিত ডিলিট'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
