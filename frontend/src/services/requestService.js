import api from './api'

const requestService = {
  createJoinClassRequest: async (classroomId, message) => {
    await api.post(`/requests/join-class/${classroomId}`, { message })
  },

  getReceivedJoinClassRequests: async () => {
    const response = await api.get('/requests/join-class/received')
    return response.data
  },

  rejectJoinClassRequest: async (requestId) => {
    await api.patch(`/requests/${requestId}/reject`)
  },

  approveJoinClassRequest: async (requestId) => {
  await api.patch(`/requests/${requestId}/approve`)
},

}

export default requestService
