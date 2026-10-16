import { Crown, Trophy, Clock } from 'lucide-react'
import defaultAvatar from '../../../../assets/images/avatar_default.png'
import { attemptDuration, attemptLabels, scoreTone } from '../helpers/assignmentAttemptHelpers'

const medal = {
  1: 'border-amber-400 bg-amber-50 text-amber-500',
  2: 'border-slate-400 bg-slate-50 text-slate-400',
  3: 'border-orange-400 bg-orange-50 text-orange-500',
}
function Avatar({ item, large = false }) {
  return <img src={item.avatarUrl || defaultAvatar} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = defaultAvatar }} className={`${large ? 'h-16 w-16' : 'h-12 w-12'} shrink-0 rounded-full border-2 border-white object-cover shadow-sm`} />
}

export default function AssignmentLeaderboard({ rankings, unfinished, maxScore, onView }) {
  const top = rankings.slice(0, 3)
  // Keep the winner in the center; use actual ranks for tied scores.
  const podium = top.length === 3 ? [top[1], top[0], top[2]] : top.length === 2 ? [top[1], top[0]] : top
  return <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
    <div className="mb-6 flex flex-wrap items-center gap-3"><Trophy className="text-amber-500" size={27} /><h3 className="text-xl font-bold text-slate-800">Bảng xếp hạng</h3><span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{rankings.length} học sinh đã chấm</span></div>
    <div className="grid gap-6 2xl:grid-cols-2">
      <div className="flex min-h-[320px] items-end justify-center gap-3 rounded-2xl bg-gradient-to-b from-white to-emerald-50/40 px-2 py-6 sm:gap-5">
        {!top.length ? <p className="self-center text-center text-sm text-slate-500">Chưa có bài đã chấm để xếp hạng.</p> : podium.map((item) => <button key={item.studentId} type="button" onClick={() => onView(item)} className="flex min-w-0 flex-1 flex-col items-center text-center focus-visible:outline-emerald-500">
          <div className="relative mb-3">{item.rank === 1 && <Crown size={30} className="absolute -top-7 left-1/2 -translate-x-1/2 -rotate-12 text-amber-400" />}<Avatar item={item} large /></div>
          <p className="w-full break-words text-sm font-bold text-slate-800">{item.fullName}</p>
          <p className={`mb-5 mt-2 text-sm font-semibold ${scoreTone(item.totalScore, maxScore)}`}>{item.totalScore}/{maxScore} điểm</p>
          <div className={`relative flex w-full max-w-40 items-center justify-center rounded-t-2xl rounded-b-xl border-2 shadow-sm ${medal[item.rank] ?? medal[3]}`} style={{ height: item.rank === 1 ? 180 : item.rank === 2 ? 140 : 110 }}><span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold">{item.rank}</span><Trophy size={item.rank === 1 ? 65 : 48} strokeWidth={1.5} /></div>
        </button>)}
      </div>
      <div className="max-h-[560px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 p-3 sm:p-4">
        {[...rankings, ...unfinished].map((item) => {
          const ranked = item.rank != null
          const content = <><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200/70 font-bold text-slate-600">{item.rank ?? '—'}</span><Avatar item={item} /><span className="min-w-0 flex-1"><span className="block break-words font-bold text-slate-800">{item.fullName}</span><span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"><span className={`font-semibold ${ranked ? scoreTone(item.totalScore, maxScore) : 'text-slate-500'}`}>{ranked ? `${item.totalScore}/${maxScore} điểm` : attemptLabels[item.status] ?? item.status}</span>{ranked && <span className="inline-flex items-center gap-1 text-slate-500"><Clock size={12} />{attemptDuration(item.durationSeconds)}</span>}<span className="text-slate-400">{item.studentCode}</span></span></span>{item.rank <= 3 && <Crown size={20} className="shrink-0" />}</>
          const style = `flex w-full items-center gap-3 rounded-xl border p-3 text-left ${medal[item.rank] ?? 'border-slate-200 bg-white text-slate-500'} ${ranked ? 'transition hover:shadow-md focus-visible:outline-emerald-500' : ''}`
          return ranked ? <button key={item.studentId} type="button" onClick={() => onView(item)} className={style}>{content}</button> : <div key={item.studentId} className={style}>{content}</div>
        })}
      </div>
    </div>
    <p className="mt-5 text-xs text-slate-500">Điểm cao xếp trước; bằng điểm cùng hạng. Bài chưa chấm xong chưa có thứ hạng. Bấm học sinh đã chấm để xem bài làm.</p>
  </section>
}
