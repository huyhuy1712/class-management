import { isQuestionAnswered } from '../helpers/examPaperHelpers'
import { useState } from 'react'
import { CheckCircle2, CircleDashed, Flag, LayoutGrid, ChevronDown, XCircle, Clock3 } from 'lucide-react'

export default function ExamQuestionNavigator({ questions, answers, flags = [], answered, itemLabel = 'câu', reviewStatuses }) {
  const [expanded, setExpanded] = useState(false)
  const percent = questions.length ? Math.round(answered / questions.length * 100) : 0
  const count = (status) => Object.values(reviewStatuses ?? {}).filter((value) => value === status).length
  const reviewTones = { GRADED: 'border-emerald-300 bg-emerald-50 text-emerald-700', CORRECT: 'border-emerald-300 bg-emerald-50 text-emerald-700', WRONG: 'border-red-300 bg-red-50 text-red-700', EMPTY: 'border-slate-200 bg-white text-slate-500', PENDING: 'border-amber-300 bg-amber-50 text-amber-700' }
  const statuses = reviewStatuses ? [
    ...(count('GRADED') ? [{ icon: CheckCircle2, label: 'Đã chấm tự luận', count: count('GRADED'), tone: 'text-emerald-700', background: 'bg-emerald-50' }] : []),
    { icon: CheckCircle2, label: 'Đúng', count: count('CORRECT'), tone: 'text-emerald-700', background: 'bg-emerald-50' },
    { icon: XCircle, label: 'Sai', count: count('WRONG'), tone: 'text-red-700', background: 'bg-red-50' },
    { icon: CircleDashed, label: 'Chưa làm', count: count('EMPTY'), tone: 'text-slate-500', background: 'bg-slate-100' },
    ...(count('PENDING') ? [{ icon: Clock3, label: 'Chờ đánh giá', count: count('PENDING'), tone: 'text-amber-700', background: 'bg-amber-50' }] : []),
  ] : [
    { icon: CheckCircle2, label: 'Đã trả lời', count: answered, tone: 'text-emerald-700', background: 'bg-emerald-50' },
    { icon: CircleDashed, label: 'Chưa trả lời', count: questions.length - answered, tone: 'text-slate-500', background: 'bg-slate-100' },
    { icon: Flag, label: 'Cần xem lại', count: flags.length, tone: 'text-amber-700', background: 'bg-amber-50' },
  ]
  return <aside tabIndex={0} aria-label="Danh sách câu hỏi" className="order-first overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm lg:sticky lg:top-28 lg:order-last lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:overscroll-contain">
    <div className="flex items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><LayoutGrid size={18} /></span><h2 className="text-sm font-bold text-slate-900">Danh sách câu hỏi</h2></div>
    <div className="mt-4 flex items-center justify-between text-xs"><p className="text-slate-500">Đã trả lời <span className="font-semibold text-emerald-700">{answered}/{questions.length}</span> {itemLabel}</p><span className="font-bold text-emerald-600">{percent}%</span></div>
    <div role="progressbar" aria-label="Tiến độ trả lời" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="mb-5 mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all" style={{ width: `${percent}%` }} /></div>
    <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700 lg:hidden">{expanded ? 'Thu gọn bảng câu hỏi' : 'Mở bảng câu hỏi'}<ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>
    <div className={expanded ? 'block' : 'hidden lg:block'}>
    <nav aria-label="Điều hướng câu hỏi" className="grid grid-cols-6 gap-2 lg:grid-cols-4">{questions.map((question, index) => <a key={question.id} href={`#question-${question.id}`} aria-label={`Câu ${question.displayNumber ?? index + 1}${flags.includes(question.id) ? ', cần xem lại' : ''}`} className={`flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${reviewStatuses ? reviewTones[reviewStatuses[question.id]] : flags.includes(question.id) ? 'border-amber-300 bg-amber-50 text-amber-700' : isQuestionAnswered(question, answers[question.id]) ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/30'}`}>{question.displayNumber ?? index + 1}</a>)}</nav>
    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">{statuses.map(({ icon: Icon, label, count, tone, background }) => <div key={label} className="flex items-center justify-between gap-2 text-xs"><span className="flex items-center gap-2.5 text-slate-600"><span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone} ${background}`}><Icon size={15} /></span>{label}</span><span className={`min-w-6 rounded-md px-1.5 py-1 text-center font-semibold ${tone} ${background}`}>{count}</span></div>)}</div>
    </div>
  </aside>
}
