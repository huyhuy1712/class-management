import { useEffect, useMemo, useState } from 'react'

import classroomService from '../../../../services/classroomService'
import useAuthStore from '../../../../stores/authStore'
import {
  getCurrentAcademicYear,
  getErrorMessage,
  isDuplicateClassCodeError,
} from '../helpers/classroomHelpers'

function useClassrooms() {
  const currentUser = useAuthStore((state) => state.user)
  const currentUserId = currentUser?.id
  const [classes, setClasses] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [editingClass, setEditingClass] = useState(null)
  const [editError, setEditError] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  useEffect(() => {
    let cancelled = false

    const fetchClasses = async () => {
      try {
        setLoading(true)
        setError(null)
        const myClasses = await classroomService.getMyClasses()

        if (!cancelled) setClasses(myClasses)
      } catch (fetchError) {
        console.error('Get classes error:', fetchError)

        if (!cancelled) {
          setError('Không thể tải danh sách lớp học.')
          setClasses([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchClasses()

    return () => {
      cancelled = true
    }
  }, [])

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
    if (!currentUserId) {
      setCreateError('Không tìm thấy thông tin người dùng đang đăng nhập.')
      return
    }

    try {
      setCreating(true)
      setCreateError(null)
      const payload = {
        name: formData.name,
        code: formData.code,
        subjectId: formData.subjectId,
        teacherId: currentUserId,
        academicYear: getCurrentAcademicYear(),
        description: formData.description,
      }
      const createdClass = await classroomService.create(payload)

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
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (classroom) => {
    setEditError(null)
    setEditingClass(classroom)
  }

  const handleEditSubmit = async (formData) => {
    if (!editingClass || !currentUserId) return

    try {
      setUpdating(true)
      setEditError(null)
      const payload = {
        name: formData.name,
        code: formData.code,
        subjectId: Number(formData.subjectId),
        teacherId: Number(currentUserId),
        academicYear: editingClass.academicYear || getCurrentAcademicYear(),
        description: formData.description || '',
      }
      const updatedClass = await classroomService.update(
        editingClass.id,
        payload,
      )

      setClasses((prev) =>
        prev.map((item) =>
          item.id === editingClass.id ? { ...item, ...updatedClass } : item,
        ),
      )
      setEditingClass(null)
      setToast({ type: 'success', message: 'Cập nhật lớp học thành công.' })
    } catch (requestError) {
      console.error('Update class error:', requestError)
      const backendMessage = getErrorMessage(requestError.response?.data)
      setEditError(
        backendMessage ||
          `Không thể cập nhật lớp học (HTTP ${
            requestError.response?.status || 'unknown'
          }).`,
      )
    } finally {
      setUpdating(false)
    }
  }

  const handleArchive = (classroom) => {
    setConfirmAction({ type: 'archive', classroom })
  }

  const handleDelete = (classroom) => {
    setConfirmAction({ type: 'delete', classroom })
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return

    const { type, classroom } = confirmAction

    try {
      setActionLoading(true)

      if (type === 'archive') {
        const archivedClass = await classroomService.archive(classroom.id)
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
        await classroomService.delete(classroom.id)
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
    } finally {
      setActionLoading(false)
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
