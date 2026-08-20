import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Expense, Staff } from '../types';
import { STANDARD_JAMAT_PRESETS, DEFAULT_DEPARTMENTS, DEFAULT_BRANCHES } from '../constants';
import { fetchGoogleSheetStudents } from '../lib/googleSheetFetcher';
import { normalizeStudentRecord } from '../lib/utils';
import toast, { Toaster } from 'react-hot-toast';
import { 
  AcademicDepartment, 
  AcademicClass, 
  AcademicBranch, 
  AcademicSubject, 
  AcademicClassSubject, 
  AcademicTeacherSubject, 
  AcademicExamDate, 
  AcademicEvaluationMetric 
} from '../components/academic/types';

export interface MadrasahBranding {
  logoUrl: string;
  headerUrl: string;
  stampUrl: string;
  signatureUrl: string;
  madrasahName: string;
  address: string;
  phone: string;
}

export interface MediaAsset {
  id: string;
  title: string;
  category: 'logo' | 'header' | 'stamp' | 'signature' | 'teacher' | 'student' | 'document' | 'other';
  url: string;
  fileSize?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface IncomeRecord {
  id: string;
  title: string;
  category: 'student_fee' | 'general' | 'lillah' | 'donation' | 'rent' | 'other';
  categoryLabel: string;
  amount: number;
  date: string;
  sourceOrDonor?: string;
  phone?: string;
  paymentMethod: 'ক্যাশ' | 'ব্যাংক' | 'বিকাশ' | 'নগদ' | 'রকেট' | 'চেক';
  note?: string;
  receivedBy?: string;
}

export interface RecycleBinItem {
  id: string;
  type: 'students' | 'invoices' | 'expenses' | 'income' | 'income_records' | 'staff_members' | 'teachers' | 'fee_heads' | 'acad_classes' | 'acad_branches' | 'acad_departments' | 'acad_subjects' | string;
  typeLabel: string;
  title: string;
  subtitle?: string;
  data: any;
  deletedAt: string;
  expiresAt: string;
}

interface DataContextType {
  feeHeads: any[];
  classFeeMapping: any;
  invoices: any[];
  staffMembers: Staff[];
  expenses: Expense[];
  incomeRecords: IncomeRecord[];
  studentOverrides: any;
  students: Student[];
  recycleBinStudents: Student[];
  recycleBinItems: RecycleBinItem[];
  restoreRecycleItem: (id: string) => Promise<void>;
  permanentDeleteRecycleItem: (id: string) => Promise<void>;
  emptyGlobalRecycleBin: () => Promise<void>;
  deleteStudent: (id: string | number) => Promise<void>;
  restoreStudent: (id: string | number) => Promise<void>;
  permanentDeleteStudent: (id: string | number) => Promise<void>;
  emptyRecycleBin: () => Promise<void>;
  staffAttendance: Record<string, any>;
  studentAttendance: Record<string, any>;
  departments: AcademicDepartment[];
  classes: AcademicClass[];
  branches: AcademicBranch[];
  subjects: AcademicSubject[];
  classSubjects: AcademicClassSubject[];
  teacherSubjects: AcademicTeacherSubject[];
  examDates: AcademicExamDate[];
  evaluationMetrics: AcademicEvaluationMetric[];
  teachers: any[];
  pendingApplications: any[];
  madrasahBranding: MadrasahBranding;
  mediaAssets: MediaAsset[];
  updateBranding: (updated: Partial<MadrasahBranding>) => Promise<void>;
  saveMediaAsset: (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => Promise<MediaAsset>;
  deleteMediaAsset: (id: string) => Promise<void>;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  updateData: (table: string, payload: any, key?: string) => Promise<void>;
  deleteData: (table: string, id: string | number) => Promise<void>;
  clearAllCache: () => Promise<void>;
  jamatList: string[];
  classDetailsMap: Record<string, any>;
}

export const DEFAULT_FEE_HEADS = [
  { id: "1", name: "ভর্তি ফরম" },
  { id: "2", name: "ভর্তি ফি" },
  { id: "3", name: "আইডি কার্ড ফি" },
  { id: "4", name: "মাসিক বেতন (অনাবাসিক)" },
  { id: "5", name: "মাসিক বেতন (আবাসিক)" },
  { id: "15", name: "মাসিক বেতন (ডে-কেয়ার)" },
  { id: "6", name: "খোরাকী ফি (বোর্ডিং)" },
  { id: "14", name: "বিদ্যুৎ বিল" },
  { id: "7", name: "পরীক্ষার ফি" },
  { id: "8", name: "বকেয়া" },
  { id: "9", name: "অনলাইন / আইটি চার্জ" },
  { id: "10", name: "প্রশংসাপত্র ফি" },
  { id: "11", name: "প্রত্যয়ন পত্র ফি" },
  { id: "12", name: "সনদ ফি" },
  { id: "13", name: "অন্যান্য" }
];

export const DEFAULT_INVOICES: any[] = [];

export const DEFAULT_EXPENSES: Expense[] = [];

export const DEFAULT_INCOME_RECORDS: IncomeRecord[] = [];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  const [classFeeMapping, setClassFeeMapping] = useState<any>({});
  const [invoices, setInvoices] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [studentOverrides, setStudentOverrides] = useState<any>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [recycleBinStudents, setRecycleBinStudents] = useState<Student[]>([]);
  const [recycleBinItems, setRecycleBinItems] = useState<RecycleBinItem[]>([]);
  const [staffAttendance, setStaffAttendance] = useState<Record<string, any>>({});
  const [studentAttendance, setStudentAttendance] = useState<Record<string, any>>({});
  
