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
  const [editTarget, setEditTarget] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')

  const openEditModal = (exam) => {
    setUpdateError('')
    setEditTarget(exam)
  }

  const closeEditModal = () => {
    if (!updating) setEditTarget(null)
  }

  const updateExam = async (data) => {
    if (!editTarget) return

    try {
      setUpdating(true)
      setUpdateError('')
      await examService.updateExam(editTarget.id, data)
      await onUpdated?.()
      setEditTarget(null)
    } catch (error) {
      console.error('Update exam error:', error)
      setUpdateError(getErrorMessage(error))
    } finally {
      setUpdating(false)
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
