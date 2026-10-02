import { useMemo, useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Pencil,
  Save,
  Search,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  UserX,
  X,
} from 'lucide-react'
import defaultAvatar from '../../../../assets/images/avatar_default.png'
import attendanceService from '../../../../services/attendanceService'
import {
  formatDate,
  getTodayDate,
  parseDisplayDate,
} from '../../../../utils/dateUtils'


function AttendanceStatusBadge({ status }) {
  const config = {
    PRESENT: {
      label: 'Có mặt',
      className:
        'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    ABSENT: {
      label: 'Vắng',
      className: 'border-red-200 bg-red-50 text-red-600',
    },
    LATE: {
      label: 'Đi trễ',
      className:
        'border-amber-200 bg-amber-50 text-amber-700',
    },
  }

  const current = config[status] ?? {
    label: status || 'Chưa xác định',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${current.className}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {current.label}
    </span>
  )
}

function AttendanceTab() {
  const { classId } = useParams()

  const [attendances, setAttendances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [dateInput, setDateInput] = useState(formatDate(getTodayDate()))
  const [dateError, setDateError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  const [editingAttendance, setEditingAttendance] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const datePickerRef = useRef(null)

const [editTarget, setEditTarget] = useState(null)
const [editForm, setEditForm] = useState({
  date: '',
  status: 'PRESENT',
  note: '',
})
const [updating, setUpdating] = useState(false)
const [editError, setEditError] = useState('')
  
const handleDateInputChange = (value) => {
    setDateInput(value)

    if (!value) {
      setSelectedDate('')
      setDateError('')
      return
    }

    const parsedDate = parseDisplayDate(value)
    setSelectedDate(parsedDate || '')
    setDateError(parsedDate ? '' : 'Nhập ngày hợp lệ theo dạng dd/mm/yyyy.')
  }

const handleDatePickerChange = (value) => {
    setSelectedDate(value)
    setDateInput(value ? formatDate(value) : '')
    setDateError('')
  }

useEffect(() => {
  let cancelled = false

  const fetchAttendances = async () => {
    if (!classId) return

    try {
      setLoading(true)
      setError('')

      const data = await attendanceService.getByClass(classId)

      if (!cancelled) {
        setAttendances(data)
      }
    } catch (error) {
      console.error('Get attendances error:', error)

      if (!cancelled) {
        setAttendances([])
        setError('Không thể tải lịch sử điểm danh.')
      }
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }
  }

  fetchAttendances()

  return () => {
    cancelled = true
  }
}, [classId])

  // Filter theo ngày trước để thống kê đúng ngày đang xem
const dateAttendances = useMemo(() => {
    if (!selectedDate) return attendances

    return attendances.filter(
      (item) => item.date === selectedDate,
    )
  }, [attendances, selectedDate])

  const statusAttendances = useMemo(
    () => dateAttendances.filter(
      (item) => selectedStatus === 'ALL' || item.status === selectedStatus,
    ),
    [dateAttendances, selectedStatus],
  )

const filteredAttendances = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return statusAttendances.filter((item) => {
      return (
        !keyword ||
        String(item.fullName ?? '').toLowerCase().includes(keyword) ||
        String(item.studentCode ?? '').toLowerCase().includes(keyword)
      )
    })
  }, [statusAttendances, search])

const presentCount = statusAttendances.filter(
    (item) => item.status === 'PRESENT',
  ).length

const absentCount = statusAttendances.filter(
    (item) => item.status === 'ABSENT',
  ).length

const lateCount = statusAttendances.filter(
    (item) => item.status === 'LATE',
  ).length

 const handleDelete = (attendance) => {
    setDeleteError('')
    setDeleteTarget(attendance)
  }

const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return

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
    } catch (requestError) {
      console.error('Delete attendance error:', requestError)

      const message =
        requestError.response?.data?.message ||
        requestError.response?.data?.error

      if (requestError.response?.status === 400) {
        setDeleteError(message || 'Không tìm thấy bản ghi điểm danh cần xóa.')
      } else if (requestError.response?.status === 401) {
        setDeleteError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.')
      } else {
        setDeleteError(message || 'Không thể xóa điểm danh. Vui lòng thử lại.')
      }
    } finally {
      setDeleting(false)
    }
  }

