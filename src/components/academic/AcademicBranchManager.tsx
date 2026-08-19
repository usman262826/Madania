import React, { useState, useEffect, useMemo } from 'react';
import { CrudTable, Modal } from './CrudTable';
import { AcademicBranch, AcademicClass } from './types';
import { CheckCircle2, XCircle } from 'lucide-react';
import { enToBnNumber, isBranchMatch } from '../../lib/utils';
import { useData } from '../../contexts/DataContext';

const defaultBranches: AcademicBranch[] = [];

export const AcademicBranchManager: React.FC<{ students?: any[] }> = ({ students }) => {
  const { branches: contextBranches, classes: contextClasses, updateData, deleteData } = useData();

  const branches = useMemo(() => contextBranches || [], [contextBranches]);
  const classes = useMemo(() => contextClasses || [], [contextClasses]);

  useEffect(() => {
    window.dispatchEvent(new Event('acad_branches_updated'));
  }, [branches]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<AcademicBranch | null>(null);
  const [formData, setFormData] = useState({ name: '', classId: 'all', maxStudents: 10000, isActive: true });

  const handleAdd = () => {
    setEditingBranch(null);
    setFormData({ name: '', classId: 'all', maxStudents: 10000, isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (branch: AcademicBranch) => {
    setEditingBranch(branch);
    setFormData({ name: branch.name, classId: branch.classId || 'all', maxStudents: branch.maxStudents || 10000, isActive: branch.isActive });
    setIsModalOpen(true);
  };

  const handleDelete = async (branch: AcademicBranch) => {
    if (window.confirm('আপনি কি নিশ্চিত?')) {
      await deleteData('acad_branches', branch.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingBranch
      ? { ...editingBranch, ...formData }
      : { id: Date.now().toString(), ...formData };
    
    await updateData('acad_branches', payload);
    setIsModalOpen(false);
  };

  const branchSummaries = useMemo(() => {
    return branches.map(branch => {
      const branchStudents = (students || []).filter(s => {
        const sBranch = s['শাখা'] || s.branch || '';
        return isBranchMatch(sBranch, branch.name);
      });

      // Group students of this branch by Jamat (Class)
      const classCounts: Record<string, number> = {};
      branchStudents.forEach(s => {
        const sClass = s['জামাত/শ্রেণী'] || s.class || 'অন্যান্য';
        classCounts[sClass] = (classCounts[sClass] || 0) + 1;
      });

      return {
        ...branch,
        totalStudents: branchStudents.length,
        classCounts
      };
    });
  }, [branches, students]);

  const columns = [
    { key: 'name', label: 'শাখার নাম' },
    { 
      key: 'classId', 
      label: 'সংশ্লিষ্ট শ্রেণী',
      render: (item: AcademicBranch) => item.classId === 'all' || !item.classId ? 'সকল শ্রেণী' : (classes.find(c => c.id === item.classId)?.name || 'অজানা')
    },
    { 
      key: 'isActive', 
      label: 'অবস্থা',
      render: (item: AcademicBranch) => (
        item.isActive 
          ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold"><CheckCircle2 size={12} /> সক্রিয়</span>
          : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold"><XCircle size={12} /> নিষ্ক্রিয়</span>
      )
    }
  ];

  const handleImportData = async (rows: any[]) => {
    for (const row of rows) {
      const name = row['শাখার নাম'] || row['name'] || row['Branch'];
      if (name) {
        const payload = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
          name: String(name),
          classId: 'all',
          maxStudents: 10000,
          isActive: true
        };
        await updateData('acad_branches', payload);
      }
    }
  };

  return (
    <div className="space-y-8 font-hind-siliguri text-left">
      <CrudTable<AcademicBranch>
        title="শাখা সমূহ"
        subtitle="শ্রেণীর অধীন শাখা বা সেকশনের তালিকা"
        data={branches}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onImportData={handleImportData}
        searchKey="name"
        searchPlaceholder="শাখার নাম দিয়ে খুঁজুন..."
      />

      {/* শাখা ভিত্তিক সামারি */}
      <div className="mt-8 space-y-4">
        <h3 className="text-xl font-black text-text-main">শাখা ভিত্তিক শিক্ষার্থী বণ্টনের সামারি</h3>
        <p className="text-xs text-text-light/50">প্রতিটি শাখায় কোন জামাতের কতজন ছাত্রী অধ্যয়ন করছে তার রিয়েল-টাইম পরিসংখ্যান</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branchSummaries.map(summary => (
            <div key={summary.id} className="p-6 bg-card border border-border-main rounded-3xl shadow-lg hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-border-main/50">
                <div>
                  <h4 className="text-base font-black text-text-main">{summary.name}</h4>
                  <p className="text-[10px] font-bold text-text-light/50 mt-0.5">
                    শ্রেণী: {summary.classId === 'all' || !summary.classId ? 'সকল শ্রেণী' : (classes.find(c => c.id === summary.classId)?.name || 'অজানা')}
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-black">
                  মোট: {enToBnNumber(summary.totalStudents)} জন
                </span>
              </div>
              
              <div className="space-y-2">
                {Object.keys(summary.classCounts).length > 0 ? (
                  Object.entries(summary.classCounts).map(([className, count]) => (
                    <div key={className} className="flex justify-between items-center text-xs font-semibold text-text-light">
                      <span>{className}</span>
                      <span className="font-bold text-text-main bg-step-bg px-2 py-0.5 rounded-lg">{enToBnNumber(Number(count))} জন</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-light/50 italic text-center py-4">এই শাখায় কোনো শিক্ষার্থী ভর্তি নেই</p>
                )}
              </div>
            </div>
          ))}
          {branchSummaries.length === 0 && (
            <p className="text-sm text-text-light/50 italic py-4 col-span-full text-center">কোনো শাখা যোগ করা হয়নি</p>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBranch ? "শাখা এডিট করুন" : "নতুন শাখা যোগ করুন"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">সংশ্লিষ্ট শ্রেণী</label>
            <select
              value={formData.classId}
              onChange={e => setFormData({...formData, classId: e.target.value})}
              className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50 text-text-main"
            >
              <option value="all">সকল শ্রেণী (ডিফল্ট)</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">শাখার নাম *</label>
            <input 
              required
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50 text-text-main" 
              placeholder="যেমন: ক শাখা (আবু বকর রাঃ)"
            />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <input 
              type="checkbox" 
              id="isActiveBranch"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
              className="w-4 h-4 text-primary rounded border-border-main"
            />
            <label htmlFor="isActiveBranch" className="text-sm font-bold text-text-main cursor-pointer">এই শাখাটি বর্তমানে সক্রিয় আছে</label>
          </div>
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-main">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-step-bg text-text-main font-bold text-sm rounded-xl">বাতিল</button>
            <button type="submit" className="px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-xl">সেভ করুন</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

