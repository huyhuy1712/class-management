import { EXAM_ACCESS_TYPE, INITIAL_EXAM_FORM } from './examFormConstants.js'

const visibilityOptions = ['NEVER', 'AFTER_SUBMIT', 'AFTER_EXAM']

export function normalizeExamForm(savedForm = {}) {
  const form = Object.fromEntries(Object.keys(INITIAL_EXAM_FORM).map((key) => [
    key, savedForm[key] ?? INITIAL_EXAM_FORM[key],
  ]))
  for (const key of ['scoreVisibility', 'answerVisibility']) {
    if (!visibilityOptions.includes(form[key])) form[key] = INITIAL_EXAM_FORM[key]
  }
  return form
}

export function validateExamForm(form, accessType, classIds, studentIds) {
  const errors = {}
  for (const key of ['openTime', 'closeTime']) {
    if (form[key] && !Number.isFinite(new Date(form[key]).getTime())) errors[key] = 'Vui lòng nhập thời gian hợp lệ.'
  }
  if (form.openTime && form.closeTime && !errors.openTime && !errors.closeTime && new Date(form.closeTime) <= new Date(form.openTime)) errors.closeTime = 'Thời gian đóng phải sau thời gian mở.'
  const title = String(form.title ?? '').trim()
  if (!title) errors.title = 'Vui lòng nhập tên đề thi.'
  else if (title.length > 255) errors.title = 'Tên đề thi tối đa 255 ký tự.'
  if (!Number.isSafeInteger(Number(form.subjectId)) || Number(form.subjectId) <= 0) errors.subjectId = 'Vui lòng chọn môn học.'
  if (!String(form.gradeLevel ?? '').trim() || String(form.gradeLevel).length > 30) errors.gradeLevel = 'Vui lòng chọn khối / cấp độ hợp lệ.'
  if (String(form.description ?? '').length > 20000) errors.description = 'Mô tả tối đa 20000 ký tự.'
  if (String(form.purpose ?? '').length > 50) errors.purpose = 'Mục đích tối đa 50 ký tự.'
  for (const [key, minimum, message] of [
    ['timeLimit', 1, 'Thời gian làm bài phải là số nguyên từ 1 phút trở lên.'],
    ['maxAttempts', 0, 'Số lần làm phải là số nguyên từ 0 trở lên; 0 là không giới hạn.'],
  ]) {
    if (String(form[key] ?? '').trim() === '' || !Number.isInteger(Number(form[key])) || Number(form[key]) < minimum || Number(form[key]) > 2147483647) errors[key] = message
  }
  if (!visibilityOptions.includes(form.scoreVisibility)) errors.scoreVisibility = 'Vui lòng chọn thời điểm xem điểm hợp lệ.'
  if (!visibilityOptions.includes(form.answerVisibility)) errors.answerVisibility = 'Vui lòng chọn thời điểm xem đáp án hợp lệ.'
  if (accessType === EXAM_ACCESS_TYPE.CLASS && !classIds.length) errors.accessType = 'Vui lòng chọn ít nhất một lớp.'
  if (accessType === EXAM_ACCESS_TYPE.STUDENT && !studentIds.length) errors.accessType = 'Vui lòng chọn ít nhất một học sinh.'
  if (!Object.values(EXAM_ACCESS_TYPE).includes(accessType)) errors.accessType = 'Vui lòng chọn phạm vi giao đề.'
  const targetIds = accessType === EXAM_ACCESS_TYPE.CLASS ? classIds : accessType === EXAM_ACCESS_TYPE.STUDENT ? studentIds : []
  if (targetIds.some((id) => !Number.isSafeInteger(Number(id)) || Number(id) <= 0)) errors.accessType = 'Danh sách đối tượng chứa ID không hợp lệ.'
  if ((accessType === EXAM_ACCESS_TYPE.CLASS && classIds.length > 500) || (accessType === EXAM_ACCESS_TYPE.STUDENT && studentIds.length > 2000)) errors.accessType = 'Giới hạn giao đề là 500 lớp hoặc 2000 học sinh.'
  return errors
}
