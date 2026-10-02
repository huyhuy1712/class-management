import api from './api'

const notificationService = {
createRequestRejectedNotification: async (requestId) => {
    await api.post(
      `/notifications/request-rejected/${requestId}`
    )
  },

createRequestApprovedNotification: async (requestId) => {
  await api.post(
    `/notifications/request-approved/${requestId}`
  )
},

}

export default notificationService