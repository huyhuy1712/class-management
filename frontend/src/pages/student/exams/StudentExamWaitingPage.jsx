import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import StudentDashboardLayout from '../../../layouts/StudentDashboardLayout'
import useStudentExamAssignment from './hooks/useStudentExamAssignment'
import StudentExamWaitingCard from './components/StudentExamWaitingCard'
import useStartExamAttempt from './hooks/useStartExamAttempt'

export default function StudentExamWaitingPage() {
  const { assignmentId } = useParams()
  const query = useStudentExamAssignment(assignmentId)
  const action = useStartExamAttempt(assignmentId, query)
  return <StudentDashboardLayout><main className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-6 sm:px-8">
    <Link to="/student/exams" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><ArrowLeft size={18} />Quay lại danh sách đề thi</Link>
    <Link to="/student/exams/preview/paper" className="mb-6 block text-sm font-semibold text-emerald-700 underline">Thử giao diện làm bài với đề mẫu</Link>
    {query.data ? <StudentExamWaitingCard exam={query.data} canEnter={query.canEnter && !action.pending} onStart={action.start} message={action.error} pending={action.pending} /> : query.isLoading ? <p role="status" className="py-12 text-center text-slate-500">Đang tải thông tin bài kiểm tra...</p> : <div role="alert" className="mx-auto max-w-3xl rounded-2xl bg-white p-6 text-red-600">{query.errorMessage || 'Không tìm thấy bài kiểm tra.'}<button type="button" onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button></div>}
  </main></StudentDashboardLayout>
}
