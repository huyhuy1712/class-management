import assert from 'node:assert/strict'
import { test } from 'node:test'
import ExcelJS from 'exceljs'
import { assignmentGradeWorkbook } from '../src/pages/teacher/exams/helpers/assignmentGradeWorkbook.js'
import { buildAssignmentGradeExport } from '../src/pages/teacher/exams/helpers/assignmentGradeExport.js'

test('styled XLSX preserves numeric scores and text, normal scrolling and filter', async () => {
  const report = buildAssignmentGradeExport([
    { studentCode: 'ST-1', fullName: '=HYPERLINK("test")', status: 'GRADED', totalScore: 8.125, attemptNumber: 1 },
    { studentCode: 'ST-2', fullName: 'Nguyễn An', status: 'NOT_STARTED' },
  ], 10)
  const bytes = await assignmentGradeWorkbook(report, 'KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG NĂM 2025', 10, 10)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(bytes)
  const sheet = workbook.getWorksheet('Bảng điểm')
  assert.equal(sheet.getCell('F16').value, 0)
  assert.equal(sheet.getCell('F17').value, 8.125)
  assert.equal(sheet.getCell('C17').value, '=HYPERLINK("test")')
  assert.equal(sheet.getCell('F17').type, ExcelJS.ValueType.Number)
  assert.equal(sheet.getCell('C17').type, ExcelJS.ValueType.String)
  assert.equal(sheet.views[0].state, 'normal')
  assert.equal(sheet.views[0].ySplit, undefined)
  assert.equal(sheet.getColumn(3).width, 34)
  assert.equal(sheet.autoFilter, 'A15:I17')
  assert.equal(sheet.getCell('F16').font.color.argb, 'FFDC2626')
  assert.equal(sheet.getCell('F17').font.color.argb, 'FF047857')
})
