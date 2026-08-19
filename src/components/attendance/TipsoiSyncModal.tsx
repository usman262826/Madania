import React, { useState, useMemo } from 'react';
import { 
  Wifi, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  Radio, 
  Clock, 
  Users, 
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Info,
  X,
  UserCheck,
  Briefcase,
  Layers,
  Sparkles,
  Calendar
} from 'lucide-react';
import { 
  getTipsoiConfig, 
  fetchTipsoiAttendanceLogs, 
  matchPunchesToStudents, 
  matchPunchesToStaffAndTeachers,
  checkTipsoiConnection, 
  TipsoiPunchRecord 
} from '../../services/tipsoiAttendanceService';
import { 
  processStaffAndTeacherAttendanceEngine,
  getAttendanceSettings,
  notifyAttendanceUpdate
} from '../../services/attendanceEngine';
import { enToBnNumber, cn } from '../../lib/utils';
import { Student } from '../../types';
import { useData } from '../../contexts/DataContext';
import toast from 'react-hot-toast';

interface TipsoiSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  students?: Student[];
  teachers?: any[];
  staffMembers?: any[];
  defaultScope?: 'all' | 'students' | 'teachers' | 'staff';
  onApplyAttendance?: (syncedMap: Record<string, { status: 'present' | 'late'; punchTime: string; deviceName?: string }>, date: string) => void;
}

