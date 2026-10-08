import api from './api'

const examMediaService = {
  upload: async (draftToken, type, file) => {
    const data = new FormData()
    data.append('draftToken', draftToken)
    data.append('type', type)
    data.append('file', file)
    const response = await api.post('/exam-media', data)
    return response.data
  },
  remove: async (mediaId) => {
    await api.delete(`/exam-media/${mediaId}`)
  },
}

export default examMediaService
