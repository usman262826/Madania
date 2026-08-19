import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './CrudTable';
import { AcademicClassSubject, AcademicClass, AcademicSubject } from './types';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  BookOpenCheck,
  Bookmark,
  Layers,
  Award,
  BookMarked,
  Info,
  Calendar
} from 'lucide-react';
import { JAMAT_LIST, CLASS_DETAILS_MAP } from '../../constants';
import { cn } from '../../lib/utils';
import { useData } from '../../contexts/DataContext';

// Helper to convert English numbers to Bengali
const enToBnNumber = (str: string | number) => {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.toString().replace(/\d/g, (d) => bn[parseInt(d)]);
};

// Default classes generator
const generateDefaultClasses = (): AcademicClass[] => {
  return JAMAT_LIST.map((name, idx) => {
    const details = CLASS_DETAILS_MAP[name];
    let deptId = '3'; // Default to Kitab
    if (name.includes('শিশু') || name.includes('১ম') || name.includes('২য়') || name.includes('৩য়')) {
      deptId = '1'; // Noorani
    }
    return {
      id: String(idx + 1),
      name: name,
      departmentId: deptId,
      equivalent: details?.somoman || 'অজানা',
      isActive: true
    };
  });
};

const defaultSubjects: AcademicSubject[] = [];

const defaultClassSubjects: AcademicClassSubject[] = [];

