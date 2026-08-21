import { Student } from '../types';
import { enToBnNumber, bnToEnNumber } from '../lib/utils';

export const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export const YEARS_LIST = ['২০২৬', '২০২৫', '২০২৪', '২০২৭'];

export interface StudentBillingStartInfo {
  startMonth: string;
  startMonthIndex: number; // 0-11
  startYear: string;       // e.g. '২০২৬' or '2026'
  startYearNum: number;    // e.g. 2026
  isCustom: boolean;
  sourceText: string;
}

export interface ExpectedFeeItem {
  headId: string;
  headName: string;
  defaultRate: number;
  assignedRate: number;
  discount: number;
  netPayable: number;
  frequency: 'monthly_mandatory' | 'monthly_optional' | 'yearly' | 'one_time' | 'occasional';
  applicableTo: 'all' | 'residential' | 'non_residential' | 'day_care';
  dueDay: number;
}

export interface StudentMonthLedgerRecord {
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentClass: string;
  studentBranch: string;
  studentFather: string;
  studentPhone: string;
  category: 'residential' | 'non_residential' | 'day_care';
  categoryLabel: string;
  billingStartInfo: StudentBillingStartInfo;
  isEligibleForMonth: boolean;
  expectedItems: ExpectedFeeItem[];
  totalExpected: number;
  totalDiscount: number;
  netPayable: number;
  totalPaid: number;
  dueAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid' | 'exempt';
  isOverdue: boolean; // if past due date (e.g. 12th of month) and has due
  paidInvoices: any[];
  paidHeadBreakdown: Record<string, number>; // headId -> amount paid
  latestPaymentDate?: string;
  latestPaymentMethod?: string;
  latestInvoiceNo?: string;
}

export interface FeeHeadMonthSummary {
  headId: string;
  headName: string;
  frequency: string;
  applicableTo: string;
  totalExpected: number;
  totalCollected: number;
  totalDue: number;
  paidStudentsCount: number;
  unpaidStudentsCount: number;
  collectionRate: number; // 0-100%
}

export interface MonthLedgerSummary {
  month: string;
  year: string;
  totalStudentsCount: number;
  eligibleStudentsCount: number;
  totalExpectedAmount: number;
  totalCollectedAmount: number;
  totalDueAmount: number;
  totalDiscountAmount: number;
  fullyPaidCount: number;
  partiallyPaidCount: number;
  unpaidCount: number;
  exemptCount: number;
  overdueCount: number;
  overallCollectionRate: number; // 0-100%
  records: StudentMonthLedgerRecord[];
  headSummaries: FeeHeadMonthSummary[];
}

/**
 * Normalizes year string to 4-digit English number
 */
