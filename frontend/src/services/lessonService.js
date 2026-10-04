import api from './api'

const lessonService = {
  getByDate: async (classroomId, date) => {
    const response = await api.get(
      `/classes/${classroomId}/lessons`,
      {
        params: { date },
      },
    )

    return response.data
  },

  create: async (classroomId, data) => {
    const response = await api.post(
      `/classes/${classroomId}/lessons`,
      data,
    )

    return response.data
  },

  update: async (classroomId, lessonId, data) => {
    const response = await api.put(
      `/classes/${classroomId}/lessons/${lessonId}`,
      data,
    )

    return response.data
  },
}

export default lessonService