import re

with open('src/components/dashboard/Analytics.tsx', 'r') as f:
    content = f.read()

if "import { useData }" not in content:
    content = content.replace('import { Student, Application } from "../../types";', 'import { Student, Application } from "../../types";\nimport { useData } from "../../contexts/DataContext";')

with open('src/components/dashboard/Analytics.tsx', 'w') as f:
    f.write(content)
