import re

with open('src/contexts/DataContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("'invoices': 'madrasah-invoices-db',", "'invoices': 'madrasah-invoices-db',\n      'students': 'madrasah-students-db',")
content = content.replace("studentOverrides,", "studentOverrides,\n      students,")

with open('src/contexts/DataContext.tsx', 'w') as f:
    f.write(content)
