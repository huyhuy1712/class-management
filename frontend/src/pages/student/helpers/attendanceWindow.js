export function getAttendanceDate(now) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const value = (type) => parts.find((part) => part.type === type).value
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function isAttendanceOpen(lesson, now) {
  const timestamp = (value) => new Date(value && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}+07:00`).getTime()
  return lesson.lessonDate === getAttendanceDate(now) && now.getTime() >= timestamp(lesson.startTime) && now.getTime() <= timestamp(lesson.endTime)
}
