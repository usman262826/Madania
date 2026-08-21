import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Coins, 
  ShieldCheck, 
  Menu, 
  ChevronUp, 
  Sparkles,
  FileText,
  QrCode
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsMobileDrawerOpen: (open: boolean) => void;
  isMobileDrawerOpen: boolean;
  onOpenQuickScan?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  setIsMobileDrawerOpen,
  isMobileDrawerOpen,
  onOpenQuickScan,
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 180);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'student-all', label: 'শিক্ষার্থী', icon: Users, matchGroup: ['students', 'student-all', 'student-new', 'admission-new'] },
    { id: 'student-fees', label: 'ফি সংগ্রহ', icon: Coins, matchGroup: ['student-fees', 'finance-fees-statement', 'income-summary'] },
    { id: 'teachers-list', label: 'ওস্তাদগণ', icon: ShieldCheck, matchGroup: ['teachers-list', 'teacher-add', 'staff-salary'] },
  ];

  const isCurrentActive = (item: typeof navItems[0]) => {
    if (activeTab === item.id) return true;
    if (item.matchGroup && item.matchGroup.includes(activeTab)) return true;
    return false;
  };

  const handleNavClick = (itemId: string) => {
    setActiveTab(itemId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Floating Scroll To Top Button for Mobile */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-20 right-4 z-[85] lg:hidden w-11 h-11 rounded-2xl bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center border border-white/20 active:scale-95 transition-transform cursor-pointer"
            title="উপরে যান (Scroll to Top)"
          >
            <ChevronUp size={22} className="animate-bounce" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sticky Mobile Bottom Quick Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[80] lg:hidden bg-card/95 backdrop-blur-xl border-t border-border-main/80 shadow-[0_-4px_25px_rgba(0,0,0,0.12)] px-2 py-2 select-none">
        <div className="flex items-center justify-around max-w-md mx-auto relative">
          {navItems.map((item) => {
            const active = isCurrentActive(item);
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-300 relative cursor-pointer min-w-[58px]",
                  active
                    ? "text-primary font-black scale-105"
                    : "text-text-light hover:text-text-main"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="mobileBottomTabPill"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-2xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <div className="relative">
                  <Icon size={20} className={cn("transition-transform", active ? "scale-110 text-primary" : "")} />
                  {active && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
                  )}
                </div>

                <span className={cn(
                  "text-[10px] mt-1 font-bold tracking-tight truncate max-w-[64px]",
                  active ? "text-primary font-black" : "text-text-light/80"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Quick Scan QR Button */}
          {onOpenQuickScan && (
            <button
              id="mobile-bottom-quick-scan-btn"
              onClick={() => onOpenQuickScan()}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-300 relative cursor-pointer min-w-[54px] text-emerald-600 hover:text-emerald-700 active:scale-95"
              title="আইডি কার্ড কুইক স্ক্যানার"
            >
              <div className="relative p-1 bg-emerald-500/15 border border-emerald-500/30 rounded-xl">
                <QrCode size={18} className="text-emerald-600 animate-pulse" />
              </div>
              <span className="text-[10px] mt-0.5 font-black tracking-tight text-emerald-600">
                স্ক্যান
              </span>
            </button>
          )}

          {/* Full Menu / Drawer Toggle */}
          <button
            onClick={() => {
              setIsMobileDrawerOpen(!isMobileDrawerOpen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-300 relative cursor-pointer min-w-[58px]",
              isMobileDrawerOpen
                ? "bg-primary text-white shadow-lg shadow-primary/25 font-black scale-105"
                : "text-text-light hover:text-text-main hover:bg-step-bg"
            )}
          >
            <div className="relative">
              <Menu size={20} className={cn("transition-transform", isMobileDrawerOpen ? "scale-110 text-white" : "")} />
              <span className="absolute -top-1 -right-1.5 px-1 py-0.2 bg-emerald-500 text-[8px] font-black text-white rounded-full leading-none">
                সব
              </span>
            </div>

            <span className={cn(
              "text-[10px] mt-1 font-bold tracking-tight",
              isMobileDrawerOpen ? "text-white font-black" : "text-text-light/80"
            )}>
              সকল মেনু
            </span>
          </button>
        </div>
      </div>
    </>
  );
};