export function normalizeYearToNumber(yearStr?: string | number | null): number {
  if (!yearStr) return 2026;
  const enDigits = bnToEnNumber(String(yearStr)).trim();
  const match = enDigits.match(/\d{4}/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return 2026;
}

/**
 * Returns Bengali month index from name or date string
 */
export function getBengaliMonthIndex(monthName?: string): number {
  if (!monthName) return 0;
  const trimmed = monthName.trim();
  const idx = BENGALI_MONTHS.indexOf(trimmed);
  if (idx !== -1) return idx;

  // Search partial matches
  for (let i = 0; i < BENGALI_MONTHS.length; i++) {
    if (trimmed.includes(BENGALI_MONTHS[i]) || BENGALI_MONTHS[i].includes(trimmed)) {
      return i;
    }
  }
  return 0;
}

/**
 * Extracts and determines a student's billing start month & year.
 * Priority 1: Custom override in student record / studentOverrides
 * Priority 2: Student's Admission Date / Entry Date
 * Priority 3: Fallback to session start (January 2026)
 */
export function getStudentBillingStartInfo(
  student: Student,
  studentOverrides?: Record<string, any>,
  invoices?: any[]
): StudentBillingStartInfo {
  const studentId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim();
  const override = studentOverrides && studentId ? studentOverrides[studentId] : null;

  // 1. Check custom admin override first (Priority #1)
  const customMonth = override?.feeStartMonth || student.feeStartMonth || student['বেতন_শুরুর_মাস'];
  const customYear = override?.feeStartYear || student.feeStartYear || student['বেতন_শুরুর_বছর'];

  if (customMonth) {
    const mIdx = getBengaliMonthIndex(customMonth);
    const yNum = normalizeYearToNumber(customYear || '২০২৬');
    return {
      startMonth: BENGALI_MONTHS[mIdx],
      startMonthIndex: mIdx,
      startYear: enToBnNumber(yNum),
      startYearNum: yNum,
      isCustom: true,
      sourceText: `অ্যাডমিন নির্ধারিত (${BENGALI_MONTHS[mIdx]} ${enToBnNumber(yNum)})`,
    };
  }

  // 2. Check Student Admission Invoices (ভর্তি ইনভয়েসের উপর ভর্তির মাস অনুযায়ী নির্বাচন)
  if (Array.isArray(invoices) && invoices.length > 0 && studentId) {
    const sRoll = String(student['রোল নম্বর'] || student.roll || '').trim();
    const sClass = String(student['জামাত/শ্রেণী'] || student.class || '').trim();
    const sInvoices = invoices.filter(
      (inv) =>
        String(inv.studentId || '').trim() === studentId ||
        (sRoll && sClass && String(inv.studentRoll || '').trim() === sRoll && String(inv.studentClass || '').trim() === sClass)
    );

    if (sInvoices.length > 0) {
      // Find invoice with admission fee or earliest invoice
      const admInv = sInvoices.find((inv) => {
        const invType = String(inv.type || inv.feeType || '').toLowerCase();
        const invItemsStr = JSON.stringify(inv.items || '').toLowerCase();
        return (
          invType.includes('ভর্তি') ||
          invType.includes('admission') ||
          invItemsStr.includes('ভর্তি') ||
          invItemsStr.includes('admission') ||
          invItemsStr.includes('ফরম')
        );
      }) || sInvoices[0];

      if (admInv && admInv.month) {
        const mIdx = getBengaliMonthIndex(admInv.month);
        const yNum = normalizeYearToNumber(admInv.year || admInv.date || '২০২৬');
        return {
          startMonth: BENGALI_MONTHS[mIdx],
          startMonthIndex: mIdx,
          startYear: enToBnNumber(yNum),
          startYearNum: yNum,
          isCustom: false,
          sourceText: `ভর্তি ইনভয়েস থেকে (${BENGALI_MONTHS[mIdx]} ${enToBnNumber(yNum)})`,
        };
      }
    }
  }

  // 3. Derive from student profile admission / enrollment date
  const rawAdmissionDate =
    student['মঞ্জুরকৃত তারিখ'] ||
    student['ভর্তির তারিখ'] ||
    student['ভর্তি তারিখ'] ||
    student['তারিখ'] ||
    student.admissionDate ||
    student.admission_date ||
    student.applyDate ||
    student.createdAt ||
    student.created_at ||
    student.date;

  if (rawAdmissionDate) {
    const rawStr = String(rawAdmissionDate).trim();
    
    // Check if rawStr explicitly contains Bengali month name
    for (let i = 0; i < BENGALI_MONTHS.length; i++) {
      if (rawStr.includes(BENGALI_MONTHS[i])) {
        const yearMatch = bnToEnNumber(rawStr).match(/\d{4}/);
        const yNum = yearMatch ? parseInt(yearMatch[0], 10) : 2026;
        return {
          startMonth: BENGALI_MONTHS[i],
          startMonthIndex: i,
          startYear: enToBnNumber(yNum),
          startYearNum: yNum,
          isCustom: false,
          sourceText: `ভর্তির তারিখ থেকে (${rawStr})`,
        };
      }
    }

    // Try parsing standard date formats (DD/MM/YYYY, YYYY-MM-DD, etc.)
    const enDateStr = bnToEnNumber(rawStr);
    const ddmmyyyy = enDateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (ddmmyyyy) {
      const monthNum = parseInt(ddmmyyyy[2], 10);
      const yearNum = parseInt(ddmmyyyy[3], 10);
      const mIdx = Math.max(0, Math.min(11, monthNum - 1));
      return {
        startMonth: BENGALI_MONTHS[mIdx],
        startMonthIndex: mIdx,
        startYear: enToBnNumber(yearNum),
        startYearNum: yearNum,
        isCustom: false,
        sourceText: `ভর্তির তারিখ (${rawStr})`,
      };
    }

    const yyyymmdd = enDateStr.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (yyyymmdd) {
      const yearNum = parseInt(yyyymmdd[1], 10);
      const monthNum = parseInt(yyyymmdd[2], 10);
      const mIdx = Math.max(0, Math.min(11, monthNum - 1));
      return {
        startMonth: BENGALI_MONTHS[mIdx],
        startMonthIndex: mIdx,
        startYear: enToBnNumber(yearNum),
        startYearNum: yearNum,
        isCustom: false,
        sourceText: `ভর্তির তারিখ (${rawStr})`,
      };
    }

    const parsedDate = new Date(enDateStr);
    if (!isNaN(parsedDate.getTime())) {
      const mIdx = parsedDate.getMonth();
      const yearNum = parsedDate.getFullYear();
      return {
        startMonth: BENGALI_MONTHS[mIdx],
        startMonthIndex: mIdx,
        startYear: enToBnNumber(yearNum),
        startYearNum: yearNum,
        isCustom: false,
        sourceText: `ভর্তির তারিখ (${parsedDate.toLocaleDateString('bn-BD')})`,
      };
    }
  }

  // 3. Fallback: Academic session start (January 2026)
  return {
    startMonth: 'জানুয়ারি',
    startMonthIndex: 0,
    startYear: '২০২৬',
    startYearNum: 2026,
    isCustom: false,
    sourceText: 'ডিফল্ট শিক্ষাবর্ষ শুরুর মাস (জানুয়ারি ২০২৬)',
  };
}

/**
 * Checks if a student was enrolled and active for billing in the target month & year
 */
export function isStudentEligibleForMonth(
  billingStart: StudentBillingStartInfo,
  targetMonth: string,
  targetYear: string | number
): boolean {
  const targetMIdx = getBengaliMonthIndex(targetMonth);
  const targetYNum = normalizeYearToNumber(targetYear);

  if (targetYNum > billingStart.startYearNum) {
    return true;
  }
  if (targetYNum === billingStart.startYearNum) {
    return targetMIdx >= billingStart.startMonthIndex;
  }
  return false;
}

/**
 * Determine a student's category (আবাসিক, অনাবাসিক, ডে-কেয়ার)
 */
export function getStudentCategory(student: Student): {
  category: 'residential' | 'non_residential' | 'day_care';
  categoryLabel: string;
} {
  const branchStr = (
    student['শাখা'] ||
    student.branch ||
    student['আবাসিক বিষয়'] ||
    student['আবাসিক অবস্থা'] ||
    student['আবাসিক/অনাবাসিক'] ||
    student.residentialStatus ||
    student['বিভাগ'] ||
    student.department ||
    ''
  )
    .toString()
    .toLowerCase();

  const jamatStr = (student['জামাত/শ্রেণী'] || student.class || '').toString().toLowerCase();

  if (branchStr.includes('ডে-কেয়ার') || branchStr.includes('ডে-কেয়ার') || branchStr.includes('ডে কেয়ার') || branchStr.includes('day') || branchStr.includes('care')) {
    return { category: 'day_care', categoryLabel: 'ডে-কেয়ার' };
  }
  if (
    branchStr.includes('আবাসিক') ||
    branchStr.includes('residential') ||
    branchStr.includes('বোর্ডিং') ||
    branchStr.includes('হাফেজ') ||
    jamatStr.includes('আবাসিক') ||
    jamatStr.includes('হাফেজ') ||
    student.isResidential === true
  ) {
    if (branchStr.includes('অনাবাসিক') || branchStr.includes('non')) {
      return { category: 'non_residential', categoryLabel: 'অনাবাসিক' };
    }
    return { category: 'residential', categoryLabel: 'আবাসিক' };
  }
  return { category: 'non_residential', categoryLabel: 'অনাবাসিক' };
}

/**
 * Extracts custom profile fee rates for tuition, khoraki, or other heads
 */
export function getStudentProfileCustomRates(student: Student): Record<string, number> {
  const custom: Record<string, number> = {};
  if (!student) return custom;

  const { category } = getStudentCategory(student);

  // 1. Tuition
  if (student.tuitionFee !== undefined && student.tuitionFee !== null && student.tuitionFee !== '') {
    const val = Number(student.tuitionFee);
    if (!isNaN(val)) {
      if (category === 'residential') custom['5'] = val;
      else if (category === 'day_care') custom['15'] = val;
      else custom['4'] = val;
    }
  } else if (student['মাসিক বেতন'] !== undefined && student['মাসিক বেতন'] !== null && student['মাসিক বেতন'] !== '') {
    const val = Number(student['মাসিক বেতন']);
    if (!isNaN(val)) {
      if (category === 'residential') custom['5'] = val;
      else if (category === 'day_care') custom['15'] = val;
      else custom['4'] = val;
    }
  } else if (student['আবাসিক বেতন'] !== undefined && student['আবাসিক বেতন'] !== null && student['আবাসিক বেতন'] !== '') {
    const val = Number(student['আবাসিক বেতন']);
    if (!isNaN(val)) custom['5'] = val;
  } else if (student['অনাবাসিক বেতন'] !== undefined && student['অনাবাসিক বেতন'] !== null && student['অনাবাসিক বেতন'] !== '') {
    const val = Number(student['অনাবাসিক বেতন']);
    if (!isNaN(val)) custom['4'] = val;
  }

  // 2. Khoraki / Boarding
  if (student.khorakiFee !== undefined && student.khorakiFee !== null && student.khorakiFee !== '') {
    const val = Number(student.khorakiFee);
    if (!isNaN(val)) custom['6'] = val;
  } else if (student['খোরাকী'] !== undefined && student['খোরাকী'] !== null && student['খোরাকী'] !== '') {
    const val = Number(student['খোরাকী']);
    if (!isNaN(val)) custom['6'] = val;
  } else if (student['খোরাকী ফি'] !== undefined && student['খোরাকী ফি'] !== null && student['খোরাকী ফি'] !== '') {
    const val = Number(student['খোরাকী ফি']);
    if (!isNaN(val)) custom['6'] = val;
  }

  // 3. Electricity / Other bills
  if (student.electricityBill !== undefined && student.electricityBill !== null && student.electricityBill !== '') {
    const val = Number(student.electricityBill);
    if (!isNaN(val)) custom['14'] = val;
  } else if (student['বিদ্যুৎ বিল'] !== undefined && student['বিদ্যুৎ বিল'] !== null && student['বিদ্যুৎ বিল'] !== '') {
    const val = Number(student['বিদ্যুৎ বিল']);
    if (!isNaN(val)) custom['14'] = val;
  }

  return custom;
}

/**
 * Calculates all expected fee items for a student in a specific month & year
 */
export function calculateExpectedFeeItems(
  student: Student,
  feeHeads: any[],
  classFeeMapping: Record<string, any>,
  targetMonth: string,
  targetYear: string | number,
  billingStart: StudentBillingStartInfo,
  studentOverrides?: Record<string, any>
): ExpectedFeeItem[] {
  const sClass = student['জামাত/শ্রেণী'] || student.class || '';
  const studentId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim();
  const override = studentOverrides && studentId ? studentOverrides[studentId] : null;
  const { category } = getStudentCategory(student);

  const targetMIdx = getBengaliMonthIndex(targetMonth);
  const targetYNum = normalizeYearToNumber(targetYear);
  const isEnrollmentMonth =
    billingStart.startYearNum === targetYNum && billingStart.startMonthIndex === targetMIdx;

  // Lookup Class fee mapping
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

  const profileCustomRates = getStudentProfileCustomRates(student);
  const expectedItems: ExpectedFeeItem[] = [];

  feeHeads.forEach((head) => {
    const headId = String(head.id);
    const headName = head.name || '';
    const frequency = head.frequency || (
      headName.includes('বেতন') || headName.includes('খোরাকী') || headName.includes('বিদ্যুৎ') || headId === '4' || headId === '5' || headId === '6' || headId === '14' || headId === '15'
        ? 'monthly_mandatory'
        : headName.includes('ফরম') || headName.includes('ভর্তি ফি') || headName.includes('প্রশংসাপত্র') || headName.includes('সনদ')
        ? 'one_time'
        : headName.includes('আইডি') || headName.includes('অনলাইন')
        ? 'yearly'
        : 'occasional'
    );

    const applicableTo = head.applicableTo || (
      headName.includes('অনাবাসিক') || headId === '4'
        ? 'non_residential'
        : headName.includes('আবাসিক') || headName.includes('খোরাকী') || headName.includes('বিদ্যুৎ') || headId === '5' || headId === '6' || headId === '14'
        ? 'residential'
        : headName.includes('ডে-কেয়ার') || headId === '15'
        ? 'day_care'
        : 'all'
    );

    // 1. Check Category Applicability
    if (applicableTo === 'residential' && category !== 'residential') return;
    if (applicableTo === 'non_residential' && category !== 'non_residential') return;
    if (applicableTo === 'day_care' && category !== 'day_care') return;

    // 2. Check Frequency Applicability
    if (frequency === 'one_time' && !isEnrollmentMonth) {
      return; // One-time admission fees only apply in enrollment month
    }
    if (frequency === 'yearly' && targetMIdx !== 0 && !isEnrollmentMonth) {
      return; // Yearly fees apply in January or enrollment month
    }
    if (frequency === 'occasional') {
      const hasSpecificRate = classRates[headId] && classRates[headId] > 0;
      if (!hasSpecificRate) return;
    }

    let defaultRate = classRates[headId] !== undefined && classRates[headId] !== null ? Number(classRates[headId]) : 0;
    
    // Check assigned rate: Priority 1: studentOverrides customRates, Priority 2: profileCustomRates, Priority 3: defaultRate
    let assignedRate: number | null = null;

    if (override && override.customRates && override.customRates[headId] !== undefined) {
      assignedRate = Number(override.customRates[headId]);
    } else if (profileCustomRates[headId] !== undefined) {
      assignedRate = profileCustomRates[headId];
    }

    // If default package rate is 0 but assigned rate is specified, treat assigned rate as base
    if (defaultRate === 0 && assignedRate !== null && assignedRate > 0) {
      defaultRate = assignedRate;
    }

    // If no custom rate is given, assignedRate = defaultRate
    if (assignedRate === null) {
      assignedRate = defaultRate;
    }

    // Calculate discount
    let discount = 0;
    if (defaultRate > 0 && assignedRate < defaultRate) {
      discount = defaultRate - assignedRate;
    } else if (head.defaultDiscount && head.allowDiscount !== false) {
      if (head.discountType === 'percent') {
        discount = Math.round((defaultRate * head.defaultDiscount) / 100);
      } else {
        discount = head.defaultDiscount;
      }
      assignedRate = Math.max(0, defaultRate - discount);
    }

    const netPayable = Math.max(0, assignedRate);

    // Include if package has a rate, student has an assigned rate, or it's a mandatory monthly head
    if (defaultRate > 0 || assignedRate > 0 || frequency === 'monthly_mandatory') {
      expectedItems.push({
        headId,
        headName,
        defaultRate,
        assignedRate,
        discount,
        netPayable,
        frequency,
        applicableTo,
        dueDay: head.dueDay || 12,
      });
    }
  });

  return expectedItems;
}

/**
 * Check if an invoice or item month matches the target month
 */
export function isInvoiceMonthMatch(
  monthStr?: string | null,
  dateStr?: string | null,
  targetMonth?: string
): boolean {
  if (!targetMonth) return false;
  const targetMIdx = getBengaliMonthIndex(targetMonth);

  if (monthStr && String(monthStr).trim()) {
    const mIdx = getBengaliMonthIndex(String(monthStr));
    return mIdx === targetMIdx;
  }

  if (dateStr && String(dateStr).trim()) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.getMonth() === targetMIdx;
      }
    } catch {
      // ignore
    }
  }

  return false;
}

