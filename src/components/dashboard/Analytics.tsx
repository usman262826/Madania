import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  Hourglass,
  TrendingUp,
  AlertCircle,
  Clock,
  GraduationCap,
  Coins,
  Wallet,
  ShoppingBag,
  UserCheck,
  ShieldCheck,
  Archive,
  ChevronRight,
  HandCoins,
  CalendarDays,
  Target,
  BookOpen,
  X,
  Layers,
  PowerOff,
  CheckCircle,
  Activity,
  Sparkles,
  FileText,
  Award,
  MessageSquare,
  Megaphone,
  Smartphone,
  Database,
  Bell,
  HeartPulse,
  Briefcase,
  Plus,
  Trash2,
  Edit3,
  Save,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  CreditCard,
  Settings,
} from "lucide-react";
import { Student, Application } from "../../types";
import { useData } from "../../contexts/DataContext";
import { enToBnNumber, isClassMatch, getDepartmentForClass, cn } from "../../lib/utils";
import { JAMAT_LIST, ACADEMIC_YEARS, STANDARD_JAMAT_PRESETS } from "../../constants";
import { motion } from "framer-motion";
import { 
  getDailyAttendanceDb, 
  getSmsAccountStats, 
  subscribeToAttendanceUpdates, 
  getSentMessageLogs, 
  addSmsBundle,
  SmsAccountStats 
} from "../../services/attendanceEngine";
import { SentMessageLog } from "../../types/attendance";
import { Send, Radio, Zap, Check, CheckCheck, RefreshCw } from "lucide-react";

const MONTH_NAMES_BN = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

const parseDateToMonthYear = (dateStr: any): { monthIndex: number; year: number } | null => {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  const engStr = str.replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d).toString());

  let match = engStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const monthIndex = parseInt(match[2], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) return { monthIndex, year };
  }

  match = engStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) {
    const year = parseInt(match[3], 10);
    const monthIndex = parseInt(match[2], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) return { monthIndex, year };
  }

  const d = new Date(engStr);
  if (!isNaN(d.getTime())) {
    return { monthIndex: d.getMonth(), year: d.getFullYear() };
  }

  return null;
};

interface AnalyticsProps {
  students: Student[];
  pending: Application[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  setActiveTab?: (tab: string) => void;
}

// Interactive Real-Data Subcomponents for modular showcase
const AttendanceWorkflow: React.FC<{ enToBn: (s: string) => string }> = ({
  enToBn,
}) => {
  const { students } = useData();
  const sampleStudents = React.useMemo(() => {
    if (students.length > 0) {
      return students.slice(0, 5).map((s: any) => s['शिक्षার্থীর নাম'] || s.name || 'শিক্ষার্থী');
    }
    return [];
  }, [students]);

  const [attendance, setAttendance] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (sampleStudents.length > 0) {
      const initial: Record<string, boolean> = {};
      sampleStudents.forEach((st) => {
        initial[st] = true;
      });
      setAttendance(initial);
    }
  }, [sampleStudents]);

  const [saved, setSaved] = React.useState(false);

  const toggle = (name: string) => {
    setAttendance((prev) => ({ ...prev, [name]: !prev[name] }));
    setSaved(false);
  };

  if (sampleStudents.length === 0) {
    return (
      <div className="p-4 bg-card rounded-2xl border border-emerald-500/10 text-center py-6 text-xs text-text-light font-bold">
        ডাটাবেসে কোনো শিক্ষার্থী যুক্ত নেই।
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-card rounded-2xl border border-emerald-500/10">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-black text-text-main">
          দৈনিক হাজিরা খাতা (রিয়েল টাইম)
        </span>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full font-black">
          সক্রিয়
        </span>
      </div>
      <div className="space-y-2">
        {Object.entries(attendance).map(([name, status], idx) => (
          <div
            key={name}
            className="flex items-center justify-between p-2.5 rounded-xl bg-step-bg border border-border-main/45 dark:border-slate-800"
          >
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-text-light/80">
                {enToBn((idx + 1).toString())}
              </span>
              <span className="text-xs font-bold text-text-main">{name}</span>
            </div>
            <button
              type="button"
              onClick={() => toggle(name)}
              className={`px-3 py-1 text-[10px] sm:text-xs font-black rounded-lg transition-all cursor-pointer select-none active:scale-95 ${
                status
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-rose-500 text-white shadow-sm"
              }`}
            >
              {status ? "উপস্থিত (Present)" : "অনুপস্থিত (Absent)"}
            </button>
          </div>
        ))}
      </div>
      <div className="pt-2 flex justify-between items-center">
        {saved ? (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black animate-pulse">
            ✓ হাজিরা সফলভাবে সেভ করা হয়েছে!
          </p>
        ) : (
          <p className="text-[10px] text-text-light/50 font-bold">
            স্টেটাস পরিবর্তন করতে ট্যাপ করুন
          </p>
        )}
        <button
          type="button"
          onClick={() => setSaved(true)}
          className="py-2 px-4 bg-emerald-500 text-white font-black text-xs rounded-xl active:scale-95 transition-transform cursor-pointer"
        >
          হাজিরা সংরক্ষণ করুন
        </button>
      </div>
    </div>
  );
};

