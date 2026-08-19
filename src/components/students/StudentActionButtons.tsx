import React, { useState } from 'react';
import { Eye, FileText, FileSpreadsheet, Edit3, Trash2, Download } from 'lucide-react';
import { Student } from '../../types';
import { downloadStudentProfilePDF, downloadStudentsExcel } from '../../utils/studentExportUtils';
import { useData } from '../../contexts/DataContext';
import { cn } from '../../lib/utils';

interface StudentActionButtonsProps {
  student: Student;
  onView?: (student: Student) => void;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  showEdit?: boolean;
  showDelete?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const StudentActionButtons: React.FC<StudentActionButtonsProps> = ({
  student,
  onView,
  onEdit,
  onDelete,
  showEdit = false,
  showDelete = false,
  className = '',
  size = 'md'
}) => {
  const { madrasahBranding } = useData();
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isExcelLoading, setIsExcelLoading] = useState(false);

  const btnPadding = size === 'sm' ? 'p-1.5' : 'p-2';
  const iconSize = size === 'sm' ? 13 : 15;

  const handlePdfDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPdfLoading(true);
    try {
      downloadStudentProfilePDF(student, {
        name: madrasahBranding?.madrasahName,
        address: madrasahBranding?.address,
        phone: madrasahBranding?.phone,
        logoUrl: madrasahBranding?.logoUrl
      });
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setTimeout(() => setIsPdfLoading(false), 800);
    }
  };

  const handleExcelDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExcelLoading(true);
    try {
      const sId = student['রেজিস্ট্রেশন/আইডি নম্বর'] || student.id || 'record';
      downloadStudentsExcel(student, `Student_${sId}`);
    } catch (err) {
      console.error('Excel error:', err);
    } finally {
      setTimeout(() => setIsExcelLoading(false), 500);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      {/* 1. View Profile Button */}
      {onView && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView(student);
          }}
          title="প্রোফাইল দেখুন"
          className={cn(
            btnPadding,
            "bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
          )}
        >
          <Eye size={iconSize} />
        </button>
      )}

      {/* 2. PDF Download Button */}
      <button
        type="button"
        onClick={handlePdfDownload}
        disabled={isPdfLoading}
        title="পিডিএফ প্রোফাইল / জীবনবৃত্তান্ত ডাউনলোড"
        className={cn(
          btnPadding,
          "bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/20 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
        )}
      >
        <FileText size={iconSize} />
      </button>

      {/* 3. Excel Download Button */}
      <button
        type="button"
        onClick={handleExcelDownload}
        disabled={isExcelLoading}
        title="এক্সেল (Excel) রেকর্ড ডাউনলোড"
        className={cn(
          btnPadding,
          "bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/20 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
        )}
      >
        <FileSpreadsheet size={iconSize} />
      </button>

      {/* 4. Edit Button (where applicable) */}
      {showEdit && onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(student);
          }}
          title="তথ্য সংশোধন / এডিট করুন"
          className={cn(
            btnPadding,
            "bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-500/20 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
          )}
        >
          <Edit3 size={iconSize} />
        </button>
      )}

      {/* 5. Delete Button (where applicable) */}
      {showDelete && onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(student);
          }}
          title="রিসাইকেল বিনে পাঠান (পাসওয়ার্ড যাচাই)"
          className={cn(
            btnPadding,
            "bg-red-500/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-500/20 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
          )}
        >
          <Trash2 size={iconSize} />
        </button>
      )}
    </div>
  );
};
