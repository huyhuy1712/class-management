import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Power,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function ClassDetailHeader({ classroom, onActivate }) {
  const navigate = useNavigate()

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/teacher/classes')}
        className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-green-700"
      >
        <ArrowLeft size={18} />
        Quay lại danh sách lớp
      </button>

      <div className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">
        <div className="relative p-6 md:p-7">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-green-50 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                <BookOpen size={26} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-[#18301D]">
                    {classroom?.name || 'Lớp học'}
                  </h1>

                  {classroom?.status === 'ARCHIVED' ? (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">
                      Đã vô hiệu
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      Đang hoạt động
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-gray-400">
                  {classroom?.code || '---'}
                  {classroom?.subjectName &&
                    ` • ${classroom.subjectName}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">

            {classroom?.status === 'ARCHIVED' && (
                    <button
                    type="button"
                    onClick={onActivate}
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                    >
                    <Power size={17} />
                    Kích hoạt
                    </button>
            )}

              <div className="flex items-center gap-2 rounded-xl bg-[#F5FAF4] px-4 py-2.5 text-sm text-gray-500">
                <CalendarDays size={17} className="text-green-600" />
                {classroom?.academicYear || '---'}
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-[#F5FAF4] px-4 py-2.5 text-sm text-gray-500">
                <Users size={17} className="text-green-600" />
                {classroom?.studentCount ?? 0} học sinh
              </div>
            </div>
          </div>

          {classroom?.description && (
            <p className="relative mt-5 max-w-3xl text-sm leading-6 text-gray-500">
              {classroom.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClassDetailHeader