import { CheckCircle2, Search, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import userService from '../../services/userService'
import defaultAvatar from '../../assets/images/avatar_default.png'

function AddStudentModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  error = null,
}) {
  const [studentCode, setStudentCode] = useState('')
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)

  const [loadingStudents, setLoadingStudents] = useState(false)
  const [searchError, setSearchError] = useState(null)

  useEffect(() => {
    if (!open) {
      setStudentCode('')
      setStudents([])
      setSelectedStudent(null)
      setSearchError(null)
      return
    }

    const fetchStudents = async () => {
      try {
        setLoadingStudents(true)
        setSearchError(null)

        const data = await userService.getStudents()

        setStudents(data)
      } catch (error) {
        console.error('Get students error:', error)

        setSearchError(
          'Không thể tải danh sách học sinh.',
        )
      } finally {
        setLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [open])

  useEffect(() => {
    const normalizedCode = studentCode
      .trim()
      .toLowerCase()

    if (!normalizedCode) {
      setSelectedStudent(null)
      setSearchError(null)
      return
    }

    if (loadingStudents) {
      return
    }

    const student = students.find(
      (item) =>
        item.studentCode?.trim().toLowerCase() ===
        normalizedCode,
    )

    if (student) {
      setSelectedStudent(student)
      setSearchError(null)
    } else {
      setSelectedStudent(null)
    }
  }, [studentCode, students, loadingStudents])

  if (!open) return null

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!selectedStudent) {
      setSearchError(
        'Không tìm thấy học sinh với mã này.',
      )
      return
    }

    if (selectedStudent.status !== 'ACTIVE') {
      setSearchError(
        'Tài khoản học sinh chưa được kích hoạt.',
      )
      return
    }

    onSubmit(selectedStudent.id)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
      onMouseDown={() => {
        if (!loading) onClose()
      }}
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-7 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <UserPlus size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#18301D]">
                Thêm học sinh
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Tìm học sinh bằng mã học sinh
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={21} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-7 py-6"
        >
          <label
            htmlFor="student-code"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Mã học sinh
            <span className="ml-1 text-red-500">*</span>
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="student-code"
              type="text"
              value={studentCode}
              onChange={(event) => {
                setStudentCode(event.target.value)
                setSearchError(null)
              }}
              placeholder="VD: SV2026005"
              disabled={loading || loadingStudents}
              autoFocus
              className="w-full rounded-xl border border-gray-200 py-3.5 pl-11 pr-4 text-sm uppercase text-gray-700 outline-none transition placeholder:normal-case placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-gray-50"
            />
          </div>

          {loadingStudents && (
            <p className="mt-2 text-sm text-gray-400">
              Đang tải danh sách học sinh...
            </p>
          )}

          {/* Student found */}
          {selectedStudent && (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50/60 p-4">
              <div className="flex items-start gap-3">
                <img
                  src={selectedStudent.avatar || defaultAvatar}
                  alt={selectedStudent.fullName || 'Học sinh'}
                  onError={(event) => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = defaultAvatar
                  }}
                  className="h-12 w-12 shrink-0 rounded-full border border-green-100 object-cover"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#18301D]">
                      {selectedStudent.fullName}
                    </p>

                    <CheckCircle2
                      size={17}
                      className="text-green-600"
                    />
                  </div>

                  <p className="mt-1 text-sm font-medium text-green-700">
                    {selectedStudent.studentCode}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    @{selectedStudent.username}
                  </p>

                  <p className="mt-1 truncate text-sm text-gray-400">
                    {selectedStudent.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No student */}
          {studentCode.trim() &&
            !selectedStudent &&
            !loadingStudents &&
            !searchError && (
              <p className="mt-3 text-sm text-orange-500">
                Không tìm thấy học sinh với mã này.
              </p>
            )}

          {/* Search error */}
          {searchError && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">
                {searchError}
              </p>
            </div>
          )}

          {/* POST error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          <div className="mt-7 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                loadingStudents ||
                !selectedStudent ||
                selectedStudent.status !== 'ACTIVE'
              }
              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
            >
              <UserPlus size={17} />

              {loading
                ? 'Đang thêm...'
                : 'Thêm học sinh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddStudentModal