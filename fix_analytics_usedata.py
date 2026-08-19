import re

with open('src/components/dashboard/Analytics.tsx', 'r') as f:
    content = f.read()

content = content.replace("  const [showJamatModal, setShowJamatModal] = React.useState(false);", "  const { invoices, expenses, staffMembers } = useData();\n  const [showJamatModal, setShowJamatModal] = React.useState(false);")

with open('src/components/dashboard/Analytics.tsx', 'w') as f:
    f.write(content)
