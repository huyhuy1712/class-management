import FrogLoading from '../../../../utils/FrogLoading'
import { CalendarDays, Clock3, FileText, Play, Users, Repeat2, History } from 'lucide-react'
import { Link } from 'react-router-dom'
import useRoutePrefetch from '../../../../query/useRoutePrefetch'
import { blockedExamReasons, dateTimestamp } from '../helpers/studentExamHelpers'

function formatTime(value) {
  const timestamp = dateTimestamp(value)
  return timestamp === null ? 'Không giới hạn' : new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }).format(timestamp)
}

export default function StudentExamWaitingCard({ exam, canEnter, onStart, message, pending = false }) {
  const prefetch = useRoutePrefetch()
  const hasResult = exam.attemptId != null && ['SUBMITTED', 'GRADED'].includes(exam.attemptStatus)
  const resultPath = `/student/exam-attempts/${exam.attemptId}/result`
  const rows = [
    [Clock3, 'Thời gian làm bài', exam.timeLimit ? `${exam.timeLimit} phút` : 'Chưa có thông tin'],
    [CalendarDays, 'Thời gian mở đề', formatTime(exam.openTime)],
    [CalendarDays, 'Thời gian đóng đề', formatTime(exam.closeTime)],
    [Users, 'Đối tượng được giao', exam.assignmentType === 'STUDENT' ? 'Dành riêng cho bạn' : exam.assignmentType === 'ALL' ? 'Tất cả học sinh thuộc lớp của giáo viên' : 'Theo lớp'],
    [Repeat2, 'Số lượt đã làm', `${exam.attemptsUsed ?? 0} lượt`],
    [Repeat2, 'Số lượt còn lại', exam.maxAttempts === 0 ? 'Không giới hạn' : `${Math.max(0, (exam.maxAttempts ?? 0) - (exam.attemptsUsed ?? 0))} lượt`],
  ]
  return <section className="mx-auto w-full max-w-3xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-10">
    <div className="text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><FileText size={30} /></span><h1 className="mt-5 text-2xl font-bold leading-snug text-slate-900">{exam.title}</h1><p className="mt-3 text-sm font-medium text-emerald-700">Mã đề thi: {exam.code || '—'}</p></div>
    {exam.description && <p className="mt-6 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{exam.description}</p>}
    {exam.classes?.length > 0 && <p className="mt-5 text-center text-sm text-slate-500">{exam.classes.map((item) => item.name).join(', ')}</p>}
    <dl className="my-8 divide-y divide-slate-100">{rows.map(([Icon, label, value]) => <div key={label} className="flex flex-col gap-2 py-3 sm:flex-row sm:justify-between sm:gap-6"><dt className="flex items-center gap-2 text-sm text-slate-500"><Icon size={18} />{label}</dt><dd className="text-sm font-semibold text-slate-800 sm:max-w-[55%] sm:text-right">{value}</dd></div>)}</dl>
    {!canEnter && !pending && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{blockedExamReasons[exam.blockedReason] || 'Chưa thể bắt đầu: hãy kiểm tra thời gian mở đề và số lượt còn lại.'}</p>}
    <button type="button" onClick={onStart} disabled={!canEnter} className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"><Play size={18} />{pending ? <FrogLoading compact label="Đang mở lượt thi..." /> : exam.canResume ? 'Tiếp tục làm bài' : 'Bắt đầu'}</button>
    <div className="mt-4 text-center">
      {hasResult ? <Link to={resultPath} onMouseEnter={() => prefetch(resultPath)} onFocus={() => prefetch(resultPath)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-emerald-500"><History size={18} />Xem lịch sử làm bài</Link>
        : <button type="button" disabled className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-400"><History size={18} />Xem lịch sử làm bài</button>}
      <p className="mt-2 text-xs text-slate-400">{hasResult ? 'Xem kết quả lượt đã nộp gần nhất.' : 'Chưa có bài làm đã nộp để xem.'}</p>
    </div>
    {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
  </section>
}
