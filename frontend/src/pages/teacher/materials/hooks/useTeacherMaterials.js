import { useMutation, useQueryClient } from '@tanstack/react-query'
import useResourceQuery from '../../../../query/useResourceQuery'
import materialService from '../../../../services/materialService'

function addMaterial(state, material) {
  const current = state?.materials ?? []
  return [material, ...current.filter((item) => String(item.id) !== String(material.id))]
}

function isAssignedToClass(material, classId) {
  if (material.targetType === 'ALL') {
    return !(material.excludedClassIds ?? []).some((id) => String(id) === String(classId))
  }
  if (material.targetType === 'CLASS') {
    return (material.classIds ?? []).some((id) => String(id) === String(classId))
  }
  return (material.studentIds ?? []).some((studentId) => {
    const student = material.students?.find((item) => String(item.id) === String(studentId))
    return student?.classes?.some((classroom) => String(classroom.id) === String(classId))
  })
}

function classDocumentQueries(client) {
  return client.getQueriesData({
    predicate: (item) => item.queryKey[2] === 'classDocuments',
  })
}

export default function useTeacherMaterials({ enabled = true } = {}) {
  const client = useQueryClient()
  const query = useResourceQuery('teacherMaterials', [], { enabled })
  const materials = query.data ?? []
  const saveMutation = useMutation({
    mutationFn: (material) => material.id
      ? materialService.update(material)
      : materialService.upload(material),
    onMutate: async (material) => {
      await client.cancelQueries({
        predicate: (item) => item.queryKey.length === query.queryKey.length
          && query.queryKey.every((part, index) => item.queryKey[index] === part)
          || item.queryKey[2] === 'classDocuments',
      })
      const previous = client.getQueryData(query.queryKey)
      const classSnapshots = classDocumentQueries(client)
      const optimistic = {
        ...material,
        id: material.id ?? `pending-${Date.now()}`,
        type: 'DOCUMENT',
        source: 'UPLOAD',
        fileName: material.file?.name ?? material.fileName,
        fileSize: material.file?.size ?? material.fileSize,
        fileUrl: material.file ? '' : material.fileUrl,
        createdAt: material.createdAt ?? new Date().toISOString(),
      }
      if (previous !== undefined) {
        query.setData((state) => addMaterial(state, optimistic))
      }
      classSnapshots.forEach(([key, data]) => {
        const classId = key[3]
        if (!Array.isArray(data)) return
        const visible = isAssignedToClass(optimistic, classId)
        client.setQueryData(key, visible
          ? [optimistic, ...data.filter((item) => String(item.id) !== String(optimistic.id))]
          : data.filter((item) => String(item.id) !== String(optimistic.id)))
      })
      const assignedClassKeys = classSnapshots
        .filter(([key]) => isAssignedToClass(optimistic, key[3]))
        .map(([key]) => key)
      return { previous, classSnapshots, assignedClassKeys, optimisticId: optimistic.id }
    },
    onError: (_error, _material, context) => {
      if (!context) return
      if (context.previous !== undefined) query.setData(context.previous)
      context.classSnapshots.forEach(([key, data]) => client.setQueryData(key, data))
    },
    onSuccess: (saved, _material, context) => {
      if (context?.previous !== undefined) {
        query.setData((state = []) => [
            saved,
            ...state.filter((item) =>
              String(item.id) !== String(context.optimisticId)
                && String(item.id) !== String(saved.id)),
          ])
      }
      context?.assignedClassKeys.forEach((key) => {
        client.setQueryData(key, (data) => Array.isArray(data)
          ? [saved, ...data.filter((item) => String(item.id) !== String(context.optimisticId)
            && String(item.id) !== String(saved.id))]
          : data)
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: materialService.delete,
    onMutate: async (materialId) => {
      await Promise.all([
        client.cancelQueries({ queryKey: query.queryKey, exact: true }),
        client.cancelQueries({ predicate: (item) => item.queryKey[2] === 'classDocuments' }),
      ])
      const previous = client.getQueryData(query.queryKey)
      const classSnapshots = classDocumentQueries(client)
      query.setData((state = []) => state.filter((item) => String(item.id) !== String(materialId)))
      classSnapshots.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          client.setQueryData(key, data.filter((item) => String(item.id) !== String(materialId)))
        }
      })
      return { previous, classSnapshots }
    },
    onError: (_error, _materialId, context) => {
      if (!context) return
      query.setData(context.previous)
      context.classSnapshots.forEach(([key, data]) => client.setQueryData(key, data))
    },
  })

  const unassignMutation = useMutation({
    mutationFn: ({ materialId, classId }) => materialService.removeFromClass(materialId, classId),
    onMutate: async ({ materialId, classId }) => {
      await Promise.all([
        client.cancelQueries({ queryKey: query.queryKey, exact: true }),
        client.cancelQueries({ predicate: (item) => item.queryKey[2] === 'classDocuments' }),
      ])
      const previousMaterials = client.getQueryData(query.queryKey)
      const classSnapshots = classDocumentQueries(client)
        .filter(([key]) => String(key[3]) === String(classId))
      if (previousMaterials !== undefined) query.setData((state = []) => state.map((item) => {
          if (String(item.id) !== String(materialId)) return item
          if (item.targetType === 'ALL') {
            return { ...item, excludedClassIds: [...new Set([...(item.excludedClassIds ?? []), classId])] }
          }
          if (item.targetType === 'CLASS') {
            const classIds = (item.classIds ?? []).filter((id) => String(id) !== String(classId))
            return { ...item, classIds, targetType: classIds.length ? item.targetType : null }
          }
          if (item.targetType === 'STUDENT') {
            const studentIds = (item.studentIds ?? []).filter((studentId) =>
              String(item.studentClassIds?.[studentId]) !== String(classId))
            return { ...item, studentIds, targetType: studentIds.length ? item.targetType : null }
          }
          return item
        }))
      classSnapshots.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          client.setQueryData(key, data.filter((item) => String(item.id) !== String(materialId)))
        }
      })
      return { previousMaterials, classSnapshots }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      query.setData(context.previousMaterials)
      context.classSnapshots.forEach(([key, data]) => client.setQueryData(key, data))
    },
  })

  return {
    materials,
    loading: query.isLoading,
    error: query.errorMessage,
    save: saveMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    unassignFromClass: unassignMutation.mutateAsync,
    pending: saveMutation.isPending || deleteMutation.isPending || unassignMutation.isPending,
  }
}
