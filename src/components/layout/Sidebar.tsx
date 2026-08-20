import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { Theme } from "../../types";
import { useData } from "../../contexts/DataContext";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  Wallet,
  ShoppingBag,
  UserCheck,
  ShieldCheck,
  Archive,
  Settings,
  BookOpen,
  ChevronDown,
  Bell,
  AlertCircle,
  FileText,
  TrendingUp,
  LayoutGrid,
  Coins,
  CreditCard,
  LogOut,
  ChevronRight,
  ChevronLeft,
  X,
  Calendar,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Trash2,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onLogout: () => void;
  sidebarMode: "hidden" | "mini" | "expanded";
  setSidebarMode: (mode: "hidden" | "mini" | "expanded") => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  currentUser?: any;
}

const DateWidget = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const [dateInfo, setDateInfo] = useState({
    dayName: "",
    hijri: "",
    bengali: "",
    english: "",
  });

  useEffect(() => {
    const d = new Date();
    const dayName = new Intl.DateTimeFormat("bn-BD", { weekday: "long" }).format(d);
    const month = new Intl.DateTimeFormat("bn-BD", { month: "long" }).format(d);
    const day = new Intl.DateTimeFormat("bn-BD", { day: "numeric" }).format(d);
    
    // Format: ২ আগস্ট ২০২৬, রবিবার
    const enFormatted = `${day} ${month} ${new Intl.DateTimeFormat("bn-BD", { year: "numeric" }).format(d)}, ${dayName}`;

    const hijriFormatter = new Intl.DateTimeFormat("bn-BD-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const hijriFormatted = hijriFormatter.format(d).replace("যুগ", "হিজরি") || "১৭ সফর ১৪৪৮ হিজরি";

    setDateInfo({
      dayName,
      english: enFormatted,
      hijri: hijriFormatted,
      bengali: "১৮ শ্রাবণ ১৪৩৩ বঙ্গাব্দ",
    });
  }, []);

  if (isCollapsed) return null;

  return (
    <div className="mx-3 mb-4 p-3 rounded-2xl bg-white/5 border border-white/10 font-hind-siliguri space-y-1 text-xs text-white shadow-sm select-none">
      <div className="font-black text-white/95 flex items-center gap-2 text-[11px]">
        <Calendar size={13} className="text-primary-light shrink-0" />
        <span>{dateInfo.english}</span>
      </div>
      <div className="text-[10px] font-medium text-white/70 pl-5">
        হিজরি: {dateInfo.hijri}
      </div>
      <div className="text-[10px] font-medium text-white/70 pl-5">
        বঙ্গাব্দ: {dateInfo.bengali}
      </div>
    </div>
  );
};

