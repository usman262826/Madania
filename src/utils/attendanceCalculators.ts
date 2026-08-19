import { 
  AttendanceMarkingCriteria, 
  StudentAttendanceRecord, 
  TeacherAttendanceRecord, 
  TeacherSalaryRule, 
  TeacherMonthlySalary,
  StaffAttendanceRecord,
  StaffLeaveRequest,
  StaffLeaveBalance,
  StaffMonthlySalary
} from '../types/attendance';
import { enToBnNumber } from '../lib/utils';

/**
 * Calculates student attendance mark based on criteria and status
 */
export function calculateStudentMark(
  status: 'present' | 'absent' | 'late' | 'leave' | 'half-day',
  criteria: AttendanceMarkingCriteria,
  attendanceDate: string,
  extra?: { isConsistentlyPresent?: boolean }
): number {
  if (!criteria) {
    // Default fallback
    if (status === 'present' || status === 'leave') return 100;
    if (status === 'late') return 75;
    if (status === 'half-day') return 50;
    return 0;
  }

  if (criteria.markingType === 'percentage' || criteria.markingType === 'fixed_points') {
    switch (status) {
      case 'present': return criteria.presentMark;
      case 'late': return criteria.lateMark;
      case 'absent': return criteria.absentMark;
      case 'half-day': return criteria.halfDayMark;
      case 'leave': return criteria.leaveMark;
      default: return 0;
    }
  }

  if (criteria.markingType === 'custom_formula' && criteria.customFormula) {
    try {
      const dateObj = new Date(attendanceDate);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = days[dateObj.getDay()] || 'Sunday';

      // Create executable function from customFormula
      // Extract function body or wrap safely
      let cleanCode = criteria.customFormula.trim();
      if (cleanCode.startsWith('function')) {
        const bodyStart = cleanCode.indexOf('{');
        const bodyEnd = cleanCode.lastIndexOf('}');
        if (bodyStart !== -1 && bodyEnd !== -1) {
          cleanCode = cleanCode.substring(bodyStart + 1, bodyEnd);
        }
      }
      
      const customFn = new Function('status', 'dayOfWeek', 'extra', cleanCode);
      const result = customFn(status, dayOfWeek, extra);
      const numResult = Number(result);
      return isNaN(numResult) ? criteria.presentMark : numResult;
    } catch (e) {
      console.warn('Custom formula execution fallback:', e);
      // Fallback
      if (status === 'present') return criteria.presentMark || 100;
      if (status === 'late') return criteria.lateMark || 75;
      if (status === 'half-day') return criteria.halfDayMark || 50;
      if (status === 'leave') return criteria.leaveMark || 100;
      return criteria.absentMark || 0;
    }
  }

  return 0;
}

/**
 * Calculates working hours from in_time and out_time strings (e.g. "08:00", "16:30")
 */
export function calculateWorkingHours(inTime?: string, outTime?: string): { workingHours: number; lateMinutes: number } {
  if (!inTime || !outTime) {
    return { workingHours: 8, lateMinutes: 0 };
  }

  try {
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);

    if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) {
      return { workingHours: 8, lateMinutes: 0 };
    }

    const inTotalMinutes = inH * 60 + inM;
    const outTotalMinutes = outH * 60 + outM;

    let diffMinutes = outTotalMinutes - inTotalMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Cross midnight safe

    const workingHours = Number((diffMinutes / 60).toFixed(2));
    
    // Expected standard start is 08:00 AM (480 mins)
    const standardStartMinutes = 8 * 60;
    const lateMinutes = Math.max(0, inTotalMinutes - standardStartMinutes);

    return { workingHours, lateMinutes };
  } catch {
    return { workingHours: 8, lateMinutes: 0 };
  }
}

/**
 * Calculates Teacher Monthly Salary from attendance records & salary rules
 */
