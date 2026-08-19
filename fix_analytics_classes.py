import re

with open('src/components/dashboard/Analytics.tsx', 'r') as f:
    content = f.read()

content = content.replace("const { invoices, expenses, staffMembers } = useData();", "const { invoices, expenses, staffMembers, classes, updateData, deleteData } = useData();")

# We should replace local storage manipulation with useData
# Wait, let's look at lines 1070-1170 to see how it works.
