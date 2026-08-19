import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

new_on_save = """                  onSave={async (ns: any) => {
                    setIsLoading(true);
                    try {
                      const id = ns['রেজিস্ট্রেশন/আইডি'] || ns['আবেদন নং'] || ns.id || Math.floor(Math.random() * 900000 + 100000).toString();
                      
                      const studentData = {
                        ...ns,
                        id,
                        "রেজিস্ট্রেশন/আইডি নম্বর": id,
                        "শিক্ষাবর্ষ": ns['শিক্ষাবর্ষ'] || academicYear,
                        academicYearLabel: ns['শিক্ষাবর্ষ'] || academicYear
                      };

                      await updateSupabaseData('students', studentData, id);

                      alert('শিক্ষার্থী সফলভাবে ডাটাবেজে যুক্ত করা হয়েছে!');"""

content = re.sub(r'                  onSave=\{async \(ns: any\) => \{\n                    setIsLoading\(true\);\n                    try \{\n                      const id = ns\[\'রেজিস্ট্রেশন/আইডি\'\] \|\| ns\[\'আবেদন নং\'\] \|\| Math\.floor\(Math\.random\(\) \* 900000 \+ 100000\)\.toString\(\);\n                      \n                      // Save directly to student_overrides via context for reactivity\n                      await updateSupabaseData\(\'students\', ns, id\);\n\n                      alert\(\'শিক্ষার্থী সফলভাবে ডাটাবেজে যুক্ত করা হয়েছে!\'\);', new_on_save, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
