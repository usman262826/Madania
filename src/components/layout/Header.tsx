import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Bell,
  Menu,
  Plus,
  Moon,
  Sun,
  Settings,
  Globe,
  LogOut,
  User,
  MessageCircle,
  X,
  ChevronLeft,
  LayoutGrid,
  Users,
  QrCode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Theme } from "../../types";
import { cn } from "../../lib/utils";
import { Application } from "../../types";

interface HeaderProps {
  sidebarMode: "hidden" | "mini" | "expanded";
  setSidebarMode: (mode: "hidden" | "mini" | "expanded") => void;
  setIsMobileDrawerOpen: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  showSearchResults: boolean;
  setShowSearchResults: (v: boolean) => void;
  searchResults: any[];
  setJumpToStudentId: (id: string) => void;
  setActiveTab: (tab: string) => void;
  pendingApplications: Application[];
  theme: Theme;
  setTheme: (t: Theme) => void;
  onLogout: () => void;
  activeTab: string;
  currentUser?: any;
  onOpenGlobalSearch?: (q?: string) => void;
  onOpenQuickScan?: () => void;
}

const tabTitles: Record<string, string> = {
  "dashboard": "ড্যাশবোর্ড",
  "admission-new": "নতুন ভর্তি",
  "admission-multiple": "একাধিক শিক্ষার্থী",
  "admission-inquiry": "ভর্তি জিজ্ঞাসা",
  "admission-form": "ভর্তি ফর্ম",
  "student-new": "নতুন শিক্ষার্থী",
  "student-all": "সমস্ত শিক্ষার্থী",
  "student-inactive": "নিষ্ক্রিয় শিক্ষার্থী",
  "student-jamats": "জামাতভিত্তিক শিক্ষার্থী",
  "id-card-design1": "আইডি কার্ড ১",
  "id-card-design2": "আইডি কার্ড ২",
  "id-card-print": "প্রিন্ট আইডি কার্ড",
  "student-attendance": "শিক্ষার্থী উপস্থিতি",
  "student-attendance-report": "উপস্থিতি রিপোর্ট",
  "staff-attendance": "কর্মচারী উপস্থিতি",
  "staff-attendance-report": "উপস্থিতি রিপোর্ট",
  "attendance-history": "হাজিরা খতিয়ান",
  "exam-list": "পরীক্ষার তালিকা",
  "exam-routine": "পরীক্ষার রুটিন",
  "exam-admit": "প্রবেশপত্র",
  "exam-seats": "আসন বিন্যাস",
  "exam-results": "মার্ক এন্ট্রি",
  "exam-tabulation": "নম্বর শীট",
  "exam-lock": "মার্কশিট লক",
  "exam-certificate": "সার্টিফিকেট",
  "academic-class": "জামাত/শ্রেণী",
  "academic-branch": "শাখা",
  "academic-subject": "বিষয়/সাবজেক্ট",
  "academic-class-subject": "জামাত-বিষয় অ্যাসাইন",
  "academic-teacher-subject": "শিক্ষক-সাবজেক্ট অ্যাসাইন",
  "academic-exam-dates": "পরীক্ষার সময়সীমা",
  "academic-metrics": "মূল্যায়ন মেট্রিক্স",
  "student-fees": "ফি সংগ্রহ",
  "fees-monthly-tracker": "মাসিক বেতন ও ফি খতিয়ান",
  "finance-fees-statement": "আদায়কৃত ফি সমূহ",
  "fees-allocate": "ফি বরাদ্দ",
  "income-cash-receive": "নতুন নগদ গ্রহণ",
  "income-cash-list": "সকল নগদ গ্রহণ",
  "income-general": "সাধারণ আয়",
  "income-lillah": "লিল্লাহ আয়",
  "expense-new": "নতুন ব্যয়",
  "expense-lillah": "লিল্লাহ ব্যয়",
  "expenses": "সমস্ত ব্যয় সমূহ",
  "investment": "বিনিয়োগ",
  "teachers-list": "এইচআর ও শিক্ষক",
  "staff-salary": "বেতন/স্যালারি শিট",
  "staff-shift": "শিফট",
  "staff-shift-allocate": "শিফট বরাদ্দ",
  "staff-leave-types": "ছুটির ধরন",
  "staff-leaves": "ছুতি",
  "staff-hr-settings": "এইচআর সেটিংস",
  "parents": "অভিভাবক",
  "users": "ব্যবহারকারী/ইউজারগণ",
  "services": "সেবা সমূহ",
  "notice": "নোটিশ ব্যবস্থাপনা",
  "problems": "মাদ্রাসা সমস্যা",
  "settings-app": "অ্যাপ্লিকেশন সেটিংস",
  "settings-exam": "পরীক্ষার সেটিংস",
  "settings-source-inst": "উৎস প্রতিষ্ঠান",
  "settings-company": "কোম্পানি / ব্র্যান্ড",
  "settings-datatype": "ডেটা টাইপ",
  "settings-invoice": "ভর্তি ইনভয়েস সেটিংস",
  "settings-sms": "এসএমএস সেটিংস",
  "reports": "সকল রিপোর্ট",
  "profile": "ইউজার প্রোফাইল ও সেটিংস"
};

