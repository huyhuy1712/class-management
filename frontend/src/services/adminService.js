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

  approveUser: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/approve`)
    return { ...response.data, name: response.data.fullName }
  },

  blockUser: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/block`)
    return { ...response.data, name: response.data.fullName }
  },

  unblockUser: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/unblock`)
    return { ...response.data, name: response.data.fullName }
  },

  deleteUser: async (userId) => {
    await api.delete(`/admin/users/${userId}`)
  },

  startImpersonation: async ({ userId, reason }) => {
    const response = await api.post(`/admin/impersonation/${userId}`, { reason })
    return response.data
  },

  getMissions: async ({ signal } = {}) => {
    const response = await api.get('/admin/missions', { signal })
    if (!Array.isArray(response.data)) throw new Error('Invalid admin missions response')
    return response.data
  },

  createMission: async (mission) => (await api.post('/admin/missions', mission)).data,
  updateMission: async (missionId, mission) => (await api.put(`/admin/missions/${missionId}`, mission)).data,
  deleteMission: async (missionId) => { await api.delete(`/admin/missions/${missionId}`) },
}

export default adminService
