import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

new_block = """                      const payloads = nsList.map((ns, i) => {
                        const id = ns['রেজিস্ট্রেশন/আইডি'] || ns['আবেদন নং'] || (Math.floor(Math.random() * 900000 + 100000).toString() + '-' + i);
                        return { id, "রেজিস্ট্রেশন/আইডি নম্বর": id, ...ns, updated_at: new Date().toISOString() };
                      });"""

content = re.sub(r'const payloads = nsList\.map\(\(ns, i\) => \{.*?\n.*?return \{ student_id: id, data: ns, updated_at: new Date\(\)\.toISOString\(\) \};\n.*?\}\);', new_block, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