  // Academic States
  const [departments, setDepartments] = useState<AcademicDepartment[]>(DEFAULT_DEPARTMENTS);
  const [classes, setClasses] = useState<AcademicClass[]>(STANDARD_JAMAT_PRESETS);
  const [branches, setBranches] = useState<AcademicBranch[]>(DEFAULT_BRANCHES);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [classSubjects, setClassSubjects] = useState<AcademicClassSubject[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<AcademicTeacherSubject[]>([]);
  const [examDates, setExamDates] = useState<AcademicExamDate[]>([]);
  const [evaluationMetrics, setEvaluationMetrics] = useState<AcademicEvaluationMetric[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  // Branding & Media States
  const [madrasahBranding, setMadrasahBranding] = useState<MadrasahBranding>({
    logoUrl: '/src/PNG/LOGO.png',
    headerUrl: '',
    stampUrl: '',
    signatureUrl: '',
    madrasahName: 'জামিয়া ইসলামিয়া দারুল উলূম মাদরাসা',
    address: 'ঢাকা, বাংলাদেশ',
    phone: '01700000000'
  });
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- SUPABASE INTEGRATION & REALTIME ---
  const getLocalStorage = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const setStorageData = async (key: string, data: any) => {
    // Write locally and sync to Supabase
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleRealtimeKeyUpdate = useCallback((key: string, data: any) => {
    if (!key || data === undefined) return;
    switch (key) {
      case 'madrasah-students-db':
        setStudents(Array.isArray(data) ? data : []);
        window.dispatchEvent(new Event('student_data_updated'));
        break;
      case 'madrasah-invoices-db':
      case 'madrasah-student-fees-db':
        setInvoices(Array.isArray(data) ? data : []);
        break;
      case 'madrasah-expenses-db':
        setExpenses(Array.isArray(data) ? data : []);
        break;
      case 'madrasah_income_records_db':
        setIncomeRecords(Array.isArray(data) ? data : []);
        break;
      case 'madrasah-staff-members-db':
        setStaffMembers(Array.isArray(data) ? data : []);
        break;
      case 'madrasa_teachers':
        setTeachers(Array.isArray(data) ? data : []);
        break;
      case 'madrasah-fee-heads':
        setFeeHeads(Array.isArray(data) ? data : []);
        break;
      case 'madrasah-class-fee-mapping':
        setClassFeeMapping(data || {});
        window.dispatchEvent(new Event('madrasah-class-fee-mapping_updated'));
        break;
      case 'madrasah_global_recycle_bin_db':
        setRecycleBinItems(Array.isArray(data) ? data : []);
        break;
      case 'madrasah-recycle-bin-students-db':
        setRecycleBinStudents(Array.isArray(data) ? data : []);
        break;
      case 'madrasah-staff-attendance-db':
        setStaffAttendance(data || {});
        break;
      case 'madrasah-student-attendance-db':
        setStudentAttendance(data || {});
        break;
      case 'acad_departments':
        setDepartments(Array.isArray(data) ? data : DEFAULT_DEPARTMENTS);
        break;
      case 'acad_classes':
        setClasses(Array.isArray(data) ? data : STANDARD_JAMAT_PRESETS);
        break;
      case 'acad_branches':
        setBranches(Array.isArray(data) ? data : DEFAULT_BRANCHES);
        window.dispatchEvent(new Event('acad_branches_updated'));
        break;
      case 'acad_subjects':
        setSubjects(Array.isArray(data) ? data : []);
        break;
      case 'acad_class_subjects':
        setClassSubjects(Array.isArray(data) ? data : []);
        break;
      case 'acad_teacher_subjects':
        setTeacherSubjects(Array.isArray(data) ? data : []);
        break;
      case 'acad_exam_dates':
        setExamDates(Array.isArray(data) ? data : []);
        break;
      case 'acad_eval_metrics':
        setEvaluationMetrics(Array.isArray(data) ? data : []);
        break;
      case 'madrasa_pending_applications':
        setPendingApplications(Array.isArray(data) ? data : []);
        break;
      case 'madrasah_branding_db':
        if (data && typeof data === 'object') {
          setMadrasahBranding(prev => ({ ...prev, ...data }));
        }
        break;
      case 'madrasah_media_assets_db':
        setMediaAssets(Array.isArray(data) ? data : []);
        break;
      case 'madrasah-student-overrides':
        setStudentOverrides(data || {});
        break;
      default:
        break;
    }
  }, []);

  const loadAllFromSupabase = async () => {
    try {
      const { fetchAllStatesFromSupabase } = await import('../lib/supabaseClient');
      const allStates = await fetchAllStatesFromSupabase();
      
      if (allStates && Object.keys(allStates).length > 0) {
        // Sync cloud data down to local storage
        (window as any).__IS_HYDRATING_FROM_SUPABASE = true;
        Object.entries(allStates).forEach(([id, data]) => {
          if (id && data !== undefined) {
            (window as any).__originalSetItem?.(
              id, 
              typeof data === 'string' ? data : JSON.stringify(data)
            );
          }
        });
        (window as any).__IS_HYDRATING_FROM_SUPABASE = false;
        window.dispatchEvent(new Event('supabase_hydration_complete'));
        return true;
      }
    } catch (e) {
      console.error('Failed to load from Supabase', e);
      (window as any).__IS_HYDRATING_FROM_SUPABASE = false;
    }
    return false;
  };

  // Realtime subscription setup
  useEffect(() => {
    let channel: any = null;
    let isMounted = true;

    async function setupRealtime() {
      try {
        const { supabase } = await import('../lib/supabaseClient');
        channel = supabase
          .channel('madrasah_live_realtime_channel')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'madrasah_app_state' },
            (payload: any) => {
              if (!isMounted) return;
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const row = payload.new;
                if (row && row.id) {
                  let parsedData = row.data;
                  if (typeof parsedData === 'string') {
                    try {
                      parsedData = JSON.parse(parsedData);
                    } catch {}
                  }
                  
                  // Update local storage silently
                  (window as any).__IS_HYDRATING_FROM_SUPABASE = true;
                  (window as any).__originalSetItem?.(
                    row.id,
                    typeof row.data === 'string' ? row.data : JSON.stringify(row.data)
                  );
                  (window as any).__IS_HYDRATING_FROM_SUPABASE = false;

                  handleRealtimeKeyUpdate(row.id, parsedData);
                }
              } else if (payload.eventType === 'DELETE') {
                const row = payload.old;
                if (row && row.id) {
                  (window as any).__IS_HYDRATING_FROM_SUPABASE = true;
                  (window as any).__originalRemoveItem?.(row.id);
                  (window as any).__IS_HYDRATING_FROM_SUPABASE = false;
                  handleRealtimeKeyUpdate(row.id, []);
                }
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime subscription setup failed:', err);
      }
    }

    setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        import('../lib/supabaseClient').then(({ supabase }) => {
          supabase.removeChannel(channel);
        });
      }
    };
  }, [handleRealtimeKeyUpdate]);
  // ----------------------------------------

  const refreshData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // First try to load fresh data from Supabase to ensure sync across devices
      await loadAllFromSupabase();

      const savedFeeHeads = getLocalStorage('madrasah-fee-heads', null);
      if (Array.isArray(savedFeeHeads) && savedFeeHeads.length > 0) {
        setFeeHeads(savedFeeHeads);
      } else {
        setFeeHeads(DEFAULT_FEE_HEADS);
        await setStorageData('madrasah-fee-heads', DEFAULT_FEE_HEADS);
      }
      setClassFeeMapping(getLocalStorage('madrasah-class-fee-mapping', {}));
      
      const savedInvoices = getLocalStorage('madrasah-invoices-db', null);
      if (Array.isArray(savedInvoices)) {
        setInvoices(savedInvoices);
      } else {
        const legacyFees = getLocalStorage('madrasah-student-fees-db', null);
        if (Array.isArray(legacyFees)) {
          setInvoices(legacyFees);
          await setStorageData('madrasah-invoices-db', legacyFees);
        } else {
          setInvoices([]);
        }
      }

      setStaffMembers(getLocalStorage('madrasah-staff-members-db', []));
      
      const savedExpenses = getLocalStorage('madrasah-expenses-db', null);
      if (Array.isArray(savedExpenses)) {
        setExpenses(savedExpenses);
      } else {
        setExpenses([]);
      }

      const savedIncomes = getLocalStorage('madrasah_income_records_db', null);
      if (Array.isArray(savedIncomes)) {
        setIncomeRecords(savedIncomes);
      } else {
        setIncomeRecords([]);
      }
      setStudentOverrides(getLocalStorage('madrasah-student-overrides', {}));
      let currentStudents = getLocalStorage('madrasah-students-db', []);
      try {
        const sheetStudents = await fetchGoogleSheetStudents('1B6BzLPVKGeRosVm0p_DbMk5tssfuQTWbSF5W97-31-A', '১৪৪৬-৪৭ হিজরী/২০২৫-২৬ ঈসায়ী');
        if (sheetStudents && sheetStudents.length > 0) {
          const existingIds = new Set(
            currentStudents.map((s: any) => String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || s.id || '').trim())
          );
          let addedCount = 0;
          sheetStudents.forEach((sheetStudent: any) => {
            const sid = String(sheetStudent['রেজিস্ট্রেশন/আইডি নম্বর'] || sheetStudent['রেজিস্ট্রেশন/আইডি'] || sheetStudent.id || '').trim();
            if (sid && !existingIds.has(sid)) {
              currentStudents.push(sheetStudent);
              existingIds.add(sid);
              addedCount++;
            }
          });
          if (addedCount > 0) {
            await setStorageData('madrasah-students-db', currentStudents);
          }
        }
      } catch (e) {
        console.error("Error fetching Google Sheet students:", e);
      }
      setStudents(currentStudents);
      
