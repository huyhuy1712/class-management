import {
  CalendarDays,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

function getLocalDate() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDisplayDate(date) {
  if (!date) return '---'

  const [year, month, day] = date.split('-')

  return `${day}/${month}/${year}`
}

function getTimeFromDateTime(value) {
  const match = String(value ?? '').match(/T(\d{2}:\d{2})/)
  return match?.[1] ?? ''
}

function CreateAttendanceSessionModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  loadingSession = false,
  existingSession = null,
  sessionLookupFailed = false,
  error = '',
}) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [date, setDate] = useState(getLocalDate())

  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [lateTime, setLateTime] = useState('')

  const [validationError, setValidationError] = useState('')


  useEffect(() => {
    if (!open) return

    setPassword(existingSession?.attendanceCode ?? '')
    setShowPassword(false)
    setDate(existingSession?.lessonDate ?? getLocalDate())
    setStartTime(getTimeFromDateTime(existingSession?.startTime))
    setEndTime(getTimeFromDateTime(existingSession?.endTime))
    setLateTime(getTimeFromDateTime(existingSession?.lateTime))
    setValidationError('')
  }, [open, existingSession])

  if (!open) return null

  const handleClose = () => {
    if (loading || loadingSession) return

    setValidationError('')
    onClose?.()
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    setValidationError('')

    const cleanPassword = password.trim()

    if (loadingSession || sessionLookupFailed) {
      return
    }

    if (!cleanPassword) {
      setValidationError(
        'Vui lòng nhập mật khẩu điểm danh.',
      )
      return
    }

    if (!startTime) {
      setValidationError(
        'Vui lòng chọn thời gian bắt đầu điểm danh.',
      )
      return
    }

  if (!lateTime) {
    setValidationError(
    'Vui lòng chọn thời gian bắt đầu tính đi trễ.',
  )
  return
}

    if (!endTime) {
      setValidationError(
        'Vui lòng chọn thời gian kết thúc điểm danh.',
      )
      return
    }

    if (lateTime > endTime) {
  setValidationError(
    'Thời gian tính đi trễ không được sau thời gian kết thúc.',
  )
  return

  }

    if (endTime <= startTime) {
      setValidationError(
        'Thời gian kết thúc phải sau thời gian bắt đầu.',
      )
      return
    }

    onSubmit?.({
      password: cleanPassword,
      date,
      startTime,
      lateTime,
      endTime,
    })
  }

  const displayError = validationError || error

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading &&
          !loadingSession
        ) {
          handleClose()
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <Clock3 size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#18301D]">
                {existingSession ? 'Cập nhật điểm danh' : 'Tạo điểm danh'}
              </h2>

              <p className="mt-0.5 text-sm text-slate-400">
                Thiết lập phiên điểm danh cho lớp học
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={loading || loadingSession}
            onClick={handleClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] overflow-y-auto p-6">
            {loadingSession && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700"
              >
                Đang kiểm tra phiên điểm danh trong ngày...
              </div>
            )}

            {existingSession && !loadingSession && (
              <div className="mb-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
                Đã có phiên điểm danh trong ngày.
              </div>
            )}

            {sessionLookupFailed && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                Không thể xác nhận phiên điểm danh hiện tại. Hãy đóng và mở lại cửa sổ để thử lại trước khi lưu.
              </div>
            )}

            {/* PASSWORD */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#18301D]">
                Mật khẩu điểm danh
              </label>

              <div className="relative">
                <KeyRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  disabled={loading || loadingSession}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setValidationError('')
                  }}
                  placeholder="Nhập mật khẩu điểm danh"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-50 disabled:bg-slate-50"
                />

                <button
                  type="button"
                  disabled={loading || loadingSession}
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={
                    showPassword
                      ? 'Ẩn mật khẩu'
                      : 'Hiện mật khẩu'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <p className="mt-1.5 text-xs text-slate-400">
                Học sinh sử dụng mật khẩu này để tham gia
                điểm danh.
              </p>
            </div>

            {/* DATE */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-[#18301D]">
                Ngày điểm danh
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <CalendarDays
                  size={18}
                  className="shrink-0 text-green-600"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700">
                    {formatDisplayDate(date)}
                  </p>
                </div>

                <span className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                  Hôm nay
                </span>
              </div>

              <p className="mt-1.5 text-xs text-slate-400">
                Ngày điểm danh được lấy tự động theo ngày
                hiện tại trên thiết bị.
              </p>
            </div>

            {/* TIME */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* START */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#18301D]">
                    Bắt đầu
                  </label>

                  <div className="relative">
                    <Clock3
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-green-600"
                    />

                    <input
                      type="time"
                      value={startTime}
                      disabled={loading || loadingSession}
                      onChange={(event) => {
                        setStartTime(event.target.value)
                        setValidationError('')
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-2 text-sm font-medium text-slate-700 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-50"
                    />
                  </div>
                </div>

                {/* LATE */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#18301D]">
                    Tính đi trễ
                  </label>

                  <div className="relative">
                    <Clock3
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-500"
                    />

                    <input
                      type="time"
                      value={lateTime}
                      disabled={loading || loadingSession}
                      onChange={(event) => {
                        setLateTime(event.target.value)
                        setValidationError('')
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-2 text-sm font-medium text-slate-700 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                </div>

                {/* END */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#18301D]">
                    Kết thúc
                  </label>

                  <div className="relative">
                    <Clock3
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-red-400"
                    />

                    <input
                      type="time"
                      value={endTime}
                      disabled={loading || loadingSession}
                      onChange={(event) => {
                        setEndTime(event.target.value)
                        setValidationError('')
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-2 text-sm font-medium text-slate-700 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
                    />
                  </div>
                </div>
              </div>

            {/* SESSION PREVIEW */}
              {startTime &&
                lateTime &&
                endTime &&
                startTime <= lateTime &&
                lateTime <= endTime && (
                  <div className="mt-5 rounded-xl border border-green-100 bg-green-50/60 p-4">
                    <p className="text-sm font-semibold text-green-800">
                      Thời gian điểm danh
                    </p>

                    <div className="mt-2 space-y-1 text-sm text-green-700">
                      <p>
                        Bắt đầu:{' '}
                        <span className="font-bold">{startTime}</span>
                      </p>

                      <p>
                        Tính đi trễ từ:{' '}
                        <span className="font-bold">{lateTime}</span>
                      </p>

                      <p>
                        Kết thúc:{' '}
                        <span className="font-bold">{endTime}</span>
                      </p>
                    </div>
                  </div>
                )}

            {/* ERROR */}
            {displayError && (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-600">
                  {displayError}
                </p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <button
              type="button"
              disabled={loading || loadingSession}
              onClick={handleClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading || loadingSession || sessionLookupFailed}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Clock3 size={17} />

              {loading
                ? existingSession
                  ? 'Đang cập nhật...'
                  : 'Đang tạo...'
                : existingSession
                  ? 'Cập nhật điểm danh'
                  : 'Tạo điểm danh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateAttendanceSessionModal