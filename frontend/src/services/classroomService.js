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

  activate: async (id) => {
    const response = await api.patch(`/classes/${id}/activate`)
    return response.data
  },

  delete: async (id) => {
    await api.delete(`/classes/${id}`)
  },

  addStudent: async (classroomId, studentId) => {
  const response = await api.post(
    `/classes/${classroomId}/students`,
    {
      studentId: Number(studentId),
    },
  )
  return response.data
},

getStudents: async (classroomId) => {
  const response = await api.get(
    `/classes/${classroomId}/students`,
  )

  const students = response.data

  if (!Array.isArray(students)) {
    throw new Error('Invalid students response format')
  }

  return students
},

removeStudent: async (classroomId, studentId) => {
  await api.delete(
    `/classes/${classroomId}/students/${studentId}`,
  )
},

removeAllStudents: async (classroomId) => {
  await api.delete(`/classes/${classroomId}/students`)
},

createAttendance: async (classroomId, attendanceData) => {
  const response = await api.post(
    `/classes/${classroomId}/attendances`,
    attendanceData,
  )

  return response.data
},

getMyClasses: async () => {
  const response = await api.get('/classes/my')
  return response.data
},

importStudents: async (classroomId, file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post(
    `/classes/${classroomId}/students/import`,
    formData,
  )

  return response.data
},

downloadStudentImportTemplate: async () => {
  const response = await api.get('/classes/students/import-template', {
    responseType: 'blob',
  })

  return response.data
},

}

export default classroomService