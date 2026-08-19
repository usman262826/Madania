import React, { useState, useEffect, useMemo } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { GlobalSearchModal } from "./components/search/GlobalSearchModal";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { Analytics } from "./components/dashboard/Analytics";
import { YearlyStudentGrid } from "./components/students/YearlyStudentGrid";
import { PendingApplications } from "./components/pending/PendingApplications";
import { Student, Application, Theme } from "./types";
import { DB_LINKS, JAMAT_LIST } from "./constants";
import { enToBnNumber, cn, normalizeStudentRecord } from "./lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ClipboardList,
  Archive,
  CheckCircle2,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  LayoutGrid,
  TrendingUp,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  Loader2,
  Moon,
  Sun,
  LogOut,
  AlertCircle,
  Users,
  UserCheck,
  Menu,
  Bell,
} from "lucide-react";
import { AdmissionForm } from "./components/admission/AdmissionForm";
import { StudentFees } from "./components/finance/StudentFees";
import { StaffSalary } from "./components/finance/StaffSalary";
import { Expenses } from "./components/finance/Expenses";
import { IncomeManager } from "./components/finance/IncomeManager";
import { StudentAttendance } from "./components/attendance/StudentAttendance";
import { StaffAttendance } from "./components/attendance/StaffAttendance";
import { TeacherAttendance } from "./components/attendance/TeacherAttendance";
import {
  AdmissionNew,
  AdmissionMultiple,
  AdmissionFilters,
  IDCardDesign,
  IDCardPrint,
  ExamList,
  ExamResults,
  ExamTabulation,
  ExamAdmitCard,
  TestimonialGenerator,
  AttendanceHistoryView,
  FinanceFeesStatement,
  OtherFundsManager,
  NoticeBoard,
  TeachersManager,
  MadrasahProblems,
  MadrasahSettings,
} from "./components/portal/PortalModules";
import {
  AdmissionInquiry,
  AdmissionFormViewer,
  StudentInactive,
  StudentJamats,
  StudentNew,
  StudentAll,
  AttendanceReportViewer,
  StaffAttendanceReportViewer,
  ExamRoutineManager,
  SeatPlanGenerator,
  MarksheetLocker,
  CertificateGenerator,
  AcademicStructureGrid,
  DonationLedger,
  FinanceDetailLedger,
  ExpensesLedger,
  InvestmentManager,
  ReportsDashboard,
  StaffHRManager,
  SRMManager,
  ParentsManager,
  UsersManager,
  ServicesDashboard,
  SpecializedSettingsManager,
} from "./components/portal/ExtraPortalModules";
import { SRSViewer } from "./components/portal/SRSViewer";
import { AcademicDepartments } from "./components/portal/AcademicDepartments";
import { AcademicDepartmentsManager } from "./components/academic/AcademicDepartmentsManager";
import { AcademicClassManager } from "./components/academic/AcademicClassManager";
import { AcademicBranchManager } from "./components/academic/AcademicBranchManager";
import { AcademicSubjectManager } from "./components/academic/AcademicSubjectManager";
import { AcademicClassSubjectAssign } from "./components/academic/AcademicClassSubjectAssign";
import { AcademicTeacherSubjectAssign } from "./components/academic/AcademicTeacherSubjectAssign";
import { AcademicExamDatesManager } from "./components/academic/AcademicExamDatesManager";
import { AcademicEvaluationMetrics } from "./components/academic/AcademicEvaluationMetrics";
import { StudentUpdateAll } from "./components/students/StudentUpdateAll";
import { GlobalRecycleBin } from "./components/portal/GlobalRecycleBin";
import { FeesCostPackageManager } from "./components/finance/FeesCostPackageManager";
import { ProfilePage } from "./components/profile/ProfilePage";

import { useData } from "./contexts/DataContext";

const manageApplication = async (action: string, id: string, updatedData?: any, app?: any) => {
  try {
    const localData = localStorage.getItem('madrasa_pending_applications');
    if (localData) {
      let list = JSON.parse(localData);
      if (action === "edit" && updatedData) {
        list = list.map((item: any) => item.id === id ? { ...item, ...updatedData } : item);
      } else if (action === "reject") {
        list = list.filter((item: any) => item.id !== id);
      }
      localStorage.setItem('madrasa_pending_applications', JSON.stringify(list));
    }
    return true;
  } catch (err) {
    console.error("Error managing application:", err);
    return true;
  }
};

