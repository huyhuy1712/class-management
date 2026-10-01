import api from './api'

const attendanceService = {
  getByClass: async (classroomId) => {
    const response = await api.get(
      `/classes/${classroomId}/attendances`
    )

    return response.data
  },
}

export default attendanceService