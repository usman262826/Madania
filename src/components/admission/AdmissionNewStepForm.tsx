import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  UserCheck, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  MapPin, 
  BookOpen, 
  ClipboardList, 
  Clock, 
  Plus, 
  Phone, 
  Calendar, 
  Hash, 
  X,
  FileText
} from 'lucide-react';
import { Student } from '../../types';
import { getNextRegistrationId, getNextRollNumber } from '../../lib/googleSheetFetcher';
import { AdmissionSubNav } from '../portal/PortalModules';

interface AdmissionNewStepFormProps {
  students: Student[];
  onSave: (student: any) => Promise<void> | void;
  academicYear?: string;
  setActiveTab?: (tabId: string) => void;
}

const jamatList = [
  "আতফাল (শিশু শ্রেণী)",
  "আওয়াল (১ম শ্রেণী)",
  "ছানী (২য় শ্রেণী)",
  "ছালেছ (৩য় শ্রেণী)",
  "খুসুছি (ইবতেদায়ি রাবে)",
  "খামেস (ইবতেদায়ি খামেছ)",
  "মিযান (মুতাওয়াসসিতাহ আওয়াল)",
  "নাহবেমীর (মুতাওয়াসসিতাহ ছানি)",
  "কুদূরী (সানাবিয়্যা আউয়াল)",
  "শরহে বেকায়া (সানাবিয়্যা ছানী)",
  "হেদায়া (ফজিলত আউয়াল)",
  "মেশকাত (ফজিলত ছানী)",
  "দাওরায়ে হাদিস (তাকমিল)"
];

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

