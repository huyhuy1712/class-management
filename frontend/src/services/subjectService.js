import api from './api'

const subjectService = {
  getAll: async (options = {}) => {
    const response = await api.get('/subjects', options)
    if (!Array.isArray(response.data)) throw new Error('Dữ liệu môn học từ máy chủ không hợp lệ.')
    return response.data
  },
  create: async (subject) => {
    const response = await api.post('/admin/subjects', subject)
    return response.data
  },
  update: async (subjectId, subject) => {
    const response = await api.put(`/admin/subjects/${subjectId}`, subject)
    return response.data
  },
  delete: async (subjectId) => {
    await api.delete(`/admin/subjects/${subjectId}`)
  },
}

export default subjectService
