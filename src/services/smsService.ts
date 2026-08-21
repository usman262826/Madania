/**
 * SMS.NET.BD Official API Service Integration
 * Documentation: https://api.sms.net.bd/
 * Endpoint for sendsms: https://api.sms.net.bd/sendsms
 * Endpoint for balance: https://api.sms.net.bd/user/balance/
 * Endpoint for report: https://api.sms.net.bd/report/request/{id}/
 */

export const DEFAULT_SMS_NET_BD_API_KEY = 'a23Hnfiv06596m0p8r06RU8Tcs6eI49JQDL9T3Ug';

export interface SendSmsParams {
  to: string | string[];
  msg: string;
  apiKey?: string;
  senderId?: string;
  schedule?: string;
  contentId?: string;
}

export interface SmsSendResult {
  success: boolean;
  error?: number;
  msg: string;
  requestId?: number | string;
  data?: any;
  raw?: any;
}

export interface SmsBalanceResult {
  success: boolean;
  balance: number;
  rawBalance?: string;
  msg: string;
  error?: number;
}

export interface SmsReportResult {
  success: boolean;
  requestId?: number | string;
  status?: string;
  charge?: string;
  recipients?: Array<{
    number: string;
    charge: string;
    status: string;
  }>;
  msg: string;
  error?: number;
}

// Convert Bengali numeric digits to English digits
export const bnToEnDigits = (str: string): string => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = str || '';
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(bn[i], i.toString());
  }
  return res;
};

// Normalize and validate Bangladeshi Phone numbers for sms.net.bd (e.g. 88018..., 018...)
export const normalizeSmsRecipient = (rawPhone: string): string => {
  if (!rawPhone) return '';
  const eng = bnToEnDigits(String(rawPhone).trim());
  
  // Split multiple numbers by comma, slash, semicolon, or space
  const numbers = eng.split(/[,;\s/]+/).map(p => {
    let clean = p.replace(/\D/g, '');
    if (clean.startsWith('8801') && clean.length === 13) {
      return clean;
    }
    if (clean.startsWith('01') && clean.length === 11) {
      return `88${clean}`; // Recommend 8801XXXXXXXXX prefix for sms.net.bd standard
    }
    if (clean.startsWith('1') && clean.length === 10) {
      return `880${clean}`;
    }
    return clean;
  }).filter(num => num.length >= 11);

  return numbers.join(',');
};

// Error code mapping based on official SMS.NET.BD API docs
export const getSmsNetBdErrorMessage = (code: number, fallbackMsg: string = ''): string => {
  switch (code) {
    case 0:
      return 'সফলভাবে সম্পন্ন হয়েছে (Success)';
    case 400:
      return 'অনুরোধ প্রত্যাখ্যান করা হয়েছে, প্যারামিটার ত্রুটি (Invalid parameter)';
    case 403:
      return 'অনুমতি নেই বা এক্সেস ডিনাইড (Forbidden)';
    case 404:
      return 'রিসোর্স খুঁজে পাওয়া যায়নি (Not found)';
    case 405:
      return 'অথরাইজেশন বা API কী ত্রুটি (Authorization required)';
    case 409:
      return 'সার্ভার সমস্যা (Server error)';
    case 410:
      return 'অ্যাকাউন্ট মেয়াদোত্তীর্ণ (Account expired)';
    case 411:
      return 'রিসেলার অ্যাকাউন্ট স্থগিত (Reseller suspended)';
    case 412:
      return 'ভুল শিডিউল ফরম্যাট (Invalid Schedule, format: Y-m-d H:i:s)';
    case 413:
      return 'অবৈধ সেন্ডার আইডি (Invalid Sender ID)';
    case 414:
      return 'মেসেজ টেক্সট ফাঁকা বা শূন্য (Message is empty)';
    case 415:
      return 'মেসেজ অত্যন্ত দীর্ঘ (Message is too long)';
    case 416:
      return 'কোনো সঠিক মোবাইল নম্বর পাওয়া যায়নি (No valid number found)';
    case 417:
      return 'অপর্যাপ্ত এসএমএস ব্যালেন্স (Insufficient balance)';
    case 420:
      return 'কন্টেন্ট ব্লক করা হয়েছে (Content Blocked)';
    case 421:
      return 'প্রথম রিচার্জের পূর্বে শুধুমাত্র রেজিস্টার্ড নম্বরে SMS পাঠানো যাবে';
    default:
      return fallbackMsg || `অপ্রত্যাশিত ত্রুটি (Error Code: ${code})`;
  }
};

/**
 * Send SMS using sms.net.bd API (proxied through /api/sms-net-bd/sendsms with direct API fallback)
 */
