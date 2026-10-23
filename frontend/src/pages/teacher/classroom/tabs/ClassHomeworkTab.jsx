import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { ClipboardList, Plus } from 'lucide-react'
import FrogLoading from '../../../../utils/FrogLoading'
import useResourceQuery from '../../../../query/useResourceQuery'
import useRoutePrefetch from '../../../../query/useRoutePrefetch'

export default function ClassHomeworkTab() {
  const { classId } = useParams()
  const { classroom } = useOutletContext()
  const navigate = useNavigate()
  const prefetch = useRoutePrefetch()
  const query = useResourceQuery('classHomeworks', [classId])

  return <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ClipboardList size={21} /></span>
        <div><h2 className="text-lg font-bold text-[#18301D] sm:text-xl">Bài tập lớp {classroom.name}</h2><p className="mt-0.5 text-xs text-slate-500">Quản lý bài tập và bài nộp của học sinh trong lớp.</p></div>
      </div>
      <button type="button" onClick={() => navigate(`/teacher/homework/create?classId=${classId}`)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><Plus size={18} />Giao bài cho lớp</button>
    </header>
    {query.isLoading ? <FrogLoading label="Đang tải bài tập..." className="p-8 text-center text-slate-500" />
      : query.errorMessage ? <div role="alert" className="p-8 text-center text-red-600">{query.errorMessage}<button type="button" onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button></div>
        : query.data?.length ? <div className="divide-y divide-slate-100">
          {query.data.map((item) => <Link key={item.id} to={`/teacher/homework/${item.id}?classId=${classId}`} onMouseEnter={() => prefetch(`/teacher/homework/${item.id}?classId=${classId}`)} onFocus={() => prefetch(`/teacher/homework/${item.id}?classId=${classId}`)} className="flex flex-wrap items-center justify-between gap-3 p-5 transition hover:bg-emerald-50/50">
            <div><h3 className="font-semibold text-slate-900">{item.title}</h3><p className="mt-1 text-sm text-slate-500">{item.dueAt ? `Hạn ${new Date(item.dueAt).toLocaleString('vi-VN')}` : 'Không giới hạn hạn nộp'} · Tối đa {item.maxScore} điểm</p></div>
            <span className="text-sm text-slate-600">{item.submittedCount}/{item.recipientCount} đã nộp · {item.gradedCount} đã chấm</span>
          </Link>)}
        </div> : <div className="p-10 text-center"><p className="text-slate-500">Chưa có bài tập nào được giao cho lớp này.</p><button type="button" onClick={() => navigate(`/teacher/homework/create?classId=${classId}`)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={17} />Giao bài tập đầu tiên</button></div>}
  </section>
}
