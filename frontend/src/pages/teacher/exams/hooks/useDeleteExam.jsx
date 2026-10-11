import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import examService from '../../../../services/examService'

function getDeleteErrorMessage(error) {
  const status = error?.response?.status
  const data = error?.response?.data

  if (status === 401) {
    return 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'
  }

  if (status === 400) {
    return (
      data?.message ||
      data?.error ||
      'Không tìm thấy đề thi hoặc bạn không có quyền xóa đề thi này.'
    )
  }

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  return (
    data?.message ||
    data?.error ||
    'Không thể xóa đề thi. Vui lòng thử lại.'
  )
}

function useDeleteExam({
  onDeleted,
} = {}) {
  const deleteMutation = useMutation({ mutationFn: (args) => examService.deleteExam(...args) })
  const [deleteTarget, setDeleteTarget] =
    useState(null)

  const [forceDelete, setForceDelete] =
    useState(false)

  const deleting = deleteMutation.isPending

  const [deleteError, setDeleteError] =
    useState('')

  const openDeleteModal = (exam) => {
    setDeleteTarget(exam)
    setForceDelete(false)
    setDeleteError('')
  }

  const closeDeleteModal = () => {
    if (deleting) return

    setDeleteTarget(null)
    setForceDelete(false)
    setDeleteError('')
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.id || deleting) return

    try {
      setDeleteError('')

      await deleteMutation.mutateAsync([
        deleteTarget.id,
        forceDelete,
      ])

      const deletedExam = deleteTarget

      setDeleteTarget(null)
      setForceDelete(false)

      await onDeleted?.(deletedExam)
    } catch (error) {
      console.error(
        'Delete exam error:',
        error,
      )

      const status = error?.response?.status

      // Đề đã có bài làm
      // Không đóng modal.
      // Chuyển modal sang confirm force delete.
      if (status === 409 && !forceDelete) {
        setForceDelete(true)
        setDeleteError('')
        return
      }

      setDeleteError(
        getDeleteErrorMessage(error),
      )
    }
  }

  return {
    deleteTarget,
    forceDelete,
    deleting,
    deleteError,

    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  }
}

export default useDeleteExam
