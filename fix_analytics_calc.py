import re

with open('src/components/dashboard/Analytics.tsx', 'r') as f:
    content = f.read()

calc_logic = """
  const totalExpenses = expenses.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
  const totalIncome = invoices.reduce((acc: number, curr: any) => acc + (Number(curr.paid) || 0), 0);
  const totalDue = invoices.reduce((acc: number, curr: any) => acc + (Number(curr.due) || 0), 0);
  const cashInHand = totalIncome - totalExpenses;
  const staffCount = staffMembers.length;
"""

content = content.replace('  const [showJamatModal, setShowJamatModal] = React.useState(false);', calc_logic + '  const [showJamatModal, setShowJamatModal] = React.useState(false);')

# Replace the text inside enToBnNumber
content = re.sub(r'enToBnNumber\("১,২০,৪০০"\)', 'enToBnNumber(totalExpenses.toString())', content)
content = re.sub(r'enToBnNumber\("৯৮"\)', 'enToBnNumber(invoices.length.toString())', content)
content = re.sub(r'enToBnNumber\("৮৬,১০০"\)', 'enToBnNumber(cashInHand.toString())', content)
content = content.replace('<span>মেস খরচ: ৳ ১৫,২০০</span>', '<span>হিসাব দেখুন</span>')
content = content.replace('<span>পরিশোধিত: ৮৫ | বকেয়া: ১৩</span>', '<span>বিস্তারিত</span>')

with open('src/components/dashboard/Analytics.tsx', 'w') as f:
    f.write(content)
