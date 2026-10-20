import api from './api'

const materialService = {
  getTeacherMaterials: async (options = {}) => (await api.get('/materials', options)).data,

  getFile: async (fileUrl) => (await api.get(fileUrl, {
    responseType: 'blob',
    withCredentials: false,
  })).data,

  upload: async (material) => {
    const body = new FormData()
    body.append('title', material.title)
    if (material.content) body.append('content', material.content)
    body.append('assignmentType', material.targetType)
    material.classIds?.forEach((id) => body.append('classIds', String(id)))
    material.studentIds?.forEach((id) => body.append('studentIds', String(id)))
    body.append('file', material.file)
    return (await api.post('/materials', body)).data
  },

  update: async (material) => {
    const body = new FormData()
    body.append('title', material.title)
    if (material.content) body.append('content', material.content)
    body.append('assignmentType', material.targetType)
    material.classIds?.forEach((id) => body.append('classIds', String(id)))
    material.studentIds?.forEach((id) => body.append('studentIds', String(id)))
    if (material.file) body.append('file', material.file)
    return (await api.put(`/materials/${material.id}`, body)).data
  },

  delete: async (materialId) => {
    await api.delete(`/materials/${materialId}`)
  },

  removeFromClass: async (materialId, classId) => {
    await api.delete(`/materials/${materialId}/classes/${classId}`)
  },
}

export default materialService
