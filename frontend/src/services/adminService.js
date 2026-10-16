import api from './api'

const adminService = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard')
    if (!response.data || typeof response.data.totalUsers !== 'number') {
      throw new Error('Invalid admin dashboard response')
    }
    return response.data
  },

  getUsers: async () => {
    const response = await api.get('/admin/users')
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid admin users response')
    }
    return response.data.map((user) => ({
      ...user,
      name: user.fullName,
    }))
  },

  createUser: async (user) => {
    const response = await api.post('/admin/users', user)
    return { ...response.data, name: response.data.fullName }
  },

  updateUser: async (userId, user) => {
    const response = await api.put(`/admin/users/${userId}`, user)
    return { ...response.data, name: response.data.fullName }
  },

  deleteUser: async (userId) => {
    await api.delete(`/admin/users/${userId}`)
  },

  startImpersonation: async ({ userId, reason }) => {
    const response = await api.post(`/admin/impersonation/${userId}`, { reason })
    return response.data
  },
}

export default adminService
