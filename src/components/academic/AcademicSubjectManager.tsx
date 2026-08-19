import React, { useState, useEffect, useMemo } from 'react';
import { CrudTable, Modal } from './CrudTable';
import { AcademicSubject } from './types';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const defaultSubjects: AcademicSubject[] = [
  { id: 'sub-1', name: 'আল-কুরআন', code: 'QRN-101', bookName: 'কুরআন মজিদ', type: 'আবশ্যিক', totalMarks: 100, isActive: true },
  { id: 'sub-2', name: 'ফিকхуস সুন্নাহ', code: 'FIQ-201', bookName: 'আল-কুদূরী', type: 'আবশ্যিক', totalMarks: 100, isActive: true },
  { id: 'sub-3', name: 'হাদিস শরীফ', code: 'HAD-301', bookName: 'মেশকাত', type: 'আবশ্যিক', totalMarks: 100, isActive: true },
  { id: 'sub-4', name: 'নাহু', code: 'NAH-401', bookName: 'হেদায়াতুন্নাহু', type: 'আবশ্যিক', totalMarks: 100, isActive: true },
  { id: 'sub-5', name: 'সরফ', code: 'SAR-501', bookName: 'ইলমুস সীগাহ', type: 'আবশ্যিক', totalMarks: 100, isActive: true },
  { id: 'sub-6', name: 'বাংলা', code: 'BAN-101', bookName: 'আমার বাংলা বই', type: 'আবশ্যিক', totalMarks: 100, isActive: true },
  { id: 'sub-7', name: 'গণিত', code: 'MAT-101', bookName: 'প্রাথমিক গণিত', type: 'আবশ্যিক', totalMarks: 100, isActive: true },
  { id: 'sub-8', name: 'ইংরেজি', code: 'ENG-101', bookName: 'English For Today', type: 'আবশ্যিক', totalMarks: 100, isActive: true },
];

export const AcademicSubjectManager: React.FC = () => {
  const { subjects: contextSubjects, updateData, deleteData } = useData();

  const subjects = useMemo(() => {
    return contextSubjects && contextSubjects.length > 0 ? contextSubjects : defaultSubjects;
  }, [contextSubjects]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<AcademicSubject | null>(null);
  const [formData, setFormData] = useState<Omit<AcademicSubject, 'id'>>({ name: '', code: '', bookName: '', type: 'আবশ্যিক', totalMarks: 100, isActive: true });

  const handleAdd = () => {
    setEditingSubject(null);
    setFormData({ name: '', code: '', bookName: '', type: 'আবশ্যিক', totalMarks: 100, isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (sub: AcademicSubject) => {
    setEditingSubject(sub);
    setFormData({ name: sub.name, code: sub.code, bookName: sub.bookName, type: sub.type, totalMarks: sub.totalMarks, isActive: sub.isActive });
    setIsModalOpen(true);
  };

  const handleDelete = async (sub: AcademicSubject) => {
    if (window.confirm('আপনি কি নিশ্চিত?')) {
      await deleteData('acad_subjects', sub.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingSubject
      ? { ...editingSubject, ...formData }
      : { id: 'sub-' + Date.now().toString(), ...formData };
    
    await updateData('acad_subjects', payload);
    setIsModalOpen(false);
  };

  const columns = [
    { key: 'name', label: 'বিষয়ের নাম' },
    { key: 'bookName', label: 'কিতাবের নাম' },
    { key: 'code', label: 'বিষয় কোড' },
    { key: 'type', label: 'ধরণ' },
    { key: 'totalMarks', label: 'পূর্ণমান' },
    { 
      key: 'isActive', 
      label: 'অবস্থা',
      render: (item: AcademicSubject) => (
        item.isActive 
          ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold"><CheckCircle2 size={12} /> সক্রিয়</span>
          : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold"><XCircle size={12} /> নিষ্ক্রিয়</span>
      )
    }
  ];

  return (
    <>
      <CrudTable<AcademicSubject>
        title="বিষয় ও কিতাব সমূহ"
        subtitle="মাদ্রাসায় পঠিত সকল কিতাব বা বিষয়ের তালিকা"
        data={subjects}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchKey="name"
        searchPlaceholder="বিষয়ের নাম দিয়ে খুঁজুন..."
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSubject ? "বিষয় এডিট করুন" : "নতুন বিষয় যোগ করুন"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-light mb-1.5">বিষয়ের নাম *</label>
              <input 
                required
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
                placeholder="যেমন: আল-কুরআন"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-light mb-1.5">কিতাবের নাম</label>
              <input 
                type="text" 
                value={formData.bookName} 
                onChange={e => setFormData({...formData, bookName: e.target.value})}
                className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
                placeholder="যেমন: কুরআন মজিদ"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-light mb-1.5">বিষয় কোড</label>
              <input 
                type="text" 
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value})}
                className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
                placeholder="যেমন: QRN-101"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-light mb-1.5">ধরণ *</label>
              <select 
                required
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value as 'আবশ্যিক' | 'ঐচ্ছিক'})}
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
                value={formData.totalMarks} 
                onChange={e => setFormData({...formData, totalMarks: Number(e.target.value)})}
                className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <input 
              type="checkbox" 
              id="isActiveSubject"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
              className="w-4 h-4 text-primary rounded border-border-main"
            />
            <label htmlFor="isActiveSubject" className="text-sm font-bold text-text-main cursor-pointer">এই বিষয়টি বর্তমানে সক্রিয় আছে</label>
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
