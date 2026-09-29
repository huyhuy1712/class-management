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
import { useOutletContext } from 'react-router-dom'

import AddStudentModal from '../../../../components/classroom/detail/AddStudentModal'
import classroomService from '../../../../services/classroomService'

function StudentsTab() {
  const { classroom } = useOutletContext()

  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  const getErrorMessage = (data) => {
    if (!data) return ''

    if (typeof data === 'string') {
      return data
    }

    return data.message || data.error || ''
  }

  // =========================
  // GET STUDENTS
  // =========================
  useEffect(() => {
    const fetchStudents = async () => {
      if (!classroom?.id) return

      try {
        setLoading(true)
        setError(null)

        const data = await classroomService.getStudents(
          classroom.id,
        )

        console.log('Students from BE:', data)

        setStudents(data)
      } catch (error) {
        console.error(
          'Get classroom students error:',
          error,
        )

        const backendMessage = getErrorMessage(
          error.response?.data,
        )

        setError(
          backendMessage ||
            'Không thể tải danh sách học sinh.',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [classroom?.id])

  // =========================
  // SEARCH
  // =========================
  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return students
    }

    return students.filter((student) => {
      return (
        student.fullName
          ?.toLowerCase()
          .includes(keyword) ||
        student.studentCode
          ?.toLowerCase()
          .includes(keyword) ||
        student.username
          ?.toLowerCase()
          .includes(keyword) ||
        student.email
          ?.toLowerCase()
          .includes(keyword)
      )
    })
  }, [students, search])

  // =========================
  // ADD STUDENT
  // =========================
  const handleAddStudent = async (studentId) => {
    try {
      setAdding(true)
      setAddError(null)

      const student =
        await classroomService.addStudent(
          classroom.id,
          studentId,
        )

      // Thêm ngay lên UI, không cần GET lại
      setStudents((prev) => [
        student,
        ...prev,
      ])

      setAddModalOpen(false)
    } catch (error) {
      console.error('Add student error:', error)

      const status = error.response?.status
      const backendMessage = getErrorMessage(
        error.response?.data,
      )

      if (status === 403) {
        setAddError(
          backendMessage ||
            'Học sinh này đã có trong lớp học.',
        )
        return
      }

      if (status === 400) {
        setAddError(
          backendMessage ||
            'Không tìm thấy học sinh hoặc tài khoản học sinh không hợp lệ.',
        )
        return
      }

      setAddError(
        backendMessage ||
          'Không thể thêm học sinh. Vui lòng thử lại.',
      )
    } finally {
      setAdding(false)
    }
  }

  // =========================
  // CHƯA CÓ API
  // =========================
  const handleAttendance = (student) => {
    console.log(
      'Attendance student:',
      student,
    )
  }

  const handleDeleteStudent = (student) => {
    console.log(
      'Delete student:',
      student,
    )
  }

  // =========================
  // HELPERS
  // =========================
  const formatJoinedDate = (value) => {
    if (!value) return '---'

    return new Intl.DateTimeFormat(
      'vi-VN',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    ).format(new Date(value))
  }

  const getInitials = (name) => {
    if (!name) return 'HS'

    const parts = name
      .trim()
      .split(/\s+/)

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase()
    }

    return `${
      parts[0][0]
    }${
      parts[parts.length - 1][0]
    }`.toUpperCase()
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">

        {/* ================= HEADER ================= */}
        <div className="border-b border-gray-100 p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                  <Users size={21} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#18301D]">
                    Danh sách học sinh
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    {students.length} học sinh trong{' '}
                    {classroom.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  console.log(
                    'Import students',
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
              >
                <FileSpreadsheet
                  size={18}
                />
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

          {/* SEARCH */}
          <div className="relative mt-5">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Tìm theo tên, mã học sinh, username hoặc email..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100"
            />
          </div>
        </div>

        {/* ================= LOADING ================= */}
        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <p className="text-sm text-gray-400">
              Đang tải danh sách học sinh...
            </p>
          </div>
        ) : error ? (
          /* ================= ERROR ================= */
          <div className="flex min-h-72 items-center justify-center px-6">
            <p className="text-center text-sm text-red-500">
              {error}
            </p>
          </div>
        ) : filteredStudents.length ===
          0 ? (
          /* ================= EMPTY ================= */
          <div className="flex min-h-72 flex-col items-center justify-center px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Users size={24} />
            </div>

            <h3 className="mt-4 font-semibold text-[#18301D]">
              {search
                ? 'Không tìm thấy học sinh'
                : 'Lớp chưa có học sinh'}
            </h3>

            <p className="mt-1 text-center text-sm text-gray-400">
              {search
                ? 'Thử tìm kiếm bằng từ khóa khác.'
                : 'Thêm học sinh đầu tiên vào lớp học.'}
            </p>
          </div>
        ) : (
          <>
            {/* ================= DESKTOP ================= */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-[#F7FAF7]">
                    <th className="w-20 px-5 py-4 text-center text-xs font-bold uppercase text-gray-500">
                      STT
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-gray-500">
                      Học sinh
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-gray-500">
                      Mã học sinh
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-gray-500">
                      Liên hệ
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-gray-500">
                      Ngày tham gia
                    </th>

                    <th className="w-36 px-5 py-4 text-center text-xs font-bold uppercase text-gray-500">
                      Hành động
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student, index) => (
                      <tr
                        key={student.id}
                        className="border-t border-gray-100 transition hover:bg-green-50/40"
                      >
                        {/* STT */}
                        <td className="px-5 py-5 text-center">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-sm font-semibold text-gray-600">
                            {index + 1}
                          </span>
                        </td>

                        {/* STUDENT */}
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">

                            {student.avatar &&
                            student.avatar !==
                              'avatar' ? (
                              <img
                                src={
                                  student.avatar
                                }
                                alt={
                                  student.fullName
                                }
                                className="h-11 w-11 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                                {getInitials(
                                  student.fullName,
                                )}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="font-semibold text-[#18301D]">
                                {student.fullName ||
                                  'Chưa cập nhật'}
                              </p>

                              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                                <UserRound
                                  size={13}
                                />
                                @
                                {
                                  student.username
                                }
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* STUDENT CODE */}
                        <td className="px-5 py-5">
                          <span className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700">
                            {student.studentCode ||
                              '---'}
                          </span>
                        </td>

                        {/* CONTACT */}
                        <td className="px-5 py-5">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Mail
                                size={14}
                                className="text-green-600"
                              />

                              <span className="max-w-52 truncate">
                                {student.email ||
                                  '---'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Phone
                                size={14}
                                className="text-green-600"
                              />

                              {student.phone ||
                                'Chưa cập nhật'}
                            </div>
                          </div>
                        </td>

                        {/* JOINED */}
                        <td className="px-5 py-5 text-sm text-gray-500">
                          {formatJoinedDate(
                            student.joinedAt,
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-5">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              title="Điểm danh"
                              onClick={() =>
                                handleAttendance(
                                  student,
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-200 text-green-600 transition hover:bg-green-50"
                            >
                              <CalendarCheck
                                size={18}
                              />
                            </button>

                            <button
                              type="button"
                              title="Xóa khỏi lớp"
                              onClick={() =>
                                handleDeleteStudent(
                                  student,
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50"
                            >
                              <Trash2
                                size={18}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* ================= MOBILE ================= */}
            <div className="divide-y divide-gray-100 md:hidden">
              {filteredStudents.map(
                (student, index) => (
                  <div
                    key={student.id}
                    className="p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                        {getInitials(
                          student.fullName,
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#18301D]">
                              {
                                student.fullName
                              }
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              #{index + 1} • @
                              {
                                student.username
                              }
                            </p>
                          </div>

                          <span className="shrink-0 rounded-lg bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                            {
                              student.studentCode
                            }
                          </span>
                        </div>

                        <div className="mt-3 space-y-1">
                          <p className="truncate text-sm text-gray-500">
                            {student.email}
                          </p>

                          <p className="text-sm text-gray-400">
                            Tham gia:{' '}
                            {formatJoinedDate(
                              student.joinedAt,
                            )}
                          </p>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleAttendance(
                                student,
                              )
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-200 py-2.5 text-sm font-semibold text-green-700"
                          >
                            <CalendarCheck
                              size={17}
                            />
                            Điểm danh
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteStudent(
                                student,
                              )
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500"
                          >
                            <Trash2
                              size={17}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </section>

      {/* ================= ADD STUDENT MODAL ================= */}
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
    </>
  )
}

export default StudentsTab