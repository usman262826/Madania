import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  User,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  Printer,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Layers,
  X,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Student } from '../../types';
import { useData } from '../../contexts/DataContext';
import { JAMAT_LIST, DEFAULT_BRANCHES } from '../../constants';
import { enToBnNumber, bnToEnNumber, cn, numberToBanglaWords } from '../../lib/utils';
import { BENGALI_MONTHS, YEARS_LIST, getBengaliMonthIndex } from '../../utils/studentFeeTrackerUtils';

export interface BulkStudentFeeItem {
  id: string;
  headId: string;
  headName: string;
  month: string;
  defaultRate: number;
  assignedRate: number;
  discount: number;
  amount: number;
}

export interface StudentBulkConfig {
  student: Student;
  items: BulkStudentFeeItem[];
  previousDue: number;
  includePreviousDue: boolean;
  paidAmount: number;
  paymentMethod: string;
  comment: string;
  isExpanded: boolean;
  selectedRowIds?: string[];
  editableRowIds?: string[];
}

interface BulkStudentFeeCollectorProps {
  students: Student[];
  onFinish?: () => void;
  onViewInvoice?: (invoice: any) => void;
  onNavigateToInvoices?: () => void;
  initialSelectedStudentIds?: string[];
  onSelectedStudentIdsChange?: (ids: string[]) => void;
}

// Helper to get consistent student ID
const getStudentId = (student: any): string => {
  if (!student) return '';
  return String(
    student.id ||
    student['রেজিস্ট্রেশন/আইডি নম্বর'] ||
    student['রেজিস্ট্রেশন/আইডি'] ||
    student.studentId ||
    student['আবেদন নং'] ||
    ''
  ).trim();
};

