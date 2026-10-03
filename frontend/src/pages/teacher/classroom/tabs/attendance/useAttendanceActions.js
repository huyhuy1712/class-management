import { useState } from 'react'
import attendanceService from '../../../../../services/attendanceService'

function getApiMessage(error) {
  return error.response?.data?.message || error.response?.data?.error
}

function useAttendanceActions(classId, setAttendances) {
  const [editingAttendance, setEditingAttendance] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [editError, setEditError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const openEdit = (attendance) => {
    setEditingAttendance(attendance)
    setEditError('')
  }

  const closeEdit = () => {
    if (updating) return
    setEditingAttendance(null)
    setEditError('')
  }

  const updateEditingAttendance = (update) => {
    setEditingAttendance((current) =>
      current ? { ...current, ...update } : current,
    )
  }

  const saveEdit = async (event) => {
    event.preventDefault()

    if (!editingAttendance || !classId || updating) return

    try {
      setUpdating(true)
      setEditError('')

      const updatedAttendance = await attendanceService.updateAttendance(
        classId,
        editingAttendance.id,
        {
          date: editingAttendance.date,
          status: editingAttendance.status,
          note: editingAttendance.note ?? '',
        },
      )

      setAttendances((current) =>
        current.map((item) =>
          item.id === updatedAttendance.id ? updatedAttendance : item,
        ),
      )
      setEditingAttendance(null)
    } catch (error) {
      console.error('Update attendance error:', error)
      setEditError(
        getApiMessage(error) ||
          'Không thể cập nhật điểm danh. Vui lòng thử lại.',
      )
    } finally {
      setUpdating(false)
    }
  }

  const requestDelete = (attendance) => {
    setDeleteError('')
    setDeleteTarget(attendance)
  }

  const closeDelete = () => {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError('')
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleting || !classId) return

    try {
      setDeleting(true)
      setDeleteError('')

      await attendanceService.deleteAttendance(
        classId,
        deleteTarget.studentId,
        deleteTarget.date,
      )

      setAttendances((current) =>
        current.filter(
          (item) =>
            !(
              Number(item.studentId) === Number(deleteTarget.studentId) &&
              item.date === deleteTarget.date
            ),
        ),
      )
      setDeleteTarget(null)
    } catch (error) {
      console.error('Delete attendance error:', error)

      const message = getApiMessage(error)
      if (error.response?.status === 400) {
        setDeleteError(message || 'Không tìm thấy bản ghi điểm danh cần xóa.')
      } else if (error.response?.status === 401) {
        setDeleteError(
          'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
        )
      } else {
        setDeleteError(
          message || 'Không thể xóa điểm danh. Vui lòng thử lại.',
        )
      }
    } finally {
      setDeleting(false)
    }
  }

  return {
    editingAttendance,
    updating,
    editError,
    openEdit,
    closeEdit,
    updateEditingAttendance,
    saveEdit,
    deleteTarget,
    deleting,
    deleteError,
    requestDelete,
    closeDelete,
    confirmDelete,
  }
}

export default useAttendanceActions
