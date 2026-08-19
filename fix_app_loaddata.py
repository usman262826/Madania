import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# I want to find the loadAllData function and rewrite it
new_loadAllData = """
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      setBaseStudents(contextStudents || []);
      setPending([]);
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseLoading) {
      setBaseStudents(contextStudents || []);
      setIsLoading(false);
    }
  }, [contextStudents, isSupabaseLoading]);
"""

content = re.sub(r'const loadAllData = async \(\) => \{.*?\};', new_loadAllData, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
