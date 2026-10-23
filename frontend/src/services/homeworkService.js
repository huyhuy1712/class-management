import api from './api'

const homeworkService = {
  create: async (homework) => {
    const body = new FormData()
    body.append('title', homework.title)
    body.append('instructions', homework.instructions ?? '')
    body.append('assignmentType', homework.assignmentType)
    body.append('maxScore', String(homework.maxScore))
    if (homework.dueAt) body.append('dueAt', homework.dueAt)
    homework.classIds?.forEach((id) => body.append('classIds', String(id)))
    homework.studentIds?.forEach((id) => body.append('studentIds', String(id)))
    if (homework.file) body.append('file', homework.file)
    return (await api.post('/homework-assignments', body)).data
  },
  getTeacherList: async (classId, options = {}) =>
    (await api.get(classId ? `/homework-assignments/classes/${classId}` : '/homework-assignments', options)).data,
  getTeacherDetail: async (id, options = {}) =>
    (await api.get(`/homework-assignments/${id}`, options)).data,
  getSubmissions: async (id, classId, options = {}) =>
    (await api.get(`/homework-assignments/${id}/submissions`, { ...options, params: classId ? { classId } : undefined })).data,
  updateDeadline: async (id, dueAt) =>
    (await api.put(`/homework-assignments/${id}/deadline`, { dueAt: dueAt || null })).data,
  reopenSubmission: async (id, studentId) =>
    (await api.post(`/homework-assignments/${id}/submissions/${studentId}/reopen`)).data,
  gradeSubmission: async (id, studentId, score, teacherComment) =>
    (await api.put(`/homework-assignments/${id}/submissions/${studentId}/grade`, { score: Number(score), teacherComment })).data,
  getStudentList: async (options = {}) =>
    (await api.get('/homework-assignments/me', options)).data,
  getStudentDetail: async (id, options = {}) =>
    (await api.get(`/homework-assignments/${id}/me`, options)).data,
  submit: async (id, answerText, images) => {
    const body = new FormData()
    if (answerText) body.append('answerText', answerText)
    images?.forEach((image) => body.append('images', image))
    return (await api.put(`/homework-assignments/${id}/submission`, body)).data
  },
}

export default homeworkService
