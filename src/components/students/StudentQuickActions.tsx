import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Share2, 
  Copy, 
  CheckCircle2, 
  FileText, 
  Award, 
  Wallet, 
  Layout, 
  MoreVertical 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const StudentQuickActions: React.FC<{
  student: any;
  printProfile?: () => void;
  handleShare?: () => void;
  className?: string;
}> = ({ student, printProfile, handleShare, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      const longUrl = student['LONG URL'] || student['long_url'] || student['ভেরিফিকেশন লিংক'] || window.location.href;
      await navigator.clipboard.writeText(longUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const downloadProfile = () => {
    alert("ডাউনলোড শুরু হচ্ছে...");
    if (printProfile) printProfile();
  };

  const navTo = (moduleName: string) => {
    alert(`"${moduleName}" মডিউলে নেভিগেট করা হচ্ছে...`);
  };

  return (
    <div className={cn("grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3 w-full", className)}>
      <ActionBtn icon={<Printer size={16} />} label="প্রিন্ট" onClick={printProfile || (() => window.print())} />
      <ActionBtn icon={<Download size={16} />} label="ডাউনলোড" onClick={downloadProfile} />
      <ActionBtn 
        icon={copied ? <CheckCircle2 size={16} className="text-success" /> : <Copy size={16} />} 
        label={copied ? "কপি হয়েছে" : "কপি"} 
        onClick={handleCopyLink} 
        active={copied}
      />
      <ActionBtn icon={<Share2 size={16} />} label="শেয়ার" onClick={handleShare || handleCopyLink} />

      {/* Internal Navigation Buttons */}
      <ActionBtn icon={<Award size={16} className="text-amber-500" />} label="মার্কশীট" onClick={() => navTo('মার্কশীট')} secondary />
      <ActionBtn icon={<FileText size={16} className="text-indigo-500" />} label="সনদপত্র" onClick={() => navTo('সনদপত্র')} secondary />
      <ActionBtn icon={<Wallet size={16} className="text-emerald-500" />} label="পেমেন্ট" onClick={() => navTo('পেমেন্ট ও বকেয়া')} secondary />
      <ActionBtn icon={<Layout size={16} className="text-[#0D6582]" />} label="সিট প্ল্যান" onClick={() => navTo('সিট প্ল্যান')} secondary />
    </div>
  );
};

const ActionBtn = ({ icon, label, onClick, active, secondary }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-1.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all duration-300 group active:scale-95",
      secondary 
        ? "bg-card border-border-main hover:bg-step-bg shadow-sm"
        : active
          ? "bg-success/10 border-success/30 text-success"
          : "bg-primary/5 hover:bg-primary border-primary/10 hover:border-primary text-primary hover:text-white"
    )}
  >
    <div className={cn("transition-transform group-hover:-translate-y-0.5", secondary ? "opacity-90" : "")}>
      {icon}
    </div>
    <span className={cn(
      "text-[9px] sm:text-[10px] font-black uppercase tracking-wider",
      secondary ? "text-text-main/70 group-hover:text-text-main" : ""
    )}>
      {label}
    </span>
  </button>
);
