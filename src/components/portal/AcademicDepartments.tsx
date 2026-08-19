import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  Award, 
  BookOpenCheck, 
  Clock, 
  Home, 
  CheckCircle,
  Bookmark,
  ChevronRight,
  ShieldCheck,
  Calendar
} from "lucide-react";
import { cn } from "../../lib/utils";

// Helper for English to Bengali numbers
const enToBnNumber = (str: string | number): string => {
  const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.toString().replace(/\d/g, (d) => bnNums[parseInt(d)]);
};

export const AcademicDepartments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"noorani" | "nazera" | "kitab">("noorani");

  const boardingTypes = [
    {
      title: "আবাসিক",
      eng: "Residential",
      desc: "সার্বক্ষণিক তত্ত্ববধান, সুষম খাদ্য ও পরিচ্ছন্ন বাসস্থান ব্যবস্থাপনায় উন্নত দ্বীনি পরিবেশে অধ্যয়নের সুযোগ।",
      color: "bg-success/10 border-success/25 text-success",
      icon: Home
    },
    {
      title: "অনাবাসিক",
      eng: "Non-Residential",
      desc: "দিনের নির্দিষ্ট সময় মাদ্রাসায় পাঠদান শেষে শিক্ষার্থীদের নিরাপদে বাড়ি ফেরার ব্যবস্থা।",
      color: "bg-warning/10 border-warning/25 text-warning",
      icon: Clock
    },
    {
      title: "ডে-কেয়ার",
      eng: "Day-Care",
      desc: "কর্মজীবী অভিভাবকদের সন্তানদের জন্য সকাল থেকে সন্ধ্যা পর্যন্ত বিশেষ যত্ন, পাঠদান ও দুপুরের খাবার ব্যবস্থা।",
      color: "bg-sky-500/10 border-sky-500/25 text-sky-600",
      icon: Sparkles
    }
  ];

  const nooraniGrades = [
    {
      grade: "শিশু শ্রেণী",
      subtitle: "প্রস্তুতিমূলক",
      desc: "আরবি হরফ, উচ্চারণ ও প্রাথমিক বর্ণমালা পরিচিতি। কোমলমতি শিশুদের জন্য আনন্দের মাধ্যমে খেলাচ্ছলে শিক্ষা প্রদান।",
      emoji: "🎓",
      color: "from-purple-500/10 to-indigo-500/10 border-indigo-500/20 text-indigo-700"
    },
    {
      grade: "প্রথম শ্রেণী",
      subtitle: "প্রাথমিক শিক্ষা",
      desc: "মৌলিক বাংলা, ইংরেজি, গণিত এবং দৈনন্দিন জীবনের প্রয়োজনীয় দুআ ও আমল শিক্ষা।",
      emoji: "📚",
      color: "from-emerald-500/10 to-teal-500/10 border-teal-500/20 text-emerald-700"
    },
    {
      grade: "দ্বিতীয় শ্রেণী",
      subtitle: "মৌলিক দক্ষতা",
      desc: "সহজ ভাষায় কুরআন রিডিং পড়ার পূর্ব প্রস্তুতি ও বানানসহ শুদ্ধ উচ্চারণের অনুশীলন।",
      emoji: "✏️",
      color: "from-amber-500/10 to-orange-500/10 border-orange-500/20 text-amber-700"
    },
    {
      grade: "তৃতীয় শ্রেণী",
      subtitle: "উন্নত পাঠ্য",
      desc: "তাজবিদের প্রাথমিক নিয়মাবলী এবং শুদ্ধ সুর ও উচ্চারণে পবিত্র কুরআন তিলাওয়াতের পূর্ণাঙ্গ যোগ্যতা অর্জন।",
      emoji: "🌟",
      color: "from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-700"
    }
  ];

  const nazeraPoints = [
    { title: "কুরআন পরিচিতি", desc: "পবিত্র মহাগ্রন্থ আল-কুরআনের ইতিহাস ও শানে নুযুল সম্পর্কে সাধারণ ধারণা।" },
    { title: "তাজবিদ শিক্ষা", desc: "মাকরাজ ও সিফাতসহ তাজবীদের সকল নিয়ম কানুনের সঠিক ও প্রায়োগিক শিক্ষা।" },
    { title: "হরফ শেখানো", desc: "আরবি ২৯টি হরফের সঠিক মাখরাজ ও নিখুঁত উচ্চারণ আত্মস্থ করানো।" },
    { title: "মাখরাজ চর্চা", desc: "প্রতিটি হরফ কোন স্থান থেকে উচ্চারিত হয় তা বারবার অনুশীলনের মাধ্যমে স্পষ্ট করা।" },
    { title: "শুদ্ধভাবে কুরআন দেখে তিলাওয়াত", desc: "দেখে দেখে সাবলীলভাবে নাযেরা তিলাওয়াত শেষ করার চূড়ান্ত যোগ্যতা লাভ।" }
  ];

  const kitabSyllabus = [
    { jamat: "ইবতেদায়ি রাবে", marhala: "ইবতেদায়িয়া রাবে", equivalent: "প্রাথমিক - চতুর্থ শ্রেণী" },
    { jamat: "ইবতেদায়ি খামেছ", marhala: "ইবতেদায়িয়া খামস", equivalent: "প্রাথমিক - পঞ্চম শ্রেণী" },
    { jamat: "মিযান (মুতাওয়াসসিতাহ আওয়াল)", marhala: "মুতাওয়াসসিতাহ আওয়াল", equivalent: "নিম্ন মাধ্যমিক - ষষ্ঠ শ্রেণী" },
    { jamat: "নাহবেমীর (মুতাওয়াসসিতাহ ছানী)", marhala: "মুতাওয়াসসিতাহ ছানি", equivalent: "নিম্ন মাধ্যমিক - সপ্তম শ্রেণী" },
    { jamat: "কুদূরী", marhala: "সানাবিয়্যা আউয়াল", equivalent: "মাধ্যমিক সমমান" },
    { jamat: "শরহে বেকায়া", marhala: "সানাবিয়্যা ছানী", equivalent: "মাধ্যমিক সমমান" },
    { jamat: "হেদায়া", marhala: "ফজিলত আউয়াল", equivalent: "স্নাতক সমমান" },
    { jamat: "মেশকাত", marhala: "ফজিলত ছানী", equivalent: "স্নাতক সমমান" },
    { jamat: "দাওরায়ে হাদিস", marhala: "তাকমিল", equivalent: "স্নাতকোত্তর সমমান" }
  ];

  return (
    <div className="space-y-8 font-hind-siliguri pb-12">
      {/* Header section with elegant title & description */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary-light/5 to-transparent border border-primary/15 rounded-3xl p-8 sm:p-10 shadow-sm">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <span className="px-3 py-1 bg-primary/15 border border-primary/20 rounded-full text-xs font-black text-primary uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
            <Sparkles size={12} className="animate-pulse" />
            শিক্ষা কারিকুলাম
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-text-main tracking-tight leading-tight">
            বিভাগ সমূহ
          </h1>
          <p className="text-base sm:text-lg text-text-light/85 font-medium leading-relaxed">
            শিশুর সামগ্রিক বিকাশে আমাদের আধুনিক ও ক্লাসিক্যাল শিক্ষা পদ্ধতি
          </p>
        </div>
      </div>

      {/* Boarding arrangements section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-6 bg-primary rounded-full" />
          <h2 className="text-xl font-black text-text-main">আবাসিক ও অনাবাসিক ব্যবস্থা</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {boardingTypes.map((type, i) => {
            const IconComponent = type.icon;
            return (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className={cn(
                  "p-6 rounded-3xl border shadow-sm transition-all flex flex-col justify-between h-full bg-card border-border-main/60 relative overflow-hidden group"
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={cn("p-3 rounded-2xl shrink-0 border", type.color)}>
                      <IconComponent size={20} className="stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-light/45">
                      {type.eng}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-text-main group-hover:text-primary transition-colors">
                      {type.title}
                    </h3>
                    <p className="text-xs text-text-light/75 font-medium leading-relaxed">
                      {type.desc}
                    </p>
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-text-main select-none pointer-events-none transition-transform duration-300 group-hover:scale-110">
                  <IconComponent size={80} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Main Educational Departments Grid / Tabs */}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border-main/50 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h2 className="text-xl font-black text-text-main">শিক্ষার বিভাগসমূহ</h2>
          </div>
          
          {/* Elegant tab selectors */}
          <div className="flex p-1 bg-step-bg/60 border border-border-main/50 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab("noorani")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2",
                activeTab === "noorani" 
                  ? "bg-card text-primary shadow-sm border border-border-main/30" 
                  : "text-text-light/70 hover:text-text-main"
              )}
            >
              <GraduationCap size={15} />
              নূরানী বিভাগ
            </button>
            <button
              onClick={() => setActiveTab("nazera")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2",
                activeTab === "nazera" 
                  ? "bg-card text-primary shadow-sm border border-border-main/30" 
                  : "text-text-light/70 hover:text-text-main"
              )}
            >
              <BookOpen size={15} />
              নাযেরা বিভাগ
            </button>
            <button
              onClick={() => setActiveTab("kitab")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2",
                activeTab === "kitab" 
                  ? "bg-card text-primary shadow-sm border border-border-main/30" 
                  : "text-text-light/70 hover:text-text-main"
              )}
            >
              <Award size={15} />
              কিতাব বিভাগ
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="relative min-h-[400px]">
          {activeTab === "noorani" && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bento-card p-6 bg-card border border-border-main/60 shadow-xl rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-600">
                    <GraduationCap size={22} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-main">আধুনিক নূরানী বিভাগ</h3>
                    <p className="text-[11px] text-text-light/45 font-bold uppercase tracking-wider">শিশু শ্রেণী হতে ৩য় শ্রেণী</p>
                  </div>
                </div>
                <p className="text-xs text-text-light/85 font-semibold leading-relaxed max-w-3xl">
                  আধুনিক বিশ্বের সাথে তাল মিলিয়ে দ্বীনি বুনিয়াদ গঠনে নূরানী বিভাগ অত্যন্ত ফলপ্রসূ। এখানে শিশুদের অত্যন্ত আদর-যত্নের সাথে সহীহ মাখরাজ ও তাজবিদের সাথে কুরআন রিডিং পড়ার পাশাপাশি সমমানের জেনারেল বিষয়ের মৌলিক দক্ষতা অর্জন করানো হয়।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {nooraniGrades.map((g, idx) => (
                  <motion.div
                    key={g.grade}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="bento-card p-6 bg-card border border-border-main/60 shadow-md rounded-3xl flex flex-col justify-between h-full group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl select-none filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
                          {g.emoji}
                        </span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider",
                          g.grade === "শিশু শ্রেণী" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600" :
                          g.grade === "প্রথম শ্রেণী" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                          g.grade === "দ্বিতীয় শ্রেণী" ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                          "bg-rose-500/10 border-rose-500/20 text-rose-600"
                        )}>
                          {g.subtitle}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-text-main group-hover:text-primary transition-colors">
                          {g.grade}
                        </h4>
                        <p className="text-xs text-text-light/75 leading-relaxed font-medium">
                          {g.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "nazera" && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bento-card p-6 bg-card border border-border-main/60 shadow-xl rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600">
                    <BookOpenCheck size={22} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-main">নাযেরা বিভাগ</h3>
                    <p className="text-[11px] text-text-light/45 font-bold uppercase tracking-wider">কুরআনে কারীমে বিশেষ দক্ষতা অর্জন</p>
                  </div>
                </div>
                <p className="text-xs text-text-light/85 font-semibold leading-relaxed max-w-3xl">
                  তাজবিদের যাবতীয় নিয়ম ও সৌন্দর্য রক্ষা করে কুরআন তিলাওয়াতের বিশেষ বিভাগ। এই বিভাগে অধ্যয়নরত শিক্ষার্থীরা পবিত্র কুরআনের বিশুদ্ধ উচ্চারণের পাশাপাশি হিফজ করার জন্য উপযুক্ত মেধা ও ধৈর্য অর্জনে সচেষ্ট থাকে।
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bento-card p-6 bg-card border border-border-main/60 shadow-md rounded-3xl space-y-4 flex flex-col justify-center">
                  <h4 className="text-lg font-black text-text-main pb-2 border-b border-border-main/50">
                    নাযেরা কারিকুলাম ও প্রশিক্ষণ লক্ষ্য
                  </h4>
                  <p className="text-xs text-text-light/85 leading-relaxed font-medium">
                    প্রতিটি শিক্ষার্থী যেন কোনো রকম দ্বিধা বা ভুল ছাড়াই সাবলীল গতিতে দেখে দেখে কুরআন পড়তে পারে, সেই লক্ষ্য বাস্তবায়নে আমাদের অভিজ্ঞ ওস্তাদগণের সার্বক্ষণিক তদারকি নিশ্চিত করা হয়।
                  </p>
                  <div className="flex items-center gap-2 text-primary text-xs font-black">
                    <CheckCircle size={14} className="stroke-[2.5]" />
                    <span>ব্যক্তিগত তাজবিদ অ্যাসেসমেন্ট ও রেকর্ড বুক</span>
                  </div>
                </div>

                <div className="bento-card p-6 bg-card border border-border-main/60 shadow-md rounded-3xl space-y-3">
                  <h4 className="text-base font-black text-text-main mb-2 pl-3 border-l-4 border-primary">
                    মূল পাঠ্যক্রম
                  </h4>
                  <div className="space-y-2.5">
                    {nazeraPoints.map((point, idx) => (
                      <div key={idx} className="flex gap-3 items-start group">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-200">
                          <span className="text-[10px] font-black">{enToBnNumber(idx + 1)}</span>
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-text-main group-hover:text-primary transition-colors">
                            {point.title}
                          </h5>
                          <p className="text-[11px] text-text-light/75 leading-relaxed font-medium">
                            {point.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "kitab" && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bento-card p-6 bg-card border border-border-main/60 shadow-xl rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-600">
                    <Bookmark size={22} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-main">মানসম্পন্ন কিতাব বিভাগ</h3>
                    <p className="text-[11px] text-text-light/45 font-bold uppercase tracking-wider">ইবতেদায়ি রাবে থেকে দাওরায়ে হাদিস</p>
                  </div>
                </div>
                <p className="text-xs text-text-light/85 font-semibold leading-relaxed max-w-3xl">
                  কওমী নেসাবের সার্বিক সিলেবাসের উপর ভিত্তি করে ইবতেদায়ি রাবে জামাত থেকে শুরু করে দাওরায়ে হাদিস (তাকমিল) পর্যন্ত সুবিন্যস্ত ও মানসম্মত শিক্ষা প্রদান করা হয়। আমরা শতভাগ কওমী সিলেবাসের ধারা মেনে চলি এবং নিয়মিত বোর্ড পরীক্ষায় অংশগ্রহণ করি।
                </p>
              </div>

              {/* Table wrapper */}
              <div className="bento-card bg-card border border-border-main/60 shadow-xl rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-border-main/50 bg-step-bg/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-black text-text-main text-base">সম্পূর্ণ কওমী নেসাব ও জামাতসমূহ</h4>
                    <p className="text-[10px] text-text-light/50 font-bold uppercase tracking-wider mt-0.5">Academic Syllabus & equivalent structures</p>
                  </div>
                  <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/15 rounded-xl flex items-center gap-2 text-amber-700 text-xs font-black">
                    <ShieldCheck size={14} className="stroke-[2.5]" />
                    <span>বাংলাদেশ কওমি মাদরাসা শিক্ষাবোর্ড কর্তৃক সিলেবাসে পরিচালিত</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-main/60 bg-step-bg/40 text-[11px] font-black uppercase tracking-wider text-text-light/75">
                        <th className="p-4 text-center w-12">ক্র.</th>
                        <th className="p-4">জামাত</th>
                        <th className="p-4">মারহালা</th>
                        <th className="p-4">সমমান ও সাধারণ শিক্ষা শ্রেণী</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main/40 text-xs font-bold text-text-main">
                      {kitabSyllabus.map((item, idx) => (
                        <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                          <td className="p-4 text-center font-black text-text-light/55">
                            {enToBnNumber(idx + 1)}
                          </td>
                          <td className="p-4 font-black text-text-main group-hover:text-primary transition-colors">
                            {item.jamat}
                          </td>
                          <td className="p-4 text-text-light/80">
                            {item.marhala}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-step-bg/50 border border-border-main/40 rounded-lg text-[11px] text-text-light/90 font-bold inline-block">
                              {item.equivalent}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
