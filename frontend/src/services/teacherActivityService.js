import api from './api'

const teacherActivityService = {
  getActivity: async (params, options = {}) => {
    const response = await api.get('/teacher/activity', { ...options, params })
    return response.data
  },
  getStudentActivity: async (params, options = {}) => {
    const response = await api.get('/student/activity', { ...options, params })
    return response.data
  },
}

export default teacherActivityService
