export const generatePrintableDocument = (
  title: string,
  contentHtml: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.maateen.me/kalpurush/font.css');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        @page {
          size: A4 ${orientation};
          margin: 15mm;
        }

        body {
          font-family: 'Kalpurush', 'Inter', sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-header {
          text-align: center;
          border-bottom: 2px solid #0f6e8c;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        .print-header h1 {
          font-size: 24px;
          color: #0f6e8c;
          margin: 0;
          padding: 0;
          font-weight: bold;
        }

        .print-header h2 {
          font-size: 16px;
          color: #475569;
          margin: 5px 0 0 0;
          font-weight: normal;
        }

        .print-header p {
          font-size: 12px;
          color: #64748b;
          margin: 5px 0 0 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 12px;
        }

        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px;
          text-align: left;
        }

        th {
          background-color: #f1f5f9 !important;
          font-weight: bold;
          color: #334155;
        }

        .print-footer {
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 10px;
          color: #94a3b8;
          text-align: center;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .mb-4 { margin-bottom: 1rem; }
        .mt-4 { margin-top: 1rem; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .gap-4 { gap: 1rem; }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা</h1>
        <p style="font-size: 11px; margin: 2px 0 10px 0; color: #475569;">ঠিকানা : নয়া কান্দারগাঁও, লুটেরচর-৩৫১৬, মেঘনা, কুমিল্লা।</p>
        <h2>${title}</h2>
        <p>প্রিন্ট তারিখ: ${new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div class="print-content">
        ${contentHtml}
      </div>

      <div class="print-footer">
        © ${new Date().getFullYear()} দারুল উলূম মাদানিয়া (মহিলা) মাদরাসা - নয়া কান্দারগাঁও, লুটেরচর-৩৫১৬, মেঘনা, কুমিল্লা। - প্রিন্ট কপি
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }, 500);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
