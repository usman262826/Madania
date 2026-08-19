import React, { useState, useRef } from 'react';
import { 
  Database, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Search, 
  User, 
  Award, 
  Building2, 
  Eye, 
  RefreshCw,
  Stamp,
  FileCheck,
  Check,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../contexts/DataContext';
import { processAndCompressImage, downloadDataUrl, MediaAsset } from '../../utils/imageUtils';

export const DatabaseMediaStore: React.FC = () => {
  const { 
    madrasahBranding, 
    mediaAssets, 
    updateBranding, 
    saveMediaAsset, 
    deleteMediaAsset,
    teachers,
    students,
    updateData
  } = useData();

  const [activeTab, setActiveTab] = useState<'branding' | 'upload' | 'teachers' | 'students' | 'all'>('branding');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Custom upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<MediaAsset['category']>('document');
  const [selectedFile, setSelectedFile] = useState<{ dataUrl: string; size: string; rawFile: File } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Preview Modal
  const [previewMedia, setPreviewMedia] = useState<{ title: string; url: string; category?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler for uploading Branding images (Logo, Header, Seal, Signature)
  const handleBrandingUpload = async (
    key: 'logoUrl' | 'headerUrl' | 'stampUrl' | 'signatureUrl',
    file: File,
    title: string
  ) => {
    try {
      setIsProcessing(true);
      const { dataUrl, sizeFormatted } = await processAndCompressImage(file, 1000, 1000, 0.85);
      
      // Update Branding in DataContext & database
      await updateBranding({ [key]: dataUrl });

      // Also register in general media assets
      await saveMediaAsset({
        title,
        category: key === 'logoUrl' ? 'logo' : key === 'headerUrl' ? 'header' : key === 'stampUrl' ? 'stamp' : 'signature',
        url: dataUrl,
        fileSize: sizeFormatted
      });
    } catch (err: any) {
      console.error(err);
      alert('ছবি প্রক্রিয়াজাত করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler for custom general file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      const processed = await processAndCompressImage(file, 1200, 1200, 0.85);
      setSelectedFile({
        dataUrl: processed.dataUrl,
        size: processed.sizeFormatted,
        rawFile: file
      });
      if (!uploadTitle) {
        setUploadTitle(file.name.split('.')[0]);
      }
    } catch (err: any) {
      alert('ফাইল লোড করতে ব্যর্থ: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveUpload = async () => {
    if (!selectedFile) {
      alert('অনুগ্রহ করে একটি ছবি বা ফাইল নির্বাচন করুন');
      return;
    }
    const title = uploadTitle.trim() || 'চিত্র ' + new Date().toLocaleDateString('bn-BD');
    
    await saveMediaAsset({
      title,
      category: uploadCategory,
      url: selectedFile.dataUrl,
      fileSize: selectedFile.size
    });

    // Reset form
    setSelectedFile(null);
    setUploadTitle('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Teacher Photo Update
  const handleTeacherPhotoUpload = async (teacherId: string, teacherName: string, file: File) => {
    try {
      setIsProcessing(true);
      const { dataUrl, sizeFormatted } = await processAndCompressImage(file, 600, 600, 0.85);
      
      // Save in teachers list
      const savedTeachers = JSON.parse(localStorage.getItem('madrasa_teachers') || '[]');
      const updatedTeachers = savedTeachers.map((t: any) => 
        String(t.id) === String(teacherId) ? { ...t, photoUrl: dataUrl } : t
      );
      localStorage.setItem('madrasa_teachers', JSON.stringify(updatedTeachers));

      // Sync via updateData if needed
      await updateData('staff_members', { id: teacherId, photoUrl: dataUrl });

      // Add to database media assets
      await saveMediaAsset({
        title: `${teacherName} (শিক্ষক ছবি)`,
        category: 'teacher',
        url: dataUrl,
        fileSize: sizeFormatted,
        metadata: { teacherId }
      });

      alert(`উস্তাদ/কর্মী ${teacherName}-এর ছবি সফলভাবে ডাটাবেসে আপডেট হয়েছে!`);
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      alert('ছবি আপলোডে সমস্যা: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Student Photo Upload
  const handleStudentPhotoUpload = async (student: any, file: File) => {
    try {
      setIsProcessing(true);
      const { dataUrl, sizeFormatted } = await processAndCompressImage(file, 600, 600, 0.85);
      
      const updatedStudent = {
        ...student,
        photoUrl: dataUrl,
        'ছবি': dataUrl
      };

      await updateData('students', updatedStudent);

      const stName = student['শিক্ষার্থীর নাম'] || student.name || 'শিক্ষার্থী';
      await saveMediaAsset({
        title: `${stName} (শিক্ষার্থী ছবি)`,
        category: 'student',
        url: dataUrl,
        fileSize: sizeFormatted,
        metadata: { studentId: student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] }
      });

      alert(`শিক্ষার্থী ${stName}-এর ছবি সফলভাবে ডাটাবেসে আপডেট হয়েছে!`);
    } catch (err: any) {
      alert('ছবি আপলোডে সমস্যা: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy Data URL
  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Assets
  const filteredAssets = mediaAssets.filter(item => {
    const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
    const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 font-hind-siliguri text-left">
      {/* Header & Database Sync Status */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-card to-card border border-emerald-500/30 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0 shadow-inner">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-text-main">মিডিয়া ও ডাটাবেস ইমেজ ভল্ট</h2>
              <span className="px-3 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-black rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ডাটাবেস কানেক্টেড
              </span>
            </div>
            <p className="text-xs text-text-light mt-1 font-medium">
              মাদ্রাসার লোগো, প্যাড ব্যানার, অফিশিয়াল সিল, মুহতামিমের স্বাক্ষর, ওস্তাদ ও শিক্ষার্থীদের সমস্ত ছবি সরাসরি ডাটাবেসে স্থায়ীভাবে সংরক্ষিত থাকবে।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-step-bg/80 p-2 rounded-2xl border border-border-main/50 self-stretch md:self-auto justify-around">
          <div className="text-center px-3">
            <p className="text-[10px] font-bold text-text-light uppercase tracking-wider">মোট ফাইল</p>
            <p className="text-lg font-black text-emerald-500">{mediaAssets.length}</p>
          </div>
          <div className="h-8 w-[1px] bg-border-main"></div>
          <div className="text-center px-3">
            <p className="text-[10px] font-bold text-text-light uppercase tracking-wider">শিক্ষক ছবি</p>
            <p className="text-lg font-black text-primary">{teachers.filter(t => t.photoUrl).length}</p>
          </div>
          <div className="h-8 w-[1px] bg-border-main"></div>
          <div className="text-center px-3">
            <p className="text-[10px] font-bold text-text-light uppercase tracking-wider">ছাত্র ছবি</p>
            <p className="text-lg font-black text-blue-500">{students.filter(s => s.photoUrl || s['ছবি']).length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-main/60 pb-3">
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'bg-card text-text-light hover:text-text-main border border-border-main'
          }`}
        >
          <Building2 size={16} /> 🏫 মাদ্রাসা ব্র্যান্ডিং মিডিয়া (Logo/Pad/Seal)
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'bg-card text-text-light hover:text-text-main border border-border-main'
          }`}
        >
          <Upload size={16} /> 📁 নতুন চিত্র/ডকুমেন্ট আপলোড
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'teachers'
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'bg-card text-text-light hover:text-text-main border border-border-main'
          }`}
        >
          <User size={16} /> 👨‍🏫 শিক্ষক ও কর্মী ছবিসমূহ ({teachers.length})
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'students'
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'bg-card text-text-light hover:text-text-main border border-border-main'
          }`}
        >
          <Award size={16} /> 🎓 শিক্ষার্থী ছবি ভল্ট ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'all'
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'bg-card text-text-light hover:text-text-main border border-border-main'
          }`}
        >
          <ImageIcon size={16} /> 🖼️ সমস্ত ডাটাবেস ছবি ও ফাইল ({mediaAssets.length})
        </button>
      </div>

      {/* TAB 1: BRANDING MEDIA STORE */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Official Logo */}
          <div className="bento-card p-6 bg-card border border-border-main/60 rounded-3xl shadow-lg space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-text-main">মাদ্রাসার অফিশিয়াল লোগো</h3>
                  <p className="text-[11px] text-text-light">আইডি কার্ড, রশিদ, সার্টিফিকেট ও সফটওয়্যার হেডার এ ব্যবহৃত হয়</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                ডাটাবেসে সংরক্ষিত
              </span>
            </div>

            <div className="p-4 bg-step-bg/50 border border-border-main/40 rounded-2xl flex items-center justify-between gap-4">
              <div className="w-24 h-24 bg-card rounded-2xl border-2 border-dashed border-border-main/80 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                {madrasahBranding.logoUrl ? (
                  <img src={madrasahBranding.logoUrl} alt="Madrasah Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <ImageIcon className="text-text-light/40 w-8 h-8" />
                )}
              </div>
              
              <div className="flex-1 space-y-2 text-left">
                <p className="text-xs font-semibold text-text-main">নতুন লোগো আপলোড করুন</p>
                <p className="text-[11px] text-text-light leading-relaxed">PNG/JPEG ফরম্যাট (স্বচ্ছ ব্যাকগ্রাউন্ড বা সাদা)। আপলোডের সাথে সাথে ডাটাবেসে সেভ হয়ে যাবে।</p>
                
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-light transition-all cursor-pointer shadow-md active:scale-95">
                  <Upload size={14} /> লোগো বেছে নিন ও সেভ করুন
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleBrandingUpload('logoUrl', f, 'মাদ্রাসার অফিশিয়াল লোগো');
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 2. Header Banner / Pad */}
          <div className="bento-card p-6 bg-card border border-border-main/60 rounded-3xl shadow-lg space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  <FileCheck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-text-main">প্যাড / হেডার ব্যানার ছবি</h3>
                  <p className="text-[11px] text-text-light">অফিশিয়াল চিঠি, প্রবেশপত্র ও রশিদের প্রিন্ট শীর্ষে প্রিন্ট হবে</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                ডাটাবেসে সংরক্ষিত
              </span>
            </div>

            <div className="p-4 bg-step-bg/50 border border-border-main/40 rounded-2xl flex items-center justify-between gap-4">
              <div className="w-32 h-20 bg-card rounded-2xl border-2 border-dashed border-border-main/80 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                {madrasahBranding.headerUrl ? (
                  <img src={madrasahBranding.headerUrl} alt="Header Banner" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-[10px] font-bold text-text-light/50 text-center">কোনো হেডার সেভ নেই</span>
                )}
              </div>
              
              <div className="flex-1 space-y-2 text-left">
                <p className="text-xs font-semibold text-text-main">নতুন প্যাড হেডার আপলোড</p>
                <p className="text-[11px] text-text-light leading-relaxed">ল্যান্ডস্কেপ ব্যানার ইমেজ। সরাসরি ডাটাবেসে সেভ হয়ে ইনভয়েসে রেন্ডার হবে।</p>
                
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-md active:scale-95">
                  <Upload size={14} /> হেডার ছবি আপলোড
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleBrandingUpload('headerUrl', f, 'প্যাড হেডার ব্যানার');
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 3. Official Seal / Stamp */}
          <div className="bento-card p-6 bg-card border border-border-main/60 rounded-3xl shadow-lg space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Stamp size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-text-main">অফিশিয়াল সিল (Stamp)</h3>
                  <p className="text-[11px] text-text-light">রশিদ খতিয়ান ও সনদে স্বয়ংক্রিয় সিল প্রসেসিংয়ের জন্য</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-step-bg/50 border border-border-main/40 rounded-2xl flex items-center justify-between gap-4">
              <div className="w-24 h-24 bg-card rounded-2xl border-2 border-dashed border-border-main/80 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                {madrasahBranding.stampUrl ? (
                  <img src={madrasahBranding.stampUrl} alt="Stamp" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Stamp className="text-text-light/40 w-8 h-8" />
                )}
              </div>
              
              <div className="flex-1 space-y-2 text-left">
                <p className="text-xs font-semibold text-text-main">সিল নির্বাচন করুন</p>
                <p className="text-[11px] text-text-light leading-relaxed">গোল বা চারকোনা সিল (PNG)। আপলোডের সাথে সাথে ডাটাবেস রিসিট এ ফিল্ড হবে।</p>
                
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-xs font-black rounded-xl hover:bg-amber-700 transition-all cursor-pointer shadow-md active:scale-95">
                  <Upload size={14} /> সিল ইমেজ আপলোড
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleBrandingUpload('stampUrl', f, 'অফিশিয়াল সিল');
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 4. Principal Signature */}
          <div className="bento-card p-6 bg-card border border-border-main/60 rounded-3xl shadow-lg space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-text-main">মুহতামিমের স্বাক্ষর (Signature)</h3>
                  <p className="text-[11px] text-text-light">প্রবেশপত্র, প্রশংসাপত্র ও বেতন ভাউচারে ব্যবহারের জন্য</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-step-bg/50 border border-border-main/40 rounded-2xl flex items-center justify-between gap-4">
              <div className="w-28 h-20 bg-card rounded-2xl border-2 border-dashed border-border-main/80 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                {madrasahBranding.signatureUrl ? (
                  <img src={madrasahBranding.signatureUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-[10px] font-bold text-text-light/50 text-center">কোনো স্বাক্ষর নেই</span>
                )}
              </div>
              
              <div className="flex-1 space-y-2 text-left">
                <p className="text-xs font-semibold text-text-main">স্বাক্ষর ছবি আপলোড</p>
                <p className="text-[11px] text-text-light leading-relaxed">স্বচ্ছ ব্যাকগ্রাউন্ড স্বাক্ষর ছবি। সরাসরি ডাটাবেসে সেভ থাকবে।</p>
                
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-xs font-black rounded-xl hover:bg-purple-700 transition-all cursor-pointer shadow-md active:scale-95">
                  <Upload size={14} /> স্বাক্ষর ইমেজ আপলোড
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleBrandingUpload('signatureUrl', f, 'মুহতামিমের স্বাক্ষর');
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL FILE UPLOAD TO DATABASE */}
      {activeTab === 'upload' && (
        <div className="max-w-3xl mx-auto bento-card p-8 bg-card border border-border-main/60 rounded-3xl shadow-2xl space-y-6">
          <div className="border-b border-border-main/60 pb-4">
            <h3 className="text-xl font-black text-text-main">নতুন ছবি বা ডকুমেন্ট ডাটাবেসে যোগ করুন</h3>
            <p className="text-xs text-text-light mt-1">
              যেকোনো ছবি বা স্ক্যানকৃত ফাইল সরাসরি ডাটাবেসে এনকোড করে স্থায়ীভাবে সংরক্ষণ করুন।
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">ফাইলের শিরোনাম/নাম *</label>
                <input
                  type="text"
                  placeholder="যেমন: ভর্তি নোটিশ স্ক্যান / মুহতামিম ছবি"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:border-primary text-text-main"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">ক্যাটাগরি নির্ধারণ করুন</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:border-primary text-text-main"
                >
                  <option value="logo">মাদ্রাসার লোগো (Logo)</option>
                  <option value="header">হেডার ব্যানার (Header)</option>
                  <option value="stamp">অফিশিয়াল সিল (Stamp)</option>
                  <option value="signature">স্বাক্ষর (Signature)</option>
                  <option value="teacher">ওস্তাদ/কর্মী ছবি (Teacher Photo)</option>
                  <option value="student">শিক্ষার্থী ডকুমেন্ট/ছবি (Student)</option>
                  <option value="document">নথি ও স্ক্যানকৃত ফাইল (Scanned Document)</option>
                  <option value="other">অন্যান্য (Other)</option>
                </select>
              </div>
            </div>

            {/* Drag & Drop Area */}
            <div>
              <label className="block text-xs font-bold text-text-main mb-1.5">ছবি/ফাইল নির্বাচন করুন *</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all rounded-3xl p-8 text-center cursor-pointer space-y-3"
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={selectedFile.dataUrl} alt="Preview" className="w-32 h-32 object-contain rounded-2xl border border-border-main shadow-md bg-card p-2" />
                    <div>
                      <p className="text-xs font-black text-text-main">{selectedFile.rawFile.name}</p>
                      <p className="text-[11px] font-bold text-emerald-500">সাইজ: {selectedFile.size} (ডাটাবেস অপ্টিমাইজড)</p>
                    </div>
                    <span className="text-[11px] text-primary underline font-bold">অন্য ফাইল পরিবর্তন করতে ক্লিক করুন</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-text-main">কম্পিউটার/মোবাইল থেকে ফাইল বা ছবি আপলোড করুন</p>
                    <p className="text-xs text-text-light">PNG, JPG, JPEG, WEBP সাপোর্ট করে। স্বয়ংক্রিয়ভাবে ডাটাবেসে সেভ হবে।</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            <button
              onClick={handleSaveUpload}
              disabled={!selectedFile || isProcessing}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary-light transition-all shadow-xl shadow-primary/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> প্রক্রিয়াজাত করা হচ্ছে...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" /> ডাটাবেসে স্থায়ীভাবে সংরক্ষণ করুন
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: TEACHERS PHOTO VAULT */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-text-main">ওস্তাদ ও কর্মচারীদের ডাটাবেস ছবি তালিকা</h3>
            <p className="text-xs text-text-light font-semibold">সরাসরি প্রতিটি ওস্তাদের ছবি পরিবর্তন করতে পারবেন</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="bento-card p-4 bg-card border border-border-main/60 rounded-2xl shadow-md flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-step-bg border border-border-main/80 overflow-hidden flex items-center justify-center">
                    {teacher.photoUrl ? (
                      <img src={teacher.photoUrl} alt={teacher.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-text-light/40" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-text-main truncate">{teacher.name}</h4>
                  <p className="text-[10px] text-text-light font-medium truncate">{teacher.designation || 'ওস্তাদ'}</p>
                  <p className="text-[10px] text-text-light/70 font-mono mt-0.5">{teacher.mobile || 'মোবাইল নেই'}</p>

                  <label className="inline-flex items-center gap-1 mt-2 text-[10px] font-black text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg cursor-pointer transition-colors">
                    <Upload size={10} /> ছবি আপডেট
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleTeacherPhotoUpload(teacher.id, teacher.name, f);
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STUDENT PHOTO VAULT */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-lg font-black text-text-main">শিক্ষার্থী ছবি ও জন্মনিবন্ধন তথ্য</h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-light/60" />
              <input
                type="text"
                placeholder="শিক্ষার্থীর নাম বা রোল খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border-main rounded-xl text-xs font-bold outline-none text-text-main"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {students
              .filter(s => {
                const name = s['শিক্ষার্থীর নাম'] || s.name || '';
                const roll = s['রোল নম্বর'] || s.roll || '';
                return name.toLowerCase().includes(searchTerm.toLowerCase()) || String(roll).includes(searchTerm);
              })
              .slice(0, 24)
              .map((st, idx) => {
                const stName = st['শিক্ষার্থীর নাম'] || st.name || 'শিক্ষার্থী';
                const stJam = st['জামাত/শ্রেণী'] || 'সাধারণ';
                const stRoll = st['রোল নম্বর'] || 'N/A';
                const photo = st.photoUrl || st['ছবি'];

                return (
                  <div key={st.id || idx} className="bento-card p-4 bg-card border border-border-main/60 rounded-2xl shadow-md flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-step-bg border border-border-main/80 overflow-hidden flex items-center justify-center shrink-0">
                      {photo ? (
                        <img src={photo} alt={stName} className="w-full h-full object-cover" />
                      ) : (
                        <Award className="w-7 h-7 text-text-light/40" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="font-bold text-xs text-text-main truncate">{stName}</h4>
                      <p className="text-[10px] text-text-light font-medium truncate">{stJam} (রোল: {stRoll})</p>

                      <label className="inline-flex items-center gap-1 mt-2 text-[10px] font-black text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg cursor-pointer transition-colors">
                        <Upload size={10} /> ছবি সেভ
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleStudentPhotoUpload(st, f);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 5: ALL MEDIA GALLERY */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border-main/60">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-text-light" />
              <input
                type="text"
                placeholder="ফাইলের নাম সার্চ করুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-text-main w-48 sm:w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-light">ফিল্টার:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-2 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main"
              >
                <option value="all">সব ধরনের ফাইল ({mediaAssets.length})</option>
                <option value="logo">লোগো (Logo)</option>
                <option value="header">হেডার (Header)</option>
                <option value="stamp">সিল (Stamp)</option>
                <option value="signature">স্বাক্ষর (Signature)</option>
                <option value="teacher">শিক্ষক ছবি (Teacher)</option>
                <option value="student">শিক্ষার্থী ছবি (Student)</option>
                <option value="document">নথি/দলিল (Document)</option>
              </select>
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border-main/60 rounded-3xl space-y-3">
              <ImageIcon className="w-12 h-12 text-text-light/30 mx-auto" />
              <p className="text-sm font-bold text-text-main">কোনো ফাইল বা ছবি পাওয়া যায়নি</p>
              <p className="text-xs text-text-light">"নতুন চিত্র/ডকুমেন্ট আপলোড" ট্যাবে গিয়ে ফাইল যোগ করুন।</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="bento-card bg-card border border-border-main/60 rounded-2xl p-3 shadow-md space-y-2 flex flex-col justify-between group relative">
                  <div className="w-full h-28 bg-step-bg rounded-xl border border-border-main/50 overflow-hidden flex items-center justify-center p-1 relative">
                    <img src={asset.url} alt={asset.title} className="max-w-full max-h-full object-contain" />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewMedia({ title: asset.title, url: asset.url, category: asset.category })}
                        className="p-1.5 bg-white text-gray-900 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                        title="দেখুন"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => downloadDataUrl(asset.url, `${asset.title}.jpg`)}
                        className="p-1.5 bg-white text-gray-900 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                        title="ডাউনলোড"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="text-left space-y-1">
                    <h5 className="font-bold text-xs text-text-main truncate" title={asset.title}>{asset.title}</h5>
                    <div className="flex items-center justify-between text-[10px] text-text-light">
                      <span className="capitalize px-1.5 py-0.5 bg-primary/10 text-primary font-black rounded-md">{asset.category}</span>
                      <span>{asset.fileSize || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border-main/50 pt-2 text-[10px]">
                    <button
                      onClick={() => handleCopyUrl(asset.id, asset.url)}
                      className="text-text-light hover:text-text-main font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === asset.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      {copiedId === asset.id ? 'কপি হয়েছে' : 'Base64 কপি'}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`আপনি কি নিশ্চিত যে "${asset.title}" ডাটাবেস থেকে মুছে ফেলতে চান?`)) {
                          deleteMediaAsset(asset.id);
                        }
                      }}
                      className="text-error hover:text-red-700 p-1 cursor-pointer"
                      title="মুছুন"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media Preview Modal */}
      <AnimatePresence>
        {previewMedia && (
          <div className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border-main p-6 rounded-3xl max-w-2xl w-full space-y-4 text-left shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-border-main pb-3">
                <h3 className="font-black text-lg text-text-main">{previewMedia.title}</h3>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="px-3 py-1 bg-step-bg hover:bg-border-main text-text-main rounded-xl text-xs font-bold cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>

              <div className="max-h-[60vh] flex items-center justify-center bg-step-bg rounded-2xl p-4 overflow-hidden">
                <img src={previewMedia.url} alt={previewMedia.title} className="max-w-full max-h-[50vh] object-contain rounded-xl" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => downloadDataUrl(previewMedia.url, `${previewMedia.title}.jpg`)}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-primary-light cursor-pointer shadow-md"
                >
                  <Download size={14} /> ডাউনলোড করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
