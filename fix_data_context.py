import re

with open('src/contexts/DataContext.tsx', 'r') as f:
    content = f.read()

# I want to make sure the fetch result parsing is correct
# We need to set students, student_overrides, etc.
# Let me just grab the safeFetch block and replace it correctly.

start_idx = content.find('const [')
end_idx = content.find('const updateData = async')

if start_idx != -1 and end_idx != -1:
    new_block = """const [
        heads, 
        mapping, 
        inv, 
        staff, 
        exp, 
        overrides, 
        studs,
        sAtt, 
        stAtt, 
        depts,
        cls,
        brnch,
        sub,
        clsSub,
        tchrSub,
        exDt,
        evMt,
        tchrs
      ] = await Promise.all([
        safeFetch<any>('fee_heads', 'madrasah-fee-heads'),
        safeFetch<any>('class_fee_mappings', 'madrasah-class-fee-mapping'),
        safeFetch<any>('invoices', 'madrasah-invoices-db'),
        safeFetch<any>('staff_members', 'madrasah-staff-members-db'),
        safeFetch<any>('expenses', 'madrasah-expenses-db'),
        safeFetch<any>('student_overrides', 'madrasah-student-overrides'),
        safeFetch<Student>('students', 'madrasah-students-db'),
        safeFetch<any>('staff_attendance', 'madrasah-staff-attendance-db'),
        safeFetch<any>('student_attendance', 'madrasah-student-attendance-db'),
        // Academic tables
        safeFetch<AcademicDepartment>('acad_departments', 'acad_departments'),
        safeFetch<AcademicClass>('acad_classes', 'acad_classes'),
        safeFetch<AcademicBranch>('acad_branches', 'acad_branches'),
        safeFetch<AcademicSubject>('acad_subjects', 'acad_subjects'),
        safeFetch<AcademicClassSubject>('acad_class_subjects', 'acad_class_subjects'),
        safeFetch<AcademicTeacherSubject>('acad_teacher_subjects', 'acad_teacher_subjects'),
        safeFetch<AcademicExamDate>('acad_exam_dates', 'acad_exam_dates'),
        safeFetch<AcademicEvaluationMetric>('acad_eval_metrics', 'acad_eval_metrics'),
        safeFetch<any>('madrasa_teachers', 'madrasa_teachers'),
      ]);

      setFeeHeads(heads || []);
      
      const mappingObj: any = {};
      mapping?.forEach((row: any) => {
        mappingObj[row.class_name] = row.mapping;
      });
      setClassFeeMapping(mappingObj);

      setInvoices(inv || []);
      setStaffMembers(staff || []);
      setExpenses(exp || []);

      const overridesObj: any = {};
      overrides?.forEach((row: any) => {
        overridesObj[row.student_id] = row.data;
      });
      setStudentOverrides(overridesObj);
      setStudents(studs || []);

      const sAttObj: any = {};
      sAtt?.forEach((row: any) => {
        sAttObj[row.date] = row.data;
      });
      setStaffAttendance(sAttObj);

      const stAttObj: any = {};
      stAtt?.forEach((row: any) => {
        stAttObj[row.date] = row.data;
      });
      setStudentAttendance(stAttObj);
      
      setDepartments(depts || []);
      setClasses(cls || []);
      setBranches(brnch || []);
      setSubjects(sub || []);
      setClassSubjects(clsSub || []);
      setTeacherSubjects(tchrSub || []);
      setExamDates(exDt || []);
      setEvaluationMetrics(evMt || []);
      setTeachers(tchrs || []);
    } catch (error) {
      console.error('Error refreshing data from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  """
    
    content = content[:start_idx] + new_block + content[end_idx:]
    with open('src/contexts/DataContext.tsx', 'w') as f:
        f.write(content)