export const sendSmsNetBd = async (params: SendSmsParams): Promise<SmsSendResult> => {
  const apiKey = (params.apiKey || DEFAULT_SMS_NET_BD_API_KEY).trim();
  const rawTo = Array.isArray(params.to) ? params.to.join(',') : params.to;
  const to = normalizeSmsRecipient(rawTo);

  if (!to) {
    return {
      success: false,
      error: 416,
      msg: 'কোনো বৈধ মোবাইল নম্বর পাওয়া যায়নি',
    };
  }

  const msg = (params.msg || '').trim();
  if (!msg) {
    return {
      success: false,
      error: 414,
      msg: 'মেসেজ ফাঁকা হতে পারে না',
    };
  }

  // Prepare payload
  const formData = new URLSearchParams();
  formData.append('api_key', apiKey);
  formData.append('msg', msg);
  formData.append('to', to);
  if (params.senderId && params.senderId.trim()) {
    formData.append('sender_id', params.senderId.trim());
  }
  if (params.schedule && params.schedule.trim()) {
    formData.append('schedule', params.schedule.trim());
  }
  if (params.contentId && params.contentId.trim()) {
    formData.append('content_id', params.contentId.trim());
  }

  // Attempt 1: Via local Vite proxy /api/sms-net-bd/sendsms
  try {
    const proxyRes = await fetch('/api/sms-net-bd/sendsms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.error === 0) {
        return {
          success: true,
          error: 0,
          msg: data.msg || 'Request successfully submitted',
          requestId: data.data?.request_id,
          data: data.data,
          raw: data,
        };
      } else {
        const errorText = getSmsNetBdErrorMessage(data.error, data.msg);
        return {
          success: false,
          error: data.error,
          msg: errorText,
          raw: data,
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Proxy SMS endpoint unreachable, falling back to direct endpoint:', proxyErr);
  }

  // Attempt 2: Direct Fetch to sms.net.bd
  try {
    const directRes = await fetch('https://api.sms.net.bd/sendsms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await directRes.json();
    if (data.error === 0) {
      return {
        success: true,
        error: 0,
        msg: data.msg || 'Request successfully submitted',
        requestId: data.data?.request_id,
        data: data.data,
        raw: data,
      };
    } else {
      const errorText = getSmsNetBdErrorMessage(data.error, data.msg);
      return {
        success: false,
        error: data.error,
        msg: errorText,
        raw: data,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: 409,
      msg: `SMS প্রেরণ ব্যর্থ: ${err?.message || 'নেটওয়ার্ক সংযোগ ত্রুটি'}`,
    };
  }
};

/**
 * Fetch real-time live balance from sms.net.bd API
 */
export const getSmsNetBdBalance = async (apiKeyParam?: string): Promise<SmsBalanceResult> => {
  const apiKey = (apiKeyParam || DEFAULT_SMS_NET_BD_API_KEY).trim();

  // Attempt 1: Via proxy
  try {
    const proxyRes = await fetch(`/api/sms-net-bd/balance?api_key=${encodeURIComponent(apiKey)}`);
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.error === 0 && data.data) {
        const balNum = parseFloat(data.data.balance || '0');
        return {
          success: true,
          balance: isNaN(balNum) ? 0 : balNum,
          rawBalance: data.data.balance || '0.0000',
          msg: 'Success',
          error: 0,
        };
      } else if (data.error) {
        return {
          success: false,
          balance: 0,
          msg: getSmsNetBdErrorMessage(data.error, data.msg),
          error: data.error,
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Proxy balance endpoint error, fallback to direct:', proxyErr);
  }

  // Attempt 2: Direct
  try {
    const directRes = await fetch(`https://api.sms.net.bd/user/balance/?api_key=${encodeURIComponent(apiKey)}`);
    const data = await directRes.json();
    if (data.error === 0 && data.data) {
      const balNum = parseFloat(data.data.balance || '0');
      return {
        success: true,
        balance: isNaN(balNum) ? 0 : balNum,
        rawBalance: data.data.balance || '0.0000',
        msg: 'Success',
        error: 0,
      };
    } else {
      return {
        success: false,
        balance: 0,
        msg: getSmsNetBdErrorMessage(data.error, data.msg),
        error: data.error,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      balance: 0,
      msg: err?.message || 'ব্যালেন্স লোড করা সম্ভব হয়নি',
    };
  }
};

/**
 * Fetch delivery report from sms.net.bd API for a specific request_id
 */
export const getSmsNetBdReport = async (requestId: string | number, apiKeyParam?: string): Promise<SmsReportResult> => {
  const apiKey = (apiKeyParam || DEFAULT_SMS_NET_BD_API_KEY).trim();
  const cleanId = String(requestId).replace(/\D/g, '');

  if (!cleanId) {
    return {
      success: false,
      msg: 'অবৈধ রিকোয়েস্ট আইডি',
    };
  }

  // Attempt 1: Via Proxy
  try {
    const proxyRes = await fetch(`/api/sms-net-bd/report?id=${encodeURIComponent(cleanId)}&api_key=${encodeURIComponent(apiKey)}`);
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.error === 0 && data.data) {
        return {
          success: true,
          requestId: data.data.request_id,
          status: data.data.request_status,
          charge: data.data.request_charge,
          recipients: data.data.recipients || [],
          msg: data.msg || 'Success',
          error: 0,
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Proxy report error, fallback direct:', proxyErr);
  }

  // Attempt 2: Direct
  try {
    const directRes = await fetch(`https://api.sms.net.bd/report/request/${cleanId}/?api_key=${encodeURIComponent(apiKey)}`);
    const data = await directRes.json();
    if (data.error === 0 && data.data) {
      return {
        success: true,
        requestId: data.data.request_id,
        status: data.data.request_status,
        charge: data.data.request_charge,
        recipients: data.data.recipients || [],
        msg: data.msg || 'Success',
        error: 0,
      };
    } else {
      return {
        success: false,
        msg: getSmsNetBdErrorMessage(data.error, data.msg),
        error: data.error,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      msg: err?.message || 'রিপোর্ট লোড করা যায়নি',
    };
  }
};

/**
 * High-level helper for sending SMS to a recipient or list of recipients
 */
export const sendSMS = async (to: string | string[], msg: string, options?: Partial<SendSmsParams>): Promise<SmsSendResult> => {
  return sendSmsNetBd({
    to,
    msg,
    ...options,
  });
};

