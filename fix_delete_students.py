import re

with open('src/components/students/StudentUpdateAll.tsx', 'r') as f:
    content = f.read()

content = content.replace("const { studentOverrides, classFeeMapping, invoices, updateData } = useData();", "const { studentOverrides, classFeeMapping, invoices, updateData, deleteData } = useData();")
content = re.sub(r'const currentOverrides = \{ \.\.\.studentOverrides\[studentId\] \};\s*const updatedStudentData = \{\s*\.\.\.currentOverrides,\s*isDeleted: true\s*\};\s*await updateData\(\'students\', updatedStudentData, studentId\);', "await deleteData('students', studentId);", content)

with open('src/components/students/StudentUpdateAll.tsx', 'w') as f:
    f.write(content)

with open('src/components/students/StudentProfileCard.tsx', 'r') as f:
    content = f.read()

content = content.replace("const { studentOverrides, updateData } = useData();", "const { studentOverrides, updateData, deleteData } = useData();")
content = re.sub(r'const currentOverrides = \{ \.\.\.studentOverrides\[sId\] \};\s*const updatedStudentData = \{\s*\.\.\.currentOverrides,\s*isDeleted: true\s*\};\s*await updateData\(\'students\', updatedStudentData, String\(sId\)\);', "await deleteData('students', String(sId));", content)

with open('src/components/students/StudentProfileCard.tsx', 'w') as f:
    f.write(content)
