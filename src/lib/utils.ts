import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function bnToEnNumber(str: string): string {
  const bn = '০১২৩৪৫৬৭৮৯';
  const en = '0123456789';
  return str.replace(/[০-৯]/g, d => en[bn.indexOf(d)]);
}

export function enToBnNumber(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = val.toString();
  const bn = '০১২৩৪৫৬৭৮৯';
  const en = '0123456789';
  return str.replace(/[0-9]/g, d => bn[en.indexOf(d)]);
}

export function formatDateToDDMMYYYY(dateStr?: string | Date | null): string {
  if (!dateStr) return '';
  
  let dateObj: Date | null = null;
  
  if (dateStr instanceof Date) {
    dateObj = dateStr;
  } else {
    const str = String(dateStr).trim();
    if (!str) return '';
    
    // Check if it's already in DD/MM/YYYY or DD-MM-YYYY format
    const dd_mm_yyyy_regex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
    const matchSimple = str.match(dd_mm_yyyy_regex);
    if (matchSimple) {
      const d = matchSimple[1].padStart(2, '0');
      const m = matchSimple[2].padStart(2, '0');
      const y = matchSimple[3];
      return `${d}/${m}/${y}`;
    }
    
    // Check if it's in YYYY-MM-DD
    const yyyy_mm_dd_regex = /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/;
    const matchYMD = str.match(yyyy_mm_dd_regex);
    if (matchYMD) {
      const y = matchYMD[1];
      const m = matchYMD[2].padStart(2, '0');
      const d = matchYMD[3].padStart(2, '0');
      return `${d}/${m}/${y}`;
    }

    // Try normal Date.parse
    const parsed = Date.parse(str);
    if (!isNaN(parsed)) {
      dateObj = new Date(parsed);
    }
  }

  if (dateObj && !isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return String(dateStr);
}

export function getActiveBranches(contextBranches?: any[]): string[] {
  if (Array.isArray(contextBranches) && contextBranches.length > 0) {
    const active = contextBranches.filter((b: any) => b.isActive !== false).map((b: any) => b.name);
    if (active.length > 0) return active;
  }
  try {
    const saved = localStorage.getItem('acad_branches');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const active = parsed.filter((b: any) => b.isActive !== false).map((b: any) => b.name);
        if (active.length > 0) return active;
      }
    }
  } catch (e) {
    console.error("Error reading acad_branches:", e);
  }
  return ['ক - আবাসিক', 'খ - অনাবাসিক', 'গ - ডে কেয়ার'];
}

export function isBranchMatch(sBranchRaw: any, targetBranchRaw: any): boolean {
  if (!sBranchRaw || !targetBranchRaw) return false;
  const sStr = String(sBranchRaw).trim();
  const tStr = String(targetBranchRaw).trim();
  if (tStr === 'all' || tStr === 'সকল শাখা' || tStr === 'সব শাখা' || sStr === 'all') return true;
  if (sStr === tStr) return true;

  const sNorm = sStr.toLowerCase();
  const tNorm = tStr.toLowerCase();
  if (sNorm === tNorm) return true;

  const getLetter = (str: string) => {
    if (str.startsWith('ক') || str.includes('আবাসিক')) return 'ক';
    if (str.startsWith('খ') || str.includes('অনাবাসিক')) return 'খ';
    if (str.startsWith('গ') || str.includes('ডে কেয়ার') || str.includes('ডে-কেয়ার')) return 'গ';
    return str;
  };

  const sL = getLetter(sStr);
  const tL = getLetter(tStr);

  return sL === tL || sStr.includes(tStr) || tStr.includes(sStr);
}

