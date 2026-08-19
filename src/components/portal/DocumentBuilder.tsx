import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, Move, Trash2, Printer, Plus, Search, 
  Filter, ChevronDown, CheckSquare, Square, 
  Settings2, FileText, Layout, X, Eye, Save, 
  Download, Users, ChevronRight, LayoutGrid, Minus, 
  Type, Image as ImageIcon, Copy, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student } from '../../types';
import { enToBnNumber, formatDateToDDMMYYYY, cn } from '../../lib/utils';
import { useData } from '../../contexts/DataContext';
// Removed JAMAT_LIST import as it's now handled by useData context

interface DraggableField {
  id: string;
  label: string;
  key: keyof Student | 'custom';
  customText?: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: string;
  color: string;
  align: 'left' | 'center' | 'right';
}

interface DocumentConfig {
  id: string;
  name: string;
  background: string | null;
  fields: DraggableField[];
  width: number;
  height: number;
  unit: 'px' | 'mm';
  pageOrientation: 'portrait' | 'landscape';
  pageSize: 'A4' | 'A5' | 'Custom';
}

interface DocumentBuilderProps {
  type: 'admit' | 'testimonial';
  students: Student[];
  exams?: string[];
}

const PAGE_SIZES = {
  A4: { portrait: { w: 794, h: 1123 }, landscape: { w: 1123, h: 794 } },
  A5: { portrait: { w: 559, h: 794 }, landscape: { w: 794, h: 559 } },
  Custom: { portrait: { w: 800, h: 500 }, landscape: { w: 800, h: 500 } }
};

