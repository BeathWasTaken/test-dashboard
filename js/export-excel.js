import { tStatus, tPriority, tAttendance } from './i18n.js';

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cell(value, type = 'String') {
  const content = type === 'Number' ? Number(value) || 0 : escapeXml(value);
  return `<Cell><Data ss:Type="${type}">${content}</Data></Cell>`;
}

function headerRow(labels) {
  return `<Row>${labels.map(l => cell(l)).join('')}</Row>`;
}

function dataRow(values, types) {
  return `<Row>${values.map((v, i) => cell(v, types?.[i] || (typeof v === 'number' ? 'Number' : 'String'))).join('')}</Row>`;
}

function worksheet(name, rows) {
  return `
    <Worksheet ss:Name="${escapeXml(name)}">
      <Table>
        ${rows.join('')}
      </Table>
    </Worksheet>
  `;
}

export function exportDataToExcel(data) {
  const sheets = [];
  const { profile, courses, schedule, assignments, transactions, attendance, goals } = data;

  sheets.push(worksheet('Profil', [
    headerRow(['Field', 'Nilai']),
    dataRow(['Nama', profile.name]),
    dataRow(['NIM', profile.studentId]),
    dataRow(['Program Studi', profile.major]),
    dataRow(['Semester', profile.semester], ['String', 'Number']),
    dataRow(['Email', profile.email])
  ]));

  sheets.push(worksheet('Mata Kuliah', [
    headerRow(['Nama', 'SKS', 'Nilai', 'Semester']),
    ...courses.map(c => dataRow([c.name, c.credits, c.grade, c.semester], ['String', 'Number', 'String', 'Number']))
  ]));

  sheets.push(worksheet('Jadwal Kuliah', [
    headerRow(['Mata Kuliah', 'Dosen', 'Hari', 'Mulai', 'Selesai', 'Mode', 'Ruang']),
    ...schedule.map(s => dataRow([
      s.courseName, s.lecturer, s.day, s.startTime, s.endTime,
      s.mode === 'online' ? 'Online' : 'Offline', s.room || ''
    ]))
  ]));

  sheets.push(worksheet('Tugas', [
    headerRow(['Judul', 'Mata Kuliah', 'Tenggat', 'Prioritas', 'Status', 'Deskripsi']),
    ...assignments.map(a => dataRow([
      a.title, a.course, a.deadline, tPriority(a.priority), tStatus(a.status), a.description || ''
    ]))
  ]));

  sheets.push(worksheet('Keuangan', [
    headerRow(['Judul', 'Tipe', 'Jumlah', 'Kategori', 'Tanggal', 'Catatan']),
    ...(transactions || []).map(t => dataRow([
      t.title, t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      t.amount, t.category, t.date, t.description || ''
    ], ['String', 'String', 'Number', 'String', 'String', 'String']))
  ]));

  sheets.push(worksheet('Kehadiran', [
    headerRow(['Mata Kuliah', 'Tanggal', 'Status']),
    ...attendance.map(a => dataRow([a.course, a.date, tAttendance(a.status)]))
  ]));

  const milestoneRows = [
    headerRow(['Pencapaian', 'Tipe', 'Target', 'Progres', 'Selesai', 'Unit', 'Kunci Otomatis']),
    ...(goals.milestones || []).map(m => dataRow([
      m.title, m.type || 'numeric', m.target, m.current, m.completed ? 'Ya' : 'Tidak',
      m.unit || '', m.autoKey || ''
    ], ['String', 'String', 'Number', 'Number', 'String', 'String', 'String']))
  ];
  milestoneRows.push(dataRow([]));
  milestoneRows.push(headerRow(['Target IP', 'Target IPK', 'Tanggal Kelulusan']));
  milestoneRows.push(dataRow([goals.targetGPA, goals.targetCGPA, goals.graduationDate], ['Number', 'Number', 'String']));
  sheets.push(worksheet('Pencapaian', milestoneRows));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${sheets.join('')}
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `campusify-${new Date().toISOString().split('T')[0]}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}
