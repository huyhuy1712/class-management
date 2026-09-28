import api from './api'

const subjectService = {
  getAll: async () => {
    const response = await api.get('/subjects')
    return response.data
  },
}

export default subjectService