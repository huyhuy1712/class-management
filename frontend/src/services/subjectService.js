import api from './api'

const subjectService = {
  getAll: async (options = {}) => {
    const response = await api.get('/subjects', options)
    return response.data
  },
}

export default subjectService