export const DocumentBuilder: React.FC<DocumentBuilderProps> = ({ type, students, exams }) => {
  const { jamatList } = useData();
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [configs, setConfigs] = useState<DocumentConfig[]>(() => {
    const saved = localStorage.getItem(`doc_configs_${type}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeConfig, setActiveConfig] = useState<DocumentConfig | null>(() => {
    const saved = localStorage.getItem(`doc_configs_${type}`);
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.length > 0 ? parsed[0] : null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJamat, setSelectedJamat] = useState('select-prompt');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Get current selected field
  const selectedField = useMemo(() => 
    activeConfig?.fields.find(f => f.id === selectedFieldId) || null
  , [activeConfig, selectedFieldId]);

  // Browser Back Button Support
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (viewMode === 'editor') {
        event.preventDefault();
        setViewMode('list');
        // Push state again to prevent going back further if they stay on list
        window.history.pushState({ view: 'list' }, '');
      }
    };

    if (viewMode === 'editor') {
      window.history.pushState({ view: 'editor' }, '');
      window.addEventListener('popstate', handlePopState);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewMode]);

  // Persistence
  useEffect(() => {
    localStorage.setItem(`doc_configs_${type}`, JSON.stringify(configs));
  }, [configs, type]);

  // Handle Canvas Scaling - Responsive Magic
  useEffect(() => {
    if (!activeConfig || !viewportRef.current || viewMode !== 'editor') return;

    const updateScale = () => {
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const padding = window.innerWidth < 640 ? 20 : 60;
      const availableWidth = rect.width - padding;
      const availableHeight = rect.height - padding;
      
      if (availableWidth <= 0 || availableHeight <= 0) return;
      
      const scaleX = availableWidth / activeConfig.width;
      const scaleY = availableHeight / activeConfig.height;
      
      setCanvasScale(Math.min(1.2, scaleX, scaleY));
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(viewportRef.current);
    const timeout = setTimeout(updateScale, 150);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [activeConfig, isSidebarVisible, viewMode]);

  // Filtering Logic
  const filteredStudents = useMemo(() => {
    if (selectedJamat === 'select-prompt') return [];

    return students.filter(s => {
      const matchesSearch = 
        s['শিক্ষার্থীর নাম']?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s['রেজিস্ট্রেশন/আইডি নম্বর']?.includes(searchQuery) ||
        s['রোল নম্বর']?.includes(searchQuery);
      
      const matchesJamat = selectedJamat === 'সব জামাত' || s['জামাত/শ্রেণী'] === selectedJamat;
      
      return matchesSearch && matchesJamat;
    });
  }, [students, searchQuery, selectedJamat]);

  const handleCreateNew = () => {
    const newConfig: DocumentConfig = {
      id: Date.now().toString(),
      name: `${type === 'admit' ? 'অ্যাডমিট কার্ড' : 'প্রত্যয়ন পত্র'} - ${enToBnNumber((configs.length + 1).toString())}`,
      background: null,
      fields: [],
      width: 800,
      height: 500,
      unit: 'px',
      pageOrientation: 'landscape',
      pageSize: 'Custom',
    };
    setConfigs([...configs, newConfig]);
    setActiveConfig(newConfig);
    setViewMode('editor');
    if (window.innerWidth < 1024) setIsSidebarVisible(true);
  };

  const updateActiveConfig = (updates: Partial<DocumentConfig>) => {
    if (!activeConfig) return;
    const updated = { ...activeConfig, ...updates };
    
    if (updates.pageSize || updates.pageOrientation) {
      const size = updates.pageSize || activeConfig.pageSize;
      const orient = updates.pageOrientation || activeConfig.pageOrientation;
      if (size !== 'Custom') {
        updated.width = PAGE_SIZES[size][orient].w;
        updated.height = PAGE_SIZES[size][orient].h;
      }
    }

    setActiveConfig(updated);
    setConfigs(configs.map(c => c.id === activeConfig.id ? updated : c));
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeConfig) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        updateActiveConfig({ background: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addField = (label: string, key: keyof Student | 'custom', customText?: string) => {
    if (!activeConfig) return;
    const newField: DraggableField = {
      id: Date.now().toString(),
      label,
      key,
      customText,
      x: 50,
      y: 50,
      fontSize: 20,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center'
    };
    updateActiveConfig({ fields: [...activeConfig.fields, newField] });
  };

  const handleFieldDrag = (e: any, fieldId: string) => {
    if (!containerRef.current || !activeConfig) return;
    setIsDragging(fieldId);

    const moveHandler = (moveEvent: any) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;

      updateActiveConfig({
        fields: activeConfig.fields.map(f => 
          f.id === fieldId ? { ...f, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : f
        )
      });
    };

    const stopHandler = () => {
      setIsDragging(null);
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', stopHandler);
      window.removeEventListener('touchmove', moveHandler);
      window.removeEventListener('touchend', stopHandler);
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', stopHandler);
    window.addEventListener('touchmove', moveHandler, { passive: false });
    window.addEventListener('touchend', stopHandler);
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id || ''));
    }
  };

  const getFieldValue = (field: DraggableField, student: Student) => {
    if (field.key === 'custom') return field.customText || '';
    const val = student[field.key as keyof Student];
    if (typeof val === 'string' && val.includes('-') && val.length === 10) {
      try { return formatDateToDDMMYYYY(val); } catch (e) { return val; }
    }
    return val || '---';
  };

  const handlePrint = () => {
    if (selectedStudents.length === 0) {
      alert('অনুগ্রহ করে অন্তত একজন শিক্ষার্থী নির্বাচন করুন।');
      return;
    }
    window.print();
  };

  const renderListView = () => (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8fafc] font-kalpurush">
      {/* List Header */}
      <div className="h-auto bg-white border-b border-border-main p-4 lg:p-6 shrink-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 w-full lg:w-auto">
            <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
              <Users size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-text-main tracking-tight leading-none mb-2">শিক্ষার্থী ম্যানেজমেন্ট</h2>
              <p className="text-[11px] text-text-light/50 uppercase tracking-[0.2em] font-black">
                {selectedJamat === 'select-prompt' ? 'অনুগ্রহ করে জামাত সিলেক্ট করুন' : `${enToBnNumber(filteredStudents.length.toString())} জন শিক্ষার্থীর তথ্য পাওয়া গেছে`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 sm:min-w-[400px] group">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/30 group-focus-within:text-primary transition-all" />
              <input 
                type="text" 
                placeholder="নাম, রোল বা আইডি নম্বর দিয়ে সার্চ করুন..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/10 focus:bg-white rounded-3xl text-sm font-bold outline-none transition-all shadow-inner"
              />
            </div>
            <select 
              value={selectedJamat}
              onChange={e => setSelectedJamat(e.target.value)}
              className="w-full sm:w-auto px-8 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/10 focus:bg-white rounded-3xl text-sm font-black outline-none cursor-pointer transition-all shadow-inner min-w-[220px]"
            >
              <option value="select-prompt">জামাত সিলেক্ট করা হয়নি</option>
              <option value="সব জামাত">সব জামাত</option>
              {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 no-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          {selectedJamat !== 'select-prompt' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
               <div className="flex items-center gap-4 w-full sm:w-auto">
                  <button 
                    onClick={toggleAllSelection}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-3 text-[11px] font-black text-text-light/60 hover:text-primary transition-colors bg-white px-6 py-4 rounded-2xl border border-border-main shadow-sm hover:shadow-md"
                  >
                    <CheckSquare size={18} /> {selectedStudents.length === filteredStudents.length ? 'সব আনসিলেক্ট করুন' : 'সব নির্বাচন করুন'}
                  </button>
                  
                  <button 
                    onClick={() => setViewMode('editor')}
                    className="flex-1 sm:flex-none px-6 py-4 bg-secondary text-white rounded-2xl text-[11px] font-black flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20 uppercase tracking-widest"
                  >
                    <Settings2 size={18} /> ডিজাইন টুলস
                  </button>
               </div>
               {selectedStudents.length > 0 && (
                 <motion.button 
                  initial={{ scale: 0.9, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  onClick={handlePrint}
                  className="w-full sm:w-auto px-10 py-4 bg-primary text-white font-black text-xs rounded-3xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all"
                 >
                   <Printer size={22} /> নির্বাচিত {enToBnNumber(selectedStudents.length.toString())} জন প্রিন্ট করুন
                 </motion.button>
               )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {filteredStudents.map(student => (
              <motion.div 
                key={student.id}
                whileHover={{ y: -6 }}
                onClick={() => toggleStudentSelection(student.id || '')}
                className={cn(
                  "bg-white border-2 rounded-[2.5rem] p-5 transition-all group flex flex-col justify-between h-full relative cursor-pointer",
                  selectedStudents.includes(student.id || '') 
                    ? "border-primary ring-4 ring-primary/5 shadow-2xl shadow-primary/10" 
                    : "border-transparent hover:border-primary/20 shadow-sm hover:shadow-xl"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0",
                    selectedStudents.includes(student.id || '') 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                      : "bg-slate-50 text-text-light/20 border border-border-main"
                  )}>
                    {selectedStudents.includes(student.id || '') ? <Check size={26} strokeWidth={4} /> : <Users size={26} />}
                  </div>
                  <div className="px-3 py-1.5 bg-secondary/10 border border-secondary/20 rounded-xl text-[10px] font-black text-secondary uppercase tracking-widest shrink-0">
                    {student['জামাত/শ্রেণী']}
                  </div>
                </div>

                <div className="mb-6 min-w-0">
                  <h4 className="text-lg font-black text-text-main truncate group-hover:text-primary transition-colors leading-tight mb-2">
                    {student['শিক্ষার্থীর নাম']}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-text-light/50 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">আইডি: {enToBnNumber(student['রেজিস্ট্রেশন/আইডি নম্বর'] || '')}</span>
                    <span className="text-[10px] font-bold text-text-light/50 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">রোল: {enToBnNumber(student['রোল নম্বর'] || '')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-5 border-t border-dashed border-border-main">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedStudents([student.id || '']); setTimeout(handlePrint, 100); }}
                    className="flex-1 px-4 py-3 bg-primary/5 text-primary text-[10px] font-black rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Printer size={16} /> প্রিন্ট
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (configs.length > 0) setActiveConfig(configs[0]); setViewMode('editor'); }}
                    className="w-12 h-12 bg-slate-50 text-text-light/40 hover:bg-slate-100 hover:text-text-main rounded-2xl transition-all flex items-center justify-center border border-transparent hover:border-border-main"
                  >
                    <Settings2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {selectedJamat === 'select-prompt' ? (
            <div className="flex flex-col items-center justify-center py-40 text-text-light/20">
               <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-8 rotate-12">
                 <Filter size={48} strokeWidth={1} />
               </div>
               <p className="text-xl font-black uppercase tracking-[0.4em] text-text-light/30">জামাত সিলেক্ট করুন</p>
               <p className="text-sm font-bold text-text-light/20 mt-4 max-w-xs text-center">উপরে ড্রপডাউন থেকে একটি জামাত সিলেক্ট করে শিক্ষার্থীদের তালিকা দেখুন</p>
            </div>
          ) : filteredStudents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 text-text-light/20">
               <Users size={80} strokeWidth={1} />
               <p className="mt-8 text-xl font-black uppercase tracking-[0.4em]">কোন শিক্ষার্থী পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderEditorView = () => (
    <div className="flex flex-col lg:flex-row h-screen bg-[#f1f5f9] overflow-hidden relative font-kalpurush">
      {/* Design Editor Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarVisible && (
          <motion.div 
            initial={{ x: -360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -360, opacity: 0 }}
            className="fixed inset-0 lg:relative lg:inset-auto bg-white border-r border-border-main shadow-2xl lg:shadow-none z-50 flex flex-col w-full lg:w-[340px]"
          >
            <div className="p-6 border-b border-border-main flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Settings2 size={20} />
                 </div>
                 <h3 className="font-black text-text-main text-lg tracking-tight">ডিজাইন টুলস</h3>
              </div>
              <button onClick={() => setIsSidebarVisible(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-text-light/40 hover:text-text-main">
                 <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-32">
              {/* Back to List */}
              <button 
                onClick={() => setViewMode('list')}
                className="w-full px-5 py-4 bg-primary/5 text-primary border border-primary/20 rounded-2xl text-[11px] font-black flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all shadow-sm uppercase tracking-widest"
              >
                <ChevronRight className="rotate-180" size={16} /> শিক্ষার্থী ম্যানেজমেন্ট
              </button>

              {selectedField ? (
                /* Field Properties Panel */
                <motion.section 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 bg-slate-50 p-5 rounded-3xl border border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                      <Type size={14} /> ফিল্ড প্রোপার্টিজ
                    </h4>
                    <button 
                      onClick={() => setSelectedFieldId(null)}
                      className="text-[10px] font-black text-text-light/40 hover:text-text-main"
                    >
                      বন্ধ করুন
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-text-light/40 uppercase block mb-2">ফিল্ড লেবেল</label>
                      <div className="px-4 py-3 bg-white border border-border-main rounded-xl text-xs font-bold text-text-main">
                        {selectedField.label}
                      </div>
                    </div>

                    {selectedField.key === 'custom' && (
                      <div>
                        <label className="text-[10px] font-black text-text-light/40 uppercase block mb-2">কাস্টম টেক্সট</label>
                        <input 
                          type="text"
                          value={selectedField.customText}
                          onChange={(e) => updateActiveConfig({ fields: activeConfig!.fields.map(f => f.id === selectedFieldId ? { ...f, customText: e.target.value } : f) })}
                          className="w-full px-4 py-3 bg-white border border-border-main rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-text-light/40 uppercase block mb-2">ফন্ট সাইজ</label>
                        <div className="flex items-center bg-white border border-border-main rounded-xl overflow-hidden">
                          <button onClick={() => updateActiveConfig({ fields: activeConfig!.fields.map(f => f.id === selectedFieldId ? { ...f, fontSize: Math.max(8, f.fontSize - 1) } : f) })} className="flex-1 p-2 hover:bg-slate-50 transition-colors border-r border-border-main"><Minus size={14} /></button>
                          <span className="flex-[1.5] text-center text-xs font-black">{enToBnNumber(selectedField.fontSize.toString())}</span>
                          <button onClick={() => updateActiveConfig({ fields: activeConfig!.fields.map(f => f.id === selectedFieldId ? { ...f, fontSize: f.fontSize + 1 } : f) })} className="flex-1 p-2 hover:bg-slate-50 transition-colors border-l border-border-main"><Plus size={14} /></button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-text-light/40 uppercase block mb-2">ফন্ট ওয়েট</label>
                        <button 
                          onClick={() => updateActiveConfig({ fields: activeConfig!.fields.map(f => f.id === selectedFieldId ? { ...f, fontWeight: f.fontWeight === 'bold' ? 'normal' : 'bold' } : f) })}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl text-xs font-black transition-all border",
                            selectedField.fontWeight === 'bold' ? "bg-primary text-white border-primary" : "bg-white text-text-main border-border-main"
                          )}
                        >
                          Bold
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-text-light/40 uppercase block mb-2">টেক্সট কালার</label>
                      <div className="flex items-center gap-3 bg-white p-2 border border-border-main rounded-xl">
                        <input 
                          type="color" 
                          value={selectedField.color}
                          onChange={(e) => updateActiveConfig({ fields: activeConfig!.fields.map(f => f.id === selectedFieldId ? { ...f, color: e.target.value } : f) })}
                          className="w-10 h-10 border-none bg-transparent cursor-pointer rounded-lg overflow-hidden"
                        />
                        <span className="text-[10px] font-mono text-text-light/60 uppercase">{selectedField.color}</span>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center gap-2">
                      <button 
                        onClick={() => { updateActiveConfig({ fields: activeConfig!.fields.filter(f => f.id !== selectedFieldId) }); setSelectedFieldId(null); }}
                        className="flex-1 px-4 py-3 bg-rose-50 text-rose-500 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                      >
                        <Trash2 size={14} /> ফিল্ডটি মুছুন
                      </button>
                    </div>
                  </div>
                </motion.section>
              ) : (
                /* Global Settings Sections */
                <>
                  <section className="space-y-4">
                     <h4 className="text-[10px] font-black text-text-light/40 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Copy size={12} /> টেমপ্লেট নির্বাচন করুন
                     </h4>
                     <div className="space-y-2">
                        {configs.map(c => (
                          <button 
                            key={c.id}
                            onClick={() => { setActiveConfig(c); setSelectedFieldId(null); }}
                            className={cn(
                              "w-full px-4 py-4 rounded-2xl text-xs font-bold text-left border transition-all flex items-center justify-between group",
                              activeConfig?.id === c.id ? "bg-primary/5 border-primary/30 text-primary shadow-sm" : "bg-slate-50 border-transparent hover:border-border-main"
                            )}
                          >
                            <span className="truncate">{c.name}</span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); if(confirm('আপনি কি এই টেমপ্লেটটি ডিলিট করতে চান?')) setConfigs(configs.filter(x => x.id !== c.id)); }} className="p-1 hover:text-rose-500"><Trash2 size={16} /></button>
                            </div>
                          </button>
                        ))}
                        <button onClick={handleCreateNew} className="w-full px-4 py-4 border-2 border-dashed border-border-main rounded-2xl text-[10px] font-black text-text-light/40 hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2">
                           <Plus size={16} /> নতুন টেমপ্লেট
                        </button>
                     </div>
                  </section>

                  {activeConfig && (
                    <>
                      <section className="space-y-4">
                         <h4 className="text-[10px] font-black text-text-light/40 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Layout size={12} /> পেইজ কনফিগারেশন
                         </h4>
                         <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                               <input 
                                  type="text" 
                                  value={activeConfig.name} 
                                  onChange={e => updateActiveConfig({ name: e.target.value })}
                                  className="w-full px-4 py-3.5 bg-slate-50 border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                               />
                            </div>
                            <select 
                              value={activeConfig.pageSize}
                              onChange={e => updateActiveConfig({ pageSize: e.target.value as any })}
                              className="w-full px-4 py-3.5 bg-slate-50 border border-border-main rounded-2xl text-xs font-bold outline-none cursor-pointer"
                            >
                              <option value="A4">A4 সাইজ</option>
                              <option value="A5">A5 সাইজ</option>
                              <option value="Custom">কাস্টম সাইজ</option>
                            </select>
                            <select 
                              value={activeConfig.pageOrientation}
                              onChange={e => updateActiveConfig({ pageOrientation: e.target.value as any })}
                              className="w-full px-4 py-3.5 bg-slate-50 border border-border-main rounded-2xl text-xs font-bold outline-none cursor-pointer"
                            >
                              <option value="portrait">পোর্ট্রেট</option>
                              <option value="landscape">ল্যান্ডস্কেপ</option>
                            </select>
                         </div>
                      </section>

                      <section className="space-y-4">
                         <h4 className="text-[10px] font-black text-text-light/40 uppercase tracking-[0.2em] flex items-center gap-2">
                            <ImageIcon size={12} /> ব্যাকগ্রাউন্ড ইমেজ
                         </h4>
                         <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" id="bg-upload" />
                         <label htmlFor="bg-upload" className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-border-main rounded-[2rem] cursor-pointer hover:bg-primary/5 hover:border-primary/20 transition-all group">
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-primary/5">
                               <Upload size={20} />
                            </div>
                            <span className="text-[10px] font-black text-text-light/50">ইমেজ আপলোড করুন</span>
                         </label>
                         {activeConfig.background && (
                            <button onClick={() => updateActiveConfig({ background: null })} className="text-[10px] font-black text-rose-500 flex items-center gap-2 hover:underline px-2">
                               <Trash2 size={14} /> ব্যাকগ্রাউন্ড মুছুন
                            </button>
                         )}
                      </section>

                      <section className="space-y-4">
                         <h4 className="text-[10px] font-black text-text-light/40 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Type size={12} /> ডাটা ফিল্ড যোগ করুন
                         </h4>
                         <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: 'শিক্ষার্থীর নাম', key: 'শিক্ষার্থীর নাম' },
                              { label: 'পিতার নাম', key: 'পিতার নাম' },
                              { label: 'জামাত/শ্রেণী', key: 'জামাত/শ্রেণী' },
                              { label: 'রোল নম্বর', key: 'রোল নম্বর' },
                              { label: 'আইডি নম্বর', key: 'রেজিস্ট্রেশন/আইডি নম্বর' },
                              { label: 'ঠিকানা/গ্রাম', key: 'গ্রাম' },
                              { label: 'বর্তমান তারিখ', key: 'custom', val: enToBnNumber(new Date().toLocaleDateString('bn-BD')) },
                              { label: 'পরিক্ষার নাম', key: 'custom', val: type === 'admit' ? (exams?.[0] || 'বার্ষিক পরীক্ষা') : '' },
                            ].map(f => (
                              <button 
                                key={f.label}
                                onClick={() => addField(f.label, f.key as any, f.val)}
                                className="px-4 py-3 bg-white border border-border-main rounded-2xl text-[10px] font-black hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center gap-2 text-left shadow-sm"
                              >
                                <Plus size={14} className="text-primary" /> {f.label}
                              </button>
                            ))}
                         </div>
                      </section>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Toggle Sidebar Button when hidden */}
        {!isSidebarVisible && (
           <motion.button 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            onClick={() => setIsSidebarVisible(true)}
            className="fixed top-1/2 left-0 -translate-y-1/2 w-10 h-24 bg-primary text-white border border-l-0 border-primary rounded-r-2xl shadow-2xl flex items-center justify-center z-[100] hover:w-12 transition-all group"
           >
              <ChevronRight size={24} className="group-hover:scale-110 transition-transform" />
           </motion.button>
        )}

        {/* Mobile Toggle Button */}
        {!isSidebarVisible && (
           <button 
            onClick={() => setIsSidebarVisible(true)}
            className="fixed bottom-10 right-10 w-16 h-16 bg-secondary text-white rounded-full shadow-2xl flex items-center justify-center z-[60] lg:hidden hover:scale-110 active:scale-95 transition-all"
           >
              <Settings2 size={28} />
           </button>
        )}

        {/* Canvas Area */}
        <div 
          ref={viewportRef} 
          onClick={() => setSelectedFieldId(null)}
          className="flex-1 bg-[#e2e8f0] relative overflow-hidden flex items-center justify-center p-4 sm:p-12 lg:p-20"
        >
           <div className="absolute top-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/80 backdrop-blur-md border border-border-main rounded-full text-[11px] font-black text-text-light/50 uppercase tracking-[0.2em] shadow-lg z-10 flex items-center gap-4">
              <Layout size={14} className="text-primary" /> লাইভ প্রিভিউ ({enToBnNumber(Math.round(canvasScale * 100).toString())}%)
           </div>

           {activeConfig ? (
             <div 
              className="relative transition-transform duration-500 ease-out shrink-0" 
              style={{ transform: `scale(${canvasScale})` }}
             >
                <div 
                  ref={containerRef}
                  className="bg-white shadow-[0_60px_150px_-40px_rgba(0,0,0,0.3)] overflow-hidden shrink-0 relative"
                  style={{ 
                    width: activeConfig.width, 
                    height: activeConfig.height,
                    backgroundImage: activeConfig.background ? `url(${activeConfig.background})` : 'none',
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                  }}
                >
                   {!activeConfig.background && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-100 pointer-events-none p-20 opacity-50">
                        <Layout size={200} strokeWidth={1} />
                        <p className="mt-10 font-black uppercase tracking-[1em] text-3xl text-slate-200">New Design</p>
                     </div>
                   )}

                   {activeConfig.fields.map(field => (
                     <div 
                        key={field.id}
                        onMouseDown={(e) => { e.stopPropagation(); handleFieldDrag(e, field.id); setSelectedFieldId(field.id); }}
                        onTouchStart={(e) => { e.stopPropagation(); handleFieldDrag(e, field.id); setSelectedFieldId(field.id); }}
                        className={cn(
                          "absolute cursor-move select-none p-2.5 border-2 border-transparent rounded-xl group transition-all",
                          isDragging === field.id ? "scale-105 z-50 border-primary bg-white/60 shadow-xl" : "z-10",
                          selectedFieldId === field.id ? "border-primary ring-4 ring-primary/10 bg-primary/5" : "hover:border-primary/40 hover:bg-primary/5"
                        )}
                        style={{ 
                          left: `${field.x}%`, 
                          top: `${field.y}%`,
                          transform: 'translate(-50%, -50%)',
                          fontSize: `${field.fontSize}px`,
                          fontWeight: field.fontWeight,
                          color: field.color,
                          textAlign: field.align,
                          fontFamily: 'Kalpurush, sans-serif'
                        }}
                     >
                        <div className="relative whitespace-nowrap px-2">
                           {filteredStudents[0] ? getFieldValue(field, filteredStudents[0]) : field.label}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center text-text-light/20">
                <LayoutGrid size={120} strokeWidth={1} />
                <p className="mt-8 font-black uppercase tracking-[0.5em] text-xl">পেইজ সিলেক্ট করুন</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {viewMode === 'list' ? renderListView() : renderEditorView()}

      {/* Hidden Print Container */}
      <div className="hidden print:block fixed inset-0 z-[1000] bg-white">
        {filteredStudents.filter(s => selectedStudents.includes(s.id || '')).map((student) => (
          <div 
            key={student.id}
            className="relative bg-white overflow-hidden page-break-after-always mx-auto mb-8 print:mb-0"
            style={{ 
              width: activeConfig?.width || 800, 
              height: activeConfig?.height || 500,
              backgroundImage: activeConfig?.background ? `url(${activeConfig.background})` : 'none',
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
            }}
          >
            {activeConfig?.fields.map(field => (
              <div 
                key={field.id}
                className="absolute"
                style={{ 
                  left: `${field.x}%`, 
                  top: `${field.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${field.fontSize}px`,
                  fontWeight: field.fontWeight,
                  color: field.color,
                  textAlign: field.align,
                  fontFamily: 'Kalpurush, sans-serif'
                }}
              >
                {getFieldValue(field, student)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          @page { margin: 0; }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100% !important; 
            height: auto !important;
            background: white !important;
          }
          .page-break-after-always { 
            page-break-after: always; 
            display: block;
            margin: 0 auto;
          }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};

const Check = ({ size, className, strokeWidth = 2 }: { size: number, className?: string, strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
