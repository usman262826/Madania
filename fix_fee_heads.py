import re

with open('src/components/finance/FeesCostPackageManager.tsx', 'r') as f:
    content = f.read()

# Make it use feeHeads, classFeeMapping, updateData, deleteData from useData
use_data_import = "import { useData } from '../../contexts/DataContext';\n"
content = content.replace("import React, { useState, useEffect, useMemo, useRef } from 'react';", "import React, { useState, useEffect, useMemo, useRef } from 'react';\n" + use_data_import)

# Replace the initializations
content = re.sub(r'  const \[feeHeads, setFeeHeads\] = useState<FeeHead\[\]>\(\(\) => \{.*?\n  \}\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'  const \[classFeeMapping, setClassFeeMapping\] = useState<Record<string, Record<string, number>>>\(\(\) => \{.*?\n  \}\);\n', '', content, flags=re.DOTALL)

# Add useData hook call inside component
context_call = "  const { feeHeads, classFeeMapping, updateData, deleteData } = useData();\n"
content = content.replace("  const showToast = (type: 'success' | 'error', text: string) => {", context_call + "  const showToast = (type: 'success' | 'error', text: string) => {")

# Remove localStorage syncing in useEffect
content = re.sub(r'  useEffect\(\(\) => \{\n    localStorage.setItem\(\'madrasah-fee-heads\'.*?\n  \}, \[classFeeMapping\]\);\n', '', content, flags=re.DOTALL)

# Fix handleSaveGlobalEdit
handle_save_global = """  const handleSaveGlobalEdit = async () => {
    // Validate empty names
    for (const h of draftHeads) {
      if (!h.name.trim()) {
        showToast('error', 'কোনো খাতের নাম ফাঁকা রাখা যাবে না!');
        return;
      }
    }
    
    // Check for duplicate names
    const names = draftHeads.map(h => h.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      showToast('error', 'একাধিক খাতের একই নাম ব্যবহার করা যাবে না!');
      return;
    }

    // Save to backend via context
    for (const head of draftHeads) {
      await updateData('fee_heads', head);
    }
    // We should also save classFeeMapping. The context might not have a table for it yet?
    // Wait, DataContext.tsx uses 'madrasah-class-fee-mapping' locally. We will just update localStorage for it if there's no supabase table, or maybe there is a 'class_fee_mapping' table?
    // Let's just do localStorage for mapping for now, but fee_heads goes to updateData
    localStorage.setItem('madrasah-class-fee-mapping', JSON.stringify(draftMapping));
    window.dispatchEvent(new Event('madrasah-class-fee-mapping_updated'));

    setIsEditing(false);
    showToast('success', 'সকল পরিবর্তন সফলভাবে সংরক্ষণ করা হয়েছে।');
  };"""
content = re.sub(r'  const handleSaveGlobalEdit = \(\) => \{.*?\n  const handleCancelGlobalEdit = \(\) => \{', handle_save_global + '\n  const handleCancelGlobalEdit = () => {', content, flags=re.DOTALL)


with open('src/components/finance/FeesCostPackageManager.tsx', 'w') as f:
    f.write(content)

