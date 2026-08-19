/**
 * Note: ADMIN_CREDENTIALS have been removed from source code for security.
 * The system now uses Supabase Auth for authentication.
 */

export const ACADEMIC_YEARS = [
  "১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী",
  "১৪৪৬-৪৭ হিজরী/২০২৫-২৬ ঈসায়ী"
];

export const DEFAULT_DEPARTMENTS = [
  { id: "1", name: "নূরানী বিভাগ", description: "শিশু - ৩য় শ্রেণী", isActive: true },
  { id: "2", name: "কিতাব বিভাগ", description: "খুসুছি জামাত থেকে দাওরায়ে হাদিস পর্যন্ত", isActive: true },
  { id: "3", name: "নাযেরা বিভাগ", description: "নাযেরা শিক্ষা বিভাগ", isActive: true },
];

export const DEFAULT_BRANCHES = [
  { id: "1", name: "ক - আবাসিক", classId: "all", maxStudents: 10000, isActive: true },
  { id: "2", name: "খ - অনাবাসিক", classId: "all", maxStudents: 10000, isActive: true },
  { id: "3", name: "গ - ডে কেয়ার", classId: "all", maxStudents: 10000, isActive: true },
];

export const STANDARD_JAMAT_PRESETS = [
  { id: "class-1", name: "আতফাল (শিশু শ্রেণী)", departmentId: "1", equivalent: "শিশু শ্রেণী", isActive: true, isCore: true },
  { id: "class-2", name: "আওয়াল (১ম শ্রেণী)", departmentId: "1", equivalent: "১ম শ্রেণী", isActive: true, isCore: true },
  { id: "class-3", name: "ছানী (২য় শ্রেণী)", departmentId: "1", equivalent: "২য় শ্রেণী", isActive: true, isCore: true },
  { id: "class-4", name: "ছালেছ (৩য় শ্রেণী)", departmentId: "1", equivalent: "৩য় শ্রেণী", isActive: true, isCore: true },
  { id: "class-5", name: "ইবতেদায়ি রাবে (৪র্থ শ্রেণী)", departmentId: "2", equivalent: "প্রাথমিক - চতুর্থ শ্রেণী", isActive: true, isCore: true },
  { id: "class-6", name: "ইবতেদায়ি খামেছ (৫ম শ্রেণী)", departmentId: "2", equivalent: "প্রাথমিক - পঞ্চম শ্রেণী", isActive: true, isCore: true },
  { id: "class-7", name: "মিযান (মুতাওয়াসসিতাহ আওয়াল)", departmentId: "2", equivalent: "নিম্ন মাধ্যমিক - ষষ্ঠ শ্রেণী", isActive: true, isCore: true },
  { id: "class-8", name: "নাহবেমীর (মুতাওয়াসসিতাহ ছানী)", departmentId: "2", equivalent: "নিম্ন মাধ্যমিক - সপ্তম শ্রেণী", isActive: true, isCore: true },
  { id: "class-9", name: "কুদূরী (সানাবিয়্যা আউয়াল)", departmentId: "2", equivalent: "মাধ্যমিক সমমান", isActive: true, isCore: true },
  { id: "class-10", name: "শরহে বেকায়া (সানাবিয়্যা ছানী)", departmentId: "2", equivalent: "মাধ্যমিক সমমান", isActive: true, isCore: true },
  { id: "class-11", name: "হেদায়া (ফজিলত আউয়াল)", departmentId: "2", equivalent: "স্নাতক সমমান", isActive: true, isCore: true },
  { id: "class-12", name: "মেশকাত (ফজিলত ছানী)", departmentId: "2", equivalent: "স্নাতক সমমান", isActive: true, isCore: true },
  { id: "class-13", name: "দাওরায়ে হাদিস (তাকমিল)", departmentId: "2", equivalent: "স্নাতকোত্তর সমমান", isActive: true, isCore: true }
];