export default function App() {
  const { studentOverrides, students: contextStudents, isLoading: isSupabaseLoading, refreshData: refreshSupabaseData, updateData: updateSupabaseData } = useData();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState<Theme>("light");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [baseStudents, setBaseStudents] = useState<Student[]>([]);
  const [loginError, setLoginError] = useState("");
  const [sidebarMode, setSidebarMode] = useState<"hidden" | "mini" | "expanded">(() => {
    const saved = localStorage.getItem('sidebar-mode');
    return (saved === "hidden" || saved === "mini" || saved === "expanded") ? saved : "mini";
  });

  useEffect(() => {
    localStorage.setItem('sidebar-mode', sidebarMode);
  }, [sidebarMode]);

  // Back key / history navigation state helpers
  const isPopStateRef = React.useRef(false);

  // Login form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Current user state
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("madrasa_current_user");
      return saved ? JSON.parse(saved) : { name: "এডমিন মহোদয়", role: "admin", email: "admin@madrasah.edu.bd" };
    } catch {
      return { name: "এডমিন মহোদয়", role: "admin", email: "admin@madrasah.edu.bd" };
    }
  });

  // Data states
  const [pending, setPending] = useState<Application[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState<string>(
    "১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী",
  );
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Apply theme to body
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
      document.documentElement.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const [editingApplication, setEditingApplication] =
    useState<Application | null>(null);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);
    
    const cleanInput = email.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const { supabase } = await import('./lib/supabaseClient');
      
      // 1. Check in Supabase `app_users` table directly
      let authenticatedUser: any = null;

      try {
        const { data: dbUsers, error: dbErr } = await supabase
          .from('app_users')
          .select('*')
          .or(`email.ilike.${cleanInput},phone.ilike.${cleanInput}`);

        if (dbUsers && dbUsers.length > 0) {
          const u = dbUsers[0];
          // Check password: match plaintext or password_hash
          if (u.password_hash === cleanPass || u.password === cleanPass) {
            authenticatedUser = {
              id: u.id,
              name: u.name,
              role: u.role || 'admin',
              designation: u.designation || (u.role === 'admin' ? 'এডমিন' : 'কর্মকর্তা'),
              email: u.email || u.phone,
              mobile: u.phone || u.email,
              status: u.status || 'Approved',
              loginPermitted: u.status === 'Approved',
              password: cleanPass
            };
          }
        }
      } catch (dbErr) {
        console.warn("app_users database lookup skipped:", dbErr);
      }

      // 2. If not found in app_users, check Supabase madrasah_app_state sync
      if (!authenticatedUser) {
        try {
          const { data: stateData } = await supabase
            .from('madrasah_app_state')
            .select('*')
            .in('id', ['madrasa_users', 'madrasa_teachers']);

          let cloudUsers: any[] = [];
          if (stateData && stateData.length > 0) {
            stateData.forEach((row: any) => {
              const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
              if (Array.isArray(parsed)) {
                cloudUsers.push(...parsed);
              }
            });
          }

          const matchedCloud = cloudUsers.find(u => {
            const uMobile = (u.mobile || '').toString().trim().toLowerCase();
            const uEmail = (u.email || '').toString().trim().toLowerCase();
            const uPhone = (u.phone || '').toString().trim().toLowerCase();
            const uId = (u.id || '').toString().trim().toLowerCase();

            const isMatch = uMobile === cleanInput || uEmail === cleanInput || uPhone === cleanInput || uId === cleanInput;
            if (!isMatch) return false;
            return (u.password || '').toString().trim() === cleanPass;
          });

          if (matchedCloud) {
            authenticatedUser = {
              id: matchedCloud.id || 'USR-01',
              name: matchedCloud.name || 'ব্যবহারকারী',
              role: matchedCloud.role || 'teacher',
              designation: matchedCloud.designation || 'কর্মকর্তা',
              email: matchedCloud.email || matchedCloud.mobile || '',
              mobile: matchedCloud.mobile || matchedCloud.email || '',
              status: matchedCloud.status || (matchedCloud.loginPermitted ? 'Approved' : 'Pending'),
              loginPermitted: matchedCloud.loginPermitted !== false && matchedCloud.status !== 'Blocked' && matchedCloud.status !== 'Pending',
              password: cleanPass
            };
          }
        } catch (stateErr) {
          console.warn("madrasah_app_state lookup skipped:", stateErr);
        }
      }

      // 3. Check local saved users cache
      if (!authenticatedUser) {
        let localUsers: any[] = [];
        try {
          const savedU = localStorage.getItem("madrasa_users");
          if (savedU) localUsers.push(...JSON.parse(savedU));
          const savedT = localStorage.getItem("madrasa_teachers");
          if (savedT) localUsers.push(...JSON.parse(savedT));
        } catch (e) { console.error(e); }

        const matchedLocal = localUsers.find(u => {
          const uMobile = (u.mobile || '').toString().trim().toLowerCase();
          const uEmail = (u.email || '').toString().trim().toLowerCase();
          const uPhone = (u.phone || '').toString().trim().toLowerCase();
          const uId = (u.id || '').toString().trim().toLowerCase();

          const isMatch = uMobile === cleanInput || uEmail === cleanInput || uPhone === cleanInput || uId === cleanInput;
          if (!isMatch) return false;
          return (u.password || '').toString().trim() === cleanPass;
        });

        if (matchedLocal) {
          authenticatedUser = {
            id: matchedLocal.id || 'USR-01',
            name: matchedLocal.name || 'ব্যবহারকারী',
            role: matchedLocal.role || 'teacher',
            designation: matchedLocal.designation || 'কর্মকর্তা',
            email: matchedLocal.email || matchedLocal.mobile || '',
            mobile: matchedLocal.mobile || matchedLocal.email || '',
            status: matchedLocal.status || (matchedLocal.loginPermitted ? 'Approved' : 'Pending'),
            loginPermitted: matchedLocal.loginPermitted !== false && matchedLocal.status !== 'Blocked' && matchedLocal.status !== 'Pending',
            password: cleanPass
          };
        }
      }

      // 4. Initial setup fallback (Only for first-time bootstrapping if no users exist in database)
      if (!authenticatedUser) {
        // We only allow if explicit match with system admin configuration
        const savedAdmins = localStorage.getItem("madrasa_users");
        if (!savedAdmins) {
          if ((cleanInput === 'admin@madrasah.com' || cleanInput === '01700000000' || cleanInput === 'admin') && cleanPass === '123456') {
            authenticatedUser = {
              id: 'ADM01',
              name: 'মুহতামিম সাহেব (সুপার এডমিন)',
              role: 'admin',
              designation: 'প্রধান প্রশাসনিক কর্মকর্তা',
              mobile: '01700000000',
              email: 'admin@madrasah.com',
              status: 'Approved',
              loginPermitted: true,
              password: cleanPass
            };
          }
        }
      }

      if (authenticatedUser) {
        if (authenticatedUser.loginPermitted === false || authenticatedUser.status === 'Pending' || authenticatedUser.status === 'Blocked') {
          setLoginError("আপনার একাউন্টটি এডমিনের অনুমোদনের অপেক্ষায় আছে অথবা নিষ্ক্রিয় করা হয়েছে। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।");
          setIsLoading(false);
          return;
        }

        setCurrentUser(authenticatedUser);
        setIsLoggedIn(true);
        localStorage.setItem("madrasa_admin_auth", "true");
        localStorage.setItem("madrasa_current_user", JSON.stringify(authenticatedUser));
        localStorage.setItem("madrasa_user_password", cleanPass);
        setIsLoading(false);
        return;
      }

      setLoginError("মোবাইল নম্বর/ইমেইল বা পাসওয়ার্ড ভুল। সঠিক তথ্য দিন।");
    } catch (err: any) {
      console.error("Login error:", err);
      setLoginError("লগইন করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  };

  // Auth check on mount & PopState listener initialization
  useEffect(() => {
    const checkUser = async () => {
      const auth = localStorage.getItem("madrasa_admin_auth");
      if (auth === "true") setIsLoggedIn(true);
      loadAllData();
    };

    checkUser();

    const handleHydration = () => {
      const auth = localStorage.getItem("madrasa_admin_auth");
      if (auth === "true") setIsLoggedIn(true);
      
      const savedUser = localStorage.getItem("madrasa_current_user");
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
      
      const savedPending = localStorage.getItem('madrasa_pending_applications');
      if (savedPending) setPending(JSON.parse(savedPending));
      
      const savedSidebar = localStorage.getItem('sidebar-mode');
      if (savedSidebar === "hidden" || savedSidebar === "mini" || savedSidebar === "expanded") {
        setSidebarMode(savedSidebar);
      }
    };
    window.addEventListener('supabase_hydration_complete', handleHydration);

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.activeTab) {
        isPopStateRef.current = true;
        setActiveTab(event.state.activeTab);
        if (event.state.jumpToStudentId) {
          setJumpToStudentId(event.state.jumpToStudentId);
        } else {
          setJumpToStudentId(null);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener('supabase_hydration_complete', handleHydration);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Custom global navigation tab handler for interconnected portal modules
  useEffect(() => {
    const handleNavigateTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.tab) {
        const targetTab = customEvent.detail.tab === 'students' ? 'student-all' : customEvent.detail.tab;
        setActiveTab(targetTab);
        if (customEvent.detail.studentId) {
          setJumpToStudentId(String(customEvent.detail.studentId));
        }
      }
    };
    window.addEventListener('navigate-tab', handleNavigateTab);
    return () => {
      window.removeEventListener('navigate-tab', handleNavigateTab);
    };
  }, []);

  // Synchronize activeTab transitions to HTML5 History entries
  useEffect(() => {
    if (isLoggedIn) {
      // Auto scroll to top when changing tabs so content is immediately visible
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (isPopStateRef.current) {
        isPopStateRef.current = false;
        return;
      }

      const currentState = window.history.state;
      if (!currentState) {
        window.history.replaceState({ activeTab }, "", "");
      } else if (currentState.activeTab !== activeTab) {
        window.history.pushState({ activeTab }, "", "");
      }
    }
  }, [activeTab, isLoggedIn]);

  
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      setBaseStudents(contextStudents || []);
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseLoading) {
      setBaseStudents(contextStudents || []);
      setIsLoading(false);
    }
  }, [contextStudents, isSupabaseLoading]);


  const students = useMemo(() => {
    const list = Array.isArray(baseStudents) ? baseStudents : [];
    // 1. Get all IDs that exist in the sheet
    const sheetIds = new Set(list.map(s => s?.["রেজিস্ট্রেশন/আইডি নম্বর"] || s?.id));

    // 2. Map existing students and apply overrides
    const mergedExisting = list.map((s) => {
      if (!s) return s;
      const key = s["রেজিস্ট্রেশন/আইডি নম্বর"] || s.id;
      if (key && studentOverrides && studentOverrides[key]) {
        return { ...s, ...studentOverrides[key] };
      }
      return s;
    });

    // 3. Add students that exist ONLY in overrides (newly added students)
    const overrideOnlyStudents: Student[] = [];
    if (studentOverrides) {
      Object.keys(studentOverrides).forEach(key => {
        if (!sheetIds.has(key)) {
          const overrideData = studentOverrides[key];
          // Ensure it has basic student fields to be compatible
          if (overrideData && (overrideData["শিক্ষার্থীর নাম"] || overrideData.name)) {
            overrideOnlyStudents.push({
              id: key,
              "রেজিস্ট্রেশন/আইডি নম্বর": key,
              academicYearLabel: overrideData["শিক্ষাবর্ষ"] || academicYear,
              ...overrideData
            } as any);
          }
        }
      });
    }

    const allStudents = [...mergedExisting, ...overrideOnlyStudents];

    // Filter out deleted students (where isDeleted is true in studentOverrides)
    return allStudents.filter(s => {
      if (!s) return false;
      const key = s["রেজিস্ট্রেশন/আইডি নম্বর"] || s.id;
      if (key && studentOverrides && studentOverrides[key]?.isDeleted) {
        return false;
      }
      return !s.isDeleted;
    });
  }, [baseStudents, studentOverrides, academicYear]);

  const handleNewApplication = (appData: any) => {
    const newApp: Application = {
      id: appData.applicationId?.toString() || "",
      name: appData.fullName,
      mobile: appData.mobile,
      class: appData.desiredClass,
      fatherName: appData.fatherName,
      motherName: appData.motherName,
      dob: appData.dob,
      birthReg: appData.birthReg,
      address: appData.fullAddress,
      applyDate: appData.applyDate,
      status: "pending",
      studentType: appData.studentType,
    };
    // Prevent duplicate pending by ID
    setPending((prev) => {
      if (prev.some((p) => p.id === newApp.id)) return prev;
      const updated = [newApp, ...prev];
      localStorage.setItem("madrasa_pending_queue", JSON.stringify(updated));
      return updated;
    });
    setShowAdmissionForm(false);
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    const key = updatedStudent["রেজিস্ট্রেশন/আইডি নম্বর"] || updatedStudent.id;
    if (key) {
      setIsLoading(true);
      try {
        await updateSupabaseData('students', updatedStudent, String(key));
      } catch (error) {
        console.error("Error updating student:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    localStorage.removeItem("madrasa_admin_auth");
  };

  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  const handleAcceptApplication = async (id: string, selectedYear: string) => {
    if (isProcessingId === id || isLoading) return;

    const app = pending.find((p) => p.id === id);
    if (app) {
      setIsProcessingId(id);
      setIsLoading(true);
      try {
        // Step 1: Mark as approved in Pending Sheet (optional, ignore errors if from Supabase only)
        await manageApplication(
          "approve",
          id,
          undefined,
          app,
        ).catch(() => false);

        // Map the full application data to a Student record format
        const timestamp = new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' });
        const newStudent = normalizeStudentRecord({
          ...app,
          "শিক্ষার্থীর নাম": app.name || app['শিক্ষার্থীর নাম'],
          "পিতার নাম": app.fatherName || app['পিতার নাম'],
          "মাতার নাম": app.motherName || app['মাতার নাম'],
          "মোবাইল (মা)": app.mobile || app['মোবাইল (মা)'],
          "মোবাইল (বাবা/ভাই)": app.altMobile || app['মোবাইল (বাবা/ভাই)'] || app.mobile,
          "জন্ম তারিখ": app.dob || app['জন্ম তারিখ'],
          "জন্ম নিবন্ধন": app.birthReg || app['জন্ম নিবন্ধন'] || app['জন্ম নিবন্ধন নাম্বার'] || '',
          "জন্ম নিবন্ধন নাম্বার": app.birthReg || app['জন্ম নিবন্ধন'] || app['জন্ম নিবন্ধন নাম্বার'] || '',
          "ঠিকানা": app.address || app.fullAddress || app['ঠিকানা'] || "",
          "জামাত": app.class || app.jamatClass || app['জামাত'] || "",
          "শিক্ষার্থী ধরণ": app.studentType || app['শিক্ষার্থী ধরণ'] || "নতুন",
          "পূর্বের মাদ্রাসা": app.prevMadrasa || app['পূর্বের মাদ্রাসা'] || "",
          "পূর্বের জামাত": app.prevClass || app['পূর্বের জামাত'] || "",
          "শিক্ষার্থী ধরণ/স্ট্যাটাস": app['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || "সক্রিয়",
          "স্ট্যাটাস": "সক্রিয়",
          "শিক্ষাবর্ষ": selectedYear,
          academicYearLabel: selectedYear,
          "আবেদন নং": app.applicationNo || app.id || app['আবেদন নং'],
          "রক্তের গ্রুপ": app.bloodGroup || app['রক্তের গ্রুপ'] || "",
          "ইমেইল": app.email || app['ইমেইল'] || "",
          "মারহালা": app.marhala || app['মারহালা'] || "",
          "সমমান": app.somoman || app['সমমান'] || "",
          "মঞ্জুরের তারিখ ও সময়": timestamp,
          isDeleted: false,
        }, selectedYear);

        let syncSuccess = true;
        try {
          await updateSupabaseData('students', newStudent);
        } catch (err) {
          console.error("Error approving application to students table:", err);
          syncSuccess = false;
        }

        if (syncSuccess) {
          // Delete from localStorage if exists
          try {
            const localData = localStorage.getItem('madrasa_pending_applications');
            if (localData) {
              const list = JSON.parse(localData);
              const filtered = list.filter((item: any) => item.id !== id);
              localStorage.setItem('madrasa_pending_applications', JSON.stringify(filtered));
            }
          } catch (err) {
            console.error("Error deleting pending application from local storage:", err);
          }

          const updatedPending = pending.filter((p) => p.id !== id);
          setPending(updatedPending);
          alert("আবেদনটি সফলভাবে মঞ্জুর এবং মেইন ডাটাবেসে যুক্ত করা হয়েছে।");
          await loadAllData();
        } else {
          alert(
            "আবেদনটি মঞ্জুর হয়েছে কিন্তু মেইন ডাটাবেসে পাঠাতে সমস্যা হয়েছে।",
          );
        }
      } catch (err) {
        console.error("Sync error:", err);
        alert("আবেদন অনুমোদন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      } finally {
        setIsLoading(false);
        setIsProcessingId(null);
      }
    }
  };

  const handleEditApplication = async (id: string, updatedData: any) => {
    setIsLoading(true);
    try {
      const app = pending.find((p) => p.id === id);
      const success = await manageApplication("edit", id, updatedData, app);
      if (success) {
        await loadAllData();
        alert("আবেদনটি সফলভাবে সংশোধন করা হয়েছে। এখন এটি মঞ্জুর করা যাবে।");
      }
    } catch (error) {
      alert("সংশোধন ব্যর্থ হয়েছে।");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectApplication = async (id: string) => {
    setIsLoading(true);
    try {
      const app = pending.find((p) => p.id === id);
      const googleSuccess = await manageApplication("reject", id, undefined, app).catch(() => false);

      // Try deleting from local storage
      let localSuccess = false;
      try {
        const localData = localStorage.getItem('madrasa_pending_applications');
        if (localData) {
          const list = JSON.parse(localData);
          const filtered = list.filter((item: any) => item.id !== id);
          localStorage.setItem('madrasa_pending_applications', JSON.stringify(filtered));
          localSuccess = true;
        }
      } catch (e) {
        console.error("Local storage reject delete error:", e);
      }

      if (googleSuccess || localSuccess) {
        alert("আবেদনটি সফলভাবে বাতিল করা হয়েছে।");
        await loadAllData();
      } else {
        alert("বাতিল করতে সমস্যা হয়েছে।");
      }
    } catch (error) {
      alert("বাতিল করতে সমস্যা হয়েছে।");
    } finally {
      setIsLoading(false);
    }
  };

  const academicFilteredStudents = useMemo(() => {
    const list = Array.isArray(students) ? students : [];
    return list.filter((s) => s && s.academicYearLabel === academicYear);
  }, [students, academicYear]);

  const academicFilteredPending = useMemo(() => {
    const pendingList = Array.isArray(pending) ? pending : [];
    const studentsList = Array.isArray(students) ? students : [];
    return pendingList.filter((p) => {
      if (!p) return false;
      // 1. Check if already in main database (by ID, application No, or robust field match)
      const existsInMain = studentsList.some((s) => {
        if (!s) return false;
        // Direct ID or Application Number match
        const sAppNo = s["আবেদন নং"] || s.applicationNo || "";
        const pAppNo = p.applicationNo || p.id || "";

        const hasIdMatch =
          (s.academicYearLabel === academicYear || !academicYear) &&
          (String(s["রেজিস্ট্রেশন/আইডি নম্বর"]) === String(p.id) ||
            String(s["রেজিস্ট্রেশন/আইডি নম্বর"]) === String(p.applicationNo));

        const hasAppNoMatch =
          sAppNo && pAppNo && String(sAppNo) === String(pAppNo);

        if (hasIdMatch || hasAppNoMatch) return true;

        // Custom string normalizer
        const cleanStr = (val: any) =>
          String(val || "")
            .toLowerCase()
            .replace(/['"\s\-\/\(\)]/g, "")
            .trim();

        const sName = cleanStr(s["শিক্ষার্থীর নাম"] || s.name);
        const pName = cleanStr(p["শিক্ষার্থীর নাম"] || p.name);

        const sMobile = cleanStr(
          s["মোবাইল (মা)"] || s["অভিভাবকের মোবাইল"] || s.mobile,
        );
        const pMobile = cleanStr(p["মোবাইল (মা)"] || p.mobile);

        const sFather = cleanStr(s["পিতার নাম"] || s.fatherName);
        const pFather = cleanStr(p["পিতার নাম"] || p.fatherName);

        // Robust Backup matching:
        // 1. Name and Mobile matches exactly
        const nameAndMobileMatch =
          sName &&
          pName &&
          sMobile &&
          pMobile &&
          sName === pName &&
          sMobile === pMobile;

        // 2. Name and Father's Name matches exactly
        const nameAndFatherMatch =
          sName &&
          pName &&
          sFather &&
          pFather &&
          sName === pName &&
          sFather === pFather;

        return nameAndMobileMatch || nameAndFatherMatch;
      });

      // We filter out from "pending" dashboard if it exists in main database (means approved)
      if (existsInMain) return false;

      // Only show pending applications
      if (p.status !== "pending") return false;

      // 2. Filter by selected academic year if specified
      if (!p.academicYear || p.academicYear.trim() === "") return true;
      return p.academicYear === academicYear;
    });
  }, [pending, academicYear, students]);

  const academicFilteredArchive = useMemo(() => {
    const pendingList = Array.isArray(pending) ? pending : [];
    const studentsList = Array.isArray(students) ? students : [];
    return pendingList
      .map((p) => {
        if (!p) return null;
        // Check if already in main database (by ID, application No, or robust field match)
        const existsInMain = studentsList.some((s) => {
          if (!s) return false;
          // Direct ID or Application Number match
          const sAppNo = s["আবেদন নং"] || s.applicationNo || "";
          const pAppNo = p.applicationNo || p.id || "";

          const hasIdMatch =
            (s.academicYearLabel === academicYear || !academicYear) &&
            (String(s["রেজিস্ট্রেশন/আইডি নম্বর"]) === String(p.id) ||
              String(s["রেজিস্ট্রেশন/আইডি নম্বর"]) === String(p.applicationNo));

          const hasAppNoMatch =
            sAppNo && pAppNo && String(sAppNo) === String(pAppNo);

          if (hasIdMatch || hasAppNoMatch) return true;

          // Custom string normalizer
          const cleanStr = (val: any) =>
            String(val || "")
              .toLowerCase()
              .replace(/['"\s\-\/\(\)]/g, "")
              .trim();

          const sName = cleanStr(s["শিক্ষার্থীর নাম"] || s.name);
          const pName = cleanStr(p["শিক্ষার্থীর নাম"] || p.name);

          const sMobile = cleanStr(
            s["মোবাইল (মা)"] || s["অভিভাবকের মোবাইল"] || s.mobile,
          );
          const pMobile = cleanStr(p["মোবাইল (মা)"] || p.mobile);

          const sFather = cleanStr(s["পিতার নাম"] || s.fatherName);
          const pFather = cleanStr(p["পিতার নাম"] || p.fatherName);

          // Robust Backup matching:
          // 1. Name and Mobile matches exactly
          const nameAndMobileMatch =
            sName &&
            pName &&
            sMobile &&
            pMobile &&
            sName === pName &&
            sMobile === pMobile;

          // 2. Name and Father's Name matches exactly
          const nameAndFatherMatch =
            sName &&
            pName &&
            sFather &&
            pFather &&
            sName === pName &&
            sFather === pFather;

          return nameAndMobileMatch || nameAndFatherMatch;
        });

        return {
          ...p,
          status: existsInMain ? ("accepted" as const) : p.status,
        };
      })
      .filter((p): p is Application => {
        if (!p) return false;
        // Filter by selected academic year if specified
        if (!p.academicYear || p.academicYear.trim() === "") return true;
        return p.academicYear === academicYear;
      });
  }, [pending, academicYear, students]);

  // Global Search logic
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [globalSearchInitialQuery, setGlobalSearchInitialQuery] = useState("");
  const [jumpToStudentId, setJumpToStudentId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Keyboard shortcut (Ctrl + K or Cmd + K) to toggle global super search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleOpenGlobalSearch = (q: string = "") => {
    setGlobalSearchInitialQuery(q);
    setIsGlobalSearchOpen(true);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();

    // Search in students
    const studentMatches = students
      .filter(
        (s) =>
          s["শিক্ষার্থীর নাম"]?.toLowerCase().includes(query) ||
          s["রেজিস্ট্রেশন/আইডি নম্বর"]?.toString().includes(query) ||
          s["পিতার নাম"]?.toLowerCase().includes(query) ||
          s["অভিভাবকের মোবাইল"]?.includes(query),
      )
      .slice(0, 5)
      .map((s) => ({
        type: "student",
        id: s["রেজিস্ট্রেশন/আইডি নম্বর"],
        name: s["শিক্ষার্থীর নাম"],
        sub: `${s["জামাত/শ্রেণী"]} | রোল: ${s["রোল নম্বর"]}`,
        original: s,
      }));

    // No staff demo data as requested by user
    const staffMembers: any[] = [];

    const staffMatches = staffMembers
      .filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.id.includes(query) ||
          s.mobile.includes(query),
      )
      .map((s) => ({
        type: "staff",
        id: s.id,
        name: s.name,
        sub: s.designation,
        original: s,
      }));

    return [...studentMatches, ...staffMatches];
  }, [searchQuery, students]);

  const getHijriDate = (date: Date) => {
    try {
      return new Intl.DateTimeFormat("bn-BD-u-ca-islamic-civil", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch (e) {
      return "";
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 relative overflow-hidden font-hind-siliguri">
        {/* Animated Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary-light/10 rounded-full blur-[100px] animate-pulse-slow" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div className="bg-card glass p-10 rounded-[2.5rem] shadow-2xl border border-white/30 text-center relative z-10 transition-all">
            <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30 rotate-3 hover:rotate-0 transition-transform">
              <GraduationCap className="text-white" size={44} />
            </div>
            <h1 className="text-2xl font-black text-text-main mb-1 tracking-tighter leading-none">
              অ্যাডমিন প্রবেশ
            </h1>
            <p className="text-text-light/50 text-[10px] font-black uppercase tracking-[0.3em] mb-10">
              Madrasa Portal v2.0
            </p>

            <form onSubmit={handleLogin} className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-light/40 uppercase tracking-widest ml-1">
                  ইমেইল বা মোবাইল নম্বর
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-text-light/30 group-focus-within:text-primary transition-colors"
                    size={18}
                  />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-step-bg border border-border-main rounded-2xl font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    placeholder="admin@madania.com অথবা 019..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-light/40 uppercase tracking-widest ml-1">
                  পাসওয়ার্ড / পিন
                </label>
                <div className="relative group">
                  <Lock
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-text-light/30 group-focus-within:text-primary transition-colors"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-12 py-4 bg-step-bg border border-border-main rounded-2xl font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    placeholder="১২৩৪৫৬"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light/30 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <p className="text-error text-[10px] font-black uppercase tracking-widest bg-error/10 p-4 rounded-xl border border-error/20 flex items-center gap-2">
                  <AlertCircle size={14} /> {loginError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all duration-300"
              >
                প্যানেলে প্রবেশ করুন
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-border-main/50 text-center">
              <p className="text-[8px] text-text-light/30 font-black uppercase tracking-[0.4em]">
                Integrated School Ecosystem
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex font-hind-siliguri overflow-x-hidden relative animate-fade-in">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        onLogout={handleLogout}
        sidebarMode={sidebarMode}
        setSidebarMode={setSidebarMode}
        isMobileDrawerOpen={isMobileDrawerOpen}
        setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        currentUser={currentUser}
      />

      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        isMobileDrawerOpen={isMobileDrawerOpen}
      />

      <main
        className={cn(
          "flex-1 min-w-0 min-h-screen pb-32 pt-0 transition-all duration-300",
          sidebarMode === "hidden" ? "lg:ml-0" : sidebarMode === "mini" ? "lg:ml-[70px]" : "lg:ml-64",
        )}
      >
        <Header
          sidebarMode={sidebarMode}
          setSidebarMode={setSidebarMode}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSearchResults={showSearchResults}
          setShowSearchResults={setShowSearchResults}
          searchResults={searchResults}
          setJumpToStudentId={setJumpToStudentId}
          setActiveTab={setActiveTab}
          pendingApplications={[]}
          theme={theme}
          setTheme={setTheme}
          onLogout={handleLogout}
          activeTab={activeTab}
          currentUser={currentUser}
          onOpenGlobalSearch={handleOpenGlobalSearch}
        />

        <div className="px-4 lg:px-8 py-4 lg:py-6 lg:pb-10">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dash"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <Analytics
                  students={students}
                  pending={academicFilteredPending}
                  selectedYear={academicYear}
                  onYearChange={setAcademicYear}
                  setActiveTab={setActiveTab}
                />
              </motion.div>
            )}

            {(activeTab === "students" ||
              activeTab === "admission-list" ||
              activeTab === "student-jamats") && (
              <motion.div
                key="students"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <YearlyStudentGrid
                  students={students}
                  externalSelectedYear={academicYear}
                  jumpToStudentId={jumpToStudentId}
                  onJumpComplete={() => setJumpToStudentId(null)}
                  onUpdateStudent={handleUpdateStudent}
                  initialSelectedClass={selectedClassFilter}
                  onClearInitialClass={() => setSelectedClassFilter(null)}
                />
              </motion.div>
            )}

            {activeTab === "admission-new" && (
              <motion.div
                key="admission-new"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <AdmissionNew
                  students={students}
                  onSave={async (ns: any) => {
                    setIsLoading(true);
                    try {
                      const id = String(ns['রেজিস্ট্রেশন/আইডি'] || ns['রেজিস্ট্রেশন/আইডি নম্বর'] || ns['আবেদন নং'] || ns.id || Math.floor(Math.random() * 900000 + 100000).toString()).trim();
                      
                      const studentData = normalizeStudentRecord({
                        ...ns,
                        id,
                        "রেজিস্ট্রেশন/আইডি নম্বর": id,
                        "রেজিস্ট্রেশন/আইডি": id,
                        "শিক্ষাবর্ষ": ns['শিক্ষাবর্ষ'] || academicYear,
                        academicYearLabel: ns['শিক্ষাবর্ষ'] || academicYear
                      }, academicYear);

                      await updateSupabaseData('students', studentData, id);
                      setBaseStudents(prev => {
                        const existingList = Array.isArray(prev) ? prev : [];
                        const filteredOld = existingList.filter(s => String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim() !== id);
                        return [studentData, ...filteredOld];
                      });
                    } catch (error: any) {
                      console.error("Error saving student directly:", error);
                      throw error;
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  academicYear={academicYear}
                  setActiveTab={setActiveTab}
                />
              </motion.div>
            )}

            {activeTab === "admission-multiple" && (
              <motion.div
                key="admission-multiple"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <AdmissionMultiple
                  students={students}
                  onSaveBatch={async (nsList: any[]) => {
                    setIsLoading(true);
                    try {
                      const payloads = nsList.map((ns, i) => {
                        const id = String(ns['রেজিস্ট্রেশন/আইডি'] || ns['রেজিস্ট্রেশন/আইডি নম্বর'] || ns['আবেদন নং'] || ns.id || (Math.floor(Math.random() * 900000 + 100000).toString() + '-' + i)).trim();
                        return normalizeStudentRecord({ 
                          ...ns, 
                          id, 
                          "রেজিস্ট্রেশন/আইডি নম্বর": id, 
                          "রেজিস্ট্রেশন/আইডি": id,
                          "শিক্ষাবর্ষ": ns['শিক্ষাবর্ষ'] || academicYear,
                          academicYearLabel: ns['শিক্ষাবর্ষ'] || academicYear,
                          "জামাত/শ্রেণী": ns['জামাত/শ্রেণী'] || ns['জামাত'] || ns.class || '',
                          "শাখা": ns['শাখা'] || ns.branch || 'ক',
                          "অভিভাবকের মোবাইল": ns['মোবাইল (মা)'] || ns['অভিভাবকের মোবাইল'] || ns['মোবাইল (বাবা/ভাই)'] || ns.mobile || '',
                          "মোবাইল (মা)": ns['মোবাইল (মা)'] || ns['অভিভাবকের মোবাইল'] || ns.mobile || '',
                          "মোবাইল (বাবা/ভাই)": ns['মোবাইল (বাবা/ভাই)'] || ns['বিকল্প মোবাইল'] || ns.altMobile || '',
                          "জন্ম নিবন্ধন নাম্বার": ns['জন্ম নিবন্ধন নাম্বার'] || ns['জন্ম নিবন্ধন সনদ নম্বর'] || ns['জন্ম নিবন্ধন'] || ns.birthReg || '',
                          "শিক্ষার্থী ধরণ": ns['শিক্ষার্থী ধরণ'] || 'আবাসিক',
                          "শিক্ষার্থী ধরণ/স্ট্যাটাস": ns['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || 'সক্রিয়',
                          "স্ট্যাটাস": ns['স্ট্যাটাস'] || 'Active',
                          updated_at: new Date().toISOString() 
                        }, academicYear);
                      });
                      
                      await updateSupabaseData('students_batch', payloads);
                      setBaseStudents(prev => {
                        const existingList = Array.isArray(prev) ? prev : [];
                        const payloadIds = new Set(payloads.map(p => String(p.id || p['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim()));
                        const filteredOld = existingList.filter(s => !payloadIds.has(String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || '').trim()));
                        return [...payloads, ...filteredOld];
                      });
                    } catch (error: any) {
                      console.error("Error saving students directly:", error);
                      throw error;
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  academicYear={academicYear}
                  setActiveTab={setActiveTab}
                />
              </motion.div>
            )}

            {activeTab === "admission-filters" && (
              <motion.div
                key="admission-filters"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <AdmissionFilters students={academicFilteredStudents} />
              </motion.div>
            )}

            {activeTab === "id-card-design1" && (
              <motion.div
                key="id-card-design1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <IDCardDesign students={academicFilteredStudents} designType={1} />
              </motion.div>
            )}

            {activeTab === "id-card-design2" && (
              <motion.div
                key="id-card-design2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <IDCardDesign students={academicFilteredStudents} designType={2} />
              </motion.div>
            )}

            {activeTab === "id-card-print" && (
              <motion.div
                key="id-card-print"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <IDCardPrint students={academicFilteredStudents} />
              </motion.div>
            )}

            {activeTab === "exam-list" && (
              <motion.div
                key="exam-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <ExamRoutineManager />
              </motion.div>
            )}

            {activeTab === "exam-results" && (
              <motion.div
                key="exam-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <ExamResults students={academicFilteredStudents} />
              </motion.div>
            )}

            {activeTab === "exam-tabulation" && (
              <motion.div
                key="exam-tabulation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <ExamTabulation students={academicFilteredStudents} />
              </motion.div>
            )}

            {activeTab === "exam-admit" && (
              <motion.div
                key="exam-admit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <ExamAdmitCard students={academicFilteredStudents} />
              </motion.div>
            )}

            {activeTab === "testimonial" && (
              <motion.div
                key="testimonial"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <TestimonialGenerator students={academicFilteredStudents} />
              </motion.div>
            )}

            {activeTab === "attendance-history" && (
              <motion.div
                key="attendance-history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <AttendanceHistoryView students={academicFilteredStudents} />
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <ProfilePage currentUser={currentUser} setCurrentUser={setCurrentUser} />
              </motion.div>
            )}

            {activeTab === "finance-fees-statement" && (
              <motion.div
                key="finance-fees-statement"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <StudentFees students={academicFilteredStudents} initialTab="invoices" />
              </motion.div>
            )}

            {activeTab === "fees-income-summary" && (
              <motion.div
                key="fees-income-summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <StudentFees students={academicFilteredStudents} initialTab="income_summary" />
              </motion.div>
            )}

            {activeTab === "fees-cost-package" && (
              <motion.div
                key="fees-cost-package"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <StudentFees students={academicFilteredStudents} initialTab="packages" />
              </motion.div>
            )}

            {activeTab === "funds-categories" && (
              <motion.div
                key="funds-categories"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <OtherFundsManager />
              </motion.div>
            )}

            {activeTab === "notice" && (
              <motion.div
                key="notice"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <NoticeBoard />
              </motion.div>
            )}

            {(activeTab === "teachers-list" || activeTab === "teacher-add") && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <TeachersManager initialTab={activeTab === "teacher-add" ? "add" : "list"} />
              </motion.div>
            )}

            {activeTab === "madrasah-problems" && (
              <motion.div
                key="madrasah-problems"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <MadrasahProblems />
              </motion.div>
            )}

            {activeTab === "settings-software" && (
              <motion.div
                key="settings-software"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <MadrasahSettings />
              </motion.div>
            )}

            {activeTab === "pending" && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <PendingApplications
                  applications={academicFilteredPending}
                  onAccept={handleAcceptApplication}
                  onReject={handleRejectApplication}
                  onEdit={handleEditApplication}
                  onNewEntry={() =>
                    window.open(
                      "https://almadania.netlify.app/admistion",
                      "_blank",
                    )
                  }
                  onRefresh={loadAllData}
                />
              </motion.div>
            )}

            {activeTab === "archive" && (
              <motion.div
                key="archive"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <PendingApplications
                  applications={academicFilteredArchive}
                  onAccept={handleAcceptApplication}
                  onReject={handleRejectApplication}
                  onEdit={handleEditApplication}
                  onNewEntry={() =>
                    window.open(
                      "https://almadania.netlify.app/admistion",
                      "_blank",
                    )
                  }
                  onRefresh={loadAllData}
                  isArchiveView={true}
                />
              </motion.div>
            )}

            {activeTab === "student-fees" && (
              <motion.div
                key="student-fees"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
              >
                <StudentFees students={academicFilteredStudents} />
              </motion.div>
            )}

            {activeTab === "staff-salary" && (
              <motion.div
                key="staff-salary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <StaffSalary />
              </motion.div>
            )}

            {activeTab === "expenses" && (
              <motion.div
                key="expenses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Expenses />
              </motion.div>
            )}

            {activeTab === "student-attendance" && (
              <motion.div
                key="student-attendance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StudentAttendance students={academicFilteredStudents} initialTab="daily" />
              </motion.div>
            )}

            {activeTab === "student-attendance-criteria" && (
              <motion.div
                key="student-attendance-criteria"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StudentAttendance students={academicFilteredStudents} initialTab="criteria" />
              </motion.div>
            )}

            {activeTab === "attendance-messaging" && (
              <motion.div
                key="attendance-messaging"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StudentAttendance students={academicFilteredStudents} initialTab="messaging" />
              </motion.div>
            )}

            {activeTab === "attendance-history" && (
              <motion.div
                key="attendance-history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StudentAttendance students={academicFilteredStudents} initialTab="audit_logs" />
              </motion.div>
            )}

            {activeTab === "teacher-attendance" && (
              <motion.div
                key="teacher-attendance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <TeacherAttendance />
              </motion.div>
            )}

            {activeTab === "staff-attendance" && (
              <motion.div
                key="staff-attendance"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <StaffAttendance />
              </motion.div>
            )}

            {/* NEW ADDED VIEWS FROM EXTRAPORTALMODULES */}
            {activeTab === "admission-inquiry" && (
              <motion.div
                key="admission-inquiry"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AdmissionInquiry setActiveTab={setActiveTab} />
              </motion.div>
            )}

            {activeTab === "admission-form" && (
              <motion.div
                key="admission-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AdmissionFormViewer setActiveTab={setActiveTab} />
              </motion.div>
            )}

            {activeTab === "student-new" && (
              <motion.div
                key="student-new"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <StudentNew students={academicFilteredStudents} />
              </motion.div>
            )}

            {activeTab === "student-all" && (
              <motion.div
                key="student-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <StudentAll 
                  students={academicFilteredStudents} 
                  setActiveTab={setActiveTab}
                  setJumpToStudentId={setJumpToStudentId}
                />
              </motion.div>
            )}

            {activeTab === "student-update-all" && (
              <motion.div
                key="student-update-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <StudentUpdateAll 
                  students={academicFilteredStudents} 
                  onNavigateToFeeCollection={(studentId) => {
                    setActiveTab("student-fees");
                    localStorage.setItem("madrasah-temp-student-id", studentId);
                  }}
                />
              </motion.div>
            )}

            {activeTab === "student-inactive" && (
              <motion.div
                key="student-inactive"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <StudentInactive />
              </motion.div>
            )}

            {(activeTab === "recycle-bin" || activeTab === "student-recycle-bin") && (
              <motion.div
                key="recycle-bin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <GlobalRecycleBin />
              </motion.div>
            )}

            {activeTab === "student-attendance-report" && (
              <motion.div
                key="student-attendance-report"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AttendanceReportViewer />
              </motion.div>
            )}

            {activeTab === "staff-attendance-report" && (
              <motion.div
                key="staff-attendance-report"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <StaffAttendanceReportViewer />
              </motion.div>
            )}

            {activeTab === "exam-routine" && (
              <motion.div
                key="exam-routine"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ExamRoutineManager />
              </motion.div>
            )}

            {activeTab === "exam-seats" && (
              <motion.div
                key="exam-seats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SeatPlanGenerator />
              </motion.div>
            )}

            {activeTab === "exam-lock" && (
              <motion.div
                key="exam-lock"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <MarksheetLocker />
              </motion.div>
            )}

            {activeTab === "exam-certificate" && (
              <motion.div
                key="exam-certificate"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <CertificateGenerator students={academicFilteredStudents} />
              </motion.div>
            )}

            {/* Academic Structures */}
            {activeTab === "academic-departments" && (
              <motion.div
                key="academic-departments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AcademicDepartmentsManager />
              </motion.div>
            )}

            {activeTab === "academic-class" && (
              <motion.div
                key="academic-class"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AcademicClassManager setActiveTab={setActiveTab} setSelectedClassFilter={setSelectedClassFilter} students={academicFilteredStudents} />
              </motion.div>
            )}

            {activeTab === "academic-branch" && (
              <motion.div
                key="academic-branch"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AcademicBranchManager students={academicFilteredStudents} />
              </motion.div>
            )}

            {activeTab === "academic-subject" && (
              <motion.div
                key="academic-subject"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AcademicSubjectManager />
              </motion.div>
            )}

            {activeTab === "academic-class-subject" && (
              <motion.div
                key="academic-class-subject"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AcademicClassSubjectAssign />
              </motion.div>
            )}

            {activeTab === "academic-teacher-subject" && (
              <motion.div
                key="academic-teacher-subject"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AcademicTeacherSubjectAssign />
              </motion.div>
            )}

            {activeTab === "academic-exam-dates" && (
              <motion.div
                key="academic-exam-dates"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AcademicExamDatesManager />
              </motion.div>
            )}
            {activeTab === "academic-metrics" && (
              <motion.div
                key="academic-metrics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AcademicEvaluationMetrics />
              </motion.div>
            )}

            {/* Donation */}
            {activeTab === "donation" && (
              <motion.div
                key="donation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <DonationLedger />
              </motion.div>
            )}

            {activeTab === "subscription-collect" && (
              <motion.div
                key="subscription-collect"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <DonationLedger />
              </motion.div>
            )}

            {activeTab === "subscription-receive" && (
              <motion.div
                key="subscription-receive"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <DonationLedger />
              </motion.div>
            )}

            {activeTab === "donors" && (
              <motion.div
                key="donors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <DonationLedger />
              </motion.div>
            )}

            {/* Finance / Fee allocates */}
            {activeTab === "fees-allocate" && (
              <motion.div
                key="fees-allocate"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <FinanceDetailLedger type="fees-allocate" />
              </motion.div>
            )}

            {activeTab === "fees-cost-package" && (
              <motion.div
                key="fees-cost-package"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <FeesCostPackageManager />
              </motion.div>
            )}

            {/* Income Management */}
            {(activeTab === "income-summary" ||
              activeTab === "income-cash-receive" ||
              activeTab === "income-cash-list" ||
              activeTab === "income-general" ||
              activeTab === "income-lillah" ||
              activeTab === "income-chada-collect") && (
              <motion.div
                key="income-manager"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <IncomeManager />
              </motion.div>
            )}

            {activeTab === "income-chada-collect" && (
              <motion.div
                key="income-chada-collect"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <DonationLedger />
              </motion.div>
            )}

            {activeTab === "income-chada-receive" && (
              <motion.div
                key="income-chada-receive"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <DonationLedger />
              </motion.div>
            )}

            {/* Expenses */}
            {activeTab === "expense-new" && (
              <motion.div
                key="expense-new"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ExpensesLedger isLillah={false} />
              </motion.div>
            )}

            {activeTab === "expense-lillah" && (
              <motion.div
                key="expense-lillah"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ExpensesLedger isLillah={true} />
              </motion.div>
            )}

            {/* Investment & Reports */}
            {activeTab === "investment" && (
              <motion.div
                key="investment"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <InvestmentManager />
              </motion.div>
            )}

            {activeTab === "reports" && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ReportsDashboard students={academicFilteredStudents} academicYear={academicYear} />
              </motion.div>
            )}

            {activeTab === "srs-docs" && (
              <motion.div
                key="srs-docs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SRSViewer />
              </motion.div>
            )}

            {/* HR / Staff items */}
            {activeTab === "staff-shift" && (
              <motion.div
                key="staff-shift"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <StaffHRManager type="shift" />
              </motion.div>
            )}

            {activeTab === "staff-shift-allocate" && (
              <motion.div
                key="staff-shift-allocate"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <StaffHRManager type="shift-allocate" />
              </motion.div>
            )}

            {activeTab === "staff-leave-types" && (
              <motion.div
                key="staff-leave-types"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <StaffHRManager type="leave-types" />
              </motion.div>
            )}

            {activeTab === "staff-leaves" && (
              <motion.div
                key="staff-leaves"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <StaffHRManager type="leaves" />
              </motion.div>
            )}

            {activeTab === "staff-hr-settings" && (
              <motion.div
                key="staff-hr-settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <StaffHRManager type="hr-settings" />
              </motion.div>
            )}

            {/* SRM */}
            {activeTab === "srm-add-lead" && (
              <motion.div
                key="srm-add-lead"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SRMManager isSMS={false} />
              </motion.div>
            )}

            {activeTab === "srm-lead-sms" && (
              <motion.div
                key="srm-lead-sms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SRMManager isSMS={true} />
              </motion.div>
            )}

            {activeTab === "parents" && (
              <motion.div
                key="parents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ParentsManager students={academicFilteredStudents} />
              </motion.div>
            )}

            {activeTab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <UsersManager />
              </motion.div>
            )}

            {activeTab === "services" && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ServicesDashboard />
              </motion.div>
            )}

            {/* Settings */}
            {activeTab === "settings-app" && (
              <motion.div
                key="settings-app"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SpecializedSettingsManager type="app" />
              </motion.div>
            )}

            {activeTab === "settings-exam" && (
              <motion.div
                key="settings-exam"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SpecializedSettingsManager type="exam" />
              </motion.div>
            )}

            {activeTab === "settings-source-inst" && (
              <motion.div
                key="settings-source-inst"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SpecializedSettingsManager type="source" />
              </motion.div>
            )}

            {activeTab === "settings-company" && (
              <motion.div
                key="settings-company"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SpecializedSettingsManager type="company" />
              </motion.div>
            )}

            {activeTab === "settings-datatype" && (
              <motion.div
                key="settings-datatype"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SpecializedSettingsManager type="datatype" />
              </motion.div>
            )}

            {activeTab === "settings-invoice" && (
              <motion.div
                key="settings-invoice"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SpecializedSettingsManager type="invoice" />
              </motion.div>
            )}

            {activeTab === "settings-sms" && (
              <motion.div
                key="settings-sms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SpecializedSettingsManager type="sms" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Floating Action Button */}
      <button className="lg:hidden fixed bottom-24 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40">
        <Plus size={24} />
      </button>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border-main pb-safe z-40 px-6 py-3 flex justify-between items-center shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        {[
          { id: "dashboard", icon: LayoutGrid, label: "হোম" },
          { id: "student-all", icon: Users, label: "শিক্ষার্থী" },
          { id: "student-attendance", icon: UserCheck, label: "হাজিরা" },
          { id: "notice", icon: Bell, label: "নোটিশ" },
          { id: "menu", icon: Menu, label: "মেনু" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === "menu") {
                setIsMobileDrawerOpen(true);
              } else {
                setActiveTab(item.id);
              }
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === item.id && item.id !== "menu"
                ? "text-primary"
                : "text-text-light hover:text-text-main",
            )}
          >
            <item.icon
              size={20}
              className={
                activeTab === item.id && item.id !== "menu"
                  ? "fill-primary/20"
                  : ""
              }
            />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Global Super Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        setActiveTab={setActiveTab}
        setJumpToStudentId={(id) => setJumpToStudentId(id)}
        initialQuery={globalSearchInitialQuery}
      />
    </div>
  );
}
