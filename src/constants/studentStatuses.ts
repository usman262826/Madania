/**
 * ============================================================================
 * STUDENT STATUS & CATEGORY CONFIGURATION (শিক্ষার্থীর অবস্থা বা ধরণ)
 * ============================================================================
 * এটি একটি পৃথক কনফিগারেশন ফাইল। মাদ্রাসার প্রশাসনিক প্রয়োজন অনুযায়ী ভবিষ্যতে যে কোনো
 * অবস্থা (Status) বা ধরণ সহজে যোগ, এডিট বা কাস্টমাইজ করা যাবে।
 */

export interface StudentStatusItem {
  id: string;
  name: string; // পূর্ণ বিবরণ
  shortTitle: string; // সংক্ষেপ শিরোনাম
  description?: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  isEnrolled: boolean; // বর্তমানে সক্রিয়/অধ্যয়নরত কিনা
}

export const STUDENT_STATUS_LIST: string[] = [
  "অধ্যয়নরত – বর্তমানে পড়াশোনা করছে (অনাবাসিক)",
  "বহিষ্কৃত – শৃঙ্খলাভঙ্গ বা প্রশাসনিক সিদ্ধান্তের কারণে প্রতিষ্ঠান থেকে বাদ।",
  "ত্যাগকৃত – ছাত্রী নিজ ইচ্ছায় পড়াশোনা বন্ধ করেছে বা প্রতিষ্ঠান ছেড়ে দিয়েছে।",
  "অধ্যয়নরত – বর্তমানে পড়াশোনা করছে (আবাসিক)",
  "স্নাতক / পাশকৃত – নিয়মিত পড়াশোনা সম্পন্ন করেছে এবং সনদ/প্রমাণপত্র প্রাপ্ত।",
  "অপেক্ষমাণ – ভর্তি কার্যক্রম সম্পন্ন হয়েছে কিন্তু ক্লাস শুরু হয়নি / রেজিস্ট্রেশন প্রক্রিয়াধীন।",
  "সাময়িক ভর্তি বাতিল",
  "অধ্যয়নরত ছিল – বেফাক পরিক্ষায় অংশ গ্রহনের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে।",
  "অধ্যয়নরত ছিল – মাদরাসা বার্ষিক পরিক্ষায় অংশ গ্রহনের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে।",
  "অধ্যয়নরত ছিল – বেফাক ও মাদরাসা বার্ষিক পরিক্ষায় অংশ গ্রহনের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে।",
  "ছুটি গ্রহন করেছে - অনুমতিক্রমে ছুটিতে আছে ।"
];