export function Header({
  sidebarMode,
  setSidebarMode,
  setIsMobileDrawerOpen,
  searchQuery,
  setSearchQuery,
  showSearchResults,
  setShowSearchResults,
  searchResults,
  setJumpToStudentId,
  setActiveTab,
  pendingApplications,
  theme,
  setTheme,
  onLogout,
  activeTab,
  currentUser,
  onOpenGlobalSearch,
  onOpenQuickScan,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);
  
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 150);
    }
  }, [isMobileSearchOpen]);

  const systemModules = useMemo(() => [
    { id: "dashboard", label: "ড্যাশবোর্ড (Dashboard)", tags: "dashboard ড্যাশবোর্ড প্রধান হোম" },
    { id: "student-all", label: "শিক্ষার্থী তালিকা (Students List)", tags: "student student-all শিক্ষার্থী ছাত্র ছাত্রী তালিকা রোল" },
    { id: "student-new", label: "নতুন শিক্ষার্থী ভর্তি (Add Student)", tags: "student-new নতুন ছাত্র ভর্তি যোগ" },
    { id: "student-attendance", label: "হাজিরা ও উপস্থিতি (Attendance)", tags: "attendance উপস্থিতি হাজিরা দৈনিক ওস্তাদ" },
    { id: "student-fees", label: "ফি সংগ্রহ ব্যাবস্থাপনা (Fees Collection)", tags: "fees ফি সংগ্রহ ব্যাবস্থাপনা আদায় বকেয়া লেজার" },
    { id: "expenses", label: "মাদ্রাসা ব্যয় (Expenses Ledger)", tags: "expenses ব্যয় খরচ বিল মেস বেতন" },
    { id: "teachers-list", label: "ওস্তাদ ও শিক্ষকবৃন্দ (Teachers & Staff)", tags: "teachers  শিক্ষক ওস্তাদ এইচআর রোস্টার স্যালারি" },
    { id: "notice", label: "ঘোষণা ও নোটিশ (Notice Board)", tags: "notice নোটিশ ঘোষণা বোর্ড বার্তা" },
    { id: "reports", label: "সকল রিপোর্ট ও অডিট (Reports Center)", tags: "reports  রিপোর্ট অডিট শিট খতিয়ান" },
    { id: "settings-app", label: "সিস্টেম সেটিংস (Settings Setup)", tags: "settings  সেটিংস অ্যাপ ইনভয়েস এসএমএস" },
  ], []);

  const matchedModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return systemModules.filter(
      (mod) =>
        mod.label.toLowerCase().includes(query) ||
        mod.tags.toLowerCase().includes(query)
    );
  }, [searchQuery, systemModules]);

  const groupedResults = useMemo(() => {
    const list = Array.isArray(searchResults) ? searchResults : [];
    return {
      modules: matchedModules.map((m) => ({ ...m, type: "module" })),
      students: list.filter((r) => r && r.type === "student"),
      staff: list.filter((r) => r && r.type === "staff"),
    };
  }, [matchedModules, searchResults]);

  const hasAnyResults = useMemo(() => {
    return (
      groupedResults.modules.length > 0 ||
      groupedResults.students.length > 0 ||
      groupedResults.staff.length > 0
    );
  }, [groupedResults]);

  return (
    <>
      <header className={cn(
        "sticky top-0 w-full bg-card/80 backdrop-blur-xl border-b border-border-main shadow-sm h-16 flex items-center px-4 lg:px-6 transition-colors duration-300",
        showSearchResults ? "z-[99]" : "z-40"
      )}>
      <div className="flex w-full items-center justify-between gap-4">
        {/* Left section: Hamburger and Search */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          {/* Hamburger for mobile (opens drawer) */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden flex items-center justify-center p-2 rounded-xl text-text-light hover:bg-step-bg hover:text-text-main transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Hamburger for desktop (cycles sidebar mode) */}
          <button
            onClick={() => {
              setSidebarMode(
                sidebarMode === "expanded"
                  ? "mini"
                  : sidebarMode === "mini"
                  ? "hidden"
                  : "expanded"
              );
            }}
            className="hidden lg:flex items-center justify-center p-2 rounded-xl text-text-light hover:bg-step-bg hover:text-text-main transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Active Tab Page Title (Only on Mobile/Tablet) */}
          <div className="lg:hidden flex items-center min-w-0 gap-2">
            <div className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/25 text-xs font-black flex items-center gap-1.5 min-w-0 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="truncate max-w-[170px] sm:max-w-xs">{tabTitles[activeTab] || "ড্যাশবোর্ড"}</span>
            </div>
          </div>

          {/* Desktop Search Input */}
          <div className="relative flex-1 max-w-md hidden lg:flex">
            <div 
              onClick={() => {
                if (onOpenGlobalSearch) onOpenGlobalSearch(searchQuery);
              }}
              className="relative flex items-center w-full cursor-pointer group"
            >
              <Search className="absolute left-3.5 w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <input
                type="text"
                readOnly
                placeholder="গ্লোবাল সার্চ কেন্দ্র (নাম, রোল, আইডি, মোবাইল, ইনভয়েস)..."
                value={searchQuery}
                className="w-full bg-step-bg/70 border border-border-main/70 hover:border-primary/50 focus:border-primary rounded-full pl-10 pr-20 py-2 text-xs font-bold outline-none text-text-main transition-all placeholder:text-text-light/60 cursor-pointer shadow-xs"
              />
              <kbd className="absolute right-3 px-2 py-0.5 text-[10px] font-mono font-bold bg-card border border-border-main/80 rounded-lg text-text-light/80 shadow-xs flex items-center gap-1 group-hover:border-primary/40 group-hover:text-primary transition-colors">
                <span>Ctrl</span>
                <span>K</span>
              </kbd>
            </div>

            <AnimatePresence>
              {showSearchResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-card border border-border-main rounded-2xl shadow-2xl z-[100] overflow-hidden py-2"
                >
                  {hasAnyResults ? (
                    <div className="max-h-80 overflow-y-auto scroll-smooth overscroll-contain no-scrollbar divide-y divide-border-main/50">
                      {/* Modules */}
                      {groupedResults.modules.length > 0 && (
                        <div className="p-2">
                          <p className="text-[11px] font-black text-text-light uppercase tracking-wider px-4 py-1.5 bg-step-bg/30 rounded-lg mx-2 my-1">
                            মডিউল ও সেকশন
                          </p>
                          {groupedResults.modules.map((res: any, idx) => (
                            <button
                              key={`mod-${idx}`}
                              onClick={() => {
                                setActiveTab(res.id);
                                setShowSearchResults(false);
                                setSearchQuery("");
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-step-bg rounded-xl flex items-center gap-3 transition-colors text-text-main cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <LayoutGrid className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-medium">{res.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Students */}
                      {groupedResults.students.length > 0 && (
                        <div className="p-2">
                          <p className="text-[11px] font-black text-text-light uppercase tracking-wider px-4 py-1.5 bg-step-bg/30 rounded-lg mx-2 my-1">
                            শিক্ষার্থীবৃন্দ
                          </p>
                          {groupedResults.students.map((res: any, idx) => (
                            <button
                              key={`stud-${idx}`}
                              onClick={() => {
                                setJumpToStudentId(res.id?.toString() || "");
                                setActiveTab("students");
                                setShowSearchResults(false);
                                setSearchQuery("");
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-step-bg rounded-xl flex items-center gap-3 transition-colors text-text-main cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-text-main">{res.name}</p>
                                <p className="text-[11px] text-text-light font-semibold">{res.sub}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Staff */}
                      {groupedResults.staff.length > 0 && (
                        <div className="p-2">
                          <p className="text-[11px] font-black text-text-light uppercase tracking-wider px-4 py-1.5 bg-step-bg/30 rounded-lg mx-2 my-1">
                            ওস্তাদ ও কর্মচারী
                          </p>
                          {groupedResults.staff.map((res: any, idx) => (
                            <button
                              key={`staff-${idx}`}
                              onClick={() => {
                                setActiveTab("teachers");
                                setShowSearchResults(false);
                                setSearchQuery("");
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-step-bg rounded-xl flex items-center gap-3 transition-colors text-text-main cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-text-main">{res.name}</p>
                                <p className="text-[11px] text-text-light font-semibold">{res.sub}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-text-light">
                      কোনো তথ্য পাওয়া যায়নি
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right section: Icons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile Search Button */}
          <button
            onClick={() => {
              if (onOpenGlobalSearch) onOpenGlobalSearch(searchQuery);
              else setIsMobileSearchOpen(true);
            }}
            className="lg:hidden p-2 text-primary bg-primary/10 border border-primary/20 rounded-full transition-colors cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Mobile QR Scan Button */}
          <button
            id="mobile-header-quick-scan-btn"
            onClick={() => {
              if (onOpenQuickScan) onOpenQuickScan();
            }}
            className="lg:hidden p-2 text-emerald-600 bg-emerald-500/10 border border-emerald-500/25 rounded-full transition-colors cursor-pointer active:scale-95 transition-transform"
            title="কুইক স্ক্যান (QR Code)"
          >
            <QrCode className="w-5 h-5" />
          </button>

          <button className="hidden sm:flex p-2 text-text-light hover:bg-step-bg hover:text-text-main rounded-full transition-colors">
            <Plus className="w-5 h-5" />
          </button>

          <button className="hidden sm:flex p-2 text-text-light hover:bg-step-bg hover:text-text-main rounded-full transition-colors">
            <MessageCircle className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-text-light hover:bg-step-bg hover:text-text-main rounded-full transition-colors relative"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-text-light hover:bg-step-bg hover:text-text-main rounded-full transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <button className="hidden sm:flex p-2 text-text-light hover:bg-step-bg hover:text-text-main rounded-full transition-colors">
            <Globe className="w-5 h-5" />
          </button>

          <button className="hidden sm:flex p-2 text-text-light hover:bg-step-bg hover:text-text-main rounded-full transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          <div className="relative ml-1 sm:ml-2">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm border border-primary/30 hover:bg-primary/20 transition-all cursor-pointer shadow-sm overflow-hidden"
              title={currentUser?.name || "ইউজার প্রোফাইল"}
            >
              {currentUser?.photoUrl ? (
                <img src={currentUser.photoUrl} alt={currentUser?.name || "প্রোফাইল"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                currentUser?.name ? currentUser.name.charAt(0) : "A"
              )}
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-56 bg-card border border-border-main rounded-2xl shadow-2xl z-50 overflow-hidden p-2 space-y-1 font-hind-siliguri"
                >
                  <div className="p-3 bg-step-bg rounded-xl border border-border-main/50 mb-1 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black overflow-hidden shrink-0 border border-primary/20">
                      {currentUser?.photoUrl ? (
                        <img src={currentUser.photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        currentUser?.name ? currentUser.name.charAt(0) : "A"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-xs text-text-main truncate">{currentUser?.name || 'এডমিন মহোদয়'}</p>
                      <p className="text-[10px] font-bold text-primary truncate">{currentUser?.designation || currentUser?.role || 'অ্যাডমিনিস্ট্রেটর'}</p>
                      {currentUser?.mobile && <p className="text-[10px] font-mono text-text-light">{currentUser.mobile}</p>}
                    </div>
                  </div>

                  <button 
                    onClick={() => { setShowProfile(false); setActiveTab("profile"); }}
                    className="w-full text-left px-3 py-2 hover:bg-step-bg rounded-xl text-xs font-bold flex items-center gap-2 text-primary cursor-pointer"
                  >
                    <User className="w-4 h-4 text-primary" /> ইউজারের বিস্তারিত প্রোফাইল
                  </button>
                  <div className="h-px bg-border-main my-1" />
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 hover:bg-error/10 rounded-xl text-xs font-bold flex items-center gap-2 text-error cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> লগআউট (Logout)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>

    {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[var(--color-bg)] z-[9999] flex flex-col p-4 font-hind-siliguri"
          >
            {/* Search Input Area */}
            <div className="flex items-center gap-3 border-b border-border-main/50 pb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  placeholder="শিক্ষার্থী, ওস্তাদ, সেকশন..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  className="w-full bg-step-bg border border-border-main focus:border-primary/40 focus:bg-card rounded-full pl-10 pr-10 py-2.5 text-xs font-semibold outline-none text-text-main transition-all placeholder:text-text-light/40"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-light/60 hover:text-text-main cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  setSearchQuery("");
                }}
                className="text-xs font-black text-primary px-2 py-1 active:scale-95 transition-transform shrink-0"
              >
                বাতিল
              </button>
            </div>

            {/* Search Results Area */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-4 pb-24 scroll-smooth overscroll-contain">
              {searchQuery.trim() ? (
                hasAnyResults ? (
                  <div className="bg-card border border-border-main rounded-2xl overflow-hidden shadow-sm divide-y divide-border-main/50">
                    {/* Modules */}
                    {groupedResults.modules.length > 0 && (
                      <div className="p-2">
                        <p className="text-[11px] font-black text-text-light uppercase tracking-wider px-4 py-1.5 bg-step-bg/30 rounded-lg mx-2 my-1">
                          মডিউল ও সেকশন
                        </p>
                        {groupedResults.modules.map((res: any, idx) => (
                          <button
                            key={`mod-m-${idx}`}
                            onClick={() => {
                              setActiveTab(res.id);
                              setIsMobileSearchOpen(false);
                              setSearchQuery("");
                            }}
                            className="w-full text-left px-4 py-3.5 hover:bg-step-bg active:bg-step-bg/80 rounded-xl flex items-center gap-3.5 transition-all text-text-main cursor-pointer select-none"
                          >
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <LayoutGrid className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold">{res.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Students */}
                    {groupedResults.students.length > 0 && (
                      <div className="p-2">
                        <p className="text-[11px] font-black text-text-light uppercase tracking-wider px-4 py-1.5 bg-step-bg/30 rounded-lg mx-2 my-1">
                          শিক্ষার্থীবৃন্দ
                        </p>
                        {groupedResults.students.map((res: any, idx) => (
                          <button
                            key={`stud-m-${idx}`}
                            onClick={() => {
                              setJumpToStudentId(res.id?.toString() || "");
                              setActiveTab("students");
                              setIsMobileSearchOpen(false);
                              setSearchQuery("");
                            }}
                            className="w-full text-left px-4 py-3.5 hover:bg-step-bg active:bg-step-bg/80 rounded-xl flex items-center gap-3.5 transition-all text-text-main cursor-pointer select-none"
                          >
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text-main">{res.name}</p>
                              <p className="text-[11px] text-text-light font-semibold">{res.sub}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Staff */}
                    {groupedResults.staff.length > 0 && (
                      <div className="p-2">
                        <p className="text-[11px] font-black text-text-light uppercase tracking-wider px-4 py-1.5 bg-step-bg/30 rounded-lg mx-2 my-1">
                          ওস্তাদ ও কর্মচারী
                        </p>
                        {groupedResults.staff.map((res: any, idx) => (
                          <button
                            key={`staff-m-${idx}`}
                            onClick={() => {
                              setActiveTab("teachers");
                              setIsMobileSearchOpen(false);
                              setSearchQuery("");
                            }}
                            className="w-full text-left px-4 py-3.5 hover:bg-step-bg active:bg-step-bg/80 rounded-xl flex items-center gap-3.5 transition-all text-text-main cursor-pointer select-none"
                          >
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text-main">{res.name}</p>
                              <p className="text-[11px] text-text-light font-semibold">{res.sub}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-text-light">
                    কোনো তথ্য পাওয়া যায়নি
                  </div>
                )
              ) : (
                <div className="p-2 space-y-4">
                  <p className="text-xs font-bold text-text-light uppercase tracking-wider">
                    জনপ্রিয় অনুসন্ধান সমূহ
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "ড্যাশবোর্ড", id: "dashboard" },
                      { label: "শিক্ষার্থী তালিকা", id: "student-all" },
                      { label: "নতুন ভর্তি", id: "admission-new" },
                      { label: "উপস্থিতি", id: "student-attendance" },
                      { label: "ফি সংগ্রহ ব্যাবস্থাপনা", id: "student-fees" },
                      { label: "মাদ্রাসা ব্যয়", id: "expenses" },
                      { label: "সকল রিপোর্ট", id: "reports" },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileSearchOpen(false);
                        }}
                        className="px-4 py-3.5 bg-card hover:bg-step-bg border border-border-main text-xs font-semibold text-text-main rounded-full transition-colors cursor-pointer active:scale-95"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
  </>
  );
}
