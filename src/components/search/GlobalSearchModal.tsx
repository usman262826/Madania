import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  X,
  User,
  Users,
  FileText,
  DollarSign,
  BookOpen,
  LayoutGrid,
  ChevronRight,
  ArrowRight,
  CreditCard,
  Phone,
  Calendar,
  Hash,
  MapPin,
  Sparkles,
  Command,
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "../../contexts/DataContext";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  setJumpToStudentId?: (id: string) => void;
  initialQuery?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  setJumpToStudentId,
  initialQuery = "",
}) => {
  const { students, invoices, staffMembers, teachers, expenses } = useData();
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<
    "all" | "student" | "invoice" | "staff" | "expense" | "library" | "module"
  >("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) setQuery(initialQuery);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, initialQuery]);

  // Keyboard Navigation: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Load Library Books & Notices from localStorage safely
  const libraryBooks = useMemo(() => {
    try {
      const saved = localStorage.getItem("madrasah_library_books");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }, [isOpen]);

  // Combine staff and teachers safely
  const allStaff = useMemo(() => {
    const map = new Map();
    teachers.forEach((t) => map.set(t.id || t.mobile || t.name, t));
    staffMembers.forEach((s) => {
      if (!map.has(s.id || s.mobile || s.name)) {
        map.set(s.id || s.mobile || s.name, s);
      }
    });
    return Array.from(map.values());
  }, [teachers, staffMembers]);

  // All system navigation modules with rich tags
  const systemModules = useMemo(
    () => [
      { id: "dashboard", label: "ড্যাশবোর্ড (Dashboard)", category: "মূল পাতা", tags: "dashboard ড্যাশবোর্ড প্রধান হোম ওভারভিউ পরিসংখ্যান" },
      { id: "admission-new", label: "নতুন শিক্ষার্থী ভর্তি (New Student)", category: "ভর্তি শাখা", tags: "admission new  নতুন ভর্তি আবেদন ফর্ম ছাত্র সংযোজন" },
      { id: "admission-multiple", label: "একাধিক শিক্ষার্থী ভর্তি (Bulk Admission)", category: "ভর্তি শাখা", tags: "bulk multiple  বাল্ক ভর্তি একাধারে রেজিস্ট্রেশন" },
      { id: "admission-inquiry", label: "ভর্তি অনুসন্ধান (Inquiry Desk)", category: "ভর্তি শাখা", tags: "inquiry অনুসন্ধান জিজ্ঞাসা তথ্য সেবা" },
      { id: "student-all", label: "সকল শিক্ষার্থী তালিকা (All Students)", category: "শিক্ষার্থী শাখা", tags: "student all  ছাত্র শিক্ষার্থী সকল তালিকা ডাটাবেস নিবন্ধিত" },
      { id: "student-jamats", label: "জামাতভিত্তিক শিক্ষার্থী (Jamatwise)", category: "শিক্ষার্থী শাখা", tags: "jamat  শ্রেণী ভিত্তিক শ্রেণী তালিকা জামাত" },
      { id: "id-card-print", label: "ডিজিটাল আইডি কার্ড প্রিন্টার", category: "আইডি ও কার্ড", tags: "id card  আইডি কার্ড পরিচয়পত্র প্রিন্ট ডিজাইন ছবি" },
      { id: "student-attendance", label: "দৈনিক শিক্ষার্থী উপস্থিতি", category: "উপস্থিতি শাখা", tags: "attendance  উপস্থিতি হাজিরা উপস্থিতি রেজিস্টার ছাত্র" },
      { id: "staff-attendance", label: "উস্তাদ ও কর্মচারী হাজিরা", category: "উপস্থিতি শাখা", tags: "staff attendance  শিক্ষক হাজিরা উপস্থিতি সায়েন" },
      { id: "exam-routine", label: "পরীক্ষার রুটিন ব্যবস্থাপনা", category: "পরীক্ষা শাখা", tags: "exam routine  পরীক্ষা রুটিন সময়সূচি পরীক্ষা তারিখ" },
      { id: "exam-results", label: "পরীক্ষার ফলাফল ও মার্ক এন্ট্রি", category: "পরীক্ষা শাখা", tags: "results marks  ফলাফল নম্বর এন্ট্রি রেজাল্ট শিট নম্বরপত্র" },
      { id: "exam-tabulation", label: "নম্বর ফর্দ ও ট্যাবুলেশন শিট", category: "পরীক্ষা শাখা", tags: "tabulation  ট্যাবুলেশন মেধা তালিকা গ্রেড শিট" },
      { id: "student-fees", label: "ফি সংগ্রহ ও রসিদ তৈরি", category: "অর্থায়ন শাখা", tags: "fees collection  ফি সংগ্রহ ইনভয়েস ক্যাশ গ্রহণ আদায় রসিদ" },
      { id: "finance-fees-statement", label: "আদায়কৃত ফি সমূহের খতিয়ান", category: "অর্থায়ন শাখা", tags: "statement  খতিয়ান ফি বিবরণী কালেকশন রিপোর্ট" },
      { id: "expenses", label: "মাদ্রাসা ব্যয় ও খরচের ভাউচার", category: "অর্থায়ন শাখা", tags: "expenses  ব্যয় খরচ বিল ভাউচার মেস খরচ কেনাকাটা" },
      { id: "teachers-list", label: "এইচআর ও ওস্তাদ তালিকা", category: "মানবসম্পদ", tags: "teachers hr  শিক্ষক ওস্তাদ নিয়োগ পদবী শিক্ষকবৃন্দ স্টাফ" },
      { id: "staff-salary", label: "শিক্ষক-কর্মচারী বেতন শিট", category: "মানবসম্পদ", tags: "salary  বেতন স্যালারি ভাতা পরিশোধ স্পেসিফিকেশন" },
      { id: "notice", label: "ঘোষণা ও ডিজিটাল নোটিশ বোর্ড", category: "কমিউনিকেশন", tags: "notice board  নোটিশ ঘোষণা ছুটির নোটিশ বার্তা মেসেজ" },
      { id: "reports", label: "সকল রিপোর্ট ও কেন্দ্রীয় অডিট কেন্দ্র", category: "রিপোর্ট শাখা", tags: "reports audit  রিপোর্ট অডিট হিসাব খতিয়ান প্রিন্ট ফাইল" },
      { id: "settings-app", label: "অ্যাপ্লিকেশন সেটিংস ও প্রোফাইল", category: "সেটিংস", tags: "settings setup  সেটিংস লোগো নাম ঠিকানা সিস্টেম কনফিগ" },
    ],
    []
  );

  // Helper number converter
  const enToBn = (s: string | number = "") => {
    const numMap: any = {
      "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
      "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯"
    };
    return s.toString().replace(/[0-9]/g, (d) => numMap[d] || d);
  };

  // Comprehensive Multi-Field Search Execution
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { students: [], invoices: [], staff: [], expenses: [], library: [], modules: [], total: 0 };

    // 1. Students Search
    const studentMatches = students
      .filter((s: any) => {
        const name = (s["शिक्षার্থীর নাম"] || s.name || "").toString().toLowerCase();
        const id = (s["রেজিস্ট্রেশন/আইডি নম্বর"] || s.id || s.studentId || "").toString().toLowerCase();
        const roll = (s["রোল নম্বর"] || s.roll || "").toString().toLowerCase();
        const father = (s["পিতার নাম"] || s.fatherName || "").toString().toLowerCase();
        const mother = (s["মাতার নাম"] || s.motherName || "").toString().toLowerCase();
        const mobile = (s["মোবাইল (মা)"] || s["মোবাইল (বাবা/ভাই)"] || s["অভিভাবকের মোবাইল"] || s.mobile || s.phone || "").toString().toLowerCase();
        const birthReg = (s["জন্ম নিবন্ধন সনদ নম্বর"] || s["এনআইডি/জন্ম সনদ"] || s.birthRegNo || "").toString().toLowerCase();
        const dob = (s["জন্ম তারিখ"] || s.dob || "").toString().toLowerCase();
        const cls = (s["জামাত/শ্রেণী"] || s.class || s.jamat || "").toString().toLowerCase();
        const address = (s["বর্তমান ঠিকানা"] || s["স্থায়ী ঠিকানা"] || s.address || "").toString().toLowerCase();

        return (
          name.includes(q) ||
          id.includes(q) ||
          roll.includes(q) ||
          father.includes(q) ||
          mother.includes(q) ||
          mobile.includes(q) ||
          birthReg.includes(q) ||
          dob.includes(q) ||
          cls.includes(q) ||
          address.includes(q)
        );
      })
      .slice(0, 15)
      .map((s: any) => ({
        type: "student",
        id: s["রেজিস্ট্রেশন/আইডি নম্বর"] || s.id || s.studentId,
        name: s["शिक्षার্থীর নাম"] || s.name || "অজ্ঞাত শিক্ষার্থী",
        father: s["পিতার নাম"] || s.fatherName || "অজ্ঞাত",
        mother: s["মাতার নাম"] || s.motherName || "",
        mobile: s["মোবাইল (মা)"] || s["মোবাইল (বাবা/ভাই)"] || s["অভিভাবকের মোবাইল"] || s.mobile || "",
        roll: s["রোল নম্বর"] || s.roll || "",
        class: s["জামাত/শ্রেণী"] || s.class || "সাধারণ",
        dob: s["জন্ম তারিখ"] || s.dob || "",
        birthReg: s["জন্ম নিবন্ধন সনদ নম্বর"] || s["এনআইডি/জন্ম সনদ"] || s.birthRegNo || "",
        address: s["বর্তমান ঠিকানা"] || s.address || "",
        raw: s,
      }));

    // 2. Invoices Search
    const invoiceMatches = invoices
      .filter((inv: any) => {
        const invNo = (inv.invoiceNo || inv.id || inv.voucherNo || inv.receiptNo || "").toString().toLowerCase();
        const stName = (inv.studentName || inv.name || "").toString().toLowerCase();
        const stId = (inv.studentId || inv.idNo || "").toString().toLowerCase();
        const month = (inv.month || inv.feeHead || inv.category || "").toString().toLowerCase();
        const method = (inv.paymentMethod || inv.method || "").toString().toLowerCase();
        const amount = (inv.amount || inv.paid || inv.total || "").toString();

        return (
          invNo.includes(q) ||
          stName.includes(q) ||
          stId.includes(q) ||
          month.includes(q) ||
          method.includes(q) ||
          amount.includes(q)
        );
      })
      .slice(0, 15)
      .map((inv: any) => ({
        type: "invoice",
        id: inv.invoiceNo || inv.id || inv.receiptNo || "INV",
        studentName: inv.studentName || inv.name || "ইনভয়েস রেকর্ড",
        month: inv.month || inv.feeHead || "ফি কালেকশন",
        amount: inv.paid || inv.amount || inv.total || 0,
        status: inv.status || "পরিশোধিত",
        date: inv.date || "সাম্প্রতিক",
        raw: inv,
      }));

    // 3. Staff & Teachers Search
    const staffMatches = allStaff
      .filter((st: any) => {
        const name = (st.name || st.staffName || "").toString().toLowerCase();
        const id = (st.id || st.teacherId || "").toString().toLowerCase();
        const desig = (st.designation || st.role || "").toString().toLowerCase();
        const mobile = (st.mobile || st.phone || "").toString().toLowerCase();
        const dept = (st.department || st.subjects || "").toString().toLowerCase();

        return (
          name.includes(q) ||
          id.includes(q) ||
          desig.includes(q) ||
          mobile.includes(q) ||
          dept.includes(q)
        );
      })
      .slice(0, 10)
      .map((st: any) => ({
        type: "staff",
        id: st.id || st.teacherId || "T",
        name: st.name || st.staffName || "শিক্ষক/কর্মচারী",
        designation: st.designation || st.role || "ওস্তাদ",
        mobile: st.mobile || st.phone || "",
        department: st.department || st.subjects || "সাধারণ",
        raw: st,
      }));

    // 4. Expenses Search
    const expenseMatches = expenses
      .filter((exp: any) => {
        const title = (exp.title || exp.category || exp.expenseName || "").toString().toLowerCase();
        const voucher = (exp.voucherNo || exp.receiptNo || exp.id || "").toString().toLowerCase();
        const cat = (exp.category || "").toString().toLowerCase();
        const amount = (exp.amount || "").toString();

        return (
          title.includes(q) ||
          voucher.includes(q) ||
          cat.includes(q) ||
          amount.includes(q)
        );
      })
      .slice(0, 10)
      .map((exp: any) => ({
        type: "expense",
        id: exp.voucherNo || exp.id || "EXP",
        title: exp.title || exp.category || "ব্যয় রেকর্ড",
        category: exp.category || "সাধারণ খরচ",
        amount: exp.amount || 0,
        date: exp.date || "আজ",
        raw: exp,
      }));

    // 5. Library Books Search
    const libraryMatches = libraryBooks
      .filter((bk: any) => {
        const title = (bk.title || bk.name || "").toString().toLowerCase();
        const author = (bk.author || bk.writer || "").toString().toLowerCase();
        const cat = (bk.category || bk.code || "").toString().toLowerCase();

        return title.includes(q) || author.includes(q) || cat.includes(q);
      })
      .slice(0, 8)
      .map((bk: any) => ({
        type: "library",
        id: bk.id || bk.code || "BK",
        title: bk.title || bk.name || "কিতাব",
        author: bk.author || bk.writer || "লেখক অজানা",
        category: bk.category || "কিতাব ক্যাটালগ",
        raw: bk,
      }));

    // 6. Navigation Modules Search
    const moduleMatches = systemModules
      .filter((mod) => {
        return (
          mod.label.toLowerCase().includes(q) ||
          mod.tags.toLowerCase().includes(q) ||
          mod.category.toLowerCase().includes(q)
        );
      })
      .slice(0, 10)
      .map((mod) => ({
        type: "module",
        id: mod.id,
        label: mod.label,
        category: mod.category,
      }));

    const total =
      studentMatches.length +
      invoiceMatches.length +
      staffMatches.length +
      expenseMatches.length +
      libraryMatches.length +
      moduleMatches.length;

    return {
      students: studentMatches,
      invoices: invoiceMatches,
      staff: staffMatches,
      expenses: expenseMatches,
      library: libraryMatches,
      modules: moduleMatches,
      total,
    };
  }, [query, students, invoices, allStaff, expenses, libraryBooks, systemModules]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-start justify-center pt-8 sm:pt-16 px-3 sm:px-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-3xl bg-card border border-border-main/80 rounded-3xl shadow-2xl overflow-hidden font-hind-siliguri text-text-main flex flex-col max-h-[85vh]"
        >
          {/* Top Search Bar Input Header */}
          <div className="p-4 sm:p-5 border-b border-border-main/70 bg-step-bg/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="নাম, রোল, আইডি, মোবাইল, ইনভয়েস, জন্ম সনদ, ওস্তাদ বা বিষয় দিয়ে যা খুশি খুঁজুন..."
                className="w-full bg-transparent text-base sm:text-lg font-bold text-text-main placeholder-text-light/40 outline-none pr-8"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-text-light hover:text-text-main hover:bg-step-bg rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-step-bg border border-border-main/50 text-xs font-bold text-text-light hover:text-text-main hover:bg-step-bg/80 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>বন্ধ করুন</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-card border border-border-main rounded font-mono">
                ESC
              </kbd>
            </button>
          </div>

          {/* Category Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border-main/50 bg-card overflow-x-auto no-scrollbar shrink-0 text-xs font-bold">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === "all"
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-step-bg text-text-light hover:text-text-main"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>সকল তথ্য ({searchResults.total})</span>
            </button>
            <button
              onClick={() => setActiveCategory("student")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === "student"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-step-bg text-text-light hover:text-text-main"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>শিক্ষার্থী ({searchResults.students.length})</span>
            </button>
            <button
              onClick={() => setActiveCategory("invoice")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === "invoice"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-step-bg text-text-light hover:text-text-main"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>ইনভয়েস/ফি ({searchResults.invoices.length})</span>
            </button>
            <button
              onClick={() => setActiveCategory("staff")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === "staff"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                  : "bg-step-bg text-text-light hover:text-text-main"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>ওস্তাদ/এইচআর ({searchResults.staff.length})</span>
            </button>
            <button
              onClick={() => setActiveCategory("expense")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === "expense"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                  : "bg-step-bg text-text-light hover:text-text-main"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>ব্যয় রেকর্ড ({searchResults.expenses.length})</span>
            </button>
            <button
              onClick={() => setActiveCategory("module")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === "module"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "bg-step-bg text-text-light hover:text-text-main"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>সিস্টেম মডিউল ({searchResults.modules.length})</span>
            </button>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
            {!query.trim() ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-primary/10 text-primary flex items-center justify-center animate-pulse">
                  <Command className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-text-main">
                  গ্লোবাল স্মার্ট অনুসন্ধান কেন্দ্রে আপনাকে স্বাগতম
                </h4>
                <p className="text-xs text-text-light max-w-md mx-auto leading-relaxed">
                  মাদরাসা ম্যানেজমেন্ট সিস্টেমের যেকোনো শিক্ষার্থী (নাম/আইডি/পিতার নাম/ফোন/এনআইডি), ফি ইনভয়েস, ওস্তাদ, খরচ ও পেজ অপশনে এক ক্লিকে এক্সেস পান।
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-step-bg border border-border-main text-text-light">
                    পরামর্শ: শিক্ষার্থীর আইডি যেমন `1001`
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-step-bg border border-border-main text-text-light">
                    পরামর্শ: পিতা/অভিভাবক নাম বা ফোন
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-step-bg border border-border-main text-text-light">
                    পরামর্শ: ইনভয়েস নং যেমন `INV-`
                  </span>
                </div>
              </div>
            ) : searchResults.total === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-text-main">
                  "{query}" দিয়ে কোনো তথ্য পাওয়া যায়নি
                </h4>
                <p className="text-xs text-text-light">
                  বানান পরিবর্তন করে অথবা অন্য কোনো আইডি/ফোন নাম্বার দিয়ে পুনরায় চেষ্টা করুন।
                </p>
              </div>
            ) : (
              <>
                {/* 1. STUDENTS RESULTS */}
                {(activeCategory === "all" || activeCategory === "student") &&
                  searchResults.students.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>শিক্ষার্থীবৃন্দ ({searchResults.students.length} জন)</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {searchResults.students.map((st: any) => (
                          <div
                            key={st.id}
                            className="p-3.5 rounded-2xl bg-step-bg/60 border border-border-main/60 hover:border-emerald-500/40 hover:bg-card transition-all space-y-2 group"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <h5 className="font-black text-sm text-text-main group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                                  {st.name}
                                </h5>
                                <p className="text-[11px] text-text-light font-bold flex items-center gap-1.5 mt-0.5">
                                  <span>জামাত: {st.class}</span>
                                  <span>•</span>
                                  <span>রোল: {enToBn(st.roll)}</span>
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-black border border-emerald-500/20 shrink-0">
                                ID: {st.id}
                              </span>
                            </div>

                            <div className="space-y-1 text-[11px] text-text-light/80 border-t border-border-main/30 pt-2 font-mono">
                              {st.father && (
                                <p className="flex items-center gap-1 truncate font-sans">
                                  <span className="font-bold text-text-light/50">পিতা:</span> {st.father}
                                </p>
                              )}
                              {st.mobile && (
                                <p className="flex items-center gap-1 truncate text-primary font-bold">
                                  <Phone className="w-3 h-3 shrink-0" />
                                  <span>{enToBn(st.mobile)}</span>
                                </p>
                              )}
                              {st.birthReg && (
                                <p className="flex items-center gap-1 truncate text-[10px] text-text-light/60">
                                  <Hash className="w-3 h-3 shrink-0" />
                                  <span>এনআইডি/জন্ম সনদ: {enToBn(st.birthReg)}</span>
                                </p>
                              )}
                              {st.dob && (
                                <p className="flex items-center gap-1 truncate text-[10px] text-text-light/60">
                                  <Calendar className="w-3 h-3 shrink-0" />
                                  <span>জন্ম তারিখ: {enToBn(st.dob)}</span>
                                </p>
                              )}
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-main/30">
                              <button
                                onClick={() => {
                                  if (setJumpToStudentId) setJumpToStudentId(st.id?.toString());
                                  setActiveTab("student-all");
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span>প্রোফাইল খুলুন</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (setJumpToStudentId) setJumpToStudentId(st.id?.toString());
                                  setActiveTab("id-card-print");
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-step-bg border border-border-main text-text-main text-[11px] font-bold hover:bg-card transition-colors cursor-pointer"
                              >
                                আইডি কার্ড
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 2. INVOICES RESULTS */}
                {(activeCategory === "all" || activeCategory === "invoice") &&
                  searchResults.invoices.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4" />
                          <span>ফি ও ইনভয়েস সমূহ ({searchResults.invoices.length} টি)</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {searchResults.invoices.map((inv: any, idx: number) => (
                          <div
                            key={inv.id || idx}
                            className="p-3.5 rounded-2xl bg-step-bg/60 border border-border-main/60 hover:border-blue-500/40 hover:bg-card transition-all space-y-2 group"
                          >
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 font-black text-[10px]">
                                {inv.id}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                {inv.status}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-black text-sm text-text-main group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {inv.studentName}
                              </h5>
                              <p className="text-[11px] text-text-light font-bold">
                                {inv.month}
                              </p>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-border-main/30 text-xs font-bold">
                              <span className="text-text-main">
                                ৳ {enToBn(inv.amount)}
                              </span>
                              <button
                                onClick={() => {
                                  setActiveTab("student-fees");
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span>ইনভয়েস দেখুন</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 3. STAFF / TEACHERS RESULTS */}
                {(activeCategory === "all" || activeCategory === "staff") &&
                  searchResults.staff.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          <span>উস্তাদ ও কর্মচারীগণ ({searchResults.staff.length} জন)</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {searchResults.staff.map((st: any, idx: number) => (
                          <div
                            key={st.id || idx}
                            className="p-3.5 rounded-2xl bg-step-bg/60 border border-border-main/60 hover:border-cyan-500/40 hover:bg-card transition-all space-y-2 group"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-black text-sm text-text-main group-hover:text-cyan-600 transition-colors">
                                  {st.name}
                                </h5>
                                <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold">
                                  {st.designation}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-text-light/60 bg-step-bg px-2 py-0.5 rounded-md border border-border-main/50">
                                ID: {st.id}
                              </span>
                            </div>

                            {st.mobile && (
                              <p className="text-[11px] font-bold text-text-light flex items-center gap-1">
                                <Phone className="w-3 h-3 text-primary" />
                                <span>{enToBn(st.mobile)}</span>
                              </p>
                            )}

                            <div className="pt-2 flex justify-end border-t border-border-main/30">
                              <button
                                onClick={() => {
                                  setActiveTab("teachers-list");
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white text-[11px] font-bold hover:bg-cyan-700 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span>প্রোফাইল খুলুন</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 4. EXPENSE RESULTS */}
                {(activeCategory === "all" || activeCategory === "expense") &&
                  searchResults.expenses.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" />
                          <span>ব্যয় ও ভাউচার রেকর্ড ({searchResults.expenses.length} টি)</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {searchResults.expenses.map((exp: any, idx: number) => (
                          <div
                            key={exp.id || idx}
                            className="p-3 rounded-2xl bg-step-bg/60 border border-border-main/60 hover:border-amber-500/40 hover:bg-card transition-all flex justify-between items-center"
                          >
                            <div>
                              <h5 className="font-black text-xs text-text-main">
                                {exp.title}
                              </h5>
                              <p className="text-[10px] text-text-light font-bold">
                                {exp.category} • ভাউচার: {exp.id}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-xs text-amber-600 dark:text-amber-400 block">
                                ৳ {enToBn(exp.amount)}
                              </span>
                              <button
                                onClick={() => {
                                  setActiveTab("expenses");
                                  onClose();
                                }}
                                className="text-[10px] font-bold text-primary hover:underline"
                              >
                                বিস্তারিত ➔
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 5. MODULES & NAVIGATION RESULTS */}
                {(activeCategory === "all" || activeCategory === "module") &&
                  searchResults.modules.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                          <LayoutGrid className="w-4 h-4" />
                          <span>সিস্টেম মডিউল নেভিগেশন ({searchResults.modules.length} টি)</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {searchResults.modules.map((mod: any) => (
                          <button
                            key={mod.id}
                            onClick={() => {
                              setActiveTab(mod.id);
                              onClose();
                            }}
                            className="p-3 rounded-xl bg-step-bg/60 border border-border-main/60 hover:bg-purple-500/10 hover:border-purple-500/30 text-left flex items-center justify-between transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                                <LayoutGrid className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-text-main group-hover:text-purple-600 transition-colors truncate">
                                  {mod.label}
                                </p>
                                <p className="text-[10px] text-text-light/60 font-semibold">
                                  {mod.category}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-light group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Footer Info & Keyboard Tips */}
          <div className="p-3 px-5 border-t border-border-main/70 bg-step-bg/60 flex items-center justify-between text-[11px] font-bold text-text-light/70 shrink-0">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>গ্লোবাল অনুসন্ধান সক্রিয়</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block">
                শর্টকাট খুলতে: <kbd className="px-1.5 py-0.5 bg-card border border-border-main rounded text-[10px]">Ctrl + K</kbd>
              </span>
              <span>
                মোট রেজাল্ট: <strong className="text-text-main">{searchResults.total}</strong>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
