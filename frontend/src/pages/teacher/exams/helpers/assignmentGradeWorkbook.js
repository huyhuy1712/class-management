import { attemptLabels } from './assignmentAttemptHelpers.js'

export async function assignmentGradeWorkbook(report, title, assignmentId, maxScore) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'FrogH'
  const sheet = workbook.addWorksheet('Bảng điểm', {
    views: [{ state: 'normal', showGridLines: false }],
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '15:15' },
  })
  sheet.columns = [8, 18, 34, 10, 24, 12, 14, 14, 40].map((width) => ({ width }))
  const fill = (color) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: color } })
  const merged = (range, value, color, size = 12, background) => {
    sheet.mergeCells(range)
    const cell = sheet.getCell(range.split(':')[0])
    cell.value = value
    cell.font = { name: 'Calibri', size, bold: true, color: { argb: color } }
    cell.alignment = { vertical: 'middle', wrapText: true }
    if (background) cell.fill = fill(background)
  }
  merged('A1:I1', 'FrogH • BẢNG ĐIỂM ĐỢT GIAO', 'FFFFFFFF', 20, 'FF047857')
  sheet.getRow(1).height = 42
  merged('A2:I3', title, 'FF064E3B', 16, 'FFECFDF5')
  sheet.getRow(2).height = 28
  sheet.getRow(3).height = 24
  merged('A4:I4', `Đợt #${assignmentId}   •   Tổng điểm: ${maxScore}   •   ${report.rows.length} học sinh   •   Điểm tăng dần`, 'FF475569')
  sheet.getRow(4).height = 28
  merged('A6:I6', 'THỐNG KÊ KẾT QUẢ • THANG 10', 'FF065F46', 12, 'FFD1FAE5')
  sheet.getRow(6).height = 28
  const s = report.summary
  const metrics = [
    ['Điểm trung bình /10', s.average ?? '—', 'Giỏi (≥ 8)', s.excellent],
    ['Mốt /10', s.modes.length ? s.modes.join('; ') : 'Không có mốt', 'Khá (6,5 đến dưới 8)', s.good],
    ['Số HS tính thống kê', s.count, 'Trung bình (5 đến dưới 6,5)', s.averageCount],
    ['Đang làm / chờ chấm', s.pending, 'Yếu (dưới 5)', s.weak],
  ]
  metrics.forEach(([label, value, band, count], index) => {
    const row = index + 7
    merged(`A${row}:C${row}`, label, 'FF475569', 11)
    merged(`D${row}:E${row}`, value, 'FF047857', 13, 'FFF0FDF4')
    merged(`F${row}:H${row}`, band, 'FF475569', 11)
    const cell = sheet.getCell(`I${row}`)
    cell.value = count
    cell.font = { name: 'Calibri', bold: true, size: 13, color: { argb: 'FF047857' } }
    cell.fill = fill('FFF0FDF4')
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    sheet.getRow(row).height = 28
  })
  merged('A12:I13', 'Chưa làm = 0. Thống kê quy đổi thang 10. Bài đang làm/chờ chấm không tính thống kê; điểm nếu có là tạm tính.', 'FF64748B', 11, 'FFF8FAFC')
  sheet.getRow(12).height = 22
  sheet.getRow(13).height = 22
  const header = sheet.getRow(15)
  header.values = ['STT', 'Mã học sinh', 'Họ tên', 'Lượt', 'Trạng thái', 'Điểm', 'Tổng điểm', 'Điểm /10', 'Ghi chú']
  header.height = 32
  header.eachCell((cell) => {
    cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = fill('FF047857')
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  report.rows.forEach((item, index) => {
    const row = sheet.getRow(index + 16)
    // Strings remain text cells, never formulas, even if a name starts with '='.
    row.values = [index + 1, item.studentCode ?? '', item.fullName ?? '', item.attemptNumber ?? 0,
      attemptLabels[item.status] ?? item.status, item.score, Number(maxScore), item.onTen,
      item.status === 'NOT_STARTED' ? 'Chưa làm, tính 0' : item.final ? '' : 'Điểm tạm tính, chưa tính thống kê']
    row.height = 34
    row.eachCell({ includeEmpty: true }, (cell, column) => {
      cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF334155' } }
      cell.fill = fill(index % 2 ? 'FFF0FDF4' : 'FFFFFFFF')
      cell.alignment = { vertical: 'middle', horizontal: [1, 4, 6, 7, 8].includes(column) ? 'center' : 'left', wrapText: true }
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } }
      if ([6, 7, 8].includes(column)) cell.numFmt = '0.###'
      if ([6, 8].includes(column) && item.onTen != null) cell.font = { ...cell.font, bold: true, color: { argb: item.onTen < 5 ? 'FFDC2626' : 'FF047857' } }
    })
  })
  sheet.autoFilter = { from: 'A15', to: `I${Math.max(15, report.rows.length + 15)}` }
  sheet.pageSetup.printArea = `A1:I${Math.max(15, report.rows.length + 15)}`
  sheet.headerFooter.oddFooter = '&LFrogH&CTrang &P / &N'
  return workbook.xlsx.writeBuffer()
}
