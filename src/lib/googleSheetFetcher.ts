import { Student } from '../types';

export function parseCSV(csvText: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && csvText[i + 1] === '\n') {
        i++;
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return [];

  const splitCSVRow = (rowStr: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let inQ = false;
    for (let i = 0; i < rowStr.length; i++) {
      const c = rowStr[i];
      if (c === '"') {
        if (inQ && rowStr[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === ',' && !inQ) {
        fields.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const rawHeaders = splitCSVRow(lines[0]);
  const headers = rawHeaders.map(h => h.replace(/^"+|"+$/g, '').trim());

  const records: Record<string, string>[] = [];
  for (let l = 1; l < lines.length; l++) {
    const values = splitCSVRow(lines[l]);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      let val = values[idx] || '';
      val = val.replace(/^"+|"+$/g, '').trim();
      rec[h] = val;
    });
    records.push(rec);
  }

  return records;
}

export function mapCsvRowToStudent(row: Record<string, string>, defaultYear: string): Student {
  const regId = row['রেজিস্ট্রেশন/আইডি'] || row['রেজিস্ট্রেশন/আইডি নম্বর'] || row['id'] || row['reg'] || '';
  const rollNo = row['রোল নম্বর'] || row['রোল'] || row['roll'] || '';
  const studentName = row['শিক্ষার্থীর নাম'] || row['name'] || '';
  const fatherName = row['পিতার নাম'] || row['father'] || '';
  const motherName = row['মাতার নাম'] || row['mother'] || '';
  const mobile = row['মোবাইল (মা)'] || row['মোবাইল (বাবা/ভাই)'] || row['mobile'] || '';
  const birthReg = row['জন্ম নিবন্ধন নাম্বার'] || row['জন্ম নিবন্ধন'] || '';
  const dob = row['জন্ম তারিখ'] || '';
  const address = row['ঠিকানা'] || '';
  const jamat = row['জামাত'] || row['জামাত/শ্রেণী'] || '';
  const marhala = row['মারহালা'] || '';
  const somoman = row['জামাত/শ্রেণী'] || '';
  const status = row['শিক্ষার্থী ধরণ/স্ট্যাটাস'] || row['স্ট্যাটাস'] || 'সক্রিয়';
  const csvYear = row['শিক্ষাবর্ষ'] || defaultYear;

  return {
    id: String(regId),
    "রেজিস্ট্রেশন/আইডি নম্বর": String(regId),
    "রোল নম্বর": String(rollNo),
    "শিক্ষার্থীর নাম": studentName,
    "পিতার নাম": fatherName,
    "মাতার নাম": motherName,
    "মোবাইল (মা)": mobile,
    "মোবাইল (বাবা/ভাই)": mobile,
    "জন্ম নিবন্ধন": birthReg,
    "জন্ম তারিখ": dob,
    "ঠিকানা": address,
    "জামাত": jamat,
    "মারহালা": marhala,
    "সমমান": somoman,
    "স্ট্যাটাস": status,
    "শিক্ষার্থী ধরণ": status,
    "শিক্ষাবর্ষ": defaultYear,
    academicYearLabel: defaultYear,
    "প্রত্যয়ন পত্র নাম্বার": row['প্রত্যয়ন পত্র নাম্বার'] || '',
    "ভেরিফিকেশন লিংক": row['ভেরিফিকেশন লিংক'] || '',
    "QR CODE IMAGE": row['QR CODE IMAGE'] || row['QR CODE'] || '',
    isDeleted: false
  } as Student;
}

export async function fetchGoogleSheetStudents(sheetId: string, academicYear: string): Promise<Student[]> {
  if (!sheetId) return [];

  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

  let response: Response | null = null;
  try {
    response = await fetch(exportUrl);
    if (!response.ok) {
      response = await fetch(gvizUrl);
    }
  } catch {
    try {
      response = await fetch(gvizUrl);
    } catch {
      return [];
    }
  }

  if (!response || !response.ok) return [];

  const text = await response.text();
  const rows = parseCSV(text);

  return rows.map(r => mapCsvRowToStudent(r, academicYear));
}

/**
 * Calculates the next Registration ID globally / for the target academic year context.
 */
export function getNextRegistrationId(students: Student[]): string {
  let maxNum = 0;
  if (!Array.isArray(students)) return '1119';
  students.forEach(s => {
    if (!s) return;
    const idVal = s['রেজিস্ট্রেশন/আইডি নম্বর'] || s.id || s['রেজিস্ট্রেশন/আইডি'];
    if (idVal) {
      const match = String(idVal).match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  });

  if (maxNum === 0) {
    return '1119'; // Defaults to 1119 if 1118 was last in sheet
  }
  return String(maxNum + 1);
}

/**
 * Calculates the next Roll Number for a given Jamat in the selected academic year.
 */
export function getNextRollNumber(students: Student[], jamat: string, academicYear?: string): string {
  if (!jamat || !Array.isArray(students)) return '1';

  let maxRoll = 0;
  const targetJamat = jamat.trim().toLowerCase();

  students.forEach(s => {
    if (!s) return;
    // Check academic year match if provided
    if (academicYear) {
      const sYear = (s.academicYearLabel || s['শিক্ষাবর্ষ'] || '').trim();
      if (sYear && sYear !== academicYear.trim()) {
        return;
      }
    }

    const sJamat = (s['জামাত'] || s['জামাত/শ্রেণী'] || s.class || '').trim().toLowerCase();
    // Compare jamat names
    const matches = sJamat === targetJamat || 
      sJamat.includes(targetJamat) || 
      targetJamat.includes(sJamat) ||
      sJamat.replace(/\s+/g, '') === targetJamat.replace(/\s+/g, '');

    if (matches) {
      const rollVal = s['রোল নম্বর'] || s['রোল'] || s.rollNo || s.roll;
      if (rollVal) {
        const match = String(rollVal).match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num > maxRoll) {
            maxRoll = num;
          }
        }
      }
    }
  });

  return String(maxRoll + 1);
}
