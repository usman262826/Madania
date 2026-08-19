import React, { useState, useEffect, useMemo } from 'react';
import { CrudTable, Modal } from './CrudTable';
import { AcademicTeacherSubject, AcademicClass, AcademicSubject } from './types';
import { useData } from '../../contexts/DataContext';

export const AcademicTeacherSubjectAssign: React.FC = () => {
  const { 
    teacherSubjects: contextTeacherSubjects, 
    classes: contextClasses, 
    subjects: contextSubjects, 
    teachers: contextTeachers, 
    updateData, 
    deleteData 
  } = useData();

  const teacherSubjects = useMemo(() => contextTeacherSubjects || [], [contextTeacherSubjects]);
  const classes = useMemo(() => contextClasses || [], [contextClasses]);
  const subjects = useMemo(() => contextSubjects || [], [contextSubjects]);
  const teachers = useMemo(() => contextTeachers || [], [contextTeachers]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTS, setEditingTS] = useState<AcademicTeacherSubject | null>(null);
  const [formData, setFormData] = useState<Omit<AcademicTeacherSubject, 'id'>>({ teacherId: '', subjectId: '', classId: '' });

  const handleAdd = () => {
    setEditingTS(null);
    setFormData({ 
      teacherId: teachers[0]?.id || '', 
      subjectId: subjects[0]?.id || '', 
      classId: classes[0]?.id || '' 
    });
    setIsModalOpen(true);
  };

  const handleEdit = (ts: AcademicTeacherSubject) => {
    setEditingTS(ts);
    setFormData({ teacherId: ts.teacherId, subjectId: ts.subjectId, classId: ts.classId });
    setIsModalOpen(true);
  };

  const handleDelete = async (ts: AcademicTeacherSubject) => {
    if (window.confirm('আপনি কি নিশ্চিত?')) {
      await deleteData('acad_teacher_subjects', ts.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingTS
      ? { ...editingTS, ...formData }
      : { id: Date.now().toString(), ...formData };
    
    await updateData('acad_teacher_subjects', payload);
    setIsModalOpen(false);
  };

  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'অজানা শ্রেণী';
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'অজানা বিষয়';
  const getTeacherName = (id: string) => {
    const t = teachers.find(t => t.id === id);
    return t ? (t['শিক্ষকের নাম'] || t.name) : 'অজানা শিক্ষক';
  };

  const columns = [
    { 
      key: 'teacherId', 
      label: 'শিক্ষক',
      render: (item: AcademicTeacherSubject) => <span className="font-bold text-primary">{getTeacherName(item.teacherId)}</span>
    },
    { 
      key: 'classId', 
      label: 'জামাত/শ্রেণী',
      render: (item: AcademicTeacherSubject) => getClassName(item.classId)
    },
    { 
      key: 'subjectId', 
      label: 'বিষয়/কিতাব',
      render: (item: AcademicTeacherSubject) => getSubjectName(item.subjectId)
    }
  ];

  return (
    <>
      <CrudTable<AcademicTeacherSubject>
        title="শিক্ষক-সাবজেক্ট অ্যাসাইন"
        subtitle="কোন শিক্ষক কোন জামাতে কোন কিতাব পড়াবেন তার নির্ধারণ"
        data={teacherSubjects}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTS ? "অ্যাসাইনমেন্ট এডিট করুন" : "নতুন শিক্ষক অ্যাসাইন করুন"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">শিক্ষক নির্বাচন করুন *</label>
            <select
              required
              value={formData.teacherId}
              onChange={e => setFormData({...formData, teacherId: e.target.value})}
              className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50"
            >
              <option value="" disabled>শিক্ষক নির্বাচন করুন</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t['শিক্ষকের নাম'] || t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">জামাত/শ্রেণী নির্বাচন করুন *</label>
            <select
              required
              value={formData.classId}
              onChange={e => setFormData({...formData, classId: e.target.value})}
              className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50"
            >
              <option value="" disabled>শ্রেণী নির্বাচন করুন</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">বিষয়/কিতাব নির্বাচন করুন *</label>
            <select
              required
              value={formData.subjectId}
              onChange={e => setFormData({...formData, subjectId: e.target.value})}
              className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50"
            >
              <option value="" disabled>বিষয় নির্বাচন করুন</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.bookName})</option>)}
            </select>
          </div>
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-main">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-step-bg text-text-main font-bold text-sm rounded-xl">বাতিল</button>
            <button type="submit" className="px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-xl">সেভ করুন</button>
          </div>
        </form>
      </Modal>
    </>
  );
};