      // Load Global Recycle Bin and purge items older than 30 days
      const rawBinItems: RecycleBinItem[] = getLocalStorage('madrasah_global_recycle_bin_db', []);
      const nowMs = Date.now();
      const validBinItems = rawBinItems.filter(item => {
        if (!item.deletedAt) return false;
        const deletedMs = new Date(item.deletedAt).getTime();
        const ageInDays = (nowMs - deletedMs) / (1000 * 60 * 60 * 24);
        return ageInDays <= 30; // Auto delete after 30 days
      });

      if (validBinItems.length !== rawBinItems.length) {
        await setStorageData('madrasah_global_recycle_bin_db', validBinItems);
      }
      setRecycleBinItems(validBinItems);
      setRecycleBinStudents(getLocalStorage('madrasah-recycle-bin-students-db', []));
      setStaffAttendance(getLocalStorage('madrasah-staff-attendance-db', {}));
      setStudentAttendance(getLocalStorage('madrasah-student-attendance-db', {}));
      
      setDepartments(getLocalStorage('acad_departments', DEFAULT_DEPARTMENTS));
      setClasses(getLocalStorage('acad_classes', STANDARD_JAMAT_PRESETS));
      setBranches(getLocalStorage('acad_branches', DEFAULT_BRANCHES));
      setSubjects(getLocalStorage('acad_subjects', []));
      setClassSubjects(getLocalStorage('acad_class_subjects', []));
      setTeacherSubjects(getLocalStorage('acad_teacher_subjects', []));
      setExamDates(getLocalStorage('acad_exam_dates', []));
      setEvaluationMetrics(getLocalStorage('acad_eval_metrics', []));
      setTeachers(getLocalStorage('madrasa_teachers', []));
      setPendingApplications(getLocalStorage('madrasa_pending_applications', []));

