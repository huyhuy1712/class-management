export function getCurrentAcademicYear() {
  const currentYear = new Date().getFullYear()

  return `${currentYear}-${currentYear + 1}`
}

export function getErrorMessage(responseData) {
  if (!responseData) return ''

  if (typeof responseData === 'string') return responseData
  if (responseData.message) return responseData.message
  if (responseData.error) return responseData.error

  if (responseData.errors) {
    return Object.values(responseData.errors).flat().join(' ')
  }

  return JSON.stringify(responseData)
}

export function isDuplicateClassCodeError(status, message) {
  return (
    status === 409 ||
    /mã lớp|class.?code|code.*(exist|duplicate|unique)|already exists|duplicate|đã tồn tại/i.test(
      message,
    )
  )
}
