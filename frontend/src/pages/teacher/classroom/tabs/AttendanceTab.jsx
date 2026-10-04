import { useMemo, useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Pencil,
  Search,
  Trash2,
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
import AttendanceStatusBadge from './attendance/AttendanceStatusBadge'
import DeleteAttendanceModal from './attendance/modals/DeleteAttendanceModal'
import EditAttendanceModal from './attendance/modals/EditAttendanceModal'
import useAttendanceActions from './attendance/useAttendanceActions'
import ExportAttendanceModal from './attendance/modals/ExportAttendanceModal'

function formatAttendanceTime(createdAt) {
  const match = String(createdAt ?? '').match(/T(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : ''
}

function AttendanceTab() {
  const { classId } = useParams()

  const [attendances, setAttendances] = useState([])

  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [dateInput, setDateInput] = useState(formatDate(getTodayDate()))
  const [dateError, setDateError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportDate, setExportDate] = useState(getTodayDate())
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const datePickerRef = useRef(null)
  const {
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
  } = useAttendanceActions(classId, setAttendances)
  
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
      const data = await attendanceService.getByClass(classId)

      if (!cancelled) {
        setAttendances(data)
      }
    } catch (error) {
      console.error('Get attendances error:', error)

      if (!cancelled) {
        setAttendances([])
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

  const handleOpenExport = () => {
  setExportError('')

  // Nếu đang lọc một ngày thì lấy luôn ngày đó.
  // Nếu đang xem tất cả thì mặc định hôm nay.
  setExportDate(selectedDate || getTodayDate())

  setExportModalOpen(true)
}

const handleCloseExport = () => {
  if (exporting) return

  setExportModalOpen(false)
  setExportError('')
}

const handleExportAttendance = async () => {
  if (exporting) return

  if (!exportDate) {
    setExportError('Vui lòng chọn ngày cần xuất điểm danh.')
    return
  }

  if (!classId) {
    setExportError('Không xác định được lớp học.')
    return
  }

  try {
    setExporting(true)
    setExportError('')

    const response =
      await attendanceService.exportAttendance(
        classId,
        exportDate,
      )

    const blob = response.data

    // Lấy tên file backend gửi trong Content-Disposition
    const contentDisposition =
      response.headers?.['content-disposition']

    let fileName = `diemdanh_${exportDate}.xlsx`

    if (contentDisposition) {
      // Hỗ trợ filename*=UTF-8''...
      const utf8Match = contentDisposition.match(
        /filename\*=UTF-8''([^;]+)/i,
      )

      // Hỗ trợ filename="..."
      const normalMatch = contentDisposition.match(
        /filename="?([^"]+)"?/i,
      )

      if (utf8Match?.[1]) {
        try {
          fileName = decodeURIComponent(utf8Match[1])
        } catch {
          fileName = utf8Match[1]
        }
      } else if (normalMatch?.[1]) {
        fileName = normalMatch[1].trim()
      }
    }

    const downloadUrl = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName

    document.body.appendChild(link)
    link.click()
    link.remove()

    window.URL.revokeObjectURL(downloadUrl)

    setExportModalOpen(false)
  } catch (exportAttendanceError) {
    console.error(
      'Export attendance error:',
      exportAttendanceError,
    )

    const status = exportAttendanceError.response?.status

    if (status === 400) {
      setExportError(
        'Không thể xuất điểm danh. Vui lòng kiểm tra lớp học và ngày đã chọn.',
      )
    } else if (status === 401) {
      setExportError(
        'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
      )
    } else {
      setExportError(
        'Không thể xuất file Excel. Vui lòng thử lại.',
      )
    }
  } finally {
    setExporting(false)
  }
}

  return (
    <>
      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
        {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-[#18301D]">
                Điểm danh
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Quản lý lịch sử điểm danh của học sinh trong lớp
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenExport}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              <Download size={18} />
              Xuất Excel
            </button>
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
                      <div>{formatDate(attendance.date)}</div>
                      {formatAttendanceTime(attendance.createdAt) && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Clock3 size={13} />
                          <span>
                            Điểm danh: {formatAttendanceTime(attendance.createdAt)}
                          </span>
                        </div>
                      )}
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
                          onClick={() => openEdit(attendance)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-green-50 hover:text-green-700"
                          title="Chỉnh sửa điểm danh"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            requestDelete(attendance)
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

      <EditAttendanceModal
        attendance={editingAttendance}
        updating={updating}
        error={editError}
        onAttendanceChange={updateEditingAttendance}
        onClose={closeEdit}
        onSubmit={saveEdit}
      />
      <DeleteAttendanceModal
        attendance={deleteTarget}
        deleting={deleting}
        error={deleteError}
        onClose={closeDelete}
        onConfirm={confirmDelete}
      />

    <ExportAttendanceModal
      open={exportModalOpen}
      date={exportDate}
      exporting={exporting}
      error={exportError}
      onDateChange={(value) => {
        setExportDate(value)
        setExportError('')
      }}
      onClose={handleCloseExport}
      onExport={handleExportAttendance}
    />

    <EditAttendanceModal
      attendance={editingAttendance}
      updating={updating}
      error={editError}
      onAttendanceChange={updateEditingAttendance}
      onClose={closeEdit}
      onSubmit={saveEdit}
    />

    <DeleteAttendanceModal
      attendance={deleteTarget}
      deleting={deleting}
      error={deleteError}
      onClose={closeDelete}
      onConfirm={confirmDelete}
    />
      
    </>
  )
}

export default AttendanceTab