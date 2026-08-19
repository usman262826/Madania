import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  GraduationCap, 
  ArrowLeft, 
  IdCard, 
  Phone, 
  FileText, 
  Users, 
  MapPin, 
  Hash, 
  Bookmark, 
  Shield, 
  Mail, 
  Heart, 
  ExternalLink, 
  QrCode, 
  Clock, 
  Compass, 
  Award, 
  CheckCircle2, 
  MessageSquare, 
  Copy, 
  Edit,
  Printer,
  Download,
  Share2,
  MoreVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Student } from '../../types';
import { StudentQuickActions } from './StudentQuickActions';

// Helper to convert English digits to Bengali digits
const enToBnNumber = (str: string): string => {
  if (!str) return '—';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.toString().replace(/[0-9]/g, (meta) => bnDigits[parseInt(meta)]);
};

// Helper to format date as dd/mm/yyyy
const formatDateToDDMMYYYY = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  } catch (e) {
    return dateStr;
  }
};

interface StudentMobileProfileProps {
  student: Student;
  selectedClass: string;
  onStartEdit: () => void;
  onBack: () => void;
  printProfile: () => void;
  handleShare: () => void;
}

export const StudentMobileProfile: React.FC<StudentMobileProfileProps> = ({
  student,
  selectedClass,
  onStartEdit,
  onBack,
  printProfile,
  handleShare
}) => {
  // Mobile Accordion state
  const [mobileSections, setMobileSections] = useState<Record<string, boolean>>({
    basic: true,
    personal: false,
    guardian: false,
    academic: false,
    financial: false,
    other: false,
  });
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<'long' | 'short' | null>(null);

  const toggleMobileSection = (sec: string) => {
    setMobileSections(prev => ({
      ...prev,
      [sec]: !prev[sec]
    }));
  };

  const handleToggleAll = (expand: boolean) => {
    setMobileSections({
      basic: expand,
      personal: expand,
      guardian: expand,
      academic: expand,
      financial: expand,
      other: expand,
    });
  };

  const isAllExpanded = Object.values(mobileSections).every(v => v);

  // Calculate age
  let ageStr = '—';
  if (student['জন্ম তারিখ'] || student.dob) {
    try {
      const bDate = new Date(student['জন্ম তারিখ'] || student.dob || '');
      if (!isNaN(bDate.getTime())) {
        const diffMs = Date.now() - bDate.getTime();
        const ageDate = new Date(diffMs);
        const ageY = Math.abs(ageDate.getUTCFullYear() - 1970);
        ageStr = enToBnNumber(ageY.toString()) + ' বছর';
      }
    } catch (e) {}
  }

  const idNum = student['রেজিস্ট্রেশন/আইডি'] || student['রেজিস্ট্রেশন/আইডি নম্বর'] || student.id || '—';
  const rollNum = student['রোল নম্বর'] || student.roll || '—';
  const father = student['পিতার নাম'] || student.fatherName || '—';
  const mother = student['মাতার নাম'] || student.motherName || '—';
  const dobStr = formatDateToDDMMYYYY(student['জন্ম তারিখ'] || student.dob || '');
  const mobile1 = student['মোবাইল (মা)'] || student.mobile || '—';
  const mobile2 = student['মোবাইল (বাবা/ভাই)'] || student.altMobile || '—';
  const addressStr = student['ঠিকানা'] || student['গ্রাম/মহল্লা'] || '—';
  const blood = student['রক্তের গ্রুপ'] || student.bloodGroup || '—';
  const yearStr = student['শিক্ষাবর্ষ'] || student.academicYearLabel || '—';
  const typeStr = student['শিক্ষার্থী ধরণ'] || student.studentType || 'নতুন';
  const statusStr = student['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || student['স্ট্যাটাস'] || 'অধ্যয়নরত (সক্রিয়)';
  const prevM = student['পূর্বের মাদ্রাসা'] || student.prevMadrasa || '—';
  const birthRegNum = student['জন্ম নিবন্ধন নাম্বার'] || student['জন্ম নিবন্ধন/NID নং'] || student.birthReg || '—';
  const emailStr = student['ইমেইল'] || student.email || 'নেই';

  const attendancePercent = "৯৫%";
  const totalAttendanceDays = "২৪০ দিন";
  const totalAbsentDays = "১০ দিন";

  const feeStatus = "পরিশোধিত";
  const dueAmount = "০/- টাকা";
  const lastPaid = "১,৫০০/- টাকা";
  const totalPaid = "৮,৫০০/- টাকা";

  const qrImageUrl = (student['QR CODE'] && student['QR CODE'].toString().startsWith('http')) 
    ? student['QR CODE'] 
    : (student['QR CODE IMAGE'] || '');

  const longUrl = student['LONG URL'] || student['long_url'] || student['ভেরিফিকেশন লিংক'];
  const shortUrl = student['SORT URL'] || student['sort_url'] || student['Short URL'];

  // Detail item for mobile cards
  const MobileItem = ({ icon: Icon, label, value, highlight, copyable, tel }: any) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(value.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {}
    };

    return (
      <div className="flex items-center justify-between py-3 border-b border-border-main/40 last:border-0 font-hind-siliguri">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0 mt-0.5">
            {Icon}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-text-light/50 font-bold block leading-none mb-1">{label}</span>
            {tel && value !== '—' ? (
              <a href={`tel:${value}`} className="text-xs font-bold text-primary hover:underline block truncate">
                {value}
              </a>
            ) : (
              <span className={`text-xs font-bold block truncate ${highlight ? 'text-primary' : 'text-text-main'}`}>
                {value}
              </span>
            )}
          </div>
        </div>
        {copyable && value && value !== '—' && (
          <button
            type="button"
            onClick={handleCopy}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              copied ? 'bg-success text-white scale-105' : 'bg-step-bg text-text-light/60 hover:text-text-main'
            }`}
          >
            {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4 pb-24 font-hind-siliguri text-left">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-3 py-2 bg-card border border-border-main rounded-xl text-xs font-bold text-text-main"
        >
          <ArrowLeft size={14} /> তালিকায় ফিরুন
        </button>
        <span className="px-3 py-1.5 bg-success/10 text-success border border-success/20 rounded-full text-[10px] font-black uppercase tracking-wider">
          {statusStr}
        </span>
      </div>

      {/* Identity Card Widget */}
      <div className="bg-card border border-border-main/60 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-primary-light/5 rounded-full -ml-8 -mb-8 blur-xl" />

        <div className="relative shrink-0 mb-4">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary-light rounded-2xl blur opacity-30" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary/10 to-primary/5 p-1 ring-4 ring-bg shadow-md flex items-center justify-center">
            <div className="w-full h-full rounded-xl bg-card flex items-center justify-center text-primary border border-primary/20">
              <User className="size-10 text-primary" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-success text-white p-1 rounded-full ring-2 ring-card shadow-md flex items-center justify-center">
            <CheckCircle2 className="size-3" />
          </div>
        </div>

        <h3 className="text-lg font-black text-text-main leading-tight mb-1">{student['শিক্ষার্থীর নাম'] || student.name}</h3>
        <p className="text-xs font-bold text-text-light/60 flex items-center gap-1 justify-center mb-4">
          <GraduationCap size={14} className="text-primary" />
          <span>{selectedClass}</span>
        </p>

        <div className="flex gap-2 w-full">
          <div className="flex-1 py-2 bg-primary/5 border border-primary/10 rounded-xl flex flex-col items-center">
            <span className="text-[8px] uppercase font-black text-primary/60 mb-0.5">রোল নম্বর</span>
            <span className="text-xs font-black text-primary">{enToBnNumber(rollNum.toString())}</span>
          </div>
          <div className="flex-1 py-2 bg-step-bg border border-border-main rounded-xl flex flex-col items-center">
            <span className="text-[8px] uppercase font-black text-text-light/50 mb-0.5">রেজিস্ট্রেশন</span>
            <span className="text-xs font-black text-text-main">{enToBnNumber(idNum.toString())}</span>
          </div>
        </div>
      </div>
      
      {/* Quick Actions Component */}
      <StudentQuickActions student={student} printProfile={printProfile} handleShare={handleShare} />

      {/* Accordion Control Bar */}
      <div className="flex justify-end pr-1">
        <button
          type="button"
          onClick={() => handleToggleAll(!isAllExpanded)}
          className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
        >
          {isAllExpanded ? 'সবগুলো গুটিয়ে নিন' : 'সবগুলো মেলুন'}
        </button>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {/* Section 1: Basic Info */}
        <div className="bg-card border border-border-main/50 rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => toggleMobileSection('basic')}
            className="w-full flex items-center justify-between p-4 bg-step-bg/20 hover:bg-step-bg/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2 text-text-main font-bold text-xs">
              <User size={16} className="text-primary" />
              <span>১. শিক্ষার্থীর মৌলিক তথ্য</span>
            </div>
            {mobileSections.basic ? <ChevronUp size={16} className="text-text-light" /> : <ChevronDown size={16} className="text-text-light" />}
          </button>
          <AnimatePresence initial={false}>
            {mobileSections.basic && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border-main/40 px-4 py-2 bg-card"
              >
                <MobileItem icon={<User size={14} />} label="শিক্ষার্থীর নাম" value={student['শিক্ষার্থীর নাম'] || student.name} />
                <MobileItem icon={<IdCard size={14} />} label="রেজিস্ট্রেশন/আইডি নম্বর" value={enToBnNumber(idNum.toString())} copyable />
                <MobileItem icon={<Hash size={14} />} label="রোল নম্বর" value={enToBnNumber(rollNum.toString())} />
                <MobileItem icon={<GraduationCap size={14} />} label="জামাত/শ্রেণী" value={selectedClass} />
                <MobileItem icon={<Bookmark size={14} />} label="শিক্ষাবর্ষ" value={enToBnNumber(yearStr.toString())} />
                <MobileItem icon={<Compass size={14} />} label="শিক্ষার্থী ধরণ" value={typeStr} />
                <MobileItem icon={<Shield size={14} />} label="বর্তমান স্ট্যাটাস" value={statusStr} highlight />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 2: Personal Info */}
        <div className="bg-card border border-border-main/50 rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => toggleMobileSection('personal')}
            className="w-full flex items-center justify-between p-4 bg-step-bg/20 hover:bg-step-bg/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2 text-text-main font-bold text-xs">
              <IdCard size={16} className="text-primary" />
              <span>২. ব্যক্তিগত তথ্য</span>
            </div>
            {mobileSections.personal ? <ChevronUp size={16} className="text-text-light" /> : <ChevronDown size={16} className="text-text-light" />}
          </button>
          <AnimatePresence initial={false}>
            {mobileSections.personal && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border-main/40 px-4 py-2 bg-card"
              >
                <MobileItem icon={<Clock size={14} />} label="জন্ম তারিখ" value={enToBnNumber(dobStr)} />
                <MobileItem icon={<User size={14} />} label="বয়স (আনুমানিক)" value={ageStr} />
                <MobileItem icon={<Heart size={14} />} label="রক্তের গ্রুপ" value={blood} />
                <MobileItem icon={<Compass size={14} />} label="জাতীয়তা" value="বাংলাদেশী" />
                <MobileItem icon={<IdCard size={14} />} label="জন্ম নিবন্ধন নং" value={enToBnNumber(birthRegNum.toString())} copyable />
                <MobileItem icon={<Mail size={14} />} label="ইমেইল ঠিকানা" value={emailStr} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 3: Guardian Info */}
        <div className="bg-card border border-border-main/50 rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => toggleMobileSection('guardian')}
            className="w-full flex items-center justify-between p-4 bg-step-bg/20 hover:bg-step-bg/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2 text-text-main font-bold text-xs">
              <Users size={16} className="text-primary" />
              <span>৩. অভিভাবকের তথ্য</span>
            </div>
            {mobileSections.guardian ? <ChevronUp size={16} className="text-text-light" /> : <ChevronDown size={16} className="text-text-light" />}
          </button>
          <AnimatePresence initial={false}>
            {mobileSections.guardian && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border-main/40 px-4 py-2 bg-card"
              >
                <MobileItem icon={<Users size={14} />} label="পিতার নাম" value={father} />
                <MobileItem icon={<Users size={14} />} label="মাতার নাম" value={mother} />
                <MobileItem icon={<User size={14} />} label="অভিভাবক" value={father} />
                <MobileItem icon={<Phone size={14} />} label="মোবাইল (মা)" value={enToBnNumber(mobile1.toString())} copyable tel />
                <MobileItem icon={<Phone size={14} />} label="মোবাইল (বিকল্প)" value={enToBnNumber(mobile2.toString())} copyable tel />
                <MobileItem icon={<MapPin size={14} />} label="ঠিকানা" value={addressStr} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 4: Academic Info */}
        <div className="bg-card border border-border-main/50 rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => toggleMobileSection('academic')}
            className="w-full flex items-center justify-between p-4 bg-step-bg/20 hover:bg-step-bg/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2 text-text-main font-bold text-xs">
              <GraduationCap size={16} className="text-primary" />
              <span>৪. একাডেমিক তথ্য ও খতিয়ান</span>
            </div>
            {mobileSections.academic ? <ChevronUp size={16} className="text-text-light" /> : <ChevronDown size={16} className="text-text-light" />}
          </button>
          <AnimatePresence initial={false}>
            {mobileSections.academic && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border-main/40 px-4 py-2 bg-card"
              >
                <MobileItem icon={<Clock size={14} />} label="ভর্তি তারিখ" value="০১/০১/২০২৪" />
                <MobileItem icon={<Compass size={14} />} label="পূর্ববর্তী মাদ্রাসা" value={prevM} />
                <MobileItem icon={<CheckCircle2 size={14} />} label="মোট উপস্থিতি" value={enToBnNumber(totalAttendanceDays)} />
                <MobileItem icon={<Shield size={14} />} label="মোট অনুপস্থিতি" value={enToBnNumber(totalAbsentDays)} />
                <MobileItem icon={<Award size={14} />} label="উপস্থিতির হার" value={enToBnNumber(attendancePercent)} highlight />
                <MobileItem icon={<Award size={14} />} label="পূর্ববর্তী ফলাফল" value="উত্তীর্ণ (সমমান)" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 5: Financial Info */}
        <div className="bg-card border border-border-main/50 rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => toggleMobileSection('financial')}
            className="w-full flex items-center justify-between p-4 bg-step-bg/20 hover:bg-step-bg/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2 text-text-main font-bold text-xs">
              <FileText size={16} className="text-primary" />
              <span>৫. আর্থিক বিবরণী সংক্ষেপ</span>
            </div>
            {mobileSections.financial ? <ChevronUp size={16} className="text-text-light" /> : <ChevronDown size={16} className="text-text-light" />}
          </button>
          <AnimatePresence initial={false}>
            {mobileSections.financial && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border-main/40 px-4 py-2 bg-card"
              >
                <MobileItem icon={<FileText size={14} />} label="ফি পরিশোধ অবস্থা" value={feeStatus} highlight />
                <MobileItem icon={<Award size={14} />} label="মোট পরিশোধিত ফি" value={enToBnNumber(totalPaid)} />
                <MobileItem icon={<Clock size={14} />} label="সর্বশেষ পরিশোধ" value={enToBnNumber(lastPaid)} />
                <MobileItem icon={<Shield size={14} />} label="সর্বমোট বকেয়া" value={enToBnNumber(dueAmount)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 6: Digital & Others */}
        <div className="bg-card border border-border-main/50 rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => toggleMobileSection('other')}
            className="w-full flex items-center justify-between p-4 bg-step-bg/20 hover:bg-step-bg/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2 text-text-main font-bold text-xs">
              <QrCode size={16} className="text-primary" />
              <span>৬. অন্যান্য তথ্য ও ভেরিফিকেশন</span>
            </div>
            {mobileSections.other ? <ChevronUp size={16} className="text-text-light" /> : <ChevronDown size={16} className="text-text-light" />}
          </button>
          <AnimatePresence initial={false}>
            {mobileSections.other && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border-main/40 px-4 py-3 bg-card space-y-4"
              >
                <div className="grid grid-cols-1 gap-1">
                  <MobileItem icon={<Award size={14} />} label="प्रत्यয়ন পত্র নাম্বার" value={enToBnNumber(student['प्रत्यয়ন পত্র নাম্বার']?.toString() || '')} />
                  <MobileItem icon={<Clock size={14} />} label="মঞ্জুরের তারিখ ও সময়" value={enToBnNumber(student['মঞ্জুরের তারিখ ও সময়']?.toString() || '')} />
                  <MobileItem icon={<Hash size={14} />} label="আবেদন নং" value={enToBnNumber(student['আবেদন নং']?.toString() || '')} />
                </div>

                <div className="border-t border-border-main/40 pt-4 flex flex-col items-center">
                  <p className="text-[10px] font-black uppercase text-text-light/50 tracking-widest mb-2 self-start flex items-center gap-1">
                    <QrCode size={12} className="text-primary" /> ডিজিটাল কিউআর কোড
                  </p>
                  {qrImageUrl ? (
                    <a 
                      href={qrImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-32 h-32 bg-white p-2 rounded-2xl border border-border-main flex items-center justify-center shadow-md relative"
                    >
                      <img 
                        src={qrImageUrl} 
                        alt="QR Code" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </a>
                  ) : (
                    <div className="w-32 h-32 bg-step-bg rounded-2xl border-2 border-dashed border-border-main flex flex-col items-center justify-center p-3 text-center">
                      <QrCode size={20} className="text-text-light/20 mb-1" />
                      <span className="text-[8px] font-bold text-text-light/40">ছবি লিংক পাওয়া যায়নি</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border-main/40 pt-4 space-y-2">
                  <p className="text-[10px] font-black uppercase text-text-light/50 tracking-widest flex items-center gap-1">
                    <Compass size={12} className="text-primary" /> অ্যাক্টিভ যাচাই লিংক সমূহ
                  </p>
                  {longUrl && (
                    <div className="flex items-center gap-2">
                      <a 
                        href={longUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-between p-2 bg-primary/5 border border-primary/20 text-primary text-[10px] font-black rounded-lg"
                      >
                        <span className="flex items-center gap-1"><FileText size={12} /> ভেরিফিকেশন পোর্টাল</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                  {shortUrl && (
                    <div className="flex items-center gap-2">
                      <a 
                        href={shortUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-between p-2 bg-step-bg border border-border-main text-text-main text-[10px] font-black rounded-lg"
                      >
                        <span className="flex items-center gap-1"><Compass size={12} /> শর্ট লিংক</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>

                <div className="border-t border-border-main/40 pt-4 text-xs font-bold text-text-light/60 space-y-2">
                  <p><span className="text-[10px] text-text-light/40 font-bold block mb-0.5">সংযুক্ত ডকুমেন্টসমূহ</span>জন্ম নিবন্ধন সনদ, ছবি ও পূর্ববর্তী মাদ্রাসার প্রশংসাপত্র</p>
                  <p><span className="text-[10px] text-text-light/40 font-bold block mb-0.5">বিশেষ মন্তব্য</span>শিক্ষার্থীর আচার-আচরণ ও পড়াশোনার প্রতি মনোযোগ অত্যন্ত প্রশংসনীয়।</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border-main/80 px-4 py-3.5 z-50 flex items-center justify-between gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          onClick={onStartEdit}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-text-main hover:text-primary transition-colors active:scale-95 duration-150"
        >
          <Edit size={18} className="text-[#0D6582]" />
          <span className="text-[9px] font-bold">সম্পাদনা</span>
        </button>
        
        <button
          type="button"
          onClick={() => printProfile(student, selectedClass || '—')}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-text-main hover:text-primary transition-colors active:scale-95 duration-150"
        >
          <Printer size={18} className="text-[#0D6582]" />
          <span className="text-[9px] font-bold">প্রিন্ট</span>
        </button>

        <button
          type="button"
          onClick={() => printProfile(student, selectedClass || '—')}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-text-main hover:text-primary transition-colors active:scale-95 duration-150"
        >
          <Download size={18} className="text-[#0D6582]" />
          <span className="text-[9px] font-bold">ডাউনলোড</span>
        </button>

        <button
          type="button"
          onClick={() => handleShare(student)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-text-main hover:text-primary transition-colors active:scale-95 duration-150"
        >
          <Share2 size={18} className="text-[#0D6582]" />
          <span className="text-[9px] font-bold">শেয়ার</span>
        </button>

        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setMoreOptionsOpen(!moreOptionsOpen)}
            className="w-full flex flex-col items-center justify-center gap-1 py-1 text-text-main hover:text-primary transition-colors active:scale-95 duration-150"
          >
            <MoreVertical size={18} className="text-[#0D6582]" />
            <span className="text-[9px] font-bold">অন্যান্য</span>
          </button>
          
          <AnimatePresence>
            {moreOptionsOpen && (
              <>
                <div className="fixed inset-0 z-45" onClick={() => setMoreOptionsOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 bottom-12 w-48 bg-card border border-border-main rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1"
                >
                  <a
                    href={`tel:${student['মোবাইল (মা)'] || student.mobile || ''}`}
                    className="flex items-center gap-2 p-2.5 hover:bg-step-bg rounded-xl text-xs font-bold text-text-main transition-colors"
                    onClick={() => setMoreOptionsOpen(false)}
                  >
                    <Phone size={14} className="text-primary" /> মা-কে কল করুন
                  </a>
                  <a
                    href={`tel:${student['মোবাইল (বাবা/ভাই)'] || student.altMobile || ''}`}
                    className="flex items-center gap-2 p-2.5 hover:bg-step-bg rounded-xl text-xs font-bold text-text-main transition-colors"
                    onClick={() => setMoreOptionsOpen(false)}
                  >
                    <Phone size={14} className="text-primary" /> বাবাকে কল করুন
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOptionsOpen(false);
                      navigator.clipboard.writeText(idNum.toString());
                      alert('আইডি নম্বর কপি করা হয়েছে!');
                    }}
                    className="w-full flex items-center gap-2 p-2.5 hover:bg-step-bg rounded-xl text-xs font-bold text-text-main text-left transition-colors cursor-pointer"
                  >
                    <Copy size={14} className="text-primary" /> আইডি কপি করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOptionsOpen(false);
                      onBack();
                    }}
                    className="w-full flex items-center gap-2 p-2.5 hover:bg-error/10 text-error rounded-xl text-xs font-bold text-left transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} /> তালিকায় ফিরে যান
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