const handleSaveEdit = async (event) => {
    event.preventDefault()

    if (!editingAttendance || !classId) return

    try {
      setUpdating(true)
      setEditError('')

      const payload = {
        date: editingAttendance.date,
        status: editingAttendance.status,
        note: editingAttendance.note ?? '',
      }

      const updatedAttendance = await attendanceService.updateAttendance(
        classId,
        editingAttendance.id,
        payload,
      )

      setAttendances((current) =>
        current.map((item) =>
          item.id === updatedAttendance.id
            ? updatedAttendance
            : item,
        ),
      )

      setEditingAttendance(null)
      setEditTarget(null)
      setEditForm({
        date: '',
        status: 'PRESENT',
        note: '',
      })
    } catch (error) {
      console.error('Update attendance error:', error)

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Không thể cập nhật điểm danh. Vui lòng thử lại.'

      setEditError(message)
    } finally {
      setUpdating(false)
    }
  }

const handleOpenEdit = (attendance) => {
  setEditingAttendance(attendance)
  setEditTarget(attendance)

  setEditForm({
    date: attendance.date || '',
    status: attendance.status || 'PRESENT',
    note: attendance.note || '',
  })

  setEditError('')
  }

const handleCloseEdit = () => {
  if (updating) return

  setEditTarget(null)
  setEditError('')

  setEditForm({
    date: '',
    status: 'PRESENT',
    note: '',
  })
}

