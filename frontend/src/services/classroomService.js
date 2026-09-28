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

  
}

export default classroomService