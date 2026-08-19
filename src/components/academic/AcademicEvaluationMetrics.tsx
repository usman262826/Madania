import React, { useState, useEffect, useMemo } from 'react';
import { CrudTable, Modal } from './CrudTable';
import { AcademicEvaluationMetric } from './types';
import { useData } from '../../contexts/DataContext';

const defaultMetrics: AcademicEvaluationMetric[] = [
  { id: '1', name: 'ক্লাস টেস্ট (CT)', weight: 20, description: 'প্রতি মাসে অনুষ্ঠিত ক্লাস টেস্টের গড় নম্বর' },
  { id: '2', name: 'অ্যাসাইনমেন্ট', weight: 10, description: 'বাড়ির কাজ বা নির্ধারিত প্রজেক্ট' },
  { id: '3', name: 'সাময়িক পরীক্ষা', weight: 70, description: 'লিখিত ও মৌখিক মূল পরীক্ষার নম্বর' },
];

export const AcademicEvaluationMetrics: React.FC = () => {
  const { evaluationMetrics: contextMetrics, updateData, deleteData } = useData();

  const metrics = useMemo(() => {
    return contextMetrics && contextMetrics.length > 0 ? contextMetrics : defaultMetrics;
  }, [contextMetrics]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<AcademicEvaluationMetric | null>(null);
  const [formData, setFormData] = useState<Omit<AcademicEvaluationMetric, 'id'>>({ name: '', weight: 0, description: '' });

  const handleAdd = () => {
    setEditingMetric(null);
    setFormData({ name: '', weight: 100, description: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (metric: AcademicEvaluationMetric) => {
    setEditingMetric(metric);
    setFormData({ name: metric.name, weight: metric.weight, description: metric.description });
    setIsModalOpen(true);
  };

  const handleDelete = async (metric: AcademicEvaluationMetric) => {
    if (window.confirm('আপনি কি নিশ্চিত?')) {
      await deleteData('acad_eval_metrics', metric.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingMetric
      ? { ...editingMetric, ...formData }
      : { id: Date.now().toString(), ...formData };
    
    await updateData('acad_eval_metrics', payload);
    setIsModalOpen(false);
  };

  const totalWeight = metrics.reduce((acc, curr) => acc + curr.weight, 0);

  const columns = [
    { key: 'name', label: 'মেট্রিক্সের নাম' },
    { 
      key: 'weight', 
      label: 'মান (Weight %)',
      render: (item: AcademicEvaluationMetric) => <span className="font-bold text-primary">{item.weight}%</span>
    },
    { key: 'description', label: 'বিবরণ' }
  ];

  return (
    <>
      <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
        <p className="text-sm font-bold text-amber-700 dark:text-amber-500">
          সর্বমোট মান (Total Weight): {totalWeight}%
        </p>
        {totalWeight !== 100 && (
          <p className="text-xs font-bold text-rose-500">
            সতর্কতা: সর্বমোট মান ১০০% হওয়া বাঞ্ছনীয়।
          </p>
        )}
      </div>

      <CrudTable<AcademicEvaluationMetric>
        title="মূল্যায়ন মেট্রিক্স"
        subtitle="ফলাফল বা মার্কশীট তৈরির জন্য গ্রেডিং ও মান বন্টন"
        data={metrics}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchKey="name"
        searchPlaceholder="মেট্রিক্স দিয়ে খুঁজুন..."
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMetric ? "মেট্রিক্স এডিট করুন" : "নতুন মেট্রিক্স যোগ করুন"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">মেট্রিক্সের নাম *</label>
            <input 
              required
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
              placeholder="যেমন: ক্লাস টেস্ট (CT)"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">মান (Weight %) *</label>
            <input 
              required
              type="number" 
              min="0"
              max="100"
              value={formData.weight} 
              onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
              className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">বিবরণ</label>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2.5 bg-step-bg border border-border-main rounded-xl text-sm font-semibold outline-none focus:border-primary/50 min-h-[80px]" 
              placeholder="বিস্তারিত..."
            />
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
