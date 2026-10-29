import api from './api'

const userService = {
  getProfile: async (userId, options = {}) => {
    const response = await api.get(`/users/${userId}`, options)
    if (!response.data || String(response.data.id) !== String(userId)) throw new Error('Invalid profile response')
    return response.data
  },
  getMyClasses: async (options = {}) => {
    const response = await api.get('/users/me/classes', options)
    if (!Array.isArray(response.data)) throw new Error('Invalid student classes response format')
    return response.data
  },
getStudents: async (options = {}) => {
    const response = await api.get('/users', {
      ...options,
      params: {
        role: 'STUDENT',
      },
    })

    const data = response.data

    if (!Array.isArray(data)) {
      throw new Error('Invalid users response format')
    }

    return data
  },
  getTeachers: async (options = {}) => {
    const response = await api.get('/users', {
      ...options,
      params: {
        role: 'TEACHER',
      },
    })

    const data = response.data

    if (!Array.isArray(data)) {
      throw new Error('Invalid teachers response format')
    }

    return data
  },


  // PUT /api/users/me
updateProfile: async (profileData) => {
    const response = await api.put('/users/me', profileData)
    return response.data
  },

  // POST /api/users/me/avatar
uploadAvatar: async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post(
    '/users/me/avatar',
    formData
  )

  return response.data
},

  // DELETE /api/users/me/avatar
deleteAvatar: async () => {
    await api.delete('/users/me/avatar')
  },

getMyStudents: async (options = {}) => {
  const response = await api.get('/users/my-students', options)
  return response.data
},

getMyStudentDashboard: async (options = {}) => {
  const response = await api.get('/users/me/student-dashboard', options)
  return response.data
},

getMyCompletedExamCount: async (options = {}) => {
  const response = await api.get('/users/me/student-exam-count', options)
  return response.data
},

changePassword: async (currentPassword, newPassword) => {
  await api.put('/users/me/password', {
    currentPassword,
    newPassword,
  })
},

isGoogleLinked: async () => {
  const response = await api.get('/auth/google/linked')
  return response.data?.linked === true
},

}

export default userService
