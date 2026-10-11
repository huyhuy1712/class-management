import api from './api'

const subjectService = {
  getAll: async (options = {}) => {
    const response = await api.get('/subjects', options)
    if (!Array.isArray(response.data)) throw new Error('Dữ liệu môn học từ máy chủ không hợp lệ.')
    return response.data
  },
}

export default subjectService