const bangladeshData: Record<string, { name: string; districts: Record<string, { name: string; upazilas: string[] }> }> = {
  dhaka: {
    name: "ঢাকা",
    districts: {
      dhaka: { name: "ঢাকা", upazilas: ["সাভার","ধামরাই","কেরানীগঞ্জ","নবাবগঞ্জ","দোহার"] },
      gazipur: { name: "গাজীপুর", upazilas: ["কালিয়াকৈর","কালীগঞ্জ","কাপাসিয়া","গাজীপুর সদর","শ্রীপুর"] },
      narayanganj: { name: "নারায়ণগঞ্জ", upazilas: ["আড়াইহাজার","বন্দর","নারায়ণগঞ্জ সদর","রূপগঞ্জ","সোনারগাঁও"] },
      narsingdi: { name: "নরসিংদী", upazilas: ["নরসিংদী সদর","বেলাবো","মনোহরদী","রায়পুরা","শিবপুর","পলাশ"] },
      manikganj: { name: "মানিকগঞ্জ", upazilas: ["মানিকগঞ্জ সদর","সিংগাইর","শিবালয়","সাটুরিয়া","হরিরামপুর","ঘিওর","দৌলতপুর"] },
      munshiganj: { name: "মুন্সীগঞ্জ", upazilas: ["মুন্সীগঞ্জ সদর","শ্রীনগর","সিরাজদিখান","লৌহজং","টংগিবাড়ী","গজারিয়া"] },
      kishoreganj: { name: "কিশোরগঞ্জ", upazilas: ["সদর","হোসেনপুর","কটিয়াদী","পাকুন্দিয়া","তাড়াইল","ইটনা","মিঠামইন","অষ্টগ্রাম","নিকলী","বাজিতপুর","কুলিয়ারচর","ভৈরব","করিমগঞ্জ"] },
      tangail: { name: "টাঙ্গাইল", upazilas: ["সদর","বাসাইল","কালিহাতী","ঘাটাইল","মির্জাপুর","নাগরপুর","মধুপুর","সখিপুর","দেলদুয়ার","ধনবাড়ী","গোপালপুর","ভূয়াপুর"] },
      faridpur: { name: "ফরিদপুর", upazilas: ["সদর","মধুখালী","বোয়ালমারী","সালথা","নগরকান্দা","আলফাডাঙ্গা","সদরপুর","চরভদ্রাসন","ভাঙ্গা"] },
      madaripur: { name: "মাদারীপুর", upazilas: ["সদর","শিবচর","কালকিনি","রাজৈর","ডাসার"] },
      shariatpur: { name: "শরীয়তপুর", upazilas: ["সদর","ডামুড্যা","নড়িয়া","জাজিরা","ভেদরগঞ্জ","গোসাইরহাট"] },
      gopalganj: { name: "গোপালগঞ্জ", upazilas: ["সদর","কোটালীপাড়া","টুঙ্গিপাড়া","কাশিয়ানী","মুকসুদপুর"] },
      rajbari: { name: "রাজবাড়ী", upazilas: ["সদর","গোয়ালন্দ","পাংশা","বালিয়াকান্দি","কালুখালী"] }
    }
  },
  chattogram: {
    name: "চট্টগ্রাম",
    districts: {
      chattogram: { name: "চট্টগ্রাম", upazilas: ["রাঙ্গুনিয়া","সীতাকুণ্ড","মীরসরাই","পটিয়া","সন্দ্বীপ","বাঁশখালী","বোয়ালখালী","আনোয়ারা","চন্দনাইশ","সাতকানিয়া","লোহাগাড়া","হাটহাজারী","ফটিকছড়ি","রাউজান","কর্ণফুলী"] },
      comilla: { name: "কুমিল্লা", upazilas: ["সদর","সদর দক্ষিণ","চৌদ্দগ্রাম","লাকসাম","বরুড়া","চান্দিনা","দাউদকান্দি","মুরাদনগর","লাঙ্গলকোট","দেবিদ্বার","মেঘনা","হোমনা","তিতাস","বুড়িচং","ব্রাহ্মণপাড়া","মনোহরগঞ্জ","লালমাই"] },
      coxsBazar: { name: "কক্সবাজার", upazilas: ["সদর","চকরিয়া","কুতুবদিয়া","উখিয়া","মহেশখালী","টেকনাফ","রামু","পেকুয়া","ঈদগাঁও"] },
      brahmanbaria: { name: "ব্রাহ্মণবাড়িয়া", upazilas: ["সদর","কসবা","নাসিরনগর","সরাইল","আশুগঞ্জ","আখাউড়া","নবীনগর","বাঞ্ছারামপুর","বিজয়নগর"] },
      chandpur: { name: "চাঁদপুর", upazilas: ["সদর","কচুয়া","শাহরাস্তি","হাজীগঞ্জ","মতলব উত্তর","মতলব দক্ষিণ","ফরিদগঞ্জ","হাইমচর"] },
      noakhali: { name: "নোয়াখালী", upazilas: ["সদর","কোম্পানীগঞ্জ","বেগমগঞ্জ","চাটখিল","সেনবাগ","হাতিয়া","সোনাইমুড়ী","কবিরহাট","সুবর্ণচর"] },
      lakshmipur: { name: "লক্ষ্মীপুর", upazilas: ["সদর","রায়পুর","রামগঞ্জ","রামগতি","কমলনগর"] },
      feni: { name: "ফেনী", upazilas: ["সদর","ছাগলনাইয়া","ফুলগাজী","পরশুরাম","দাগনভূঞা","সোনাগাজী"] },
      khagrachhari: { name: "খাগড়াছড়ি", upazilas: ["সদর","দীঘিনালা","পানছড়ি","মাটিরাঙ্গা","গুইমারা","মানিকছড়ি","রামগড়","মহালছড়ি","লক্ষ্মীছড়ি"] },
      rangamati: { name: "রাঙ্গামাটি", upazilas: ["সদর","কাপ্তাই","কাউখালী","বাঘাইছড়ি","বরকল","ল্যাঙ্গাদু","রাজস্থলী","বিলাইছড়ি","জুরাছড়ি","নানিয়ারচর"] },
      bandarban: { name: "বান্দরবান", upazilas: ["সদর","থানচি","রুমা","রোয়াংছড়ি","লামা","আলীকদম","নাইক্ষ্যংছড়ি"] }
    }
  },
  rajshahi: {
    name: "রাজশাহী",
    districts: {
      rajshahi: { name: "রাজশাহী", upazilas: ["পবা","গোদাগাড়ী","তানোর","বাগমারা","দুর্গাপুর","পুঠিয়া","চারঘাট","বাঘা","মোহনপুর"] },
      bogura: { name: "বগুড়া", upazilas: ["সদর","শিবগঞ্জ","সোনাতলা","গাবতলী","সারিয়াকান্দি","ধুনট","শেরপুর","নন্দীগ্রাম","আদমদীঘি","দুপচাঁচিয়া","কাহালু","শাজাহানপুর"] },
      pabna: { name: "পাবনা", upazilas: ["সদর","ঈশ্বরদী","আটঘরিয়া","চাটমোহর","ভাঙ্গুড়া","ফরিদপুর","বেড়া","সাঁথিয়া","সুজানগর"] },
      sirajganj: { name: "সিরাজগঞ্জ", upazilas: ["সদর","কাজিপুর","উল্লাপাড়া","শাহজাদপুর","রায়গঞ্জ","তাড়াশ","বেলকুচি","চৌহালী","কামারখন্দ"] },
      naogaon: { name: "নওগাঁ", upazilas: ["সদর","রানীনগর","আত্রাই","মহাদেবপুর","ধামইরহাট","পত্নীতলা","বদলগাছী","পোরশা","সাপাহার","নিয়ামতপুর","মান্দা"] },
      natore: { name: "নাটোর", upazilas: ["সদর","বাগাতিপাড়া","বড়াইগ্রাম","লালপুর","সিংড়া","গুরুদাসপুর","নলডাঙ্গা"] },
      chapainawabganj: { name: "চাঁপাইনবাবগঞ্জ", upazilas: ["সদর","শিবগঞ্জ","গোমস্তাপুর","নাচোল","ভোলাহাট"] },
      joypurhat: { name: "জয়পুরহাট", upazilas: ["সদর","পাঁচবিবি","আক্কেলপুর","ক্ষেতলাল","কালাই"] }
    }
  },
  khulna: {
    name: "খুলনা",
    districts: {
      khulna: { name: "খুলনা", upazilas: ["কয়রা","ডুমুরিয়া","তেরখাদা","দাকোপ","দিঘলিয়া","পাইকগাছা","ফুলতলা","বটিয়াঘাটা","রূপসা"] },
      jessore: { name: "যশোর", upazilas: ["সদর","শার্শা","ঝিকরগাছা","চৌগাছা","অভয়নগর","মণিরামপুর","কেশবপুর","বাঘারপাড়া"] },
      satkhira: { name: "সাতক্ষীরা", upazilas: ["সদর","আশাশুনি","শ্যামনগর","কালীগঞ্জ","কলারোয়া","তালা","দেবহাটা"] },
      bagerhat: { name: "বাগেরহাট", upazilas: ["সদর","ফকিরহাট","মোল্লাহাট","কচুয়া","চিতলমারী","মোড়লগঞ্জ","শরণখোলা","রামপাল","মোংলা"] },
      kushtia: { name: "কুষ্টিয়া", upazilas: ["সদর","কুমারখালী","খোকসা","মিরপুর","ভেড়ামারা","দৌলতপুর"] },
      jhenaidah: { name: "ঝিনাইদহ", upazilas: ["সদর","শৈলকূপা","হরিণাকুণ্ডু","কালীগঞ্জ","কোটচাঁদপুর","মহেশপুর"] },
      magura: { name: "মাগুরা", upazilas: ["সদর","শ্রীপুর","শালিখা","মহম্মদপুর"] },
      narail: { name: "নড়াইল", upazilas: ["সদর","লোহাগাড়া","কালিয়া"] },
      chuadanga: { name: "চুয়াডাঙ্গা", upazilas: ["সদর","আলমডাঙ্গা","দামুড়হুদা","জীবননগর"] },
      meherpur: { name: "মেহেরপুর", upazilas: ["সদর","গাংনী","উপজেলা"] }
    }
  },
  barishal: {
    name: "বরিশাল",
    districts: {
      barishal: { name: "বরিশাল", upazilas: ["সদর","বাকেরগঞ্জ","বাবুগঞ্জ","উজিরপুর","বানারীপাড়া","গৌরনদী","আগৈলঝাড়া","মেহেন্দিগঞ্জ","মুলাদী","হিজলা"] },
      bhola: { name: "ভোলা", upazilas: ["সদর","বোরহানউদ্দিন","চরফ্যাশন","দৌলতখান","মনপুরা","তজুমদ্দিন","লালমোহন"] },
      patuakhali: { name: "পটুয়াখালী", upazilas: ["সদর","বাউফল","গলাচিপা","দশমিনা","মির্জাগঞ্জ","কলাপাড়া","দুমকি","রাঙ্গাবালী"] },
      pirojpur: { name: "পিরোজপুর", upazilas: ["সদর","নাজিরপুর","কাউখালী","ভাণ্ডারিয়া","মঠবাড়িয়া","নেছারাবাদ","ইন্দুরকানী"] },
      barguna: { name: "বরগুনা", upazilas: ["সদর","আমতলী","তালতলী","পাথরঘাটা","বেতাগী","বামনা"] },
      jhalokati: { name: "ঝালকাঠি", upazilas: ["সদর","নলছিটি","রাজাপুর","কাঁঠালিয়া"] }
    }
  },
  sylhet: {
    name: "সিলেট",
    districts: {
      sylhet: { name: "সিলেট", upazilas: ["সদর","দক্ষিণ সুরমা","বিশ্বনাথ","ওসমানীনগর","বালাগঞ্জ","ফেঞ্চুগঞ্জ","গোলাপগঞ্জ","বিয়ানীবাজার","জকিগঞ্জ","কানাইঘাট","জৈন্তাপুর","গোয়াইনঘাট","কোম্পানীগঞ্জ"] },
      sunamganj: { name: "সুনামগঞ্জ", upazilas: ["সদর","শান্তিগঞ্জ","দোয়ারাবাজার","ছাতক","দিরাই","শাল্লা","ধর্মপাশা","জামালগঞ্জ","তাহিরপুর","জগন্নাথপুর","বিশ্বম্ভরপুর","মধ্যনগর"] },
      habiganj: { name: "হবিগঞ্জ", upazilas: ["সদর","লাখাই","মাধবপুর","চুনারুঘাট","বাহুবল","নবীগঞ্জ","আজমিরীগঞ্জ","বানিয়াচং","শায়েস্তাগঞ্জ"] },
      maulvibazar: { name: "মৌলভীবাজার", upazilas: ["সদর","শ্রীমঙ্গল","রাজনগর","কুলাউড়া","বড়লেখা","কমলগঞ্জ","জুড়ী"] }
    }
  },
  rangpur: {
    name: "রংপুর",
    districts: {
      rangpur: { name: "রংপুর", upazilas: ["সদর","মিঠাপুকুর","গঙ্গাচড়া","কাউনিয়া","পীরগাছা","পীরগঞ্জ","তারাগঞ্জ","বদরগঞ্জ"] },
      dinajpur: { name: "দিনাজপুর", upazilas: ["সদর","বিরল","বোচাগঞ্জ","কাহারোল","বীরগঞ্জ","খানসামা","চিরিরবন্দর","পার্বতীপুর","ফুলবাড়ী","বিরামপুর","নবাবগঞ্জ","ঘোড়াঘাট","হাকিমপুর"] },
      kurigram: { name: "কুড়িগ্রাম", upazilas: ["সদর","উলিপুর","চিলমারী","রৌমারী","রাজিবপুর","রাজারহাট","নাগেশ্বরী","ভুরুঙ্গামারী","ফুলবাড়ী"] },
      gaibandha: { name: "গাইবান্ধা", upazilas: ["সদর","সাদুল্লাপুর","গোবিন্দগঞ্জ","ফুলছড়ি","সাঘাটা","পলাশবাড়ী","সুন্দরগঞ্জ"] },
      nilphamari: { name: "নীলফামারী", upazilas: ["সদর","সৈয়দপুর","জলঢাকা","কিশোরগঞ্জ","ডোমার","ডিমলা"] },
      thakurgaon: { name: "ঠাকুরগাঁও", upazilas: ["সদর","পীরগঞ্জ","রাণীশংকৈল","বালিয়াডাঙ্গী","হরিপুর"] },
      panchagarh: { name: "পঞ্চগড়", upazilas: ["সদর","তেঁতুলিয়া","দেবীগঞ্জ","বোদা","আটোয়ারী"] },
      lalmonirhat: { name: "লালমনিরহাট", upazilas: ["সদর","আদিতমারী","কালীগঞ্জ","হাতীবান্ধা","পাটগ্রাম"] }
    }
  },
  mymensingh: {
    name: "ময়মনসিংহ",
    districts: {
      mymensingh: { name: "ময়মনসিংহ", upazilas: ["সদর","মুক্তাগাছা","ফুলবাড়িয়া","ত্রিশাল","ভালুকা","গফরগাঁও","নান্দাইল","ঈশ্বরগঞ্জ","গৌরীপুর","ফুলপুর","তারাকান্দা","হালুয়াঘাট","ধোবাউড়া"] },
      netrokona: { name: "নেত্রকোণা", upazilas: ["সদর","বারহাট্টা","কলমাকান্দা","দুর্গাপুর","পূর্বধলা","কেন্দুয়া","মদন","খালিয়াজুরী","মোহনগঞ্জ","আটপাড়া"] },
      jamalpur: { name: "জামালপুর", upazilas: ["সদর","সরিষাবাড়ী","মেলান্দহ","ইসলামপুর","দেওয়ানগঞ্জ","মাদারগঞ্জ","বকশীগঞ্জ"] },
      sherpur: { name: "শেরপুর", upazilas: ["সদর","নালিতাবাড়ী","শ্রীবরদী","ঝিনাইগাতী","নকলা"] }
    }
  }
};

