import re

with open('src/components/finance/FeesCostPackageManager.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'  const \[classFeeMapping, setClassFeeMapping\] = useState<ClassFeeMapping>\(\(\) => \{.*?\n  \}\);\n', '', content, flags=re.DOTALL)

with open('src/components/finance/FeesCostPackageManager.tsx', 'w') as f:
    f.write(content)
