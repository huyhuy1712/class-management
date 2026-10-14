import FrogLoading from '../../../../utils/FrogLoading'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import useResourceQuery from '../../../../query/useResourceQuery'
import useRoutePrefetch from '../../../../query/useRoutePrefetch'
import { attemptLabels, scoreTone } from '../../exams/helpers/assignmentAttemptHelpers'

function Donut({ title, segments, children }) {
  const total = segments.reduce((sum, item) => sum + item.count, 0)
  let angle = 0
  const gradient = segments.map((item) => { const start = angle; angle += total ? item.count / total * 360 : 0; return `${item.color} ${start}deg ${angle}deg` }).join(', ')
  return <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
    <h2 className="font-bold text-[#18301D]">{title}</h2>
    <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
      <div aria-hidden="true" className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full" style={{ background: total ? `conic-gradient(${gradient})` : '#e2e8f0' }}><div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-center"><span><strong className="block text-2xl text-slate-800">{total}</strong><span className="text-xs text-slate-500">bài</span></span></div></div>
      <ul className="space-y-3 text-sm text-slate-600">{segments.map((item) => <li key={item.label} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: item.color }} />{item.label}: <strong>{item.count}</strong><span className="text-xs text-slate-400">({total ? Math.round(item.count / total * 100) : 0}%)</span></li>)}</ul>
    </div>{children}
  </section>
}

export default function StudentExamOverview({ classId, studentId }) {
  const query = useResourceQuery('studentClassExamResults', [classId, studentId], { staleTime: 15_000, refetchInterval: 60_000 })
  const [page, setPage] = useState(0)
  const prefetch = useRoutePrefetch()
  if (query.isLoading) return <FrogLoading label="Đang tải kết quả học tập..." className="rounded-2xl bg-white p-8 lg:col-span-2" />
  if (query.errorMessage) return <p role="alert" className="rounded-2xl bg-red-50 p-6 text-red-600 lg:col-span-2">{query.errorMessage}<button type="button" onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button></p>
  const summary = query.data.summary
  const items = query.data.items
  const bands = [{ label: 'Dưới 5', color: '#ef4444', count: 0 }, { label: '5 đến dưới 6,5', color: '#f59e0b', count: 0 }, { label: '6,5 đến dưới 8', color: '#0ea5e9', count: 0 }, { label: 'Từ 8 trở lên', color: '#10b981', count: 0 }]
  items.filter((item) => item.status === 'GRADED' && item.scoreOnTen != null).forEach((item) => { const score = Number(item.scoreOnTen); bands[score < 5 ? 0 : score < 6.5 ? 1 : score < 8 ? 2 : 3].count += 1 })
  const current = Math.min(page, Math.max(0, Math.ceil(items.length / 10) - 1))
  return <>
    {query.isError && <p role="alert" className="text-sm text-amber-700 lg:col-span-2">Chưa cập nhật được dữ liệu mới. <button type="button" onClick={() => query.refetch()} className="underline">Thử lại</button></p>}
    <Donut title="Kết quả học tập" segments={[{ label: 'Chưa làm', count: summary.notStarted, color: '#94a3b8' }, { label: 'Đang làm', count: summary.inProgress, color: '#0ea5e9' }, { label: 'Chờ chấm', count: summary.pendingGrading, color: '#f59e0b' }, { label: 'Đã chấm', count: summary.graded, color: '#10b981' }]}><p className="mt-5 text-xs text-slate-500">Trạng thái các đợt giao trong lớp; tổng {summary.total} bài.</p></Donut>
    <Donut title="Tổng quan điểm số" segments={bands}><div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">{[['Trung bình', summary.averageScoreOnTen], ['Cao nhất', summary.highestScoreOnTen], ['Thấp nhất', summary.lowestScoreOnTen]].map(([label, value]) => <p key={label}>{label}<strong className="mt-1 block text-lg text-emerald-700">{value == null ? '—' : `${value}/10`}</strong></p>)}</div><p className="mt-3 text-xs text-slate-500">Điểm quy đổi thang 10, chỉ tính bài đã chấm.</p></Donut>
    <section className="order-last min-w-0 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2"><h2 className="mb-4 font-bold">Chi tiết kết quả ({items.length})</h2>{items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Đề thi / Đợt giao', 'Trạng thái', 'Lượt', 'Điểm', ''].map((label, index) => <th key={index} className="p-3">{label}</th>)}</tr></thead><tbody>{items.slice(current * 10, (current + 1) * 10).map((item) => { const target = `/teacher/exams/${item.examId}/assignments/${item.assignmentId}?classId=${classId}`; return <tr key={item.assignmentId} className="border-t border-slate-100"><td className="p-3"><p className="font-semibold">{item.title}</p><p className="text-xs text-slate-400">{item.code} · Đợt #{item.assignmentId}</p></td><td className="p-3">{attemptLabels[item.status] ?? item.status}</td><td className="p-3">{item.attemptNumber}</td><td className={`p-3 font-bold ${scoreTone(item.totalScore, item.maxScore)}`}>{item.totalScore == null ? '—' : `${item.totalScore}/${item.maxScore}`}{item.totalScore != null && !item.isFinal && <p className="text-xs font-normal">Tạm tính</p>}</td><td className="p-3"><Link to={target} onMouseEnter={() => prefetch(target)} onFocus={() => prefetch(target)} className="text-emerald-700">Xem đợt giao</Link></td></tr> })}</tbody></table></div> : <p className="py-6 text-center text-slate-500">Chưa có đợt giao đề cho học sinh trong lớp này.</p>}<div className="mt-4 flex justify-end gap-3 text-sm"><button type="button" disabled={!current} onClick={() => setPage(current - 1)} className="disabled:opacity-40">Trước</button><span>Trang {current + 1}</span><button type="button" disabled={(current + 1) * 10 >= items.length} onClick={() => setPage(current + 1)} className="disabled:opacity-40">Sau</button></div></section>
  </>
}
