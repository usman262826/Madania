import React, { useState, useEffect, useMemo } from 'react';
import { CrudTable, Modal } from './CrudTable';
import { AcademicDepartment } from './types';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const defaultDepartments: AcademicDepartment[] = [];

export const AcademicDepartmentsManager: React.FC = () => {
  const { departments: contextDepartments, updateData, deleteData } = useData();

  const departments = useMemo(() => {
    return contextDepartments || [];
  }, [contextDepartments]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<AcademicDepartment | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });

  const handleAdd = () => {
    setEditingDept(null);
    setFormData({ name: '', description: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (dept: AcademicDepartment) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, description: dept.description, isActive: dept.isActive });
    setIsModalOpen(true);
  };

  const handleDelete = async (dept: AcademicDepartment) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই বিভাগটি মুছে ফেলতে চান?')) {
      await deleteData('acad_departments', dept.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingDept 
      ? { ...editingDept, ...formData }
      : { id: Date.now().toString(), ...formData };
    
    await updateData('acad_departments', payload);
    setIsModalOpen(false);
  };

  const columns = [
    { key: 'name', label: 'বিভাগের নাম' },
    { key: 'description', label: 'বিবরণ' },
    { 
      key: 'isActive', 
      label: 'অবস্থা',
      render: (item: AcademicDepartment) => (
        item.isActive 
          ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold"><CheckCircle2 size={12} /> সক্রিয়</span>
          : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold"><XCircle size={12} /> নিষ্ক্রিয়</span>
      )
    }
  ];

  const handleImportData = async (rows: any[]) => {
    for (const row of rows) {
      const name = row['বিভাগের নাম'] || row['name'] || row['Name'];
      if (name) {
        const payload = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
          name: String(name),
          description: row['বিবরণ'] || row['description'] || '',
          isActive: true
        };
        await updateData('acad_departments', payload);
      }
    }
  };

  return (
    <>
      <CrudTable<AcademicDepartment>
        title="বিভাগ সমূহ"
        subtitle="মাদ্রাসার সকল বিভাগের তালিকা ও ব্যবস্থাপনা"
        data={departments}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onImportData={handleImportData}
        searchKey="name"
        searchPlaceholder="বিভাগের নাম দিয়ে খুঁজুন..."
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDept ? "বিভাগ এডিট করুন" : "নতুন বিভাগ যোগ করুন"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">বিভাগের নাম *</label>
            <input 
              required
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
              placeholder="যেমন: নূরানী বিভাগ"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">বিবরণ</label>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50 min-h-[100px]" 
              placeholder="বিভাগের সংক্ষিপ্ত বিবরণ"
            />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <input 
              type="checkbox" 
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
              className="w-4 h-4 text-primary rounded border-border-main"
            />
            <label htmlFor="isActive" className="text-sm font-bold text-text-main cursor-pointer">এই বিভাগটি বর্তমানে সক্রিয় আছে</label>
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
