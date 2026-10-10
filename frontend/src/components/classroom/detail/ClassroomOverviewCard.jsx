import { BookOpen, CalendarDays, ChevronLeft, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ClassroomOverviewCard({
  classroom,
  studentCount = 0,
  backTo,
  backLabel,
}) {
  const isArchived = classroom?.status === 'ARCHIVED'

  return (
    <div>
      {backTo && (
        <Link
          to={backTo}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
        >
          <ChevronLeft size={18} />
          {backLabel}
        </Link>
      )}

      <section className="relative overflow-hidden rounded-2xl border border-emerald-700/30 bg-gradient-to-br from-emerald-800 via-green-700 to-emerald-600 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-20 h-44 w-44 rounded-full bg-emerald-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-36 w-36 rounded-full bg-green-300/15 blur-2xl" />

        <div className="relative p-6 md:p-7">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <BookOpen size={26} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    {classroom?.name || 'Lớp học'}
                  </h1>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      isArchived
                        ? 'bg-red-50 text-red-600'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isArchived ? 'Đã vô hiệu' : 'Đang hoạt động'}
                  </span>
                </div>

                <p className="mt-2 text-sm font-medium text-emerald-50/80">
                  {classroom?.code || '---'}
                  {classroom?.subjectName && ` · ${classroom.subjectName}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15">
                <CalendarDays size={17} className="text-emerald-100" />
                {classroom?.academicYear || '---'}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15">
                <Users size={17} className="text-emerald-100" />
                {studentCount} học sinh
              </div>
            </div>
          </div>

          {classroom?.description && (
            <p className="relative mt-5 max-w-3xl whitespace-pre-wrap break-words border-t border-white/15 pt-4 text-sm leading-6 text-emerald-50/85">
              {classroom.description}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