export function getDepartmentForClass(classNameRaw: any, departments?: any[], classes?: any[]): string {
  if (!classNameRaw) return 'অন্যান্য';
  const str = typeof classNameRaw === 'object' ? getStudentClass(classNameRaw) : String(classNameRaw || '').trim();
  if (!str) return 'অন্যান্য';

  // Look up in departments array first if mapped
  if (classes && classes.length > 0) {
    const foundClass = classes.find(c => isClassMatch(c.name, str));
    if (foundClass && foundClass.departmentId) {
      if (departments && departments.length > 0) {
        const foundDept = departments.find(d => d.id === foundClass.departmentId);
        if (foundDept) return foundDept.name;
      }
      if (foundClass.departmentId === "1") return "নূরানী বিভাগ";
      if (foundClass.departmentId === "2") return "কিতাব বিভাগ";
      if (foundClass.departmentId === "3") return "নাযেরা বিভাগ";
    }
  }

  // Canonical class check
  const norm = str.toLowerCase();

  if (norm.includes('নাযেরা') || norm.includes('নাজেরা')) {
    return 'নাযেরা বিভাগ';
  }

  if (
    norm.includes('াতফাল') || norm.includes('আতফাল') || norm.includes('শিশু') ||
    norm.includes('আওয়াল') || norm.includes('আউয়াল') || norm.includes('১ম') || norm.includes('প্রথম') ||
    norm.includes('ছানী') || norm.includes('ছানি') || norm.includes('২য়') || norm.includes('দ্বিতীয়') ||
    norm.includes('ছালেছ') || norm.includes('ছালেস') || norm.includes('৩য়') || norm.includes('তৃতীয়') ||
    norm.includes('নূরানী') || norm.includes('নুরানী')
  ) {
    return 'নূরানী বিভাগ';
  }

  if (
    norm.includes('রাবে') || norm.includes('৪র্থ') || norm.includes('চতুর্থ') ||
    norm.includes('খামেছ') || norm.includes('খামেস') || norm.includes('৫ম') || norm.includes('পঞ্চম') ||
    norm.includes('মিযান') || norm.includes('মিয়ান') || norm.includes('৬ষ্ঠ') || norm.includes('ষষ্ঠ') ||
    norm.includes('নাহবেমীর') || norm.includes('৭ম') || norm.includes('সপ্তম') ||
    norm.includes('কুদূরী') || norm.includes('কুদ্দুরী') || norm.includes('৮ম') ||
    norm.includes('বেকায়া') || norm.includes('৯ম') ||
    norm.includes('হেদায়া') || norm.includes('১০ম') ||
    norm.includes('মেশকাত') || norm.includes('মিশকাত') ||
    norm.includes('দাওরা') || norm.includes('তাকমিল') ||
    norm.includes('কিতাব') || norm.includes('ইবতেদায়ি') || norm.includes('ইবতেদায়ী') || norm.includes('খুসুছি')
  ) {
    return 'কিতাব বিভাগ';
  }

  if (departments && departments.length > 0) {
    const matched = departments.find(d => d.name === str || d.id === str);
    if (matched) return matched.name;
    const active = departments.find(d => d.isActive !== false);
    if (active) return active.name;
  }

  return 'অন্যান্য';
}

export function getStudentClass(student: any): string {
  if (!student) return '';
  if (typeof student === 'string') return student.trim();
  return (
    student['জামাত/শ্রেণী'] ||
    student['জামাত'] ||
    student['শ্রেণী'] ||
    student.class ||
    student.Class ||
    student.jamat ||
    student.Jamat ||
    student.jamatClass ||
    student.desiredClass ||
    student.currentJamat ||
    ''
  ).toString().trim();
}

