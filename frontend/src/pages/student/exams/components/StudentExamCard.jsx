import { CalendarDays, Clock3, FileText } from 'lucide-react'
import { examStatuses, getExamStatus, getExamAssignmentDate } from '../helpers/studentExamHelpers'
import { formatDate } from '../../../../utils/dateUtils'

export default function StudentExamCard({ exam, onEnter }) {
  const status = examStatuses[getExamStatus(exam)]
  return <article className="flex flex-col rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
    <div className="flex items-start justify-between gap-3"><span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600"><FileText size={24} /></span><span className={`rounded-lg px-3 py-1 text-xs font-semibold ${status.tone}`}>{status.label}</span></div>
    <h3 className="mt-5 break-words text-xl font-bold text-slate-900">{exam.title}</h3>
    {exam.code && <p className="mt-2 text-sm text-emerald-700">{exam.code}</p>}
    <p className="mt-3 text-sm text-slate-500">{exam.classes?.map((item) => item.name).join(', ') || 'Giao trực tiếp'}</p>
    <div className="my-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
      <p className="flex items-center gap-2"><CalendarDays size={17} />{getExamAssignmentDate(exam.createdAt) ? formatDate(getExamAssignmentDate(exam.createdAt)) : 'Chưa có ngày giao'}</p>
      <p className="flex items-center gap-2"><Clock3 size={17} />{exam.timeLimit ? `${exam.timeLimit} phút` : 'Không giới hạn thời gian'}</p>
    </div>
    <button type="button" onClick={() => onEnter(exam)} disabled={exam.canEnter === false || getExamStatus(exam) !== 'TODO'} className="mt-auto rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">Vào làm bài</button>
  </article>
}
