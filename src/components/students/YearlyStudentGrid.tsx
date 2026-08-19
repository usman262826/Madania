import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Calendar, 
  Search, 
  User, 
  GraduationCap,
  ArrowLeft,
  IdCard,
  Phone,
  FileText,
  Users,
  MapPin,
  Hash,
  Bookmark,
  Shield,
  Loader2,
  Mail,
  Heart,
  ExternalLink,
  QrCode,
  Clock,
  Compass,
  Award,
  CheckCircle2,
  MessageSquare,
  Copy,
  ChevronRight,
  ChevronLeft,
  Edit,
  Printer,
  Download,
  Share2,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../../types';
import { enToBnNumber, cn, formatDateToDDMMYYYY, isClassMatch } from '../../lib/utils';
import { JAMAT_LIST, ACADEMIC_YEARS } from '../../constants';
import { StudentMobileProfile } from './StudentMobileProfile';
import { StudentQuickActions } from './StudentQuickActions';
import { StudentProfileCard } from './StudentProfileCard';
import { StudentActionButtons } from './StudentActionButtons';

interface YearlyStudentGridProps {
  students: Student[];
  externalSelectedYear?: string;
  jumpToStudentId?: string | null;
  onJumpComplete?: () => void;
  onUpdateStudent?: (updatedStudent: Student) => void;
  initialSelectedClass?: string | null;
  onClearInitialClass?: () => void;
}

