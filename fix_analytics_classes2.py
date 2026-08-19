import re

with open('src/components/dashboard/Analytics.tsx', 'r') as f:
    content = f.read()

# Remove the useEffect that loads from localStorage
content = re.sub(r'  // Load classes from localStorage or set defaults\s*React\.useEffect\(\(\) => \{.*?\n  \}, \[\]\);', '', content, flags=re.DOTALL)

# Replace classesList with classes from context
content = content.replace("const [classesList, setClassesList] = React.useState<any[]>([]);", "")
content = content.replace("const [departments, setDepartments] = React.useState<any[]>([]);", "")
content = content.replace("classesList", "classes")

# Fix handleDeleteClass
handle_delete_new = """  const handleDeleteClass = async (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই জামাতটি বাদ দিতে চান?")) {
      await deleteData('acad_classes', id);
    }
  };"""
content = re.sub(r'  const handleDeleteClass = \(id: string\) => \{.*?\n  \};', handle_delete_new, content, flags=re.DOTALL)

# Fix handleToggleClassStatus
handle_toggle_new = """  const handleToggleClassStatus = async (id: string) => {
    const cls = classes.find((c) => c.id === id);
    if (cls) {
      await updateData('acad_classes', { ...cls, isActive: !cls.isActive });
    }
  };"""
content = re.sub(r'  const handleToggleClassStatus = \(id: string\) => \{.*?\n  \};', handle_toggle_new, content, flags=re.DOTALL)

# Fix handleSaveClassSubmit
handle_save_new = """  const handleSaveClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.name.trim()) return;

    if (editingClass) {
      await updateData('acad_classes', { ...editingClass, ...classFormData });
    } else {
      await updateData('acad_classes', {
        id: Date.now().toString(),
        ...classFormData,
      });
    }

    setEditingClass(null);
    setClassFormData({ name: "", departmentId: "3", equivalent: "", isActive: true });
  };"""
content = re.sub(r'  const handleSaveClassSubmit = \(e: React\.FormEvent\) => \{.*?\n  \};', handle_save_new, content, flags=re.DOTALL)

# We need to make sure we're getting `departments` and `classes` from useData() in Analytics.tsx
content = content.replace("const { invoices, expenses, staffMembers, classes, updateData, deleteData } = useData();", "const { invoices, expenses, staffMembers, classes, departments, updateData, deleteData } = useData();")

with open('src/components/dashboard/Analytics.tsx', 'w') as f:
    f.write(content)