const StudentInfoWorkflow: React.FC<{ enToBn: (s: string) => string }> = ({
  enToBn,
}) => {
  const { students } = useData();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filtered = React.useMemo(() => {
    return students.filter((s: any) => {
      const name = (s['शिक्षার্থীর নাম'] || s.name || '').toString().toLowerCase();
      const cls = (s['জামাত/শ্রেণী'] || s.class || '').toString().toLowerCase();
      const term = searchTerm.toLowerCase();
      return name.includes(term) || cls.includes(term);
    }).slice(0, 5);
  }, [students, searchTerm]);

  if (students.length === 0) {
    return (
      <div className="p-4 bg-card rounded-2xl border border-blue-500/10 text-center py-6 text-xs text-text-light font-bold">
        ডাটাবেসে কোনো শিক্ষার্থী প্রোফাইল পাওয়া যায়নি।
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-card rounded-2xl border border-blue-500/10">
      <input
        type="text"
        placeholder="শিক্ষার্থীর নাম বা জামাত লিখে খুঁজুন..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full text-xs bg-step-bg border border-border-main p-2.5 rounded-xl outline-none text-text-main placeholder-text-light/50 font-bold"
      />
      <div className="space-y-2.5">
        {filtered.map((s: any, idx: number) => {
          const sName = s['शिक्षার্থীর নাম'] || s.name || 'শিক্ষার্থী';
          const sRoll = s['রোল নম্বর'] || s.roll || enToBn((idx + 1).toString());
          const sClass = s['জামাত/শ্রেণী'] || s.class || 'সাধারণ';
          const sFather = s['পিতার নাম'] || s.fatherName || 'অজ্ঞাত';
          const sPhone = s['মোবাইল (মা)'] || s['মোবাইল (বাবা/ভাই)'] || s.mobile || 'N/A';

          return (
            <div
              key={s.id || idx}
              className="p-3 rounded-xl bg-step-bg border border-border-main/50 text-xs space-y-1.5 font-sans justify-start text-left"
            >
              <div className="flex justify-between items-center">
                <span className="font-sans font-black text-text-main text-sm">
                  {sName}
                </span>
                <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-sans font-black">
                  রোল: {sRoll}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-text-light text-[11px] font-sans">
                <p className="text-left text-text-light/70">
                  <span className="font-bold text-text-light/50">জামাত:</span>{" "}
                  {sClass}
                </p>
                <p className="text-left text-text-light/70">
                  <span className="font-bold text-text-light/50">পিতা:</span>{" "}
                  {sFather}
                </p>
                <p className="col-span-2 text-left text-text-light/70">
                  <span className="font-bold text-text-light/50">
                    অভিভাবক ফোন:
                  </span>{" "}
                  {enToBn(sPhone)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AdmissionPlacementWorkflow: React.FC<{
  enToBn: (s: string) => string;
}> = ({ enToBn }) => {
  const [name, setName] = React.useState("");
  const [cls, setCls] = React.useState("নাহবেমীর");
  const [placement, setPlacement] = React.useState<any | null>(null);

  const handleTest = () => {
    if (!name.trim()) return;
    setPlacement({
      roll: enToBn(Math.floor(100 + Math.random() * 900).toString()),
      room: enToBn(Math.floor(1 + Math.random() * 5).toString()),
      status: "পরীক্ষায় উত্তীর্ণ (যোগ্য)",
    });
  };

  return (
    <div className="space-y-3 p-4 bg-card rounded-2xl border border-indigo-500/10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="text-left">
          <label className="text-[10px] font-black uppercase text-text-light/55 mb-1 block text-left">
            নতুন শিক্ষার্থীর নাম
          </label>
          <input
            type="text"
            placeholder="যেমন: ইসমাইল আহমেদ"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setPlacement(null);
            }}
            className="w-full text-xs bg-step-bg border border-border-main p-3 rounded-xl outline-none text-text-main font-bold"
          />
        </div>
        <div className="text-left">
          <label className="text-[10px] font-black uppercase text-text-light/55 mb-1 block text-left">
            কাম্য জামাত/শ্রেণী
          </label>
          <select
            value={cls}
            onChange={(e) => {
              setCls(e.target.value);
              setPlacement(null);
            }}
            className="w-full text-xs bg-step-bg border border-border-main p-3 rounded-xl outline-none text-text-main font-bold"
          >
            {JAMAT_LIST.slice(0, 5).map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={handleTest}
        className="w-full py-2.5 bg-indigo-500 text-white text-xs font-black rounded-xl hover:bg-indigo-600 transition-colors cursor-pointer"
      >
        পরীক্ষা প্লেসমেন্ট ও রোল জেনারেট করুন
      </button>

      {placement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3.5 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-2xl text-xs space-y-1.5 font-sans justify-start text-left"
        >
          <p className="font-sans font-black text-emerald-600 dark:text-emerald-400 text-[13px] text-left">
            জারীকৃত ভর্তি প্লেসমেন্ট:
          </p>
          <div className="grid grid-cols-2 gap-2 text-text-main text-[11px] font-sans">
            <p className="text-left">
              <span className="font-sans font-bold text-text-light/55">
                কক্ষ নং:
              </span>{" "}
              {placement.room} নং হল
            </p>
            <p className="text-left">
              <span className="font-sans font-bold text-text-light/55">
                জেনারেটেড রোল:
              </span>{" "}
              {placement.roll}
            </p>
            <p className="col-span-2 text-left">
              <span className="font-sans font-bold text-text-light/55">
                ভর্তির অবস্থা:
              </span>{" "}
              <span className="font-sans font-black text-emerald-600 dark:text-emerald-400">
                {placement.status}
              </span>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const OnlineFeesReceiptWorkflow: React.FC<{
  enToBn: (s: string) => string;
}> = ({ enToBn }) => {
  const [feeType, setFeeType] = React.useState("মাসিক বেতন");
  const [amount, setAmount] = React.useState("৫০০");
  const [phone, setPhone] = React.useState("");
  const [step, setStep] = React.useState<"form" | "receipt">("form");

  return (
    <div className="p-4 bg-card rounded-2xl border border-pink-500/10">
      {step === "form" ? (
        <div className="space-y-3 font-sans text-left">
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="text-left">
              <label className="text-[10px] font-black uppercase text-text-light/55 block mb-1 text-left">
                ফি-এর ধরণ
              </label>
              <select
                value={feeType}
                onChange={(e) => setFeeType(e.target.value)}
                className="w-full text-xs bg-step-bg border border-border-main p-2.5 rounded-xl outline-none text-text-main font-bold"
              >
                <option value="মাসিক বেতন">মাসিক বেতন (মাসরূফাত)</option>
                <option value="ভর্তি ফি">ভর্তি ফি (দাখেলা)</option>
                <option value="পরীক্ষা ফি">পরীক্ষা ফি (ইমতেহান)</option>
              </select>
            </div>
            <div className="text-left">
              <label className="text-[10px] font-black uppercase text-text-light/55 block mb-1 text-left block">
                পরিমাণ (টাকা)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs bg-step-bg border border-border-main p-2.5 rounded-xl outline-none text-text-main font-bold"
              />
            </div>
          </div>
          <div className="text-left">
            <label className="text-[10px] font-black uppercase text-text-light/55 block mb-1 text-left block">
              পেমেন্টকৃত বিকাশ/নগদ নাম্বার
            </label>
            <input
              type="text"
              placeholder="017XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs bg-step-bg border border-border-main p-2.5 rounded-xl outline-none text-text-main font-bold"
            />
          </div>
          <button
            type="button"
            onClick={() => phone && setStep("receipt")}
            className="w-full py-2.5 bg-pink-500 text-white text-xs font-black rounded-xl hover:bg-pink-600 transition-colors cursor-pointer"
          >
            বিকাশ / নগদ পেমেন্ট সম্পন্ন করুন
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3.5 font-sans justify-start text-left"
        >
          <div className="text-center pb-2 border-b border-dashed border-border-main/60">
            <span className="inline-flex p-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs mb-1.5 font-black">
              ✓ পেমেন্ট সফল হয়েছে
            </span>
            <h4 className="font-sans font-black text-sm text-text-main">
              আল-মাদানী ডিজিটাল রসিদ
            </h4>
            <p className="text-[9px] text-text-light/55 font-bold uppercase tracking-wider">
              রিসিপ্ট আইডি: {enToBn("TRX987251")}
            </p>
          </div>
          <div className="space-y-1.5 text-[11px] text-text-main font-sans">
            <div className="flex justify-between font-sans">
              <span className="text-text-light/60 font-sans">ফি বিভাগ:</span>{" "}
              <span className="font-sans font-bold">{feeType}</span>
            </div>
            <div className="flex justify-between font-sans">
              <span className="text-text-light/60 font-sans">টাকা:</span>{" "}
              <span className="font-sans font-black text-emerald-600 dark:text-emerald-400">
                {enToBn(amount)}/- টাকা
              </span>
            </div>
            <div className="flex justify-between font-sans">
              <span className="text-text-light/60 font-sans">মোবাইল:</span>{" "}
              <span className="font-sans font-bold">{enToBn(phone)}</span>
            </div>
            <div className="flex justify-between font-sans">
              <span className="text-text-light/60 font-sans">গেটওয়ে:</span>{" "}
              <span className="text-pink-500 font-sans font-black">
                bKash (বিকাশ)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setPhone("");
            }}
            className="w-full py-2 border border-pink-500/30 text-pink-500 text-[11px] font-black rounded-xl hover:bg-pink-500/5 transition-colors cursor-pointer"
          >
            নতুন ফি জমা দিন
          </button>
        </motion.div>
      )}
    </div>
  );
};

const ExamGpaCardWorkflow: React.FC<{ enToBn: (s: string) => string }> = ({
  enToBn,
}) => {
  const [marks, setMarks] = React.useState<Record<string, number>>({
    "কুরআন ও তাজবীদ": 85,
    "শরহে বেকায়া": 90,
    হিদায়া: 78,
  });

  const getGpa = () => {
    const values = Object.values(marks) as number[];
    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / 3;
    if (avg >= 80) return { point: "৫.০০", grade: "মুমতাজ (A+)" };
    if (avg >= 65) return { point: "৪.০০", grade: "জায়্যিদ জিদ্দান (A)" };
    return { point: "৩.০০", grade: "জায়্যিদ (B)" };
  };

  const update = (subject: string, val: number) => {
    setMarks((prev) => ({
      ...prev,
      [subject]: Math.min(100, Math.max(0, val)),
    }));
  };

  const gpa = getGpa();

  return (
    <div className="space-y-3.5 p-4 bg-card rounded-2xl border border-amber-500/10 font-sans justify-start text-left">
      <div className="space-y-2">
        {Object.entries(marks).map(([subj, val]) => (
          <div key={subj} className="flex justify-between items-center text-xs">
            <span className="font-sans font-bold text-text-light/80">
              {subj}
            </span>
            <input
              type="number"
              value={val}
              onChange={(e) => update(subj, parseInt(e.target.value) || 0)}
              className="w-14 text-center bg-step-bg border border-border-main/50 p-1 rounded-lg outline-none font-sans font-black text-text-main"
            />
          </div>
        ))}
      </div>
      <div className="p-3 bg-amber-500/[0.04] border border-amber-500/20 rounded-xl flex items-center justify-between">
        <div className="text-left">
          <p className="text-[10px] text-text-light/50 font-bold uppercase leading-none mb-1 text-left">
            মোট গড় বার্ষিক গ্রেড
          </p>
          <span className="font-sans font-black text-text-main text-sm text-left">
            {gpa.grade}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-text-light/50 font-bold uppercase leading-none mb-1 text-right">
            পয়েন্ট
          </p>
          <span className="font-sans font-black text-amber-600 text-lg text-right">
            {gpa.point}
          </span>
        </div>
      </div>
    </div>
  );
};

const TeachersStaffManagementWorkflow: React.FC<{
  enToBn: (s: string) => string;
}> = ({ enToBn }) => {
  const { teachers, staffMembers } = useData();
  const staff = React.useMemo(() => {
    if (teachers.length > 0) return teachers.slice(0, 4);
    if (staffMembers.length > 0) return staffMembers.slice(0, 4);
    return [];
  }, [teachers, staffMembers]);

  if (staff.length === 0) {
    return (
      <div className="p-4 bg-card rounded-2xl border border-cyan-500/10 text-center py-6 text-xs text-text-light font-bold">
        ডাটাবেসে কোনো শিক্ষক বা কর্মচারীর তথ্য জমা নেই।
      </div>
    );
  }

  return (
    <div className="space-y-2.5 p-4 bg-card rounded-2xl border border-cyan-500/10 font-sans justify-start text-left">
      {staff.map((s: any, idx: number) => {
        const sName = s.name || s.staffName || 'শিক্ষক';
        const sRole = s.designation || s.role || 'শিক্ষক';
        const sSub = s.department || s.details || 'একাডেমিক বিভাগ';
        const sMobile = s.mobile || s.phone || 'N/A';

        return (
          <div
            key={s.id || idx}
            className="p-3 rounded-xl bg-step-bg border border-border-main/50 text-xs space-y-1.5 font-sans"
          >
            <div className="flex justify-between items-center">
              <span className="font-sans font-black text-text-main text-sm">
                {sName}
              </span>
              <span className="text-[9px] bg-cyan-500/10 text-cyan-600 px-2 py-0.5 rounded-md font-sans font-black">
                {sRole}
              </span>
            </div>
            <p className="text-[11px] text-text-light/65 text-left">
              <span className="font-bold text-text-light/50">
                বিভাগ/দায়িত্ব:
              </span>{" "}
              {sSub}
            </p>
            <p className="text-[11px] text-text-light/55 text-left">
              <span className="font-bold text-text-light/50">মোবাইল:</span>{" "}
              {enToBn(sMobile)}
            </p>
          </div>
        );
      })}
    </div>
  );
};

const LeaveManagementWorkflow: React.FC<{ enToBn: (s: string) => string }> = ({
  enToBn,
}) => {
  const [requests, setRequests] = React.useState<any[]>([]);

  const handleStatus = (id: number, status: "অনুমোদিত" | "বাতিল") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
  };

  return (
    <div className="space-y-2.5 p-4 bg-card rounded-2xl border border-orange-500/10 font-sans justify-start text-left">
      {requests.map((r) => (
        <div
          key={r.id}
          className="p-3 bg-step-bg border border-border-main/40 rounded-xl text-xs space-y-2 font-sans text-left"
        >
          <div className="flex justify-between items-start text-left">
            <div className="text-left">
              <span className="font-sans font-black text-text-main text-left block">
                {r.name}
              </span>
              <p className="text-[10px] text-text-light/50 font-bold mt-0.5 text-left block">
                {r.reason} ({enToBn(r.days)})
              </p>
            </div>
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                r.status === "অনুমোদিত"
                  ? "bg-emerald-500/15 text-emerald-600"
                  : r.status === "বাতিল"
                    ? "bg-rose-500/15 text-rose-600"
                    : "bg-warning/15 text-warning"
              }`}
            >
              {r.status}
            </span>
          </div>
          {r.status === "পেন্ডিং" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleStatus(r.id, "অনুমোদিত")}
                className="flex-1 py-1.5 bg-emerald-500 text-white font-black text-[10px] rounded-lg active:scale-95 transition-transform cursor-pointer"
              >
                মঞ্জুর করুন
              </button>
              <button
                type="button"
                onClick={() => handleStatus(r.id, "বাতিল")}
                className="flex-1 py-1.5 bg-rose-500 text-white font-black text-[10px] rounded-lg active:scale-95 transition-transform cursor-pointer"
              >
                বাতিল করুন
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const SmsParentNotificationWorkflow: React.FC<{
  enToBn: (s: string) => string;
}> = ({ enToBn }) => {
  const [template, setTemplate] = React.useState("ফলাফল ঘোষণা");
  const [body, setBody] = React.useState(
    "আসসালামু আলাইকুম, আজ আল-মাদানি মাদ্রাসার বার্ষিক পরীক্ষার খতিয়ান ও ফলাফল প্রকাশ করা হয়েছে। অনলাইনে চেক করুন।",
  );
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1200);
  };

  const selectTemp = (type: string) => {
    setTemplate(type);
    setSent(false);
    if (type === "ফলাফল ঘোষণা") {
      setBody(
        "আসসালামু আলাইকুম, আজ আল-মাদানি মাদ্রাসার বার্ষিক পরীক্ষার খতিয়ান ও ফলাফল প্রকাশ করা হয়েছে। অনলাইনে চেক করুন।",
      );
    } else if (type === "বকেয়া ফি") {
      setBody(
        "আসসালামু আলাইকুম, আল-মাদানি মাদ্রাসার পক্ষ থেকে জানানো যাচ্ছে যে আপনার সন্তানের বকেয়া ফি পরিশোধ করার সময় অতিবাহিত হচ্ছে। অনুগ্রহ করে অতিসত্বর পরিশোধ করুন।",
      );
    }
  };

  return (
    <div className="space-y-3 p-4 bg-card rounded-2xl border border-teal-500/10 font-sans text-left">
      <div className="flex gap-2 text-left">
        {["ফলাফল ঘোষণা", "বকেয়া ফি"].map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => selectTemp(t)}
            className={`flex-1 py-1 px-3 border rounded-xl text-[10px] font-black cursor-pointer ${
              template === t
                ? "border-teal-500 bg-teal-500/10 text-teal-600"
                : "border-border-main text-text-light/60 font-bold"
            }`}
          >
            {t} টেমপ্লেট
          </button>
        ))}
      </div>
      <div className="text-left">
        <textarea
          rows={3}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setSent(false);
          }}
          className="w-full text-xs bg-step-bg border border-border-main p-2.5 rounded-xl outline-none text-text-main font-bold font-hind-siliguri leading-relaxed text-left block"
        />
        <div className="text-right mt-1">
          <span className="text-[9px] text-[#0F6E8C] font-black">
            আকার: {enToBn(body.length.toString())} অক্ষর (১ টি SMS)
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSend}
        disabled={sending}
        className="w-full py-2.5 bg-teal-500 text-white text-xs font-black rounded-xl hover:bg-teal-600 transition-all cursor-pointer disabled:opacity-50"
      >
        {sending
          ? "পাঠানো হচ্ছে..."
          : sent
            ? "✓ সফলভাবে পাঠানো হয়েছে!"
            : "সকল অভিভাবকদের নিকট বার্তা পাঠান"}
      </button>
    </div>
  );
};

const ClassRoutineWorkflow: React.FC<{ enToBn: (s: string) => string }> = ({
  enToBn,
}) => {
  const [activeClass, setActiveClass] = React.useState("নাহবেমীর");
  const routines: Record<
    string,
    Array<{ name: string; time: string; teacher: string }>
  > = {
    নাহবেমীর: [
      {
        name: "ফিকাহ (কুদুরী)",
        time: "সকাল ০৮:০০ - ০৯:০০",
        teacher: "মাওলানা ইবরাহীম খলিল",
      },
      {
        name: "নাহব (নাহবেমীর)",
        time: "সকাল ০৯:০০ - ১০:০০",
        teacher: "মাওলানা ইউসুফ",
      },
    ],
    হেদায়াতুন্নাহব: [
      { name: "বালাগাত", time: "সকাল ০৮:০০ - ০৯:০০", teacher: "মুফতী আবু বকর" },
      {
        name: "কাফিয়া",
        time: "সকাল ০৯:০০ - ১০:০০",
        teacher: "মুফতী মাহমুদ হাসান",
      },
    ],
  };

  return (
    <div className="space-y-3.5 p-4 bg-card rounded-2xl border border-violet-500/10 font-sans justify-start text-left">
      <div className="flex gap-2">
        {["নাহবেমীর", "হেদায়াতুন্নাহব"].map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setActiveClass(c)}
            className={`flex-1 py-1.5 px-3 border rounded-xl text-[10px] font-black cursor-pointer ${
              activeClass === c
                ? "border-violet-500 bg-violet-500/10 text-violet-600"
                : "border-border-main text-text-light/60"
            }`}
          >
            {c} রুটিন
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {routines[activeClass].map((r) => (
          <div
            key={r.name}
            className="p-3 bg-step-bg border border-border-main/40 rounded-xl text-xs space-y-1 font-sans"
          >
            <div className="flex justify-between items-center font-sans">
              <span className="font-sans font-black text-text-main">
                {r.name}
              </span>
              <span className="text-[10px] text-violet-500 font-sans font-black">
                {r.time}
              </span>
            </div>
            <p className="text-[10px] text-text-light/60 font-bold block">
              শিক্ষক: {r.teacher}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const HomeworkAssignmentWorkflow: React.FC<{
  enToBn: (s: string) => string;
}> = ({ enToBn }) => {
  const [task, setTask] = React.useState(
    "সূরা আল-বাকারাহ শেষ ২ আয়াত মুখস্থ পড়া ও খতিয়ান লিখা।",
  );
  const [sub, setSub] = React.useState("হাদিস");
  const [saved, setSaved] = React.useState(false);

  return (
    <div className="space-y-3.5 p-4 bg-card rounded-2xl border border-rose-500/10 font-sans text-left">
      <div className="grid grid-cols-2 gap-3 text-left">
        <div className="text-left">
          <label className="text-[10px] font-black uppercase text-text-light/55 block mb-1 text-left">
            বিষয় কোড/নাম
          </label>
          <input
            type="text"
            value={sub}
            onChange={(e) => {
              setSub(e.target.value);
              setSaved(false);
            }}
            className="w-full text-xs bg-step-bg border border-border-main p-2.5 rounded-xl outline-none text-text-main font-bold"
          />
        </div>
        <div className="text-left">
          <label className="text-[10px] font-black uppercase text-text-light/55 block mb-1 text-left">
            জমা দেওয়ার শেষ সময়
          </label>
          <p className="text-xs font-black text-text-main bg-step-bg border border-border-main p-2.5 rounded-xl">
            আগামীকাল সকাল ৮:০০
          </p>
        </div>
      </div>
      <div className="text-left">
        <label className="text-[10px] font-black uppercase text-text-light/55 block mb-2 text-left">
          হোমওয়ার্কের বিবরণ
        </label>
        <textarea
          rows={2}
          value={task}
          onChange={(e) => {
            setTask(e.target.value);
            setSaved(false);
          }}
          className="w-full text-xs bg-step-bg border border-border-main p-2.5 rounded-xl outline-none text-text-main font-bold block"
        />
      </div>
      <button
        type="button"
        onClick={() => setSaved(true)}
        className="w-full py-2.5 bg-rose-500 text-white text-xs font-black rounded-xl hover:bg-rose-600 transition-colors cursor-pointer"
      >
        {saved ? "✓ এসাইনমেন্ট পোস্ট করা হয়েছে" : "নূতন হোমওয়ার্ক বণ্টন করুন"}
      </button>
    </div>
  );
};

const FinancialLedgerWorkflow: React.FC<{ enToBn: (s: string) => string }> = ({
  enToBn,
}) => {
  const { invoices, expenses } = useData();

  const tx = React.useMemo(() => {
    const list: any[] = [];
    invoices.slice(0, 3).forEach((inv: any) => {
      list.push({
        desc: inv.studentName ? `${inv.studentName} (ফি কালেকশন)` : "শিক্ষার্থী ফি সংগ্রহ",
        type: "ক্রিডিট (+)",
        amount: (Number(inv.paid) || Number(inv.total) || 0).toString(),
        date: inv.date || "আজ",
      });
    });
    expenses.slice(0, 3).forEach((exp: any) => {
      list.push({
        desc: exp.title || exp.category || "দৈনিক খরচ/ব্যয়",
        type: "ডেবিট (-)",
        amount: (Number(exp.amount) || 0).toString(),
        date: exp.date || "গতকাল",
      });
    });
    return list;
  }, [invoices, expenses]);

  if (tx.length === 0) {
    return (
      <div className="p-4 bg-card rounded-2xl border border-emerald-500/10 text-center py-6 text-xs text-text-light font-bold">
        ডাটাবেসে কোনো আয়-ব্যয় লেনদেনের তথ্য পাওয়া যায়নি।
      </div>
    );
  }

  return (
    <div className="space-y-2.5 p-4 bg-card rounded-2xl border border-emerald-500/10 font-sans text-left">
      <div className="space-y-2 text-left">
        {tx.map((t, idx) => (
          <div
            key={idx}
            className="p-3 bg-step-bg border border-border-main/40 rounded-xl text-xs flex justify-between items-center font-sans"
          >
            <div className="text-left">
              <span className="font-sans font-black text-text-main text-left block">
                {t.desc}
              </span>
              <p className="text-[9px] text-text-light/45 font-bold mt-0.5 text-left block">
                {t.date}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-[11px] font-black ${t.type.includes("ক্রিডিট") ? "text-emerald-500" : "text-rose-500"}`}
              >
                {t.type.includes("ক্রিডিট") ? "+" : "-"}
                {enToBn(t.amount)}/-
              </span>
              <p className="text-[8px] text-text-light/50 font-bold block text-right">
                {t.type}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const NoticeBulletinBoardWorkflow: React.FC<{
  enToBn: (s: string) => string;
}> = ({ enToBn }) => {
  const notices = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('madrasa_notices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 3);
      }
    } catch (e) {}
    return [];
  }, []);

  if (notices.length === 0) {
    return (
      <div className="p-4 bg-card rounded-2xl border border-red-500/10 text-center py-6 text-xs text-text-light font-bold">
        বর্তমানে কোনো নোটিশ বা ঘোষণা প্রকাশিত হয়নি।
      </div>
    );
  }

  return (
    <div className="space-y-2.5 p-4 bg-card rounded-2xl border border-red-500/10 font-sans text-left">
      {notices.map((n: any, idx: number) => (
        <div
          key={n.id || idx}
          className="p-3 bg-step-bg border border-border-main/40 rounded-xl text-xs space-y-1.5 font-sans justify-start text-left"
        >
          <div className="flex justify-between items-center text-left">
            <span className="text-[9px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded-md font-sans font-black">
              {n.prio || 'সাধারণ'}
            </span>
            <span className="text-[9px] text-text-light/40 font-bold font-sans">
              {enToBn(n.date || '')}
            </span>
          </div>
          <h5 className="font-sans font-black text-text-main leading-relaxed text-left">
            {n.title || n.heading}
          </h5>
        </div>
      ))}
    </div>
  );
};

const IslamicLibraryCatalogWorkflow: React.FC<{
  enToBn: (s: string) => string;
}> = ({ enToBn }) => {
  const books = [
    {
      name: "সহীহুল বুখারী (১ম খণ্ড)",
      shelf: "তাক নং ৩",
      status: "লাইব্রেরিতে আছে",
      borrower: "-",
    },
    {
      name: "হিদায়া (কিতাবুন নিকাহ)",
      shelf: "তাক নং ৭",
      status: "ধার দেওয়া হয়েছে",
      borrower: "ওমর ফারুক (রোল ৩৮)",
    },
  ];

  return (
    <div className="space-y-2.5 p-4 bg-card rounded-2xl border border-sky-500/10 font-sans text-left">
      {books.map((b) => (
        <div
          key={b.name}
          className="p-3 bg-step-bg border border-border-main/40 rounded-xl text-xs space-y-1.5 font-sans justify-start text-left"
        >
          <div className="flex justify-between items-start text-left">
            <div className="text-left">
              <span className="font-sans font-black text-text-main text-left text-sm block">
                {b.name}
              </span>
              <p className="text-[9px] text-text-light/40 font-bold mt-0.5 block">
                {b.shelf}
              </p>
            </div>
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                b.status === "লাইব্রেরিতে আছে"
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-amber-500/15 text-amber-600"
              }`}
            >
              {b.status}
            </span>
          </div>
          {b.borrower !== "-" && (
            <p className="text-[10px] text-text-light/55 block text-left">
              <span className="font-bold text-text-light/50">গ্রহীতা:</span>{" "}
              {b.borrower}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};


const MobileBrandedAppMockup: React.FC<{
  enToBn: (s: string) => string;
}> = ({ enToBn }) => {
  return (
    <div className="p-4 bg-card rounded-2xl border border-slate-500/10 font-sans text-left">
      <div className="w-[180px] mx-auto bg-slate-950 text-white rounded-3xl p-3 border-[4px] border-slate-800 shadow-md relative min-h-[260px] flex flex-col justify-between">
        {/* Notch */}
        <div className="w-20 h-3.5 bg-slate-800 rounded-b-xl mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-10"></div>
        
        {/* Phone Content */}
        <div className="mt-4 flex-1 flex flex-col justify-between text-[10px]">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/10 pb-1.5 mb-2">
            <span className="font-sans font-black text-white text-[8px]">আল-মাদানী প্যারেন্ট</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          {/* Body */}
          <div className="space-y-1.5 flex-1">
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
              <span className="text-[7px] text-white/40 block">আজকের উপস্থিতি</span>
              <p className="font-bold text-emerald-400 mt-0.5">উপস্থিত (০৮:১৫ AM)</p>
            </div>
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
              <span className="text-[7px] text-white/40 block">চলতি মাসের বেতন</span>
              <p className="font-bold text-amber-400 mt-0.5">পরিশোধিত (৳ {enToBn("৮০০")})</p>
            </div>
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
              <span className="text-[7px] text-white/40 block">সর্বশেষ নোটিশ</span>
              <p className="font-bold text-sky-400 truncate mt-0.5">আগামীকাল মাদ্রাসা বন্ধ থাকিবে।</p>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="flex justify-around items-center border-t border-white/10 pt-1.5 mt-2 text-[8px] text-white/50">
            <span className="text-emerald-400">হোম</span>
            <span>হাজিরা</span>
            <span>রেজাল্ট</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-center text-text-light/50 mt-2 font-bold font-sans">
        অভিভাবকদের সাথে সার্বক্ষণিক সিঙ্ক
      </p>
    </div>
  );
};


const CloudBackupAnimationConsole: React.FC<{
  enToBn: (s: string) => string;
}> = ({ enToBn }) => {
  const [backingUp, setBackingUp] = React.useState(false);
  const [complete, setComplete] = React.useState(false);

  const handleBackup = () => {
    setBackingUp(true);
    setComplete(false);
    setTimeout(() => {
      setBackingUp(false);
      setComplete(true);
    }, 1200);
  };

  return (
    <div className="p-4 bg-card rounded-2xl border border-slate-500/10 font-mono text-[10px] text-left">
      <div className="bg-slate-950 text-emerald-400 p-3 rounded-xl space-y-1 min-h-[90px] overflow-hidden leading-relaxed font-mono text-left">
        <p className="font-mono text-emerald-400">{`> INITIALIZING SECURE CLOUD SYNCHRONIZER...`}</p>
        {backingUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-warning"
          >
            <p className="animate-pulse text-warning font-mono">{`> ENCRYPTING SQL DATABASES...`}</p>
            <p className="text-sky-400 font-mono">{`> WRITING ARCHIVE SUITE TO WORKSPACE CLOUD...`}</p>
          </motion.div>
        )}
        {complete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-slate-100"
          >
            <p className="text-emerald-400 font-mono">{`> SUCCESS: COMPLETED SECURE REDUNDANCY SUITE!`}</p>
            <p className="text-white font-mono">{`> BACKUP STATE: SAFE (100% SECURE)`}</p>
          </motion.div>
        )}
      </div>

      <button
        type="button"
        onClick={handleBackup}
        disabled={backingUp}
        className="w-full mt-3 py-2.5 bg-slate-800 text-white hover:bg-slate-700 transition-colors rounded-xl font-sans font-black text-xs cursor-pointer"
      >
        {backingUp ? "ব্যাকআপ সিঙ্ক হচ্ছে..." : "এখনই ব্যাকআপ সিঙ্ক নিন"}
      </button>
    </div>
  );
};

export const Analytics: React.FC<AnalyticsProps> = ({
  students,
  pending,
  selectedYear,
  onYearChange,
  setActiveTab,
}) => {
  const { invoices, expenses, staffMembers, departments, classes, updateData, deleteData } = useData();

  const totalExpenses = expenses.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
  const totalIncome = invoices.reduce((acc: number, curr: any) => acc + (Number(curr.paid) || 0), 0);
  const totalDue = invoices.reduce((acc: number, curr: any) => acc + (Number(curr.due) || 0), 0);
  const cashInHand = totalIncome - totalExpenses;
  const staffCount = staffMembers.length;
  const [showJamatModal, setShowJamatModal] = React.useState(false);
  const [jamatFilter, setJamatFilter] = React.useState<
    "active" | "closed" | "all"
  >("active");
  const [selectedFeature, setSelectedFeature] = React.useState<any | null>(
    null,
  );
  const [featureSearch, setFeatureSearch] = React.useState("");
  const [featureCategory, setFeatureCategory] = React.useState<
    "all" | "academic" | "finance" | "general"
  >("all");

  // Dynamic Class Management for ongoing year classes (একাডেমিক ব্যবস্থাপনা)
  
  
  const [isClassModalOpen, setIsClassModalOpen] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState<any | null>(null);
  const [classFormData, setClassFormData] = React.useState({
    name: "",
    departmentId: "3",
    equivalent: "",
    isActive: true,
  });
  const [classModalSearch, setClassModalSearch] = React.useState("");
  const [classModalDeptFilter, setClassModalDeptFilter] = React.useState("all");
  const [classModalStatusFilter, setClassModalStatusFilter] = React.useState("all");



  const handleAddClassClick = () => {
    setEditingClass(null);
    setClassFormData({
      name: "",
      departmentId: departments[0]?.id || "1",
      equivalent: "",
      isActive: true,
    });
  };

  const handleEditClassClick = (cls: any) => {
    setEditingClass(cls);
    setClassFormData({
      name: cls.name,
      departmentId: cls.departmentId,
      equivalent: cls.equivalent,
      isActive: cls.isActive,
    });
  };

  const handleDeleteClass = async (id: string) => {
    const matchedClass = classes.find((c) => c.id === id);
    if (matchedClass) {
      const isCore = STANDARD_JAMAT_PRESETS.some((p) => p.name === matchedClass.name || p.id === matchedClass.id);
      if (isCore) {
        alert(`"${matchedClass.name}" হলো মূল ১৩টি স্থায়ী জামাতের একটি। এই জামাতটি বাদ বা ডিলিট করা যাবে না।`);
        return;
      }
    }
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই জামাতটি বাদ দিতে চান?")) {
      await deleteData('acad_classes', id);
    }
  };

  const handleToggleClassStatus = async (id: string) => {
    const cls = classes.find((c) => c.id === id);
    if (cls) {
      await updateData('acad_classes', { ...cls, isActive: !cls.isActive });
    }
  };

  const handleSaveClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.name.trim()) return;

    if (editingClass) {
      await updateData('acad_classes', { ...editingClass, ...classFormData });
    } else {
      await updateData('acad_classes', {
        id: Date.now().toString(),
        ...classFormData,
      });
    }

    setEditingClass(null);
    setClassFormData({ name: "", departmentId: "3", equivalent: "", isActive: true });
  };

  const smartFeaturesList = React.useMemo(
    () => [
      {
        id: "attendance",
        title: "শিক্ষার্থী উপস্থিতি",
        subtitle: "উপস্থিতি ট্র্যাকিং",
        desc: "ক্লাস বা বিষয় অনুযায়ী উপস্থিতি নিন। শিক্ষকরা মোবাইল বা ট্যাবে হাজিরা খাতা আপডেট করতে পারেন যা রিয়েল-টাইম সংরক্ষণ হয়।",
        category: "academic",
        icon: UserCheck,
        color:
          "from-emerald-500/10 to-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/15",
        badgeColor: "bg-emerald-500/10 text-emerald-600",
        component: AttendanceWorkflow,
      },
      {
        id: "student-info",
        title: "শিক্ষার্থীর তথ্য ভাণ্ডার",
        subtitle: "স্মার্ট তথ্য ভাণ্ডার",
        desc: "শিক্ষার্থীর প্রোফাইল, অভিভাবক ও যোগাযোগের ঠিকানা, ভর্তির খবরাখবর, রোল ও আইডি সমন্বিত সুরক্ষিত ডিজিটাল রেজিস্টার।",
        category: "general",
        icon: Users,
        color:
          "from-blue-500/10 to-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/15",
        badgeColor: "bg-blue-500/10 text-blue-600",
        component: StudentInfoWorkflow,
      },
      {
        id: "admission",
        title: "ভর্তি ও শ্রেণী বিন্যাস",
        subtitle: "ঝামেলাহীন দাখেলা ও পরীক্ষা",
        desc: "নতুন আবেদনপত্র যাচাই, প্লেসমেন্ট পরীক্ষা মূল্যায়ন, হলরুম বিতরণ ও স্বয়ংক্রিয়ভাবে রোল ও শ্রেণি বিন্যাসের অত্যাধুনিক পদ্ধতি।",
        category: "academic",
        icon: GraduationCap,
        color:
          "from-indigo-500/10 to-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/15",
        badgeColor: "bg-indigo-500/10 text-indigo-600",
        component: AdmissionPlacementWorkflow,
      },
      {
        id: "online-fees",
        title: "অনলাইন ফি ও রসিদ",
        subtitle: "মোবাইল ব্যাংকিং কালেকশন",
        desc: "বিকাশ, রকেট বা নগদের মাধ্যমে নিরাপদে মাসিক বেতন, ভর্তি ও পরীক্ষার ফি গ্রহণ করুন ও স্বয়ংক্রিয় ডিজিটাল রসিদ জেনারেট করুন।",
        category: "finance",
        icon: Coins,
        color:
          "from-pink-500/10 to-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/15",
        badgeColor: "bg-pink-500/10 text-pink-600",
        component: OnlineFeesReceiptWorkflow,
      },
      {
        id: "exam-gpa",
        title: "পরীক্ষা ও জিপিএ কার্ড",
        subtitle: "স্বয়ংক্রিয় মূল্যায়ন ও খতিয়ান",
        desc: "বিষয়ভিত্তিক নম্বর প্রবেশ করান, পরীক্ষা খাতা মূল্যায়ন করে স্বয়ংক্রিয় মুমতাজ, জায়্যিদ গ্রেডিং ও জিপিএ কার্ড হিসাব করুন।",
        category: "academic",
        icon: Award,
        color:
          "from-amber-500/10 to-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/15",
        badgeColor: "bg-amber-500/10 text-amber-600",
        component: ExamGpaCardWorkflow,
      },
      {
        id: "teachers",
        title: "শিক্ষক ও স্টাফ ব্যবস্থাপনা",
        subtitle: "ডিজিটাল হাজিরা ও এসাইনমেন্ট",
        desc: "শিক্ষক ও কর্মকর্তাদের দায়িত্ব বণ্টন, কিতাব বরাদ্দ, ব্যক্তিগত তথ্যাদি ও উপস্থিতি ট্র্যাকিং ব্যবস্থার ডিজিটাল সমন্বয়।",
        category: "general",
        icon: Briefcase,
        color:
          "from-cyan-500/10 to-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/15",
        badgeColor: "bg-cyan-500/10 text-cyan-600",
        component: TeachersStaffManagementWorkflow,
      },
      {
        id: "leave",
        title: "ছুটি ব্যবস্থাপনা",
        subtitle: "অবকাশ ও ছুটির আবেদন",
        desc: "শিক্ষক, কর্মকর্তা বা শিক্ষার্থীদের ছুটির আবেদন ও তা পর্যালোচনার জন্য রিয়েল-টাইম আবেদন ও মঞ্জুর প্যানেল মডিউল।",
        category: "general",
        icon: CalendarDays,
        color:
          "from-orange-500/10 to-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/15",
        badgeColor: "bg-orange-500/10 text-orange-600",
        component: LeaveManagementWorkflow,
      },
      {
        id: "sms",
        title: "এসএমএস নোটিফিকেশন",
        subtitle: "অভিভাবক যোগাযোগ সেতু",
        desc: "উপস্থিতি, জরুরি নোটিশ ও পরীক্ষা বা বকেয়া ফি সংক্রান্ত সতর্কবার্তা এক ক্লিকে সরাসরি অভিভাবকদের ফোনে এসএমএস পাঠান।",
        category: "general",
        icon: MessageSquare,
        color:
          "from-teal-500/10 to-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/15",
        badgeColor: "bg-teal-500/10 text-teal-600",
        component: SmsParentNotificationWorkflow,
      },
      {
        id: "class-routine",
        title: "ক্লাস রুটিন",
        subtitle: "দৈনিক পাঠ পরিকল্পনা",
        desc: "শ্রেণি ও বিষয়ভিত্তিক দৈনিক পিরিয়ড বণ্টন, শিক্ষক বরাদ্দ এবং দৈনিক ক্লাসের সময়সূচী রুটিন নিয়ন্ত্রণ ব্যবস্থা।",
        category: "academic",
        icon: Clock,
        color:
          "from-violet-500/10 to-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/15",
        badgeColor: "bg-violet-500/10 text-violet-600",
        component: ClassRoutineWorkflow,
      },
      {
        id: "homework",
        title: "হোমওয়ার্ক ও অ্যাসাইনমেন্ট",
        subtitle: "পাঠ ও এসাইনমেন্ট খতিয়ান",
        desc: "কিতাবের দৈনিক পাঠ ও নির্ধারিত পড়া বরাদ্দ করুন। শিক্ষার্থীরা এবং শিক্ষকরা বাড়ির কাজ ট্র্যাকিং করতে পারেন।",
        category: "academic",
        icon: FileText,
        color:
          "from-rose-500/10 to-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/15",
        badgeColor: "bg-rose-500/10 text-rose-600",
        component: HomeworkAssignmentWorkflow,
      },
      {
        id: "financial-ledger",
        title: "আর্থিক লেজার",
        subtitle: "মাদ্রাসার আয় ও ব্যয়ের খতিয়ান",
        desc: "মাদ্রাসার যাবতীয় মাসিক কালেকশন ও বিদ্যুৎ বিল, বেতন বা অন্যান্য খরচপাতির নির্ভুল ব্যালেন্স শিট রিমোট ট্র্যাকিং।",
        category: "finance",
        icon: HandCoins,
        color:
          "from-emerald-500/10 to-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/15",
        badgeColor: "bg-emerald-500/10 text-emerald-600",
        component: FinancialLedgerWorkflow,
      },
      {
        id: "notice",
        title: "নোটিশ বোর্ড",
        subtitle: "ডিজিটাল ইশতেহার ও বুলেটিন",
        desc: "জরুরি নোটিশ, ছুটি ঘোষণা বা যেকোনো মাদ্রাসার সার্কুলার ডিজিটাল বোর্ডে সহজে প্রচার করে রিয়েল-টাইম অবহিত করুন।",
        category: "general",
        icon: Megaphone,
        color:
          "from-red-500/10 to-red-500/20 text-red-600 dark:text-red-400 border-red-500/15",
        badgeColor: "bg-red-500/10 text-red-600",
        component: NoticeBulletinBoardWorkflow,
      },
      {
        id: "islamic-library",
        title: "ইসলামিক লাইব্রেরি ক্যাটালগ",
        subtitle: "কিতাব ও তালিবে এলম ক্যাটালগ",
        desc: "মাদ্রাসার কুতুবখানার মূল্যবান কিতাব সংরক্ষণ, কিতাব ধার বা গ্রহীতার হিসাব এবং লাইব্রেরি সংগ্রহ ডিজিটাল ট্র্যাকিং।",
        category: "general",
        icon: BookOpen,
        color:
          "from-sky-500/10 to-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/15",
        badgeColor: "bg-sky-500/10 text-sky-600",
        component: IslamicLibraryCatalogWorkflow,
      },
      {
        id: "mobile-app",
        title: "মোবাইল ব্র্যান্ডেড অ্যাপ",
        subtitle: "আল-মাদানী প্যারেন্ট অ্যাপ",
        desc: "অভিভাবক ও শিক্ষকদের জন্য কাস্টমাইজড নিজস্ব মোবাইল অ্যাপ যা হাজিরা, নোটিফিকেশন ও রেজাল্ট সিঙ্ক রাখবে।",
        category: "general",
        icon: Smartphone,
        color:
          "from-slate-500/10 to-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/15",
        badgeColor: "bg-slate-500/10 text-slate-600",
        component: MobileBrandedAppMockup,
      },
      {
        id: "cloud-backup",
        title: "ক্লাউড ব্যাকআপ সিঙ্ক",
        subtitle: "শতভাগ ডাটা সিকিউরিটি",
        desc: "এক ক্লিকে মাদ্রাসার যাবতীয় ডেটা নিরাপদ ক্লাউড সার্ভারে সুরক্ষার সাথে ব্যাকআপ ও ডুপ্লিকেট সিঙ্ক করার নিশ্চয়তা।",
        category: "general",
        icon: Database,
        color:
          "from-slate-500/10 to-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/15",
        badgeColor: "bg-slate-500/10 text-slate-600",
        component: CloudBackupAnimationConsole,
      },
    ],
    [],
  );

  const filteredFeatures = React.useMemo(() => {
    return smartFeaturesList.filter((f) => {
      const matchSearch =
        f.title.toLowerCase().includes(featureSearch.toLowerCase()) ||
        f.desc.toLowerCase().includes(featureSearch.toLowerCase()) ||
        f.subtitle.toLowerCase().includes(featureSearch.toLowerCase());
      const matchCat =
        featureCategory === "all" || f.category === featureCategory;
      return matchSearch && matchCat;
    });
  }, [smartFeaturesList, featureSearch, featureCategory]);

  // Grouped years from constants and data, filtering out explicitly removed year
  const academicYears = React.useMemo(() => {
    const fromData = Array.from(
      new Set(students.map((s) => s.academicYearLabel)),
    ).filter(Boolean) as string[];
    return Array.from(new Set([...ACADEMIC_YEARS, ...fromData])).filter(
      (y) => y !== "১৪৪৫-৪৬ হিজরী/২০২৪-২৫ ঈসায়ী",
    );
  }, [students]);

  // Stats for selected year
  const yearStudents = students.filter((s) => {
    const sYear = s.academicYearLabel?.trim();
    const targetYear = selectedYear.trim();
    return sYear === targetYear;
  });

  const residentialCount = yearStudents.filter(s => (s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || '').includes('আবাসিক')).length;
  const nonResidentialCount = yearStudents.length - residentialCount;

  // Calculate newly registered students in the current month (or the last 30 days) of this academic year
  const currentMonthNewAdmissions = React.useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    return yearStudents.filter((s) => {
      // Must be "নতুন" (new type)
      const sType = (
        s["শিক্ষার্থী ধরণ/স্ট্যাটাস"] ||
        s["স্ট্যাটাস"] ||
        ""
      ).toString();
      const isNew = sType.includes("নতুন") || sType.includes("New");
      if (!isNew) return false;

      const dateVal =
        s["মঞ্জুরের তারিখ ও সময়"] || s["ভর্তির তারিখ"] || s.applyDate || "";
      if (!dateVal) return true; // fallback: count if missing but marked new

      const dateStr = String(dateVal);
      // Try to convert Bengali digits to English
      const cleanEngStr = dateStr.replace(/[০-৯]/g, (d) =>
        "০১২৩৪৫৬৭৮৯".indexOf(d).toString(),
      );
      const match =
        cleanEngStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) ||
        cleanEngStr.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (match) {
        let year = 0,
          month = 0;
        if (match[3].length === 4) {
          // DD/MM/YYYY
          year = parseInt(match[3], 10);
          month = parseInt(match[2], 10) - 1;
        } else {
          // YYYY/MM/DD
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10) - 1;
        }
        return year === currentYear && month === currentMonth;
      }
      return true; // default if parse fails
    }).length;
  }, [yearStudents]);

  // Calculate distinct jamat classes having at least 1 admitted student in the selected academic year
  const activeJamatsCount = React.useMemo(() => {
    return classes.filter((cls) => {
      return yearStudents.some((s) => isClassMatch(s, cls.name));
    }).length;
  }, [yearStudents, classes]);

  const getStudentCountForClass = React.useCallback(
    (cls: string) => {
      return yearStudents.filter((s) => isClassMatch(s, cls)).length;
    },
    [yearStudents],
  );

  const filteredJamatsData = React.useMemo(() => {
    return classes.map((cls) => {
      const count = getStudentCountForClass(cls.name);
      return {
        className: cls.name,
        studentCount: count,
        isActive: count > 0,
      };
    }).filter((item) => {
      if (jamatFilter === "active") return item.isActive;
      if (jamatFilter === "closed") return !item.isActive;
      return true;
    });
  }, [jamatFilter, getStudentCountForClass, classes]);

  // Real-time Biometric Attendance & SMS State Hooks
  const [dailyDb, setDailyDb] = React.useState(() => getDailyAttendanceDb());
  const [smsStats, setSmsStats] = React.useState<SmsAccountStats>(() => getSmsAccountStats());
  const [sentLogs, setSentLogs] = React.useState<SentMessageLog[]>(() => getSentMessageLogs());
  const [smsFilter, setSmsFilter] = React.useState<string>('all');
  const [smsSearch, setSmsSearch] = React.useState<string>('');
  const [showRechargeModal, setShowRechargeModal] = React.useState<boolean>(false);
  const [rechargeAmount, setRechargeAmount] = React.useState<number>(1000);
  const [showJamatAttendanceTable, setShowJamatAttendanceTable] = React.useState<boolean>(true);

  // Subscribe to live background machine punch updates and messaging engine updates
  React.useEffect(() => {
    const unsub = subscribeToAttendanceUpdates(() => {
      setDailyDb(getDailyAttendanceDb());
      setSmsStats(getSmsAccountStats());
      setSentLogs(getSentMessageLogs());
    });
    return () => unsub();
  }, []);

  // Calculate Real-time Daily Attendance based on live biometric device records
  const dailyAttendanceStats = React.useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const totalStudentsCount = yearStudents.length;
    const dayRecords = dailyDb[todayStr] || {};

    let present = 0;
    let absent = 0;
    let late = 0;
    let residentialPresent = 0;
    let nonResidentialPresent = 0;

    yearStudents.forEach((student) => {
      const sId = String(student.id || student['রেজিস্ট্রেশন/আইডি নম্বর'] || '');
      const rec = dayRecords[sId];
      const isRes = (student['শিক্ষার্থী ধরণ/ক্যাটাগরি'] || student.studentCategory || student['শিক্ষার্থী ধরণ'] || '').includes('আবাসিক');

      if (rec) {
        if (rec.status === 'present') {
          present++;
          if (isRes) residentialPresent++;
          else nonResidentialPresent++;
        } else if (rec.status === 'late') {
          late++;
          present++;
          if (isRes) residentialPresent++;
          else nonResidentialPresent++;
        } else {
          absent++;
        }
      } else {
        absent++;
      }
    });

    const percentage = totalStudentsCount > 0 ? Math.round((present / totalStudentsCount) * 100) : 0;

    return {
      present,
      absent,
      late,
      total: totalStudentsCount,
      percentage,
      residentialPresent,
      nonResidentialPresent,
      todayStr,
      hasRecords: Object.keys(dayRecords).length > 0
    };
  }, [yearStudents, dailyDb]);

  // Jamat-wise attendance breakdown computed in real-time
  const jamatAttendanceList = React.useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const dayRecords = dailyDb[todayStr] || {};

    return classes.map((cls) => {
      const clsStudents = yearStudents.filter((s) => isClassMatch(s, cls.name));
      const total = clsStudents.length;
      let present = 0;
      let absent = 0;
      let late = 0;

      clsStudents.forEach((s) => {
        const sId = String(s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || '');
        const rec = dayRecords[sId];
        if (rec && (rec.status === 'present' || rec.status === 'late')) {
          present++;
          if (rec.status === 'late') late++;
        } else {
          absent++;
        }
      });

      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        className: cls.name,
        total,
        present,
        absent,
        late,
        percentage,
      };
    }).filter(j => j.total > 0);
  }, [classes, yearStudents, dailyDb]);

  const filteredSentLogs = React.useMemo(() => {
    return sentLogs.filter(log => {
      const matchesSearch = !smsSearch ||
        log.studentName.toLowerCase().includes(smsSearch.toLowerCase()) ||
        log.phone.includes(smsSearch) ||
        log.content.toLowerCase().includes(smsSearch.toLowerCase());
      
      const matchesFilter = smsFilter === 'all' || 
        (smsFilter === 'punch' && (log.event === 'entry' || log.event === 'exit')) ||
        (smsFilter === 'late' && log.event === 'late') ||
        (smsFilter === 'absent' && log.event === 'absent') ||
        (smsFilter === 'fee' && (log.event === 'fee_due' || log.event === 'fee_payment')) ||
        (smsFilter === 'notice' && log.event === 'general_notice');

      return matchesSearch && matchesFilter;
    });
  }, [sentLogs, smsSearch, smsFilter]);

  const [subjectCount, setSubjectCount] = React.useState(0);
  const [classCount, setClassCount] = React.useState(0);

  React.useEffect(() => {
    const s = localStorage.getItem('acad_subjects');
    if (s) setSubjectCount(JSON.parse(s).length);
    else setSubjectCount(8); // default
    
    const c = localStorage.getItem('acad_classes');
    if (c) setClassCount(JSON.parse(c).length);
    else setClassCount(13); // default
  }, []);

  const { teachers, subjects, classSubjects } = useData();

  const realTeacherCount = React.useMemo(() => {
    return teachers.length || staffMembers.filter(s => (s.role || s.designation || '').includes('শিক্ষক') || (s.role || s.designation || '').includes('ওস্তাদ')).length;
  }, [teachers, staffMembers]);

  const realNoticeCount = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('madrasa_notices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch (e) {}
    return 0;
  }, []);

  const realLibraryCount = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('madrasah_library_books');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch (e) {}
    return 0;
  }, []);

  const stats = [
    {
      id: "students",
      label: "শিক্ষার্থী",
      value: yearStudents.length,
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      trend: "মোট নিবন্ধিত",
      graphColor: "#9333ea",
    },
    {
      id: "classes",
      label: "জামাত/শ্রেণী",
      value: classCount,
      icon: Layers,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      trend: "সক্রিয়",
      graphColor: "#2563eb",
      onClick: () => setActiveTab && setActiveTab("academic-class")
    },
    {
      id: "subjects",
      label: "বিষয়",
      value: subjectCount || (subjects ? subjects.length : 0),
      icon: BookOpen,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      trend: "সক্রিয়",
      graphColor: "#4f46e5",
      onClick: () => setActiveTab && setActiveTab("academic-subject")
    },
    {
      id: "teachers",
      label: "শিক্ষক",
      value: realTeacherCount,
      icon: Briefcase,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      trend: "নিবন্ধিত",
      graphColor: "#2563eb",
      onClick: () => setActiveTab && setActiveTab("teachers-list")
    },
    {
      id: "notice",
      label: "নোটিশ",
      value: realNoticeCount,
      icon: Megaphone,
      color: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
      trend: "প্রকাশিত",
      graphColor: "#db2777",
    },
    {
      id: "fees",
      label: "ফি সংগ্রহ",
      value: `৳ ${enToBnNumber(totalIncome.toString())}`,
      icon: Coins,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/20",
      trend: "মোট আয়",
      graphColor: "#0d9488",
      onClick: () => setActiveTab && setActiveTab("student-fees")
    },
    {
      id: "library",
      label: "লাইব্রেরি",
      value: realLibraryCount,
      icon: BookOpen,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      trend: "মোট কিতাব",
      graphColor: "#4f46e5",
    },
    {
      id: "routine",
      label: "রুটিন",
      value: classSubjects ? classSubjects.length : 0,
      icon: CalendarDays,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      trend: "বিষয় সুচী",
      graphColor: "#0284c7",
    },
  ];

  // Helper to map Madrasa Class to Level Colors
  const getLevelInfo = React.useCallback((fullName: string) => {
    const name = fullName.trim();
    if (
      name.includes("আতফাল") ||
      name.includes("আওয়াল") ||
      name.includes("ছানী") ||
      name.includes("ছালেছ") ||
      name.includes("খুসুছি") ||
      name.includes("রাবে") ||
      name.includes("খামেস") ||
      name.includes("খামেছ")
    ) {
      return {
        level: "ইবতেদায়ি (প্রাথমিক)",
        color: "#F43F5E",
        bg: "bg-rose-500/10 text-rose-500",
      };
    }
    if (name.includes("মিযান") || name.includes("নাহবেমীর")) {
      return {
        level: "মুতাওয়াসসিতাহ (নিম্ন মাধ্যমিক)",
        color: "#F59E0B",
        bg: "bg-amber-500/10 text-amber-500",
      };
    }
    if (name.includes("কুদূরী") || name.includes("বেকায়া")) {
      return {
        level: "সানাবিয়্যা (মাধ্যমিক)",
        color: "#6366F1",
        bg: "bg-indigo-500/10 text-indigo-500",
      };
    }
    if (name.includes("হেদায়া") || name.includes("মেশকাত")) {
      return {
        level: "ফজিলত (ডিগ্রী)",
        color: "#0EA5E9",
        bg: "bg-sky-500/10 text-sky-500",
      };
    }
    if (name.includes("দাওরায়ে হাদিস") || name.includes("তাকমিল")) {
      return {
        level: "তাকমিল (মাস্টার্স)",
        color: "#10B981",
        bg: "bg-emerald-500/10 text-emerald-500",
      };
    }
    return {
      level: "সাধারণ স্তর",
      color: "#0EA5E9",
      bg: "bg-sky-500/10 text-sky-500",
    };
  }, []);

  // Prepare data for class distribution for selected year
  const classData = React.useMemo(() => {
    return JAMAT_LIST.map((cls) => {
      const count = yearStudents.filter((s) => {
        const studentClassVal = (
          s["জামাত"] ||
          s["জামাত/শ্রেণী"] ||
          s["শ্রেণী"] ||
          s["Class"] ||
          ""
        )
          .toString()
          .trim();
        return (
          studentClassVal === cls.trim() ||
          studentClassVal.includes(cls.trim()) ||
          cls.trim().includes(studentClassVal)
        );
      }).length;
      const lvl = getLevelInfo(cls);
      return {
        name: cls.split(" ")[0],
        value: count,
        fullName: cls,
        level: lvl.level,
        color: lvl.color,
        bg: lvl.bg,
      };
    }).filter((c) => c.value > 0);
  }, [yearStudents, getLevelInfo]);

  const pieData = React.useMemo(
    () => [
      {
        name: "আবাসিক শিক্ষার্থী",
        value: residentialCount,
        color: "#10B981",
      },
      {
        name: "অনাবাসিক শিক্ষার্থী",
        value: nonResidentialCount,
        color: "#F59E0B",
      },
    ],
    [residentialCount, nonResidentialCount],
  );

  // Real-time calculation for Financial Summary Pie & Status
  const { paidInvoicesCount, dueInvoicesCount, paidPercentage } = React.useMemo(() => {
    let paidCount = 0;
    let dueCount = 0;

    invoices.forEach((inv: any) => {
      const dueAmt = Number(inv.due) || 0;
      if (dueAmt <= 0 || inv.status === 'পরিশোধিত') {
        paidCount++;
      } else {
        dueCount++;
      }
    });

    const totalInvs = invoices.length;
    const pct = totalInvs > 0 ? Math.round((paidCount / totalInvs) * 100) : 0;

    return {
      paidInvoicesCount: paidCount,
      dueInvoicesCount: dueCount,
      paidPercentage: pct,
    };
  }, [invoices]);

  const financialSummary = React.useMemo(
    () => [
      {
        name: "বেতন সম্পূর্ণ",
        value: paidInvoicesCount,
        color: "#10B981",
      },
      {
        name: "বকেয়া বেতন",
        value: dueInvoicesCount,
        color: "#F43F5E",
      },
    ],
    [paidInvoicesCount, dueInvoicesCount],
  );

  // Automated Overdue Fees Alert System Data
  const [overdueSearch, setOverdueSearch] = React.useState("");
  const [overdueJamatFilter, setOverdueJamatFilter] = React.useState("all");
  const [smsNoticeSent, setSmsNoticeSent] = React.useState(false);

  const overdueAlertData = React.useMemo(() => {
    const list: Array<{
      id: string;
      invoiceNo: string;
      studentId: string;
      studentName: string;
      studentRoll: string;
      studentClass: string;
      studentPhone: string;
      date: string;
      subtotal: number;
      paid: number;
      due: number;
      month: string;
      status: string;
    }> = [];

    const processedStudentIds = new Set<string>();

    invoices.forEach((inv: any) => {
      const dueAmt = Number(inv.dueAmount) || Number(inv.due) || 0;
      const paidAmt = Number(inv.paidAmount) || Number(inv.paid) || 0;
      const totalAmt = Number(inv.netAmount) || Number(inv.subtotal) || Number(inv.total) || 0;

      if (dueAmt > 0 || inv.status === 'due' || inv.status === 'partial' || inv.status === 'বকেয়া') {
        const invStudentId = String(inv.studentId || '').trim();
        const matchedStudent = students.find((s: any) => {
          const sId = String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '').trim();
          return sId === invStudentId;
        });

        if (invStudentId) processedStudentIds.add(invStudentId);

        list.push({
          id: inv.id || inv.invoiceNo || Math.random().toString(),
          invoiceNo: inv.invoiceNo || inv.id || 'INV-DUE',
          studentId: inv.studentId || (matchedStudent ? (matchedStudent['রেজিস্ট্রেশন/আইডি নম্বর'] || matchedStudent.id) : 'N/A'),
          studentName: inv.studentName || (matchedStudent ? (matchedStudent['শিক্ষার্থীর নাম'] || matchedStudent.name) : 'শিক্ষার্থী'),
          studentRoll: inv.studentRoll || (matchedStudent ? (matchedStudent['রোল নম্বর'] || matchedStudent.roll) : 'N/A'),
          studentClass: inv.studentClass || inv.jamat || (matchedStudent ? (matchedStudent['জামাত/শ্রেণী'] || matchedStudent.class) : 'সাধারণ'),
          studentPhone: inv.phone || inv.mobile || (matchedStudent ? (matchedStudent['অভিভাবকের মোবাইল'] || matchedStudent.mobile) : 'N/A'),
          date: inv.date || '২০২৬',
          subtotal: totalAmt,
          paid: paidAmt,
          due: dueAmt,
          month: inv.month || 'চলতি মাস',
          status: inv.status === 'partial' ? 'আংশিক বকেয়া' : 'বকেয়া'
        });
      }
    });

    // Check student overrides or student dues
    students.forEach((s: any) => {
      const sId = String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '').trim();
      if (!processedStudentIds.has(sId)) {
        const customDue = Number(s.dueAmount || s.previousDue || 0);
        if (customDue > 0) {
          list.push({
            id: `STU-DUE-${sId}`,
            invoiceNo: `STU-DUE-${sId}`,
            studentId: sId,
            studentName: s['শিক্ষার্থীর নাম'] || s.name || 'শিক্ষার্থী',
            studentRoll: s['রোল নম্বর'] || s.roll || 'N/A',
            studentClass: s['জামাত/শ্রেণী'] || s.class || 'সাধারণ',
            studentPhone: s['অভিভাবকের মোবাইল'] || s.mobile || 'N/A',
            date: 'পূর্ববকেয়া',
            subtotal: customDue,
            paid: 0,
            due: customDue,
            month: 'পূর্ববর্তী সেশন',
            status: 'পূর্ববকেয়া'
          });
        }
      }
    });

    return list;
  }, [invoices, students]);

  const filteredOverdueList = React.useMemo(() => {
    return overdueAlertData.filter((item) => {
      const searchMatch =
        item.studentName.toLowerCase().includes(overdueSearch.toLowerCase()) ||
        item.studentId.toLowerCase().includes(overdueSearch.toLowerCase()) ||
        item.invoiceNo.toLowerCase().includes(overdueSearch.toLowerCase()) ||
        item.studentClass.toLowerCase().includes(overdueSearch.toLowerCase());

      const jamatMatch =
        overdueJamatFilter === "all" || item.studentClass.includes(overdueJamatFilter);
      return searchMatch && jamatMatch;
    });
  }, [overdueAlertData, overdueSearch, overdueJamatFilter]);

  const totalOverdueAmount = React.useMemo(() => {
    return overdueAlertData.reduce((acc, curr) => acc + curr.due, 0);
  }, [overdueAlertData]);

  const triggerAutomatedSms = () => {
    setSmsNoticeSent(true);
    setTimeout(() => setSmsNoticeSent(false), 4500);
  };

  // Real-time monthly income and expense calculation
  const monthlyFinancialData = React.useMemo(() => {
    let extraIncomes: any[] = [];
    try {
      const saved = localStorage.getItem('madrasah_income_records_db');
      if (saved) {
        extraIncomes = JSON.parse(saved);
      }
    } catch (e) {}

    const now = new Date();
    const currentYear = now.getFullYear();

    const monthsMap = MONTH_NAMES_BN.map((name, idx) => ({
      month: name,
      monthIndex: idx,
      year: currentYear,
      income: 0,
      expense: 0,
      balance: 0,
      invoiceCount: 0,
      expenseCount: 0,
    }));

    const resolveItemMonthIndex = (item: any): number => {
      if (item.month && typeof item.month === 'string') {
        const trimmed = item.month.trim();
        const idx = MONTH_NAMES_BN.indexOf(trimmed);
        if (idx !== -1) return idx;
      }
      const parsed = parseDateToMonthYear(item.date);
      if (parsed && parsed.monthIndex >= 0 && parsed.monthIndex < 12) {
        return parsed.monthIndex;
      }
      return now.getMonth();
    };

    invoices.forEach((inv: any) => {
      const paidAmt = Number(inv.paidAmount) || Number(inv.paid) || Number(inv.netAmount) || Number(inv.subtotal) || Number(inv.total) || 0;
      if (!paidAmt) return;
      const mIdx = resolveItemMonthIndex(inv);
      if (mIdx >= 0 && mIdx < 12) {
        monthsMap[mIdx].income += paidAmt;
        monthsMap[mIdx].invoiceCount += 1;
      }
    });

    extraIncomes.forEach((inc: any) => {
      const amt = Number(inc.amount) || 0;
      if (!amt) return;
      const mIdx = resolveItemMonthIndex(inc);
      if (mIdx >= 0 && mIdx < 12) {
        monthsMap[mIdx].income += amt;
      }
    });

    expenses.forEach((exp: any) => {
      const amt = Number(exp.amount) || 0;
      if (!amt) return;
      const mIdx = resolveItemMonthIndex(exp);
      if (mIdx >= 0 && mIdx < 12) {
        monthsMap[mIdx].expense += amt;
        monthsMap[mIdx].expenseCount += 1;
      }
    });

    return monthsMap.map((m) => ({
      ...m,
      balance: m.income - m.expense,
    }));
  }, [invoices, expenses]);

  const monthlyCollection = React.useMemo(() => {
    return monthlyFinancialData.map((m) => ({
      month: m.month,
      income: m.income,
      expense: m.expense,
      balance: m.balance,
    }));
  }, [monthlyFinancialData]);

  const annualTotals = React.useMemo(() => {
    const totalInc = monthlyFinancialData.reduce((acc, m) => acc + m.income, 0);
    const totalExp = monthlyFinancialData.reduce((acc, m) => acc + m.expense, 0);
    const netBal = totalInc - totalExp;
    return {
      totalIncome: totalInc,
      totalExpense: totalExp,
      netBalance: netBal,
    };
  }, [monthlyFinancialData]);

  const COLORS = ["#0F6E8C", "#F59E0B", "#0F7B5E", "#E53E3E"];

  // Fast department menus (inspired by high-end mobile dashboard designs with interactive app grids)
  const quickLinks = [
    {
      id: "students",
      label: "শিক্ষার্থী",
      sub: "ডাটাবেস ও প্রোফাইল",
      icon: GraduationCap,
      color: "from-primary to-primary/80",
      bg: "bg-primary/10 text-primary shadow-primary/10",
      hoverText: "group-hover:text-primary dark:group-hover:text-primary",
    },
    {
      id: "student-fees",
      label: "ছাত্র ফি",
      sub: "ফি আদায় ও হিসেব",
      icon: Coins,
      color: "from-secondary to-secondary/80",
      bg: "bg-secondary/10 text-secondary shadow-secondary/10",
      hoverText: "group-hover:text-secondary dark:group-hover:text-secondary",
    },
    {
      id: "staff-salary",
      label: "ওস্তাদ বেতন",
      sub: "ওস্তাদ ও স্টাফ বেতন",
      icon: Wallet,
      color: "from-secondary to-secondary/80",
      bg: "bg-secondary/10 text-secondary shadow-secondary/10",
      hoverText: "group-hover:text-secondary dark:group-hover:text-secondary",
    },
    {
      id: "expenses",
      label: "ব্যয় খাত",
      sub: "দৈনিক খরচ ও ভাউচার",
      icon: ShoppingBag,
      color: "from-secondary to-secondary/80",
      bg: "bg-secondary/10 text-secondary shadow-secondary/10",
      hoverText: "group-hover:text-secondary dark:group-hover:text-secondary",
    },
    {
      id: "student-attendance",
      label: "ছাত্র হাজিরা",
      sub: "উপস্থিতি ও হাজিরা",
      icon: UserCheck,
      color: "from-primary to-primary/80",
      bg: "bg-primary/10 text-primary shadow-primary/10",
      hoverText: "group-hover:text-primary dark:group-hover:text-primary",
    },
    {
      id: "staff-attendance",
      label: "ওস্তাদ হাজিরা",
      sub: "ওস্তাদ উপস্থিতি ট্র্যাকার",
      icon: ShieldCheck,
      color: "from-primary to-primary/80",
      bg: "bg-primary/10 text-primary shadow-primary/10",
      hoverText: "group-hover:text-primary dark:group-hover:text-primary",
    },
    {
      id: "archive",
      label: "আর্কাইভ",
      sub: "সম্পন্ন কাজের খতিয়ান",
      icon: Archive,
      color: "from-primary to-primary/80",
      bg: "bg-primary/10 text-primary shadow-primary/10",
      hoverText: "group-hover:text-primary dark:group-hover:text-primary",
    },
  ];

  // Dynamic greetings based on Bangladesh current local hours
  const getGreetingText = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) return "শুভ সকাল অ্যাডমিন সাহেব! ☀️";
    if (hours >= 12 && hours < 16) return "শুভ দুপুর অ্যাডমিন সাহেব! 🌤️";
    if (hours >= 16 && hours < 18) return "শুভ বিকেল অ্যাডমিন সাহেব! 🌇";
    if (hours >= 18 && hours < 22) return "শুভ সন্ধ্যা অ্যাডমিন সাহেব! 🌙";
    return "আস-সালামু আলাইকুম, অ্যাডমিন সাহেব! 👋";
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-hind-siliguri">
      {/* Top Automated Overdue Student Fees Alert Banner */}
      {overdueAlertData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-rose-500/15 border-2 border-rose-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left shadow-lg font-hind-siliguri"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30 font-black animate-pulse">
              <Bell size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  অটোমেটিক অ্যালার্ট
                </span>
                <h3 className="text-sm sm:text-base font-black text-rose-700 dark:text-rose-400">
                  শিক্ষার্থীদের বকেয়া ফি সতর্কতা নোটিফিকেশন!
                </h3>
              </div>
              <p className="text-xs font-bold text-text-main/80 leading-relaxed">
                বর্তমানে <span className="text-rose-600 dark:text-rose-400 font-black">{enToBnNumber(overdueAlertData.length.toString())} জন</span> শিক্ষার্থীর সর্বমোট <span className="text-rose-600 dark:text-rose-400 font-black">৳ {enToBnNumber(totalOverdueAmount.toString())}</span> টাকা ফি পরিশোধ বকেয়া রয়েছে।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={triggerAutomatedSms}
              className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <MessageSquare size={14} /> তাগাদা এসএমএস
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("overdue-fees-alert-hub");
                if (el) el.scrollIntoView({ behavior: "smooth" });
                else if (setActiveTab) setActiveTab("student-fees");
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              বকেয়া তালিকা দেখুন ➔
            </button>
          </div>
        </motion.div>
      )}

      {/* GREETING_REMOVED */}

      {/* Mobile-First Greeting and Status Summary Card (Inspired by Image 2, Let's become more productive) */}
      {false && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-[#0F6E8C] to-[#2B9CBB] dark:from-[#0F6E8C] dark:to-[#115E76] text-white rounded-[2.5rem] p-6 sm:p-10 shadow-2xl overflow-hidden group pb-8 sm:pb-12"
        >
          <div className="absolute top-[-50%] right-[-5%] w-[60%] h-[150%] bg-white/10 rounded-full blur-[80px] group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
          <div className="absolute bottom-[-40%] left-[-10%] w-[35%] h-[90%] bg-[#2B9CBB]/30 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="space-y-3.5 max-w-xl text-left">
              <span className="px-3.5 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-[#F0F7FC]">
                মাদ্রাসা ড্যাশবোর্ড ও কন্ট্রোল সেন্ট্রাল
              </span>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight mt-2 leading-tight flex items-center gap-2">
                {getGreetingText()}
              </h1>
              <p className="text-xs sm:text-sm text-white/90 font-medium font-hind-siliguri mr-1 leading-relaxed">
                দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা ম্যানেজমেন্ট পোর্টালে আপনার
                আজকের দিনের ভর্তি প্রক্রিয়াকরণ, হাজিরা পরিস্থিতি ও সাধারণ
                প্রতিবেদনসমূহ এই কন্ট্রোল সেন্টারে সুবিন্যস্ত করা হয়েছে।
              </p>
            </div>

            {/* today's ledger widget matching the screenshot */}
            <div className="w-full xl:w-[24rem] bg-[#0A1A29]/95 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-5 text-left text-white shadow-2xl font-hind-siliguri flex flex-col justify-between shrink-0">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-3">
                <span className="text-sm">📋</span>
                <h3 className="text-xs font-black tracking-tight text-white leading-none">
                  সেন্ট্রাল ডাটাবেস খতিয়ান ও স্থিতি
                </h3>
              </div>

              <div className="space-y-3">
                {/* Header row */}
                <div className="grid grid-cols-12 gap-1 text-[10px] font-black text-white/40 uppercase tracking-wider pb-0.5">
                  <span className="col-span-6 text-left">বিবরণ / বিষয়</span>
                  <span className="col-span-3 text-center">স্থিতি</span>
                  <span className="col-span-3 text-right">রেকর্ড সংখ্যা</span>
                </div>

                {/* row 1 */}
                <div className="grid grid-cols-12 gap-1 text-xs font-bold items-center border-t border-white/5 pt-2">
                  <span className="col-span-6 text-white/90 truncate">
                    ভর্তি সম্পন্ন ছাত্রীবৃন্দ
                  </span>
                  <div className="col-span-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black leading-none uppercase">
                      চলমান
                    </span>
                  </div>
                  <span className="col-span-3 text-right text-emerald-400 font-extrabold">
                    {enToBnNumber(yearStudents.length.toString())} জন
                  </span>
                </div>

                {/* row 2 */}
                <div className="grid grid-cols-12 gap-1 text-xs font-bold items-center border-t border-white/5 pt-2">
                  <span className="col-span-6 text-white/90 truncate">
                    ভর্তি ও রেজিস্ট্রেশন
                  </span>
                  <div className="col-span-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black leading-none uppercase">
                      যাচাইকরণ
                    </span>
                  </div>
                  <span className="col-span-3 text-right text-amber-400 font-extrabold">
                    {enToBnNumber(pending.length.toString())} টি
                  </span>
                </div>

                {/* row 3 */}
                <div className="grid grid-cols-12 gap-1 text-xs font-bold items-center border-t border-white/5 pt-2">
                  <span className="col-span-6 text-white/90 truncate">
                    নতুন ভর্তি (চলতি মাস)
                  </span>
                  <div className="col-span-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[9px] font-black leading-none uppercase">
                      হালনাগাদ
                    </span>
                  </div>
                  <span className="col-span-3 text-right text-sky-400 font-extrabold">
                    {enToBnNumber(currentMonthNewAdmissions.toString())} জন
                  </span>
                </div>

                {/* row 4 */}
                <div className="grid grid-cols-12 gap-1 text-xs font-bold items-center border-t border-white/5 pt-2">
                  <span className="col-span-6 text-white/90 truncate">
                    চলমান শিক্ষাবর্ষ
                  </span>
                  <div className="col-span-3 text-center">
                    <span className="inline-block px-2 px-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-[9px] font-black leading-none uppercase">
                      বর্তমান
                    </span>
                  </div>
                  <span className="col-span-3 text-right text-indigo-400 font-extrabold">
                    ২০২৬-২৭
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Premium Categorized Analytics Summary Dashboard (12 Specific Cards) */}
      <div id="premium-analytics-summary" className="space-y-10 font-hind-siliguri">
        {/* SECTION 1: একাডেমিক ব্যবস্থাপনা */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-main/55 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              <div>
                <h3 className="text-base sm:text-lg font-black text-text-main tracking-tight leading-none">
                  একাডেমিক ব্যবস্থাপনা (Academic Management)
                </h3>
                <p className="text-[11px] text-text-light/70 font-medium mt-0.5">
                  রিয়েল-টাইম শিক্ষার্থী বায়োমেট্রিক হাজিরা, শ্রেণি ব্যবস্থাপনা এবং অটোমেটিক এসএমএস ট্র্যাকিং
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                <span>মেশিন লাইভ সিঙ্ক সক্রিয়</span>
              </span>
              <button
                onClick={() => setActiveTab?.("student-attendance")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                <Zap size={13} />
                <span>বায়োমেট্রিক কনসোল</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: শিক্ষার্থী */}
            <motion.div
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-primary/15 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[185px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Users size={20} className="stroke-[2.5]" />
                </div>
                <div className="flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded-full text-[10px] font-black text-primary">
                  <TrendingUp size={11} />
                  <span>সক্রিয়</span>
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">মোট শিক্ষার্থী</p>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                  {enToBnNumber(yearStudents.length.toString())} জন
                </h2>
                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={() => setActiveTab?.("student-all")}
                    className="flex-1 py-1.5 px-2.5 bg-primary hover:bg-primary/90 text-white font-black text-[10px] rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer text-center"
                  >
                    সকল শিক্ষার্থী
                  </button>
                  <button 
                    onClick={() => setActiveTab?.("admission-new")}
                    className="flex-1 py-1.5 px-2.5 bg-primary/5 dark:bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10 font-black text-[10px] rounded-xl transition-all active:scale-95 cursor-pointer text-center"
                  >
                    নতুন ভর্তি
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Card 2: শ্রেণী ও বিষয় */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("academic-class")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-primary/15 hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[185px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Layers size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] bg-primary/5 px-2.5 py-1 rounded-full font-black text-primary">
                  চলতি বছর
                </span>
              </div>
              <div className="mt-2.5">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">মোট জামাত/শ্রেণী</p>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                    {enToBnNumber(classes.length.toString())} টি
                  </h2>
                  <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {enToBnNumber(activeJamatsCount.toString())} টি সক্রিয়
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab?.("academic-subject");
                    }}
                    className="hover:text-primary cursor-pointer"
                  >
                    মোট বিষয়: {enToBnNumber(subjectCount.toString())} টি ➔
                  </span>
                  <span className="text-primary font-black">জামাত তালিকা ➔</span>
                </div>
              </div>
            </motion.div>

            {/* Card 3: রিয়েল-টাইম দৈনিক হাজিরা */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("student-attendance")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-primary/15 hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[185px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <UserCheck size={20} className="stroke-[2.5]" />
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>মেশিন লাইভ</span>
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">রিয়েল-টাইম দৈনিক হাজিরা</p>
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] font-bold text-text-light/70">উপস্থিত:</span>
                    <h2 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {enToBnNumber(dailyAttendanceStats.present.toString())} জন
                    </h2>
                  </div>
                  <span className="text-border-main text-sm font-light">|</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] font-bold text-text-light/70">অনুপস্থিত:</span>
                    <h2 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                      {enToBnNumber(dailyAttendanceStats.absent.toString())} জন
                    </h2>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-black">
                    উপস্থিতির হার: {enToBnNumber(dailyAttendanceStats.percentage.toString())}%
                  </span>
                  <span className="text-primary font-black">হাজিরা খতিয়ান ➔</span>
                </div>
              </div>
            </motion.div>

            {/* Card 4: মেসেজ ও এসএমএস ব্যালেন্স (খরচ হওয়া ও একাউন্টে থাকা মেসেজ সংখ্যা) */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("attendance-messaging")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-primary/15 hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[185px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-teal-500/10 text-teal-600 dark:text-teal-400 p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare size={20} className="stroke-[2.5]" />
                </div>
                <div className="flex items-center gap-1 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full text-[10px] font-black text-teal-600 dark:text-teal-400">
                  <span>SMS গেটওয়ে</span>
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">মেসেজ ও এসএমএস ব্যালেন্স</p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] font-bold text-text-light/70">অবশিষ্ট:</span>
                    <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                      {enToBnNumber(smsStats.remainingBalance.toString())} টি
                    </h2>
                  </div>
                  <span className="text-border-main text-sm font-light">|</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] font-bold text-text-light/70">খরচ:</span>
                    <h2 className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 tracking-tight">
                      {enToBnNumber(smsStats.usedCount.toString())} টি
                    </h2>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span className="text-teal-600 dark:text-teal-400 font-black">
                    আজকের প্রেরিত: {enToBnNumber(smsStats.sentToday.toString())} টি
                  </span>
                  <span className="text-primary font-black">মেসেজিং সেন্টারে যান ➔</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Academic Real-Time Message & Attendance Tracking Section */}
          <div className="bg-card rounded-2xl border border-border-main/60 p-4 sm:p-6 shadow-sm space-y-5">
            {/* Header & SMS Metrics Ribbon */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-main/40 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <MessageSquare size={16} />
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-text-main">
                    একাডেমিক মেসেজ ও অভিভাবক নোটিফিকেশন খতিয়ান
                  </h4>
                </div>
                <p className="text-xs text-text-light/70 font-medium mt-1">
                  বায়োমেট্রিক হাজিরা পাঞ্চ, লেট এলার্ট, অনুপস্থিতি ও বকেয়া ফি সংক্রান্ত সকল অটোমেটিক এসএমএস স্ট্যাটাস
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowRechargeModal(true)}
                  className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>এসএমএস রিচার্জ</span>
                </button>
                <button
                  onClick={() => setActiveTab?.("attendance-messaging")}
                  className="px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Send size={14} />
                  <span>মেসেজিং সেটিংস ও রুল</span>
                </button>
              </div>
            </div>

            {/* Quick SMS Summary Meters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3 bg-muted/40 rounded-xl border border-border-main/40">
                <p className="text-[10px] font-bold text-text-light/70 uppercase">মোট এসএমএস প্যাকেজ</p>
                <p className="text-lg font-black text-text-main mt-0.5">
                  {enToBnNumber(smsStats.totalPurchased.toString())} <span className="text-xs font-normal">টি</span>
                </p>
              </div>
              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">খরচ হওয়া মেসেজ</p>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {enToBnNumber(smsStats.usedCount.toString())} <span className="text-xs font-normal">টি</span>
                </p>
              </div>
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
                <p className="text-[10px] font-bold text-primary uppercase">একাউন্টে থাকা ব্যালেন্স</p>
                <p className="text-lg font-black text-primary mt-0.5">
                  {enToBnNumber(smsStats.remainingBalance.toString())} <span className="text-xs font-normal">টি</span>
                </p>
              </div>
              <div className="p-3 bg-teal-500/5 rounded-xl border border-teal-500/20">
                <p className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase">আজকের প্রেরিত</p>
                <p className="text-lg font-black text-teal-600 dark:text-teal-400 mt-0.5">
                  {enToBnNumber(smsStats.sentToday.toString())} <span className="text-xs font-normal">টি</span>
                </p>
              </div>
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 col-span-2 sm:col-span-1">
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">ডেলিভারি সাকসেস</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {enToBnNumber(smsStats.deliveryRate.toString())}% <span className="text-xs font-normal">সফল</span>
                </p>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {[
                  { id: 'all', label: 'সকল মেসেজ' },
                  { id: 'punch', label: 'পাঞ্চ এন্ট্রি/এক্সিট' },
                  { id: 'late', label: 'দেরিতে আগমন' },
                  { id: 'absent', label: 'অনুপস্থিতি বার্তা' },
                  { id: 'fee', label: 'ফি নোটিফিকেশন' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSmsFilter(tab.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                      smsFilter === tab.id
                        ? "bg-primary text-white shadow-sm"
                        : "bg-muted hover:bg-muted/80 text-text-light"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                <input
                  type="text"
                  value={smsSearch}
                  onChange={(e) => setSmsSearch(e.target.value)}
                  placeholder="শিক্ষার্থীর নাম, মোবাইল বা মেসেজ খুঁজুন..."
                  className="w-full pl-9 pr-3 py-1.5 bg-muted/50 border border-border-main/50 rounded-xl text-xs text-text-main focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Sent SMS Logs Table */}
            <div className="border border-border-main/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/70 text-text-main font-bold border-b border-border-main/50">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">শিক্ষার্থী ও অভিভাবক</th>
                      <th className="py-2.5 px-3">মোবাইল নম্বর</th>
                      <th className="py-2.5 px-3">মেসেজের ধরন</th>
                      <th className="py-2.5 px-3">প্রেরণের সময়</th>
                      <th className="py-2.5 px-3">মেসেজ বিবরণ</th>
                      <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main/40 text-text-main">
                    {filteredSentLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-text-light/60 font-medium">
                          কোনো মেসেজ রেকর্ড পাওয়া যায়নি। বায়োমেট্রিক পাঞ্চ হলে স্বয়ংক্রিয়ভাবে মেসেজ জমা হবে।
                        </td>
                      </tr>
                    ) : (
                      filteredSentLogs.slice(0, 10).map((log, index) => {
                        const eventLabels: Record<string, { label: string; color: string }> = {
                          entry: { label: 'পাঞ্চ প্রবেশ', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
                          exit: { label: 'প্রস্থান', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
                          late: { label: 'দেরিতে আগমন', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
                          absent: { label: 'অনুপস্থিতি', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
                          fee_due: { label: 'বকেয়া ফি', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
                          fee_payment: { label: 'ফি প্রাপ্তি', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
                          general_notice: { label: 'নোটিশ', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
                        };
                        const evInfo = eventLabels[log.event] || { label: log.event, color: 'bg-primary/10 text-primary border-primary/20' };

                        return (
                          <tr key={log.id || index} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-[11px] text-text-light">
                              {enToBnNumber((index + 1).toString())}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-text-main">{log.studentName}</div>
                              <div className="text-[10px] text-text-light">{log.guardianName || 'অভিভাবক'}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-primary">
                              {log.phone}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border", evInfo.color)}>
                                {evInfo.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-text-light whitespace-nowrap">
                              {log.sentTime ? new Date(log.sentTime).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : 'সবেমাত্র'}
                            </td>
                            <td className="py-2.5 px-3 max-w-[280px]">
                              <p className="text-[11px] text-text-main line-clamp-1" title={log.content}>
                                {log.content}
                              </p>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                                log.deliveryStatus === 'delivered' || log.deliveryStatus === 'sent'
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              )}>
                                <CheckCircle2 size={11} />
                                {log.deliveryStatus === 'delivered' ? 'ডেলিভার্ড' : (log.deliveryStatus === 'sent' ? 'প্রেরিত' : 'ব্যর্থ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {filteredSentLogs.length > 10 && (
                <div className="p-2.5 bg-muted/40 border-t border-border-main/40 text-center">
                  <button
                    onClick={() => setActiveTab?.("attendance-messaging")}
                    className="text-xs font-black text-primary hover:underline cursor-pointer"
                  >
                    সকল {enToBnNumber(filteredSentLogs.length.toString())} টি মেসেজের বিস্তারিত লগ দেখুন ➔
                  </button>
                </div>
              )}
            </div>

            {/* Jamat-Wise Real-Time Attendance Breakdown Dropdown / Card */}
            <div className="pt-2">
              <button
                onClick={() => setShowJamatAttendanceTable(!showJamatAttendanceTable)}
                className="w-full flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/60 rounded-xl border border-border-main/50 text-xs font-black text-text-main transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-primary" />
                  <span>আজকের জামাতভিত্তিক রিয়েল-টাইম উপস্থিতি খতিয়ান ({enToBnNumber(jamatAttendanceList.length.toString())} টি জামাত)</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary text-[11px]">
                  <span>{showJamatAttendanceTable ? "লুকান" : "বিস্তারিত দেখুন"}</span>
                  <ChevronRight size={14} className={cn("transition-transform", showJamatAttendanceTable ? "rotate-90" : "")} />
                </div>
              </button>

              {showJamatAttendanceTable && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {jamatAttendanceList.map((jamat, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveTab?.("student-attendance")}
                      className="p-3.5 bg-card hover:bg-muted/20 rounded-xl border border-border-main/50 transition-all shadow-xs cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-text-main">{jamat.className}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                          মোট: {enToBnNumber(jamat.total.toString())} জন
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          উপস্থিত: {enToBnNumber(jamat.present.toString())}
                        </span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          অনুপস্থিত: {enToBnNumber(jamat.absent.toString())}
                        </span>
                        <span className="font-mono font-bold text-primary">
                          {enToBnNumber(jamat.percentage.toString())}%
                        </span>
                      </div>
                      {/* Mini Progress Bar */}
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${jamat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recharge SMS Balance Modal */}
        {showRechargeModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl border border-border-main p-6 max-w-md w-full shadow-2xl space-y-4 font-hind-siliguri"
            >
              <div className="flex items-center justify-between border-b border-border-main/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-main">এসএমএস ব্যালেন্স রিচার্জ</h3>
                    <p className="text-xs text-text-light">মাদ্রাসার একাউন্টে নতুন SMS বান্ডিল যোগ করুন</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRechargeModal(false)}
                  className="p-1 rounded-lg hover:bg-muted text-text-light cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-light">বর্তমান ব্যালেন্স:</span>
                    <span className="font-bold text-text-main">{enToBnNumber(smsStats.remainingBalance.toString())} টি SMS</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-light">মোট খরচ হওয়া:</span>
                    <span className="font-bold text-amber-600">{enToBnNumber(smsStats.usedCount.toString())} টি SMS</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-main mb-1 block">
                    রিচার্জের পরিমাণ (SMS সংখ্যা)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[500, 1000, 2000, 5000, 10000, 20000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setRechargeAmount(amt)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                          rechargeAmount === amt
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-muted/50 border-border-main/50 text-text-main hover:bg-muted"
                        )}
                      >
                        +{enToBnNumber(amt.toString())} টি
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border-main/50">
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(false)}
                  className="flex-1 py-2.5 bg-muted hover:bg-muted/80 text-text-main font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addSmsBundle(rechargeAmount);
                    setShowRechargeModal(false);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  <span>এখনই যুক্ত করুন</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* SECTION 2: আর্থিক ব্যবস্থাপনা */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border-main/55 pb-2">
            <div className="w-1.5 h-6 bg-secondary rounded-full" />
            <h3 className="text-base sm:text-lg font-black text-text-main tracking-tight leading-none">
              আর্থিক ব্যবস্থাপনা (Financial Management)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 5: ফি সংগ্রহ */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("student-fees")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-secondary/15 hover:border-secondary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-secondary/10 text-secondary p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Coins size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] bg-secondary/5 px-2.5 py-1 rounded-full font-black text-secondary">
                  মাসিক আদায়
                </span>
              </div>
              <div className="mt-4">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">ফি সংগ্রহ</p>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                  ৳ {enToBnNumber(totalIncome.toString())}
                </h2>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span>রিয়েল টাইম মোট আদায়</span>
                  <span className="text-secondary">সংগ্রহ করুন ➔</span>
                </div>
              </div>
            </motion.div>

            {/* Card 6: ব্যয় */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("expenses")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-secondary/15 hover:border-secondary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-secondary/10 text-secondary p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] bg-secondary/5 px-2.5 py-1 rounded-full font-black text-secondary">
                  সর্বমোট খরচ
                </span>
              </div>
              <div className="mt-4">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">মোট মাসিক ব্যয়</p>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                  ৳ {enToBnNumber(totalExpenses.toString())}
                </h2>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span>হিসাব দেখুন</span>
                  <span className="text-secondary">ব্যয় এন্ট্রি ➔</span>
                </div>
              </div>
            </motion.div>

            {/* Card 7: ইনভয়েস */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("settings-invoice")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-secondary/15 hover:border-secondary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-secondary/10 text-secondary p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <FileText size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] bg-secondary/5 px-2.5 py-1 rounded-full font-black text-secondary">
                  ভর্তি স্লিপ
                </span>
              </div>
              <div className="mt-4">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">ভর্তি ইনভয়েস</p>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                  {enToBnNumber(invoices.length.toString())} টি
                </h2>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
              <span>বিস্তারিত</span>
                  <span className="text-secondary">ইনভয়েস সেটআপ ➔</span>
                </div>
              </div>
            </motion.div>

            {/* Card 8: ক্যাশ ফ্লো */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("income-cash-list")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-secondary/15 hover:border-secondary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-secondary/10 text-secondary p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Wallet size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] bg-secondary/5 px-2.5 py-1 rounded-full font-black text-secondary">
                  ক্যাশ ইন হ্যান্ড
                </span>
              </div>
              <div className="mt-4">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">ক্যাশ ফ্লো ও ব্যালেন্স</p>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                  ৳ {enToBnNumber(cashInHand.toString())}
                </h2>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span>তহবিল: সাধারণ ও লিল্লাহ</span>
                  <span className="text-secondary">ক্যাশ খাতা ➔</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Real-time Monthly Income & Expense Table */}
          <div className="bg-card rounded-[1.8rem] p-5 sm:p-6 border border-border-main/60 shadow-sm space-y-4 font-hind-siliguri">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-main/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <Coins size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-black text-text-main tracking-tight">
                    মাসিক আয় ও ব্যয় বিবরণী টেবিল (রিয়েল-টাইম ডাটা)
                  </h4>
                  <p className="text-[11px] text-text-light/55 font-bold">
                    চলতি বছরের প্রতি মাসের মোট আয় (ফি ও অনুদান), মোট ব্যয় ও নিট ব্যালেন্সের অটোমেটিক লাইভ খতিয়ান
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-black flex items-center gap-1.5 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  রিয়েল-টাইম লাইভ ডাটা
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-border-main/50 rounded-2xl">
              <table className="w-full text-xs text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-step-bg border-b border-border-main/60 text-text-light/70 font-black uppercase text-[11px]">
                    <th className="p-3.5">মাস</th>
                    <th className="p-3.5 text-right">মোট আয় (৳)</th>
                    <th className="p-3.5 text-right">মোট ব্যয় (৳)</th>
                    <th className="p-3.5 text-right">নিট ব্যালেন্স (৳)</th>
                    <th className="p-3.5 text-center">আর্থিক অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/40 font-bold">
                  {monthlyFinancialData.map((row) => {
                    const isProfit = row.balance > 0;
                    const isLoss = row.balance < 0;
                    return (
                      <tr
                        key={row.month}
                        className="hover:bg-step-bg/60 transition-colors"
                      >
                        <td className="p-3.5 text-text-main font-black flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-secondary/60"></span>
                          {row.month}
                        </td>
                        <td className="p-3.5 text-right text-emerald-600 dark:text-emerald-400 font-black">
                          ৳ {enToBnNumber(row.income.toString())}
                        </td>
                        <td className="p-3.5 text-right text-rose-600 dark:text-rose-400 font-black">
                          ৳ {enToBnNumber(row.expense.toString())}
                        </td>
                        <td
                          className={`p-3.5 text-right font-black ${
                            isProfit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : isLoss
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-text-main"
                          }`}
                        >
                          ৳ {enToBnNumber(row.balance.toString())}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              isProfit
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : isLoss
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "bg-slate-100 dark:bg-slate-800 text-text-light/60"
                            }`}
                          >
                            {isProfit ? "উদ্বৃত্ত (লাভ)" : isLoss ? "ঘাটতি (লস)" : "সমতা"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-step-bg/80 border-t-2 border-border-main/70 font-black text-xs text-text-main">
                    <td className="p-3.5 font-black uppercase">সর্বমোট (বছরের খতিয়ান)</td>
                    <td className="p-3.5 text-right text-emerald-600 dark:text-emerald-400 font-black text-sm">
                      ৳ {enToBnNumber(annualTotals.totalIncome.toString())}
                    </td>
                    <td className="p-3.5 text-right text-rose-600 dark:text-rose-400 font-black text-sm">
                      ৳ {enToBnNumber(annualTotals.totalExpense.toString())}
                    </td>
                    <td
                      className={`p-3.5 text-right font-black text-sm ${
                        annualTotals.netBalance >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      ৳ {enToBnNumber(annualTotals.netBalance.toString())}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="text-[10px] bg-secondary/10 text-secondary px-2.5 py-1 rounded-full font-black">
                        সর্বমোট নিট
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Automated Overdue Fees Alert Hub */}
          <div id="overdue-fees-alert-hub" className="bg-card rounded-[1.8rem] p-5 sm:p-6 border-2 border-rose-500/30 shadow-md space-y-5 font-hind-siliguri relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-main/60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 shadow-inner">
                  <AlertCircle size={24} className="stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base sm:text-xl font-black text-text-main tracking-tight">
                      অটোমেটিক বকেয়া ফি অ্যালার্ট ও তাগাদা ম্যানেজমেন্ট প্যানেল
                    </h4>
                    <span className="text-[10px] bg-rose-500 text-white font-black px-2.5 py-0.5 rounded-full">
                      রিয়েল-টাইম
                    </span>
                  </div>
                  <p className="text-xs text-text-light/60 font-bold mt-0.5">
                    যেসব শিক্ষার্থীর টিউটরিয়াল, খোরাকী বা মাসিক ফি পরিশোধ সময়সীমা অতিক্রান্ত বা বকেয়া পড়েছে তাদের তালিকা ও স্বয়ংক্রিয় তাগাদা ব্যবস্থা
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={triggerAutomatedSms}
                  className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <MessageSquare size={15} /> তাগাদা এসএমএস পাঠান
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-step-bg hover:bg-border-main/30 text-text-main border border-border-main/60 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2"
                >
                  <FileText size={15} /> বকেয়া রিপোর্ট প্রিন্ট
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab("student-fees")}
                  className="px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  <Coins size={15} /> ফি আদায় মডিউল ➔
                </button>
              </div>
            </div>

            {/* SMS Notice Success Toast */}
            {smsNoticeSent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-black flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>স্বয়ংক্রিয়ভাবে {enToBnNumber(filteredOverdueList.length.toString())} জন বকেয়া শিক্ষার্থীর অভিভাবকের মোবাইল নম্বরে ফি পরিশোধের তাগাদা এসএমএস কিউ (Queue)-তে যুক্ত করা হয়েছে!</span>
                </div>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">সফল</span>
              </motion.div>
            )}

            {/* KPI Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-rose-600/70 dark:text-rose-400 uppercase tracking-wider block">বকেয়া মোট শিক্ষার্থী</span>
                  <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                    {enToBnNumber(overdueAlertData.length.toString())} জন
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center font-black">
                  <Users size={20} />
                </div>
              </div>

              <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-amber-600/70 dark:text-amber-400 uppercase tracking-wider block">সর্বমোট বকেয়া পরিমাণ</span>
                  <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    ৳ {enToBnNumber(totalOverdueAmount.toString())}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-black">
                  <Coins size={20} />
                </div>
              </div>

              <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-indigo-600/70 dark:text-indigo-400 uppercase tracking-wider block">ফিল্টারকৃত বকেয়া পরিমাণ</span>
                  <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    ৳ {enToBnNumber(filteredOverdueList.reduce((a, b) => a + b.due, 0).toString())}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-600 flex items-center justify-center font-black">
                  <SlidersHorizontal size={20} />
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light/40" size={16} />
                <input
                  type="text"
                  placeholder="শিক্ষার্থীর নাম, আইডি, রোল বা ইনভয়েস দিয়ে খুজুন..."
                  value={overdueSearch}
                  onChange={(e) => setOverdueSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-step-bg border border-border-main/60 rounded-xl text-xs font-bold outline-none text-text-main focus:border-rose-500 transition-all"
                />
              </div>

              <select
                value={overdueJamatFilter}
                onChange={(e) => setOverdueJamatFilter(e.target.value)}
                className="px-4 py-2.5 bg-step-bg border border-border-main/60 rounded-xl text-xs font-bold outline-none text-text-main cursor-pointer font-hind-siliguri"
              >
                <option value="all">সকল জামাত/শ্রেণী</option>
                {JAMAT_LIST.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>

            {/* Overdue Table */}
            <div className="overflow-x-auto border border-border-main/50 rounded-2xl">
              <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-step-bg border-b border-border-main/60 text-text-light/70 font-black uppercase text-[10px]">
                    <th className="p-3.5">শিক্ষার্থীর নাম ও আইডি</th>
                    <th className="p-3.5">জামাত/শ্রেণী</th>
                    <th className="p-3.5">ইনভয়েস নং & তারিখ</th>
                    <th className="p-3.5 text-right">মোট ফি (৳)</th>
                    <th className="p-3.5 text-right">জমা (৳)</th>
                    <th className="p-3.5 text-right">বকেয়া (৳)</th>
                    <th className="p-3.5">অভিভাবকের মোবাইল</th>
                    <th className="p-3.5 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/40 font-bold">
                  {filteredOverdueList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-text-light/60 font-bold">
                        🎉 অভিনন্দন! বর্তমান ফিল্টারে কোন শিক্ষার্থীর বকেয়া ফি পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredOverdueList.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-rose-500/5 transition-colors">
                        <td className="p-3.5">
                          <div className="font-black text-text-main">{item.studentName}</div>
                          <div className="text-[10px] text-text-light/60 font-mono">আইডি: {enToBnNumber(item.studentId)} | রোল: {enToBnNumber(item.studentRoll)}</div>
                        </td>
                        <td className="p-3.5 font-bold text-text-main">
                          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-[11px] font-black">
                            {item.studentClass}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono text-text-main text-[11px]">{item.invoiceNo}</div>
                          <div className="text-[10px] text-text-light/50">{enToBnNumber(item.date)}</div>
                        </td>
                        <td className="p-3.5 text-right font-black">৳ {enToBnNumber(item.subtotal.toString())}</td>
                        <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">৳ {enToBnNumber(item.paid.toString())}</td>
                        <td className="p-3.5 text-right font-black text-rose-600 dark:text-rose-400 text-sm">
                          ৳ {enToBnNumber(item.due.toString())}
                        </td>
                        <td className="p-3.5 font-mono text-text-light/80 text-[11px]">{enToBnNumber(item.studentPhone)}</td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setActiveTab && setActiveTab("student-fees")}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-sm flex items-center gap-1 mx-auto"
                          >
                            <CreditCard size={12} /> ফি জমা করুণ
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 3: এইচআর ব্যবস্থাপনা */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border-main/55 pb-2">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h3 className="text-base sm:text-lg font-black text-text-main tracking-tight leading-none">
              এইচআর ব্যবস্থাপনা (HR Management)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 9: কর্মচারী */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("staff-leaves")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-primary/15 hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Users size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] bg-primary/5 px-2.5 py-1 rounded-full font-black text-primary">
                  কর্মী তালিকা
                </span>
              </div>
              <div className="mt-4">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">মোট সাধারণ কর্মচারী</p>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                  {enToBnNumber(staffCount.toString())} জন
                </h2>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span>সক্রিয় কর্মী রেজিস্টার</span>
                  <span className="text-primary">ছুটি ট্র্যাকার ➔</span>
                </div>
              </div>
            </motion.div>

            {/* Card 10: ওস্তাদ/শিক্ষক */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("teachers-list")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-primary/15 hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] bg-primary/5 px-2.5 py-1 rounded-full font-black text-primary">
                  ওস্তাদবৃন্দ
                </span>
              </div>
              <div className="mt-4">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">মোট শিক্ষক (ওস্তাদ)</p>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                  {enToBnNumber(realTeacherCount.toString())} জন
                </h2>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span>নিবন্ধিত ওস্তাদ ও শিক্ষকবৃন্দ</span>
                  <span className="text-primary">ওস্তাদ প্রোফাইল ➔</span>
                </div>
              </div>
            </motion.div>

            {/* Card 11: সিস্টেম ব্যবহারকারী */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("users")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-secondary/15 hover:border-secondary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-secondary/10 text-secondary p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] bg-secondary/5 px-2.5 py-1 rounded-full font-black text-secondary">
                  অ্যাক্সেস কন্ট্রোল
                </span>
              </div>
              <div className="mt-4">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">সিস্টেম ব্যবহারকারী</p>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                  {enToBnNumber("1")} জন
                </h2>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span>প্রধান এডমিন অ্যাকাউন্ট</span>
                  <span className="text-secondary">ইউজার পারমিশন ➔</span>
                </div>
              </div>
            </motion.div>

            {/* Card 12: আর্কাইভ */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("archive")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-primary/15 hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Archive size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] bg-primary/5 px-2.5 py-1 rounded-full font-black text-primary">
                  সম্পন্ন ডাটা
                </span>
              </div>
              <div className="mt-4">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">আর্কাইভ ও খতিয়ান</p>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                  ডাটাবেস
                </h2>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span>পুরাতন সকল রেকর্ড</span>
                  <span className="text-primary">আর্কাইভ দেখুন ➔</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* SECTION 4: সিস্টেম ও কমিউনিকেশন */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border-main/55 pb-2">
            <div className="w-1.5 h-6 bg-warning rounded-full" />
            <h3 className="text-base sm:text-lg font-black text-text-main tracking-tight leading-none">
              সিস্টেম ও কমিউনিকেশন (System & Communication)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 13: আইডি কার্ড */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("id-card-print")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-warning/15 hover:border-warning/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-warning/10 text-warning p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <CreditCard size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] bg-warning/5 px-2.5 py-1 rounded-full font-black text-warning">
                  স্মার্ট কার্ড
                </span>
              </div>
              <div className="mt-4">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">আইডি কার্ড প্রিন্টিং</p>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                  ডিজিটাল আইডি
                </h2>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span>ডিজাইন ও বাল্ক প্রিন্ট</span>
                  <span className="text-warning">কার্ড তৈরি ➔</span>
                </div>
              </div>
            </motion.div>

            {/* Card 14: নোটিশ বোর্ড */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("notice")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-warning/15 hover:border-warning/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-warning/10 text-warning p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Bell size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] bg-warning/5 px-2.5 py-1 rounded-full font-black text-warning">
                  ঘোষণা
                </span>
              </div>
              <div className="mt-4">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">নোটিশ ও বিজ্ঞপ্তি</p>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                  {enToBnNumber(pending.length.toString())} টি নতুন
                </h2>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span>এসএমএস ও ওয়েব নোটিশ</span>
                  <span className="text-warning">নোটিশ বোর্ড ➔</span>
                </div>
              </div>
            </motion.div>

            {/* Card 15: সমস্যা ও সমাধান */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("madrasah-problems")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-warning/15 hover:border-warning/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-warning/10 text-warning p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] bg-warning/5 px-2.5 py-1 rounded-full font-black text-warning">
                  হেল্পডেস্ক
                </span>
              </div>
              <div className="mt-4">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">মাদ্রাসা সমস্যা</p>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                  সাপোর্ট
                </h2>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span>অভিযোগ ও পরামর্শ</span>
                  <span className="text-warning">রিপোর্ট করুন ➔</span>
                </div>
              </div>
            </motion.div>

            {/* Card 16: সেটিংস */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab?.("settings-software")}
              className="group relative overflow-hidden bg-card rounded-[1.5rem] p-5 border border-warning/15 hover:border-warning/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="bg-warning/10 text-warning p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Settings size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] bg-warning/5 px-2.5 py-1 rounded-full font-black text-warning">
                  কনফিগারেশন
                </span>
              </div>
              <div className="mt-4">
                <p className="text-text-light/50 font-bold text-[10px] uppercase tracking-wider mb-0.5">সিস্টেম সেটিংস</p>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                  সেটআপ
                </h2>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-main/40 text-[10px] font-bold text-text-light/70">
                  <span>অ্যাপ ও ইউজার সেটিংস</span>
                  <span className="text-warning">সেটিংস ➔</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Management Cards End */}
      <div className="pb-10"></div>

      {/* Charts & Interactive Financial Overviews */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Class distribution visual chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-12 lg:col-span-8 bento-card p-5 sm:p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-primary/5 rounded-full -mr-10 -mt-10 sm:-mr-20 sm:-mt-20 blur-3xl opacity-55 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex gap-2 mb-3">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                  পরিসংখ্যান
                </span>
                <span className="bg-step-bg text-text-light px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                  রিয়েল-টাইম তথ্য
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-md sm:text-xl font-black text-text-main leading-tight font-hind-siliguri">
                    শাখা/জামাত ভিত্তিক শিক্ষার্থীর সংখ্যা
                  </h3>
                  <p className="text-[10px] text-text-light/40 font-bold uppercase mt-1">
                    শ্রেণীসমূহ ও ভর্তি তথ্যের বিস্তারিত বিস্তার
                  </p>
                </div>

                <select
                  className="text-[10px] sm:text-xs bg-bg border border-border-main p-2.5 rounded-xl outline-none font-black font-hind-siliguri w-full sm:w-auto text-text-main cursor-pointer"
                  value={selectedYear}
                  onChange={(e) => onYearChange(e.target.value)}
                >
                  {academicYears.map((y) => (
                    <option key={y} value={y}>
                      {y === "১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী" ? `${y} (চলমান)` : y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-[230px] sm:h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={classData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(0,0,0,0.04)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    fontWeight={800}
                    tick={{ fill: "var(--color-text-light)" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    fontWeight={800}
                    tick={{ fill: "var(--color-text-light)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0, 0, 0, 0.02)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border border-border-main p-3 rounded-2xl shadow-xl font-hind-siliguri text-xs">
                            <p className="font-extrabold text-text-main text-[12px]">
                              {data.fullName}
                            </p>
                            <p className="text-[10px] font-bold text-text-light/50 mt-0.5">
                              {data.level}
                            </p>
                            <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-border-main/50">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: data.color }}
                              />
                              <span className="font-black text-primary dark:text-primary-light">
                                মোট ছাত্রী:{" "}
                                {enToBnNumber(data.value.toString())} জন
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={26}>
                    {classData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Dynamic level legend guide badges */}
            <div className="flex flex-wrap gap-2 sm:gap-x-4 sm:gap-y-2 items-center justify-center mt-4 pt-3.5 border-t border-border-main/40 font-hind-siliguri">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-text-light/80">
                  ইবতেদায়ি (Rose)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-text-light/80">
                  মুতাওয়াসসিতাহ (Amber)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1] shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-text-light/80">
                  সানাবিয়্যা (Indigo)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9] shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-text-light/80">
                  ফজিলত (Sky)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-text-light/80">
                  তাকমিল (Emerald)
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Small Pie Ratio Analytics (Image 3 UI concept) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-4 bento-card p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-[10px] sm:text-sm font-black mb-4 sm:mb-6 uppercase tracking-widest text-[#0F6E8C] dark:text-primary-light font-hind-siliguri">
              অনুপাত বিশ্লেষণ ও ভর্তি তথ্য
            </h3>
            <p className="text-[10px] text-text-light/40 font-bold uppercase mb-6 leading-none">
              আবাসিক বনাম অনাবাসিক শিক্ষার্থী অনুপাত
            </p>
          </div>

          <div className="flex-1 min-h-[160px] sm:min-h-[180px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry: any, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      cornerRadius={8}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
              <span className="block text-xl sm:text-2xl font-black text-text-main leading-none mb-1">
                {enToBnNumber(
                  (yearStudents.length).toString(),
                )}
              </span>
              <span className="block text-[7px] sm:text-[8px] font-black text-text-light/45 uppercase tracking-tighter leading-tight max-w-[80px]">
                মোট রেজিস্টার্ড ডেটা
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            {pieData.map((item: any) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 bg-step-bg rounded-2xl border border-border-main/50"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: item.color }}
                  />
                  <span className="text-[10px] sm:text-xs font-bold text-text-main">
                    {item.name}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-black text-text-main">
                  {enToBnNumber(item.value.toString())} জন
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Financial Collections and General Activity Block */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Salary payroll pie card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-12 lg:col-span-5 bento-card p-5 sm:p-8 relative"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-text-light/40 leading-none">
              মুল্যায়ন বেতন বিবরণী
            </h3>
            <span className="text-[9px] font-black text-success bg-success/10 px-2.5 py-1 rounded-full uppercase">
              চলতি মাস
            </span>
          </div>

          <div className="h-[200px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financialSummary}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {financialSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-2xl font-black text-text-main italic">
                {enToBnNumber(`${paidPercentage}%`)}
              </span>
              <span className="text-[8px] font-black text-success uppercase">
                সংগৃহীত ফি
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {financialSummary.map((item) => (
              <div
                key={item.name}
                className="p-3 bg-step-bg rounded-2xl border border-border-main/50 text-center"
              >
                <p className="text-[8px] font-black text-text-light/45 uppercase tracking-widest mb-1">
                  {item.name}
                </p>
                <p className="text-sm font-black text-text-main leading-none">
                  {enToBnNumber(item.value.toString())} জন
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Expense/Income dual AreaChart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-12 lg:col-span-7 bento-card p-5 sm:p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-text-light/40 leading-none">
                আয় ও ব্যয়ের গ্রাফ চার্ট
              </h3>
              <p className="text-[10px] text-text-light/40 font-bold uppercase mt-1">
                ষান্মাসিক মাদ্রাসা তহবিলের চিত্রকল্প
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0F6E8C]" />
                <span className="text-[9px] font-black text-text-light uppercase tracking-widest">
                  আয়
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-error" />
                <span className="text-[9px] font-black text-text-light uppercase tracking-widest">
                  ব্যয়
                </span>
              </div>
            </div>
          </div>

          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyCollection}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-error)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-error)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(0,0,0,0.05)"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  fontWeight={800}
                  tick={{ fill: "var(--color-text-light)" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  fontWeight={800}
                  tick={{ fill: "var(--color-text-light)" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "1.2rem",
                    border: "none",
                    boxShadow: "var(--shadow-md)",
                    fontWeight: 800,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="var(--color-primary)"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="var(--color-error)"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Feature Simulation Overlay Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-hind-siliguri">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFeature(null)}
            className="fixed inset-0 bg-slate-900 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg bg-card rounded-[2.5rem] border border-border-main/80 dark:border-slate-800 shadow-2xl p-6 sm:p-8 max-h-[85vh] flex flex-col overflow-hidden z-10"
          >
            {/* Background accents */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#0F6E8C]/5 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12" />

            <div className="flex items-start justify-between border-b border-border-main/55 pb-4 shrink-0 z-10">
              <div className="flex gap-3 items-center">
                <div className="w-11 h-11 rounded-xl bg-[#0F6E8C]/10 text-[#0F6E8C] flex items-center justify-center shrink-0">
                  {React.createElement(selectedFeature.icon, {
                    size: 18,
                    className: "stroke-[2.2]",
                  })}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-text-main leading-tight">
                    {selectedFeature.title}
                  </h3>
                  <p className="text-[10px] text-text-light/60 font-bold mt-0.5">
                    {selectedFeature.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeature(null)}
                className="p-2 rounded-full hover:bg-border-main/55 dark:hover:bg-slate-800 text-text-[#0F6E8C] hover:text-text-main transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Simulated Workflow Container */}
            <div className="flex-1 overflow-y-auto py-5 pr-1 scrollbar-thin z-10">
              <div className="mb-4 text-xs text-text-light/70 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-dashed border-border-main border-l-4 border-l-[#0F6E8C] leading-relaxed">
                {selectedFeature.desc}
              </div>

              {/* Dynamic Instance of Simulated Component */}
              {selectedFeature.component &&
                React.createElement(selectedFeature.component, {
                  enToBn: enToBnNumber,
                })}
            </div>

            {/* Footer */}
            <div className="border-t border-border-main/55 pt-4 shrink-0 text-center flex items-center justify-between z-10">
              <span className="text-[9px] font-black uppercase text-text-light/40 tracking-wider">
                রিয়েল-টাইম লাইভ ওয়ার্কফ্লো সিমুলেটর
              </span>
              <button
                type="button"
                onClick={() => setSelectedFeature(null)}
                className="py-1.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-main font-black text-[10px] rounded-xl transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Jamat Breakdown Modal */}
      {showJamatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowJamatModal(false)}
            className="fixed inset-0 bg-slate-900 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-2xl bg-card rounded-[2.5rem] border border-border-main/80 dark:border-slate-800 shadow-2xl p-6 sm:p-8 max-h-[85vh] flex flex-col font-hind-siliguri overflow-hidden z-10"
          >
            {/* Background elements for premium aesthetic */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-[40px] pointer-events-none -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#0F6E8C]/5 dark:bg-[#0F6E8C]/10 rounded-full blur-[30px] pointer-events-none -ml-12 -mb-12" />

            {/* Header */}
            <div className="flex items-start justify-between border-b border-border-main/50 dark:border-slate-800/85 pb-4 sm:pb-5 shrink-0 z-10">
              <div className="flex gap-3 sm:gap-4 items-center">
                <div className="w-12 h-12 rounded-[1.2rem] bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center shadow-inner shrink-0">
                  <Activity size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-md sm:text-xl font-black text-text-main tracking-tight leading-snug">
                    জামাত ও শিক্ষাবর্ষ ভিত্তিক পরিসংখ্যান
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CalendarDays size={12} className="text-[#0F6E8C]" />
                    <p className="text-[10px] sm:text-xs text-text-light/60 font-bold tracking-wider">
                      শিক্ষাবর্ষ: {selectedYear}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJamatModal(false)}
                className="p-2.5 rounded-full hover:bg-border-main/55 dark:hover:bg-slate-800 text-text-light/50 hover:text-text-main transition-colors cursor-pointer active:scale-95 shrink-0"
                title="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            {/* Jamat Filters / Buttons */}
            <div className="my-5 flex flex-col sm:flex-row p-1.5 bg-[#EEF2F5] dark:bg-slate-800/80 rounded-2xl sm:rounded-3xl border border-border-main/60 dark:border-slate-700/55 gap-1.5 shrink-0 z-10">
              <button
                type="button"
                onClick={() => setJamatFilter("active")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  jamatFilter === "active"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/15 active:scale-97"
                    : "text-text-light/75 hover:text-text-main hover:bg-white/50 dark:hover:bg-slate-700/50"
                }`}
              >
                <CheckCircle size={14} className="stroke-[2.5]" />
                <span>
                  সক্রিয় জামাত ({enToBnNumber(activeJamatsCount.toString())})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setJamatFilter("closed")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  jamatFilter === "closed"
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/15 active:scale-97"
                    : "text-text-light/75 hover:text-text-main hover:bg-white/50 dark:hover:bg-slate-700/50"
                }`}
              >
                <PowerOff size={14} className="stroke-[2.5]" />
                <span>
                  বন্ধ জামাত (
                  {enToBnNumber((classes.length - activeJamatsCount).toString())})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setJamatFilter("all")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  jamatFilter === "all"
                    ? "bg-[#0F6E8C] text-white shadow-md shadow-[#0F6E8C]/15 active:scale-97"
                    : "text-text-light/75 hover:text-text-main hover:bg-white/50 dark:hover:bg-slate-700/50"
                }`}
              >
                <Layers size={14} className="stroke-[2.5]" />
                <span>সকল জামাত ({enToBnNumber(classes.length.toString())})</span>
              </button>
            </div>

            {/* List Segment */}
            <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin space-y-3 z-10 max-h-[45vh]">
              {filteredJamatsData.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-4 text-text-light/30">
                    <BookOpen size={28} />
                  </div>
                  <p className="text-sm font-black text-text-light/50">
                    কোন জামাত পাওয়া যায়নি।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                  {filteredJamatsData.map((jamat, idx) => {
                    const lvlInfo = getLevelInfo(jamat.className);
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        key={jamat.className}
                        className={`flex items-center justify-between p-4 bg-card rounded-2xl sm:rounded-[1.4rem] border transition-all ${
                          jamat.isActive
                            ? "border-emerald-500/10 dark:border-emerald-500/5 hover:border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.01] to-transparent dark:from-emerald-500/5"
                            : "border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700/50 bg-slate-50/[0.3] dark:bg-slate-900/[0.15]"
                        }`}
                      >
                        <div className="flex gap-3 items-center min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              jamat.isActive
                                ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
                                : "bg-slate-100 dark:bg-slate-800 text-text-light/40"
                            }`}
                          >
                            <BookOpen size={15} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-black text-text-main truncate tracking-tight">
                              {jamat.className}
                            </h4>
                            <p className="text-[9px] font-bold text-text-light/50 truncate mt-0.5">
                              {lvlInfo.level}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {jamat.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-black">
                              {enToBnNumber(jamat.studentCount.toString())} জন
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/20 text-text-light/40 text-[10px] sm:text-xs font-black border border-dashed border-border-main/50 dark:border-slate-800">
                              পড়াশোনা বন্ধ
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Summary Info */}
            <div className="border-t border-border-main/50 dark:border-slate-800 pb-1 pt-4 mt-4 text-center shrink-0 flex items-center justify-between z-10">
              <span className="text-[10px] font-black uppercase text-text-light/40 tracking-wider">
                আল-মাদানী স্টুডেন্ট পোর্টাল
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-black text-text-light/55">
                  আজকের সক্রিয় জামাত তালিকা
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dynamic Class Manager Modal */}
      {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="bg-card w-full max-w-4xl rounded-[2rem] border border-border-main shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] font-hind-siliguri text-left"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border-main/50 flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Layers size={22} className="stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-text-main leading-none">
                    জামাত/শ্রেণী ও বিভাগ ব্যবস্থাপনা
                  </h3>
                  <p className="text-[10px] sm:text-xs text-text-light/50 font-bold mt-1.5">
                    চলমান শিক্ষাবর্ষের সকল জামাত বা শ্রেণী পরিবর্তন, সংযোজন ও বিয়োজন করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsClassModalOpen(false);
                  setEditingClass(null);
                  setClassFormData({ name: "", departmentId: "3", equivalent: "", isActive: true });
                }}
                className="p-2.5 text-text-light/60 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-2xl transition-all cursor-pointer active:scale-95 border border-border-main/40"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30 dark:bg-slate-900/10">
              
              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-3 gap-3">
                {/* Total classes */}
                <div className="bg-card border border-border-main/50 rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Layers size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] sm:text-[10px] font-bold text-text-light/50 uppercase leading-none truncate">মোট জামাত</span>
                    <span className="block text-sm sm:text-lg font-black text-text-main mt-0.5 leading-none">
                      {enToBnNumber(classes.length.toString())}টি
                    </span>
                  </div>
                </div>

                {/* Active classes */}
                <div className="bg-card border border-border-main/50 rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] sm:text-[10px] font-bold text-text-light/50 uppercase leading-none truncate">সক্রিয় জামাত</span>
                    <span className="block text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 leading-none">
                      {enToBnNumber(classes.filter(c => c.isActive).length.toString())}টি
                    </span>
                  </div>
                </div>

                {/* Inactive classes */}
                <div className="bg-card border border-border-main/50 rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertCircle size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] sm:text-[10px] font-bold text-text-light/50 uppercase leading-none truncate">নিষ্ক্রিয় জামাত</span>
                    <span className="block text-sm sm:text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5 leading-none">
                      {enToBnNumber(classes.filter(c => !c.isActive).length.toString())}টি
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 ${editingClass ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 shadow-md' : 'bg-card border-border-main/55 shadow-sm'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h4 className="text-xs sm:text-sm font-black text-text-main uppercase tracking-wider flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${editingClass ? 'bg-amber-500 animate-pulse' : 'bg-primary'}`}></span>
                    {editingClass ? `জামাত সম্পাদন: "${editingClass.name}"` : "নতুন জামাত বা শ্রেণী যুক্ত করুন"}
                  </h4>
                  {editingClass && (
                    <span className="text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full uppercase">
                      সম্পাদনা মোড সক্রিয়
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveClassSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Name Input */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-black text-text-light/60 uppercase mb-1.5">
                        জামাত/শ্রেণীর নাম <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={classFormData.name}
                        onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                        placeholder="যেমন: ইবতেদায়ি রাবে (৪র্থ শ্রেণী)"
                        className="w-full text-xs sm:text-sm bg-bg border border-border-main px-3.5 py-3 rounded-2xl text-text-main outline-none font-bold focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-light/35"
                      />
                    </div>

                    {/* Department Select */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-black text-text-light/60 uppercase mb-1.5">
                        মাদ্রাসা বিভাগ <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={classFormData.departmentId}
                        onChange={(e) => setClassFormData({ ...classFormData, departmentId: e.target.value })}
                        className="w-full text-xs sm:text-sm bg-bg border border-border-main px-3.5 py-3 rounded-2xl text-text-main outline-none font-bold cursor-pointer focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all"
                      >
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Equivalent Input */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-black text-text-light/60 uppercase mb-1.5">
                        সমমান / সাধারণ শ্রেণী
                      </label>
                      <input
                        type="text"
                        value={classFormData.equivalent}
                        onChange={(e) => setClassFormData({ ...classFormData, equivalent: e.target.value })}
                        placeholder="যেমন: ৪র্থ শ্রেণী"
                        className="w-full text-xs sm:text-sm bg-bg border border-border-main px-3.5 py-3 rounded-2xl text-text-main outline-none font-bold focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-light/35"
                      />
                    </div>
                  </div>

                  {/* Preset Helper Tags */}
                  {!editingClass && (
                    <div className="pt-1">
                      <span className="text-[10px] font-black text-text-light/45 block mb-1.5 uppercase">কুইক ফর্ম প্রিসেট (ট্যাপ করুন):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: "নূরানী আউয়াল (১ম)", deptId: "1", eq: "১ম শ্রেণী" },
                          { name: "হিফজুল কুরআন বিভাগ", deptId: "1", eq: "হিফজ" },
                          { name: "মিযান (মুতাওয়াসসিতাহ আওয়াল)", deptId: "3", eq: "নিম্ন মাধ্যমিক - ষষ্ঠ শ্রেণী" },
                          { name: "দাওরায়ে হাদিস (তাকমিল)", deptId: "3", eq: "স্নাতকোত্তর সমমান" }
                        ].map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setClassFormData({ name: preset.name, departmentId: preset.deptId, equivalent: preset.eq, isActive: true })}
                            className="text-[10px] font-black px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-light hover:text-text-main border border-border-main/50 rounded-xl transition-all cursor-pointer"
                          >
                            + {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-border-main/30">
                    {/* Active Status */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={classFormData.isActive}
                          onChange={(e) => setClassFormData({ ...classFormData, isActive: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-10 h-5.5 rounded-full transition-colors duration-300 ${classFormData.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-4.5 h-4.5 rounded-full shadow-md transition-transform duration-300 ${classFormData.isActive ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-text-main group-hover:text-primary transition-colors">
                        জামাতটি ডিফল্ট সক্রিয় রাখুন
                      </span>
                    </label>

                    <div className="flex gap-2">
                      {editingClass && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClass(null);
                            setClassFormData({ name: "", departmentId: "3", equivalent: "", isActive: true });
                          }}
                          className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-text-main font-black text-xs sm:text-sm rounded-2xl transition-all cursor-pointer active:scale-95"
                        >
                          বাতিল
                        </button>
                      )}
                      <button
                        type="submit"
                        className={`px-5 py-2.5 text-white font-black text-xs sm:text-sm rounded-2xl transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer ${editingClass ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' : 'bg-primary hover:bg-primary-hover shadow-primary/10'}`}
                      >
                        <Save size={15} />
                        {editingClass ? "হালনাগাদ করুন" : "যুক্ত করুন"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Filtering Controls */}
              <div className="bg-card border border-border-main/50 rounded-3xl p-4 shadow-sm space-y-3.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search bar */}
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light/50 stroke-[2.2]" />
                    <input
                      type="text"
                      value={classModalSearch}
                      onChange={(e) => setClassModalSearch(e.target.value)}
                      placeholder="জামাতের নাম বা সমমান শ্রেণী লিখে খুঁজুন..."
                      className="w-full text-xs bg-bg border border-border-main pl-10 pr-4 py-2.5 rounded-2xl text-text-main font-bold outline-none focus:border-primary/60 transition-colors placeholder:text-text-light/40"
                    />
                    {classModalSearch && (
                      <button
                        onClick={() => setClassModalSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light/50 hover:text-text-main text-[10px] font-black cursor-pointer bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded"
                      >
                        মুছুন
                      </button>
                    )}
                  </div>

                  {/* Dropdown Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-bg px-2.5 py-1.5 rounded-2xl border border-border-main/70">
                      <SlidersHorizontal size={12} className="text-text-light/60 shrink-0" />
                      <select
                        value={classModalDeptFilter}
                        onChange={(e) => setClassModalDeptFilter(e.target.value)}
                        className="text-[11px] font-black bg-transparent border-none text-text-main outline-none cursor-pointer p-0"
                      >
                        <option value="all">সকল বিভাগ</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1 bg-bg px-2.5 py-1.5 rounded-2xl border border-border-main/70">
                      <span className="text-[10px] font-bold text-text-light/50">অবস্থা:</span>
                      <select
                        value={classModalStatusFilter}
                        onChange={(e) => setClassModalStatusFilter(e.target.value)}
                        className="text-[11px] font-black bg-transparent border-none text-text-main outline-none cursor-pointer p-0"
                      >
                        <option value="all">সকল অবস্থা</option>
                        <option value="active">শুধুমাত্র সক্রিয়</option>
                        <option value="inactive">শুধুমাত্র নিষ্ক্রিয়</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Class List Table & Card List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-text-main uppercase tracking-wider">
                    জামাত তালিকা ({enToBnNumber(classes.filter(cls => {
                      const matchesSearch = cls.name.toLowerCase().includes(classModalSearch.toLowerCase()) || 
                                            (cls.equivalent && cls.equivalent.toLowerCase().includes(classModalSearch.toLowerCase()));
                      const matchesDept = classModalDeptFilter === "all" || cls.departmentId === classModalDeptFilter;
                      const matchesStatus = classModalStatusFilter === "all" || 
                                            (classModalStatusFilter === "active" && cls.isActive) || 
                                            (classModalStatusFilter === "inactive" && !cls.isActive);
                      return matchesSearch && matchesDept && matchesStatus;
                    }).length.toString())} টি জামাত পাওয়া গেছে)
                  </h4>
                  {(classModalSearch || classModalDeptFilter !== "all" || classModalStatusFilter !== "all") && (
                    <button
                      onClick={() => {
                        setClassModalSearch("");
                        setClassModalDeptFilter("all");
                        setClassModalStatusFilter("all");
                      }}
                      className="text-[10px] font-black text-rose-600 hover:text-rose-500 cursor-pointer"
                    >
                      ফিল্টার রিসেট
                    </button>
                  )}
                </div>

                {/* Desktop View (Table Layout) */}
                <div className="hidden md:block border border-border-main/50 rounded-2xl overflow-hidden bg-card shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-white border-b border-border-main/55">
                        <th className="p-3.5 text-[10px] font-black uppercase text-white/95">জামাত/শ্রেণী</th>
                        <th className="p-3.5 text-[10px] font-black uppercase text-white/95">মাদ্রাসা বিভাগ</th>
                        <th className="p-3.5 text-[10px] font-black uppercase text-white/95">সমমান</th>
                        <th className="p-3.5 text-[10px] font-black uppercase text-white/95 text-center">সক্রিয় করুন</th>
                        <th className="p-3.5 text-[10px] font-black uppercase text-white/95 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main/40">
                      {classes.filter(cls => {
                        const matchesSearch = cls.name.toLowerCase().includes(classModalSearch.toLowerCase()) || 
                                              (cls.equivalent && cls.equivalent.toLowerCase().includes(classModalSearch.toLowerCase()));
                        const matchesDept = classModalDeptFilter === "all" || cls.departmentId === classModalDeptFilter;
                        const matchesStatus = classModalStatusFilter === "all" || 
                                              (classModalStatusFilter === "active" && cls.isActive) || 
                                              (classModalStatusFilter === "inactive" && !cls.isActive);
                        return matchesSearch && matchesDept && matchesStatus;
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-xs font-bold text-text-light/50">
                            কোন জামাত খুঁজে পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        classes.filter(cls => {
                          const matchesSearch = cls.name.toLowerCase().includes(classModalSearch.toLowerCase()) || 
                                                (cls.equivalent && cls.equivalent.toLowerCase().includes(classModalSearch.toLowerCase()));
                          const matchesDept = classModalDeptFilter === "all" || cls.departmentId === classModalDeptFilter;
                          const matchesStatus = classModalStatusFilter === "all" || 
                                                (classModalStatusFilter === "active" && cls.isActive) || 
                                                (classModalStatusFilter === "inactive" && !cls.isActive);
                          return matchesSearch && matchesDept && matchesStatus;
                        }).map((cls) => {
                          const dept = departments.find((d) => d.id === cls.departmentId);
                          return (
                            <tr key={cls.id} className="even:bg-primary/[0.02] hover:bg-primary/[0.06] transition-colors">
                              <td className="p-3.5 text-xs font-black text-text-main font-hind-siliguri">
                                <div className="flex items-center gap-2">
                                  <span>{cls.name}</span>
                                  {cls.isActive ? (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                  ) : (
                                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3.5 text-xs font-bold text-text-light/70">{dept ? dept.name : getDepartmentForClass(cls.name, departments, classes)}</td>
                              <td className="p-3.5 text-xs font-bold text-text-light/70">{cls.equivalent || "—"}</td>
                              <td className="p-3.5 text-xs text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleClassStatus(cls.id)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[10px] font-black cursor-pointer active:scale-95 select-none ${cls.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'}`}
                                >
                                  {cls.isActive ? (
                                    <>
                                      <CheckCircle2 size={11} className="stroke-[2.5]" />
                                      সক্রিয়
                                    </>
                                  ) : (
                                    <>
                                      <PowerOff size={11} className="stroke-[2.5]" />
                                      নিষ্ক্রিয়
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="p-3.5 text-xs text-right">
                                <div className="flex justify-end gap-1">
                                  <button
                                    onClick={() => handleEditClassClick(cls)}
                                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                                    title="সম্পাদনা"
                                  >
                                    <Edit3 size={14} className="stroke-[2.2]" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClass(cls.id)}
                                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                                    title="বাদ দিন"
                                  >
                                    <Trash2 size={14} className="stroke-[2.2]" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Touch-Friendly Card View (Layout for small screens) */}
                <div className="block md:hidden space-y-3">
                  {classes.filter(cls => {
                    const matchesSearch = cls.name.toLowerCase().includes(classModalSearch.toLowerCase()) || 
                                          (cls.equivalent && cls.equivalent.toLowerCase().includes(classModalSearch.toLowerCase()));
                    const matchesDept = classModalDeptFilter === "all" || cls.departmentId === classModalDeptFilter;
                    const matchesStatus = classModalStatusFilter === "all" || 
                                          (classModalStatusFilter === "active" && cls.isActive) || 
                                          (classModalStatusFilter === "inactive" && !cls.isActive);
                    return matchesSearch && matchesDept && matchesStatus;
                  }).length === 0 ? (
                    <div className="p-8 text-center text-xs font-bold text-text-light/50 bg-card border border-border-main/50 rounded-2xl">
                      কোন জামাত খুঁজে পাওয়া যায়নি।
                    </div>
                  ) : (
                    classes.filter(cls => {
                      const matchesSearch = cls.name.toLowerCase().includes(classModalSearch.toLowerCase()) || 
                                            (cls.equivalent && cls.equivalent.toLowerCase().includes(classModalSearch.toLowerCase()));
                      const matchesDept = classModalDeptFilter === "all" || cls.departmentId === classModalDeptFilter;
                      const matchesStatus = classModalStatusFilter === "all" || 
                                            (classModalStatusFilter === "active" && cls.isActive) || 
                                            (classModalStatusFilter === "inactive" && !cls.isActive);
                      return matchesSearch && matchesDept && matchesStatus;
                    }).map((cls) => {
                      const dept = departments.find((d) => d.id === cls.departmentId);
                      return (
                        <div key={cls.id} className="bg-card border border-border-main/60 rounded-2xl p-4 shadow-sm space-y-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="text-xs sm:text-sm font-black text-text-main">{cls.name}</h5>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-text-light/80 px-2 py-0.5 rounded-md">
                                  {dept ? dept.name : getDepartmentForClass(cls.name, departments, classes)}
                                </span>
                                {cls.equivalent && (
                                  <span className="text-[9px] font-black bg-blue-500/5 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">
                                    সমমান: {cls.equivalent}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions Group */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleEditClassClick(cls)}
                                className="p-2.5 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer border border-border-main/40"
                                title="সম্পাদনা"
                              >
                                <Edit3 size={14} className="stroke-[2.2]" />
                              </button>
                              <button
                                onClick={() => handleDeleteClass(cls.id)}
                                className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer border border-border-main/40"
                                title="বাদ দিন"
                              >
                                <Trash2 size={14} className="stroke-[2.2]" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-border-main/30 bg-slate-50/50 dark:bg-slate-900/20 -mx-4 -mb-4 p-3.5 rounded-b-2xl">
                            <span className="text-[10px] font-black text-text-light/50 uppercase">সক্রিয় স্ট্যাটাস</span>
                            
                            <button
                              type="button"
                              onClick={() => handleToggleClassStatus(cls.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-[10px] font-black cursor-pointer active:scale-95 ${cls.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}
                            >
                              {cls.isActive ? (
                                <>
                                  <CheckCircle2 size={11} className="stroke-[2.5]" />
                                  সক্রিয় আছে
                                </>
                              ) : (
                                <>
                                  <PowerOff size={11} className="stroke-[2.5]" />
                                  নিষ্ক্রিয় আছে
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border-main/50 bg-slate-50 dark:bg-slate-900/40 text-right flex items-center justify-end gap-3">
              <span className="text-[10px] font-bold text-text-light/40 hidden sm:inline-block">দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা</span>
              <button
                onClick={() => {
                  setIsClassModalOpen(false);
                  setEditingClass(null);
                  setClassFormData({ name: "", departmentId: "1", equivalent: "", isActive: true });
                }}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-black text-xs sm:text-sm rounded-2xl transition-all active:scale-95 cursor-pointer shadow-md"
              >
                বন্ধ করুন
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
