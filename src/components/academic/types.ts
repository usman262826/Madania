export interface AcademicDepartment {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface AcademicClass {
  id: string;
  name: string;
  departmentId: string;
  equivalent: string;
  isActive: boolean;
}

export interface AcademicBranch {
  id: string;
  name: string;
  classId: string;
  maxStudents: number;
  isActive: boolean;
}

export interface AcademicSubject {
  id: string;
  name: string;
  code: string;
  bookName: string;
  type: 'আবশ্যিক' | 'ঐচ্ছিক';
  totalMarks: number;
  isActive: boolean;
}

export interface AcademicClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  isMandatory: boolean;
}

export interface AcademicTeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
}

export interface AcademicExamDate {
  id: string;
  examName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface AcademicCostPackage {
  id: string;
  name: string;
  amount: number;
  type: string;
  description: string;
  isActive: boolean;
}

export interface AcademicEvaluationMetric {
  id: string;
  name: string;
  weight: number;
  description: string;
}
