import { ClipboardCheck, Clock3, RotateCcw, Send, Sparkles } from 'lucide-react'
import useResourceQuery from '../../../../query/useResourceQuery'
import FrogLoading from '../../../../utils/FrogLoading'

const metrics = [
  { key: 'notSubmitted', label: 'Chưa nộp', icon: Clock3, tone: 'amber' },
  { key: 'pendingGrading', label: 'Chờ chấm', icon: Send, tone: 'sky' },
  { key: 'graded', label: 'Đã chấm', icon: ClipboardCheck, tone: 'emerald' },
  { key: 'reopened', label: 'Đã mở lại', icon: RotateCcw, tone: 'violet' },
]

const tones = {
  amber: 'bg-amber-50 text-amber-800 ring-amber-100',
  sky: 'bg-sky-50 text-sky-800 ring-sky-100',
  emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  violet: 'bg-violet-50 text-violet-800 ring-violet-100',
}

export default function StudentHomeworkOverview({ classId, studentId }) {
  const query = useResourceQuery('studentHomeworkSummary', [classId, studentId], {
    staleTime: 15_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled: Boolean(classId && studentId),
  })

  if (query.isLoading) {
    return <FrogLoading label="Đang tải số liệu bài tập..." className="rounded-2xl bg-white p-8" />
  }

  if (query.errorMessage) {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm" role="alert">
        <h2 className="font-bold text-slate-900">Bài tập</h2>
        <p className="mt-2 text-sm text-red-600">{query.errorMessage}</p>
        <button type="button" onClick={() => query.refetch()} className="mt-3 text-sm font-semibold text-red-700 underline">
          Thử tải lại
        </button>
      </section>
    )
  }

  if (!query.data) {
    return (
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">Bài tập</h2>
        <p className="mt-2 text-sm text-slate-500">Chưa có số liệu để hiển thị.</p>
      </section>
    )
  }

  const summary = query.data
  const completed = summary.graded
  const progress = summary.total ? Math.round((completed / summary.total) * 100) : 0

  return (
    <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-950/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
            <ClipboardCheck size={19} />
          </span>
          <div>
            <h2 className="font-bold text-[#18301D]">Bài tập</h2>
            <p className="mt-1 text-sm text-slate-500">Tổng hợp bài tập được giao trong lớp</p>
          </div>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-sky-800">
          {summary.total} bài
        </span>
      </div>

      {query.isError && (
        <p role="status" className="mt-4 text-sm text-amber-700">
          Đang hiển thị số liệu đã tải; chưa cập nhật được dữ liệu mới.
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        {metrics.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className={`flex items-center gap-3 rounded-xl p-3 ring-1 ${tones[tone]}`}>
            <Icon size={18} className="shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium opacity-80">{label}</p>
              <p className="mt-0.5 text-xl font-bold">{summary[key]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 font-medium text-slate-600">
            <Sparkles size={16} className="text-emerald-600" />
            Điểm trung bình bài đã chấm
          </span>
          <strong className="text-lg text-emerald-700">
            {summary.averageScoreOnTen == null ? '—' : `${summary.averageScoreOnTen}/10`}
          </strong>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`Đã chấm ${progress}% bài tập`}>
          <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">{progress}% bài tập đã được chấm</p>
      </div>
    </section>
  )
}
