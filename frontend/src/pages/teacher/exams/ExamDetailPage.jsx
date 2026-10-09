import { useParams, Link } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout'
import useExamResource from './hooks/useExamResource'
import useExamUiSession from './hooks/useExamUiSession'
import { toExamBuilder } from './helpers/examDetailAdapter'
import ExamBuilderPage from './builder/ExamBuilderPage'

export default function ExamDetailPage() {
  const { examId } = useParams()
  const { data, loading, error, retry } = useExamResource(examId, 'detail')
  const uiStatus = useExamUiSession((session) => session.exams[examId]?.status)
  const updateExam = useExamUiSession((session) => session.updateExam)
  if (loading || error) return <DashboardLayout><div className="rounded-2xl bg-white p-6"><p role={error ? 'alert' : 'status'}>{loading ? 'Đang tải nội dung đề thi...' : error}</p>{error && <button type="button" onClick={retry} className="mt-3 text-emerald-700">Thử lại</button>}<Link className="mt-4 block text-emerald-700" to="/teacher/exams">Quay lại danh sách</Link></div></DashboardLayout>
  const exam = toExamBuilder({ ...data, status: uiStatus ?? data.status })
  return <ExamBuilderPage key={examId} editingExam={exam} onSaveChanges={(sections) => updateExam(exam, { sections })} />
}
