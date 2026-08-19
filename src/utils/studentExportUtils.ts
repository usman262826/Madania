import * as XLSX from 'xlsx';
import { Student } from '../types';
import { enToBnNumber, formatDateToDDMMYYYY } from '../lib/utils';

export interface MadrasahBrandingInfo {
  name?: string;
  banglaName?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  established?: string;
}

/**
 * Export single or multiple students to Excel (.xlsx) file
 */
export const downloadStudentsExcel = (
  studentsInput: Student | Student[], 
  customFileName?: string
) => {
  const students = Array.isArray(studentsInput) ? studentsInput : [studentsInput];
  if (students.length === 0) return;

  const excelRows = students.map((s, idx) => {
    const sId = s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || s.id || '';
    const sName = s['শিক্ষার্থীর নাম'] || s.name || '';
    const sClass = s['জামাত/শ্রেণী'] || s['জামাত'] || s.class || '';
    const sRoll = s['রোল নম্বর'] || s.roll || '';
    const sBranch = s['শাখা'] || s.branch || 'ক';
    const sFather = s['পিতার নাম'] || s.fatherName || '';
    const sMother = s['মাতার নাম'] || s.motherName || '';
    const sMobile = s['মোবাইল (মা)'] || s['অভিভাবকের মোবাইল'] || s.mobile || s.phone || '';
    const sAltMobile = s['মোবাইল (বাবা/ভাই)'] || s['বিকল্প মোবাইল'] || s['দ্বিতীয় মোবাইল'] || s['দ্বিতীয় মোবাইল নম্বর'] || s['২য় মোবাইল'] || s.altMobile || s.alt_mobile || '';
    const sDob = s['জন্ম তারিখ'] || s.dob || s.birthDate || '';
    const sBirthReg = s['জন্ম নিবন্ধন নাম্বার'] || s['জন্ম নিবন্ধন সনদ নম্বর'] || s['জন্ম নিবন্ধন'] || s['জন্ম নিবন্ধন নম্বর'] || s['এনআইডি/জন্ম সনদ'] || s['জন্ম নিবন্ধন/NID নং'] || s.birthReg || s.birthRegNo || s.birth_reg_no || '';
    const sBlood = s['রক্তের গ্রুপ'] || s.bloodGroup || '';
    const sStatus = s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || s['শিক্ষার্থী ধরণ'] || s.status || 'সক্রিয়/চলমান শিক্ষার্থী';
    const sTuition = s.tuitionFee !== undefined ? s.tuitionFee : (s['মাসিক বেতন'] || s['মাসিক ফি'] || 0);
    const sKhoraki = s.khorakiFee !== undefined ? s.khorakiFee : (s['খোরাকী'] || s['খোরাকী ফি'] || 0);
    const sRfid = s.rfid || '';
    const sAddress = s['স্থায়ী ঠিকানা'] || s['বর্তমান ঠিকানা'] || s.address || '';
    const sYear = s.academicYearLabel || s['শিক্ষাবর্ষ'] || '';

    return {
      'ক্রমিক নং': idx + 1,
      'রেজিস্ট্রেশন/আইডি': sId,
      'রোল নম্বর': sRoll,
      'শিক্ষার্থীর নাম': sName,
      'জামাত/শ্রেণী': sClass,
      'শাখা': sBranch,
      'পিতার নাম': sFather,
      'মাতার নাম': sMother,
      'অভিভাবকের মোবাইল': sMobile,
      'বিকল্প মোবাইল': sAltMobile,
      'জন্ম তারিখ': sDob,
      'জন্ম নিবন্ধন / NID': sBirthReg,
      'রক্তের গ্রুপ': sBlood,
      'শিক্ষার্থীর স্ট্যাটাস': sStatus,
      'মাসিক বেতন (৳)': sTuition,
      'খোরাকী ফি (৳)': sKhoraki,
      'RFID কার্ড': sRfid,
      'ঠিকানা': sAddress,
      'শিক্ষাবর্ষ': sYear
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

  // Auto-fit column widths
  const colWidths = Object.keys(excelRows[0] || {}).map(key => ({
    wch: Math.max(key.length * 2, 16)
  }));
  worksheet['!cols'] = colWidths;

  const defaultName = students.length === 1 
    ? `Student_${students[0]['রেজিস্ট্রেশন/আইডি নম্বর'] || students[0].id || 'profile'}`
    : `Students_List_${new Date().toISOString().slice(0, 10)}`;

  const fileName = `${customFileName || defaultName}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Print & Save Student Profile as PDF with professional typography and Bengali font support
 */
export const downloadStudentProfilePDF = (
  student: Student,
  branding?: MadrasahBrandingInfo
) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const sId = student['রেজিস্ট্রেশন/আইডি নম্বর'] || student['রেজিস্ট্রেশন/আইডি'] || student.id || '';
  const sName = student['শিক্ষার্থীর নাম'] || student.name || '';
  const sClass = student['জামাত/শ্রেণী'] || student['জামাত'] || student.class || '';
  const sRoll = student['রোল নম্বর'] || student.roll || '—';
  const sBranch = student['শাখা'] || student.branch || 'ক';
  const sFather = student['পিতার নাম'] || student.fatherName || '—';
  const sMother = student['মাতার নাম'] || student.motherName || '—';
  const sMobile = student['অভিভাবকের মোবাইল'] || student['মোবাইল (মা)'] || student['মোবাইল (বাবা/ভাই)'] || student.mobile || '—';
  const sAltMobile = student['বিকল্প মোবাইল'] || student.altMobile || '—';
  const sDob = student['জন্ম তারিখ'] || student.dob || '—';
  const sBirthReg = student['জন্ম নিবন্ধন সনদ নম্বর'] || student['এনআইডি/জন্ম সনদ'] || student.birthRegNo || '—';
  const sBlood = student['রক্তের গ্রুপ'] || student.bloodGroup || '—';
  const sStatus = student['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || student['শিক্ষার্থী ধরণ'] || student.status || 'সক্রিয়/চলমান শিক্ষার্থী';
  const sTuition = student.tuitionFee !== undefined ? student.tuitionFee : (student['মাসিক বেতন'] || student['মাসিক ফি'] || 0);
  const sKhoraki = student.khorakiFee !== undefined ? student.khorakiFee : (student['খোরাকী'] || student['খোরাকী ফি'] || 0);
  const sRfid = student.rfid || '—';
  const sAddress = student['স্থায়ী ঠিকানা'] || student['বর্তমান ঠিকানা'] || student.address || '—';
  const sYear = student.academicYearLabel || student['শিক্ষাবর্ষ'] || '—';

  const mName = branding?.name || branding?.banglaName || 'মারকাযুত তাকওয়া আল মাদানিয়া';
  const mAddress = branding?.address || 'ঢাকা, বাংলাদেশ';
  const mPhone = branding?.phone || '০১৯৬৬৬৭৭৭৮৮';
  const mLogo = branding?.logoUrl || '/src/PNG/LOGO.png';

  const html = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <title>শিক্ষার্থী প্রোফাইল - ${sName} (${sId})</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800;900&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Hind Siliguri', sans-serif;
        }

        body {
          padding: 24px;
          background: #ffffff;
          color: #1e293b;
          font-size: 13px;
          line-height: 1.5;
        }

        .sheet {
          max-width: 780px;
          margin: 0 auto;
          border: 2px solid #0d555c;
          border-radius: 16px;
          padding: 28px;
          background: #fff;
          position: relative;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #0d555c;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo {
          width: 64px;
          height: 64px;
          object-fit: contain;
        }

        .title-box h1 {
          font-size: 22px;
          font-weight: 900;
          color: #0d555c;
          margin-bottom: 2px;
        }

        .title-box p {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }

        .badge {
          background: #0d555c;
          color: #fff;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
          text-align: right;
        }

        .student-hero {
          display: flex;
          gap: 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .photo-box {
          width: 90px;
          height: 110px;
          border: 2px solid #cbd5e1;
          border-radius: 8px;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #64748b;
          font-weight: bold;
          overflow: hidden;
          flex-shrink: 0;
        }

        .photo-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-details {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px 16px;
        }

        .hero-name {
          grid-column: span 2;
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
          margin-bottom: 4px;
        }

        .field {
          display: flex;
          font-size: 12px;
        }

        .field-label {
          width: 110px;
          color: #64748b;
          font-weight: 600;
        }

        .field-value {
          font-weight: 800;
          color: #0f172a;
          flex: 1;
        }

        .section-title {
          font-size: 13px;
          font-weight: 900;
          color: #0d555c;
          background: #e6f4f5;
          padding: 6px 12px;
          border-radius: 6px;
          margin: 16px 0 10px 0;
          border-left: 4px solid #0d555c;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px 16px;
          padding: 0 4px;
        }

        .info-row {
          display: flex;
          border-bottom: 1px dashed #e2e8f0;
          padding: 5px 0;
        }

        .info-row .label {
          width: 130px;
          font-weight: 600;
          color: #64748b;
        }

        .info-row .val {
          font-weight: 800;
          color: #1e293b;
          flex: 1;
        }

        .footer-signatures {
          margin-top: 40px;
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #e2e8f0;
        }

        .sig-box {
          text-align: center;
          width: 160px;
        }

        .sig-line {
          border-top: 1px solid #475569;
          margin-bottom: 4px;
        }

        .sig-text {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
        }

        @media print {
          body {
            padding: 0;
            background: #fff;
          }
          .sheet {
            border: 2px solid #0d555c;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="header">
          <div class="header-left">
            <img src="${mLogo}" alt="Logo" class="logo" onerror="this.style.display='none'">
            <div class="title-box">
              <h1>${mName}</h1>
              <p>${mAddress} | যোগাযোগ: ${enToBnNumber(mPhone)}</p>
            </div>
          </div>
          <div class="badge">
            শিক্ষার্থী বিবরণী
          </div>
        </div>

        <div class="student-hero">
          <div class="photo-box">
            ${student.photoUrl ? `<img src="${student.photoUrl}" alt="Photo">` : 'ছবি'}
          </div>
          <div class="hero-details">
            <div class="hero-name">${sName}</div>
            <div class="field">
              <span class="field-label">আইডি নম্বর:</span>
              <span class="field-value" style="color: #0d555c;">#${enToBnNumber(sId)}</span>
            </div>
            <div class="field">
              <span class="field-label">রোল নম্বর:</span>
              <span class="field-value">${enToBnNumber(sRoll)}</span>
            </div>
            <div class="field">
              <span class="field-label">জামাত / শ্রেণী:</span>
              <span class="field-value">${sClass}</span>
            </div>
            <div class="field">
              <span class="field-label">শাখা:</span>
              <span class="field-value">${sBranch}</span>
            </div>
            <div class="field">
              <span class="field-label">শিক্ষাবর্ষ:</span>
              <span class="field-value">${enToBnNumber(sYear)}</span>
            </div>
            <div class="field">
              <span class="field-label">স্ট্যাটাস:</span>
              <span class="field-value">${sStatus}</span>
            </div>
          </div>
        </div>

        <div class="section-title">পারিবারিক ও অভিভাবকের তথ্য</div>
        <div class="info-grid">
          <div class="info-row">
            <span class="label">পিতার নাম:</span>
            <span class="val">${sFather}</span>
          </div>
          <div class="info-row">
            <span class="label">মাতার নাম:</span>
            <span class="val">${sMother}</span>
          </div>
          <div class="info-row">
            <span class="label">অভিভাবকের মোবাইল:</span>
            <span class="val">${enToBnNumber(sMobile)}</span>
          </div>
          <div class="info-row">
            <span class="label">বিকল্প মোবাইল:</span>
            <span class="val">${enToBnNumber(sAltMobile)}</span>
          </div>
        </div>

        <div class="section-title">ব্যক্তিগত ও সাধারণ তথ্য</div>
        <div class="info-grid">
          <div class="info-row">
            <span class="label">জন্ম তারিখ:</span>
            <span class="val">${enToBnNumber(sDob)}</span>
          </div>
          <div class="info-row">
            <span class="label">রক্তের গ্রুপ:</span>
            <span class="val">${sBlood}</span>
          </div>
          <div class="info-row">
            <span class="label">জন্ম সনদ / NID:</span>
            <span class="val">${enToBnNumber(sBirthReg)}</span>
          </div>
          <div class="info-row">
            <span class="label">RFID কার্ড:</span>
            <span class="val">${enToBnNumber(sRfid)}</span>
          </div>
          <div class="info-row" style="grid-column: span 2;">
            <span class="label">স্থায়ী/বর্তমান ঠিকানা:</span>
            <span class="val">${sAddress}</span>
          </div>
        </div>

        <div class="section-title">আর্থিক তথ্য কাঠামো</div>
        <div class="info-grid">
          <div class="info-row">
            <span class="label">মাসিক নির্ধারিত বেতন:</span>
            <span class="val" style="color: #0d555c;">৳ ${enToBnNumber(sTuition.toString())}</span>
          </div>
          <div class="info-row">
            <span class="label">মাসিক খোরাকী ফি:</span>
            <span class="val" style="color: #7c3aed;">৳ ${enToBnNumber(sKhoraki.toString())}</span>
          </div>
        </div>

        <div class="footer-signatures">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-text">অভিভাবকের স্বাক্ষর</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-text">হিসাবরক্ষক</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-text">মুহতামিম / প্রিন্সিপাল</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 400);
};

/**
 * Print & Save Students Table List as PDF with full institution branding
 */
export const downloadStudentsListPDF = (
  students: Student[],
  title: string = 'শিক্ষার্থীদের তালিকা',
  branding?: MadrasahBrandingInfo
) => {
  if (!students || students.length === 0) {
    alert('ডাউনলোড করার জন্য কোনো শিক্ষার্থী পাওয়া যায়নি।');
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const mName = branding?.name || branding?.banglaName || 'দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা';
  const mAddress = branding?.address || 'নয়া কান্দারগাঁও, লুটেরচর-৩৫১৬, মেঘনা, কুমিল্লা।';
  const mPhone = branding?.phone || '০১৯৬৬৬৭৭৭৮৮';
  const mLogo = branding?.logoUrl || '/src/PNG/LOGO.png';

  const rowsHtml = students.map((s, idx) => {
    const sId = s['রেজিস্ট্রেশন/আইডি নম্বর'] || s['রেজিস্ট্রেশন/আইডি'] || s.id || '—';
    const sName = s['শিক্ষার্থীর নাম'] || s.name || '—';
    const sClass = s['জামাত/শ্রেণী'] || s['জামাত'] || s.class || '—';
    const sRoll = s['রোল নম্বর'] || s.roll || '—';
    const sBranch = s['শাখা'] || s.branch || 'ক';
    const sFather = s['পিতার নাম'] || s.fatherName || '—';
    const sMobile = s['অভিভাবকের মোবাইল'] || s['মোবাইল (মা)'] || s['মোবাইল (বাবা/ভাই)'] || s.mobile || '—';
    const sStatus = s['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || s['শিক্ষার্থী ধরণ'] || s.status || 'আবাসিক';

    return `
      <tr>
        <td style="text-align: center;">${enToBnNumber((idx + 1).toString())}</td>
        <td style="text-align: center; font-weight: 800; color: #0d555c;">${enToBnNumber(sId.toString())}</td>
        <td style="font-weight: 800;">${sName}</td>
        <td>${sClass}</td>
        <td style="text-align: center; font-weight: 700;">${enToBnNumber(sRoll.toString())}</td>
        <td style="text-align: center;">${sBranch}</td>
        <td>${sFather}</td>
        <td style="text-align: center; font-family: monospace;">${enToBnNumber(sMobile.toString())}</td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: #f1f5f9;">
            ${sStatus}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800;900&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Hind Siliguri', sans-serif;
        }

        body {
          padding: 20px;
          background: #ffffff;
          color: #1e293b;
          font-size: 11px;
          line-height: 1.4;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #0d555c;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo {
          width: 50px;
          height: 50px;
          object-fit: contain;
        }

        .title-box h1 {
          font-size: 18px;
          font-weight: 900;
          color: #0d555c;
        }

        .title-box p {
          font-size: 11px;
          color: #64748b;
        }

        .meta-box {
          text-align: right;
        }

        .meta-box .tag {
          background: #0d555c;
          color: #fff;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
          display: inline-block;
          margin-bottom: 4px;
        }

        .meta-box .date {
          font-size: 10px;
          color: #64748b;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        th {
          background: #f1f5f9;
          color: #0f172a;
          font-weight: 800;
          font-size: 10px;
          padding: 8px 6px;
          border: 1px solid #cbd5e1;
          text-transform: uppercase;
        }

        td {
          padding: 6px;
          border: 1px solid #cbd5e1;
          font-size: 10.5px;
        }

        tr:nth-child(even) {
          background: #f8fafc;
        }

        .summary {
          margin-top: 10px;
          font-weight: 700;
          font-size: 11px;
          color: #334155;
        }

        .footer-signatures {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }

        .sig-box {
          text-align: center;
          width: 140px;
        }

        .sig-line {
          border-top: 1px solid #475569;
          margin-bottom: 4px;
        }

        .sig-text {
          font-size: 10px;
          font-weight: 700;
          color: #475569;
        }

        @media print {
          body {
            padding: 0;
            background: #fff;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <img src="${mLogo}" alt="Logo" class="logo" onerror="this.style.display='none'">
          <div class="title-box">
            <h1>${mName}</h1>
            <p>${mAddress} | ফোন: ${enToBnNumber(mPhone)}</p>
          </div>
        </div>
        <div class="meta-box">
          <div class="tag">${title}</div>
          <div class="date">তারিখ: ${new Date().toLocaleDateString('bn-BD')} | মোট: ${enToBnNumber(students.length.toString())} জন</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">নং</th>
            <th style="width: 65px; text-align: center;">আইডি নং</th>
            <th>শিক্ষার্থীর নাম</th>
            <th>জামাত/শ্রেণী</th>
            <th style="width: 45px; text-align: center;">রোল</th>
            <th style="width: 45px; text-align: center;">শাখা</th>
            <th>পিতার নাম</th>
            <th style="width: 90px; text-align: center;">মোবাইল</th>
            <th style="width: 65px; text-align: center;">ধরণ</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="summary">
        * সর্বমোট মুদ্রিত শিক্ষার্থীর সংখ্যা: ${enToBnNumber(students.length.toString())} জন
      </div>

      <div class="footer-signatures">
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-text">প্রস্তুতকারীর স্বাক্ষর</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-text">হিসাবরক্ষক</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-text">মুহতামিম / অধ্যক্ষ</div>
        </div>
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 400);
};
