import React, { useState, useEffect, useMemo } from "react";
import { 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Search, 
  SlidersHorizontal, 
  Save, 
  Trash2, 
  Edit3, 
  Plus, 
  BookOpen, 
  Users, 
  Printer, 
  Download, 
  Upload,
  RotateCcw,
  Power,
  ChevronRight
} from "lucide-react";
import * as XLSX from 'xlsx';
import { AcademicClass, AcademicDepartment } from "./types";
import { CLASS_DETAILS_MAP, JAMAT_LIST, STANDARD_JAMAT_PRESETS } from "../../constants";
import { enToBnNumber, isClassMatch, getStudentClass, getDepartmentForClass } from "../../lib/utils";
import { generatePrintableDocument } from "../../lib/printEngine";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "../../contexts/DataContext";

const DEFAULT_PRESET_CLASSES = STANDARD_JAMAT_PRESETS;

export const AcademicClassManager: React.FC<{
  setActiveTab: (tab: string) => void;
  setSelectedClassFilter?: (className: string) => void;
  students?: any[];
}> = ({ setActiveTab, setSelectedClassFilter, students = [] }) => {
  const { classes: contextClasses, departments: contextDepartments, updateData, deleteData } = useData();

  const classes = useMemo(() => contextClasses || [], [contextClasses]);
  const departments = useMemo(() => contextDepartments || [], [contextDepartments]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    departmentId: "1",
    equivalent: "",
    isActive: true,
  });

  // Load Presets
  const handleLoadPresets = async () => {
    if (window.confirm("আপনি কি নিশ্চিত যে মাদ্রাসার ডিফল্ট ১৩টি জামাতের প্রিসেট লোড করতে চান?")) {
      const presets = DEFAULT_PRESET_CLASSES.map((c, i) => ({
        id: (Date.now() + i).toString(),
        ...c
      }));
      for (const item of presets) {
        await updateData("acad_classes", item);
      }
    }
  };

  // Clear custom classes
  const handleClearAll = async () => {
    const customClasses = classes.filter(c => !STANDARD_JAMAT_PRESETS.some(p => p.name === c.name || p.id === c.id));
    if (customClasses.length === 0) {
      alert("মূল ১৩টি স্থায়ী জামাত ব্যতীত অতিরিক্ত কোনো কাস্টম জামাত নেই।");
      return;
    }
    if (window.confirm(`আপনি কি নিশ্চিত যে অতিরিক্ত ${customClasses.length}টি কাস্টম জামাত মুছে ফেলতে চান? মূল ১৩টি স্থায়ী জামাত অপরিবর্তিত থাকবে।`)) {
      for (const c of customClasses) {
        await deleteData("acad_classes", c.id);
      }
    }
  };

  // Helper to count students in a class
  const getStudentCount = (className: string) => {
    return students.filter((s: any) => {
      return isClassMatch(s, className);
    }).length;
  };

  // Helper to get class status
  const getClassStatus = (cls: AcademicClass) => {
    if (!cls.isActive) {
      return {
        text: "নিষ্ক্রিয়",
        badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        dotClass: "bg-rose-400"
      };
    }
    const count = getStudentCount(cls.name);
    if (count > 0) {
      return {
        text: `সক্রিয় (${enToBnNumber(count.toString())} জন)`,
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        dotClass: "bg-emerald-500"
      };
    } else {
      return {
        text: "শিক্ষার্থী নেই",
        badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
        dotClass: "bg-slate-400"
      };
    }
  };

  // Handle department name retrieval
  const getDeptName = (id: string, className?: string) => {
    const dept = departments.find((d) => d.id === id);
    if (dept) return dept.name;
    return getDepartmentForClass(className, departments, classes);
  };

  // Filtered classes memoized
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchesSearch =
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.equivalent && cls.equivalent.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDept = selectedDept === "all" || cls.departmentId === selectedDept;
      
      const count = getStudentCount(cls.name);
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && cls.isActive && count > 0) ||
        (selectedStatus === "no_students" && cls.isActive && count === 0) ||
        (selectedStatus === "inactive" && !cls.isActive);

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [classes, searchTerm, selectedDept, selectedStatus, students]);

  // Statistics memoized
  const stats = useMemo(() => {
    const total = classes.length;
    let activeWithStudents = 0;
    let activeNoStudents = 0;
    let inactive = 0;

    classes.forEach(c => {
      if (!c.isActive) {
        inactive++;
      } else {
        const count = getStudentCount(c.name);
        if (count > 0) {
          activeWithStudents++;
        } else {
          activeNoStudents++;
        }
      }
    });

    return { total, activeWithStudents, activeNoStudents, inactive };
  }, [classes, students]);

  // Handle direct toggle of active status
  const handleToggleStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const matched = classes.find(c => c.id === id);
    if (matched) {
      await updateData("acad_classes", { ...matched, isActive: !matched.isActive });
    }
  };

  // Setup add mode
  const handleAddNewClick = () => {
    setEditingClass(null);
    setFormData({
      name: "",
      departmentId: departments[0]?.id || "3",
      equivalent: "",
      isActive: true,
    });
    setIsFormOpen(true);
  };

  // Setup edit mode
  const handleEditClick = (cls: AcademicClass, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      departmentId: cls.departmentId,
      equivalent: cls.equivalent || "",
      isActive: cls.isActive,
    });
    setIsFormOpen(true);
  };

  // Delete a class
  const handleDeleteClick = async (cls: AcademicClass, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCore = STANDARD_JAMAT_PRESETS.some(p => p.name === cls.name || p.id === cls.id);
    if (isCore) {
      alert(`"${cls.name}" হলো মূল ১৩টি স্থায়ী জামাতের একটি। এই জামাতটি স্থায়ী এবং সিস্টেমে অপরিবর্তনীয় রাখা হয়েছে। তবে আপনি নতুন কোনো জামাত যোগ করতে বা এর অবস্থা (সক্রিয়/নিষ্ক্রিয়) পরিবর্তন করতে পারেন।`);
      return;
    }
    if (window.confirm(`আপনি কি নিশ্চিতভাবে "${cls.name}" কাস্টম জামাতটি মুছে ফেলতে চান?`)) {
      await deleteData("acad_classes", cls.id);
    }
  };

  // Form submission handling
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingClass) {
      await updateData("acad_classes", { ...editingClass, ...formData });
    } else {
      const newClass: AcademicClass = {
        id: Date.now().toString(),
        name: formData.name,
        departmentId: formData.departmentId,
        equivalent: formData.equivalent || "অন্যান্য",
        isActive: formData.isActive,
      };
      await updateData("acad_classes", newClass);
    }
    setIsFormOpen(false);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws);
        
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const name = row['জামাত/শ্রেণী'] || row['জামাত/শ্রেণীর নাম'] || row['name'] || row['Class'];
          if (name) {
            const newClass: AcademicClass = {
              id: (Date.now() + i).toString(),
              name: String(name),
              departmentId: departments[0]?.id || "3",
              equivalent: row['সমমান শ্রেণী'] || row['equivalent'] || "অন্যান্য",
              isActive: true,
            };
            await updateData("acad_classes", newClass);
          }
        }
        alert(`${jsonData.length} টি জামাত সফলভাবে ইমপোর্ট করা হয়েছে।`);
      } catch (err) {
        console.error(err);
        alert("এক্সেল ফাইল ইমপোর্ট করতে সমস্যা হয়েছে।");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export to CSV / Excel
  const handleExportCSV = () => {
    const headers = "ক্রমিক নং,জামাত/শ্রেণী,মাদ্রাসা বিভাগ,সমমান শ্রেণী,শিক্ষার্থী সংখ্যা,অবস্থা";
    const rows = filteredClasses.map((cls, idx) => {
      const deptName = getDeptName(cls.departmentId, cls.name);
      const studentCount = getStudentCount(cls.name);
      const statusText = cls.isActive ? (studentCount > 0 ? "সক্রিয়" : "শিক্ষার্থী নেই") : "নিষ্ক্রিয়";
      return `${idx + 1},"${cls.name}","${deptName}","${cls.equivalent || "—"}",${studentCount},"${statusText}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `জামাত_তালিকা_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print class list
  const handlePrint = () => {
    const tableRows = filteredClasses.map((cls, idx) => {
      const deptName = getDeptName(cls.departmentId, cls.name);
      const studentCount = getStudentCount(cls.name);
      const statusText = cls.isActive ? (studentCount > 0 ? `সক্রিয় (${studentCount} জন)` : "শিক্ষার্থী নেই") : "নিষ্ক্রিয়";
      return `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${enToBnNumber((idx + 1).toString())}</td>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${cls.name}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${deptName}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${cls.equivalent || "—"}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${enToBnNumber(studentCount.toString())} জন</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${statusText}</td>
        </tr>
      `;
    }).join("");

    const htmlContent = `
      <div style="font-family: 'Inter', sans-serif, 'Hind Siliguri'; padding: 20px;">
        <h2 style="text-align: center; margin-bottom: 5px;">দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা</h2>
        <h3 style="text-align: center; margin-top: 0; color: #555; margin-bottom: 25px;">মাদ্রাসার চলমান জামাত/শ্রেণী তালিকা</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 12px 10px; border: 1px solid #ddd; text-align: center; width: 80px;">ক্রমিক</th>
              <th style="padding: 12px 10px; border: 1px solid #ddd; text-align: left;">জামাত/শ্রেণী</th>
              <th style="padding: 12px 10px; border: 1px solid #ddd; text-align: left;">বিভাগ</th>
              <th style="padding: 12px 10px; border: 1px solid #ddd; text-align: left;">সমমান</th>
              <th style="padding: 12px 10px; border: 1px solid #ddd; text-align: center; width: 100px;">শিক্ষার্থী</th>
              <th style="padding: 12px 10px; border: 1px solid #ddd; text-align: center; width: 120px;">অবস্থা</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px;">
          <p>প্রিন্টের তারিখ: ${new Date().toLocaleDateString("bn-BD")}</p>
          <p style="border-top: 1px solid #666; padding-top: 5px; width: 150px; text-align: center;">কর্তৃপক্ষের স্বাক্ষর</p>
        </div>
      </div>
    `;

    generatePrintableDocument("জামাত ও শ্রেণী তালিকা", htmlContent);
  };

  return (
    <div className="space-y-6 font-hind-siliguri pb-12 text-left">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportExcel} 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
      />

      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/15 p-6 rounded-3xl border border-border-main/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
            <Layers size={28} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-black uppercase">একাডেমিক প্যানেল</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-text-main tracking-tight mt-1">জামাত ও শ্রেণী ব্যবস্থাপনা</h2>
            <p className="text-xs text-text-light/70 font-bold mt-1">চলতি বছর মাদ্রাসার সকল জামাত/শ্রেণী ও বিভাগ সমূহের তথ্য ও ব্যবস্থাপনা</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 font-black text-xs sm:text-sm rounded-2xl transition-all active:scale-95 cursor-pointer select-none border border-blue-500/20"
            title="এক্সেল ফাইল ইমপোর্ট করুন"
          >
            <Upload size={16} />
            <span>এক্সেল ইমপোর্ট</span>
          </button>

          {classes.some(c => !STANDARD_JAMAT_PRESETS.some(p => p.name === c.name || p.id === c.id)) && (
            <button
              onClick={handleClearAll}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-black text-xs sm:text-sm rounded-2xl transition-all active:scale-95 cursor-pointer select-none border border-rose-500/20"
              title="কাস্টম জামাত মুছে ফেলুন"
            >
              <Trash2 size={16} />
              <span>কাস্টম মুছুন</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-black text-xs sm:text-sm rounded-2xl transition-all active:scale-95 cursor-pointer select-none border border-emerald-500/20"
            title="এক্সেল (CSV) এক্সপোর্ট"
          >
            <Download size={16} />
            <span>এক্সেল এক্সপোর্ট</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-secondary/15 text-secondary hover:bg-secondary/25 font-black text-xs sm:text-sm rounded-2xl transition-all active:scale-95 cursor-pointer select-none border border-secondary/25"
            title="তালিকা প্রিন্ট করুন"
          >
            <Printer size={16} />
            <span>প্রিন্ট করুন</span>
          </button>

          <button
            onClick={handleAddNewClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 cursor-pointer select-none"
          >
            <Plus size={18} className="stroke-[2.5]" />
            <span>নতুন জামাত যুক্ত করুন</span>
          </button>
        </div>
      </div>

      {/* Live Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-card border border-border-main/55 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 rounded-full bg-primary/5 group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary dark:text-secondary flex items-center justify-center shrink-0">
            <Layers size={22} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-text-light/50 uppercase tracking-wider leading-none">সর্বমোট জামাত</span>
            <span className="block text-2xl font-black text-text-main mt-2 leading-none">
              {enToBnNumber(stats.total.toString())} টি
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-card border border-border-main/55 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 rounded-full bg-emerald-500/5 group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-text-light/50 uppercase tracking-wider leading-none">সক্রিয় ও ছাত্র আছে</span>
            <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 leading-none">
              {enToBnNumber(stats.activeWithStudents.toString())} টি
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-card border border-border-main/55 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 rounded-full bg-amber-500/5 group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle size={22} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-text-light/50 uppercase tracking-wider leading-none">শিক্ষার্থী নেই (সক্রিয়)</span>
            <span className="block text-2xl font-black text-amber-600 dark:text-amber-400 mt-2 leading-none">
              {enToBnNumber(stats.activeNoStudents.toString())} টি
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-card border border-border-main/55 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 rounded-full bg-rose-500/5 group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Power size={22} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-text-light/50 uppercase tracking-wider leading-none">নিষ্ক্রিয় জামাত সমূহ</span>
            <span className="block text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 leading-none">
              {enToBnNumber(stats.inactive.toString())} টি
            </span>
          </div>
        </div>
      </div>

      {/* Filter Station */}
      <div className="bg-card border border-border-main/55 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light/50 stroke-[2.2]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="শ্রেণীর নাম বা সমমান শ্রেণী লিখে সার্চ করুন..."
              className="w-full text-xs sm:text-sm bg-bg border border-border-main pl-11 pr-12 py-3 rounded-2xl text-text-main font-bold outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-light/40"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-light/50 hover:text-text-main text-[10px] font-black cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors"
              >
                মুছুন
              </button>
            )}
          </div>

          {/* Filtering Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department select */}
            <div className="flex items-center gap-2 bg-bg px-3.5 py-2.5 rounded-2xl border border-border-main/80 min-w-[150px] flex-1 sm:flex-initial">
              <SlidersHorizontal size={13} className="text-text-light/50 shrink-0" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs sm:text-sm font-black bg-transparent border-none text-text-main outline-none cursor-pointer p-0 w-full"
              >
                <option value="all">সকল বিভাগ</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status select */}
            <div className="flex items-center gap-2 bg-bg px-3.5 py-2.5 rounded-2xl border border-border-main/80 min-w-[140px] flex-1 sm:flex-initial">
              <span className="text-xs font-bold text-text-light/50 shrink-0">অবস্থা:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs sm:text-sm font-black bg-transparent border-none text-text-main outline-none cursor-pointer p-0 w-full"
              >
                <option value="all">সবগুলো</option>
                <option value="active">সক্রিয় (ছাত্র আছে)</option>
                <option value="no_students">শিক্ষার্থী নেই</option>
                <option value="inactive">নিষ্ক্রিয়</option>
              </select>
            </div>

            {/* Reset filters */}
            {(searchTerm || selectedDept !== "all" || selectedStatus !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDept("all");
                  setSelectedStatus("all");
                }}
                className="p-3 text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-500/10 rounded-2xl transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                title="ফিল্টার রিসেট"
              >
                <RotateCcw size={15} className="stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Jamats List Container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-black text-text-main uppercase tracking-wider">
            সক্রিয় জামাত তালিকা (ফলাফল: {enToBnNumber(filteredClasses.length.toString())}টি)
          </h3>
          <span className="text-[10px] font-bold text-text-light/40">চলমান শিক্ষাবর্ষ ২০২৬</span>
        </div>

        {/* DESKTOP VIEW: Super clean, information-rich data table */}
        <div className="hidden md:block border border-border-main/55 rounded-3xl overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary border-b border-border-main/60 text-white">
                  <th className="p-4 text-[11px] font-black uppercase text-white/95 tracking-wider w-16 text-center">ক্রমিক</th>
                  <th className="p-4 text-[11px] font-black uppercase text-white/95 tracking-wider">জামাত/শ্রেণীর নাম</th>
                  <th className="p-4 text-[11px] font-black uppercase text-white/95 tracking-wider">বিভাগ</th>
                  <th className="p-4 text-[11px] font-black uppercase text-white/95 tracking-wider">সমমান শ্রেণী</th>
                  <th className="p-4 text-[11px] font-black uppercase text-white/95 tracking-wider text-center w-40">স্ট্যাটাস</th>
                  <th className="p-4 text-[11px] font-black uppercase text-white/95 tracking-wider text-right w-48">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/45">
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-sm font-bold text-text-light/50">
                      কোনো জামাত বা শ্রেণী খুঁজে পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((cls, idx) => {
                    const deptName = getDeptName(cls.departmentId, cls.name);
                    return (
                      <tr 
                        key={cls.id} 
                        className="even:bg-primary/[0.02] hover:bg-primary/[0.06] transition-colors group cursor-pointer"
                      >
                        <td className="p-4 text-center text-xs font-black text-text-light/50">
                          {enToBnNumber((idx + 1).toString())}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs sm:text-sm font-black text-text-main group-hover:text-primary transition-colors">
                              {cls.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-xs sm:text-sm font-bold text-text-light/80">
                          {deptName}
                        </td>
                        <td className="p-4 text-xs sm:text-sm font-bold text-text-light/60">
                          {cls.equivalent || "—"}
                        </td>
                        <td className="p-4 text-center">
                          {(() => {
                            const status = getClassStatus(cls);
                            return (
                              <button
                                type="button"
                                onClick={(e) => handleToggleStatus(cls.id, e)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border transition-all cursor-pointer select-none active:scale-95 ${status.badgeClass}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass} shrink-0`}></span>
                                {status.text}
                              </button>
                            );
                          })()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            {/* View subjects */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                localStorage.setItem("filter_class_subject", cls.id);
                                setActiveTab("academic-class-subject");
                              }}
                              className="p-2 text-primary dark:text-secondary hover:bg-primary/10 dark:hover:bg-secondary/10 rounded-xl transition-colors cursor-pointer border border-border-main/40"
                              title="নির্ধারিত বিষয় ও সিলেবাস"
                            >
                              <BookOpen size={14} className="stroke-[2.2]" />
                            </button>

                            {/* View students */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (setSelectedClassFilter) {
                                  setSelectedClassFilter(cls.name);
                                }
                                setActiveTab("students");
                              }}
                              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-xl transition-colors cursor-pointer border border-border-main/40"
                              title="শিক্ষার্থী তালিকা"
                            >
                              <Users size={14} className="stroke-[2.2]" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={(e) => handleEditClick(cls, e)}
                              className="p-2 text-secondary hover:bg-secondary/10 rounded-xl transition-colors cursor-pointer border border-border-main/40"
                              title="তথ্য সংশোধন"
                            >
                              <Edit3 size={14} className="stroke-[2.2]" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={(e) => handleDeleteClick(cls, e)}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer border border-border-main/40"
                              title="জামাতটি বাদ দিন"
                            >
                              <Trash2 size={14} className="stroke-[2.2]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE VIEW: High-fidelity touch bento cards (Layout for small screens) */}
        <div className="block md:hidden space-y-3.5">
          {filteredClasses.length === 0 ? (
            <div className="p-12 text-center text-xs font-bold text-text-light/50 bg-card border border-border-main/55 rounded-3xl">
              কোনো জামাত বা শ্রেণী খুঁজে পাওয়া যায়নি।
            </div>
          ) : (
            filteredClasses.map((cls, idx) => {
              const deptName = getDeptName(cls.departmentId, cls.name);
              return (
                <div 
                  key={cls.id} 
                  className="bg-card border border-border-main/60 rounded-2xl p-4 shadow-sm space-y-3.5 relative overflow-hidden active:scale-[0.99] transition-transform duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-text-light/70 px-2 py-0.5 rounded-md leading-none">
                          নং {enToBnNumber((idx + 1).toString())}
                        </span>
                        {(() => {
                          const status = getClassStatus(cls);
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${status.badgeClass}`}>
                              <span className={`w-1 h-1 rounded-full ${status.dotClass}`}></span>
                              {status.text}
                            </span>
                          );
                        })()}
                      </div>
                      <h4 className="text-sm font-black text-text-main pt-1">{cls.name}</h4>
                    </div>

                    {/* Active toggle button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleStatus(cls.id, e)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer select-none active:scale-95 ${cls.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}
                    >
                      {cls.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                    </button>
                  </div>

                  {/* Class Details Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-bg/50 dark:bg-bg/20 p-2.5 rounded-xl text-xs font-bold">
                    <div>
                      <span className="block text-[9px] text-text-light/45 uppercase">মাদ্রাসা বিভাগ</span>
                      <span className="text-text-light/85">{deptName}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-text-light/45 uppercase">সমমান শ্রেণী</span>
                      <span className="text-text-light/85">{cls.equivalent || "—"}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-border-main/30">
                    <div className="flex gap-1.5">
                      {/* View Subjects */}
                      <button
                        onClick={() => {
                          localStorage.setItem("filter_class_subject", cls.id);
                          setActiveTab("academic-class-subject");
                        }}
                        className="flex items-center gap-1 px-3 py-2 text-primary dark:text-secondary bg-primary/5 dark:bg-secondary/5 border border-primary/10 dark:border-secondary/10 text-[10px] font-black rounded-xl cursor-pointer"
                      >
                        <BookOpen size={12} />
                        <span>বিষয়সমূহ</span>
                      </button>

                      {/* View Students */}
                      <button
                        onClick={() => {
                          if (setSelectedClassFilter) {
                            setSelectedClassFilter(cls.name);
                          }
                          setActiveTab("students");
                        }}
                        className="flex items-center gap-1 px-3 py-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 text-[10px] font-black rounded-xl cursor-pointer"
                      >
                        <Users size={12} />
                        <span>ছাত্র তালিকা</span>
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      {/* Edit */}
                      <button
                        onClick={(e) => handleEditClick(cls, e)}
                        className="p-2.5 text-secondary bg-secondary/5 dark:bg-secondary/10 border border-secondary/15 rounded-xl cursor-pointer hover:bg-secondary/20"
                        title="সম্পাদনা"
                      >
                        <Edit3 size={13} className="stroke-[2.2]" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => handleDeleteClick(cls, e)}
                        className="p-2.5 text-rose-500 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15 rounded-xl cursor-pointer hover:bg-rose-500/20"
                        title="বাদ দিন"
                      >
                        <Trash2 size={13} className="stroke-[2.2]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RENDER DYNAMIC FORM DIALOG (MODAL OVERLAY) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            {/* Click outside backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/30"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative bg-card w-full max-w-lg rounded-3xl border border-border-main shadow-2xl overflow-hidden flex flex-col font-hind-siliguri"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-border-main/55 flex items-center justify-between bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${editingClass ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                    <Layers size={18} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-text-main leading-none">
                      {editingClass ? "জামাত তথ্য সংশোধন" : "নতুন জামাত বা শ্রেণী এন্ট্রি"}
                    </h3>
                    <p className="text-[10px] text-text-light/50 font-bold mt-1">চলতি বছর একাডেমিক সেশনের জন্য</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-text-light/60 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                >
                  <X size={16} className="stroke-[2.5]" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-left">
                {/* 1. Name Input */}
                <div>
                  <label className="block text-xs font-black text-text-light/60 uppercase mb-1.5">
                    জামাত/শ্রেণীর নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="যেমন: মিযান (মুতাওয়াসসিতাহ)"
                    className="w-full text-xs sm:text-sm bg-bg border border-border-main px-4 py-3 rounded-2xl text-text-main outline-none font-bold focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-light/30"
                  />
                </div>

                {/* 2. Department Select */}
                <div>
                  <label className="block text-xs font-black text-text-light/60 uppercase mb-1.5">
                    মাদ্রাসা বিভাগ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full text-xs sm:text-sm bg-bg border border-border-main px-4 py-3 rounded-2xl text-text-main outline-none font-bold cursor-pointer focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Equivalent Input */}
                <div>
                  <label className="block text-xs font-black text-text-light/60 uppercase mb-1.5">
                    সমমান / সাধারণ শ্রেণী
                  </label>
                  <input
                    type="text"
                    value={formData.equivalent}
                    onChange={(e) => setFormData({ ...formData, equivalent: e.target.value })}
                    placeholder="যেমন: ৬ষ্ঠ শ্রেণী সমমান"
                    className="w-full text-xs sm:text-sm bg-bg border border-border-main px-4 py-3 rounded-2xl text-text-main outline-none font-bold focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-light/30"
                  />
                </div>

                {/* 4. Presets tags */}
                {!editingClass && (
                  <div className="pt-1.5 pb-2 border-t border-border-main/30">
                    <span className="text-[10px] font-black text-text-light/45 block mb-1.5 uppercase">কুইক প্রিসেট টেমপ্লেট:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: "নূরানী আউয়াল (১ম)", deptId: "1", eq: "১ম শ্রেণী" },
                        { name: "হিফজুল কুরআন বিভাগ", deptId: "1", eq: "হিফজ" },
                        { name: "মিযান (মুতাওয়াসসিতাহ আওয়াল)", deptId: "2", eq: "নিম্ন মাধ্যমিক - ষষ্ঠ শ্রেণী" },
                        { name: "দাওরায়ে হাদিস (তাকমিল)", deptId: "2", eq: "স্নাতকোত্তর সমমান" }
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setFormData({ name: preset.name, departmentId: preset.deptId, equivalent: preset.eq, isActive: true })}
                          className="text-[10px] font-black px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-light hover:text-text-main border border-border-main/50 rounded-xl transition-all cursor-pointer select-none"
                        >
                          + {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Active Switcher Slider */}
                <div className="flex items-center justify-between pt-3 border-t border-border-main/30">
                  <span className="text-xs sm:text-sm font-black text-text-main">
                    জামাতটি কি সক্রিয় থাকবে?
                  </span>
                  
                  <label className="relative flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-300 ${formData.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                      <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300 ${formData.isActive ? "translate-x-5" : "translate-x-0"}`}></div>
                    </div>
                  </label>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2.5 pt-4 border-t border-border-main/30">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-text-main font-black text-xs sm:text-sm rounded-2xl transition-all cursor-pointer select-none active:scale-95"
                  >
                    বাতিল করুন
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 select-none"
                  >
                    <Save size={15} />
                    <span>{editingClass ? "হালনাগাদ করুন" : "যুক্ত করুন"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
