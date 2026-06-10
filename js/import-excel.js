import { defaultData } from './storage.js';

import { generateId } from './utils.js';

import { parsePriority, parseStatus, parseAttendance } from './i18n.js';

import { normalizeMilestones } from './storage.js';



function parseWorkbookXml(xmlText) {

  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');

  if (doc.querySelector('parsererror')) {

    throw new Error('File Excel tidak valid');

  }



  const sheets = {};

  const worksheets = doc.getElementsByTagNameNS

    ? [...doc.getElementsByTagName('*')].filter(el => el.localName === 'Worksheet')

    : [...doc.querySelectorAll('Worksheet')];



  worksheets.forEach(ws => {

    const name = ws.getAttribute('ss:Name') || ws.getAttribute('Name') || 'Sheet';

    const rows = [];

    const rowEls = [...ws.getElementsByTagName('*')].filter(el => el.localName === 'Row');



    rowEls.forEach(row => {

      const cells = [];

      const cellEls = [...row.getElementsByTagName('*')].filter(el => el.localName === 'Cell');

      cellEls.forEach(cell => {

        const dataEl = [...cell.getElementsByTagName('*')].find(el => el.localName === 'Data');

        cells.push(dataEl?.textContent?.trim() ?? '');

      });

      if (cells.some(c => c !== '')) rows.push(cells);

    });



    sheets[name] = rows;

  });



  return sheets;

}



function rowsToObjects(rows) {

  if (!rows || rows.length < 2) return [];

  const headers = rows[0];

  return rows.slice(1).filter(r => r.some(c => c !== '')).map(row => {

    const obj = {};

    headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });

    return obj;

  });

}



function parseProfileSheet(rows) {

  const profile = {};

  rows.slice(1).forEach(row => {

    const key = row[0];

    const val = row[1];

    if (!key) return;

    if (key === 'Semester') profile.semester = parseInt(val, 10) || 1;

    else if (key === 'Nama') profile.name = val;

    else if (key === 'NIM') profile.studentId = val;

    else if (key === 'Program Studi') profile.major = val;

    else if (key === 'Email') profile.email = val;

  });

  return profile;

}



function parseGoalsSheet(rows) {

  const goals = { ...defaultData.goals };

  const milestones = [];

  let inMilestones = true;



  for (let i = 1; i < rows.length; i++) {

    const row = rows[i];

    if (!row[0] && !row[1]) continue;

    if (row[0] === 'Target IP') {

      inMilestones = false;

      if (rows[i + 1]) {

        goals.targetGPA = parseFloat(rows[i + 1][0]) || goals.targetGPA;

        goals.targetCGPA = parseFloat(rows[i + 1][1]) || goals.targetCGPA;

        goals.graduationDate = rows[i + 1][2] || goals.graduationDate;

      }

      break;

    }

    if (inMilestones && row[0] !== 'Pencapaian') {
      const type = row[1] || 'numeric';
      const target = parseFloat(row[2]) || (type === 'checkbox' ? 1 : 0);
      const completed = row[4] === 'Ya';
      const unitCol = (row[5] || '').trim();
      const autoKeyCol = (row[6] || '').trim();

      const item = {
        id: generateId(),
        title: row[0],
        type,
        target,
        current: type === 'checkbox'
          ? (completed ? 1 : 0)
          : (parseFloat(row[3]) || 0),
        completed
      };

      if (type === 'auto') {
        item.autoKey = autoKeyCol || (/SKS|kredit/i.test(item.title) ? 'sks' : 'ip');
      } else if (type === 'numeric') {
        item.unit = unitCol || (target >= 10000 ? 'currency' : 'number');
      }

      milestones.push(item);
    }

  }



  goals.milestones = normalizeMilestones(milestones.length ? milestones : defaultData.goals.milestones);

  return goals;

}



export function importDataFromExcel(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = (e) => {

      try {

        const sheets = parseWorkbookXml(e.target.result);

        const current = structuredClone(defaultData);



        if (sheets['Profil']) {

          Object.assign(current.profile, parseProfileSheet(sheets['Profil']));

        }



        if (sheets['Mata Kuliah']) {

          const objs = rowsToObjects(sheets['Mata Kuliah']);

          current.courses = objs.map(r => ({

            id: generateId(),

            name: r['Nama'] || r.Nama || '',

            credits: parseInt(r['SKS'] || r.SKS, 10) || 3,

            grade: r['Nilai'] || r.Nilai || 'A',

            semester: parseInt(r['Semester'] || r.Semester, 10) || 1

          })).filter(c => c.name);

        }



        if (sheets['Jadwal Kuliah']) {

          const objs = rowsToObjects(sheets['Jadwal Kuliah']);

          current.schedule = objs.map(r => ({

            id: generateId(),

            courseName: r['Mata Kuliah'] || '',

            lecturer: r['Dosen'] || '',

            day: r['Hari'] || '',

            startTime: r['Mulai'] || '08:00',

            endTime: r['Selesai'] || '10:00',

            mode: (r['Mode'] || '').toLowerCase() === 'online' ? 'online' : 'offline',

            room: r['Ruang'] || ''

          })).filter(s => s.courseName);

        }



        if (sheets['Tugas']) {

          const objs = rowsToObjects(sheets['Tugas']);

          current.assignments = objs.map(r => ({

            id: generateId(),

            title: r['Judul'] || '',

            course: r['Mata Kuliah'] || '',

            deadline: r['Tenggat'] || '',

            priority: parsePriority(r['Prioritas'] || ''),

            status: parseStatus(r['Status'] || ''),

            description: r['Deskripsi'] || ''

          })).filter(a => a.title);

        }



        if (sheets['Keuangan']) {

          const objs = rowsToObjects(sheets['Keuangan']);

          current.transactions = objs.map(r => ({

            id: generateId(),

            title: r['Judul'] || '',

            type: (r['Tipe'] || '').toLowerCase().includes('pemasukan') ? 'income' : 'expense',

            amount: parseInt(r['Jumlah'], 10) || 0,

            category: r['Kategori'] || 'Lainnya',

            date: r['Tanggal'] || new Date().toISOString().split('T')[0],

            description: r['Catatan'] || ''

          })).filter(t => t.title);

        }



        if (sheets['Kehadiran']) {

          const objs = rowsToObjects(sheets['Kehadiran']);

          current.attendance = objs.map(r => ({

            id: generateId(),

            course: r['Mata Kuliah'] || '',

            date: r['Tanggal'] || '',

            status: parseAttendance(r['Status'] || '')

          })).filter(a => a.course);

        }



        if (sheets['Pencapaian']) {

          current.goals = parseGoalsSheet(sheets['Pencapaian']);

        }



        resolve(current);

      } catch (err) {

        reject(new Error(err.message || 'Gagal memproses file Excel'));

      }

    };

    reader.onerror = () => reject(new Error('Gagal membaca file'));

    reader.readAsText(file);

  });

}


