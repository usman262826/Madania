import React, { useRef } from 'react';
import { Download, Printer, X, ArrowLeft } from 'lucide-react';
import { enToBnNumber, numberToBanglaWords, cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

interface InvoiceViewerProps {
  invoice: any;
  madrasahBranding: any;
  onClose: () => void;
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({
  invoice,
  madrasahBranding,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    const elem = printRef.current;
    if (!elem) {
      toast.error('ডকুমেন্ট রেন্ডার হয়নি, আবার চেষ্টা করুন।');
      return;
    }
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule.default || html2pdfModule) as any;
      const opt = {
        margin: [0, 0, 0, 0],
        filename: `Invoice_${invoice?.invoiceNo || 'Single'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(elem).save();
      toast.success('ইনভয়েস PDF ডাউনলোড শুরু হয়েছে');
    } catch (err) {
      console.error('Failed to download PDF:', err);
      window.print();
    }
  };

  return (
    <div className="w-full bg-[#e8e8e8] min-h-screen flex flex-col font-[Kalpurush,inherit] overflow-y-auto flex-1">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white shadow-sm print:hidden">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-bold mb-4 sm:mb-0"
        >
          <ArrowLeft size={20} />
          ফিরে যান
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition-all"
          >
            <Download size={18} />
            PDF ডাউনলোড
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold shadow-md transition-all"
          >
            <Printer size={18} />
            প্রিন্ট করুন
          </button>
        </div>
      </div>

      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-invoice, #printable-invoice * {
              visibility: visible;
            }
            #printable-invoice {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0 !important;
              margin: 0 !important;
              background-color: white !important;
              box-shadow: none !important;
            }
            @page {
              size: auto;
              margin: 0;
            }
          }
        `}
      </style>

      {/* Invoice Container */}
      <div className="py-8 px-4 flex justify-center">
        <div 
          id="printable-invoice"
          ref={printRef}
          className="w-full max-w-[900px] bg-white shadow-lg overflow-hidden"
          style={{ fontFamily: 'Kalpurush, sans-serif' }}
        >
          {/* Header Section */}
          <div className="flex bg-white">
            <div className="w-[200px] mr-10 ml-[6.1%] mb-[140px] bg-[#505050] p-10 text-center text-white flex flex-col items-center">
              <div className="w-[100px] h-[100px] bg-white rounded flex items-center justify-center mb-4 overflow-hidden p-1 shadow-sm">
                {madrasahBranding?.logoUrl ? (
                  <img src={madrasahBranding.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" crossOrigin="anonymous" />
                ) : (
                  <span className="text-4xl font-black text-[#505050]">ম</span>
                )}
              </div>
              <div className="text-[13px] leading-[1.4] font-medium">
                {madrasahBranding?.madrasahName || 'মাদরাসা'}
                <br />
                <small className="text-[10px] opacity-80 mt-1 block">প্রতিষ্ঠিত: ২০০১ ইং</small>
              </div>
            </div>

            <div className="flex-1 py-10 pr-10 pb-5">
              <div className="text-[54px] font-[800] mb-10 text-right tracking-[3px] text-[#222]">INVOICE</div>
              
              <div className="grid grid-cols-2 gap-[60px] mb-10">
                <div>
                  <div className="text-[11px] font-[600] text-[#555] mb-2 uppercase tracking-[0.5px]">Invoice to (শিক্ষার্থীর তথ্য)</div>
                  <div className="text-[18px] font-[700] text-[#222] mb-1">{invoice?.studentName || 'শিক্ষার্থী'}</div>
                  <div className="text-[12px] font-[600] text-[#444] mb-2">{invoice?.studentClass || ''} (শাখা: {invoice?.studentBranch || 'ক'})</div>
                  
                  <div className="text-[#555] text-[12px] leading-[1.6] space-y-0.5">
                    {invoice?.studentFather && <div><span className="font-[600]">পিতার নাম:</span> {invoice.studentFather}</div>}
                    {invoice?.studentPhone && <div><span className="font-[600]">মোবাইল:</span> {enToBnNumber(invoice.studentPhone)}</div>}
                    <div><span className="font-[600]">রোল নং:</span> {enToBnNumber(invoice?.studentRoll || '')}</div>
                    <div><span className="font-[600]">শিক্ষার্থী আইডি:</span> {enToBnNumber(String(invoice?.studentId || ''))}</div>
                    {invoice?.studentSession && <div><span className="font-[600]">শিক্ষাবর্ষ:</span> {enToBnNumber(invoice.studentSession)}</div>}
                  </div>
                </div>
                
                <div className="text-right text-[13px]">
                  <div className="mb-4">
                    <div className="text-[#999] text-[11px] mb-[2px]">Invoice No</div>
                    <div className="font-[600] text-[#222]">: {invoice?.invoiceNo}</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[#999] text-[11px] mb-[2px]">Invoice Date</div>
                    <div className="font-[600] text-[#222]">: {enToBnNumber(invoice?.date || '')}</div>
                  </div>
                  
                  <div className="text-[12px] text-[#666] mt-[20px] leading-[1.6]">
                    <div className="text-[11px] text-[#999] mb-[2px] font-[600]">Month / Year & Payment</div>
                    <div className="text-[#222]">মাস: {invoice?.month || ''}</div>
                    <div className="text-[#222]">বছর: {enToBnNumber(invoice?.year || '')}</div>
                    <div className="text-[#222] font-[600] mt-1">পেমেন্ট মাধ্যম: <span className="text-[#000]">{invoice?.paymentMethod || 'ক্যাশ'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="px-10">
            <table className="w-full border-collapse mb-10">
              <thead className="bg-[#505050] text-white">
                <tr>
                  <th className="p-[14px] text-left text-[12px] font-[600] uppercase tracking-[0.5px] w-[5%]">#</th>
                  <th className="p-[14px] text-left text-[12px] font-[600] uppercase tracking-[0.5px] w-[45%]">বিবরণ (Description)</th>
                  <th className="p-[14px] text-right text-[12px] font-[600] uppercase tracking-[0.5px] w-[15%]">নির্ধারিত</th>
                  <th className="p-[14px] text-center text-[12px] font-[600] uppercase tracking-[0.5px] w-[15%]">ছাড়</th>
                  <th className="p-[14px] text-right text-[12px] font-[600] uppercase tracking-[0.5px] w-[20%]">আদায়কৃত (Amount)</th>
                </tr>
              </thead>
              <tbody>
                {invoice?.items?.map((item: any, idx: number) => (
                  <tr key={idx} className={idx % 2 !== 0 ? 'bg-[#f5f5f5] border-b border-[#e0e0e0]' : 'border-b border-[#e0e0e0]'}>
                    <td className="p-[14px] text-[13px] text-[#333]">{enToBnNumber(idx + 1)}</td>
                    <td className="p-[14px] text-[13px] text-[#333]">{item.headName}</td>
                    <td className="p-[14px] text-[13px] text-[#333] text-right">৳ {enToBnNumber(item.defaultRate || item.amount)}</td>
                    <td className="p-[14px] text-[13px] text-[#333] text-center">৳ {enToBnNumber(item.discount || 0)}</td>
                    <td className="p-[14px] text-[13px] text-[#333] text-right">৳ {enToBnNumber(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="grid grid-cols-2 gap-[60px] px-10 mb-[60px]">
            <div className="border-t-[2px] border-[#222] pt-4">
              <div className="text-[12px] text-[#999] mb-1">Total Paid</div>
              <div className="text-[34px] font-[700] text-[#222] mb-1">৳ {enToBnNumber(invoice?.paidAmount || 0)}</div>
              <div className="text-[11px] font-[700] text-[#333] mb-2 flex items-center gap-1.5">
                <span>পেমেন্ট মাধ্যম:</span>
                <span className="bg-[#eee] text-[#111] px-2 py-0.5 rounded text-[11px] border border-[#ccc] font-bold">{invoice?.paymentMethod || 'ক্যাশ'}</span>
              </div>
              <div className="text-[11px] text-[#999]">কথায়: {numberToBanglaWords(invoice?.paidAmount || 0)} টাকা মাত্র</div>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between py-2 text-[13px] border-b border-[#e0e0e0] pb-3 mb-3">
                <span className="text-[#666]">আইটেম মোট (Sub Total)</span>
                <span className="text-[#222] font-[600]">৳ {enToBnNumber(invoice?.subtotal || 0)}</span>
              </div>
              
              {Number(invoice?.previousDue || 0) > 0 && (
                <div className="flex justify-between py-2 text-[13px] border-b border-[#e0e0e0] pb-3 mb-3">
                  <span className="text-[#666]">পূর্ববর্তী বকেয়া (Previous Due)</span>
                  <span className="text-[#222] font-[600]">৳ {enToBnNumber(invoice?.previousDue || 0)}</span>
                </div>
              )}
              
              {Number(invoice?.discount || 0) > 0 && (
                <div className="flex justify-between py-2 text-[13px] border-b border-[#e0e0e0] pb-3 mb-3">
                  <span className="text-[#666]">সর্বমোট ছাড় (Total Discount)</span>
                  <span className="text-[#222] font-[600]">৳ {enToBnNumber(invoice?.discount || 0)}</span>
                </div>
              )}
              
              <div className="bg-[#505050] text-white p-3 flex justify-between font-[600]">
                <span>পরিশোধিত (TOTAL PAID)</span>
                <span>৳ {enToBnNumber(invoice?.paidAmount || 0)}</span>
              </div>
              
              {Number(invoice?.dueAmount || 0) > 0 && (
                <div className="flex justify-between py-2 text-[13px] text-red-600 mt-2 font-bold">
                  <span>অবশিষ্ট বকেয়া (Due Amount)</span>
                  <span>৳ {enToBnNumber(invoice?.dueAmount || 0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Signature */}
          <div className="px-10">
            <div className="grid grid-cols-2 gap-[60px] py-10 border-t border-[#e0e0e0]">
              <div>
                <div className="text-[14px] font-[600] mb-3 text-[#222]">মন্তব্য (Remarks)</div>
                <div className="text-[12px] text-[#666] leading-[1.6]">
                  {invoice?.comment || 'উক্ত ইনভয়েস এর সকল পেমেন্ট ও তথ্য সঠিক বলে গণ্য হবে। রসিদটি সংরক্ষণে রাখুন।'}
                </div>
              </div>
              
              <div className="text-right">
                <div className="h-[50px] border-b border-[#222] mb-2 w-[180px] ml-auto"></div>
                <div className="text-[13px] font-[600] text-[#222] mb-[2px]">কর্তৃপক্ষের স্বাক্ষর</div>
                <div className="text-[12px] text-[#666]">হিসাবরক্ষক / মুহতামিম</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#505050] text-white p-10 grid grid-cols-3 gap-10 text-[12px]">
            <div className="flex items-start gap-3">
              <div className="text-[20px] min-w-[24px]">☎️</div>
              <div className="flex-1">
                <div className="font-[600] mb-[6px] text-[11px]">Phone</div>
                <div className="text-[#ccc] leading-[1.6] text-[11px]">
                  {madrasahBranding?.phone || '01700-000000'}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-[20px] min-w-[24px]">📍</div>
              <div className="flex-1">
                <div className="font-[600] mb-[6px] text-[11px]">Address</div>
                <div className="text-[#ccc] leading-[1.6] text-[11px]">
                  {madrasahBranding?.address || 'বাংলাদেশ'}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-[20px] min-w-[24px]">✉️</div>
              <div className="flex-1">
                <div className="font-[600] mb-[6px] text-[11px]">Info</div>
                <div className="text-[#ccc] leading-[1.6] text-[11px]">
                  মানি রসিদ (System Generated)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
