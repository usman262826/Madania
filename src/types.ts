export interface Student {
  'শিক্ষার্থীর নাম'?: string;
  'পিতার নাম'?: string;
  'মাতার নাম'?: string;
  'জন্ম তারিখ'?: string;
  'অভিভাবকের মোবাইল'?: string;
  'ঠিকানা'?: string;
  'জামাত/শ্রেণী'?: string;
  'রেজিস্ট্রেশন/আইডি নম্বর'?: string;
  'রোল নম্বর'?: string;
  'শিক্ষার্থী ধরণ/স্ট্যাটাস'?: string;
  'সমমান'?: string;
  somoman?: string;
  academicYearLabel?: string;
  [key: string]: any;
}

export interface Application {
  id: string;
  name: string;
  mobile: string;
  class: string;
  fatherName: string;
  motherName: string;
  dob: string;
  birthReg: string;
  address: string;
  applyDate: string;
  altMobile?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'pending'; // Added 'pending' string constant for safety
  studentType?: string;
  academicYear?: string;
  jamat?: string;
  marhala?: string;
  somoman?: string;
  jamatClass?: string;
  email?: string;
  bloodGroup?: string;
  fullAddress?: string;
  prevMadrasa?: string;
  prevClass?: string;
  messagingApps?: string;
  roll?: string;
  comment?: string;
  applicationId?: string;
  [key: string]: any;
}

export interface Attendance {
  id: string;
  entityId: string; // studentId or staffId
  date: string;
  time?: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  note?: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  month: string;
  year: string;
  amount: number;
  type: 'monthly' | 'admission' | 'exam' | 'other';
  paymentDate: string;
  paymentTime?: string;
  status: 'paid' | 'pending' | 'partial';
  method?: string;
  receivedBy?: string;
  originalAmount?: number;
  dueAmount?: number;
}

export interface SalaryPayment {
  id: string;
  staffId: string;
  month: string;
  year: string;
  amount: number;
  date: string;
  time: string;
  method: string;
  note?: string;
}

export interface Staff {
  id: string;
  name: string;
  designation: string;
  mobile: string;
  joiningDate: string;
  salary: number;
  attendanceHistory?: Attendance[];
  salaryHistory?: SalaryPayment[];
  [key: string]: any;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  spentBy?: string;
}

export type Theme = 'light' | 'dark';

declare module 'html2pdf.js';


