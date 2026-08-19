import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { getTipsoiConfig, fetchTipsoiAttendanceLogs, matchPunchesToStudents, checkTipsoiConnection, TipsoiPunchRecord } from '../../services/tipsoiAttendanceService';
import { enToBnNumber, cn } from '../../lib/utils';
import { Student } from '../../types';
import toast from 'react-hot-toast';

interface TipsoiSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  students: Student[];
  onApplyAttendance: (syncedMap: Record<string, { status: 'present' | 'late'; punchTime: string; deviceName?: string }>, date: string) => void;
}

export const TipsoiSyncModal: React.FC<TipsoiSyncModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  students,
  onApplyAttendance
}) => {
  const [config, setConfig] = useState(() => getTipsoiConfig());
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [tempBaseUrl, setTempBaseUrl] = useState(config.baseUrl);
  const [tempToken, setTempToken] = useState(config.apiToken);
  const [lateThreshold, setLateThreshold] = useState('08:30');

  const [isLoading, setIsLoading] = useState(false);
  const [syncDate, setSyncDate] = useState(selectedDate);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [rawPunches, setRawPunches] = useState<TipsoiPunchRecord[]>([]);
  const [matchedResults, setMatchedResults] = useState<any>(null);

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
      const { punches, rawResponse } = await fetchTipsoiAttendanceLogs(syncDate);
      const connInfo = await checkTipsoiConnection();
      
      setRawPunches(punches || []);

      if (!punches || punches.length === 0) {
        setSyncStatus('idle');
        const devMsg = connInfo.devices.length > 0 ? ` (${connInfo.devices.length}টি ডিভাইস সংযুক্ত)` : '';
        setStatusMessage(`টিপসই API সংযুক্ত${devMsg}, তবে ${syncDate} তারিখে ডিভাইসে কোনো পাঞ্চ রেকর্ড পাওয়া যায়নি।`);
        const matchData = matchPunchesToStudents([], students, syncDate, lateThreshold);
        setMatchedResults(matchData);
        toast.error(`${syncDate} তারিখে কোনো বায়োমেট্রিক পাঞ্চ পাওয়া যায়নি!`);
      } else {
        const matchData = matchPunchesToStudents(punches, students, syncDate, lateThreshold);
        setMatchedResults(matchData);
        setSyncStatus('success');
        setStatusMessage(`টিপসই API থেকে সফলভাবে ${enToBnNumber(punches.length)}টি পাঞ্চ রেকর্ড সংগ্রহ করা হয়েছে।`);
        toast.success(`${enToBnNumber(matchData.stats.matchedCount)} জন শিক্ষার্থীর উপস্থিতি সনাক্ত হয়েছে!`);
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
    if (!matchedResults || Object.keys(matchedResults.matchedRecords).length === 0) {
      toast.error('প্রয়োগ করার জন্য কোনো ম্যাচকৃত রেকর্ড নেই!');
      return;
    }

    onApplyAttendance(matchedResults.matchedRecords, syncDate);
    toast.success(`টিপসই বায়োমেট্রিক হাজিরা সিস্টেমে সফলভাবে সংরক্ষিত হয়েছে!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-hind-siliguri animate-fade-in">
      <div className="bg-card w-full max-w-3xl rounded-3xl border border-border-main shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
              <p className="text-[11px] text-text-light/60 font-bold">
                শিক্ষার্থীদের আইডি/রোল/কার্ড নম্বরের সাথে স্বয়ংক্রিয় বায়োমেট্রিক উপস্থিতি ম্যাচিং
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
          {/* API Credentials Card */}
          <div className="p-4 bg-step-bg border border-border-main rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi size={16} className="text-primary" />
                <span className="text-xs font-black text-text-main">টিপসই API তথ্য ও ক্রেডেনশিয়াল</span>
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
                    {config.apiToken.slice(0, 8)}...{config.apiToken.slice(-8)} (সক্রিয়)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sync Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <label className="text-[11px] font-black text-text-main block mb-1.5">লেট (Late) সময়সীমা</label>
              <input
                type="time"
                value={lateThreshold}
                onChange={(e) => setLateThreshold(e.target.value)}
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
                <span>{isLoading ? 'সংগ্রহ করা হচ্ছে...' : 'পাঞ্চ ডেটা সিঙ্ক করুন'}</span>
              </button>
            </div>
          </div>

          {/* Matching Summary & Logs */}
          {matchedResults && (
            <div className="space-y-4 animate-fade-in">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-card border border-border-main rounded-2xl text-center">
                  <span className="text-[10px] font-black text-text-light/50 uppercase block">ডিভাইস পাঞ্চ</span>
                  <span className="text-xl font-black text-text-main mt-0.5 block">
                    {enToBnNumber(matchedResults.stats.totalPunches)} টি
                  </span>
                </div>
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                  <span className="text-[10px] font-black text-emerald-600 uppercase block">ম্যাচিং শিক্ষার্থী</span>
                  <span className="text-xl font-black text-emerald-600 mt-0.5 block">
                    {enToBnNumber(matchedResults.stats.matchedCount)} জন
                  </span>
                </div>
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center">
                  <span className="text-[10px] font-black text-amber-600 uppercase block">অনুপস্থিত (বাকি)</span>
                  <span className="text-xl font-black text-amber-600 mt-0.5 block">
                    {enToBnNumber(Math.max(0, students.length - matchedResults.stats.matchedCount))} জন
                  </span>
                </div>
              </div>

              {/* Matched Details Table */}
              <div className="border border-border-main rounded-2xl overflow-hidden">
                <div className="p-3 bg-step-bg border-b border-border-main flex items-center justify-between">
                  <span className="text-xs font-black text-text-main flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    ম্যাচকৃত উপস্থিতি তালিকা
                  </span>
                  <span className="text-[11px] font-bold text-text-light/60">
                    তারিখ: {syncDate}
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-border-main text-xs">
                  {matchedResults.matchedDetails.length === 0 ? (
                    <div className="p-6 text-center text-text-light/50 font-bold">
                      কোন শিক্ষার্থী ম্যাচ করেনি
                    </div>
                  ) : (
                    matchedResults.matchedDetails.map((item: any, i: number) => (
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
            </div>
          )}

          {/* Info Notice */}
          <div className="p-3.5 bg-primary/5 border border-primary/15 rounded-2xl flex items-start gap-2.5 text-xs text-text-light/80">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>কীভাবে কাজ করে:</strong> টিপসই বায়োমেট্রিক ডিভাইসে শিক্ষার্থী যখন আঙুল/কার্ড পাঞ্চ করে, তখন ডিভাইসের আইডি/রোল নম্বরের সাথে মাদরাসার ডাটাবেসের শিক্ষার্থীদের স্বয়ংক্রিয়ভাবে মিলিয়ে হাজিরা এবং লেট মার্কিং নির্ধারণ করা হয়।
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
            disabled={!matchedResults || matchedResults.stats.matchedCount === 0}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <ShieldCheck size={16} />
            <span>সিস্টেমে হাজিরা সংরক্ষণ করুন ({enToBnNumber(matchedResults?.stats?.matchedCount || 0)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