const getNextClass = (current: string) => {
  const idx = jamatList.indexOf(current);
  if (idx !== -1 && idx + 1 < jamatList.length) {
    return jamatList[idx + 1];
  }
  return current || jamatList[0];
};

export const AdmissionNewStepForm: React.FC<AdmissionNewStepFormProps> = ({
  students,
  onSave,
  academicYear = "১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী",
  setActiveTab
}) => {
  // Main view state: 'selection' | 'oldSearch' | 'form' | 'pending' | 'duplicateModal'
  const [viewState, setViewState] = useState<'selection' | 'oldSearch' | 'form' | 'pending' | 'duplicateModal'>('selection');
  const [studentType, setStudentType] = useState<'new' | 'old'>('new');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Old student search state
  const [oldSearch, setOldSearch] = useState({
    academicYear: "১৪৪৫-৪৬ হিজরী/২০২৫-২৬ ঈসায়ী",
    jamat: jamatList[0],
    regNo: "",
    rollNo: ""
  });
  const [oldSearchResultModal, setOldSearchResultModal] = useState<any>(null);

  // Messaging apps state
  const [selectedApps, setSelectedApps] = useState<string[]>(['WhatsApp']);

  // Address Cascading State
  const [division, setDivision] = useState<string>('chattogram');
  const [district, setDistrict] = useState<string>('comilla');
  const [upazila, setUpazila] = useState<string>('মেঘনা');
  const [postOffice, setPostOffice] = useState<string>('লুটেরচর');
  const [village, setVillage] = useState<string>('কান্দারগাঁও');
  const [sameAsPermanent, setSameAsPermanent] = useState<boolean>(true);

  // Main Form Data State
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    dob: '',
    birthReg: '',
    mobile: '',
    altMobile: '',
    email: '',
    bloodGroup: '',
    prevMadrasa: '',
    prevYear: '১৪৪৬-৪৭ হিজরী/২০২৫-২৬ ঈসায়ী',
    prevClass: jamatList[0],
    currentYear: academicYear,
    desiredClass: jamatList[0],
    comment: '',
    applicationId: getNextRegistrationId(students),
    rollNo: getNextRollNumber(students, jamatList[0], academicYear)
  });

  // Auto-update rollNo when desiredClass or currentYear changes
  React.useEffect(() => {
    const nextRoll = getNextRollNumber(students, formData.desiredClass, formData.currentYear);
    setFormData(prev => ({ ...prev, rollNo: nextRoll }));
  }, [formData.desiredClass, formData.currentYear, students]);

  // Duplicate Check Target Info
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);

  // Format full address
  const fullAddress = useMemo(() => {
    const divObj = bangladeshData[division];
    const divName = divObj?.name || division;
    const distName = divObj?.districts[district]?.name || district;
    return `${village}, ${postOffice}, ${upazila}, ${distName}`;
  }, [village, postOffice, upazila, district, division]);

  // Handle messaging app toggle
  const toggleApp = (appName: string) => {
    if (selectedApps.includes(appName)) {
      setSelectedApps(selectedApps.filter(a => a !== appName));
    } else {
      setSelectedApps([...selectedApps, appName]);
    }
  };

  // Digit conversion helper
  const toEnglishDigits = (str: string) => {
    const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    const en = ['0','1','2','3','4','5','6','7','8','9'];
    let res = str || '';
    for (let i = 0; i < 10; i++) {
      res = res.replaceAll(bn[i], en[i]);
    }
    return res.trim();
  };

  // Old Student Verification Search Logic
  const handleOldSearch = () => {
    if (!oldSearch.regNo.trim() && !oldSearch.rollNo.trim()) {
      setErrorMessage("দয়া করে রেজিস্ট্রেশন/আইডি অথবা রোল নম্বর দিন।");
      return;
    }

    setErrorMessage(null);
    const queryReg = toEnglishDigits(oldSearch.regNo).toLowerCase();
    const queryRoll = toEnglishDigits(oldSearch.rollNo).toLowerCase();
    const queryJamat = (oldSearch.jamat || '').trim().toLowerCase();

    // Match against database students
    const found = students.find((s: any) => {
      if (!s) return false;
      const sIdRaw = String(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || s.id || '');
      const sRollRaw = String(s['রোল নম্বর'] || s.roll || '');
      const sClassRaw = String(s['জামাত/শ্রেণী'] || s['জামাত'] || s['শ্রেণী'] || s.class || '');

      const sId = toEnglishDigits(sIdRaw).toLowerCase();
      const sRoll = toEnglishDigits(sRollRaw).toLowerCase();
      const sClass = sClassRaw.toLowerCase();

      const matchReg = queryReg ? (sId === queryReg || sId.endsWith(queryReg) || sId.includes(queryReg)) : true;
      const matchRoll = queryRoll ? (sRoll === queryRoll) : true;
      const matchJamat = (!queryReg && queryRoll && queryJamat) ? (sClass.includes(queryJamat) || queryJamat.includes(sClass)) : true;

      return matchReg && matchRoll && matchJamat;
    });

    if (found) {
      const prevClassVal = found['জামাত/শ্রেণী'] || found['জামাত'] || oldSearch.jamat;
      const nextCls = getNextClass(prevClassVal);
      
      setFormData(prev => ({
        ...prev,
        fullName: found['শিক্ষার্থীর নাম'] || found.name || '',
        fatherName: found['পিতার নাম'] || found.fatherName || found.father || '',
        motherName: found['মাতার নাম'] || found.motherName || found.mother || '',
        dob: found['জন্ম তারিখ'] || found.dob || '',
        birthReg: found['জন্ম নিবন্ধন নাম্বার'] || found['জন্ম নিবন্ধন সনদ নম্বর'] || found['জন্ম নিবন্ধন/NID নং'] || found.birthRegNo || '',
        mobile: found['মোবাইল (মা)'] || found['অভিভাবকের মোবাইল'] || found.mobile || '',
        altMobile: found['মোবাইল (বাবা/ভাই)'] || found.altMobile || found.phone || '',
        email: found['ইমেইল'] || found.email || '',
        bloodGroup: found['রক্তের গ্রুপ'] || found.bloodGroup || '',
        prevYear: found.academicYearLabel || found['শিক্ষাবর্ষ'] || oldSearch.academicYear || '১৪৪৬-৪৭ হিজরী/২০২৫-২৬ ঈসায়ী',
        prevClass: prevClassVal,
        desiredClass: nextCls
      }));

      // Parse address if available
      const rawAddr = found['ঠিকানা'] || found['বর্তমান ঠিকানা'] || '';
      if (rawAddr) {
        const parts = rawAddr.split(/[,।]/).map((p: string) => p.trim()).filter(Boolean);
        if (parts.length > 0) setVillage(parts[0]);
        if (parts.length > 1) setPostOffice(parts[1]);
        if (parts.length > 2) setUpazila(parts[2]);
        if (parts.length > 3) setDistrict(parts[3]);
      }

      setStudentType('old');
      setOldSearchResultModal({
        name: found['শিক্ষার্থীর নাম'] || found.name || 'শিক্ষার্থী',
        father: found['পিতার নাম'] || found.fatherName || '—',
        mother: found['মাতার নাম'] || found.motherName || '—',
        dob: found['জন্ম তারিখ'] || found.dob || '—',
        birthReg: found['জন্ম নিবন্ধন নাম্বার'] || found['জন্ম নিবন্ধন সনদ নম্বর'] || '—',
        prevJamat: prevClassVal,
        nextJamat: nextCls
      });
    } else {
      alert("❌ তথ্য পাওয়া যায়নি! সঠিক তথ্য দিন অথবা নতুন ছাত্রী হিসেবে আবেদন করুন।");
    }
  };

  // Validate step navigation
  const validateStep = (step: number) => {
    setErrorMessage(null);
    if (step === 1) {
      if (!formData.fullName.trim()) return "শিক্ষার্থীর পূর্ণ নাম লিখুন";
      if (!formData.fatherName.trim()) return "পিতার নাম লিখুন";
      if (!formData.dob) return "জন্ম তারিখ নির্বাচন করুন";
      if (!formData.birthReg.trim()) return "জন্ম নিবন্ধন নম্বর লিখুন";
      if (!formData.mobile.trim() || formData.mobile.length !== 11) return "অভিভাবকের ১১ ডিজিটের সঠিক মোবাইল নম্বর (মা) দিন";
      if (!formData.altMobile.trim() || formData.altMobile.length !== 11) return "অভিভাবকের ১১ ডিজিটের সঠিক বিকল্প মোবাইল (বাবা/ভাই) দিন";
    }
    if (step === 2) {
      if (!postOffice.trim()) return "ডাকঘর/পোস্ট অফিস লিখুন";
      if (!village.trim()) return "গ্রাম/মহল্লা লিখুন";
    }
    if (step === 3) {
      if (studentType === 'new') {
        if (!formData.prevMadrasa.trim()) return "পূর্বের মাদ্রাসার নাম লিখুন";
        if (!formData.prevClass) return "পূর্বের জামাত নির্বাচন করুন";
      }
      if (!formData.desiredClass) return "ভর্তি জামাত নির্বাচন করুন";
    }
    return null;
  };

  const nextStep = () => {
    const error = validateStep(currentStep);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      setViewState('selection');
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Form Submit Handlers
  const handleFinalSubmit = async () => {
    // 1. Duplicate check against student database
    const queryName = formData.fullName.trim().toLowerCase();
    const queryFather = formData.fatherName.trim().toLowerCase();

    const existingStudent = students.find((s: any) => {
      const sName = (s['শিক্ষার্থীর নাম'] || s.name || '').toString().toLowerCase();
      const sFather = (s['পিতার নাম'] || s.fatherName || '').toString().toLowerCase();
      return sName === queryName && sFather === queryFather;
    });

    if (existingStudent) {
      setDuplicateInfo({
        name: formData.fullName,
        father: formData.fatherName,
        message: "আপনি ইতিমধ্যে বর্তমান অথবা পূর্বের শিক্ষাবর্ষে নথিবদ্ধ আছেন।"
      });
      setViewState('duplicateModal');
      return;
    }

    setIsSubmitting(true);
    const classDetail = classDetailsMap[formData.desiredClass] || { marhala: '', jamatClass: '', somoman: '' };
    const nowStr = new Date().toLocaleString('bn-BD', { hour12: true });

    const newStudentPayload = {
      'মঞ্জুরের তারিখ ও সময়': nowStr,
      'শিক্ষাবর্ষ': formData.currentYear,
      'জামাত': formData.desiredClass,
      'রেজিস্ট্রেশন/আইডি': formData.applicationId.replace('APP-', ''),
      'রেজিস্ট্রেশন/আইডি নম্বর': formData.applicationId.replace('APP-', ''),
      'রোল নম্বর': formData.rollNo,
      'শিক্ষার্থীর নাম': formData.fullName,
      'পিতার নাম': formData.fatherName,
      'মাতার নাম': formData.motherName,
      'মোবাইল (মা)': formData.mobile,
      'মোবাইল (বাবা/ভাই)': formData.altMobile,
      'অভিভাবকের মোবাইল': formData.mobile,
      'জন্ম নিবন্ধন নাম্বার': formData.birthReg,
      'জন্ম তারিখ': formData.dob,
      'ইমেইল': formData.email,
      'রক্তের গ্রুপ': formData.bloodGroup || 'জানা নেই',
      'ঠিকানা': fullAddress,
      'শিক্ষার্থী ধরণ': 'আবাসিক',
      'শিক্ষার্থী ধরণ/স্ট্যাটাস': 'সক্রিয়',
      'পূর্বের মাদ্রাসা': studentType === 'new' ? formData.prevMadrasa : 'আমাদের মাদ্রাসা',
      'পূর্বের জামাত': studentType === 'new' ? formData.prevClass : 'পূর্বের সেশন',
      'স্ট্যাটাস': 'Active',
      'মেসেজিং অ্যাপ': selectedApps.join(', '),
      'মন্তব্য': formData.comment,
      'আবেদন নং': formData.applicationId,
      'মারহালা': classDetail.marhala,
      'জামাত/শ্রেণী': classDetail.jamatClass,
      'সমমান': classDetail.somoman,
      'আবেদন টাইপ': studentType === 'new' ? 'নতুন শিক্ষার্থী' : 'পুরাতন শিক্ষার্থী',
    };

    try {
      await onSave(newStudentPayload);
      setIsSubmitting(false);
      setViewState('pending');
    } catch (e) {
      setIsSubmitting(false);
      alert('আবেদন জমা দিতে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন।');
    }
  };

  return (
    <div className="space-y-6 font-hind-siliguri text-text-main max-w-4xl mx-auto text-left">
      {/* Sub Navigation */}
      <AdmissionSubNav activeTabId="admission-new" setActiveTab={setActiveTab} />

      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: SELECTION CARD (নতুন শিক্ষার্থী vs পুরাতন শিক্ষার্থী) */}
      {/* ------------------------------------------------------------- */}
      {viewState === 'selection' && (
        <div className="p-8 sm:p-10 bg-card border border-border-main/80 rounded-3xl shadow-xl text-center space-y-8 animate-fadeIn">
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-text-main">আবেদনকারীর ধরন নির্বাচন করুন</h2>
            <p className="text-xs text-text-light font-semibold">
              অনলাইন ভর্তি ফর্মে অগ্রগতির জন্য উপযুক্ত বিকল্প নির্বাচন করুন
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* New Student Option */}
            <button
              onClick={() => {
                setStudentType('new');
                setViewState('form');
                setCurrentStep(1);
              }}
              className="p-6 sm:p-8 rounded-2xl bg-primary/10 border-2 border-primary/30 hover:border-primary hover:bg-primary/15 transition-all text-left space-y-3 cursor-pointer group shadow-lg shadow-primary/5 active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-primary group-hover:text-primary-dark">
                  নতুন শিক্ষার্থী
                </h3>
                <p className="text-xs text-text-light/80 font-bold leading-relaxed mt-1">
                  এই মাদ্রাসায় প্রথমবার ভর্তি হতে আসা নতুন ছাত্রীদের জন্য আবেদন পত্র
                </p>
              </div>
            </button>

            {/* Old Student Option */}
            <button
              onClick={() => {
                setViewState('oldSearch');
              }}
              className="p-6 sm:p-8 rounded-2xl bg-step-bg border-2 border-border-main hover:border-primary/60 hover:bg-card transition-all text-left space-y-3 cursor-pointer group shadow-md active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-text-main group-hover:text-emerald-600">
                  পুরাতন শিক্ষার্থী
                </h3>
                <p className="text-xs text-text-light/80 font-bold leading-relaxed mt-1">
                  পূর্ববর্তী হিজরী/ঈসায়ী শিক্ষাবর্ষে নিবন্ধিত ছাত্রীদের পুনর্ভর্তি যাচাই
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 2: OLD STUDENT SEARCH PANEL */}
      {/* ------------------------------------------------------------- */}
      {viewState === 'oldSearch' && (
        <div className="p-8 bg-card border border-border-main/80 rounded-3xl shadow-xl space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3 pb-4 border-b border-border-main/60">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-text-main">পুরাতন শিক্ষার্থী যাচাইকরণ</h3>
              <p className="text-xs text-text-light font-bold">পূর্ববর্তী ডাটাবেস রেকর্ড অনুসন্ধান করুন</p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-text-main">শিক্ষাবর্ষ নির্বাচন করুন *</label>
              <select
                value={oldSearch.academicYear}
                onChange={(e) => setOldSearch({ ...oldSearch, academicYear: e.target.value })}
                className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
              >
                <option value="১৪৪৫-৪৬ হিজরী/২০২৫-২৬ ঈসায়ী">১৪৪৫-৪৬ হিজরী/২০২৫-২৬ ঈসায়ী</option>
                <option value="১৪৪৬-৪৭ হিজরী/২০২৫-২৬ ঈসায়ী">১৪৪৬-৪৭ হিজরী/২০২৫-২৬ ঈসায়ী</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-text-main">পূর্বের জামাত নির্বাচন করুন *</label>
              <select
                value={oldSearch.jamat}
                onChange={(e) => setOldSearch({ ...oldSearch, jamat: e.target.value })}
                className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
              >
                {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-text-main">রেজিস্ট্রেশন/আইডি নম্বর *</label>
              <input
                type="text"
                placeholder="যেমন: 1001"
                value={oldSearch.regNo}
                onChange={(e) => setOldSearch({ ...oldSearch, regNo: e.target.value })}
                className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-text-main">রোল নম্বর *</label>
              <input
                type="text"
                placeholder="যেমন: 05"
                value={oldSearch.rollNo}
                onChange={(e) => setOldSearch({ ...oldSearch, rollNo: e.target.value })}
                className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border-main/50">
            <button
              onClick={handleOldSearch}
              className="px-6 py-3.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>যাচাই করুন</span>
            </button>
            <button
              onClick={() => setViewState('selection')}
              className="px-6 py-3.5 bg-step-bg border border-border-main text-text-main hover:bg-card rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>পিছনে</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 3: MULTI-STEP ADMISSION FORM */}
      {/* ------------------------------------------------------------- */}
      {viewState === 'form' && (
        <div className="space-y-6">
          {/* Step Indicator Header */}
          <div className="p-4 bg-card border border-border-main/80 rounded-2xl shadow-sm flex justify-between items-center gap-2 overflow-x-auto">
            {[
              { num: 1, label: 'ব্যক্তিগত তথ্য' },
              { num: 2, label: 'ঠিকানা' },
              { num: 3, label: 'ভর্তি তথ্য' },
              { num: 4, label: 'যাচাই ও জমা' }
            ].map((st) => (
              <div
                key={st.num}
                onClick={() => {
                  if (st.num < currentStep) setCurrentStep(st.num);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-center font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
                  st.num === currentStep
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : st.num < currentStep
                    ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                    : 'bg-step-bg text-text-light/60'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">
                  {st.num}
                </span>
                <span>{st.label}</span>
              </div>
            ))}
          </div>

          {/* Card Body */}
          <div className="p-6 sm:p-8 bg-card border border-border-main/80 rounded-3xl shadow-xl space-y-6">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: PERSONAL DETAILS */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center pb-3 border-b border-border-main/60">
                  <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>১. ব্যক্তিগত তথ্য</span>
                  </h3>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    ধাপ ১ / ৪
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>জন্ম নিবন্ধন বা এনআইডি অনুযায়ী বাংলায় তথ্য পূরণ করুন</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-main">
                      শিক্ষার্থীর পূর্ণ নাম <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: আয়েশা খাতুন"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-main">
                      পিতার নাম <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="পিতার নাম"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-main">মাতার নাম</label>
                    <input
                      type="text"
                      placeholder="মাতার নাম"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-main">
                      জন্ম তারিখ <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-main">
                      জন্ম নিবন্ধন/NID নং <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: 20153334445556677"
                      value={formData.birthReg}
                      onChange={(e) => setFormData({ ...formData, birthReg: e.target.value })}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>

                  {/* Guardian Mobile (Mother) + Messaging Apps */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-black text-text-main">
                      অভিভাবকের মোবাইল (মা) <span className="text-error">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                      <input
                        type="tel"
                        maxLength={11}
                        placeholder="01700000000"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/[^0-9]/g, '') })}
                        className="flex-1 p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary font-mono"
                      />
                      <div className="flex items-center gap-2 p-2 bg-step-bg border border-border-main rounded-2xl shrink-0">
                        <span className="text-[10px] font-bold text-text-light px-1">মেসেজিং অ্যাপ:</span>
                        {['WhatsApp', 'Telegram', 'iMessage'].map((app) => (
                          <button
                            key={app}
                            type="button"
                            onClick={() => toggleApp(app)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                              selectedApps.includes(app)
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-card text-text-light hover:text-text-main'
                            }`}
                          >
                            {app}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-main">
                      অভিভাবকের মোবাইল (বাবা/ভাই) <span className="text-error">*</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={11}
                      placeholder="01800000000"
                      value={formData.altMobile}
                      onChange={(e) => setFormData({ ...formData, altMobile: e.target.value.replace(/[^0-9]/g, '') })}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-main">ইমেইল (ঐচ্ছিক)</label>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-black text-text-main">রক্তের গ্রুপ</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    >
                      <option value="">নির্বাচন করুন</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ADDRESS */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center pb-3 border-b border-border-main/60">
                  <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>২. স্থায়ী ঠিকানা</span>
                  </h3>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    ধাপ ২ / ৪
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-main">বিভাগ *</label>
                    <select
                      value={division}
                      onChange={(e) => {
                        setDivision(e.target.value);
                        const firstDist = Object.keys(bangladeshData[e.target.value]?.districts || {})[0] || '';
                        setDistrict(firstDist);
                        const firstUp = bangladeshData[e.target.value]?.districts[firstDist]?.upazilas[0] || '';
                        setUpazila(firstUp);
                      }}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    >
                      {Object.keys(bangladeshData).map(k => (
                        <option key={k} value={k}>{bangladeshData[k].name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-main">জেলা *</label>
                    <select
                      value={district}
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        const firstUp = bangladeshData[division]?.districts[e.target.value]?.upazilas[0] || '';
                        setUpazila(firstUp);
                      }}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    >
                      {Object.keys(bangladeshData[division]?.districts || {}).map(dk => (
                        <option key={dk} value={dk}>{bangladeshData[division].districts[dk].name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-main">উপজেলা/থানা *</label>
                    <select
                      value={upazila}
                      onChange={(e) => setUpazila(e.target.value)}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    >
                      {(bangladeshData[division]?.districts[district]?.upazilas || []).map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-main">ডাকঘর/পোস্ট অফিস *</label>
                    <input
                      type="text"
                      placeholder="যেমন: লুটেরচর"
                      value={postOffice}
                      onChange={(e) => setPostOffice(e.target.value)}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-black text-text-main">গ্রাম/মহল্লা ও বাড়ির নম্বর *</label>
                    <input
                      type="text"
                      placeholder="যেমন: কান্দারগাঁও, উত্তর পাড়া"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="sameAddress"
                    checked={sameAsPermanent}
                    onChange={(e) => setSameAsPermanent(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-border-main cursor-pointer"
                  />
                  <label htmlFor="sameAddress" className="text-xs font-bold text-text-main cursor-pointer">
                    অস্থায়ী ঠিকানা স্থায়ী ঠিকানার মতোই
                  </label>
                </div>

                <div className="p-3.5 rounded-2xl bg-step-bg border border-border-main/70 text-xs font-bold text-text-light flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span>সম্পূর্ণ ঠিকানা: <strong>{fullAddress}</strong></span>
                </div>
              </div>
            )}

            {/* STEP 3: ADMISSION INFO */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center pb-3 border-b border-border-main/60">
                  <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span>৩. ভর্তি সংক্রান্ত তথ্য</span>
                  </h3>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    ধাপ ৩ / ৪
                  </span>
                </div>

                {studentType === 'new' ? (
                  <div className="space-y-5 p-5 bg-step-bg/60 border border-border-main/70 rounded-2xl">
                    <h4 className="text-xs font-black text-primary uppercase tracking-wider">
                      পূর্বের শিক্ষা প্রতিষ্ঠানের তথ্য
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="space-y-1.5 sm:col-span-3">
                        <label className="text-xs font-black text-text-main">
                          পূর্বের মাদ্রাসার নাম <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="মাদ্রাসার পূর্ণ নাম"
                          value={formData.prevMadrasa}
                          onChange={(e) => setFormData({ ...formData, prevMadrasa: e.target.value })}
                          className="w-full p-3.5 bg-card border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-text-main">পূর্বের শিক্ষাবর্ষ *</label>
                        <select
                          value={formData.prevYear}
                          onChange={(e) => setFormData({ ...formData, prevYear: e.target.value })}
                          className="w-full p-3.5 bg-card border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                        >
                          <option value="১৪৪৫-৪৬ হিজরী/২০২৪-২৫ ঈসায়ী">১৪৪৫-৪৬ হিজরী/২০২৪-২৫ ঈসায়ী</option>
                          <option value="১৪৪৬-৪৭ হিজরী/২০২৫-২৬ ঈসায়ী">১৪৪৬-৪৭ হিজরী/২০২৫-২৬ ঈসায়ী</option>
                          <option value="১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী">১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-black text-text-main">পূর্বের জামাত *</label>
                        <select
                          value={formData.prevClass}
                          onChange={(e) => {
                            const selectedPrev = e.target.value;
                            const autoNext = getNextClass(selectedPrev);
                            setFormData({
                              ...formData,
                              prevClass: selectedPrev,
                              desiredClass: autoNext
                            });
                          }}
                          className="w-full p-3.5 bg-card border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                        >
                          {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>স্বাগতম! আপনার তথ্য যাচাই সফল হয়েছে। নিচে বর্তমান শিক্ষাবর্ষ ও জামাত চূড়ান্ত করুন।</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-main">বর্তমান শিক্ষাবর্ষ *</label>
                    <input
                      type="text"
                      disabled
                      value={formData.currentYear}
                      className="w-full p-3.5 bg-step-bg border border-border-main/60 rounded-2xl text-xs font-bold text-text-light cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-main">
                      ভর্তি কাঙ্ক্ষিত জামাত <span className="text-error">*</span>
                    </label>
                    <select
                      value={formData.desiredClass}
                      onChange={(e) => setFormData({ ...formData, desiredClass: e.target.value })}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary"
                    >
                      {jamatList.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-black text-text-main">মন্তব্য (কেন ভর্তি?)</label>
                    <textarea
                      rows={2}
                      placeholder="অতিরিক্ত কোনো বিষয় জানানোর থাকলে লিখুন..."
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      className="w-full p-3.5 bg-step-bg border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-primary resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & VERIFY */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center pb-3 border-b border-border-main/60">
                  <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    <span>৪. আপনার তথ্য যাচাই করুন</span>
                  </h3>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    ধাপ ৪ / ৪
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Review Block 1: Personal */}
                  <div className="p-4 bg-step-bg/60 border border-border-main/70 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-border-main/40">
                      <span className="text-xs font-black text-primary flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>ব্যক্তিগত তথ্য</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="px-3 py-1 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
                      >
                        এডিট
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <p><strong>শিক্ষার্থীর নাম:</strong> {formData.fullName}</p>
                      <p><strong>পিতার নাম:</strong> {formData.fatherName}</p>
                      <p><strong>মাতার নাম:</strong> {formData.motherName || '—'}</p>
                      <p><strong>জন্ম তারিখ:</strong> {formData.dob}</p>
                      <p><strong>জন্ম নিবন্ধন:</strong> {formData.birthReg}</p>
                      <p><strong>মোবাইল (মা):</strong> {formData.mobile}</p>
                      <p><strong>মোবাইল (বাবা):</strong> {formData.altMobile}</p>
                      <p><strong>রক্তের গ্রুপ:</strong> {formData.bloodGroup || '—'}</p>
                    </div>
                  </div>

                  {/* Review Block 2: Address */}
                  <div className="p-4 bg-step-bg/60 border border-border-main/70 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-border-main/40">
                      <span className="text-xs font-black text-primary flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>স্থায়ী ঠিকানা</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-3 py-1 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
                      >
                        এডিট
                      </button>
                    </div>
                    <div className="text-xs leading-relaxed">
                      <p><strong>পূর্ণ ঠিকানা:</strong> {fullAddress}</p>
                    </div>
                  </div>

                  {/* Review Block 3: Admission */}
                  <div className="p-4 bg-step-bg/60 border border-border-main/70 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-border-main/40">
                      <span className="text-xs font-black text-primary flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        <span>ভর্তি তথ্য</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="px-3 py-1 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
                      >
                        এডিট
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <p><strong>বর্তমান শিক্ষাবর্ষ:</strong> {formData.currentYear}</p>
                      <p><strong>ভর্তি কাঙ্ক্ষিত জামাত:</strong> {formData.desiredClass}</p>
                      <p><strong>মারহালা:</strong> {classDetailsMap[formData.desiredClass]?.marhala || '—'}</p>
                      <p><strong>জামাত/শ্রেণী:</strong> {classDetailsMap[formData.desiredClass]?.jamatClass || '—'}</p>
                      <p><strong>সমমান শ্রেণী:</strong> {classDetailsMap[formData.desiredClass]?.somoman || '—'}</p>
                      {studentType === 'new' && (
                        <>
                          <p><strong>পূর্বের মাদ্রাসা:</strong> {formData.prevMadrasa}</p>
                          <p><strong>পূর্বের জামাত:</strong> {formData.prevClass}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-border-main/60">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 bg-step-bg border border-border-main text-text-main rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-card transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পূর্ববর্তী</span>
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-7 py-3 bg-primary text-white hover:bg-primary-dark rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer active:scale-95"
                >
                  <span>পরবর্তী</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="px-8 py-3.5 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4.5 h-4.5" />
                  <span>{isSubmitting ? 'জমা দেওয়া হচ্ছে...' : 'জমা দিন'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 4: PENDING / SUCCESS PANEL */}
      {/* ------------------------------------------------------------- */}
      {viewState === 'pending' && (
        <div className="p-8 sm:p-12 bg-card border border-border-main/80 rounded-3xl shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-10 h-10 animate-spin-slow" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-text-main">আবেদন প্রক্রিয়াধীন!</h2>
            <p className="text-xs text-text-light font-bold">
              আপনার অনলাইন ভর্তি আবেদনটি সফলভাবে ডাটাবেজে নথিবদ্ধ করা হয়েছে।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-step-bg border border-border-main inline-block">
            <span className="text-xs text-text-light font-bold block">আবেদন ট্র্যাকিং নম্বর</span>
            <span className="text-2xl font-black text-primary font-mono tracking-wider">{formData.applicationId}</span>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setViewState('selection');
                setCurrentStep(1);
              }}
              className="px-6 py-3 bg-primary text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন আবেদন</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: OLD STUDENT VERIFICATION SUCCESS MODAL */}
      {/* ------------------------------------------------------------- */}
      {oldSearchResultModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border-main rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-scaleUp">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-text-main">✅ তথ্য যাচাই সফল!</h3>
              <p className="text-xs text-text-light font-bold">শিক্ষার্থীর বিবরণ মিলেছে</p>
            </div>

            <div className="p-4 rounded-2xl bg-step-bg border border-border-main/70 text-left space-y-2 text-xs">
              <p><strong>শিক্ষার্থীর নাম:</strong> {oldSearchResultModal.name}</p>
              <p><strong>পিতার নাম:</strong> {oldSearchResultModal.father || '—'}</p>
              <p><strong>মাতার নাম:</strong> {oldSearchResultModal.mother || '—'}</p>
              <p><strong>পূর্বের জামাত:</strong> {oldSearchResultModal.prevJamat}</p>
              <p className="text-primary font-bold"><strong>পরবর্তী জামাত (অটো-সিলেক্ট):</strong> {oldSearchResultModal.nextJamat}</p>
            </div>

            <button
              onClick={() => {
                setOldSearchResultModal(null);
                setViewState('form');
                setCurrentStep(1);
              }}
              className="w-full py-3 bg-emerald-600 text-white font-bold text-xs rounded-2xl hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: DUPLICATE ALERT MODAL */}
      {/* ------------------------------------------------------------- */}
      {viewState === 'duplicateModal' && duplicateInfo && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border-main rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-scaleUp">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-text-main">⚠️ ইতিমধ্যে আবেদন করা হয়েছে!</h3>
              <p className="text-xs text-text-light font-bold">পূর্বেই নথিবদ্ধ তথ্য পাওয়া গেছে</p>
            </div>

            <div className="p-4 rounded-2xl bg-step-bg border border-border-main/70 text-left space-y-2 text-xs">
              <p><strong>শিক্ষার্থীর নাম:</strong> {duplicateInfo.name}</p>
              <p><strong>পিতার নাম:</strong> {duplicateInfo.father}</p>
              <p className="text-amber-600 font-bold">{duplicateInfo.message}</p>
            </div>

            <button
              onClick={() => setViewState('selection')}
              className="w-full py-3 bg-primary text-white font-bold text-xs rounded-2xl hover:bg-primary-dark transition-colors cursor-pointer"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