export const TipsoiSyncModal: React.FC<TipsoiSyncModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  students: propStudents,
  teachers: propTeachers,
  staffMembers: propStaff,
  defaultScope = 'all',
  onApplyAttendance
}) => {
  const dataContext = useData();
  const students = propStudents || dataContext.students || [];
  const teachers = propTeachers || dataContext.teachers || [];
  const staffMembers = propStaff || dataContext.staffMembers || [];

  const [syncScope, setSyncScope] = useState<'all' | 'students' | 'teachers' | 'staff'>(defaultScope);
  const [activeResultTab, setActiveResultTab] = useState<'students' | 'teachers' | 'staff' | 'raw'>('students');

  const [config, setConfig] = useState(() => getTipsoiConfig());
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [tempBaseUrl, setTempBaseUrl] = useState(config.baseUrl);
  const [tempToken, setTempToken] = useState(config.apiToken);
  
  // Policy times
  const [studentLateThreshold, setStudentLateThreshold] = useState('08:30');
  const [teacherInTime, setTeacherInTime] = useState('08:00');
  const [staffInTime, setStaffInTime] = useState('08:30');

  const [isLoading, setIsLoading] = useState(false);
  const [syncDate, setSyncDate] = useState(selectedDate);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [rawPunches, setRawPunches] = useState<TipsoiPunchRecord[]>([]);
  
  // Results
  const [matchedStudentResults, setMatchedStudentResults] = useState<any>(null);
  const [matchedStaffTeacherResults, setMatchedStaffTeacherResults] = useState<any>(null);

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('tipsoi_base_url', tempBaseUrl.trim());
    localStorage.setItem('tipsoi_api_token', tempToken.trim());
    setConfig({ baseUrl: tempBaseUrl.trim(), apiToken: tempToken.trim() });
    setIsEditingConfig(false);
    toast.success('টিপসই API সেটিংস সংরক্ষিত হয়েছে!');
  };

  const handleFetchAndSync = async () => {
    setIsLoading(true);
    setSyncStatus('idle');
    setStatusMessage('টিপসই ক্লাউড সার্ভার থেকে ডেটা সংগ্রহ করা হচ্ছে...');

    try {
      const { punches } = await fetchTipsoiAttendanceLogs(syncDate);
      const connInfo = await checkTipsoiConnection();
      
      setRawPunches(punches || []);

      if (!punches || punches.length === 0) {
        setSyncStatus('idle');
        const devMsg = connInfo.devices.length > 0 ? ` (${connInfo.devices.length}টি ডিভাইস সংযুক্ত)` : '';
        setStatusMessage(`টিপসই API সংযুক্ত${devMsg}, তবে ${syncDate} তারিখে ডিভাইসে কোনো পাঞ্চ রেকর্ড পাওয়া যায়নি।`);
        
        // Reset matches
        const studentMatch = matchPunchesToStudents([], students, syncDate, studentLateThreshold);
        setMatchedStudentResults(studentMatch);
        setMatchedStaffTeacherResults(null);
        toast.error(`${syncDate} তারিখে কোনো বায়োমেট্রিক পাঞ্চ পাওয়া যায়নি!`);
      } else {
        // 1. Match Students
        const studentMatch = matchPunchesToStudents(punches, students, syncDate, studentLateThreshold);
        setMatchedStudentResults(studentMatch);

        // 2. Match Teachers and Staff using their custom rules & settings
        const settings = getAttendanceSettings();
        const staffTeacherMatch = matchPunchesToStaffAndTeachers(
          punches,
          teachers,
          staffMembers,
          syncDate,
          {
            teacherRule: { ...settings.teacherRule, standardInTime: teacherInTime },
            staffRule: { ...settings.staffRule, standardInTime: staffInTime }
          }
        );
        setMatchedStaffTeacherResults(staffTeacherMatch);

        setSyncStatus('success');
        const totalMatched = studentMatch.stats.matchedCount + staffTeacherMatch.teacherResults.filter(t => t.status === 'present' || t.status === 'late').length + staffTeacherMatch.staffResults.filter(s => s.status === 'present' || s.status === 'late').length;
        
        setStatusMessage(`টিপসই API থেকে সফলভাবে ${enToBnNumber(punches.length)}টি পাঞ্চ রেকর্ড সংগ্রহ করা হয়েছে।`);
        toast.success(`মোট ${enToBnNumber(totalMatched)} জন (শিক্ষার্থী, শিক্ষক ও কর্মী) সনাক্ত হয়েছে!`);
        
        // Set initial result tab based on scope
        if (syncScope === 'teachers') setActiveResultTab('teachers');
        else if (syncScope === 'staff') setActiveResultTab('staff');
        else setActiveResultTab('students');
      }
    } catch (err: any) {
      console.error('Tipsoi sync error:', err);
      setSyncStatus('error');
      setStatusMessage(`API সংযোগে সমস্যা: ${err.message || 'সার্ভার রেসপন্স দেয়নি'}`);
      toast.error('টিপসই ডেটা আনতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToSystem = () => {
    let appliedCount = 0;

    // 1. Apply Student Attendance
    if ((syncScope === 'all' || syncScope === 'students') && matchedStudentResults) {
      if (onApplyAttendance && Object.keys(matchedStudentResults.matchedRecords).length > 0) {
        onApplyAttendance(matchedStudentResults.matchedRecords, syncDate);
        appliedCount += Object.keys(matchedStudentResults.matchedRecords).length;
      }
    }

    // 2. Apply Teacher & Staff Attendance
    if (syncScope === 'all' || syncScope === 'teachers' || syncScope === 'staff') {
      if (rawPunches && rawPunches.length > 0) {
        const settings = getAttendanceSettings();
        const res = processStaffAndTeacherAttendanceEngine(
          rawPunches,
          teachers,
          staffMembers,
          syncDate,
          settings
        );
        appliedCount += (res.teacherSummary.present + res.teacherSummary.late + res.staffSummary.present + res.staffSummary.late);
      }
    }

    notifyAttendanceUpdate();
    toast.success(`টিপসই বায়োমেট্রিক হাজিরা সিস্টেমে সফলভাবে সংরক্ষিত হয়েছে!`);
    onClose();
  };

  const totalMatchedCount = useMemo(() => {
    let count = 0;
    if (matchedStudentResults) count += matchedStudentResults.stats.matchedCount;
    if (matchedStaffTeacherResults) {
      count += matchedStaffTeacherResults.teacherResults.filter((t: any) => t.status === 'present' || t.status === 'late').length;
      count += matchedStaffTeacherResults.staffResults.filter((s: any) => s.status === 'present' || s.status === 'late').length;
    }
    return count;
  }, [matchedStudentResults, matchedStaffTeacherResults]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-hind-siliguri animate-fade-in">
      <div className="bg-card w-full max-w-4xl rounded-3xl border border-border-main shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border-main flex items-center justify-between bg-step-bg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
              <Radio size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-text-main leading-tight">
                  টিপসই (Tipsoi) বায়োমেট্রিক এটেনডেন্স সিঙ্ক
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full">
                  API Connected
                </span>
              </div>
              <p className="text-[11px] text-text-light/70 font-bold">
                শিক্ষার্থী, শিক্ষক ও স্টাফদের জন্য নিয়মমাফিক স্বয়ংক্রিয় উপস্থিতি ও সময় ট্র্যাকিং
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-border-main/50 hover:bg-border-main flex items-center justify-center text-text-light hover:text-text-main transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-left">
          
          {/* Scope Selector Tabs */}
          <div className="flex items-center justify-between gap-3 bg-step-bg p-2 rounded-2xl border border-border-main">
            <span className="text-xs font-black text-text-main px-2">সিঙ্কের আওতা:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSyncScope('all')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                  syncScope === 'all'
                    ? "bg-primary text-white shadow-xs"
                    : "text-text-light hover:text-text-main bg-card border border-border-main"
                )}
              >
                একত্রে সকল (শিক্ষার্থী + শিক্ষক + স্টাফ)
              </button>
              <button
                type="button"
                onClick={() => setSyncScope('students')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                  syncScope === 'students'
                    ? "bg-primary text-white shadow-xs"
                    : "text-text-light hover:text-text-main bg-card border border-border-main"
                )}
              >
                শিক্ষার্থী হাজিরা
              </button>
              <button
                type="button"
                onClick={() => setSyncScope('teachers')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                  syncScope === 'teachers'
                    ? "bg-primary text-white shadow-xs"
                    : "text-text-light hover:text-text-main bg-card border border-border-main"
                )}
              >
                শিক্ষক ও ওস্তাদগণ
              </button>
              <button
                type="button"
                onClick={() => setSyncScope('staff')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                  syncScope === 'staff'
                    ? "bg-primary text-white shadow-xs"
                    : "text-text-light hover:text-text-main bg-card border border-border-main"
                )}
              >
                স্টাফ ও কর্মচারী
              </button>
            </div>
          </div>

          {/* API Credentials Card */}
          <div className="p-4 bg-step-bg border border-border-main rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi size={16} className="text-primary" />
                <span className="text-xs font-black text-text-main">টিপসই API ক্রেডেনশিয়াল ও স্ট্যাটাস</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingConfig(!isEditingConfig)}
                className="text-[11px] font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Settings size={12} />
                <span>{isEditingConfig ? 'বাতিল' : 'কাস্টমাইজ'}</span>
              </button>
            </div>

            {isEditingConfig ? (
              <form onSubmit={handleSaveConfig} className="space-y-3 mt-3">
                <div>
                  <label className="text-[10px] font-black text-text-light/60 uppercase">Base URL / Endpoint</label>
                  <input
                    type="text"
                    value={tempBaseUrl}
                    onChange={(e) => setTempBaseUrl(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-card border border-border-main rounded-xl font-mono text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="https://api-inovace360.com/api/v1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-text-light/60 uppercase">API Token</label>
                  <input
                    type="text"
                    value={tempToken}
                    onChange={(e) => setTempToken(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-card border border-border-main rounded-xl font-mono text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="6973-da50-6873-..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white text-xs font-black rounded-xl cursor-pointer"
                  >
                    সেভ করুন
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-card rounded-xl border border-border-main/60">
                  <span className="text-[10px] text-text-light/50 font-black block uppercase">Client Endpoint</span>
                  <span className="font-mono font-bold text-text-main truncate block">{config.baseUrl}</span>
                </div>
                <div className="p-2.5 bg-card rounded-xl border border-border-main/60">
                  <span className="text-[10px] text-text-light/50 font-black block uppercase">API Token Status</span>
                  <span className="font-mono font-bold text-emerald-600 truncate block">
                    {config.apiToken ? `${config.apiToken.slice(0, 8)}...${config.apiToken.slice(-8)} (সক্রিয়)` : 'টোকেন সেট করা নেই'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sync Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-black text-text-main block mb-1.5">হাজিরা সংগ্রহের তারিখ</label>
              <input
                type="date"
                value={syncDate}
                onChange={(e) => setSyncDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl font-black text-xs text-text-main outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-text-main block mb-1.5">শিক্ষার্থী লেট সময়</label>
              <input
                type="time"
                value={studentLateThreshold}
                onChange={(e) => setStudentLateThreshold(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl font-black text-xs text-text-main outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-text-main block mb-1.5">শিক্ষক ইন-টাইম</label>
              <input
                type="time"
                value={teacherInTime}
                onChange={(e) => setTeacherInTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl font-black text-xs text-text-main outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleFetchAndSync}
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <RefreshCw size={15} className={cn(isLoading && "animate-spin")} />
                <span>{isLoading ? 'সংগ্রহ হচ্ছে...' : 'টিপসই ডেটা সিঙ্ক করুন'}</span>
              </button>
            </div>
          </div>

          {/* Results View */}
          {(matchedStudentResults || matchedStaffTeacherResults) && (
            <div className="space-y-4 animate-fade-in">
              {/* Summary Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-card border border-border-main rounded-2xl text-center">
                  <span className="text-[10px] font-black text-text-light/50 uppercase block">মোট ডিভাইস পাঞ্চ</span>
                  <span className="text-xl font-black text-text-main mt-0.5 block">
                    {enToBnNumber(rawPunches.length)} টি
                  </span>
                </div>
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                  <span className="text-[10px] font-black text-emerald-600 uppercase block">উপস্থিত শিক্ষার্থী</span>
                  <span className="text-xl font-black text-emerald-600 mt-0.5 block">
                    {enToBnNumber(matchedStudentResults?.stats?.matchedCount || 0)} জন
                  </span>
                </div>
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-center">
                  <span className="text-[10px] font-black text-blue-600 uppercase block">উপস্থিত শিক্ষক</span>
                  <span className="text-xl font-black text-blue-600 mt-0.5 block">
                    {enToBnNumber(matchedStaffTeacherResults?.teacherResults?.filter((t: any) => t.status === 'present' || t.status === 'late').length || 0)} জন
                  </span>
                </div>
                <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-center">
                  <span className="text-[10px] font-black text-purple-600 uppercase block">উপস্থিত কর্মী</span>
                  <span className="text-xl font-black text-purple-600 mt-0.5 block">
                    {enToBnNumber(matchedStaffTeacherResults?.staffResults?.filter((s: any) => s.status === 'present' || s.status === 'late').length || 0)} জন
                  </span>
                </div>
              </div>

              {/* Sub-Tabs to view each category */}
              <div className="flex items-center gap-2 border-b border-border-main pb-2">
                <button
                  type="button"
                  onClick={() => setActiveResultTab('students')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer",
                    activeResultTab === 'students'
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-step-bg text-text-light hover:text-text-main"
                  )}
                >
                  <Users size={14} />
                  <span>শিক্ষার্থী ({enToBnNumber(matchedStudentResults?.stats?.matchedCount || 0)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResultTab('teachers')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer",
                    activeResultTab === 'teachers'
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-step-bg text-text-light hover:text-text-main"
                  )}
                >
                  <UserCheck size={14} />
                  <span>শিক্ষক ({enToBnNumber(matchedStaffTeacherResults?.teacherResults?.length || 0)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResultTab('staff')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer",
                    activeResultTab === 'staff'
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-step-bg text-text-light hover:text-text-main"
                  )}
                >
                  <Briefcase size={14} />
                  <span>স্টাফ ({enToBnNumber(matchedStaffTeacherResults?.staffResults?.length || 0)})</span>
                </button>
              </div>

              {/* Students Results Table */}
              {activeResultTab === 'students' && matchedStudentResults && (
                <div className="border border-border-main rounded-2xl overflow-hidden">
                  <div className="p-3 bg-step-bg border-b border-border-main flex items-center justify-between">
                    <span className="text-xs font-black text-text-main flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      শিক্ষার্থীদের ম্যাচকৃত তালিকা
                    </span>
                    <span className="text-[11px] font-bold text-text-light/60">
                      তারিখ: {syncDate}
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-border-main text-xs">
                    {matchedStudentResults.matchedDetails.length === 0 ? (
                      <div className="p-6 text-center text-text-light/50 font-bold">
                        কোন শিক্ষার্থী ম্যাচ করেনি
                      </div>
                    ) : (
                      matchedStudentResults.matchedDetails.map((item: any, i: number) => (
                        <div key={i} className="p-3 flex items-center justify-between hover:bg-step-bg/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px] flex items-center justify-center">
                              {i + 1}
                            </span>
                            <div>
                              <span className="font-black text-text-main block">{item.studentName}</span>
                              <span className="text-[10px] text-text-light/60">
                                আইডি: {item.studentId} {item.roll ? `| রোল: ${item.roll}` : ''} {item.class ? `| জামাত: ${item.class}` : ''}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 font-mono text-[10px] font-bold bg-step-bg border border-border-main rounded-md">
                              {item.punchTime}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 text-[10px] font-black rounded-lg",
                              item.status === 'present' 
                                ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                            )}>
                              {item.status === 'present' ? 'উপস্থিত' : 'দেরিতে (Late)'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Teachers Results Table */}
              {activeResultTab === 'teachers' && matchedStaffTeacherResults && (
                <div className="border border-border-main rounded-2xl overflow-hidden">
                  <div className="p-3 bg-step-bg border-b border-border-main flex items-center justify-between">
                    <span className="text-xs font-black text-text-main flex items-center gap-1.5">
                      <UserCheck size={15} className="text-blue-600" />
                      শিক্ষকদের উপস্থিতি ও পাঞ্চ সময়
                    </span>
                    <span className="text-[11px] font-bold text-text-light/60">
                      তারিখ: {syncDate}
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-border-main text-xs">
                    {matchedStaffTeacherResults.teacherResults.length === 0 ? (
                      <div className="p-6 text-center text-text-light/50 font-bold">
                        কোন শিক্ষক তথ্য পাওয়া যায়নি
                      </div>
                    ) : (
                      matchedStaffTeacherResults.teacherResults.map((item: any, i: number) => (
                        <div key={i} className="p-3 flex items-center justify-between hover:bg-step-bg/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 font-bold text-[10px] flex items-center justify-center">
                              {i + 1}
                            </span>
                            <div>
                              <span className="font-black text-text-main block">{item.name}</span>
                              <span className="text-[10px] text-text-light/60">
                                {item.designation} • {item.department}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right font-mono text-[10px]">
                              <span className="block text-text-main font-bold">ইন: {item.firstInTime || '—'}</span>
                              <span className="block text-text-light/60">আউট: {item.lastOutTime || '—'}</span>
                            </div>
                            <span className={cn(
                              "px-2.5 py-1 text-[10px] font-black rounded-lg",
                              item.status === 'present' ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" :
                              item.status === 'late' ? "bg-amber-500/15 text-amber-600 border border-amber-500/30" :
                              item.status === 'weekly_off' ? "bg-purple-500/15 text-purple-600 border border-purple-500/30" :
                              "bg-red-500/15 text-red-600 border border-red-500/30"
                            )}>
                              {item.status === 'present' ? 'উপস্থিত' :
                               item.status === 'late' ? `${enToBnNumber(item.lateMinutes)} মি. লেট` :
                               item.status === 'weekly_off' ? 'সাপ্তাহিক ছুটি' : 'অনুপস্থিত'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Staff Results Table */}
              {activeResultTab === 'staff' && matchedStaffTeacherResults && (
                <div className="border border-border-main rounded-2xl overflow-hidden">
                  <div className="p-3 bg-step-bg border-b border-border-main flex items-center justify-between">
                    <span className="text-xs font-black text-text-main flex items-center gap-1.5">
                      <Briefcase size={15} className="text-purple-600" />
                      কর্মীদের উপস্থিতি ও কর্মঘণ্টা
                    </span>
                    <span className="text-[11px] font-bold text-text-light/60">
                      তারিখ: {syncDate}
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-border-main text-xs">
                    {matchedStaffTeacherResults.staffResults.length === 0 ? (
                      <div className="p-6 text-center text-text-light/50 font-bold">
                        কোন কর্মী তথ্য পাওয়া যায়নি
                      </div>
                    ) : (
                      matchedStaffTeacherResults.staffResults.map((item: any, i: number) => (
                        <div key={i} className="p-3 flex items-center justify-between hover:bg-step-bg/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-600 font-bold text-[10px] flex items-center justify-center">
                              {i + 1}
                            </span>
                            <div>
                              <span className="font-black text-text-main block">{item.name}</span>
                              <span className="text-[10px] text-text-light/60">
                                {item.designation} • {item.department}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right font-mono text-[10px]">
                              <span className="block text-text-main font-bold">ইন: {item.firstInTime || '—'}</span>
                              <span className="block text-text-light/60">{enToBnNumber(item.workingHours)} ঘণ্টা</span>
                            </div>
                            <span className={cn(
                              "px-2.5 py-1 text-[10px] font-black rounded-lg",
                              item.status === 'present' ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" :
                              item.status === 'late' ? "bg-amber-500/15 text-amber-600 border border-amber-500/30" :
                              item.status === 'leave' ? "bg-blue-500/15 text-blue-600 border border-blue-500/30" :
                              "bg-red-500/15 text-red-600 border border-red-500/30"
                            )}>
                              {item.status === 'present' ? 'উপস্থিত' :
                               item.status === 'late' ? `${enToBnNumber(item.lateMinutes)} মি. লেট` :
                               item.status === 'leave' ? 'ছুটিতে' : 'অনুপস্থিত'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Notice */}
          <div className="p-3.5 bg-primary/5 border border-primary/15 rounded-2xl flex items-start gap-2.5 text-xs text-text-light/80">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>রিয়েল-টাইম বায়োমেট্রিক ইঞ্জিন:</strong> টিপসই ডিভাইস থেকে সংগৃহীত পাঞ্চ লগসমূহ শিক্ষার্থী, শিক্ষক এবং কর্মীদের প্রোফাইল ও নির্ধারিত নিয়মাবলীর (প্রবেশ সময়, গ্রেস পিরিয়ড, সাপ্তাহিক ছুটি) ভিত্তিতে নিখুঁতভাবে প্রক্রিয়া ও সংরক্ষণ করা হয়।
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border-main bg-step-bg flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border-main font-black text-xs text-text-light hover:text-text-main cursor-pointer"
          >
            বন্ধ করুন
          </button>
          
          <button
            type="button"
            onClick={handleApplyToSystem}
            disabled={!matchedStudentResults && !matchedStaffTeacherResults}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <ShieldCheck size={16} />
            <span>সিস্টেমে হাজিরা সংরক্ষণ করুন ({enToBnNumber(totalMatchedCount)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
