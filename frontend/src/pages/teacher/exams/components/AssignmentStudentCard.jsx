import { Clock, CalendarCheck, Pencil, ShieldAlert, UserRound } from 'lucide-react'
import { attemptLabels, attemptDuration, canComment, scoreTone } from '../helpers/assignmentAttemptHelpers'
import { formatExamDateTime } from '../helpers/examHelpers'
import defaultAvatar from '../../../../assets/images/avatar_default.png'

export default function AssignmentStudentCard({ item, saving, onComment, maxScore, onView, onPrefetch }) {
  const tone = item.status === 'GRADED' ? 'bg-emerald-50 text-emerald-700' : item.status === 'SUBMITTED' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
  return <article role={canComment(item) ? 'link' : undefined} tabIndex={canComment(item) ? 0 : undefined} onMouseEnter={() => { if (canComment(item)) onPrefetch?.(item) }} onFocus={() => { if (canComment(item)) onPrefetch?.(item) }} onClick={(event) => { if (canComment(item) && !event.target.closest('button')) onView?.(item) }} onKeyDown={(event) => { if (event.key === 'Enter' && event.target === event.currentTarget && canComment(item)) onView?.(item) }} className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md ${canComment(item) ? 'cursor-pointer focus-visible:outline-emerald-500' : ''}`}>
    <div className="border-b border-slate-100 bg-slate-50/60 p-3.5">
      <div className="flex items-center gap-3"><img src={item.avatarUrl || defaultAvatar} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = defaultAvatar }} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" /><div className="min-w-0"><h3 className="break-words font-bold text-[#18301D]">{item.fullName}</h3><p className="mt-1 text-xs text-slate-500">{item.studentCode || '—'} · Lượt {item.attemptNumber || 0}</p></div></div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className={`rounded-lg px-2 py-1 text-xs font-semibold ${tone}`}>{attemptLabels[item.status] ?? item.status}</span><span className={`font-bold ${scoreTone(item.totalScore, maxScore)}`}>{item.totalScore == null ? 'Chưa có điểm' : `${item.totalScore}/${maxScore ?? '—'} điểm${item.isFinal ? '' : ' (tạm tính)'}`}</span></div>
    </div>
    <div className="space-y-2.5 p-3.5 text-xs text-slate-500">
      <p className="flex items-center gap-2 break-all"><UserRound size={15} className="shrink-0" />{item.email || 'Chưa có email'}</p>
      <p className="flex items-center gap-2"><Clock size={15} />Thời gian làm: {attemptDuration(item.durationSeconds)}</p>
      <p className="flex items-center gap-2"><CalendarCheck size={15} />Nộp: {item.submittedAt ? formatExamDateTime(item.submittedAt) : 'Chưa nộp'}</p>
      <p className="flex items-center gap-2"><ShieldAlert size={15} />Rời tab: {item.tabSwitchCount ?? 0}</p>
      <div className="border-t border-slate-100 pt-2.5"><div className="flex items-center justify-between"><span className="font-semibold text-slate-700">Nhận xét</span>{canComment(item) && <button type="button" disabled={saving} onClick={() => onComment(item)} aria-label={`Sửa nhận xét cho ${item.fullName}`} className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"><Pencil size={15} /></button>}</div><p className="whitespace-pre-wrap break-words leading-5">{item.teacherComment || 'Chưa có nhận xét'}</p></div>
    </div>
  </article>
}
