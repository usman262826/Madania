import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import {
  Search,
  ChevronRight,
  BookOpen,
  Info,
  Users,
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  Coins,
  ShieldAlert,
  Bell,
  FileText,
  Workflow,
  Database,
  Smartphone,
  ShieldCheck,
  Cpu,
  Globe,
  Settings,
  X,
  CheckCircle2
} from "lucide-react";

interface SRSChapter {
  id: string;
  num: string;
  title: string;
  icon: any;
  description: string;
  points: {
    title: string;
    desc: string;
  }[];
}

const srsData: SRSChapter[] = [
  {
    id: "overview",
    num: "Chapter 01",
    title: "Project Overview (প্রকল্পের উদ্দেশ্য)",
    icon: Info,
    description: "মাদ্রাসার সকল প্রশাসনিক, শিক্ষাগত এবং আর্থিক কার্যাবলীকে একটি কেন্দ্রীয়, আধুনিক এবং সুরক্ষিত ওয়েব-ভিত্তিক সফটওয়্যারের মাধ্যমে সম্পূর্ণ অটোমেটেড করা।",
    points: [
      { title: "প্রকল্পের উদ্দেশ্য", desc: "মাদ্রাসার সকল প্রশাসনিক, শিক্ষাগত এবং আর্থিক কার্যাবলীকে একটি কেন্দ্রীয়, আধুনিক এবং সুরক্ষিত ওয়েব-ভিত্তিক সফটওয়্যারের মাধ্যমে সম্পূর্ণ অটোমেটেড করা।" },
      { title: "Vision & Mission", desc: "আধুনিক প্রযুক্তি ও ঐতিহ্যগত মাদ্রাসা শিক্ষার মেলবন্ধন ঘটিয়ে একটি ত্রুটিহীন, দ্রুত এবং গতিশীল প্রশাসনিক পরিবেশ নিশ্চিত করা।" },
      { title: "Project Scope", desc: "ভর্তি, শিক্ষার্থী তথ্য, শিক্ষক ও স্টাফ ডাটাবেজ, দৈনন্দিন হাজিরা, বেতন ও ফি সংগ্রহ, পরীক্ষা ও ফলাফল, লাইব্রেরি ও সম্পদ ব্যবস্থাপনা, নোটিশ বোর্ড এবং বহুমুখী রিপোর্টিং টুলস।" },
      { title: "Software Goals", desc: "ম্যানুয়াল কাজের ঝামেলা শতভাগ কমিয়ে আনা, হিসাবের স্বচ্ছতা নিশ্চিত করা এবং রিয়েল-টাইম ডাটা ট্র্যাকিং।" },
      { title: "Functional Requirements", desc: "রোল-ভিত্তিক লগইন, ডায়নামিক ফর্ম ফিলাপ, অটোমেটিক এসএমএস নোটিফিকেশন, ডিজিটাল রসিদ জেনারেটর এবং মার্কশীট তৈরি।" },
      { title: "Non-Functional Requirements", desc: "উচ্চ স্তরের নিরাপত্তা, রেসপন্সিভ ডিজাইন, ৫ সেকেন্ডের কম রেসপন্স টাইম (Fast Load), এবং ৯৯.৯% আপটাইম নিশ্চিত করা।" },
      { title: "System Architecture", desc: "ক্লায়েন্ট-সার্ভার আর্কিটেকচার (SPA + REST API) সহ সিকিউরড ডেটাবেজ লেয়ার।" },
      { title: "Technology Recommendation", desc: "React.js (Frontend), Tailwind CSS (Styling), Node.js/Express (Backend), PostgreSQL/Firestore (Database), Cloud Run (Hosting)." },
      { title: "Security Standard", desc: "HTTPS এনক্রিপশন, JWT অথেন্টিকেশন, সল্টেড পাসওয়ার্ড হ্যাশিং (bcrypt), এবং এক্সএসএস (XSS) ও সিএসআরএফ (CSRF) প্রতিরোধক মেকানিজম।" },
      { title: "Performance Target", desc: "লাইটহাউস পারফরম্যান্স স্কোর ৯০+, জিপ ফাইল কম্প্রেশন, অলস লোড (Lazy Loading) এবং মেমোরি অপ্টিমাইজেশন।" }
    ]
  },
  {
    id: "users",
    num: "Chapter 02",
    title: "User Management & Permission System",
    icon: Users,
    description: "মাদ্রাসার বিভিন্ন প্রশাসনিক স্তর এবং রোলের জন্য নিরাপদ অ্যাক্সেস কন্ট্রোল ও ইউজার পারমিশন সিস্টেম।",
    points: [
      { title: "Super Admin", desc: "পুরো মাদ্রাসার মালিকানাধীন সর্বোচ্চ ক্ষমতার অধিকারী প্রোফাইল। ইউজার তৈরি ও পারমিশন কন্ট্রোল করতে পারেন।" },
      { title: "Admin", desc: "সাধারণ প্রশাসনিক কার্যাবলী এবং সেটিংস পরিবর্তনের অ্যাক্সেস।" },
      { title: "Principal / মুহতামিম", desc: "মাদ্রাসার সকল একাডেমিক, ফাইনান্সিয়াল ও শিক্ষক সংক্রান্ত সার্বিক রিপোর্টের লাইভ ওভারভিউ দেখতে পারেন।" },
      { title: "শিক্ষক (Teacher Panel)", desc: "নিজ ক্লাসের উপস্থিতি, পরীক্ষার মার্ক এন্ট্রি এবং সিলেবাস ট্র্যাকিংয়ের অ্যাক্সেস।" },
      { title: "অফিস স্টাফ", desc: "ভর্তি প্রক্রিয়াকরণ, নোটিশ প্রদান এবং দৈনন্দিন প্রশাসনিক তথ্যাদি ইনপুট করা।" },
      { title: "হিসাবরক্ষক", desc: "ফি সংগ্রহ ব্যাবস্থাপনা, স্যালারি শিট প্রস্তুতকরণ এবং মাদ্রাসার সকল আয়-ব্যয়ের ভাউচার এন্ট্রি করা।" },
      { title: "লাইব্রেরিয়ান", desc: "বই তালিকাভুক্ত করা, বই ইস্যু ও ফেরতের হিসাব রাখা।" },
      { title: "অভিভাবক (Guardian Portal)", desc: "শিক্ষার্থীর উপস্থিতি, পরীক্ষার রেজাল্ট কার্ড এবং বকেয়া ফি চেক ও পরিশোধের মাধ্যম।" },
      { title: "শিক্ষার্থী (Student Portal)", desc: "রুটিন দেখা, নোটিশ পড়া, পরীক্ষার রেজাল্ট দেখা ও ডাউনলোড করা।" },
      { title: "Role-Based Access Control (RBAC)", desc: "অত্যন্ত সূক্ষ্ম পারমিশন ম্যাট্রিক্স যার মাধ্যমে নির্দিষ্ট রোলের ইউজার শুধু অনুমোদিত মডিউলেই অ্যাক্সেস পাবেন।" },
      { title: "Login System", desc: "ইমেইল/মোবাইল ও পাসওয়ার্ড ভিত্তিক সুরক্ষিত লগইন সেশন।" },
      { title: "Password Policy", desc: "সর্বনিম্ন ৮ অক্ষরের পাসওয়ার্ড যার মধ্যে অন্তত একটি বড় হাতের অক্ষর, একটি সংখ্যা ও একটি বিশেষ চিহ্ন থাকবে।" },
      { title: "Two-Factor Authentication (ঐচ্ছিক)", desc: "মোবাইল ওটিপি বা অথেনটিকেটর অ্যাপ ভিত্তিক লগইন নিরাপত্তা।" },
      { title: "Activity Log", desc: "প্রতিটি ইউজারের লগইন, লগআউট ও অ্যাকশনের রিয়েল-টাইম ট্র্যাকিং।" },
      { title: "Audit Trail", desc: "সংবেদনশীল তথ্য (যেমন: আর্থিক ট্রানজেকশন বা রেজাল্ট পরিবর্তন) কে করেছে, কখন করেছে তার সম্পূর্ণ রেকর্ড।" }
    ]
  },
  {
    id: "dashboard",
    num: "Chapter 03",
    title: "Dashboard & Analytics",
    icon: LayoutDashboard,
    description: "মাদ্রাসার তথ্যাদির আধুনিক ড্যাশবোর্ড ওভারভিউ এবং গ্রাফিকাল স্ট্যাটিস্টিকস এনালিসিস।",
    points: [
      { title: "Premium Dashboard", desc: "ইন্টারেক্টিভ ও আধুনিক গ্রাফিকাল ইন্টারফেস।" },
      { title: "Mobile Dashboard", desc: "মোবাইল স্ক্রিনের জন্য বিশেষভাবে অপ্টিমাইজড কম্প্যাক্ট লেআউট।" },
      { title: "Statistics Cards", desc: "মোট শিক্ষার্থী, মোট শিক্ষক, আজকের উপস্থিতি এবং বকেয়া ফির ইনস্ট্যান্ট কাউন্ট।" },
      { title: "Live Counter", desc: "রিয়েল-টাইম ডাটা আপডেট ইন্ডিকেটর।" },
      { title: "Attendance Summary", desc: "আজকের ছাত্র ও শিক্ষক উপস্থিতির বার চার্ট বা পাই চার্ট।" },
      { title: "Financial Summary", desc: "চলতি মাসের মোট আয়, ব্যয় ও নিট ক্যাশ ফ্লো গ্রাফ।" },
      { title: "Notice Board", desc: "সর্বশেষ ৩টি নোটিশের স্ক্রলিং স্লাইডার বা হাইলাইট গ্রিড।" },
      { title: "Upcoming Events", desc: "মাদ্রাসার ছুটির তালিকা বা পরীক্ষার সময়সূচীর নোটিফিকেশন।" },
      { title: "Calendar", desc: "ইন্টিগ্রেটেড একাডেমিক ক্যালেন্ডার ও ইভেন্ট ট্র্যাকার।" },
      { title: "Recent Activities", desc: "অতি সাম্প্রতিক হওয়া ট্রানজেকশন বা এডমিশনের সংক্ষিপ্ত তালিকা।" },
      { title: "Quick Actions", desc: "এক ক্লিকেই নতুন ভর্তি, ফি গ্রহণ বা নোটিশ দেওয়ার জন্য ভাসমান শর্টকাট বাটন।" },
      { title: "Smart Search", desc: "মাদ্রাসার যেকোনো শিক্ষার্থীর রোল বা আইডি লিখে ইন্সট্যান্ট সার্চ করার গ্লোবাল বার।" },
      { title: "Global Notification Center", desc: "গুরুত্বপূর্ণ রিয়েল-টাইম পুশ বা ইন-অ্যাপ নোটিফিকেশন বেল।" }
    ]
  },
  {
    id: "academic",
    num: "Chapter 04",
    title: "Academic Management",
    icon: BookOpen,
    description: "শ্রেণী, বিষয়, শিক্ষক বরাদ্দ এবং বার্ষিক একাডেমিক পরিকল্পনা ও রুটিন কাঠামো।",
    points: [
      { title: "Session Management", desc: "নতুন শিক্ষাবর্ষ (যেমন: ২০২৬-২৭ বা ১৪৪৭-৪৮ হিজরী) তৈরি ও সেশন পরিবর্তন।" },
      { title: "বিভাগ / মারহালা", desc: "ইবতেদায়ী, মুতাওয়াসসিতাহ, ছানাবিয়্যাহ, ফযীলত ও তাকমীল বিভাগ সমূহ নির্ধারণ।" },
      { title: "জামাত Management", desc: "প্রতিটি বিভাগের অধীনস্থ নির্দিষ্ট জামাত বা শ্রেণী (যেমন: প্রথম শ্রেণী, দ্বিতীয় শ্রেণী) তৈরি।" },
      { title: "বিষয় Management", desc: "জামাতভিত্তিক পাঠ্যবিষয় তালিকাভুক্তি।" },
      { title: "Subject Assignment", desc: "কোন জামাতে কোন কোন বিষয় পড়ানো হবে তা ম্যাপিং করা।" },
      { title: "Class Teacher Assignment", desc: "প্রতিটি জামাতের জন্য একজন দায়িত্বপ্রাপ্ত শ্রেণী শিক্ষক (নিগবান) নির্বাচন।" },
      { title: "Academic Calendar", desc: "বার্ষিক ছুটি, ক্লাস শুরু ও সমাপ্তি এবং পরীক্ষার তারিখের সমন্বিত রূপরেখা।" },
      { title: "Class Routine", desc: "দিন ও পিরিয়ড অনুযায়ী ক্লাসের সাপ্তাহিক সময়সূচী।" },
      { title: "Subject Routine", desc: "বিষয়ের শিক্ষকভিত্তিক ক্লাস ট্র্যাকিং।" }
    ]
  },
  {
    id: "students",
    num: "Chapter 05",
    title: "Student Management",
    icon: GraduationCap,
    description: "অনলাইন ভর্তি, ডিজিটাল প্রোফাইল, কিউআর কোড যুক্ত আইডি কার্ড এবং রোল ম্যানেজমেন্ট।",
    points: [
      { title: "Online Admission", desc: "আবেদনকারীদের জন্য অনলাইন আবেদন ও পেমেন্ট পোর্টাল।" },
      { title: "Student Registration", desc: "ভর্তি ফরম যাচাইয়ের পর সিস্টেমে চূড়ান্ত শিক্ষার্থীর নাম অন্তর্ভুক্ত করা।" },
      { title: "Student Profile", desc: " can শিক্ষার্থীর পূর্ণাঙ্গ প্রোফাইল (ঠিকানা, রক্তের গ্রুপ, পূর্ববর্তী প্রতিষ্ঠান ইত্যাদি)।" },
      { title: "Guardian Information", desc: "পিতা-মাতা বা স্থানীয় অভিভাবকের মোবাইল নম্বর, এনআইডি ও পেশা।" },
      { title: "Student Photo", desc: "শিক্ষার্থীর পাসপোর্ট সাইজের ছবি আপলোড ও রিসাইজ অপশন।" },
      { title: "Document Upload", desc: "জন্ম নিবন্ধন বা পূর্ববর্তী মাদ্রাসার প্রত্যয়নপত্র স্ক্যানড কপি আপলোড।" },
      { title: "Roll Management", desc: "জামাতভিত্তিক অটো রোল বা ম্যানুয়াল রোল ক্রমানুসারে সাজানো।" },
      { title: "Registration Number", desc: "প্রতি শিক্ষার্থীর জন্য ইউনিক গ্লোবাল রেজিস্ট্রেশন আইডি।" },
      { title: "QR Code", desc: "আইডি কার্ডের জন্য বিশেষ কিউআর কোড জেনারেশন যা স্ক্যান করলে শিক্ষার্থীর প্রোফাইল প্রিভিউ দেখা যাবে।" },
      { title: "Barcode", desc: "লাইব্রেরির বই ইস্যুর জন্য বারকোড ম্যাপিং।" },
      { title: "Student Status", desc: "নিয়মিত, অনিয়মিত, বহিষ্কৃত বা ড্রপআউট স্ট্যাটাস ট্র্যাক করা।" },
      { title: "Promotion", desc: "পরীক্ষার ফলাফলের উপর ভিত্তি করে এক জামাত থেকে পরবর্তী জামাতে প্রমোশন।" },
      { title: "Transfer", desc: "শাখা পরিবর্তন বা ব্যাচ রিঅ্যাসাইন।" },
      { title: "TC", desc: "প্রশংসা পত্র বা ট্রান্সফার সার্টিফিকেট প্রদান।" },
      { title: "Alumni", desc: "ফারেগিন বা উত্তীর্ণ হওয়া প্রাক্তন শিক্ষার্থীদের ঐতিহাসিক ডাটা সংরক্ষণ।" },
      { title: "Student ID Card", desc: "ডাইনামিক বারকোড/কিউআর কোড সম্বলিত আকর্ষণীয় আইডি কার্ড জেনারেটর (পিডিএফ প্রিন্ট ফ্রেন্ডলি)।" },
      { title: "Student Profile PDF", desc: "প্রতিটি শিক্ষার্থীর একক বিস্তারিত তথ্য সিট বা পিডিএফ রিপোর্ট।" }
    ]
  },
  {
    id: "hr",
    num: "Chapter 06",
    title: "Teacher & HR Management",
    icon: Users,
    description: "শিক্ষক ও কর্মকর্তা-কর্মচারীদের ডাটাবেজ, পদবি, ছুটির হিসাব এবং স্যালারি স্ট্রাকচার।",
    points: [
      { title: "Teacher Registration", desc: "শিক্ষকদের পূর্ণাঙ্গ বিবরণী, বায়োডাটা ও শিক্ষাগত যোগ্যতা সংরক্ষণ।" },
      { title: "Employee Registration", desc: "অন্যান্য স্টাফ, হিসাবরক্ষক বা খাদেমদের জন্য প্রোফাইল ডাটাবেজ।" },
      { title: "Department", desc: "শিক্ষকতা, প্রশাসন, আইটি, বা বাবুর্চিখানা বিভাগ সমূহ তৈরি।" },
      { title: "Designation", desc: "প্রধান মুফতি, সিনিয়র মুহাদ্দিস, সহকারী শিক্ষক বা হোস্টেল সুপারভাইজার পদবী নির্ধারণ।" },
      { title: "Qualification", desc: "টাইটেল, ডিগ্রি (তাকমীল, দাওরা, কামিল, মাস্টার্স ইত্যাদি)।" },
      { title: "Joining Date", desc: "শিক্ষক ও কর্মীদের যোগদানের তারিখ ও চাকুরীর মেয়াদ ট্র্যাকিং।" },
      { title: "Salary Structure", desc: "মূল বেতন, হোস্টেল ভাতা, চিকিৎসা ভাতা ও প্রভিডেন্ট ফান্ড ডিডাকশন ম্যাপিং।" },
      { title: "Leave Management", desc: "বার্ষিক ক্যাজুয়াল ও সিক লিভ রিকোয়েস্ট ও এপ্রুভাল।" },
      { title: "Attendance", desc: "ফিঙ্গারপ্রিন্ট বা ম্যানুয়াল ডিভাইসের মাধ্যমে প্রতিদিনের শিক্ষক হাজিরা।" },
      { title: "Duty Assignment", desc: "হোস্টেল পাহারা, ডাইনিং তদারকি বা নামাজের জামাতের দায়িত্ব অর্পণ।" },
      { title: "Experience Record", desc: "শিক্ষকদের পূর্ববর্তী কাজের অভিজ্ঞতা ও পদোন্নতি লগ।" },
      { title: "Teacher Panel", desc: "শিক্ষকদের নিজস্ব প্যানেল যেখানে তারা ক্লাস রুটিন ও রেজাল্ট ইনপুট দিতে পারেন।" },
      { title: "Employee Profile", desc: "মাদ্রাসার সকল অ-শিক্ষক কর্মীদের পৃথক প্রোফাইল পোর্টাল।" }
    ]
  },
  {
    id: "attendance_chap",
    num: "Chapter 07",
    title: "Attendance Management",
    icon: ClipboardList,
    description: "শিক্ষার্থী, শিক্ষক ও কর্মচারীদের কিউআর বা ম্যানুয়াল হাজিরা এবং অনুপস্থিতির স্বয়ংক্রিয় নোটিফিকেশন।",
    points: [
      { title: "Student Attendance", desc: "দৈনিক বা পিরিয়ডভিত্তিক শিক্ষার্থী উপস্থিতি রেকর্ড করা।" },
      { title: "Teacher Attendance", desc: "শিক্ষকদের উপস্থিতি ও দেরিতে আসার সময় লগ করা।" },
      { title: "Employee Attendance", desc: "কর্মকর্তা ও কর্মচারীদের কর্মদিবসের উপস্থিতি ও কর্মঘণ্টা ট্র্যাকিং।" },
      { title: "Daily Attendance", desc: "আজকের উপস্থিত-অনুপস্থিতির দ্রুত গ্রিড ভিউ।" },
      { title: "Monthly Report", desc: "প্রতি শিক্ষার্থীর মাসিক উপস্থিতির হার ও অনুপস্থিতির দিনগুলির তালিকা।" },
      { title: "QR Attendance", desc: "মোবাইল ক্যামেরা বা কিউআর স্ক্যানারের মাধ্যমে দ্রুত হাজিরা গ্রহণ।" },
      { title: "Manual Attendance", desc: "ক্লিকের মাধ্যমে উপস্থিতি, অনুপস্থিতি বা ছুটি (Leave) সিলেক্ট করার সহজ ইন্টারফেস।" },
      { title: "Attendance Correction", desc: "ভুলবশত হওয়া হাজিরা ডাটা এডিটের বিশেষ পারমিশন।" },
      { title: "Attendance Report", desc: "জামাতভিত্তিক দৈনিক বা মাসিক হাজিরা রেজিস্টার পিডিএফ/এক্সেল শিট।" },
      { title: "SMS Notification", desc: "অনুপস্থিত শিক্ষার্থীদের অভিভাবকদের মোবাইলে স্বয়ংক্রিয় অনুপস্থিতির এসএমএস অ্যালার্ট।" }
    ]
  },
  {
    id: "exam_chap",
    num: "Chapter 08",
    title: "Examination Management",
    icon: ClipboardList,
    description: "পরীক্ষা সেটআপ, আসন বিন্যাস, নম্বর এন্ট্রি, অটো জিপিএ মেধা তালিকা এবং রেজাল্ট পাবলিশ।",
    points: [
      { title: "Exam Setup", desc: "অর্ধবার্ষিক, বার্ষিক বা ত্রৈমাসিক পরীক্ষা ও তার ফি নির্ধারণ।" },
      { title: "Exam Routine", desc: "পরীক্ষার বিষয়ভিত্তিক তারিখ ও সময়সূচী ডিক্লেয়ার করা।" },
      { title: "Subject Mapping", desc: "কোন জামাতের কোন পরীক্ষা কত নম্বরে (লিখিত, মৌখিক, হিফয ইত্যাদি) হবে তার বন্টন।" },
      { title: "Admit Card", desc: "ইউনিক পরীক্ষা নম্বর ও কিউআর কোড সম্বলিত এডমিট কার্ড ডাউনলোড পোর্টাল।" },
      { title: "Seat Plan", desc: "শিক্ষার্থীদের রোল অনুযায়ী পরীক্ষা কক্ষের আসন বিন্যাস ও সিট স্লিপ জেনারেশন।" },
      { title: "Mark Entry", desc: "অত্যন্ত দ্রুত ও কীবোর্ড ফ্রেন্ডলি উপায়ে নম্বরের ইনপুট পোর্টাল।" },
      { title: "Teacher Wise Mark Entry", desc: "দায়িত্বপ্রাপ্ত শিক্ষক শুধুমাত্র তার বিষয়ের নম্বর যুক্ত করতে পারবেন।" },
      { title: "Subject Wise Mark Entry", desc: "বিষয়ভিত্তিক একক নম্বর শীট।" },
      { title: "Auto Grade", desc: "জিপিএ বা মাদ্রাসা বোর্ড অনুযায়ী স্বয়ংক্রিয় গ্রেডিং (যেমন: মুমতাজ, জায়্যিদ জিদ্দান, জায়্যিদ, মকবুল, রাসেব)।" },
      { title: "Auto GPA", desc: "প্রাপ্ত নম্বরের ভিত্তিতে স্বয়ংক্রিয় গড় গ্রেড গণনা।" },
      { title: "Auto Position", desc: "মেধা তালিকায় জামাতভিত্তিক বা সেকশনভিত্তিক স্থান (১ম, ২য়, ৩য় ইত্যাদি) স্বয়ংক্রিয়ভাবে নির্ধারণ।" },
      { title: "Auto Result", desc: "ফেল করা বিষয় সাপেক্ষে চূড়ান্ত প্রমোশন যোগ্যতা হিসাব করা।" },
      { title: "Marksheet", desc: "চমৎকার ডিজাইন সম্বলিত নাম্বারপত্র বা মার্কশীট জেনারেটর।" },
      { title: "Tabulation Sheet", desc: "পুরো ক্লাসের সকল বিষয়ের প্রাপ্ত নম্বরের এক নজরের বড় স্প্রেডশীট রিপোর্ট।" },
      { title: "Transcript", desc: "একাডেমিক ট্রান্সক্রিপ্ট যা মাদ্রাসার office-িয়াল স্বাক্ষরের জন্য প্রস্তুত।" },
      { title: "Result Publish", desc: "এক ক্লিকে অনলাইনে রেজাল্ট লাইভ করা।" },
      { title: "Result Verification", desc: "কিউআর কোড স্ক্যান করে অনলাইন ডাটাবেজের সাথে রেজাল্টের সত্যতা যাচাই।" },
      { title: "Result PDF", desc: "সিঙ্গেল এবং কালেক্টিভ রেজাল্ট পিডিএফ শিট।" }
    ]
  },
  {
    id: "finance_chap",
    num: "Chapter 09",
    title: "Financial Management",
    icon: Coins,
    description: "ফি কাঠামো, বকেয়া আদায়, রসিদ প্রিন্টিং, শিক্ষক ও স্টাফ বেতন এবং মাদ্রাসার ক্যাশ বুক লেজার।",
    points: [
      { title: "Fee Structure", desc: "ক্যাটাগরি অনুযায়ী ফি নির্ধারণ (যেমন: ভর্তি ফি, মাসিক বেতন, বোর্ডিং ফি, পরীক্ষা ফি)।" },
      { title: "Monthly Fee", desc: "স্বয়ংক্রিয়ভাবে প্রতি মাসের শুরুতে বকেয়া জেনারেট হওয়া।" },
      { title: "Admission Fee", desc: "ভর্তি প্রক্রিয়ার সময় নেওয়া এককালীন ফি।" },
      { title: "Hostel Fee", desc: "হোস্টেল ও বোর্ডিং সুবিধাপ্রাপ্ত ছাত্রদের আবাসন ফি।" },
      { title: "Transport Fee", desc: "মাদ্রাসার যাতায়াত গাড়ির ফি ট্র্যাকিং।" },
      { title: "Salary", desc: "শিক্ষক ও কর্মচারীদের প্রদেয় মাসিক বেতনের শীট তৈরি ও ব্যাংক/ক্যাশ পেমেন্ট।" },
      { title: "Expense", desc: "মাদ্রাসার দৈনন্দিন খরচ (বাজার খরচ, কারেন্ট বিল, মেরামত ইত্যাদি) ভাউচার সহ ট্র্যাকিং।" },
      { title: "Income", desc: "অনুদান, লিল্লাহ ফান্ড, সদকা, চামড়া বিক্রয় ইত্যাদি থেকে অর্জিত আয় মডিউল।" },
      { title: "Voucher", desc: "ক্যাশ রিসিভ ভাউচার এবং পেমেন্ট ভাউচার নম্বর জেনারেশন।" },
      { title: "Ledger", desc: "সাধারণ খতিয়ান এবং ক্যাটাগরিভিত্তিক লেজার রিপোর্ট।" },
      { title: "Invoice", desc: "সকল রিসিভড ফি-এর জন্য ইউনিক রানিং ইনভয়েস ট্র্যাকিং।" },
      { title: "Money Receipt", desc: "পেমেন্ট পাওয়ার সাথে সাথেই ডিজিটাল মানি রিসিট প্রিন্টিং সুবিধা।" },
      { title: "Due Collection", desc: "বকেয়া ফি-এর তালিকা এবং বকেয়া আদায়ের তাগিদ এসএমএস।" },
      { title: "Scholarship", desc: "মেধাবী ও দরিদ্র শিক্ষার্থীদের জন্য মাসিক বিশেষ বৃত্তি।" },
      { title: "Waiver", desc: "বিশেষ ছাড় বা ফি মওকুফের অনুমোদন প্রক্রিয়া।" },
      { title: "Financial Dashboard", desc: "আয়ের সোর্স ও ব্যয়ের খাত সম্বলিত বিস্তারিত চার্ট।" },
      { title: "Cash Book", desc: "ক্যাশ ইন হ্যান্ড এবং ব্যাংক ব্যালেন্সের দৈনিক খতিয়ান রিপোর্ট।" }
    ]
  },
  {
    id: "library",
    num: "Chapter 10",
    title: "Library & Asset Management",
    icon: BookOpen,
    description: "বইয়ের ক্যাটালগিং, ধার দেওয়া-নেওয়া, জরিমানা ও মাদ্রাসার মূল্যবান স্থায়ী সম্পদ রেজিস্টার ট্র্যাকিং।",
    points: [
      { title: "Book Management", desc: "লাইব্রেরির বইয়ের নাম, লেখক, ক্যাটাগরি, শেলফ নম্বর এবং মোট স্টক ট্র্যাকিং।" },
      { title: "Issue Book", desc: "শিক্ষার্থীদের বা শিক্ষকদের নির্দিষ্ট মেয়াদে বই ধার দেওয়া।" },
      { title: "Return Book", desc: "বই ফেরত নেওয়া এবং দেরির জন্য জরিমানা ক্যালকুলেশন।" },
      { title: "Fine Calculation", desc: "দিনপ্রতি জরিমানা হার নির্ধারণ ও আদায়।" },
      { title: "Barcode", desc: "বইয়ের গায়ে লাগানোর জন্য ইউনিক বারকোড স্লিপ প্রিন্ট।" },
      { title: "Inventory", desc: "লাইব্রেরির বাইরে মাদ্রাসার আসবাবপত্র, ফ্যান, এসি, এবং হোস্টেলের জিনিসপত্রের তালিকা।" },
      { title: "Asset Tracking", desc: "ড্যামেজ বা মেরামতযোগ্য সম্পদের অবচয় ও বর্তমান অবস্থার বিবরণ।" }
    ]
  },
  {
    id: "communication",
    num: "Chapter 11",
    title: "Communication System",
    icon: Bell,
    description: "এসএমএস গেটওয়ে, পুশ নোটিফিকেশন, ডিজিটাল নোটিশ বোর্ড এবং হোয়াটসঅ্যাপ এলার্ট।",
    points: [
      { title: "SMS Gateway", desc: "দেশীয় জনপ্রিয় এসএমএস গেটওয়ে (যেমন: Greenweb, Teletalk, BulkSMS) ইন্টিগ্রেশন।" },
      { title: "Email Notification", desc: "মেইলের মাধ্যমে গুরুত্বপূর্ণ ফাইল বা ফি রসিদ পাঠানো।" },
      { title: "Notice Management", desc: "গ্লোবাল নোটিশ বোর্ড বা নির্দিষ্ট রোলভিত্তিক ডিজিটাল নোটিশ বোর্ড।" },
      { title: "Announcement", desc: "জরুরী বার্তা বা সভার ঘোষণা ব্যানার।" },
      { title: "Push Notification", desc: "মোবাইল ও ওয়েব অ্যাপে ইন্সট্যান্ট পুশ অ্যালার্ট।" },
      { title: "WhatsApp Integration (Optional)", desc: "হোয়াটসঅ্যাপ এপিআই-এর মাধ্যমে নোটিশ বা রিপোর্ট পাঠানো।" }
    ]
  },
  {
    id: "reports_chap",
    num: "Chapter 12",
    title: "Reports & Export",
    icon: FileText,
    description: "উপস্থিতি, ফলাফল ও আর্থিক খাতের কাস্টম রিপোর্ট পিডিএফ, এক্সেল ও সিএসভি আকারে ডাউনলোড।",
    points: [
      { title: "Student Reports", desc: "জামাতভিত্তিক, জেন্ডারভিত্তিক, বোর্ডিং টাইপভিত্তিক শিক্ষার্থীর সংখ্যা ও বিবরণী।" },
      { title: "Teacher Reports", desc: "শিক্ষকদের হাজিরা রেকর্ড এবং কাজের পারফরম্যান্স রিপোর্ট।" },
      { title: "Attendance Reports", desc: "আজকের অনুপস্থিতির লিস্ট এবং দীর্ঘমেয়াদী উপস্থিতির অনুপাত।" },
      { title: "Result Reports", desc: "পাশের হার, জিপিএ-৫ প্রাপ্তদের তালিকা এবং ফেলের কারণ বিশ্লেষণ।" },
      { title: "Salary Reports", desc: "বাৎসরিক প্রদেয় বেতনের সারাংশ ও ট্যাক্স রিপোর্ট।" },
      { title: "Financial Reports", desc: "লাভ-ক্ষতির খতিয়ান (Profit & Loss Statement) এবং ক্যাশ ফ্লো ডাইনামিক ফিল্টার।" },
      { title: "SMS Reports", desc: "প্রেরিত এসএমএস-এর সংখ্যা এবং ডেলিভারি স্ট্যাটাস ট্র্যাকিং।" },
      { title: "User Activity Reports", desc: "কোন ইউজার সিস্টেমের কোন তথ্য পরিবর্তন করেছেন তার লগ।" },
      { title: "Custom Reports", desc: "ব্যবহারকারী তার প্রয়োজনমতো কলাম সিলেক্ট করে কাস্টম পিডিএফ বা এক্সেল তৈরি করতে পারেন।" },
      { title: "PDF Export", desc: "প্রতিটি তালিকার জন্য স্ট্যান্ডার্ড প্রিন্ট ফ্রেন্ডলি পিডিএফ জেনারেটর।" },
      { title: "Excel Export", desc: "ডাটা এনালিসিসের জন্য Spreadshet (.xlsx) ফর্ম্যাটে ডাউনলোড।" },
      { title: "CSV Export", desc: "হালকা ওজনের ডাটা ট্রান্সফারের জন্য কমা সেপারেটেড ভ্যালু ব্যাকআপ।" },
      { title: "Print Friendly Layout", desc: "ব্রাউজার প্রিন্ট ডায়ালগের জন্য সুন্দর সিএসএস লেআউট কাস্টমাইজেশন।" }
    ]
  },
  {
    id: "automation",
    num: "Chapter 13",
    title: "Automation System",
    icon: Workflow,
    description: "অটো রোল, প্রবেশপত্র, প্রশংসাপত্র, রসিদ এবং দৈনিক ক্লাউড ডেটাবেজ ব্যাকআপ অটোমেশন।",
    points: [
      { title: "Auto Student ID", desc: "ভর্তির সাথে সাথেই ইউনিক সিরিয়াল ও ইয়ার কোড নিয়ে আইডি জেনারেট হওয়া।" },
      { title: "Auto Roll", desc: "পূর্বের ডাটা বা মেধার ভিত্তিতে স্বয়ংক্রিয় রোল নির্ধারণ।" },
      { title: "Auto Registration Number", desc: "প্রতি সেশনে অটো-ইনক্রিমেন্টেড সিকিউরড রেজিস্ট্রেশন নম্বর।" },
      { title: "Auto Admit Card", desc: "এক্সাম ফি পরিশোধিত থাকলে স্বয়ংক্রিয়ভাবে প্রবেশপত্র ডাউনলোডের সুবিধা।" },
      { title: "Auto Marksheet", desc: "ইনপুটকৃত নম্বরের ভিত্তিতে রিয়েল-টাইম জিপিএ ও গ্রেড সহ মার্কশীট জেনারেট।" },
      { title: "Auto Certificate", desc: "ফারেগিন বা তাকমীল উত্তীর্ণদের জন্য আকর্ষণীয় অটোমেটিক প্রশংসাপত্র/সনদ।" },
      { title: "Auto Testimonial", desc: "চারিত্রিক সনদপত্রের জন্য ডাইনামিক ওয়ার্ড-প্লেসমেন্ট।" },
      { title: "Auto Salary Slip", desc: "প্রতি মাসের বেতনের পর ইমেইলে স্বয়ংক্রিয় স্যালারি স্লিপ প্রেরণ।" },
      { title: "Auto Money Receipt", desc: "অনাবাসিক বা আবাসিক ছাত্রদের ফি পরিশোধের সাথে সাথে মোবাইল এসএমএস ও পিডিএফ রসিদ জেনারেশন।" },
      { title: "Auto Invoice", desc: "ফি বকেয়া হওয়ার সাথে সাথেই ইনভয়েস জেনারেট হওয়া।" },
      { title: "Auto QR Code", desc: "প্রতি প্রতিটি প্রোফাইল ও ডকুমেন্টের জন্য অনন্য ভেরিফিকেশন কিউআর কোড।" },
      { title: "Auto Backup", desc: "দৈনিক বা সাপ্তাহিক ডাটাবেজ ব্যাকআপ অটো ক্লাউড স্টোরেজে (যেমন: Google Drive / S3) পাঠানো।" },
      { title: "Auto Notification", desc: "กำหนด নির্ধারিত কোনো কাজ বা ছুটির দিন থাকলে স্বয়ংক্রিয় অ্যালার্ট।" },
      { title: "Auto SMS", desc: "জন্মদিন, রমজান শুভেচ্ছা বা পরীক্ষার আগের দিন অটোমেটিক রিমাইন্ডার বার্তা।" },
      { title: "Auto Report Generation", desc: "প্রতি মাসের শেষে ডিরেক্টরের ইমেইলে মাদ্রাসার সার্বিক রিপোর্টের পিডিএফ চলে যাওয়া।" }
    ]
  },
  {
    id: "database",
    num: "Chapter 14",
    title: "Database Design",
    icon: Database,
    description: "৩য় নরমাল ফর্ম রিলেশনাল স্কিমা, ইনডেক্সিং পলিসি, সিকিউরড ট্র্যাশ ও সফট ডিলিট অপশন।",
    points: [
      { title: "Complete Database Schema", desc: "রিলেশনাল টেবিল স্ট্রাকচার যা ডাটা ডুপ্লিকেসি এড়ায় (3NF Normalized)।" },
      { title: "Table Structure", desc: "primary, secondary এবং mapping টেবিল সমূহের সঠিক ডাটা টাইপ বিন্যাস।" },
      { title: "Relationship Diagram", desc: "One-to-Many এবং Many-to-Many ফরেন কি (Foreign Key) রিলেশনশিপ ম্যাপিং।" },
      { title: "Foreign Keys", desc: "`ON DELETE CASCADE` বা `SET NULL` কনস্ট্রেইন্টের যথাযথ ব্যবহার।" },
      { title: "Indexing Strategy", desc: "সার্চ স্পিড বাড়াতে রোল, আইডি, রেজিস্ট্রেশন এবং ডেট কলামে ইনডেক্সিং।" },
      { title: "Backup & Restore", desc: "এক ক্লিকেই পূর্বের যেকোনো ডাটাবেজ ব্যাকআপ আপলোড করে পূর্বাবস্থায় ফিরে যাওয়ার ব্যবস্থা।" },
      { title: "Data Validation", desc: "ডাটাবেজ স্তরে টাইপ সেফটি এবং কনস্ট্রেইন্ট ভ্যালিডেশন।" },
      { title: "Audit Log", desc: "প্রতিটি ইনসার্ট, আপডেট এবং ডিলিট ট্রানজেকশনের ওল্ড ও নিউ ভ্যালু সহ লগ রাখা।" },
      { title: "Soft Delete", desc: "দুর্ঘটনাবশত ডিলিট এড়াতে `deleted_at` কলামের মাধ্যমে ডাটা হাইড রাখা, যা পরবর্তীতে রিকভার করা সম্ভব।" },
      { title: "Data Recovery", desc: "এডমিন প্যানেলের ট্র্যাশ বিন থেকে ডাটা পুনরুদ্ধারের ব্যবস্থা।" }
    ]
  },
  {
    id: "responsive",
    num: "Chapter 15",
    title: "Mobile & Responsive UI/UX",
    icon: Smartphone,
    description: "মোবাইল-ফার্স্ট ডিজাইন, টাচ টার্গেট অপ্টিমাইজেশন এবং ডার্ক ও লাইট থিমের চমৎকার সমন্বয়।",
    points: [
      { title: "Mobile-First Design", desc: "মোবাইল ডিভাইসের ওয়ান-হ্যান্ডেড ব্যবহারের জন্য সহজ নেভিগেশন ও চমৎকার ইউজার এক্সপেরিয়েন্স।" },
      { title: "Responsive Dashboard", desc: "ডেস্কটপ, ট্যাবলেট এবং মোবাইলে সমানভাবে সুন্দর ও কার্যকরী লেআউট।" },
      { title: "Teacher Panel", desc: "শিক্ষকদের ক্লাসরুমের দাঁড়িয়ে মোবাইল থেকেই দ্রুত হাজিরা ও মার্ক এন্ট্রির উপযোগী ডিজাইন।" },
      { title: "Student Panel", desc: "শিক্ষার্থীদের পরীক্ষার ফলাফল ও রুটিন দেখার সহজ ও পরিচ্ছন্ন মোবাইল স্ক্রিন।" },
      { title: "Guardian Panel", desc: "অত্যন্ত সাধারণ অভিভাবকদের জন্যও বোঝার মতো সহজ ও বড় বড় ফন্ট-আইকন সম্বলিত স্ক্রিন।" },
      { title: "Search Optimization", desc: "মোবাইল স্ক্রিনেও সহজে সার্চ করার সুবিধাজনক পজিশনিং।" },
      { title: "Sidebar", desc: "সোয়াইপ-টু-ওপেন বা টগল কলাপ্সিবল মেনুবার।" },
      { title: "Navigation", desc: "বটম নেভিগেশন বার (মোবাইলের জন্য) এবং সাইড নেভিগেশন বার (ডেস্কটপের জন্য)।" },
      { title: "Touch-Friendly Interface", desc: "বড় টাচ টার্গেট (কমপক্ষে ৪৪x৪৪ পিক্সেল) এবং কোনো বাটন বা ইনপুট কাছাকাছি না রাখা।" },
      { title: "Dark & Light Theme", desc: "রাত ও দিনের আলোতে চোখের সুরক্ষার জন্য আকর্ষণীয় ডার্ক মোড এবং পরিচ্ছন্ন লাইট মোড।" },
      { title: "Performance Optimization", desc: "মোবাইলে প্রসেসর ও মেমোরি খরচ কমাতে অযথা এনিমেশন পরিহার এবং লাইটওয়েট সিএসএস ব্যবহার।" }
    ]
  },
  {
    id: "security",
    num: "Chapter 16",
    title: "Security & Performance",
    icon: ShieldCheck,
    description: "JWT অথেন্টিকেশন, XSS/CSRF নিরাপত্তা, এপিআই রেট লিমিট এবং পারফরম্যান্স ক্যাশিং।",
    points: [
      { title: "Authentication", desc: "আধুনিক এবং টেম্পার-প্রুফ JWT (JSON Web Tokens) বা ফায়ারবেজ অথেন্টিকেশন।" },
      { title: "Authorization", desc: "অ্যাকশনভিত্তিক সূক্ষ্ম পারমিশন লেভেল ভেরিফিকেশন।" },
      { title: "Permission Management", desc: "নতুন রোলের জন্য ডাইনামিক পারমিশন ম্যাপিং এডিটর।" },
      { title: "CSRF Protection", desc: "ব্রাউজারের অননুমোদিত রিকোয়েস্ট ঠেকাতে CSRF টোকেন ভ্যালিডেশন।" },
      { title: "XSS Protection", desc: "ডাইনামিক টেক্সট রেন্ডার করার সময় স্বয়ংক্রিয় এসকেপিং ও স্যানিটাইজেশন।" },
      { title: "SQL Injection Protection", desc: "ওআরএম (Drizzle/Sequelize) বা প্রিপেয়ার্ড স্টেটমেন্ট ব্যবহারের মাধ্যমে এসকিউএল ইনজেকশন প্রতিরোধ।" },
      { title: "Session Management", desc: "ইনঅ্যাক্টিভ সেশন সেশন অটো-টাইমআউট এবং রানিং সেশন ট্র্যাকিং।" },
      { title: "API Security", desc: "আইপি রেট-লিমিটিং (Rate Limiting) এবং এপিআই থ্রটলিং।" },
      { title: "File Security", desc: "আপলোডকৃত ইমেজ বা ডকুমেন্টের সাইজ ও টাইপ ভ্যালিডেশন এবং ম্যালওয়্যার স্ক্যান।" },
      { title: "Encryption", desc: "সংবেদনশীল তথ্যসমূহ (যেমন: পাসওয়ার্ড বা এনআইডি) ডাটাবেজে এনক্রিপ্ট করে সংরক্ষণ।" },
      { title: "Error Handling", desc: "কোনো ক্র্যাশ ছাড়াই সুন্দর কাস্টম এরর পেজ বা টোস্ট নোটিফিকেশন প্রদর্শন।" },
      { title: "Logging", desc: "ব্যাকএন্ড ডায়েরি সিস্টেমে রিয়েল-টাইম সিস্টেম এরর ও ওয়ার্নিং লগিং।" },
      { title: "Performance Optimization", desc: "পেজ পেজ রেন্ডার টাইম কমাতে ইমেজ অপ্টিমাইজেশন, রিঅ্যাক্ট মেমো এবং ডাইনামিক কোড স্প্লিটিং।" },
      { title: "Caching", desc: "রিঅ্যাক্ট কুয়েরি বা রেডিস ক্যাশ ব্যবহারের মাধ্যমে বারবার ডেটাবেজে রিকোয়েস্ট পাঠানো রোধ করা।" },
      { title: "Lazy Loading", desc: "রুটভিত্তিক অলস লোডিং যার ফলে প্রথম পেজ দ্রুততম সময়ে লোড হয়।" }
    ]
  },
  {
    id: "deployment",
    num: "Chapter 17",
    title: "Deployment & Maintenance",
    icon: Globe,
    description: "ক্লাউড রান কন্টেইনার ডকারাইজেশন, জিরো-ডাউনটাইম রানিং সিআই/সিডি এবং অটো ডেটাবেজ রিস্টোর।",
    points: [
      { title: "Hosting Requirements", desc: "ক্লাউড প্ল্যাটফর্ম (Google Cloud Platform / AWS / Vercel) এবং নির্ভরযোগ্য ডোমেইন।" },
      { title: "Server Configuration", desc: "ডকারাইজড লাইটওয়েট নোড জেএস এনভায়রনমেন্ট এবং রিভার্স প্রক্সি হিসেবে Nginx ব্যবহার।" },
      { title: "Database Deployment", desc: "ক্লাউড হোস্টেড রিলায়েবল ডাটাবেজ সার্ভিস (PostgreSQL Cloud SQL / Firebase Cloud Firestore)।" },
      { title: "Backup Policy", desc: "প্রতি ২৪ ঘণ্টায় স্বয়ংক্রিয় অফ-সাইট এবং অন-সাইট ব্যাকআপ সিডিউলিং।" },
      { title: "Version Control", desc: "Git এবং GitHub/GitLab ট্র্যাকিং সহ মাল্টি-ব্রাঞ্চ ডেভেলপমেন্ট প্রসেস।" },
      { title: "Update Strategy", desc: "জিরো-ডাউনটাইম ডেপ্লয়মেন্ট (CI/CD Pipelines) যাতে ব্যবহারকারীদের কাজ ব্যাহত না হয়।" },
      { title: "Maintenance Guide", desc: "সিস্টেম ট্রাবলশুটিংয়ের সহজ নির্দেশিকা এবং কন্টাক্ট সাপোর্ট ইনফরমেশন।" },
      { title: "Future Scalability", desc: "মাইক্রোসার্ভিস বা অতিরিক্ত মডিউল যুক্ত করার মতো মডুলার কোড স্ট্রাকচার।" }
    ]
  }
];

export const SRSViewer: React.FC = () => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const currentChapter = useMemo(() => {
    return srsData.find((ch) => ch.id === selectedChapterId) || srsData[0];
  }, [selectedChapterId]);

  // Find matches across all chapters
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: { chapterNum: string; chapterTitle: string; chapterId: string; pointTitle: string; pointDesc: string }[] = [];

    srsData.forEach((ch) => {
      ch.points.forEach((pt) => {
        if (
          pt.title.toLowerCase().includes(query) ||
          pt.desc.toLowerCase().includes(query) ||
          ch.title.toLowerCase().includes(query)
        ) {
          results.push({
            chapterNum: ch.num,
            chapterTitle: ch.title,
            chapterId: ch.id,
            pointTitle: pt.title,
            pointDesc: pt.desc
          });
        }
      });
    });

    return results;
  }, [searchQuery]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900/40 p-4 lg:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 font-hind-siliguri">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-900 rounded-xl p-6 md:p-8 text-white shadow-md mb-6">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
          <BookOpen size={240} />
        </div>
        <div className="relative z-10 max-w-3xl">
          <span className="bg-white/10 dark:bg-black/20 text-white border border-white/20 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Enterprise System Blueprint
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-3 tracking-tight">
            সফ্টওয়্যার রিকোয়ারমেন্ট স্পেসিফিকেশন (SRS)
          </h1>
          <p className="text-white/80 text-xs md:text-sm mt-2 max-w-2xl leading-relaxed">
            মাদ্রাসার ভর্তি, একাডেমিক, অর্থ, কর্মী, পরীক্ষা ও লাইব্রেরী অটোমেশন সহ সার্বিক মডিউলের জন্য 
            নির্ধারিত প্রাতিষ্ঠানিক নির্দেশিকা, স্ট্যান্ডার্ড এবং ডেভেলপমেন্ট মাইলস্টোন।
          </p>
        </div>
      </div>

      {/* Control Panel: Search & Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        <div className="md:col-span-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="ফিচার, সিকিউরিটি, ডাটাবেজ, অথবা রিকোয়ারমেন্টের কীওয়ার্ড দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="md:col-span-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Cpu size={16} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">মোট অধ্যায়</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">১৭টি সম্পূর্ণ অধ্যায়</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-lg">
              Enterprise Ready
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Navigation Sidebar & Chapter Details */}
      {searchQuery.trim() ? (
        /* Search Mode */
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-5 md:p-6 shadow-sm min-h-[400px]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              অনুসন্ধানের ফলাফল ({searchResults.length} টি মিল পাওয়া গেছে)
            </h2>
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-500 hover:text-emerald-600 font-semibold"
            >
              ফলাফল বন্ধ করুন
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-3">
                <Search size={28} />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-bold">কোনো মিল পাওয়া যায়নি</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">অন্য কোনো কীওয়ার্ড দিয়ে অনুসন্ধান করে দেখুন।</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {searchResults.map((res, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedChapterId(res.chapterId);
                    setSearchQuery("");
                  }}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:border-emerald-200 dark:hover:border-emerald-800/40 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/5 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                      {res.chapterNum}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px]">•</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      {res.chapterTitle}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {res.pointTitle}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                    {res.pointDesc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Regular Split Mode */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Navigation Tabs list */}
          <div className="lg:col-span-4 space-y-1.5 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar lg:sticky lg:top-4">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold px-2 uppercase tracking-wider mb-2">
              সূচীপত্র (Chapters)
            </p>
            {srsData.map((ch) => {
              const ChapterIcon = ch.icon;
              const isSelected = ch.id === selectedChapterId;
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChapterId(ch.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer group select-none",
                    isSelected
                      ? "bg-white dark:bg-slate-950 border-emerald-500/30 dark:border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/10"
                      : "bg-white/40 dark:bg-slate-950/20 border-slate-100 dark:border-slate-850 hover:bg-white dark:hover:bg-slate-950 hover:border-slate-200 dark:hover:border-slate-800"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                      isSelected
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-800"
                    )}
                  >
                    <ChapterIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[9px] font-bold uppercase tracking-wider",
                        isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                      )}
                    >
                      {ch.num}
                    </p>
                    <p
                      className={cn(
                        "text-xs font-bold truncate mt-0.5",
                        isSelected ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"
                      )}
                    >
                      {ch.title.split(" (")[0]}
                    </p>
                  </div>
                  <ChevronRight
                    size={12}
                    className={cn(
                      "transition-transform shrink-0",
                      isSelected
                        ? "text-emerald-500 translate-x-0.5"
                        : "text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5"
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Right: Selected Chapter Details */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Chapter Intro Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {currentChapter.num}
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  মডিউল স্পেসিফিকেশন
                </span>
              </div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                {currentChapter.title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed">
                {currentChapter.description}
              </p>
            </div>

            {/* Requirement Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentChapter.points.map((pt, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 hover:border-emerald-500/10 dark:hover:border-emerald-500/15 p-4 rounded-xl shadow-sm hover:shadow transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={12} />
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {pt.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                      {pt.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Target Blueprint Badge */}
            <div className="bg-slate-900 dark:bg-black/30 border border-slate-800 p-4 rounded-xl text-slate-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-emerald-400">
                  <Workflow size={14} />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Chapter Target State</p>
                  <p className="font-semibold text-white mt-0.5">১০০% ভেরিফাইড এবং প্রোডাকশন-রেডি ব্লুপ্রিন্ট</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  COMPLIANT
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
