import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import examService from '../../../../services/examService'

function getErrorMessage(error) {
  const data = error?.response?.data
  if (data?.message) return data.message
  if (data?.error) return data.error
  if (typeof data === 'string' && data.trim()) return data
  return 'Không thể cập nhật đề thi. Vui lòng thử lại.'
}

function useUpdateExam({ onUpdated } = {}) {
  const updateMutation = useMutation({ mutationFn: (args) => examService.updateExam(...args) })
  const [editTarget, setEditTarget] = useState(null)
  const updating = updateMutation.isPending
  const [updateError, setUpdateError] = useState('')

  const openEditModal = (exam) => {
    setUpdateError('')
    setEditTarget(exam)
  }

  const closeEditModal = () => {
    if (!updating) setEditTarget(null)
  }

  const updateExam = async (data) => {
    if (!editTarget || updating) return

    try {
      setUpdateError('')
      await updateMutation.mutateAsync([editTarget.id, data])
      await onUpdated?.()
      setEditTarget(null)
    } catch (error) {
      console.error('Update exam error:', error)
      setUpdateError(getErrorMessage(error))
    }
  }

  return {
    editTarget,
    updating,
    updateError,
    openEditModal,
    closeEditModal,
    updateExam,
  }
}

export default useUpdateExam
