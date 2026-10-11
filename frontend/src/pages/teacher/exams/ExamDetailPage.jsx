import { useParams, Link } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout'
import useExamResource from './hooks/useExamResource'
import { toExamBuilder } from './helpers/examDetailAdapter'
import ExamBuilderPage from './builder/ExamBuilderPage'

export default function ExamDetailPage() {
  const { examId } = useParams()
  const { data, loading, error, retry } = useExamResource(examId, 'detail')
  if (loading || error) return <DashboardLayout><div className="rounded-2xl bg-white p-6"><p role={error ? 'alert' : 'status'}>{loading ? 'Đang tải nội dung đề thi...' : error}</p>{error && <button type="button" onClick={retry} className="mt-3 text-emerald-700">Thử lại</button>}<Link className="mt-4 block text-emerald-700" to="/teacher/exams">Quay lại danh sách</Link></div></DashboardLayout>
  const exam = toExamBuilder(data)
  return <ExamBuilderPage key={examId} editingExam={exam} />
}
