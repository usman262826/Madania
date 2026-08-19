import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Tag, 
  User, 
  FileText,
  XCircle,
  Filter
} from 'lucide-react';
import { Expense } from '../../types';
import { useData } from '../../contexts/DataContext';
import { enToBnNumber, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Download, Printer } from 'lucide-react';

export const Expenses: React.FC = () => {
  const { expenses, updateData, deleteData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const categories = ['All', 'ইউটিলিটি', 'খাবার', 'অফিস', 'রক্ষণাবেক্ষণ', 'বেতন', 'সাধারণ'];
  const monthsList = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];

  const getMonthNameFromDateOrString = (dateStr?: string, monthStr?: string): string => {
    if (monthStr && monthStr.trim()) {
      const trimmed = monthStr.trim();
      if (monthsList.includes(trimmed)) return trimmed;
    }
    if (!dateStr) return '';
    const str = String(dateStr).trim();
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

  const currentMonthName = monthsList[new Date().getMonth()];

  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'সাধারণ',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    spentBy: 'অ্যাডমিন'
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      title: newExpense.title,
      category: newExpense.category,
      amount: Number(newExpense.amount),
      date: newExpense.date,
      description: newExpense.description,
      spentBy: newExpense.spentBy
    };
    await updateData('expenses', expense);
    setShowAddModal(false);
    setNewExpense({
      title: '',
      category: 'সাধারণ',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      spentBy: 'অ্যাডমিন'
    });
  };

  const deleteExpense = async (id: string) => {
    if(window.confirm('আপনি কি নিশ্চিত যে আপনি এই ব্যয়ের রেকর্ডটি মুছে ফেলতে চান?')) {
      await deleteData('expenses', id);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.title.includes(searchTerm) || e.spentBy?.includes(searchTerm) || (e.description && e.description.includes(searchTerm));
      const matchesCategory = filterCategory === 'All' || e.category === filterCategory;
      let matchesMonth = true;
      if (selectedMonth !== 'all') {
        const recMonth = getMonthNameFromDateOrString(e.date, (e as any).month);
        matchesMonth = (recMonth === selectedMonth);
      }
      return matchesSearch && matchesCategory && matchesMonth;
    });
  }, [searchTerm, filterCategory, selectedMonth, expenses]);

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
  }, [filteredExpenses]);

  const currentMonthExpense = useMemo(() => {
    return expenses.reduce((acc, cur) => {
      const recMonth = getMonthNameFromDateOrString(cur.date, (cur as any).month);
      if (recMonth === currentMonthName) {
        return acc + (Number(cur.amount) || 0);
      }
      return acc;
    }, 0);
  }, [expenses, currentMonthName]);

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredExpenses.map(e => ({
      'শিরোনাম': e.title,
      'ক্যাটাগরি': e.category,
      'পরিমাণ': e.amount,
      'তারিখ': e.date,
      'ব্যয়কারী': e.spentBy,
      'বিবরণ': e.description || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `Expenses_Export_${new Date().toLocaleDateString()}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Madrasah Expense Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = ["Title", "Category", "Amount", "Date", "Spent By"];
    const tableRows = filteredExpenses.map(e => [
      e.title,
      e.category,
      e.amount.toString(),
      e.date,
      e.spentBy || 'N/A'
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [239, 68, 68] } // Red color for expenses
    });

    doc.save(`Expenses_Report_${new Date().getTime()}.pdf`);
  };

  const stats = [
    { 
      label: selectedMonth === 'all' ? 'মোট ব্যয় (সর্বমোট)' : `${selectedMonth} মাসের ব্যয়`, 
      value: enToBnNumber(totalExpense.toString()), 
      icon: DollarSign, 
      color: 'text-error' 
    },
    { 
      label: `চলতি মাসের ব্যয় (${currentMonthName})`, 
      value: enToBnNumber(currentMonthExpense.toString()), 
      icon: TrendingUp, 
      color: 'text-warning' 
    },
    { 
      label: 'ফিল্টারকৃত রেকর্ড এন্ট্রি', 
      value: enToBnNumber(filteredExpenses.length.toString()), 
      icon: FileText, 
      color: 'text-primary' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bento-card p-10 bg-card border border-border-main relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:bg-primary/10 transition-colors" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
            <p className="text-[10px] font-black text-text-light/50 uppercase tracking-[0.4em]">প্রতিদিনের ব্যয় খাত</p>
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-text-main italic">ব্যয় ও খরচ ব্যবস্থাপনা</h2>
        </div>
        
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-inner flex-wrap gap-1">
              <button 
                onClick={exportToPDF}
                className="px-4 py-3 bg-white text-text-main border border-border-main rounded-xl text-[9px] font-black flex items-center gap-2 hover:bg-primary/5 transition-all"
              >
                <Printer size={14} className="text-primary" /> PDF
              </button>
              <button 
                onClick={exportToExcel}
                className="px-4 py-3 bg-white text-text-main border border-border-main rounded-xl text-[9px] font-black flex items-center gap-2 hover:bg-success/5 transition-all"
              >
                <Download size={14} className="text-success" /> Excel
              </button>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-text-main text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-text-main/20"
          >
             <Plus size={18} /> নতুন ব্যয় যুক্ত করুন
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {stats.map((stat, i) => (
           <div key={i} className="bento-card p-8 bg-card border border-border-main flex items-center gap-6 group hover:border-primary/50 transition-all shadow-sm">
              <div className={cn("w-16 h-16 rounded-2xl bg-step-bg flex items-center justify-center border border-border-main/50 group-hover:scale-110 transition-transform shadow-inner", stat.color)}>
                 <stat.icon size={28} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-light/40 mb-1">{stat.label}</p>
                 <h3 className="text-3xl font-black text-text-main tracking-tighter italic">৳{stat.value}</h3>
              </div>
           </div>
         ))}
      </div>

      {/* Filtering & Listing */}
      <div className="bento-card bg-card border border-border-main p-8 shadow-2xl relative overflow-hidden">
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
            <div>
               <h3 className="text-xl font-black text-text-main flex items-center gap-2 italic">
                  <ShoppingBag size={20} className="text-error" /> খরচের তালিকা
               </h3>
               <p className="text-[10px] font-bold text-text-light/40 uppercase tracking-widest mt-1">মাদ্রাসার সকল ব্যয়ের হিসাব এখানে সংরক্ষিত</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
               <div className="relative flex-1 lg:w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light/40" size={18} />
                  <input 
                   type="text" 
                   placeholder="খরচের নাম বা ব্যক্তির নাম..."
                   className="w-full pl-12 pr-6 py-4 bg-step-bg border border-border-main rounded-2xl font-bold text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               
               <div className="flex items-center gap-3 bg-step-bg px-5 py-4 rounded-2xl border border-border-main shadow-inner">
                  <Calendar size={18} className="text-primary" />
                  <select 
                    className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest text-text-main cursor-pointer"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="all">সকল মাস (পুরো বছর)</option>
                    {monthsList.map((m, idx) => (
                      <option key={m} value={m}>
                        {m} {idx === new Date().getMonth() ? '(চলতি মাস)' : ''}
                      </option>
                    ))}
                  </select>
               </div>

               <div className="flex items-center gap-3 bg-step-bg px-5 py-4 rounded-2xl border border-border-main shadow-inner">
                  <Filter size={18} className="text-text-light/40" />
                  <select 
                    className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest text-text-main cursor-pointer"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'সকল ক্যাটেগরি' : cat}</option>)}
                  </select>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredExpenses.map((expense, i) => (
              <motion.div 
                 key={expense.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 className="group p-6 bg-step-bg border border-border-main/50 rounded-[2rem] hover:border-error/30 hover:bg-white transition-all shadow-sm"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-card rounded-xl border border-border-main flex items-center justify-center text-error">
                          <ShoppingBag size={20} />
                       </div>
                       <div>
                          <h4 className="font-black text-text-main text-lg tracking-tight leading-none mb-1 group-hover:text-error transition-colors">{expense.title}</h4>
                          <span className="px-3 py-1 bg-white border border-border-main rounded-full text-[8px] font-black uppercase tracking-widest text-text-light/60">
                             {expense.category}
                          </span>
                       </div>
                    </div>
                    <button 
                      onClick={() => deleteExpense(expense.id)}
                      className="p-2 text-text-light/20 hover:text-error transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-card rounded-2xl border border-border-main/50">
                       <p className="text-[8px] font-black text-text-light/40 uppercase tracking-widest mb-1">টাকার পরিমাণ</p>
                       <p className="text-xl font-black text-text-main italic">৳{enToBnNumber(expense.amount.toString())}</p>
                    </div>
                    <div className="p-4 bg-card rounded-2xl border border-border-main/50">
                       <p className="text-[8px] font-black text-text-light/40 uppercase tracking-widest mb-1">তারিখ</p>
                       <p className="text-sm font-black text-text-main">{expense.date}</p>
                    </div>
                 </div>

                 {expense.description && (
                   <div className="mt-4 p-4 bg-card/50 rounded-2xl text-[10px] font-bold text-text-light italic line-clamp-1 border border-dashed border-border-main">
                      "{expense.description}"
                   </div>
                 )}

                 <div className="mt-4 flex items-center gap-2 px-2">
                    <User size={12} className="text-text-light/40" />
                    <p className="text-[9px] font-black text-text-light/60 uppercase tracking-widest">ব্যয়কারী: {expense.spentBy}</p>
                 </div>
              </motion.div>
            ))}
         </div>

         {filteredExpenses.length === 0 && (
           <div className="py-20 text-center">
              <div className="w-20 h-20 bg-step-bg rounded-full flex items-center justify-center mx-auto mb-6 text-text-light/20 border border-dashed border-border-main">
                 <ShoppingBag size={40} />
              </div>
              <p className="text-sm font-black text-text-light italic">কোন খরচের তথ্য পাওয়া যায়নি</p>
           </div>
         )}
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-text-main/80 backdrop-blur-sm shadow-2xl"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-card border border-border-main rounded-none sm:rounded-[2.5rem] shadow-2xl h-full sm:h-auto max-h-[100vh] sm:max-h-[95vh] overflow-y-auto"
            >
              <div className="p-5 sm:p-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl sm:text-2xl font-black text-text-main italic tracking-tight underline decoration-error/20 decoration-4 underline-offset-8">নতুন ব্যয় যুক্ত করুন</h3>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="p-3 bg-step-bg rounded-xl hover:bg-white transition-all shadow-inner border border-border-main/50"
                  >
                    <XCircle size={20} className="text-text-light/80 hover:text-error transition-colors" />
                  </button>
                </div>

                <form onSubmit={handleAddExpense} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-light/40 uppercase tracking-widest px-1">ব্যয়ের শিরোনাম</label>
                    <div className="relative">
                       <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light/30" size={18} />
                       <input 
                        type="text"
                        required
                        placeholder="যেমন: মাসিক বিদ্যুৎ বিল"
                        className="w-full pl-12 pr-6 py-4 bg-step-bg border border-border-main rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-error/10 transition-all shadow-inner"
                        value={newExpense.title}
                        onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-light/40 uppercase tracking-widest px-1">ক্যাটাগরি</label>
                      <select 
                        className="w-full p-4 bg-step-bg border border-border-main rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-error/10 transition-all shadow-inner cursor-pointer"
                        value={newExpense.category}
                        onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                      >
                        {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-light/40 uppercase tracking-widest px-1">টাকার পরিমাণ</label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light/30 font-black">৳</span>
                         <input 
                          type="number"
                          required
                          placeholder="০০০"
                          className="w-full pl-10 pr-6 py-4 bg-step-bg border border-border-main rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-error/10 transition-all shadow-inner"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                         />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-light/40 uppercase tracking-widest px-1">তারিখ</label>
                      <div className="relative">
                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light/30" size={18} />
                         <input 
                          type="date"
                          required
                          className="w-full pl-12 pr-6 py-4 bg-step-bg border border-border-main rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-error/10 transition-all shadow-inner cursor-pointer"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                         />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-light/40 uppercase tracking-widest px-1">ব্যয়কারী</label>
                      <div className="relative">
                         <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light/30" size={18} />
                         <input 
                          type="text"
                          required
                          className="w-full pl-12 pr-6 py-4 bg-step-bg border border-border-main rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-error/10 transition-all shadow-inner"
                          value={newExpense.spentBy}
                          onChange={(e) => setNewExpense({...newExpense, spentBy: e.target.value})}
                         />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-light/40 uppercase tracking-widest px-2">বিবরণ (ঐচ্ছিক)</label>
                    <textarea 
                      className="w-full p-4 bg-step-bg border border-border-main rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-error/10 transition-all shadow-inner resize-none h-24"
                      placeholder="খরচের বিস্তারিত তথ্য লিখুন..."
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-5 bg-error text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-error/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                  >
                    ব্যয় নিশ্চিত করুন
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
