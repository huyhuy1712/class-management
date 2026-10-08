import api from './api'

const examService = {
  createExam: async (payload) => {
    const response = await api.post('/exams', payload)
    return response.data
  },
  getMyExams: async () => {
    const response = await api.get('/exams')
    return response.data
  },

  deleteExam: async (examId, force = false) => {
    await api.delete(`/exams/${examId}`, {
      params: {
        force,
      },
    })
  },

  updateExam: async (examId, data) => {
    const response = await api.put(`/exams/${examId}`, data)
    return response.data
  },

}

export default examService
