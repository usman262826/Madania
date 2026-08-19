import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Save, User, BookOpen, Phone, MapPin, Hash, Camera, Upload, Shield, Calendar, Heart, FileText, Layers } from 'lucide-react';
import { Student } from '../../types';
import { useData } from '../../contexts/DataContext';
import { JAMAT_LIST, BLOOD_GROUPS, STUDENT_STATUS_LIST } from '../../constants';
import { getActiveBranches, enToBnNumber, normalizeStudentRecord } from '../../lib/utils';
import { processAndCompressImage } from '../../utils/imageUtils';
import toast from 'react-hot-toast';

interface StudentEditModalProps {
  student: Student;
  onClose: () => void;
}

export const StudentEditModal: React.FC<StudentEditModalProps> = ({ student, onClose }) => {
  const { updateData, branches, jamatList } = useData();
  const [formData, setFormData] = useState<any>({});
  const [originalId, setOriginalId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const activeBranches = useMemo(() => {
    return getActiveBranches(branches);
  }, [branches]);

  const availableJamats = useMemo(() => {
    return (jamatList && jamatList.length > 0) ? jamatList : JAMAT_LIST;
  }, [jamatList]);

  useEffect(() => {
    if (student) {
      const sId = String(student['রেজিস্ট্রেশন/আইডি নম্বর'] || student['রেজিস্ট্রেশন/আইডি'] || student.id || student.studentId || '').trim();
      setOriginalId(sId);
      setFormData({
        'রেজিস্ট্রেশন/আইডি নম্বর': sId,
        'শিক্ষার্থীর নাম': student['শিক্ষার্থীর নাম'] || student.name || '',
        'পিতার নাম': student['পিতার নাম'] || student.father || student.fatherName || '',
        'মাতার নাম': student['মাতার নাম'] || student.mother || student.motherName || '',
        'অভিভাবকের মোবাইল': student['অভিভাবকের মোবাইল'] || student['মোবাইল (মা)'] || student['মোবাইল (বাবা/ভাই)'] || student.mobile || student.phone || '',
        'বিকল্প মোবাইল': student['বিকল্প মোবাইল'] || student.altMobile || '',
        'জামাত/শ্রেণী': student['জামাত/শ্রেণী'] || student['জামাত'] || student.class || '',
        'শাখা': student['শাখা'] || student.branch || 'ক',
        'রোল নম্বর': student['রোল নম্বর'] || student.roll || '',
        'শিক্ষার্থী ধরণ/স্ট্যাটাস': student['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || student['শিক্ষার্থী ধরণ'] || student.residentialStatus || student.status || 'আবাসিক',
        'রক্তের গ্রুপ': student['রক্তের গ্রুপ'] || student.bloodGroup || '',
        'জন্ম তারিখ': student['জন্ম তারিখ'] || student.dob || '',
        'জন্ম নিবন্ধন সনদ নম্বর': student['জন্ম নিবন্ধন সনদ নম্বর'] || student['জন্ম নিবন্ধন নাম্বার'] || student['জন্ম নিবন্ধন'] || student['জন্ম নিবন্ধন নম্বর'] || student['এনআইডি/জন্ম সনদ'] || student.birthReg || student.birthRegNo || '',
        'ঠিকানা': student['ঠিকানা'] || student['স্থায়ী ঠিকানা'] || student['বর্তমান ঠিকানা'] || student.address || '',
        'মাসিক বেতন ফি': student['মাসিক বেতন ফি'] || student['মাসিক বেতন'] || student['মাসিক ফি'] || student.tuitionFee || '',
        'খোরাকী ফি': student['খোরাকী ফি'] || student['খোরাকী'] || student.khorakiFee || '',
        'RFID কার্ড': student['RFID কার্ড'] || student.rfid || '',
        photoUrl: student.photoUrl || student['ছবি'] || student['ছবি_ইউআরএল'] || '',
        admissionDate: student.admissionDate || student['ভর্তির তারিখ'] || student.created_at || ''
      });
    }
  }, [student]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const { dataUrl } = await processAndCompressImage(e.target.files[0], 500, 500, 0.85);
        handleChange('photoUrl', dataUrl);
        toast.success('ছবি সফলভাবে আপলোড হয়েছে!');
      } catch (err) {
        console.error('Image compression error:', err);
        toast.error('ছবি প্রসেস করতে ব্যর্থ হয়েছে');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentId = String(formData['রেজিস্ট্রেশন/আইডি নম্বর'] || originalId || '').trim();
    if (!currentId) {
      toast.error('শিক্ষার্থীর আইডি বা রেজিস্ট্রেশন নম্বর বাধ্যতামূলক');
      return;
    }

    if (!formData['শিক্ষার্থীর নাম']?.trim()) {
      toast.error('শিক্ষার্থীর নাম প্রদান করুন');
      return;
    }

    setIsSaving(true);
    try {
      const updatedPayload: Student = {
        ...student,
        ...formData,
        id: currentId,
        'রেজিস্ট্রেশন/আইডি নম্বর': currentId,
        'রেজিস্ট্রেশন/আইডি': currentId,
        name: formData['শিক্ষার্থীর নাম'],
        'শিক্ষার্থীর নাম': formData['শিক্ষার্থীর নাম'],
        fatherName: formData['পিতার নাম'],
        'পিতার নাম': formData['পিতার নাম'],
        motherName: formData['মাতার নাম'],
        'মাতার নাম': formData['মাতার নাম'],
        mobile: formData['অভিভাবকের মোবাইল'],
        'অভিভাবকের মোবাইল': formData['অভিভাবকের মোবাইল'],
        altMobile: formData['বিকল্প মোবাইল'],
        'বিকল্প মোবাইল': formData['বিকল্প মোবাইল'],
        class: formData['জামাত/শ্রেণী'],
        'জামাত/শ্রেণী': formData['জামাত/শ্রেণী'],
        branch: formData['শাখা'],
        'শাখা': formData['শাখা'],
        roll: formData['রোল নম্বর'],
        'রোল নম্বর': formData['রোল নম্বর'],
        status: formData['শিক্ষার্থী ধরণ/স্ট্যাটাস'],
        'শিক্ষার্থী ধরণ/স্ট্যাটাস': formData['শিক্ষার্থী ধরণ/স্ট্যাটাস'],
        bloodGroup: formData['রক্তের গ্রুপ'],
        'রক্তের গ্রুপ': formData['রক্তের গ্রুপ'],
        dob: formData['জন্ম তারিখ'],
        'জন্ম তারিখ': formData['জন্ম তারিখ'],
        birthRegNo: formData['জন্ম নিবন্ধন সনদ নম্বর'],
        'জন্ম নিবন্ধন সনদ নম্বর': formData['জন্ম নিবন্ধন সনদ নম্বর'],
        'জন্ম নিবন্ধন নাম্বার': formData['জন্ম নিবন্ধন সনদ নম্বর'],
        'জন্ম নিবন্ধন': formData['জন্ম নিবন্ধন সনদ নম্বর'],
        'জন্ম নিবন্ধন নম্বর': formData['জন্ম নিবন্ধন সনদ নম্বর'],
        'এনআইডি/জন্ম সনদ': formData['জন্ম নিবন্ধন সনদ নম্বর'],
        address: formData['ঠিকানা'],
        'ঠিকানা': formData['ঠিকানা'],
        tuitionFee: Number(formData['মাসিক বেতন ফি']) || 0,
        'মাসিক বেতন': Number(formData['মাসিক বেতন ফি']) || 0,
        'মাসিক ফি': Number(formData['মাসিক বেতন ফি']) || 0,
        khorakiFee: Number(formData['খোরাকী ফি']) || 0,
        'খোরাকী': Number(formData['খোরাকী ফি']) || 0,
        'খোরাকী ফি': Number(formData['খোরাকী ফি']) || 0,
        rfid: formData['RFID কার্ড'],
        'RFID কার্ড': formData['RFID কার্ড'],
        photoUrl: formData.photoUrl || ''
      };

      // Pass originalId so DataContext can replace old key if ID was edited
      await updateData('students', updatedPayload, originalId || currentId);
      
      toast.success('শিক্ষার্থীর সকল তথ্য ডাটাবেজে সফলভাবে আপডেট হয়েছে!');
      onClose();
    } catch (err: any) {
      console.error('Update student error:', err);
      toast.error('তথ্য সংরক্ষণ করতে ব্যর্থ হয়েছে: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs select-none font-hind-siliguri overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-card border border-border-main shadow-2xl rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col text-left overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-border-main bg-step-bg/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-text-main leading-tight flex items-center gap-2">
                শিক্ষার্থী তথ্য সংশোধন ও হালনাগাদ
              </h3>
              <p className="text-[11px] font-bold text-text-light/65">
                আইডি: #{enToBnNumber(originalId)} | {formData['শিক্ষার্থীর নাম'] || 'শিক্ষার্থী'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-step-bg text-text-light hover:text-text-main rounded-xl border border-transparent hover:border-border-main transition-all cursor-pointer"
          >
            <X size={19} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* Photo & Core Identifiers Banner */}
          <div className="p-4 bg-primary/5 border border-primary/15 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-step-bg border-2 border-dashed border-primary/30 overflow-hidden flex items-center justify-center shadow-inner">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-primary/40" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 p-2 bg-primary text-white rounded-xl shadow-md cursor-pointer hover:bg-primary-dark transition-all">
                <Camera size={13} />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-md">
                শিক্ষার্থী প্রোফাইল এডিটর
              </span>
              <h4 className="text-sm font-black text-text-main">
                শিক্ষার্থীর সকল ব্যক্তিগত, প্রাতিষ্ঠানিক ও আর্থিক তথ্য পরিবর্তনযোগ্য
              </h4>
              <p className="text-[11px] text-text-light/60">
                প্রয়োজনে রেজিস্ট্রেশন নাম্বার, রোল নম্বর, জামাত ও ফি কাঠামো যেকোনো সময় সংশোধন করতে পারবেন।
              </p>
            </div>
          </div>

          {/* 1. Institutional Identity (আইডি ও রোল নম্বর) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-wider">
              <Hash size={14} />
              <span>প্রাতিষ্ঠানিক পরিচিতি ও আইডি (Registration & Roll)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">রেজিস্ট্রেশন / আইডি নম্বর *</label>
                <input 
                  type="text"
                  required
                  placeholder="যেমন: 2026101"
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none text-primary focus:border-primary focus:ring-2 focus:ring-primary/15"
                  value={formData['রেজিস্ট্রেশন/আইডি নম্বর'] || ''}
                  onChange={e => handleChange('রেজিস্ট্রেশন/আইডি নম্বর', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">রোল নম্বর *</label>
                <input 
                  type="text"
                  required
                  placeholder="যেমন: ০১"
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none text-text-main focus:border-primary"
                  value={formData['রোল নম্বর'] || ''}
                  onChange={e => handleChange('রোল নম্বর', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">RFID কার্ড নম্বর</label>
                <input 
                  type="text"
                  maxLength={16}
                  placeholder="১২ ডিজিট RFID স্ক্যান"
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-mono font-bold outline-none text-text-main focus:border-primary"
                  value={formData['RFID কার্ড'] || ''}
                  onChange={e => handleChange('RFID কার্ড', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 2. Academic Enrollment (জামাত, শাখা ও আবাসন) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-wider">
              <BookOpen size={14} />
              <span>একাডেমিক বিভাগ ও আবাসন (Academic & Branch)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">জামাত / শ্রেণী *</label>
                <select 
                  required
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary cursor-pointer font-hind-siliguri"
                  value={formData['জামাত/শ্রেণী'] || ''}
                  onChange={e => handleChange('জামাত/শ্রেণী', e.target.value)}
                >
                  <option value="">জামাত নির্বাচন করুন</option>
                  {availableJamats.map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">শাখা / সেকশন</label>
                <select 
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary cursor-pointer font-hind-siliguri"
                  value={formData['শাখা'] || 'ক'}
                  onChange={e => handleChange('শাখা', e.target.value)}
                >
                  {activeBranches.length > 0 ? (
                    activeBranches.map(b => (
                      <option key={typeof b === 'string' ? b : (b as any).name} value={typeof b === 'string' ? b : (b as any).name}>
                        শাখা: {typeof b === 'string' ? b : (b as any).name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="ক">শাখা: ক</option>
                      <option value="খ">শাখা: খ</option>
                      <option value="গ">শাখা: গ</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">শিক্ষার্থীর অবস্থা বা ধরণ *</label>
                <select 
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary cursor-pointer font-hind-siliguri"
                  value={formData['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || STUDENT_STATUS_LIST[3]}
                  onChange={e => handleChange('শিক্ষার্থী ধরণ/স্ট্যাটাস', e.target.value)}
                >
                  {STUDENT_STATUS_LIST.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Personal & Guardian Info (ব্যক্তিগত ও অভিভাবকের তথ্য) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-wider">
              <User size={14} />
              <span>শিক্ষার্থী ও অভিভাবকের তথ্য (Personal & Guardian)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">শিক্ষার্থীর পূর্ণ নাম *</label>
                <input 
                  type="text"
                  required
                  placeholder="বাংলায় নাম লিখুন..."
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary"
                  value={formData['শিক্ষার্থীর নাম'] || ''}
                  onChange={e => handleChange('শিক্ষার্থীর নাম', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">অভিভাবকের প্রধান মোবাইল নম্বর *</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light/40" />
                  <input 
                    type="text"
                    required
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary"
                    value={formData['অভিভাবকের মোবাইল'] || ''}
                    onChange={e => handleChange('অভিভাবকের মোবাইল', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">পিতার নাম</label>
                <input 
                  type="text"
                  placeholder="পিতার নাম লিখুন..."
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary"
                  value={formData['পিতার নাম'] || ''}
                  onChange={e => handleChange('পিতার নাম', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">মাতার নাম</label>
                <input 
                  type="text"
                  placeholder="মাতার নাম লিখুন..."
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary"
                  value={formData['মাতার নাম'] || ''}
                  onChange={e => handleChange('মাতার নাম', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">বিকল্প মোবাইল নম্বর</label>
                <input 
                  type="text"
                  placeholder="জরুরী যোগাযোগের জন্য"
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary"
                  value={formData['বিকল্প মোবাইল'] || ''}
                  onChange={e => handleChange('বিকল্প মোবাইল', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">রক্তের গ্রুপ</label>
                <select 
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary cursor-pointer font-hind-siliguri"
                  value={formData['রক্তের গ্রুপ'] || ''}
                  onChange={e => handleChange('রক্তের গ্রুপ', e.target.value)}
                >
                  <option value="">রক্তের গ্রুপ নির্বাচন করুন</option>
                  {(BLOOD_GROUPS || ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']).map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">জন্ম তারিখ</label>
                <input 
                  type="date"
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary"
                  value={formData['জন্ম তারিখ'] || ''}
                  onChange={e => handleChange('জন্ম তারিখ', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">জন্ম নিবন্ধন সনদ / NID</label>
                <input 
                  type="text"
                  placeholder="জন্ম সনদ নম্বর"
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary"
                  value={formData['জন্ম নিবন্ধন সনদ নম্বর'] || ''}
                  onChange={e => handleChange('জন্ম নিবন্ধন সনদ নম্বর', e.target.value)}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-black text-text-main">স্থায়ী / বর্তমান ঠিকানা</label>
                <input 
                  type="text"
                  placeholder="গ্রাম, ডাকঘর, উপজেলা/থানা, জেলা..."
                  className="w-full px-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none text-text-main focus:border-primary"
                  value={formData['ঠিকানা'] || ''}
                  onChange={e => handleChange('ঠিকানা', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 4. Financial Structure (মাসিক বেতন ও খোরাকী ফি) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-wider">
              <span>৳</span>
              <span>নির্ধারিত ফি কাঠামো (Fee Structure)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">নির্ধারিত মাসিক বেতন ফি (৳)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-primary">৳</span>
                  <input 
                    type="number"
                    placeholder="যেমন: 500"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none text-text-main focus:border-primary"
                    value={formData['মাসিক বেতন ফি'] !== undefined ? formData['মাসিক বেতন ফি'] : ''}
                    onChange={e => handleChange('মাসিক বেতন ফি', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-text-main">নির্ধারিত খোরাকী ফি (৳)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-amber-500">৳</span>
                  <input 
                    type="number"
                    placeholder="যেমন: 2000"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-black outline-none text-text-main focus:border-primary"
                    value={formData['খোরাকী ফি'] !== undefined ? formData['খোরাকী ফি'] : ''}
                    onChange={e => handleChange('খোরাকী ফি', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions Footer inside modal */}
          <div className="flex gap-3 pt-4 border-t border-border-main">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 bg-step-bg hover:bg-card border border-border-main text-text-main rounded-xl font-black text-xs cursor-pointer transition-all active:scale-98"
            >
              বাতিল
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-2 py-3 bg-primary hover:bg-primary-light text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20 transition-all active:scale-98 disabled:opacity-50"
            >
              <Save size={15} />
              <span>{isSaving ? 'সংরক্ষণ করা হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
