import React, { useState, useEffect, useRef } from "react";
import { 
  User, Mail, Phone, MapPin, Lock, Camera, Save, Shield, 
  Edit3, Image as ImageIcon, CheckCircle2, AlertCircle, Building, Key, 
  Sparkles, Upload, Trash2, Download, Database, RefreshCw, Eye, X, Check, FileText
} from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { motion, AnimatePresence } from "framer-motion";
import { processAndCompressImage } from "../../utils/imageUtils";
import { supabase } from "../../lib/supabaseClient";

interface ProfilePageProps {
  currentUser: any;
  setCurrentUser: (user: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, setCurrentUser }) => {
  const { madrasahBranding, updateBranding, mediaAssets, saveMediaAsset, deleteMediaAsset } = useData();
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    designation: currentUser?.designation || currentUser?.role || "অ্যাডমিনিস্ট্রেটর",
    mobile: currentUser?.mobile || "",
    email: currentUser?.email || "",
    address: currentUser?.address || "",
    bio: currentUser?.bio || "",
    bloodGroup: currentUser?.bloodGroup || currentUser?.blood || "A+",
    photoUrl: currentUser?.photoUrl || "",
    password: currentUser?.password || "",
    newPassword: "",
    confirmPassword: ""
  });

  const [brandingData, setBrandingData] = useState({
    madrasahName: madrasahBranding?.madrasahName || "দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা",
    logoUrl: madrasahBranding?.logoUrl || "/src/PNG/LOGO.png",
    address: madrasahBranding?.address || "নয়া কান্দারগাঁও, লুটেরচর-৩৫১৬, মেঘনা, কুমিল্লা।",
    phone: madrasahBranding?.phone || "01700000000",
    stampUrl: madrasahBranding?.stampUrl || "",
    signatureUrl: madrasahBranding?.signatureUrl || ""
  });

  const [activeTab, setActiveTab] = useState<"profile" | "branding" | "security" | "media">("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [previewMediaModal, setPreviewMediaModal] = useState<any>(null);

  // Drag & drop state for file uploads
  const [isDraggingProfile, setIsDraggingProfile] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const headerFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const stampFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || "",
        designation: currentUser.designation || currentUser.role || "",
        mobile: currentUser.mobile || "",
        email: currentUser.email || "",
        address: currentUser.address || "",
        bio: currentUser.bio || "",
        bloodGroup: currentUser.bloodGroup || currentUser.blood || "A+",
        photoUrl: currentUser.photoUrl || "",
        password: currentUser.password || ""
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (madrasahBranding) {
      setBrandingData({
        madrasahName: madrasahBranding.madrasahName || "দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা",
        logoUrl: madrasahBranding.logoUrl || "/src/PNG/LOGO.png",
        address: madrasahBranding.address || "নয়া কান্দারগাঁও, লুটেরচর-৩৫১৬, মেঘনা, কুমিল্লা।",
        phone: madrasahBranding.phone || "01700000000",
        stampUrl: madrasahBranding.stampUrl || "",
        signatureUrl: madrasahBranding.signatureUrl || ""
      });
    }
  }, [madrasahBranding]);

  // Helper to directly upload profile photo file & persist to Supabase DB
  const handleProfilePhotoFileChange = async (file: File) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    setErrorMessage(null);
    try {
      const { dataUrl, sizeFormatted } = await processAndCompressImage(file, 600, 600, 0.85);
      
      // Update form state
      setFormData(prev => ({ ...prev, photoUrl: dataUrl }));

      // Update current user state immediately
      const updatedUser = {
        ...currentUser,
        photoUrl: dataUrl
      };
      setCurrentUser(updatedUser);

      // Save to Supabase & localStorage
      localStorage.setItem("madrasa_current_user", JSON.stringify(updatedUser));

      // Also save into database media assets collection
      await saveMediaAsset({
        title: `Profile Photo - ${updatedUser.name || 'User'}`,
        category: 'teacher',
        url: dataUrl,
        fileSize: sizeFormatted,
        metadata: { userId: updatedUser.id, userEmail: updatedUser.email }
      });

      // Directly update in Supabase app_users table if available
      try {
        if (updatedUser.id || updatedUser.email) {
          await supabase.from('app_users').upsert({
            id: updatedUser.id || 'admin_user',
            name: updatedUser.name || 'Admin',
            email: updatedUser.email,
            phone: updatedUser.mobile,
            photo_url: dataUrl,
            updated_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn("Direct Supabase user update notice:", err);
      }

      setSuccessMessage("প্রোফাইল ছবি ডাটাবেসে সফলভাবে আপলোড ও আপডেট হয়েছে!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("ছবি প্রসেস করতে সমস্যা হয়েছে। অনুগ্রহ করে সঠিক ইমেজ ফাইল নির্বাচন করুন।");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Helper to handle Madrasah Logo Upload
  const handleLogoFileChange = async (file: File) => {
    if (!file) return;
    setIsUploadingLogo(true);
    setErrorMessage(null);
    try {
      const { dataUrl, sizeFormatted } = await processAndCompressImage(file, 800, 800, 0.88);
      
      const newBranding = {
        ...brandingData,
        logoUrl: dataUrl
      };
      setBrandingData(newBranding);

      await updateBranding(newBranding);

      // Save into media store in DB
      await saveMediaAsset({
        title: `Madrasah Official Logo`,
        category: 'logo',
        url: dataUrl,
        fileSize: sizeFormatted
      });

      setSuccessMessage("মাদরাসার লোগো সরাসরি ডাটাবেসে আপলোড ও সেভ হয়েছে!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("লোগো ফাইল আপলোড করতে ব্যর্থ হয়েছে।");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Helper to handle Madrasah Stamp/Signature Upload
  const handleStampFileChange = async (file: File) => {
    if (!file) return;
    setIsSaving(true);
    try {
      const { dataUrl, sizeFormatted } = await processAndCompressImage(file, 500, 500, 0.85);
      const newBranding = {
        ...brandingData,
        stampUrl: dataUrl
      };
      setBrandingData(newBranding);
      await updateBranding(newBranding);

      await saveMediaAsset({
        title: `Madrasah Official Stamp`,
        category: 'stamp',
        url: dataUrl,
        fileSize: sizeFormatted
      });

      setSuccessMessage("অফিশিয়াল সিল/স্ট্যাম্প ডাটাবেসে সফলভাবে আপডেট হয়েছে!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setErrorMessage("স্ট্যাম্প ছবি প্রসেস করতে ত্রুটি হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setErrorMessage("নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।");
        setIsSaving(false);
        return;
      }

      const updatedUser = {
        ...currentUser,
        name: formData.name,
        designation: formData.designation,
        mobile: formData.mobile,
        email: formData.email,
        address: formData.address,
        bio: formData.bio,
        bloodGroup: formData.bloodGroup,
        photoUrl: formData.photoUrl,
        password: formData.newPassword ? formData.newPassword : formData.password
      };

      setCurrentUser(updatedUser);
      localStorage.setItem("madrasa_current_user", JSON.stringify(updatedUser));

      // Update in madrasa_teachers if exists
      try {
        const savedTeachers = localStorage.getItem("madrasa_teachers");
        if (savedTeachers) {
          const teachers = JSON.parse(savedTeachers);
          const updatedTeachers = teachers.map((t: any) => 
            (t.id === currentUser?.id || t.mobile === currentUser?.mobile) ? { ...t, ...updatedUser } : t
          );
          localStorage.setItem("madrasa_teachers", JSON.stringify(updatedTeachers));
        }
      } catch (err) {
        console.error(err);
      }

      // Sync user profile to Supabase DB app_users table
      try {
        await supabase.from('app_users').upsert({
          id: currentUser?.id || 'admin_user',
          name: formData.name,
          email: formData.email,
          phone: formData.mobile,
          role: currentUser?.role || 'admin',
          designation: formData.designation,
          photo_url: formData.photoUrl,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Supabase user update info:", err);
      }

      setSuccessMessage("ইউজারের সমস্ত প্রোফাইল তথ্য ডাটাবেসে সফলভাবে আপডেট হয়েছে!");
      setIsEditingProfile(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage("প্রোফাইল আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateBranding(brandingData);
      setSuccessMessage("মাদরাসার ব্র্যান্ডিং ও ঠিকানা সরাসরি ডাটাবেসে সংরক্ষিত হয়েছে!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage("ব্র্যান্ডিং আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-hind-siliguri max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Hidden File Inputs for Direct File Selection */}
      <input 
        type="file" 
        ref={profileFileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleProfilePhotoFileChange(e.target.files[0]);
          }
        }} 
      />
      <input 
        type="file" 
        ref={headerFileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleProfilePhotoFileChange(e.target.files[0]);
          }
        }} 
      />
      <input 
        type="file" 
        ref={logoFileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleLogoFileChange(e.target.files[0]);
          }
        }} 
      />
      <input 
        type="file" 
        ref={stampFileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleStampFileChange(e.target.files[0]);
          }
        }} 
      />

      {/* Hero Banner Header Card */}
      <div className="relative bg-gradient-to-br from-slate-900 via-[#0d555c] to-slate-950 rounded-[2.5rem] p-6 sm:p-10 text-white shadow-2xl overflow-hidden border border-white/10">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          
          {/* User Avatar with Direct Photo Upload Overlay */}
          <div className="relative group shrink-0">
            <div 
              onClick={() => profileFileInputRef.current?.click()}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-white/10 backdrop-blur-md border-4 border-white/30 shadow-2xl overflow-hidden relative cursor-pointer group-hover:border-emerald-400 transition-all duration-300"
              title="সরাসরি ছবি আপলোড করতে ক্লিক করুন"
            >
              {formData.photoUrl ? (
                <img 
                  src={formData.photoUrl} 
                  alt={formData.name} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-emerald-800 to-teal-600">
                  <span className="text-5xl font-black text-white">
                    {formData.name ? formData.name.charAt(0) : "A"}
                  </span>
                </div>
              )}

              {/* Upload Hover Overlay */}
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                {isUploadingPhoto ? (
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-emerald-400 mb-1 scale-90 group-hover:scale-100 transition-transform" />
                    <span className="text-[10px] font-black text-white px-2 py-1 bg-emerald-600 rounded-lg">ছবি ফাইল সিলেক্ট করুন</span>
                  </>
                )}
              </div>
            </div>

            {/* Direct Camera Click Trigger Button */}
            <button
              type="button"
              onClick={() => profileFileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-2xl shadow-xl border-2 border-slate-900 transition-all cursor-pointer hover:scale-110"
              title="সরাসরি প্রোফাইল ছবি আপলোড করুন"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>

          {/* User Main Info Header */}
          <div className="text-center md:text-left flex-1 space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-xs font-bold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" /> {formData.designation || 'মাদরাসা অ্যাডমিনিস্ট্রেটর'}
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{formData.name || "ইউজার প্রোফাইল"}</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-[11px] font-black text-amber-300 w-fit mx-auto md:mx-0">
                <Database className="w-3 h-3 text-amber-300" /> ডাটাবেস সিঙ্কড
              </span>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
              {formData.bio || "পোর্টালে আপনার ব্যক্তিগত তথ্য, ছবি, মোবাইল নম্বর এবং মাদরাসার ব্র্যান্ডিং লোগো সরাসরি ফাইল আপলোডের মাধ্যমে ডাটাবেসে সেভ করুন।"}
            </p>

            {/* Quick Metadata Chips */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2 text-xs font-mono">
              {formData.mobile && (
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 font-medium">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> {formData.mobile}
                </span>
              )}
              {formData.email && (
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 font-medium">
                  <Mail className="w-3.5 h-3.5 text-teal-300" /> {formData.email}
                </span>
              )}
              {formData.bloodGroup && (
                <span className="flex items-center gap-1.5 bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-400/30 font-bold text-rose-300">
                  রক্তের গ্রুপ: {formData.bloodGroup}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Tabs inside Header Banner */}
        <div className="relative z-10 flex flex-wrap gap-2.5 mt-8 pt-6 border-t border-white/15">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "profile" 
                ? "bg-white text-slate-900 shadow-xl scale-105" 
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}
          >
            <User className="w-4 h-4 text-emerald-600" /> ব্যক্তিগত প্রোফাইল ও তথ্য
          </button>
          
          <button
            onClick={() => setActiveTab("branding")}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "branding" 
                ? "bg-white text-slate-900 shadow-xl scale-105" 
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}
          >
            <Building className="w-4 h-4 text-amber-600" /> মাদরাসা লোগো ও ব্র্যান্ডিং
          </button>
          
          <button
            onClick={() => setActiveTab("security")}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "security" 
                ? "bg-white text-slate-900 shadow-xl scale-105" 
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}
          >
            <Key className="w-4 h-4 text-blue-600" /> নিরাপত্তা ও পাসওয়ার্ড
          </button>

          <button
            onClick={() => setActiveTab("media")}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "media" 
                ? "bg-white text-slate-900 shadow-xl scale-105" 
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}
          >
            <ImageIcon className="w-4 h-4 text-purple-600" /> আপলোডকৃত মিডিয়া গ্যালারি ({mediaAssets.length})
          </button>
        </div>
      </div>

      {/* Global Toast Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center gap-3 shadow-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-800 dark:text-rose-300 font-bold text-sm flex items-center gap-3 shadow-md"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: PERSONAL PROFILE & DIRECT PHOTO UPLOAD */}
      {activeTab === "profile" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border-main rounded-[2.5rem] p-6 sm:p-10 shadow-xl space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-border-main gap-4">
            <div>
              <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {isEditingProfile ? "ব্যক্তিগত তথ্য ও প্রোফাইল ছবি সম্পাদন" : "ব্যক্তিগত প্রোফাইল বিবরণী"}
              </h2>
              <p className="text-xs text-text-light font-medium mt-1">
                {isEditingProfile ? "ছবি ফাইল আপলোড করুন এবং আপনার বিস্তারিত প্রোফাইল কাস্টমাইজ করুন" : "আপনার সম্পূর্ণ তথ্য ও ডাটাবেস রেকর্ড"}
              </p>
            </div>

            {!isEditingProfile ? (
              <button 
                onClick={() => setIsEditingProfile(true)} 
                className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-primary/20 shrink-0 shadow-sm"
              >
                <Edit3 className="w-4 h-4" /> প্রোফাইল তথ্য পরিবর্তন করুন
              </button>
            ) : (
              <button 
                onClick={() => setIsEditingProfile(false)} 
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-text-main rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-border-main shrink-0"
              >
                <X className="w-4 h-4" /> কাস্টমাইজ বন্ধ করুন
              </button>
            )}
          </div>

          {!isEditingProfile ? (
            /* Read-Only Profile Card Overview */
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Profile Photo Display Box */}
                <div className="p-6 bg-step-bg border border-border-main rounded-3xl flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                  <div className="w-32 h-32 rounded-3xl border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden relative group">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt={formData.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-black text-4xl">
                        {formData.name?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-text-main">{formData.name}</h3>
                    <p className="text-xs text-text-light font-semibold mt-0.5">{formData.designation}</p>
                  </div>
                  <button
                    onClick={() => profileFileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary-dark transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> নতুন ছবি আপলোড করুন
                  </button>
                </div>

                <div className="p-5 bg-step-bg border border-border-main rounded-3xl space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-text-light uppercase tracking-widest block mb-1">পূর্ণ নাম (Full Name)</span>
                    <p className="text-sm font-black text-text-main">{formData.name || "-"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-text-light uppercase tracking-widest block mb-1">পদবী / পদ (Designation)</span>
                    <p className="text-sm font-bold text-text-main">{formData.designation || "-"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-text-light uppercase tracking-widest block mb-1">মোবাইল নম্বর (Mobile)</span>
                    <p className="text-sm font-bold text-text-main font-mono">{formData.mobile || "-"}</p>
                  </div>
                </div>

                <div className="p-5 bg-step-bg border border-border-main rounded-3xl space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-text-light uppercase tracking-widest block mb-1">ইমেইল ঠিকানা (Email)</span>
                    <p className="text-sm font-bold text-text-main">{formData.email || "-"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-text-light uppercase tracking-widest block mb-1">রক্তের গ্রুপ (Blood Group)</span>
                    <p className="text-sm font-black text-rose-500">{formData.bloodGroup || "-"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-text-light uppercase tracking-widest block mb-1">ঠিকানা (Address)</span>
                    <p className="text-sm font-bold text-text-main">{formData.address || "-"}</p>
                  </div>
                </div>

              </div>

              <div className="p-6 bg-step-bg border border-border-main rounded-3xl">
                <span className="text-[10px] font-black text-text-light uppercase tracking-widest block mb-2">সংক্ষিপ্ত পরিচিতি ও বায়ো (Bio & Description)</span>
                <p className="text-xs sm:text-sm font-medium text-text-main leading-relaxed">
                  {formData.bio || "কোনো অতিরিক্ত পরিচিতি লিখা হয়নি।"}
                </p>
              </div>
            </div>
          ) : (
            /* Edit Form with Direct File Dropzone */
            <form onSubmit={handleProfileSubmit} className="space-y-8">
              
              {/* DIRECT FILE UPLOAD DROPZONE FOR PROFILE PICTURE */}
              <div className="p-6 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent border-2 border-dashed border-primary/30 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-text-main">সরাসরি প্রোফাইল পিকচার আপলোড</h3>
                      <p className="text-[11px] text-text-light font-medium">কম্পিউটার বা মোবাইল থেকে সরাসরি ছবি নির্বাচন করুন (লোকাল স্টোরেজ নয়, সরাসরি ডাটাবেসে সেভ হবে)</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full text-[10px] font-black">
                    স্বয়ংক্রিয় ইমেজ কম্প্রেশন
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                  {/* Current Avatar Box */}
                  <div className="w-28 h-28 rounded-2xl bg-step-bg border-2 border-border-main overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-10 h-10 text-text-light/50" />
                    )}
                  </div>

                  {/* Dropzone Upload Button */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingProfile(true); }}
                    onDragLeave={() => setIsDraggingProfile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingProfile(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleProfilePhotoFileChange(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => profileFileInputRef.current?.click()}
                    className={`flex-1 w-full p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                      isDraggingProfile ? "border-emerald-500 bg-emerald-500/10" : "border-primary/30 hover:border-primary hover:bg-primary/5 bg-step-bg"
                    }`}
                  >
                    {isUploadingPhoto ? (
                      <div className="flex items-center gap-3 text-primary font-bold text-xs">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>ছবি প্রসেসিং ও ডাটাবেসে আপলোড হচ্ছে...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-7 h-7 text-primary mb-2" />
                        <p className="text-xs font-black text-text-main">এখানে ছবি ড্রাগ করুন অথবা ডিভাইস থেকে ফাইল নির্বাচন করুন</p>
                        <p className="text-[10px] text-text-light font-medium mt-1">সমর্থিত ফরম্যাট: PNG, JPG, WEBP, GIF (সর্বোচ্চ সাইজ অটো-অপটিমাইজড)</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Secondary Option: Manual URL Input */}
                <details className="pt-2 text-xs">
                  <summary className="font-bold text-text-light cursor-pointer hover:text-primary transition-colors inline-flex items-center gap-1">
                    🔗 অথবা ওয়েব পিকচার লিংক (URL) দিয়ে যুক্ত করতে চান?
                  </summary>
                  <div className="mt-3">
                    <input
                      type="url"
                      placeholder="https://example.com/my-photo.jpg"
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-medium text-xs text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </details>
              </div>

              {/* Text Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-text-light block mb-2">পূর্ণ নাম (Full Name)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl font-bold text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-light block mb-2">পদবী / রোল (Designation / Role)</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl font-bold text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-light block mb-2">মোবাইল নম্বর (Mobile Number)</label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl font-bold text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-light block mb-2">ইমেইল ঠিকানা (Email Address)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl font-bold text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-light block mb-2">রক্তের গ্রুপ (Blood Group)</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl font-bold text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-light block mb-2">ঠিকানা (Address)</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl font-bold text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="আপনার বর্তমান ঠিকানা দিন..."
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-light block mb-2">সংক্ষিপ্ত পরিচিতি / বায়ো (Short Bio)</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl font-medium text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="আপনার অভিজ্ঞতা বা পরিচিতি লিখুন..."
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border-main">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-8 py-3.5 bg-step-bg text-text-main rounded-2xl font-bold text-sm hover:bg-border-main transition-all text-center cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-sm shadow-xl hover:bg-primary-dark transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  প্রোফাইল তথ্য ডাটাবেসে সেভ করুন
                </button>
              </div>

            </form>
          )}

        </motion.div>
      )}

      {/* TAB 2: MADRASAH BRANDING & LOGO DIRECT UPLOAD */}
      {activeTab === "branding" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border-main rounded-[2.5rem] p-6 sm:p-10 shadow-xl space-y-8">
          <div className="flex items-center justify-between pb-5 border-b border-border-main">
            <div>
              <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-500" />
                মাদরাসা লোগো ও অফিশিয়াল ব্র্যান্ডিং
              </h2>
              <p className="text-xs text-text-light font-medium mt-1">
                পোর্টালে প্রদর্শিত মাদরাসার নাম, অফিশিয়াল লোগো, ঠিকানা ও অফিশিয়াল সিল/স্ট্যাম্প সরাসরি ডাটাবেসে আপলোড ও পরিবর্তন করুন
              </p>
            </div>
            <span className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl font-black text-xs flex items-center gap-2">
              <Shield className="w-4 h-4" /> অফিশিয়াল পোর্টাল ব্র্যান্ড
            </span>
          </div>

          <form onSubmit={handleBrandingSubmit} className="space-y-8">
            
            {/* DIRECT LOGO FILE UPLOAD DROPZONE */}
            <div className="p-6 bg-amber-500/5 border-2 border-dashed border-amber-500/30 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-text-main">সরাসরি মাদরাসার লোগো ফাইল আপলোড</h3>
                    <p className="text-[11px] text-text-light font-medium">আপনার কম্পিউটার থেকে লোগোর ছবি নির্বাচন করুন (স্বয়ংক্রিয়ভাবে ডাটাবেসে ক্লাউড সেভ হবে)</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-full text-[10px] font-black border border-amber-500/20">
                  লোগো ও রসিদে প্রযোজ্য
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                {/* Logo Preview Box */}
                <div className="w-32 h-32 rounded-2xl bg-white p-3 border-2 border-border-main overflow-hidden shrink-0 shadow-md flex items-center justify-center">
                  {brandingData.logoUrl ? (
                    <img src={brandingData.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <Building className="w-10 h-10 text-text-light/40" />
                  )}
                </div>

                {/* Dropzone Upload Button */}
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleLogoFileChange(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => logoFileInputRef.current?.click()}
                  className={`flex-1 w-full p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                    isDraggingLogo ? "border-amber-500 bg-amber-500/10" : "border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/5 bg-step-bg"
                  }`}
                >
                  {isUploadingLogo ? (
                    <div className="flex items-center gap-3 text-amber-600 font-bold text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>লোগো আপলোড ও ডাটাবেসে সেভ হচ্ছে...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-amber-600 mb-2" />
                      <p className="text-xs font-black text-text-main">মাদরাসার লোগো ড্রাগ করুন অথবা সরাসরি ফাইল চুজ করুন</p>
                      <p className="text-[10px] text-text-light font-medium mt-1">PNG, JPG, SVG, WEBP সাপোর্ট করে</p>
                    </>
                  )}
                </div>
              </div>

              {/* Manual URL Input Fallback */}
              <details className="pt-2 text-xs">
                <summary className="font-bold text-text-light cursor-pointer hover:text-amber-600 transition-colors inline-flex items-center gap-1">
                  🔗 লিঙ্ক (URL) দিয়ে লোগো পরিবর্তন করতে চান?
                </summary>
                <div className="mt-3">
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={brandingData.logoUrl}
                    onChange={(e) => setBrandingData({ ...brandingData, logoUrl: e.target.value })}
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-medium text-xs text-text-main outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </details>
            </div>

            {/* DIRECT STAMP & SIGNATURE FILE UPLOAD BOX */}
            <div className="p-6 bg-step-bg border border-border-main rounded-3xl space-y-4">
              <h3 className="text-xs font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                অফিশিয়াল সিল / ডিজিটাল স্ট্যাম্প আপলোড (প্রত্যয়নপত্র ও রসিদের জন্য)
              </h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-2xl bg-white border border-border-main p-2 flex items-center justify-center overflow-hidden shrink-0">
                  {brandingData.stampUrl ? (
                    <img src={brandingData.stampUrl} alt="Stamp" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-text-light font-bold text-center">স্ট্যাম্প পাওয়া যায়নি</span>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-medium text-text-light">
                    মাদরাসার অফিশিয়াল গোল সিল বা স্ট্যাম্পের স্ক্যান করা ছবি ফাইল সরাসরি আপলোড করুন। এটি ইনভয়েস ও রসিদে প্রদর্শিত হবে।
                  </p>
                  <button
                    type="button"
                    onClick={() => stampFileInputRef.current?.click()}
                    className="px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> স্ট্যাম্প ফাইল আপলোড করুন
                  </button>
                </div>
              </div>
            </div>

            {/* Text Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-text-light block mb-2">মাদরাসার পূর্ণ নাম (Madrasah Name)</label>
                <input
                  type="text"
                  value={brandingData.madrasahName}
                  onChange={(e) => setBrandingData({ ...brandingData, madrasahName: e.target.value })}
                  className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl font-bold text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-light block mb-2">অফিশিয়াল ফোন নম্বর (Official Phone)</label>
                <input
                  type="text"
                  value={brandingData.phone}
                  onChange={(e) => setBrandingData({ ...brandingData, phone: e.target.value })}
                  className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl font-bold text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-text-light block mb-2">মাদরাসার অফিশিয়াল পূর্ণ ঠিকানা (Official Address)</label>
              <input
                type="text"
                value={brandingData.address}
                onChange={(e) => setBrandingData({ ...brandingData, address: e.target.value })}
                className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl font-bold text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-border-main">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-sm shadow-xl hover:bg-primary-dark transition-all flex items-center gap-3 cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                ব্র্যান্ডিং ও লোগো ডাটাবেসে সংরক্ষণ করুন
              </button>
            </div>

          </form>
        </motion.div>
      )}

      {/* TAB 3: SECURITY & ACCESS */}
      {activeTab === "security" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border-main rounded-[2.5rem] p-6 sm:p-10 shadow-xl space-y-8">
          <div className="flex items-center justify-between pb-5 border-b border-border-main">
            <div>
              <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" />
                নিরাপত্তা ও পাসওয়ার্ড পরিবর্তন
              </h2>
              <p className="text-xs text-text-light font-medium mt-1">
                আপনার পাসওয়ার্ড সুরক্ষিত রাখুন এবং সিস্টেমে অ্যাক্সেস পাসওয়ার্ড আপডেট করুন
              </p>
            </div>
            <span className="p-2.5 bg-blue-500/10 text-blue-600 rounded-2xl font-black text-xs flex items-center gap-2">
              <Shield className="w-4 h-4" /> অ্যাডমিন সিকিউরিটি
            </span>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-xl">
            <div>
              <label className="text-xs font-bold text-text-light block mb-2">বর্তমান পাসওয়ার্ড (Current Password)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl font-bold text-sm text-text-main outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-light block mb-2">নতুন পাসওয়ার্ড (New Password)</label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl font-bold text-sm text-text-main outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                placeholder="নতুন পাসওয়ার্ড দিন"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-light block mb-2">পুনরায় নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl font-bold text-sm text-text-main outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                placeholder="নতুন পাসওয়ার্ড রি-টাইপ করুন"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-border-main">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-xl transition-all flex items-center gap-3 cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                পাসওয়ার্ড পরিবর্তন ও সেভ করুন
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* TAB 4: DATABASE MEDIA GALLERY & STORE */}
      {activeTab === "media" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border-main rounded-[2.5rem] p-6 sm:p-10 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-5 border-b border-border-main">
            <div>
              <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                ডাটাবেসে সংরক্ষিত ছবি ও মিডিয়া ফাইল গ্যালারি
              </h2>
              <p className="text-xs text-text-light font-medium mt-1">
                আপনার আপলোড করা প্রোফাইল ছবি, মাদরাসার লোগো এবং স্ট্যাম্পসমূহ সরাসরি ডাটাবেসে সংরক্ষিত আছে
              </p>
            </div>
            <button
              onClick={() => profileFileInputRef.current?.click()}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" /> নতুন ছবি আপলোড করুন
            </button>
          </div>

          {mediaAssets.length === 0 ? (
            <div className="p-12 text-center bg-step-bg rounded-3xl border border-dashed border-border-main space-y-3">
              <ImageIcon className="w-12 h-12 text-text-light/40 mx-auto" />
              <h3 className="text-sm font-black text-text-main">এখনো কোনো ছবি ফাইল গ্যালারিতে আপলোড হয়নি</h3>
              <p className="text-xs text-text-light max-w-md mx-auto">
                উপরে 'ব্যক্তিগত প্রোফাইল' অথবা 'মাদরাসা লোগো' ট্যাব থেকে নতুন ছবি আপলোড করলে তা স্বয়ংক্রিয়ভাবে ডাটাবেসের এই মিডিয়া গ্যালারিতে সংরক্ষিত হয়ে থাকবে।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mediaAssets.map((asset) => (
                <div key={asset.id} className="bg-step-bg border border-border-main rounded-3xl p-4 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-all shadow-sm group">
                  <div className="w-full h-40 bg-white rounded-2xl overflow-hidden relative border border-border-main/50 flex items-center justify-center p-2">
                    <img src={asset.url} alt={asset.title} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => setPreviewMediaModal(asset)}
                        className="p-2.5 bg-white text-slate-900 rounded-xl shadow-lg hover:scale-110 transition-transform cursor-pointer"
                        title="পূর্ণ ভিউ দেখুন"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMediaAsset(asset.id)}
                        className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform cursor-pointer"
                        title="ডাটাবেস থেকে মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-text-main truncate">{asset.title}</h4>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-text-light font-medium">
                      <span className="capitalize px-2 py-0.5 bg-primary/10 text-primary rounded-md font-bold">{asset.category}</span>
                      <span>{asset.fileSize || 'Base64 DB'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* FULL IMAGE PREVIEW MODAL */}
      <AnimatePresence>
        {previewMediaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card border border-border-main rounded-3xl p-6 max-w-2xl w-full space-y-4 relative shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-main">
                <h3 className="text-sm font-black text-text-main">{previewMediaModal.title}</h3>
                <button
                  onClick={() => setPreviewMediaModal(null)}
                  className="p-1.5 bg-step-bg hover:bg-border-main rounded-xl text-text-main transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-hidden flex items-center justify-center bg-slate-900 rounded-2xl p-4">
                <img src={previewMediaModal.url} alt="" className="max-h-[50vh] max-w-full object-contain" />
              </div>

              <div className="flex justify-between items-center text-xs text-text-light pt-2">
                <span>সংরক্ষণ তারিখ: {new Date(previewMediaModal.createdAt).toLocaleDateString('bn-BD')}</span>
                <button
                  onClick={() => setPreviewMediaModal(null)}
                  className="px-5 py-2 bg-primary text-white rounded-xl font-bold"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
