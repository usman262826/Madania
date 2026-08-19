import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the loadAllData function
new_loadAllData = """
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Data is now fetched via useData from Supabase
      setBaseStudents(students || []);
      setPending([]);
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };
"""

content = re.sub(r'const loadAllData = async \(\) => \{.*?\};', new_loadAllData, content, flags=re.DOTALL)

# Also update the useMemo for students
new_students_memo = """
  const allStudents = useMemo(() => {
    const overrideOnlyStudents: Student[] = [];
    Object.keys(studentOverrides).forEach(key => {
      if (!students.find(s => s["রেজিস্ট্রেশন/আইডি নম্বর"] === key || s.id === key)) {
        const overrideData = studentOverrides[key];
        if (overrideData["শিক্ষার্থীর নাম"] || overrideData.name) {
          overrideOnlyStudents.push({
            id: key,
            "রেজিস্ট্রেশন/আইডি নম্বর": key,
            academicYearLabel: overrideData["শিক্ষাবর্ষ"] || academicYear,
            ...overrideData
          } as any);
        }
      }
    });

    const combined = [...students, ...overrideOnlyStudents].map(s => {
      const key = s["রেজিস্ট্রেশন/আইডি নম্বর"] || s.id;
      if (key && studentOverrides[key]) {
        return { ...s, ...studentOverrides[key] };
      }
      return s;
    });

    return combined.filter(s => !s.isDeleted && !studentOverrides[s["রেজিস্ট্রেশন/আইডি নম্বর"] || s.id]?.isDeleted);
  }, [students, studentOverrides, academicYear]);
"""

# Wait, `students` is already declared in `App.tsx` as `const students = useMemo(...)`
# We need to change the name of `const students = useMemo` to just `const activeStudents = useMemo` maybe? Wait.
# `students` from useData is called `students`. In App.tsx:
# `const students = useMemo(() => { ...` this clashes with `const { students } = useData();`
