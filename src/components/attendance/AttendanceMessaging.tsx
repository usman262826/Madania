import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  Settings, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  FileText, 
  UserCheck, 
  Users, 
  Sliders, 
  Phone, 
  Sparkles,
  ChevronRight,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';
import { Student } from '../../types';
import { 
  AttendanceSettings, 
  SentMessageLog, 
  DEFAULT_ATTENDANCE_SETTINGS 
} from '../../types/attendance';
import { 
  getAttendanceSettings, 
  saveAttendanceSettings, 
  getSentMessageLogs, 
  addSentMessageLog,
  clearSentMessageLogs 
} from '../../services/attendanceEngine';
import { 
  sendBulkSmsBd,
  sendSmsNetBd, 
  getBulkSmsBalance,
  getSmsNetBdBalance, 
  getSmsNetBdReport, 
  DEFAULT_BULKSMSBD_API_KEY,
  DEFAULT_BULKSMSBD_SENDER_ID,
  DEFAULT_SMS_NET_BD_API_KEY,
  SmsBalanceResult 
} from '../../services/smsService';
import { enToBnNumber, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface AttendanceMessagingProps {
  students: Student[];
}

export const AttendanceMessaging: React.FC<AttendanceMessagingProps> = ({ students }) => {
  const [settings, setSettings] = useState<AttendanceSettings>(() => getAttendanceSettings());
  const [logs, setLogs] = useState<SentMessageLog[]>(() => getSentMessageLogs());
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'templates' | 'logs' | 'students' | 'gateway'>('rules');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<keyof AttendanceSettings['messaging']['templates']>('late');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');
  const [testStudentId, setTestStudentId] = useState<string>(() => students[0]?.id || '101');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [searchStudentTerm, setSearchStudentTerm] = useState('');
  
  // Real SMS.NET.BD states
  const [smsBalance, setSmsBalance] = useState<{ balance?: string | number; user?: string; error?: number; msg?: string } | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [customTestPhone, setCustomTestPhone] = useState('');
  const [customTestMsg, setCustomTestMsg] = useState('আল মাদানিয়া মাদ্রাসা: আপনার সন্তানের হাজিরা সংক্রান্ত টেস্ট SMS।');
  const [isSendingCustomTest, setIsSendingCustomTest] = useState(false);

  const filteredStudentsForOverrides = useMemo(() => {
    return students.filter(student => {
      if (!searchStudentTerm) return true;
      const term = searchStudentTerm.toLowerCase();
      const sName = String(student['শিক্ষার্থীর নাম'] || student.name || '').toLowerCase();
      const sId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || '').toLowerCase();
      const sRoll = String(student['রোল নম্বর'] || student.roll || '').toLowerCase();
      const sPhone = String(student['মোবাইল (বাবা/ভাই)'] || student.mobile || '').toLowerCase();
      return sName.includes(term) || sId.includes(term) || sRoll.includes(term) || sPhone.includes(term);
    });
  }, [students, searchStudentTerm]);

  useEffect(() => {
    setLogs(getSentMessageLogs());
    fetchBalance();
  }, []);

  const fetchBalance = async (apiKeyOverride?: string) => {
    setIsLoadingBalance(true);
    try {
      const key = apiKeyOverride || settings.messaging.providerApiKey || DEFAULT_SMS_NET_BD_API_KEY;
      const res = await getSmsNetBdBalance(key);
      setSmsBalance(res);
      if (res.error === 0) {
        toast.success(`SMS ব্যালেন্স আপডেট হয়েছে: ${res.balance} BDT`);
      }
    } catch (err: any) {
      console.error('Balance fetch failed:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleSaveSettings = (newSettings: AttendanceSettings) => {
    setSettings(newSettings);
    saveAttendanceSettings(newSettings);
    toast.success('মেসেজিং সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
  };

  const handleClearLogs = () => {
    if (window.confirm('আপনি কি নিশ্চিত যে সকল SMS মেসেজ লগ মুছে ফেলতে চান?')) {
      clearSentMessageLogs();
      setLogs([]);
      toast.success('সকল SMS লগ মুছে ফেলা হয়েছে!');
    }
  };

  const sampleStudent = students.find(s => String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর']) === testStudentId) || students[0] || {
    id: '101',
    name: 'মুহাম্মাদ আব্দুল্লাহ',
    class: 'ইবতেদাইয়্যাহ',
    category: 'অনাবাসিক',
    fatherName: 'মাওলানা আব্দুর রশিদ',
    mobile: '01711223344',
  } as any;

  // Generate preview of active template
  const getTemplatePreview = (templateStr: string) => {
    const sName = sampleStudent['শিক্ষার্থীর নাম'] || sampleStudent.name || 'মুহাম্মাদ আব্দুল্লাহ';
    const gName = sampleStudent['পিতার নাম'] || sampleStudent['অভিভাবকের নাম'] || sampleStudent.fatherName || 'মাওলানা আব্দুর রশিদ';
    const sClass = sampleStudent['জামাত/শ্রেণী'] || sampleStudent['জামাত'] || sampleStudent.class || 'ইবতেদাইয়্যাহ';
    const sCat = sampleStudent.category || 'অনাবাসিক';
    const today = new Date().toISOString().split('T')[0];

    return templateStr
      .replace(/{student_name}/g, sName)
      .replace(/{guardian_name}/g, gName)
      .replace(/{date}/g, today)
      .replace(/{time}/g, '০৬:৪৫')
      .replace(/{entry_time}/g, '০৬:৪৫')
      .replace(/{exit_time}/g, '২১:১৫')
      .replace(/{late_minutes}/g, enToBnNumber(15))
      .replace(/{absence_days}/g, enToBnNumber(2))
      .replace(/{class}/g, sClass)
      .replace(/{jamat}/g, sClass)
      .replace(/{category}/g, sCat);
  };

  const handleSendTestSMS = async () => {
    setIsSendingTest(true);
    const template = settings.messaging.templates[selectedTemplateKey];
    const previewContent = getTemplatePreview(template);
    const phone = sampleStudent['মোবাইল (বাবা/ভাই)'] || sampleStudent.mobile || '01711000000';
    const sId = String(sampleStudent.id || '101');

    try {
      const apiKey = settings.messaging.providerApiKey || DEFAULT_SMS_NET_BD_API_KEY;
      const res = await sendSmsNetBd({
        to: phone,
        msg: previewContent,
        apiKey,
        senderId: settings.messaging.senderId,
      });

      addSentMessageLog({
        messageId: res.requestId ? `REQ-${res.requestId}` : `TEST-${Date.now()}`,
        studentId: sId,
        studentName: sampleStudent['শিক্ষার্থীর নাম'] || sampleStudent.name || 'শিক্ষার্থী',
        guardianName: sampleStudent['পিতার নাম'] || 'অভিভাবক',
        phone,
        event: selectedTemplateKey as any,
        content: previewContent,
        deliveryStatus: res.success ? 'delivered' : 'failed',
        ruleId: `test_${Date.now()}`,
      });

      setLogs(getSentMessageLogs());
      if (res.success) {
        toast.success(`টেস্ট SMS সফলভাবে পাঠানো হয়েছে: ${phone}`);
      } else {
        toast.error(`SMS প্রেরণে সমস্যা: ${res.msg || 'অজানা ত্রুটি'}`);
      }
    } catch (err: any) {
      toast.error(`ত্রুটি: ${err?.message || 'SMS পাঠাতে ব্যর্থ'}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendCustomDirectSMS = async () => {
    if (!customTestPhone.trim()) {
      toast.error('অনুগ্রহ করে মোবাইল নম্বর লিখুন');
      return;
    }
    if (!customTestMsg.trim()) {
      toast.error('অনুগ্রহ করে মেসেজের টেক্সট লিখুন');
      return;
    }

    setIsSendingCustomTest(true);
    try {
      const apiKey = settings.messaging.providerApiKey || DEFAULT_SMS_NET_BD_API_KEY;
      const res = await sendSmsNetBd({
        to: customTestPhone.trim(),
        msg: customTestMsg.trim(),
        apiKey,
        senderId: settings.messaging.senderId,
      });

      addSentMessageLog({
        messageId: res.requestId ? `REQ-${res.requestId}` : `CUSTOM-${Date.now()}`,
        studentId: 'MANUAL',
        studentName: 'সরাসরি টেস্ট',
        guardianName: 'ম্যানুয়াল প্রাপক',
        phone: customTestPhone.trim(),
        event: 'manual_notice' as any,
        content: customTestMsg.trim(),
        deliveryStatus: res.success ? 'delivered' : 'failed',
        ruleId: `manual_${Date.now()}`,
      });

      setLogs(getSentMessageLogs());
      if (res.success) {
        toast.success(`সরাসরি SMS সফলভাবে ডেলিভারি করা হয়েছে: ${customTestPhone}`);
        setCustomTestPhone('');
      } else {
        toast.error(`SMS সেন্ডিং ব্যর্থ: ${res.msg || 'ত্রুটি'}`);
      }
    } catch (err: any) {
      toast.error(`SMS ব্যর্থ: ${err?.message || 'নেটওয়ার্ক সমস্যা'}`);
    } finally {
      setIsSendingCustomTest(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = !searchTerm || 
      l.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      l.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvent = selectedEventFilter === 'all' || l.event === selectedEventFilter;
    return matchesSearch && matchesEvent;
  });

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <MessageSquare size={26} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-main)]">
                অটোমেটিক অভিভাবক মেসেজিং সিস্টেম
              </h1>
              <p className="text-xs md:text-sm text-[var(--color-text-light)]">
                বায়োমেট্রিক পাঞ্চ ভ্যালিডেশন এবং রুল ইঞ্জিন অনুযায়ী রিয়েল-টাইম SMS নোটিফিকেশন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border",
              settings.messaging.enabled 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            )}>
              <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", settings.messaging.enabled ? "bg-emerald-500" : "bg-rose-500")} />
              {settings.messaging.enabled ? "স্বয়ংক্রিয় SMS চালু" : "মেসেজিং বন্ধ"}
            </div>

            <button
              onClick={() => {
                const updated = {
                  ...settings,
                  messaging: {
                    ...settings.messaging,
                    enabled: !settings.messaging.enabled,
                  }
                };
                handleSaveSettings(updated);
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm",
                settings.messaging.enabled
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {settings.messaging.enabled ? "মেসেজিং অফ করুন" : "মেসেজিং অন করুন"}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-t border-[var(--color-border-main)] mt-6 pt-4">
          {[
            { id: 'rules', label: 'ট্রিগার রুলস ও পলিসি', icon: Sliders },
            { id: 'templates', label: 'মেসেজ টেমপ্লেট ও প্রিভিউ', icon: FileText },
            { id: 'logs', label: `মেসেজ ডেলিভারি হিস্ট্রি (${enToBnNumber(logs.length)})`, icon: Clock },
            { id: 'students', label: 'শিক্ষার্থী ভিত্তিক কাস্টম রুল', icon: Users },
            { id: 'gateway', label: 'SMS গেটওয়ে সেটিংস', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
                  isActive 
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "bg-[var(--color-bg)] hover:bg-[var(--color-border-main)] text-[var(--color-text-main)]"
                )}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Rules & Trigger Policies */}
      {activeSubTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General Attendance Triggers */}
          <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[var(--color-text-main)] flex items-center gap-2">
              <ShieldCheck className="text-teal-600" size={18} />
              উপস্থিতি ও অনুপস্থিতি ট্রিগার রুল
            </h3>
            <p className="text-xs text-[var(--color-text-light)]">
              কোন কোন ইভেন্টে অভিভাবকদের মোবাইল নম্বরে স্বয়ংক্রিয় SMS পাঠানো হবে:
            </p>

            <div className="space-y-3 pt-2">
              {[
                { 
                  key: 'late', 
                  label: 'দেরিতে উপস্থিতি (Late Entry)', 
                  desc: 'নির্ধারিত সময়ের (সকাল ০৬:৩০) পর প্রবেশ করলে তাৎক্ষণিক SMS' 
                },
                { 
                  key: 'absent', 
                  label: 'দৈনিক অনুপস্থিতি (Absent Today)', 
                  desc: 'নির্দিষ্ট দিনে কোন পাঞ্চ না থাকলে অনুপস্থিতি বিজ্ঞপ্তি' 
                },
                { 
                  key: 'warning2Days', 
                  label: 'টানা ২ দিন অনুপস্থিতি সতর্কতা (Warning SMS)', 
                  desc: 'টানা ২ দিন অনুপস্থিত থাকলে অভিভাবককে সতর্কবার্তা প্রদান' 
                },
                { 
                  key: 'cancellation3Days', 
                  label: 'টানা ৩+ দিন সাময়িক ভর্তি বাতিল অ্যালার্ট', 
                  desc: 'টানা ৩ দিন অনুপস্থিতিতে সাময়িক ভর্তি বাতিল সতর্কবার্তা প্রদান' 
                },
                { 
                  key: 'missingExit', 
                  label: 'প্রস্থান পাঞ্চ অনুপস্থিত (Missing Exit Alert)', 
                  desc: 'মাদ্রাসা ছুটির সময় প্রস্থান পাঞ্চ না থাকলে জানানো' 
                },
              ].map(item => {
                const isChecked = (settings.messaging.rules as any)[item.key];
                return (
                  <div 
                    key={item.key}
                    onClick={() => {
                      const updated = {
                        ...settings,
                        messaging: {
                          ...settings.messaging,
                          rules: {
                            ...settings.messaging.rules,
                            [item.key]: !isChecked,
                          }
                        }
                      };
                      handleSaveSettings(updated);
                    }}
                    className={cn(
                      "p-3.5 rounded-xl border flex items-start justify-between cursor-pointer transition-all",
                      isChecked 
                        ? "bg-teal-500/5 border-teal-500/30" 
                        : "bg-[var(--color-bg)] border-[var(--color-border-main)] opacity-70"
                    )}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs md:text-sm text-[var(--color-text-main)]">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-light)]">
                        {item.desc}
                      </div>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0 mt-0.5",
                      isChecked ? "bg-teal-600" : "bg-gray-300 dark:bg-gray-700"
                    )}>
                      {isChecked && <Check size={13} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category-based triggers */}
          <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[var(--color-text-main)] flex items-center gap-2">
              <Users className="text-amber-600" size={18} />
              ক্যাটাগরি ভিত্তিক এন্ট্রি ও এক্সিট SMS
            </h3>
            <p className="text-xs text-[var(--color-text-light)]">
              আবাসিক এবং অনাবাসিক শিক্ষার্থীদের আলাদা শিডিউল অনুযায়ী রুল কনফিগারেশন:
            </p>

            {/* Residential */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
              <div className="font-bold text-xs text-amber-700 dark:text-amber-400">
                আবাসিক শিক্ষার্থী রুলস:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'lunchExit', label: 'দুপুরের খাবার এক্সিট' },
                  { key: 'lunchReturn', label: 'দুপুর ফেরত এন্ট্রি' },
                  { key: 'nightExit', label: 'রাতের প্রস্থান (Night Exit)' },
                  { key: 'entry', label: 'সকাল এন্ট্রি (Morning Entry)' },
                ].map(r => {
                  const active = (settings.messaging.rules.residentialRules as any)[r.key];
                  return (
                    <button
                      key={r.key}
                      onClick={() => {
                        const updated = {
                          ...settings,
                          messaging: {
                            ...settings.messaging,
                            rules: {
                              ...settings.messaging.rules,
                              residentialRules: {
                                ...settings.messaging.rules.residentialRules,
                                [r.key]: !active,
                              }
                            }
                          }
                        };
                        handleSaveSettings(updated);
                      }}
                      className={cn(
                        "p-2 rounded-lg border text-left font-medium flex items-center justify-between transition-all",
                        active ? "bg-[var(--color-card)] border-amber-500/40 text-amber-900 dark:text-amber-300 shadow-2xs" : "bg-transparent border-transparent opacity-60 text-[var(--color-text-main)]"
                      )}
                    >
                      <span>{r.label}</span>
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", active ? "bg-amber-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300")}>
                        {active ? "ON" : "OFF"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Non-Residential */}
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
              <div className="font-bold text-xs text-blue-700 dark:text-blue-400">
                অনাবাসিক শিক্ষার্থী রুলস:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'entry', label: 'সকালে মাদ্রাসা প্রবেশ (In)' },
                  { key: 'exit', label: 'ছুটিতে মাদ্রাসা প্রস্থান (Out)' },
                ].map(r => {
                  const active = (settings.messaging.rules.nonResidentialRules as any)[r.key];
                  return (
                    <button
                      key={r.key}
                      onClick={() => {
                        const updated = {
                          ...settings,
                          messaging: {
                            ...settings.messaging,
                            rules: {
                              ...settings.messaging.rules,
                              nonResidentialRules: {
                                ...settings.messaging.rules.nonResidentialRules,
                                [r.key]: !active,
                              }
                            }
                          }
                        };
                        handleSaveSettings(updated);
                      }}
                      className={cn(
                        "p-2 rounded-lg border text-left font-medium flex items-center justify-between transition-all",
                        active ? "bg-[var(--color-card)] border-blue-500/40 text-blue-900 dark:text-blue-300 shadow-2xs" : "bg-transparent border-transparent opacity-60 text-[var(--color-text-main)]"
                      )}
                    >
                      <span>{r.label}</span>
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", active ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300")}>
                        {active ? "ON" : "OFF"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Message Templates & Live Preview */}
      {activeSubTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Template Selector & Editor */}
          <div className="lg:col-span-7 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[var(--color-text-main)] flex items-center gap-2">
              <FileText className="text-teal-600" size={18} />
              মেসেজ টেমপ্লেট পরিবর্তন
            </h3>

            {/* Template key pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'late', label: 'দেরিতে উপস্থিত' },
                { key: 'absent', label: 'অনুপস্থিত' },
                { key: 'warning2Days', label: '২ দিন অনুপস্থিত সতর্কতা' },
                { key: 'cancellation3Days', label: '৩ দিন সাময়িক বাতিল' },
                { key: 'entry', label: 'প্রবেশ (Entry)' },
                { key: 'exit', label: 'প্রস্থান (Exit)' },
                { key: 'missingExit', label: 'প্রস্থান মিসিং' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setSelectedTemplateKey(t.key as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    selectedTemplateKey === t.key
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-[var(--color-bg)] hover:bg-[var(--color-border-main)] text-[var(--color-text-main)]"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--color-text-main)] flex items-center justify-between">
                <span>টেমপ্লেট টেক্সট:</span>
                <span className="text-[10px] text-[var(--color-text-light)]">
                  দৈর্ঘ্য: {settings.messaging.templates[selectedTemplateKey]?.length || 0} অক্ষর
                </span>
              </label>
              <textarea
                rows={5}
                value={settings.messaging.templates[selectedTemplateKey]}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = {
                    ...settings,
                    messaging: {
                      ...settings.messaging,
                      templates: {
                        ...settings.messaging.templates,
                        [selectedTemplateKey]: val,
                      }
                    }
                  };
                  setSettings(updated);
                }}
                className="w-full p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs md:text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            {/* Placeholder list */}
            <div className="p-3.5 rounded-xl bg-teal-500/5 border border-teal-500/20 space-y-2">
              <div className="text-[11px] font-bold text-teal-800 dark:text-teal-300">
                উপলব্ধ প্লেসহোল্ডার ট্যাগসমূহ (ক্লিক করে ইনসার্ট করুন):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '{student_name}',
                  '{guardian_name}',
                  '{date}',
                  '{time}',
                  '{entry_time}',
                  '{exit_time}',
                  '{late_minutes}',
                  '{absence_days}',
                  '{class}',
                  '{jamat}',
                  '{category}',
                ].map(ph => (
                  <button
                    key={ph}
                    type="button"
                    onClick={() => {
                      const cur = settings.messaging.templates[selectedTemplateKey];
                      const updated = {
                        ...settings,
                        messaging: {
                          ...settings.messaging,
                          templates: {
                            ...settings.messaging.templates,
                            [selectedTemplateKey]: `${cur} ${ph}`,
                          }
                        }
                      };
                      setSettings(updated);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--color-card)] border border-teal-500/30 text-[10px] font-mono font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 shadow-2xs"
                  >
                    {ph}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleSaveSettings(settings)}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              টেমপ্লেট সেভ করুন
            </button>
          </div>

          {/* Live Mobile SMS Preview */}
          <div className="lg:col-span-5 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[var(--color-text-main)] flex items-center gap-2">
              <Phone className="text-emerald-600" size={18} />
              অভিভাবকের মোবাইলে লাইভ প্রিভিউ
            </h3>

            {/* Student selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--color-text-light)]">নমুনা শিক্ষার্থী নির্বাচন:</label>
              <select
                value={testStudentId}
                onChange={(e) => setTestStudentId(e.target.value)}
                className="w-full p-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-medium"
              >
                {students.slice(0, 15).map(s => (
                  <option key={s.id} value={String(s.id)}>
                    {s['শিক্ষার্থীর নাম'] || s.name} ({s['জামাত/শ্রেণী'] || s.class})
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Mockup */}
            <div className="max-w-[280px] mx-auto p-3 rounded-3xl bg-slate-900 border-4 border-slate-700 shadow-xl space-y-2">
              <div className="w-16 h-2 bg-slate-700 rounded-full mx-auto" />
              <div className="bg-slate-800 p-2 rounded-xl text-[10px] text-center text-slate-300 font-mono">
                {settings.messaging.senderId || 'ALMADANIA'}
              </div>
              <div className="p-3 rounded-2xl bg-teal-800/80 text-white text-xs font-medium space-y-1 shadow">
                <div>{getTemplatePreview(settings.messaging.templates[selectedTemplateKey])}</div>
                <div className="text-[9px] text-teal-200 text-right">এখনই • প্রেরিত</div>
              </div>
            </div>

            {/* Test Send Button */}
            <button
              onClick={handleSendTestSMS}
              disabled={isSendingTest}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Send size={14} />
              <span>{isSendingTest ? "পাঠানো হচ্ছে..." : "একটি টেস্ট SMS পাঠান"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Message Delivery History / Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="font-bold text-base text-[var(--color-text-main)] flex items-center gap-2">
              <Clock className="text-teal-600" size={18} />
              স্বয়ংক্রিয় প্রেরিত SMS লগ খতিয়ান ({enToBnNumber(filteredLogs.length)}টি)
            </h3>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="নাম/মোবাইল/টেক্সট খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-medium"
                />
              </div>

              <select
                value={selectedEventFilter}
                onChange={(e) => setSelectedEventFilter(e.target.value)}
                className="p-1.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-medium"
              >
                <option value="all">সকল ইভেন্ট</option>
                <option value="late">দেরিতে উপস্থিত</option>
                <option value="absent">অনুপস্থিত</option>
                <option value="warning2Days">২ দিন সতর্কতা</option>
                <option value="cancellation3Days">৩ দিন বাতিল</option>
                <option value="entry">প্রবেশ</option>
                <option value="exit">প্রস্থান</option>
                <option value="manual_notice">সরাসরি টেস্ট</option>
              </select>

              {logs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/30 text-xs font-bold transition-all"
                  title="সকল ডামি ও পূর্বের লগ মুছে ফেলুন"
                >
                  লগ মুছুন
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border border-[var(--color-border-main)] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border-main)] font-bold text-[var(--color-text-main)]">
                  <th className="p-3">তারিখ ও সময়</th>
                  <th className="p-3">শিক্ষার্থী ও অভিভাবক</th>
                  <th className="p-3">মোবাইল নম্বর</th>
                  <th className="p-3">ইভেন্ট টাইপ</th>
                  <th className="p-3">মেসেজের বিবরণ</th>
                  <th className="p-3">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-main)]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-[var(--color-text-light)]">
                      কোন প্রেরিত মেসেজ রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[var(--color-bg)]/50 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-[var(--color-text-light)] whitespace-nowrap">
                        {log.sentTime ? log.sentTime.replace('T', ' ').slice(0, 19) : ''}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[var(--color-text-main)]">{log.studentName}</div>
                        <div className="text-[10px] text-[var(--color-text-light)]">অভিভাবক: {log.guardianName}</div>
                      </td>
                      <td className="p-3 font-mono text-xs font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                        {log.phone}
                      </td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap",
                          log.event === 'late' && "bg-amber-500/10 text-amber-600",
                          log.event === 'absent' && "bg-rose-500/10 text-rose-600",
                          log.event === 'warning2Days' && "bg-orange-500/10 text-orange-600",
                          log.event === 'cancellation3Days' && "bg-red-600 text-white",
                          (log.event === 'entry' || log.event === 'exit') && "bg-teal-500/10 text-teal-600",
                          log.event === 'manual_notice' && "bg-indigo-500/10 text-indigo-600"
                        )}>
                          {log.event === 'late' ? 'দেরিতে উপস্থিত' : log.event === 'absent' ? 'অনুপস্থিত' : log.event === 'warning2Days' ? '২ দিন সতর্কতা' : log.event === 'cancellation3Days' ? 'সাময়িক বাতিল' : log.event === 'manual_notice' ? 'সরাসরি টেস্ট' : log.event}
                        </span>
                      </td>
                      <td className="p-3 max-w-md text-xs text-[var(--color-text-main)] leading-relaxed">
                        {log.content}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {log.deliveryStatus === 'delivered' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 size={11} />
                            ডেলিভার্ড
                          </span>
                        ) : log.deliveryStatus === 'failed' ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <AlertCircle size={11} />
                            ব্যর্থ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <Clock size={11} />
                            প্রেরিত
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

      {/* Tab 4: Individual Student Custom Overrides */}
      {activeSubTab === 'students' && (
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-[var(--color-text-main)] flex items-center gap-2">
                <Users className="text-teal-600" size={18} />
                ব্যক্তিগত শিক্ষার্থী ভিত্তিক SMS কন্ট্রোল
              </h3>
              <p className="text-xs text-[var(--color-text-light)] mt-1">
                কোন নির্দিষ্ট শিক্ষার্থীর জন্য সকল SMS বন্ধ রাখা বা বিশেষ ইভেন্ট চালু রাখতে এই তালিকা ব্যবহার করুন:
              </p>
            </div>

            {/* Student Search Field */}
            <div className="relative w-full sm:w-72 shrink-0">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="শিক্ষার্থী খুঁজুন (নাম, আইডি, রোল)..."
                value={searchStudentTerm}
                onChange={(e) => setSearchStudentTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-semibold outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-[var(--color-border-main)] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border-main)] font-bold text-[var(--color-text-main)]">
                  <th className="p-3">শিক্ষার্থীর নাম</th>
                  <th className="p-3">আইডি / রোল</th>
                  <th className="p-3">জামাত</th>
                  <th className="p-3">ক্যাটাগরি</th>
                  <th className="p-3">অভিভাবকের মোবাইল</th>
                  <th className="p-3 text-right">SMS স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-main)]">
                {filteredStudentsForOverrides.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-[var(--color-text-light)]">
                      কোন শিক্ষার্থী পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredStudentsForOverrides.slice(0, 100).map(student => {
                    const sId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর']);
                    const isBlocked = settings.messaging.individualStudentOverrides[sId]?.enabled === false;
                    return (
                      <tr key={sId} className="hover:bg-[var(--color-bg)]/50">
                        <td className="p-3 font-bold text-[var(--color-text-main)]">
                          {student['শিক্ষার্থীর নাম'] || student.name}
                        </td>
                        <td className="p-3 font-mono">{student['রোল নম্বর'] || student.roll || sId}</td>
                        <td className="p-3">{student['জামাত/শ্রেণী'] || student.class}</td>
                        <td className="p-3">{student.category || 'অনাবাসিক'}</td>
                        <td className="p-3 font-mono">{student['মোবাইল (বাবা/ভাই)'] || student.mobile || '—'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              const current = settings.messaging.individualStudentOverrides[sId] || { enabled: true };
                              const updated = {
                                ...settings,
                                messaging: {
                                  ...settings.messaging,
                                  individualStudentOverrides: {
                                    ...settings.messaging.individualStudentOverrides,
                                    [sId]: { ...current, enabled: !current.enabled },
                                  }
                                }
                              };
                              handleSaveSettings(updated);
                            }}
                            className={cn(
                              "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                              isBlocked ? "bg-rose-500/10 text-rose-600 border border-rose-500/30" : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                            )}
                          >
                            {isBlocked ? "SMS বন্ধ আছে" : "SMS সক্রিয়"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: SMS Gateway / Provider Config */}
      {activeSubTab === 'gateway' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Config */}
          <div className="lg:col-span-7 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[var(--color-text-main)] flex items-center gap-2">
                <Settings className="text-teal-600" size={18} />
                BulkSMSBD গেটওয়ে কনফিগারেশন
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[10px] font-bold">
                API Live
              </span>
            </div>
            
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-[var(--color-text-main)] block mb-1">
                  SMS প্রোভাইডার:
                </label>
                <select
                  value={settings.messaging.smsProvider}
                  onChange={(e) => {
                    const updated = {
                      ...settings,
                      messaging: {
                        ...settings.messaging,
                        smsProvider: e.target.value as any,
                      }
                    };
                    setSettings(updated);
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-medium"
                >
                  <option value="bulk_sms_bd">BulkSMSBD Gateway (সংযুক্ত ও সক্রিয়)</option>
                  <option value="sms_net_bd">SMS.NET.BD Gateway (Legacy)</option>
                  <option value="greenweb">Greenweb SMS Gateway Bangladesh</option>
                  <option value="custom_api">কাস্টম HTTP API গেটওয়ে</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--color-text-main)] block mb-1">
                  API Key / Token:
                </label>
                <input
                  type="text"
                  value={settings.messaging.providerApiKey || ''}
                  onChange={(e) => {
                    const updated = {
                      ...settings,
                      messaging: {
                        ...settings.messaging,
                        providerApiKey: e.target.value,
                      }
                    };
                    setSettings(updated);
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-mono font-medium"
                  placeholder="s3qQPmfL2bcBmt03K26v"
                />
                <p className="text-[11px] text-[var(--color-text-light)] mt-1">
                  আপনার BulkSMSBD অ্যাকাউন্ট এপিআই কী।
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--color-text-main)] block mb-1">
                  অনুমোদিত Sender ID / মাস্কিং:
                </label>
                <input
                  type="text"
                  value={settings.messaging.senderId || ''}
                  onChange={(e) => {
                    const updated = {
                      ...settings,
                      messaging: {
                        ...settings.messaging,
                        senderId: e.target.value,
                      }
                    };
                    setSettings(updated);
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-medium"
                  placeholder="8809648910612"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleSaveSettings(settings)}
                  className="flex-1 py-2.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Check size={14} />
                  <span>গেটওয়ে সেটিংস সংরক্ষণ করুন</span>
                </button>

                <button
                  onClick={() => fetchBalance(settings.messaging.providerApiKey)}
                  disabled={isLoadingBalance}
                  className="py-2.5 px-4 rounded-xl bg-[var(--color-bg)] hover:bg-[var(--color-border-main)] text-[var(--color-text-main)] border border-[var(--color-border-main)] text-xs font-bold transition-all flex items-center gap-2"
                >
                  <RefreshCw size={14} className={isLoadingBalance ? "animate-spin" : ""} />
                  <span>ব্যালেন্স চেক</span>
                </button>
              </div>

              {/* Data Cleanup */}
              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 mt-4 space-y-2">
                <div className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  ডামি ও টেস্ট ডাটা পরিচ্ছন্নকরণ
                </div>
                <p className="text-[11px] text-[var(--color-text-light)]">
                  পূর্বে ব্যবহৃত যে কোনো ডামি মেসেজ লগ অথবা টেস্ট মেসেজ ডাটা মুছে ফেলতে নিচের বাটন চাপুন।
                </p>
                <button
                  onClick={handleClearLogs}
                  className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
                >
                  সকল SMS মেসেজ লগ মুছুন
                </button>
              </div>
            </div>
          </div>

          {/* Balance & Direct SMS Sender */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Balance Card */}
            <div className="bg-gradient-to-br from-teal-700 to-emerald-800 text-white rounded-2xl p-6 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-100 uppercase tracking-wider">BulkSMSBD লাইভ একাউন্ট</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">সক্রিয় গেটওয়ে</span>
              </div>

              <div className="py-2">
                <div className="text-2xl md:text-3xl font-black font-mono">
                  {isLoadingBalance ? (
                    <span className="text-sm">ব্যালেন্স লোড হচ্ছে...</span>
                  ) : smsBalance && (smsBalance.error === 0 || smsBalance.balance !== undefined) ? (
                    `${smsBalance.balance} BDT`
                  ) : (
                    "ব্যালেন্স সংযুক্ত"
                  )}
                </div>
                <div className="text-xs text-teal-100 mt-1">
                  ইউজার/স্ট্যাটাস: {smsBalance?.user || 'BulkSMSBD Client'}
                </div>
              </div>

              <button
                onClick={() => fetchBalance()}
                disabled={isLoadingBalance}
                className="w-full py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={isLoadingBalance ? "animate-spin" : ""} />
                <span>তাত্ক্ষণিক ব্যালেন্স রিফ্রেশ</span>
              </button>
            </div>

            {/* Direct Instant SMS Tester */}
            <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-main)] p-6 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-[var(--color-text-main)] flex items-center gap-2">
                <Send className="text-teal-600" size={16} />
                যেকোনো নম্বরে সরাসরি টেস্ট SMS পাঠান
              </h4>
              <p className="text-[11px] text-[var(--color-text-light)]">
                সরাসরি SMS ডেলিভারি পরীক্ষা করার জন্য যেকোনো বাংলাদেশি নম্বর লিখুন:
              </p>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="মোবাইল নম্বর (যেমন: 01712345678)"
                  value={customTestPhone}
                  onChange={(e) => setCustomTestPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-mono font-medium"
                />

                <textarea
                  rows={3}
                  placeholder="মেসেজের বিবরণ লিখুন..."
                  value={customTestMsg}
                  onChange={(e) => setCustomTestMsg(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-main)] text-xs font-medium"
                />

                <button
                  onClick={handleSendCustomDirectSMS}
                  disabled={isSendingCustomTest}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Send size={14} />
                  <span>{isSendingCustomTest ? "SMS পাঠানো হচ্ছে..." : "এখনই SMS পাঠান"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