export const YearlyStudentGrid: React.FC<YearlyStudentGridProps> = ({ 
  students, 
  externalSelectedYear,
  jumpToStudentId,
  onJumpComplete,
  onUpdateStudent,
  initialSelectedClass,
  onClearInitialClass
}) => {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(initialSelectedClass || null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (initialSelectedClass) {
      setSelectedClass(initialSelectedClass);
      if (onClearInitialClass) {
        onClearInitialClass();
      }
    }
  }, [initialSelectedClass]);
  const [selectedView, setSelectedView] = useState<'class-only' | 'class-with-students' | 'all-students'>('class-only');
  const [profileTab, setProfileTab] = useState<'basic' | 'academic' | 'contact' | 'digital'>('basic');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [leftRegCopied, setLeftRegCopied] = useState(false);
  const [leftMobileCopied, setLeftMobileCopied] = useState(false);
  const [copiedType, setCopiedType] = useState<'long' | 'short' | null>(null);

  // Custom states for Secretariat/Serial List View
  const [viewMode, setViewMode] = useState<'grid' | 'secretariat'>('grid');
  const [collapsedJamats, setCollapsedJamats] = useState<string[]>([]);

  const toggleJamatCollapse = (jamatName: string) => {
    setCollapsedJamats(prev => 
      prev.includes(jamatName) 
        ? prev.filter(x => x !== jamatName) 
        : [...prev, jamatName]
    );
  };

  const expandAllJamats = () => setCollapsedJamats([]);
  const collapseAllJamats = () => setCollapsedJamats(JAMAT_LIST);

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedStudents.length === filteredStudents.length) setSelectedStudents([]);
    else setSelectedStudents(filteredStudents.map(s => s['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || s.id || ''));
  };

  // Robust Direct PDF Save & Print with 100% correct Bengali unicode font support
  const printStudents = (mode: 'single-jamat' | 'all-jamat-wise' | 'flat-serial', jamatName?: string) => {
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

    let contentHtml = '';
    const yearText = selectedYear || '—';

    if (mode === 'single-jamat') {
      const targetJamat = jamatName || selectedClass || '';
      let list = students.filter(s => s.academicYearLabel === selectedYear && isClassMatch(s, targetJamat));
      if (selectedStudents.length > 0) {
        list = list.filter(s => selectedStudents.includes((s['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || s.id || '')));
      }
      
      contentHtml = `
        <div class="print-section">
          <div class="print-title">জামাত ভিত্তিক শিক্ষার্থী তালিকা (${targetJamat})</div>
          <div class="meta-info">শিক্ষাবর্ষ: ${enToBnNumber(yearText)} | মোট শিক্ষার্থী: ${enToBnNumber(list.length.toString())} জন</div>
          <table>
            <thead>
              <tr>
                <th style="width: 8%;">ক্রমিক</th>
                <th style="width: 15%;">আইডি নম্বর</th>
                <th style="width: 10%;">রোল</th>
                <th>শিক্ষার্থীর নাম</th>
                <th>পিতার নাম</th>
                <th style="width: 20%;">মোবাইল</th>
                <th style="width: 12%;">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              ${list.map((s, idx) => `
                <tr>
                  <td style="text-align: center;">${enToBnNumber((idx + 1).toString())}</td>
                  <td style="text-align: center; font-weight: bold; color: #0d6582;">${enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '')}</td>
                  <td style="text-align: center; font-weight: bold;">${enToBnNumber(s['রোল নম্বর'] || '')}</td>
                  <td style="font-weight: bold;">${s['শিক্ষার্থীর নাম'] || ''}</td>
                  <td>${s['পিতার নাম'] || '—'}</td>
                  <td style="text-align: center;">${enToBnNumber(s['অভিভাবকের মোবাইল'] || s['মোবাইল (মা)'] || '—')}</td>
                  <td style="text-align: center;">অধ্যয়নরত</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (mode === 'all-jamat-wise') {
      contentHtml = JAMAT_LIST.map((jamat, idx) => {
        const list = students.filter(s => s.academicYearLabel === selectedYear && isClassMatch(s, jamat));
        if (list.length === 0) return '';

        return `
          <div class="print-section" style="${idx < JAMAT_LIST.length - 1 ? 'page-break-after: always;' : ''}">
            <div class="print-title">জামাত ভিত্তিক শিক্ষার্থী তালিকা (${jamat})</div>
            <div class="meta-info">শিক্ষাবর্ষ: ${enToBnNumber(yearText)} | জামাতে মোট শিক্ষার্থী: ${enToBnNumber(list.length.toString())} জন</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 8%;">ক্রমিক</th>
                  <th style="width: 15%;">আইডি নম্বর</th>
                  <th style="width: 10%;">রোল</th>
                  <th>শিক্ষার্থীর নাম</th>
                  <th>পিতার নাম</th>
                  <th style="width: 20%;">মোবাইল</th>
                  <th style="width: 12%;">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                ${list.map((s, sIdx) => `
                  <tr>
                    <td style="text-align: center;">${enToBnNumber((sIdx + 1).toString())}</td>
                    <td style="text-align: center; font-weight: bold; color: #0d6582;">${enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '')}</td>
                    <td style="text-align: center; font-weight: bold;">${enToBnNumber(s['রোল নম্বর'] || '')}</td>
                    <td style="font-weight: bold;">${s['শিক্ষার্থীর নাম'] || ''}</td>
                    <td>${s['পিতার নাম'] || '—'}</td>
                    <td style="text-align: center;">${enToBnNumber(s['অভিভাবকের মোবাইল'] || s['মোবাইল (মা)'] || '—')}</td>
                    <td style="text-align: center;">অধ্যয়নরত</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }).filter(Boolean).join('');
    } else if (mode === 'flat-serial') {
      const yearStudents = students.filter(s => s.academicYearLabel === selectedYear);
      const sortedList = [...yearStudents].sort((a, b) => {
        const aClass = (a['জামাত'] || a['জামাত/শ্রেণী'] || a['শ্রেণী'] || '').toString().trim();
        const bClass = (b['জামাত'] || b['জামাত/শ্রেণী'] || b['শ্রেণী'] || '').toString().trim();
        const aIndex = JAMAT_LIST.indexOf(aClass);
        const bIndex = JAMAT_LIST.indexOf(bClass);
        if (aIndex !== bIndex) return aIndex - bIndex;
        const aRoll = parseInt(a['রোল নম্বর']?.toString() || '0', 10);
        const bRoll = parseInt(b['রোল নম্বর']?.toString() || '0', 10);
        return aRoll - bRoll;
      });

      contentHtml = `
        <div class="print-section">
          <div class="print-title">সিরিয়াল ভিত্তিক সকল শিক্ষার্থী তালিকা</div>
          <div class="meta-info">শিক্ষাবর্ষ: ${enToBnNumber(yearText)} | মোট সর্বমোট শিক্ষার্থী: ${enToBnNumber(sortedList.length.toString())} জন</div>
          <table>
            <thead>
              <tr>
                <th style="width: 6%;">ক্রমিক</th>
                <th style="width: 15%;">জামাত/শ্রেণী</th>
                <th style="width: 12%;">আইডি নম্বর</th>
                <th style="width: 8%;">রোল</th>
                <th>শিক্ষার্থীর নাম</th>
                <th>পিতার নাম</th>
                <th style="width: 18%;">মোবাইল</th>
              </tr>
            </thead>
            <tbody>
              ${sortedList.map((s, idx) => `
                <tr>
                  <td style="text-align: center;">${enToBnNumber((idx + 1).toString())}</td>
                  <td style="text-align: center; font-weight: bold; color: #0d6582;">${(s['জামাত'] || s['জামাত/শ্রেণী'] || s['শ্রেণী'] || '')}</td>
                  <td style="text-align: center;">${enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '')}</td>
                  <td style="text-align: center; font-weight: bold;">${enToBnNumber(s['রোল নম্বর'] || '')}</td>
                  <td style="font-weight: bold;">${s['শিক্ষার্থীর নাম'] || ''}</td>
                  <td>${s['পিতার নাম'] || '—'}</td>
                  <td style="text-align: center;">${enToBnNumber(s['অভিভাবকের মোবাইল'] || s['মোবাইল (মা)'] || '—')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>শিক্ষার্থী তালিকা প্রিন্ট</title>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Hind Siliguri', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #1f2937;
            background-color: #fff;
            font-size: 12px;
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 15mm 10mm 15mm 10mm;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: center;
            border-bottom: 2px double #0d6582;
            padding-bottom: 12px;
            margin-bottom: 20px;
            text-align: center;
            flex-direction: column;
          }
          .header h1 {
            font-size: 20px;
            margin: 0 0 4px 0;
            color: #0d6582;
            font-weight: 700;
          }
          .header p {
            font-size: 11px;
            margin: 0;
            color: #4b5563;
          }
          .print-title {
            font-size: 13px;
            font-weight: 700;
            color: white;
            background-color: #0d6582;
            text-align: center;
            padding: 6px 15px;
            border-radius: 4px;
            margin-bottom: 8px;
          }
          .meta-info {
            font-size: 11px;
            color: #4b5563;
            font-weight: 600;
            margin-bottom: 12px;
            text-align: center;
            border-bottom: 1px dashed #d1d5db;
            padding-bottom: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th, td {
            border: 1px solid #9ca3af;
            padding: 6px 8px;
            font-size: 11px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            color: #1f2937;
            font-weight: 700;
            text-align: center;
          }
          td {
            color: #1f2937;
          }
          .footer {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #4b5563;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>মাদানিয়া মডেল মাদ্রাসা</h1>
          <p>আল মাদানিয়া মডেল মাদ্রাসা - শিক্ষার্থী তালিকা রেকর্ড</p>
        </div>

        ${contentHtml}

        <div class="footer">
          <div>প্রিন্ট করার তারিখ ও সময়: ${enToBnNumber(new Date().toLocaleString('bn-BD'))}</div>
          <div>মাদানিয়া ম্যানেজমেন্ট সিস্টেম</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 3000);
  };

  // Robust Excel Export with perfect styling and columns
  const exportStudentsExcel = (mode: 'single-jamat' | 'all-jamat-wise' | 'flat-serial', jamatName?: string) => {
    let list: Student[] = [];
    let fileName = 'student_list';

    if (mode === 'single-jamat') {
      const targetJamat = jamatName || selectedClass || '';
      list = students.filter(s => s.academicYearLabel === selectedYear && (s['জামাত'] || s['জামাত/শ্রেণী'] || s['শ্রেণী'] || '').toString().trim() === targetJamat.trim());
      if (selectedStudents.length > 0) {
        list = list.filter(s => selectedStudents.includes((s['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || s.id || '')));
      }
      fileName = `${targetJamat}_student_list`;
    } else if (mode === 'flat-serial' || mode === 'all-jamat-wise') {
      const yearStudents = students.filter(s => s.academicYearLabel === selectedYear);
      list = [...yearStudents].sort((a, b) => {
        const aClass = (a['জামাত'] || a['জামাত/শ্রেণী'] || a['শ্রেণী'] || '').toString().trim();
        const bClass = (b['জামাত'] || b['জামাত/শ্রেণী'] || b['শ্রেণী'] || '').toString().trim();
        const aIndex = JAMAT_LIST.indexOf(aClass);
        const bIndex = JAMAT_LIST.indexOf(bClass);
        if (aIndex !== bIndex) return aIndex - bIndex;
        const aRoll = parseInt(a['রোল নম্বর']?.toString() || '0', 10);
        const bRoll = parseInt(b['রোল নম্বর']?.toString() || '0', 10);
        return aRoll - bRoll;
      });
      fileName = `All_Students_${selectedYear?.replace(/\//g, '_')}`;
    }

    const exportData = list.map((s, idx) => ({
      'ক্রমিক': idx + 1,
      'আইডি নম্বর': s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '',
      'জামাত/শ্রেণী': s['জামাত'] || s['জামাত/শ্রেণী'] || s['শ্রেণী'] || '',
      'রোল নম্বর': s['রোল নম্বর'] || '',
      'শিক্ষার্থীর নাম': s['শিক্ষার্থীর নাম'] || '',
      'পিতার নাম': s['পিতার নাম'] || '—',
      'অভিভাবকের মোবাইল': s['অভিভাবকের মোবাইল'] || s['মোবাইল (মা)'] || '—',
      'ঠিকানা': s['ঠিকানা'] || s['গ্রাম/মহল্লা'] || '—',
      'জন্ম তারিখ': formatDateToDDMMYYYY(s['জন্ম তারিখ'] || s.dob || ''),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const handleShare = async () => {
    if (!selectedStudent) return;
    const student = selectedStudent;
    const sName = student['শিক্ষার্থীর নাম'] || student.name || 'শিক্ষার্থী';
    const sId = student['রেজিস্ট্রেশন/আইডি'] || student['রেজিস্ট্রেশন/আইডি নম্বর'] || student.id || '—';
    const sRoll = student['রোল নম্বর'] || student.roll || '—';
    const sClass = student['জামাত/শ্রেণী'] || student.class || selectedClass || '—';

    const shareText = `শিক্ষার্থীর নাম: ${sName}\nআইডি/রেজিস্ট্রেশন: ${sId}\nজামাত: ${sClass}\nরোল: ${sRoll}\nমাদানিয়া ম্যানেজমেন্ট সিস্টেম`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${sName} - প্রোফাইল`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\nলিংক: ${window.location.href}`);
        alert('শেয়ার তথ্য ও লিংক ক্লিপবোর্ডে কপি করা হয়েছে!');
      } catch (err) {
        alert('কপি করা সম্ভব হয়নি।');
      }
    }
  };

  const printProfile = () => {
    if (!selectedStudent) return;
    const student = selectedStudent;
    const sClass = selectedClass || '—';
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

    const title = student['শিক্ষার্থীর নাম'] || student.name || 'Student';
    const idNum = student['রেজিস্ট্রেশন/আইডি'] || student['রেজিস্ট্রেশন/আইডি নম্বর'] || student.id || '—';
    const rollNum = student['রোল নম্বর'] || student.roll || '—';
    const father = student['পিতার নাম'] || student.fatherName || '—';
    const mother = student['মাতার নাম'] || student.motherName || '—';
    const dobStr = formatDateToDDMMYYYY(student['জন্ম তারিখ'] || student.dob || '');
    const mobile1 = student['মোবাইল (মা)'] || student.mobile || '—';
    const mobile2 = student['মোবাইল (বাবা/ভাই)'] || student.altMobile || '—';
    const addressStr = student['ঠিকানা'] || student['গ্রাম/মহল্লা'] || '—';
    const blood = student['রক্তের গ্রুপ'] || student.bloodGroup || '—';
    const yearStr = student['শিক্ষাবর্ষ'] || student.academicYearLabel || '—';
    const typeStr = student['শিক্ষার্থী ধরণ'] || student.studentType || 'নতুন';
    const statusStr = student['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || student['স্ট্যাটাস'] || 'অধ্যয়নরত (সক্রিয়)';
    const prevM = student['পূর্বের মাদ্রাসা'] || student.prevMadrasa || '—';
    const birthRegNum = student['জন্ম নিবন্ধন নাম্বার'] || student['জন্ম নিবন্ধন/NID নং'] || student.birthReg || '—';
    const emailStr = student['ইমেইল'] || student.email || 'নেই';
    
    // Calculate age
    let ageStr = '—';
    if (student['জন্ম তারিখ'] || student.dob) {
      try {
        const bDate = new Date(student['জন্ম তারিখ'] || student.dob || '');
        if (!isNaN(bDate.getTime())) {
          const diffMs = Date.now() - bDate.getTime();
          const ageDate = new Date(diffMs);
          const ageY = Math.abs(ageDate.getUTCFullYear() - 1970);
          ageStr = enToBnNumber(ageY.toString()) + ' বছর';
        }
      } catch (e) {}
    }

    const attendancePercent = "৯৫%";
    const totalAttendanceDays = "২৪০ দিন";
    const totalAbsentDays = "১০ দিন";

    const feeStatus = "পরিশোধিত";
    const dueAmount = "০/- টাকা";
    const lastPaid = "১,৫০০/- টাকা";
    const totalPaid = "৮,৫০০/- টাকা";

    const qrImageUrl = (student['QR CODE'] && student['QR CODE'].toString().startsWith('http')) 
      ? student['QR CODE'] 
      : (student['QR CODE IMAGE'] || '');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - প্রোফাইল</title>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Hind Siliguri', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 30px;
            color: #1f2937;
            background-color: #fff;
            font-size: 13px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 20mm 15mm 20mm 15mm;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px double #0d6582;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .logo-container {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .header-logo {
            width: 55px;
            height: 55px;
            background: #0d6582;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
          }
          .header-text {
            text-align: left;
          }
          .header-text h1 {
            font-size: 22px;
            margin: 0 0 4px 0;
            color: #0d6582;
            font-weight: 700;
          }
          .header-text p {
            font-size: 11px;
            margin: 0;
            color: #6b7280;
            letter-spacing: 0.5px;
          }
          .photo-box {
            width: 100px;
            height: 110px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9fafb;
            overflow: hidden;
            font-size: 10px;
            color: #9ca3af;
          }
          .photo-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .profile-title {
            text-align: center;
            background: #0d6582;
            color: white;
            padding: 6px 20px;
            border-radius: 30px;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 1px;
            display: inline-block;
            margin: 0 auto 25px auto;
          }
          .title-container {
            text-align: center;
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 12px;
            font-weight: 700;
            color: #0d6582;
            border-bottom: 1.5px solid #0d6582;
            padding-bottom: 4px;
            margin-top: 22px;
            margin-bottom: 12px;
            text-transform: uppercase;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px 24px;
          }
          .item {
            display: flex;
            border-bottom: 1px dashed #e5e7eb;
            padding-bottom: 4px;
          }
          .label {
            font-weight: 600;
            color: #4b5563;
            width: 140px;
            flex-shrink: 0;
          }
          .value {
            color: #111827;
            font-weight: 500;
          }
          .full-width {
            grid-column: span 2;
          }
          .footer {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 11px;
          }
          .signature-line {
            width: 150px;
            border-top: 1px solid #9ca3af;
            text-align: center;
            padding-top: 5px;
            color: #4b5563;
            font-weight: 600;
          }
          .qr-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
          }
          .qr-code-img {
            width: 70px;
            height: 70px;
            border: 1px solid #e5e7eb;
            padding: 3px;
            background: white;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 60px;
            color: rgba(13, 101, 130, 0.03);
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div class="watermark">AL MADANIA MADRASA</div>
        
        <div class="header">
          <div class="logo-container">
            <div class="header-logo">ম</div>
            <div class="header-text">
              <h1>মাদানিয়া মডেল মাদ্রাসা</h1>
              <p>Al Madania Model Madrasa - Management System</p>
            </div>
          </div>
          <div class="photo-box">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: #cbd5e1;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>

        <div class="title-container">
          <div class="profile-title">শিক্ষার্থী বিস্তারিত তথ্য বিবরণী (Student Profile Document)</div>
        </div>

        <div class="section-title">১. শিক্ষার্থীর মৌলিক তথ্য (Basic Information)</div>
        <div class="grid">
          <div class="item"><div class="label">শিক্ষার্থীর নাম:</div><div class="value">${title}</div></div>
          <div class="item"><div class="label">আইডি/রেজিস্ট্রেশন:</div><div class="value">${enToBnNumber(idNum.toString())}</div></div>
          <div class="item"><div class="label">রোল নম্বর:</div><div class="value">${enToBnNumber(rollNum.toString())}</div></div>
          <div class="item"><div class="label">জামাত/শ্রেণী:</div><div class="value">${sClass}</div></div>
          <div class="item"><div class="label">শিক্ষাবর্ষ:</div><div class="value">${enToBnNumber(yearStr.toString())}</div></div>
          <div class="item"><div class="label">শিক্ষার্থী ধরণ:</div><div class="value">${typeStr}</div></div>
          <div class="item"><div class="label">বর্তমান স্ট্যাটাস:</div><div class="value" style="color: #10b981; font-weight: bold;">${statusStr}</div></div>
        </div>

        <div class="section-title">২. ব্যক্তিগত তথ্য (Personal Information)</div>
        <div class="grid">
          <div class="item"><div class="label">জন্ম তারিখ:</div><div class="value">${enToBnNumber(dobStr)}</div></div>
          <div class="item"><div class="label">বয়স (আনুমানিক):</div><div class="value">${ageStr}</div></div>
          <div class="item"><div class="label">রক্তের গ্রুপ:</div><div class="value">${blood}</div></div>
          <div class="item"><div class="label">জাতীয়তা:</div><div class="value">বাংলাদেশী</div></div>
          <div class="item"><div class="label">জন্ম নিবন্ধন নং:</div><div class="value">${enToBnNumber(birthRegNum.toString())}</div></div>
          <div class="item"><div class="label">ইমেইল ঠিকানা:</div><div class="value">${emailStr}</div></div>
        </div>

        <div class="section-title">৩. অভিভাবকের তথ্য (Guardian Information)</div>
        <div class="grid">
          <div class="item"><div class="label">পিতার নাম:</div><div class="value">${father}</div></div>
          <div class="item"><div class="label">মাতার নাম:</div><div class="value">${mother}</div></div>
          <div class="item"><div class="label">অভিভাবক:</div><div class="value">${father}</div></div>
          <div class="item"><div class="label">মোবাইল (মা):</div><div class="value">${enToBnNumber(mobile1.toString())}</div></div>
          <div class="item"><div class="label">মোবাইল (বিকল্প):</div><div class="value">${enToBnNumber(mobile2.toString())}</div></div>
          <div class="item full-width"><div class="label">স্থায়ী ও বর্তমান ঠিকানা:</div><div class="value">${addressStr}</div></div>
        </div>

        <div class="section-title">৪. একাডেমিক তথ্য ও খতিয়ান (Academic Record)</div>
        <div class="grid">
          <div class="item"><div class="label">ভর্তি তারিখ:</div><div class="value">০১/০১/২০২৪</div></div>
          <div class="item"><div class="label">পূর্ববর্তী মাদ্রাসা:</div><div class="value">${prevM}</div></div>
          <div class="item"><div class="label">মোট উপস্থিতি:</div><div class="value">${enToBnNumber(totalAttendanceDays)}</div></div>
          <div class="item"><div class="label">মোট অনুপস্থিতি:</div><div class="value">${enToBnNumber(totalAbsentDays)}</div></div>
          <div class="item"><div class="label">উপস্থিতির শতকরা হার:</div><div class="value">${enToBnNumber(attendancePercent)}</div></div>
          <div class="item"><div class="label">পূর্ববর্তী ফলাফল:</div><div class="value">উত্তীর্ণ (সমমান)</div></div>
        </div>

        <div class="section-title">৫. আর্থিক বিবরণী সংক্ষেপ (Financial Summary)</div>
        <div class="grid">
          <div class="item"><div class="label">ফি পরিশোধ অবস্থা:</div><div class="value" style="color: #0d6582; font-weight: bold;">${feeStatus}</div></div>
          <div class="item"><div class="label">মোট পরিশোধিত ফি:</div><div class="value">${enToBnNumber(totalPaid)}</div></div>
          <div class="item"><div class="label">সর্বশেষ পরিশোধ:</div><div class="value">${enToBnNumber(lastPaid)}</div></div>
          <div class="item"><div class="label">সর্বমোট বকেয়া:</div><div class="value">${enToBnNumber(dueAmount)}</div></div>
        </div>

        <div class="section-title">৬. অন্যান্য তথ্য ও মন্তব্য (Remarks & Documents)</div>
        <div class="grid">
          <div class="item full-width"><div class="label">সংযুক্ত ডকুমেন্টসমূহ:</div><div class="value">জন্ম নিবন্ধন সনদ, ছবি ও পূর্ববর্তী মাদ্রাসার প্রশংসাপত্র</div></div>
          <div class="item full-width"><div class="label">বিশেষ মন্তব্য:</div><div class="value"> can-print-to-pdf. শিক্ষার্থীর আচার-আচরণ ও পড়াশোনার প্রতি মনোযোগ অত্যন্ত প্রশংসনীয়।</div></div>
        </div>

        <div class="footer">
          <div>
            <div class="signature-line">অফিস সহকারী স্বাক্ষর</div>
            <div style="font-size: 9px; color: #6b7280; margin-top: 5px; text-align: center;">তারিখ: ________________</div>
          </div>
          
          ${qrImageUrl ? `
          <div class="qr-section">
            <img src="${qrImageUrl}" class="qr-code-img" alt="QR Code" />
            <span style="font-size: 8px; color: #6b7280;">ডিজিটাল ভেরিফিকেশন</span>
          </div>
          ` : ''}

          <div>
            <div class="signature-line" style="border-top: 1px solid #0d6582; color: #0d6582;">মুহতামিম / অধ্যক্ষ স্বাক্ষর</div>
            <div style="font-size: 9px; color: #6b7280; margin-top: 5px; text-align: center;">তারিখ: ________________</div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 3000);
  };

  // Profile Edit Mode state variables
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editFather, setEditFather] = useState('');
  const [editMother, setEditMother] = useState('');
  const [editRoll, setEditRoll] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editAltMobile, setEditAltMobile] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState('');
  const [editPrevMadrasa, setEditPrevMadrasa] = useState('');

  const handleStartEdit = () => {
    if (!selectedStudent) return;
    setEditName(selectedStudent['শিক্ষার্থীর নাম'] || selectedStudent.name || '');
    setEditFather(selectedStudent['পিতার নাম'] || selectedStudent.fatherName || '');
    setEditMother(selectedStudent['মাতার নাম'] || selectedStudent.motherName || '');
    setEditRoll(selectedStudent['রোল নম্বর']?.toString() || selectedStudent.roll?.toString() || '');
    setEditMobile(selectedStudent['মোবাইল (মা)']?.toString() || selectedStudent.mobile?.toString() || '');
    setEditAltMobile(selectedStudent['মোবাইল (বাবা/ভাই)']?.toString() || selectedStudent.altMobile?.toString() || '');
    setEditAddress(selectedStudent['ঠিকানা'] || selectedStudent['গ্রাম/মহল্লা'] || '');
    setEditBloodGroup(selectedStudent['রক্তের গ্রুপ'] || selectedStudent.bloodGroup || '');
    setEditPrevMadrasa(selectedStudent['পূর্বের মাদ্রাসা'] || selectedStudent.prevMadrasa || '');
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const updated = {
      ...selectedStudent,
      'শিক্ষার্থীর নাম': editName,
      name: editName,
      'পিতার নাম': editFather,
      fatherName: editFather,
      'মাতার নাম': editMother,
      motherName: editMother,
      'রোল নম্বর': editRoll,
      roll: editRoll,
      'মোবাইল (মা)': editMobile,
      mobile: editMobile,
      'মোবাইল (বাবা/ভাই)': editAltMobile,
      altMobile: editAltMobile,
      'ঠিকানা': editAddress,
      'গ্রাম/মহল্লা': editAddress,
      'রক্তের গ্রুপ': editBloodGroup,
      bloodGroup: editBloodGroup,
      'পূর্বের মাদ্রাসা': editPrevMadrasa,
      prevMadrasa: editPrevMadrasa
    };
    setSelectedStudent(updated);
    if (onUpdateStudent) {
      onUpdateStudent(updated);
    }
    setIsEditing(false);
    alert('শিক্ষার্থীর প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
  };

  const handleCopyLink = async (text: string, type: 'long' | 'short') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };

  // Popstate & device browser navigation sync
  const isPopStateRef = React.useRef(false);

  // Sync state transitions to HTML5 History entries
  useEffect(() => {
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }

    const state = window.history.state;
    // We synchronize whenever parent has activeTab: 'students' to support deep deep links
    if (state && state.activeTab === 'students') {
      const studentId = selectedStudent ? (selectedStudent['রেজিস্ট্রেশন/আইডি নম্বর'] || selectedStudent.id)?.toString() : null;
      
      const isDifferent = 
        state.selectedYear !== selectedYear ||
        state.selectedClass !== selectedClass ||
        state.selectedStudentId !== studentId;

      if (isDifferent) {
        window.history.pushState({
          activeTab: 'students',
          selectedYear,
          selectedClass,
          selectedStudentId: studentId
        }, "", "");
      }
    }
  }, [selectedYear, selectedClass, selectedStudent]);

  // Listen to popstate event specifically for students' inner screens
  useEffect(() => {
    const handlePopStateSub = (event: PopStateEvent) => {
      if (event.state && event.state.activeTab === 'students') {
        isPopStateRef.current = true;
        
        setSelectedYear(event.state.selectedYear || null);
        setSelectedClass(event.state.selectedClass || null);
        
        if (event.state.selectedStudentId) {
          const student = students.find(s => 
            (s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id)?.toString() === event.state.selectedStudentId.toString()
          );
          setSelectedStudent(student || null);
        } else {
          setSelectedStudent(null);
        }
      }
    };

    window.addEventListener('popstate', handlePopStateSub);
    return () => {
      window.removeEventListener('popstate', handlePopStateSub);
    };
  }, [students]);

  // Reset tab when student changes
  useEffect(() => {
    if (selectedStudent) {
      setProfileTab('basic');
    }
  }, [selectedStudent]);

  // Sync externalSelectedYear to selectedYear
  useEffect(() => {
    if (externalSelectedYear) {
      setSelectedYear(externalSelectedYear);
    }
  }, [externalSelectedYear]);

  // Auto-jump to student if jumpToStudentId is provided
  useEffect(() => {
    if (jumpToStudentId) {
      const student = students.find(s => s['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() === jumpToStudentId);
      if (student) {
        setSelectedYear(student.academicYearLabel || null);
        setSelectedClass((student['জামাত/শ্রেণী'] || student['জামাত'] || student['শ্রেণী'] || '').toString());
        setSelectedStudent(student);
        setSearchTerm('');
        if (onJumpComplete) onJumpComplete();
      }
    }
  }, [jumpToStudentId, students, onJumpComplete]);

  // Use academic years from constants or data
  const academicYears = useMemo(() => {
    const fromData = Array.from(new Set(students.map(s => s.academicYearLabel))).filter(Boolean) as string[];
    // Filter out explicitly removed year and keep constants order
    return Array.from(new Set([...ACADEMIC_YEARS, ...fromData]))
      .filter(y => y !== "১৪৪৫-৪৬ হিজরী/২০২৪-২৫ ঈসায়ী");
  }, [students]);

  // Filter students with robust matching
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const studentYear = s.academicYearLabel?.trim();
      const studentClassVal = (s['জামাত'] || s['জামাত/শ্রেণী'] || s['শ্রেণী'] || s['Class'] || '').toString().trim();

      // If we have a year/class selected, restrict search to that context
      if (selectedYear && studentYear !== selectedYear.trim()) return false;
      if (selectedClass && !isClassMatch(s, selectedClass)) return false;

      const q = searchTerm.toLowerCase().trim();
      const sId = (s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || s.studentId || '').toString().toLowerCase();
      const sName = (s['শিক্ষার্থীর নাম'] || s.name || '').toString().toLowerCase();
      const sFather = (s['পিতার নাম'] || s.fatherName || '').toString().toLowerCase();
      const sMother = (s['মাতার নাম'] || s.motherName || '').toString().toLowerCase();
      const sRoll = (s['রোল নম্বর'] || s.roll || '').toString();
      const sMobile = (s['অভিভাবকের মোবাইল'] || s['মোবাইল (মা)'] || s['মোবাইল (বাবা/ভাই)'] || s.mobile || s.phone || '').toString();
      const sBirthReg = (s['জন্ম নিবন্ধন সনদ নম্বর'] || s['এনআইডি/জন্ম সনদ'] || s.birthRegNo || '').toString();
      const sDob = (s['জন্ম তারিখ'] || s.dob || '').toString();
      const sAddress = (s['বর্তমান ঠিকানা'] || s['স্থায়ী ঠিকানা'] || s['ঠিকানা'] || s.address || '').toString().toLowerCase();

      const matchSearch = searchTerm === '' || 
        sId.includes(q) ||
        sName.includes(q) ||
        sFather.includes(q) ||
        sMother.includes(q) ||
        sRoll.includes(q) ||
        sMobile.includes(q) ||
        sBirthReg.includes(q) ||
        sDob.includes(q) ||
        sAddress.includes(q);

      return matchSearch;
    });
  }, [students, searchTerm, selectedYear, selectedClass]);

  const showSearchResults = searchTerm !== '' && !selectedStudent;

  const yearsWithCounts = academicYears.map(year => ({
    year,
    count: students.filter(s => s.academicYearLabel === year).length
  }));

  const resetSelection = () => {
    const state = window.history.state;
    // If we have pushed sub-states in students tab, trigger standard back navigation
    if (state && state.activeTab === 'students' && (state.selectedYear || state.selectedClass || state.selectedStudentId)) {
      window.history.back();
    } else {
      if (selectedStudent) setSelectedStudent(null);
      else if (selectedClass) setSelectedClass(null);
      else if (selectedYear) setSelectedYear(null);
      setSearchTerm('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bento-card p-6">
        <div>
          <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">হায়ারার্কি ভিউ</p>
          <h2 className="text-2xl font-black flex items-center gap-3">
             {showSearchResults ? 'সার্চ রেজাল্ট' : 'শিক্ষার্থী ব্যবস্থাপনা'}
          </h2>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-light group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="নাম, মোবাইল, আইডি বা জামাত লিখে সার্চ..."
            className="w-full pl-14 pr-6 py-4 bg-step-bg border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value !== '') {
                setSelectedClass(null);
                setSelectedYear(null);
              }
            }}
          />
        </div>
      </div>

      {/* Navigation Breadcrumb-like Back Button */}
      {(selectedYear || selectedClass || selectedStudent || searchTerm !== '') && (
        <button 
          onClick={resetSelection}
          className="flex items-center gap-2 px-6 py-2 bg-card border border-border-main rounded-full text-xs font-black uppercase tracking-wider text-text-light hover:text-primary transition-all shadow-sm"
        >
          <ArrowLeft size={16} /> পিছনে যান
        </button>
      )}

      <AnimatePresence mode="wait">
        {showSearchResults ? (
          // Global Search Results View
          <motion.div 
            key="search-results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bento-card overflow-hidden"
          >
             <div className="p-5 sm:p-8 border-b border-border-main flex justify-between items-center font-hind-siliguri">
                <h3 className="text-lg sm:text-xl font-black text-text-main">অনুসন্ধানের ফলাফল ({enToBnNumber(filteredStudents.length.toString())})</h3>
             </div>
             {/* Mobile View for Search Results */}
             <div className="md:hidden p-4 space-y-3 bg-step-bg/15 font-hind-siliguri">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s, idx) => (
                    <div 
                      key={`${s['রেজিস্ট্রেশন/আইডি নম্বর']}-${idx}`}
                      className="p-4 sm:p-5 bg-card border border-border-main/70 rounded-2xl shadow-sm active:scale-[0.98] active:bg-primary/5 active:border-primary/20 transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden text-left font-hind-siliguri"
                      onClick={() => setSelectedStudent(s)}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                          <p className="font-black text-primary text-[11px] sm:text-xs">
                            আইডি: {enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || '')}
                          </p>
                        </div>
                        <span className="text-[9px] font-black bg-success/15 text-success border border-success/20 px-2.5 py-1 rounded-full uppercase leading-none">
                          {s['জামাত'] || s['জামাত/শ্রেণী'] || s['শ্রেণী']}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary/70 border border-primary/10 font-bold text-xs flex items-center justify-center shrink-0">
                          {s['शिक्षার্থীর নাম']?.trim().charAt(0) || 'ছা'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-sm text-text-main leading-snug truncate">
                            {s['শিক্ষার্থীর নাম']}
                          </h4>
                          <p className="text-[11px] text-text-light/60 mt-0.5 truncate">
                            পিতা: {s['পিতার নাম'] || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-border-main/45">
                        <span className="text-[10px] font-black text-text-light/45 uppercase tracking-wider">
                          {s.academicYearLabel}
                        </span>
                        <div className="flex items-center gap-1 text-[9.5px] font-black text-primary uppercase tracking-wide">
                          প্রোফাইল দেখুন 
                          <ChevronRight size={12} className="stroke-[2.5]" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-16 text-center bento-card select-none">
                     <AlertCircle size={32} className="text-text-light/20 mx-auto mb-2" />
                     <p className="text-xs font-black text-text-light/40 uppercase tracking-wider">কোনো ফলাফল পাওয়া যায়নি</p>
                  </div>
                )}
             </div>

             <div className="hidden md:block overflow-x-auto border border-border-main rounded-2xl">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-primary text-white border-b border-border-main/50">
                    <tr>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/95">আইডি/শিক্ষাবর্ষ</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/95">নাম/জামাত</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/95">পিতার নাম</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right pr-10 text-white/95">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main/40">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((s, idx) => (
                        <tr 
                          key={`${s['রেজিস্ট্রেশন/আইডি নম্বর']}-${idx}`} 
                          className="even:bg-primary/[0.02] hover:bg-primary/[0.06] transition-colors cursor-pointer"
                          onClick={() => setSelectedStudent(s)}
                        >
                          <td className="p-6">
                            <p className="font-black text-primary">{enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || '')}</p>
                            <p className="text-[9px] font-black text-text-light/40 uppercase tracking-widest mt-1">{s.academicYearLabel}</p>
                          </td>
                          <td className="p-6">
                            <p className="font-bold">{s['শিক্ষার্থীর নাম']}</p>
                            <p className="text-[10px] font-bold text-success mt-1">{s['জামাত'] || s['জামাত/শ্রেণী'] || s['শ্রেণী']}</p>
                          </td>
                          <td className="p-6 text-text-light font-medium">{s['পিতার নাম']}</td>
                          <td className="p-6 text-right pr-8">
                            <button className="px-4 py-2 bg-text-main text-white rounded-xl font-black text-[10px] uppercase tracking-widest">
                               প্রোফাইল দেখুন
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-32 text-center text-text-light/30 italic">কোন তথ্য খুঁজে পাওয়া যায়নি।</td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </motion.div>
        ) : !selectedYear ? (
          // Year Selection Grid
          <motion.div 
            key="years"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {yearsWithCounts.map((y) => (
              <button
                key={y.year}
                onClick={() => setSelectedYear(y.year)}
                className="group bento-card p-8 text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-500" />
                
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-primary/10 p-4 rounded-3xl text-primary ring-1 ring-primary/20">
                    <Calendar size={28} />
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase">
                    {enToBnNumber(y.count.toString())} জন শিক্ষার্থী
                  </span>
                </div>
                <h3 className="text-2xl font-black text-text-main group-hover:text-primary transition-colors uppercase tracking-tight">
                  {y.year === "১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী" ? `${y.year} (চলমান শিক্ষাবর্ষ)` : y.year}
                </h3>
                <div className="mt-8 flex items-center text-[10px] font-black text-text-light uppercase tracking-[0.2em] group-hover:text-primary transition-all">
                  জামাত সমূহ দেখুন
                </div>
              </button>
            ))}
          </motion.div>
        ) : !selectedClass ? (
          // Class Selection & Secretariat/Serial View
          <motion.div 
            key="classes"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bento-card p-5 sm:p-8"
          >
            {/* View Mode Tabs Selector */}
            <div className="flex border-b border-border-main/50 mb-6 gap-6 font-hind-siliguri">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn(
                  "pb-3 text-sm font-black transition-all border-b-2 px-1 cursor-pointer",
                  viewMode === 'grid' 
                    ? "border-primary text-primary" 
                    : "border-transparent text-text-light/70 hover:text-text-main"
                )}
              >
                জামাত ভিত্তিক গ্রিড ভিউ
              </button>
              <button 
                onClick={() => setViewMode('secretariat')}
                className={cn(
                  "pb-3 text-sm font-black transition-all border-b-2 px-1 cursor-pointer",
                  viewMode === 'secretariat' 
                    ? "border-primary text-primary" 
                    : "border-transparent text-text-light/70 hover:text-text-main"
                )}
              >
                সেক্রেটারিয়েট ভিউ (সিরিয়াল ভিত্তিক)
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <div>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {viewMode === 'grid' ? "জামাত নির্বাচন" : "সেক্রেটারিয়েট ওভারভিউ"}
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-2 text-text-main leading-tight font-hind-siliguri">
                  {selectedYear} {selectedYear === "১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী" && "(চলমান শিক্ষাবর্ষ)"}
                </h3>
              </div>
            </div>

            {/* Unified Student Report & Export Hub Card */}
            <div className="bento-card p-5 sm:p-6 bg-gradient-to-r from-emerald-500/[0.01] to-teal-500/[0.01] border border-emerald-500/10 rounded-2xl mb-6 font-hind-siliguri">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 shrink-0">
                  <Printer size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-text-main leading-tight">রিপোর্ট প্রিন্ট ও এক্সপোর্ট হাব</h4>
                  <p className="text-[10px] text-text-light/60 font-bold mt-0.5">সব জামাত বা সিরিয়াল ভিত্তিক রিপোর্ট ডাউনলোড ও প্রিন্ট করুন</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {/* Option 1: Jamat-wise list sequential */}
                <div className="p-4 bg-card border border-border-main/50 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">রানিং হায়ারার্কি</span>
                    <h5 className="font-extrabold text-xs text-text-main mt-1.5">সকল জামাত ভিত্তিক তালিকা</h5>
                    <p className="text-[10.5px] text-text-light/60 mt-1">সব জামাতের শিক্ষার্থী গ্রুপ অনুযায়ী পেইজ বাই পেইজ প্রিন্ট হবে</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => printStudents('all-jamat-wise')}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Printer size={12} /> প্রিন্ট / PDF
                    </button>
                    <button 
                      onClick={() => exportStudentsExcel('all-jamat-wise')}
                      className="py-2 px-2.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-600 border border-indigo-500/20 text-[10px] font-black rounded-lg transition-all cursor-pointer"
                      title="এক্সেল ডাউনলোড"
                    >
                      <FileSpreadsheet size={12} />
                    </button>
                  </div>
                </div>

                {/* Option 2: Running serial list flat */}
                <div className="p-4 bg-card border border-border-main/50 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">সিরিয়াল ভিত্তিক</span>
                    <h5 className="font-extrabold text-xs text-text-main mt-1.5">চলমান সকল শিক্ষার্থী তালিকা</h5>
                    <p className="text-[10.5px] text-text-light/60 mt-1">সকল জামাতের সকল ছাত্রকে একসাথে রানিং সিরিয়ালে প্রিন্ট করুন</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => printStudents('flat-serial')}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Printer size={12} /> প্রিন্ট / PDF
                    </button>
                    <button 
                      onClick={() => exportStudentsExcel('flat-serial')}
                      className="py-2 px-2.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-600 border border-indigo-500/20 text-[10px] font-black rounded-lg transition-all cursor-pointer"
                      title="এক্সেল ডাউনলোড"
                    >
                      <FileSpreadsheet size={12} />
                    </button>
                  </div>
                </div>

                {/* Option 3: Quick class print select */}
                <div className="p-4 bg-card border border-border-main/50 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black bg-purple-500/10 text-purple-600 border border-purple-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">জামাত ভিত্তিক প্রিন্ট</span>
                    <h5 className="font-extrabold text-xs text-text-main mt-1.5">নির্দিষ্ট জামাত প্রিন্ট ও এক্সপোর্ট</h5>
                    <p className="text-[10.5px] text-text-light/60 mt-1">যেকোনো একটি জামাত সিলেক্ট করে সরাসরি প্রিন্ট বা এক্সেল করুন</p>
                  </div>
                  <div className="flex gap-1 mt-4">
                    <select 
                      className="flex-1 text-[10px] font-bold border border-border-main/50 rounded-lg px-2 py-1.5 bg-step-bg text-text-main outline-none max-w-[120px]"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          printStudents('single-jamat', val);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>প্রিন্ট জামাত...</option>
                      {JAMAT_LIST.map(j => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                    <select 
                      className="flex-1 text-[10px] font-bold border border-border-main/50 rounded-lg px-2 py-1.5 bg-step-bg text-text-main outline-none max-w-[120px]"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          exportStudentsExcel('single-jamat', val);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>এক্সেল জামাত...</option>
                      {JAMAT_LIST.map(j => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {viewMode === 'grid' ? (
              // JAMAT GRID VIEW (As it was)
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 font-hind-siliguri">
                {JAMAT_LIST.map((cls) => {
                  const count = students.filter(s => {
                    const matchYear = !selectedYear || s.academicYearLabel?.trim() === selectedYear?.trim();
                    return matchYear && isClassMatch(s, cls);
                  }).length;
                  const isActive = count > 0;
                  return (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={cn(
                        "flex justify-between items-center p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all group cursor-pointer active:scale-98 text-left",
                        isActive 
                          ? "bg-emerald-500/[0.02] border-emerald-500/10 hover:border-emerald-500/30 hover:bg-white" 
                          : "bg-step-bg/40 opacity-75 border-border-main/50 hover:border-rose-300 hover:bg-rose-500/[0.02]"
                      )}
                    >
                      <div>
                        <span className={cn(
                          "font-black text-sm transition-colors",
                          isActive ? "text-text-main group-hover:text-emerald-600" : "text-text-light/80 group-hover:text-rose-600"
                        )}>
                          {cls}
                        </span>
                        <p className={cn(
                          "text-[10px] font-black mt-1",
                          isActive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                        )}>
                          {isActive ? "সক্রিয় জামাত" : "নিষ্ক্রিয় বা শিক্ষার্থী নেই"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span 
                          style={{ backgroundColor: isActive ? "#ffffff" : "#ffe5e5" }}
                          className={cn(
                            "text-xs font-black shadow-sm border px-2.5 py-1 rounded-xl transition-colors",
                            isActive ? "text-emerald-700 border-emerald-500/20" : "text-rose-700 border-rose-500/20"
                          )}
                        >
                          {enToBnNumber(count.toString())}
                        </span>
                        <ChevronRight size={16} className={cn(
                          "transition-all stroke-[2.2]",
                          isActive ? "text-emerald-500/40 group-hover:text-emerald-600" : "text-text-light/30 group-hover:text-rose-600"
                        )} />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              // SECRETARIAT VIEW (Serial list per class with hide/show collapse control)
              <div className="space-y-4 font-hind-siliguri">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-step-bg/40 border border-border-main/40 rounded-2xl mb-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={expandAllJamats}
                      className="px-3.5 py-2 bg-primary/10 hover:bg-primary hover:text-white border border-primary/20 text-primary text-xs font-black rounded-xl transition-all cursor-pointer"
                    >
                      সবগুলো জামাত খুলুন
                    </button>
                    <button 
                      onClick={collapseAllJamats}
                      className="px-3.5 py-2 bg-text-main/10 hover:bg-text-main hover:text-white border border-text-main/20 text-text-main text-xs font-black rounded-xl transition-all cursor-pointer"
                    >
                      সবগুলো জামাত বন্ধ করুন
                    </button>
                  </div>
                  <p className="text-xs text-text-light/70 font-bold">জামাতের নামের ডানে তীর চিহ্নে ক্লিক করে শিক্ষার্থী হাইড/ওপেন করা যাবে।</p>
                </div>

                <div className="space-y-3.5">
                  {JAMAT_LIST.map((cls) => {
                    const jamatStudents = students.filter(s => {
                      const matchYear = !selectedYear || s.academicYearLabel?.trim() === selectedYear?.trim();
                      return matchYear && isClassMatch(s, cls);
                    });

                    if (jamatStudents.length === 0) return null;

                    const isCollapsed = collapsedJamats.includes(cls);

                    return (
                      <div key={cls} className="bg-card border border-border-main/50 rounded-2xl overflow-hidden shadow-sm">
                        {/* Jamat Section Header Row */}
                        <div 
                          onClick={() => toggleJamatCollapse(cls)}
                          className="flex items-center justify-between p-4 bg-step-bg/30 hover:bg-step-bg/60 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="font-black text-sm sm:text-base text-text-main">{cls}</span>
                            <span className="text-[11px] font-black bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">
                              {enToBnNumber(jamatStudents.length.toString())} জন শিক্ষার্থী
                            </span>
                          </div>
                          <div className="flex items-center gap-3.5">
                            <button 
                              onClick={(e) => { e.stopPropagation(); printStudents('single-jamat', cls); }}
                              className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                              title="প্রিন্ট করুন"
                            >
                              <Printer size={15} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); exportStudentsExcel('single-jamat', cls); }}
                              className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="এক্সেল ডাউনলোড"
                            >
                              <FileSpreadsheet size={15} />
                            </button>
                            {isCollapsed ? (
                              <ChevronDown size={18} className="text-text-light/50 stroke-[2.5]" />
                            ) : (
                              <ChevronUp size={18} className="text-text-light/50 stroke-[2.5]" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible student body */}
                        {!isCollapsed && (
                          <div className="border-t border-border-main/30 p-4">
                            {/* Mobile List Card Deck */}
                            <div className="block md:hidden space-y-3">
                              {jamatStudents.map((s, idx) => (
                                <div 
                                  key={s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || idx}
                                  onClick={() => setSelectedStudent(s)}
                                  className="p-4 bg-step-bg/20 border border-border-main/30 rounded-xl flex items-center justify-between cursor-pointer hover:bg-primary/[0.02]"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="font-extrabold text-sm text-text-main truncate">{s['शिक्षার্থীর নাম']}</p>
                                    <p className="text-[11px] text-text-light/60 mt-1 font-bold">
                                      ক্রমিক: {enToBnNumber((idx + 1).toString())} | আইডি: {enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '')} | রোল: {enToBnNumber(s['রোল নম্বর'] || '')}
                                    </p>
                                  </div>
                                  <ChevronRight size={16} className="text-primary/75 shrink-0" />
                                </div>
                              ))}
                            </div>

                            {/* Desktop Responsive Table */}
                            <div className="hidden md:block overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-step-bg/30 text-text-light font-black border-b border-border-main/30">
                                    <th className="p-2.5 text-center w-12 text-text-light/80">ক্রমিক</th>
                                    <th className="p-2.5 text-text-light/80">আইডি নম্বর</th>
                                    <th className="p-2.5 text-text-light/80">রোল নম্বর</th>
                                    <th className="p-2.5 text-text-light/80">শিক্ষার্থীর নাম</th>
                                    <th className="p-2.5 text-text-light/80">পিতার নাম</th>
                                    <th className="p-2.5 text-text-light/80">অভিভাবকের মোবাইল</th>
                                    <th className="p-2.5 text-right pr-6 text-text-light/80">অ্যাকশন</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border-main/20">
                                  {jamatStudents.map((s, idx) => (
                                    <tr 
                                      key={s.id || s['রেজিস্ট্রেশন/আইডি নম্বর'] || idx}
                                      onClick={() => setSelectedStudent(s)}
                                      className="hover:bg-primary/[0.02] cursor-pointer transition-colors"
                                    >
                                      <td className="p-3 text-center font-bold text-text-light/80">{enToBnNumber((idx + 1).toString())}</td>
                                      <td className="p-3 font-bold text-primary">{enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '')}</td>
                                      <td className="p-3 font-bold">{enToBnNumber(s['রোল নম্বর'] || '')}</td>
                                      <td className="p-3 font-extrabold text-text-main">{s['শিক্ষার্থীর নাম']}</td>
                                      <td className="p-3 text-text-light font-medium">{s['পিতার নাম']}</td>
                                      <td className="p-3 font-mono text-text-light/80">{enToBnNumber(s['অভিভাবকের মোবাইল'] || s['মোবাইল (মা)'] || '—')}</td>
                                      <td className="p-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                        <StudentActionButtons 
                                          student={s}
                                          onView={() => setSelectedStudent(s)}
                                          showEdit={false}
                                          showDelete={false}
                                          size="sm"
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        ) : !selectedStudent ? (
          // Student Table View
          <motion.div 
            key="student-list"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bento-card overflow-hidden"
          >
            <div className="p-5 sm:p-8 border-b border-border-main flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 font-hind-siliguri">
               <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">
                    {selectedYear} {selectedYear === "১৪৪৭-৪৮ হিজরী/২০২৬-২৭ ঈসায়ী" && "(চলমান শিক্ষাবর্ষ)"}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-black text-text-main leading-tight">{selectedClass}</h3>
               </div>
               
               {/* Export/Print Controls */}
               <div className="flex flex-wrap gap-2">
                 <button onClick={() => exportStudentsExcel('single-jamat')} className="px-4 py-2 bg-indigo-500/10 text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-500/20 flex items-center gap-2 uppercase tracking-wider cursor-pointer">
                    <FileSpreadsheet size={14} /> এক্সেল ডাউনলোড
                 </button>
                 <button onClick={() => printStudents('single-jamat')} className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black border border-emerald-500/20 flex items-center gap-2 uppercase tracking-wider cursor-pointer">
                    <Printer size={14} /> প্রিন্ট / PDF
                 </button>
               </div>
            </div>
            
            {/* Mobile View for class students */}
            <div className="md:hidden p-4 space-y-3 bg-step-bg/15 font-hind-siliguri">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <div 
                      key={s['রেজিস্ট্রেশন/আইডি নম্বর']} 
                      className="p-4 sm:p-5 bg-card border border-border-main/70 rounded-2xl shadow-sm active:scale-[0.98] active:bg-primary/5 active:border-primary/20 transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden text-left font-hind-siliguri"
                      onClick={() => setSelectedStudent(s)}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-primary/10 text-primary border border-primary/15 px-3 py-1 rounded-xl text-xs font-black">
                          রোল No: {enToBnNumber(s['রোল নম্বর']?.toString() || '')}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
                          <span className="font-extrabold text-text-light text-[11px]">
                            আইডি: {enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || '')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary/70 border border-primary/10 font-bold text-xs flex items-center justify-center shrink-0">
                          {s['শিক্ষার্থীর নাম']?.trim().charAt(0) || 'ছা'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-sm text-text-main leading-snug truncate">
                            {s['শিক্ষার্থীর নাম']}
                          </h4>
                          <p className="text-[11px] text-text-light/60 mt-0.5 truncate">
                            পিতা: {s['পিতার নাম'] || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end items-center mt-3 pt-2.5 border-t border-border-main/45">
                        <div className="flex items-center gap-1 text-[9.5px] font-black text-primary uppercase tracking-wide">
                          প্রোফাইল দেখুন 
                          <ChevronRight size={12} className="stroke-[2.5]" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-16 text-center bento-card select-none">
                     <AlertCircle size={32} className="text-text-light/20 mx-auto mb-2" />
                     <p className="text-xs font-black text-text-light/40 uppercase tracking-wider">কোনো তথ্য পাওয়া যায়নি</p>
                  </div>
                )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 p-4 font-hind-siliguri">
                  <button onClick={() => exportStudentsExcel('single-jamat')} className="px-4 py-2 bg-indigo-500/10 text-indigo-600 rounded-xl text-xs font-black border border-indigo-500/20 flex items-center gap-2 cursor-pointer">
                    <FileSpreadsheet size={16} /> এক্সেল ডাউনলোড
                  </button>
                  <button onClick={() => printStudents('single-jamat')} className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-black border border-emerald-500/20 flex items-center gap-2 cursor-pointer">
                    <Printer size={16} /> প্রিন্ট / PDF
                  </button>
            </div>

            <div className="hidden md:block overflow-x-auto border border-border-main rounded-2xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-primary text-white border-b border-border-main/50">
                  <tr>
                    <th className="p-4 w-12 text-center">
                        <input type="checkbox" checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0} onChange={toggleAll} className="accent-primary" />
                    </th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/95">আইডি নম্বর</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/95">সম্পূর্ণ নাম</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/95">পিতার নাম</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/95">রোল</th>
                    <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest pr-10 text-white/95">বিস্তারিত</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/40">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <tr 
                        key={s['রেজিস্ট্রেশন/আইডি নম্বর']} 
                        className={cn("even:bg-primary/[0.02] hover:bg-primary/[0.06] transition-colors cursor-pointer group animate-in fade-in slide-in-from-left-4 duration-300", selectedStudents.includes((s['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || s.id || '')) ? "bg-primary/5" : "")}
                        onClick={() => setSelectedStudent(s)}
                      >
                        <td className="p-4 text-center">
                            <input type="checkbox" checked={selectedStudents.includes((s['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || s.id || ''))} onChange={(e) => { e.stopPropagation(); toggleStudent((s['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || s.id || '')) }} className="accent-primary" />
                        </td>
                        <td className="p-6 font-black text-primary">{enToBnNumber(s['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || '')}</td>
                        <td className="p-6 font-bold">{s['শিক্ষার্থীর নাম']}</td>
                        <td className="p-6 text-text-light font-medium">{s['পিতার নাম']}</td>
                        <td className="p-6 font-black bg-step-bg text-center w-16">{enToBnNumber(s['রোল নম্বর']?.toString() || '')}</td>
                        <td className="p-6 text-right pr-8" onClick={(e) => e.stopPropagation()}>
                          <StudentActionButtons 
                            student={s}
                            onView={() => setSelectedStudent(s)}
                            showEdit={false}
                            showDelete={false}
                            size="sm"
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-32 text-center">
                        <div className="flex flex-col items-center gap-4 grayscale opacity-20">
                          <Search size={48} />
                          <p className="font-black uppercase tracking-widest text-xs">কোন তথ্য পাওয়া যায়নি</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          // Student Detail View - Modern Visual Mobile-Friendly Interactive Card Deck
          <motion.div 
            key="student-detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8"
          >
            {/* Mobile View (Shown only on mobile screens when not editing) */}
            {!isEditing && (
              <div className="block lg:hidden w-full">
                <StudentMobileProfile
                  student={selectedStudent}
                  selectedClass={selectedClass || '—'}
                  onStartEdit={handleStartEdit}
                  onBack={resetSelection}
                  printProfile={printProfile}
                  handleShare={handleShare}
                />
              </div>
            )}

            {/* Left Column: Premium Identity Crest (Desktop Only) */}
            <div className="hidden lg:flex lg:flex-col lg:col-span-4 bento-card p-4 sm:p-6 lg:p-8 items-center text-center gap-5 sm:gap-6 relative overflow-hidden border border-border-main/60 bg-card shadow-xl rounded-2xl sm:rounded-[2.5rem]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-12 -mt-12 blur-3xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-light/5 rounded-full -ml-8 -mb-8 blur-2xl" />
              
              <div className="flex flex-row lg:flex-col items-center gap-4 sm:gap-6 w-full">
                {/* Identity Crest Frame with subtle glow */}
                <div className="relative group shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary-light rounded-[1.3rem] sm:rounded-[2.2rem] blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                  <div className="relative w-16 h-16 sm:w-28 sm:h-28 rounded-[1.1rem] sm:rounded-[2rem] bg-gradient-to-tr from-primary/10 to-primary/5 p-1 ring-4 ring-bg shadow-xl flex items-center justify-center">
                    <div className="w-full h-full rounded-[0.95rem] sm:rounded-[1.8rem] bg-card flex items-center justify-center text-primary border border-primary/20">
                      <User className="size-8 sm:size-14 text-primary/90" />
                    </div>
                  </div>
                  {/* Active/Status Indicator */}
                  <div className="absolute -bottom-1 -right-1 bg-success text-white p-1 sm:p-1.5 rounded-full ring-4 ring-card shadow-md flex items-center justify-center">
                    <CheckCircle2 className="size-2.5 sm:size-3.5" />
                  </div>
                </div>

                <div className="flex flex-col items-start lg:items-center min-w-0 flex-1 font-hind-siliguri">
                  <h3 className="text-base sm:text-2xl font-black text-text-main mb-1 sm:mb-2 tracking-tight leading-tight block truncate w-full text-left lg:text-center">
                    {selectedStudent['শিক্ষার্থীর নাম'] || selectedStudent.name || '—'}
                  </h3>
                  
                  <p className="text-xs font-bold text-text-light/60 flex items-center gap-1.5 justify-start lg:justify-center">
                    <GraduationCap size={14} className="text-primary shrink-0" />
                    <span className="truncate">{selectedClass}</span>
                  </p>

                  {/* Inline Highlights Badge on Mobile: saves huge vertical space */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 lg:hidden">
                    <span className="px-2.5 py-1 bg-primary/5 border border-primary/10 rounded-lg text-[10px] font-black text-primary">
                      রোল: {enToBnNumber(selectedStudent['রোল নম্বর']?.toString() || selectedStudent.roll?.toString() || '—')}
                    </span>
                    <span className="px-2.5 py-1 bg-[#0D6582]/10 text-[#0D6582] border border-[#0D6582]/15 rounded-lg text-[10px] font-black">
                      ID: {enToBnNumber(selectedStudent['রেজিস্ট্রেশন/আইডি']?.toString() || selectedStudent['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || selectedStudent.id?.toString() || '—')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop-only highlights badges */}
              <div className="hidden lg:flex flex-wrap justify-center gap-2 mb-8 w-full border-t border-b border-border-main/50 py-4 font-hind-siliguri">
                <div className="px-3.5 py-2 bg-primary/5 border border-primary/10 rounded-2xl flex flex-col items-center min-w-[70px] flex-1">
                  <span className="text-[8px] uppercase font-black text-primary/60 tracking-wider mb-0.5">রোল নম্বর</span>
                  <span className="text-xs sm:text-sm font-black text-primary">
                    {enToBnNumber(selectedStudent['রোল নম্বর']?.toString() || selectedStudent.roll?.toString() || '—')}
                  </span>
                </div>
                <div 
                  onClick={async () => {
                    const val = selectedStudent['রেজিস্ট্রেশন/আইডি']?.toString() || selectedStudent['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || selectedStudent.id?.toString() || '';
                    if (!val) return;
                    try {
                      await navigator.clipboard.writeText(val);
                      setLeftRegCopied(true);
                      setTimeout(() => setLeftRegCopied(false), 2000);
                    } catch (err) {
                      console.error('Failed to copy registration: ', err);
                    }
                  }}
                  className={cn(
                    "px-3.5 py-2 border rounded-2xl flex flex-col items-center min-w-[70px] flex-1 cursor-pointer transition-all duration-300 relative group/reg select-none",
                    leftRegCopied 
                      ? "bg-success/15 border-success/35 text-success shadow-sm" 
                      : "bg-text-main/5 border-text-main/10 hover:border-primary/30 hover:bg-primary/5 text-text-main"
                  )}
                  title="কপি করতে ক্লিক করুন"
                >
                  <span className={cn(
                    "text-[8px] uppercase font-black tracking-wider mb-0.5 transition-colors",
                    leftRegCopied ? "text-success" : "text-text-main/60"
                  )}>
                    {leftRegCopied ? "কপি হয়েছে!" : "রেজিস্ট্রেশন"}
                  </span>
                  <span className="text-xs sm:text-sm font-black">
                    {enToBnNumber(selectedStudent['রেজিস্ট্রেশন/আইডি']?.toString() || selectedStudent['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || selectedStudent.id?.toString() || '—')}
                  </span>
                </div>
              </div>
              
              {/* Quick Communication Box */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 font-hind-siliguri">
                <div className="flex items-center gap-3 p-3.5 bg-step-bg border border-border-main rounded-2xl text-left hover:border-primary/20 transition-all group relative">
                  <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <Phone size={16} />
                  </div>
                  <div className="min-w-0 flex-1 pr-12">
                    <p className="text-[7.5px] uppercase font-black text-text-light/50 tracking-widest mb-0.5 leading-none">মোবাইল (মা)</p>
                    <a href={`tel:${selectedStudent['মোবাইল (মা)'] || selectedStudent.mobile}`} className="text-xs sm:text-sm font-bold text-text-main hover:text-primary transition-colors block truncate mt-1">
                      {enToBnNumber(selectedStudent['মোবাইল (মা)']?.toString() || selectedStudent.mobile?.toString() || '—')}
                    </a>
                  </div>
                  {/* Copy button */}
                  {(selectedStudent['মোবাইল (মা)'] || selectedStudent.mobile) && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const val = selectedStudent['মোবাইল (মা)']?.toString() || selectedStudent.mobile?.toString() || '';
                        try {
                          await navigator.clipboard.writeText(val);
                          setLeftMobileCopied(true);
                          setTimeout(() => setLeftMobileCopied(false), 2000);
                        } catch (err) {}
                      }}
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-sm cursor-pointer border border-transparent",
                        leftMobileCopied 
                          ? "bg-success text-white scale-105" 
                          : "bg-primary/5 hover:bg-primary text-primary hover:text-white"
                      )}
                      title="মোবাইল নম্বর কপি করুন"
                    >
                      {leftMobileCopied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-step-bg border border-border-main rounded-2xl text-left hover:border-primary/20 transition-all">
                  <div className="w-9 h-9 bg-text-main/10 text-text-main rounded-xl flex items-center justify-center shrink-0">
                    <Users size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7.5px] uppercase font-black text-text-light/50 tracking-widest mb-0.5 leading-none">পিতা অভিভাবক</p>
                    <p className="text-xs sm:text-sm font-bold text-text-main truncate mt-1">
                      {selectedStudent['পিতার নাম'] || selectedStudent.fatherName || '—'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="w-full mt-4">
                <p className="text-[10px] font-black uppercase text-text-light/50 tracking-widest flex items-center gap-1 mb-3 justify-center lg:justify-start">
                  <span className="w-full text-center lg:text-left border-b border-border-main/50 pb-2">কুইক অ্যাকশনস ও মডিউলস</span>
                </p>
                <StudentQuickActions student={selectedStudent} printProfile={printProfile} handleShare={handleShare} />
              </div>
            </div>

            {/* Right Column: Tabbed Detailed Card Section */}
            <div className={cn("bento-card p-4 sm:p-6 lg:p-8 flex flex-col relative overflow-hidden bg-card shadow-xl border border-border-main/60", !isEditing ? "hidden lg:flex lg:col-span-8 rounded-[1.8rem] sm:rounded-[2.5rem]" : "w-full rounded-[1.8rem] sm:rounded-[2.5rem] lg:col-span-8")}>
              {/* Header inside right Column */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-main/50 pb-5 mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-text-main tracking-tight">শিক্ষার্থী সবিস্তার প্রোফাইল</h3>
                  <p className="text-[10px] text-text-light/50 font-black uppercase tracking-wider mt-0.5">Comprehensive Digital Identity Record</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <button 
                      type="button"
                      onClick={handleStartEdit}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#0D6582]/10 text-[#0D6582] border border-[#0D6582]/20 hover:bg-[#0D6582] hover:text-white rounded-lg text-[10px] font-black transition-all cursor-pointer"
                      title="শিক্ষার্থীর তথ্য সংশোধন করুন"
                    >
                      <Edit size={12} /> তথ্য সংশোধন
                    </button>
                  )}
                  <span className="bg-success/15 text-success border border-success/20 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">
                    অধ্যয়নরত (সক্রিয়)
                  </span>
                </div>
              </div>

              {!isEditing ? (
                <>
                  {/* Sliding Horizontal Profile Tabs Navigation - Mobile Friendly Touch target */}
                  <div className="flex overflow-x-auto md:flex-wrap pb-2 mb-6 gap-2 shrink-0 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 select-none">
                <button
                  type="button"
                  onClick={() => setProfileTab('basic')}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4.5 py-3 rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all border cursor-pointer whitespace-nowrap shrink-0",
                    profileTab === 'basic' 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/25" 
                      : "bg-step-bg text-text-light/80 border-border-main/60 hover:bg-[#EEF2F5]"
                  )}
                >
                  <User size={14} /><span>প্রাথমিক তথ্য</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab('academic')}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4.5 py-3 rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all border cursor-pointer whitespace-nowrap shrink-0",
                    profileTab === 'academic' 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/25" 
                      : "bg-step-bg text-text-light/80 border-border-main/60 hover:bg-[#EEF2F5]"
                  )}
                >
                  <GraduationCap size={14} /><span>একাডেমিক রেকর্ড</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab('contact')}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4.5 py-3 rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all border cursor-pointer whitespace-nowrap shrink-0",
                    profileTab === 'contact' 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/25" 
                      : "bg-step-bg text-text-light/80 border-border-main/60 hover:bg-[#EEF2F5]"
                  )}
                >
                  <Phone size={14} /><span>যোগাযোগ ও ঠিকানা</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab('digital')}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4.5 py-3 rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all border cursor-pointer whitespace-nowrap shrink-0",
                    profileTab === 'digital' 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/25" 
                      : "bg-step-bg text-text-light/80 border-border-main/60 hover:bg-[#EEF2F5]"
                  )}
                >
                  <QrCode size={14} /><span>ডিজিটাল ও ভেরিফিকেশন</span>
                </button>
              </div>

              {/* Tab Contents Panels with responsive grid lists */}
              <div className="flex-1 min-h-[280px]">
                <AnimatePresence mode="wait">
                  {profileTab === 'basic' && (
                    <motion.div
                      key="basic-panel"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                    >
                      <DetailCardItem icon={<User />} label="শিক্ষার্থীর নাম" value={selectedStudent['শিক্ষার্থীর নাম'] || selectedStudent.name} />
                      <DetailCardItem icon={<IdCard />} label="রেজিস্ট্রেশন/আইডি" value={enToBnNumber(selectedStudent['রেজিস্ট্রেশন/আইডি']?.toString() || selectedStudent['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || selectedStudent.id?.toString() || '')} copyValue={selectedStudent['রেজিস্ট্রেশন/আইডি']?.toString() || selectedStudent['রেজিস্ট্রেশন/আইডি নম্বর']?.toString() || selectedStudent.id?.toString() || ''} />
                      <DetailCardItem icon={<Users />} label="পিতার নাম" value={selectedStudent['পিতার নাম'] || selectedStudent.fatherName} />
                      <DetailCardItem icon={<Users />} label="মাতার নাম" value={selectedStudent['মাতার নাম'] || selectedStudent.motherName} />
                      <DetailCardItem icon={<Calendar />} label="জন্ম তারিখ" value={enToBnNumber(formatDateToDDMMYYYY(selectedStudent['জন্ম তারিখ'] || selectedStudent.dob || ''))} />
                      <DetailCardItem icon={<IdCard />} label="জন্ম নিবন্ধন নাম্বার" value={enToBnNumber(selectedStudent['জন্ম নিবন্ধন নাম্বার']?.toString() || selectedStudent['জন্ম নিবন্ধন/NID নং']?.toString() || selectedStudent.birthReg?.toString() || '')} copyValue={selectedStudent['জন্ম নিবন্ধন নাম্বার']?.toString() || selectedStudent['জন্ম নিবন্ধন/NID নং']?.toString() || selectedStudent.birthReg?.toString() || ''} />
                      <DetailCardItem icon={<Heart />} label="রক্তের গ্রুপ" value={selectedStudent['রক্তের গ্রুপ'] || selectedStudent.bloodGroup} />
                      <DetailCardItem icon={<Compass />} label="শিক্ষার্থী ধরণ" value={selectedStudent['শিক্ষার্থী ধরণ'] || selectedStudent.studentType || 'নতুন'} />
                      <DetailCardItem icon={<Shield />} label="শিক্ষার্থী ধরণ/স্ট্যাটাস" value={selectedStudent['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || selectedStudent['স্ট্যাটাস'] || 'সক্রিয়'} highlight />
                    </motion.div>
                  )}

                  {profileTab === 'academic' && (
                    <motion.div
                      key="academic-panel"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                    >
                      <DetailCardItem icon={<Calendar />} label="শিক্ষাবর্ষ" value={selectedStudent['শিক্ষাবর্ষ'] || selectedStudent.academicYearLabel} />
                      <DetailCardItem icon={<Bookmark />} label="জামাত" value={selectedStudent['জামাত'] || selectedStudent.jamat} />
                      <DetailCardItem icon={<Award />} label="মারহালা" value={selectedStudent['মারহালা'] || selectedStudent.marhala} />
                      <DetailCardItem icon={<GraduationCap />} label="জামাত/শ্রেণী" value={selectedStudent['জামাত/শ্রেণী'] || selectedStudent.class} />
                      <DetailCardItem icon={<Award />} label="সমমান" value={selectedStudent['সমমান'] || selectedStudent.somoman || 'সাধারণ'} />
                      <DetailCardItem icon={<Hash />} label="রোল নম্বর" value={enToBnNumber(selectedStudent['রোল নম্বর']?.toString() || selectedStudent.roll?.toString() || '')} highlight />
                      <DetailCardItem icon={<Compass />} label="পূর্বের মাদ্রাসা" value={selectedStudent['পূর্বের মাদ্রাসা'] || selectedStudent.prevMadrasa} />
                      <DetailCardItem icon={<Bookmark />} label="পূর্বের জামাত" value={selectedStudent['পূর্বের জামাত'] || selectedStudent.prevClass} />
                    </motion.div>
                  )}

                  {profileTab === 'contact' && (
                    <motion.div
                      key="contact-panel"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                    >
                      <DetailCardItem icon={<Phone />} label="মোবাইল (মা)" value={enToBnNumber(selectedStudent['মোবাইল (মা)']?.toString() || selectedStudent.mobile?.toString() || '')} copyValue={selectedStudent['মোবাইল (মা)']?.toString() || selectedStudent.mobile?.toString() || ''} isPhone />
                      <DetailCardItem icon={<Phone />} label="মোবাইল (বাবা/ভাই)" value={enToBnNumber(selectedStudent['মোবাইল (বাবা/ভাই)']?.toString() || selectedStudent.altMobile?.toString() || '')} copyValue={selectedStudent['মোবাইল (বাবা/ভাই)']?.toString() || selectedStudent.altMobile?.toString() || ''} isPhone />
                      <DetailCardItem icon={<MessageSquare />} label="মেসেজিং অ্যাপ" value={selectedStudent['মেসেজিং অ্যাপ'] || 'WhatsApp'} />
                      <DetailCardItem icon={<Mail />} label="ইমেইল" value={selectedStudent['ইমেইল'] || selectedStudent.email} copyValue={selectedStudent['ইমেইল'] || selectedStudent.email} isEmail />
                      <div className="sm:col-span-2">
                        <DetailCardItem icon={<MapPin />} label="ঠিকানা" value={selectedStudent['ঠিকানা'] || selectedStudent['গ্রাম/মহল্লা'] || '—'} />
                      </div>
                    </motion.div>
                  )}

                  {profileTab === 'digital' && (() => {
                    const qrImageUrl = (selectedStudent['QR CODE'] && selectedStudent['QR CODE'].toString().startsWith('http')) 
                      ? selectedStudent['QR CODE'] 
                      : (selectedStudent['QR CODE IMAGE'] || '');

                    const longUrl = selectedStudent['LONG URL'] || selectedStudent['long_url'] || selectedStudent['ভেরিফিকেশন লিংক'];
                    const shortUrl = selectedStudent['SORT URL'] || selectedStudent['sort_url'] || selectedStudent['Short URL'];

                    return (
                      <motion.div
                        key="digital-panel"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col gap-6"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <DetailCardItem icon={<Award />} label="প্রত্যয়ন পত্র নাম্বার" value={enToBnNumber(selectedStudent['प्रत्यয়ন পত্র নাম্বার']?.toString() || selectedStudent['प्रत्यয়ন পত্র নাম্বার']?.toString() || selectedStudent['प्रत्ययन পত্র নাম্বার']?.toString() || '')} />
                          <DetailCardItem icon={<Clock />} label="মঞ্জুরের তারিখ ও সময়" value={enToBnNumber(selectedStudent['মঞ্জুরের তারিখ ও সময়']?.toString() || '')} />
                          <DetailCardItem icon={<Hash />} label="আবেদন নং" value={enToBnNumber(selectedStudent['আবেদন নং']?.toString() || '')} />
                          <DetailCardItem 
                            icon={<QrCode />} 
                            label="QR CODE" 
                            value={selectedStudent['QR CODE'] || '—'} 
                            copyValue={selectedStudent['QR CODE'] || ''}
                            isLink={selectedStudent['QR CODE'] && (selectedStudent['QR CODE'].toString().startsWith('http://') || selectedStudent['QR CODE'].toString().startsWith('https://'))}
                          />
                        </div>

                        {/* Barcode/QR Code Rendering block */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-3 pt-5 border-t border-border-main/50 items-center">
                          <div>
                            <p className="text-[10px] font-black uppercase text-text-light/50 tracking-widest mb-3 flex items-center gap-1">
                              <QrCode size={12} className="text-primary" /> ডিজিটাল কিউআর কোড
                            </p>
                            {qrImageUrl ? (
                              <a 
                                href={qrImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-40 h-40 bg-white p-2.5 rounded-[2rem] border border-border-main flex items-center justify-center shadow-lg group hover:rotate-2 hover:scale-105 transition-all duration-300 cursor-pointer block relative overflow-hidden"
                                title="কিউআর কোডটি সরাসরি ওপেন করতে ক্লিক করুন"
                              >
                                <img 
                                  src={qrImageUrl} 
                                  alt="QR Code" 
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                  <ExternalLink size={20} className="text-primary stroke-[3]" />
                                </div>
                              </a>
                            ) : (
                              <div className="w-40 h-40 bg-step-bg rounded-[2rem] border-2 border-dashed border-border-main flex flex-col items-center justify-center p-4 text-center">
                                <QrCode size={28} className="text-text-light/20 mb-2" />
                                <span className="text-[9px] font-bold text-text-light/40 leading-tight">ছবি লিংক পাওয়া যায়নি</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase text-text-light/50 tracking-widest flex items-center gap-1">
                              <Compass size={12} className="text-primary" /> অ্যাক্টিভ যাচাই লিংক সমূহ
                            </p>
                            <div className="flex flex-col gap-2.5">
                              {longUrl && (
                                <div className="flex items-center gap-2">
                                  <a 
                                    href={longUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-between gap-3 p-3 bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                  >
                                    <span className="flex items-center gap-1.5"><FileText size={14} /> ভেরিফিকেশন পোর্টাল</span>
                                    <ExternalLink size={12} />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyLink(longUrl, 'long')}
                                    className={cn(
                                      "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all border shadow-sm cursor-pointer active:scale-90",
                                      copiedType === 'long'
                                        ? "bg-success text-white border-success"
                                        : "bg-primary/5 hover:bg-primary text-primary hover:text-white border-primary/20"
                                    )}
                                    title="লিংক কপি করুন"
                                  >
                                    {copiedType === 'long' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                  </button>
                                </div>
                              )}
                              {shortUrl && (
                                <div className="flex items-center gap-2">
                                  <a 
                                    href={shortUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-between gap-3 p-3 bg-step-bg hover:bg-border-main/20 border border-border-main text-text-main text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                  >
                                    <span className="flex items-center gap-1.5"><Compass size={14} /> শর্ট লিংক (SORT URL)</span>
                                    <ExternalLink size={12} />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyLink(shortUrl, 'short')}
                                    className={cn(
                                      "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all border shadow-sm cursor-pointer active:scale-90",
                                      copiedType === 'short'
                                        ? "bg-success text-white border-success"
                                        : "bg-step-bg hover:bg-border-main/30 border border-border-main/50 text-text-main hover:border-primary/25 hover:text-primary"
                                    )}
                                    title="লিংক কপি করুন"
                                  >
                                    {copiedType === 'short' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <form onSubmit={handleSaveEdit} className="space-y-6 font-hind-siliguri text-left flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 overflow-y-auto max-h-[480px] pr-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-light/60 uppercase">শিক্ষার্থীর নাম *</label>
                  <input 
                    type="text" 
                    required 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:border-[#0D6582]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-light/60 uppercase">রোল নম্বর *</label>
                  <input 
                    type="text" 
                    required 
                    value={editRoll} 
                    onChange={e => setEditRoll(e.target.value)} 
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:border-[#0D6582]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-light/60 uppercase">পিতার নাম</label>
                  <input 
                    type="text" 
                    value={editFather} 
                    onChange={e => setEditFather(e.target.value)} 
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:border-[#0D6582]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-light/60 uppercase">মাতার নাম</label>
                  <input 
                    type="text" 
                    value={editMother} 
                    onChange={e => setEditMother(e.target.value)} 
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:border-[#0D6582]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-light/60 uppercase">মোবাইল (মা)</label>
                  <input 
                    type="text" 
                    value={editMobile} 
                    onChange={e => setEditMobile(e.target.value)} 
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:border-[#0D6582]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-light/60 uppercase">মোবাইল (বাবা/ভাই)</label>
                  <input 
                    type="text" 
                    value={editAltMobile} 
                    onChange={e => setEditAltMobile(e.target.value)} 
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:border-[#0D6582]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-light/60 uppercase">রক্তের গ্রুপ</label>
                  <input 
                    type="text" 
                    value={editBloodGroup} 
                    onChange={e => setEditBloodGroup(e.target.value)} 
                    placeholder="যেমন: A+, B+"
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:border-[#0D6582]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-light/60 uppercase">পূর্বের মাদ্রাসা</label>
                  <input 
                    type="text" 
                    value={editPrevMadrasa} 
                    onChange={e => setEditPrevMadrasa(e.target.value)} 
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:border-[#0D6582]"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-text-light/60 uppercase">ঠিকানা</label>
                  <textarea 
                    value={editAddress} 
                    onChange={e => setEditAddress(e.target.value)} 
                    rows={2}
                    className="w-full p-3 bg-step-bg border border-border-main rounded-xl text-xs font-bold outline-none focus:border-[#0D6582] resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border-main/40 mt-auto">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="px-5 py-2.5 bg-step-bg border border-border-main text-text-main hover:bg-border-main/20 text-xs font-black rounded-xl transition-all cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-[#0D6582] text-white text-xs font-black rounded-xl hover:bg-[#09526b] transition-all cursor-pointer shadow-md shadow-[#0D6582]/15"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          )}

              {/* Verified Badge Footer */}
              <div className="mt-8 pt-5 border-t border-border-main/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[10px] text-text-light/40 font-bold italic leading-relaxed">
                  * এই শিক্ষার্থীর সকল একাডেমিক রেকর্ড ডাটাবেজে সংরক্ষিত ও প্রত্যয়িত আছে।
                </p>
                <button
                  type="button"
                  onClick={resetSelection}
                  className="flex items-center gap-2 px-5 py-2.5 bg-step-bg hover:bg-border-main/30 border border-border-main font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer text-text-main transition-colors"
                >
                  <ArrowLeft size={12} /> তালিকায় ফিরে যান
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-component for individual item card - modern, readable, hover-state
const DetailCardItem = ({ 
  icon, 
  label, 
  value, 
  highlight, 
  copyValue, 
  isPhone, 
  isEmail,
  isLink
}: { 
  icon: React.ReactNode; 
  label: string; 
  value?: any; 
  highlight?: boolean; 
  copyValue?: string;
  isPhone?: boolean;
  isEmail?: boolean;
  isLink?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-step-bg border border-border-main/50 hover:border-primary/20 hover:bg-white hover:shadow-md transition-all group duration-300 min-h-[72px]">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300",
          highlight ? "bg-primary text-white" : "bg-primary/5 text-primary/60 group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          {React.cloneElement(icon as React.ReactElement, { size: 18 })}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase font-black text-text-light/50 tracking-[0.1em] mb-0.5 group-hover:text-primary/70 transition-colors duration-300 leading-none">
            {label}
          </p>
          {isLink && value && (value.toString().startsWith('http://') || value.toString().startsWith('https://')) ? (
            <div className="mt-1">
              <span className="text-[10px] text-text-light/65 font-medium block truncate max-w-[150px]" title={value}>
                {value}
              </span>
            </div>
          ) : (
            <p className={cn(
              "text-xs sm:text-sm font-bold text-text-main leading-snug break-words pr-1.5",
              highlight && "text-primary font-black"
            )}>
              {value || '—'}
            </p>
          )}
        </div>
      </div>

      {(copyValue || isLink) && (
        <div className="flex items-center gap-1.5 shrink-0">
          {isPhone && (
            <a 
              href={`tel:${copyValue}`}
              className="w-10 h-10 rounded-xl bg-success/15 hover:bg-success text-success hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
              title="কল করুন"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone size={14} className="stroke-[2.5]" />
            </a>
          )}
          {isEmail && (
            <a 
              href={`mailto:${copyValue}`}
              className="w-10 h-10 rounded-xl bg-info/15 hover:bg-info text-info hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
              title="ইমেইল পাঠান"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail size={14} className="stroke-[2.5]" />
            </a>
          )}
          {isLink && value && (value.toString().startsWith('http://') || value.toString().startsWith('https://')) && (
            <a 
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
              title="লিংকে প্রবেশ করুন"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} className="stroke-[2.5]" />
            </a>
          )}
          {copyValue && (
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer active:scale-90",
                copied 
                  ? "bg-success text-white scale-102 font-black" 
                  : "bg-primary/10 hover:bg-primary text-primary hover:text-white"
              )}
              title="কপি করুন"
            >
              {copied ? <CheckCircle2 size={14} className="stroke-[2.5]" /> : <Copy size={14} className="stroke-[2.5]" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const AlertCircle = ({ size, className }: { size: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
