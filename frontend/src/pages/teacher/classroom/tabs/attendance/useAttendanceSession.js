import { useState } from 'react'
import lessonService from '../../../../../services/lessonService'

function getErrorMessage(data) {
  if (!data) return ''
  if (typeof data === 'string') return data
  return data.message || data.error || ''
}

export default function useAttendanceSession(classroomId) {
  const [toast, setToast] = useState(null)
const [createAttendanceOpen, setCreateAttendanceOpen] =
  useState(false)

  const [creatingAttendance, setCreatingAttendance] = useState(false)
    const [loadingAttendanceSession, setLoadingAttendanceSession] =
      useState(false)
    const [createAttendanceError, setCreateAttendanceError] = useState('')
    const [existingAttendanceSession, setExistingAttendanceSession] =
      useState(null)
    const [attendanceSessionLookupFailed, setAttendanceSessionLookupFailed] =
      useState(false)
  const buildDateTime = (date, time) => {
  return `${date}T${time}:00`
}

const buildLessonTitle = (date) => {
  const [year, month, day] = date.split('-')

  return `Điểm danh buổi học ${day}/${month}/${year}`
}

const getLocalDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const handleOpenAttendanceSession = async () => {
  if (!classroomId) return

  setCreateAttendanceOpen(true)
  setLoadingAttendanceSession(true)
  setCreateAttendanceError('')
  setExistingAttendanceSession(null)
  setAttendanceSessionLookupFailed(false)

  try {
    const lessons = await lessonService.getByDate(
      classroomId,
      getLocalDate(),
    )
    setExistingAttendanceSession(
      Array.isArray(lessons) ? lessons[0] ?? null : null,
    )
  } catch (error) {
    console.error('Get attendance session error:', error)
    setAttendanceSessionLookupFailed(true)
    setCreateAttendanceError(
      getErrorMessage(error.response?.data) ||
        'Không thể tải thông tin phiên điểm danh. Vui lòng thử lại.',
    )
  } finally {
    setLoadingAttendanceSession(false)
  }
}

const handleCreateAttendanceSession = async ({
  password,
  date,
  startTime,
  lateTime,
  endTime,
}) => {
  if (!classroomId) return

  try {
    setCreatingAttendance(true)
    setCreateAttendanceError('')

    const commonData = {
      title:
        existingAttendanceSession?.title || buildLessonTitle(date),
      lessonDate: date,
      attendanceCode: password,
      startTime: buildDateTime(date, startTime),
      lateTime: buildDateTime(date, lateTime),
      endTime: buildDateTime(date, endTime),
    }

    if (!existingAttendanceSession) {
      const createdSession = await lessonService.create(
        classroomId,
        commonData,
      )
      setExistingAttendanceSession(createdSession)

      setToast({
        type: 'success',
        message: 'Tạo phiên điểm danh thành công.',
      })
    } else {
      const updatedSession = await lessonService.update(
        classroomId,
        existingAttendanceSession.id,
        commonData,
      )
      setExistingAttendanceSession(updatedSession)

      setToast({
        type: 'success',
        message:
          'Cập nhật phiên điểm danh thành công.',
      })
    }

    setCreateAttendanceOpen(false)
  } catch (error) {
    console.error(
      'Create/update attendance session error:',
      error,
    )

    const status = error.response?.status

    const backendMessage = getErrorMessage(
      error.response?.data,
    )

    if (status === 400) {
      setCreateAttendanceError(
        backendMessage ||
          'Thông tin buổi học không hợp lệ. Vui lòng kiểm tra lại thời gian.',
      )
    } else if (status === 401) {
      setCreateAttendanceError(
        'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
      )
    } else if (status === 403) {
      setCreateAttendanceError(
        backendMessage ||
          'Bạn không có quyền tạo điểm danh cho lớp học này.',
      )
    } else {
      setCreateAttendanceError(
        backendMessage ||
          'Không thể tạo điểm danh. Vui lòng thử lại.',
      )
    }
  } finally {
    setCreatingAttendance(false)
  }
}

  return { createAttendanceOpen, creatingAttendance, loadingAttendanceSession, createAttendanceError, existingAttendanceSession, attendanceSessionLookupFailed, handleOpenAttendanceSession, handleCreateAttendanceSession, toast, close: () => {
    if (creatingAttendance) return
    setCreateAttendanceOpen(false)
    setCreateAttendanceError('')
    setExistingAttendanceSession(null)
  } }
}
