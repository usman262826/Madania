import re
import glob

for filepath in glob.glob('src/components/students/*.tsx'):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace currentOverrides logic with direct student update
    content = re.sub(
        r'const currentOverrides = \{ \.\.\.studentOverrides\[studentId\] \};\s*const updatedStudentData = \{\s*\.\.\.currentOverrides,',
        r'const updatedStudentData = { ...student,',
        content
    )
    
    content = re.sub(
        r'const currentOverrides = \{ \.\.\.studentOverrides\[sId\] \};\s*const updatedStudentData = \{\s*\.\.\.currentOverrides,',
        r'const updatedStudentData = { ...student,',
        content
    )

    content = re.sub(
        r'const currentOverrides = \{ \.\.\.studentOverrides\[String\(sId\)] \};\s*const updatedStudentData = \{\s*\.\.\.currentOverrides,',
        r'const updatedStudentData = { ...student,',
        content
    )

    with open(filepath, 'w') as f:
        f.write(content)

