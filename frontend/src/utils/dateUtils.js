export const formatDate = (dateString) => {
  if (!dateString) return '---'

  const value = String(dateString)
  const datePart = value.split('T')[0]
  const [year, month, day] = datePart.split('-')

  if (!year || !month || !day) return value

  return `${day}/${month}/${year}`
}

export const parseDisplayDate = (value) => {
  const match = String(value ?? '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const [, day, month, year] = match
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day))

  if (
    parsedDate.getFullYear() !== Number(year) ||
    parsedDate.getMonth() !== Number(month) - 1 ||
    parsedDate.getDate() !== Number(day)
  ) {
    return null
  }

  return `${year}-${month}-${day}`
}

export const getTodayDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const getCurrentAcademicYear = (date = new Date()) => {
  const year = date.getFullYear()

  return `${year}-${year + 1}`
}

export const formatDashboardDate = (date = new Date()) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)

export const getTimeBasedGreeting = (date = new Date()) => {
  const hour = date.getHours()

  if (hour < 12) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}