export const STUDENT_STATUS_CONFIGS: Record<string, StudentStatusItem> = {
  "অধ্যয়নরত – বর্তমানে পড়াশোনা করছে (অনাবাসিক)": {
    id: "studying_non_residential",
    name: "অধ্যয়নরত – বর্তমানে পড়াশোনা করছে (অনাবাসিক)",
    shortTitle: "অধ্যয়নরত (অনাবাসিক)",
    description: "বর্তমানে মাদ্রাসায় অনাবাসিক হিসেবে নিয়মিত পড়াশোনা করছে",
    badgeBg: "bg-teal-500/10",
    badgeText: "text-teal-700 dark:text-teal-400",
    badgeBorder: "border-teal-500/25",
    isEnrolled: true
  },
  "বহিষ্কৃত – শৃঙ্খলাভঙ্গ বা প্রশাসনিক সিদ্ধান্তের কারণে প্রতিষ্ঠান থেকে বাদ।": {
    id: "expelled",
    name: "বহিষ্কৃত – শৃঙ্খলাভঙ্গ বা প্রশাসনিক সিদ্ধান্তের কারণে প্রতিষ্ঠান থেকে বাদ।",
    shortTitle: "বহিষ্কৃত",
    description: "শৃঙ্খলাভঙ্গ বা প্রশাসনিক সিদ্ধান্তের কারণে প্রতিষ্ঠান থেকে বাদ",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-600 dark:text-rose-400",
    badgeBorder: "border-rose-500/25",
    isEnrolled: false
  },
  "ত্যাগকৃত – ছাত্রী নিজ ইচ্ছায় পড়াশোনা বন্ধ করেছে বা প্রতিষ্ঠান ছেড়ে দিয়েছে।": {
    id: "dropped_out",
    name: "ত্যাগকৃত – ছাত্রী নিজ ইচ্ছায় পড়াশোনা বন্ধ করেছে বা প্রতিষ্ঠান ছেড়ে দিয়েছে।",
    shortTitle: "ত্যাগকৃত",
    description: "ছাত্রী নিজ ইচ্ছায় পড়াশোনা বন্ধ করেছে বা প্রতিষ্ঠান ছেড়ে দিয়েছে",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-700 dark:text-amber-400",
    badgeBorder: "border-amber-500/25",
    isEnrolled: false
  },
  "অধ্যয়নরত – বর্তমানে পড়াশোনা করছে (আবাসিক)": {
    id: "studying_residential",
    name: "অধ্যয়নরত – বর্তমানে পড়াশোনা করছে (আবাসিক)",
    shortTitle: "অধ্যয়নরত (আবাসিক)",
    description: "বর্তমানে মাদ্রাসায় আবাসিক হিসেবে নিয়মিত পড়াশোনা করছে",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    badgeBorder: "border-emerald-500/25",
    isEnrolled: true
  },
  "স্নাতক / পাশকৃত – নিয়মিত পড়াশোনা সম্পন্ন করেছে এবং সনদ/প্রমাণপত্র প্রাপ্ত।": {
    id: "graduated",
    name: "স্নাতক / পাশকৃত – নিয়মিত পড়াশোনা সম্পন্ন করেছে এবং সনদ/প্রমাণপত্র প্রাপ্ত।",
    shortTitle: "স্নাতক / পাশকৃত",
    description: "নিয়মিত পড়াশোনা সম্পন্ন করেছে এবং সনদ/প্রমাণপত্র প্রাপ্ত",
    badgeBg: "bg-indigo-500/10",
    badgeText: "text-indigo-700 dark:text-indigo-400",
    badgeBorder: "border-indigo-500/25",
    isEnrolled: false
  },
  "অপেক্ষমাণ – ভর্তি কার্যক্রম সম্পন্ন হয়েছে কিন্তু ক্লাস শুরু হয়নি / রেজিস্ট্রেশন প্রক্রিয়াধীন।": {
    id: "waiting",
    name: "অপেক্ষমাণ – ভর্তি কার্যক্রম সম্পন্ন হয়েছে কিন্তু ক্লাস শুরু হয়নি / রেজিস্ট্রেশন প্রক্রিয়াধীন।",
    shortTitle: "অপেক্ষমাণ",
    description: "ভর্তি কার্যক্রম সম্পন্ন হয়েছে কিন্তু ক্লাস শুরু হয়নি / রেজিস্ট্রেশন প্রক্রিয়াধীন",
    badgeBg: "bg-sky-500/10",
    badgeText: "text-sky-700 dark:text-sky-400",
    badgeBorder: "border-sky-500/25",
    isEnrolled: true
  },
  "সাময়িক ভর্তি বাতিল": {
    id: "temporary_canceled",
    name: "সাময়িক ভর্তি বাতিল",
    shortTitle: "সাময়িক ভর্তি বাতিল",
    description: "সাময়িক কারণে ভর্তি বাতিল রাখা হয়েছে",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-700 dark:text-orange-400",
    badgeBorder: "border-orange-500/25",
    isEnrolled: false
  },
  "অধ্যয়নরত ছিল – বেফাক পরিক্ষায় অংশ গ্রহনের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে।": {
    id: "completed_befaq",
    name: "অধ্যয়নরত ছিল – বেফাক পরিক্ষায় অংশ গ্রহনের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে।",
    shortTitle: "অধ্যয়নরত ছিল (বেফাক)",
    description: "বেফাক পরীক্ষায় অংশ গ্রহণের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে",
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-700 dark:text-purple-400",
    badgeBorder: "border-purple-500/25",
    isEnrolled: false
  },
  "অধ্যয়নরত ছিল – মাদরাসা বার্ষিক পরিক্ষায় অংশ গ্রহনের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে।": {
    id: "completed_annual",
    name: "অধ্যয়নরত ছিল – মাদরাসা বার্ষিক পরিক্ষায় অংশ গ্রহনের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে।",
    shortTitle: "অধ্যয়নরত ছিল (বার্ষিক পরীক্ষা)",
    description: "মাদরাসা বার্ষিক পরীক্ষায় অংশ গ্রহণের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-700 dark:text-blue-400",
    badgeBorder: "border-blue-500/25",
    isEnrolled: false
  },
  "অধ্যয়নরত ছিল – বেফাক ও মাদরাসা বার্ষিক পরিক্ষায় অংশ গ্রহনের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে।": {
    id: "completed_both",
    name: "অধ্যয়নরত ছিল – বেফাক ও মাদরাসা বার্ষিক পরিক্ষায় অংশ গ্রহনের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে।",
    shortTitle: "অধ্যয়নরত ছিল (বেফাক ও বার্ষিক)",
    description: "বেফাক ও মাদরাসা বার্ষিক পরীক্ষায় অংশ গ্রহণের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-700 dark:text-violet-400",
    badgeBorder: "border-violet-500/25",
    isEnrolled: false
  },
  "ছুটি গ্রহন করেছে - অনুমতিক্রমে ছুটিতে আছে ।": {
    id: "on_leave",
    name: "ছুটি গ্রহন করেছে - অনুমতিক্রমে ছুটিতে আছে ।",
    shortTitle: "ছুটি গ্রহন করেছে",
    description: "কর্তৃপক্ষের অনুমতিক্রমে ছুটিতে আছে",
    badgeBg: "bg-cyan-500/10",
    badgeText: "text-cyan-700 dark:text-cyan-400",
    badgeBorder: "border-cyan-500/25",
    isEnrolled: true
  }
};