export function calculateTeacherSalary(
  teacherId: string,
  teacherName: string,
  department: string,
  designation: string,
  month: string, // YYYY-MM
  attendanceRecords: TeacherAttendanceRecord[],
  rules: TeacherSalaryRule
): TeacherMonthlySalary {
  // Filter attendance records for this teacher and month
  const records = attendanceRecords.filter(
    r => r.teacherId === teacherId && r.attendanceDate.startsWith(month)
  );

  const stats = {
    present: records.filter(a => a.status === 'present').length,
    absent: records.filter(a => a.status === 'absent' && !a.isWeeklyOff).length,
    late: records.filter(a => a.status === 'late').length,
    leave: records.filter(a => a.status === 'leave').length,
    weeklyOff: records.filter(a => a.status === 'weekly_off' || a.isWeeklyOff).length,
    halfDay: records.filter(a => a.status === 'half-day').length,
    onDuty: records.filter(a => a.status === 'on-duty').length,
    totalWorkingHours: records.reduce((acc, r) => acc + (r.workingHours || 0), 0),
    totalOvertimeHours: 0,
    lateHours: 0
  };

  // Absence deduction
  const absentDeduction = stats.absent * (rules.dailyDeductionAbsent || 0);

  // Late deduction
  let lateDeduction = 0;
  records.filter(a => a.status === 'late').forEach(rec => {
    const { lateMinutes } = calculateWorkingHours(rec.inTime, rec.outTime);
    const hoursLate = lateMinutes > 0 ? lateMinutes / 60 : 0.5; // at least 30 mins if marked late
    stats.lateHours += Number(hoursLate.toFixed(2));
    lateDeduction += hoursLate * (rules.deductionPerHourLate || 150);
  });
  lateDeduction = Math.round(lateDeduction);

  // Attendance bonus (% of base salary if good attendance)
  const workingDays = stats.present + stats.late + stats.onDuty + (stats.halfDay * 0.5);
  let attendanceBonus = 0;
  if (stats.absent <= 1 && rules.attendanceBonusPercentage > 0) {
    attendanceBonus = Math.round((rules.baseSalary * rules.attendanceBonusPercentage) / 100);
  }

  // Perfect attendance bonus
  let perfectAttendanceBonus = 0;
  if (records.length > 0 && stats.absent === 0 && stats.late === 0 && stats.halfDay === 0) {
    perfectAttendanceBonus = rules.perfectAttendanceBonus || 0;
  }

  // Overtime pay
  let overtimePay = 0;
  records.forEach(rec => {
    const hours = rec.workingHours || 8;
    if (hours > rules.maxWorkingHours) {
      const ot = hours - rules.maxWorkingHours;
      stats.totalOvertimeHours += Number(ot.toFixed(2));
      overtimePay += ot * (rules.otRate || 150);
    }
  });
  overtimePay = Math.round(overtimePay);

  const totalDeduction = absentDeduction + lateDeduction;
  const totalAddition = attendanceBonus + perfectAttendanceBonus + overtimePay;
  const netSalary = Math.max(0, Math.round(rules.baseSalary - totalDeduction + totalAddition));

  return {
    id: `tsal-${teacherId}-${month}`,
    teacherId,
    teacherName,
    department,
    designation,
    month,
    baseSalary: rules.baseSalary,
    absentDeduction,
    lateDeduction,
    otherDeduction: 0,
    totalDeduction,
    attendanceBonus,
    perfectAttendanceBonus,
    overtimePay,
    otherAllowance: 0,
    totalAddition,
    netSalary,
    paymentStatus: 'pending',
    calculatedAt: new Date().toISOString(),
    breakdown: {
      workingDays,
      presentDays: stats.present,
      absentDays: stats.absent,
      lateDays: stats.late,
      leaveDays: stats.leave,
      weeklyOffDays: stats.weeklyOff,
      onDutyDays: stats.onDuty,
      halfDays: stats.halfDay,
      totalWorkingHours: Number(stats.totalWorkingHours.toFixed(1)),
      totalOvertimeHours: Number(stats.totalOvertimeHours.toFixed(1)),
      lateHours: Number(stats.lateHours.toFixed(1))
    }
  };
}

/**
 * Leave balance processor
 */
