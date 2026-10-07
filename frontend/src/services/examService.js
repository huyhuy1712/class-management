import api from './api'

const examService = {
  getMyExams: async () => {
    const response = await api.get('/exams')
    return response.data
  },

  updateExam: async (examId, payload) => {
    const response = await api.put(`/exams/${examId}`, payload)
    return response.data
  },

  deleteExam: async (examId, force = false) => {
    await api.delete(`/exams/${examId}`, {
      params: force ? { force: true } : undefined,
    })
  },
}

export default examService