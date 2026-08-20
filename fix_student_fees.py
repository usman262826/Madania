import re

with open('src/components/finance/StudentFees.tsx', 'r') as f:
    content = f.read()

replacement = """              const sectorMap: Record<string, { collected: number; discount: number; count: number }> = {};
              matchedInvs.forEach(inv => {
                (inv.items || []).forEach((item: InvoiceItem) => {
                  const hName = item.headName || 'অন্যান্য';
                  if (!sectorMap[hName]) {
                    sectorMap[hName] = { collected: 0, discount: 0, count: 0 };
                  }
                  sectorMap[hName].collected += (item.amount || 0);
                  sectorMap[hName].discount += (item.discount || 0);
                  sectorMap[hName].count += 1;
                });
              });

              // Aggregate by Jamat
              const jamatSummaryMap: Record<string, { count: number; net: number; paid: number; discount: number; due: number }> = {};
              matchedInvs.forEach(inv => {
                const jName = inv.studentClass || 'অন্যান্য';
                if (!jamatSummaryMap[jName]) {
                  jamatSummaryMap[jName] = { count: 0, net: 0, paid: 0, discount: 0, due: 0 };
                }
                jamatSummaryMap[jName].count += 1;
                jamatSummaryMap[jName].net += (inv.netAmount || 0);
                jamatSummaryMap[jName].paid += (inv.paidAmount || 0);
                jamatSummaryMap[jName].discount += (inv.discount || 0);
                jamatSummaryMap[jName].due += (inv.dueAmount || 0);
              });

              return (
                <div className="space-y-8">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 bg-card border border-border-main rounded-2xl">
                      <p className="text-[10px] font-black text-text-light/50 uppercase tracking-widest mb-1">সর্বমোট আদায়কৃত আয়</p>
                      <h4 className="text-2xl font-black text-success">৳{enToBnNumber(totalInc)}</h4>
                      <p className="text-[10px] font-bold text-text-light/40 mt-1">মোট রসিদ: {enToBnNumber(matchedInvs.length)} টি</p>
                    </div>
                    <div className="p-5 bg-card border border-border-main rounded-2xl">
                      <p className="text-[10px] font-black text-text-light/50 uppercase tracking-widest mb-1">মোট প্রদানকৃত ছাড় (Discount)</p>
                      <h4 className="text-2xl font-black text-indigo-500">৳{enToBnNumber(totalDisc)}</h4>
                      <p className="text-[10px] font-bold text-text-light/40 mt-1">প্যাকেজ ছাড় অটো হিসাবকৃত</p>
                    </div>
                    <div className="p-5 bg-card border border-border-main rounded-2xl">
                      <p className="text-[10px] font-black text-text-light/50 uppercase tracking-widest mb-1">সর্বমোট অবশিষ্ট বকেয়া</p>
                      <h4 className="text-2xl font-black text-error">৳{enToBnNumber(totalDue)}</h4>
                      <p className="text-[10px] font-bold text-text-light/40 mt-1">শিক্ষার্থী লেজারে যুক্ত</p>
                    </div>
                    <div className="p-5 bg-card border border-border-main rounded-2xl">
                      <p className="text-[10px] font-black text-text-light/50 uppercase tracking-widest mb-1">সর্বমোট প্রদেয় বিল</p>
                      <h4 className="text-2xl font-black text-primary">৳{enToBnNumber(totalNet)}</h4>
                      <p className="text-[10px] font-bold text-text-light/40 mt-1">আদায় + বকেয়া মোট</p>
                    </div>
                  </div>

                  {/* Sector-wise Cards Grid */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-base font-black text-text-main flex items-center gap-2">
                        <BarChart3 size={18} className="text-primary" /> খাতের নাম অনুযায়ী বিস্তারিত আয়ের সারসংক্ষেপ
                      </h4>
                      <span className="text-xs font-bold text-text-light/50">মোট {enToBnNumber(Object.keys(sectorMap).length)} টি খাত</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(sectorMap).map(([headName, data]) => {
                        const pct = totalInc > 0 ? Math.round((data.collected / totalInc) * 100) : 0;
                        return (
                          <div key={headName} className="p-5 bg-card border border-border-main/70 hover:border-primary/40 rounded-2xl space-y-3 transition-all shadow-xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-extrabold text-sm text-text-main">{headName}</h5>
                                <span className="text-[10px] font-bold text-text-light/50">{enToBnNumber(data.count)} টি রসিদে অন্তর্ভুক্ত</span>
                              </div>
                              <span className="px-2.5 py-1 bg-primary/10 text-primary font-black text-[10px] rounded-full">
                                {enToBnNumber(pct)}%
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-text-light/60">আদায়কৃত টাকা:</span>
                                <span className="font-black text-success">৳{enToBnNumber(data.collected)}</span>
                              </div>
                              {data.discount > 0 && (
                                <div className="flex justify-between text-xs font-bold text-indigo-500">
                                  <span>মোট ছাড়:</span>
                                  <span>৳{enToBnNumber(data.discount)}</span>
                                </div>
                              )}
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-step-bg h-2 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                          </div>
                        );
                      })}

                      {Object.keys(sectorMap).length === 0 && (
                        <p className="col-span-3 text-center py-10 text-xs font-black text-text-light/40 italic">
                          কোনো আয়ের খাত রেকর্ড পাওয়া যায়নি।
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Jamat-Wise Summary Table */}
                  <div className="space-y-4 pt-4 border-t border-border-main">
                    <h4 className="text-base font-black text-text-main flex items-center gap-2">
                      <Layers size={18} className="text-primary" /> জামাতভিত্তিক মোট ফি আদায় ও সামারি
                    </h4>

                    <div className="overflow-x-auto border border-border-main rounded-2xl">
                      <table className="w-full border-collapse text-xs text-left">
                        <thead>
                          <tr className="bg-primary text-white font-black">
                            <th className="py-3.5 px-4">জামাত / শ্রেণী</th>
                            <th className="py-3.5 px-4">ইনভয়েস সংখ্যা</th>
                            <th className="py-3.5 px-4 text-right">সর্বমোট বিল</th>
                            <th className="py-3.5 px-4 text-right">মোট ছাড়</th>
                            <th className="py-3.5 px-4 text-right">আদায়কৃত ফি</th>
                            <th className="py-3.5 px-4 text-right">অবশিষ্ট বকেয়া</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-main/40 text-text-main font-semibold">
                          {Object.entries(jamatSummaryMap).map(([jName, jData]) => (
                            <tr key={jName} className="hover:bg-primary/[0.02]">
                              <td className="py-3.5 px-4 font-black text-primary">{jName}</td>
                              <td className="py-3.5 px-4">{enToBnNumber(jData.count)} টি</td>
                              <td className="py-3.5 px-4 text-right font-bold">৳{enToBnNumber(jData.net)}</td>
                              <td className="py-3.5 px-4 text-right font-bold text-indigo-500">৳{enToBnNumber(jData.discount)}</td>
                              <td className="py-3.5 px-4 text-right font-black text-success">৳{enToBnNumber(jData.paid)}</td>
                              <td className="py-3.5 px-4 text-right font-black text-error">৳{enToBnNumber(jData.due)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>
        )}

        {/* --- MODULE F: Fee Packages & Class Matrix --- */}
        {activeTab === 'packages' && (
          <div className="space-y-6 animate-fade-in text-left">
            <FeesCostPackageManager />
          </div>
        )}
      </div>

      {/* --- FULL PAGE INVOICE VIEWER --- */}
      <AnimatePresence>
        {activeInvoice && (
          <div className="fixed inset-0 z-[100] bg-white overflow-hidden flex flex-col">
            <InvoiceViewer 
              invoice={activeInvoice}
              madrasahBranding={madrasahBranding}
              onClose={() => setActiveInvoice(null)}
            />
          </div>
        )}
      </AnimatePresence>"""

