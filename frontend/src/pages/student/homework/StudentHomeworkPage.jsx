import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'
import StudentDashboardLayout from '../../../layouts/StudentDashboardLayout'
import useResourceQuery from '../../../query/useResourceQuery'
import { EMPTY_LIST } from '../../../query/queryKeys'
import { filterStudentHomeworks } from './helpers/homeworkFilters'

const labels = {
  NOT_SUBMITTED: 'Chưa nộp',
  SUBMITTED: 'Đã nộp · chờ chấm',
  GRADED: 'Đã trả bài',
  REOPENED: 'Giáo viên đã mở lại',
}

const filters = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'OVERDUE', label: 'Quá hạn' },
  { id: 'NOT_DONE', label: 'Chưa làm bài' },
  { id: 'SUBMITTED', label: 'Đã nộp' },
]

export default function StudentHomeworkPage() {
  const query = useResourceQuery('studentHomeworks')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [now, setNow] = useState(Date.now)
  const homeworks = query.data ?? EMPTY_LIST
  const visibleHomeworks = useMemo(
    () => filterStudentHomeworks(homeworks, activeFilter, now),
    [homeworks, activeFilter, now],
  )
  const counts = useMemo(() => Object.fromEntries(
    filters.map(({ id }) => [id, filterStudentHomeworks(homeworks, id, now).length]),
  ), [homeworks, now])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])
  return <StudentDashboardLayout><main className="space-y-6 px-4 py-6 sm:px-8">
    <header className="flex items-center gap-4 border-b border-emerald-100 pb-5"><span className="rounded-2xl bg-emerald-100 p-4 text-emerald-700"><ClipboardCheck size={28} /></span><div><h1 className="text-2xl font-bold text-slate-900">Bài tập</h1><p className="mt-1 text-sm text-slate-500">Xem hướng dẫn, nộp bài và theo dõi nhận xét của giáo viên.</p></div></header>
    {query.isLoading ? <p className="py-8 text-center text-slate-500">Đang tải bài tập...</p> : query.errorMessage ? <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-700">{query.errorMessage}<button type="button" onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button></div> : <>
      <nav aria-label="Lọc bài tập" className="flex flex-wrap gap-2">
        {filters.map(({ id, label }) => <button
          key={id}
          type="button"
          aria-pressed={activeFilter === id}
          onClick={() => setActiveFilter(id)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeFilter === id ? 'bg-sky-100 text-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >{label}<span className="ml-2 text-xs opacity-70">{counts[id]}</span></button>)}
      </nav>
      {homeworks.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">Bạn chưa được giao bài tập nào.</p>
        : visibleHomeworks.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visibleHomeworks.map(({ assignment, submissionStatus, submittedAt, score, teacherComment }) => <Link key={assignment.id} to={`/student/homework/${assignment.id}`} className="flex flex-col rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-2"><h2 className="font-bold text-slate-900">{assignment.title}</h2><span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${submissionStatus === 'GRADED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{labels[submissionStatus] ?? labels.NOT_SUBMITTED}</span></div>
        <p className="mt-3 line-clamp-3 text-sm text-slate-500">{assignment.instructions || assignment.attachmentName || 'Có tệp hướng dẫn đính kèm.'}</p>
        <p className="mt-4 text-xs text-slate-500">{assignment.dueAt ? `Hạn nộp: ${new Date(assignment.dueAt).toLocaleString('vi-VN')}` : 'Không có hạn nộp'} · Điểm tối đa {assignment.maxScore}</p>
        {submittedAt && <p className="mt-2 text-xs text-slate-400">Đã nộp {new Date(submittedAt).toLocaleString('vi-VN')}</p>}
        {submissionStatus === 'GRADED' && <p className="mt-3 font-semibold text-emerald-700">Điểm: {score}/{assignment.maxScore}{teacherComment ? ` · ${teacherComment}` : ''}</p>}
      </Link>)}
    </div> : <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">Không có bài tập nào trong mục này.</p>}
    </>}
  </main></StudentDashboardLayout>
}
