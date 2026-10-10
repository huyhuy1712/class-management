import { BookOpen, CalendarDays } from 'lucide-react'

export default function StudentClassCard({ classroom, isJoined, onView }) {
  const archived = classroom.status === 'ARCHIVED'

  return (
    <article className={`group flex h-full flex-col rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-900/5 ${archived ? 'border-rose-100 bg-rose-50/30' : 'border-emerald-100 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <BookOpen size={22} strokeWidth={1.8} />
        </div>
        {isJoined && <span className="rounded-lg bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Đã tham gia</span>}
      </div>

      <div className="mt-5">
        <h3 className="min-h-7 text-lg font-bold text-[#18301D]">{classroom.name}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{classroom.code}</span>
          {archived && <span className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">Đã vô hiệu</span>}
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BookOpen size={17} className="shrink-0 text-green-600" />
          {classroom.subjectName || 'Chưa cập nhật môn học'}
        </div>
        <div className="flex items-center gap-2 pb-2 text-sm text-gray-500">
          <CalendarDays size={17} className="shrink-0 text-green-600" />
          {classroom.academicYear || 'Chưa cập nhật năm học'}
        </div>
      </div>

      <button type="button" onClick={() => onView(classroom)} className="mt-auto w-full rounded-xl bg-[#14532D] py-2.5 text-sm font-semibold text-white transition hover:bg-[#166534]">
        Vào lớp học
      </button>
    </article>
  )
}
