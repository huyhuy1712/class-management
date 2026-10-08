import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
} from 'lucide-react'

import defaultAvatar from '../../../../../assets/images/avatar_default.png'
import Checkbox from './ui/Checkbox'
import SearchBox from './ui/SearchBox'

function StudentSelector({
  students,
  classes,
  selectedStudents,
  selectedClassId,
  search,
  onSearchChange,
  onToggle,
  onClassChange,
}) {
  const selectedClass = classes.find(
    (classroom) =>
      String(classroom.id) === String(selectedClassId),
  )

  if (!selectedClassId) {
    return (
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
        <div className="border-b border-slate-100 bg-slate-50/70 p-4">
          <p className="font-semibold text-[#18301D]">
            Chọn lớp trước
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Chọn một lớp để hiển thị danh sách học sinh trong lớp đó.
          </p>
        </div>

        <div className="grid max-h-[360px] grid-cols-1 gap-3 overflow-y-auto p-4 lg:grid-cols-2">
          {classes.map((classroom) => {
            const active = classroom.status === 'ACTIVE'

            return (
            <button
              key={classroom.id}
              type="button"
              onClick={() => onClassChange(classroom.id)}
              className={`group flex items-center gap-4 rounded-xl border bg-white p-4 text-left transition ${
                active
                  ? 'border-green-200 hover:bg-green-50/50'
                  : 'border-red-200 hover:bg-red-50/50'
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <BookOpen size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-700">
                  {classroom.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{classroom.code} · {classroom.studentCount ?? 0} học sinh</span>
                  <span className={`inline-flex items-center gap-1 font-medium ${active ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
                    {active ? 'Đang hoạt động' : 'Đã vô hiệu'}
                  </span>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-green-600"
              />
            </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-100 bg-slate-50/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => onClassChange(null)}
              className="mb-2 flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-800"
            >
              <ArrowLeft size={14} />
              Danh sách lớp
            </button>
            <p className="font-semibold text-[#18301D]">
              {selectedClass?.name}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Đã chọn {selectedStudents.length} học sinh
            </p>
          </div>

          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder="Tên hoặc mã học sinh..."
          />
        </div>
      </div>

      <div className="max-h-[400px] divide-y divide-slate-100 overflow-y-auto">
        {students.length ? (
          students.map((student) => {
            const checked = selectedStudents.includes(student.id)

            return (
              <button
                key={student.id}
                type="button"
                onClick={() => onToggle(student.id)}
                className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition hover:bg-green-50/40"
              >
                <Checkbox checked={checked} />
                <img
                  src={student.avatar || defaultAvatar}
                  alt={student.fullName || 'Học sinh'}
                  onError={(event) => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = defaultAvatar
                  }}
                  className="h-10 w-10 shrink-0 rounded-full border border-slate-100 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-700">
                    {student.fullName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span>
                      MSSV:{' '}
                      <span className="font-medium text-slate-500">
                        {student.studentCode || '---'}
                      </span>
                    </span>
                    <span className="hidden text-slate-300 sm:inline">•</span>
                    <span>
                      SĐT:{' '}
                      <span className="font-medium text-slate-500">
                        {student.phone || 'Chưa cập nhật'}
                      </span>
                    </span>
                  </div>
                </div>
              </button>
            )
          })
        ) : (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            Không tìm thấy học sinh trong lớp này.
          </p>
        )}
      </div>
    </div>
  )
}

export default StudentSelector
