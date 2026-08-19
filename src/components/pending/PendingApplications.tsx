import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Calendar, 
  Phone, 
  User,
  Plus,
  RefreshCw,
  Eye,
  X,
  MapPin,
  IdCard,
  Hash,
  Mail,
  Droplet,
  Smartphone,
  School,
  MessageSquare,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  Copy
} from 'lucide-react';
import { Application } from '../../types';
import { enToBnNumber, cn, formatDateToDDMMYYYY } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ACADEMIC_YEARS } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PendingApplicationsProps {
  applications: Application[];
  onAccept: (id: string, academicYear: string) => void | Promise<any>;
  onReject: (id: string) => void | Promise<any>;
  onEdit: (id: string, updatedData: any) => void;
  onNewEntry: () => void;
  onRefresh?: () => void;
  isArchiveView?: boolean;
}

export const PendingApplications: React.FC<PendingApplicationsProps> = ({ 
  applications, 
  onAccept, 
  onReject, 
  onEdit,
  onNewEntry,
  onRefresh,
  isArchiveView = false
}) => {
  // Application Card Component (Miniaturized for both views, optimized for mobile)
  const ApplicationCard = ({ app, index, onView, onAccept }: any) => (
    <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.02 }}
        className="bg-card p-4 rounded-[2rem] border border-border-main/60 shadow-xl shadow-text-main/5 relative overflow-hidden group hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all flex flex-col h-fit"
    >
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 min-w-[40px] rounded-2xl bg-step-bg border border-border-main flex items-center justify-center font-black text-primary text-sm shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    {app.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <h4 className="font-black text-text-main text-[13px] sm:text-sm tracking-tight leading-tight mb-1 group-hover:text-primary transition-colors truncate">
                      {app.name}
                    </h4>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-text-light/30">#{String(app.id || '').slice(-6)}</span>
                        <span className="w-1 h-1 rounded-full bg-border-main" />
                        <span className="text-[8px] font-black text-primary uppercase tracking-widest truncate">{app.class}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <button 
                  onClick={(e) => { e.stopPropagation(); onAccept(); }}
                  className="p-2.5 bg-success/10 text-success rounded-xl hover:bg-success hover:text-white transition-all shadow-sm active:scale-90"
                  title="মঞ্জুর"
              >
                  <CheckCircle2 size={16} />
              </button>
              <button 
                  onClick={(e) => { e.stopPropagation(); onView(app); }}
                  className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"
                  title="বিস্তারিত"
              >
                  <Eye size={16} />
              </button>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-step-bg/30 rounded-xl border border-border-main/30">
            <div className="space-y-0.5 overflow-hidden">
                <p className="text-[7px] font-black text-text-light/40 uppercase tracking-[0.2em]">পিতার নাম</p>
                <p className="text-[10px] font-bold text-text-main leading-tight truncate">{app.fatherName}</p>
            </div>
            <div className="space-y-0.5 text-right overflow-hidden">
                <p className="text-[7px] font-black text-text-light/40 uppercase tracking-[0.2em]">মোবাইল</p>
                <p className="text-[10px] font-bold text-text-main leading-tight whitespace-nowrap">{enToBnNumber(app.mobile)}</p>
            </div>
        </div>

        <div className="flex items-center justify-between px-1 text-[8px] font-black uppercase tracking-[0.2em] text-text-light/30 italic">
            <span className="truncate max-w-[60%]">{app.applyDate || 'তারিখ নেই'}</span>
            <span className={cn(
                "px-2 py-0.5 rounded-full text-[7px] tracking-widest",
                app.status === 'pending' ? "bg-warning/10 text-warning border border-warning/20" : 
                app.status === 'accepted' ? "bg-success/10 text-success border border-success/20" :
                "bg-error/10 text-error border border-error/20"
            )}>
                {app.status === 'pending' ? 'পেন্ডিং' : app.status === 'accepted' ? 'গৃহীত' : 'বাতিল'}
            </span>
        </div>
    </motion.div>
  );

  const [viewingApp, setViewingApp] = useState<Application | null>(null);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'accepted' | 'rejected' | 'pending'>(isArchiveView ? 'accepted' : 'pending');
  const [showConfirm, setShowConfirm] = useState<{ id: string; type: 'accept' | 'reject' } | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const isPopStateRef = React.useRef(false);

  // Sync viewing detail cards to history entries
  React.useEffect(() => {
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }

    const parentTab = isArchiveView ? 'archive' : 'pending';
    const state = window.history.state;
    if (state && state.activeTab === parentTab) {
      const appId = viewingApp ? viewingApp.id : null;
      if (state.viewingAppId !== appId) {
        window.history.pushState({
          activeTab: parentTab,
          viewingAppId: appId
        }, "", "");
      }
    }
  }, [viewingApp, isArchiveView]);

  // Listen to popstate specifically for details closing
  React.useEffect(() => {
    const handlePopStateApp = (event: PopStateEvent) => {
      const parentTab = isArchiveView ? 'archive' : 'pending';
      if (event.state && event.state.activeTab === parentTab) {
        isPopStateRef.current = true;
        
        if (event.state.viewingAppId) {
          const app = applications.find(a => a.id?.toString() === event.state.viewingAppId?.toString());
          setViewingApp(app || null);
        } else {
          setViewingApp(null);
        }
      }
    };

    window.addEventListener('popstate', handlePopStateApp);
    return () => {
      window.removeEventListener('popstate', handlePopStateApp);
    };
  }, [applications, isArchiveView]);

  const closeViewingModal = () => {
    const state = window.history.state;
    const parentTab = isArchiveView ? 'archive' : 'pending';
    if (state && state.activeTab === parentTab && state.viewingAppId) {
      window.history.back();
    } else {
      setViewingApp(null);
    }
  };
  const [viewMode, setViewMode] = useState<'serial' | 'jamat'>('serial');

  const filteredApps = useMemo(() => {
    const list = applications.filter(app => {
      if (isArchiveView) {
        if (statusFilter === 'all') return true;
        // If status is accepted, we might want to check the academic year too if needed, 
        // but simple status check should suffice for now as per user request
        return app.status === statusFilter;
      }
      return app.status === 'pending';
    });

    // If accepted view in archive, sort by natural sheet order (ascending order)
    if (isArchiveView && statusFilter === 'accepted') {
      return [...list];
    }

    // Sort by apply date (newest first) for other views
    return [...list].sort((a, b) => {
      const dateA = new Date(a.applyDate || 0).getTime();
      const dateB = new Date(b.applyDate || 0).getTime();
      return dateB - dateA;
    });
  }, [applications, isArchiveView, statusFilter]);

  // Grouping by Jamat
  const groupedApps = useMemo(() => {
    const groups: Record<string, Application[]> = {};
    filteredApps.forEach(app => {
      const jamat = app.jamat || app['জামাত'] || 'অন্যান্য';
      if (!groups[jamat]) groups[jamat] = [];
      groups[jamat].push(app);
    });
    return groups;
  }, [filteredApps]);

  // Summary Data for Chart
  const chartData = useMemo(() => {
    return Object.entries(groupedApps).map(([name, apps]) => ({
      name,
      count: (apps as Application[]).length
    })).sort((a, b) => b.count - a.count);
  }, [groupedApps]);

  const totalCount = filteredApps.length;

  const handleEditSubmit = () => {
    if (editingApp) {
      onEdit(editingApp.id, editingApp);
      setEditingApp(null);
    }
  };

  const getDetailFields = (app: Application) => [
    { label: "আবেদনের তারিখ সময়", value: app.applyDate || app['আবেদনের তারিখ সময়'], icon: Calendar },
    { label: "শিক্ষাবর্ষ", value: app.academicYear || app['শিক্ষাবর্ষ'], icon: Calendar },
    { label: "জামাত", value: app.jamat || app['জামাত'], icon: RefreshCw },
    { label: "মারহালা", value: app.marhala || app['মারহালা'], icon: RefreshCw },
    { label: "জামাত/শ্রেণী", value: app.class || app['জামাত/শ্রেণী'], icon: RefreshCw },
    { label: "সমমান", value: app.somoman || app['সমমান'], icon: RefreshCw },
    { label: "রেজিস্ট্রেশন/আইডি", value: app.id || app['রেজিস্ট্রেশন/আইডি'], icon: IdCard, copyValue: app.id || app['রেজিস্ট্রেশন/আইডি'] },
    { label: "রোল নম্বর", value: app.roll || app['রোল নম্বর'], icon: Hash },
    { label: "শিক্ষার্থীর নাম", value: app.name || app['শিক্ষার্থীর নাম'], icon: User },
    { label: "পিতার নাম", value: app.fatherName || app['পিতার নাম'], icon: User },
    { label: "মাতার নাম", value: app.motherName || app['মাতার নাম'], icon: User },
    { label: "মোবাইল (মা)", value: enToBnNumber(app.mobile || app['মোবাইল (মা)'] || ''), icon: Phone, copyValue: app.mobile || app['মোবাইল (মা)'], isPhone: true },
    { label: "মোবাইল (বাবা/ভাই)", value: enToBnNumber(app.altMobile || app['মোবাইল (বাবা/ভাই)'] || ''), icon: Smartphone, copyValue: app.altMobile || app['মোবাইল (বাবা/ভাই)'], isPhone: true },
    { label: "জন্ম নিবন্ধন", value: enToBnNumber(app.birthReg || app['জন্ম নিবন্ধন'] || ''), icon: IdCard, copyValue: app.birthReg || app['জন্ম নিবন্ধন'] },
    { label: "জন্ম তারিখ", value: enToBnNumber(formatDateToDDMMYYYY(app.dob || app['জন্ম তারিখ'])), icon: Calendar },
    { label: "ইমেইল", value: app.email || app['ইমেইল'], icon: Mail, copyValue: app.email || app['ইমেইল'], isEmail: true },
    { label: "রক্তের গ্রুপ", value: app.bloodGroup || app['রক্তের গ্রুপ'], icon: Droplet },
    { label: "শিক্ষার্থী ধরণ", value: app.studentType || app['শিক্ষার্থী ধরণ'] || 'নতুন', icon: User },
    { label: "পূর্বের মাদ্রাসা", value: app.prevMadrasa || app['পূর্বের মাদ্রাসা'], icon: School },
    { label: "পূর্বের জামাত", value: app.prevClass || app['পূর্বের জামাত'], icon: School },
    { label: "আবেদন নং", value: app.applicationNo || app['আবেদন নং'], icon: Hash, copyValue: app.applicationNo || app['আবেদন নং'] },
  ];

  return (
    <div className="space-y-12">
      {/* Detail View Modal */}
      <AnimatePresence>
        {viewingApp && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-6 overflow-hidden">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-text-main/60 backdrop-blur-md"
               onClick={closeViewingModal}
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="w-full max-w-4xl bg-card rounded-none sm:rounded-[2.5rem] border border-border-main shadow-2xl relative z-10 overflow-hidden flex flex-col h-full sm:h-auto max-h-[100vh] sm:max-h-[90vh]"
            >
              <div className="p-6 sm:p-8 border-b border-border-main flex justify-between items-center bg-step-bg/30">
                <div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">আবেদনকারীর পূর্ণাঙ্গ প্রোফাইল</p>
                   <h3 className="text-2xl sm:text-3xl font-black text-text-main tracking-tighter">{viewingApp.name}</h3>
                </div>
                <button onClick={closeViewingModal} className="p-3 bg-card rounded-2xl hover:bg-error/10 hover:text-error border border-border-main transition-all">
                   <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-10 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 border-0">
                   {getDetailFields(viewingApp).map((field, idx) => (
                     <DetailBlock 
                       key={idx} 
                       label={field.label} 
                       value={field.value} 
                       icon={field.icon} 
                       copyValue={field.copyValue}
                       isPhone={field.isPhone}
                       isEmail={field.isEmail}
                     />
                   ))}
                </div>

                <div className="mt-8 bg-step-bg p-6 rounded-3xl border border-border-main/50">
                   <p className="text-[10px] font-black text-text-light/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MapPin size={14} /> বর্তমান ও স্থায়ী ঠিকানা
                   </p>
                   <p className="text-sm font-bold text-text-main leading-relaxed">{viewingApp.address || viewingApp['ঠিকানা'] || 'ঠিকানা পাওয়া যায়নি'}</p>
                </div>
              </div>

              <div className="p-6 sm:p-8 border-t border-border-main bg-step-bg/30 flex flex-col sm:flex-row gap-3 sm:gap-4">
                {viewingApp.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => {
                        setViewingApp(null);
                        setShowConfirm({ id: viewingApp.id, type: 'accept' });
                      }}
                      className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <CheckCircle2 size={18} /> মঞ্জুর করুন
                    </button>
                    <button 
                      onClick={() => {
                        closeViewingModal();
                        setEditingApp(viewingApp);
                      }}
                      className="flex-1 bg-step-bg text-text-main py-4 rounded-2xl border border-border-main font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-card transition-all"
                    >
                      <Edit3 size={18} /> আবেদন সংশোধন করুন
                    </button>
                    <button 
                      onClick={() => {
                        setViewingApp(null);
                        setShowConfirm({ id: viewingApp.id, type: 'reject' });
                      }}
                      className="flex-1 sm:flex-initial px-8 py-4 border border-error/50 text-error rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-error hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} /> বাতিল
                    </button>
                  </>
                )}
                {viewingApp.status !== 'pending' && (
                  <div className={cn(
                    "w-full p-4 rounded-2xl font-black text-center flex items-center justify-center gap-3",
                    viewingApp.status === 'accepted' ? "bg-success/10 text-success border border-success/20" : "bg-error/10 text-error border border-error/20"
                  )}>
                    {viewingApp.status === 'accepted' ? <CheckCircle2 /> : <XCircle />}
                    আবেদনটি {viewingApp.status === 'accepted' ? 'ইতিমধ্যে মঞ্জুর করা হয়েছে' : 'বাতিল করা হয়েছে'}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingApp && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-0 sm:p-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-text-main/80 backdrop-blur-md"
              onClick={() => setEditingApp(null)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-5xl bg-card rounded-none sm:rounded-[2.5rem] border border-border-main shadow-2xl relative z-10 flex flex-col h-full sm:h-auto max-h-[100vh] sm:max-h-[90vh]"
            >
              <div className="p-4 sm:p-8 border-b border-border-main flex justify-between items-center bg-primary/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl rotate-3 shrink-0">
                    <Edit3 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-text-main tracking-tighter italic">আবেদন সংশোধন করুন</h3>
                    <p className="text-[9px] sm:text-[10px] font-black text-text-light/50 uppercase tracking-widest leading-none mt-0.5">সকল তথ্য সতর্কতার সাথে আপডেট করুন</p>
                  </div>
                </div>
                <button onClick={() => setEditingApp(null)} className="p-3 bg-white/50 backdrop-blur rounded-2xl border border-border-main/50 hover:bg-error/10 hover:text-error transition-all">
                   <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Common inputs */}
                  <EditField label="শিক্ষার্থীর নাম" value={editingApp.name} onChange={(v) => setEditingApp({...editingApp, name: v})} />
                  <EditField label="পিতার নাম" value={editingApp.fatherName} onChange={(v) => setEditingApp({...editingApp, fatherName: v})} />
                  <EditField label="মাতার নাম" value={editingApp.motherName} onChange={(v) => setEditingApp({...editingApp, motherName: v})} />
                  <EditField label="মোবাইল (মা)" value={editingApp.mobile} onChange={(v) => setEditingApp({...editingApp, mobile: v})} />
                  <EditField label="মোবাইল (বাবা/ভাই)" value={editingApp.altMobile} onChange={(v) => setEditingApp({...editingApp, altMobile: v})} />
                  <EditField label="জন্ম নিবন্ধন" value={editingApp.birthReg} onChange={(v) => setEditingApp({...editingApp, birthReg: v})} />
                  <EditField label="জন্ম তারিখ" value={editingApp.dob} onChange={(v) => setEditingApp({...editingApp, dob: v})} />
                  <EditField label="ইমেইল" value={editingApp.email} onChange={(v) => setEditingApp({...editingApp, email: v})} />
                  <EditField label="রক্তের গ্রুপ" value={editingApp.bloodGroup} onChange={(v) => setEditingApp({...editingApp, bloodGroup: v})} />
                  <EditField label="জামাত" value={editingApp.jamat || ''} onChange={(v) => setEditingApp({...editingApp, jamat: v})} />
                  <EditField label="মারহালা" value={editingApp.marhala} onChange={(v) => setEditingApp({...editingApp, marhala: v})} />
                  <EditField label="জামাত/শ্রেণী" value={editingApp.class} onChange={(v) => setEditingApp({...editingApp, class: v, jamatClass: v})} />
                  <EditField label="সমমান" value={editingApp.somoman || ''} onChange={(v) => setEditingApp({...editingApp, somoman: v})} />
                  <EditField label="রোল নম্বর" value={editingApp.roll || ''} onChange={(v) => setEditingApp({...editingApp, roll: v})} />
                  <EditField label="আবেদন নং" value={editingApp.applicationNo || ''} onChange={(v) => setEditingApp({...editingApp, applicationNo: v})} />
                  <EditField label="শিক্ষাবর্ষ" value={editingApp.academicYear} onChange={(v) => setEditingApp({...editingApp, academicYear: v})} />
                  <EditField label="শিক্ষার্থী ধরণ" value={editingApp.studentType} onChange={(v) => setEditingApp({...editingApp, studentType: v})} />
                  <EditField label="পূর্বের মাদ্রাসা" value={editingApp.prevMadrasa} onChange={(v) => setEditingApp({...editingApp, prevMadrasa: v})} />
                  <EditField label="পূর্বের জামাত" value={editingApp.prevClass} onChange={(v) => setEditingApp({...editingApp, prevClass: v})} />
                  <EditField label="মেসেজিং অ্যাপ" value={editingApp.messagingApps || 'WhatsApp'} onChange={(v) => setEditingApp({...editingApp, messagingApps: v})} />
                </div>
                <div className="mt-8 space-y-2">
                   <label className="text-[10px] font-black text-text-light uppercase tracking-widest ml-1">ঠিকানা</label>
                   <textarea 
                    className="w-full p-6 bg-step-bg border border-border-main rounded-[2rem] font-bold text-sm min-h-[120px] focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                    value={editingApp.address}
                    onChange={(e) => setEditingApp({...editingApp, address: e.target.value})}
                   />
                </div>
                <div className="mt-6 space-y-2">
                   <label className="text-[10px] font-black text-text-light uppercase tracking-widest ml-1">মন্তব্য</label>
                   <textarea 
                    className="w-full p-6 bg-step-bg border border-border-main rounded-[2rem] font-bold text-sm min-h-[80px] focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                    value={editingApp.comment}
                    onChange={(e) => setEditingApp({...editingApp, comment: e.target.value})}
                   />
                </div>
              </div>

              <div className="p-4 sm:p-8 border-t border-border-main bg-step-bg/30 flex gap-4">
                 <button onClick={() => setEditingApp(null)} className="flex-1 py-5 bg-card text-text-main border border-border-main rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all">বাতিল করুন</button>
                 <button 
                  onClick={handleEditSubmit}
                  className="flex-[2] py-5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                 >
                   সংরক্ষণ করুন
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-text-main/40 backdrop-blur-xl">
             <div className="absolute inset-0" onClick={() => !isModalLoading && setShowConfirm(null)} />
             <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card w-full max-w-sm rounded-[2rem] p-6 sm:p-10 border border-border-main shadow-2xl relative z-10 text-center"
             >
                <div className={cn(
                  "w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl rotate-3",
                  showConfirm.type === 'accept' ? "bg-success text-white shadow-success/30" : "bg-error text-white shadow-error/30"
                )}>
                  {showConfirm.type === 'accept' ? <CheckCircle2 size={40} /> : <AlertTriangle size={40} />}
                </div>
                <h3 className="text-2xl font-black text-text-main tracking-tighter mb-2">আপনি কি নিশ্চিত?</h3>
                <p className="text-text-light font-bold text-sm mb-10 leading-relaxed italic opacity-70">
                  {showConfirm.type === 'accept' ? "এই আবেদনটি কি মঞ্জুর করে মূল ডাটাবেসে পাঠাতে চান?" : "এই আবেদনটি কি বাতিল হিসেবে রিজেক্টেড আর্কাইভ এ পাঠাতে চান?"}
                </p>
                <div className="flex gap-4">
                   <button 
                     disabled={isModalLoading}
                     onClick={() => !isModalLoading && setShowConfirm(null)} 
                     className={cn(
                       "flex-1 py-4 bg-step-bg text-text-main border border-border-main rounded-2xl font-black text-[10px] uppercase tracking-widest",
                       isModalLoading && "opacity-50 cursor-not-allowed"
                     )}
                   >
                     পিছনে
                   </button>
                   <button 
                    disabled={isModalLoading}
                    onClick={async () => {
                      if (isModalLoading) return;
                      setIsModalLoading(true);
                      try {
                        if(showConfirm.type === 'accept') {
                          const app = applications.find(a => a.id === showConfirm.id);
                          await onAccept(showConfirm.id, app?.academicYear || ACADEMIC_YEARS[0]);
                        } else {
                          await onReject(showConfirm.id);
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsModalLoading(false);
                        setShowConfirm(null);
                      }
                    }}
                    className={cn(
                      "flex-1 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2",
                      isModalLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95",
                      showConfirm.type === 'accept' ? "bg-success shadow-success/20" : "bg-error shadow-error/20"
                    )}
                   >
                     {isModalLoading ? (
                       <>
                         <RefreshCw className="animate-spin" size={14} /> লোড হচ্ছে...
                       </>
                     ) : (
                       "হ্যাঁ, কার্যকর করুন"
                     )}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header UI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bento-card p-6 sm:p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-primary/10 transition-colors" />
        
        <div className="relative z-10 w-full md:w-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">ভর্তি আবেদন ড্যাশবোর্ড</p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-text-main italic">
            {isArchiveView ? 'আর্কাইভকৃত আবেদনসমূহ' : 'অপেক্ষমান ভর্তি আবেদন তালিকা'}
          </h2>
          
          <div className="flex bg-step-bg p-1 rounded-xl border border-border-main mt-4 w-fit shadow-inner">
            <button
              onClick={() => setViewMode('serial')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                viewMode === 'serial' ? "bg-card text-primary shadow-sm ring-1 ring-border-main/50" : "text-text-light/50 hover:text-text-light"
              )}
            >
              <ClipboardList size={14} /> সিরিয়াল ভিত্তিক
            </button>
            <button
              onClick={() => setViewMode('jamat')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                viewMode === 'jamat' ? "bg-card text-primary shadow-sm ring-1 ring-border-main/50" : "text-text-light/50 hover:text-text-light"
              )}
            >
              <LayoutGrid size={14} /> জামাত ভিত্তিক
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-4 relative z-10 w-full md:w-auto">
          {isArchiveView && (
            <div className="flex bg-step-bg p-1 rounded-xl border border-border-main shadow-inner overflow-x-auto no-scrollbar">
              {(['all', 'accepted', 'rejected', 'pending'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    statusFilter === s ? "bg-card text-primary shadow-sm ring-1 ring-border-main/50" : "text-text-light/50 hover:text-text-light"
                  )}
                >
                  {s === 'all' ? 'সব' : s === 'accepted' ? 'গৃহীত' : s === 'rejected' ? 'বাতিল' : 'পেন্ডিং'}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <button 
              onClick={onNewEntry}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-text-main text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-text-main/20"
            >
              <Plus size={18} /> <span className="hidden sm:inline">নতুন সরাসরি এন্ট্রি</span><span className="sm:hidden">এন্ট্রি</span>
            </button>
            <button 
              onClick={onRefresh}
              className="p-3 sm:p-4 bg-card text-text-light border border-border-main rounded-xl sm:rounded-2xl hover:rotate-180 transition-all duration-700 shadow-sm active:scale-95 hover:border-primary/50"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bento-card p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-all" />
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-4 shadow-xl shadow-primary/5 group-hover:scale-110 transition-transform">
                <TrendingUp size={32} />
            </div>
            <p className="text-[12px] font-black text-text-light/40 uppercase tracking-[0.3em] mb-1">
              {isArchiveView ? 
                (statusFilter === 'accepted' ? 'মোট গৃহীত আবেদন' : 
                 statusFilter === 'rejected' ? 'মোট বাতিলকৃত আবেদন' : 
                 statusFilter === 'all' ? 'মোট আর্কাইভকৃত আবেদন' : 'মোট পেন্ডিং আবেদন') 
                : 'মোট পেন্ডিং আবেদন'}
            </p>
            <h3 className="text-5xl font-black text-text-main tracking-tighter italic">{enToBnNumber(totalCount.toString())} টি</h3>
            <p className="mt-4 text-xs font-bold text-text-light opacity-60">সবগুলো আবেদন যাচাই-বাছাই করে অনুমোদন করুন।</p>
        </div>

        <div className="lg:col-span-2 bento-card p-8 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFA500]/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-[#FFA500]/10 transition-all pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#FFA500] text-white rounded-lg shadow-lg shadow-orange-500/20">
                        <LayoutGrid size={16} />
                    </div>
                    <p className="text-sm font-black text-text-main uppercase tracking-widest font-hind-siliguri">জামাত ভিত্তিক পরিসংখ্যান</p>
                </div>
            </div>
            <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fontWeight: '800', fill: '#6B7280' }} 
                            interval={0}
                        />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-xl)', fontWeight: 'bold', fontSize: '11px' }}
                            cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} 
                            content={({ active, payload }) => {
                              const getLevelColor = (name: string) => {
                                const trimmed = name.trim();
                                if (trimmed.includes('আতফাল') || trimmed.includes('আওয়াল') || trimmed.includes('ছানী') || trimmed.includes('ছালেছ') || trimmed.includes('খুসুছি') || trimmed.includes('রাবে') || trimmed.includes('খামেস') || trimmed.includes('খামেছ')) return '#F43F5E';
                                if (trimmed.includes('মিয়ান') || trimmed.includes('মিযান') || trimmed.includes('নাহবেমীর')) return '#F59E0B';
                                if (trimmed.includes('কুদূরী') || trimmed.includes('বেকায়া')) return '#6366F1';
                                if (trimmed.includes('হেদায়া') || trimmed.includes('মেশকাত')) return '#0EA5E9';
                                if (trimmed.includes('দাওরায়ে হাদিস') || trimmed.includes('তাকমিল')) return '#10B981';
                                return '#10B981';
                              };
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-card border border-border-main p-3 rounded-2xl shadow-xl font-hind-siliguri text-xs">
                                     <p className="font-extrabold text-primary">{data.name}</p>
                                     <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-border-main/50">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLevelColor(data.name) }} />
                                        <span className="font-black text-text-main">আবেদন সংখ্যা: {enToBnNumber(data.count.toString())} টি</span>
                                     </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                        />
                        <Bar 
                            dataKey="count" 
                            radius={[8, 8, 0, 0]} 
                            barSize={32}
                            animationBegin={300}
                        >
                            {chartData.map((entry, index) => {
                                const getLevelColor = (name: string) => {
                                  const trimmed = name.trim();
                                  if (trimmed.includes('আতফাল') || trimmed.includes('আওয়াল') || trimmed.includes('ছানী') || trimmed.includes('ছালেছ') || trimmed.includes('খুসুছি') || trimmed.includes('রাবে') || trimmed.includes('খামেস') || trimmed.includes('খামেছ')) return '#F43F5E';
                                  if (trimmed.includes('মিয়ান') || trimmed.includes('মিযান') || trimmed.includes('নাহবেমীর')) return '#F59E0B';
                                  if (trimmed.includes('কুদূরী') || trimmed.includes('বেকায়া')) return '#6366F1';
                                  if (trimmed.includes('হেদায়া') || trimmed.includes('মেশকাত')) return '#0EA5E9';
                                  if (trimmed.includes('দাওরায়ে হাদিস') || trimmed.includes('তাকমিল')) return '#10B981';
                                  return '#10B981';
                                };
                                return (
                                    <Cell key={`cell-${index}`} fill={getLevelColor(entry.name)} />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="pb-16 min-h-[400px]">
        {isArchiveView && statusFilter === 'accepted' ? (
          <div className="bg-card rounded-[2.5rem] border border-border-main/60 overflow-hidden shadow-2xl shadow-text-main/5">
            {/* Desktop View Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary border-b border-border-main/50 text-white">
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-center w-16 text-white/95">ক্রমিক</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-white/95">শিক্ষार्थियों নাম</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-white/95">জামাত/শ্রেণী</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-white/95">পিতার নাম</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-white/95">মোবাইল</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-white/95">আবেদনের তারিখ</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-white/95 text-right w-36">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/40">
                  {filteredApps.map((app, i) => (
                    <tr key={app.id} className="even:bg-primary/[0.02] hover:bg-primary/[0.06] transition-all duration-200 group">
                      <td className="px-6 py-4.5 text-center font-black text-xs text-text-light/50">
                        {enToBnNumber((i + 1).toString())}
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                            {app.name ? app.name.charAt(0) : 'অ'}
                          </div>
                          <div className="max-w-[200px] truncate">
                            <p className="font-black text-text-main text-xs group-hover:text-primary transition-colors truncate">{app.name}</p>
                            <p className="text-[10px] text-text-light/40 font-bold uppercase tracking-wider">#{String(app.id || '').slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="px-3 py-1 bg-step-bg border border-[#C5D0D9]/50 rounded-lg text-[10px] font-black text-primary uppercase">
                          {app.class || app.jamat || 'অন্যান্য'}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-xs font-bold text-text-main">
                        {app.fatherName}
                      </td>
                      <td className="px-6 py-4.5 text-xs font-bold text-text-main font-mono">
                        {enToBnNumber(app.mobile)}
                      </td>
                      <td className="px-6 py-4.5 text-[10px] font-bold text-text-light/60">
                        {app.applyDate ? formatDateToDDMMYYYY(app.applyDate) : '—'}
                      </td>
                      <td className="px-6 py-4.5 text-right font-hind-siliguri">
                        <button
                          onClick={() => setViewingApp(app)}
                          className="px-4 py-2 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02] shadow-sm flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Eye size={12} /> প্রোফাইল দেখুন
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet View Compact Rows */}
            <div className="lg:hidden divide-y divide-[#C5D0D9]/30">
              {filteredApps.map((app, i) => (
                <div key={app.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-primary/5 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                      {enToBnNumber((i + 1).toString())}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-black text-text-main text-sm tracking-tight truncate group-hover:text-primary transition-colors">{app.name}</h4>
                        <span className="px-2 py-0.5 bg-primary/5 border border-primary/10 rounded text-[9px] font-black text-primary uppercase">{app.class || app.jamat}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-[11px] font-bold text-text-light/60">
                        <p className="truncate">পিতা: {app.fatherName}</p>
                        <p className="font-mono">মোবাইল: {enToBnNumber(app.mobile)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border-main/40 pt-4 sm:pt-0 sm:border-0 font-hind-siliguri">
                    <span className="text-[10px] font-bold text-text-light/40 font-mono">আইডি: #{String(app.id || '').slice(-6)}</span>
                    <button
                      onClick={() => setViewingApp(app)}
                      className="px-4 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye size={12} /> প্রোফাইল দেখুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : viewMode === 'serial' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredApps.map((app, i) => (
                <ApplicationCard 
                  key={app.id} 
                  app={app} 
                  index={i} 
                  onView={setViewingApp} 
                  onAccept={() => setShowConfirm({ id: app.id, type: 'accept' })} 
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedApps).sort().map(([jamat, apps]) => {
              const appList = apps as Application[];
              return (
                <div key={jamat} className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 px-4">
                      <div className="w-fit px-6 py-2 bg-primary/10 text-primary rounded-full font-black text-sm tracking-tighter border border-primary/20 italic">
                          {jamat}
                      </div>
                      <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-border-main to-transparent opacity-50" />
                      <span className="text-[11px] font-black text-text-light/40 uppercase tracking-[0.3em]">
                          মোট {enToBnNumber(appList.length.toString())} আবেদন
                      </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                      <AnimatePresence mode="popLayout">
                          {appList.map((app, i) => (
                            <ApplicationCard 
                              key={app.id} 
                              app={app} 
                              index={i} 
                              onView={setViewingApp} 
                              onAccept={() => setShowConfirm({ id: app.id, type: 'accept' })} 
                            />
                          ))}
                      </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredApps.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="col-span-full py-32 bg-card rounded-[4rem] border-2 border-dashed border-border-main text-center flex flex-col items-center justify-center gap-6"
          >
             <div className="w-24 h-24 bg-step-bg rounded-[2rem] flex items-center justify-center text-text-light/20 shadow-inner">
                <RefreshCw size={40} className="animate-spin-slow" />
             </div>
             <div className="space-y-1">
               <p className="text-xl font-black text-text-main italic tracking-tighter">
                 {isArchiveView ? 'কোন আবেদন পাওয়া যায়নি' : 'কোন পেন্ডিং আবেদন নেই'}
               </p>
               <p className="text-xs font-bold text-text-light opacity-50">সব আবেদন প্রসেস করা হয়ে গিয়েছে।</p>
             </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const DetailBlock = ({ label, value, icon: Icon, copyValue, isPhone, isEmail }: any) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="flex items-start gap-4 p-5 bg-step-bg/50 rounded-3xl border border-border-main/50 hover:bg-white transition-all duration-300 group relative">
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm border border-border-main/30 group-hover:scale-110 transition-transform duration-300 shrink-0">
         <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1 pr-16">
         <p className="text-[10px] font-black text-text-light/40 uppercase tracking-widest mb-1 leading-none">{label}</p>
         <p className="text-sm font-bold text-text-main tracking-tight leading-snug break-words">{value || '—'}</p>
      </div>

      {copyValue && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          {isPhone && (
            <a 
              href={`tel:${copyValue}`}
              className="w-7 h-7 rounded-lg bg-success/10 hover:bg-success text-success hover:text-white flex items-center justify-center transition-all shadow-sm"
              title="কল করুন"
            >
              <Phone size={13} />
            </a>
          )}
          {isEmail && (
            <a 
              href={`mailto:${copyValue}`}
              className="w-7 h-7 rounded-lg bg-info/10 hover:bg-info text-info hover:text-white flex items-center justify-center transition-all shadow-sm"
              title="ইমেইল পাঠান"
            >
              <Mail size={13} />
            </a>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-sm cursor-pointer",
              copied 
                ? "bg-success text-white scale-105" 
                : "bg-primary/10 hover:bg-primary text-primary hover:text-white"
            )}
            title="কপি করুন"
          >
            {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
          </button>
        </div>
      )}
    </div>
  );
};

const EditField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-text-light uppercase tracking-widest ml-1">{label}</label>
    <input 
      type="text" 
      className="w-full px-6 py-4 bg-step-bg border border-border-main rounded-2xl font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`${label} লিখুন...`}
    />
  </div>
);