export const AcademicClassSubjectAssign: React.FC = () => {
  const { 
    classes: contextClasses, 
    subjects: contextSubjects, 
    classSubjects: contextClassSubjects, 
    updateData, 
    deleteData,
    jamatList,
    classDetailsMap
  } = useData();

  const classes = useMemo(() => contextClasses || [], [contextClasses]);
  const subjects = useMemo(() => contextSubjects || [], [contextSubjects]);
  const classSubjects = useMemo(() => contextClassSubjects || [], [contextClassSubjects]);

  // UI state
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return classes[0]?.id || '1';
  });
  const [classSearch, setClassSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCS, setEditingCS] = useState<{ cs: AcademicClassSubject; sub: AcademicSubject } | null>(null);

  // Form state
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formBookName, setFormBookName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'আবশ্যিক' | 'ঐচ্ছিক'>('আবশ্যিক');
  const [formTotalMarks, setFormTotalMarks] = useState(100);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formClassId, setFormClassId] = useState('');

  // Selected Class details
  const selectedClass = useMemo(() => {
    return classes.find(c => c.id === selectedClassId);
  }, [classes, selectedClassId]);

  // Filtered classes list
  const filteredClasses = useMemo(() => {
    return classes.filter(c => c.name.toLowerCase().includes(classSearch.toLowerCase()));
  }, [classes, classSearch]);

  // Get subjects mapped to selected class
  const classMappedSubjects = useMemo(() => {
    if (!selectedClassId) return [];
    
    const mappings = classSubjects.filter(cs => cs.classId === selectedClassId);
    
    return mappings.map(cs => {
      const sub = subjects.find(s => s.id === cs.subjectId);
      return {
        cs,
        sub: sub || {
          id: cs.subjectId,
          name: 'অজানা বিষয়',
          code: 'N/A',
          bookName: 'অজানা কিতাব',
          type: 'আবশ্যিক',
          totalMarks: 100,
          isActive: false
        }
      };
    }).filter(item => {
      if (!subjectSearch) return true;
      return (
        item.sub.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        item.sub.bookName.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        item.sub.code.toLowerCase().includes(subjectSearch.toLowerCase())
      );
    });
  }, [classSubjects, subjects, selectedClassId, subjectSearch]);

  // Handle open modal for ADD
  const handleOpenAdd = () => {
    setEditingCS(null);
    setFormSubjectName('');
    setFormBookName('');
    setFormCode('');
    setFormType('আবশ্যিক');
    setFormTotalMarks(100);
    setFormIsActive(true);
    setFormClassId(selectedClassId);
    setIsModalOpen(true);
  };

  // Handle open modal for EDIT
  const handleOpenEdit = (item: { cs: AcademicClassSubject; sub: AcademicSubject }) => {
    setEditingCS(item);
    setFormSubjectName(item.sub.name);
    setFormBookName(item.sub.bookName);
    setFormCode(item.sub.code);
    setFormType(item.sub.type);
    setFormTotalMarks(item.sub.totalMarks);
    setFormIsActive(item.sub.isActive);
    setFormClassId(item.cs.classId);
    setIsModalOpen(true);
  };

  // Handle DELETE / unassign mapping
  const handleDelete = async (item: { cs: AcademicClassSubject; sub: AcademicSubject }) => {
    if (window.confirm(`আপনি কি নিশ্চিতভাবে "${item.sub.name} (${item.sub.bookName})" কিতাবটি এই জামাত থেকে বাদ দিতে চান?`)) {
      await deleteData('acad_class_subjects', item.cs.id);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClassId) return;

    if (editingCS) {
      // 1. Update the subject entry
      const updatedSubject: AcademicSubject = {
        ...editingCS.sub,
        name: formSubjectName,
        bookName: formBookName,
        code: formCode,
        type: formType,
        totalMarks: Number(formTotalMarks),
        isActive: formIsActive
      };
      await updateData('acad_subjects', updatedSubject);

      // 2. Update the class mapping
      const updatedMapping: AcademicClassSubject = {
        ...editingCS.cs,
        classId: formClassId,
        isMandatory: formType === 'আবশ্যিক'
      };
      await updateData('acad_class_subjects', updatedMapping);
    } else {
      // Create new subject
      const newSubjectId = 'sub-' + Date.now().toString();
      const newSubject: AcademicSubject = {
        id: newSubjectId,
        name: formSubjectName,
        bookName: formBookName,
        code: formCode,
        type: formType,
        totalMarks: Number(formTotalMarks),
        isActive: formIsActive
      };
      await updateData('acad_subjects', newSubject);

      // Create mapping
      const newMapping: AcademicClassSubject = {
        id: Date.now().toString(),
        classId: formClassId,
        subjectId: newSubjectId,
        isMandatory: formType === 'আবশ্যিক'
      };
      await updateData('acad_class_subjects', newMapping);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="w-full flex flex-col gap-6 font-hind-siliguri animate-fade-in">
      {/* Upper header summary card */}
      <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border-main shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
            <BookOpenCheck size={16} />
            <span>শিক্ষাক্রম ও সিলেবাস কন্ট্রোল</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-text-main mt-1 leading-tight">
            জামাত ভিত্তিক বিষয় ও কিতাব ব্যবস্থাপনা
          </h2>
          <p className="text-xs font-bold text-text-light/80 mt-1 sm:mt-1.5">
            মাদ্রাসার শ্রেণীভিত্তিক বিষয়সমূহ, পঠিত কিতাব ও পূর্ণমান পরিচালনা করুন। কোন কিতাব কোন জামাতের তা এখানে সহজেই দেখা ও পরিবর্তন করা যাবে।
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary/95 hover:scale-102 text-white font-black text-xs rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-98 shrink-0 cursor-pointer"
        >
          <Plus size={16} className="stroke-[2.5]" />
          <span>নতুন বিষয় ও কিতাব যোগ করুন</span>
        </button>
      </div>

      {/* Main Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Jamats list */}
        <div className="lg:col-span-4 bg-card rounded-3xl border border-border-main shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
          <div className="p-5 border-b border-border-main/50 bg-step-bg/30">
            <h3 className="font-black text-sm text-text-main flex items-center gap-2">
              <Layers size={16} className="text-primary" />
              <span>মাদ্রাসার জামাত সমূহ ({enToBnNumber(classes.length)}টি)</span>
            </h3>
            <div className="relative mt-3">
              <Search size={14} className="absolute left-3.5 top-3.5 text-text-light/55" />
              <input
                type="text"
                placeholder="জামাত খুঁজুন..."
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-semibold outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[550px] p-3 space-y-1.5 scrollbar-thin">
            {filteredClasses.length === 0 ? (
              <div className="p-8 text-center text-xs font-semibold text-text-light/60">
                কোনো জামাত পাওয়া যায়নি।
              </div>
            ) : (
              filteredClasses.map((cls) => {
                const subCount = classSubjects.filter(cs => cs.classId === cls.id).length;
                const isSelected = cls.id === selectedClassId;

                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all text-left cursor-pointer group",
                      isSelected 
                        ? "bg-primary text-white border-transparent shadow-md shadow-primary/10" 
                        : "bg-transparent border-transparent hover:bg-step-bg hover:border-border-main/30 text-text-main"
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <p className={cn("text-xs font-black truncate", isSelected ? "text-white" : "text-text-main group-hover:text-primary")}>
                        {cls.name}
                      </p>
                      <p className={cn("text-[10px] font-bold mt-0.5", isSelected ? "text-white/80" : "text-text-light/70")}>
                        সমমান: {cls.equivalent}
                      </p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0",
                      isSelected ? "bg-white/25 text-white" : "bg-step-bg border border-border-main text-text-light group-hover:border-primary/20 group-hover:text-primary"
                    )}>
                      {enToBnNumber(subCount)} টি বিষয়
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Subjects list of selected Jamat */}
        <div className="lg:col-span-8 bg-card rounded-3xl border border-border-main shadow-sm min-h-[500px] flex flex-col">
          {selectedClass ? (
            <>
              {/* Selected class details header */}
              <div className="p-6 border-b border-border-main/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-step-bg/20">
                <div>
                  <span className="bg-primary/15 text-primary text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    জামাতের সিলেবাস
                  </span>
                  <h3 className="text-lg font-black text-text-main mt-1 flex items-center gap-2">
                    <BookOpen size={18} className="text-primary" />
                    <span>{selectedClass.name} — পঠিত বিষয় ও কিতাব সমূহ</span>
                  </h3>
                  <p className="text-xs font-bold text-text-light/80 mt-1">
                    এই জামাতের জন্য নির্ধারিত সকল পঠিত কিতাব এবং বিষয়ের বিস্তারিত তালিকা।
                  </p>
                </div>
                <div className="relative w-full sm:max-w-[200px] shrink-0">
                  <Search size={13} className="absolute left-3 top-3 text-text-light/50" />
                  <input
                    type="text"
                    placeholder="বিষয়/কিতাব খুঁজুন..."
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    className="w-full pl-8.5 pr-3.5 py-2.5 bg-white border border-border-main rounded-xl text-xs font-semibold outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              {/* Main Subjects Display area */}
              <div className="p-6 flex-1">
                {classMappedSubjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-16 h-16 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-4">
                      <BookMarked size={28} className="stroke-[1.8]" />
                    </div>
                    <h4 className="font-black text-base text-text-main mb-1">
                      কোনো বিষয় বা কিতাব পাওয়া যায়নি
                    </h4>
                    <p className="text-xs text-text-light/80 max-w-xs mb-6 font-semibold">
                      {subjectSearch 
                        ? `"${subjectSearch}" দিয়ে খোঁজা বিষয়ের কোনো মেল মেলেনি।` 
                        : `বর্তমানে এই "${selectedClass.name}" জামাতে কোনো কিতাব বা বিষয় অ্যাসাইন করা নেই।`
                      }
                    </p>
                    {!subjectSearch && (
                      <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-1 px-5 py-2.5 bg-primary/10 hover:bg-primary/15 text-primary font-black text-xs rounded-xl transition-all cursor-pointer"
                      >
                        <Plus size={14} className="stroke-[2.5]" />
                        <span>প্রথম বিষয় ও কিতাব যোগ করুন</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classMappedSubjects.map(({ cs, sub }) => (
                      <div 
                        key={cs.id}
                        className={cn(
                          "p-5 rounded-2xl border border-border-main/70 bg-step-bg/30 hover:bg-white hover:border-primary/20 hover:shadow-md transition-all duration-300 relative group overflow-hidden flex flex-col justify-between"
                        )}
                      >
                        {/* Decorative side border */}
                        <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-1",
                          sub.type === 'আবশ্যিক' ? "bg-indigo-500" : "bg-amber-500"
                        )} />

                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-[10px] font-bold text-text-light/50 font-mono tracking-wider">
                              কোড: {sub.code || 'N/A'}
                            </span>
                            <div className="flex gap-1.5">
                              {sub.type === 'আবশ্যিক' ? (
                                <span className="inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">
                                  আবশ্যিক
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                                  ঐচ্ছিক
                                </span>
                              )}
                            </div>
                          </div>

                          <h4 className="text-base font-black text-text-main leading-snug group-hover:text-primary transition-colors">
                            {sub.name}
                          </h4>
                          
                          {/* Highlighting Book & Jamat Relation */}
                          <div className="mt-2.5 bg-primary/5 dark:bg-primary/10 border border-primary/10 p-2.5 rounded-xl">
                            <p className="text-xs font-semibold text-text-light/80">
                              <span className="text-primary font-black block text-[10px] uppercase tracking-wider mb-0.5">পঠিত কিতাব</span>
                              <span className="text-text-main font-bold">{sub.bookName || 'কিতাবের নাম নেই'}</span>
                              <span className="text-[10px] font-bold text-primary/80 bg-primary/10 px-1.5 py-0.2 rounded-md ml-1.5 inline-block">
                                {selectedClass.name} জামাত
                              </span>
                            </p>
                          </div>

                          {/* Marks info */}
                          <p className="text-xs font-bold text-text-light mt-3 flex items-center gap-1">
                            <Award size={13} className="text-primary shrink-0" />
                            <span>পূর্ণমান: <strong>{enToBnNumber(sub.totalMarks)}</strong> নম্বর</span>
                          </p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border-main/50 flex items-center justify-between">
                          {/* Active State indicators */}
                          <div className="flex items-center gap-1.5">
                            {sub.isActive ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                সক্রিয়
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                নিষ্ক্রিয়
                              </span>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit({ cs, sub })}
                              className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                              title="এডিট করুন"
                            >
                              <Edit size={14} className="stroke-[2.2]" />
                            </button>
                            <button
                              onClick={() => handleDelete({ cs, sub })}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                              title="বাদ দিন"
                            >
                              <Trash2 size={14} className="stroke-[2.2]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <Info size={32} className="text-text-light/40 mb-3" />
              <p className="text-sm font-bold text-text-light">বাম দিক থেকে কোনো একটি মাদ্রাসার জামাত সিলেক্ট করুন।</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCS ? "বিষয় ও কিতাব সম্পাদনা" : "নতুন বিষয় ও কিতাব যোগ করুন"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-hind-siliguri">
          {/* Class selector */}
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">জামাত/শ্রেণী নির্ধারণ *</label>
            <select
              required
              value={formClassId}
              onChange={e => setFormClassId(e.target.value)}
              className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50"
            >
              <option value="" disabled>জামাত নির্বাচন করুন</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-light mb-1.5">বিষয়ের নাম *</label>
              <input 
                required
                type="text" 
                value={formSubjectName} 
                onChange={e => setFormSubjectName(e.target.value)}
                className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
                placeholder="যেমন: হাদিস শরীফ"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-light mb-1.5">পঠিত কিতাবের নাম *</label>
              <input 
                required
                type="text" 
                value={formBookName} 
                onChange={e => setFormBookName(e.target.value)}
                className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
                placeholder="যেমন: মিশকাতুল মাসাবীহ"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-light mb-1.5">বিষয় কোড</label>
              <input 
                type="text" 
                value={formCode} 
                onChange={e => setFormCode(e.target.value)}
                className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
                placeholder="যেমন: HAD-301"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-light mb-1.5">বিষয়ের ধরণ *</label>
              <select 
                required
                value={formType} 
                onChange={e => setFormType(e.target.value as 'আবশ্যিক' | 'ঐচ্ছিক')}
                className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
              >
                <option value="আবশ্যিক">আবশ্যিক</option>
                <option value="ঐচ্ছিক">ঐচ্ছিক</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-light mb-1.5">পূর্ণমান *</label>
              <input 
                required
                type="number" 
                min="0"
                value={formTotalMarks} 
                onChange={e => setFormTotalMarks(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
              />
            </div>
          </div>

          {/* Active status & notice */}
          <div className="flex items-center gap-3 mt-2">
            <input 
              type="checkbox" 
              id="isFormActive"
              checked={formIsActive}
              onChange={e => setFormIsActive(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-border-main"
            />
            <label htmlFor="isFormActive" className="text-xs font-bold text-text-main cursor-pointer">
              বিষয়টি বর্তমানে সক্রিয় পঠিত সিলেবাসের অন্তর্ভুক্ত
            </label>
          </div>

          {/* Prompt explaining the logic */}
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-2.5 mt-1.5">
            <Info size={14} className="text-primary mt-0.5 shrink-0" />
            <p className="text-[11px] font-semibold text-text-light/90 leading-relaxed">
              সেভ করার পর, এই বিষয়টি অটোমেটিক্যালি মাদ্রাসার মূল পঠিত বিষয় খতিয়ান এবং নির্বাচিত জামাতের পঠিত সিলেবাসে যুক্ত ও সংরক্ষিত হয়ে যাবে।
            </p>
          </div>
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-main">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="px-5 py-2.5 bg-step-bg text-text-main font-black text-xs rounded-xl cursor-pointer hover:bg-step-bg/85 transition-colors"
            >
              বাতিল
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-black text-xs rounded-xl cursor-pointer transition-colors shadow-md"
            >
              সেভ করুন
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
