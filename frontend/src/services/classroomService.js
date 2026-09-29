import api from './api'

const classroomService = {
  getAll: async () => {
    const response = await api.get('/classes')
    const payload = response.data

    const classes = Array.isArray(payload)
      ? payload
      : payload.data ?? payload.classes

    if (!Array.isArray(classes)) {
      throw new Error('Invalid classes response format')
    }

    return classes
  },

  create: async (classroomData) => {
    const response = await api.post('/classes', classroomData)
    return response.data
  },

  update: async (id, classroomData) => {
    const response = await api.put(`/classes/${id}`, classroomData)
    return response.data
  },

  archive: async (id) => {
    const response = await api.patch(`/classes/${id}/archive`)
    return response.data
  },

  delete: async (id) => {
    await api.delete(`/classes/${id}`)
  },
}

export default classroomService