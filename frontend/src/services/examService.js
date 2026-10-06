import api from './api'

const examService = {
  getMyExams: async () => {
    const response = await api.get('/exams')
    return response.data
  },
}

export default examService