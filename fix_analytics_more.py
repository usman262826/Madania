import re

with open('src/components/dashboard/Analytics.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'enToBnNumber\("১,২৪,০০০"\)', 'enToBnNumber(totalIncome.toString())', content)
content = re.sub(r'enToBnNumber\("১২"\)', 'enToBnNumber(staffCount.toString())', content)
content = re.sub(r'enToBnNumber\("১৫"\)', 'enToBnNumber(staffCount.toString())', content)
content = re.sub(r'enToBnNumber\("৪"\)', 'enToBnNumber("0")', content)
content = re.sub(r'enToBnNumber\("৩"\)', 'enToBnNumber(pending.length.toString())', content)
content = re.sub(r'enToBnNumber\("০"\)', 'enToBnNumber(pending.length.toString())', content)
content = re.sub(r'enToBnNumber\("13"\)', 'enToBnNumber(classesList.length.toString())', content)
content = re.sub(r'\(13 -', '(classesList.length -', content)
content = re.sub(r'enToBnNumber\("৭৫%"\)', 'enToBnNumber("0%")', content)
content = re.sub(r'enToBnNumber\("৯২"\)', 'enToBnNumber("0")', content)
content = re.sub(r'<span>আজ উপস্থিত:.*?</span>', '<span>বিস্তারিত</span>', content)

with open('src/components/dashboard/Analytics.tsx', 'w') as f:
    f.write(content)
