export function routeQueries(path, userId, date) {
  const pages = {
    '/teacher': ['teacherClasses', 'teacherStudents', 'exams'],
    '/teacher/classes': ['teacherClasses'],
    '/teacher/exams': ['exams'],
    '/student': ['studentClasses', 'dashboard', 'examCount'],
    '/student/classes': ['studentClasses', 'dashboard'],
    '/student/teachers': ['studentClasses', 'allClasses', 'teachers'],
    '/student/exams': ['studentClasses'],
  }
  if (/^\/(teacher|student)\/profile$/.test(path)) return [['profile', [userId]]]
  const classroom = /^\/(teacher|student)\/classes\/([^/]+)(?:\/attendance)?$/.exec(path)
  if (classroom) {
    const [, role, id] = classroom
    const queries = [[role === 'student' ? 'studentClasses' : 'teacherClasses', []], ['classStudents', [id]]]
    if (role === 'student' || path.endsWith('/attendance')) queries.push(['attendances', [id]], ['lessons', [id, date]])
    return queries
  }
  const exam = /^\/teacher\/exams\/([^/]+)$/.exec(path)
  if (exam && exam[1] !== 'create') return [['examDetail', [exam[1]]], ['examConfiguration', [exam[1]]]]
  return (pages[path] ?? []).map((resource) => [resource, []])
}
