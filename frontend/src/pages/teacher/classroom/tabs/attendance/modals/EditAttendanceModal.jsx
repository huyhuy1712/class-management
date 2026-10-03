import {
  Check,
  Clock3,
  LoaderCircle,
  Save,
  UserRoundCheck,
  UserRoundX,
  X,
} from 'lucide-react'

const STATUS_OPTIONS = [
  {
    value: 'PRESENT',
    label: 'Có mặt',
    description: 'Học sinh có mặt trong lớp',
    Icon: UserRoundCheck,
    selected:
      'border-green-400 bg-green-50 text-green-700 ring-1 ring-green-200',
    iconSelected: 'bg-green-100 text-green-600',
    checkColor: 'text-green-600',
  },
  {
    value: 'ABSENT',
    label: 'Vắng',
    description: 'Học sinh không có mặt',
    Icon: UserRoundX,
    selected: 'border-red-300 bg-red-50 text-red-600 ring-1 ring-red-100',
    iconSelected: 'bg-red-100 text-red-500',
    checkColor: 'text-red-500',
  },
  {
    value: 'LATE',
    label: 'Đi trễ',
    description: 'Học sinh đến lớp muộn',
    Icon: Clock3,
    selected:
      'border-amber-300 bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    iconSelected: 'bg-amber-100 text-amber-600',
    checkColor: 'text-amber-600',
  },
]

function getInitials(name) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .map((word) => word[0])
      .slice(-2)
      .join('')
      .toUpperCase() || 'HS'
  )
}

function EditAttendanceModal({
  attendance,
  updating,
  error,
  onAttendanceChange,
  onClose,
  onSubmit,
}) {
  if (!attendance) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-attendance-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[24px] bg-white shadow-2xl"
      >
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
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng"
          >
            <X size={21} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-7">
          <div className="flex items-center gap-4 rounded-2xl bg-[#F6F9F6] p-4">
            {attendance.studentAvatar ? (
              <img
                src={attendance.studentAvatar}
                alt={attendance.fullName || 'Học sinh'}
                className="h-14 w-14 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100 text-base font-bold text-green-700">
                {getInitials(attendance.fullName)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-[#18301D]">
                {attendance.fullName || 'Học sinh'}
              </p>
              <p className="mt-1 truncate text-sm text-slate-400">
                {attendance.studentCode || 'Chưa có mã học sinh'}
              </p>
            </div>
          </div>

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
              value={attendance.date || ''}
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-[#18301D]">
              Trạng thái<span className="ml-1 text-red-500">*</span>
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {STATUS_OPTIONS.map((option) => {
                const selected = attendance.status === option.value
                const Icon = option.Icon
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      onAttendanceChange({ status: option.value })
                    }
                    className={`relative min-h-[130px] rounded-2xl border p-4 text-left transition ${
                      selected
                        ? option.selected
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        selected
                          ? option.iconSelected
                          : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      <Icon size={21} />
                    </div>
                    {selected && (
                      <div
                        className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ${option.checkColor}`}
                      >
                        <Check size={15} strokeWidth={2.5} />
                      </div>
                    )}
                    <p className="mt-3 text-sm font-bold">{option.label}</p>
                    <p className="mt-1 text-xs leading-5 opacity-70">
                      {option.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

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
              value={attendance.note ?? ''}
              onChange={(event) =>
                onAttendanceChange({ note: event.target.value })
              }
              placeholder="Ví dụ: Đến muộn 10 phút..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#18301D] outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-5 sm:px-7">
          <button
            type="button"
            disabled={updating}
            onClick={onClose}
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
                <LoaderCircle size={17} className="animate-spin" />
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
  )
}

export default EditAttendanceModal
