import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ClipboardCheck, Plus, Search } from 'lucide-react'
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
  const homeworks = query.data ?? EMPTY_LIST
  const filteredHomeworks = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase()
    return homeworks.filter((item) => String(item.title ?? '').toLocaleLowerCase().includes(keyword))
  }, [homeworks, search])
  const createPath = `/teacher/homework/create${classId ? `?classId=${classId}` : ''}`

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

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">Danh sách bài tập</h2>
          {!query.isLoading && !query.errorMessage && <p className="mt-1 text-sm text-slate-500">Đang có {filteredHomeworks.length} bài tập</p>}
        </div>
        {query.isLoading ? <p className="p-6 text-sm text-slate-500">Đang tải bài tập...</p>
          : query.errorMessage ? <div role="alert" className="p-6 text-sm text-red-600">{query.errorMessage}<button type="button" onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button></div>
            : filteredHomeworks.length ? <div className="divide-y divide-slate-100">
              {filteredHomeworks.map((item) => {
                const detailPath = `/teacher/homework/${item.id}${classId ? `?classId=${classId}` : ''}`
                return <Link key={item.id} to={detailPath} onMouseEnter={() => prefetch(detailPath)} onFocus={() => prefetch(detailPath)} className="flex flex-wrap items-center justify-between gap-3 p-5 transition hover:bg-emerald-50/50">
                  <div><h3 className="font-semibold text-slate-900">{item.title}</h3><p className="mt-1 text-sm text-slate-500">{item.assignmentType === 'ALL' ? 'Tất cả lớp' : item.assignmentType === 'CLASS' ? 'Theo lớp' : 'Theo học sinh'} · {item.dueAt ? `Hạn ${new Date(item.dueAt).toLocaleString('vi-VN')}` : 'Không giới hạn hạn nộp'}</p></div>
                  <span className="text-sm text-slate-600">{item.submittedCount}/{item.recipientCount} đã nộp · {item.gradedCount} đã chấm</span>
                </Link>
              })}
            </div> : <div className="p-8 text-center text-sm text-slate-500">{homeworks.length ? 'Không tìm thấy bài tập phù hợp.' : 'Chưa có bài tập được giao.'}</div>}
      </section>
    </main>
  </DashboardLayout>
}

export default TeacherHomeworkPage