export function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
  sidebarMode,
  setSidebarMode,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  currentUser,
}: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {},
  );

  const handleParentClick = (id: string, isCollapsedNow: boolean) => {
    if (isCollapsedNow && window.innerWidth >= 1024) {
      setSidebarMode("expanded");
      setExpandedMenus({ [id]: true });
    } else {
      setExpandedMenus((prev) => {
        const isOpen = !prev[id];
        return isOpen ? { [id]: true } : {};
      });
    }
  };

  // Keep parent menu expanded when activeTab changes, and collapse all other menus
  React.useEffect(() => {
    const parent = menuItems.find(
      (item) =>
        "subItems" in item &&
        item.subItems?.some((sub: any) => sub.id === activeTab)
    );
    if (parent) {
      setExpandedMenus({
        [parent.id]: true,
      });
    }
  }, [activeTab]);

  const menuItems = [
    { id: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
    {
      id: "admission-group",
      label: "ভর্তি",
      icon: GraduationCap,
      subItems: [
        { id: "admission-new", label: "নতুন ভর্তি" },
        { id: "admission-multiple", label: "একাধিক শিক্ষার্থী যোগ" },
        { id: "admission-inquiry", label: "ভর্তি জিজ্ঞাসা" },
        { id: "admission-form", label: "ভর্তি ফর্ম" },
      ],
    },
    {
      id: "students-group",
      label: "শিক্ষার্থী ব্যবস্থাপনা",
      icon: Users,
      subItems: [
        { id: "student-new", label: "নতুন শিক্ষার্থী" },
        { id: "student-all", label: "সমস্ত শিক্ষার্থী" },
        { id: "student-update-all", label: "সকল শিক্ষার্থী আপডেট" },
        { id: "student-inactive", label: "নিষ্ক্রিয় শিক্ষার্থী" },
        { id: "student-jamats", label: "জামাতভিত্তিক শিক্ষার্থী" },
      ],
    },
    
    {
      id: "academic",
      label: "একাডেমিক ব্যবস্থাপনা",
      icon: BookOpen,
      subItems: [
        { id: "academic-departments", label: "বিভাগ সমূহ" },
        { id: "academic-class", label: "জামাত/শ্রেণী" },
        { id: "academic-branch", label: "শাখা" },
        { id: "academic-subject", label: "বিষয়/সাবজেক্ট" },
        { id: "academic-class-subject", label: "জামাত-বিষয় অ্যাসাইন" },
        { id: "academic-teacher-subject", label: "শিক্ষক-সাবজেক্ট অ্যাসাইন" },
        { id: "academic-metrics", label: "মূল্যায়ন মেট্রিক্স" },
      ],
    },
    {
      id: "exam",
      label: "পরীক্ষা",
      icon: ClipboardList,
      subItems: [
        { id: "exam-list", label: "পরীক্ষার তালিকা" },
        { id: "academic-exam-dates", label: "পরীক্ষার সময়সীমা" },
        { id: "exam-routine", label: "পরীক্ষার রুটিন" },
        { id: "exam-admit", label: "বেতাকাতুত দুখুল (Admit Card)" },
        { id: "exam-seats", label: "আসন বিন্যাস" },
        { id: "exam-results", label: "মার্ক এন্ট্রি" },
        { id: "exam-tabulation", label: "নম্বর শীট & ফলাফল কার্ড" },
        { id: "exam-lock", label: "মার্কশিট লক" },
        { id: "exam-certificate", label: "সার্টিফিকেট" },
      ],
    },
    { id: "testimonial", label: "প্রত্যয়ন পত্র", icon: FileText },
    {
      id: "finance-group",
      label: "ফি সংগ্রহ ব্যাবস্থাপনা",
      icon: Coins,
      subItems: [
        { id: "student-fees", label: "ফি সংগ্রহ" },
        { id: "finance-fees-statement", label: "আদায়কৃত ফি সমূহ" },
        { id: "fees-income-summary", label: "আয় পর্যবেক্ষণ খাত সামারি" },
        { id: "fees-cost-package", label: "খরচের প্যাকেজ /বিবরণ" },
      ],
    },
    {
      id: "income-group",
      label: "আয় সমূহ",
      icon: Wallet,
      subItems: [
        { id: "income-summary", label: "আয় সামারি ও বিবরণী" },
        { id: "income-cash-receive", label: "নতুন নগদ গ্রহণ" },
        { id: "income-cash-list", label: "সকল নগদ গ্রহণ" },
        { id: "income-general", label: "সাধারণ আয়" },
        { id: "income-lillah", label: "লিল্লাহ আয়" },
      ],
    },
    {
      id: "expense-group",
      label: "ব্যয় সমূহ",
      icon: ShoppingBag,
      subItems: [
        { id: "expense-new", label: "নতুন ব্যয়" },
        { id: "expense-lillah", label: "লিল্লাহ ব্যয়" },
        { id: "expenses", label: "সমস্ত ব্যয় সমূহ" },
      ],
    },
    { id: "investment", label: "বিনিয়োগ", icon: TrendingUp },
    {
      id: "id-card",
      label: "আইডি কার্ড",
      icon: CreditCard,
      subItems: [
        { id: "id-card-design1", label: "Design Theme 1" },
        { id: "id-card-design2", label: "Design Theme 2" },
        { id: "id-card-print", label: "প্রিন্ট আইডি কার্ড" },
      ],
    },
    {
      id: "attendance",
      label: "উপস্থিতি ও হাজিরা",
      icon: UserCheck,
      subItems: [
        { id: "student-attendance", label: "শিক্ষার্থী হাজিরা ও মার্কস" },
        { id: "attendance-messaging", label: "স্বয়ংক্রিয় SMS মেসেজিং" },
        { id: "student-attendance-criteria", label: "হাজিরা মার্কিং ক্রাইটেরিয়া" },
        { id: "student-attendance-report", label: "শিক্ষার্থী হাজিরা রিপোর্ট" },
        { id: "teacher-attendance", label: "শিক্ষক হাজিরা ও বেতন লিঙ্ক" },
        { id: "staff-attendance", label: "কর্মী হাজিরা ও এইচআর লিভ" },
        { id: "staff-attendance-report", label: "কর্মী উপস্থিতি রিপোর্ট" },
        { id: "attendance-history", label: "হাজিরা খতিয়ান ও অডিট" },
      ],
    },
    {
      id: "teachers",
      label: "এইচআর ও শিক্ষক",
      icon: ShieldCheck,
      subItems: [
        { id: "teachers-list", label: "শিক্ষক ও কর্মী তালিকা" },
        { id: "teacher-add", label: "নতুন শিক্ষক/কর্মী যোগ" },
        { id: "teacher-attendance", label: "শিক্ষক হাজিরা ও অটো বেতন" },
        { id: "staff-salary", label: "বেতন/স্যালারি শিট সমূহ" },
        { id: "staff-leaves", label: "ছুটি অনুমোদন ও ব্যালেন্স" },
        { id: "staff-shift", label: "শিফট" },
        { id: "staff-shift-allocate", label: "শিফট বরাদ্দ" },
        { id: "staff-hr-settings", label: "এইচআর সেটিংস" },
      ],
    },
    { id: "parents", label: "অভিভাবক", icon: Users },
    { id: "users", label: "ব্যবহারকারী/ইউজারগণ", icon: ShieldCheck },
    { id: "services", label: "সেবা সমূহ", icon: LayoutGrid },
    { id: "notice", label: "নোটিশ ব্যবস্থাপনা", icon: Bell },
    { id: "problems", label: "মাদ্রাসা সমস্যা", icon: AlertCircle },
    {
      id: "settings",
      label: "সেটিংস",
      icon: Settings,
      subItems: [
        { id: "settings-app", label: "অ্যাপ্লিকেশন সেটআপ" },
        { id: "settings-software", label: "মিডিয়া ও ডাটাবেস ছবি সেটিং" },
        { id: "settings-exam", label: "পরীক্ষার সেটিংস" },
        { id: "settings-source-inst", label: "উৎস প্রতিষ্ঠান" },
        { id: "settings-company", label: "কোম্পানি / ব্র্যান্ড" },
        { id: "settings-datatype", label: "ডেটা টাইপ" },
        { id: "settings-invoice", label: "ভর্তি ইনভয়েস সেটআপ" },
        { id: "settings-sms", label: "এসএমএস সেটিংস" },
      ],
    },
    { id: "reports", label: "সকল রিপোর্ট", icon: FileText },
    { id: "srs-docs", label: "সিস্টেম স্পেসিফিকেশন (SRS)", icon: BookOpen },
    { id: "recycle-bin", label: "রিসাইকেল বিন (Trash)", icon: Trash2 },
  ];

  const { madrasahBranding } = useData();

  const SidebarContent = ({ forceExpanded = false }: { forceExpanded?: boolean }) => {
    const isCollapsedNow = forceExpanded ? false : sidebarMode !== "expanded";

    return (
      <div className="flex flex-col h-full overflow-hidden text-white w-full relative group/sidebar">
        {/* Brand Header */}
        <div
          className={cn(
            "flex items-center justify-between h-16 shrink-0 transition-all duration-300 relative",
            isCollapsedNow ? "justify-center px-0" : "px-4",
          )}
        >
          <div className="flex items-center overflow-hidden">
            <div className="w-10 h-10 rounded-[4px] bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={madrasahBranding?.logoUrl || "/src/PNG/LOGO.png"}
                alt="Madrasa Logo"
                className="w-full h-full object-cover"
              />
            </div>
            {!isCollapsedNow && (
              <div className="ml-3">
                <h1 className="text-sm font-black tracking-tight leading-none text-white drop-shadow-sm">
                  {madrasahBranding?.name || "আল মাদানিয়া"}
                </h1>
                <p className="text-[9px] text-white/70 font-semibold tracking-wider uppercase mt-1">
                  মাদ্রাসা ম্যানেজমেন্ট সিস্টেম
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-4 px-2.5 space-y-1">
          {menuItems.map((item, index) => {
            const isActive = activeTab === item.id || (item.subItems && item.subItems.some((s: any) => s.id === activeTab));
            const isParentActive = item.subItems && item.subItems.some((s: any) => s.id === activeTab);
            const isExpanded = !!expandedMenus[item.id];
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      handleParentClick(item.id, isCollapsedNow);
                    } else {
                      setActiveTab(item.id);
                      setIsMobileDrawerOpen(false);
                    }
                  }}
                  style={index === 0 ? { paddingLeft: "12px", borderRadius: "7px" } : undefined}
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl transition-all duration-300 cursor-pointer relative",
                    isCollapsedNow ? "justify-center p-2.5" : "px-3 py-2.5",
                    isActive
                      ? "bg-black/30 text-white font-black border border-white/10 shadow-inner"
                      : "text-white/80 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {isActive && !isCollapsedNow && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white/70 rounded-r-full shadow-sm" />
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <item.icon
                      size={18}
                      className={cn(
                        "shrink-0 transition-transform duration-300",
                        isActive ? "text-white scale-110" : "text-white/70",
                      )}
                    />

                    {!isCollapsedNow && (
                      <span className={cn(
                        "text-[12px] tracking-wide truncate",
                        isActive ? "font-black text-white" : "font-medium"
                      )}>
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!isCollapsedNow && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isParentActive && (
                        <span className="px-1.5 py-0.5 text-[9px] font-black bg-white/10 text-white/90 border border-white/20 rounded-md">
                          সক্রিয়
                        </span>
                      )}
                      {hasSubItems && (
                        <ChevronRight
                          size={16}
                          className={cn(
                            "transition-transform duration-300 text-white/50",
                            isExpanded && "transform rotate-90 text-white",
                          )}
                        />
                      )}
                    </div>
                  )}
                </button>

                {/* Sub items (accordion) */}
                <AnimatePresence initial={false}>
                  {!isCollapsedNow && hasSubItems && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-7 pr-1 py-1 space-y-1 border-l-2 border-white/10 ml-4 my-1">
                        {(item.subItems as any[]).map((sub) => {
                          const isSubActive = activeTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setActiveTab(sub.id);
                                setIsMobileDrawerOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-xl text-[11px] font-medium transition-all relative flex items-center justify-between gap-2 cursor-pointer",
                                isSubActive
                                  ? "text-white bg-black/20 font-black border border-white/5 shadow-inner"
                                  : "text-white/70 hover:text-white hover:bg-white/5",
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {isSubActive ? (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-pulse" />
                                ) : (
                                  <div className="w-1 h-1 rounded-full bg-white/30 shrink-0" />
                                )}
                                <span className="truncate">{sub.label}</span>
                              </div>

                              {isSubActive && (
                                <span className="px-1.5 py-0.5 text-[8px] font-black bg-white/20 text-white rounded-md shrink-0 shadow-sm">
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <DateWidget isCollapsed={isCollapsedNow} />



        {/* Footer Profile */}
        <div
          className={cn(
            "shrink-0 border-t border-white/10 p-3 flex flex-col gap-2 transition-all duration-300",
            isCollapsedNow ? "items-center" : "",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between gap-2 rounded-xl p-2 bg-white/5 border border-white/5",
              isCollapsedNow ? "justify-center p-1.5" : "",
            )}
          >
            <div 
              onClick={() => {
                setActiveTab("profile");
                setIsMobileDrawerOpen(false);
              }}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group/prof flex-1"
              title="প্রোফাইল দেখুন ও কাস্টমাইজ করুন"
            >
              <div className="relative shrink-0">
                {currentUser?.photoUrl ? (
                  <img 
                    src={currentUser.photoUrl} 
                    alt="Profile" 
                    className="w-9 h-9 rounded-full object-cover border border-white/20 shadow-xs" 
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-white shadow-xs">
                    {(currentUser?.name || "Admin User").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[var(--sidebar-bg)] rounded-full"></div>
              </div>

              {!isCollapsedNow && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-white group-hover/prof:text-primary-light transition-colors">
                    {currentUser?.name || "Admin User"}
                  </p>
                  <p className="text-[10px] text-white/60 truncate">
                    {currentUser?.designation || "Super Admin"}
                  </p>
                </div>
              )}
            </div>

            {!isCollapsedNow && (
              <button
                onClick={onLogout}
                className="w-8 h-8 rounded-lg bg-error/10 hover:bg-error/20 text-error flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="লগ আউট"
              >
                <LogOut size={15} />
              </button>
            )}

            {isCollapsedNow && (
              <button
                onClick={onLogout}
                className="w-full mt-1 p-1.5 rounded-lg text-error hover:bg-error/20 flex items-center justify-center transition-colors cursor-pointer"
                title="লগ আউট"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar (Mode 1, 2 & 3) */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen fixed left-0 top-0 z-50 bg-[var(--sidebar-bg)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl overflow-hidden",
          sidebarMode === "hidden"
            ? "w-0 -translate-x-full border-none shadow-none"
            : sidebarMode === "mini"
            ? "w-[70px] translate-x-0"
            : "w-64 translate-x-0",
        )}
      >
        <SidebarContent forceExpanded={false} />
      </aside>

      {/* Desktop Edge Trigger when hidden */}
      {sidebarMode === "hidden" && (
        <div 
          className="fixed left-0 top-0 bottom-0 w-2 z-[60] hidden lg:block cursor-ew-resize group"
          onMouseEnter={() => setSidebarMode("mini")}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-white/20 group-hover:bg-primary-light rounded-r-lg transition-colors shadow-lg" />
        </div>
      )}

      {/* Mobile Drawer (Always starts open/slide-in, force text) */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-[90] lg:hidden backdrop-blur-sm"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-[var(--sidebar-bg)] shadow-2xl z-[100] lg:hidden"
            >
              <SidebarContent forceExpanded={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
