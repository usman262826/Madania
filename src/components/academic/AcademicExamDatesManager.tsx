import React, { useState, useEffect, useMemo } from 'react';
import { CrudTable, Modal } from './CrudTable';
import { AcademicExamDate } from './types';
import { CheckCircle2, XCircle } from 'lucide-react';
import { formatDateToDDMMYYYY } from '../../lib/utils';
import { useData } from '../../contexts/DataContext';

const defaultExamDates: AcademicExamDate[] = [
  { id: '1', examName: '১ম মাসিক (কোরবানির) পরিক্ষা', startDate: '2026-04-10', endDate: '2026-04-15', isActive: true },
  { id: '2', examName: '১ম সাময়িক পরিক্ষা', startDate: '2026-06-15', endDate: '2026-06-30', isActive: true },
  { id: '3', examName: '২য় সাময়িক পরিক্ষা', startDate: '2026-08-15', endDate: '2026-08-30', isActive: true },
  { id: '4', examName: '২য় মাসিক পরিক্ষা', startDate: '2026-10-10', endDate: '2026-10-15', isActive: true },
  { id: '5', examName: 'বার্ষিক পরিক্ষা', startDate: '2026-12-10', endDate: '2026-12-25', isActive: true },
  { id: '6', examName: 'বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ', startDate: '2027-02-10', endDate: '2027-02-20', isActive: true },
  { id: '7', examName: 'হাইআতুল উলিয়া', startDate: '2027-03-01', endDate: '2027-03-10', isActive: true },
];

export const AcademicExamDatesManager: React.FC = () => {
  const { examDates: contextExamDates, updateData, deleteData } = useData();

  const examDates = useMemo(() => {
    return contextExamDates && contextExamDates.length > 0 ? contextExamDates : defaultExamDates;
  }, [contextExamDates]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<AcademicExamDate | null>(null);
  const [formData, setFormData] = useState<Omit<AcademicExamDate, 'id'>>({ examName: '', startDate: '', endDate: '', isActive: true });

  const handleAdd = () => {
    setEditingDate(null);
    setFormData({ examName: '', startDate: '', endDate: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (exam: AcademicExamDate) => {
    setEditingDate(exam);
    setFormData({ examName: exam.examName, startDate: exam.startDate, endDate: exam.endDate, isActive: exam.isActive });
    setIsModalOpen(true);
  };

  const handleDelete = async (exam: AcademicExamDate) => {
    if (window.confirm('আপনি কি নিশ্চিত?')) {
      await deleteData('acad_exam_dates', exam.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingDate
      ? { ...editingDate, ...formData }
      : { id: Date.now().toString(), ...formData };
    
    await updateData('acad_exam_dates', payload);
    setIsModalOpen(false);
  };

  const columns = [
    { key: 'examName', label: 'পরীক্ষার নাম' },
    { 
      key: 'startDate', 
      label: 'শুরুর তারিখ',
      render: (item: AcademicExamDate) => formatDateToDDMMYYYY(item.startDate)
    },
    { 
      key: 'endDate', 
      label: 'শেষের তারিখ',
      render: (item: AcademicExamDate) => formatDateToDDMMYYYY(item.endDate)
    },
    { 
      key: 'isActive', 
      label: 'অবস্থা',
      render: (item: AcademicExamDate) => (
        item.isActive 
          ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold"><CheckCircle2 size={12} /> সক্রিয়</span>
          : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold"><XCircle size={12} /> নিষ্ক্রিয়</span>
      )
    }
  ];

  return (
    <>
      <CrudTable<AcademicExamDate>
        title="পরীক্ষার সময়সীমা"
        subtitle="মাদ্রাসার সকল পরীক্ষার সময়সূচী ব্যবস্থাপনা"
        data={examDates}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchKey="examName"
        searchPlaceholder="পরীক্ষার নাম দিয়ে খুঁজুন..."
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDate ? "পরীক্ষার তারিখ এডিট করুন" : "নতুন পরীক্ষার তারিখ যোগ করুন"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">পরীক্ষার নাম *</label>
            <input 
              required
              type="text" 
              value={formData.examName} 
              onChange={e => setFormData({...formData, examName: e.target.value})}
              className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
              placeholder="যেমন: প্রথম সাময়িক পরীক্ষা"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-light mb-1.5">শুরুর তারিখ *</label>
              <input 
                required
                type="date" 
                value={formData.startDate} 
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-light mb-1.5">শেষের তারিখ *</label>
              <input 
                required
                type="date" 
                value={formData.endDate} 
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            <input 
              type="checkbox" 
              id="isActiveExam"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
              className="w-4 h-4 text-primary rounded border-border-main"
            />
            <label htmlFor="isActiveExam" className="text-sm font-bold text-text-main cursor-pointer">এই পরীক্ষাটি বর্তমানে সক্রিয় আছে</label>
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