export function getCanonicalJamatId(raw: any): string {
  const str = typeof raw === 'object' ? getStudentClass(raw) : String(raw || '').trim();
  if (!str) return '';

  const norm = str.toLowerCase();

  // 13. Dawra / Takmil
  if (norm.includes('দাওরা') || norm.includes('তাকমিল')) return 'class-13';
  // 12. Meshkat / Fazilat Sani
  if (norm.includes('মেশকাত') || norm.includes('মিশকাত')) return 'class-12';
  // 11. Hedaya / Fazilat Awal
  if (norm.includes('হেদায়া') || norm.includes('হেদায়েত')) return 'class-11';
  // 10. Bekaya / Sanabiyya Sani
  if (norm.includes('বেকায়া') || norm.includes('বেকায়া') || norm.includes('সানাবিয্যা ছানী') || norm.includes('সানাবিয়্যা ছানী')) return 'class-10';
  // 9. Kuduri / Sanabiyya Awal
  if (norm.includes('কুদূরী') || norm.includes('কুদ্দুরী') || norm.includes('সানাবিয্যা আউয়াল') || norm.includes('সানাবিয়্যা আউয়াল') || norm.includes('সানাাবিয়্যা')) return 'class-9';
  // 8. Nahwamir / Mutawassitah Sani
  if (norm.includes('নাহবেমীর') || norm.includes('নাহবে মীর') || norm.includes('মুতাওয়াসসিতাহ ছানী') || norm.includes('মুতাওয়াসসিতাহ ছানি') || norm.includes('মুতাওয়াসসিতাহ ছানী') || norm.includes('মুতাওয়াসসিতাহ ছানি')) return 'class-8';
  // 7. Mijan / Mutawassitah Awal
  if (norm.includes('মিযান') || norm.includes('মিয়ান') || norm.includes('মুতাওয়াসসিতাহ আওয়াল') || norm.includes('মুতাওয়াসসিতাহ আউয়াল') || norm.includes('মুতাওয়াসসিতাহ আওয়াল') || norm.includes('মুতাওয়াসসিতাহ আউয়াল')) return 'class-7';
  // 6. Khames / 5th class
  if (norm.includes('খামেছ') || norm.includes('খামেস') || norm.includes('৫ম') || norm.includes('পঞ্চম')) return 'class-6';
  // 5. Rabe / 4th class
  if (norm.includes('রাবে') || norm.includes('৪র্থ') || norm.includes('চতুর্থ')) return 'class-5';
  // 4. Sales / 3rd class
  if (norm.includes('ছালেছ') || norm.includes('ছালেস') || norm.includes('৩য়') || norm.includes('তৃতীয়')) return 'class-4';
  // 3. Sani / 2nd class
  if (norm.includes('ছানী') || norm.includes('ছানি') || norm.includes('২য়') || norm.includes('দ্বিতীয়')) return 'class-3';
  // 2. Awal / 1st class
  if (norm.includes('আওয়াল') || norm.includes('আউয়াল') || norm.includes('১ম') || norm.includes('প্রথম')) return 'class-2';
  // 1. Atfal / Child class
  if (norm.includes('াতফাল') || norm.includes('শিশু')) return 'class-1';

  return norm;
}

export function isClassMatch(sClassRaw: any, targetClassRaw: any): boolean {
  if (!sClassRaw || !targetClassRaw) return false;
  
  const sStr = typeof sClassRaw === 'object' ? getStudentClass(sClassRaw) : String(sClassRaw).trim();
  const tStr = typeof targetClassRaw === 'object' ? getStudentClass(targetClassRaw) : String(targetClassRaw).trim();

  if (!sStr || !tStr) return false;

  // Exact match first
  if (sStr === tStr) return true;

  const sId = getCanonicalJamatId(sStr);
  const tId = getCanonicalJamatId(tStr);

  if (sId.startsWith('class-') || tId.startsWith('class-')) {
    return sId === tId;
  }

  // Non-core or custom classes
  return sId === tId || sStr.toLowerCase() === tStr.toLowerCase();
}

const bnUnits = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 
  'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোল', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ',
  'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'উনত্রিশ', 'ত্রিশ',
  'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'উনচল্লিশ', 'চল্লিশ',
  'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'উনপঞ্চাশ', 'পঞ্চাশ',
  'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'উনষাট', 'ষাট',
  'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'উনসত্তর', 'সত্তর',
  'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি', 'আশি',
  'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'অষ্টআশি', 'ঊননব্বই', 'নব্বই',
  'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'
];

export function numberToBanglaWords(num: number): string {
  if (isNaN(num) || num <= 0) return 'শূন্য টাকা মাত্র';
  const n = Math.floor(num);
  if (n === 0) return 'শূন্য টাকা মাত্র';

  function convertTwoDigits(v: number): string {
    return bnUnits[v] || '';
  }

  let words = '';

  const crore = Math.floor(n / 10000000);
  let rem = n % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;

  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  const hundred = Math.floor(rem / 100);
  rem = rem % 100;

  if (crore > 0) {
    words += (crore < 100 ? convertTwoDigits(crore) : numberToBanglaWords(crore).replace(' টাকা মাত্র', '')) + ' কোটি ';
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' লাখ ';
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' হাজার ';
  }
  if (hundred > 0) {
    words += convertTwoDigits(hundred) + ' শত ';
  }
  if (rem > 0) {
    words += convertTwoDigits(rem) + ' ';
  }

  return words.trim() + ' টাকা মাত্র';
}

