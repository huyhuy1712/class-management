import api from './api'

const userService = {
getTeachers: async () => {
    const response = await api.get('/users', {
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

getStudents: async () => {
    const response = await api.get('/users', {
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

getMyStudents: async () => {
  const response = await api.get('/users/my-students')
  return response.data
},

getMyStudentDashboard: async () => {
  const response = await api.get('/users/me/student-dashboard')
  return response.data
},

changePassword: async (currentPassword, newPassword) => {
  await api.put('/users/me/password', {
    currentPassword,
    newPassword,
  })
},

}

export default userService