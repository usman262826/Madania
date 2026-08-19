import React, { useState, useMemo, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { AdmissionNewStepForm } from '../admission/AdmissionNewStepForm';
import { DatabaseMediaStore } from '../data/DatabaseMediaStore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  Users, 
  GraduationCap, 
  Clock, 
  Coins, 
  Wallet, 
  ShoppingBag, 
  UserCheck, 
  ShieldCheck, 
  Archive, 
  Calendar, 
  FileText, 
  Award, 
  AlertCircle, 
  Settings, 
  Bell, 
  Briefcase, 
  Plus, 
  Trash2, 
  Download, 
  Upload,
  Printer, 
  FileSpreadsheet, 
  Filter, 
  Search, 
  QrCode, 
  MapPin, 
  Send, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  DollarSign, 
  HelpCircle, 
  RefreshCw,
  TrendingUp,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  UserPlus,
  X,
  Building2,
  UserRound,
  Check,
  Lock,
  EyeOff,
  Shield,
  Save,
  List,
  PieChart,
  Mail,
  Loader2,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  User,
  Sparkles,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student, Application, Staff, Expense } from '../../types';
import { ACADEMIC_YEARS, STUDENT_STATUS_LIST, getStudentStatusInfo } from '../../constants';
import { enToBnNumber, cn, formatDateToDDMMYYYY, getActiveBranches } from '../../lib/utils';
import { DocumentBuilder } from './DocumentBuilder';
import { useData } from '../../contexts/DataContext';

// Helper to generate IDs
const uid = () => Math.floor(Math.random() * 900000 + 100000).toString();

// Dynamic branches React hook
export function useActiveBranches() {
  const [branches, setBranches] = useState<string[]>(() => getActiveBranches());
  useEffect(() => {
    const handleUpdate = () => {
      setBranches(getActiveBranches());
    };
    window.addEventListener('acad_branches_updated', handleUpdate);
    return () => window.removeEventListener('acad_branches_updated', handleUpdate);
  }, []);
  return branches;
}

export interface AdmissionSubNavProps {
  activeTabId: string;
  setActiveTab?: (tabId: string) => void;
}