export const BulkStudentFeeCollector: React.FC<BulkStudentFeeCollectorProps> = ({
  students,
  onFinish,
  onViewInvoice,
  onNavigateToInvoices,
  initialSelectedStudentIds,
  onSelectedStudentIdsChange,
}) => {
  const {
    feeHeads,
    classFeeMapping,
    invoices,
    studentOverrides,
    updateData,
    madrasahBranding,
  } = useData();

  // Current Month & Year Defaults
  const currentMonthName = useMemo(() => {
    const idx = new Date().getMonth();
    return BENGALI_MONTHS[idx] || 'জানুয়ারি';
  }, []);

  // --- Filter States for Selecting Students ---
  const [filterJamat, setFilterJamat] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Student IDs for bulk billing
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(initialSelectedStudentIds || []);

  // Sync state with parent prop if it changes externally
  useEffect(() => {
    if (initialSelectedStudentIds) {
      setSelectedStudentIds(initialSelectedStudentIds);
    }
  }, [initialSelectedStudentIds]);

  // Propagate changes back to parent
  useEffect(() => {
    if (onSelectedStudentIdsChange) {
      onSelectedStudentIdsChange(selectedStudentIds);
    }
  }, [selectedStudentIds, onSelectedStudentIdsChange]);

  // --- Global Default Configuration (সকলের জন্য ডিফল্ট সেটিংস) ---
  const [globalMonth, setGlobalMonth] = useState<string>(currentMonthName);
  const [globalYear, setGlobalYear] = useState<string>('২০২৬');
  const [globalPaymentMethod, setGlobalPaymentMethod] = useState<string>('নগদ');
  const [globalDate, setGlobalDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [globalMode, setGlobalMode] = useState<'package_auto' | 'single_head' | 'custom_template' | 'custom'>('custom_template');
  const [globalSingleHeadId, setGlobalSingleHeadId] = useState<string>('4');
  const [globalSingleHeadAmount, setGlobalSingleHeadAmount] = useState<string>('500');

  // --- New Custom Global Template States (একক এর মতো ইন্টারফেস) ---
  const [globalItems, setGlobalItems] = useState<BulkStudentFeeItem[]>(() => [
    {
      id: 'default-global-1',
      headId: '4', // মাসিক অনাবাসিক বেতন
      headName: 'মাসিক অনাবাসিক বেতন',
      month: currentMonthName,
      defaultRate: 500,
      assignedRate: 500,
      discount: 0,
      amount: 500,
    }
  ]);
  const [globalDiscountCode, setGlobalDiscountCode] = useState<string>('');
  const [globalPromoDiscount, setGlobalPromoDiscount] = useState<number>(0);
  const [globalComment, setGlobalComment] = useState<string>('');
  const [globalIncludePreviousDue, setGlobalIncludePreviousDue] = useState<boolean>(false);
  const [globalPaidAmountRule, setGlobalPaidAmountRule] = useState<'full' | 'partial' | 'zero'>('full');
  const [globalFixedPaidAmount, setGlobalFixedPaidAmount] = useState<number>(0);
  const [globalSelectedRowIds, setGlobalSelectedRowIds] = useState<string[]>([]);
  const [globalEditableRowIds, setGlobalEditableRowIds] = useState<string[]>([]);

  const handleGlobalDiscountCodeChange = (codeVal: string) => {
    setGlobalDiscountCode(codeVal);
    const cleanCode = codeVal.trim().toUpperCase();
    if (!cleanCode) {
      setGlobalPromoDiscount(0);
      return;
    }

    const sub = globalItems.reduce((sum, item) => sum + item.defaultRate, 0);
    if (cleanCode === 'PROMO10' || cleanCode === 'DISCOUNT10') {
      setGlobalPromoDiscount(Math.round(sub * 0.10));
    } else if (cleanCode === 'PROMO20' || cleanCode === 'DISCOUNT20') {
      setGlobalPromoDiscount(Math.round(sub * 0.20));
    } else if (cleanCode === 'SCHOLARSHIP' || cleanCode === 'HALF') {
      setGlobalPromoDiscount(Math.round(sub * 0.50));
    } else if (cleanCode === 'FREE' || cleanCode === 'FULL') {
      setGlobalPromoDiscount(sub);
    } else if (!isNaN(Number(cleanCode)) && Number(cleanCode) > 0) {
      setGlobalPromoDiscount(Number(cleanCode));
    } else {
      setGlobalPromoDiscount(Math.round(sub * 0.05));
    }
  };

  const handleAddHeadToGlobal = () => {
    const firstHead = feeHeads[0] || { id: '13', name: 'অন্যান্য' };
    const newId = 'global-' + Math.random().toString(36).substring(2, 9);
    const newItem: BulkStudentFeeItem = {
      id: newId,
      headId: String(firstHead.id),
      headName: firstHead.name,
      month: globalMonth,
      defaultRate: 500,
      assignedRate: 500,
      discount: 0,
      amount: 500,
    };
    setGlobalItems((prev) => [...prev, newItem]);
    setGlobalEditableRowIds((prev) => [...prev, newId]);
  };

  const handleToggleGlobalRowEditMode = () => {
    const selected = globalSelectedRowIds;
    const editable = globalEditableRowIds;
    const targetIds = selected.length > 0 ? selected : globalItems.map((it) => it.id);
    const allCurrentlyEditable = targetIds.every((id) => editable.includes(id));

    let newEditable: string[];
    if (allCurrentlyEditable) {
      newEditable = editable.filter((id) => !targetIds.includes(id));
    } else {
      newEditable = Array.from(new Set([...editable, ...targetIds]));
    }
    setGlobalEditableRowIds(newEditable);
  };

  const handleDeleteGlobalSelectedRows = () => {
    const selected = globalSelectedRowIds;
    const newItems = globalItems.filter((it) => !selected.includes(it.id));
    setGlobalItems(newItems);
    setGlobalSelectedRowIds([]);
    setGlobalEditableRowIds((prev) => prev.filter((id) => newItems.some((it) => it.id === id)));
  };

  const handleToggleGlobalRowSelection = (itemId: string) => {
    const selected = globalSelectedRowIds;
    const isSelected = selected.includes(itemId);
    const newSelected = isSelected
      ? selected.filter((id) => id !== itemId)
      : [...selected, itemId];
    setGlobalSelectedRowIds(newSelected);
  };

  const handleToggleSelectAllGlobalRows = () => {
    const allItemIds = globalItems.map((it) => it.id);
    const selected = globalSelectedRowIds;
    const allSelected = allItemIds.length > 0 && allItemIds.every((id) => selected.includes(id));
    setGlobalSelectedRowIds(allSelected ? [] : allItemIds);
  };

  const handleUpdateGlobalItem = (
    itemId: string,
    field: keyof BulkStudentFeeItem,
    value: any
  ) => {
    setGlobalItems((prev) => {
      return prev.map((it) => {
        if (it.id !== itemId) return it;
        const item = { ...it };

        if (field === 'headId') {
          const hObj = feeHeads.find((h) => String(h.id) === String(value));
          item.headId = String(value);
          item.headName = hObj ? hObj.name : 'ফি';
        } else if (field === 'discount') {
          const disc = Math.max(0, Number(value) || 0);
          item.discount = disc;
          item.amount = Math.max(0, item.defaultRate - disc);
        } else if (field === 'amount') {
          const amt = Math.max(0, Number(value) || 0);
          item.amount = amt;
          if (item.defaultRate < amt) {
            item.defaultRate = amt;
            item.discount = 0;
          } else {
            item.discount = Math.max(0, item.defaultRate - amt);
          }
        } else if (field === 'defaultRate') {
          const rate = Math.max(0, Number(value) || 0);
          item.defaultRate = rate;
          item.amount = Math.max(0, rate - item.discount);
        } else {
          (item as any)[field] = value;
        }

        return item;
      });
    });
  };

  const handleRemoveHeadFromGlobal = (itemId: string) => {
    setGlobalItems((prev) => prev.filter((it) => it.id !== itemId));
    setGlobalSelectedRowIds((prev) => prev.filter((id) => id !== itemId));
    setGlobalEditableRowIds((prev) => prev.filter((id) => id !== itemId));
  };

  const globalCalculations = useMemo(() => {
    const subtotal = globalItems.reduce((sum, item) => sum + item.defaultRate, 0);
    const itemDiscounts = globalItems.reduce((sum, item) => sum + (item.discount || 0), 0);
    const totalDiscount = itemDiscounts + globalPromoDiscount;
    const netBill = Math.max(0, subtotal - totalDiscount);
    const totalBill = netBill; // previous due doesn't apply directly to global template
    return {
      subtotal,
      totalDiscount,
      netBill,
      totalBill,
    };
  }, [globalItems, globalPromoDiscount]);

  // Map of per-student customized configurations: studentId -> StudentBulkConfig
  const [studentConfigs, setStudentConfigs] = useState<Record<string, StudentBulkConfig>>({});

  // Success Modal & Batch Print State
  const [createdInvoices, setCreatedInvoices] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Helper to determine student's category
  const getStudentCategory = (student: Student): { isResidential: boolean; isDayCare: boolean; categoryLabel: string } => {
    const sBranch = (student['শাখা'] || student.branch || '').toString().toLowerCase();
    const sRes = (
      student['আবাসিক বিষয়'] ||
      student['আবাসিক অবস্থা'] ||
      student['আবাসিক/অনাবাসিক'] ||
      student.residentialStatus ||
      student['বিভাগ'] ||
      student.department ||
      ''
    ).toString().toLowerCase();

    const isDayCare = sBranch.includes('ডে') || sRes.includes('ডে');
    const isResidential = !isDayCare && (sBranch.includes('আবাসিক') || sRes.includes('আবাসিক') || sRes.includes('residential'));
    const categoryLabel = isDayCare ? 'ডে-কেয়ার' : isResidential ? 'আবাসিক' : 'অনাবাসিক';

    return { isResidential, isDayCare, categoryLabel };
  };

  // Helper to get student's previous due
  const getStudentPreviousDue = (studentId: string): number => {
    return invoices
      .filter((inv) => String(inv.studentId || '') === String(studentId) && inv.status !== 'void')
      .reduce((sum, inv) => sum + (Number(inv.dueAmount) || 0), 0);
  };

  // Generate default fee items for a specific student based on global mode & rates
  const buildDefaultItemsForStudent = (
    student: Student,
    mode: 'package_auto' | 'single_head' | 'custom',
    month: string,
    singleHeadId: string,
    singleAmount: string
  ): BulkStudentFeeItem[] => {
    const studentId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || '');
    const sClass = student['জামাত/শ্রেণী'] || student.class || '';
    const { isResidential, isDayCare } = getStudentCategory(student);
    const override = studentOverrides && studentOverrides[studentId] ? studentOverrides[studentId] : null;

    // Lookup class fee rates
    let classRates: Record<string, any> = {};
    if (classFeeMapping && sClass) {
      if (classFeeMapping[sClass]) {
        classRates = classFeeMapping[sClass];
      } else {
        const normS = sClass.trim().toLowerCase().replace(/\s+/g, '');
        for (const key of Object.keys(classFeeMapping)) {
          const normK = key.trim().toLowerCase().replace(/\s+/g, '');
          if (normK === normS || normK.includes(normS) || normS.includes(normK)) {
            classRates = classFeeMapping[key];
            break;
          }
        }
      }
    }

    if (mode === 'single_head') {
      const headObj = feeHeads.find((h) => String(h.id) === String(singleHeadId)) || {
        id: singleHeadId,
        name: 'ফি',
      };
      const amt = Math.max(0, Number(singleAmount) || 0);
      return [
        {
          id: Math.random().toString(36).substring(2, 9),
          headId: String(headObj.id),
          headName: headObj.name,
          month,
          defaultRate: amt,
          assignedRate: amt,
          discount: 0,
          amount: amt,
        },
      ];
    }

    // Default package_auto mode: Load Tuition + Khoraki (if residential) + Electricity
    const items: BulkStudentFeeItem[] = [];

    // 1. Tuition Head
    const tuitionHeadId = isResidential ? '5' : isDayCare ? '15' : '4';
    const tuitionHeadName = isResidential
      ? 'মাসিক বেতন (আবাসিক)'
      : isDayCare
      ? 'মাসিক বেতন (ডে-কেয়ার)'
      : 'মাসিক বেতন (অনাবাসিক)';

    let defaultTuition = classRates[tuitionHeadId] !== undefined ? Number(classRates[tuitionHeadId]) : 0;
    if (defaultTuition === 0) {
      defaultTuition = isResidential ? 1500 : isDayCare ? 1200 : 800;
    }

    let customTuition: number | null = null;
    if (override && override.customRates && override.customRates[tuitionHeadId] !== undefined) {
      customTuition = Number(override.customRates[tuitionHeadId]);
    } else if (override && override.tuitionFee !== undefined) {
      customTuition = Number(override.tuitionFee);
    } else if (student.tuitionFee !== undefined && student.tuitionFee !== null && student.tuitionFee !== '') {
      customTuition = Number(student.tuitionFee);
    } else if (student['মাসিক বেতন'] !== undefined && student['মাসিক বেতন'] !== null && student['মাসিক বেতন'] !== '') {
      customTuition = Number(student['মাসিক বেতন']);
    }

    let assignedTuition = customTuition !== null && customTuition > 0 ? customTuition : defaultTuition;
    if (defaultTuition === 0 && assignedTuition > 0) defaultTuition = assignedTuition;

    let tuitionDiscount = 0;
    if (defaultTuition > 0 && assignedTuition < defaultTuition) {
      tuitionDiscount = defaultTuition - assignedTuition;
    }

    const tuitionAmount = Math.max(0, defaultTuition - tuitionDiscount);

    items.push({
      id: Math.random().toString(36).substring(2, 9),
      headId: tuitionHeadId,
      headName: tuitionHeadName,
      month,
      defaultRate: defaultTuition,
      assignedRate: assignedTuition,
      discount: tuitionDiscount,
      amount: tuitionAmount,
    });

    // 2. Khoraki / Boarding (for residential students)
    if (isResidential) {
      const khorakiHeadId = '6';
      const khorakiHeadName = 'खोराকী ফি (বোর্ডিং)';
      let defaultKhoraki = classRates[khorakiHeadId] !== undefined ? Number(classRates[khorakiHeadId]) : 0;
      if (defaultKhoraki === 0) defaultKhoraki = 2000;

      let customKhoraki: number | null = null;
      if (override && override.customRates && override.customRates[khorakiHeadId] !== undefined) {
        customKhoraki = Number(override.customRates[khorakiHeadId]);
      } else if (student.khorakiFee !== undefined && student.khorakiFee !== null && student.khorakiFee !== '') {
        customKhoraki = Number(student.khorakiFee);
      } else if (student['খোরাকী ফি'] !== undefined && student['খোরাকী ফি'] !== null && student['খোরাকী ফি'] !== '') {
        customKhoraki = Number(student['খোরাকী ফি']);
      }

      let assignedKhoraki = customKhoraki !== null && customKhoraki > 0 ? customKhoraki : defaultKhoraki;
      if (defaultKhoraki === 0 && assignedKhoraki > 0) defaultKhoraki = assignedKhoraki;

      let khorakiDiscount = 0;
      if (defaultKhoraki > 0 && assignedKhoraki < defaultKhoraki) {
        khorakiDiscount = defaultKhoraki - assignedKhoraki;
      }

      items.push({
        id: Math.random().toString(36).substring(2, 9),
        headId: khorakiHeadId,
        headName: khorakiHeadName,
        month,
        defaultRate: defaultKhoraki,
        assignedRate: assignedKhoraki,
        discount: khorakiDiscount,
        amount: Math.max(0, defaultKhoraki - khorakiDiscount),
      });
    }

    // 3. Electricity Bill
    const elecHeadId = '14';
    const defaultElec = classRates[elecHeadId] !== undefined ? Number(classRates[elecHeadId]) : (isResidential ? 100 : 0);
    if (defaultElec > 0) {
      items.push({
        id: Math.random().toString(36).substring(2, 9),
        headId: elecHeadId,
        headName: 'বিদ্যুৎ বিল',
        month,
        defaultRate: defaultElec,
        assignedRate: defaultElec,
        discount: 0,
        amount: defaultElec,
      });
    }

    return items;
  };

  // Filtered pool of students for selection
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchTerm.toLowerCase().trim();
      const sId = getStudentId(s);
      const sName = (s['শিক্ষার্থীর নাম'] || s.name || '').toString().toLowerCase();
      const sRoll = String(s['রোল নম্বর'] || s.roll || '');
      const sClass = s['জামাত/শ্রেণী'] || s.class || '';
      const sBranch = s['শাখা'] || s.branch || 'ক';
      const sMobile = (s['অভিভাবকের মোবাইল'] || s.mobile || s.phone || '').toString();
      const { categoryLabel } = getStudentCategory(s);

      const matchesSearch =
        !q ||
        sId.toLowerCase().includes(q) ||
        sName.includes(q) ||
        sRoll.includes(q) ||
        sMobile.includes(q);

      const matchesJamat = filterJamat === 'all' || sClass === filterJamat;
      const matchesBranch = filterBranch === 'all' || sBranch === filterBranch;
      const matchesCategory = filterCategory === 'all' || categoryLabel === filterCategory;

      return matchesSearch && matchesJamat && matchesBranch && matchesCategory;
    });
  }, [students, searchTerm, filterJamat, filterBranch, filterCategory]);

  // Sync studentConfigs when selectedStudentIds or global configurations change in real-time
  useEffect(() => {
    setStudentConfigs((prev) => {
      const next: Record<string, StudentBulkConfig> = {};

      selectedStudentIds.forEach((sId) => {
        const studentObj = students.find((s) => getStudentId(s) === sId);
        if (studentObj) {
          const existing = prev[sId];
          const prevDue = existing ? existing.previousDue : getStudentPreviousDue(sId);
          const isExpanded = existing ? existing.isExpanded : false;

          let items = existing ? existing.items : globalItems.map((git) => ({
            ...git,
            id: Math.random().toString(36).substring(2, 9),
          }));

          const netItemsTotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
          const incPrevDue = existing ? existing.includePreviousDue : globalIncludePreviousDue;
          const totalPayable = incPrevDue ? netItemsTotal + prevDue : netItemsTotal;

          // Determine paidAmount based on global rule or existing
          let paidAmount = existing ? existing.paidAmount : totalPayable;
          if (!existing) {
            if (globalPaidAmountRule === 'zero') {
              paidAmount = 0;
            } else if (globalPaidAmountRule === 'partial') {
              paidAmount = Math.min(globalFixedPaidAmount, totalPayable);
            }
          }

          next[sId] = {
            student: studentObj,
            items,
            previousDue: prevDue,
            includePreviousDue: incPrevDue,
            paidAmount: paidAmount,
            paymentMethod: existing ? existing.paymentMethod : globalPaymentMethod,
            comment: existing ? existing.comment : (globalComment || 'একসাথে একাধিক ফি সংগ্রহ'),
            isExpanded,
            selectedRowIds: existing ? existing.selectedRowIds || [] : [],
            editableRowIds: existing ? existing.editableRowIds || [] : [],
          };
        }
      });

      return next;
    });
  }, [
    selectedStudentIds,
    students,
    invoices,
    globalItems,
    globalIncludePreviousDue,
    globalPaidAmountRule,
    globalFixedPaidAmount,
    globalComment,
    globalPaymentMethod
  ]);

  // Handle Select All / Deselect All
  const handleToggleSelectAll = () => {
    const filteredIds = filteredStudents.map((s) => getStudentId(s));
    const allSelected =
      filteredIds.length > 0 &&
      filteredIds.every((id) => selectedStudentIds.includes(id));

    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Toggle single student selection
  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Re-apply Global Defaults to All Selected Students
  const handleApplyGlobalDefaultsToAll = () => {
    setStudentConfigs((prev) => {
      const updated: Record<string, StudentBulkConfig> = {};
      Object.keys(prev).forEach((sId) => {
        const studentObj = prev[sId].student;
        
        const items = globalItems.map((git) => ({
          ...git,
          id: Math.random().toString(36).substring(2, 9),
        }));

        const netItemsTotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
        const prevDue = prev[sId].previousDue;
        const incPrevDue = globalIncludePreviousDue;
        const totalPayable = incPrevDue ? netItemsTotal + prevDue : netItemsTotal;

        // Calculate paid amount based on the payment rule
        let paidAmount = totalPayable;
        if (globalPaidAmountRule === 'zero') {
          paidAmount = 0;
        } else if (globalPaidAmountRule === 'partial') {
          paidAmount = Math.min(globalFixedPaidAmount, totalPayable);
        }

        updated[sId] = {
          ...prev[sId],
          items,
          includePreviousDue: incPrevDue,
          paidAmount: paidAmount,
          paymentMethod: globalPaymentMethod,
          comment: globalComment || 'একসাথে একাধিক ফি সংগ্রহ',
          selectedRowIds: [],
          editableRowIds: [],
        };
      });
      return updated;
    });
    toast.success('সকল নির্বাচিত শিক্ষার্থীর উপর কাস্টম ইনভয়েস টেমপ্লেট ও সেটিংস রি-এপ্লাই করা হয়েছে!');
  };

  // Toggle expand/collapse accordion for a single student
  const handleToggleExpandStudent = (studentId: string) => {
    setStudentConfigs((prev) => {
      if (!prev[studentId]) return prev;
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          isExpanded: !prev[studentId].isExpanded,
        },
      };
    });
  };

  // Expand all / Collapse all accordions
  const handleExpandAllAccordions = (expand: boolean) => {
    setStudentConfigs((prev) => {
      const updated: Record<string, StudentBulkConfig> = {};
      Object.keys(prev).forEach((sId) => {
        updated[sId] = { ...prev[sId], isExpanded: expand };
      });
      return updated;
    });
  };

  // Toggle row checkbox selection for a specific student
  const handleToggleRowSelection = (studentId: string, itemId: string) => {
    setStudentConfigs((prev) => {
      const cfg = prev[studentId];
      if (!cfg) return prev;
      const selected = cfg.selectedRowIds || [];
      const isSelected = selected.includes(itemId);
      const newSelected = isSelected
        ? selected.filter((id) => id !== itemId)
        : [...selected, itemId];
      return {
        ...prev,
        [studentId]: {
          ...cfg,
          selectedRowIds: newSelected,
        },
      };
    });
  };

  // Toggle select all rows for a specific student
  const handleToggleSelectAllRows = (studentId: string) => {
    setStudentConfigs((prev) => {
      const cfg = prev[studentId];
      if (!cfg) return prev;
      const allItemIds = cfg.items.map((it) => it.id);
      const selected = cfg.selectedRowIds || [];
      const allSelected = allItemIds.length > 0 && allItemIds.every((id) => selected.includes(id));
      return {
        ...prev,
        [studentId]: {
          ...cfg,
          selectedRowIds: allSelected ? [] : allItemIds,
        },
      };
    });
  };

  // Toggle edit mode (Lock/Unlock) for a specific student's rows
  const handleToggleRowEditMode = (studentId: string) => {
    setStudentConfigs((prev) => {
      const cfg = prev[studentId];
      if (!cfg) return prev;
      const selected = cfg.selectedRowIds || [];
      const editable = cfg.editableRowIds || [];

      // If rows are selected, toggle edit mode for them. Otherwise, toggle edit mode for ALL rows.
      const targetIds = selected.length > 0 ? selected : cfg.items.map((it) => it.id);
      const allCurrentlyEditable = targetIds.every((id) => editable.includes(id));

      let newEditable: string[];
      if (allCurrentlyEditable) {
        newEditable = editable.filter((id) => !targetIds.includes(id));
      } else {
        newEditable = Array.from(new Set([...editable, ...targetIds]));
      }

      return {
        ...prev,
        [studentId]: {
          ...cfg,
          editableRowIds: newEditable,
        },
      };
    });
  };

  // Delete selected rows for a specific student
  const handleDeleteSelectedRows = (studentId: string) => {
    setStudentConfigs((prev) => {
      const cfg = prev[studentId];
      if (!cfg) return prev;
      const selected = cfg.selectedRowIds || [];
      const newItems = cfg.items.filter((it) => !selected.includes(it.id));
      const netTotal = newItems.reduce((sum, it) => sum + it.amount, 0);
      const totalDueIncluded = cfg.includePreviousDue ? netTotal + cfg.previousDue : netTotal;

      return {
        ...prev,
        [studentId]: {
          ...cfg,
          items: newItems,
          selectedRowIds: [],
          editableRowIds: (cfg.editableRowIds || []).filter((id) => newItems.some((it) => it.id === id)),
          paidAmount: totalDueIncluded,
        },
      };
    });
  };

  // Update item field in student's config by itemId
  const handleUpdateStudentItem = (
    studentId: string,
    itemId: string,
    field: keyof BulkStudentFeeItem,
    value: any
  ) => {
    setStudentConfigs((prev) => {
      const cfg = prev[studentId];
      if (!cfg) return prev;

      const newItems = cfg.items.map((it) => {
        if (it.id !== itemId) return it;
        const item = { ...it };

        if (field === 'headId') {
          const hObj = feeHeads.find((h) => String(h.id) === String(value));
          item.headId = String(value);
          item.headName = hObj ? hObj.name : 'ফি';
        } else if (field === 'discount') {
          const disc = Math.max(0, Number(value) || 0);
          item.discount = disc;
          item.amount = Math.max(0, item.defaultRate - disc);
        } else if (field === 'amount') {
          const amt = Math.max(0, Number(value) || 0);
          item.amount = amt;
          if (item.defaultRate < amt) {
            item.defaultRate = amt;
            item.discount = 0;
          } else {
            item.discount = Math.max(0, item.defaultRate - amt);
          }
        } else if (field === 'defaultRate') {
          const rate = Math.max(0, Number(value) || 0);
          item.defaultRate = rate;
          item.amount = Math.max(0, rate - item.discount);
        } else {
          (item as any)[field] = value;
        }

        return item;
      });

      const netTotal = newItems.reduce((sum, it) => sum + it.amount, 0);
      const totalDueIncluded = cfg.includePreviousDue ? netTotal + cfg.previousDue : netTotal;

      return {
        ...prev,
        [studentId]: {
          ...cfg,
          items: newItems,
          paidAmount: totalDueIncluded,
        },
      };
    });
  };

  // Add new fee head row to a specific student
  const handleAddHeadToStudent = (studentId: string) => {
    setStudentConfigs((prev) => {
      const cfg = prev[studentId];
      if (!cfg) return prev;

      const firstHead = feeHeads[0] || { id: '13', name: 'অন্যান্য' };
      const newId = Math.random().toString(36).substring(2, 9);
      const newItem: BulkStudentFeeItem = {
        id: newId,
        headId: String(firstHead.id),
        headName: firstHead.name,
        month: globalMonth,
        defaultRate: 500,
        assignedRate: 500,
        discount: 0,
        amount: 500,
      };

      const newItems = [...cfg.items, newItem];
      const netTotal = newItems.reduce((sum, it) => sum + it.amount, 0);
      const totalDueIncluded = cfg.includePreviousDue ? netTotal + cfg.previousDue : netTotal;

      return {
        ...prev,
        [studentId]: {
          ...cfg,
          items: newItems,
          editableRowIds: [...(cfg.editableRowIds || []), newId],
          paidAmount: totalDueIncluded,
        },
      };
    });
  };

  // Remove fee item from a specific student by itemId
  const handleRemoveHeadFromStudent = (studentId: string, itemId: string) => {
    setStudentConfigs((prev) => {
      const cfg = prev[studentId];
      if (!cfg) return prev;

      const newItems = cfg.items.filter((it) => it.id !== itemId);
      const netTotal = newItems.reduce((sum, it) => sum + it.amount, 0);
      const totalDueIncluded = cfg.includePreviousDue ? netTotal + cfg.previousDue : netTotal;

      return {
        ...prev,
        [studentId]: {
          ...cfg,
          items: newItems,
          selectedRowIds: (cfg.selectedRowIds || []).filter((id) => id !== itemId),
          editableRowIds: (cfg.editableRowIds || []).filter((id) => id !== itemId),
          paidAmount: totalDueIncluded,
        },
      };
    });
  };

  // Update paid amount or payment method for a specific student
  const handleUpdateStudentPayment = (
    studentId: string,
    updates: Partial<StudentBulkConfig>
  ) => {
    setStudentConfigs((prev) => {
      const cfg = prev[studentId];
      if (!cfg) return prev;
      return {
        ...prev,
        [studentId]: {
          ...cfg,
          ...updates,
        },
      };
    });
  };

  // Total summary of all selected students
  const bulkSummary = useMemo(() => {
    let totalGrossExpected = 0;
    let totalDiscount = 0;
    let totalNetBill = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalPreviousDueIncluded = 0;

    (Object.values(studentConfigs) as StudentBulkConfig[]).forEach((cfg) => {
      const studentSubtotal = cfg.items.reduce((sum, it) => sum + it.defaultRate, 0);
      const studentDisc = cfg.items.reduce((sum, it) => sum + it.discount, 0);
      const studentNetItems = cfg.items.reduce((sum, it) => sum + it.amount, 0);
      const studentPrevDue = cfg.includePreviousDue ? cfg.previousDue : 0;
      const studentTotalBill = studentNetItems + studentPrevDue;
      const studentPaid = cfg.paidAmount;
      const studentRemainingDue = Math.max(0, studentTotalBill - studentPaid);

      totalGrossExpected += studentSubtotal;
      totalDiscount += studentDisc;
      totalNetBill += studentTotalBill;
      totalPaid += studentPaid;
      totalDue += studentRemainingDue;
      totalPreviousDueIncluded += studentPrevDue;
    });

    return {
      studentCount: Object.keys(studentConfigs).length,
      totalGrossExpected,
      totalDiscount,
      totalNetBill,
      totalPaid,
      totalDue,
      totalPreviousDueIncluded,
    };
  }, [studentConfigs]);

  // Execute Batch Invoice Generation
  const handleCreateBulkInvoices = async () => {
    const configList: StudentBulkConfig[] = Object.values(studentConfigs);
    if (configList.length === 0) {
      toast.error('দয়া করে ফি সংগ্রহের জন্য কমপক্ষে একজন শিক্ষার্থী নির্বাচন করুন।');
      return;
    }

    // Verify all students have at least 1 fee item
    const emptyStudent = configList.find((c) => c.items.length === 0);
    if (emptyStudent) {
      toast.error(
        `শিক্ষার্থী "${emptyStudent.student['শিক্ষার্থীর নাম'] || emptyStudent.student.name}" এর জন্য কোনো ফি খাত যুক্ত করা হয়নি।`
      );
      return;
    }

    const confirmMsg = `আপনি কি নিশ্চিত যে নির্বাচিত ${enToBnNumber(
      configList.length
    )} জন শিক্ষার্থীর জন্য মোট ৳${enToBnNumber(
      bulkSummary.totalPaid
    )} টাকা আদায় করে একসাথে ইনভয়েস তৈরি করতে চান?`;

    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);
    const newInvoices: any[] = [];
    const currentYearStr = new Date().getFullYear().toString();
    const baseSeq = invoices.length + 1;

    try {
      configList.forEach((cfg, index) => {
        const student = cfg.student;
        const studentId = getStudentId(student);
        const studentName = student['শিক্ষার্থীর নাম'] || student.name || '';
        const studentRoll = student['রোল নম্বর'] || student.roll || '';
        const studentClass = student['জামাত/শ্রেণী'] || student.class || '';
        const studentBranch = student['শাখা'] || student.branch || 'ক';
        const studentFather = student['পিতার নাম'] || student.fatherName || '';
        const studentPhone = student['অভিভাবকের মোবাইল'] || student.mobile || student.phone || '';

        const subtotal = cfg.items.reduce((sum, it) => sum + it.defaultRate, 0);
        const discount = cfg.items.reduce((sum, it) => sum + it.discount, 0);
        const prevDue = cfg.includePreviousDue ? cfg.previousDue : 0;
        const netAmount = subtotal - discount + prevDue;
        const paidAmount = cfg.paidAmount;
        const dueAmount = Math.max(0, netAmount - paidAmount);

        let status: 'paid' | 'partial' | 'pending' = 'paid';
        if (paidAmount === 0) status = 'pending';
        else if (paidAmount < netAmount) status = 'partial';

        const formattedSeq = String(baseSeq + index).padStart(4, '0');
        const invoiceNo = `INV-${currentYearStr}-${formattedSeq}`;

        const invoiceRecord = {
          id: Math.random().toString(36).substring(2, 9) + index,
          invoiceNo,
          date: globalDate,
          studentId,
          studentName,
          studentRoll,
          studentClass,
          studentBranch,
          studentFather,
          studentPhone,
          studentSession: student['শিক্ষাবর্ষ'] || student.academicYear || globalYear,
          items: cfg.items.map((it) => ({
            headId: it.headId,
            headName: it.headName,
            month: it.month || globalMonth,
            defaultRate: it.defaultRate,
            assignedRate: it.assignedRate,
            discount: it.discount,
            amount: it.amount,
          })),
          subtotal,
          discount,
          previousDue: prevDue,
          netAmount,
          paidAmount,
          dueAmount,
          status,
          month: globalMonth,
          year: globalYear,
          comment: cfg.comment || 'একসাথে একাধিক ফি সংগ্রহ',
          paymentMethod: cfg.paymentMethod || globalPaymentMethod || 'নগদ',
        };

        newInvoices.push(invoiceRecord);
      });

      // Batch save all invoices into DataContext
      await updateData('invoices_batch', newInvoices);

      setCreatedInvoices(newInvoices);
      setShowSuccessModal(true);
      toast.success(
        `সফলভাবে ${enToBnNumber(newInvoices.length)}টি ইনভয়েস তৈরি ও সংরক্ষিত হয়েছে!`
      );
    } catch (err) {
      console.error('Failed to create bulk invoices:', err);
      toast.error('ইনভয়েস তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch Print Reference
  const printAllRef = useRef<HTMLDivElement>(null);

  const handlePrintAllReceipts = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* 1. Header & Selection Summary */}
      <div className="p-4 sm:p-6 bg-card border border-border-main rounded-[2rem] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-border-main/50 gap-3">
          <div>
            <h2 className="text-xl font-black text-text-main flex items-center gap-2">
              <Layers size={24} className="text-primary" /> একসাথে একাধিক ফি সংগ্রহ (বাল্ক ইনভয়েস)
            </h2>
            <p className="text-xs text-text-light mt-1">
              একসাথে একাধিক শিক্ষার্থী বা পুরো জামাতের ফি এক ক্লিকে সংগ্রহ করুন এবং প্রয়োজনে প্রতি শিক্ষার্থীর খাত কাস্টমাইজ করুন
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-2xl flex items-center gap-2">
              <Users size={18} />
              <span className="text-xs font-black">
                নির্বাচিত শিক্ষার্থী: {enToBnNumber(selectedStudentIds.length)} জন
              </span>
            </div>
            {selectedStudentIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStudentIds([])}
                className="px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X size={14} /> সিলেকশন ক্লিয়ার
              </button>
            )}
          </div>
        </div>

        {/* 2. Global Default Configuration Bar */}
        <div className="p-4 sm:p-5 bg-step-bg/80 border border-primary/20 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border-main/40 pb-3">
            <div className="flex items-center gap-2 text-primary font-black text-xs">
              <Sparkles size={16} />
              <span>সাধারণ ডিফল্ট সেটিংস (সকল নির্বাচিত শিক্ষার্থীর উপর স্বয়ংক্রিয়ভাবে প্রযোজ্য হবে)</span>
            </div>
            <button
              type="button"
              onClick={handleApplyGlobalDefaultsToAll}
              className="px-3 py-1.5 bg-primary text-white text-[11px] font-black rounded-xl hover:bg-primary/90 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={13} /> সকলের উপর রি-এপ্লাই করুন
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Month */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-light uppercase tracking-wider block">
                আদায়ের মাস
              </label>
              <select
                value={globalMonth}
                onChange={(e) => setGlobalMonth(e.target.value)}
                className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {BENGALI_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-light uppercase tracking-wider block">
                শিক্ষাবর্ষ / বছর
              </label>
              <select
                value={globalYear}
                onChange={(e) => setGlobalYear(e.target.value)}
                className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {YEARS_LIST.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-light uppercase tracking-wider block">
                পরিশোধ মাধ্যম
              </label>
              <select
                value={globalPaymentMethod}
                onChange={(e) => setGlobalPaymentMethod(e.target.value)}
                className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="নগদ">ক্যাশ / নগদ</option>
                <option value="বিকাশ">বিকাশ (bKash)</option>
                <option value="রকেট">রকেট (Rocket)</option>
                <option value="নগদ অনলাইন">নগদ (Nagad)</option>
                <option value="ব্যাংক">ব্যাংক ট্রান্সফার</option>
              </select>
            </div>

            {/* Fee Mode */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-light uppercase tracking-wider block">
                ফি নির্ধারণের ধরন
              </label>
              <div className="p-2.5 bg-card border border-primary/30 rounded-xl text-xs font-black text-primary flex items-center gap-2">
                <Sparkles size={14} className="text-primary shrink-0" />
                <span className="truncate">কাস্টম ইনভয়েস টেমপ্লেট (একক সংগ্রহ এর ইন্টারফেস)</span>
              </div>
            </div>
          </div>

          {/* Custom Invoice Template Block (একক সংগ্রহ এর হুবহু ইন্টারফেস) */}
          <div className="p-5 bg-card border border-border-main rounded-2xl space-y-5">
              {/* Master Toolbar & Actions (একক সংগ্রহ এর হুবহু ডিজাইন) */}
              <div className="bg-step-bg p-3.5 rounded-xl border border-border-main/70 flex flex-wrap items-center justify-between gap-3">
                {/* Left: Checkbox Select All & Selection Count */}
                <div className="flex items-center gap-2.5 select-none">
                  <button
                    type="button"
                    onClick={handleToggleSelectAllGlobalRows}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border-main text-xs font-bold text-text-main hover:bg-primary/5 transition-all cursor-pointer shadow-2xs"
                  >
                    <input 
                      type="checkbox" 
                      checked={globalItems.length > 0 && globalSelectedRowIds.length === globalItems.length}
                      onChange={handleToggleSelectAllGlobalRows}
                      className="rounded text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>সব নির্বাচন</span>
                  </button>
                  <span className="text-xs font-black text-text-light/60 bg-card px-3 py-1.5 rounded-lg border border-border-main/50">
                    {globalSelectedRowIds.length > 0 ? `${enToBnNumber(globalSelectedRowIds.length)}টি নির্বাচিত` : `${enToBnNumber(globalItems.length)}টি খাত`}
                  </span>
                </div>

                {/* Right: Master Buttons (Master Edit, Delete Selected, Add Row) */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleGlobalRowEditMode}
                    className={cn(
                      "px-3.5 py-1.5 font-black text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border",
                      globalEditableRowIds.length > 0
                        ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20"
                    )}
                    title={
                      globalSelectedRowIds.length > 0 
                        ? "সিলেক্ট করা খাতগুলি এডিট মোড অন/অফ করুন" 
                        : "সকল খাত একসাথে এডিট মোড অন/অফ করুন"
                    }
                  >
                    <Edit size={14} /> 
                    {globalSelectedRowIds.length > 0 
                      ? `মাস্টার এডিট (${enToBnNumber(globalSelectedRowIds.length)})` 
                      : globalEditableRowIds.length > 0 ? "এডিট লক করুন" : "মাস্টার এডিট মোড"
                    }
                  </button>

                  {globalSelectedRowIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteGlobalSelectedRows}
                      className="px-3.5 py-1.5 bg-rose-500/10 text-rose-600 border border-rose-500/20 font-black text-xs rounded-lg hover:bg-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="সিলেক্ট করা খাতগুলি তালিকা থেকে মুছে ফেলুন"
                    >
                      <Trash2 size={14} /> সিলেক্টেড মুছুন
                    </button>
                  )}

                  <button 
                    type="button"
                    onClick={handleAddHeadToGlobal}
                    className="px-3.5 py-1.5 bg-primary text-white font-black text-xs rounded-lg hover:scale-103 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus size={14} /> নতুন খাত যোগ
                  </button>
                </div>
              </div>

              {/* Items Table - Single Collection এর হুবহু রেসপন্সিভ লেআউট */}
              <div className="overflow-x-auto border border-border-main rounded-2xl shadow-2xs">
                <table className="w-full border-collapse text-left min-w-[780px]">
                  <thead>
                    <tr className="bg-primary text-white text-[11px] font-black uppercase tracking-wider border-b border-border-main select-none">
                      <th className="py-3 px-3 w-12 text-center">
                        <input 
                          type="checkbox" 
                          checked={globalItems.length > 0 && globalSelectedRowIds.length === globalItems.length}
                          onChange={handleToggleSelectAllGlobalRows}
                          className="rounded text-primary focus:ring-primary cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3 w-10 text-center">ক্রম</th>
                      <th className="py-3 px-3 min-w-[190px]">ফি-এর খাত ও বিবরণ</th>
                      <th className="py-3 px-3 w-32 whitespace-nowrap">পরিশোধের মাস</th>
                      <th className="py-3 px-3 w-28 text-right whitespace-nowrap">নির্ধারিত ফি</th>
                      <th className="py-3 px-3 w-24 text-right whitespace-nowrap">ছাড় (৳)</th>
                      <th className="py-3 px-3 w-32 text-right whitespace-nowrap">আদায়কৃত টাকা</th>
                      <th className="py-3 px-3 w-28 text-center whitespace-nowrap">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main/40 text-xs">
                    {globalItems.map((item, idx) => {
                      const isEditable = globalEditableRowIds.includes(item.id);
                      const isSelected = globalSelectedRowIds.includes(item.id);
                      
                      return (
                        <tr 
                          key={item.id}
                          className={cn(
                            "transition-colors hover:bg-primary/[0.02]",
                            isSelected ? "bg-primary/5" : "bg-card"
                          )}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleGlobalRowSelection(item.id)}
                              className="rounded text-primary focus:ring-primary cursor-pointer"
                            />
                          </td>

                          {/* Serial */}
                          <td className="py-3 px-3 text-center font-extrabold text-text-light/60">
                            {enToBnNumber(idx + 1)}
                          </td>

                          {/* Fee Head */}
                          <td className="py-3 px-3">
                            {isEditable ? (
                              <select
                                className="w-full p-2 bg-card border border-border-main focus:border-primary rounded-lg text-xs font-bold text-text-main cursor-pointer outline-none"
                                value={item.headId}
                                onChange={(e) => handleUpdateGlobalItem(item.id, 'headId', e.target.value)}
                              >
                                <option value="">খাত নির্বাচন করুন...</option>
                                {feeHeads.map(h => (
                                  <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex items-center gap-1.5 pl-1.5">
                                <Lock size={12} className="text-text-light/40 shrink-0" />
                                <span className="font-extrabold text-text-main">{item.headName}</span>
                              </div>
                            )}
                          </td>

                          {/* Payment Month */}
                          <td className="py-3 px-3">
                            {isEditable ? (
                              <select
                                className="w-full p-1.5 bg-card border border-border-main focus:border-primary rounded-lg text-xs font-bold text-text-main cursor-pointer outline-none"
                                value={item.month || globalMonth}
                                onChange={(e) => handleUpdateGlobalItem(item.id, 'month', e.target.value)}
                              >
                                {BENGALI_MONTHS.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="px-2.5 py-1 bg-step-bg border border-border-main/60 rounded-lg text-xs font-extrabold text-text-main inline-block whitespace-nowrap">
                                {item.month || globalMonth}
                              </span>
                            )}
                          </td>

                          {/* Default Rate */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {isEditable ? (
                              <input 
                                type="number"
                                className="w-24 p-1.5 text-right bg-card border border-border-main rounded-lg text-xs font-bold text-text-main"
                                value={item.defaultRate}
                                onChange={(e) => handleUpdateGlobalItem(item.id, 'defaultRate', e.target.value)}
                              />
                            ) : (
                              <span className="font-extrabold text-text-main pr-1.5">
                                ৳{enToBnNumber(item.defaultRate)}
                              </span>
                            )}
                          </td>

                          {/* Discount */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {isEditable ? (
                              <input 
                                type="number"
                                className="w-20 p-1.5 text-right bg-card border border-border-main focus:border-indigo-500 rounded-lg text-xs font-bold text-indigo-600"
                                value={item.discount}
                                onChange={(e) => handleUpdateGlobalItem(item.id, 'discount', e.target.value)}
                              />
                            ) : (
                              <span className="font-extrabold text-indigo-600 pr-1.5">
                                ৳{enToBnNumber(item.discount || 0)}
                              </span>
                            )}
                          </td>

                          {/* Net Amount / Paid Amount */}
                          <td className="py-3 px-3 text-right whitespace-nowrap font-black">
                            {isEditable ? (
                              <input 
                                type="number"
                                className="w-24 p-1.5 text-right bg-card border border-primary/40 focus:border-primary rounded-lg text-xs font-black text-primary"
                                value={item.amount}
                                onChange={(e) => handleUpdateGlobalItem(item.id, 'amount', e.target.value)}
                              />
                            ) : (
                              <span className="font-black text-primary pr-1.5">
                                ৳{enToBnNumber(item.amount)}
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const isCurrentlyEditable = globalEditableRowIds.includes(item.id);
                                  if (isCurrentlyEditable) {
                                    setGlobalEditableRowIds(prev => prev.filter(id => id !== item.id));
                                  } else {
                                    setGlobalEditableRowIds(prev => [...prev, item.id]);
                                  }
                                }}
                                className={cn(
                                  "p-1.5 rounded-lg border transition-all cursor-pointer",
                                  isEditable 
                                    ? "bg-amber-500 text-white border-amber-600 shadow-xs" 
                                    : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20"
                                )}
                                title={isEditable ? "এডিট লক করুন (Save)" : "এডিট খুলুন (Edit)"}
                              >
                                <Edit size={13} />
                              </button>

                              <button 
                                type="button"
                                onClick={() => handleRemoveHeadFromGlobal(item.id)}
                                className="p-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 transition-all cursor-pointer"
                                title="এই খাতটি মুছে ফেলুন"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {globalItems.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-xs font-black text-text-light/40 italic bg-step-bg/20">
                          কোনো খাত যুক্ত করা হয়নি। "নতুন খাত যোগ" বাটনে ক্লিক করুন।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Calculations & Payment Block (একক আদায়ের হুবহু ২-কলাম গ্রিড লেআউট) */}
              <div className="p-5 bg-card border border-border-main rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Accounts Summary (হিসাবের বিস্তারিত সারসংক্ষেপ) */}
                <div className="space-y-3.5 text-left">
                  <h5 className="text-xs font-black text-text-light/50 uppercase tracking-wider pb-1.5 border-b border-border-main/50">হিসাবের বিস্তারিত সারসংক্ষেপ</h5>
                  
                  <div className="flex justify-between items-center text-xs font-bold text-text-light">
                    <span>মোট পরিমাণ (Subtotal):</span>
                    <span className="font-extrabold text-text-main text-sm">৳{enToBnNumber(globalCalculations.subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-indigo-500">
                    <span>মোট ছাড় (Total Discount):</span>
                    <span className="font-extrabold text-sm">৳{enToBnNumber(globalCalculations.totalDiscount)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-text-main pt-1.5 border-t border-border-main/40">
                    <span>নেট বিল (Net Bill):</span>
                    <span className="font-extrabold text-primary text-sm">৳{enToBnNumber(globalCalculations.netBill)}</span>
                  </div>

                  {/* Previous Due Configuration note in Global Template */}
                  <div className="space-y-2 pt-1.5 border-t border-border-main/40">
                    <div className="flex justify-between items-center text-xs font-bold text-rose-500">
                      <span>পূর্ববর্তী বকেয়া (Previous Due):</span>
                      <span className="font-black text-[10px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded border border-rose-500/20 whitespace-nowrap">
                        শিক্ষার্থী-নির্দিষ্ট (Dynamic)
                      </span>
                    </div>

                    <label className="flex items-center gap-2 text-[11px] font-bold text-text-light cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={globalIncludePreviousDue}
                        onChange={(e) => setGlobalIncludePreviousDue(e.target.checked)}
                        className="rounded border-border-main text-primary focus:ring-primary/20 cursor-pointer"
                      />
                      <span>ইনভয়েসে শিক্ষার্থীর পূর্ববর্তী বকেয়া যোগ করুন (Include Previous Due)</span>
                    </label>
                  </div>

                  <div className="flex justify-between items-center text-sm font-black text-text-main pt-2.5 border-t border-border-main">
                    <span>মোট বিল (Total Bill):</span>
                    <span className="text-primary text-base">
                      ৳{enToBnNumber(globalCalculations.netBill)} {globalIncludePreviousDue && <span className="text-[10px] text-rose-500 font-extrabold ml-1">(+ শিক্ষার্থীর বকেয়া)</span>}
                    </span>
                  </div>
                </div>

                {/* Right Column: Payment Information Form & Inputs (পরিশোধের তথ্য) */}
                <div className="space-y-3.5 border-t md:border-t-0 md:border-l border-border-main/50 pt-4 md:pt-0 pl-0 md:pl-6 text-left">
                  <h5 className="text-xs font-black text-text-light/50 uppercase tracking-wider pb-1.5 border-b border-border-main/50">পরিশোধের তথ্য</h5>
                  
                  {/* 1. মোট পরিমাণ */}
                  <div className="flex justify-between items-center px-3.5 py-2 bg-step-bg rounded-xl border border-border-main/60 text-xs">
                    <span className="font-bold text-text-light/70">মোট পরিমাণ:</span>
                    <span className="font-extrabold text-text-main">৳{enToBnNumber(globalCalculations.subtotal)}</span>
                  </div>

                  {/* 2. ছাড় কোড (Discount Code) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-light/60 uppercase tracking-widest px-1">ছাড় কোড (Discount Code)</label>
                    <input 
                      type="text"
                      placeholder="ছাড় কোড বা কাস্টম ছাড় (যেমন: PROMO10, 50)..."
                      className="w-full px-3.5 py-2 bg-step-bg border border-border-main focus:border-indigo-500 rounded-xl text-xs font-black text-indigo-600 outline-none uppercase"
                      value={globalDiscountCode}
                      onChange={(e) => handleGlobalDiscountCodeChange(e.target.value)}
                    />
                    {globalPromoDiscount > 0 && (
                      <p className="text-[9px] font-bold text-emerald-600 block px-1">
                        ✓ ছাড় কোড প্রয়োগ করা হয়েছে: ৳{enToBnNumber(globalPromoDiscount)} ছাড়!
                      </p>
                    )}
                  </div>

                  {/* 3. ছাড় */}
                  <div className="flex justify-between items-center px-3.5 py-2 bg-indigo-500/5 rounded-xl border border-indigo-500/15 text-xs">
                    <span className="font-bold text-indigo-600">ছাড়:</span>
                    <span className="font-extrabold text-indigo-600">৳{enToBnNumber(globalCalculations.totalDiscount)}</span>
                  </div>

                  {/* 4. নেট বিল */}
                  <div className="flex justify-between items-center px-3.5 py-2 bg-primary/5 rounded-xl border border-primary/15 text-xs">
                    <span className="font-bold text-primary">নেট বিল:</span>
                    <span className="font-extrabold text-primary">৳{enToBnNumber(globalCalculations.netBill)}</span>
                  </div>

                  {/* 5. পূর্ববর্তী বকেয়া */}
                  <div className="flex justify-between items-center px-3.5 py-2 bg-rose-500/5 rounded-xl border border-rose-500/15 text-xs">
                    <span className="font-bold text-rose-600">পূর্ববর্তী বকেয়া:</span>
                    <span className="font-extrabold text-rose-500/80">শিক্ষার্থীর প্রোফাইল থেকে যোগ হবে</span>
                  </div>

                  {/* 6. মোট বিল */}
                  <div className="flex justify-between items-center px-3.5 py-2 bg-step-bg rounded-xl border border-border-main text-xs font-black">
                    <span className="text-text-main">মোট বিল:</span>
                    <span className="text-primary text-sm">৳{enToBnNumber(globalCalculations.netBill)}</span>
                  </div>

                  {/* 7. আদায়ের নিয়ম / পরিশোধের নিয়ম */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-light/60 uppercase tracking-widest px-1">আদায় / পরিশোধের নিয়ম</label>
                    <select
                      value={globalPaidAmountRule}
                      onChange={(e) => setGlobalPaidAmountRule(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-step-bg border border-border-main rounded-xl font-bold text-xs text-text-main outline-none cursor-pointer focus:border-primary"
                    >
                      <option value="full">সম্পূর্ণ পরিশোধিত (Fully Paid)</option>
                      <option value="partial">আংশিক বা নির্দিষ্ট পরিমাণ (Fixed Amount)</option>
                      <option value="zero">কোনো পেমেন্ট নেই / বকেয়া (Due Invoice)</option>
                    </select>

                    {globalPaidAmountRule === 'partial' && (
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-light/40">৳</span>
                        <input
                          type="number"
                          value={globalFixedPaidAmount}
                          onChange={(e) => setGlobalFixedPaidAmount(Math.max(0, Number(e.target.value) || 0))}
                          placeholder="আদায়কৃত টাকার পরিমাণ..."
                          className="w-full pl-8 pr-4 py-2.5 bg-step-bg border border-border-main focus:border-indigo-500 rounded-xl text-xs font-black text-indigo-600 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* 7.5. পেমেন্টের ধরন / মাধ্যম */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-light/60 uppercase tracking-widest px-1">
                      পেমেন্টের ধরন / মাধ্যম
                    </label>
                    <select
                      className="w-full px-3 py-2.5 bg-step-bg border border-border-main focus:border-primary rounded-xl font-bold text-xs text-text-main outline-none cursor-pointer"
                      value={globalPaymentMethod}
                      onChange={(e) => setGlobalPaymentMethod(e.target.value)}
                    >
                      <option value="ক্যাশ">💵 ক্যাশ (Cash)</option>
                      <option value="ব্যাংক">🏦 ব্যাংক ট্রান্সফার (Bank Transfer)</option>
                      <option value="বিকাশ">📱 বিকাশ (bKash)</option>
                      <option value="নগদ">📱 নগদ (Nagad)</option>
                      <option value="রকেট">📱 রকেট (Rocket)</option>
                      <option value="উপায়">📱 উপায় (Upay)</option>
                      <option value="চেক">📄 ব্যাংক চেক (Cheque)</option>
                    </select>
                  </div>

                  {/* 8. নেট বকেয়া স্ট্যাটাস কার্ড */}
                  <div className="flex justify-between items-center p-3 bg-card rounded-xl border border-border-main">
                    <div>
                      <span className="text-[9px] font-black uppercase text-text-light/50 block tracking-widest">বকেয়া অবস্থা:</span>
                      <p className="font-black text-xs text-text-main">
                        {globalPaidAmountRule === 'full' ? 'বকেয়া মুক্ত' : 'আংশিক/বকেয়া ইনভয়েস'}
                      </p>
                    </div>
                    <span className={cn(
                      "px-3 py-1 text-[9px] font-black uppercase rounded-full tracking-wider border",
                      globalPaidAmountRule === 'full' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}>
                      {globalPaidAmountRule === 'full' ? 'সম্পূর্ণ পরিশোধিত' : 'বকেয়া থাকবে'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comment text-area (মন্তব্য - অপショナル) */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-text-light/50 uppercase tracking-widest px-1">মন্তব্য (অপショナル)</label>
                <textarea
                  rows={2}
                  placeholder="হিসাবের সুবিধার্থে অতিরিক্ত মন্তব্য যোগ করুন..."
                  value={globalComment}
                  onChange={(e) => setGlobalComment(e.target.value)}
                  className="w-full p-4 bg-card border border-border-main rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
                />
              </div>
            </div>
        </div>

        {/* 3. Student Filter & Selection Tool */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-sm font-black text-text-main flex items-center gap-2">
              <Search size={16} className="text-primary" /> শিক্ষার্থী ফিল্টার ও নির্বাচন
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="px-3.5 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {filteredStudents.length > 0 &&
                filteredStudents.every((s) =>
                  selectedStudentIds.includes(getStudentId(s))
                ) ? (
                  <>
                    <CheckSquare size={15} /> ফিল্টারকৃত সকল আনসিলেক্ট করুন
                  </>
                ) : (
                  <>
                    <Square size={15} /> ফিল্টারকৃত সবাইকে নির্বাচন করুন ({enToBnNumber(filteredStudents.length)} জন)
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-step-bg/60 p-3.5 rounded-2xl border border-border-main/50">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light/40" size={16} />
              <input
                type="text"
                placeholder="নাম, আইডি বা মোবাইল..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border-main rounded-xl text-xs font-medium text-text-main outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <select
                value={filterJamat}
                onChange={(e) => setFilterJamat(e.target.value)}
                className="w-full p-2 bg-card border border-border-main rounded-xl text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="all">সকল জামাত/শ্রেণী</option>
                {JAMAT_LIST.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="w-full p-2 bg-card border border-border-main rounded-xl text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="all">সকল শাখা</option>
                <option value="ক">শাখা: ক</option>
                <option value="খ">শাখা: খ</option>
                <option value="গ">শাখা: গ</option>
              </select>
            </div>

            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-2 bg-card border border-border-main rounded-xl text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="all">সকল বিভাগ (আবাসিক/অনাবাসিক)</option>
                <option value="অনাবাসিক">অনাবাসিক</option>
                <option value="আবাসিক">আবাসিক</option>
                <option value="ডে-কেয়ার">ডে-কেয়ার</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Selected Students Profile Cards & Accordions List */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border-main/50 pb-2">
            <div>
              <h3 className="text-sm font-black text-text-main flex items-center gap-2">
                <Users size={17} className="text-primary" />
                নির্বাচিত শিক্ষার্থীদের তালিকা ({enToBnNumber(selectedStudentIds.length)} জন)
              </h3>
              <p className="text-[11px] text-text-light">
                যেকোনো শিক্ষার্থীর প্রোফাইলে ক্লিক করে তার নির্দিষ্ট খাত ও টাকার পরিমাণ কাস্টমাইজ করুন
              </p>
            </div>

            {selectedStudentIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExpandAllAccordions(true)}
                  className="px-2.5 py-1 text-[11px] font-bold text-text-light hover:text-text-main bg-step-bg rounded-lg transition-all"
                >
                  সবগুলো খুলুন
                </button>
                <button
                  type="button"
                  onClick={() => handleExpandAllAccordions(false)}
                  className="px-2.5 py-1 text-[11px] font-bold text-text-light hover:text-text-main bg-step-bg rounded-lg transition-all"
                >
                  সবগুলো বন্ধ করুন
                </button>
              </div>
            )}
          </div>

          {/* If No Student Selected Yet */}
          {selectedStudentIds.length === 0 && (
            <div className="p-10 border border-dashed border-border-main rounded-2xl text-center space-y-3 bg-step-bg/40">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <p className="text-sm font-black text-text-main">
                কোনো শিক্ষার্থী নির্বাচন করা হয়নি
              </p>
              <p className="text-xs text-text-light max-w-md mx-auto">
                উপরের ফিল্টার থেকে জামাত নির্বাচন করুন অথবা নিচের তালিকা থেকে শিক্ষার্থীদের নামের পাশে টিক চিহ্ন দিয়ে নির্বাচন করুন।
              </p>
            </div>
          )}

          {/* Render List of Selected Students as Profile Cards + Accordions */}
          <div className="space-y-3">
            {selectedStudentIds.map((sId) => {
              const cfg = studentConfigs[sId];
              if (!cfg) return null;
              const student = cfg.student;
              const sName = student['শিক্ষার্থীর নাম'] || student.name || 'নামহীন';
              const sRoll = student['রোল নম্বর'] || student.roll || '';
              const sClass = student['জামাত/শ্রেণী'] || student.class || '';
              const sBranch = student['শাখা'] || student.branch || 'ক';
              const sFather = student['পিতার নাম'] || student.fatherName || '—';
              const sMobile = student['অভিভাবকের মোবাইল'] || student.mobile || '';
              const { categoryLabel } = getStudentCategory(student);

              const studentGrossTotal = cfg.items.reduce((sum, it) => sum + it.defaultRate, 0);
              const studentDiscTotal = cfg.items.reduce((sum, it) => sum + it.discount, 0);
              const studentNetTotal = cfg.items.reduce((sum, it) => sum + it.amount, 0);
              const totalPayable = cfg.includePreviousDue ? studentNetTotal + cfg.previousDue : studentNetTotal;

              return (
                <div
                  key={sId}
                  className={cn(
                    'border rounded-2xl transition-all overflow-hidden bg-card shadow-2xs',
                    cfg.isExpanded
                      ? 'border-primary/50 shadow-md ring-2 ring-primary/10'
                      : 'border-border-main hover:border-primary/30'
                  )}
                >
                  {/* Card Header Summary (Always Visible Profile Card) */}
                  <div
                    onClick={() => handleToggleExpandStudent(sId)}
                    className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer select-none hover:bg-primary/[0.02] transition-colors"
                  >
                    {/* Left: Avatar & Identity */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-base shrink-0 overflow-hidden">
                        {student.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            alt={sName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span>{sName[0] || 'S'}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-sm text-text-main">{sName}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                            {sClass} (রোল: {enToBnNumber(sRoll)})
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-step-bg text-text-light border border-border-main">
                            {categoryLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-light font-bold flex items-center gap-2 mt-0.5">
                          <span>আইডি: #{enToBnNumber(String(sId).slice(-6))}</span>
                          <span>•</span>
                          <span>পিতা: {sFather}</span>
                          {sMobile && (
                            <>
                              <span>•</span>
                              <span>মোবাইল: {sMobile}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Right: Bill Badge, Previous Due & Expand Trigger */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {cfg.previousDue > 0 && (
                        <div className="text-right hidden md:block">
                          <span className="text-[10px] text-amber-600 font-bold block">
                            পূর্বের বকেয়া: ৳{enToBnNumber(cfg.previousDue)}
                          </span>
                        </div>
                      )}

                      <div className="text-right bg-step-bg px-3.5 py-1.5 rounded-xl border border-border-main/70">
                        <span className="text-[10px] font-black text-text-light uppercase tracking-wider block">
                          আদায়যোগ্য মোট
                        </span>
                        <span className="font-black text-sm text-primary">
                          ৳{enToBnNumber(cfg.paidAmount)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStudent(sId);
                        }}
                        className="p-2 text-text-light/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                        title="বাদ দিন"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="p-1.5 bg-card border border-border-main rounded-lg text-text-light">
                        {cfg.isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Accordion Drawer (Expanded customization panel for this student) */}
                  {cfg.isExpanded && (
                    <div className="p-4 sm:p-5 bg-step-bg/60 border-t border-border-main/70 space-y-4 animate-fade-in">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span className="text-xs font-black text-text-main flex items-center gap-2">
                          <Receipt size={15} className="text-primary" /> এই শিক্ষার্থীর ফি খাত সমূহ কাস্টমাইজ করুন
                        </span>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Row level edit/lock toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleRowEditMode(sId)}
                            className="px-2.5 py-1.5 text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500 hover:text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            title="সম্পাদনা মোড সক্রিয় / নিষ্ক্রিয় করুন"
                          >
                            <Edit size={13} />
                            <span>সম্পাদনা/লক</span>
                          </button>

                          {/* Row level delete selected */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSelectedRows(sId)}
                            disabled={!cfg.selectedRowIds || cfg.selectedRowIds.length === 0}
                            className="px-2.5 py-1.5 text-[11px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            title="নির্বাচিত খাতগুলো মুছে ফেলুন"
                          >
                            <Trash2 size={13} />
                            <span>নির্বাচিত মুছুন</span>
                          </button>

                          {/* Add manual head */}
                          <button
                            type="button"
                            onClick={() => handleAddHeadToStudent(sId)}
                            className="px-2.5 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Plus size={13} />
                            <span>খাত যুক্ত করুন</span>
                          </button>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="overflow-x-auto border border-border-main rounded-xl bg-card shadow-2xs">
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr className="bg-primary text-white text-left font-black text-[11px]">
                              {/* Checkbox Header */}
                              <th className="py-2.5 px-3 w-10 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelectAllRows(sId)}
                                  className="text-white hover:opacity-80 transition-opacity"
                                >
                                  {cfg.items.length > 0 && (cfg.selectedRowIds || []).length === cfg.items.length ? (
                                    <CheckSquare size={15} />
                                  ) : (
                                    <Square size={15} />
                                  )}
                                </button>
                              </th>
                              <th className="py-2.5 px-3">ফি-এর খাত</th>
                              <th className="py-2.5 px-3">মাস</th>
                              <th className="py-2.5 px-3 text-right">ধার্য ফি (৳)</th>
                              <th className="py-2.5 px-3 text-right">ছাড় (৳)</th>
                              <th className="py-2.5 px-3 text-right">আদায়যোগ্য (৳)</th>
                              <th className="py-2.5 px-3 text-center w-12">মুছুন</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-main/40">
                            {cfg.items.map((item, idx) => {
                              const isSelected = (cfg.selectedRowIds || []).includes(item.id);
                              const isEditable = (cfg.editableRowIds || []).includes(item.id);

                              return (
                                <tr key={item.id} className={cn("hover:bg-primary/[0.02]", isSelected && "bg-primary/[0.03]")}>
                                  {/* Checkbox */}
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleRowSelection(sId, item.id)}
                                      className="text-text-light hover:text-primary transition-colors"
                                    >
                                      {isSelected ? (
                                        <CheckSquare size={15} className="text-primary" />
                                      ) : (
                                        <Square size={15} />
                                      )}
                                    </button>
                                  </td>

                                  {/* Fee Head */}
                                  <td className="py-2 px-3">
                                    {isEditable ? (
                                      <select
                                        value={item.headId}
                                        onChange={(e) =>
                                          handleUpdateStudentItem(sId, item.id, 'headId', e.target.value)
                                        }
                                        className="w-full p-1.5 bg-step-bg border border-border-main rounded-lg text-xs font-bold text-text-main cursor-pointer"
                                      >
                                        {feeHeads.map((h) => (
                                          <option key={h.id} value={h.id}>
                                            {h.name}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span className="font-bold text-text-main pl-1.5 flex items-center gap-1.5">
                                        <Lock size={12} className="text-text-light shrink-0" />
                                        {item.headName}
                                      </span>
                                    )}
                                  </td>

                                  {/* Month */}
                                  <td className="py-2 px-3">
                                    {isEditable ? (
                                      <select
                                        value={item.month}
                                        onChange={(e) =>
                                          handleUpdateStudentItem(sId, item.id, 'month', e.target.value)
                                        }
                                        className="p-1.5 bg-step-bg border border-border-main rounded-lg text-xs font-bold text-text-main cursor-pointer"
                                      >
                                        {BENGALI_MONTHS.map((m) => (
                                          <option key={m} value={m}>
                                            {m}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span className="text-text-light font-bold pl-1.5">{item.month}</span>
                                    )}
                                  </td>

                                  {/* Rate */}
                                  <td className="py-2 px-3 text-right">
                                    {isEditable ? (
                                      <input
                                        type="number"
                                        value={item.defaultRate}
                                        onChange={(e) =>
                                          handleUpdateStudentItem(
                                            sId,
                                            item.id,
                                            'defaultRate',
                                            e.target.value
                                          )
                                        }
                                        className="w-24 p-1.5 text-right bg-step-bg border border-border-main rounded-lg text-xs font-bold text-text-main"
                                      />
                                    ) : (
                                      <span className="font-bold text-text-light pr-1.5">৳{enToBnNumber(item.defaultRate)}</span>
                                    )}
                                  </td>

                                  {/* Discount */}
                                  <td className="py-2 px-3 text-right">
                                    {isEditable ? (
                                      <input
                                        type="number"
                                        value={item.discount}
                                        onChange={(e) =>
                                          handleUpdateStudentItem(sId, item.id, 'discount', e.target.value)
                                        }
                                        className="w-20 p-1.5 text-right bg-step-bg border border-border-main rounded-lg text-xs font-bold text-amber-600"
                                      />
                                    ) : (
                                      <span className="font-bold text-amber-600 pr-1.5">
                                        {item.discount > 0 ? `৳${enToBnNumber(item.discount)}` : '—'}
                                      </span>
                                    )}
                                  </td>

                                  {/* Payable Net */}
                                  <td className="py-2 px-3 text-right">
                                    {isEditable ? (
                                      <input
                                        type="number"
                                        value={item.amount}
                                        onChange={(e) =>
                                          handleUpdateStudentItem(sId, item.id, 'amount', e.target.value)
                                        }
                                        className="w-24 p-1.5 text-right bg-card border border-primary/40 rounded-lg text-xs font-black text-primary"
                                      />
                                    ) : (
                                      <span className="font-black text-primary pr-1.5">৳{enToBnNumber(item.amount)}</span>
                                    )}
                                  </td>

                                  {/* Delete */}
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveHeadFromStudent(sId, item.id)}
                                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Account Summary & Payment details layout (একক সংগ্রহ এর হুবহু ইন্টারফেস) */}
                      {(() => {
                        const studentSubtotal = cfg.items.reduce((sum, it) => sum + it.defaultRate, 0);
                        const studentDiscount = cfg.items.reduce((sum, it) => sum + (it.discount || 0), 0);
                        const studentNetBill = Math.max(0, studentSubtotal - studentDiscount);
                        const studentTotalPayable = studentNetBill + (cfg.includePreviousDue ? cfg.previousDue : 0);
                        const studentDueAmount = Math.max(0, studentTotalPayable - cfg.paidAmount);

                        return (
                          <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Left Column: Account Summary (হিসাবের বিস্তারিত সারসংক্ষেপ) */}
                              <div className="p-4 bg-step-bg/40 border border-border-main rounded-2xl space-y-2.5 text-left">
                                <h5 className="text-[10px] font-black text-text-light/50 uppercase tracking-wider pb-1 border-b border-border-main/50">
                                  হিসাবের বিস্তারিত সারসংক্ষেপ
                                </h5>

                                <div className="flex justify-between items-center text-xs font-bold text-text-light">
                                  <span>মোট পরিমাণ (Subtotal):</span>
                                  <span className="font-extrabold text-text-main">৳{enToBnNumber(studentSubtotal)}</span>
                                </div>

                                <div className="flex justify-between items-center text-xs font-bold text-indigo-500">
                                  <span>মোট ছাড় (Total Discount):</span>
                                  <span>৳{enToBnNumber(studentDiscount)}</span>
                                </div>

                                <div className="flex justify-between items-center text-xs font-bold text-text-main pt-1 border-t border-border-main/40">
                                  <span>নেট বিল (Net Bill):</span>
                                  <span className="font-extrabold text-primary">৳{enToBnNumber(studentNetBill)}</span>
                                </div>

                                {/* Previous Due checkbox and value */}
                                <div className="space-y-1.5 pt-1 border-t border-border-main/40">
                                  <div className="flex justify-between items-center text-xs font-bold text-rose-500">
                                    <span>পূর্ববর্তী বকেয়া (Previous Due):</span>
                                    <span className="font-extrabold">৳{enToBnNumber(cfg.previousDue)}</span>
                                  </div>

                                  {cfg.previousDue > 0 && (
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-text-light cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={cfg.includePreviousDue}
                                        onChange={(e) => {
                                          const inc = e.target.checked;
                                          const updatedTotalPayable = studentNetBill + (inc ? cfg.previousDue : 0);
                                          handleUpdateStudentPayment(sId, {
                                            includePreviousDue: inc,
                                            paidAmount: updatedTotalPayable,
                                          });
                                        }}
                                        className="rounded border-border-main text-primary focus:ring-primary/20 cursor-pointer"
                                      />
                                      <span>ইনভয়েসে পূর্ববর্তী বকেয়া যুক্ত করুন</span>
                                    </label>
                                  )}
                                </div>

                                <div className="flex justify-between items-center text-xs font-black text-text-main pt-1.5 border-t border-border-main">
                                  <span>সর্বমোট বিল (Total Bill):</span>
                                  <span className="text-primary font-extrabold">৳{enToBnNumber(studentTotalPayable)}</span>
                                </div>
                              </div>

                              {/* Right Column: Payment Details (পরিশোধের তথ্য) */}
                              <div className="p-4 bg-step-bg/40 border border-border-main md:border-l rounded-2xl space-y-3 text-left">
                                <h5 className="text-[10px] font-black text-text-light/50 uppercase tracking-wider pb-1 border-b border-border-main/50">
                                  পরিশোধের তথ্য
                                </h5>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Paid Amount */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <label className="text-[10px] font-black text-text-light uppercase tracking-wider">
                                        আদায়কৃত টাকা (৳)
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateStudentPayment(sId, {
                                            paidAmount: studentTotalPayable,
                                          })
                                        }
                                        className="text-[9px] font-bold text-primary hover:underline cursor-pointer"
                                      >
                                        পূর্ণ পরিশোধ
                                      </button>
                                    </div>
                                    <input
                                      type="number"
                                      value={cfg.paidAmount}
                                      onChange={(e) => {
                                        const val = Math.max(0, Number(e.target.value) || 0);
                                        handleUpdateStudentPayment(sId, {
                                          paidAmount: val,
                                        });
                                      }}
                                      className="w-full p-2 bg-card border border-primary/40 rounded-xl text-xs font-black text-primary outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                  </div>

                                  {/* Payment Method */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-text-light uppercase tracking-wider block">
                                      পেমেন্ট মাধ্যম
                                    </label>
                                    <select
                                      value={cfg.paymentMethod}
                                      onChange={(e) =>
                                        handleUpdateStudentPayment(sId, {
                                          paymentMethod: e.target.value,
                                        })
                                      }
                                      className="w-full p-2 bg-card border border-border-main rounded-xl text-xs font-bold text-text-main cursor-pointer"
                                    >
                                      <option value="নগদ">ক্যাশ / নগদ</option>
                                      <option value="বিকার">বিকাশ (bKash)</option>
                                      <option value="রকেট">রকেট (Rocket)</option>
                                      <option value="নগদ অনলাইন">নগদ (Nagad)</option>
                                      <option value="ব্যাংক">ব্যাংক ট্রান্সফার</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center text-xs font-bold pt-1.5 border-t border-border-main/40">
                                  <span className="text-text-light">বকেয়ার পরিমাণ (Due):</span>
                                  <span className={cn("font-extrabold text-sm", studentDueAmount > 0 ? "text-rose-500" : "text-emerald-600")}>
                                    ৳{enToBnNumber(studentDueAmount)}
                                  </span>
                                </div>

                                {/* Per-student Comments */}
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-text-light/70 uppercase tracking-wider block">
                                    অতিরিক্ত মন্তব্য / নোট
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="মন্তব্য লিখুন..."
                                    value={cfg.comment || ''}
                                    onChange={(e) =>
                                      handleUpdateStudentPayment(sId, {
                                        comment: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 bg-card border border-border-main rounded-xl text-xs font-medium text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Additional Students Quick Picker Grid */}
        <div className="space-y-3 pt-4 border-t border-border-main/50">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-text-light uppercase tracking-wider">
              শিক্ষার্থী তালিকা থেকে নির্বাচন করুন ({enToBnNumber(filteredStudents.length)} জন পাওয়া গেছে)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto p-1">
            {filteredStudents.map((s) => {
              const sId = String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || '');
              const isSelected = selectedStudentIds.includes(sId);
              const sName = s['শিক্ষার্থীর নাম'] || s.name || 'নামহীন';
              const sClass = s['জামাত/শ্রেণী'] || s.class || '';
              const sRoll = s['রোল নম্বর'] || s.roll || '';
              const { categoryLabel } = getStudentCategory(s);

              return (
                <div
                  key={sId}
                  onClick={() => handleToggleStudent(sId)}
                  className={cn(
                    'p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all select-none',
                    isSelected
                      ? 'bg-primary/10 border-primary text-text-main shadow-2xs font-bold'
                      : 'bg-card border-border-main hover:border-primary/40 text-text-main'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={cn(
                        'w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all',
                        isSelected
                          ? 'bg-primary text-white border-primary'
                          : 'border-border-main bg-step-bg'
                      )}
                    >
                      {isSelected && <CheckSquare size={14} />}
                    </div>
                    <div className="truncate text-left">
                      <p className="font-bold text-xs truncate">{sName}</p>
                      <p className="text-[10px] text-text-light">
                        {sClass} | রোল: {enToBnNumber(sRoll)} | {categoryLabel}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] text-text-light shrink-0">
                    #{enToBnNumber(sId.slice(-4))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Sticky Floating Summary Bar & Bulk Submit Action */}
      <div className="p-4 sm:p-5 bg-card border-2 border-primary/30 rounded-[2rem] shadow-lg sticky bottom-4 z-20 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div>
            <span className="text-[10px] font-black text-text-light uppercase tracking-wider block">
              মোট শিক্ষার্থী
            </span>
            <span className="text-base font-black text-text-main">
              {enToBnNumber(bulkSummary.studentCount)} জন
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black text-text-light uppercase tracking-wider block">
              মোট ধার্য ফি
            </span>
            <span className="text-base font-black text-text-main">
              ৳{enToBnNumber(bulkSummary.totalGrossExpected)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black text-text-light uppercase tracking-wider block">
              মোট ছাড়
            </span>
            <span className="text-base font-black text-amber-600">
              ৳{enToBnNumber(bulkSummary.totalDiscount)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black text-text-light uppercase tracking-wider block">
              সর্বমোট আদায়কৃত টাকা
            </span>
            <span className="text-lg font-black text-emerald-600">
              ৳{enToBnNumber(bulkSummary.totalPaid)}
            </span>
          </div>

          {bulkSummary.totalDue > 0 && (
            <div>
              <span className="text-[10px] font-black text-text-light uppercase tracking-wider block">
                অবশিষ্ট বকেয়া
              </span>
              <span className="text-base font-black text-red-500">
                ৳{enToBnNumber(bulkSummary.totalDue)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            disabled={bulkSummary.studentCount === 0 || isSubmitting}
            onClick={handleCreateBulkInvoices}
            className={cn(
              'w-full md:w-auto px-6 py-3.5 rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer',
              bulkSummary.studentCount > 0 && !isSubmitting
                ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                : 'bg-border-main text-text-light/50 cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <>
                <Clock className="animate-spin" size={18} />
                ইনভয়েস তৈরি হচ্ছে...
              </>
            ) : (
              <>
                <Receipt size={18} />
                একসাথে {enToBnNumber(bulkSummary.studentCount)} টি ইনভয়েস তৈরি ও সংগ্রহ করুন
              </>
            )}
          </button>
        </div>
      </div>

      {/* 7. Success Modal & Batch Print Actions */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border-main rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-6 text-left animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-main pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-main">
                    ইনভয়েস সমূহ সফলভাবে তৈরি হয়েছে!
                  </h3>
                  <p className="text-xs text-text-light">
                    মোট {enToBnNumber(createdInvoices.length)} জন শিক্ষার্থীর ফি ইনভয়েস ডাটাবেসে সংরক্ষিত হয়েছে
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setSelectedStudentIds([]);
                  if (onFinish) onFinish();
                }}
                className="p-2 text-text-light hover:text-text-main rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            {/* Invoices List */}
            <div className="space-y-2 max-h-60 overflow-y-auto border border-border-main rounded-xl p-3 bg-step-bg">
              {createdInvoices.map((inv, i) => (
                <div
                  key={inv.id || i}
                  className="flex items-center justify-between p-2.5 bg-card rounded-lg border border-border-main text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-primary mr-2">
                      {inv.invoiceNo}
                    </span>
                    <span className="font-bold text-text-main">{inv.studentName}</span>
                    <span className="text-text-light ml-2">({inv.studentClass})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-emerald-600">
                      ৳{enToBnNumber(inv.paidAmount)}
                    </span>
                    {onViewInvoice && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowSuccessModal(false);
                          onViewInvoice(inv);
                        }}
                        className="px-2.5 py-1 bg-primary/10 text-primary font-bold text-[11px] rounded-lg hover:bg-primary hover:text-white transition-all"
                      >
                        রসিদ দেখুন
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Printer size={16} />
                একসাথে সকল রসিদ প্রিন্ট করুন
              </button>

              {onNavigateToInvoices && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    setSelectedStudentIds([]);
                    onNavigateToInvoices();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  ইনভয়েস তালিকায় যান
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setSelectedStudentIds([]);
                  if (onFinish) onFinish();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-step-bg hover:bg-card border border-border-main text-text-main rounded-xl text-xs font-bold transition-all"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Container for Batch Printable Receipts */}
      <div id="batch-printable-invoices" className="hidden print:block font-[Kalpurush,inherit]">
        {createdInvoices.map((inv, idx) => (
          <div
            key={inv.id || idx}
            className="p-6 bg-white border border-gray-300 rounded-lg mb-8 page-break-after-always text-black"
          >
            <div className="text-center pb-4 border-b border-gray-400">
              <h2 className="text-xl font-bold text-gray-900">
                {madrasahBranding?.madrasahName || 'জামিয়া ইসলামিয়া দারুল উলূম মাদরাসা'}
              </h2>
              <p className="text-xs text-gray-600">{madrasahBranding?.address || 'ঢাকা, বাংলাদেশ'}</p>
              <p className="text-xs text-gray-600 font-bold mt-1">ফি আদায় মানি রসিদ (অফিসিয়াল কপি)</p>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4 text-xs">
              <div>
                <p><strong>ইনভয়েস নং:</strong> {inv.invoiceNo}</p>
                <p><strong>শিক্ষার্থীর নাম:</strong> {inv.studentName}</p>
                <p><strong>আইডি:</strong> {inv.studentId}</p>
                <p><strong>জামাত:</strong> {inv.studentClass} ({inv.studentBranch})</p>
              </div>
              <div className="text-right">
                <p><strong>তারিখ:</strong> {inv.date}</p>
                <p><strong>মাস:</strong> {inv.month} {inv.year}</p>
                <p><strong>পেমেন্ট মাধ্যম:</strong> {inv.paymentMethod}</p>
              </div>
            </div>

            <table className="w-full border-collapse border border-gray-400 text-xs my-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">খাত</th>
                  <th className="border border-gray-400 p-2 text-center">মাস</th>
                  <th className="border border-gray-400 p-2 text-right">ধার্য ফি</th>
                  <th className="border border-gray-400 p-2 text-right">ছাড়</th>
                  <th className="border border-gray-400 p-2 text-right">আদায়কৃত</th>
                </tr>
              </thead>
              <tbody>
                {inv.items?.map((it: any, itIdx: number) => (
                  <tr key={itIdx}>
                    <td className="border border-gray-400 p-2">{it.headName}</td>
                    <td className="border border-gray-400 p-2 text-center">{it.month || inv.month}</td>
                    <td className="border border-gray-400 p-2 text-right">৳{enToBnNumber(it.defaultRate || it.amount)}</td>
                    <td className="border border-gray-400 p-2 text-right">৳{enToBnNumber(it.discount || 0)}</td>
                    <td className="border border-gray-400 p-2 text-right">৳{enToBnNumber(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-gray-50">
                  <td colSpan={4} className="border border-gray-400 p-2 text-right">সর্বমোট আদায়:</td>
                  <td className="border border-gray-400 p-2 text-right">৳{enToBnNumber(inv.paidAmount)}</td>
                </tr>
                {inv.dueAmount > 0 && (
                  <tr className="font-bold text-red-600">
                    <td colSpan={4} className="border border-gray-400 p-2 text-right">অবশিষ্ট বকেয়া:</td>
                    <td className="border border-gray-400 p-2 text-right">৳{enToBnNumber(inv.dueAmount)}</td>
                  </tr>
                )}
              </tfoot>
            </table>

            <div className="pt-8 flex justify-between text-xs text-gray-700">
              <span className="border-t border-gray-400 pt-1">হিসাবরক্ষক / আদায়কারী</span>
              <span className="border-t border-gray-400 pt-1">অধ্যক্ষ / মুহতামিম</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
