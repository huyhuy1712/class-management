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
}

export default userService