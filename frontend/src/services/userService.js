import api from './api'

const userService = {
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

}

export default userService