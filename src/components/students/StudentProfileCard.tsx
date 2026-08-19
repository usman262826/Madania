import React, { useState, useRef, useMemo } from 'react';
import { Student } from '../../types';
import { enToBnNumber, cn, getActiveBranches } from '../../lib/utils';
import { useData } from '../../contexts/DataContext';
import { JAMAT_LIST, STUDENT_STATUS_LIST } from '../../constants';
import { 
  FileText, Printer, X, User, BookOpen, Phone, 
  CreditCard, Award, Calendar, CheckCircle2, XCircle, Clock,
  QrCode, Compass, ExternalLink, Hash, Copy, Mail, Heart, Bookmark, Shield, IdCard, Users, Check, Edit
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface StudentProfileCardProps {
  student: Student;
  onClose?: () => void;
  isModal?: boolean;
}

export const StudentProfileCard: React.FC<StudentProfileCardProps> = ({ student: propStudent, onClose, isModal = true }) => {
  const { invoices, studentOverrides, updateData, deleteData } = useData();
  const [activeTab, setActiveTab] = useState<'basic' | 'academic' | 'contact' | 'digital' | 'fees' | 'results' | 'attendance'>('basic');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const activeBranches = useMemo(() => getActiveBranches(), []);

  const student = useMemo(() => {
    const sId = propStudent['রেজিস্ট্রেশন/আইডি নম্বর'] || propStudent.id || '';
    if (sId && studentOverrides[sId]) {
      return { ...propStudent, ...studentOverrides[sId] };
    }
    return propStudent;
  }, [propStudent, studentOverrides]);

  const overdueInfo = useMemo(() => {
    const sId = String(student['রেজিস্ট্রেশন/আইডি নম্বর'] || student.id || '').trim();
    if (!sId) return { count: 0, totalDue: 0 };
    let due = 0;
    let count = 0;
    if (Array.isArray(invoices)) {
      invoices.forEach((inv: any) => {
        if (String(inv.studentId).trim() === sId) {
          const d = Number(inv.dueAmount) || Number(inv.due) || 0;
          if (d > 0 || inv.status === 'due' || inv.status === 'partial' || inv.status === 'বকেয়া') {
            due += d;
            count++;
          }
        }
      });
    }
    return { count, totalDue: due };
  }, [student, invoices]);

  const handleNavigate = (tab: string) => {
    window.dispatchEvent(new CustomEvent('navigate-tab', { 
      detail: { 
        tab, 
        studentId: student['রেজিস্ট্রেশন/আইডি নম্বর'] || student.id || '' 
      } 
    }));
    if (onClose) onClose();
  };

  // 1. Fetch persistent student fees
  const studentFees = useMemo(() => {
    try {
      const saved = localStorage.getItem('madrasah-student-fees-db');
      const allFees = saved ? JSON.parse(saved) : [];
      const sId = String(student['রেজিস্ট্রেশন/আইডি নম্বর'] || student.id || '').trim();
      return allFees.filter((f: any) => String(f.studentId).trim() === sId);
    } catch (e) {
      console.error('Error fetching student fees:', e);
      return [];
    }
  }, [student]);

  // 2. Fetch persistent student exam marks
  const studentMarks = useMemo(() => {
    try {
      const saved = localStorage.getItem('madrasah-student-marks-db');
      const marksDb = saved ? JSON.parse(saved) : {};
      const results: Array<{ examName: string; written: string; oral: string; total: number; grade: string }> = [];
      
      const sId = String(student['রেজিস্ট্রেশন/আইডি নম্বর'] || student.id || '').trim();
      const sIdAlt = String(student.id || '').trim();

      // marksDb structure: { "ExamName_ClassName": { "studentId": { written, oral } } }
      Object.entries(marksDb).forEach(([key, value]: [string, any]) => {
        const parts = key.split('_');
        const examName = parts[0];
        const studentRecord = value[sId] || value[sIdAlt];
        if (studentRecord) {
          const wr = parseInt(studentRecord.written || '0') || 0;
          const or = parseInt(studentRecord.oral || '0') || 0;
          const tot = wr + or;
          const grade = tot >= 80 ? 'মুমতাজ (A+)' : tot >= 60 ? 'জায়্যিদ জিদ্দান (A)' : tot >= 45 ? 'জায়্যিদ (B)' : tot >= 33 ? 'মাকবুল (C)' : 'রাসেব (F)';
          results.push({ examName, written: String(wr), oral: String(or), total: tot, grade });
        }
      });
      return results;
    } catch (e) {
      console.error('Error fetching student marks:', e);
      return [];
    }
  }, [student]);

  // 3. Fetch persistent student attendance history
  const studentAttendance = useMemo(() => {
    try {
      const saved = localStorage.getItem('madrasah-student-attendance-db');
      const attendanceDb = saved ? JSON.parse(saved) : {};
      const history: Array<{ date: string; status: 'present' | 'absent' | 'late' }> = [];
      
      const sId = String(student['রেজিস্ট্রেশন/আইডি নম্বর'] || student.id || '').trim();
      const sIdAlt = String(student.id || '').trim();

      // attendanceDb structure: { "dateString": { "studentId": "present"|"absent"|"late" } }
      Object.entries(attendanceDb).forEach(([date, records]: [string, any]) => {
        const status = records[sId] || records[sIdAlt];
        if (status) {
          history.push({ date, status });
        }
      });
      return history.sort((a, b) => b.date.localeCompare(a.date));
    } catch (e) {
      console.error('Error fetching student attendance:', e);
      return [];
    }
  }, [student]);

  // Calculate Attendance Stats
  const attendanceStats = useMemo(() => {
    const total = studentAttendance.length;
    if (total === 0) return { present: 0, absent: 0, late: 0, percentage: 100 };
    const present = studentAttendance.filter(a => a.status === 'present').length;
    const absent = studentAttendance.filter(a => a.status === 'absent').length;
    const late = studentAttendance.filter(a => a.status === 'late').length;
    const percentage = Math.round(((present + late * 0.5) / total) * 100);
    return { present, absent, late, percentage };
  }, [studentAttendance]);

  const handleExportPDF = () => {
    const element = printAreaRef.current;
    if (!element) return;
    
    const opt: any = {
      margin:       15, // margin in mm
      filename:     `Student_Profile_${student['রেজিস্ট্রেশন/আইডি নম্বর'] || student.id || 'export'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(element).set(opt).save();
  };

  const handleDeleteInProfile = async () => {
    const sId = student['রেজিস্ট্রেশন/আইডি নম্বর'] || student.id || '';
    const sName = student['শিক্ষার্থীর নাম'] || student.name || '';
    if (window.confirm(`আপনি কি নিশ্চিতভাবে "${sName}"-এর সকল তথ্য পুরো ডাটাবেস থেকে ডিলিট করতে চান? এই কাজ পুনরায় ফিরিয়ে আনা সম্ভব নয়!`)) {
      await deleteData('students', String(sId));
      window.dispatchEvent(new Event('student_data_updated'));
      if (onClose) onClose();
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedData) return;
    const sId = student['রেজিস্ট্রেশন/আইডি নম্বর'] || student.id || '';
    if (!sId) return;

    const sClass = editedData['জামাত/শ্রেণী'] || editedData.class || '';
    const sBranch = editedData['শাখা'] || editedData.branch || 'ক';
    const inputFee = Number(editedData.tuitionFee) || 0;
    const inputKhoraki = Number(editedData.khorakiFee) || 0;

    const updatedStudentData: any = {
      ...student,
      'শিক্ষার্থীর নাম': editedData['শিক্ষার্থীর নাম'] || editedData.name,
      'পিতার নাম': editedData['পিতার নাম'] || editedData.fatherName,
      'মাতার নাম': editedData['মাতার নাম'] || editedData.motherName,
      'অভিভাবকের মোবাইল': editedData['অভিভাবকের মোবাইল'] || editedData.mobile,
      'জামাত/শ্রেণী': sClass,
      'রোল নম্বর': editedData['রোল নম্বর'] || editedData.roll,
      'শাখা': sBranch,
      branch: sBranch,
      'শিক্ষার্থী ধরণ/স্ট্যাটাস': editedData['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || 'চলমান শিক্ষার্থী',
      rfid: editedData.rfid || '',
      'জন্ম তারিখ': editedData['জন্ম তারিখ'] || '',
      'জন্ম নিবন্ধন নাম্বার': editedData['জন্ম নিবন্ধন নাম্বার'] || '',
      'রক্তের গ্রুপ': editedData['রক্তের গ্রুপ'] || '',
      'ঠিকানা': editedData['ঠিকানা'] || '',
      tuitionFee: inputFee,
      'মাসিক বেতন': inputFee,
      'মাসিক ফি': inputFee,
      khorakiFee: inputKhoraki,
      'খোরাকী': inputKhoraki,
      'খোরাকী ফি': inputKhoraki
    };

    await updateData('students', updatedStudentData, String(sId));
    await updateData('acad_student_overrides', { id: String(sId), tuitionFee: inputFee, khorakiFee: inputKhoraki }, String(sId));
    setIsEditing(false);
    
    // Dispatch custom event
    window.dispatchEvent(new Event('student_data_updated'));
    if (onClose) onClose();
  };

  const tabs = [
    { id: 'basic', label: 'প্রাথমিক', icon: User },
    { id: 'academic', label: 'একাডেমিক', icon: BookOpen },
    { id: 'contact', label: 'যোগাযোগ', icon: Phone },
    { id: 'digital', label: 'ডিজিটাল যাচাই', icon: QrCode },
    { id: 'fees', label: 'বেতন ও ফি', icon: CreditCard },
    { id: 'results', label: 'পরীক্ষার ফলাফল', icon: Award },
    { id: 'attendance', label: 'উপস্থিতি', icon: Calendar },
  ];

  const screenContent = (
    <div className={cn("bg-card w-full rounded-[2.5rem] p-6 sm:p-8 border border-border-main shadow-2xl relative max-h-[90vh] overflow-y-auto print:hidden font-hind-siliguri", isModal ? "max-w-4xl" : "h-full")}>
      {isModal && onClose && (
        <button onClick={onClose} className="absolute top-6 right-6 p-2.5 bg-step-bg rounded-full hover:bg-error/10 text-text-main hover:text-error transition-all cursor-pointer border border-border-main/55">
          <X size={18}/>
        </button>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-border-main/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-text-light/50">Student Profile Summary</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">শিক্ষার্থী ব্যবস্থাপনা প্রোফাইল</h2>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleExportPDF} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-xs hover:bg-indigo-500/20 transition-all border border-indigo-500/20 cursor-pointer"
          >
              <FileText size={16} /> PDF ডাউনলোড
          </button>
          <button 
            onClick={() => window.print()} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-primary/10 text-primary rounded-xl font-black text-xs hover:bg-primary/20 transition-all border border-primary/20 cursor-pointer"
          >
              <Printer size={16} /> প্রোফাইল প্রিন্ট
          </button>
          <button 
            onClick={() => {
              setEditedData({
                name: student['শিক্ষার্থীর নাম'] || student.name || '',
                'শিক্ষার্থীর নাম': student['শিক্ষার্থীর নাম'] || student.name || '',
                mobile: student['অভিভাবকের মোবাইল'] || student.mobile || '',
                'অভিভাবকের মোবাইল': student['অভিভাবকের মোবাইল'] || student.mobile || '',
                class: student['জামাত/শ্রেণী'] || student.class || '',
                'জামাত/শ্রেণী': student['জামাত/শ্রেণী'] || student.class || '',
                roll: student['রোল নম্বর'] || student.roll || '',
                'রোল নম্বর': student['রোল নম্বর'] || student.roll || '',
                branch: student['শাখা'] || student.branch || 'ক',
                'শাখা': student['শাখা'] || student.branch || 'ক',
                'শিক্ষার্থী ধরণ/স্ট্যাটাস': student['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || student['স্ট্যাটাস'] || 'চলমান শিক্ষার্থী',
                tuitionFee: studentOverrides[student['রেজিস্ট্রেশন/আইডি নম্বর'] || student.id || '']?.tuitionFee || '',
                fatherName: student['পিতার নাম'] || student.fatherName || '',
                'পিতার নাম': student['পিতার নাম'] || student.fatherName || '',
                motherName: student['মাতার নাম'] || student.motherName || '',
                'মাতার নাম': student['মাতার নাম'] || student.motherName || '',
                rfid: student.rfid || '',
                'জন্ম তারিখ': student['জন্ম তারিখ'] || student.dob || '',
                'জন্ম নিবন্ধন নাম্বার': student['জন্ম নিবন্ধন নাম্বার'] || student['জন্ম নিবন্ধন/NID নং'] || student.birthReg || '',
                'রক্তের গ্রুপ': student['রক্তের গ্রুপ'] || student.bloodGroup || '',
                'ঠিকানা': student['ঠিকানা'] || student.address || '',
              });
              setIsEditing(true);
            }} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl font-black text-xs hover:bg-amber-500/20 transition-all border border-amber-500/20 cursor-pointer animate-fade-in"
          >
              <Edit size={16} /> তথ্য সংশোধন
          </button>
        </div>
      </div>

      {/* Automated Overdue Fee Warning Banner */}
      {overdueInfo.totalDue > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-600 dark:text-rose-400 font-hind-siliguri">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 font-black">
              ⚠️
            </div>
            <div>
              <h4 className="text-sm font-black flex items-center gap-2">
                বকেয়া ফি সতর্কতা (Automated Past Due Alert)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">জরুরি</span>
              </h4>
              <p className="text-xs font-bold text-rose-600/90 dark:text-rose-300">
                এই শিক্ষার্থীর সর্বমোট <span className="font-black underline">৳ {enToBnNumber(overdueInfo.totalDue.toString())}</span> টাকা ফি বকেয়া রয়েছে ({enToBnNumber(overdueInfo.count.toString())} টি ইনভয়েস)।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleNavigate('student-fees')}
            className="w-full sm:w-auto px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700 transition-all cursor-pointer shadow-md shadow-rose-600/20 shrink-0 flex items-center justify-center gap-1.5"
          >
            <CreditCard size={14} /> ফি পরিশোধ করুণ ➔
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="bg-step-bg/35 border border-border-main p-6 sm:p-8 rounded-3xl min-h-[250px] animate-fade-in text-left">
          <form onSubmit={handleSaveEdit} className="space-y-6 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">শিক্ষার্থীর নাম *</label>
                <input 
                  type="text"
                  required
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-sm outline-none text-text-main"
                  value={editedData['শিক্ষার্থীর নাম'] || ''}
                  onChange={(e) => setEditedData({...editedData, name: e.target.value, 'শিক্ষার্থীর নাম': e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">অভিভাবকের মোবাইল নম্বর *</label>
                <input 
                  type="text"
                  required
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-sm outline-none text-text-main"
                  value={editedData['অভিভাবকের মোবাইল'] || ''}
                  onChange={(e) => setEditedData({...editedData, mobile: e.target.value, 'অভিভাবকের মোবাইল': e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">জামাত/শ্রেণী *</label>
                <select 
                  required
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-sm font-bold outline-none cursor-pointer text-text-main font-hind-siliguri"
                  value={editedData['জামাত/শ্রেণী'] || ''}
                  onChange={(e) => setEditedData({...editedData, class: e.target.value, 'জামাত/শ্রেণী': e.target.value})}
                >
                  <option value="" disabled>জামাত নির্বাচন করুন</option>
                  {JAMAT_LIST.map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">শিক্ষার্থীর বর্তমান অবস্থা *</label>
                <select 
                  required
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-sm font-bold outline-none cursor-pointer text-text-main font-hind-siliguri"
                  value={editedData['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || STUDENT_STATUS_LIST[3]}
                  onChange={(e) => setEditedData({...editedData, 'শিক্ষার্থী ধরণ/স্ট্যাটাস': e.target.value})}
                >
                  {STUDENT_STATUS_LIST.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">রোল নম্বর *</label>
                <input 
                  type="text"
                  required
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-sm outline-none text-text-main"
                  value={editedData['রোল নম্বর'] || ''}
                  onChange={(e) => setEditedData({...editedData, roll: e.target.value, 'রোল নম্বর': e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">শাখা</label>
                <select 
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-sm font-bold outline-none cursor-pointer text-text-main font-hind-siliguri"
                  value={editedData['শাখা'] || 'ক'}
                  onChange={(e) => setEditedData({...editedData, branch: e.target.value, 'শাখা': e.target.value})}
                >
                  {activeBranches.map(b => (
                    <option key={b} value={b}>শাখা: {b}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">ব্যক্তিগত বেতন (৳ Override)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-light/40">৳</span>
                  <input 
                    type="number"
                    placeholder="ডিফল্ট বেতন"
                    className="w-full pl-8 pr-4 py-3 bg-step-bg border border-border-main rounded-xl font-black text-sm outline-none text-text-main"
                    value={editedData.tuitionFee || ''}
                    onChange={(e) => setEditedData({...editedData, tuitionFee: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">পিতার নাম</label>
                <input 
                  type="text"
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-sm outline-none text-text-main"
                  value={editedData['পিতার নাম'] || ''}
                  onChange={(e) => setEditedData({...editedData, fatherName: e.target.value, 'পিতার নাম': e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">মাতার নাম</label>
                <input 
                  type="text"
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-sm outline-none text-text-main"
                  value={editedData['মাতার নাম'] || ''}
                  onChange={(e) => setEditedData({...editedData, motherName: e.target.value, 'মাতার নাম': e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">জন্ম তারিখ</label>
                <input 
                  type="text"
                  placeholder="DD/MM/YYYY"
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-sm outline-none text-text-main"
                  value={editedData['জন্ম তারিখ'] || ''}
                  onChange={(e) => setEditedData({...editedData, 'জন্ম তারিখ': e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">জন্ম নিবন্ধন নাম্বার</label>
                <input 
                  type="text"
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-sm outline-none text-text-main"
                  value={editedData['জন্ম নিবন্ধন নাম্বার'] || ''}
                  onChange={(e) => setEditedData({...editedData, 'জন্ম নিবন্ধন নাম্বার': e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">RFID কার্ড নাম্বার</label>
                <input 
                  type="text"
                  maxLength={12}
                  placeholder="RFID কার্ড নাম্বার"
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold font-mono text-sm outline-none text-text-main"
                  value={editedData.rfid || ''}
                  onChange={(e) => setEditedData({...editedData, rfid: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">রক্তের গ্রুপ</label>
                <input 
                  type="text"
                  placeholder="যেমন: A+"
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-bold text-sm outline-none text-text-main"
                  value={editedData['রক্তের গ্রুপ'] || ''}
                  onChange={(e) => setEditedData({...editedData, 'রক্তের গ্রুপ': e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">ঠিকানা</label>
              <textarea 
                rows={2}
                className="w-full p-3 bg-step-bg border border-border-main rounded-xl font-semibold text-sm outline-none text-text-main"
                value={editedData['ঠিকানা'] || ''}
                onChange={(e) => setEditedData({...editedData, 'ঠিকানা': e.target.value})}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border-main">
              <button 
                type="button"
                onClick={handleDeleteInProfile}
                className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-600 font-bold text-sm rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
              >
                🗑️ শিক্ষার্থী ডিলিট করুন
              </button>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="px-5 py-2.5 bg-step-bg text-text-main font-bold text-sm rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-primary text-white font-black text-sm rounded-xl hover:scale-103 transition-all cursor-pointer shadow-lg shadow-primary/10"
                >
                  তথ্য সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-border-main/60 pb-3 select-none">
              {tabs.map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border",
                      activeTab === tab.id 
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/15" 
                        : "bg-step-bg text-text-main hover:bg-white border-border-main/50"
                    )}
                  >
                      <tab.icon size={15}/> {tab.label}
                  </button>
              ))}
          </div>

          {/* Content Panels */}
          <div className="bg-step-bg/35 border border-border-main p-6 sm:p-8 rounded-3xl min-h-[250px]">
          {activeTab === 'basic' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailCardItem icon={<User />} label="শিক্ষার্থীর নাম" value={student['শিক্ষার্থীর নাম'] || student.name} />
                  <DetailCardItem icon={<IdCard />} label="রেজিস্ট্রেশন/আইডি" value={enToBnNumber(student['রেজিস্ট্রেশন/আইডি']?.toString() || student['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || student.id?.toString() || '')} copyValue={student['রেজিস্ট্রেশন/আইডি']?.toString() || student['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || student.id?.toString() || ''} />
                  <DetailCardItem icon={<Users />} label="পিতার নাম" value={student['পিতার নাম'] || student.fatherName} />
                  <DetailCardItem icon={<Users />} label="মাতার নাম" value={student['মাতার নাম'] || student.motherName} />
                  <DetailCardItem icon={<Calendar />} label="জন্ম তারিখ" value={enToBnNumber(student['জন্ম তারিখ'] || student.dob || '')} />
                  <DetailCardItem icon={<IdCard />} label="জন্ম নিবন্ধন নাম্বার" value={enToBnNumber(student['জন্ম নিবন্ধন নাম্বার']?.toString() || student['জন্ম নিবন্ধন সনদ নম্বর']?.toString() || student['জন্ম নিবন্ধন']?.toString() || student['জন্ম নিবন্ধন নম্বর']?.toString() || student['জন্ম নিবন্ধন/NID নং']?.toString() || student['এনআইডি/জন্ম সনদ'] || student.birthReg?.toString() || student.birthRegNo?.toString() || '')} copyValue={student['জন্ম নিবন্ধন নাম্বার']?.toString() || student['জন্ম নিবন্ধন সনদ নম্বর']?.toString() || student['জন্ম নিবন্ধন']?.toString() || student['জন্ম নিবন্ধন নম্বর']?.toString() || student['জন্ম নিবন্ধন/NID নং']?.toString() || student['এনআইডি/জন্ম সনদ'] || student.birthReg?.toString() || student.birthRegNo?.toString() || ''} />
                  <DetailCardItem icon={<Heart />} label="রক্তের গ্রুপ" value={student['রক্তের গ্রুপ'] || student.bloodGroup} />
                  <DetailCardItem icon={<Compass />} label="শিক্ষার্থী ধরণ" value={student['শিক্ষার্থী ধরণ'] || student.studentType || 'নতুন'} />
                  <DetailCardItem icon={<Shield />} label="শিক্ষার্থী ধরণ/স্ট্যাটাস" value={student['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || student['স্ট্যাটাস'] || 'সক্রিয়'} highlight />
              </div>
          )}

          {activeTab === 'academic' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailCardItem icon={<Calendar />} label="শিক্ষাবর্ষ" value={student['শিক্ষাবর্ষ'] || student.academicYearLabel} />
                  <DetailCardItem icon={<Bookmark />} label="জামাত" value={student['জামাত'] || student.jamat} />
                  <DetailCardItem icon={<Award />} label="মারহালা" value={student['মারহালা'] || student.marhala} />
                  <DetailCardItem icon={<BookOpen />} label="জামাত/শ্রেণী" value={student['জামাত/শ্রেণী'] || student.class} />
                  <DetailCardItem icon={<Award />} label="সমমান" value={student['সমমান'] || student.somoman || 'সাধারণ'} />
                  <DetailCardItem icon={<Hash />} label="রোল নম্বর" value={enToBnNumber(student['রোল নম্বর']?.toString() || student.roll?.toString() || '')} highlight />
                  <DetailCardItem icon={<Compass />} label="পূর্বের মাদ্রাসা" value={student['পূর্বের মাদ্রাসা'] || student.prevMadrasa} />
                  <DetailCardItem icon={<Bookmark />} label="পূর্বের জামাত" value={student['পূর্বের জামাত'] || student.prevClass} />
              </div>
          )}

          {activeTab === 'contact' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailCardItem icon={<Phone />} label="মোবাইল (মা)" value={enToBnNumber(student['মোবাইল (মা)']?.toString() || student['অভিভাবকের মোবাইল']?.toString() || student.mobile?.toString() || student.phone?.toString() || '')} copyValue={student['মোবাইল (মা)']?.toString() || student['অভিভাবকের মোবাইল']?.toString() || student.mobile?.toString() || student.phone?.toString() || ''} isPhone />
                  <DetailCardItem icon={<Phone />} label="মোবাইল (বাবা/ভাই)" value={enToBnNumber(student['মোবাইল (বাবা/ভাই)']?.toString() || student['বিকল্প মোবাইল']?.toString() || student['দ্বিতীয় মোবাইল']?.toString() || student['দ্বিতীয় মোবাইল নম্বর']?.toString() || student['২য় মোবাইল']?.toString() || student.altMobile?.toString() || student.alt_mobile?.toString() || '')} copyValue={student['মোবাইল (বাবা/ভাই)']?.toString() || student['বিকল্প মোবাইল']?.toString() || student['দ্বিতীয় মোবাইল']?.toString() || student['দ্বিতীয় মোবাইল নম্বর']?.toString() || student['২য় মোবাইল']?.toString() || student.altMobile?.toString() || student.alt_mobile?.toString() || ''} isPhone />
                  <DetailCardItem icon={<Mail />} label="ইমেইল" value={student['ইমেইল'] || student.email} copyValue={student['ইমেইল'] || student.email} isEmail />
                  <div className="sm:col-span-2">
                    <DetailCardItem icon={<Compass />} label="ঠিকানা" value={student['ঠিকানা'] || student.address || '—'} />
                  </div>
              </div>
          )}

          {activeTab === 'digital' && (() => {
            const qrImageUrl = (student['QR CODE'] && student['QR CODE'].toString().startsWith('http')) 
              ? student['QR CODE'] 
              : (student['QR CODE IMAGE'] || '');

            const longUrl = student['LONG URL'] || student['long_url'] || student['ভেরিফিকেশন লিংক'];
            const shortUrl = student['SORT URL'] || student['sort_url'] || student['Short URL'];

            return (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <DetailCardItem icon={<Award />} label="প্রত্যয়ন পত্র নাম্বার" value={enToBnNumber(student['प्रत्यয়ন পত্র নাম্বার']?.toString() || student['प्रत्यয়ন পত্র নাম্বার']?.toString() || student['प्रत्ययन পত্র নাম্বার']?.toString() || '')} />
                  <DetailCardItem icon={<Clock />} label="মঞ্জুরের তারিখ ও সময়" value={enToBnNumber(student['মঞ্জুরের তারিখ ও সময়']?.toString() || '')} />
                  <DetailCardItem icon={<Hash />} label="আবেদন নং" value={enToBnNumber(student['আবেদন নং']?.toString() || '')} />
                  <DetailCardItem 
                    icon={<QrCode />} 
                    label="QR CODE" 
                    value={student['QR CODE'] || '—'} 
                    copyValue={student['QR CODE'] || ''}
                    isLink={student['QR CODE'] && (student['QR CODE'].toString().startsWith('http://') || student['QR CODE'].toString().startsWith('https://'))}
                  />
                </div>

                {/* Barcode/QR Code Rendering block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-3 pt-5 border-t border-border-main/50 items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase text-text-light/50 tracking-widest mb-3 flex items-center gap-1">
                      <QrCode size={12} className="text-primary" /> ডিজিটাল কিউআর কোড
                    </p>
                    {qrImageUrl ? (
                      <a 
                        href={qrImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-40 h-40 bg-white p-2.5 rounded-[2rem] border border-border-main flex items-center justify-center shadow-lg group hover:rotate-2 hover:scale-105 transition-all duration-300 cursor-pointer block relative overflow-hidden"
                        title="কিউআর কোডটি সরাসরি ওপেন করতে ক্লিক করুন"
                      >
                        <img 
                          src={qrImageUrl} 
                          alt="QR Code" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <ExternalLink size={20} className="text-primary stroke-[3]" />
                        </div>
                      </a>
                    ) : (
                      <div className="w-40 h-40 bg-step-bg rounded-[2rem] border-2 border-dashed border-border-main flex flex-col items-center justify-center p-4 text-center">
                        <QrCode size={28} className="text-text-light/20 mb-2" />
                        <span className="text-[9px] font-bold text-text-light/40 leading-tight">ছবি লিংক পাওয়া যায়নি</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-text-light/50 tracking-widest flex items-center gap-1">
                      <Compass size={12} className="text-primary" /> অ্যাক্টিভ যাচাই লিংক সমূহ
                    </p>
                    <div className="flex flex-col gap-2.5">
                      {longUrl && (
                        <div className="flex items-center gap-2">
                          <a 
                            href={longUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-black text-[#0D6582] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> যাচাই লিংক ১ (লং ইউআরএল)
                          </a>
                        </div>
                      )}
                      {shortUrl && (
                        <div className="flex items-center gap-2">
                          <a 
                            href={shortUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-black text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> যাচাই লিংক ২ (শর্ট ইউআরএল)
                          </a>
                        </div>
                      )}
                      {!longUrl && !shortUrl && (
                        <p className="text-xs font-bold text-text-light/50 italic">কোন যাচাই লিংক নিবন্ধিত নেই</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === 'fees' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-4 rounded-2xl border border-border-main/50 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-text-light/50 tracking-wider block mb-1">মোট পরিশোধিত এন্ট্রি</span>
                    <span className="text-sm font-black text-success">৳{enToBnNumber(studentFees.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toString())}</span>
                  </div>
                  <button 
                    onClick={() => handleNavigate('student-fees')} 
                    className="w-full sm:w-auto px-4.5 py-2.5 bg-[#0D6582] text-white rounded-xl text-xs font-black hover:bg-[#09526b] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#0D6582]/15"
                  >
                    <CreditCard size={14} /> নতুন ফি আদায় / ফি মডিউল
                  </button>
                </div>

                {studentFees.length === 0 ? (
                  <div className="text-center p-10 bg-card rounded-2xl border border-border-main/50">
                    <CreditCard size={32} className="mx-auto text-text-light/30 mb-2" />
                    <p className="text-xs font-bold text-text-light/60">কোন বেতন বা ফি প্রদানের রেকর্ড পাওয়া যায়নি।</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border-main/50 rounded-2xl bg-card">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-step-bg border-b border-border-main/40 font-black text-[10px] text-text-light/70 uppercase">
                          <th className="p-4">ফি ধরন</th>
                          <th className="p-4">মাস/বছর</th>
                          <th className="p-4">তারিখ</th>
                          <th className="p-4">পদ্ধতি</th>
                          <th className="p-4 text-right">পরিমাণ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-main/30">
                        {studentFees.map((fee, idx) => (
                          <tr key={fee.id || idx} className="hover:bg-step-bg/30">
                            <td className="p-4 font-black">
                              {fee.type === 'monthly' ? 'মাসিক বেতন' : fee.type === 'admission' ? 'ভর্তি ফি' : fee.type === 'exam' ? 'পরীক্ষা ফি' : 'অন্যান্য'}
                            </td>
                            <td className="p-4 font-bold">{fee.month} {fee.year}</td>
                            <td className="p-4 font-bold text-text-light">{enToBnNumber(fee.paymentDate || '')}</td>
                            <td className="p-4 font-extrabold text-primary">{fee.method}</td>
                            <td className="p-4 font-black text-right text-success">৳{enToBnNumber(fee.amount.toString())}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
          )}

          {activeTab === 'results' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-4 rounded-2xl border border-border-main/50 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-text-light/50 tracking-wider block mb-1">পরীক্ষার ফলাফল তালিকা</span>
                    <span className="text-xs font-bold text-text-light/60">শিক্ষার্থীর পরীক্ষার প্রাপ্ত মোট নম্বর ও গ্রেড খতিয়ান</span>
                  </div>
                  <button 
                    onClick={() => handleNavigate('exam-results')} 
                    className="w-full sm:w-auto px-4.5 py-2.5 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary/95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-primary/15"
                  >
                    <Award size={14} /> পরীক্ষার মার্ক এন্ট্রি মডিউলে যান
                  </button>
                </div>

                {studentMarks.length === 0 ? (
                  <div className="text-center p-10 bg-card rounded-2xl border border-border-main/50">
                    <Award size={32} className="mx-auto text-text-light/30 mb-2" />
                    <p className="text-xs font-bold text-text-light/60">কোন পরীক্ষার মার্ক এন্ট্রি বা ফলাফল পাওয়া যায়নি।</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border-main/50 rounded-2xl bg-card">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-step-bg border-b border-border-main/40 font-black text-[10px] text-text-light/70 uppercase">
                          <th className="p-4">পরীক্ষার নাম</th>
                          <th className="p-4 text-center">লিখিত</th>
                          <th className="p-4 text-center">মৌখিক</th>
                          <th className="p-4 text-center">মোট নম্বর</th>
                          <th className="p-4 text-right">প্রাপ্ত গ্রেড</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-main/30">
                        {studentMarks.map((m, idx) => (
                          <tr key={idx} className="hover:bg-step-bg/30">
                            <td className="p-4 font-black text-text-main">{m.examName}</td>
                            <td className="p-4 text-center font-bold">{enToBnNumber(m.written)}</td>
                            <td className="p-4 text-center font-bold">{enToBnNumber(m.oral)}</td>
                            <td className="p-4 text-center font-black text-primary">{enToBnNumber(m.total.toString())}</td>
                            <td className="p-4 text-right">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                m.grade.includes('A+') ? "bg-success/15 text-success" :
                                m.grade.includes('A') ? "bg-primary/15 text-primary" :
                                m.grade.includes('F') ? "bg-error/15 text-error" : "bg-warning/15 text-warning"
                              )}>
                                {m.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
          )}

          {activeTab === 'attendance' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-4 rounded-2xl border border-border-main/50 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-text-light/50 tracking-wider block mb-1">হাজিরা অনুপাত খতিয়ান</span>
                    <span className="text-xs font-bold text-text-light/60">উপস্থিতি অনুপাত: {enToBnNumber(attendanceStats.percentage.toString())}%</span>
                  </div>
                  <button 
                    onClick={() => handleNavigate('student-attendance')} 
                    className="w-full sm:w-auto px-4.5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15"
                  >
                    <Calendar size={14} /> দৈনিক ক্লাসরুম হাজিরা দিন
                  </button>
                </div>

                {/* Attendance Gauge Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-card p-4 rounded-2xl border border-border-main/55 text-center">
                    <span className="text-[10px] font-black text-text-light/50 tracking-wider uppercase block mb-1">হাজিরা অনুপাত</span>
                    <span className="text-xl font-black text-primary">{enToBnNumber(attendanceStats.percentage.toString())}%</span>
                  </div>
                  <div className="bg-card p-4 rounded-2xl border border-border-main/55 text-center">
                    <span className="text-[10px] font-black text-text-light/50 tracking-wider uppercase block mb-1">মোট উপস্থিত</span>
                    <span className="text-xl font-black text-success">{enToBnNumber(attendanceStats.present.toString())} দিন</span>
                  </div>
                  <div className="bg-card p-4 rounded-2xl border border-border-main/55 text-center">
                    <span className="text-[10px] font-black text-text-light/50 tracking-wider uppercase block mb-1">মোট অনুপস্থিত</span>
                    <span className="text-xl font-black text-error">{enToBnNumber(attendanceStats.absent.toString())} দিন</span>
                  </div>
                  <div className="bg-card p-4 rounded-2xl border border-border-main/55 text-center">
                    <span className="text-[10px] font-black text-text-light/50 tracking-wider uppercase block mb-1">মোট বিলম্ব</span>
                    <span className="text-xl font-black text-warning">{enToBnNumber(attendanceStats.late.toString())} দিন</span>
                  </div>
                </div>

                {studentAttendance.length === 0 ? (
                  <div className="text-center p-10 bg-card rounded-2xl border border-border-main/50">
                    <Calendar size={32} className="mx-auto text-text-light/30 mb-2" />
                    <p className="text-xs font-bold text-text-light/60">কোন ক্লাসরুম হাজিরা রেকর্ড পাওয়া যায়নি।</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border-main/50 rounded-2xl bg-card">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-step-bg border-b border-border-main/40 font-black text-[10px] text-text-light/70 uppercase">
                          <th className="p-4">তারিখ</th>
                          <th className="p-4 text-right">হাজিরা স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-main/30">
                        {studentAttendance.map((att, idx) => (
                          <tr key={idx} className="hover:bg-step-bg/30">
                            <td className="p-4 font-black text-text-main">{enToBnNumber(att.date)}</td>
                            <td className="p-4 text-right">
                              <span className={cn(
                                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black",
                                att.status === 'present' ? "bg-success/15 text-success" :
                                att.status === 'absent' ? "bg-error/15 text-error" : "bg-warning/15 text-warning"
                              )}>
                                {att.status === 'present' ? <CheckCircle2 size={12}/> : att.status === 'absent' ? <XCircle size={12}/> : <Clock size={12}/>}
                                {att.status === 'present' ? 'উপস্থিত' : att.status === 'absent' ? 'অনুপস্থিত' : 'বিলম্ব'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
          )}
      </div>
      </>
      )}
    </div>
  );

  const printTemplate = (
    <div className="hidden print:block bg-white text-slate-800 p-8 font-sans leading-relaxed text-left w-full max-w-[800px] mx-auto" style={{ color: '#1e293b', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div className="text-center border-b-4 border-indigo-600 pb-6 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">মাদানিয়া মাদ্রাসা ও এতিমখানা</h1>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">শিক্ষার্থী সবিস্তার প্রোফাইল (Detailed Student Profile)</p>
        <p className="text-xs text-slate-400 mt-1">প্রিন্ট তারিখ: {enToBnNumber(new Date().toLocaleDateString('bn-BD'))}</p>
      </div>

      {/* Main Content Info */}
      <div className="space-y-8">
        {/* Section 1: Basic Info */}
        <div>
          <h3 className="text-lg font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-4">১. শিক্ষার্থীর মৌলিক তথ্য (Basic Information)</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">নাম:</span> <span className="w-2/3 font-semibold text-slate-900">{student['শিক্ষার্থীর নাম'] || '—'}</span></div>
            <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">পিতার নাম:</span> <span className="w-2/3 font-semibold text-slate-900">{student['পিতার নাম'] || '—'}</span></div>
            <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">মাতার নাম:</span> <span className="w-2/3 font-semibold text-slate-900">{student['মাতার নাম'] || student.motherName || '—'}</span></div>
            <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">জন্ম তারিখ:</span> <span className="w-2/3 font-semibold text-slate-900">{student['জন্ম তারিখ'] || '—'}</span></div>
            <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">রক্তের গ্রুপ:</span> <span className="w-2/3 font-semibold text-slate-900">{student['রক্তের গ্রুপ'] || '—'}</span></div>
          </div>
        </div>

        {/* Section 2: Academic Info */}
        <div>
          <h3 className="text-lg font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-4">২. একাডেমিক তথ্য (Academic Information)</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">জামাত/শ্রেণী:</span> <span className="w-2/3 font-semibold text-slate-900">{student['জামাত/শ্রেণী'] || '—'}</span></div>
            <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">রোল নম্বর:</span> <span className="w-2/3 font-semibold text-slate-900">{enToBnNumber(student['রোল নম্বর'] || '—')}</span></div>
            <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">আইডি নম্বর:</span> <span className="w-2/3 font-semibold text-slate-900">{enToBnNumber(student['রেজিস্ট্রেশন/আইডি নম্বর'] || '—')}</span></div>
            <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">স্ট্যাটাস:</span> <span className="w-2/3 font-semibold text-slate-900">{student['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || '—'}</span></div>
          </div>
        </div>

        {/* Section 3: Contact Info */}
        <div>
          <h3 className="text-lg font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-4">৩. যোগাযোগ তথ্য (Contact Information)</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">অভিভাবকের মোবাইল:</span> <span className="w-2/3 font-semibold text-slate-900">{enToBnNumber(student['অভিভাবকের মোবাইল'] || '—')}</span></div>
            <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">ঠিকানা:</span> <span className="w-2/3 font-semibold text-slate-900">{student['ঠিকানা'] || '—'}</span></div>
          </div>
        </div>

        {/* Section 4: Fees, Marks & Attendance Summaries */}
        <div className="grid grid-cols-2 gap-6 pt-4">
          <div>
            <h4 className="text-sm font-black text-indigo-700 border-b border-indigo-100 pb-1.5 mb-3">৪. বেতন ও পরিশোধের তথ্য</h4>
            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div><strong>মোট পরিশোধিত:</strong> ৳{enToBnNumber(studentFees.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toString())}</div>
              <div><strong>পরিশোধিত এন্ট্রি সংখ্যা:</strong> {enToBnNumber(studentFees.length.toString())}টি</div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-indigo-700 border-b border-indigo-100 pb-1.5 mb-3">৫. উপস্থিতি ও হাজিরা</h4>
            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div><strong>মোট হাজিরা:</strong> {enToBnNumber(studentAttendance.length.toString())} দিন</div>
              <div><strong>উপস্থিতি অনুপাত:</strong> {enToBnNumber(attendanceStats.percentage.toString())}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Signatures */}
      <div className="mt-20 pt-12 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-500 font-bold">
        <div>
          <div className="border-t border-slate-300 w-32 mx-auto pt-1 mt-8">অভিভাবকের স্বাক্ষর</div>
        </div>
        <div>
          <div className="border-t border-slate-300 w-32 mx-auto pt-1 mt-8">কর্তৃপক্ষের স্বাক্ষর</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isModal ? (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-text-main/20 backdrop-blur-sm font-hind-siliguri print:p-0 print:bg-transparent">
          {screenContent}
        </div>
      ) : screenContent}

      {/* Printable template utilized by standard print (Ctrl+P) */}
      {printTemplate}

      {/* Off-screen Printable Template used exclusively by html2pdf.js for 100% accuracy */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
        <div ref={printAreaRef} className="bg-white text-slate-800 p-10 font-sans leading-relaxed text-left" style={{ color: '#1e293b', backgroundColor: '#ffffff', width: '800px', boxSizing: 'border-box' }}>
          {/* Header */}
          <div className="text-center border-b-4 border-indigo-600 pb-6 mb-8">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">মাদানিয়া মাদ্রাসা ও এতিমখানা</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">শিক্ষার্থী সবিস্তার প্রোফাইল (Detailed Student Profile)</p>
            <p className="text-xs text-slate-400 mt-1">প্রিন্ট তারিখ: {enToBnNumber(new Date().toLocaleDateString('bn-BD'))}</p>
          </div>

          {/* Main Content Info */}
          <div className="space-y-8">
            {/* Section 1: Basic Info */}
            <div>
              <h3 className="text-lg font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-4">১. শিক্ষার্থীর মৌলিক তথ্য (Basic Information)</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">নাম:</span> <span className="w-2/3 font-semibold text-slate-900">{student['শিক্ষার্থীর নাম'] || '—'}</span></div>
                <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">পিতার নাম:</span> <span className="w-2/3 font-semibold text-slate-900">{student['পিতার নাম'] || '—'}</span></div>
                <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">মাতার নাম:</span> <span className="w-2/3 font-semibold text-slate-900">{student['মাতার নাম'] || student.motherName || '—'}</span></div>
                <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">জন্ম তারিখ:</span> <span className="w-2/3 font-semibold text-slate-900">{student['জন্ম তারিখ'] || '—'}</span></div>
                <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">রক্তের গ্রুপ:</span> <span className="w-2/3 font-semibold text-slate-900">{student['রক্তের গ্রুপ'] || '—'}</span></div>
              </div>
            </div>

            {/* Section 2: Academic Info */}
            <div>
              <h3 className="text-lg font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-4">২. একাডেমিক তথ্য (Academic Information)</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">জামাত/শ্রেণী:</span> <span className="w-2/3 font-semibold text-slate-900">{student['জামাত/শ্রেণী'] || '—'}</span></div>
                <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">রোল নম্বর:</span> <span className="w-2/3 font-semibold text-slate-900">{enToBnNumber(student['রোল নম্বর'] || '—')}</span></div>
                <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">আইডি নম্বর:</span> <span className="w-2/3 font-semibold text-slate-900">{enToBnNumber(student['রেজিস্ট্রেশন/আইডি নম্বর'] || '—')}</span></div>
                <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">স্ট্যাটাস:</span> <span className="w-2/3 font-semibold text-slate-900">{student['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || '—'}</span></div>
              </div>
            </div>

            {/* Section 3: Contact Info */}
            <div>
              <h3 className="text-lg font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-4">৩. যোগাযোগ তথ্য (Contact Information)</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">অভিভাবকের মোবাইল:</span> <span className="w-2/3 font-semibold text-slate-900">{enToBnNumber(student['অভিভাবকের মোবাইল'] || '—')}</span></div>
                <div className="flex border-b border-slate-100 pb-1.5"><span className="w-1/3 text-slate-500 font-bold">ঠিকানা:</span> <span className="w-2/3 font-semibold text-slate-900">{student['ঠিকানা'] || '—'}</span></div>
              </div>
            </div>

            {/* Section 4: Fees, Marks & Attendance Summaries */}
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div>
                <h4 className="text-sm font-black text-indigo-700 border-b border-indigo-100 pb-1.5 mb-3">৪. বেতন ও পরিশোধের তথ্য</h4>
                <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div><strong>মোট পরিশোধিত:</strong> ৳{enToBnNumber(studentFees.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toString())}</div>
                  <div><strong>পরিশোধিত এন্ট্রি সংখ্যা:</strong> {enToBnNumber(studentFees.length.toString())}টি</div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-black text-indigo-700 border-b border-indigo-100 pb-1.5 mb-3">৫. উপস্থিতি ও হাজিরা</h4>
                <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div><strong>মোট হাজিরা:</strong> {enToBnNumber(studentAttendance.length.toString())} দিন</div>
                  <div><strong>উপস্থিতি অনুপাত:</strong> {enToBnNumber(attendanceStats.percentage.toString())}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer / Signatures */}
          <div className="mt-20 pt-12 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-500 font-bold">
            <div>
              <div className="border-t border-slate-300 w-32 mx-auto pt-1 mt-8">অভিভাবকের স্বাক্ষর</div>
            </div>
            <div>
              <div className="border-t border-slate-300 w-32 mx-auto pt-1 mt-8">কর্তৃপক্ষের স্বাক্ষর</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

interface DetailCardItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  copyValue?: string;
  isPhone?: boolean;
  isEmail?: boolean;
  isLink?: boolean;
  highlight?: boolean;
}

const DetailCardItem: React.FC<DetailCardItemProps> = ({
  icon,
  label,
  value,
  copyValue,
  isPhone,
  isEmail,
  isLink,
  highlight,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = copyValue || String(value);
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasValue = value !== undefined && value !== null && String(value).trim() !== '';
  const displayValue = hasValue ? value : '—';

  return (
    <div className={cn(
      "bg-card p-4 rounded-2xl border border-border-main/50 flex items-start gap-3 text-left transition-all hover:border-border-main duration-200 w-full",
      highlight && "bg-primary/5 border-primary/20"
    )}>
      <div className={cn(
        "p-2 rounded-xl bg-step-bg text-text-light/70 shrink-0",
        highlight && "bg-primary/10 text-primary"
      )}>
        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-black text-text-light/50 uppercase tracking-widest block mb-0.5">{label}</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {isLink && hasValue ? (
            <a 
              href={String(value)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs font-black text-primary hover:underline break-all inline-flex items-center gap-1"
            >
              {displayValue} <ExternalLink size={10} />
            </a>
          ) : isPhone && hasValue ? (
            <a 
              href={`tel:${copyValue || value}`} 
              className="text-xs font-black text-[#0D6582] hover:underline break-all inline-flex items-center gap-1"
            >
              {displayValue} <Phone size={10} />
            </a>
          ) : isEmail && hasValue ? (
            <a 
              href={`mailto:${copyValue || value}`} 
              className="text-xs font-black text-primary hover:underline break-all inline-flex items-center gap-1"
            >
              {displayValue} <Mail size={10} />
            </a>
          ) : (
            <span className={cn(
              "text-xs font-black text-text-main break-words",
              highlight && "text-primary font-black text-sm"
            )}>
              {displayValue}
            </span>
          )}

          {copyValue && hasValue && (
            <button 
              onClick={handleCopy}
              className="p-1 hover:bg-step-bg rounded-lg text-text-light/40 hover:text-text-light/90 transition-all cursor-pointer inline-flex"
              title="কপি করুন"
            >
              {copied ? <Check size={10} className="text-success" /> : <Copy size={10} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
