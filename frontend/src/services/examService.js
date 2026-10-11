import api from './api'

const examService = {
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
