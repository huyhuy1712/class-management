import FrogLoading from '../../../utils/FrogLoading'
import { FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StudentDashboardLayout from '../../../layouts/StudentDashboardLayout'
import useStudentExams from './hooks/useStudentExams'
import useStudentExamClasses from './hooks/useStudentExamClasses'
import StudentExamStats from './components/StudentExamStats'
import StudentExamFilters from './components/StudentExamFilters'
import StudentExamCard from './components/StudentExamCard'

export default function StudentExamListPage() {
  const data = useStudentExams()
  const classData = useStudentExamClasses()
  const navigate = useNavigate()
  const handleEnter = (exam) => navigate(exam.attemptId && ['SUBMITTED', 'GRADED'].includes(exam.attemptStatus) && !exam.canStart
    ? `/student/exam-attempts/${exam.attemptId}/result` : `/student/exams/${exam.assignmentId}`)
  return <StudentDashboardLayout><div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
    <header className="flex items-center gap-4 border-b border-emerald-100 pb-6"><span className="rounded-2xl bg-emerald-100 p-4 text-emerald-700"><FileText size={28} /></span><div><h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Bài kiểm tra</h1><p className="mt-2 text-sm text-slate-500">Theo dõi và thực hiện các bài kiểm tra được giao cho bạn.</p></div></header>
    <StudentExamStats counts={data.counts} unavailable={!data.apiAvailable || data.loading || Boolean(data.error)} />
    <StudentExamFilters filters={data.filters} onChange={data.onChange} classes={classData.classes} classesLoading={classData.loading} classesError={classData.error} onRetryClasses={classData.retry} />
    {!data.apiAvailable ? <p role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Danh sách đề thi sẽ hiển thị khi chức năng được kết nối.</p> : data.loading ? <FrogLoading label="Đang tải đề thi..." className="py-12 text-center text-slate-500" /> : data.error ? <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-600">{data.error}<button type="button" onClick={data.retry} className="ml-3 underline">Thử lại</button></div> : <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-slate-900">Danh sách đề thi</h2><span className="text-sm text-slate-500">Hiển thị {data.visibleItems.length} / {data.items.length} đề thi</span></div>
      {data.visibleItems.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.visibleItems.map((exam) => <StudentExamCard key={exam.assignmentId} exam={{ ...exam, canEnter: Boolean(handleEnter) && exam.canEnter !== false }} onEnter={handleEnter} />)}</div> : <div className="rounded-2xl border border-dashed border-emerald-200 bg-white py-14 text-center"><FileText size={32} className="mx-auto text-slate-300" /><p className="mt-4 text-slate-500">Không có đề thi phù hợp.</p></div>}
    </section>}
  </div></StudentDashboardLayout>
}