export function checkAndProcessLeave(
  staffId: string,
  leaveRequest: { leaveType: 'casual' | 'sick' | 'emergency' | 'unpaid'; daysApplied: number },
  currentBalance: StaffLeaveBalance
): { isValid: boolean; reason?: string } {
  if (leaveRequest.leaveType === 'unpaid') {
    return { isValid: true };
  }

  let available = 0;
  if (leaveRequest.leaveType === 'casual') available = currentBalance.casualLeaveBalance;
  else if (leaveRequest.leaveType === 'sick') available = currentBalance.sickLeaveBalance;
  else if (leaveRequest.leaveType === 'emergency') available = currentBalance.emergencyLeaveBalance;

  if (available < leaveRequest.daysApplied) {
    return {
      isValid: false,
      reason: `পর্যাপ্ত ছুটি অবশিষ্ট নেই! বরাদ্দ অবশিষ্ট: ${enToBnNumber(available)} দিন, আবেদনের দিন: ${enToBnNumber(leaveRequest.daysApplied)} দিন।`
    };
  }

  return { isValid: true };
}

/**
 * Generates Staff Payroll from records & leaves
 */
export function calculateStaffPayroll(
  staff: { id: string; name: string; designation: string; department?: string; salary?: number },
  month: string,
  attendanceRecords: StaffAttendanceRecord[],
  leaveRequests: StaffLeaveRequest[]
): StaffMonthlySalary {
  const baseSalary = Number(staff.salary) || 15000;
  const records = attendanceRecords.filter(r => r.staffId === staff.id && r.attendanceDate.startsWith(month));
  
  const absentDays = records.filter(r => r.status === 'absent').length;
  const lateDays = records.filter(r => r.status === 'late').length;
  
  // Unpaid leaves for this month
  const unpaidLeaves = leaveRequests.filter(
    l => l.staffId === staff.id && l.status === 'approved' && l.leaveType === 'unpaid' && l.startDate.startsWith(month)
  );
  const unpaidDays = unpaidLeaves.reduce((sum, l) => sum + l.daysApplied, 0);

  const dailyRate = Math.round(baseSalary / 30);
  const absentDeduction = absentDays * dailyRate;
  const lateDeduction = lateDays * Math.round(dailyRate * 0.25); // 1/4 day per late
  const leaveDeduction = unpaidDays * dailyRate;

  let totalOvertimeHours = 0;
  records.forEach(r => {
    if (r.overtimeHours && r.overtimeHours > 0) {
      totalOvertimeHours += r.overtimeHours;
    }
  });

  const otRate = 120; // 120 BDT per OT hour
  const overtimePay = Math.round(totalOvertimeHours * otRate);

  // Bonus for perfect attendance
  let bonus = 0;
  if (records.length >= 20 && absentDays === 0 && lateDays === 0) {
    bonus = 800;
  }

  const allowance = 0;
  const grossSalary = baseSalary + overtimePay + bonus + allowance;
  const totalDeductions = absentDeduction + lateDeduction + leaveDeduction;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    id: `staffsal-${staff.id}-${month}`,
    staffId: staff.id,
    staffName: staff.name,
    designation: staff.designation,
    department: staff.department || 'সাধারণ প্রশাসন',
    baseSalary,
    absentDays,
    absentDeduction,
    lateDays,
    lateDeduction,
    unpaidLeaveDays: unpaidDays,
    leaveDeduction,
    loanDeduction: 0,
    otherDeduction: 0,
    overtimeHours: totalOvertimeHours,
    overtimePay,
    bonus,
    allowance,
    grossSalary,
    netSalary,
    paymentStatus: 'pending',
    month,
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Generates SMS notification preview for Parent
 */
export function generateStudentAttendanceSMS(
  studentName: string,
  dateStr: string,
  status: string,
  marks: number,
  madrasahName: string = 'আল মাদানিয়া মাদ্রাসা'
): string {
  const statusBn = status === 'present' ? 'উপস্থিত' : status === 'absent' ? 'অনুপস্থিত' : status === 'late' ? 'দেরিতে উপস্থিত' : status === 'leave' ? 'ছুটিতে' : 'অর্ধদিবস';
  return `মুহতারাম, আপনার সন্তান ${studentName} আজ (${dateStr}) ${statusBn} ছিল। আজকের হাজিরা মূল্যায়ন: ${enToBnNumber(marks)} মার্কস। - ${madrasahName}`;
}
