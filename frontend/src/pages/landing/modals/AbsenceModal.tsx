import { Calendar, Clock3, X } from 'lucide-react'
import type { ClassItem, StudentProfile } from '../types'

interface Props {
  student: StudentProfile
  classItem: ClassItem
  onClose: () => void
}

export default function AbsenceModal({ student, classItem, onClose }: Props) {
  const details = classItem.absenceDetails || []
  const present = details.filter((item) => item.status === 'PRESENT').length
  const late = details.filter((item) => item.status === 'LATE').length
  const absent = classItem.absentCount ?? details.filter((item) => item.status === 'ABSENT').length
  const summary = [
    {
      label: 'Tổng số buổi',
      value: classItem.totalSessions || details.length,
      color: 'border-sky-200 bg-sky-50 text-sky-800',
      valueColor: 'text-sky-900',
    },
    {
      label: 'Có mặt',
      value: present,
      color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      valueColor: 'text-emerald-900',
    },
    {
      label: 'Đi trễ',
      value: late,
      color: 'border-amber-200 bg-amber-50 text-amber-800',
      valueColor: 'text-amber-900',
    },
    {
      label: 'Vắng mặt',
      value: absent,
      color: 'border-rose-200 bg-rose-50 text-rose-800',
      valueColor: 'text-rose-900',
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#0F3822] to-emerald-800 px-6 py-5 text-white sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Calendar size={21} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold sm:text-lg">Chi tiết lịch sử chuyên cần</h3>
              <p className="mt-0.5 truncate text-xs text-emerald-100 sm:text-sm">
                {student.fullName} ({student.studentCode}) <span aria-hidden="true">•</span>{' '}
                {classItem.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Đóng hộp thoại"
            onClick={onClose}
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-7">
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {summary.map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.color}`}
              >
                <span className="block text-xs font-semibold opacity-80">{item.label}</span>
                <span className={`mt-1 block text-2xl font-extrabold ${item.valueColor}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-bold text-slate-800">Các buổi điểm danh</h4>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {details.length} buổi
            </span>
          </div>

          {details.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-emerald-900/20 bg-[#F8FAF9] py-9 text-center text-sm text-gray-500">
              Chưa có dữ liệu điểm danh cho lớp học phần này.
            </p>
          ) : (
            <div className="space-y-3">
              {details.map((item, index) => {
                const isAbsent = item.status === 'ABSENT'
                const isLate = item.status === 'LATE'
                const statusLabel = isAbsent ? 'Vắng mặt' : isLate ? 'Đi trễ' : 'Có mặt'
                const statusColor = isAbsent
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : isLate
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                const accentColor = isAbsent
                  ? 'border-l-rose-400'
                  : isLate
                    ? 'border-l-amber-400'
                    : 'border-l-emerald-400'

                return (
                  <div
                    key={`${item.date}-${index}`}
                    className={`rounded-2xl border border-slate-100 border-l-4 ${accentColor} bg-white p-4 shadow-sm`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800">
                          {item.sessionName || `Buổi ${index + 1}`}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
                          <span>{item.date}</span>
                          {item.attendanceTime && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                              <Clock3 size={12} />
                              {item.attendanceTime}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    {item.note && (
                      <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                        <span className="font-semibold text-slate-700">Ghi chú:</span> {item.note}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-700/20"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
