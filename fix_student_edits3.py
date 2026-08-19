import re

with open('src/components/students/StudentUpdateAll.tsx', 'r') as f:
    content = f.read()

content = content.replace("    const currentOverrides = { ...studentOverrides[sId] };\n    const updatedStudentData: any = {\n      ...currentOverrides,", "    const student = students.find(s => (s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || '') === sId);\n    const updatedStudentData: any = {\n      ...student,")

with open('src/components/students/StudentUpdateAll.tsx', 'w') as f:
    f.write(content)

with open('src/components/students/StudentProfileCard.tsx', 'r') as f:
    content = f.read()

content = content.replace("    const currentOverrides = { ...studentOverrides[sId] };\n    const updatedStudentData: any = {\n      ...currentOverrides,", "    const updatedStudentData: any = {\n      ...student,")

with open('src/components/students/StudentProfileCard.tsx', 'w') as f:
    f.write(content)

