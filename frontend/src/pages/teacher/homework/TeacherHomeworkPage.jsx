import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ClipboardCheck, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import homeworkService from '../../../services/homeworkService'
import DashboardLayout from '../../../layouts/DashboardLayout'
import useResourceQuery from '../../../query/useResourceQuery'
import useRoutePrefetch from '../../../query/useRoutePrefetch'
import { EMPTY_LIST } from '../../../query/queryKeys'

function TeacherHomeworkPage() {
  const [searchParams] = useSearchParams()
  const classId = searchParams.get('classId')
  const query = useResourceQuery('teacherHomeworks', classId ? [classId] : [])
  const prefetch = useRoutePrefetch()
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const homeworks = query.data ?? EMPTY_LIST
  const filteredHomeworks = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase()
    return homeworks.filter((item) => String(item.title ?? '').toLocaleLowerCase().includes(keyword))
  }, [homeworks, search])
  const createPath = `/teacher/homework/create${classId ? `?classId=${classId}` : ''}`

  const removeHomework = async (item) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài tập "${item.title}"? Thao tác này không thể hoàn tác.`)) return
    setDeleteError('')
    setDeletingId(item.id)
    try {
      await homeworkService.delete(item.id)
      await query.refetch()
    } catch (failure) {
      setDeleteError(failure.response?.data?.message || failure.message || 'Không thể xóa bài tập.')
    } finally {
      setDeletingId(null)
    }
  }

  return <DashboardLayout>
    <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-100 pb-5">
        <div className="flex items-center gap-4">
          <span className="rounded-2xl bg-emerald-100 p-4 text-emerald-700"><ClipboardCheck size={28} /></span>
          <div><h1 className="text-2xl font-bold text-slate-900">Bài tập</h1><p className="mt-1 text-sm text-slate-500">{classId ? 'Theo dõi các bài tập đã giao cho lớp.' : 'Quản lý và theo dõi các bài tập đã giao.'}</p></div>
        </div>
        <Link to={createPath} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700">
          <Plus size={18} />Tạo bài tập
        </Link>
      </header>

      {classId && <Link to={`/teacher/classes/${classId}/homework`} className="inline-flex text-sm font-semibold text-emerald-700 underline">Quay lại bài tập của lớp</Link>}

      <div className="relative w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:max-w-xl">
        <Search size={18} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm kiếm bài tập..."
          aria-label="Tìm kiếm bài tập"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-50"
        />
      </div>

      {deleteError && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{deleteError}</p>}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Danh sách bài tập</h2>
          {!query.isLoading && !query.errorMessage && <p className="mt-1 text-sm text-slate-500">Đang có {filteredHomeworks.length} bài tập</p>}
        </div>
        {query.isLoading ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải bài tập...</p>
          : query.errorMessage ? <div role="alert" className="rounded-2xl border border-red-100 bg-white p-6 text-sm text-red-600">{query.errorMessage}<button type="button" onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button></div>
            : filteredHomeworks.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredHomeworks.map((item) => {
                const detailPath = `/teacher/homework/${item.id}${classId ? `?classId=${classId}` : ''}`
                const submitted = Number(item.submittedCount ?? 0)
                const recipients = Number(item.recipientCount ?? 0)
                const graded = Number(item.gradedCount ?? 0)
                const waiting = Math.max(submitted - graded, 0)
                const deadlinePassed = item.dueAt && new Date(item.dueAt).getTime() <= Date.now()
                const statusLabel = deadlinePassed ? 'Đã hết hạn' : waiting > 0 ? 'Chờ chấm bài' : submitted === 0 ? 'Chưa có bài nộp' : 'Đã chấm hết'
                const statusClass = deadlinePassed ? 'bg-slate-100 text-slate-600' : waiting > 0 ? 'bg-amber-50 text-amber-700' : submitted === 0 ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'
                const editPath = `/teacher/homework/${item.id}/edit${classId ? `?classId=${classId}` : ''}`
                return <article key={item.id} className="flex min-h-[210px] flex-col rounded-2xl border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
                  <Link to={detailPath} onMouseEnter={() => prefetch(detailPath)} onFocus={() => prefetch(detailPath)} className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${statusClass}`}>{statusLabel}</span>
                  </div>
                  {(item.subjectName || item.gradeLevel || item.purpose) && <p className="mt-2 text-xs text-slate-500">{[item.subjectName, item.gradeLevel, item.purpose].filter(Boolean).join(' · ')}</p>}
                  <p className="mt-3 line-clamp-3 text-sm text-slate-500">{item.instructions || item.attachmentName || (item.audioName ? `Có tệp nghe: ${item.audioName}` : item.assignmentType === 'ALL' ? 'Bài tập dành cho tất cả lớp.' : 'Bài tập đã giao cho học sinh.')}</p>
                  <p className="mt-4 text-xs text-slate-500">{item.assignmentType === 'ALL' ? 'Tất cả lớp' : item.assignmentType === 'CLASS' ? 'Theo lớp' : 'Theo học sinh'} · Điểm tối đa {item.maxScore}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.dueAt ? `Hạn nộp: ${new Date(item.dueAt).toLocaleString('vi-VN')}` : 'Không có hạn nộp'}</p>
                  {item.createdAt && <p className="mt-1 text-xs text-slate-400">Tạo lúc {new Date(item.createdAt).toLocaleString('vi-VN')}</p>}
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <span className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">{submitted}/{recipients} đã nộp</span>
                    <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{graded} đã chấm</span>
                    {waiting > 0 && <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{waiting} chờ chấm</span>}
                  </div>
                  </Link>
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
                    <Link to={editPath} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Pencil size={14} />Sửa</Link>
                    <button type="button" disabled={deletingId === item.id} onClick={() => removeHomework(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={14} />{deletingId === item.id ? 'Đang xóa...' : 'Xóa'}</button>
                  </div>
                </article>
              })}
            </div> : <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">{homeworks.length ? 'Không tìm thấy bài tập phù hợp.' : 'Chưa có bài tập được giao.'}</div>}
      </section>
    </main>
  </DashboardLayout>
}

export default TeacherHomeworkPage