      // Load Branding & Media Assets
      const savedBranding = getLocalStorage('madrasah_branding_db', null);
      if (savedBranding) {
        setMadrasahBranding(savedBranding);
      } else {
        const logoOverride = localStorage.getItem('madrasa_logo_url');
        if (logoOverride) {
          setMadrasahBranding(prev => ({ ...prev, logoUrl: logoOverride }));
        }
      }
      setMediaAssets(getLocalStorage('madrasah_media_assets_db', []));
    } catch (error) {
      console.error('Error reading local storage:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  const updateBranding = async (updated: Partial<MadrasahBranding>) => {
    const newBranding = { ...madrasahBranding, ...updated };
    setMadrasahBranding(newBranding);
    setStorageData('madrasah_branding_db', newBranding);
    if (updated.logoUrl) {
      localStorage.setItem('madrasa_logo_url', updated.logoUrl);
    }
    toast.success('মাদ্রাসা ব্র্যান্ডিং তথ্য ও ছবি সফলভাবে ডাটাবেসে আপডেট হয়েছে');
  };

  const saveMediaAsset = async (asset: Omit<MediaAsset, 'id' | 'createdAt'>): Promise<MediaAsset> => {
    const newAsset: MediaAsset = {
      ...asset,
      id: 'media_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString()
    };
    const updatedList = [newAsset, ...mediaAssets];
    setMediaAssets(updatedList);
    setStorageData('madrasah_media_assets_db', updatedList);
    toast.success('ছবি/ফাইল সফলভাবে ডাটাবেসে আপলোড ও সংরক্ষণ হয়েছে');
    return newAsset;
  };

  const deleteMediaAsset = async (id: string) => {
    const updatedList = mediaAssets.filter(m => m.id !== id);
    setMediaAssets(updatedList);
    setStorageData('madrasah_media_assets_db', updatedList);
    toast.success('ছবি/ফাইল ডাটাবেস থেকে মুছে ফেলা হয়েছে');
  };

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Derived properties for Jamat List and Class Details Map
  const jamatList = useMemo(() => {
    return classes.filter(c => c.isActive).map(c => c.name);
  }, [classes]);

  const classDetailsMap = useMemo(() => {
    const map: Record<string, any> = {};
    classes.forEach(c => {
      map[c.name] = {
        marhala: departments.find(d => d.id === c.departmentId)?.name || "সাধারণ",
        jamatClass: c.name,
        somoman: c.equivalent || c.name
      };
    });
    return map;
  }, [classes, departments]);

  const updateData = async (table: string, payload: any, key?: string) => {
    const toastId = toast.loading('ডাটা সংরক্ষণ হচ্ছে...');
    try {
      if (table === 'students_batch' || (table === 'students' && Array.isArray(payload))) {
        const listToProcess = Array.isArray(payload) ? payload : [payload];
        const currentList: Student[] = getLocalStorage('madrasah-students-db', []);
        let updated: Student[] = [...currentList];

        listToProcess.forEach((item) => {
          const normalized = normalizeStudentRecord(item);
          const processedPayload = { ...item, ...normalized };
          const targetId = String(processedPayload['রেজিস্ট্রেশন/আইডি নম্বর'] || processedPayload['রেজিস্ট্রেশন/আইডি'] || processedPayload.id || '').trim();

          if (targetId) {
            processedPayload.id = targetId;
            processedPayload['রেজিস্ট্রেশন/আইডি নম্বর'] = targetId;
            processedPayload['রেজিস্ট্রেশন/আইডি'] = targetId;
          }

          const idx = updated.findIndex(s => {
            const sId = String(s.id || '').trim();
            const sReg = String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || '').trim();
            return targetId && (sId === targetId || sReg === targetId);
          });

          if (idx !== -1) {
            updated[idx] = normalizeStudentRecord({ ...updated[idx], ...processedPayload });
          } else {
            updated.unshift(normalizeStudentRecord(processedPayload));
          }
        });

        await setStorageData('madrasah-students-db', updated);
        setStudents(updated);
        window.dispatchEvent(new Event('student_data_updated'));
      } else if (table === 'students') {
        const normalized = normalizeStudentRecord(payload);
        let processedPayload = { ...payload, ...normalized };
        const oldKeyStr = key ? String(key).trim() : '';
        const targetId = String(processedPayload['রেজিস্ট্রেশন/আইডি নম্বর'] || processedPayload['রেজিস্ট্রেশন/আইডি'] || processedPayload.id || oldKeyStr).trim();
        
        if (targetId) {
          processedPayload.id = targetId;
          processedPayload['রেজিস্ট্রেশন/আইডি নম্বর'] = targetId;
          processedPayload['রেজিস্ট্রেশন/আইডি'] = targetId;
        }

        const currentList: Student[] = getLocalStorage('madrasah-students-db', []);
        
        // Match by old key if provided, or by new ID
        const idx = currentList.findIndex(s => {
          const sId = String(s.id || '').trim();
          const sReg = String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || '').trim();
          if (oldKeyStr && (sId === oldKeyStr || sReg === oldKeyStr)) return true;
          return sId === targetId || sReg === targetId;
        });

        let updated: Student[];
        if (idx !== -1) {
          updated = [...currentList];
          updated[idx] = normalizeStudentRecord({ ...updated[idx], ...processedPayload });
        } else {
          // Add newly added student to front
          updated = [normalizeStudentRecord(processedPayload), ...currentList];
        }

        await setStorageData('madrasah-students-db', updated);
        setStudents(updated);
        window.dispatchEvent(new Event('student_data_updated'));
      } else if (table === 'invoices') {
        const currentList = getLocalStorage('madrasah-invoices-db', []);
        const invId = payload.id || payload.invoiceNo;
        const idx = currentList.findIndex((i: any) => i.id === invId || i.invoiceNo === invId);
        let updated;
        if (idx !== -1) {
          updated = [...currentList];
          updated[idx] = { ...updated[idx], ...payload };
        } else {
          updated = [...currentList, payload];
        }
        await setStorageData('madrasah-invoices-db', updated);
        await setStorageData('madrasah-student-fees-db', updated);
        setInvoices(updated);
      } else if (table === 'expenses') {
        const currentList = getLocalStorage('madrasah-expenses-db', []);
        const expId = payload.id;
        const idx = currentList.findIndex((e: any) => e.id === expId);
        let updated;
        if (idx !== -1) {
          updated = [...currentList];
          updated[idx] = { ...updated[idx], ...payload };
        } else {
          updated = [...currentList, payload];
        }
        await setStorageData('madrasah-expenses-db', updated);
        setExpenses(updated);
      } else if (table === 'income' || table === 'income_records') {
        const currentList = getLocalStorage('madrasah_income_records_db', []);
        const incId = payload.id;
        const idx = currentList.findIndex((i: any) => i.id === incId);
        let updated;
        if (idx !== -1) {
          updated = [...currentList];
          updated[idx] = { ...updated[idx], ...payload };
        } else {
          updated = [...currentList, payload];
        }
        await setStorageData('madrasah_income_records_db', updated);
        setIncomeRecords(updated);
      } else if (table === 'staff_members') {
        const currentList = getLocalStorage('madrasah-staff-members-db', []);
        const stId = payload.id;
        const idx = currentList.findIndex((s: any) => s.id === stId);
        let updated;
        if (idx !== -1) {
          updated = [...currentList];
          updated[idx] = { ...updated[idx], ...payload };
        } else {
          updated = [...currentList, payload];
        }
        await setStorageData('madrasah-staff-members-db', updated);
        setStaffMembers(updated);
      } else if (table === 'fee_heads' || table === 'fee_heads_all') {
        let updated;
        if (table === 'fee_heads_all' || Array.isArray(payload)) {
          updated = payload;
        } else {
          const currentList = getLocalStorage('madrasah-fee-heads', []);
          const headId = payload.id;
          const idx = currentList.findIndex((h: any) => h.id === headId);
          if (idx !== -1) {
            updated = [...currentList];
            updated[idx] = { ...updated[idx], ...payload };
          } else {
            updated = [...currentList, payload];
          }
        }
        await setStorageData('madrasah-fee-heads', updated);
        setFeeHeads(updated);
      } else if (table === 'class_fee_mappings' || table === 'class_fee_mappings_all') {
        let updatedMap: any;
        if (table === 'class_fee_mappings_all' || key === 'all') {
          updatedMap = payload;
        } else {
          const className = key || payload.className || payload.class_name;
          if (className) {
            const currentMap = getLocalStorage('madrasah-class-fee-mapping', {});
            updatedMap = { ...currentMap, [className]: payload };
          } else {
            updatedMap = payload;
          }
        }
        await setStorageData('madrasah-class-fee-mapping', updatedMap);
        setClassFeeMapping(updatedMap);
        window.dispatchEvent(new Event('madrasah-class-fee-mapping_updated'));
      } else if (table.startsWith('acad_')) {
        const storageKey = table;
        const currentList = getLocalStorage(storageKey, []);
        const itemId = payload.id || key;
        const idx = currentList.findIndex((i: any) => String(i.id) === String(itemId));
        let updated;
        if (idx !== -1) {
          updated = [...currentList];
          updated[idx] = { ...updated[idx], ...payload };
        } else {
          updated = [payload, ...currentList];
        }
        await setStorageData(storageKey, updated);
        if (table === 'acad_branches') {
          window.dispatchEvent(new Event('acad_branches_updated'));
        }
      } else {
        const currentList = getLocalStorage(`madrasah_${table}`, []);
        const itemId = payload.id || key;
        const idx = currentList.findIndex((i: any) => String(i.id) === String(itemId));
        let updated;
        if (idx !== -1) {
          updated = [...currentList];
          updated[idx] = { ...updated[idx], ...payload };
        } else {
          updated = [payload, ...currentList];
        }
        await setStorageData(`madrasah_${table}`, updated);
      }

      toast.success('সফলভাবে সংরক্ষিত হয়েছে', { id: toastId });
      await refreshData(true);
    } catch (err: any) {
      console.error(`Update failed for ${table}:`, err);
      toast.error(`সংরক্ষণ করতে সমস্যা হয়েছে: ${err.message || ''}`, { id: toastId });
    }
  };

  // Helper to push any deleted entity to the 30-day global recycle bin
  const pushToGlobalRecycleBin = async (
    type: string, 
    typeLabel: string, 
    title: string, 
    subtitle: string, 
    data: any
  ) => {
    try {
      const nowIso = new Date().toISOString();
      const expiresAtIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const currentBin: RecycleBinItem[] = getLocalStorage('madrasah_global_recycle_bin_db', []);
      
      const newRecycleItem: RecycleBinItem = {
        id: 'recycle_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        type,
        typeLabel,
        title,
        subtitle,
        data,
        deletedAt: nowIso,
        expiresAt: expiresAtIso
      };

      const updatedBin = [newRecycleItem, ...currentBin];
      await setStorageData('madrasah_global_recycle_bin_db', updatedBin);
      setRecycleBinItems(updatedBin);
    } catch (e) {
      console.error('Failed to archive to global recycle bin:', e);
    }
  };

  const restoreRecycleItem = async (recycleId: string) => {
    const toastId = toast.loading('ডাটা পুনরুদ্ধার করা হচ্ছে...');
    try {
      const currentBin: RecycleBinItem[] = getLocalStorage('madrasah_global_recycle_bin_db', []);
      const item = currentBin.find(i => i.id === recycleId);
      if (!item) {
        toast.error('তথ্য পাওয়া যায়নি', { id: toastId });
        return;
      }

      const { type, data } = item;

      if (type === 'students') {
        const cleaned: Student = { ...data };
        delete (cleaned as any).deletedAt;
        delete (cleaned as any).isDeleted;

        const currentStudents: Student[] = getLocalStorage('madrasah-students-db', []);
        const targetIdStr = String(cleaned.id || cleaned['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim();
        const updatedStudents = [
          cleaned,
          ...currentStudents.filter(s => 
            String(s.id).trim() !== targetIdStr && 
            String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim() !== targetIdStr
          )
        ];
        await setStorageData('madrasah-students-db', updatedStudents);
        setStudents(updatedStudents);
        window.dispatchEvent(new Event('student_data_updated'));
      } else if (type === 'invoices') {
        const currentList = getLocalStorage('madrasah-invoices-db', []);
        const invId = String(data.id || data.invoiceNo || '').trim();
        const updated = [data, ...currentList.filter((i: any) => String(i.id || i.invoiceNo || '').trim() !== invId)];
        await setStorageData('madrasah-invoices-db', updated);
        await setStorageData('madrasah-student-fees-db', updated);
        setInvoices(updated);
      } else if (type === 'expenses') {
        const currentList = getLocalStorage('madrasah-expenses-db', []);
        const expId = String(data.id || '').trim();
        const updated = [data, ...currentList.filter((e: any) => String(e.id || '').trim() !== expId)];
        await setStorageData('madrasah-expenses-db', updated);
        setExpenses(updated);
      } else if (type === 'income' || type === 'income_records') {
        const currentList = getLocalStorage('madrasah_income_records_db', []);
        const incId = String(data.id || '').trim();
        const updated = [data, ...currentList.filter((i: any) => String(i.id || '').trim() !== incId)];
        await setStorageData('madrasah_income_records_db', updated);
        setIncomeRecords(updated);
      } else if (type === 'staff_members') {
        const currentList = getLocalStorage('madrasah-staff-members-db', []);
        const stId = String(data.id || '').trim();
        const updated = [data, ...currentList.filter((s: any) => String(s.id || '').trim() !== stId)];
        await setStorageData('madrasah-staff-members-db', updated);
        setStaffMembers(updated);
      } else if (type === 'fee_heads') {
        const currentList = getLocalStorage('madrasah-fee-heads', []);
        const headId = String(data.id || '').trim();
        const updated = [data, ...currentList.filter((h: any) => String(h.id || '').trim() !== headId)];
        await setStorageData('madrasah-fee-heads', updated);
        setFeeHeads(updated);
      } else if (type.startsWith('acad_')) {
        const storageKey = type;
        const currentList = getLocalStorage(storageKey, []);
        const itemId = String(data.id || '').trim();
        const updated = [data, ...currentList.filter((i: any) => String(i.id || '').trim() !== itemId)];
        await setStorageData(storageKey, updated);
      } else {
        const currentList = getLocalStorage(`madrasah_${type}`, []);
        const itemId = String(data.id || '').trim();
        const updated = [data, ...currentList.filter((i: any) => String(i.id || '').trim() !== itemId)];
        await setStorageData(`madrasah_${type}`, updated);
      }

      // Remove from global recycle bin
      const updatedBin = currentBin.filter(i => i.id !== recycleId);
      await setStorageData('madrasah_global_recycle_bin_db', updatedBin);
      setRecycleBinItems(updatedBin);

      toast.success(`"${item.title}" সফলভাবে সিস্টেমে পুনরুদ্ধার করা হয়েছে`, { id: toastId });
      await refreshData(true);
    } catch (err: any) {
      console.error('Restore failed:', err);
      toast.error(`পুনরুদ্ধার করতে সমস্যা হয়েছে: ${err.message || ''}`, { id: toastId });
    }
  };

  const permanentDeleteRecycleItem = async (recycleId: string) => {
    const toastId = toast.loading('স্থায়ীভাবে মুছে ফেলা হচ্ছে...');
    try {
      const currentBin: RecycleBinItem[] = getLocalStorage('madrasah_global_recycle_bin_db', []);
      const updatedBin = currentBin.filter(i => i.id !== recycleId);
      await setStorageData('madrasah_global_recycle_bin_db', updatedBin);
      setRecycleBinItems(updatedBin);
      toast.success('তথ্যটি রিসাইকেল বিন থেকে চিরতরে ডিলিট করা হয়েছে', { id: toastId });
    } catch (err: any) {
      console.error('Permanent delete failed:', err);
      toast.error(`মুছতে ব্যর্থ হয়েছে: ${err.message || ''}`, { id: toastId });
    }
  };

  const emptyGlobalRecycleBin = async () => {
    const toastId = toast.loading('রিসাইকেল বিন পরিষ্কার করা হচ্ছে...');
    try {
      await setStorageData('madrasah_global_recycle_bin_db', []);
      setRecycleBinItems([]);
      toast.success('সম্পূর্ণ রিসাইকেল বিন স্থায়ীভাবে পরিষ্কার করা হয়েছে', { id: toastId });
    } catch (err: any) {
      console.error('Empty global recycle bin failed:', err);
      toast.error(`খালি করতে সমস্যা হয়েছে: ${err.message || ''}`, { id: toastId });
    }
  };

  const deleteStudent = async (id: string | number) => {
    const toastId = toast.loading('শিক্ষার্থীকে রিসাইকেল বিনে পাঠানো হচ্ছে...');
    try {
      const currentList: Student[] = getLocalStorage('madrasah-students-db', []);
      const targetIdStr = String(id).trim();
      const deletedStudent = currentList.find(s => 
        String(s.id).trim() === targetIdStr || 
        String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim() === targetIdStr || 
        String(s['রেজিস্ট্রেশন/আইডি'] || '').trim() === targetIdStr
      );

      if (deletedStudent) {
        const archivedStudent: Student = {
          ...deletedStudent,
          deletedAt: new Date().toISOString(),
          isDeleted: true
        };
        // 1. Add to Legacy Student Bin
        const currentRecycleBin: Student[] = getLocalStorage('madrasah-recycle-bin-students-db', []);
        const updatedBin = [
          archivedStudent, 
          ...currentRecycleBin.filter(s => 
            String(s.id).trim() !== targetIdStr && 
            String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim() !== targetIdStr &&
            String(s['রেজিস্ট্রেশন/আইডি'] || '').trim() !== targetIdStr
          )
        ];
        await setStorageData('madrasah-recycle-bin-students-db', updatedBin);
        setRecycleBinStudents(updatedBin);

        // 2. Add to 30-Day Global Recycle Bin
        const sName = deletedStudent['শিক্ষার্থীর নাম'] || deletedStudent.name || 'শিক্ষার্থী';
        const sId = deletedStudent['রেজিস্ট্রেশন/আইডি নম্বর'] || deletedStudent.id || '';
        const sClass = deletedStudent['জামাত/শ্রেণী'] || deletedStudent.class || '';
        const sRoll = deletedStudent['রোল নম্বর'] || deletedStudent.roll || '';

        await pushToGlobalRecycleBin(
          'students',
          'শিক্ষার্থী',
          `${sName} (আইডি: #${sId})`,
          `জামাত: ${sClass} | রোল: ${sRoll}`,
          deletedStudent
        );
      }

      const updatedStudents = currentList.filter(s => 
        String(s.id).trim() !== targetIdStr && 
        String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim() !== targetIdStr && 
        String(s['রেজিস্ট্রেশন/আইডি'] || '').trim() !== targetIdStr
      );
      await setStorageData('madrasah-students-db', updatedStudents);
      setStudents(updatedStudents);

      window.dispatchEvent(new Event('student_data_updated'));
      toast.success('শিক্ষার্থীকে রিসাইকেল বিনে স্থানান্তর করা হয়েছে (৩০ দিন সংরক্ষিত থাকবে)', { id: toastId });
    } catch (err: any) {
      console.error('Delete student failed:', err);
      toast.error(`মুছতে সমস্যা হয়েছে: ${err.message || ''}`, { id: toastId });
    }
  };

  const restoreStudent = async (id: string | number) => {
    const toastId = toast.loading('পুনরুদ্ধার করা হচ্ছে...');
    try {
      const targetIdStr = String(id).trim();
      const currentBin: Student[] = getLocalStorage('madrasah-recycle-bin-students-db', []);
      const restored = currentBin.find(s => 
        String(s.id).trim() === targetIdStr || 
        String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim() === targetIdStr ||
        String(s['রেজিস্ট্রেশন/আইডি'] || '').trim() === targetIdStr
      );

      if (restored) {
        const cleaned: Student = { ...restored };
        delete (cleaned as any).deletedAt;
        delete (cleaned as any).isDeleted;

        const currentStudents: Student[] = getLocalStorage('madrasah-students-db', []);
        const updatedStudents = [
          cleaned, 
          ...currentStudents.filter(s => 
            String(s.id).trim() !== targetIdStr && 
            String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim() !== targetIdStr &&
            String(s['রেজিস্ট্রেশন/আইডি'] || '').trim() !== targetIdStr
          )
        ];
        await setStorageData('madrasah-students-db', updatedStudents);
        setStudents(updatedStudents);

        const updatedBin = currentBin.filter(s => 
          String(s.id).trim() !== targetIdStr && 
          String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim() !== targetIdStr &&
          String(s['রেজিস্ট্রেশন/আইডি'] || '').trim() !== targetIdStr
        );
        await setStorageData('madrasah-recycle-bin-students-db', updatedBin);
        setRecycleBinStudents(updatedBin);

        // Also remove from global bin
        const globalBin: RecycleBinItem[] = getLocalStorage('madrasah_global_recycle_bin_db', []);
        const updatedGlobalBin = globalBin.filter(i => {
          const sid = i.data?.['রেজিস্ট্রেশন/আইডি নম্বর'] || i.data?.id;
          return String(sid).trim() !== targetIdStr;
        });
        await setStorageData('madrasah_global_recycle_bin_db', updatedGlobalBin);
        setRecycleBinItems(updatedGlobalBin);

        window.dispatchEvent(new Event('student_data_updated'));
        toast.success(`"${cleaned['শিক্ষার্থীর নাম'] || cleaned.name}" সফলভাবে পুনরুদ্ধার করা হয়েছে`, { id: toastId });
      } else {
        toast.error('শিক্ষার্থী পাওয়া যায়নি', { id: toastId });
      }
    } catch (err: any) {
      console.error('Restore failed:', err);
      toast.error(`পুনরুদ্ধার করতে সমস্যা হয়েছে: ${err.message || ''}`, { id: toastId });
    }
  };

  const permanentDeleteStudent = async (id: string | number) => {
    const toastId = toast.loading('স্থায়ীভাবে মুছে ফেলা হচ্ছে...');
    try {
      const targetIdStr = String(id).trim();
      const currentBin: Student[] = getLocalStorage('madrasah-recycle-bin-students-db', []);
      const updatedBin = currentBin.filter(s => 
        String(s.id).trim() !== targetIdStr && 
        String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim() !== targetIdStr &&
        String(s['রেজিস্ট্রেশন/আইডি'] || '').trim() !== targetIdStr
      );
      await setStorageData('madrasah-recycle-bin-students-db', updatedBin);
      setRecycleBinStudents(updatedBin);

      // Also clean from global bin
      const globalBin: RecycleBinItem[] = getLocalStorage('madrasah_global_recycle_bin_db', []);
      const updatedGlobalBin = globalBin.filter(i => {
        const sid = i.data?.['রেজিস্ট্রেশন/আইডি নম্বর'] || i.data?.id;
        return String(sid).trim() !== targetIdStr;
      });
      await setStorageData('madrasah_global_recycle_bin_db', updatedGlobalBin);
      setRecycleBinItems(updatedGlobalBin);

      toast.success('ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে', { id: toastId });
    } catch (err: any) {
      console.error('Permanent delete failed:', err);
      toast.error(`মুছতে ব্যর্থ হয়েছে: ${err.message || ''}`, { id: toastId });
    }
  };

  const emptyRecycleBin = async () => {
    const toastId = toast.loading('রিসাইকেল বিন খালি করা হচ্ছে...');
    try {
      await setStorageData('madrasah-recycle-bin-students-db', []);
      setRecycleBinStudents([]);
      toast.success('রিসাইকেল বিন সম্পূর্ণ খালি করা হয়েছে', { id: toastId });
    } catch (err: any) {
      console.error('Empty recycle bin failed:', err);
      toast.error(`খালি করতে সমস্যা হয়েছে: ${err.message || ''}`, { id: toastId });
    }
  };

  const deleteData = async (table: string, id: string | number) => {
    if (table === 'students') {
      return await deleteStudent(id);
    }
    const toastId = toast.loading('ডাটা রিসাইকেল বিনে পাঠানো হচ্ছে...');
    try {
      if (table === 'invoices') {
        const currentList = getLocalStorage('madrasah-invoices-db', null);
        const sourceList = (Array.isArray(currentList) && currentList.length > 0) ? currentList : invoices;
        const targetIdStr = String(id).trim();
        const deletedInvoice = sourceList.find((i: any) => String(i.id || '').trim() === targetIdStr || String(i.invoiceNo || '').trim() === targetIdStr);
        
        if (deletedInvoice) {
          await pushToGlobalRecycleBin(
            'invoices',
            'ফি ইনভয়েস',
            `ইনভয়েস #${deletedInvoice.invoiceNo || deletedInvoice.id} (${deletedInvoice.studentName || 'শিক্ষার্থী'})`,
            `পরিশোধ: ৳${deletedInvoice.paidAmount || 0} | মাস: ${deletedInvoice.month || '-'}`,
            deletedInvoice
          );
        }

        const updated = sourceList.filter((i: any) => {
          const invId = String(i.id || '').trim();
          const invNo = String(i.invoiceNo || '').trim();
          return invId !== targetIdStr && invNo !== targetIdStr;
        });
        await setStorageData('madrasah-invoices-db', updated);
        await setStorageData('madrasah-student-fees-db', updated);
        setInvoices(updated);
      } else if (table === 'expenses') {
        const currentList = getLocalStorage('madrasah-expenses-db', []);
        const targetIdStr = String(id).trim();
        const deletedExpense = currentList.find((e: any) => String(e.id).trim() === targetIdStr);

        if (deletedExpense) {
          await pushToGlobalRecycleBin(
            'expenses',
            'ব্যয় ভাউচার',
            `${deletedExpense.title || 'ব্যয়'} (৳${deletedExpense.amount || 0})`,
            `খাত: ${deletedExpense.category || '-'} | তারিখ: ${deletedExpense.date || '-'}`,
            deletedExpense
          );
        }

        const updated = currentList.filter((e: any) => String(e.id).trim() !== targetIdStr);
        await setStorageData('madrasah-expenses-db', updated);
        setExpenses(updated);
      } else if (table === 'income' || table === 'income_records') {
        const currentList = getLocalStorage('madrasah_income_records_db', []);
        const targetIdStr = String(id).trim();
        const deletedInc = currentList.find((i: any) => String(i.id).trim() === targetIdStr);

        if (deletedInc) {
          await pushToGlobalRecycleBin(
            'income',
            'আয় রেকর্ড',
            `${deletedInc.title || 'আয়'} (৳${deletedInc.amount || 0})`,
            `উৎস: ${deletedInc.sourceOrDonor || deletedInc.categoryLabel || '-'}`,
            deletedInc
          );
        }

        const updated = currentList.filter((i: any) => String(i.id).trim() !== targetIdStr);
        await setStorageData('madrasah_income_records_db', updated);
        setIncomeRecords(updated);
      } else if (table === 'staff_members' || table === 'teachers') {
        const currentList = getLocalStorage('madrasah-staff-members-db', []);
        const targetIdStr = String(id).trim();
        const deletedStaff = currentList.find((s: any) => String(s.id).trim() === targetIdStr);

        if (deletedStaff) {
          await pushToGlobalRecycleBin(
            'staff_members',
            'শিক্ষক/কর্মী',
            `${deletedStaff.name || 'কর্মী'} (${deletedStaff.designation || 'পদবি'})`,
            `মোবাইল: ${deletedStaff.phone || '-'}`,
            deletedStaff
          );
        }

        const updated = currentList.filter((s: any) => String(s.id).trim() !== targetIdStr);
        await setStorageData('madrasah-staff-members-db', updated);
        setStaffMembers(updated);
      } else if (table === 'fee_heads') {
        const currentList = getLocalStorage('madrasah-fee-heads', []);
        const targetIdStr = String(id).trim();
        const deletedHead = currentList.find((h: any) => String(h.id).trim() === targetIdStr);

        if (deletedHead) {
          await pushToGlobalRecycleBin(
            'fee_heads',
            'ফি খাত',
            `${deletedHead.name || 'খাত'} (৳${deletedHead.amount || 0})`,
            `ধরণ: ${deletedHead.type || '-'}`,
            deletedHead
          );
        }

        const updated = currentList.filter((h: any) => String(h.id).trim() !== targetIdStr);
        await setStorageData('madrasah-fee-heads', updated);
        setFeeHeads(updated);
      } else if (table.startsWith('acad_')) {
        const storageKey = table;
        const currentList = getLocalStorage(storageKey, []);
        const targetIdStr = String(id).trim();
        const deletedAcad = currentList.find((i: any) => String(i.id).trim() === targetIdStr);

        if (deletedAcad) {
          await pushToGlobalRecycleBin(
            table,
            'একাডেমিক ডাটা',
            `${deletedAcad.name || deletedAcad.title || 'একাডেমিক রেকর্ড'}`,
            `মডিউল: ${table}`,
            deletedAcad
          );
        }

        const updated = currentList.filter((i: any) => String(i.id).trim() !== targetIdStr);
        await setStorageData(storageKey, updated);
        if (table === 'acad_branches') {
          window.dispatchEvent(new Event('acad_branches_updated'));
        }
      } else {
        const currentList = getLocalStorage(`madrasah_${table}`, []);
        const targetIdStr = String(id).trim();
        const deletedGeneral = currentList.find((i: any) => String(i.id).trim() === targetIdStr);

        if (deletedGeneral) {
          await pushToGlobalRecycleBin(
            table,
            'সাধারণ ডাটা',
            `${deletedGeneral.name || deletedGeneral.title || 'ডাটা রেকর্ড'}`,
            `টেবিল: ${table}`,
            deletedGeneral
          );
        }

        const updated = currentList.filter((i: any) => String(i.id).trim() !== targetIdStr);
        await setStorageData(`madrasah_${table}`, updated);
      }

      toast.success('তথ্যটি সফলভাবে সিস্টেমে মোছা হয়েছে এবং ৩০ দিনের জন্য রিসাইকেল বিনে জমা রাখা হয়েছে', { id: toastId });
      await refreshData(true);
    } catch (err: any) {
      console.error(`Delete failed for ${table}:`, err);
      toast.error(`মুছতে সমস্যা হয়েছে: ${err.message || ''}`, { id: toastId });
    }
  };

  const clearAllCache = async () => {
    setIsLoading(true);
    localStorage.clear();
    await refreshData();
    toast.success('ক্যাশ ও ডাটা পরিষ্কার করা হয়েছে');
  };

  return (
    <DataContext.Provider value={{ 
      feeHeads, 
      classFeeMapping, 
      invoices, 
      staffMembers, 
      expenses, 
      incomeRecords,
      studentOverrides,
      students,
      recycleBinStudents,
      recycleBinItems,
      restoreRecycleItem,
      permanentDeleteRecycleItem,
      emptyGlobalRecycleBin,
      deleteStudent,
      restoreStudent,
      permanentDeleteStudent,
      emptyRecycleBin,
      staffAttendance,
      studentAttendance,
      departments,
      classes,
      branches,
      subjects,
      classSubjects,
      teacherSubjects,
      examDates,
      evaluationMetrics,
      teachers,
      pendingApplications,
      madrasahBranding,
      mediaAssets,
      updateBranding,
      saveMediaAsset,
      deleteMediaAsset,
      isLoading,
      refreshData,
      updateData,
      deleteData,
      clearAllCache,
      jamatList,
      classDetailsMap
    }}>
      <Toaster position="top-right" />
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
