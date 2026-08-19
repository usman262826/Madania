import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("const { studentOverrides, isLoading: isSupabaseLoading, refreshData: refreshSupabaseData, updateData: updateSupabaseData } = useData();", "const { studentOverrides, students: contextStudents, isLoading: isSupabaseLoading, refreshData: refreshSupabaseData, updateData: updateSupabaseData } = useData();")

with open('src/App.tsx', 'w') as f:
    f.write(content)
