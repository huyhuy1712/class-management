export function routeQueries(path, userId, date) {
  const [pathname, search = ''] = path.split('?')
  const attemptReview = /^\/teacher\/exams\/[^/]+\/assignments\/[^/]+\/attempts\/([^/]+)$/.exec(pathname)
  if (attemptReview) return [['teacherAttemptReview', [attemptReview[1]]]]
  const studentDetail = /^\/teacher\/classes\/([^/]+)\/students\/([^/]+)$/.exec(pathname)
  if (studentDetail) return [['classStudents', [studentDetail[1]]], ['studentClassExamResults', [studentDetail[1], studentDetail[2]]], ['attendances', [studentDetail[1]]]]
  const assignment = /^\/teacher\/exams\/([^/]+)\/assignments\/([^/]+)$/.exec(pathname)
  if (assignment) return [['examConfiguration', [assignment[1]]], ['teacherAssignmentAttempts', [assignment[2], new URLSearchParams(search).get('classId') ?? '', 0, 12, '', '', 'newest']]]
  const classExams = /^\/teacher\/classes\/([^/]+)\/assignments$/.exec(path)
  if (classExams) return [['teacherClasses', []], ['classExams', [classExams[1]]]]
  if (pathname === '/student/grades') return [['studentGrades', ['', '', '', '', '', '', 'newest', 0]]]
  const gradebook = /^\/teacher\/classes\/([^/]+)\/grades$/.exec(pathname)
  if (gradebook) return [['classGradebook', [gradebook[1], 0, '', '']], ['subjects', []]]
  const pages = {
    '/teacher': ['teacherClasses', 'teacherStudents', 'exams'],
    '/teacher/classes': ['teacherClasses'],
    '/teacher/exams': ['exams'],
    '/teacher/exams/create': ['subjects', 'teacherClasses', 'teacherStudents'],
    '/student': ['studentClasses', 'dashboard', 'examCount'],
    '/student/classes': ['studentClasses', 'dashboard'],
    '/student/teachers': ['studentClasses', 'allClasses', 'teachers'],
    '/student/exams': ['studentClasses', 'studentExams'],
  }
  if (/^\/(teacher|student)\/profile$/.test(path)) return [['profile', [userId]]]
  const studentAssignment = /^\/student\/exams\/([^/]+)$/.exec(path)
  const attempt = /^\/student\/exam-attempts\/([^/]+)(\/result)?$/.exec(path)
  if (attempt) return [[attempt[2] ? 'examAttemptResult' : 'examAttempt', [attempt[1]]]]
  if (studentAssignment) return [['studentAssignment', [studentAssignment[1]]]]
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