target = """              const sectorMap: Record<string, { collected: number; discount: n      {/* Full Page Invoice Viewer (replaces the modal) */}
      <AnimatePresence>
        {activeInvoice && (
          <div className="fixed inset-0 z-[100] bg-white overflow-hidden flex flex-col">
            <InvoiceViewer 
              invoice={activeInvoice}
              madrasahBranding={madrasahBranding}
              onClose={() => setActiveInvoice(null)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* --- PASSWORD VERIFICATION MODAL FOR DELETE --- */}der-2 border-gray-200 rounded-3xl relative bg-white",
                    copyIdx > 0 ? "border-t-[3px] border-dashed border-t-gray-300 rounded-t-none pt-12 print:mt-8" : ""
                  )}>"""

# First replace the bad chunk
content = content.replace(target, replacement)

# We need to find the old modal that was left behind
# It starts at copy Name Badge
old_modal_target = """                    
                    {/* Copy Name Badge */}
                    <div className="absolute -top-3.5 right-8 bg-gray-100 px-4 py-1.5 border border-gray-200 rounded-full text-[10px] font-black text-gray-600 uppercase tracking-widest shadow-sm">
                      {copy.label}
                    </div>"""

# Remove the leftover of the modal, let's find the `)}</AnimatePresence>`
# and delete everything from `old_modal_target` to `)}</AnimatePresence>`

start_index = content.find(old_modal_target)
end_str = "        )}</AnimatePresence>"
end_index = content.find(end_str, start_index)

if start_index != -1 and end_index != -1:
    content = content[:start_index] + "\n" + content[end_index + len(end_str):]
else:
    print("Could not find leftover modal to delete!")

with open('src/components/finance/StudentFees.tsx', 'w') as f:
    f.write(content)

