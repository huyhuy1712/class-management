import api from './api'

const notificationService = {
  markRead: async (id) => { await api.patch(`/notifications/${id}/read`, { read: true }) },
  deleteNotification: async (id) => { await api.delete(`/notifications/${id}`) },
  deleteNotification: async (notificationId) => {
    await api.delete(`/notifications/${notificationId}`)
  },
  updateReadStatus: async (notificationId, read) => {
    await api.patch(`/notifications/${notificationId}/read`, { read })
  },
  getMyNotifications: async () => {
    const response = await api.get('/notifications')
    return response.data
  },
createRequestApprovedNotification: async (requestId) => {
  await api.post(
    `/notifications/request-approved/${requestId}`
  )
},

}

export default notificationService