/**
 * Helper to match any student status with a filter value.
 * Supports exact matches and legacy shorthand records (e.g., 'আবাসিক', 'অনাবাসিক', 'বহিষ্কৃত')
 */
export function isStudentStatusMatch(studentStatusValue: any, filterStatus: string): boolean {
  if (!filterStatus || filterStatus === 'ALL' || filterStatus === 'all') {
    return true;
  }

  const raw = String(studentStatusValue || '').trim();
  if (!raw) {
    // If student has no status, match default residential/studying or unassigned
    return filterStatus === 'ALL';
  }

  if (raw === filterStatus) {
    return true;
  }

  // Normalization checks for legacy or variant values
  const cleanFilter = filterStatus.trim();

  if (cleanFilter === "অধ্যয়নরত – বর্তমানে পড়াশোনা করছে (অনাবাসিক)") {
    return raw === cleanFilter || raw.includes('অনাবাসিক') || raw === 'Day Care' || raw === 'অনাবাসিক শিক্ষার্থী';
  }

  if (cleanFilter === "অধ্যয়নরত – বর্তমানে পড়াশোনা করছে (আবাসিক)") {
    return raw === cleanFilter || (raw.includes('আবাসিক') && !raw.includes('অনাবাসিক')) || raw === 'Residential' || raw === 'চলমান শিক্ষার্থী';
  }

  if (cleanFilter === "বহিষ্কৃত – শৃঙ্খলাভঙ্গ বা প্রশাসনিক সিদ্ধান্তের কারণে প্রতিষ্ঠান থেকে বাদ।") {
    return raw === cleanFilter || raw.includes('বহিষ্কৃত');
  }

  if (cleanFilter === "ত্যাগকৃত – ছাত্রী নিজ ইচ্ছায় পড়াশোনা বন্ধ করেছে বা প্রতিষ্ঠান ছেড়ে দিয়েছে।") {
    return raw === cleanFilter || raw.includes('ত্যাগকৃত') || raw.includes('বের হয়ে গেছে') || raw.includes('ছেড়ে দিয়েছে');
  }

  if (cleanFilter === "স্নাতক / পাশকৃত – নিয়মিত পড়াশোনা সম্পন্ন করেছে এবং সনদ/প্রমাণপত্র প্রাপ্ত।") {
    return raw === cleanFilter || raw.includes('স্নাতক') || raw.includes('পাশকৃত') || raw.includes('পাসকৃত');
  }

  if (cleanFilter === "অপেক্ষমাণ – ভর্তি কার্যক্রম সম্পন্ন হয়েছে কিন্তু ক্লাস শুরু হয়নি / রেজিস্ট্রেশন প্রক্রিয়াধীন।") {
    return raw === cleanFilter || raw.includes('অপেক্ষমাণ') || raw.includes('প্রক্রিয়াধীন');
  }

  if (cleanFilter === "সাময়িক ভর্তি বাতিল") {
    return raw === cleanFilter || raw.includes('সাময়িক ভর্তি বাতিল') || raw.includes('সাময়িক ভর্তি বাতিল');
  }

  if (cleanFilter === "অধ্যয়নরত ছিল – বেফাক পরিক্ষায় অংশ গ্রহনের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে।") {
    return raw === cleanFilter || (raw.includes('অধ্যয়নরত ছিল') && raw.includes('বেফাক') && !raw.includes('বার্ষিক'));
  }

  if (cleanFilter === "অধ্যয়নরত ছিল – মাদরাসা বার্ষিক পরিক্ষায় অংশ গ্রহনের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে।") {
    return raw === cleanFilter || (raw.includes('অধ্যয়নরত ছিল') && raw.includes('বার্ষিক') && !raw.includes('বেফাক'));
  }

  if (cleanFilter === "অধ্যয়নরত ছিল – বেফাক ও মাদরাসা বার্ষিক পরিক্ষায় অংশ গ্রহনের মাধ্যমে শিক্ষাবর্ষ সমাপ্ত করেছে।") {
    return raw === cleanFilter || (raw.includes('অধ্যয়নরত ছিল') && (raw.includes('বেফাক ও মাদরাসা') || (raw.includes('বেফাক') && raw.includes('বার্ষিক'))));
  }

  if (cleanFilter === "ছুটি গ্রহন করেছে - অনুমতিক্রমে ছুটিতে আছে ।") {
    return raw === cleanFilter || raw.includes('ছুটি');
  }

  return raw.toLowerCase().includes(cleanFilter.toLowerCase());
}

