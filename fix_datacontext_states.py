import re

with open('src/contexts/DataContext.tsx', 'r') as f:
    content = f.read()

missing_code = """  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  const [classFeeMapping, setClassFeeMapping] = useState<any>({});
  const [invoices, setInvoices] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [studentOverrides, setStudentOverrides] = useState<any>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [staffAttendance, setStaffAttendance] = useState<Record<string, any>>({});
  const [studentAttendance, setStudentAttendance] = useState<Record<string, any>>({});
  
  // Academic States
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [branches, setBranches] = useState<AcademicBranch[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [classSubjects, setClassSubjects] = useState<AcademicClassSubject[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<AcademicTeacherSubject[]>([]);
  const [examDates, setExamDates] = useState<AcademicExamDate[]>([]);
  const [evaluationMetrics, setEvaluationMetrics] = useState<AcademicEvaluationMetric[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const safeFetch = async <T,>(table: string, fallbackKey: string, defaultData: T[] = []): Promise<T[]> => {
    try {
      const data = await supabaseService.getAll(table);
      if (data && Array.isArray(data)) {
        localStorage.setItem(fallbackKey, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn(`Failed to fetch ${table} from Supabase, falling back to local storage:`, err);
    }
    const cached = localStorage.getItem(fallbackKey);
    return cached ? JSON.parse(cached) : defaultData;
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        migrateLocalStorageToSupabase('madrasah-students-db', 'students'),
        migrateLocalStorageToSupabase('madrasah-fee-heads', 'fee_heads'),
        migrateLocalStorageToSupabase('madrasah-class-fee-mapping', 'class_fee_mappings'),
        migrateLocalStorageToSupabase('madrasah-invoices-db', 'invoices'),
        migrateLocalStorageToSupabase('madrasah-staff-members-db', 'staff_members'),
        migrateLocalStorageToSupabase('madrasah-expenses-db', 'expenses'),
        migrateLocalStorageToSupabase('madrasah-student-overrides', 'student_overrides'),
        migrateLocalStorageToSupabase('madrasah-staff-attendance-db', 'staff_attendance'),
        migrateLocalStorageToSupabase('madrasah-student-attendance-db', 'student_attendance'),
        migrateLocalStorageToSupabase('acad_departments', 'acad_departments'),
        migrateLocalStorageToSupabase('acad_classes', 'acad_classes'),
        migrateLocalStorageToSupabase('acad_branches', 'acad_branches'),
        migrateLocalStorageToSupabase('acad_subjects', 'acad_subjects'),
        migrateLocalStorageToSupabase('acad_class_subjects', 'acad_class_subjects'),
        migrateLocalStorageToSupabase('acad_teacher_subjects', 'acad_teacher_subjects'),
        migrateLocalStorageToSupabase('acad_exam_dates', 'acad_exam_dates'),
        migrateLocalStorageToSupabase('acad_eval_metrics', 'acad_eval_metrics'),
        migrateLocalStorageToSupabase('madrasa_teachers', 'madrasa_teachers'),
      ]);

      const ["""

content = content.replace("export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {\n  const [", "export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {\n" + missing_code)

with open('src/contexts/DataContext.tsx', 'w') as f:
    f.write(content)
