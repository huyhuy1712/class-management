import api from './api'

const examService = {
  startAttempt: async (id, body) => (await api.post(`/exam-assignments/${id}/attempts`, body)).data,
  getAttempt: async (id, options = {}) => (await api.get(`/exam-attempts/${id}`, options)).data,
  saveAttempt: async (id, body) => (await api.put(`/exam-attempts/${id}/answers`, body)).data,
  submitAttempt: async (id, body) => (await api.post(`/exam-attempts/${id}/submit`, body)).data,
  getAttemptResult: async (id, options = {}) => (await api.get(`/exam-attempts/${id}/result`, options)).data,
  unpublishExam: async (examId) => {
    const response = await api.patch(`/exams/${examId}/unpublish`)
    return response.data
  },
  publishExam: async (examId) => {
    const response = await api.patch(`/exams/${examId}/publish`)
    return response.data
  },
  getStudentExams: async (options = {}, sort = 'newest') => {
    const items = []
    let result
    for (let page = 0; ; page++) {
      const response = await api.get('/users/me/exams', { ...options, params: { page, size: 100, sort } })
      result = response.data
      if (!Array.isArray(result?.items) || !Number.isFinite(result.totalElements)) throw new Error('Dữ liệu đề được giao không hợp lệ.')
      items.push(...result.items)
      if (items.length >= result.totalElements || result.items.length === 0) break
    }
    return { ...result, items }
  },
  getStudentAssignment: async (assignmentId, options = {}) => {
    const response = await api.get(`/exam-assignments/${assignmentId}`, options)
    return response.data
  },
  createExam: async (payload) => {
    const response = await api.post('/exams', payload)
    return response.data
  },
  getExamDetail: async (examId, options = {}) => {
    const response = await api.get(`/exams/${examId}`, options)
    return response.data
  },
  getExamConfiguration: async (examId, options = {}) => {
    const response = await api.get(`/exams/${examId}/configuration`, options)
    return response.data
  },
  getMyExams: async (options = {}) => {
    const response = await api.get('/exams', options)
    return response.data
  },

  updateExamConfiguration: async (examId, payload) => {
    const response = await api.put(`/exams/${examId}`, payload)
    return response.data
  },
  updateExamContent: async (examId, payload) => {
    const response = await api.put(`/exams/${examId}/content`, payload)
    return response.data
  },
  deleteExam: async (examId, force = false) => {
    await api.delete(`/exams/${examId}`, {
      params: force ? { force: true } : undefined,
    })
  },
}

export default examService
