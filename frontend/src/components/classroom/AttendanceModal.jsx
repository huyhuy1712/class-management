import {
  CalendarDays,
  Check,
  Clock3,
  UserCheck,
  UserX,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const STATUS_OPTIONS = [
  {
    value: 'PRESENT',
    label: 'Có mặt',
    description: 'Học sinh có mặt trong lớp',
    icon: UserCheck,
    activeClass:
      'border-green-400 bg-green-50 text-green-700 ring-2 ring-green-100',
  },
  {
    value: 'ABSENT',
    label: 'Vắng',
    description: 'Học sinh không có mặt',
    icon: UserX,
    activeClass:
      'border-red-400 bg-red-50 text-red-600 ring-2 ring-red-100',
  },
  {
    value: 'LATE',
    label: 'Đi trễ',
    description: 'Học sinh đến lớp muộn',
    icon: Clock3,
    activeClass:
      'border-orange-400 bg-orange-50 text-orange-600 ring-2 ring-orange-100',
  },
]

function StudentSummary({ student }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#F7FAF7] p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">
        {student.fullName
          ?.trim()
          .split(/\s+/)
          .slice(-2)
          .map((item) => item[0])
          .join('')
          .toUpperCase() || 'HS'}
      </div>

      <div>
        <p className="font-semibold text-[#18301D]">{student.fullName}</p>
        <p className="mt-1 text-xs text-gray-400">
          {student.studentCode} · @{student.username}
        </p>
      </div>
    </div>
  )
}

function StatusButton({ option, active, disabled, onSelect }) {
  const Icon = option.icon

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(option.value)}
      className={`relative rounded-xl border p-3 text-left transition ${
        active
          ? option.activeClass
          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {active && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white">
          <Check size={13} />
        </span>
      )}

      <Icon size={19} />
      <p className="mt-2 text-sm font-semibold">{option.label}</p>
      <p className="mt-1 hidden text-[11px] opacity-70 sm:block">
        {option.description}
      </p>
    </button>
  )
}

function AttendanceModal({
  open,
  student,
  loading = false,
  error = null,
  onClose,
  onSubmit,
}) {
  const [date, setDate] = useState(getToday())
  const [status, setStatus] = useState('PRESENT')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) return

    setDate(getToday())
    setStatus('PRESENT')
    setNote('')
  }, [open, student?.id])

  if (!open || !student) return null

  const handleSubmit = (event) => {
    event.preventDefault()

    onSubmit({
      date,
      status,
      note: note.trim(),
    })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-4 backdrop-blur-[2px] sm:items-center sm:py-6"
      onClick={() => {
        if (!loading) onClose()
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <UserCheck size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#18301D]">
                Điểm danh học sinh
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Cập nhật trạng thái tham gia lớp học
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <StudentSummary student={student} />

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#18301D]">
              Ngày điểm danh
            </label>

            <div className="relative">
              <CalendarDays
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="date"
                disabled
                value={date}
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#18301D]">
              Trạng thái
              <span className="ml-1 text-red-500">*</span>
            </label>

            <div className="grid gap-2 sm:grid-cols-3">
              {STATUS_OPTIONS.map((option) => (
                <StatusButton
                  key={option.value}
                  option={option}
                  active={status === option.value}
                  disabled={loading}
                  onSelect={setStatus}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#18301D]">
              Ghi chú
              <span className="ml-1 font-normal text-gray-400">
                (không bắt buộc)
              </span>
            </label>

            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ví dụ: Đến muộn 10 phút..."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserCheck size={17} />
            {loading ? 'Đang lưu...' : 'Lưu điểm danh'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AttendanceModal
