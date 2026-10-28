// Successful writes only invalidate related server data; UI/form state stays local.
export function mutationResources(url, method) {
  if (!['post', 'put', 'patch', 'delete'].includes(String(method).toLowerCase())) return []
  const path = String(url ?? '').split('?')[0]
  if (/^\/exam-attempts\/[^/]+\/answers$/.test(path)) return []
  if (/^\/(exam-attempts|exam-assignments)(?:\/|$)/.test(path)) return ['studentExams', 'studentAssignment', 'examAttemptResult', 'examCount', 'dashboard', 'exams', 'classExams', 'teacherAssignmentAttempts', 'teacherAssignmentExport', 'studentClassExamResults', 'classGradebook', 'teacherAttemptReview', 'studentGrades']
  if (/^\/notifications(?:\/|$)/.test(path)) return ['notifications']
  if (/^\/billing\/vip\/redeem$/.test(path)) return ['billing']
  if (/^\/requests(?:\/|$)/.test(path)) return ['requests', 'studentGrades', 'notifications', 'studentClasses', 'teacherClasses', 'classStudents', 'teacherStudents', 'dashboard']
  if (/^\/classes\/[^/]+\/attendances(?:\/|$)/.test(path)) return ['attendances', 'dashboard']
  if (/^\/classes\/[^/]+\/lessons(?:\/|$)/.test(path)) return ['lessons']
  if (/^\/classes\/[^/]+\/feed\/posts(?:\/|$)/.test(path)) return ['classFeedPosts']
  if (/^\/materials(?:\/|$)/.test(path)) return ['teacherMaterials', 'classDocuments']
  if (/^\/homework-assignments(?:\/|$)/.test(path)) return ['teacherHomeworks', 'teacherHomework', 'homeworkSubmissions', 'classHomeworks', 'studentHomeworks', 'studentHomework']
  if (/^\/classes(?:\/|$)/.test(path)) {
    const resources = ['teacherClasses', 'studentClasses', 'allClasses', 'classStudents', 'teacherStudents', 'dashboard', 'exams', 'studentExams', 'studentAssignment', 'classExams', 'studentClassExamResults', 'classGradebook', 'teacherAttemptReview', 'studentGrades']
    const removesClassStudents = String(method).toLowerCase() === 'delete'
      && /^\/classes\/[^/]+\/students(?:\/[^/]+)?$/.test(path)
    return removesClassStudents ? [...resources, 'teacherMaterials'] : resources
  }
  if (/^\/exams(?:\/|$)/.test(path)) return ['exams', 'examDetail', 'examConfiguration', 'examCount', 'dashboard', 'studentExams', 'studentAssignment', 'classExams', 'teacherAssignmentAttempts', 'teacherAssignmentExport', 'studentClassExamResults', 'classGradebook', 'teacherAttemptReview', 'studentGrades']
  if (/^\/users(?:\/|$)/.test(path)) return ['profile', 'teacherStudents', 'classStudents', 'studentDirectory', 'teachers', 'dashboard']
  return []
}

export function isAffectedQuery(queryKey, url, method) {
  if (queryKey[0] !== 'account' || !mutationResources(url, method).includes(queryKey[2])) return false
  const classId = /^\/classes\/([^/]+)/.exec(String(url))?.[1]
  if (classId && queryKey[2] === 'classFeedPosts') return String(queryKey[3]) === classId
  if (classId && ['classStudents', 'attendances', 'lessons'].includes(queryKey[2])) return String(queryKey[3]) === classId
  const examId = /^\/exams\/([^/]+)/.exec(String(url))?.[1]
  if (examId && ['examDetail', 'examConfiguration'].includes(queryKey[2])) return String(queryKey[3]) === examId
  const homeworkId = /^\/homework-assignments\/(\d+)/.exec(String(url))?.[1]
  if (homeworkId && ['teacherHomework', 'homeworkSubmissions', 'studentHomework'].includes(queryKey[2])) return String(queryKey[3]) === homeworkId
  if (queryKey[2] === 'classHomeworks') return true
  if (/^\/homework-assignments\/\d+/.test(String(url)) && ['teacherHomeworks', 'studentHomeworks'].includes(queryKey[2])) return true
  if (/^\/homework-assignments(?:\/me)?$/.test(String(url)) && ['teacherHomeworks', 'studentHomeworks'].includes(queryKey[2])) return true
  return true
}