/**
 * Returns formatted status badge styling and label for a student
 */
export function getStudentStatusInfo(statusValue?: any): {
  label: string;
  shortTitle: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  isEnrolled: boolean;
} {
  const raw = String(statusValue || '').trim();

  // Check exact config match
  if (STUDENT_STATUS_CONFIGS[raw]) {
    const conf = STUDENT_STATUS_CONFIGS[raw];
    return {
      label: conf.name,
      shortTitle: conf.shortTitle,
      badgeBg: conf.badgeBg,
      badgeText: conf.badgeText,
      badgeBorder: conf.badgeBorder,
      isEnrolled: conf.isEnrolled
    };
  }

  // Check partial/legacy mappings
  for (const [key, conf] of Object.entries(STUDENT_STATUS_CONFIGS)) {
    if (isStudentStatusMatch(raw, key)) {
      return {
        label: conf.name,
        shortTitle: conf.shortTitle,
        badgeBg: conf.badgeBg,
        badgeText: conf.badgeText,
        badgeBorder: conf.badgeBorder,
        isEnrolled: conf.isEnrolled
      };
    }
  }

  // Fallback
  return {
    label: raw || 'অধ্যয়নরত (আবাসিক)',
    shortTitle: raw || 'অধ্যয়নরত',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    badgeBorder: 'border-emerald-500/25',
    isEnrolled: true
  };
}
