import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'import \{\n  fetchAllStudents,\n  submitAdmissionForm,\n  fetchPendingApplications,\n  manageApplication,\n  approveApplicationToMainDB,\n\} from "./services/googleSheets";\n', '', content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
