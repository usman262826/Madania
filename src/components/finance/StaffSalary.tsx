import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserRound, 
  TrendingDown, 
  Briefcase, 
  Smartphone, 
  Wallet, 
  FileText, 
  AlertCircle, 
  ChevronLeft, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Plus, 
  XCircle, 
  Trash2,
  Printer,
  DollarSign,
  Calculator,
  Send,
  Building,
  CreditCard,
  Phone
} from 'lucide-react';
import { Staff, SalaryPayment, Attendance } from '../../types';
import { useData } from '../../contexts/DataContext';
import { enToBnNumber, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const StaffSalary: React.FC = () => {
  const { staffMembers, updateData, deleteData, expenses } = useData();

  // Aggregate staff from DataContext + LocalStorage 'madrasa_teachers'
  const allStaff: Staff[] = useMemo(() => {
    let list: Staff[] = [...staffMembers];
    try {
      const savedTeachers = localStorage.getItem('madrasa_teachers');
      if (savedTeachers) {
        const parsed = JSON.parse(savedTeachers);
        parsed.forEach((t: any) => {
          if (!list.some(s => s.id === t.id || s.mobile === t.mobile)) {
            list.push({
              id: t.id || 'T-' + Math.random().toString(36).substr(2, 6),
              name: t.name,
              designation: t.designation || 'শিক্ষক',
              mobile: t.mobile,
              salary: Number(t.salary || 15000),
              joiningDate: t.joiningDate || new Date().toISOString().split('T')[0],
              salaryHistory: t.salaryHistory || [],
              attendanceHistory: t.attendanceHistory || []
            });
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
    return list;
  }, [staffMembers]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Salary Payment Modal State
  const [showPayModal, setShowPayModal] = useState<Staff | null>(null);
  const [salaryForm, setSalaryForm] = useState({
    month: 'আগস্ট',
    year: '২০২৬',
    totalWorkingDays: '৩০',
    presentDays: '২৮',
    absentDays: '২',
    allowance: '০',
    deduction: '০',
    method: 'নগদ (Cash)',
    transactionId: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  // Salary Slip / Voucher Modal State
  const [activeVoucher, setActiveVoucher] = useState<{ staff: Staff; payment: any } | null>(null);

  // New Staff Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    designation: '',
    mobile: '',
    salary: '',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  // Auto-calculated Salary Breakdown for Payment Form
  const salaryCalc = useMemo(() => {
    if (!showPayModal) return { dailyRate: 0, earnedSalary: 0, netPayable: 0 };
    const baseSalary = showPayModal.salary || 0;
    const workingDays = Math.max(1, Number(salaryForm.totalWorkingDays) || 30);
    const presentDays = Math.min(workingDays, Math.max(0, Number(salaryForm.presentDays) || 0));
    const dailyRate = baseSalary / workingDays;
    const earnedSalary = Math.round(dailyRate * presentDays);
    const allowance = Number(salaryForm.allowance) || 0;
    const deduction = Number(salaryForm.deduction) || 0;
    const netPayable = Math.max(0, Math.round(earnedSalary + allowance - deduction));
    return { dailyRate: Math.round(dailyRate), earnedSalary, netPayable };
  }, [showPayModal, salaryForm]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const newStaffObj: Staff = {
      id: 'STF-' + Math.floor(1000 + Math.random() * 9000),
      name: newStaff.name,
      designation: newStaff.designation,
      mobile: newStaff.mobile,
      salary: Number(newStaff.salary),
      joiningDate: newStaff.joiningDate,
      salaryHistory: [],
      attendanceHistory: []
    };
    await updateData('staff_members', newStaffObj);

    // Sync with madrasa_teachers
    try {
      const saved = localStorage.getItem('madrasa_teachers');
      const teachers = saved ? JSON.parse(saved) : [];
      teachers.push({ ...newStaffObj, role: 'teacher', loginPermitted: true, status: 'Approved' });
      localStorage.setItem('madrasa_teachers', JSON.stringify(teachers));
    } catch (err) {
      console.error(err);
    }

    setShowAddStaffModal(false);
    setNewStaff({ name: '', designation: '', mobile: '', salary: '', joiningDate: new Date().toISOString().split('T')[0] });
  };

  const deleteStaff = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে আপনি এই ওস্তাদ/কর্মচারীর প্রোফাইলটি মুছে ফেলতে চান?')) {
      await deleteData('staff_members', id);
      try {
        const saved = localStorage.getItem('madrasa_teachers');
        if (saved) {
          const filtered = JSON.parse(saved).filter((t: any) => t.id !== id);
          localStorage.setItem('madrasa_teachers', JSON.stringify(filtered));
        }
      } catch (e) {
        console.error(e);
      }
      if (selectedStaff?.id === id) setSelectedStaff(null);
    }
  };

  // Submit Salary Payment & Record in Expense Database
  const handleDisburseSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal) return;

    const paidAmount = salaryCalc.netPayable;
    const paymentRecord = {
      id: 'SAL-' + Date.now(),
      month: salaryForm.month,
      year: salaryForm.year,
      amount: paidAmount,
      baseSalary: showPayModal.salary,
      workingDays: Number(salaryForm.totalWorkingDays),
      presentDays: Number(salaryForm.presentDays),
      allowance: Number(salaryForm.allowance),
      deduction: Number(salaryForm.deduction),
      date: salaryForm.paymentDate,
      time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      method: salaryForm.method,
      transactionId: salaryForm.transactionId || 'TRX-' + Math.floor(100000 + Math.random() * 900000),
      note: salaryForm.notes || `${salaryForm.month} ${salaryForm.year} এর স্যালারি পরিশোধ`
    };

    // 1. Update Staff Salary History
    const updatedHistory = [paymentRecord, ...(showPayModal.salaryHistory || [])];
    const updatedStaff = { ...showPayModal, salaryHistory: updatedHistory };
    await updateData('staff_members', updatedStaff);

    // Save in localStorage for global salary register
    try {
      const savedSalaries = localStorage.getItem('madrasa_salaries');
      const salariesList = savedSalaries ? JSON.parse(savedSalaries) : [];
      salariesList.unshift({ ...paymentRecord, staffId: showPayModal.id, staffName: showPayModal.name, designation: showPayModal.designation });
      localStorage.setItem('madrasa_salaries', JSON.stringify(salariesList));
    } catch (err) {
      console.error(err);
    }

    // 2. AUTOMATICALLY RECORD EXPENSE IN MADRASA EXPENSE LEDGER
    const newExpense = {
      id: 'EXP-SAL-' + Date.now(),
      title: `${showPayModal.name} - ${salaryForm.month} ${salaryForm.year} বেতন`,
      category: 'শিক্ষক/স্টাফ বেতন',
      amount: paidAmount,
      date: salaryForm.paymentDate,
      description: `মাস: ${salaryForm.month} ${salaryForm.year}, উপস্থিত: ${salaryForm.presentDays}/${salaryForm.totalWorkingDays} দিন। মাধ্যম: ${salaryForm.method}`,
      spentBy: 'হিসাব শাখা (মাদ্রাসা ক্যাশ)'
    };
    await updateData('expenses', newExpense);

    // Trigger Voucher Receipt Modal
    setActiveVoucher({ staff: showPayModal, payment: paymentRecord });
    setShowPayModal(null);
  };

  const filteredStaff = allStaff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.mobile.includes(searchTerm) ||
    s.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Total Salary Calculations
  const totalPaidSalary = useMemo(() => {
    let sum = 0;
    allStaff.forEach(s => {
      s.salaryHistory?.forEach(h => {
        sum += Number(h.amount) || 0;
      });
    });
    return sum;
  }, [allStaff]);

  const totalMonthlyPayroll = useMemo(() => {
    return allStaff.reduce((acc, curr) => acc + (Number(curr.salary) || 0), 0);
  }, [allStaff]);

  const stats = [
    { label: 'মাসিক মোট পে-রোল বরাদ্দ', value: enToBnNumber(totalMonthlyPayroll.toString()), icon: Wallet, color: 'text-primary' },
    { label: 'মোট পরিশোধিত স্যালারি', value: enToBnNumber(totalPaidSalary.toString()), icon: CheckCircle2, color: 'text-success' },
    { label: 'মোট শিক্ষক ও কর্মচারী', value: enToBnNumber(allStaff.length.toString()), icon: UserRound, color: 'text-warning' },
    { label: 'স্বয়ংক্রিয় ব্যয় ভাউচার যোগ', value: 'সক্রিয় (Active)', icon: TrendingDown, color: 'text-indigo-600' },
  ];

  // Printable Salary Slip Voucher View Function
  const handlePrintVoucher = () => {
    window.print();
  };

  if (selectedStaff) {
    const attStats = [
      { name: 'উপস্থিত', value: 24, color: '#0F7B5E' },
      { name: 'অনুপস্থিত', value: 2, color: '#E53E3E' },
      { name: 'বিলম্ব', value: 4, color: '#F59E0B' },
    ];

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 font-hind-siliguri text-left">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setSelectedStaff(null)}
            className="flex items-center gap-2 text-text-light hover:text-primary transition-all font-black text-xs uppercase tracking-widest cursor-pointer"
          >
            <ChevronLeft size={18} /> ফিরে যান (শিক্ষক তালিকা)
          </button>

          <button
            onClick={() => {
              setShowPayModal(selectedStaff);
            }}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 cursor-pointer"
          >
            <Calculator size={18} /> নতুন বেতন হিসাব ও ডিসবার্স করুন
          </button>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Profile Header */}
          <div className="col-span-12 lg:col-span-4 bento-card p-8 space-y-6 bg-card border border-border-main">
            <div className="text-center">
              <div className="w-28 h-28 bg-primary rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-primary/30 rotate-3 mx-auto mb-4">
                {selectedStaff.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-black text-text-main tracking-tight">{selectedStaff.name}</h2>
              <p className="text-xs font-black text-primary uppercase tracking-widest mt-1">{selectedStaff.designation}</p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border-main/50 text-xs">
               <div className="flex justify-between items-center bg-step-bg p-3.5 rounded-2xl border border-border-main/50">
                  <p className="font-bold text-text-light/60">স্টাফ আইডি</p>
                  <p className="font-black text-text-main">{enToBnNumber(selectedStaff.id)}</p>
               </div>
               <div className="flex justify-between items-center bg-step-bg p-3.5 rounded-2xl border border-border-main/50">
                  <p className="font-bold text-text-light/60">মোবাইল নম্বর</p>
                  <p className="font-black text-text-main">{enToBnNumber(selectedStaff.mobile)}</p>
               </div>
               <div className="flex justify-between items-center bg-primary/5 p-5 rounded-2xl border border-primary/20">
                  <div>
                    <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest mb-1">মাসিক নির্ধারিত মূল বেতন</p>
                    <p className="text-2xl font-black text-primary leading-none">৳{enToBnNumber(selectedStaff.salary?.toString() || '0')}</p>
                  </div>
                  <button 
                    onClick={() => setShowPayModal(selectedStaff)}
                    className="p-3 bg-primary text-white rounded-xl shadow-lg hover:bg-primary-light transition-all cursor-pointer"
                  >
                    <ArrowUpRight size={18} />
                  </button>
               </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
            {/* Stats Chart */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bento-card p-6 bg-card border border-border-main col-span-2 sm:col-span-1">
                   <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-4 border-b border-border-main/50 pb-3">উপস্থিতি সারাংশ (চলমান মাস)</h3>
                   <div className="h-40 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={attStats} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={6} dataKey="value">
                          {attStats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={6} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-lg font-black text-text-main">{enToBnNumber("৯২%")}</span>
                    </div>
                   </div>
                   <div className="flex justify-center gap-4 mt-2">
                      {attStats.map(s => (
                        <div key={s.name} className="flex flex-col items-center">
                           <div className="w-2 h-2 rounded-full mb-1" style={{ background: s.color }} />
                           <span className="text-[9px] font-bold text-text-light">{s.name}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bento-card p-6 bg-card border border-border-main col-span-2 sm:col-span-1">
                   <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-4 border-b border-border-main/50 pb-3">বেতন গ্রহণের হিস্ট্রি গ্রাফ</h3>
                   <div className="h-40 pt-2">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={[
                         { name: 'আগস্ট', amount: selectedStaff.salary },
                         { name: 'জুলাই', amount: selectedStaff.salary },
                         { name: 'জুন', amount: selectedStaff.salary },
                         { name: 'মে', amount: selectedStaff.salary },
                       ]}>
                         <Bar dataKey="amount" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                         <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} fontWeight={900} />
                         <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontWeight: 900 }} />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>
            </div>

            {/* Salary History */}
            <div className="bento-card p-6 md:p-8 bg-card border border-border-main flex-1">
               <div className="flex items-center justify-between mb-6 border-b border-border-main/50 pb-4">
                 <h3 className="text-sm font-black text-text-main flex items-center gap-2 uppercase tracking-widest">
                    <Clock size={18} className="text-primary" /> প্রদানকৃত বেতনের বিস্তারিত রসিদ খতিয়ান
                 </h3>
               </div>
               
               <div className="space-y-3">
                  {selectedStaff.salaryHistory && selectedStaff.salaryHistory.length > 0 ? (
                    selectedStaff.salaryHistory.map((h, i) => (
                      <div 
                        key={h.id || i}
                        className="flex items-center justify-between p-4 bg-step-bg rounded-2xl border border-border-main/50 hover:bg-card hover:border-primary/30 transition-all"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                               <Wallet size={18} />
                            </div>
                            <div>
                               <p className="text-xs font-black text-text-main">{h.month}, {enToBnNumber(h.year)}</p>
                               <div className="flex items-center gap-3 text-[10px] text-text-light font-medium mt-0.5">
                                  <span>তারিখ: {enToBnNumber(h.date)}</span>
                                  <span>•</span>
                                  <span>মাধ্যম: {h.method}</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <div className="text-right">
                               <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">৳{enToBnNumber(h.amount.toString())}</p>
                               <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-bold">ব্যয় খাত যুক্ত</span>
                            </div>
                            <button
                              onClick={() => setActiveVoucher({ staff: selectedStaff, payment: h })}
                              className="p-2 bg-card hover:bg-primary/10 text-primary border border-border-main rounded-xl transition-all cursor-pointer"
                              title="ভাউচার প্রিন্ট করুন"
                            >
                              <Printer size={15} />
                            </button>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center bg-step-bg/50 rounded-2xl border-2 border-dashed border-border-main/60">
                       <p className="text-xs font-bold text-text-light/50">এখনো কোনো বেতন পরিশোধের ডাটা পাওয়া যায়নি</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 font-hind-siliguri text-left">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i}
            className="bento-card p-6 bg-card border border-border-main flex items-center gap-4 shadow-lg"
          >
            <div className={cn("w-12 h-12 rounded-2xl bg-step-bg flex items-center justify-center border border-border-main/50", stat.color)}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-text-light mb-0.5">{stat.label}</p>
              <h3 className="text-xl font-black text-text-main tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bento-card bg-card border border-border-main p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-border-main/50 pb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-text-main tracking-tight italic">
              শিক্ষক ও কর্মী স্যালারি শীট ও উপস্থিতি পে-রোল
            </h2>
            <p className="text-xs text-text-light font-medium mt-1">
              শিক্ষকদের নির্ধারিত বেতন ও উপস্থিতি অনুযায়ী বেতন গণনা করে সরাসরি প্রদান ও মাদ্রাসার ব্যয় খাতে যুক্ত করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light/50" size={16} />
              <input 
                type="text" 
                placeholder="নাম, মোবাইল বা পদবী দিয়ে খুঁজুন..."
                className="w-full pl-10 pr-4 py-2.5 bg-step-bg border border-border-main rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowAddStaffModal(true)}
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-primary-light transition-all shadow-md cursor-pointer"
            >
              <Plus size={16} /> নতুন এন্ট্রি যোগ
            </button>
          </div>
        </div>

        {/* Staff List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {filteredStaff.map((staff, i) => {
             const lastPayment = staff.salaryHistory && staff.salaryHistory.length > 0 ? staff.salaryHistory[0] : null;

             return (
                <div 
                   key={staff.id}
                   onClick={() => setSelectedStaff(staff)}
                   className="p-6 bg-step-bg/30 rounded-3xl border border-border-main hover:border-primary/50 hover:bg-card transition-all cursor-pointer group relative flex flex-col justify-between space-y-4"
                >
                    <div className="flex items-start justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl group-hover:scale-105 transition-transform">
                             {staff.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-text-main text-base">{staff.name}</h4>
                            <p className="text-[11px] font-bold text-primary">{staff.designation}</p>
                          </div>
                       </div>

                       <button 
                         onClick={(e) => { e.stopPropagation(); deleteStaff(staff.id); }}
                         className="p-1.5 text-text-light/30 hover:text-rose-600 transition-colors cursor-pointer"
                         title="মুছে ফেলুন"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                       <div className="p-3 bg-card rounded-xl border border-border-main/50">
                          <p className="text-[10px] text-text-light font-bold">মাসিক বেসিক বেতন</p>
                          <p className="font-black text-text-main text-sm">৳{enToBnNumber(staff.salary?.toString() || '0')}</p>
                       </div>
                       <div className="p-3 bg-card rounded-xl border border-border-main/50">
                          <p className="text-[10px] text-text-light font-bold">মোবাইল নম্বর</p>
                          <p className="font-black text-text-main text-xs">{enToBnNumber(staff.mobile)}</p>
                       </div>
                    </div>

                    {lastPayment && (
                      <div className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-xl font-bold flex items-center justify-between border border-emerald-500/20">
                        <span>সর্বশেষ বেতন: {lastPayment.month} ({enToBnNumber(lastPayment.amount.toString())}৳)</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-600 text-white rounded-full">সফল</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPayModal(staff);
                        }}
                        className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-light transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                         <Calculator size={14} /> বেতন হিসাব ও প্রদান
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStaff(staff);
                        }}
                        className="px-3 py-2.5 bg-step-bg border border-border-main text-text-main rounded-xl font-bold text-xs hover:bg-border-main/40 transition-all cursor-pointer"
                      >
                         প্রোফাইল
                      </button>
                    </div>
                </div>
             );
           })}
        </div>
      </div>

      {/* Salary Disbursement & Attendance Calculator Modal */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-main rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 text-left my-8"
            >
              <div className="flex justify-between items-center border-b border-border-main/50 pb-4">
                <div>
                  <h3 className="text-xl font-black text-text-main flex items-center gap-2">
                    <Calculator className="text-primary" /> বেতন প্রদান ও উপস্থিতি হিসাব ক্যালকুলেটর
                  </h3>
                  <p className="text-xs text-text-light font-medium mt-0.5">
                    {showPayModal.name} ({showPayModal.designation}) - মাসিক বেতন: ৳{enToBnNumber(showPayModal.salary.toString())}
                  </p>
                </div>
                <button onClick={() => setShowPayModal(null)} className="p-2 text-text-light hover:text-text-main">
                  <XCircle size={22} />
                </button>
              </div>

              <form onSubmit={handleDisburseSalary} className="space-y-5">
                {/* Month & Year */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">বেতনের মাস</label>
                    <select
                      value={salaryForm.month}
                      onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">বছর</label>
                    <select
                      value={salaryForm.year}
                      onChange={(e) => setSalaryForm({ ...salaryForm, year: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="২০২৬">২০২৬</option>
                      <option value="২০২৫">২০২৫</option>
                    </select>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-text-light block mb-1">পরিশোধের তারিখ</label>
                    <input
                      type="date"
                      required
                      value={salaryForm.paymentDate}
                      onChange={(e) => setSalaryForm({ ...salaryForm, paymentDate: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Attendance & Calculation Inputs */}
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-4">
                  <h4 className="text-xs font-black text-primary uppercase tracking-wider">উপস্থিতি অনুযায়ী বেতন হিসাব</h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-text-light block mb-1">মোট কার্যদিবস</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={salaryForm.totalWorkingDays}
                        onChange={(e) => setSalaryForm({ ...salaryForm, totalWorkingDays: e.target.value })}
                        className="w-full p-2.5 bg-card border border-border-main rounded-xl font-black text-text-main text-center"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-emerald-600 block mb-1">উপস্থিত দিন</label>
                      <input
                        type="number"
                        min="0"
                        max={salaryForm.totalWorkingDays}
                        value={salaryForm.presentDays}
                        onChange={(e) => setSalaryForm({ ...salaryForm, presentDays: e.target.value })}
                        className="w-full p-2.5 bg-card border border-emerald-500/30 rounded-xl font-black text-emerald-600 text-center"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-amber-600 block mb-1">বোনাস/ভাতা (৳)</label>
                      <input
                        type="number"
                        min="0"
                        value={salaryForm.allowance}
                        onChange={(e) => setSalaryForm({ ...salaryForm, allowance: e.target.value })}
                        className="w-full p-2.5 bg-card border border-border-main rounded-xl font-black text-text-main text-center"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-rose-600 block mb-1">কর্তন/অগ্রিম (৳)</label>
                      <input
                        type="number"
                        min="0"
                        value={salaryForm.deduction}
                        onChange={(e) => setSalaryForm({ ...salaryForm, deduction: e.target.value })}
                        className="w-full p-2.5 bg-card border border-rose-500/30 rounded-xl font-black text-rose-600 text-center"
                      />
                    </div>
                  </div>

                  {/* Calculated summary */}
                  <div className="grid grid-cols-3 gap-2 bg-card p-3 rounded-xl border border-border-main/60 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-text-light block font-medium">দৈনিক হার</span>
                      <span className="font-black text-text-main">৳{enToBnNumber(salaryCalc.dailyRate.toString())}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-light block font-medium">উপস্থিতির অর্জিত বেতন</span>
                      <span className="font-black text-text-main">৳{enToBnNumber(salaryCalc.earnedSalary.toString())}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-primary block font-bold">সর্বমোট প্রদেয় নীট বেতন</span>
                      <span className="font-black text-primary text-base">৳{enToBnNumber(salaryCalc.netPayable.toString())}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method & Transaction ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">পরিশোধের মাধ্যম</label>
                    <select
                      value={salaryForm.method}
                      onChange={(e) => setSalaryForm({ ...salaryForm, method: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="নগদ (Cash)">নগদ (Cash)</option>
                      <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                      <option value="নগদ অনলাইন (Nagad)">নগদ (Nagad)</option>
                      <option value="ব্যাংক ট্রান্সফার (Bank)">ব্যাংক ট্রান্সফার (Bank Transfer)</option>
                      <option value="চেক (Cheque)">চেক (Cheque)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">ট্রানজেকশন আইডি / রেফারেন্স</label>
                    <input
                      type="text"
                      placeholder="যেমন: TRX-839210 বা Cash Receipt #102"
                      value={salaryForm.transactionId}
                      onChange={(e) => setSalaryForm({ ...salaryForm, transactionId: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-light block mb-1">নোট / মন্তব্য (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="যেমন: নিয়মিত বেতন পরিশোধ করা হলো"
                    value={salaryForm.notes}
                    onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-medium flex items-center gap-2 border border-amber-500/20">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>বেতন সাবমিট করার সাথে সাথে তা স্বয়ংক্রিয়ভাবে মাদ্রাসার <b>ব্যয় খাত (Expenses Ledger)</b>-এ রেকর্ড হয়ে যাবে।</span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(null)}
                    className="px-5 py-2.5 bg-step-bg text-text-main font-bold text-xs rounded-xl hover:bg-border-main/50 transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-light transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send size={15} /> বেতন পরিশোধ নিশ্চিত করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Salary Slip / Voucher Receipt Modal */}
      <AnimatePresence>
        {activeVoucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-main rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6 text-left my-8 font-hind-siliguri print:p-0 print:border-none print:shadow-none"
            >
              <div className="flex justify-between items-center border-b border-border-main/50 pb-4 print:hidden">
                <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                  <Printer className="text-primary" /> বেতন পরিশোধ ভাউচার রসিদ
                </h3>
                <button onClick={() => setActiveVoucher(null)} className="p-2 text-text-light hover:text-text-main">
                  <XCircle size={22} />
                </button>
              </div>

              {/* Printable Voucher Copy */}
              <div id="salary-voucher-printable" className="p-6 bg-white dark:bg-slate-900 border border-border-main rounded-2xl space-y-6 text-text-main">
                <div className="text-center border-b border-border-main/60 pb-4 space-y-1">
                  <h2 className="text-2xl font-black text-primary">দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা</h2>
                  <p className="text-xs text-text-light font-bold">শিক্ষক ও কর্মকর্তা বেতন পরিশোধ ভাউচার</p>
                  <p className="text-[10px] font-mono text-text-light/70">ভাউচার নং: {activeVoucher.payment.id}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-bold border-b border-border-main/40 pb-4">
                  <div>
                    <span className="text-text-light font-medium block text-[10px]">গ্রহীতার নাম:</span>
                    <span className="text-sm font-black">{activeVoucher.staff.name}</span>
                    <span className="block text-[11px] text-primary">{activeVoucher.staff.designation}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-text-light font-medium block text-[10px]">মাস ও বছর:</span>
                    <span className="text-sm font-black">{activeVoucher.payment.month}, {enToBnNumber(activeVoucher.payment.year)}</span>
                    <span className="block text-[10px] text-text-light">তারিখ: {enToBnNumber(activeVoucher.payment.date)}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 bg-step-bg rounded-lg">
                    <span>মাসিক বেসিক বেতন:</span>
                    <span className="font-bold">৳{enToBnNumber((activeVoucher.payment.baseSalary || activeVoucher.staff.salary).toString())}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-step-bg rounded-lg">
                    <span>উপস্থিতি বিবরণ:</span>
                    <span className="font-bold">{enToBnNumber(activeVoucher.payment.presentDays?.toString() || '৩০')} / {enToBnNumber(activeVoucher.payment.workingDays?.toString() || '৩০')} দিন</span>
                  </div>
                  {activeVoucher.payment.allowance > 0 && (
                    <div className="flex justify-between p-2 bg-emerald-500/10 text-emerald-700 rounded-lg">
                      <span>বোনাস/ভাতা:</span>
                      <span className="font-bold">+ ৳{enToBnNumber(activeVoucher.payment.allowance.toString())}</span>
                    </div>
                  )}
                  {activeVoucher.payment.deduction > 0 && (
                    <div className="flex justify-between p-2 bg-rose-500/10 text-rose-700 rounded-lg">
                      <span>কর্তন/অগ্রিম:</span>
                      <span className="font-bold">- ৳{enToBnNumber(activeVoucher.payment.deduction.toString())}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-3 bg-primary text-white rounded-xl text-sm font-black">
                    <span>মোট প্রদানকৃত নীট বেতন:</span>
                    <span>৳{enToBnNumber(activeVoucher.payment.amount.toString())}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px] font-bold border-t border-border-main/40 pt-4 text-text-light">
                  <div>
                    <span>পেমেন্ট মাধ্যম: {activeVoucher.payment.method}</span>
                  </div>
                  <div className="text-right">
                    <span>ট্রানজেকশন ID: {activeVoucher.payment.transactionId}</span>
                  </div>
                </div>

                <div className="pt-12 grid grid-cols-2 text-center text-xs font-bold border-t border-dashed border-border-main/60">
                  <div>
                    <div className="w-32 border-t border-text-main mx-auto mb-1"></div>
                    <span>শিক্ষক/গ্রহীতার স্বাক্ষর</span>
                  </div>
                  <div>
                    <div className="w-32 border-t border-text-main mx-auto mb-1"></div>
                    <span>ক্যাশিয়ার/এডমিন স্বাক্ষর</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 print:hidden">
                <button
                  onClick={() => setActiveVoucher(null)}
                  className="px-5 py-2.5 bg-step-bg text-text-main font-bold text-xs rounded-xl hover:bg-border-main/50 cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  onClick={handlePrintVoucher}
                  className="px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-light flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Printer size={16} /> প্রিন্ট / ডাউনলোড করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Staff Modal */}
      <AnimatePresence>
        {showAddStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border-main rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 text-left"
            >
              <div className="flex items-center justify-between border-b border-border-main/50 pb-4">
                <h3 className="text-xl font-black text-text-main">নতুন শিক্ষক/কর্মী প্রোফাইল যোগ করুন</h3>
                <button onClick={() => setShowAddStaffModal(false)} className="p-2 text-text-light hover:text-text-main">
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">শিক্ষক/কর্মীর নাম</label>
                    <input 
                      type="text"
                      required
                      placeholder="যেমন: মাওলানা আব্দুল হাফিজ"
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">পদবী</label>
                    <input 
                      type="text"
                      required
                      placeholder="যেমন: সহকারী মুহাদ্দিস"
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                      value={newStaff.designation}
                      onChange={(e) => setNewStaff({...newStaff, designation: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">মোবাইল নম্বর (লগইন আইডি)</label>
                    <input 
                      type="text"
                      required
                      placeholder="01712000000"
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                      value={newStaff.mobile}
                      onChange={(e) => setNewStaff({...newStaff, mobile: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-light block mb-1">মাসিক মূল বেতন (৳)</label>
                    <input 
                      type="number"
                      required
                      placeholder="20000"
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                      value={newStaff.salary}
                      onChange={(e) => setNewStaff({...newStaff, salary: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-light block mb-1">যোগদানের তারিখ</label>
                  <input 
                    type="date"
                    required
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20 text-text-main cursor-pointer"
                    value={newStaff.joiningDate}
                    onChange={(e) => setNewStaff({...newStaff, joiningDate: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-5 py-2.5 bg-step-bg text-text-main font-bold text-xs rounded-xl hover:bg-border-main/50 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-light transition-all shadow-md cursor-pointer"
                  >
                    প্রোফাইল তৈরি করুন
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
