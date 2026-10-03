import api from './api'

const attendanceService = {
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

updateAttendance: async (classroomId, attendanceId, data) => {
  const response = await api.patch(
    `/classes/${classroomId}/attendances/${attendanceId}`,
    data
  )

  return response.data
},

exportAttendance: async (classroomId, date) => {
  const response = await api.get(
    `/classes/${classroomId}/attendances/export`,
    {
      params: { date },
      responseType: 'blob',
    },
  )

  return response
},


}

export default attendanceService