const handleUpdateAttendance = async (event) => {
  event.preventDefault()

  if (!editTarget || updating) return

  if (!editForm.date) {
    setEditError('Vui lòng chọn ngày điểm danh.')
    return
  }

  if (!['PRESENT', 'ABSENT', 'LATE'].includes(editForm.status)) {
    setEditError('Trạng thái điểm danh không hợp lệ.')
    return
  }

  try {
    setUpdating(true)
    setEditError('')

    const updatedAttendance =
      await attendanceService.updateAttendance(
        classId,
        editTarget.id,
        {
          date: editForm.date,
          status: editForm.status,
          note: editForm.note.trim(),
        }
      )

    // Thay record cũ bằng record BE vừa trả về
    setAttendances((prev) =>
      prev.map((item) =>
        item.id === updatedAttendance.id
          ? updatedAttendance
          : item
      )
    )

    setEditTarget(null)

    setEditForm({
      date: '',
      status: 'PRESENT',
      note: '',
    })
  } catch (error) {
    console.error('Update attendance error:', error)

    const message =
      error.response?.data?.message ||
      error.response?.data?.error

    if (error.response?.status === 400) {
      setEditError(
        message ||
          'Dữ liệu không hợp lệ hoặc học sinh đã được điểm danh trong ngày này.'
      )
    } else if (error.response?.status === 401) {
      setEditError(
        'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'
      )
    } else {
      setEditError(
        message ||
          'Không thể cập nhật điểm danh. Vui lòng thử lại.'
      )
    }
  } finally {
    setUpdating(false)
  }
}

  return (
    <>
      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-[#18301D]">
            Điểm danh
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Quản lý lịch sử điểm danh của học sinh trong lớp
          </p>
        </div>

        {/* Filters */}
        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_190px_190px]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên hoặc mã học sinh..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-400"
            />
          </div>

          <div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={dateInput}
                onChange={(event) => handleDateInputChange(event.target.value)}
                placeholder="dd/mm/yyyy"
                aria-label="Lọc theo ngày, định dạng ngày/tháng/năm"
                aria-invalid={Boolean(dateError)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400"
              />
              <button
                type="button"
                aria-label="Mở bộ chọn ngày"
                onClick={() => {
                  if (datePickerRef.current?.showPicker) {
                    datePickerRef.current.showPicker()
                  } else {
                    datePickerRef.current?.click()
                  }
                }}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <CalendarDays size={18} />
              </button>
              <input
                ref={datePickerRef}
                type="date"
                value={selectedDate}
                onChange={(event) => handleDatePickerChange(event.target.value)}
                aria-label="Chọn ngày"
                tabIndex={-1}
                className="pointer-events-none absolute h-px w-px opacity-0"
              />
            </div>
            {dateError && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {dateError}
              </p>
            )}
          </div>

          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PRESENT">Có mặt</option>
            <option value="ABSENT">Vắng</option>
            <option value="LATE">Đi trễ</option>
          </select>
        </div>

        {/* Selected date */}
        {selectedDate && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays size={16} />
              Đang xem ngày:
              <span className="font-semibold text-slate-800">
                {formatDate(selectedDate)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleDateInputChange('')}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
            >
              <X size={14} />
              Xem tất cả ngày
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={18} />
              Có mặt
            </div>

            <span className="text-xl font-bold text-emerald-700">
              {presentCount}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
              <UserX size={18} />
              Vắng
            </div>

            <span className="text-xl font-bold text-red-600">
              {absentCount}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
              <Clock3 size={18} />
              Đi trễ
            </div>

            <span className="text-xl font-bold text-amber-700">
              {lateCount}
            </span>
          </div>
        </div>

        {/* Result count */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {filteredAttendances.length} bản ghi điểm danh
          </p>
        </div>

        {/* Table */}
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4 font-semibold">
                    Học sinh
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Mã học sinh
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Ngày
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Trạng thái
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Ghi chú
                  </th>

                  <th className="px-5 py-4 text-right font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAttendances.map((attendance) => (
                  <tr
                    key={attendance.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            attendance.studentAvatar ||
                            defaultAvatar
                          }
                          alt={attendance.fullName}
                          className="h-10 w-10 rounded-xl object-cover"
                          onError={(event) => {
                            event.currentTarget.onerror = null
                            event.currentTarget.src =
                              defaultAvatar
                          }}
                        />

                        <p className="font-semibold text-slate-800">
                          {attendance.fullName}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {attendance.studentCode}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(attendance.date)}
                    </td>

                    <td className="px-5 py-4">
                      <AttendanceStatusBadge
                        status={attendance.status}
                      />
                    </td>

                    <td className="max-w-[220px] px-5 py-4 text-sm text-slate-500">
                      <p className="truncate">
                        {attendance.note || '—'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                       <button
                          type="button"
                          onClick={() => handleOpenEdit(attendance)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-green-50 hover:text-green-700"
                          title="Chỉnh sửa điểm danh"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(attendance)
                          }
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          title="Xóa điểm danh"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredAttendances.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      Không tìm thấy bản ghi điểm danh phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    {/* Edit Attendance Modal */}
{editingAttendance && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget && !updating) {
        setEditingAttendance(null)
        setEditError('')
      }
    }}
  >
    <form
      onSubmit={handleSaveEdit}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-attendance-title"
      className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[24px] bg-white shadow-2xl"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
            <UserRoundCheck size={25} strokeWidth={2} />
          </div>

          <div>
            <h3
              id="edit-attendance-title"
              className="text-xl font-bold text-[#18301D]"
            >
              Chỉnh sửa điểm danh
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Cập nhật thông tin điểm danh của học sinh
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={updating}
          onClick={() => {
            setEditingAttendance(null)
            setEditError('')
          }}
          className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Đóng"
        >
          <X size={21} />
        </button>
      </div>

      <div className="space-y-6 px-6 py-6 sm:px-7">
        {/* STUDENT INFORMATION */}
        <div className="flex items-center gap-4 rounded-2xl bg-[#F6F9F6] p-4">
          {editingAttendance.studentAvatar ? (
            <img
              src={editingAttendance.studentAvatar}
              alt={editingAttendance.fullName || 'Học sinh'}
              className="h-14 w-14 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100 text-base font-bold text-green-700">
              {editingAttendance.fullName
                ?.trim()
                .split(/\s+/)
                .map((word) => word[0])
                .slice(-2)
                .join('')
                .toUpperCase() || 'HS'}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-base font-bold text-[#18301D]">
              {editingAttendance.fullName || 'Học sinh'}
            </p>

            <p className="mt-1 truncate text-sm text-slate-400">
              {editingAttendance.studentCode || 'Chưa có mã học sinh'}
            </p>
          </div>
        </div>

        {/* DATE */}
        <div>
          <label
            htmlFor="edit-attendance-date"
            className="mb-2 block text-sm font-semibold text-[#18301D]"
          >
            Ngày điểm danh
          </label>

          <input
            id="edit-attendance-date"
            type="date"
            disabled
            value={editingAttendance.date || ''}
            className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
          />
        </div>

        {/* STATUS */}
        <div>
          <p className="mb-3 text-sm font-semibold text-[#18301D]">
            Trạng thái
            <span className="ml-1 text-red-500">*</span>
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* PRESENT */}
            <button
              type="button"
              disabled={updating}
              onClick={() =>
                setEditingAttendance((current) => ({
                  ...current,
                  status: 'PRESENT',
                }))
              }
              className={`relative min-h-[130px] rounded-2xl border p-4 text-left transition ${
                editingAttendance.status === 'PRESENT'
                  ? 'border-green-400 bg-green-50 text-green-700 ring-1 ring-green-200'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-green-200 hover:bg-green-50/30'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  editingAttendance.status === 'PRESENT'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                <UserRoundCheck size={21} />
              </div>

              {editingAttendance.status === 'PRESENT' && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                  <Check size={15} strokeWidth={2.5} />
                </div>
              )}

              <p className="mt-3 text-sm font-bold">
                Có mặt
              </p>

              <p className="mt-1 text-xs leading-5 opacity-70">
                Học sinh có mặt trong lớp
              </p>
            </button>

            {/* ABSENT */}
            <button
              type="button"
              disabled={updating}
              onClick={() =>
                setEditingAttendance((current) => ({
                  ...current,
                  status: 'ABSENT',
                }))
              }
              className={`relative min-h-[130px] rounded-2xl border p-4 text-left transition ${
                editingAttendance.status === 'ABSENT'
                  ? 'border-red-300 bg-red-50 text-red-600 ring-1 ring-red-100'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50/30'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  editingAttendance.status === 'ABSENT'
                    ? 'bg-red-100 text-red-500'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                <UserRoundX size={21} />
              </div>

              {editingAttendance.status === 'ABSENT' && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-red-500 shadow-sm">
                  <Check size={15} strokeWidth={2.5} />
                </div>
              )}

              <p className="mt-3 text-sm font-bold">
                Vắng
              </p>

              <p className="mt-1 text-xs leading-5 opacity-70">
                Học sinh không có mặt
              </p>
            </button>

            {/* LATE */}
            <button
              type="button"
              disabled={updating}
              onClick={() =>
                setEditingAttendance((current) => ({
                  ...current,
                  status: 'LATE',
                }))
              }
              className={`relative min-h-[130px] rounded-2xl border p-4 text-left transition ${
                editingAttendance.status === 'LATE'
                  ? 'border-amber-300 bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50/30'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  editingAttendance.status === 'LATE'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                <Clock3 size={21} />
              </div>

              {editingAttendance.status === 'LATE' && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-amber-600 shadow-sm">
                  <Check size={15} strokeWidth={2.5} />
                </div>
              )}

              <p className="mt-3 text-sm font-bold">
                Đi trễ
              </p>

              <p className="mt-1 text-xs leading-5 opacity-70">
                Học sinh đến lớp muộn
              </p>
            </button>
          </div>
        </div>

        {/* NOTE */}
        <div>
          <label
            htmlFor="edit-attendance-note"
            className="mb-2 block text-sm font-semibold text-[#18301D]"
          >
            Ghi chú
            <span className="ml-1 font-normal text-slate-400">
              (không bắt buộc)
            </span>
          </label>

          <textarea
            id="edit-attendance-note"
            rows={4}
            disabled={updating}
            value={editingAttendance.note ?? ''}
            onChange={(event) =>
              setEditingAttendance((current) => ({
                ...current,
                note: event.target.value,
              }))
            }
            placeholder="Ví dụ: Đến muộn 10 phút..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#18301D] outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>

        {/* ERROR */}
        {editError && (
          <div
            role="alert"
            className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {editError}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-5 sm:px-7">
        <button
          type="button"
          disabled={updating}
          onClick={() => {
            setEditingAttendance(null)
            setEditError('')
          }}
          className="min-w-[100px] rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Hủy
        </button>

        <button
          type="submit"
          disabled={updating}
          className="flex min-w-[145px] items-center justify-center gap-2 rounded-xl bg-[#009E49] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00863E] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updating ? (
            <>
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
              Đang lưu...
            </>
          ) : (
            <>
              <Save size={17} />
              Lưu thay đổi
            </>
          )}
        </button>
      </div>
    </form>
  </div>
)}

{deleteTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null)
              setDeleteError('')
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-attendance-title"
            className="w-full max-w-lg rounded-[20px] bg-white px-7 py-8 shadow-2xl sm:px-8"
          >
            <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertTriangle size={28} strokeWidth={2} />
            </div>

            <div className="mt-6 text-center">
              <h3 id="delete-attendance-title" className="text-xl font-bold text-[#18301D] sm:text-[22px]">
                Xóa điểm danh?
              </h3>
              <p className="mt-3 text-base leading-7 text-slate-500">
                Bạn có chắc chắn muốn xóa điểm danh của{' '}
                <span className="font-medium text-slate-600">{deleteTarget.fullName}</span>{' '}
                vào ngày{' '}
                <span className="font-medium text-slate-600">{formatDate(deleteTarget.date)}</span>?
              </p>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-600"
              >
                {deleteError}
              </div>
            )}

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteTarget(null)
                  setDeleteError('')
                }}
                className="min-h-14 rounded-2xl border border-slate-200 px-4 py-3 text-base font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#ff2936] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#ed1c2a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  'Xóa điểm danh'
                )}
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  )
}

export default AttendanceTab