// Successful writes only invalidate related server data; UI/form state stays local.
export function mutationResources(url, method) {
  if (!['post', 'put', 'patch', 'delete'].includes(String(method).toLowerCase())) return []
  const path = String(url ?? '').split('?')[0]
  if (/^\/notifications(?:\/|$)/.test(path)) return ['notifications']
  if (/^\/requests(?:\/|$)/.test(path)) return ['requests', 'notifications', 'studentClasses', 'teacherClasses', 'classStudents', 'teacherStudents', 'dashboard']
  if (/^\/classes\/[^/]+\/attendances(?:\/|$)/.test(path)) return ['attendances', 'dashboard']
  if (/^\/classes\/[^/]+\/lessons(?:\/|$)/.test(path)) return ['lessons']
  if (/^\/classes(?:\/|$)/.test(path)) return ['teacherClasses', 'studentClasses', 'allClasses', 'classStudents', 'teacherStudents', 'dashboard', 'exams']
  if (/^\/exams(?:\/|$)/.test(path)) return ['exams', 'examDetail', 'examConfiguration', 'examCount', 'dashboard', 'studentExams']
  if (/^\/users(?:\/|$)/.test(path)) return ['profile', 'teacherStudents', 'classStudents', 'studentDirectory', 'teachers', 'dashboard']
  return []
}

export function isAffectedQuery(queryKey, url, method) {
  if (queryKey[0] !== 'account' || !mutationResources(url, method).includes(queryKey[2])) return false
  const classId = /^\/classes\/([^/]+)/.exec(String(url))?.[1]
  if (classId && ['classStudents', 'attendances', 'lessons'].includes(queryKey[2])) return String(queryKey[3]) === classId
  const examId = /^\/exams\/([^/]+)/.exec(String(url))?.[1]
  if (examId && ['examDetail', 'examConfiguration'].includes(queryKey[2])) return String(queryKey[3]) === examId
  return true
}
