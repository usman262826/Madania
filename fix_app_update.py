import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("updateSupabaseData('student_overrides'", "updateSupabaseData('students'")
content = content.replace("updateSupabaseData(\"student_overrides\"", "updateSupabaseData('students'")

with open('src/App.tsx', 'w') as f:
    f.write(content)