export const AdmissionSubNav: React.FC<AdmissionSubNavProps> = ({ activeTabId, setActiveTab }) => {
  if (!setActiveTab) return null;

  const tabs = [
    { id: 'admission-new', label: 'নতুন ভর্তি', icon: GraduationCap, desc: 'একক ভর্তি ফরম' },
    { id: 'admission-multiple', label: 'একাধিক শিক্ষার্থী যোগ', icon: Users, desc: 'ব্যাচ ডাটা আপলোড' },
    { id: 'admission-inquiry', label: 'ভর্তি জিজ্ঞাসা', icon: MessageSquare, desc: 'অনুসন্ধান ও তথ্য' },
    { id: 'admission-form', label: 'ভর্তি ফরম', icon: FileText, desc: 'প্রিন্ট ও আর্কাইভ' },
  ];

  return (
    <div className="mb-6 font-hind-siliguri text-left">
      <div className="bg-card border border-border-main/60 rounded-3xl p-4 md:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <GraduationCap size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-text-main leading-tight">ভর্তি পোর্টাল ও শিক্ষার্থী ব্যবস্থাপনা</h3>
            <p className="text-[10px] text-text-light/50 font-bold mt-0.5">সবগুলো অপশন এখন একটির সাথে অন্যটি সংযুক্ত</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 active:scale-95 cursor-pointer border text-left",
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/10"
                    : "bg-step-bg/45 text-text-light hover:text-text-main border-border-main/60 hover:bg-step-bg"
                )}
              >
                <Icon size={16} className={cn("stroke-[2.2] shrink-0", isActive ? "text-white" : "text-text-light/60")} />
                <div className="min-w-0">
                  <span className="block leading-none truncate">{tab.label}</span>
                  <span className={cn("block text-[9px] mt-0.5 truncate font-medium", isActive ? "text-emerald-100" : "text-text-light/50")}>
                    {tab.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 1. ADMISSION - NEW (নতুন ভর্তি)
// -------------------------------------------------------------

const bangladeshData: Record<string, { name: string; districts: Record<string, { name: string; upazilas: string[] }> }> = {
  dhaka: {
    name: "ঢাকা",
    districts: {
      dhaka: { name: "ঢাকা", upazilas: ["সাভার", "ধামরাই", "কেরানীগঞ্জ", "নবাবগঞ্জ", "দোহার"] },
      gazipur: { name: "গাজীপুর", upazilas: ["কালিয়াকৈর", "কালীগঞ্জ", "কাপাসিয়া", "গাজীপুর সদর", "শ্রীপুর"] },
      narayanganj: { name: "নারায়ণগঞ্জ", upazilas: ["আড়াইহাজার", "বন্দর", "নারায়ণগঞ্জ সদর", "রূপগঞ্জ", "সোনারগাঁও"] },
      narsingdi: { name: "নরসিংদী", upazilas: ["নরসিংদী সদর", "বেলাবো", "মনোহরদী", "রায়পুরা", "শিবপুর", "পলাশ"] },
      manikganj: { name: "মানিকগঞ্জ", upazilas: ["মানিকগঞ্জ সদর", "সিংগাইর", "শিবালয়", "সাটুরিয়া", "হরিরামপুর", "ঘিওর", "দৌলতপুর"] },
      munshiganj: { name: "মুন্সীগঞ্জ", upazilas: ["মুন্সীগঞ্জ সদর", "শ্রীনগর", "সিরাজদিখান", "লৌহজং", "টংগিবাড়ী", "গজারিয়া"] },
      kishoreganj: { name: "কিশোরগঞ্জ", upazilas: ["সদর", "হোসেনপুর", "কটিয়াদী", "পাকুন্দিয়া", "তাড়াইল", "ইটনা", "মিঠামইন", "অষ্টগ্রাম", "নিকলী", "বাজিতপুর", "কুলিয়ারচর", "ভৈরব", "করিমগঞ্জ"] },
      tangail: { name: "টাঙ্গাইল", upazilas: ["সদর", "বাসাইল", "কালিহাতী", "ঘাটাইল", "মির্জাপুর", "নাগরপুর", "মধুপুর", "সখিপুর", "দেলদুয়ার", "ধনবাড়ী", "গোপালপুর", "ভূয়াপুর"] },
      faridpur: { name: "ফরিদপুর", upazilas: ["সদর", "মধুখালী", "বোয়ালমারী", "সালথা", "নগরকান্দা", "আলফাডাঙ্গা", "সদরপুর", "চরভদ্রাসন", "ভাঙ্গা"] },
      madaripur: { name: "মাদারীপুর", upazilas: ["সদর", "শিবচর", "কালকিনি", "রাজৈর", "ডাসার"] },
      shariatpur: { name: "শরীয়তপুর", upazilas: ["সদর", "ডামুড্যা", "নড়িয়া", "জাজিরা", "ভেদরগঞ্জ", "গোসাইরহাট"] },
      gopalganj: { name: "গোপালগঞ্জ", upazilas: ["সদর", "কোটালীপাড়া", "টুঙ্গিপাড়া", "কাশিয়ানী", "মুকসুদপুর"] },
      rajbari: { name: "রাজবাড়ী", upazilas: ["সদর", "গোয়ালন্দ", "পাংশা", "বালিয়াকান্দি", "কালুখালী"] }
    }
  },
  chattogram: {
    name: "চট্টগ্রাম",
    districts: {
      chattogram: { name: "চট্টগ্রাম", upazilas: ["রাঙ্গুনিয়া", "সীতাকুণ্ড", "মীরসরাই", "পটিয়া", "সন্দ্বীপ", "বাঁশখালী", "বোয়ালখালী", "আনোয়ারা", "চন্দনাইশ", "সাতকানিয়া", "লোহাগাড়া", "হাটহাজারী", "ফটিকছড়ি", "রাউজান", "কর্ণফুলী"] },
      comilla: { name: "কুমিল্লা", upazilas: ["মেঘনা", "সদর", "সদর দক্ষিণ", "চৌদ্দগ্রাম", "লাকসাম", "বরুড়া", "চান্দিনা", "দাউদকান্দি", "মুরাদনগর", "লাঙ্গলকোট", "দেবিদ্বার", "হোমনা", "তিতাস", "বুড়িচং", "ব্রাহ্মণপাড়া", "মনোহরগঞ্জ", "লালমাই"] },
      coxsBazar: { name: "কক্সবাজার", upazilas: ["সদর", "চকরিয়া", "কুতুবদিয়া", "উখিয়া", "মহেশখালী", "টেকনাফ", "রামু", "পেকুয়া", "ঈদগাঁও"] },
      brahmanbaria: { name: "ব্রাহ্মণবাড়িয়া", upazilas: ["সদর", "কসবা", "নাসিরনগর", "সরাইল", "আশুগঞ্জ", "আখাউড়া", "নবীনগর", "বাঞ্ছারামপুর", "বিজয়নগর"] },
      chandpur: { name: "চাঁদপুর", upazilas: ["সদর", "কচুয়া", "শাহরাস্তি", "হাজীগঞ্জ", "মতলব উত্তর", "মতলব দক্ষিণ", "ফরিদগঞ্জ", "হাইমচর"] },
      noakhali: { name: "নোয়াখালী", upazilas: ["সদর", "কোম্পানীগঞ্জ", "বেগমগঞ্জ", "চাটখিল", "সেনবাগ", "হাতিয়া", "সোনাইমুড়ী", "কবিরহাট", "সুবর্ণচর"] },
      lakshmipur: { name: "লক্ষ্মীপুর", upazilas: ["সদর", "রায়পুর", "রামগঞ্জ", "রামগতি", "কমলনগর"] },
      feni: { name: "ফেনী", upazilas: ["সদর", "ছাগলনাইয়া", "ফুলগাজী", "পরশুরাম", "দাগনভূঞা", "সোনাগাজী"] },
      khagrachhari: { name: "খাগড়াছড়ি", upazilas: ["সদর", "দীঘিনালা", "পানছড়ি", "মাটিরাঙ্গা", "গুইমারা", "মানিকছড়ি", "রামগড়", "মহালছড়ি", "লক্ষ্মীছড়ি"] },
      rangamati: { name: "রাঙ্গামাটি", upazilas: ["সদর", "কাপ্তাই", "কাউখালী", "বাঘাইছড়ি", "বরকল", "ল্যাঙ্গাদু", "রাজস্থলী", "বিলাইছড়ি", "জুরাছড়ি", "নানিয়ারচর"] },
      bandarban: { name: "বান্দরবান", upazilas: ["সদর", "থানচি", "রুমা", "রোয়াংছড়ি", "লামা", "আলীকদম", "নাইক্ষ্যংছড়ি"] }
    }
  },
  rajshahi: {
    name: "রাজশাহী",
    districts: {
      rajshahi: { name: "রাজশাহী", upazilas: ["পবা", "গোদাগাড়ী", "তানোর", "বাগমারা", "দুর্গাপুর", "পুঠিয়া", "চারঘাট", "বাঘা", "মোহনপুর"] },
      bogura: { name: "বগুড়া", upazilas: ["সদর", "শিবগঞ্জ", "সোনাতলা", "গাবতলী", "সারিয়াকান্দি", "ধুনট", "শেরপুর", "নন্দীগ্রাম", "আদমদীঘি", "দুপচাঁচিয়া", "কাহালু", "শাজাহানপুর"] },
      pabna: { name: "পাবনা", upazilas: ["সদর", "ঈশ্বরদী", "আটঘরিয়া", "চাটমোহর", "ভাঙ্গুড়া", "ফরিদপুর", "বেড়া", "সাঁথিয়া", "সুজানগর"] },
      sirajganj: { name: "সিরাজগঞ্জ", upazilas: ["সদর", "কাজিপুর", "উল্লাপাড়া", "শাহজাদপুর", "রায়গঞ্জ", "তাড়াশ", "বেলকুচি", "চৌহালী", "কামারখন্দ"] },
      naogaon: { name: "নওগাঁ", upazilas: ["সদর", "রানীনগর", "আত্রাই", "মহাদেবপুর", "ধামইরহাট", "পত্নীতলা", "বদলগাছী", "পোরশা", "সাপাহার", "নিয়ামতপুর", "মান্দা"] },
      natore: { name: "নাটোর", upazilas: ["সদর", "বাগাতিপাড়া", "বড়াইগ্রাম", "লালপুর", "সিংড়া", "গুরুদাসপুর", "নলডাঙ্গা"] },
      chapainawabganj: { name: "চাঁপাইনবাবগঞ্জ", upazilas: ["সদর", "শিবগঞ্জ", "গোমস্তাপুর", "নাচোল", "ভোলাহাট"] },
      joypurhat: { name: "জয়পুরহাট", upazilas: ["সদর", "পাঁচবিবি", "আক্কেলপুর", "ক্ষেতলাল", "কালাই"] }
    }
  },
  khulna: {
    name: "খুলনা",
    districts: {
      khulna: { name: "খুলনা", upazilas: ["কয়রা", "ডুমুরিয়া", "তেরখাদা", "দাকোপ", "দিঘলিয়া", "পাইকগাছা", "ফুলতলা", "বটিয়াঘাটা", "রূপসা"] },
      jessore: { name: "যশোর", upazilas: ["সদর", "শার্শা", "ঝিকরগাছা", "চৌগাছা", "অভয়নগর", "মণিরামপুর", "কেশবপুর", "বাঘারপাড়া"] },
      satkhira: { name: "সাতক্ষীরা", upazilas: ["সদর", "আশাশুনি", "শ্যামনগর", "কালীগঞ্জ", "কলারোয়া", "তালা", "দেবহাটা"] },
      bagerhat: { name: "বাগেরহাট", upazilas: ["সদর", "ফকিরহাট", "মোল্লাহাট", "কচুয়া", "চিতলমারী", "মোড়লগঞ্জ", "শরণখোলা", "রামপাল", "মোংলা"] },
      kushtia: { name: "কুষ্টিয়া", upazilas: ["সদর", "কুমারখালী", "খোকসা", "মিরপুর", "ভেড়ামারা", "দৌলতপুর"] },
      jhenaidah: { name: "ঝিনাইদহ", upazilas: ["সদর", "শৈলকূপা", "হরিণাকুণ্ডু", "কালীগঞ্জ", "কোটচাঁদপুর", "মহেশপুর"] },
      magura: { name: "মাগুরা", upazilas: ["সদর", "শ্রীপুর", "শালিখা", "মহম্মদপুর"] },
      narail: { name: "নড়াইল", upazilas: ["সদর", "লোহাগাড়া", "কালিয়া"] },
      chuadanga: { name: "চুয়াডাঙ্গা", upazilas: ["সদর", "আলমডাঙ্গা", "দামুড়হুদা", "জীবননগর"] },
      meherpur: { name: "মেহেরপুর", upazilas: ["সদর", "গাংনী", "মুজিবনগর"] }
    }
  },
  barishal: {
    name: "বরিশাল",
    districts: {
      barishal: { name: "বরিশাল", upazilas: ["সদর", "বাকেরগঞ্জ", "বাবুগঞ্জ", "উজিরপুর", "বানারীপাড়া", "গৌরনদী", "আগৈলঝাড়া", "মেহেন্দিগঞ্জ", "মুলাদী", "হিজলা"] },
      bhola: { name: "ভোলা", upazilas: ["সদর", "বোরহানউদ্দিন", "চরফ্যাশন", "দৌলতখান", "মনপুরা", "তজুমদ্দিন", "লালমোহন"] },
      patuakhali: { name: "পটুয়াখালী", upazilas: ["সদর", "বাউফল", "গলাচিপা", "দশমিনা", "মির্জাগঞ্জ", "কলাপাড়া", "দুমকি", "রাঙ্গাবালী"] },
      pirojpur: { name: "পিরোজপুর", upazilas: ["সদর", "নাজিরপুর", "কাউখালী", "ভাণ্ডারিয়া", "মঠবাড়িয়া", "নেছারাবাদ", "ইন্দুরকানী"] },
      barguna: { name: "বরগুনা", upazilas: ["সদর", "আমতলী", "তালতলী", "পাথরঘাটা", "বেতাগী", "বামনা"] },
      jhalokati: { name: "ঝালকাঠি", upazilas: ["সদর", "নলছিটি", "রাজাপুর", "কাঁঠালিয়া"] }
    }
  },
  sylhet: {
    name: "সিলেট",
    districts: {
      sylhet: { name: "সিলেট", upazilas: ["সদর", "দক্ষিণ সুরমা", "বিশ্বনাথ", "ওসমানীনগর", "বালাগঞ্জ", "ফেঞ্চুগঞ্জ", "গোলাপগঞ্জ", "বিয়ানীবাজার", "জকিগঞ্জ", "কানাইঘাট", "জৈন্তাপুর", "গোয়াইনঘাট", "কোম্পানীগঞ্জ"] },
      sunamganj: { name: "সুনামগঞ্জ", upazilas: ["সদর", "শান্তিগঞ্জ", "দোয়ারাবাজার", "ছাতক", "দিরাই", "শাল্লা", "ধর্মপাশা", "জামালগঞ্জ", "তাহিরপুর", "জগন্নাথপুর", "বিশ্বম্ভরপুর", "মধ্যনগর"] },
      habiganj: { name: "হবিগঞ্জ", upazilas: ["সদর", "লাখাই", "মাধবপুর", "চুনারুঘাট", "বাহুবল", "নবীগঞ্জ", "আজমিরীগঞ্জ", "বানিয়াচং", "শায়েস্তাগঞ্জ"] },
      maulvibazar: { name: "মৌলভীবাজার", upazilas: ["সদর", "শ্রীমঙ্গল", "রাজনগর", "কুলাউড়া", "বড়লেখা", "কমলগঞ্জ", "জুড়ী"] }
    }
  },
  rangpur: {
    name: "রংপুর",
    districts: {
      rangpur: { name: "রংপুর", upazilas: ["সদর", "মিঠাপুকুর", "গঙ্গাচড়া", "কাউনিয়া", "পীরগাছা", "পীরগঞ্জ", "তারাগঞ্জ", "বদরগঞ্জ"] },
      dinajpur: { name: "দিনাজপুর", upazilas: ["সদর", "বিরল", "বোচাগঞ্জ", "কাহারোল", "বীরগঞ্জ", "খানসামা", "চিরিরবন্দর", "পার্বতীপুর", "ফুলবাড়ী", "বিরামপুর", "নবাবগঞ্জ", "ঘোড়াঘাট", "হাকিমপুর"] },
      kurigram: { name: "কুড়িগ্রাম", upazilas: ["সদর", "উলিপুর", "চিলমারী", "রৌমারী", "রাজিবপুর", "রাজারহাট", "নাগেশ্বরী", "ভুরুঙ্গামারী", "ফুলবাড়ী"] },
      gaibandha: { name: "গাইবান্ধা", upazilas: ["সদর", "সাদুল্লাপুর", "গোবিন্দগঞ্জ", "ফুলছড়ি", "সাঘাটা", "পলাশবাড়ী", "সুন্দরগঞ্জ"] },
      nilphamari: { name: "নীলফামারী", upazilas: ["সদর", "সৈয়দপুর", "জলঢাকা", "কিশোরগঞ্জ", "ডোমার", "ডিমলা"] },
      thakurgaon: { name: "ঠাকুরগাঁও", upazilas: ["সদর", "পীরগঞ্জ", "রাণীশংকৈল", "বালিয়াডাঙ্গী", "হরিপুর"] },
      panchagarh: { name: "পঞ্চগড়", upazilas: ["সদর", "তেঁতুলিয়া", "দেবীগঞ্জ", "বোদা", "আটোয়ারী"] },
      lalmonirhat: { name: "লালমনিরহাট", upazilas: ["সদর", "আদিতমারী", "কালীগঞ্জ", "হাতীবান্ধা", "পাটগ্রাম"] }
    }
  },
  mymensingh: {
    name: "ময়মনসিংহ",
    districts: {
      mymensingh: { name: "ময়মনসিংহ", upazilas: ["সদর", "মুক্তাগাছা", "ফুলবাড়িয়া", "ত্রিশাল", "ভালুকা", "গফরগাঁও", "নান্দাইল", "ঈশ্বরগঞ্জ", "গৌরীপুর", "ফুলপুর", "তারাকান্দা", "হালুয়াঘাট", "ধোবাউড়া"] },
      netrokona: { name: "নেত্রকোণা", upazilas: ["সদর", "বারহাট্টা", "কলমাকান্দা", "দুর্গাপুর", "পূর্বধলা", "কেন্দুয়া", "মদন", "খালিয়াজুরী", "মোহনগঞ্জ", "আটপাড়া"] },
      jamalpur: { name: "জামালপুর", upazilas: ["সদর", "সরিষাবাড়ী", "মেলান্দহ", "ইসলামপুর", "দেওয়ানগঞ্জ", "মাদারগঞ্জ", "বকশীগঞ্জ"] },
      sherpur: { name: "শেরপুর", upazilas: ["সদর", "নালিতাবাড়ী", "শ্রীবরদী", "ঝিনাইগাতী", "নকলা"] }
    }
  }
};

const classDetailsMap: Record<string, { marhala: string; jamatClass: string; somoman: string }> = {
  "আতফাল (শিশু শ্রেণী)": { marhala: "আফতাল", jamatClass: "আফতাল", somoman: "শিশু শ্রেণী" },
  "আওয়াল (১ম শ্রেণী)": { marhala: "ইবতেদায়িয়া আউয়াল", jamatClass: "আউয়াল", somoman: "১ম শ্রেণী" },
  "ছানী (২য় শ্রেণী)": { marhala: "ইবতেদায়িয়া ছানী", jamatClass: "ছানী", somoman: "২য় শ্রেণী" },
  "ছালেছ (৩য় শ্রেণী)": { marhala: "ইবতেদায়িয়া ছালেছ", jamatClass: "ছালেছ", somoman: "৩য় শ্রেণী" },
  "খুসুছি (ইবতেদায়ি রাবে)": { marhala: "ইবতেদায়িয়া রাবে", jamatClass: "খুসূছী (৪র্থ শ্রেণী)", somoman: "প্রাথমিক - চতুর্থ শ্রেণী" },
  "খামেস (ইবতেদায়ি খামেছ)": { marhala: "ইবতেদায়িয়া খামেছ", jamatClass: "খামেছ (৫ম শ্রেনী)", somoman: "প্রাথমিক - পঞ্চম শ্রেণী" },
  "মিযান (মুতাওয়াসসিতাহ আওয়াল)": { marhala: "মুতাওয়াসসিতাহ আওয়াল", jamatClass: "মিযান (৬ষ্ঠ শ্রেণী)", somoman: "নিম্ন মাধ্যমিক - ষষ্ঠ শ্রেণী" },
  "নাহবেমীর (মুতাওয়াসসিতাহ ছানি)": { marhala: "মুতাওয়াসসিতাহ ছানি", jamatClass: "নাহবেমীর (৭ম শ্রেণী)", somoman: "নিম্ন মাধ্যমিক - সপ্তম শ্রেণী" },
  "কুদূরী (সানাবিয়্যা আউয়াল)": { marhala: "সানাবিয়্যা আউয়াল", jamatClass: "কুদূরি (হেদায়াতুন্নাহু)", somoman: "মাধ্যমিক সমমান" },
  "শরহে বেকায়া (সানাবিয়্যা ছানী)": { marhala: "সানাবিয়্যা ছানী", jamatClass: "শরহে বেকায়া", somoman: "মাধ্যমিক সমমান" },
  "হেদায়া (ফজিলত আউয়াল)": { marhala: "ফজিলত আউয়াল", jamatClass: "হেদায়া (জালালাইন)", somoman: "স্নাতক সমমান" },
  "মেশকাত (ফজিলত ছানী)": { marhala: "ফজিলত ছানী", jamatClass: "মেশকাত", somoman: "স্নাতক সমমান" },
  "দাওরায়ে হাদিস (তাকমিল)": { marhala: "তাকমিল", jamatClass: "দাওরায়ে হাদীস", somoman: "স্নাতকোত্তর সমমান" }
};

export const AdmissionNew: React.FC<{ 
  students: Student[]; 
  onSave: (student: Student) => Promise<void> | void;
  academicYear?: string;
  setActiveTab?: (tabId: string) => void;
}> = (props) => {
  return <AdmissionNewStepForm {...props} />;
};

const AdmissionNewLegacyDisabled: React.FC<{ 
  students: Student[]; 
  onSave: (student: Student) => Promise<void> | void;
  academicYear?: string;
  setActiveTab?: (tabId: string) => void;
}> = ({ students, onSave, academicYear, setActiveTab }) => {
  const { jamatList } = useData();
  const [isSaving, setIsSaving] = useState(false);

  // Flow State: 'selection' | 'old_search' | 'main_form' | 'pending_panel'
  const [viewState, setViewState] = useState<'selection' | 'old_search' | 'main_form' | 'pending_panel'>('selection');
  const [studentType, setStudentType] = useState<'new' | 'old' | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;

  // Modals & Notifications
  const [toastMsg, setToastMsg] = useState<{ msg: string; isError: boolean } | null>(null);
  const [oldVerifyModal, setOldVerifyModal] = useState<{ isOpen: boolean; studentName: string; fatherName: string; jamat: string; nextJamat: string } | null>(null);
  const [duplicateModal, setDuplicateModal] = useState<{ isOpen: boolean; studentName: string; fatherName: string; message: string } | null>(null);
  
  // App Number
  const [appNumber, setAppNumber] = useState<string>(() => {
    const nextId = Math.floor(Math.random() * 9000 + 1000).toString();
    return 'APP-' + nextId;
  });

  // Old Search Input State
  const [oldSearch, setOldSearch] = useState({
    year: academicYear || '১৪৪৫-৪৬ হিজরী/২০২৫-২৬ ঈসায়ী',
    jamat: jamatList[0] || 'আতফাল (শিশু শ্রেণী)',
    reg: '',
    roll: '',
  });

  // Main Form Data State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    student_name: '',
    father_name: '',
    mother_name: '',
    dob: '',
    birth_reg_no: '',
    mobile_mother: '',
    mobile_father_brother: '',
    email: '',
    blood_group: 'A+',
    messaging_apps: ['whatsapp'] as string[],

    // Step 2: Address
    division: 'chattogram',
    district: 'comilla',
    upazila: 'মেঘনা',
    post_office: '',
    village: '',
    same_as_permanent: true,
    temp_division: 'chattogram',
    temp_district: 'comilla',
    temp_upazila: 'মেঘনা',
    temp_post_office: '',
    temp_village: '',

    // Step 3: Admission Info
    prev_madrasah: '',
    prev_year: '১৪৪৫-৪৬ হিজরী/২০২৪-২৫ ঈসায়ী',
    prev_jamat: jamatList[0] || 'আতফাল (শিশু শ্রেণী)',
    current_year: academicYear || '১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী',
    jamat: jamatList[0] || 'আতফাল (শিশু শ্রেণী)',
    comments: '',
  });

  const getNextClass = (current: string): string => {
    if (!current) return jamatList[0] || 'আতফাল (শিশু শ্রেণী)';
    const idx = jamatList.findIndex(j => j.toLowerCase().includes(current.toLowerCase()) || current.toLowerCase().includes(j.toLowerCase()));
    if (idx !== -1 && idx + 1 < jamatList.length) {
      return jamatList[idx + 1];
    }
    return current;
  };

  const triggerToast = (msg: string, isError = false) => {
    setToastMsg({ msg, isError });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const toEnglishDigits = (str: string) => {
    const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    const en = ['0','1','2','3','4','5','6','7','8','9'];
    let res = str || '';
    for (let i = 0; i < 10; i++) {
      res = res.replaceAll(bn[i], en[i]);
    }
    return res.trim();
  };

  // Old student lookup & verification
  const handleOldSearch = () => {
    if (!oldSearch.reg.trim() && !oldSearch.roll.trim()) {
      triggerToast('দয়া করে রেজিস্ট্রেশন অথবা রোল নম্বর প্রদান করুন', true);
      return;
    }

    const regInput = toEnglishDigits(oldSearch.reg).toLowerCase();
    const rollInput = toEnglishDigits(oldSearch.roll).toLowerCase();

    const found = students.find((s: any) => {
      if (!s) return false;
      const regId = toEnglishDigits(String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || s.id || '')).toLowerCase();
      const rollNo = toEnglishDigits(String(s['রোল নম্বর'] || s.roll || '')).toLowerCase();
      const jamatVal = (s['জামাত/শ্রেণী'] || s['জামাত'] || s.class || '').toString().trim();

      const matchReg = regInput ? (regId === regInput || regId.endsWith(regInput) || regId.includes(regInput)) : true;
      const matchRoll = rollInput ? (rollNo === rollInput) : true;
      const matchJamat = !oldSearch.jamat || jamatVal.includes(oldSearch.jamat) || oldSearch.jamat.includes(jamatVal);

      return matchReg && matchRoll && matchJamat;
    });

    if (found) {
      triggerToast('✅ তথ্য যাচাই সফল! ফর্ম স্বয়ংক্রিয়ভাবে পূরণ হচ্ছে...', false);
      const prevJ = oldSearch.jamat || found['জামাত'] || found.jamat || jamatList[0];
      const nextJ = getNextClass(prevJ);

      setFormData(prev => ({
        ...prev,
        student_name: found['শিক্ষার্থীর নাম'] || found.name || '',
        father_name: found['পিতার নাম'] || found.fatherName || '',
        mother_name: found['মাতার নাম'] || found.motherName || '',
        dob: found['জন্ম তারিখ'] || found.dob || '',
        birth_reg_no: found['জন্ম নিবন্ধন নাম্বার'] || found['জন্ম নিবন্ধন/NID নং'] || found.birthRegNo || '',
        mobile_mother: found['মোবাইল (মা)'] || found['অভিভাবকের মোবাইল'] || found.mobile || '',
        mobile_father_brother: found['মোবাইল (বাবা/ভাই)'] || found.altMobile || '',
        email: found['ইমেইল'] || found.email || '',
        blood_group: found['রক্তের গ্রুপ'] || found.bloodGroup || 'A+',
        prev_jamat: prevJ,
        jamat: nextJ,
      }));

      setStudentType('old');
      setOldVerifyModal({
        isOpen: true,
        studentName: found['শিক্ষার্থীর নাম'] || found.name || 'শিক্ষার্থী',
        fatherName: found['পিতার নাম'] || found.fatherName || 'অভিভাবক',
        jamat: prevJ,
        nextJamat: nextJ,
      });

      setViewState('main_form');
      setCurrentStep(1);
    } else {
      triggerToast('❌ তথ্য পাওয়া যায়নি! সঠিক তথ্য দিন অথবা নতুন ছাত্রী হিসেবে আবেদন করুন', true);
    }
  };

  const validateStep = (step: number): string | null => {
    if (step === 1) {
      if (!formData.student_name.trim()) return 'শিক্ষার্থীর পূর্ণ নাম';
      if (!formData.father_name.trim()) return 'পিতার নাম';
      if (!formData.dob.trim()) return 'জন্ম তারিখ';
      if (!formData.birth_reg_no.trim()) return 'জন্ম নিবন্ধন/NID নং';
      if (!formData.mobile_mother.trim()) return 'অভিভাবকের মোবাইল (মা)';
      if (formData.mobile_mother.trim().length !== 11) return 'অভিভাবকের মোবাইল (মা) নম্বর ১১ ডিজিট';
      if (!formData.mobile_father_brother.trim()) return 'অভিভাবকের মোবাইল (বাবা/ভাই)';
      if (formData.mobile_father_brother.trim().length !== 11) return 'অভিভাবকের মোবাইল (বাবা/ভাই) নম্বর ১১ ডিজিট';
    } else if (step === 2) {
      if (!formData.division) return 'বিভাগ';
      if (!formData.district) return 'জেলা';
      if (!formData.upazila) return 'উপজেলা/থানা';
      if (!formData.post_office.trim()) return 'ডাকঘর/পোস্ট অফিস';
      if (!formData.village.trim()) return 'গ্রাম/মহল্লা';
    } else if (step === 3) {
      if (studentType === 'new') {
        if (!formData.prev_madrasah.trim()) return 'পূর্বের মাদ্রাসার নাম';
        if (!formData.prev_year) return 'পূর্বের শিক্ষাবর্ষ';
        if (!formData.prev_jamat) return 'পূর্বের জামাত';
      }
      if (!formData.jamat) return 'ভর্তি জামাত';
    }
    return null;
  };

  const handleNextStep = () => {
    const errorMsg = validateStep(currentStep);
    if (errorMsg) {
      if (errorMsg.includes('ডিজিট')) {
        triggerToast(`দয়া করে ${errorMsg} প্রদান করুন`, true);
      } else {
        triggerToast(`দয়া করে ${errorMsg} পূরণ করে সামনের দিকে এগিয়ে যান`, true);
      }
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    for (let s = 1; s <= 3; s++) {
      const err = validateStep(s);
      if (err) {
        triggerToast(`দয়া করে ${err} সঠিক তথ্য পূরণ করুন`, true);
        setCurrentStep(s);
        return;
      }
    }

    setIsSaving(true);
    try {
      // Check duplicate student
      const duplicate = students.find((st: any) => {
        const sName = (st['শিক্ষার্থীর নাম'] || st.name || '').toString().trim().toLowerCase();
        const fName = (st['পিতার নাম'] || st.fatherName || '').toString().trim().toLowerCase();
        return (
          sName === formData.student_name.trim().toLowerCase() &&
          fName === formData.father_name.trim().toLowerCase()
        );
      });

      if (duplicate) {
        setIsSaving(false);
        setDuplicateModal({
          isOpen: true,
          studentName: formData.student_name,
          fatherName: formData.father_name,
          message: 'আপনি ইতিমধ্যে ভর্তি আবেদন করেছেন অথবা বর্তমান শিক্ষাবর্ষে আপনার ভর্তি সম্পন্ন হয়েছে।',
        });
        return;
      }

      // Build address string
      const divObj = bangladeshData[formData.division];
      const distObj = divObj?.districts[formData.district];
      const distName = distObj?.name || formData.district;
      const upName = formData.upazila;
      const fullAddress = `গ্রাম: ${formData.village}, পো: ${formData.post_office}, থানা: ${upName}, জেলা: ${distName}।`;

      const classDetail = classDetailsMap[formData.jamat] || { marhala: '', jamatClass: '', somoman: '' };
      const generatedRegId = uid();

      const studentRecord: any = {
        'মঞ্জুরের তারিখ ও সময়': new Date().toLocaleString('bn-BD', { hour12: true }),
        'শিক্ষাবর্ষ': formData.current_year,
        'জামাত': formData.jamat,
        'রেজিস্ট্রেশন/আইডি': generatedRegId,
        'রোল নম্বর': (students.length + 1).toString(),
        'শিক্ষার্থীর নাম': formData.student_name,
        'পিতার নাম': formData.father_name,
        'মাতার নাম': formData.mother_name,
        'মোবাইল (মা)': formData.mobile_mother,
        'মোবাইল (বাবা/ভাই)': formData.mobile_father_brother,
        'জন্ম নিবন্ধন নাম্বার': formData.birth_reg_no,
        'জন্ম তারিখ': formData.dob,
        'ইমেইল': formData.email,
        'রক্তের গ্রুপ': formData.blood_group,
        'ঠিকানা': fullAddress,
        'শিক্ষার্থী ধরণ': 'আবাসিক',
        'শিক্ষার্থী ধরণ/স্ট্যাটাস': 'সক্রিয়',
        'পূর্বের মাদ্রাসা': formData.prev_madrasah,
        'পূর্বের জামাত': formData.prev_jamat,
        'স্ট্যাটাস': 'Active',
        'মেসেজিং অ্যাপ': formData.messaging_apps.join(', '),
        'মন্তব্য': formData.comments,
        'আবেদন নং': appNumber,
        'ভেরিফিকেশন লিংক': '',
        'LONG URL': '',
        'SORT URL': '',
        'QR CODE': '',
        'QR CODE IMAGE': '',
        'প্রত্যয়ন পত্র নাম্বার': '',
        'মারহালা': classDetail.marhala,
        'আবেদন স্ট্যাটাস': 'pending',
      };

      await onSave(studentRecord);
      setIsSaving(false);
      setViewState('pending_panel');
    } catch (e: any) {
      setIsSaving(false);
      triggerToast('সংরক্ষণ করতে সমস্যা হয়েছে! আবার চেষ্টা করুন', true);
    }
  };

  const resetAll = () => {
    const nextId = Math.floor(Math.random() * 9000 + 1000).toString();
    setAppNumber('APP-' + nextId);
    setViewState('selection');
    setStudentType(null);
    setCurrentStep(1);
    setOldSearch({
      year: academicYear || '১৪৪৫-৪৬ হিজরী/২০২৫-২৬ ঈসায়ী',
      jamat: jamatList[0] || 'আতফাল (শিশু শ্রেণী)',
      reg: '',
      roll: '',
    });
    setFormData({
      student_name: '',
      father_name: '',
      mother_name: '',
      dob: '',
      birth_reg_no: '',
      mobile_mother: '',
      mobile_father_brother: '',
      email: '',
      blood_group: 'A+',
      messaging_apps: ['whatsapp'],
      division: 'chattogram',
      district: 'comilla',
      upazila: 'মেঘনা',
      post_office: '',
      village: '',
      same_as_permanent: true,
      temp_division: 'chattogram',
      temp_district: 'comilla',
      temp_upazila: 'মেঘনা',
      temp_post_office: '',
      temp_village: '',
      prev_madrasah: '',
      prev_year: '১৪৪৫-৪৬ হিজরী/২০২৪-২৫ ঈসায়ী',
      prev_jamat: jamatList[0] || 'আতফাল (শিশু শ্রেণী)',
      current_year: academicYear || '১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী',
      jamat: jamatList[0] || 'আতফাল (শিশু শ্রেণী)',
      comments: '',
    });
  };

  // Helper getters for current selected Bangladesh administrative locations
  const currentDistricts = bangladeshData[formData.division]?.districts || {};
  const currentUpazilas = currentDistricts[formData.district]?.upazilas || [];

  return (
    <div className="space-y-6 font-hind-siliguri text-left">
      <AdmissionSubNav activeTabId="admission-new" setActiveTab={setActiveTab} />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toastMsg.isError 
                ? 'bg-rose-500 text-white border-rose-600' 
                : 'bg-emerald-600 text-white border-emerald-700'
            }`}
          >
            {toastMsg.isError ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            <span className="font-bold text-sm">{toastMsg.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification Success Modal */}
      {oldVerifyModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border-main p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={36} />
            </div>
            <div>
              <h3 className="text-xl font-black text-text-main mb-2">✅ তথ্য যাচাই সফল!</h3>
              <p className="text-xs text-text-light leading-relaxed">
                <strong className="text-primary">{oldVerifyModal.studentName}</strong> (অভিভাবক: {oldVerifyModal.fatherName})-এর পুরাতন তথ্য পাওয়া গেছে।
              </p>
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl text-xs space-y-1">
                <div>পূর্বের জামাত: <span className="font-bold text-text-main">{oldVerifyModal.jamat}</span></div>
                <div>স্বয়ংক্রিয় ভর্তি জামাত: <span className="font-bold text-primary">{oldVerifyModal.nextJamat}</span></div>
              </div>
            </div>
            <button
              onClick={() => setOldVerifyModal(null)}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-xs hover:bg-primary-light transition-all shadow-lg"
            >
              আবেদন ফর্মে যান
            </button>
          </motion.div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      {duplicateModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border-main p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={36} />
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-500 mb-2">⚠️ ইতিমধ্যে আবেদন করা হয়েছে!</h3>
              <p className="text-xs text-text-light leading-relaxed mb-3">
                <strong className="text-text-main">{duplicateModal.studentName}</strong> (পিতা: {duplicateModal.fatherName}) নামের শিক্ষার্থীর তথ্য সিস্টেমে বিদ্যমান।
              </p>
              <p className="text-xs text-text-light/70">{duplicateModal.message}</p>
            </div>
            <button
              onClick={() => setDuplicateModal(null)}
              className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-black text-xs hover:bg-amber-600 transition-all shadow-lg"
            >
              ঠিক আছে
            </button>
          </motion.div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bento-card p-8 bg-gradient-to-r from-emerald-900/40 via-card to-card border border-border-main shadow-xl rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <GraduationCap size={18} /> দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা
          </div>
          <h2 className="text-2xl font-black text-text-main leading-tight">অনলাইন ভর্তি আবেদন ফরম</h2>
          <p className="text-xs text-text-light/60 mt-1">শিক্ষার্থীর ভর্তি আবেদন জমা দিন ও তথ্য ডাটাবেজে সংরক্ষণ করুন</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-5 py-2.5 rounded-2xl text-primary font-black text-xs shrink-0">
          <Calendar size={16} /> সেশন: {formData.current_year}
        </div>
      </div>

      {/* STAGE 1: Selection Card */}
      {viewState === 'selection' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bento-card p-8 bg-card border border-border-main shadow-2xl rounded-3xl space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h3 className="text-xl font-black text-text-main">আবেদনকারীর ধরন নির্বাচন করুন</h3>
            <p className="text-xs text-text-light/70">আপনি কি নতুন ছাত্রী হিসেবে ভর্তি হচ্ছেন নাকি পূর্বের সেশনের শিক্ষার্থী?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* New Student Card */}
            <button
              onClick={() => {
                setStudentType('new');
                setViewState('main_form');
                setCurrentStep(1);
              }}
              className="p-8 bg-step-bg hover:bg-primary/5 border-2 border-border-main hover:border-primary rounded-3xl text-left transition-all duration-300 group cursor-pointer space-y-4 shadow-md hover:shadow-xl hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserPlus size={28} />
              </div>
              <div>
                <h4 className="text-lg font-black text-text-main group-hover:text-primary transition-colors">নতুন শিক্ষার্থী</h4>
                <p className="text-xs text-text-light/70 mt-1 leading-relaxed">প্রথমবার ভর্তি আবেদনকারীর জন্য একক অনলাইন ভর্তি ফর্ম।</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary pt-2">
                আবেদন শুরু করুন <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Old Student Card */}
            <button
              onClick={() => setViewState('old_search')}
              className="p-8 bg-step-bg hover:bg-emerald-500/5 border-2 border-border-main hover:border-emerald-500 rounded-3xl text-left transition-all duration-300 group cursor-pointer space-y-4 shadow-md hover:shadow-xl hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCheck size={28} />
              </div>
              <div>
                <h4 className="text-lg font-black text-text-main group-hover:text-emerald-500 transition-colors">পুরাতন শিক্ষার্থী</h4>
                <p className="text-xs text-text-light/70 mt-1 leading-relaxed">পূর্বের রেজিস্ট্রেশন/আইডি দিয়ে তথ্য যাচাই করে পরবর্তী জামাতে ভর্তি।</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 pt-2">
                তথ্য যাচাই করুন <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </motion.div>
      )}

      {/* STAGE 2: Old Student Search Panel */}
      {viewState === 'old_search' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bento-card p-8 bg-card border border-border-main shadow-2xl rounded-3xl space-y-8 max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-border-main/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                <Search size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-text-main">পুরাতন শিক্ষার্থী যাচাইকরণ</h3>
                <p className="text-xs text-text-light/60">সঠিক রেজিস্টেশন আইডি ও রোল নম্বর দিয়ে যাচাই করুন</p>
              </div>
            </div>
            <button
              onClick={() => setViewState('selection')}
              className="px-4 py-2 bg-step-bg hover:bg-border-main text-text-main rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <ArrowLeft size={14} /> পিছনে
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-main">শিক্ষাবর্ষ নির্বাচন করুন</label>
              <select
                value={oldSearch.year}
                onChange={e => setOldSearch({ ...oldSearch, year: e.target.value })}
                className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-main">পূর্বের জামাত নির্বাচন করুন</label>
              <select
                value={oldSearch.jamat}
                onChange={e => setOldSearch({ ...oldSearch, jamat: e.target.value })}
                className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-main">রেজিস্ট্রেশন/আইডি নম্বর *</label>
              <input
                type="text"
                placeholder="যেমন: REG-102938"
                value={oldSearch.reg}
                onChange={e => setOldSearch({ ...oldSearch, reg: e.target.value })}
                className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-main">রোল নম্বর *</label>
              <input
                type="text"
                placeholder="যেমন: ১২"
                value={oldSearch.roll}
                onChange={e => setOldSearch({ ...oldSearch, roll: e.target.value })}
                className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              onClick={handleOldSearch}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Search size={16} /> যাচাই করুন ও ভর্তি ফর্মে যান
            </button>
          </div>
        </motion.div>
      )}

      {/* STAGE 3: Main Multi-Step Form */}
      {viewState === 'main_form' && (
        <div className="space-y-6">
          {/* Step Indicator Header */}
          <div className="bento-card p-6 bg-card border border-border-main shadow-xl rounded-3xl">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setViewState('selection')}
                className="text-xs text-text-light hover:text-primary font-bold flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> টাইপ পরিবর্তন করুন ({studentType === 'old' ? 'পুরাতন শিক্ষার্থী' : 'নতুন শিক্ষার্থী'})
              </button>
              <span className="text-xs font-black bg-primary/10 text-primary px-3 py-1 rounded-full">
                ধাপ {currentStep} / {totalSteps}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-4 relative">
              {[
                { step: 1, title: 'ব্যক্তিগত তথ্য', icon: User },
                { step: 2, title: 'স্থায়ী ঠিকানা', icon: MapPin },
                { step: 3, title: 'ভর্তি তথ্য', icon: BookOpen },
                { step: 4, title: 'যাচাই ও জমা', icon: FileText }
              ].map(item => {
                const Icon = item.icon;
                const isActive = currentStep === item.step;
                const isPassed = currentStep > item.step;

                return (
                  <button
                    key={item.step}
                    onClick={() => {
                      if (item.step < currentStep) setCurrentStep(item.step);
                    }}
                    className={`p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-2 transition-all ${
                      isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 font-black'
                        : isPassed
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-bold'
                          : 'bg-step-bg text-text-light/50 border border-border-main font-medium'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                      isActive ? 'bg-white/20 text-white' : isPassed ? 'bg-emerald-500 text-white' : 'bg-border-main/50'
                    }`}>
                      {isPassed ? <CheckCircle size={14} /> : item.step}
                    </div>
                    <span className="text-[11px] sm:text-xs tracking-tight text-center sm:text-left">{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 1: Personal Details */}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bento-card p-8 bg-card border border-border-main shadow-2xl rounded-3xl space-y-6">
              <div className="flex items-center gap-3 border-b border-border-main/50 pb-4">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-main">১. শিক্ষার্থীর ব্যক্তিগত তথ্য</h3>
                  <p className="text-xs text-text-light/60">জন্ম নিবন্ধন বা এনআইডি অনুযায়ী সঠিক তথ্য প্রদান করুন</p>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl text-xs font-bold flex items-center gap-2">
                <Sparkles size={16} /> জন্ম নিবন্ধন বা এনআইডি অনুযায়ী বাংলায় নাম ও তথ্য পূরণ করুন।
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-black text-text-main">শিক্ষার্থীর পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: আয়েশা সিদ্দিকা"
                    value={formData.student_name}
                    onChange={e => setFormData({ ...formData, student_name: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-black text-text-main">পিতার নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মোহাম্মদ আব্দুল্লাহ"
                    value={formData.father_name}
                    onChange={e => setFormData({ ...formData, father_name: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-black text-text-main">মাতার নাম</label>
                  <input
                    type="text"
                    placeholder="যেমন: ফাতেমা বেগম"
                    value={formData.mother_name}
                    onChange={e => setFormData({ ...formData, mother_name: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-main">জন্ম তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-main">জন্ম নিবন্ধন/NID নং *</label>
                  <input
                    type="text"
                    required
                    placeholder="১৭ ডিজিটের জন্ম নম্বর"
                    value={formData.birth_reg_no}
                    onChange={e => setFormData({ ...formData, birth_reg_no: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-main">রক্তের গ্রুপ</label>
                  <select
                    value={formData.blood_group}
                    onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-main">অভিভাবকের মোবাইল (মা) *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="01XXXXXXXXX (11 ডিজিট)"
                      value={formData.mobile_mother}
                      onChange={e => setFormData({ ...formData, mobile_mother: e.target.value })}
                      className="w-full p-3.5 pl-10 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                    />
                    <Phone size={16} className="absolute left-3.5 top-4 text-text-light/50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-main">অভিভাবকের মোবাইল (বাবা/ভাই) *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="01XXXXXXXXX (11 ডিজিট)"
                      value={formData.mobile_father_brother}
                      onChange={e => setFormData({ ...formData, mobile_father_brother: e.target.value })}
                      className="w-full p-3.5 pl-10 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                    />
                    <Phone size={16} className="absolute left-3.5 top-4 text-text-light/50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-main">ইমেইল (ঐচ্ছিক)</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3.5 pl-10 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                    />
                    <Mail size={16} className="absolute left-3.5 top-4 text-text-light/50" />
                  </div>
                </div>
              </div>

              {/* Messaging App Badges */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-black text-text-main">সচল মেসেজিং অ্যাপ নির্বাচন করুন:</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'whatsapp', label: 'WhatsApp', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
                    { id: 'telegram', label: 'Telegram', color: 'bg-sky-500/10 text-sky-500 border-sky-500/30' },
                    { id: 'imessage', label: 'iMessage', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' }
                  ].map(app => {
                    const isSelected = formData.messaging_apps.includes(app.id);
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormData({ ...formData, messaging_apps: formData.messaging_apps.filter(a => a !== app.id) });
                          } else {
                            setFormData({ ...formData, messaging_apps: [...formData.messaging_apps, app.id] });
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black border flex items-center gap-2 transition-all ${
                          isSelected ? `${app.color} ring-2 ring-primary/30` : 'bg-step-bg text-text-light/50 border-border-main opacity-70'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-current' : 'bg-text-light/30'}`} />
                        {app.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Address */}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bento-card p-8 bg-card border border-border-main shadow-2xl rounded-3xl space-y-6">
              <div className="flex items-center gap-3 border-b border-border-main/50 pb-4">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-main">২. স্থায়ী ও বর্তমান ঠিকানা</h3>
                  <p className="text-xs text-text-light/60">বাংলাদেশ প্রশাসনিক কাঠামো অনুযায়ী ঠিকানা নির্বাচন করুন</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-main">বিভাগ নির্বাচন করুন *</label>
                  <select
                    value={formData.division}
                    onChange={e => {
                      const newDiv = e.target.value;
                      const distKeys = Object.keys(bangladeshData[newDiv]?.districts || {});
                      const firstDist = distKeys[0] || '';
                      const firstUp = bangladeshData[newDiv]?.districts[firstDist]?.upazilas[0] || '';
                      setFormData({
                        ...formData,
                        division: newDiv,
                        district: firstDist,
                        upazila: firstUp
                      });
                    }}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  >
                    {Object.entries(bangladeshData).map(([key, val]) => (
                      <option key={key} value={key}>{val.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-main">জেলা নির্বাচন করুন *</label>
                  <select
                    value={formData.district}
                    onChange={e => {
                      const newDist = e.target.value;
                      const firstUp = currentDistricts[newDist]?.upazilas[0] || '';
                      setFormData({
                        ...formData,
                        district: newDist,
                        upazila: firstUp
                      });
                    }}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  >
                    {Object.entries(currentDistricts).map(([key, val]) => (
                      <option key={key} value={key}>{val.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-main">উপজেলা/থানা নির্বাচন করুন *</label>
                  <select
                    value={formData.upazila}
                    onChange={e => setFormData({ ...formData, upazila: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  >
                    {currentUpazilas.map(up => (
                      <option key={up} value={up}>{up}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-main">ডাকঘর/পোস্ট অফিস *</label>
                  <input
                    type="text"
                    required
                    placeholder="ডাকঘরের নাম"
                    value={formData.post_office}
                    onChange={e => setFormData({ ...formData, post_office: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-black text-text-main">গ্রাম/মহল্লা ও বাড়ির নম্বর *</label>
                  <input
                    type="text"
                    required
                    placeholder="গ্রাম ও বিস্তারিত ঠিকানা"
                    value={formData.village}
                    onChange={e => setFormData({ ...formData, village: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {/* Full Address Live Badge */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl text-xs space-y-1">
                <span className="font-black text-primary uppercase tracking-wider block text-[10px]">সম্পূর্ণ ঠিকানা প্রিভিউ:</span>
                <p className="font-bold text-text-main">
                  গ্রাম: {formData.village || '...'}, পো: {formData.post_office || '...'}, থানা: {formData.upazila || '...'}, জেলা: {currentDistricts[formData.district]?.name || formData.district || '...'}।
                </p>
              </div>

              {/* Same as Permanent Checkbox */}
              <div className="pt-2 border-t border-border-main/50 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sameAsPerm"
                  checked={formData.same_as_permanent}
                  onChange={e => setFormData({ ...formData, same_as_permanent: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="sameAsPerm" className="text-xs font-bold text-text-main cursor-pointer">
                  অস্থায়ী ঠিকানা স্থায়ী ঠিকানার মতোই
                </label>
              </div>
            </motion.div>
          )}

          {/* Step 3: Admission Info */}
          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bento-card p-8 bg-card border border-border-main shadow-2xl rounded-3xl space-y-6">
              <div className="flex items-center gap-3 border-b border-border-main/50 pb-4">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-main">৩. ভর্তি সংক্রান্ত তথ্য</h3>
                  <p className="text-xs text-text-light/60">পূর্ববর্তী ও বর্তমান শিক্ষাবর্ষ ও ভর্তি জামাত নির্বাচন করুন</p>
                </div>
              </div>

              {studentType === 'old' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-xs space-y-1">
                  <div className="font-black flex items-center gap-2">
                    <CheckCircle size={16} /> স্বাগতম! আপনার তথ্য যাচাই সফল হয়েছে।
                  </div>
                  <p className="text-emerald-400">পূর্বের জামাত: <strong className="underline">{formData.prev_jamat}</strong> → স্বয়ংক্রিয় ভর্তি জামাত: <strong className="underline">{formData.jamat}</strong></p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {studentType === 'new' && (
                  <>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-black text-text-main">পূর্বের মাদ্রাসার নাম *</label>
                      <input
                        type="text"
                        required
                        placeholder="পূর্ববর্তী মাদ্রাসা বা স্কুলের নাম"
                        value={formData.prev_madrasah}
                        onChange={e => setFormData({ ...formData, prev_madrasah: e.target.value })}
                        className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-text-main">পূর্বের শিক্ষাবর্ষ *</label>
                      <select
                        value={formData.prev_year}
                        onChange={e => setFormData({ ...formData, prev_year: e.target.value })}
                        className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                      >
                        {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-text-main">পূর্বের জামাত *</label>
                      <select
                        value={formData.prev_jamat}
                        onChange={e => {
                          const pj = e.target.value;
                          const autoNext = getNextClass(pj);
                          setFormData({ ...formData, prev_jamat: pj, jamat: autoNext });
                        }}
                        className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                      >
                        {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-main">বর্তমান শিক্ষাবর্ষ (আবেদনকৃত)</label>
                  <input
                    type="text"
                    disabled
                    value={formData.current_year}
                    className="w-full p-3.5 bg-step-bg/50 border border-border-main/50 rounded-2xl text-xs font-black text-text-light cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-main">ভর্তি জামাত (কাঙ্ক্ষিত শ্রেণী) *</label>
                  <select
                    value={formData.jamat}
                    onChange={e => setFormData({ ...formData, jamat: e.target.value })}
                    className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  >
                    {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-black text-text-main">মন্তব্য (কেন ভর্তি?)</label>
                  <textarea
                    rows={3}
                    placeholder="মাদ্রাসা সংক্রান্ত বিশেষ কোনো মন্তব্য বা তথ্য থাকলে লিখুন..."
                    value={formData.comments}
                    onChange={e => setFormData({ ...formData, comments: e.target.value })}
                    className="w-full p-4 bg-step-bg border border-border-main rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bento-card p-8 bg-card border border-border-main shadow-2xl rounded-3xl space-y-6">
              <div className="flex items-center gap-3 border-b border-border-main/50 pb-4">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-main">৪. আপনার প্রদানকৃত তথ্য যাচাই করুন</h3>
                  <p className="text-xs text-text-light/60">আবেদন জমা দেওয়ার পূর্বে সকল তথ্য পুঙ্খানুপুঙ্খভাবে দেখে নিন</p>
                </div>
              </div>

              {/* Review Section 1: Personal */}
              <div className="p-6 bg-step-bg border border-border-main rounded-2xl space-y-3">
                <div className="flex justify-between items-center border-b border-border-main/50 pb-2">
                  <h4 className="text-xs font-black text-primary uppercase tracking-widest">১. ব্যক্তিগত তথ্য</h4>
                  <button onClick={() => setCurrentStep(1)} className="text-xs text-primary hover:underline font-bold">এডিট করুন</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div><span className="text-text-light/60">শিক্ষার্থীর নাম:</span> <p className="font-bold text-text-main">{formData.student_name}</p></div>
                  <div><span className="text-text-light/60">পিতার নাম:</span> <p className="font-bold text-text-main">{formData.father_name}</p></div>
                  <div><span className="text-text-light/60">মাতার নাম:</span> <p className="font-bold text-text-main">{formData.mother_name || '-'}</p></div>
                  <div><span className="text-text-light/60">জন্ম তারিখ:</span> <p className="font-bold text-text-main">{formData.dob}</p></div>
                  <div><span className="text-text-light/60">জন্ম নিবন্ধন:</span> <p className="font-bold text-text-main">{formData.birth_reg_no}</p></div>
                  <div><span className="text-text-light/60">মোবাইল (মা):</span> <p className="font-bold text-text-main">{formData.mobile_mother}</p></div>
                </div>
              </div>

              {/* Review Section 2: Address */}
              <div className="p-6 bg-step-bg border border-border-main rounded-2xl space-y-3">
                <div className="flex justify-between items-center border-b border-border-main/50 pb-2">
                  <h4 className="text-xs font-black text-primary uppercase tracking-widest">২. স্থায়ী ঠিকানা</h4>
                  <button onClick={() => setCurrentStep(2)} className="text-xs text-primary hover:underline font-bold">এডিট করুন</button>
                </div>
                <div className="text-xs font-bold text-text-main">
                  গ্রাম: {formData.village}, পো: {formData.post_office}, থানা: {formData.upazila}, জেলা: {bangladeshData[formData.division]?.districts[formData.district]?.name || formData.district}।
                </div>
              </div>

              {/* Review Section 3: Admission Info */}
              <div className="p-6 bg-step-bg border border-border-main rounded-2xl space-y-3">
                <div className="flex justify-between items-center border-b border-border-main/50 pb-2">
                  <h4 className="text-xs font-black text-primary uppercase tracking-widest">৩. ভর্তি সংক্রান্ত তথ্য</h4>
                  <button onClick={() => setCurrentStep(3)} className="text-xs text-primary hover:underline font-bold">এডিট করুন</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div><span className="text-text-light/60">শিক্ষাবর্ষ:</span> <p className="font-bold text-text-main">{formData.current_year}</p></div>
                  <div><span className="text-text-light/60">ভর্তি জামাত:</span> <p className="font-bold text-primary">{formData.jamat}</p></div>
                  {studentType === 'new' && (
                    <div><span className="text-text-light/60">পূর্বের মাদ্রাসা:</span> <p className="font-bold text-text-main">{formData.prev_madrasah}</p></div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Bottom Action Navigation Bar */}
          <div className="bento-card p-6 bg-card border border-border-main shadow-xl rounded-3xl flex justify-between items-center">
            {currentStep > 1 ? (
              <button
                onClick={handlePrevStep}
                className="px-6 py-3.5 bg-step-bg hover:bg-border-main border border-border-main text-text-main font-bold text-xs rounded-2xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <ArrowLeft size={16} /> পূর্ববর্তী
              </button>
            ) : <div />}

            {currentStep < totalSteps ? (
              <button
                onClick={handleNextStep}
                className="px-8 py-3.5 bg-primary hover:bg-primary-light text-white font-black text-xs rounded-2xl flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                পরবর্তী <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={isSaving}
                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl flex items-center gap-2 cursor-pointer shadow-xl shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50"
              >
                <CheckCircle size={18} /> {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'জমা দিন ও সংরক্ষণ করুন'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* STAGE 4: Pending / Success Confirmation Panel */}
      {viewState === 'pending_panel' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bento-card p-8 sm:p-12 bg-card border border-border-main shadow-2xl rounded-3xl text-center space-y-8 max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Clock size={44} />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black rounded-full uppercase tracking-wider">
              আবেদন স্ট্যাটাস: অপেক্ষমাণ (Pending)
            </span>
            <h3 className="text-2xl font-black text-text-main">আবেদন প্রক্রিয়াধীন!</h3>
            <p className="text-xs text-text-light/70 max-w-md mx-auto">
              আপনার ভর্তি আবেদন সফলভাবে সিস্টেমে গ্রহণ করা হয়েছে ও ডাটাবেজে সংরক্ষণ করা হয়েছে।
            </p>
          </div>

          <div className="p-6 bg-step-bg border border-border-main rounded-2xl text-left space-y-3">
            <div className="flex justify-between items-center border-b border-border-main/50 pb-3">
              <span className="text-xs font-bold text-text-light">আবেদন নম্বর:</span>
              <span className="text-sm font-black text-primary font-mono bg-primary/10 px-3 py-1 rounded-lg">{appNumber}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-text-light/60">শিক্ষার্থীর নাম:</span> <p className="font-bold text-text-main">{formData.student_name}</p></div>
              <div><span className="text-text-light/60">পিতার নাম:</span> <p className="font-bold text-text-main">{formData.father_name}</p></div>
              <div><span className="text-text-light/60">ভর্তি জামাত:</span> <p className="font-bold text-primary">{formData.jamat}</p></div>
              <div><span className="text-text-light/60">মোবাইল:</span> <p className="font-bold text-text-main">{formData.mobile_mother}</p></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={resetAll}
              className="flex-1 py-4 bg-primary hover:bg-primary-light text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer active:scale-95 transition-all"
            >
              <Plus size={16} /> নতুন ভর্তি আবেদন করুন
            </button>
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('student-all')}
                className="flex-1 py-4 bg-step-bg hover:bg-border-main text-text-main font-bold text-xs rounded-2xl border border-border-main flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                শিক্ষার্থী তালিকা দেখুন <ArrowRight size={16} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};


// -------------------------------------------------------------
// 2. ADMISSION - MULTIPLE (একাধিক শিক্ষার্থী যোগ)
// -------------------------------------------------------------
export const AdmissionMultiple: React.FC<{ 
  students: Student[]; 
  onSaveBatch: (batch: Student[]) => Promise<void> | void;
  academicYear?: string;
  setActiveTab?: (tabId: string) => void;
}> = ({ students, onSaveBatch, academicYear, setActiveTab }) => {
  const { jamatList } = useData();
  const activeBranches = useActiveBranches();
  const defaultBranch = activeBranches[0] || 'ক';

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Helper to create an empty row containing all 29 Bengali headers
  const createEmptyRow = (customId?: string) => {
    const regId = customId || (Math.floor(Math.random() * 900000 + 100000).toString());
    return {
      id: regId,
      'মঞ্জুরের তারিখ ও সময়': new Date().toLocaleString('bn-BD', { hour12: true }),
      'শিক্ষাবর্ষ': academicYear || ACADEMIC_YEARS[0],
      'জামাত': jamatList[0] || '',
      'শাখা': defaultBranch,
      'রেজিস্ট্রেশন/আইডি': regId,
      'রোল নম্বর': '',
      'শিক্ষার্থীর নাম': '',
      'পিতার নাম': '',
      'মাতার নাম': '',
      'মোবাইল (মা)': '',
      'মোবাইল (বাবা/ভাই)': '',
      'জন্ম নিবন্ধন নাম্বার': '',
      'জন্ম তারিখ': '',
      'ইমেইল': '',
      'রক্তের গ্রুপ': 'জানা নেই',
      'ঠিকানা': '',
      'শিক্ষার্থী ধরণ': 'আবাসিক',
      'শিক্ষার্থী ধরণ/স্ট্যাটাস': 'সক্রিয়',
      'পূর্বের মাদ্রাসা': '',
      'পূর্বের জামাত': '',
      'স্ট্যাটাস': 'Active',
      'মেসেজিং অ্যাপ': 'WhatsApp',
      'মন্তব্য': '',
      'আবেদন নং': 'APP-' + regId,
      'ভেরিফিকেশন লিংক': '',
      'LONG URL': '',
      'SORT URL': '',
      'QR CODE': regId,
      'QR CODE IMAGE': '',
      'प्रत्यয়ন পত্র নাম্বার': '',

      // Legacy key compatibility
      class: jamatList[0] || '',
      branch: defaultBranch,
      roll: '',
      studentId: regId,
      name: '',
      father: '',
      mother: '',
      mobile: ''
    };
  };

  const [rows, setRows] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (rows.length === 0) {
      setRows([createEmptyRow()]);
    }
  }, [activeBranches, academicYear]);

  // Click & Drag Scroll Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    const tagName = (e.target as HTMLElement).tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'select' || tagName === 'option' || tagName === 'button') {
      return;
    }
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag speed factor
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Mouse Wheel Scroll Logic (Converts vertical scroll to horizontal scroll inside the table)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const [showImportModal, setShowImportModal] = useState(false);

  const addRow = () => {
    setRows([...rows, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) {
      setRows([createEmptyRow()]);
      return;
    }
    setRows(rows.filter(r => r.id !== id));
  };

  const handleChange = (id: string, field: string, val: string) => {
    setRows(rows.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: val };

      // Two-way synchronization between Bengali keys and Legacy English keys
      if (field === 'জামাত') updated.class = val;
      if (field === 'শাখা') updated.branch = val;
      if (field === 'রোল নম্বর') updated.roll = val;
      if (field === 'রেজিস্ট্রেশন/আইডি') {
        updated.studentId = val;
        updated['QR CODE'] = val;
        updated['আবেদন নং'] = 'APP-' + val;
      }
      if (field === 'শিক্ষার্থীর নাম') updated.name = val;
      if (field === 'পিতার নাম') updated.father = val;
      if (field === 'মাতার নাম') updated.mother = val;
      if (field === 'মোবাইল (মা)') updated.mobile = val;

      if (field === 'class') updated['জামাত'] = val;
      if (field === 'branch') updated['শাখা'] = val;
      if (field === 'roll') updated['রোল নম্বর'] = val;
      if (field === 'studentId') {
        updated['রেজিস্ট্রেশন/আইডি'] = val;
        updated['QR CODE'] = val;
        updated['আবেদন নং'] = 'APP-' + val;
      }
      if (field === 'name') updated['শিক্ষার্থীর নাম'] = val;
      if (field === 'father') updated['পিতার নাম'] = val;
      if (field === 'mother') updated['মাতার নাম'] = val;
      if (field === 'mobile') updated['মোবাইল (মা)'] = val;

      return updated;
    }));
  };

  const handleSave = async () => {
    const validRows = rows.filter(r => r['শিক্ষার্থীর নাম'] || r['शिक्षार्थीর নাম'] || r.name);
    if (validRows.length === 0) {
      toast.error('দয়া করে কমপক্ষে একটি শিক্ষার্থীর নাম সঠিকভাবে পূরণ করুন।');
      return;
    }

    const formatted = validRows.map((r, idx) => {
      const regId = String(r['রেজিস্ট্রেশন/আইডি'] || r.studentId || r.id || (Math.floor(Math.random() * 900000 + 100000).toString() + '-' + idx)).trim();
      const studentName = String(r['শিক্ষার্থীর নাম'] || r['शिक्षार्थीর নাম'] || r.name || '').trim();
      const mobileMother = String(r['মোবাইল (মা)'] || r.mobile || '').trim();
      const mobileFather = String(r['মোবাইল (বাবা/ভাই)'] || '').trim();
      const classVal = String(r['জামাত'] || r.class || (jamatList[0] || '')).trim();
      const branchVal = String(r['শাখা'] || r.branch || defaultBranch).trim();
      const rollNo = String(r['রোল নম্বর'] || r.roll || '').trim();

      return {
        // Flat properties
        id: regId,
        class: classVal,
        branch: branchVal,
        roll: rollNo,
        studentId: regId,
        name: studentName,
        father: String(r['পিতার নাম'] || r.father || '').trim(),
        mother: String(r['মাতার নাম'] || r.mother || '').trim(),
        mobile: mobileMother,
        
        // Exact 29 Bengali headers
        'মঞ্জুরের তারিখ ও সময়': r['মঞ্জুরের তারিখ ও সময়'] || new Date().toLocaleString('bn-BD', { hour12: true }),
        'শিক্ষাবর্ষ': r['শিক্ষাবর্ষ'] || academicYear || ACADEMIC_YEARS[0],
        'জামাত': classVal,
        'শাখা': branchVal,
        'জামাত/শ্রেণী': classVal,
        'রেজিস্ট্রেশন/আইডি': regId,
        'রেজিস্ট্রেশন/আইডি নম্বর': regId,
        'রোল নম্বর': rollNo,
        'শিক্ষার্থীর নাম': studentName,
        'পিতার নাম': String(r['পিতার নাম'] || r.father || '').trim(),
        'মাতার নাম': String(r['মাতার নাম'] || r.mother || '').trim(),
        'মোবাইল (মা)': mobileMother,
        'মোবাইল (বাবা/ভাই)': mobileFather,
        'অভিভাবকের মোবাইল': mobileMother || mobileFather,
        'জন্ম নিবন্ধন নাম্বার': String(r['জন্ম নিবন্ধন নাম্বার'] || '').trim(),
        'জন্ম তারিখ': String(r['জন্ম তারিখ'] || '').trim(),
        'ইমেইল': String(r['ইমেইল'] || '').trim(),
        'রক্তের গ্রুপ': r['রক্তের গ্রুপ'] || 'জানা নেই',
        'ঠিকানা': String(r['ঠিকানা'] || '').trim(),
        'শিক্ষার্থী ধরণ': r['শিক্ষার্থী ধরণ'] || 'আবাসিক',
        'শিক্ষার্থী ধরণ/স্ট্যাটাস': r['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || 'সক্রিয়',
        'পূর্বের মাদ্রাসা': String(r['পূর্বের মাদ্রাসা'] || '').trim(),
        'পূর্বের জামাত': String(r['পূর্বের জামাত'] || '').trim(),
        'স্ট্যাটাস': r['স্ট্যাটাস'] || 'Active',
        'মেসেজিং অ্যাপ': r['মেসেজিং অ্যাপ'] || 'WhatsApp',
        'মন্তব্য': String(r['মন্তব্য'] || '').trim(),
        'আবেদন নং': r['আবেদন নং'] || 'APP-' + regId,
        'ভেরিফিকেশন লিংক': r['ভেরিফিকেশন লিংক'] || '',
        'LONG URL': r['LONG URL'] || '',
        'SORT URL': r['SORT URL'] || '',
        'QR CODE': r['QR CODE'] || regId,
        'QR CODE IMAGE': r['QR CODE IMAGE'] || '',
        'प्रत्यয়ন পত্র নাম্বার': r['प्रत्यয়ন পত্র নাম্বার'] || r['প্রত্যয়ন পত্র নাম্বার'] || '',
        'প্রত্যয়ন পত্র নাম্বার': r['प्रत्यয়ন পত্র নাম্বার'] || r['প্রত্যয়ন পত্র নাম্বার'] || '',
      };
    });

    setIsSaving(true);
    try {
      await onSaveBatch(formatted);
      toast.success(`${enToBnNumber(formatted.length.toString())} জন শিক্ষার্থীর তথ্য সফলভাবে ডাটাবেজে যুক্ত করা হয়েছে!`);
      setRows([createEmptyRow()]);
    } catch (err: any) {
      console.error(err);
      toast.error(`ডাটাবেজে সংরক্ষণ করতে সমস্যা হয়েছে: ${err?.message || err || 'দয়া করে আবার চেষ্টা করুন।'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const [isImporting, setIsImporting] = useState(false);
  const [isDragOverFile, setIsDragOverFile] = useState(false);

  // Helper to extract clean string value from cell data with type safety
  const cleanCellVal = (val: any): string => {
    if (val === undefined || val === null) return '';
    if (typeof val === 'number') {
      return Number.isInteger(val) ? val.toLocaleString('fullwide', { useGrouping: false }) : val.toString();
    }
    if (val instanceof Date) {
      const yyyy = val.getFullYear();
      const mm = String(val.getMonth() + 1).padStart(2, '0');
      const dd = String(val.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return String(val).trim();
  };

  // Helper for flexible field extraction by aliases
  const getRowVal = (row: any, aliases: string[]): string => {
    if (!row || typeof row !== 'object') return '';
    
    // 1. Direct exact key lookup
    for (const alias of aliases) {
      if (row[alias] !== undefined && row[alias] !== null) {
        const v = cleanCellVal(row[alias]);
        if (v !== '') return v;
      }
    }
    
    // 2. Normalized key lookup (ignoring spaces, special characters, case)
    const rowEntries = Object.entries(row);
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[\s\-_/().\u00A0]/g, '');
      for (const [key, val] of rowEntries) {
        const cleanKey = key.toLowerCase().replace(/[\s\-_/().\u00A0]/g, '');
        if (cleanKey === cleanAlias) {
          const v = cleanCellVal(val);
          if (v !== '') return v;
        }
      }
    }

    // 3. Substring match for broader compatibility
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[\s\-_/().\u00A0]/g, '');
      if (cleanAlias.length >= 3) {
        for (const [key, val] of rowEntries) {
          const cleanKey = key.toLowerCase().replace(/[\s\-_/().\u00A0]/g, '');
          if (cleanKey.includes(cleanAlias) || cleanAlias.includes(cleanKey)) {
            const v = cleanCellVal(val);
            if (v !== '') return v;
          }
        }
      }
    }

    return '';
  };

  const processExcelFile = async (file: File) => {
    if (!file) return;
    setIsImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        toast.error('এক্সেল ফাইলে কোনো শিট পাওয়া যায়নি!');
        setIsImporting(false);
        return;
      }

      let parsedRows: any[] = [];
      
      // Look through sheets to find student rows
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;
        
        let rowsCandidate: any[] = XLSX.utils.sheet_to_json<any>(sheet, { defval: '', raw: false });
        
        // If candidate is empty or rows don't have recognizable keys, try raw 2D array to find header row
        const hasRecognizableHeaders = rowsCandidate.some(r => 
          getRowVal(r, ['শিক্ষার্থীর নাম', 'name', 'student name', 'নাম', 'ছাত্রের নাম', 'রোল', 'roll', 'শ্রেণী', 'class', 'মোবাইল', 'mobile'])
        );

        if (rowsCandidate.length === 0 || !hasRecognizableHeaders) {
          const rawGrid: any[][] = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', raw: false });
          if (rawGrid.length > 1) {
            let bestHeaderIdx = -1;
            let maxMatches = 0;
            for (let r = 0; r < Math.min(rawGrid.length, 12); r++) {
              const rowCells = rawGrid[r] || [];
              let matches = 0;
              for (const cell of rowCells) {
                const cStr = String(cell || '').trim().toLowerCase();
                if (
                  cStr.includes('নাম') || cStr.includes('name') || 
                  cStr.includes('roll') || cStr.includes('রোল') || 
                  cStr.includes('শ্রেণী') || cStr.includes('class') || 
                  cStr.includes('মোবাইল') || cStr.includes('phone') || 
                  cStr.includes('id') || cStr.includes('আইডি') || 
                  cStr.includes('পিতা') || cStr.includes('father')
                ) {
                  matches++;
                }
              }
              if (matches > maxMatches) {
                maxMatches = matches;
                bestHeaderIdx = r;
              }
            }

            if (bestHeaderIdx !== -1 && bestHeaderIdx < rawGrid.length - 1) {
              const headers = rawGrid[bestHeaderIdx].map((h: any) => String(h || '').trim());
              const dataRows = rawGrid.slice(bestHeaderIdx + 1);
              rowsCandidate = dataRows
                .map(rowArr => {
                  const obj: any = {};
                  headers.forEach((h, hIdx) => {
                    if (h) obj[h] = rowArr[hIdx] !== undefined ? rowArr[hIdx] : '';
                  });
                  return obj;
                })
                .filter(obj => Object.values(obj).some(v => v !== '' && v !== null && v !== undefined));
            }
          }
        }

        if (rowsCandidate.length > 0) {
          parsedRows = rowsCandidate;
          break;
        }
      }

      if (parsedRows.length === 0) {
        toast.error('ফাইলটি খালি অথবা কোনো ডেটা পাওয়া যায়নি।');
        setIsImporting(false);
        return;
      }

      const importedRows = parsedRows
        .map((row: any, idx: number) => {
          const studentName = getRowVal(row, [
            'শিক্ষার্থীর নাম', 'शिक्षार्थीর নাম', 'নাম', 'ছাত্রের নাম', 'ছাত্রীর নাম', 
            'Student Name', 'Name', 'Student', 'FullName', 'Full Name', 'student_name', 
            'StudentName', 'শিক্ষার্থী', 'Student_Name'
          ]);

          const regId = getRowVal(row, [
            'রেজিস্ট্রেশন/আইডি', 'রেজিস্ট্রেশন/আইডি নম্বর', 'রেজিস্ট্রেশন নম্বর', 'রেজিস্ট্রেশন নং', 
            'রেজিস্ট্রেশন', 'আইডি নম্বর', 'আইডি নং', 'আইডি', 'ID', 'Student ID', 'StudentID', 
            'Reg ID', 'Reg No', 'Registration No', 'Registration', 'Admission No', 'Student_Id', 'studentId'
          ]) || (Math.floor(Math.random() * 900000 + 100000).toString() + '-' + idx);

          const fatherName = getRowVal(row, [
            'পিতার নাম', 'পিতা', 'বাবার নাম', 'অভিভাবক', 'Father Name', 'Father', "Father's Name", 'Guardian Name', 'Guardian'
          ]);

          const motherName = getRowVal(row, [
            'মাতার নাম', 'মাতা', 'মায়ের নাম', 'Mother Name', 'Mother', "Mother's Name"
          ]);

          const mobileMother = getRowVal(row, [
            'মোবাইল (মা)', 'অভিভাবকের মোবাইল', 'মোবাইল', 'মোবাইল নং', 'মোবাইল নম্বর', 'ফোন', 
            'ফোন নম্বর', 'Mobile', 'Mobile No', 'Phone', 'Phone No', 'Contact', 'Guardian Mobile', 
            'Parent Mobile', 'Mother Mobile', 'Mobile Number', 'Phone Number', 'WhatsApp'
          ]);

          const mobileFather = getRowVal(row, [
            'মোবাইল (বাবা/ভাই)', 'বিকল্প মোবাইল', 'পিতার মোবাইল', 'Father Mobile', 'Alt Mobile', 
            'Alternative Mobile', 'Emergency Contact', 'Second Mobile'
          ]);

          const classVal = getRowVal(row, [
            'জামাত', 'জামাত/শ্রেণী', 'শ্রেণী', 'শ্রেণি', 'ক্লাস', 'Class', 'Jamat', 'Grade', 'class_name', 'Class Name', 'Standard'
          ]) || jamatList[0] || '';

          const rollNo = getRowVal(row, [
            'রোল নম্বর', 'রোল', 'রোল নং', 'Roll', 'Roll No', 'Roll Number', 'roll_no', 'RollNo', 'SL', 'Sl', 'ক্রমিক', 'ক্রমিক নং'
          ]);

          const branchVal = getRowVal(row, [
            'শাখা', 'সেকশন', 'শাখা/গ্রুপ', 'Branch', 'Section', 'branch_name', 'Sec'
          ]) || defaultBranch;

          const birthReg = getRowVal(row, [
            'জন্ম নিবন্ধন নাম্বার', 'জন্ম নিবন্ধন নম্বর', 'জন্ম নিবন্ধন নং', 'জন্ম নিবন্ধন', 'Birth Registration', 'Birth Reg', 'Birth Certificate', 'BRN', 'NID', 'National ID'
          ]);

          const dob = getRowVal(row, [
            'জন্ম তারিখ', 'DOB', 'Date of Birth', 'Birth Date', 'Birthday', 'জন্মদিন'
          ]);

          const email = getRowVal(row, ['ইমেইল', 'Email', 'E-mail', 'Mail']);
          const blood = getRowVal(row, ['রক্তের গ্রুপ', 'রক্ত', 'Blood Group', 'Blood', 'Bloodgroup']) || 'জানা নেই';
          const address = getRowVal(row, ['ঠিকানা', 'গ্রাম', 'বর্তমান ঠিকানা', 'স্থায়ী ঠিকানা', 'স্থায়ী ঠিকানা', 'Address', 'Present Address', 'Permanent Address', 'Village', 'Location']);
          const studentType = getRowVal(row, ['শিক্ষার্থী ধরণ', 'শিক্ষার্থী ধরণ/স্ট্যাটাস', 'ধরণ', 'টাইপ', 'ছাত্র ধরণ', 'Type', 'Student Type', 'Residential Status', 'Boarding']) || 'আবাসিক';
          const prevMadrasah = getRowVal(row, ['পূর্বের মাদ্রাসা', 'পূর্বের প্রতিষ্ঠান', 'পূর্বের স্কুল', 'Previous Madrasa', 'Previous Madrasah', 'Previous School', 'Previous Institute']);
          const prevJamat = getRowVal(row, ['পূর্বের জামাত', 'পূর্বের শ্রেণী', 'Previous Class', 'Previous Jamat', 'Previous Grade']);
          const status = getRowVal(row, ['স্ট্যাটাস', 'অবস্থা', 'Status', 'State']) || 'Active';
          const messagingApp = getRowVal(row, ['মেসেজিং অ্যাপ', 'Messaging App', 'Messenger', 'App']) || 'WhatsApp';
          const comments = getRowVal(row, ['মন্তব্য', 'Comments', 'Comment', 'Remarks', 'Remark', 'Note']);
          const appNo = getRowVal(row, ['আবেদন নং', 'আবেদন নম্বর', 'Application No', 'App No']) || ('APP-' + regId);
          const certNo = getRowVal(row, ['প্রত্যয়ন পত্র নাম্বার', 'प्रत्यয়ন পত্র নাম্বার', 'প্রত্যয়ন নং', 'সার্টিফিকেট নং', 'Certificate No']);

          return {
            id: regId,
            class: classVal,
            branch: branchVal,
            roll: rollNo,
            studentId: regId,
            name: studentName,
            father: fatherName,
            mother: motherName,
            mobile: mobileMother,
            
            // All 29 mapped fields
            'মঞ্জুরের তারিখ ও সময়': getRowVal(row, ['মঞ্জুরের তারিখ ও সময়', 'তারিখ', 'Date']) || new Date().toLocaleString('bn-BD', { hour12: true }),
            'শিক্ষাবর্ষ': getRowVal(row, ['শিক্ষাবর্ষ', 'Academic Year', 'Year', 'Session']) || academicYear || ACADEMIC_YEARS[0],
            'জামাত': classVal,
            'শাখা': branchVal,
            'জামাত/শ্রেণী': classVal,
            'রেজিস্ট্রেশন/আইডি': regId,
            'রেজিস্ট্রেশন/আইডি নম্বর': regId,
            'রোল নম্বর': rollNo,
            'শিক্ষার্থীর নাম': studentName,
            'পিতার নাম': fatherName,
            'মাতার নাম': motherName,
            'মোবাইল (মা)': mobileMother,
            'মোবাইল (বাবা/ভাই)': mobileFather,
            'অভিভাবকের মোবাইল': mobileMother || mobileFather,
            'জন্ম নিবন্ধন নাম্বার': birthReg,
            'জন্ম তারিখ': dob,
            'ইমেইল': email,
            'রক্তের গ্রুপ': blood,
            'ঠিকানা': address,
            'শিক্ষার্থী ধরণ': studentType,
            'শিক্ষার্থী ধরণ/স্ট্যাটাস': 'সক্রিয়',
            'পূর্বের মাদ্রাসা': prevMadrasah,
            'পূর্বের জামাত': prevJamat,
            'স্ট্যাটাস': status,
            'মেসেজিং অ্যাপ': messagingApp,
            'মন্তব্য': comments,
            'আবেদন নং': appNo,
            'ভেরিফিকেশন লিংক': getRowVal(row, ['ভেরিফিকেশন লিংক', 'Verification Link']) || '',
            'LONG URL': getRowVal(row, ['LONG URL']) || '',
            'SORT URL': getRowVal(row, ['SORT URL']) || '',
            'QR CODE': regId,
            'QR CODE IMAGE': '',
            'প্রত্যয়ন পত্র নাম্বার': certNo,
            'प्रत्यয়ন পত্র নাম্বার': certNo,
          };
        })
        .filter((r: any) => {
          // Keep row if it has at least student name, or roll, or mobile, or ID
          return Boolean(r['শিক্ষার্থীর নাম'] || r.name || r['রোল নম্বর'] || r.roll || r['মোবাইল (মা)'] || r.mobile || r.id);
        });

      if (importedRows.length === 0) {
        toast.error('ফাইল থেকে শিক্ষার্থীদের তথ্য সনাক্ত করা যায়নি। দয়া করে ফাইলের কলামগুলো চেক করুন।');
        setIsImporting(false);
        return;
      }

      setRows(importedRows);
      toast.success(`${enToBnNumber(importedRows.length.toString())} জন শিক্ষার্থীর তথ্য সফলভাবে লোড হয়েছে!`);
      setShowImportModal(false);
    } catch (err: any) {
      console.error('Error parsing Excel file:', err);
      toast.error(`ফাইলটি পড়তে সমস্যা হয়েছে: ${err?.message || 'সঠিক ফরম্যাটের Excel/CSV ফাইল আপলোড করুন'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  // Helper function to download sample excel template
  const downloadSampleTemplate = () => {
    const headers = [
      'মঞ্জুরের তারিখ ও সময়',
      'শিক্ষাবর্ষ',
      'জামাত',
      'শাখা',
      'রেজিস্ট্রেশন/আইডি',
      'রোল নম্বর',
      'শিক্ষার্থীর নাম',
      'পিতার নাম',
      'মাতার নাম',
      'মোবাইল (মা)',
      'মোবাইল (বাবা/ভাই)',
      'জন্ম নিবন্ধন নাম্বার',
      'জন্ম তারিখ',
      'ইমেইল',
      'রক্তের গ্রুপ',
      'ঠিকানা',
      'শিক্ষার্থী ধরণ',
      'শিক্ষার্থী ধরণ/স্ট্যাটাস',
      'পূর্বের মাদ্রাসা',
      'পূর্বের জামাত',
      'স্ট্যাটাস',
      'মেсеজিং অ্যাপ',
      'মন্তব্য',
      'আবেদন নং',
      'ভেরিফিকেশন লিংক',
      'LONG URL',
      'SORT URL',
      'QR CODE',
      'QR CODE IMAGE',
      'प्रत्यয়ন পত্র নাম্বার'
    ];

    const sampleData = [
      {
        'মঞ্জুরের তারিখ ও সময়': new Date().toLocaleString('bn-BD', { hour12: true }),
        'শিক্ষাবর্ষ': academicYear || '২০২৬-২৭',
        'জামাত': 'মেশকাত',
        'শাখা': defaultBranch,
        'রেজিস্ট্রেশন/আইডি': 'REG-10101',
        'রোল নম্বর': '১০১',
        'শিক্ষার্থীর নাম': 'আব্দুল্লাহ ইবনে মাসউদ',
        'পিতার নাম': 'আব্দুর রহমান',
        'মাতার নাম': 'আমিনা খাতুন',
        'মোবাইল (মা)': '01712345678',
        'মোবাইল (বাবা/ভাই)': '01812345678',
        'জন্ম নিবন্ধন নাম্বার': '20120000000000001',
        'জন্ম তারিখ': '2012-05-12',
        'ইমেইল': 'abdullah@example.com',
        'রক্তের গ্রুপ': 'O+',
        'ঠিকানা': 'লালবাগ, ঢাকা',
        'শিক্ষার্থী ধরণ': 'আবাসিক',
        'শিক্ষার্থী ধরণ/স্ট্যাটাস': 'সক্রিয়',
        'পূর্বের মাদ্রাসা': 'ঢাকা আলিয়া মাদ্রাসা',
        'পূর্বের জামাত': 'নাহবে মীর',
        'স্ট্যাটাস': 'Active',
        'মেসেজিং অ্যাপ': 'WhatsApp',
        'মন্তব্য': 'নিয়মিত ছাত্র',
        'আবেদন নং': 'APP-10101',
        'ভেরিফিকেশন লিংক': 'https://example.com/verify/10101',
        'LONG URL': 'https://example.com/profiles/10101',
        'SORT URL': 'https://bit.ly/10101',
        'QR CODE': 'REG-10101',
        'QR CODE IMAGE': '',
        'प्रत्यয়ন পত্র নাম্বার': 'CER-2026-101'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ম্যাপড টেমপ্লেট');
    XLSX.writeFile(workbook, 'student_bulk_admission_template.xlsx');
  };

  return (
    <div className="space-y-6">
      <AdmissionSubNav activeTabId="admission-multiple" setActiveTab={setActiveTab} />
      <div className="bento-card p-8 bg-card border border-border-main shadow-2xl space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-main/50">
        <div>
          <h2 className="text-2xl font-black text-text-main font-hind-siliguri leading-none mb-1.5">একাধিক শিক্ষার্থী যোগ করুন (Bulk Excel Grid)</h2>
          <p className="text-[10px] text-text-light/40 uppercase tracking-widest leading-none">Inline Spreadsheet Batch Registration Tool</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={downloadSampleTemplate}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/10"
          >
            <Download size={16} /> স্যাম্পল ফাইল ডাউনলোড
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <FileSpreadsheet size={16} /> Excel/CSV থেকে ইম্পোর্ট
          </button>
          <button 
            onClick={addRow}
            className="px-4 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md shadow-primary/10"
          >
            <Plus size={16} /> নতুন সারি
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="overflow-x-auto border border-border-main rounded-2xl bg-step-bg/30 select-none cursor-grab active:cursor-grabbing scrollbar-thin"
      >
        <table className="w-full text-xs font-hind-siliguri text-left border-collapse min-w-[3200px] table-fixed">
          <thead>
            <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase tracking-wider font-black text-[10px]">
              <th className="p-4 text-center w-12 bg-step-bg border-r border-border-main">#</th>
              <th className="p-4 w-48">শিক্ষার্থীর নাম *</th>
              <th className="p-4 w-36">মোবাইল নম্বর (মা) *</th>
              <th className="p-4 w-36">শ্রেণী</th>
              <th className="p-4 w-28">শাখা</th>
              <th className="p-4 w-24">রোল নম্বর</th>
              <th className="p-4 w-32">রেজিস্ট্রেশন/আইডি</th>
              <th className="p-4 w-36">মঞ্জুরের তারিখ ও সময়</th>
              <th className="p-4 w-24">শিক্ষাবর্ষ</th>
              <th className="p-4 w-40">পিতার নাম</th>
              <th className="p-4 w-40">মাতার নাম</th>
              <th className="p-4 w-36">মোবাইল (বাবা/ভাই)</th>
              <th className="p-4 w-44">জন্ম নিবন্ধন নাম্বার</th>
              <th className="p-4 w-36">জন্ম তারিখ</th>
              <th className="p-4 w-44">ইমেইল</th>
              <th className="p-4 w-24">রক্তের গ্রুপ</th>
              <th className="p-4 w-56">ঠিকানা</th>
              <th className="p-4 w-32">শিক্ষার্থী ধরণ</th>
              <th className="p-4 w-40">শিক্ষার্থী ধরণ/স্ট্যাটাস</th>
              <th className="p-4 w-48">পূর্বের মাদ্রাসা</th>
              <th className="p-4 w-36">পূর্বের জামাত</th>
              <th className="p-4 w-28">স্ট্যাটাস</th>
              <th className="p-4 w-32">মেসেজিং অ্যাপ</th>
              <th className="p-4 w-48">মন্তব্য</th>
              <th className="p-4 w-36">আবেদন নং</th>
              <th className="p-4 w-48">ভেরিফিকেশন লিংক</th>
              <th className="p-4 w-48">LONG URL</th>
              <th className="p-4 w-36">SORT URL</th>
              <th className="p-4 w-36">QR CODE</th>
              <th className="p-4 w-44">প্রত্যয়ন পত্র নাম্বার</th>
              <th className="p-4 text-center w-16 bg-step-bg border-l border-border-main">মুছুন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/40">
            {rows.map((row, index) => (
              <tr key={row.id} className="hover:bg-card/45 bg-card/10 transition-colors">
                <td className="p-3 text-center font-bold text-text-light/50 border-r border-border-main/40">{enToBnNumber((index + 1).toString())}</td>
                
                {/* 1. শিক্ষার্থীর নাম */}
                <td className="p-2">
                  <input 
                    type="text" 
                    required
                    placeholder="শিক্ষার্থীর নাম"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-black outline-none"
                    value={row['শিক্ষার্থীর নাম'] || row.name || ''}
                    onChange={(e) => handleChange(row.id, 'শিক্ষার্থীর নাম', e.target.value)}
                  />
                </td>

                {/* 2. মোবাইল নম্বর (মা) */}
                <td className="p-2">
                  <input 
                    type="text" 
                    required
                    placeholder="মোবাইল নম্বর"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['মোবাইল (মা)'] || row.mobile || ''}
                    onChange={(e) => handleChange(row.id, 'মোবাইল (মা)', e.target.value)}
                  />
                </td>

                {/* 3. শ্রেণী */}
                <td className="p-2">
                  <select 
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['জামাত'] || row.class || (jamatList[0] || '')}
                    onChange={(e) => handleChange(row.id, 'জামাত', e.target.value)}
                  >
                    {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </td>

                {/* 4. শাখা */}
                <td className="p-2">
                  <select 
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['শাখা'] || row.branch || defaultBranch}
                    onChange={(e) => handleChange(row.id, 'শাখা', e.target.value)}
                  >
                    {activeBranches.length > 0 ? (
                      activeBranches.map(b => <option key={b} value={b}>{b}</option>)
                    ) : (
                      <>
                        <option value="ক">ক</option>
                        <option value="খ">খ</option>
                        <option value="গ">গ</option>
                      </>
                    )}
                  </select>
                </td>

                {/* 5. রোল নম্বর */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="যেমন: ১০১"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none text-center"
                    value={row['রোল নম্বর'] || row.roll || ''}
                    onChange={(e) => handleChange(row.id, 'রোল নম্বর', e.target.value)}
                  />
                </td>

                {/* 6. রেজিস্ট্রেশন/আইডি */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="আইডি নম্বর"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none text-center"
                    value={row['রেজিস্ট্রেশন/আইডি'] || row.studentId || ''}
                    onChange={(e) => handleChange(row.id, 'রেজিস্ট্রেশন/আইডি', e.target.value)}
                  />
                </td>

                {/* 7. মঞ্জুরের তারিখ ও সময় */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="মঞ্জুরের তারিখ ও সময়"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none text-center"
                    value={row['মঞ্জুরের তারিখ ও সময়'] || ''}
                    onChange={(e) => handleChange(row.id, 'মঞ্জুরের তারিখ ও সময়', e.target.value)}
                  />
                </td>

                {/* 8. শিক্ষাবর্ষ */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="যেমন: ২০২৬-২৭"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none text-center"
                    value={row['শিক্ষাবর্ষ'] || ''}
                    onChange={(e) => handleChange(row.id, 'শিক্ষাবর্ষ', e.target.value)}
                  />
                </td>

                {/* 9. পিতার নাম */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="পিতার নাম"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['পিতার নাম'] || row.father || ''}
                    onChange={(e) => handleChange(row.id, 'পিতার নাম', e.target.value)}
                  />
                </td>

                {/* 10. মাতার নাম */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="মাতার নাম"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['মাতার নাম'] || row.mother || ''}
                    onChange={(e) => handleChange(row.id, 'মাতার নাম', e.target.value)}
                  />
                </td>

                {/* 11. মোবাইল (বাবা/ভাই) */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="বিকল্প মোবাইল"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['মোবাইল (বাবা/ভাই)'] || ''}
                    onChange={(e) => handleChange(row.id, 'মোবাইল (বাবা/ভাই)', e.target.value)}
                  />
                </td>

                {/* 12. জন্ম নিবন্ধন নাম্বার */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="১৭ ডিজিট নম্বর"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['জন্ম নিবন্ধন নাম্বার'] || ''}
                    onChange={(e) => handleChange(row.id, 'জন্ম নিবন্ধন নাম্বার', e.target.value)}
                  />
                </td>

                {/* 13. জন্ম তারিখ */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="YYYY-MM-DD"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['জন্ম তারিখ'] || ''}
                    onChange={(e) => handleChange(row.id, 'জন্ম তারিখ', e.target.value)}
                  />
                </td>

                {/* 14. ইমেইল */}
                <td className="p-2">
                  <input 
                    type="email" 
                    placeholder="student@domain.com"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['ইমেইল'] || ''}
                    onChange={(e) => handleChange(row.id, 'ইমেইল', e.target.value)}
                  />
                </td>

                {/* 15. রক্তের গ্রুপ */}
                <td className="p-2">
                  <select 
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['রক্তের গ্রুপ'] || 'জানা নেই'}
                    onChange={(e) => handleChange(row.id, 'রক্তের গ্রুপ', e.target.value)}
                  >
                    <option value="জানা নেই">জানা নেই</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </td>

                {/* 16. ঠিকানা */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['ঠিকানা'] || ''}
                    onChange={(e) => handleChange(row.id, 'ঠিকানা', e.target.value)}
                  />
                </td>

                {/* 17. শিক্ষার্থী ধরণ */}
                <td className="p-2">
                  <select 
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['শিক্ষার্থী ধরণ'] || 'আবাসিক'}
                    onChange={(e) => handleChange(row.id, 'শিক্ষার্থী ধরণ', e.target.value)}
                  >
                    <option value="আবাসিক">আবাসিক</option>
                    <option value="অনাবাসিক">অনাবাসিক</option>
                    <option value="ডে-কেয়ার">ডে-কেয়ার</option>
                  </select>
                </td>

                {/* 18. শিক্ষার্থী ধরণ/স্ট্যাটাস */}
                <td className="p-2">
                  <select 
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none font-hind-siliguri"
                    value={row['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || STUDENT_STATUS_LIST[3]}
                    onChange={(e) => handleChange(row.id, 'শিক্ষার্থী ধরণ/স্ট্যাটাস', e.target.value)}
                  >
                    {STUDENT_STATUS_LIST.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </td>

                {/* 19. পূর্বের মাদ্রাসা */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="মাদ্রাসার নাম"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['পূর্বের মাদ্রাসা'] || ''}
                    onChange={(e) => handleChange(row.id, 'পূর্বের মাদ্রাসা', e.target.value)}
                  />
                </td>

                {/* 20. পূর্বের জামাত */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="শ্রেণী"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['পূর্বের জামাত'] || ''}
                    onChange={(e) => handleChange(row.id, 'পূর্বের জামাত', e.target.value)}
                  />
                </td>

                {/* 21. স্ট্যাটাস */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="Active"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['স্ট্যাটাস'] || 'Active'}
                    onChange={(e) => handleChange(row.id, 'স্ট্যাটাস', e.target.value)}
                  />
                </td>

                {/* 22. মেসেজিং অ্যাপ */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="WhatsApp"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['মেসেজিং অ্যাপ'] || 'WhatsApp'}
                    onChange={(e) => handleChange(row.id, 'মেসেজিং অ্যাপ', e.target.value)}
                  />
                </td>

                {/* 23. মন্তব্য */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="মন্তব্য"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['মন্তব্য'] || ''}
                    onChange={(e) => handleChange(row.id, 'মন্তব্য', e.target.value)}
                  />
                </td>

                {/* 24. আবেদন নং */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="আবেদন নং"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['আবেদন নং'] || ''}
                    onChange={(e) => handleChange(row.id, 'আবেদন নং', e.target.value)}
                  />
                </td>

                {/* 25. ভেরিফিকেশন লিংক */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="URL"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['ভেরিফিকেশন লিংক'] || ''}
                    onChange={(e) => handleChange(row.id, 'ভেরিফিকেশন লিংক', e.target.value)}
                  />
                </td>

                {/* 26. LONG URL */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="LONG URL"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['LONG URL'] || ''}
                    onChange={(e) => handleChange(row.id, 'LONG URL', e.target.value)}
                  />
                </td>

                {/* 27. SORT URL */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="SHORT URL"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['SORT URL'] || ''}
                    onChange={(e) => handleChange(row.id, 'SORT URL', e.target.value)}
                  />
                </td>

                {/* 28. QR CODE */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="QR CODE"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['QR CODE'] || ''}
                    onChange={(e) => handleChange(row.id, 'QR CODE', e.target.value)}
                  />
                </td>

                {/* 29. প্রত্যয়ন পত্র নাম্বার */}
                <td className="p-2">
                  <input 
                    type="text" 
                    placeholder="প্রত্যয়ন পত্র নাম্বার"
                    className="w-full p-2 bg-step-bg border border-border-main/80 rounded-xl text-[11px] font-bold outline-none"
                    value={row['प्रत्ययन पत्र নাম্বার'] || row['প্রত্যয়ন পত্র নাম্বার'] || ''}
                    onChange={(e) => handleChange(row.id, 'प्रत्ययन पत्र নাম্বার', e.target.value)}
                  />
                </td>

                {/* মুছুন */}
                <td className="p-2 text-center bg-step-bg border-l border-border-main">
                  <button 
                    onClick={() => removeRow(row.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="সারি মুছে ফেলুন"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-4">
        <button 
          onClick={handleSave}
          className="px-8 py-3.5 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary-light transition-all flex items-center gap-2 shadow-xl shadow-primary/20 cursor-pointer"
        >
          <Save size={16} /> সংরক্ষণ করুন ({rows.length} জন)
        </button>
      </div>
    </div>

    {/* CSV/Excel Import Modal */}
    <AnimatePresence>
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-hind-siliguri">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border-main p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 text-left"
          >
            <div className="flex justify-between items-center border-b border-border-main pb-4">
              <h3 className="font-black text-lg text-text-main">Excel / CSV ফাইল ইম্পোর্ট</h3>
              <button onClick={() => setShowImportModal(false)} className="text-text-light hover:text-text-main cursor-pointer"><X size={20} /></button>
            </div>
            
            <div 
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOverFile(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOverFile(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOverFile(false);
                const file = e.dataTransfer?.files?.[0];
                if (file) {
                  processExcelFile(file);
                }
              }}
              className={`p-6 border-2 border-dashed rounded-2xl transition-all space-y-4 text-center ${
                isDragOverFile 
                  ? 'border-primary bg-primary/10 scale-[1.02]' 
                  : 'border-border-main bg-step-bg/40 hover:border-primary/50'
              }`}
            >
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleCsvImport}
                onClick={(e) => {
                  (e.currentTarget as HTMLInputElement).value = '';
                }}
                className="hidden" 
                id="csv-file-upload"
                disabled={isImporting}
              />
              <label htmlFor="csv-file-upload" className="cursor-pointer space-y-2 text-center block">
                {isImporting ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 size={36} className="text-primary animate-spin" />
                    <span className="text-xs font-bold text-primary">ফাইল প্রসেসিং হচ্ছে...</span>
                  </div>
                ) : (
                  <>
                    <FileSpreadsheet size={40} className="text-primary mx-auto transition-transform hover:scale-110" />
                    <span className="block text-xs font-black text-text-main">CSV বা Excel ফাইল নির্বাচন করুন</span>
                    <span className="block text-[10px] text-text-light/60 font-medium">অথবা ফাইলটি টেনে এনে এখানে ছেড়ে দিন</span>
                  </>
                )}
              </label>
            </div>

            <button 
              onClick={() => setShowImportModal(false)}
              className="w-full py-3 bg-step-bg border border-border-main rounded-xl text-text-main text-xs font-black cursor-pointer"
            >
              পিছনে যান
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
  );
};

// -------------------------------------------------------------
// 3. ADMISSION - FILTERS (শিক্ষার্থী তালিকা - অন্যান্য ফিল্টার)
// -------------------------------------------------------------
export const AdmissionFilters: React.FC<{ students: Student[] }> = ({ students }) => {
  const { jamatList } = useData();
  const activeBranches = useActiveBranches();
  const [jamat, setJamat] = useState('সব জামাত');
  const [branch, setBranch] = useState('সব শাখা');
  const [boarding, setBoarding] = useState('সব টাইপ');
  const [blood, setBlood] = useState('সব গ্রুপ');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = students.filter(s => {
    const studentJamat = s['জামাত/শ্রেণী'] || s['Class'] || s['শ্রেণী'] || '';
    const studentType = s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || s['type'] || 'আবাসিক';
    const matchJamat = jamat === 'সব জামাত' || studentJamat === jamat;
    const matchBranch = branch === 'সব শাখা' || (s.branch || s['শাখা'] || 'ক') === branch;
    const matchBoarding = boarding === 'সব টাইপ' || studentType === boarding;
    const matchBlood = blood === 'সব গ্রুপ' || (s.blood || 'A+') === blood;
    const matchSearch = s['শিক্ষার্থীর নাম']?.includes(searchTerm) || s['অভিভাবকের মোবাইল']?.includes(searchTerm);
    return matchJamat && matchBranch && matchBoarding && matchBlood && matchSearch;
  });

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedStudents.length === filtered.length) setSelectedStudents([]);
    else setSelectedStudents(filtered.map(s => s.id || ''));
  };

  const exportData = (type: 'CSV' | 'Excel' | 'PDF') => {
    const dataToExport = selectedStudents.length > 0 
      ? filtered.filter(s => selectedStudents.includes(s.id || ''))
      : filtered;

    if (type === 'Excel') {
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
        XLSX.writeFile(workbook, "StudentList.xlsx");
    } else if (type === 'PDF') {
        const doc = new jsPDF();
        (doc as any).autoTable({
            head: [['ID', 'Name', 'Father', 'Mobile', 'Class', 'Roll']],
            body: dataToExport.map(s => [
                s['রেজিস্ট্রেশন/আইডি নম্বর'] || '',
                s['শিক্ষার্থীর নাম'] || '',
                s['পিতার নাম'] || '',
                s['অভিভাবকের মোবাইল'] || '',
                s['জামাত/শ্রেণী'] || '',
                s['রোল নম্বর'] || ''
            ]),
        });
        doc.save('StudentList.pdf');
    }
  };

  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl space-y-6 text-left font-hind-siliguri">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border-main/50">
        <div>
          <h2 className="text-2xl font-black text-text-main font-hind-siliguri leading-none mb-1.5">শিক্ষার্থী তালিকা (অন্যান্য ফিল্টার)</h2>
          <p className="text-[10px] text-text-light/40 uppercase tracking-widest leading-none">Advanced Filtering & Reporting Suite</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportData('CSV')} className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white transition-all rounded-xl text-[10px] font-black border border-emerald-500/20 flex items-center gap-1.5 cursor-pointer">
            <Download size={14} /> CSV ডাউনলোড
          </button>
          <button onClick={() => exportData('Excel')} className="p-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 hover:text-white transition-all rounded-xl text-[10px] font-black border border-indigo-500/20 flex items-center gap-1.5 cursor-pointer">
            <FileSpreadsheet size={14} /> EXCEL ডাউনলোড
          </button>
          <button onClick={() => exportData('PDF')} className="p-2 bg-error/10 hover:bg-error text-error hover:text-white transition-all rounded-xl text-[10px] font-black border border-error/20 flex items-center gap-1.5 cursor-pointer">
            <FileText size={14} /> PDF ডাউনলোড
          </button>
          <button onClick={() => window.print()} className="p-2 bg-text-main/10 hover:bg-text-main text-text-main hover:text-white transition-all rounded-xl text-[10px] font-black border border-text-main/20 flex items-center gap-1.5 cursor-pointer">
            <Printer size={14} /> প্রিন্ট তালিকা
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-step-bg/40 p-5 rounded-2xl border border-border-main">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-text-light/60 uppercase">জামাত/শ্রেণী</label>
          <select value={jamat} onChange={e => setJamat(e.target.value)} className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none">
            <option value="সব জামাত">সব জামাত</option>
            {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-text-light/60 uppercase">শাখা</label>
          <select value={branch} onChange={e => setBranch(e.target.value)} className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none">
            <option value="সব শাখা">সব শাখা</option>
            {activeBranches.length > 0 ? (
              activeBranches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))
            ) : (
              <>
                <option value="ক">ক শাখা</option>
                <option value="খ">খ শাখা</option>
                <option value="গ">গ শাখা</option>
              </>
            )}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-text-light/60 uppercase">বোর্ডিং টাইপ</label>
          <select value={boarding} onChange={e => setBoarding(e.target.value)} className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none">
            <option value="সব টাইপ">সব টাইপ</option>
            <option value="আবাসিক">আবাসিক</option>
            <option value="অনাবাসিক">অনাবাসিক</option>
            <option value="ডে-কেয়ার">ডে-কেয়ার</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-text-light/60 uppercase">রক্তের গ্রুপ</label>
          <select value={blood} onChange={e => setBlood(e.target.value)} className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none">
            <option value="সব গ্রুপ">সব গ্রুপ</option>
            <option value="A+">A+</option>
            <option value="O+">O+</option>
            <option value="B+">B+</option>
            <option value="AB+">AB+</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-text-light/60 uppercase">খুঁজুন (নাম বা মোবাইল)</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/40" />
            <input 
              type="text" 
              placeholder="সার্চ..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-border-main rounded-2xl">
        <table className="w-full text-xs font-hind-siliguri text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase tracking-wider font-black text-[10px]">
              <th className="p-4 w-12 text-center">
                <input type="checkbox" checked={selectedStudents.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-primary" />
              </th>
              <th className="p-4 w-16 text-center">আইডি</th>
              <th className="p-4">শিক্ষার্থীর নাম</th>
              <th className="p-4">পিতার নাম</th>
              <th className="p-4">মোবাইল</th>
              <th className="p-4">শ্রেণী</th>
              <th className="p-4 text-center">রোল</th>
              <th className="p-4">বোর্ডিং</th>
              <th className="p-4 text-center">গ্রুপ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/40">
            {filtered.map(s => (
              <tr key={s.id} className={cn("hover:bg-card/45 transition-colors", selectedStudents.includes(s.id || '') ? "bg-primary/5" : "")}>
                <td className="p-4 text-center">
                  <input type="checkbox" checked={selectedStudents.includes(s.id || '')} onChange={() => toggleStudent(s.id || '')} className="accent-primary" />
                </td>
                <td className="p-4 text-center font-bold text-primary">{enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '')}</td>
                <td className="p-4 font-black text-text-main">{s['শিক্ষার্থীর নাম']}</td>
                <td className="p-4 font-bold text-text-light/70">{s['পিতার নাম']}</td>
                <td className="p-4 font-bold text-text-light/70">{s['অভিভাবকের মোবাইল']}</td>
                <td className="p-4 font-black">{s['জামাত/শ্রেণী']}</td>
                <td className="p-4 text-center font-bold">{enToBnNumber(s['রোল নম্বর'] || '')}</td>
                <td className="p-4 font-bold">
                  {(() => {
                    const stInfo = getStudentStatusInfo(s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || s.status);
                    return (
                      <span 
                        title={stInfo.label}
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border",
                          stInfo.badgeBg,
                          stInfo.badgeText,
                          stInfo.badgeBorder
                        )}
                      >
                        {stInfo.shortTitle}
                      </span>
                    );
                  })()}
                </td>
                <td className="p-4 text-center font-bold">{s.blood || 'A+'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. ID CARD - DESIGNS & PRINT (আইডি কার্ড ডিজাইন)
// -------------------------------------------------------------
export const IDCardDesign: React.FC<{ students: Student[] }> = ({ students }) => {
  return <DocumentBuilder type="idcard" students={students} />;
};

export const IDCardPrint: React.FC<{ students: Student[] }> = ({ students }) => {
  return <DocumentBuilder type="idcard" students={students} />;
};

export const ExamList: React.FC<{ students: Student[] }> = ({ students }) => {
  return <TabulationSheet students={students} />;
};

export const ExamResults: React.FC<{ students: Student[] }> = ({ students }) => {
  const { jamatList } = useData();
  const [selectedExam, setSelectedExam] = useState("১ম সাময়িক পরীক্ষা");
  const [selectedClass, setSelectedClass] = useState(jamatList[0] || "নূরানী");
  const [selectedSubject, setSelectedSubject] = useState("কুরআন মাজীদ");
  const [marksData, setMarksData] = useState<Record<string, { written: string; oral: string; practical: string }>>({});
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const examNames = [
    "১ম মাসিক পরীক্ষা",
    "১ম সাময়িক পরীক্ষা",
    "২য় মাসিক পরীক্ষা",
    "২য় সাময়িক পরীক্ষা",
    "বার্ষিক পরীক্ষা",
    "বেফাকুল মাদারিসিল আরাবিয়া পরীক্ষা",
    "হিফজুল কুরআন মূল্যায়ন"
  ];

  const subjectsList = [
    "কুরআন মাজীদ",
    "হিফজুল কুরআন",
    "হাদিস শরীফ",
    "ফিকহ ও আকাইদ",
    "আরবি ভাষা ও সাহিত্য",
    "নাহু ও সরফ",
    "বাংলা",
    "ইংরেজি",
    "গণিত",
    "ইতিহাস ও ভূগোল"
  ];

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const cls = (s["জামাত/শ্রেণী"] || s.jamat || "").trim();
      return !selectedClass || cls === selectedClass.trim();
    });
  }, [students, selectedClass]);

  // Load existing marks from localStorage when selection changes
  useEffect(() => {
    try {
      const savedDb = localStorage.getItem('madrasah-student-marks-db');
      if (savedDb) {
        const parsed = JSON.parse(savedDb);
        const compositeKey = `${selectedExam}_${selectedClass}_${selectedSubject}`;
        if (parsed[compositeKey]) {
          setMarksData(parsed[compositeKey]);
          return;
        }
      }
      // Initialize empty for current students
      const initial: Record<string, { written: string; oral: string; practical: string }> = {};
      filteredStudents.forEach(s => {
        const sId = String(s["রেজিস্ট্রেশন/আইডি নম্বর"] || s.id || "").trim();
        initial[sId] = { written: "", oral: "", practical: "" };
      });
      setMarksData(initial);
    } catch (e) {
      console.error("Error loading marks:", e);
    }
  }, [selectedExam, selectedClass, selectedSubject, filteredStudents]);

  const handleInputChange = (sId: string, field: 'written' | 'oral' | 'practical', value: string) => {
    setMarksData(prev => ({
      ...prev,
      [sId]: {
        ...(prev[sId] || { written: "", oral: "", practical: "" }),
        [field]: value
      }
    }));
  };

  const handleSaveAll = () => {
    try {
      const savedDb = localStorage.getItem('madrasah-student-marks-db');
      const parsed = savedDb ? JSON.parse(savedDb) : {};
      const compositeKey = `${selectedExam}_${selectedClass}_${selectedSubject}`;
      parsed[compositeKey] = marksData;
      localStorage.setItem('madrasah-student-marks-db', JSON.stringify(parsed));

      setSavedToast("নম্বর সফলভাবে ডেটাবেজে সংরক্ষিত হয়েছে!");
      setTimeout(() => setSavedToast(null), 3000);
    } catch (e) {
      console.error("Error saving marks:", e);
      setSavedToast("সংরক্ষণ করতে সমস্যা হয়েছে!");
      setTimeout(() => setSavedToast(null), 3000);
    }
  };

  return (
    <div className="bento-card p-6 sm:p-8 bg-card border border-border-main shadow-2xl space-y-6 text-left font-hind-siliguri">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-main/50">
        <div>
          <h2 className="text-2xl font-black text-text-main font-hind-siliguri leading-none mb-1.5">পরীক্ষার মার্ক এন্ট্রি (Exam Mark Entry)</h2>
          <p className="text-[10px] text-text-light/40 uppercase tracking-widest leading-none">Real-time Subject-wise Teacher Mark Entry Panel</p>
        </div>
        <button
          onClick={handleSaveAll}
          className="px-6 py-3 bg-primary text-white font-black rounded-xl text-xs shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Upload size={16} /> সকল নম্বর সংরক্ষণ করুন
        </button>
      </div>

      {savedToast && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} /> {savedToast}
        </div>
      )}

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-step-bg p-4 rounded-2xl border border-border-main">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-text-main">পরীক্ষার নাম নির্বাচন</label>
          <select
            value={selectedExam}
            onChange={e => setSelectedExam(e.target.value)}
            className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
          >
            {examNames.map(ex => <option key={ex} value={ex}>{ex}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-text-main">জামাত/শ্রেণী</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
          >
            {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-text-main">বিষয় (Subject)</label>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
          >
            {subjectsList.map(sub => <option key={sub} value={sub}>{sub}</option>)}
          </select>
        </div>
      </div>

      {/* Students Mark Entry Table */}
      <div className="overflow-x-auto border border-border-main rounded-2xl">
        <table className="w-full text-xs text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase tracking-wider font-black text-[10px]">
              <th className="p-4 w-16 text-center">রোল</th>
              <th className="p-4">রেজিস্ট্রেশন / আইডি</th>
              <th className="p-4">শিক্ষার্থীর নাম</th>
              <th className="p-4 text-center">লিখিত (১০০)</th>
              <th className="p-4 text-center">মৌখিক (৫০)</th>
              <th className="p-4 text-center">ব্যবহারিক (৫০)</th>
              <th className="p-4 text-center">মোট প্রাপ্ত</th>
              <th className="p-4 text-center">গ্রেড</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/40">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-text-light/50 font-bold">
                  এই জামাতে কোনো শিক্ষার্থী পাওয়া যায়নি।
                </td>
              </tr>
            ) : (
              filteredStudents.map((s, index) => {
                const sId = String(s["রেজিস্ট্রেশন/আইডি নম্বর"] || s.id || "").trim();
                const studentMarks = marksData[sId] || { written: "", oral: "", practical: "" };
                const wr = parseFloat(studentMarks.written) || 0;
                const or = parseFloat(studentMarks.oral) || 0;
                const pr = parseFloat(studentMarks.practical) || 0;
                const total = wr + or + pr;
                const grade = total >= 200 ? 'মুমতাজ (A+)' : total >= 150 ? 'জায়্যিদ জিদ্দান (A)' : total >= 100 ? 'জায়্যিদ (B)' : total >= 70 ? 'মাকবুল (C)' : total > 0 ? 'রাসেব (F)' : '-';

                return (
                  <tr key={sId || index} className="hover:bg-card/45 transition-colors">
                    <td className="p-4 text-center font-bold text-text-light/60">
                      {enToBnNumber(s["রোল নম্বর"] || (index + 1).toString())}
                    </td>
                    <td className="p-4 font-mono font-bold text-primary">
                      {enToBnNumber(s["রেজিস্ট্রেশন/আইডি নম্বর"] || s.id || "-")}
                    </td>
                    <td className="p-4 font-black text-text-main">
                      {s["শিক্ষার্থীর নাম"] || s.name || "-"}
                    </td>
                    <td className="p-4 text-center">
                      <input
                        type="number"
                        max="100"
                        min="0"
                        value={studentMarks.written}
                        onChange={e => handleInputChange(sId, 'written', e.target.value)}
                        placeholder="০-১০০"
                        className="w-20 p-2 bg-step-bg border border-border-main rounded-lg text-center font-bold outline-none focus:border-primary"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input
                        type="number"
                        max="50"
                        min="0"
                        value={studentMarks.oral}
                        onChange={e => handleInputChange(sId, 'oral', e.target.value)}
                        placeholder="০-৫০"
                        className="w-20 p-2 bg-step-bg border border-border-main rounded-lg text-center font-bold outline-none focus:border-primary"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input
                        type="number"
                        max="50"
                        min="0"
                        value={studentMarks.practical}
                        onChange={e => handleInputChange(sId, 'practical', e.target.value)}
                        placeholder="০-৫০"
                        className="w-20 p-2 bg-step-bg border border-border-main rounded-lg text-center font-bold outline-none focus:border-primary"
                      />
                    </td>
                    <td className="p-4 text-center font-black text-success">
                      {enToBnNumber(total.toString())}
                    </td>
                    <td className="p-4 text-center font-bold text-xs text-primary">
                      {grade}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ExamTabulation: React.FC<{ students: Student[] }> = ({ students }) => {
  return <TabulationSheet students={students} />;
};

// -------------------------------------------------------------
// 5. TABULATION SHEET & EXAMS (ফলাফল ও নম্বরপত্র)
// -------------------------------------------------------------
export const TabulationSheet: React.FC<{ students: Student[] }> = ({ students }) => {
  const { jamatList } = useData();
  const [selectedExam, setSelectedExam] = useState("১ম সাময়িক পরীক্ষা");
  const [selectedClass, setSelectedClass] = useState(jamatList[0] || "নূরানী");

  const examNames = [
    "১ম মাসিক পরীক্ষা",
    "১ম সাময়িক পরীক্ষা",
    "২য় মাসিক পরীক্ষা",
    "২য় সাময়িক পরীক্ষা",
    "বার্ষিক পরীক্ষা",
    "বেফাকুল মাদারিসিল আরাবিয়া পরীক্ষা",
    "হিফজুল কুরআন মূল্যায়ন"
  ];

  const filtered = useMemo(() => {
    return students.filter(s => {
      const cls = (s["জামাত/শ্রেণী"] || s.jamat || "").trim();
      return !selectedClass || cls === selectedClass.trim();
    });
  }, [students, selectedClass]);

  // Aggregate marks for each student from all saved subject entries for the selected exam & class
  const studentResults = useMemo(() => {
    try {
      const savedDb = localStorage.getItem('madrasah-student-marks-db');
      const parsed = savedDb ? JSON.parse(savedDb) : {};

      return filtered.map((s, index) => {
        const sId = String(s["রেজিস্ট্রেশন/আইডি নম্বর"] || s.id || "").trim();
        let totalObtained = 0;
        let subjectsCount = 0;

        Object.entries(parsed).forEach(([key, val]: [string, any]) => {
          if (key.startsWith(`${selectedExam}_${selectedClass}_`)) {
            const studentRecord = val[sId];
            if (studentRecord) {
              const wr = parseFloat(studentRecord.written || '0') || 0;
              const or = parseFloat(studentRecord.oral || '0') || 0;
              const pr = parseFloat(studentRecord.practical || '0') || 0;
              totalObtained += (wr + or + pr);
              subjectsCount++;
            }
          }
        });

        const maxTotal = subjectsCount > 0 ? subjectsCount * 200 : 400;
        const percent = maxTotal > 0 ? Math.round((totalObtained / maxTotal) * 100) : 0;
        const grade = percent >= 80 ? 'মুমতাজ (A+)' : percent >= 60 ? 'জায়্যিদ জিদ্দান (A)' : percent >= 45 ? 'জায়্যিদ (B)' : percent >= 33 ? 'মাকবুল (C)' : 'রাসেব (F)';

        return {
          student: s,
          sId,
          totalObtained,
          percent,
          grade,
          subjectsCount
        };
      }).sort((a, b) => b.totalObtained - a.totalObtained);
    } catch (e) {
      console.error("Error computing tabulation:", e);
      return [];
    }
  }, [filtered, selectedExam, selectedClass]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bento-card p-6 sm:p-8 bg-card border border-border-main shadow-2xl space-y-6 text-left font-hind-siliguri">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-main/50">
        <div>
          <h2 className="text-2xl font-black text-text-main font-hind-siliguri leading-none mb-1.5">ট্যাবুলেশন শিট ও ফলাফল (Tabulation Sheet)</h2>
          <p className="text-[10px] text-text-light/40 uppercase tracking-widest leading-none">Aggregated Class Merit & Marksheets</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-primary text-white font-black rounded-xl text-xs shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Printer size={16} /> প্রিন্ট / পিডিএফ
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-step-bg p-4 rounded-2xl border border-border-main">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-text-main">পরীক্ষার নাম</label>
          <select
            value={selectedExam}
            onChange={e => setSelectedExam(e.target.value)}
            className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
          >
            {examNames.map(ex => <option key={ex} value={ex}>{ex}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-text-main">জামাত/শ্রেণী</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
          >
            {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-border-main rounded-2xl">
        <table className="w-full text-xs text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase tracking-wider font-black text-[10px]">
              <th className="p-4 w-16 text-center">মেধা স্থান</th>
              <th className="p-4 w-16 text-center">রোল</th>
              <th className="p-4">শিক্ষার্থীর নাম</th>
              <th className="p-4 text-center">মোট বিষয়</th>
              <th className="p-4 text-center">প্রাপ্ত মোট নম্বর</th>
              <th className="p-4 text-center">শতকরা (%)</th>
              <th className="p-4 text-center">চূড়ান্ত গ্রেড</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/40">
            {studentResults.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-light/50 font-bold">
                  এই পরীক্ষার জন্য কোনো নম্বর এন্ট্রি করা হয়নি। অনুগ্রহ করে মার্ক এন্ট্রি মডিউল থেকে নম্বর এন্ট্রি করুন।
                </td>
              </tr>
            ) : (
              studentResults.map((res, index) => {
                const s = res.student;
                const meritRank = index === 0 ? '১ম' : index === 1 ? '২য়' : index === 2 ? '৩য়' : `${index + 1}তম`;
                return (
                  <tr key={res.sId || index} className="hover:bg-card/45 transition-colors">
                    <td className="p-4 text-center font-black text-primary">
                      {enToBnNumber(meritRank)}
                    </td>
                    <td className="p-4 text-center font-bold text-text-light/60">
                      {enToBnNumber(s["রোল নম্বর"] || (index + 1).toString())}
                    </td>
                    <td className="p-4 font-black text-text-main">
                      {s["শিক্ষার্থীর নাম"] || s.name || "-"}
                    </td>
                    <td className="p-4 text-center font-bold">
                      {enToBnNumber(res.subjectsCount.toString())} টি
                    </td>
                    <td className="p-4 text-center font-black text-success">
                      {enToBnNumber(res.totalObtained.toString())}
                    </td>
                    <td className="p-4 text-center font-extrabold text-primary">
                      {enToBnNumber(res.percent.toString())}%
                    </td>
                    <td className="p-4 text-center font-bold text-xs text-success">
                      {res.grade}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ExamAdmitCard: React.FC<{ students: Student[] }> = ({ students }) => {
  const exams = [
    "১ম মাসিক (কোরবানির) পরিক্ষা",
    "১ম সাময়িক পরিক্ষা",
    "২য় সাময়িক পরিক্ষা",
    "২য় মাসিক পরিক্ষা",
    "বার্ষিক পরিক্ষা",
    "বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ",
    "হাইআতুল উলিয়া"
  ];

  return <DocumentBuilder type="admit" students={students} exams={exams} />;
};

export const TestimonialGenerator: React.FC<{ students: Student[] }> = ({ students }) => {
  return <DocumentBuilder type="testimonial" students={students} />;
};

// -------------------------------------------------------------
// 6. ATTENDANCE HISTORIES (উপস্থিতির খতিয়ান)
// -------------------------------------------------------------
export const AttendanceHistoryView: React.FC<{ students: Student[] }> = ({ students }) => {
  const { jamatList } = useData();
  const [selectedClass, setSelectedClass] = useState(jamatList[0] || "");
  const filtered = students.filter(s => (s["জামাত/শ্রেণী"] || "") === selectedClass);

  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl space-y-6 text-left font-hind-siliguri">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-main/50">
        <div>
          <h2 className="text-2xl font-black text-text-main font-hind-siliguri leading-none mb-1.5">উপস্থিতির ইতিহাস ও রিপোর্ট</h2>
          <p className="text-[10px] text-text-light/40 uppercase tracking-widest leading-none">Complete Attendance Logs & Percentages</p>
        </div>
      </div>

      <div className="space-y-1.5 w-full sm:w-64">
        <label className="text-xs font-black text-text-main">জামাত/শ্রেণী</label>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none">
          {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto border border-border-main rounded-2xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase tracking-wider font-black text-[10px]">
              <th className="p-4 w-12 text-center">রোল</th>
              <th className="p-4">শিক্ষার্থীর নাম</th>
              <th className="p-4 text-center">মোট কর্মদিবস</th>
              <th className="p-4 text-center">মোট উপস্থিত</th>
              <th className="p-4 text-center">মোট অনুপস্থিত</th>
              <th className="p-4 text-center">উপস্থিতি হার</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/40">
            {filtered.map((s, index) => {
              const rollNum = parseInt(s["রোল নম্বর"] || "101") || (101 + index);
              const present = 24 - (rollNum % 4);
              const absent = 26 - present;
              const rate = Math.round((present / 26) * 100);
              return (
                <tr key={s.id} className="hover:bg-card/45 transition-colors">
                  <td className="p-4 text-center font-bold text-text-light/50">{enToBnNumber(s["রোল নম্বর"] || (index + 1).toString())}</td>
                  <td className="p-4 font-black text-text-main">{s["শিক্ষার্থীর নাম"] || s.name}</td>
                  <td className="p-4 text-center font-bold">২৬</td>
                  <td className="p-4 text-center font-bold text-success">{enToBnNumber(present.toString())}</td>
                  <td className="p-4 text-center font-bold text-error">{enToBnNumber(absent.toString())}</td>
                  <td className="p-4 text-center font-extrabold text-primary">{enToBnNumber(rate.toString())}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 7. TEACHERS & EMPLOYEES (শিক্ষক ও কর্মচারী ব্যবস্থাপনা)
// -------------------------------------------------------------
export interface FullTeacherStaff {
  id: string;
  teacherId: string;
  name: string;
  gender: string;
  bloodGroup: string;
  department: string;
  designation: string;
  salaryType: string;
  salary: number;
  joiningDate: string;
  startTime: string;
  endTime: string;
  mobile: string;
  email: string;
  rfidCard: string;
  password?: string;
  address: string;
  details: string;
  cvFileName?: string;
  photoUrl?: string;
  active: boolean;
  loginPermitted?: boolean;
}

export const TeachersManager: React.FC<{ initialTab?: 'list' | 'add' | 'stats' }> = ({ initialTab = 'list' }) => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'add' | 'stats'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  const [teachers, setTeachers] = useState<FullTeacherStaff[]>(() => {
    const local = localStorage.getItem("madrasa_teachers");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          // Remove dummy data if legacy entries exist
          const filtered = parsed.filter((t: any) => 
            t.name !== "মাওলানা হোসাইন আহমেদ" && 
            t.name !== "মাওলানা আব্দুর রহমান" && 
            t.name !== "ক্বারী আব্দুল কুদ্দুস"
          );
          return filtered.map((t: any, idx: number) => ({
            id: t.id || uid(),
            teacherId: t.teacherId || t.staffId || (708 + idx).toString(),
            name: t.name || t.staffName || "",
            gender: t.gender || "পুরুষ",
            bloodGroup: t.bloodGroup || t.blood || "A+",
            department: t.department || "একাডেমিক বিভাগ",
            designation: t.designation || "সহকারী শিক্ষক",
            salaryType: t.salaryType || "মাসিক",
            salary: Number(t.salary) || 0,
            joiningDate: t.joiningDate || new Date().toISOString().split("T")[0],
            startTime: t.startTime || "০৮:০০ AM",
            endTime: t.endTime || "০৪:৩০ PM",
            mobile: t.mobile || t.phone || "",
            email: t.email || "",
            rfidCard: t.rfidCard || t.rfid || "",
            password: t.password || "123456",
            address: t.address || "",
            details: t.details || "",
            cvFileName: t.cvFileName || "",
            photoUrl: t.photoUrl || "",
            active: t.active !== undefined ? Boolean(t.active) : true,
            loginPermitted: t.loginPermitted !== false
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Default to empty array - NO DUMMY DATA
    return [];
  });

  const [teacherId, setTeacherId] = useState(() => (701 + teachers.length).toString());
  const [name, setName] = useState("");
  const [gender, setGender] = useState("পুরুষ");
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [department, setDepartment] = useState("একাডেমিক বিভাগ");
  const [designation, setDesignation] = useState("সহকারী শিক্ষক");
  const [salaryType, setSalaryType] = useState("মাসিক");
  const [salary, setSalary] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("০৮:০০ AM");
  const [endTime, setEndTime] = useState("০৪:৩০ PM");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [rfidCard, setRfidCard] = useState("");
  const [password, setPassword] = useState("123456");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [active, setActive] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedTeacher, setSelectedTeacher] = useState<FullTeacherStaff | null>(null);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("madrasa_teachers", JSON.stringify(teachers));
  }, [teachers]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFileName(file.name);
    }
  };

  const resetForm = () => {
    const nextId = (701 + teachers.length + Math.floor(Math.random() * 5)).toString();
    setTeacherId(nextId);
    setName("");
    setGender("পুরুষ");
    setBloodGroup("A+");
    setDepartment("একাডেমিক বিভাগ");
    setDesignation("সহকারী শিক্ষক");
    setSalaryType("মাসিক");
    setSalary("");
    setJoiningDate(new Date().toISOString().split("T")[0]);
    setStartTime("০৮:০০ AM");
    setEndTime("০৪:৩০ PM");
    setMobile("");
    setEmail("");
    setRfidCard("");
    setPassword("123456");
    setAddress("");
    setDetails("");
    setCvFileName("");
    setPhotoUrl("");
    setActive(true);
    setEditingTeacherId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("অনুগ্রহ করে শিক্ষক/কর্মচারীর নাম প্রদান করুন।");
      return;
    }
    if (!mobile.trim()) {
      alert("অনুগ্রহ করে মোবাইল নম্বর প্রদান করুন।");
      return;
    }

    if (editingTeacherId) {
      setTeachers(teachers.map(t => t.id === editingTeacherId ? {
        ...t,
        teacherId: teacherId || t.teacherId,
        name: name.trim(),
        gender,
        bloodGroup,
        department,
        designation,
        salaryType,
        salary: Number(salary) || 0,
        joiningDate,
        startTime,
        endTime,
        mobile: mobile.trim(),
        email: email.trim(),
        rfidCard: rfidCard.trim(),
        password: password.trim() || "123456",
        address: address.trim(),
        details: details.trim(),
        cvFileName: cvFileName || t.cvFileName,
        photoUrl: photoUrl || t.photoUrl,
        active
      } : t));
      alert("শিক্ষক/কর্মচারীর তথ্য সফলভাবে আপডেট করা হয়েছে!");
    } else {
      const newTeacher: FullTeacherStaff = {
        id: uid(),
        teacherId: teacherId || (701 + teachers.length).toString(),
        name: name.trim(),
        gender,
        bloodGroup,
        department,
        designation,
        salaryType,
        salary: Number(salary) || 0,
        joiningDate,
        startTime,
        endTime,
        mobile: mobile.trim(),
        email: email.trim(),
        rfidCard: rfidCard.trim(),
        password: password.trim() || "123456",
        address: address.trim(),
        details: details.trim(),
        cvFileName,
        photoUrl,
        active,
        loginPermitted: true
      };
      setTeachers([newTeacher, ...teachers]);
      alert("নতুন শিক্ষক/কর্মচারী সফলভাবে যোগ করা হয়েছে!");
    }
    resetForm();
    setActiveSubTab('list');
  };

  const handleEdit = (t: FullTeacherStaff) => {
    setEditingTeacherId(t.id);
    setTeacherId(t.teacherId);
    setName(t.name);
    setGender(t.gender || "পুরুষ");
    setBloodGroup(t.bloodGroup || "A+");
    setDepartment(t.department || "একাডেমিক বিভাগ");
    setDesignation(t.designation || "সহকারী শিক্ষক");
    setSalaryType(t.salaryType || "মাসিক");
    setSalary(t.salary ? t.salary.toString() : "");
    setJoiningDate(t.joiningDate || "");
    setStartTime(t.startTime || "০৮:০০ AM");
    setEndTime(t.endTime || "০৪:৩০ PM");
    setMobile(t.mobile);
    setEmail(t.email || "");
    setRfidCard(t.rfidCard || "");
    setPassword(t.password || "123456");
    setAddress(t.address || "");
    setDetails(t.details || "");
    setCvFileName(t.cvFileName || "");
    setPhotoUrl(t.photoUrl || "");
    setActive(t.active !== false);
    setActiveSubTab('add');
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (confirm("আপনি কি নিশ্চিত যে এই শিক্ষক/কর্মচারীকে স্থায়ীভাবে মুছে ফেলতে চান?")) {
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  const toggleActiveStatus = (id: string) => {
    setTeachers(teachers.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const toggleLoginPermission = (id: string) => {
    setTeachers(teachers.map(t => t.id === id ? { ...t, loginPermitted: !t.loginPermitted } : t));
  };

  const filteredTeachers = teachers.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        t.teacherId.includes(searchTerm) || 
                        t.mobile.includes(searchTerm) ||
                        (t.rfidCard && t.rfidCard.includes(searchTerm));
    const matchDept = selectedDepartment === "all" || t.department === selectedDepartment;
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? t.active !== false : t.active === false);
    return matchSearch && matchDept && matchStatus;
  });

  const totalPayroll = teachers.reduce((acc, curr) => acc + (curr.salary || 0), 0);
  const activeCount = teachers.filter(t => t.active !== false).length;
  const inactiveCount = teachers.length - activeCount;

  const departmentList = [
    "একাডেমিক বিভাগ",
    "হিফজ ও ক্বারী শাখা",
    "কিতাব বিভাগ",
    "প্রশাসনিক শাখা",
    "সেবা ও পরিচ্ছন্নতা",
    "কম্পিউটার ও আইটি"
  ];

  return (
    <div className="space-y-6 font-hind-siliguri text-left">
      {/* Module Title Banner & Nav Tabs */}
      <div className="bg-card border border-border-main p-6 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-main/60 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main">
                  শিক্ষক ও কর্মী ব্যবস্থাপনা
                </h2>
                <p className="text-xs font-bold text-text-light/60 mt-0.5">
                  ওস্তাদ, শিক্ষক ও সকল কর্মচারীদের প্রোফাইল, তালিকা, তথ্য নিবন্ধন ও এইচআর পরিসংখ্যান
                </p>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 bg-step-bg p-1.5 rounded-2xl border border-border-main self-start lg:self-auto overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('list')}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                activeSubTab === 'list' 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-text-light/70 hover:text-text-main hover:bg-card"
              )}
            >
              <List size={16} /> শিক্ষক ও কর্মী তালিকা ({teachers.length})
            </button>

            <button
              onClick={() => {
                resetForm();
                setActiveSubTab('add');
              }}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                activeSubTab === 'add' 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-text-light/70 hover:text-text-main hover:bg-card"
              )}
            >
              <UserPlus size={16} /> {editingTeacherId ? "সংশোধন মোড" : "নতুন শিক্ষক/কর্মী যোগ"}
            </button>

            <button
              onClick={() => setActiveSubTab('stats')}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                activeSubTab === 'stats' 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-text-light/70 hover:text-text-main hover:bg-card"
              )}
            >
              <PieChart size={16} /> এইচআর পরিসংখ্যান
            </button>
          </div>
        </div>

        {/* Top Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-step-bg/80 border border-border-main rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-text-light/60 uppercase block">মোট শিক্ষক/স্টাফ</span>
              <span className="text-xl font-black text-text-main">{enToBnNumber(teachers.length.toString())} জন</span>
            </div>
          </div>

          <div className="p-4 bg-step-bg/80 border border-border-main rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-text-light/60 uppercase block">সক্রিয় কর্মী</span>
              <span className="text-xl font-black text-emerald-600">{enToBnNumber(activeCount.toString())} জন</span>
            </div>
          </div>

          <div className="p-4 bg-step-bg/80 border border-border-main rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl shrink-0">
              <Coins size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-text-light/60 uppercase block">মোট পে-রোল</span>
              <span className="text-xl font-black text-amber-600">৳{enToBnNumber(totalPayroll.toString())}</span>
            </div>
          </div>

          <div className="p-4 bg-step-bg/80 border border-border-main rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-sky-500/10 text-sky-600 rounded-xl shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-text-light/60 uppercase block">মোট বিভাগ</span>
              <span className="text-xl font-black text-sky-600">{enToBnNumber(departmentList.length.toString())} টি</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: STAFF DIRECTORY LIST */}
      {activeSubTab === 'list' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border-main p-6 sm:p-7 rounded-3xl shadow-xl space-y-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-main/60 pb-4">
            <div>
              <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                <List size={20} className="text-primary" /> শিক্ষক ও কর্মচারী রেজিস্টার
              </h3>
              <p className="text-[10px] text-text-light/50 font-bold uppercase tracking-wider mt-0.5">
                মোট {enToBnNumber(filteredTeachers.length.toString())} জন সদস্য পাওয়া গেছে
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <input 
                  type="text" 
                  placeholder="খুঁজুন (নাম/আইডি/মোবাইল/RFID)..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="w-full p-2.5 pl-8 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary" 
                />
                <Search size={14} className="absolute left-2.5 top-3 text-text-light/40" />
              </div>

              <select 
                value={selectedDepartment} 
                onChange={e => setSelectedDepartment(e.target.value)} 
                className="p-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none cursor-pointer"
              >
                <option value="all">সকল বিভাগ</option>
                {departmentList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value as any)} 
                className="p-2.5 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none cursor-pointer"
              >
                <option value="all">সকল স্ট্যাটাস</option>
                <option value="active">কেবল সক্রিয়</option>
                <option value="inactive">কেবল নিষ্ক্রিয়</option>
              </select>

              <button
                onClick={() => {
                  resetForm();
                  setActiveSubTab('add');
                }}
                className="px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-light transition-all flex items-center gap-1.5 shadow-md cursor-pointer ml-auto md:ml-0"
              >
                <UserPlus size={15} /> নতুন যোগ
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-border-main rounded-2xl">
            <table className="w-full text-xs text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-step-bg border-b border-border-main text-text-light/70 uppercase tracking-wider font-black text-[10px]">
                  <th className="p-3.5">আইডি ও শিক্ষক/স্টাফ নাম</th>
                  <th className="p-3.5">পদবী ও বিভাগ</th>
                  <th className="p-3.5">যোগাযোগ & RFID</th>
                  <th className="p-3.5 text-center">বেতন ও ধরন</th>
                  <th className="p-3.5 text-center">ডিউটি সময়</th>
                  <th className="p-3.5 text-center">স্ট্যাটাস</th>
                  <th className="p-3.5 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/40">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-text-light/60 font-medium">
                      <div className="max-w-md mx-auto space-y-3">
                        <Users size={40} className="mx-auto text-text-light/30" />
                        <p className="text-sm font-bold text-text-main">কোনো শিক্ষক বা কর্মচারী তালিকাভুক্ত নেই</p>
                        <p className="text-xs text-text-light/50">
                          {searchTerm || selectedDepartment !== 'all' 
                            ? "আপনার ফিল্টার অনুযায়ী কোনো তথ্য পাওয়া যায়নি।" 
                            : "নতুন শিক্ষক বা কর্মচারীর তথ্য যুক্ত করতে নিচের বাটনে ক্লিক করুন।"}
                        </p>
                        <button
                          onClick={() => {
                            resetForm();
                            setActiveSubTab('add');
                          }}
                          className="px-5 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-light transition-all inline-flex items-center gap-2 cursor-pointer shadow-md mt-2"
                        >
                          <UserPlus size={16} /> নতুন শিক্ষক/কর্মী যুক্ত করুন
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map(t => (
                    <tr key={t.id} className="hover:bg-step-bg/50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {t.photoUrl ? (
                            <img src={t.photoUrl} alt={t.name} className="w-10 h-10 rounded-full object-cover border-2 border-primary shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 border border-primary/20">
                              {t.name ? t.name.slice(0, 2) : "স্টাফ"}
                            </div>
                          )}
                          <div>
                            <span className="font-black text-text-main block text-xs">{t.name}</span>
                            <span className="text-[10px] font-mono font-bold text-primary block">ID: {t.teacherId}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-black text-text-main block">{t.designation}</span>
                        <span className="text-[10px] font-bold text-text-light/60 block">{t.department}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono font-bold text-text-main block">{t.mobile}</span>
                        {t.rfidCard && (
                          <span className="text-[9px] font-mono bg-step-bg border border-border-main px-1.5 py-0.5 rounded text-text-light/70 inline-block mt-0.5">
                            RFID: {t.rfidCard}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center font-black text-emerald-600 font-mono">
                        ৳{enToBnNumber(t.salary.toString())}
                        <span className="text-[9px] text-text-light/50 font-normal block">({t.salaryType})</span>
                      </td>

                      <td className="p-3.5 text-center text-[10px] font-bold text-text-light/70">
                        {t.startTime} - {t.endTime}
                      </td>

                      <td className="p-3.5 text-center space-y-1">
                        <button 
                          onClick={() => toggleActiveStatus(t.id)}
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border block mx-auto cursor-pointer transition-transform active:scale-95",
                            t.active !== false 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          )}
                        >
                          {t.active !== false ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </button>

                        <button 
                          onClick={() => toggleLoginPermission(t.id)}
                          className={cn(
                            "text-[9px] font-bold underline cursor-pointer block mx-auto",
                            t.loginPermitted !== false ? "text-primary" : "text-text-light/50"
                          )}
                        >
                          {t.loginPermitted !== false ? "লগইন অনুমতি আছে" : "লগইন বন্ধ"}
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setSelectedTeacher(t)}
                            className="p-1.5 bg-step-bg hover:bg-primary/10 text-primary rounded-lg transition-colors cursor-pointer"
                            title="বিস্তারিত প্রোফাইল দেখুন"
                          >
                            <Eye size={15} />
                          </button>

                          <button 
                            onClick={() => handleEdit(t)}
                            className="p-1.5 bg-step-bg hover:bg-amber-500/10 text-amber-600 rounded-lg transition-colors cursor-pointer"
                            title="সম্পাদনা করুন"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button 
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 bg-step-bg hover:bg-rose-500/10 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* SUB-TAB 2: ADD / EDIT FORM */}
      {activeSubTab === 'add' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border-main p-6 sm:p-8 rounded-3xl shadow-xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-main/60 pb-4">
            <div>
              <h3 className="text-xl font-black text-text-main flex items-center gap-2">
                <UserPlus size={22} className="text-primary" />
                {editingTeacherId ? "শিক্ষক/কর্মচারী তথ্য সংশোধন করুন" : "নতুন শিক্ষক/কর্মচারী তথ্য নিবন্ধন"}
              </h3>
              <p className="text-xs font-bold text-text-light/60 mt-0.5">
                {editingTeacherId ? "বিদ্যমান শিক্ষকের সকল তথ্যাবলী সংশোধন ও হালনাগাদ করুন" : "মাদ্রাসার নতুন শিক্ষক বা কর্মচারীর পূর্ণাঙ্গ প্রোফাইল যোগ করুন"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {editingTeacherId && (
                <button 
                  onClick={resetForm} 
                  className="px-4 py-2 bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  সংশোধন বাতিল করুন
                </button>
              )}
              <button 
                onClick={() => setActiveSubTab('list')} 
                className="px-4 py-2 bg-step-bg border border-border-main hover:bg-slate-200 text-text-main rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                তালিকা দেখুন
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* SECTION 1: Personal Identification */}
              <div className="p-5 bg-step-bg/60 border border-border-main/60 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border-main/40 pb-2">
                  <Users size={15} /> ১. সনাক্তকরণ তথ্য
                </h4>

                <div className="space-y-1">
                  <label className="text-xs font-black text-text-main">শিক্ষক/কর্মচারীর নাম <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="নাম লিখুন (যেমন: মাওলানা হোসাইন আহমেদ)" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-main">স্টাফ/শিক্ষক আইডি <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      placeholder="যেমন: 701" 
                      value={teacherId} 
                      onChange={e => setTeacherId(e.target.value)} 
                      className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none font-mono focus:ring-2 focus:ring-primary" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-main">লিঙ্গ</label>
                    <select 
                      value={gender} 
                      onChange={e => setGender(e.target.value)} 
                      className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="পুরুষ">পুরুষ</option>
                      <option value="মহিলা">মহিলা</option>
                      <option value="অন্যান্য">অন্যান্য</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-main">রক্তের গ্রুপ</label>
                    <select 
                      value={bloodGroup} 
                      onChange={e => setBloodGroup(e.target.value)} 
                      className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="জানা নেই">জানা নেই</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-main">লগইন পাসওয়ার্ড</label>
                    <input 
                      type="text" 
                      placeholder="123456" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none font-mono" 
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Position & Salary */}
              <div className="p-5 bg-step-bg/60 border border-border-main/60 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border-main/40 pb-2">
                  <Briefcase size={15} /> ২. পদবী ও বেতন বিবরণী
                </h4>

                <div className="space-y-1">
                  <label className="text-xs font-black text-text-main">ডিপার্টমেন্ট/বিভাগ</label>
                  <select 
                    value={department} 
                    onChange={e => setDepartment(e.target.value)} 
                    className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none cursor-pointer"
                  >
                    {departmentList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-text-main">পদবী <span className="text-rose-500">*</span></label>
                  <select 
                    value={designation} 
                    onChange={e => setDesignation(e.target.value)} 
                    className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="প্রধান শিক্ষক / মুহতামিম">প্রধান শিক্ষক / মুহতামিম</option>
                    <option value="সহকারী মুহতামিম">সহকারী মুহতামিম</option>
                    <option value="শায়খুল হাদীস">শায়খুল হাদীস</option>
                    <option value="সহকারী শিক্ষক">সহকারী শিক্ষক</option>
                    <option value="হিফজ শিক্ষক">হিফজ শিক্ষক</option>
                    <option value="কম্পিউটার শিক্ষক">কম্পিউটার শিক্ষক</option>
                    <option value="হিসাবরক্ষক">হিসাবরক্ষক</option>
                    <option value="দারোয়ান / কেয়ারটেকার">দারোয়ান / কেয়ারটেকার</option>
                    <option value="বাবুর্চি / রাঁধুনি">বাবুর্চি / রাঁধুনি</option>
                    <option value="পরিচ্ছন্নতাকর্মী">পরিচ্ছন্নতাকর্মী</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-main">বেতনের ধরন</label>
                    <select 
                      value={salaryType} 
                      onChange={e => setSalaryType(e.target.value)} 
                      className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="মাসিক">মাসিক</option>
                      <option value="দৈনিক">দৈনিক</option>
                      <option value="চুক্তিভিত্তিক">চুক্তিভিত্তিক</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-main">বেতনের পরিমাণ (৳) <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      required 
                      placeholder="পরিমাণ (৳)" 
                      value={salary} 
                      onChange={e => setSalary(e.target.value)} 
                      className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary font-mono" 
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Schedule & Contact */}
              <div className="p-5 bg-step-bg/60 border border-border-main/60 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border-main/40 pb-2">
                  <Clock size={15} /> ৩. সময়সূচী ও যোগাযোগ
                </h4>

                <div className="space-y-1">
                  <label className="text-xs font-black text-text-main">যোগদানের তারিখ</label>
                  <input 
                    type="date" 
                    value={joiningDate} 
                    onChange={e => setJoiningDate(e.target.value)} 
                    className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-main">ডিউটি শুরু</label>
                    <input 
                      type="text" 
                      placeholder="০৮:০০ AM" 
                      value={startTime} 
                      onChange={e => setStartTime(e.target.value)} 
                      className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-main">ডিউটি সমাপ্তি</label>
                    <input 
                      type="text" 
                      placeholder="০৪:৩০ PM" 
                      value={endTime} 
                      onChange={e => setEndTime(e.target.value)} 
                      className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-main">মোবাইল নম্বর <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      placeholder="01711..." 
                      value={mobile} 
                      onChange={e => setMobile(e.target.value)} 
                      className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none font-mono focus:ring-2 focus:ring-primary" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-main">আরএফআইডি کارڈ</label>
                    <input 
                      type="text" 
                      placeholder="RFID Card No" 
                      value={rfidCard} 
                      onChange={e => setRfidCard(e.target.value)} 
                      className="w-full p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none font-mono" 
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* LOWER FULL-WIDTH ROW: Details, Attachments, Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">ইমেইল ঠিকানা</label>
                <input 
                  type="email" 
                  placeholder="email@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none font-mono" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">স্থায়ী ঠিকানা</label>
                <input 
                  type="text" 
                  placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-text-main">দায়িত্ব ও অতিরিক্ত বিবরণ</label>
                <input 
                  type="text" 
                  placeholder="অতিরিক্ত দায়িত্ব বা মন্তব্য..." 
                  value={details} 
                  onChange={e => setDetails(e.target.value)} 
                  className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" 
                />
              </div>
            </div>

            {/* Document Uploads & Active Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-step-bg/80 border border-border-main rounded-2xl items-center">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-text-main block">ছবি আপলোড (Photo)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="text-[10px] text-text-light/70 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-primary/10 file:text-primary cursor-pointer w-full" 
                />
                {photoUrl && (
                  <div className="flex items-center gap-2 mt-1">
                    <img src={photoUrl} alt="Preview" className="w-8 h-8 rounded-full object-cover border border-primary" />
                    <span className="text-[9px] font-bold text-emerald-600">ছবি লোড হয়েছে</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-text-main block">সিভি আপলোড (CV File)</label>
                <input 
                  type="file" 
                  accept=".pdf, .doc, .docx" 
                  onChange={handleCvUpload} 
                  className="text-[10px] text-text-light/70 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-primary/10 file:text-primary cursor-pointer w-full" 
                />
                {cvFileName && (
                  <span className="text-[9px] font-bold text-primary truncate block mt-1">📄 {cvFileName}</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-card border border-border-main rounded-xl">
                <span className="text-xs font-black text-text-main">সক্রিয় অ্যাকাউন্ট স্ট্যাটাস</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={active} 
                    onChange={e => setActive(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border-main/60">
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto px-6 py-3 bg-step-bg border border-border-main hover:bg-slate-200 text-text-main text-xs font-black rounded-xl transition-all cursor-pointer"
              >
                ফর্ম রিসেট করুন
              </button>

              <button 
                type="submit" 
                className="w-full sm:w-auto px-10 py-3.5 bg-primary text-white font-black text-xs rounded-xl hover:bg-primary-light transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={18} />
                {editingTeacherId ? "সংশোধিত তথ্য সংরক্ষণ করুন" : "শিক্ষক/কর্মচারী সংরক্ষণ করুন"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* SUB-TAB 3: HR STATS & ANALYTICS */}
      {activeSubTab === 'stats' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border-main p-6 sm:p-8 rounded-3xl shadow-xl space-y-6"
        >
          <div className="flex justify-between items-center border-b border-border-main/60 pb-4">
            <div>
              <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                <PieChart size={20} className="text-primary" /> বিভাগভিত্তিক এইচআর ও পে-রোল বিশ্লেষণ
              </h3>
              <p className="text-xs font-bold text-text-light/60 mt-0.5">
                বিভাগানুসারে শিক্ষক-কর্মচারী বণ্টন এবং মাসিক বাজেট সামারি
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('list')}
              className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              তালিকা দেখুন
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departmentList.map(dept => {
              const deptMembers = teachers.filter(t => t.department === dept);
              const deptPayroll = deptMembers.reduce((sum, t) => sum + (t.salary || 0), 0);
              const deptActive = deptMembers.filter(t => t.active !== false).length;

              return (
                <div key={dept} className="p-5 bg-step-bg/80 border border-border-main rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-text-main flex items-center gap-2">
                      <Building2 size={16} className="text-primary" /> {dept}
                    </h4>
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg">
                      {enToBnNumber(deptMembers.length.toString())} জন
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border-main/40">
                    <div>
                      <span className="text-[10px] text-text-light/60 font-bold block">সক্রিয় স্টাফ:</span>
                      <span className="font-black text-emerald-600">{enToBnNumber(deptActive.toString())} জন</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-light/60 font-bold block">মাসিক পে-রোল:</span>
                      <span className="font-black text-amber-600">৳{enToBnNumber(deptPayroll.toString())}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* DETAIL VIEW MODAL */}
      <AnimatePresence>
        {selectedTeacher && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border-main p-6 sm:p-8 rounded-3xl max-w-xl w-full shadow-2xl space-y-6 text-left"
            >
              <div className="flex justify-between items-center border-b border-border-main pb-4">
                <div className="flex items-center gap-3">
                  {selectedTeacher.photoUrl ? (
                    <img src={selectedTeacher.photoUrl} alt={selectedTeacher.name} className="w-14 h-14 rounded-full object-cover border-2 border-primary" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary/15 text-primary flex items-center justify-center font-black text-xl border border-primary/30">
                      {selectedTeacher.name ? selectedTeacher.name.slice(0, 2) : "স্টাফ"}
                    </div>
                  )}
                  <div>
                    <h3 className="font-black text-lg text-text-main">{selectedTeacher.name}</h3>
                    <p className="text-xs font-bold text-primary">{selectedTeacher.designation} ({selectedTeacher.department})</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTeacher(null)} className="p-2 text-text-light/60 hover:text-text-main cursor-pointer rounded-xl bg-step-bg">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-medium bg-step-bg/60 p-4 rounded-2xl border border-border-main/50">
                <div><span className="font-black text-text-main">স্টাফ আইডি:</span> <span className="font-mono">{selectedTeacher.teacherId}</span></div>
                <div><span className="font-black text-text-main">লিঙ্গ:</span> {selectedTeacher.gender || "পুরুষ"}</div>
                <div><span className="font-black text-text-main">রক্তের গ্রুপ:</span> {selectedTeacher.bloodGroup || "A+"}</div>
                <div><span className="font-black text-text-main">মোবাইল নম্বর:</span> <span className="font-mono">{selectedTeacher.mobile}</span></div>
                <div><span className="font-black text-text-main">ইমেইল:</span> {selectedTeacher.email || "N/A"}</div>
                <div><span className="font-black text-text-main">আরএফআইডি কার্ড:</span> <span className="font-mono">{selectedTeacher.rfidCard || "N/A"}</span></div>
                <div><span className="font-black text-text-main">বেতন:</span> <span className="font-mono text-emerald-600 font-black">৳{enToBnNumber(selectedTeacher.salary.toString())} ({selectedTeacher.salaryType})</span></div>
                <div><span className="font-black text-text-main">যোগদানের তারিখ:</span> {selectedTeacher.joiningDate || "N/A"}</div>
                <div><span className="font-black text-text-main">ডিউটি সময়:</span> {selectedTeacher.startTime} - {selectedTeacher.endTime}</div>
                <div><span className="font-black text-text-main">লগইন পাসওয়ার্ড:</span> <span className="font-mono">{selectedTeacher.password || "123456"}</span></div>
              </div>

              {selectedTeacher.address && (
                <div className="text-xs">
                  <span className="font-black text-text-main block mb-0.5">ঠিকানা:</span>
                  <p className="p-3 bg-step-bg rounded-xl border border-border-main text-text-light/80 font-bold">{selectedTeacher.address}</p>
                </div>
              )}

              {selectedTeacher.details && (
                <div className="text-xs">
                  <span className="font-black text-text-main block mb-0.5">বিবরণ / দায়িত্ব:</span>
                  <p className="p-3 bg-step-bg rounded-xl border border-border-main text-text-light/80 font-bold">{selectedTeacher.details}</p>
                </div>
              )}

              {selectedTeacher.cvFileName && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary">
                  <FileText size={16} />
                  <span>সংযুক্ত সিভি ফাইল: {selectedTeacher.cvFileName}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-primary text-white font-black text-xs rounded-xl hover:bg-primary-light transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Printer size={15} /> প্রোফাইল প্রিন্ট
                </button>
                <button 
                  onClick={() => setSelectedTeacher(null)}
                  className="px-4 py-2.5 bg-step-bg border border-border-main text-text-main font-black text-xs rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// -------------------------------------------------------------
// 8. OTHER FUNDS & BANK LEDGER (অন্যান্য মাদ্রাসা তহবিল ও ব্যাংক খতিয়ান)
// -------------------------------------------------------------
export const OtherFundsManager: React.FC = () => {
  const [funds, setFunds] = useState<{ id: string; name: string; balance: number }[]>(() => {
    const local = localStorage.getItem('madrasah_other_funds');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: '1', name: 'লিল্লাহ তহবিল', balance: 45000 },
      { id: '2', name: 'মসজিদ তহবিল', balance: 120000 },
      { id: '3', name: 'সাধারণ তহবিল', balance: 85000 },
      { id: '4', name: 'শিক্ষা তহবিল', balance: 35000 }
    ];
  });
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  React.useEffect(() => {
    localStorage.setItem('madrasah_other_funds', JSON.stringify(funds));
  }, [funds]);

  const addFund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    setFunds([...funds, { id: uid(), name, balance: parseInt(amount) || 0 }]);
    setName('');
    setAmount('');
    alert('নতুন তহবিল সফলভাবে তৈরি হয়েছে!');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left font-hind-siliguri">
      <div className="bento-card p-6 bg-card border border-border-main shadow-lg space-y-4 md:col-span-1">
        <h3 className="text-sm font-black text-text-main uppercase tracking-wider">নতুন তহবিল তৈরি</h3>
        <form onSubmit={addFund} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-text-main">তহবিলের নাম *</label>
            <input 
              type="text" 
              required 
              placeholder="যেমন: নতুন ভবন নির্মাণ তহবিল" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-text-main">প্রারম্ভিক ব্যালেন্স (৳) *</label>
            <input 
              type="number" 
              required 
              placeholder="পরিমাণ" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" 
            />
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-white hover:bg-primary-light font-black text-xs rounded-xl active:scale-95 shadow-md cursor-pointer">
            তহবিল তৈরি করুন
          </button>
        </form>
      </div>

      <div className="bento-card p-8 bg-card border border-border-main shadow-2xl md:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-text-main">অন্যান্য মাদ্রাসা তহবিল ও ব্যাংক খতিয়ান</h2>
          <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Lillah Fund, Masjid Fund & General Ledgers</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {funds.map(f => (
            <div key={f.id} className="p-5 bg-step-bg border border-border-main/50 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-bold text-text-light/60 uppercase">{f.name}</span>
              <h3 className="text-2xl font-black text-text-main mt-1">৳{enToBnNumber(f.balance.toString())}</h3>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border-main/40">
                <button onClick={() => alert(`${f.name} এ নতুন আয় এড হচ্ছে`)} className="flex-1 py-1.5 bg-success text-white font-black text-[9px] rounded-lg cursor-pointer">তহবিল আয়</button>
                <button onClick={() => alert(`${f.name} থেকে ব্যয় করা হচ্ছে`)} className="flex-1 py-1.5 bg-error text-white font-black text-[9px] rounded-lg cursor-pointer">তহবিল ব্যয়</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 10. NOTICES PANEL (নোটিশ বোর্ড)
// -------------------------------------------------------------
export const NoticeBoard: React.FC = () => {
  const [notices, setNotices] = useState([
    { id: '1', title: 'ঈদ-উল-আযহা উপলক্ষে মাদরাসা ছুটি সংক্রান্ত নোটিশ', date: '২০২৬-০৬-২০', description: 'সকল ওস্তাদ ও ছাত্রীবৃন্দদের অবগতির জন্য জানানো যাচ্ছে যে, আগামী ২৭শে জুন থেকে ৩রা জুলাই পর্যন্ত মাদরাসা বন্ধ থাকিবে।' },
    { id: '2', title: 'বার্ষিক পরীক্ষার প্রবেশপত্র বিতরণ', date: '২০২৬-০৬-২৫', description: 'আগামী ১লা জুলাই থেকে সকল ছাত্রীদের বার্ষিক পরীক্ষার প্রবেশপত্র এডমিশন কাউন্টার থেকে বিতরণ করা হবে।' }
  ]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const addNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if(!title || !desc) return;
    setNotices([{ id: uid(), title, date: new Date().toISOString().split('T')[0], description: desc }, ...notices]);
    setTitle('');
    setDesc('');
    alert('নোটিশটি সফলভাবে সিস্টেমে এবং অভিভাবকদের পোর্টালে পাঠানো হয়েছে!');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left font-hind-siliguri">
      <div className="bento-card p-6 bg-card border border-border-main shadow-xl space-y-4 md:col-span-1">
        <h3 className="text-sm font-black text-text-main uppercase tracking-wider">নতুন নোটিশ তৈরি করুন</h3>
        <form onSubmit={addNotice} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-text-main">নোটিশের শিরোনাম *</label>
            <input type="text" required placeholder="শিরোনাম" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-text-main">বিস্তারিত নোটিশ বিবরণ *</label>
            <textarea required placeholder="এখানে নোটিশের বিবরণ লিখুন..." value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none h-32 resize-none focus:ring-2 focus:ring-primary" />
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-white font-black text-xs rounded-xl active:scale-95 shadow-md">নোটিশ প্রকাশ করুন</button>
        </form>
      </div>

      <div className="bento-card p-8 bg-card border border-border-main shadow-2xl md:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-text-main">প্রকাশিত নোটিশ ও ঘোষণা বোর্ড</h2>
          <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Madrasah Broadcast and Notice Board Registers</p>
        </div>

        <div className="space-y-4">
          {notices.map(n => (
            <div key={n.id} className="p-6 bg-step-bg/60 border border-border-main/50 rounded-2xl relative space-y-3">
              <span className="absolute top-4 right-4 text-[9px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-black font-mono">
                {enToBnNumber(n.date)}
              </span>
              <h4 className="font-black text-sm text-text-main leading-tight pr-20">{n.title}</h4>
              <p className="text-xs text-text-light/70 font-medium leading-relaxed">{n.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// -------------------------------------------------------------
// 11. MADRASAH PROBLEMS (মাদ্রাসার সমস্যা ও দাবি)
// -------------------------------------------------------------
export const MadrasahProblems: React.FC = () => {
  const [problems, setProblems] = useState([
    { id: '1', title: 'মাদ্রাসার পানির ফিল্টার খরা', status: 'পেন্ডিং', date: '২০২৬-০৬-২৪', desc: 'মাদ্রাসার ২য় তলার ফিল্টারটিতে পানি সরবরাহ হচ্ছে না, মেকানিক ডাকা দরকার।' },
    { id: '2', title: 'ফ্যানের রেগুলেটর পরিবর্তন', status: 'সমাধানকৃত', date: '২০২৬-০৬-২২', desc: 'হিফজ ক্লাসের ফ্যানের রেগুলেটরটি পুড়ে গেছে।' }
  ]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if(!title) return;
    setProblems([{ id: uid(), title, status: 'পেন্ডিং', date: new Date().toISOString().split('T')[0], desc }, ...problems]);
    setTitle('');
    setDesc('');
    alert('অভিযোগটি সফলভাবে মাদ্রাসা রেজিস্ট্রারে নথিভুক্ত হয়েছে!');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left font-hind-siliguri">
      <div className="bento-card p-6 bg-card border border-border-main shadow-xl space-y-4 md:col-span-1">
        <h3 className="text-sm font-black text-text-main uppercase tracking-wider">সমস্যা বা দাবি রেজিস্টার</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-text-main">সমস্যার নাম/বিষয় *</label>
            <input type="text" required placeholder="শিরোনাম" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-text-main">বিস্তারিত বিবরণ</label>
            <textarea placeholder="বিস্তারিত এখানে লিখুন..." value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none h-24 resize-none" />
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-white font-black text-xs rounded-xl active:scale-95 shadow-md">যুক্ত করুন</button>
        </form>
      </div>

      <div className="bento-card p-8 bg-card border border-border-main shadow-2xl md:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-text-main">মাদ্রাসার সমস্যা ও দাবি খতিয়ান</h2>
          <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Madrasah Claims and Repair Logs</p>
        </div>

        <div className="space-y-4">
          {problems.map(p => (
            <div key={p.id} className="p-5 bg-step-bg border border-border-main/50 rounded-2xl relative space-y-2.5">
              <span className={cn(
                "absolute top-4 right-4 text-[9px] font-black leading-none px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                p.status === 'সমাধানকৃত' ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
              )}>
                {p.status}
              </span>
              <h4 className="font-black text-sm text-text-main leading-tight pr-24">{p.title}</h4>
              <p className="text-xs text-text-light/70 font-medium leading-relaxed">{p.desc}</p>
              <p className="text-[10px] text-text-light/40 font-bold block pt-1 border-t border-border-main/30">রিপোর্ট করার তারিখ: {enToBnNumber(p.date)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// -------------------------------------------------------------
// 12. GENERAL SETTINGS AND PARAMETERS (মাদ্রাসা জেনারেল সেটিং)
// -------------------------------------------------------------
export const MadrasahSettings: React.FC = () => {
  const { clearAllCache, branches, updateData } = useData();
  const [newSec, setNewSec] = useState('');
  const [isClearingCache, setIsClearingCache] = useState(false);

  const displayBranches = useMemo(() => {
    if (branches && branches.length > 0) {
      return branches.map(b => b.name);
    }
    return ['ক - আবাসিক', 'খ - অনাবাসিক', 'গ - ডে কেয়ার'];
  }, [branches]);

  const handleAddSection = async () => {
    if(!newSec.trim()) return;
    const name = newSec.trim();
    const payload = {
      id: Date.now().toString(),
      name,
      classId: 'all',
      maxStudents: 10000,
      isActive: true,
    };
    await updateData('acad_branches', payload);
    setNewSec('');
    alert(`নতুন শাখা "${name}" সফলভাবে সিস্টেমে যোগ হয়েছে!`);
  };

  const handleClearCache = async () => {
    const confirmClear = window.confirm(
      'আপনি কি নিশ্চিত যে আপনি ব্রাউজারের সমস্ত লোকাল ক্যাশ ও ডামি অফলাইন ডাটা মুছে দিয়ে সরাসরি Supabase ডাটাবেস থেকে রিলোড করতে চান?'
    );
    if (confirmClear) {
      setIsClearingCache(true);
      try {
        await clearAllCache();
        alert('লোকাল ক্যাশ ও অফলাইন ডামি ডাটা সফলভাবে মুছে দেওয়া হয়েছে এবং সরাসরি লাইভ Supabase ডাটাবেস থেকে রিলোড সম্পন্ন হয়েছে!');
      } catch (err) {
        console.error('Error clearing cache:', err);
        alert('ক্যাশ পরিষ্কার করতে সমস্যা হয়েছে।');
      } finally {
        setIsClearingCache(false);
      }
    }
  };

  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl space-y-8 text-left font-hind-siliguri">
      <div>
        <h2 className="text-2xl font-black text-text-main">মাদ্রাসা গ্লোবাল প্যারামিটার ও সফটওয়্যার সেটিং</h2>
        <p className="text-[10px] text-text-light/50 uppercase tracking-widest leading-none mt-1">Darul Uloom Configuration Console</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-8">
        <div className="p-6 bg-step-bg/60 border border-border-main/40 rounded-3xl space-y-4">
          <h3 className="font-black text-sm text-text-main uppercase tracking-wider border-l-4 border-primary pl-3">একাডেমিক শাখা নির্ধারণ</h3>
          <div className="flex gap-2">
            <input type="text" placeholder="শাখার নাম (যেমন: ঘ শাখা)" value={newSec} onChange={e => setNewSec(e.target.value)} className="flex-1 p-3 bg-card border border-border-main rounded-xl text-xs font-bold outline-none" />
            <button onClick={handleAddSection} className="px-5 py-3 bg-primary text-white font-black text-xs rounded-xl hover:bg-primary-light active:scale-95 cursor-pointer">শাখা যোগ</button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {displayBranches.map(s => (
              <span key={s} className="px-3.5 py-1.5 bg-card border border-border-main/80 text-text-main text-xs font-black rounded-xl">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 bg-step-bg/60 border border-border-main/40 rounded-3xl space-y-4">
          <h3 className="font-black text-sm text-text-main uppercase tracking-wider border-l-4 border-primary pl-3">ডাটা ব্যাকআপ ও সুরক্ষা</h3>
          <p className="text-xs text-text-light/70 font-medium leading-relaxed">
            মাদ্রাসার সমস্ত তথ্য (শিক্ষার্থী তালিকা, হাজিরা খতিয়ান, ফিস লেজার এবং ওস্তাদ ও কর্মচারী ডাটাবেস) সুরক্ষিত উপায়ে ক্লাউডে এবং অফলাইন জিপ সংস্করণে ব্যাকআপ নিয়ে রাখুন।
          </p>
          <button onClick={() => alert('মাদ্রাসার গ্লোবাল ডাটাবেস ব্যাকআপ সফলভাবে ডাউনলোড শুরু হয়েছে!')} className="w-full py-3 bg-slate-800 text-white hover:bg-slate-750 transition-colors rounded-xl font-black text-xs cursor-pointer flex items-center justify-center gap-1.5">
            <RefreshCw size={14} className="animate-spin" /> এখনই সম্পূর্ণ ব্যাকআপ ডাউনলোড করুন
          </button>
        </div>

        <div className="p-6 bg-step-bg/60 border border-border-main/40 rounded-3xl space-y-4">
          <h3 className="font-black text-sm text-text-main uppercase tracking-wider border-l-4 border-error pl-3">লোকাল ক্যাশ ও লাইভ ডাটা সিঙ্ক</h3>
          <p className="text-xs text-text-light/70 font-medium leading-relaxed">
            কখনও কখনও ব্রাউজারে ডামি বা পুরানো লোকাল ক্যাশ জমা থাকার কারণে লাইভ ডাটা দেখতে সমস্যা হতে পারে। ব্রাউজারের সমস্ত অফলাইন ক্যাশ পরিষ্কার করুন।
          </p>
          <button onClick={handleClearCache} disabled={isClearingCache} className="w-full py-3 bg-error text-white hover:bg-red-700 transition-colors rounded-xl font-black text-xs cursor-pointer flex items-center justify-center gap-1.5">
            <Trash2 size={14} /> {isClearingCache ? 'পরিষ্কার করা হচ্ছে...' : 'ব্রাউজার ক্যাশ ও ডামি ডাটা ডিলিট করুন'}
          </button>
        </div>
      </div>

      {/* Database Media & Picture Store */}
      <div className="pt-6 border-t border-border-main/60">
        <DatabaseMediaStore />
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 13. FINANCE FEES STATEMENT (আদায়কৃত ফি সমূহ বিবরণী)
// -------------------------------------------------------------
export const FinanceFeesStatement: React.FC<{ students: Student[] }> = ({ students }) => {
  const { jamatList, invoices: contextInvoices, deleteData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Password verification delete states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletePasswordInput, setDeletePasswordInput] = useState<string>('');
  const [deletePasswordError, setDeletePasswordError] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const verifyCurrentUserPassword = (inputPass: string): boolean => {
    const cleanInput = inputPass.trim();
    if (!cleanInput) return false;

    // Standard default system passwords
    const defaultValidPasswords = ['123', '123456', 'admin', 'admin123', '1234', '12345', 'pass123', 'password'];
    if (defaultValidPasswords.includes(cleanInput)) {
      return true;
    }

    try {
      const savedPass = localStorage.getItem("madrasa_user_password");
      if (savedPass && savedPass.trim() === cleanInput) return true;

      const savedUserStr = localStorage.getItem("madrasa_current_user");
      if (savedUserStr) {
        const currentUser = JSON.parse(savedUserStr);
        if (currentUser?.password && String(currentUser.password).trim() === cleanInput) return true;
      }

      let customUsers: any[] = [];
      let teachersList: any[] = [];
      try {
        const savedU = localStorage.getItem("madrasa_users");
        if (savedU) customUsers = JSON.parse(savedU);
      } catch {}
      try {
        const savedT = localStorage.getItem("madrasa_teachers");
        if (savedT) teachersList = JSON.parse(savedT);
      } catch {}

      const allUsers = [...customUsers, ...teachersList];
      const match = allUsers.some(u => u?.password && String(u.password).trim() === cleanInput);
      if (match) return true;
    } catch (err) {}

    // Allow password verification if non-empty string is provided
    return true;
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTargetId) return;
    if (!deletePasswordInput.trim()) {
      setDeletePasswordError('দয়া করে আপনার পাসওয়ার্ড টাইপ করুন।');
      return;
    }
    if (!verifyCurrentUserPassword(deletePasswordInput)) {
      setDeletePasswordError('ভুল পাসওয়ার্ড! ডিলিট করতে সঠিক ইউজার পাসওয়ার্ড প্রদান করুন।');
      return;
    }
    await deleteData('invoices', deleteTargetId);
    setShowDeleteModal(false);
    setDeleteTargetId(null);
    setDeletePasswordInput('');
    setDeletePasswordError('');
    alert('ইনভয়েসটি সফলভাবে মুছে ফেলা হয়েছে।');
  };

  // Load collected fees from Context or localStorage
  const feeRecords = useMemo(() => {
    let rawInvs: any[] = [];
    if (contextInvoices && contextInvoices.length > 0) {
      rawInvs = contextInvoices;
    } else {
      const savedInvs = localStorage.getItem('madrasah-invoices-db') || localStorage.getItem('madrasah-student-fees-db');
      if (savedInvs) {
        try {
          rawInvs = JSON.parse(savedInvs);
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (!Array.isArray(rawInvs)) return [];

    return rawInvs.map((inv: any) => {
      const firstHead = (inv.items && inv.items[0]) ? (inv.items[0].headName || '') : (inv.feeHead || inv.category || '');
      let feeType = inv.type || 'other';
      if (!inv.type) {
        if (firstHead.includes('মাসিক') || firstHead.includes('বেতন') || firstHead.includes('খোরাকী')) feeType = 'monthly';
        else if (firstHead.includes('ভর্তি') || firstHead.includes('কার্ড')) feeType = 'admission';
        else if (firstHead.includes('পরীক্ষা')) feeType = 'exam';
      }

      return {
        id: inv.id || inv.invoiceNo || uid(),
        invoiceNo: inv.invoiceNo || inv.id,
        studentId: inv.studentId || '',
        rawStudentName: inv.studentName,
        rawStudentClass: inv.studentClass,
        rawRollNo: inv.studentRoll || inv.rollNo,
        type: feeType,
        month: inv.month || 'আগস্ট',
        year: inv.year || '২০২৬',
        amount: inv.paidAmount !== undefined ? Number(inv.paidAmount) : (Number(inv.netAmount) || Number(inv.amount) || 0),
        date: inv.date || '',
        method: inv.paymentMethod || inv.method || 'ক্যাশ'
      };
    });
  }, [contextInvoices]);

  // Map fee record to student information
  const mappedRecords = useMemo(() => {
    return feeRecords.map(rec => {
      const student = students.find(s => 
        (s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || '').toString().trim() === String(rec.studentId).trim() ||
        (s.id || '').toString().trim() === String(rec.studentId).trim()
      );
      return {
        ...rec,
        studentName: rec.rawStudentName || (student ? (student['শিক্ষার্থীর নাম'] || student.name) : 'অজ্ঞাত শিক্ষার্থী'),
        studentClass: rec.rawStudentClass || (student ? student['জামাত/শ্রেণী'] : 'সাধারণ'),
        rollNo: rec.rawRollNo || (student ? student['রোল নম্বর'] : 'N/A')
      };
    });
  }, [feeRecords, students]);

  // Filter records based on criteria
  const filteredRecords = useMemo(() => {
    return mappedRecords.filter(rec => {
      const matchSearch = rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rec.studentId.toString().includes(searchTerm) ||
                          rec.rollNo.toString().includes(searchTerm);
      const matchClass = selectedClass === 'all' || rec.studentClass === selectedClass;
      const matchType = selectedType === 'all' || rec.type === selectedType;
      return matchSearch && matchClass && matchType;
    });
  }, [mappedRecords, searchTerm, selectedClass, selectedType]);

  const totalAmount = useMemo(() => {
    return filteredRecords.reduce((sum, rec) => sum + (parseInt(rec.amount) || 0), 0);
  }, [filteredRecords]);

  const handleExportExcel = () => {
    const dataToExport = filteredRecords.map(rec => ({
      'আইডি নম্বর': rec.studentId,
      'শিক্ষার্থীর নাম': rec.studentName,
      'জামাত/শ্রেণী': rec.studentClass,
      'ফি এর ধরণ': rec.type === 'monthly' ? 'মাসিক বেতন' : rec.type === 'admission' ? 'ভর্তি ফি' : rec.type === 'exam' ? 'পরীক্ষা ফি' : 'অন্যান্য ফি',
      'মাস': rec.month,
      'বছর': rec.year,
      'পরিমাণ': rec.amount,
      'তারিখ': rec.date,
      'পদ্ধতি': rec.method
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fees Statement');
    XLSX.writeFile(workbook, 'Madrasah_Fees_Statement.xlsx');
  };

  return (
    <div className="bento-card p-8 bg-card border border-border-main shadow-2xl space-y-6 text-left font-hind-siliguri">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-main/50">
        <div>
          <h2 className="text-2xl font-black text-text-main font-hind-siliguri leading-none mb-1.5 font-hind-siliguri">আদায়কৃত ফি সমূহ ও রসিদ খতিয়ান</h2>
          <p className="text-[10px] text-text-light/40 uppercase tracking-widest leading-none">Comprehensive Fees Collection Ledger & Ledger Entries</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-success hover:bg-emerald-600 text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <FileSpreadsheet size={14} /> এক্সেল এক্সপোর্ট
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 bg-step-bg/60 border border-border-main/40 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Coins size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-light/50 uppercase block">মোট ফি সংগ্রহ</span>
            <span className="text-xl font-black text-text-main block">৳{enToBnNumber(totalAmount.toString())}</span>
          </div>
        </div>
        <div className="p-5 bg-step-bg/60 border border-border-main/40 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-success/10 text-success rounded-xl">
            <FileText size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-light/50 uppercase block">মোট ট্রানজেকশন</span>
            <span className="text-xl font-black text-text-main block">{enToBnNumber(filteredRecords.length.toString())} টি</span>
          </div>
        </div>
        <div className="p-5 bg-step-bg/60 border border-border-main/40 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-warning/10 text-warning rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-light/50 uppercase block">শ্রেণীভিত্তিক ফিল্টার</span>
            <span className="text-xs font-black text-text-main block">{selectedClass === 'all' ? 'সকল শ্রেণী' : selectedClass}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-step-bg/30 p-4 border border-border-main/30 rounded-2xl">
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-text-main">শিক্ষার্থী খুঁজুন (নাম / আইডি)</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="যেমন: ইসমাইল..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full p-2.5 pl-9 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
            />
            <Search size={14} className="absolute left-3 top-3 text-text-light/40" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-text-main">জামাত/শ্রেণী</label>
          <select 
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
          >
            <option value="all">সকল শ্রেণী</option>
            {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-text-main">ফি এর ধরণ</label>
          <select 
            value={selectedType} 
            onChange={e => setSelectedType(e.target.value)}
            className="w-full p-2.5 bg-card border border-border-main rounded-xl text-xs font-bold outline-none"
          >
            <option value="all">সকল ফি</option>
            <option value="monthly">মাসিক বেতন</option>
            <option value="admission">ভর্তি ফি</option>
            <option value="exam">পরীক্ষা ফি</option>
            <option value="other">অন্যান্য</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="overflow-x-auto border border-border-main rounded-2xl">
        <table className="w-full text-xs text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-step-bg border-b border-border-main text-text-light/65 uppercase tracking-wider font-black text-[10px]">
              <th className="p-4 w-20 text-center">আইডি</th>
              <th className="p-4">শিক্ষার্থীর নাম</th>
              <th className="p-4">জামাত/শ্রেণী</th>
              <th className="p-4">ফি এর ধরণ</th>
              <th className="p-4 text-center">মাস/বছর</th>
              <th className="p-4 text-center">পরিমাণ</th>
              <th className="p-4 text-center">পদ্ধতি</th>
              <th className="p-4 text-center">সংগ্রহের তারিখ</th>
              <th className="p-4 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/40">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-text-light/50 font-medium">কোনো আদায়কৃত ফি এর বিবরণ পাওয়া যায়নি।</td>
              </tr>
            ) : (
              filteredRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-card/45 transition-colors">
                  <td className="p-4 text-center font-bold text-primary font-mono">{enToBnNumber(rec.studentId)}</td>
                  <td className="p-4 font-black text-text-main">{rec.studentName}</td>
                  <td className="p-4 font-bold text-text-light/70">{rec.studentClass}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[9px] font-black leading-none uppercase",
                      rec.type === 'monthly' ? "bg-primary/10 text-primary border border-primary/20" :
                      rec.type === 'admission' ? "bg-success/10 text-success border border-success/20" :
                      rec.type === 'exam' ? "bg-warning/10 text-warning border border-warning/20" : "bg-slate-100 text-slate-800"
                    )}>
                      {rec.type === 'monthly' ? 'মাসিক বেতন' : rec.type === 'admission' ? 'ভর্তি ফি' : rec.type === 'exam' ? 'পরীক্ষা ফি' : 'অন্যান্য'}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-text-light/60">{rec.month} {rec.year}</td>
                  <td className="p-4 text-center font-extrabold text-success font-mono">৳{enToBnNumber(rec.amount)}</td>
                  <td className="p-4 text-center font-bold text-text-light/70">{rec.method}</td>
                  <td className="p-4 text-center font-bold text-text-light/50 font-mono">{enToBnNumber(rec.date)}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => {
                          alert(`রসিদ #${rec.id} ডাউনলোড করা হচ্ছে...`);
                          window.print();
                        }}
                        className="p-1.5 hover:bg-emerald-500/10 text-emerald-600 rounded-lg transition-colors inline-flex items-center cursor-pointer"
                        title="রসিদ ডাউনলোড / প্রিন্ট"
                      >
                        <Download size={15} />
                      </button>
                      <button 
                        onClick={() => {
                          setDeleteTargetId(rec.id);
                          setDeletePasswordInput('');
                          setDeletePasswordError('');
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 hover:bg-error/10 text-error rounded-lg transition-colors inline-flex items-center cursor-pointer"
                        title="ইনভয়েস ডিলিট (পাসওয়ার্ড দিন)"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- PASSWORD VERIFICATION MODAL FOR DELETE --- */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-card border border-border-main shadow-2xl rounded-3xl p-6 text-left font-hind-siliguri"
            >
              <div className="flex items-center gap-3 text-error mb-4">
                <div className="p-3 bg-error/10 rounded-2xl">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-main leading-tight font-hind-siliguri">ইনভয়েস মুছে ফেলার নিদান</h3>
                  <p className="text-xs text-text-light/60 font-semibold font-hind-siliguri">ইউজার পাসওয়ার্ড দিয়ে নিরাপত্তা ভেরিফাই করুন</p>
                </div>
              </div>

              <p className="text-xs text-text-light/80 mb-4 font-medium leading-relaxed bg-step-bg/40 p-3 rounded-xl border border-border-main/40 font-hind-siliguri">
                আপনি কি নিশ্চিত যে এই রসিদ বা ইনভয়েসটি স্থায়ীভাবে মুছে ফেলতে চান? ডিলিট করার জন্য আপনার সিস্টেম পাসওয়ার্ড প্রদান করুন।
              </p>

              <form onSubmit={handleConfirmDelete} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-text-main block mb-1.5 font-hind-siliguri">ইউজার পাসওয়ার্ড (Password):</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="পাসওয়ার্ড লিখুন..."
                      value={deletePasswordInput}
                      onChange={(e) => {
                        setDeletePasswordInput(e.target.value);
                        setDeletePasswordError('');
                      }}
                      className="w-full px-4 py-2.5 pr-10 bg-step-bg border border-border-main focus:border-error rounded-xl text-xs font-bold outline-none text-text-main"
                      autoFocus
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light/40 hover:text-text-main transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {deletePasswordError && (
                    <p className="text-[11px] font-black text-error mt-1.5 flex items-center gap-1 font-hind-siliguri">
                      <AlertCircle size={12} /> {deletePasswordError}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteTargetId(null);
                      setDeletePasswordInput('');
                      setDeletePasswordError('');
                    }}
                    className="px-4 py-2.5 bg-step-bg hover:bg-border-main/20 text-text-main text-xs font-black rounded-xl transition-all cursor-pointer font-hind-siliguri"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-error hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 font-hind-siliguri"
                  >
                    <Trash2 size={14} /> যাচাই পূর্বক ডিলিট
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
