import re

with open('src/contexts/DataContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("table === 'student_overrides'", "table === 'xyz_never'")
content = content.replace("['student_overrides', 'staff_attendance'", "['xyz_never', 'staff_attendance'")

with open('src/contexts/DataContext.tsx', 'w') as f:
    f.write(content)