/**
 * Robust Normalizer for Student records to ensure 100% data persistence,
 * preventing any columns or field variations (like Birth Registration, 2nd Mobile, etc.)
 * from being dropped or lost during single admission, bulk admission, editing, or imports.
 */
export function normalizeStudentRecord(raw: any, defaultYear?: string): any {
  if (!raw || typeof raw !== 'object') return raw;

  const currentYear = raw['শিক্ষাবর্ষ'] || raw.academicYearLabel || raw.academicYear || raw.currentYear || raw.session || defaultYear || '১৪৪৬-৪৭ হিজরী/২০২৫-২৬ ঈসায়ী';
  
  // Registration ID resolution
  const regId = (
    raw['রেজিস্ট্রেশন/আইডি নম্বর'] ||
    raw['রেজিস্ট্রেশন/আইডি'] ||
    raw.id ||
    raw.studentId ||
    raw.regId ||
    raw.registrationId ||
    raw['আইডি'] ||
    raw.reg ||
    ''
  ).toString().trim();

  // Student Name
  const name = (
    raw['শিক্ষার্থীর নাম'] ||
    raw.name ||
    raw.student_name ||
    raw.studentName ||
    raw.fullName ||
    raw['নাম'] ||
    ''
  ).toString().trim();

  // Father's Name
  const fatherName = (
    raw['পিতার নাম'] ||
    raw.fatherName ||
    raw.father_name ||
    raw.father ||
    raw['বাবার নাম'] ||
    ''
  ).toString().trim();

  // Mother's Name
  const motherName = (
    raw['মাতার নাম'] ||
    raw.motherName ||
    raw.mother_name ||
    raw.mother ||
    raw['মায়ের নাম'] ||
    ''
  ).toString().trim();

  // Primary Mobile (Mother / Guardian)
  const mobile = (
    raw['মোবাইল (মা)'] ||
    raw['অভিভাবকের মোবাইল'] ||
    raw.mobile ||
    raw.phone ||
    raw.mobile_mother ||
    raw['মোবাইল'] ||
    raw['মোবাইল নম্বর'] ||
    raw['মোবাইল নম্বর (মা)'] ||
    ''
  ).toString().trim();

  // Secondary Mobile (Father / Brother / Alternative)
  const altMobile = (
    raw['মোবাইল (বাবা/ভাই)'] ||
    raw['বিকল্প মোবাইল'] ||
    raw['দ্বিতীয় মোবাইল'] ||
    raw['দ্বিতীয় মোবাইল নম্বর'] ||
    raw['২য় মোবাইল'] ||
    raw.altMobile ||
    raw.alt_mobile ||
    raw.mobile_father_brother ||
    raw['বিকল্প ফোন'] ||
    raw.emergencyContact ||
    ''
  ).toString().trim();

  // Birth Registration Number / NID
  const birthReg = (
    raw['জন্ম নিবন্ধন নাম্বার'] ||
    raw['জন্ম নিবন্ধন সনদ নম্বর'] ||
    raw['জন্ম নিবন্ধন'] ||
    raw['জন্ম নিবন্ধন নম্বর'] ||
    raw['জন্ম নিবন্ধন/NID নং'] ||
    raw['এনআইডি/জন্ম সনদ'] ||
    raw['জন্ম নিবন্ধন নং'] ||
    raw.birthReg ||
    raw.birthRegNo ||
    raw.birth_reg_no ||
    raw.birthCertificateNo ||
    raw.nid ||
    ''
  ).toString().trim();

  // Date of Birth
  const dob = (
    raw['জন্ম তারিখ'] ||
    raw.dob ||
    raw.birthDate ||
    raw.dateOfBirth ||
    ''
  ).toString().trim();

  // Blood Group
  const bloodGroup = (
    raw['রক্তের গ্রুপ'] ||
    raw.bloodGroup ||
    raw.blood_group ||
    raw.blood ||
    'জানা নেই'
  ).toString().trim();

  // Class / Jamat
  const sClass = (
    raw['জামাত/শ্রেণী'] ||
    raw['জামাত'] ||
    raw['শ্রেণী'] ||
    raw.class ||
    raw.jamat ||
    raw.jamatClass ||
    raw.desiredClass ||
    raw.currentJamat ||
    ''
  ).toString().trim();

  // Branch
  const branch = (
    raw['শাখা'] ||
    raw.branch ||
    'ক'
  ).toString().trim();

  // Roll Number
  const roll = (
    raw['রোল নম্বর'] ||
    raw['রোল'] ||
    raw.roll ||
    raw.rollNo ||
    ''
  ).toString().trim();

  // Address
  const address = (
    raw['ঠিকানা'] ||
    raw['স্থায়ী ঠিকানা'] ||
    raw['স্থায়ী ঠিকানা'] ||
    raw['বর্তমান ঠিকানা'] ||
    raw.address ||
    raw.fullAddress ||
    ''
  ).toString().trim();

  // Student Type / Status
  const status = (
    raw['শিক্ষার্থী ধরণ/স্ট্যাটাস'] ||
    raw['শিক্ষার্থী ধরণ'] ||
    raw['স্ট্যাটাস'] ||
    raw.status ||
    raw.residentialStatus ||
    raw.studentType ||
    'সক্রিয়'
  ).toString().trim();

  // Tuition Fee
  const tuitionFee = Number(
    raw.tuitionFee !== undefined 
      ? raw.tuitionFee 
      : (raw['মাসিক বেতন'] !== undefined 
          ? raw['মাসিক বেতন'] 
          : (raw['মাসিক বেতন ফি'] !== undefined 
              ? raw['মাসিক বেতন ফি'] 
              : (raw['মাসিক ফি'] !== undefined ? raw['মাসিক ফি'] : 0)))
  ) || 0;

  // Khoraki Fee
  const khorakiFee = Number(
    raw.khorakiFee !== undefined 
      ? raw.khorakiFee 
      : (raw['খোরাকী'] !== undefined 
          ? raw['খোরাকী'] 
          : (raw['খোরাকী ফি'] !== undefined ? raw['খোরাকী ফি'] : 0))
  ) || 0;

  // RFID
  const rfid = (
    raw['RFID'] ||
    raw['RFID কার্ড'] ||
    raw.rfid ||
    ''
  ).toString().trim();

  // Photo
  const photoUrl = (
    raw.photoUrl ||
    raw['ছবি'] ||
    raw['ছবি_ইউআরএল'] ||
    raw.photo ||
    raw.studentPhoto ||
    raw.image ||
    ''
  ).toString().trim();

  // Previous Madrasah & Class
  const prevMadrasa = (
    raw['পূর্বের মাদ্রাসা'] ||
    raw.prevMadrasa ||
    raw.prev_madrasah ||
    raw.previousMadrasah ||
    ''
  ).toString().trim();

  const prevClass = (
    raw['পূর্বের জামাত'] ||
    raw.prevClass ||
    raw.prev_jamat ||
    raw.previousClass ||
    ''
  ).toString().trim();

  // Other details
  const marhala = (raw['মারহালা'] || raw.marhala || '').toString().trim();
  const somoman = (raw['সমমান'] || raw.somoman || '').toString().trim();
  const email = (raw['ইমেইল'] || raw.email || '').toString().trim();
  const messagingApps = (raw['মেসেজিং অ্যাপ'] || raw.messaging_apps || raw.messagingApps || 'WhatsApp').toString().trim();
  const comments = (raw['মন্তব্য'] || raw.comments || raw.comment || '').toString().trim();
  const applicationNo = (raw['আবেদন নং'] || raw.applicationNo || raw.applicationId || raw.appNumber || '').toString().trim();
  const approvalDate = (raw['মঞ্জুরের তারিখ ও সময়'] || raw['ভর্তির তারিখ'] || raw.admissionDate || raw.approvalDate || raw.created_at || '').toString().trim();
  const certNo = (raw['প্রত্যয়ন পত্র নাম্বার'] || raw['प्रत्यয়ন পত্র নাম্বার'] || raw.certNo || '').toString().trim();
  const verifyLink = (raw['ভেরিফিকেশন লিংক'] || raw.verifyLink || '').toString().trim();
  const longUrl = (raw['LONG URL'] || raw.longUrl || raw.long_url || '').toString().trim();
  const sortUrl = (raw['SORT URL'] || raw.sortUrl || raw.sort_url || '').toString().trim();
  const qrCode = (raw['QR CODE'] || raw.qrCode || regId).toString().trim();
  const qrCodeImage = (raw['QR CODE IMAGE'] || raw.qrCodeImage || '').toString().trim();

  return {
    ...raw, // Keep ALL custom or additional fields

    // Primary ID fields
    id: regId || raw.id,
    'রেজিস্ট্রেশন/আইডি নম্বর': regId,
    'রেজিস্ট্রেশন/আইডি': regId,
    studentId: regId,

    // Personal details (Bengali + English aliases)
    'শিক্ষার্থীর নাম': name,
    name: name,
    studentName: name,

    'পিতার নাম': fatherName,
    fatherName: fatherName,
    father: fatherName,

    'মাতার নাম': motherName,
    motherName: motherName,
    mother: motherName,

    // Contact Numbers (All variations synced)
    'মোবাইল (মা)': mobile,
    'অভিভাবকের মোবাইল': mobile || altMobile,
    mobile: mobile || altMobile,
    phone: mobile || altMobile,

    'মোবাইল (বাবা/ভাই)': altMobile,
    'বিকল্প মোবাইল': altMobile,
    'দ্বিতীয় মোবাইল': altMobile,
    'দ্বিতীয় মোবাইল নম্বর': altMobile,
    '২য় মোবাইল': altMobile,
    altMobile: altMobile,

    // Identification & Birth details
    'জন্ম নিবন্ধন নাম্বার': birthReg,
    'জন্ম নিবন্ধন সনদ নম্বর': birthReg,
    'জন্ম নিবন্ধন': birthReg,
    'জন্ম নিবন্ধন নম্বর': birthReg,
    'জন্ম নিবন্ধন/NID নং': birthReg,
    'এনআইডি/জন্ম সনদ': birthReg,
    birthReg: birthReg,
    birthRegNo: birthReg,

    'জন্ম তারিখ': dob,
    dob: dob,

    'রক্তের গ্রুপ': bloodGroup,
    bloodGroup: bloodGroup,

    // Academic & Class
    'শিক্ষাবর্ষ': currentYear,
    academicYearLabel: currentYear,
    'জামাত': sClass,
    'জামাত/শ্রেণী': sClass,
    'শ্রেণী': sClass,
    class: sClass,

    'শাখা': branch,
    branch: branch,

    'রোল নম্বর': roll,
    'রোল': roll,
    roll: roll,

    'মারহালা': marhala,
    marhala: marhala,
    'সমমান': somoman,
    somoman: somoman,

    // Address
    'ঠিকানা': address,
    'স্থায়ী ঠিকানা': address,
    'স্থায়ী ঠিকানা': address,
    'বর্তমান ঠিকানা': address,
    address: address,

    // Status & Type
    'শিক্ষার্থী ধরণ/স্ট্যাটাস': status,
    'শিক্ষার্থী ধরণ': status,
    'স্ট্যাটাস': status,
    status: status,
    residentialStatus: status,
    studentType: status,

    // Fees
    tuitionFee: tuitionFee,
    'মাসিক বেতন': tuitionFee,
    'মাসিক বেতন ফি': tuitionFee,
    'মাসিক ফি': tuitionFee,

    khorakiFee: khorakiFee,
    'খোরাকী': khorakiFee,
    'খোরাকী ফি': khorakiFee,

    // Hardware / Media / Additional
    rfid: rfid,
    'RFID': rfid,
    'RFID কার্ড': rfid,

    photoUrl: photoUrl,
    'ছবি': photoUrl,
    'ছবি_ইউআরএল': photoUrl,

    'পূর্বের মাদ্রাসা': prevMadrasa,
    prevMadrasa: prevMadrasa,
    'পূর্বের জামাত': prevClass,
    prevClass: prevClass,

    'ইমেইল': email,
    email: email,

    'মেসেজিং অ্যাপ': messagingApps,
    'মন্তব্য': comments,
    'আবেদন নং': applicationNo,
    'মঞ্জুরের তারিখ ও সময়': approvalDate,
    'প্রত্যয়ন পত্র নাম্বার': certNo,
    'ভেরিফিকেশন লিংক': verifyLink,
    'LONG URL': longUrl,
    'SORT URL': sortUrl,
    'QR CODE': qrCode,
    'QR CODE IMAGE': qrCodeImage,
    isDeleted: Boolean(raw.isDeleted)
  };
}



