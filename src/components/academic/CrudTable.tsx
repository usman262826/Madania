import React, { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Search, CheckCircle, XCircle, Printer, Download, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePrintableDocument } from '../../lib/printEngine';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface CrudTableProps<T> {
  title: string;
  subtitle: string;
  data: T[];
  columns: Column<T>[];
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onImportData?: (importedRows: any[]) => void;
  searchKey?: keyof T;
  searchPlaceholder?: string;
  renderFilters?: () => React.ReactNode;
  renderActions?: (item: T) => React.ReactNode;
}

export function CrudTable<T extends { id: string }>({
  title,
  subtitle,
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  onImportData,
  searchKey,
  searchPlaceholder = "খুঁজুন...",
  renderFilters,
  renderActions
}: CrudTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = data.filter((item) => {
    if (!searchTerm || !searchKey) return true;
    const val = item[searchKey];
    return String(val).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleExportCSV = () => {
    try {
      // Export as XLSX using sheetjs for full compatibility
      const headers = columns.map(col => col.label);
      const rows = filteredData.map(item => {
        return columns.map(col => {
          let text = String(item[col.key as keyof T] ?? '');
          if (item[col.key as keyof T] === true) text = 'সক্রিয়';
          if (item[col.key as keyof T] === false) text = 'নিষ্ক্রিয়';
          return text;
        });
      });

      const worksheetData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(wb, `${title}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('এক্সেল ফাইল সফলভাবে ডাউনলোড হয়েছে');
    } catch (e) {
      console.error(e);
      // Fallback CSV
      const headers = columns.map(col => col.label).join(',');
      const rows = filteredData.map(item => {
        return columns.map(col => {
          let text = String(item[col.key as keyof T] || '');
          if (item[col.key as keyof T] === true) text = 'সক্রিয়';
          if (item[col.key as keyof T] === false) text = 'নিষ্ক্রিয়';
          return `"${text.replace(/"/g, '""')}"`;
        }).join(',');
      }).join('\n');

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + '\n' + rows;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${title}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        
        if (onImportData) {
          onImportData(jsonData);
          toast.success(`${jsonData.length} টি তথ্য সফলভাবে ইমপোর্ট হয়েছে`);
        } else {
          toast.success(`ফাইল পড়া সফল হয়েছে, ${jsonData.length} টি সারি পাওয়া গেছে`);
        }
      } catch (err) {
        console.error('File import error:', err);
        toast.error('ফাইল ইমপোর্ট করতে সমস্যা হয়েছে। সঠিক এক্সেল (XLSX/CSV) ফাইল আপলোড করুন।');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePrint = () => {
    const tableRows = filteredData.map(item => {
      const tds = columns.map(col => {
        let text = String(item[col.key as keyof T] ?? '');
        if (item[col.key as keyof T] === true) text = 'সক্রিয়';
        if (item[col.key as keyof T] === false) text = 'নিষ্ক্রিয়';
        return `<td>${text}</td>`;
      }).join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    const thead = columns.map(col => `<th>${col.label}</th>`).join('');

    const html = `
      <table>
        <thead>
          <tr>${thead}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;

    generatePrintableDocument(title, html);
  };

  return (
    <div className="w-full flex flex-col gap-6 font-hind-siliguri">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border-main shadow-sm">
        <div>
          <h2 className="text-xl font-black text-text-main leading-tight">{title}</h2>
          <p className="text-xs font-bold text-text-light mt-1">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onImportData && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-black text-xs rounded-xl transition-all active:scale-95 cursor-pointer"
              title="এক্সেল ইমপোর্ট (upload .xlsx / .csv)"
            >
              <Upload size={16} />
              <span>এক্সেল ইমপোর্ট</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-black text-xs rounded-xl transition-all active:scale-95 cursor-pointer"
            title="এক্সেল এক্সপোর্ট"
          >
            <Download size={16} />
            <span>এক্সেল এক্সপোর্ট</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-black text-xs rounded-xl transition-all active:scale-95 cursor-pointer"
            title="প্রিন্ট/পিডিএফ (কালপুরুষ ফন্টসহ)"
          >
            <Printer size={16} />
            <span>পিডিএফ / প্রিন্ট</span>
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>নতুন যোগ করুন</span>
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border-main shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border-main bg-step-bg/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          {searchKey && (
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-3 text-text-light/50" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-border-main rounded-xl text-xs font-bold outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          )}
          {renderFilters && <div className="flex w-full sm:w-auto">{renderFilters()}</div>}
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary border-b border-border-main/50 text-white">
                {columns.map((col, idx) => (
                  <th key={idx} className="p-4 text-[11px] font-black uppercase text-white/95 tracking-wider whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                <th className="p-4 text-[11px] font-black uppercase text-white/95 tracking-wider text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-8 text-center text-text-light font-bold text-sm">
                    কোনো তথ্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-border-main/40 even:bg-primary/[0.02] hover:bg-primary/[0.06] transition-colors">
                    {columns.map((col, idx) => (
                      <td key={idx} className="p-4 text-sm font-semibold text-text-main whitespace-nowrap">
                        {col.render ? col.render(item) : String(item[col.key as keyof T] || '')}
                      </td>
                    ))}
                    <td className="p-4 flex items-center justify-end gap-2">
                      {renderActions && renderActions(item)}
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors cursor-pointer"
                        title="এডিট করুন"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="ডিলিট করুন"
                      >
                        <Trash2 size={16} />
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
  );
}

export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg bg-card rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-5 border-b border-border-main bg-step-bg flex items-center justify-between">
              <h3 className="text-lg font-black text-text-main">{title}</h3>
              <button onClick={onClose} className="p-1 text-text-light hover:text-rose-500 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
