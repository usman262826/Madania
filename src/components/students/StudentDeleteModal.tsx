import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Lock, AlertTriangle, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Student } from '../../types';
import { enToBnNumber } from '../../lib/utils';
import { useData } from '../../contexts/DataContext';

interface StudentDeleteModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StudentDeleteModal: React.FC<StudentDeleteModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { deleteStudent } = useData();
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !student) return null;

  const sId = String(student['রেজিস্ট্রেশন/আইডি নম্বর'] || student['রেজিস্ট্রেশন/আইডি'] || student.id || '');
  const sName = student['শিক্ষার্থীর নাম'] || student.name || 'শিক্ষার্থী';
  const sClass = student['জামাত/শ্রেণী'] || student['জামাত'] || student.class || '—';
  const sRoll = student['রোল নম্বর'] || student.roll || '—';

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = password.trim();
    if (!trimmed) {
      setErrorMsg('নিরাপত্তা পাসওয়ার্ড প্রদান করা আবশ্যক!');
      return;
    }

    // Check against current session, stored admin passwords, or master fallback
    const storedUser = localStorage.getItem('madrasa_current_user');
    let validPasswords = ['123456', 'admin', 'admin123', 'madrasah2025', 'madrasa2026', '1234'];
    
    if (storedUser) {
      try {
        const uObj = JSON.parse(storedUser);
        if (uObj.password) validPasswords.push(String(uObj.password));
        if (uObj.pin) validPasswords.push(String(uObj.pin));
      } catch (e) {}
    }

    const customAdminPass = localStorage.getItem('madrasa_admin_password');
    if (customAdminPass) validPasswords.push(customAdminPass);

    const isPasswordCorrect = validPasswords.some(p => p === trimmed);

    if (!isPasswordCorrect) {
      setErrorMsg('ভুল পাসওয়ার্ড! শিক্ষার্থী ডিলিট করার অনুমতি মেলেনি।');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteStudent(sId);
      setPassword('');
      setIsDeleting(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Delete failed:', err);
      setErrorMsg('মুছতে সমস্যা হয়েছে: ' + (err.message || ''));
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 font-hind-siliguri animate-fadeIn">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-card border border-border-main rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-left relative overflow-hidden"
      >
        {/* Close Button */}
        <button 
          type="button" 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-text-light/50 hover:text-text-main hover:bg-step-bg transition-colors"
        >
          <X size={18} />
        </button>

        {/* Warning Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center justify-center shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 border border-rose-500/20 uppercase">
                নিরাপত্তা যাচাই
              </span>
            </div>
            <h3 className="text-xl font-black text-text-main mt-1">
              রিসাইকেল বিনে স্থানান্তর
            </h3>
            <p className="text-xs text-text-light/70 mt-0.5">
              মুছে ফেলা শিক্ষার্থীকে পরবর্তীতে রিসাইকেল বিন থেকে পুনরুদ্ধার করা যাবে
            </p>
          </div>
        </div>

        {/* Student Summary Card */}
        <div className="p-4 bg-step-bg/60 border border-border-main/70 rounded-2xl space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-sm text-text-main">{sName}</span>
            <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-lg font-black text-[11px]">
              ID: #{enToBnNumber(sId)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-text-light/80 pt-1 border-t border-border-main/40 text-[11px]">
            <span>জামাত: <strong>{sClass}</strong></span>
            <span>রোল: <strong>{enToBnNumber(sRoll)}</strong></span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleConfirmDelete} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-text-main flex items-center gap-1.5">
              <Lock size={13} className="text-rose-500" />
              <span>এডমিন / ইউজার পাসওয়ার্ড লিখুন <span className="text-rose-500">*</span></span>
            </label>
            <input 
              type="password"
              autoFocus
              placeholder="পাসওয়ার্ড লিখুন (যেমন: 123456)..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-step-bg border border-border-main focus:border-rose-500 rounded-2xl text-xs font-bold outline-none text-text-main transition-all"
            />
            <p className="text-[10px] text-text-light/50 font-medium">
              * ডিলিট নিশ্চিত করতে আপনার বর্তমান একাউন্ট বা এডমিন পাসওয়ার্ড দিয়ে যাচাই করুন
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-step-bg hover:bg-border-main text-text-main rounded-2xl text-xs font-black transition-all cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isDeleting}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>{isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'ডিলিট নিশ্চিত করুন'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
