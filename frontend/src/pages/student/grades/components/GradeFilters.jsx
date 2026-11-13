import { gradeInputStyle } from '../helpers/gradeUi'

export default function GradeFilters({
  filters,
  classrooms,
  subjects,
  onChange,
  onReset,
}) {
  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className="sr-only">Lọc lớp</span>
          <select
            aria-label="Lọc lớp"
            value={filters.classroom}
            onChange={(event) => onChange('classroom', event.target.value)}
            className={gradeInputStyle}
          >
            <option value="">Tất cả lớp học</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Lọc môn</span>
          <select
            aria-label="Lọc môn"
            value={filters.subject}
            onChange={(event) => onChange('subject', event.target.value)}
            className={gradeInputStyle}
          >
            <option value="">Tất cả môn học</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-400">
          Từ ngày
          <input
            type="date"
            aria-label="Từ ngày"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(event) => onChange('from', event.target.value)}
            className={`${gradeInputStyle} w-full`}
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-400">
          Đến ngày
          <input
            type="date"
            aria-label="Đến ngày"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => onChange('to', event.target.value)}
            className={`${gradeInputStyle} w-full`}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span>
          Điểm thống kê quy đổi về thang 10 · Không gồm bài chờ chấm
        </span>
        <button
          type="button"
          onClick={onReset}
          className="font-semibold text-emerald-700 transition hover:text-emerald-800"
        >
          Xóa bộ lọc
        </button>
      </div>
    </section>
  )
}
