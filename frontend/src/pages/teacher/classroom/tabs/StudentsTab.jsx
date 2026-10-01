import {
  CalendarCheck,
  FileSpreadsheet,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

import AddStudentModal from '../../../../components/classroom/detail/AddStudentModal'
import ConfirmModal from '../../../../components/classroom/ConfirmModal'
import classroomService from '../../../../services/classroomService'
import AttendanceModal from '../../../../components/classroom/detail/AttendanceModal'
import defaultAvatar from '../../../../assets/images/avatar_default.png'

function getErrorMessage(data) {
  if (!data) return ''
  if (typeof data === 'string') return data

  return data.message || data.error || ''
}

function formatJoinedDate(value) {
  if (!value) return '---'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '---'

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function StudentsTab() {
  const { classroom, onStudentCountChange } = useOutletContext()
  const classroomId = classroom?.id

  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  const [studentToDelete, setStudentToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  const navigate = useNavigate()

  const [attendanceStudent, setAttendanceStudent] = useState(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceError, setAttendanceError] = useState(null)

  useEffect(() => {
    let ignore = false

    const fetchStudents = async () => {
      if (!classroomId) {
        setStudents([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const data = await classroomService.getStudents(classroomId)
        if (!ignore) setStudents(data)
      } catch (fetchError) {
        if (ignore) return

        setError(
          getErrorMessage(fetchError.response?.data) ||
            'Không thể tải danh sách học sinh.',
        )
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    fetchStudents()

    return () => {
      ignore = true
    }
  }, [classroomId])

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return students

    return students.filter((student) =>
      [
        student.fullName,
        student.studentCode,
        student.username,
        student.email,
      ].some((value) => String(value ?? '').toLowerCase().includes(keyword)),
    )
  }, [search, students])

  const handleAddStudent = async (studentId) => {
    try {
      setAdding(true)
      setAddError(null)

      const student = await classroomService.addStudent(classroomId, studentId)
      setStudents((previous) => {
        const nextStudents = [student, ...previous]
        onStudentCountChange?.(nextStudents.length)
        return nextStudents
      })
      setAddModalOpen(false)
      setToast({ type: 'success', message: 'Thêm học sinh thành công.' })
    } catch (addStudentError) {
      const status = addStudentError.response?.status
      const message = getErrorMessage(addStudentError.response?.data)

      setAddError(
        message ||
          (status === 403
            ? 'Học sinh này đã có trong lớp học.'
            : status === 400
              ? 'Không tìm thấy học sinh hoặc tài khoản không hợp lệ.'
              : 'Không thể thêm học sinh. Vui lòng thử lại.'),
      )
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return

    try {
      setDeleting(true)
      await classroomService.removeStudent(classroomId, studentToDelete.id)

      setStudents((previous) =>
        previous.filter((student) => student.id !== studentToDelete.id),
      )
      onStudentCountChange?.(students.length - 1)
      setStudentToDelete(null)
      setToast({
        type: 'success',
        message: 'Xóa học sinh khỏi lớp thành công.',
      })
    } catch (deleteError) {
      setToast({
        type: 'error',
        message:
          getErrorMessage(deleteError.response?.data) ||
          'Không thể xóa học sinh khỏi lớp.',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleRequestDelete = (student) => {
    setStudentToDelete(student)
  }

  const showUnavailableMessage = (message) => {
    setToast({ type: 'info', message })
  }

  const handleAttendance = (student) => {
    setAttendanceError(null)
    setAttendanceStudent(student)
  }

  const handleStudentKeyDown = (event, student) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleViewStudent(student)
    }
  }

  const renderStudentAvatar = (student) => (
    <img
      src={student.avatar || defaultAvatar}
      alt={student.fullName || 'Học sinh'}
      onError={(event) => {
        event.currentTarget.onerror = null
        event.currentTarget.src = defaultAvatar
      }}
      className="h-11 w-11 shrink-0 rounded-full border border-green-100 object-cover"
    />
  )

  const renderStudentIdentity = (student) => (
    <div className="flex items-center gap-3">
      {renderStudentAvatar(student)}

      <div className="min-w-0">
        <p className="font-semibold text-[#18301D]">
          {student.fullName || 'Chưa cập nhật'}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
          <UserRound size={13} />@{student.username || '---'}
        </div>
      </div>
    </div>
  )

  const renderActions = (student, mobile = false) => (
    <div className={`flex gap-2 ${mobile ? '' : 'justify-center'}`}>
      <button
        type="button"
        title="Điểm danh"
        onClick={(event) => {
          event.stopPropagation()
          handleAttendance(student)
        }}
        className={
          mobile
            ? 'flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-200 py-2.5 text-sm font-semibold text-green-700'
            : 'flex h-10 w-10 items-center justify-center rounded-xl border border-green-200 text-green-600 transition hover:bg-green-50'
        }
      >
        <CalendarCheck size={mobile ? 17 : 18} />
        {mobile && 'Điểm danh'}
      </button>

        <button
        type="button"
        title="Xóa khỏi lớp"
        onClick={(event) => {
          event.stopPropagation()
          handleRequestDelete(student)
        }}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50"
        >
        <Trash2 size={18} />
        </button>
    </div>
  )

  const handleViewStudent = (student) => {
  navigate(
    `/teacher/classes/${classroom.id}/students/${student.id}`,
    {
      state: {
        student,
      },
    },
  )
}

const handleSubmitAttendance = async ({
  date,
  status,
  note,
}) => {
  if (!attendanceStudent || !classroom?.id) {
    return
  }

  try {
    setAttendanceLoading(true)
    setAttendanceError(null)

    const payload = {
      date,
      students: [
        {
          studentId: attendanceStudent.id,
          status,
          note: note || '',
        },
      ],
    }

    const result =
      await classroomService.createAttendance(
        classroom.id,
        payload,
      )

    console.log('Attendance created:', result)

    setAttendanceStudent(null)
    setToast({
      type: 'success',
      message: 'Điểm danh thành công.',
    })
  } catch (error) {
    console.error('Create attendance error:', error)

    const statusCode = error.response?.status

    const backendMessage = getErrorMessage(
      error.response?.data,
    )

    if (statusCode === 400) {
      setAttendanceError(
        backendMessage ||
          'Không thể điểm danh. Học sinh có thể đã được điểm danh trong ngày này.',
      )
      return
    }

    if (statusCode === 401) {
      setAttendanceError(
        'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
      )
      return
    }

    setAttendanceError(
      backendMessage ||
        'Không thể lưu điểm danh. Vui lòng thử lại.',
    )
  } finally {
    setAttendanceLoading(false)
  }
}

  return (
    <>
      {toast && (
        <div
          role="status"
          className={`fixed right-4 top-4 z-[70] max-w-[calc(100vw-2rem)] rounded-xl border px-4 py-3 text-sm font-medium shadow-lg sm:right-6 sm:top-6 ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : toast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-blue-200 bg-blue-50 text-blue-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <Users size={21} />
              </div>

              <div className="min-w-0">
                <h2 className="text-xl font-bold text-[#18301D]">
                  Danh sách học sinh
                </h2>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  showUnavailableMessage(
                    'Tính năng nhập file đang được phát triển.',
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
              >
                <FileSpreadsheet size={18} />
                Nhập từ file
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddError(null)
                  setAddModalOpen(true)
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                <Plus size={18} />
                Thêm học sinh
              </button>
            </div>
          </div>

          <div className="relative mt-5">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, mã học sinh, username hoặc email..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <p className="text-sm text-gray-400">Đang tải danh sách học sinh...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-72 items-center justify-center px-6">
            <p className="text-center text-sm text-red-500">{error}</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Users size={24} />
            </div>
            <h3 className="mt-4 font-semibold text-[#18301D]">
              {search ? 'Không tìm thấy học sinh' : 'Lớp chưa có học sinh'}
            </h3>
            <p className="mt-1 text-center text-sm text-gray-400">
              {search
                ? 'Thử tìm kiếm bằng từ khóa khác.'
                : 'Thêm học sinh đầu tiên vào lớp học.'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-[#F7FAF7]">
                    <th className="w-20 px-5 py-4 text-center text-xs font-bold uppercase text-gray-500">STT</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-gray-500">Học sinh</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-gray-500">Mã học sinh</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-gray-500">Liên hệ</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-gray-500">Ngày tham gia</th>
                    <th className="w-36 px-5 py-4 text-center text-xs font-bold uppercase text-gray-500">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr
                      key={student.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleViewStudent(student)}
                      onKeyDown={(event) =>
                        handleStudentKeyDown(event, student)
                      }
                      className="cursor-pointer border-t border-gray-100 transition-colors hover:bg-[#ECFDF3] active:bg-green-100"
                    >
                      <td className="px-5 py-5 text-center">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-sm font-semibold text-gray-600">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-5 py-5">{renderStudentIdentity(student)}</td>
                      <td className="px-5 py-5">
                        <span className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700">
                          {student.studentCode || '---'}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail size={14} className="text-green-600" />
                            <span className="max-w-52 truncate">{student.email || '---'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Phone size={14} className="text-green-600" />
                            {student.phone || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 text-sm text-gray-500">{formatJoinedDate(student.joinedAt)}</td>
                      <td className="px-5 py-5">{renderActions(student)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-gray-100 md:hidden">
              {filteredStudents.map((student, index) => (
                <div
                  key={student.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleViewStudent(student)}
                  onKeyDown={(event) =>
                    handleStudentKeyDown(event, student)
                  }
                  className="cursor-pointer p-5 transition-colors hover:bg-[#ECFDF3] active:bg-green-100"
                >
                  <div className="flex items-start gap-3">
                    {renderStudentAvatar(student)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#18301D]">{student.fullName || 'Chưa cập nhật'}</p>
                          <p className="mt-1 text-xs text-gray-400">#{index + 1} · @{student.username || '---'}</p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">{student.studentCode || '---'}</span>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="truncate text-sm text-gray-500">{student.email || '---'}</p>
                        <p className="text-sm text-gray-400">Tham gia: {formatJoinedDate(student.joinedAt)}</p>
                      </div>
                      <div className="mt-4">{renderActions(student, true)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <AddStudentModal
        open={addModalOpen}
        loading={adding}
        error={addError}
        onClose={() => {
          if (!adding) {
            setAddModalOpen(false)
            setAddError(null)
          }
        }}
        onSubmit={handleAddStudent}
      />

      <ConfirmModal
        open={Boolean(studentToDelete)}
        title="Xóa học sinh khỏi lớp"
        description={`Bạn có chắc chắn muốn xóa "${studentToDelete?.fullName || 'học sinh này'}" khỏi lớp không?`}
        confirmText="Xóa khỏi lớp"
        danger
        loading={deleting}
        onClose={() => {
          if (!deleting) setStudentToDelete(null)
        }}
        onConfirm={handleDeleteStudent}
      />
      
      <AttendanceModal
      open={!!attendanceStudent}
      student={attendanceStudent}
      loading={attendanceLoading}
      error={attendanceError}
      onClose={() => {
        if (!attendanceLoading) {
          setAttendanceStudent(null)
          setAttendanceError(null)
        }
      }}
      onSubmit={handleSubmitAttendance}
    />
    </>

  )
}

export default StudentsTab
