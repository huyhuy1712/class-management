import api from './api'

const examService = {
  importPdf: async (file, examNumber, requestId) => {
    const body = new FormData()
    body.append('file', file)
    body.append('examNumber', String(examNumber))
    body.append('requestId', requestId)
    return (await api.post('/exams/imports/pdf', body, { skipQueryInvalidation: true })).data
  },
  getPdfImport: async (id, options = {}) => (await api.get(`/exams/imports/${id}`, options)).data,
  cancelPdfImport: async (id) => (await api.delete(`/exams/imports/${id}`)).data,
  getPdfImportAsset: async (id, assetId, options = {}) => (await api.get(`/exams/imports/${id}/assets/${assetId}`, { ...options, responseType: 'blob' })).data,
  getMyGrades: async (params = {}, options = {}) => (await api.get('/users/me/grades', { ...options, params })).data,
  getTeacherAttemptReview: async (id, options = {}) => (await api.get(`/exam-attempts/${id}/teacher-review`, options)).data,
  resetAttempt: async (id, body) => (await api.post(`/exam-attempts/${id}/reset`, body)).data,
  getStudentClassExamResults: async (classId, studentId, options = {}) => {
    const items = []
    let result
    for (let page = 0; ; page++) {
      result = (await api.get(`/classes/${classId}/students/${studentId}/exam-results`, { ...options, params: { page, size: 100 } })).data
      if (!Array.isArray(result?.items) || !Number.isFinite(result.totalElements)) throw new Error('Dữ liệu kết quả học sinh không hợp lệ.')
      items.push(...result.items)
      if (items.length >= result.totalElements || !result.items.length) break
    }
    return { ...result, items }
  },
  getAssignmentAttempts: async (id, params, options = {}) => (await api.get(`/exam-assignments/${id}/attempts`, { ...options, params })).data,
  getAssignmentExport: async (id, classId, options = {}) => {
    const items = []
    let page = 0, total = 0
    do {
      const result = await examService.getAssignmentAttempts(id, { ...(classId ? { classId } : {}), page, size: 100, sort: 'name' }, options)
      if (!Array.isArray(result.items)) throw new Error('Dữ liệu bảng điểm không hợp lệ.')
      items.push(...result.items)
      total = result.totalElements
      if (!result.items.length && items.length < total) throw new Error('Danh sách học sinh đã thay đổi. Vui lòng xuất lại.')
      page += 1
    } while (items.length < total)
    return items
  },
  updateAttemptGrades: async (id, body) => (await api.patch(`/exam-attempts/${id}/grades`, body)).data,
  getClassExams: async (classId, options = {}) => (await api.get(`/classes/${classId}/exams`, options)).data,
  copyExam: async (examId, requestId) => (await api.post(`/exams/${examId}/copy`, { requestId })).data,
  createAssignment: async (examId, body) => (await api.post(`/exams/${examId}/assignments`, body)).data,
  updateAssignmentResultSettings: async (examId, assignmentId, body) => (await api.patch(`/exams/${examId}/assignments/${assignmentId}/result-settings`, body)).data,
  startAttempt: async (id, body) => (await api.post(`/exam-assignments/${id}/attempts`, body)).data,
  getAttempt: async (id, options = {}) => (await api.get(`/exam-attempts/${id}`, options)).data,
  saveAttempt: async (id, body) => (await api.put(`/exam-attempts/${id}/answers`, body)).data,
  submitAttempt: async (id, body) => (await api.post(`/exam-attempts/${id}/submit`, body)).data,
  getAttemptResult: async (id, options = {}) => (await api.get(`/exam-attempts/${id}/result`, options)).data,
  unpublishExam: async (examId) => {
    const response = await api.patch(`/exams/${examId}/unpublish`)
    return response.data
  },
  publishExam: async (examId) => {
    const response = await api.patch(`/exams/${examId}/publish`)
    return response.data
  },
  getStudentExams: async (options = {}, sort = 'newest') => {
    const items = []
    let result
    const { params: queryParams = {}, ...requestOptions } = options
    for (let page = 0; ; page++) {
      const response = await api.get('/users/me/exams', {
        ...requestOptions,
        params: { ...queryParams, page, size: 100, sort },
      })
      result = response.data
      if (!Array.isArray(result?.items) || !Number.isFinite(result.totalElements)) throw new Error('Dữ liệu đề được giao không hợp lệ.')
      items.push(...result.items)
      if (items.length >= result.totalElements || result.items.length === 0) break
    }
    return { ...result, items }
  },
  getStudentAssignment: async (assignmentId, options = {}) => {
    const response = await api.get(`/exam-assignments/${assignmentId}`, options)
    return response.data
  },
  createExam: async (payload) => {
    const response = await api.post('/exams', payload)
    return response.data
  },
  getExamDetail: async (examId, options = {}) => {
    const response = await api.get(`/exams/${examId}`, options)
    return response.data
  },
  getExamConfiguration: async (examId, options = {}) => {
    const response = await api.get(`/exams/${examId}/configuration`, options)
    return response.data
  },
  getMyExams: async (options = {}) => {
    const response = await api.get('/exams', options)
    return response.data
  },

  updateExamConfiguration: async (examId, payload) => {
    const response = await api.put(`/exams/${examId}`, payload)
    return response.data
  },
  updateExamContent: async (examId, payload) => {
    const response = await api.put(`/exams/${examId}/content`, payload)
    return response.data
  },
  deleteExam: async (examId, force = false) => {
    await api.delete(`/exams/${examId}`, {
      params: force ? { force: true } : undefined,
    })
  },
}

export default examService
