import { useMutation } from '@tanstack/react-query'
import useResourceQuery from '../../../../../query/useResourceQuery'
import { getTodayDate } from '../../../../../utils/dateUtils'
import { useState } from 'react'
import lessonService from '../../../../../services/lessonService'

function getErrorMessage(data) {
  if (!data) return ''
  if (typeof data === 'string') return data
  return data.message || data.error || ''
}

const buildDateTime = (date, time) => `${date}T${time}:00`

function buildLessonTitle(date) {
  const [year, month, day] = date.split('-')
  return `Điểm danh buổi học ${day}/${month}/${year}`
}

export default function useAttendanceSession(classroomId) {
  const createMutation = useMutation({ mutationFn: (args) => lessonService.create(...args) })
  const updateMutation = useMutation({ mutationFn: (args) => lessonService.update(...args) })
  const lessonsQuery = useResourceQuery('lessons', [classroomId, getTodayDate()], { enabled: false })
  const [toast, setToast] = useState(null)
  const [createAttendanceOpen, setCreateAttendanceOpen] = useState(false)

  const creatingAttendance = createMutation.isPending || updateMutation.isPending
  const loadingAttendanceSession = lessonsQuery.isFetching
  const [createAttendanceError, setCreateAttendanceError] = useState('')
  const existingAttendanceSession = lessonsQuery.data?.[0] ?? null
  const attendanceSessionLookupFailed = lessonsQuery.isError
const handleOpenAttendanceSession = async () => {
  if (!classroomId || loadingAttendanceSession || creatingAttendance) return

  setCreateAttendanceOpen(true)
  setCreateAttendanceError('')

  try {
    await lessonsQuery.refetch({ throwOnError: true })
  } catch (error) {
    console.error('Get attendance session error:', error)
    setCreateAttendanceError(
      getErrorMessage(error.response?.data) ||
        'Không thể tải thông tin phiên điểm danh. Vui lòng thử lại.',
    )
  }
}

const handleCreateAttendanceSession = async ({
  password,
  date,
  startTime,
  lateTime,
  endTime,
}) => {
  if (!classroomId || creatingAttendance || loadingAttendanceSession || attendanceSessionLookupFailed) return

  try {
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
      const createdSession = await createMutation.mutateAsync([
        classroomId,
        commonData,
      ])
      lessonsQuery.setData([createdSession])

      setToast({
        type: 'success',
        message: 'Tạo phiên điểm danh thành công.',
      })
    } else {
      const updatedSession = await updateMutation.mutateAsync([
        classroomId,
        existingAttendanceSession.id,
        commonData,
      ])
      lessonsQuery.setData((lessons = []) => lessons.map((lesson) => lesson.id === updatedSession.id ? updatedSession : lesson))

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
  }
}

  const close = () => {
    if (creatingAttendance || loadingAttendanceSession) return
    setCreateAttendanceOpen(false)
    setCreateAttendanceError('')
  }

  return {
    createAttendanceOpen,
    creatingAttendance,
    loadingAttendanceSession,
    createAttendanceError,
    existingAttendanceSession,
    attendanceSessionLookupFailed,
    handleOpenAttendanceSession,
    handleCreateAttendanceSession,
    toast,
    close,
  }
}
