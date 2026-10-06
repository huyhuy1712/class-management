export const formatExamDateTime = (dateString) => {
  if (!dateString) return '---'

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return '---'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}