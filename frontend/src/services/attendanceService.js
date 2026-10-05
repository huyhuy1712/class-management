import api from './api'

const attendanceService = {
  getMyAttendances: async () => {
    const response = await api.get('/classes/student/attendance')
    return response.data
  },

  getByClass: async (classroomId) => {
    const response = await api.get(
      `/classes/${classroomId}/attendances`
    )

    return response.data
  },

  deleteAttendance: async (classroomId, studentId, date) => {
    await api.delete(
      `/classes/${classroomId}/attendances/students/${studentId}`,
      { params: { date } }
    )
  },
}

export default attendanceService