/**
 * Check if an invoice or item year matches the target year
 */
export function isInvoiceYearMatch(
  yearStr?: string | number | null,
  dateStr?: string | null,
  targetYearNum?: number
): boolean {
  if (!targetYearNum) return true;
  if (yearStr !== undefined && yearStr !== null && String(yearStr).trim()) {
    return normalizeYearToNumber(yearStr) === targetYearNum;
  }

  if (dateStr && String(dateStr).trim()) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.getFullYear() === targetYearNum;
      }
    } catch {
      // ignore
    }
  }

  return true;
}

/**
 * Calculates total paid and breakdown for a student for the specific month & year
 * BASED ON ITEM-MONTH (where item.month matches targetMonth, NOT just the payment date)
 */
export function calculateStudentMonthPayments(
  studentId: string,
  invoices: any[],
  targetMonth: string,
  targetYear: string | number,
  studentRoll?: string,
  studentName?: string,
  studentClass?: string
): {
  totalPaidForMonth: number;
  totalDiscountForMonth: number;
  paidHeadBreakdown: Record<string, number>;
  matchedInvoices: any[];
  latestPaymentDate?: string;
  latestPaymentMethod?: string;
  latestInvoiceNo?: string;
} {
  const targetYNum = normalizeYearToNumber(targetYear);
  const matchedInvoices: any[] = [];
  const paidHeadBreakdown: Record<string, number> = {};
  let totalPaidForMonth = 0;
  let totalDiscountForMonth = 0;
  let latestPaymentDate = '';
  let latestPaymentMethod = '';
  let latestInvoiceNo = '';

  const cleanStudentId = String(studentId || '').trim();
  const cleanRoll = String(studentRoll || '').trim();
  const cleanName = String(studentName || '').trim().toLowerCase();
  const cleanClass = String(studentClass || '').trim().toLowerCase();

  const studentInvoices = invoices.filter((inv) => {
    if (inv.status === 'void' || inv.status === 'cancelled' || inv.status === 'deleted' || inv.status === 'pending') {
      return false;
    }
    if (Number(inv.paidAmount || 0) <= 0) {
      return false;
    }

    const invStudentId = String(inv.studentId || inv.idNo || '').trim();
    const invRoll = String(inv.studentRoll || inv.roll || '').trim();
    const invName = String(inv.studentName || inv.name || '').trim().toLowerCase();
    const invClass = String(inv.studentClass || inv.class || '').trim().toLowerCase();

    // 1. Direct ID match
    if (cleanStudentId && invStudentId) {
      if (cleanStudentId.toLowerCase() === invStudentId.toLowerCase()) {
        return true;
      }
      const normStudentId = cleanStudentId.toLowerCase().replace(/^(std|id)[-_:\s]*/, '');
      const normInvId = invStudentId.toLowerCase().replace(/^(std|id)[-_:\s]*/, '');
      if (normStudentId && normInvId && normStudentId === normInvId) {
        return true;
      }
      // If invoice explicitly has a different student ID, do not match
      return false;
    }

    // 2. Roll & Class match (only if invoice has no student ID or same roll+class)
    if (cleanRoll && invRoll && cleanRoll === invRoll) {
      if (cleanClass && invClass && cleanClass === invClass) {
        return true;
      }
    }

    // 3. Exact Name and Class match (only if ID missing in invoice)
    if (cleanName && invName && cleanName.length >= 3 && cleanName === invName && cleanClass && invClass && cleanClass === invClass) {
      return true;
    }

    return false;
  });

  studentInvoices.forEach((inv) => {
    const invYear = inv.year;
    const invDate = inv.date;

    // Check items in invoice
    if (Array.isArray(inv.items) && inv.items.length > 0) {
      let invHasMonthItem = false;

      inv.items.forEach((item: any) => {
        const itemMonth = item.month || inv.month;
        const itemYear = item.year || invYear;

        const isMonthMatch = isInvoiceMonthMatch(itemMonth, invDate, targetMonth);
        const isYearMatch = isInvoiceYearMatch(itemYear, invDate, targetYNum);

        if (isMonthMatch && isYearMatch) {
          invHasMonthItem = true;
          const paidAmt = Number(item.amount || 0);
          const discAmt = Number(item.discount || 0);

          totalPaidForMonth += paidAmt;
          totalDiscountForMonth += discAmt;

          const headId = String(item.headId || item.headName || 'unknown');
          paidHeadBreakdown[headId] = (paidHeadBreakdown[headId] || 0) + paidAmt;
        }
      });

      if (invHasMonthItem) {
        matchedInvoices.push(inv);
        if (!latestPaymentDate || (inv.date && inv.date > latestPaymentDate)) {
          latestPaymentDate = inv.date;
          latestPaymentMethod = inv.paymentMethod || 'নগদ';
          latestInvoiceNo = inv.invoiceNo;
        }
      }
    } else {
      // Fallback if no item breakdown: match by invoice level month
      const isMonthMatch = isInvoiceMonthMatch(inv.month, invDate, targetMonth);
      const isYearMatch = isInvoiceYearMatch(invYear, invDate, targetYNum);

      if (isMonthMatch && isYearMatch) {
        matchedInvoices.push(inv);
        const paidAmt = Number(inv.paidAmount || inv.netAmount || 0);
        totalPaidForMonth += paidAmt;
        totalDiscountForMonth += Number(inv.discount || 0);

        if (!latestPaymentDate || (inv.date && inv.date > latestPaymentDate)) {
          latestPaymentDate = inv.date;
          latestPaymentMethod = inv.paymentMethod || 'নগদ';
          latestInvoiceNo = inv.invoiceNo;
        }
      }
    }
  });

  return {
    totalPaidForMonth,
    totalDiscountForMonth,
    paidHeadBreakdown,
    matchedInvoices,
    latestPaymentDate,
    latestPaymentMethod,
    latestInvoiceNo,
  };
}