// Fallback Jamat List for static references (components should prefer jamatList from useData)
export const JAMAT_LIST = STANDARD_JAMAT_PRESETS.map(c => c.name);

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const CLASS_DETAILS_MAP: Record<string, any> = {
  "আতফাল (শিশু শ্রেণী)": { marhala: "আফতাল", jamatClass: "আফতাল", somoman: "শিশু শ্রেণী" },
  "আওয়াল (১ম শ্রেণী)": { marhala: "ইবতেদায়িয়া আউয়াল", jamatClass: "আউয়াল", somoman: "১ম শ্রেণী" },
  "ছানী (২য় শ্রেণী)": { marhala: "ইবতেদায়িয়া ছানী", jamatClass: "ছানী", somoman: "২য় শ্রেণী" },
  "ছালেছ (৩য় শ্রেণী)": { marhala: "ইবতেদায়িয়া ছালেছ", jamatClass: "ছালেছ", somoman: "৩য় শ্রেণী" },
  "ইবতেদায়ি রাবে (৪র্থ শ্রেণী)": { marhala: "ইবতেদায়িয়া রাবে", jamatClass: "রাবে (৪র্থ শ্রেণী)", somoman: "প্রাথমিক - চতুর্থ শ্রেণী" },
  "ইবতেদায়ি খামেছ (৫ম শ্রেণী)": { marhala: "ইবতেদায়িয়া খামস", jamatClass: "খামেস (৫ম শ্রেণী)", somoman: "প্রাথমিক - পঞ্চম শ্রেণী" },
  "মিযান (মুতাওয়াসসিতাহ আওয়াল)": { marhala: "মুতাওয়াসসিতাহ আওয়াল", jamatClass: "মিযান (৬ষ্ঠ শ্রেণী)", somoman: "নিম্ন মাধ্যমিক - ষষ্ঠ শ্রেণী" },
  "নাহবেমীর (মুতাওয়াসসিতাহ ছানী)": { marhala: "মুতাওয়াসসিতাহ ছানী", jamatClass: "নাহবেমীর (৭ম শ্রেণী)", somoman: "নিম্ন মাধ্যমিক - সপ্তম শ্রেণী" },
  "কুদূরী (সানাবিয়্যা আউয়াল)": { marhala: "সানাবিয়্যা আউয়াল", jamatClass: "কুদূরী (হেদায়াতুন্নাহু)", somoman: "মাধ্যমিক সমমান" },
  "শরহে বেকায়া (সানাবিয়্যা ছানী)": { marhala: "সানাবিয়্যা ছানী", jamatClass: "শরহে বেকায়া", somoman: "মাধ্যমিক সমমান" },
  "হেদায়া (ফজিলত আউয়াল)": { marhala: "ফজিলত আউয়াল", jamatClass: "হেদায়া (জালালাইন)", somoman: "স্নাতক সমমান" },
  "মেশকাত (ফজিলত ছানী)": { marhala: "ফজিলত ছানী", jamatClass: "মেশকাত", somoman: "স্নাতক সমমান" },
  "দাওরায়ে হাদিস (তাকমিল)": { marhala: "তাকমিল", jamatClass: "দাওরায়ে হাদীস", somoman: "স্নাতকোত্তর সমমান" }
};

export const DB_LINKS = {
  years: [
    { 
      label: "১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী", 
      sheetId: "", 
      sheetName: "১৪৪৭-৪৮",
      key: "year_1447" 
    },
    { 
      label: "১৪৪৬-৪৭ হিজরী/২০২৫-২৬ ঈসায়ী", 
      sheetId: "1B6BzLPVKGeRosVm0p_DbMk5tssfuQTWbSF5W97-31-A", 
      sheetName: "১৪৪৬-৪৭",
      key: "year_1446" 
    }
  ],
  logoUrl: "/png/Asset 4.png"
};

export * from './constants/studentStatuses';
