import { useMutation } from '@tanstack/react-query'
import { EMPTY_LIST } from '../../../../query/queryKeys'
import useResourceQuery from '../../../../query/useResourceQuery'
import { optimisticRowOptions } from '../../../../query/optimisticUpdates'
import { useEffect, useMemo, useState } from 'react'

import classroomService from '../../../../services/classroomService'
import useAuthStore from '../../../../stores/authStore'
import {
  getCurrentAcademicYear,
  getErrorMessage,
  isDuplicateClassCodeError,
} from '../helpers/classroomHelpers'

function useClassrooms() {
  const createMutation = useMutation({ mutationFn: classroomService.create })
  const deleteMutation = useMutation({ mutationFn: classroomService.delete })
  const currentUser = useAuthStore((state) => state.user)
  const currentUserId = currentUser?.id
  const classesQuery = useResourceQuery('teacherClasses')
  const updateMutation = useMutation(optimisticRowOptions(classesQuery, ([id, patch]) => ({ id, patch }), (args) => classroomService.update(...args)))
  const archiveMutation = useMutation(optimisticRowOptions(classesQuery, (id) => ({ id, patch: { status: 'ARCHIVED' } }), classroomService.archive))
  const classes = classesQuery.data ?? EMPTY_LIST
  const setClasses = classesQuery.setData
  const [search, setSearch] = useState('')
  const loading = classesQuery.isLoading
  const error = classesQuery.errorMessage
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const creating = createMutation.isPending
  const [createError, setCreateError] = useState(null)
  const [editingClass, setEditingClass] = useState(null)
  const [editError, setEditError] = useState(null)
  const updating = updateMutation.isPending
  const [confirmAction, setConfirmAction] = useState(null)
  const actionLoading = archiveMutation.isPending || deleteMutation.isPending
  const [toast, setToast] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const totalClasses = classes.length
  const activeClasses = classes.filter(
    (classroom) => classroom.status === 'ACTIVE',
  ).length
  const archivedClasses = classes.filter(
    (classroom) => classroom.status === 'ARCHIVED',
  ).length

  const filteredClasses = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return classes.filter((classroom) => {
      const matchesSearch =
        !keyword ||
        String(classroom.name ?? '').toLowerCase().includes(keyword) ||
        String(classroom.code ?? '').toLowerCase().includes(keyword) ||
        String(classroom.subjectName ?? '').toLowerCase().includes(keyword)
      const matchesStatus =
        selectedStatus === 'ALL' || classroom.status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }, [classes, search, selectedStatus])

  const statusFilters = [
    { value: 'ALL', label: 'Tất cả', count: totalClasses },
    { value: 'ACTIVE', label: 'Đang hoạt động', count: activeClasses },
    { value: 'ARCHIVED', label: 'Đã vô hiệu', count: archivedClasses },
  ]

  const handleCreateSubmit = async (formData) => {
    if (creating) return
    if (!currentUserId) {
      setCreateError('Không tìm thấy thông tin người dùng đang đăng nhập.')
      return
    }

    try {
      setCreateError(null)
      const payload = {
        name: formData.name,
        code: formData.code,
        subjectId: formData.subjectId,
        teacherId: currentUserId,
        academicYear: getCurrentAcademicYear(),
        description: formData.description,
      }
      const createdClass = await createMutation.mutateAsync(payload)

      setClasses((prev) => [
        {
          ...createdClass,
          academicYear: createdClass.academicYear || payload.academicYear,
        },
        ...prev,
      ])
      setIsCreateModalOpen(false)
      setToast({ type: 'success', message: 'Tạo lớp học thành công.' })
    } catch (requestError) {
      console.error('Create class error:', requestError)
      const backendMessage = getErrorMessage(requestError.response?.data)
      const message = isDuplicateClassCodeError(
        requestError.response?.status,
        backendMessage,
      )
        ? 'Mã lớp đã tồn tại. Vui lòng chọn mã khác.'
        : backendMessage ||
          `Không thể tạo lớp học (HTTP ${
            requestError.response?.status || 'unknown'
          }).`

      setCreateError(message)
    }
  }

  const handleEdit = (classroom) => {
    if (updating) return
    setEditError(null)
    setEditingClass(classroom)
  }

  const handleEditSubmit = async (formData) => {
    if (!editingClass || !currentUserId || updating) return

    try {
      setEditError(null)
      const payload = {
        name: formData.name,
        code: formData.code,
        subjectId: Number(formData.subjectId),
        teacherId: Number(currentUserId),
        academicYear: editingClass.academicYear || getCurrentAcademicYear(),
        description: formData.description || '',
      }
      setEditingClass(null)
      const updatedClass = await updateMutation.mutateAsync([
        editingClass.id,
        payload,
      ])

      setClasses((prev) =>
        prev.map((item) =>
          item.id === editingClass.id ? { ...item, ...updatedClass } : item,
        ),
      )
      setEditingClass(null)
      setToast({ type: 'success', message: 'Cập nhật lớp học thành công.' })
    } catch (requestError) {
      console.error('Update class error:', requestError)
      setEditingClass({ ...editingClass, ...formData })
      const backendMessage = getErrorMessage(requestError.response?.data)
      setEditError(
        backendMessage ||
          `Không thể cập nhật lớp học (HTTP ${
            requestError.response?.status || 'unknown'
          }).`,
      )
    }
  }

  const handleArchive = (classroom) => {
    if (actionLoading) return
    setConfirmAction({ type: 'archive', classroom })
  }

  const handleDelete = (classroom) => {
    if (actionLoading) return
    setConfirmAction({ type: 'delete', classroom })
  }

  const handleConfirmAction = async () => {
    if (!confirmAction || actionLoading) return

    const { type, classroom } = confirmAction
    if (type === 'archive') setConfirmAction(null)

    try {
      if (type === 'archive') {
        const archivedClass = await archiveMutation.mutateAsync(classroom.id)
        setClasses((prev) =>
          prev.map((item) =>
            item.id === classroom.id
              ? { ...item, ...archivedClass }
              : item,
          ),
        )
        setToast({
          type: 'success',
          message: 'Vô hiệu hóa lớp học thành công.',
        })
      } else {
        await deleteMutation.mutateAsync(classroom.id)
        setClasses((prev) => prev.filter((item) => item.id !== classroom.id))
        setToast({ type: 'success', message: 'Xóa lớp học thành công.' })
      }

      setConfirmAction(null)
    } catch (requestError) {
      console.error('Classroom action error:', requestError)
      const backendMessage = getErrorMessage(requestError.response?.data)
      setToast({
        type: 'error',
        message:
          backendMessage || 'Không thể thực hiện thao tác. Vui lòng thử lại.',
      })
    }
  }

  return {
    classes,
    search,
    setSearch,
    loading,
    error,
    isCreateModalOpen,
    setIsCreateModalOpen,
    creating,
    createError,
    setCreateError,
    editingClass,
    setEditingClass,
    editError,
    setEditError,
    updating,
    confirmAction,
    setConfirmAction,
    actionLoading,
    toast,
    setToast,
    selectedStatus,
    setSelectedStatus,
    filteredClasses,
    totalClasses,
    activeClasses,
    archivedClasses,
    statusFilters,
    handleCreateSubmit,
    handleEdit,
    handleEditSubmit,
    handleArchive,
    handleDelete,
    handleConfirmAction,
  }
}

export default useClassrooms
