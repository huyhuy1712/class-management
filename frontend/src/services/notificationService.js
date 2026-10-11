import api from './api'

const notificationService = {
  markRead: async (id, options = {}) => { await api.patch(`/notifications/${id}/read`, { read: true }, options) },
  deleteNotification: async (notificationId, options = {}) => {
    await api.delete(`/notifications/${notificationId}`, options)
  },
  updateReadStatus: async (notificationId, read) => {
    await api.patch(`/notifications/${notificationId}/read`, { read })
  },
  getMyNotifications: async (options = {}) => {
    const response = await api.get('/notifications', options)
    return response.data
  },
}

export default notificationService