/**
 * Main Ledger Calculation for a selected month & year across all students
 */
export function calculateMonthlyFeeLedger(
  students: Student[],
  invoices: any[],
  feeHeads: any[],
  classFeeMapping: Record<string, any>,
  targetMonth: string,
  targetYear: string | number,
  studentOverrides?: Record<string, any>
): MonthLedgerSummary {
  const records: StudentMonthLedgerRecord[] = [];
  const headStatsMap: Record<string, { expected: number; collected: number; due: number; paidCount: number; unpaidCount: number }> = {};

  // Initialize head stats
  feeHeads.forEach((h) => {
    headStatsMap[String(h.id)] = {
      expected: 0,
      collected: 0,
      due: 0,
      paidCount: 0,
      unpaidCount: 0,
    };
  });

  let totalExpectedAmount = 0;
  let totalCollectedAmount = 0;
  let totalDueAmount = 0;
  let totalDiscountAmount = 0;
  let fullyPaidCount = 0;
  let partiallyPaidCount = 0;
  let unpaidCount = 0;
  let exemptCount = 0;
  let overdueCount = 0;
  let eligibleStudentsCount = 0;

  // Current date check for overdue calculation
  const now = new Date();
  const currentEnYear = now.getFullYear();
  const currentMIdx = now.getMonth();
  const targetMIdx = getBengaliMonthIndex(targetMonth);
  const targetYNum = normalizeYearToNumber(targetYear);
  const currentDay = now.getDate();

  const isCurrentOrPastMonth =
    targetYNum < currentEnYear || (targetYNum === currentEnYear && targetMIdx <= currentMIdx);

  students.forEach((student) => {
    const studentId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim();
    const studentName = student['শিক্ষার্থীর নাম'] || student.name || 'নামহীন';
    const studentRoll = student['রোল নম্বর'] || student.roll || '';
    const studentClass = student['জামাত/শ্রেণী'] || student.class || '';
    const studentBranch = student['শাখা'] || student.branch || '';
    const studentFather = student['পিতার নাম'] || student.fatherName || '';
    const studentPhone = student['অভিভাবকের মোবাইল'] || student.mobile || student['মোবাইল'] || '';

    const billingStartInfo = getStudentBillingStartInfo(student, studentOverrides, invoices);
    const isEligible = isStudentEligibleForMonth(billingStartInfo, targetMonth, targetYear);
    const { category, categoryLabel } = getStudentCategory(student);

    if (!isEligible) {
      // Student is not yet enrolled in this month
      return;
    }

    eligibleStudentsCount++;

    // Calculate expected fee items
    const expectedItems = calculateExpectedFeeItems(
      student,
      feeHeads,
      classFeeMapping,
      targetMonth,
      targetYear,
      billingStartInfo,
      studentOverrides
    );

    const studentTotalExpected = expectedItems.reduce((sum, item) => sum + item.defaultRate, 0);
    const studentDiscount = expectedItems.reduce((sum, item) => sum + item.discount, 0);
    const studentNetPayable = Math.max(0, studentTotalExpected - studentDiscount);

    // Calculate actual payments received for target month
    const {
      totalPaidForMonth,
      totalDiscountForMonth,
      paidHeadBreakdown,
      matchedInvoices,
      latestPaymentDate,
      latestPaymentMethod,
      latestInvoiceNo,
    } = calculateStudentMonthPayments(studentId, invoices, targetMonth, targetYear, studentRoll, studentName, studentClass);

    const totalDisc = Math.max(studentDiscount, totalDiscountForMonth);
    const effectivePayable = Math.max(0, studentTotalExpected - totalDisc);
    const dueAmount = Math.max(0, effectivePayable - totalPaidForMonth);

    // Determine status (Strict: only students with actual paid invoices and positive collections are 'paid')
    let paymentStatus: 'paid' | 'partial' | 'unpaid' | 'exempt' = 'unpaid';
    if (totalPaidForMonth > 0 && totalPaidForMonth >= effectivePayable && matchedInvoices.length > 0) {
      paymentStatus = 'paid';
      fullyPaidCount++;
    } else if (totalPaidForMonth > 0 && totalPaidForMonth < effectivePayable) {
      paymentStatus = 'partial';
      partiallyPaidCount++;
    } else if (effectivePayable === 0 && totalPaidForMonth === 0) {
      paymentStatus = 'exempt';
      exemptCount++;
    } else if (effectivePayable === 0 && totalPaidForMonth > 0) {
      paymentStatus = 'paid';
      fullyPaidCount++;
    } else {
      paymentStatus = 'unpaid';
      unpaidCount++;
    }

    // Overdue condition: past 12th of month and still has remaining due
    const isOverdue =
      isCurrentOrPastMonth &&
      (targetYNum < currentEnYear || targetMIdx < currentMIdx || currentDay > 12) &&
      (paymentStatus === 'unpaid' || paymentStatus === 'partial') &&
      dueAmount > 0;

    if (isOverdue) {
      overdueCount++;
    }

    totalExpectedAmount += effectivePayable;
    totalCollectedAmount += totalPaidForMonth;
    totalDueAmount += dueAmount;
    totalDiscountAmount += totalDisc;

    // Track head-level stats
    expectedItems.forEach((item) => {
      const hId = item.headId;
      if (!headStatsMap[hId]) {
        headStatsMap[hId] = { expected: 0, collected: 0, due: 0, paidCount: 0, unpaidCount: 0 };
      }
      const itemPaid = paidHeadBreakdown[hId] || (paymentStatus === 'paid' && totalPaidForMonth > 0 ? item.netPayable : 0);
      const itemDue = Math.max(0, item.netPayable - itemPaid);

      headStatsMap[hId].expected += item.netPayable;
      headStatsMap[hId].collected += Math.min(item.netPayable, itemPaid);
      headStatsMap[hId].due += itemDue;

      if (itemPaid >= item.netPayable && item.netPayable > 0 && itemPaid > 0) {
        headStatsMap[hId].paidCount++;
      } else {
        headStatsMap[hId].unpaidCount++;
      }
    });

    records.push({
      studentId,
      studentName,
      studentRoll,
      studentClass,
      studentBranch,
      studentFather,
      studentPhone,
      category,
      categoryLabel,
      billingStartInfo,
      isEligibleForMonth: true,
      expectedItems,
      totalExpected: studentTotalExpected,
      totalDiscount: totalDisc,
      netPayable: effectivePayable,
      totalPaid: totalPaidForMonth,
      dueAmount,
      paymentStatus,
      isOverdue,
      paidInvoices: matchedInvoices,
      paidHeadBreakdown,
      latestPaymentDate,
      latestPaymentMethod,
      latestInvoiceNo,
    });
  });

  // Calculate Fee Head Summaries
  const headSummaries: FeeHeadMonthSummary[] = feeHeads.map((h) => {
    const hId = String(h.id);
    const stat = headStatsMap[hId] || { expected: 0, collected: 0, due: 0, paidCount: 0, unpaidCount: 0 };
    const collectionRate = stat.expected > 0 ? Math.min(100, Math.round((stat.collected / stat.expected) * 100)) : 100;

    return {
      headId: hId,
      headName: h.name,
      frequency: h.frequency || 'monthly_mandatory',
      applicableTo: h.applicableTo || 'all',
      totalExpected: stat.expected,
      totalCollected: stat.collected,
      totalDue: stat.due,
      paidStudentsCount: stat.paidCount,
      unpaidStudentsCount: stat.unpaidCount,
      collectionRate,
    };
  });

  const overallCollectionRate =
    totalExpectedAmount > 0
      ? Math.min(100, Math.round((totalCollectedAmount / totalExpectedAmount) * 100))
      : 100;

  return {
    month: targetMonth,
    year: String(targetYear),
    totalStudentsCount: students.length,
    eligibleStudentsCount,
    totalExpectedAmount,
    totalCollectedAmount,
    totalDueAmount,
    totalDiscountAmount,
    fullyPaidCount,
    partiallyPaidCount,
    unpaidCount,
    exemptCount,
    overdueCount,
    overallCollectionRate,
    records,
    headSummaries,
  };
}
