import FrogLoading from '../../../utils/FrogLoading'
import { useState } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import useRoutePrefetch from '../../../query/useRoutePrefetch'
import { Modal, message } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, Clock, FileText, Users, Search, UserRound, ClipboardCheck, Download, BarChart3, Trophy, Settings2 } from 'lucide-react'
import DashboardLayout from '../../../layouts/DashboardLayout'
import useResourceQuery from '../../../query/useResourceQuery'
import examService from '../../../services/examService'
import useAssignmentAttempts from './hooks/useAssignmentAttempts'
import useAssignmentGradeExport from './hooks/useAssignmentGradeExport'
import AssignmentInsights from './components/AssignmentInsights'
import AssignmentStudentCard from './components/AssignmentStudentCard'
import { formatExamDateTime } from './helpers/examHelpers'
import ExamResultSettingsSection from './create/components/ExamResultSettingsSection'

export default function TeacherAssignmentDetailPage() {
  const { examId, assignmentId } = useParams()
  const [params] = useSearchParams()
  const classId = params.get('classId') ?? ''
  return <AssignmentDetail key={`${examId}:${assignmentId}:${classId}`} examId={examId} assignmentId={assignmentId} classId={classId} />
}

function AssignmentDetail({ examId, assignmentId, classId }) {
  const navigate = useNavigate()
  const prefetch = useRoutePrefetch()
  const reviewPath = (item) => `/teacher/exams/${examId}/assignments/${assignmentId}/attempts/${item.attemptId}${classId ? `?classId=${classId}` : ''}`
  const config = useResourceQuery('examConfiguration', [examId])
  const [tab, setTab] = useState('students')
  const [filters, setFilters] = useState({ page: 0, q: '', status: '', sort: 'newest' })
  const { query, saveComment, saving, prefetchNext } = useAssignmentAttempts(assignmentId, classId, filters)
  const { exportGrades, exporting, prefetchInsights } = useAssignmentGradeExport(assignmentId, classId)
  const [editing, setEditing] = useState(null)
  const [comment, setComment] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [resultSettings, setResultSettings] = useState(null)
  const [messageApi, context] = message.useMessage()
  const assignment = config.data?.assignments?.find((item) => String(item.id) === String(assignmentId))
  const resultSettingsMutation = useMutation({
    mutationFn: (settings) => examService.updateAssignmentResultSettings(examId, assignmentId, {
      scoreVisibility: settings.scoreVisibility,
      answerVisibility: settings.answerVisibility,
      hideCorrectAnswerOnWrong: settings.hideWrongAnswers,
    }),
    onSuccess: (updatedConfiguration) => {
      config.setData(updatedConfiguration)
      setSettingsOpen(false)
      messageApi.success('Đã cập nhật cài đặt hiển thị kết quả.')
    },
    onError: (error) => messageApi.error(error.response?.data?.message || error.message || 'Không thể cập nhật cài đặt kết quả.'),
  })
  const back = classId ? `/teacher/classes/${classId}/assignments` : '/teacher/exams'
  const change = (name, value) => setFilters((current) => ({ ...current, [name]: value, page: name === 'page' ? value : 0 }))
  const openResultSettings = () => {
    setResultSettings({
      scoreVisibility: assignment.scoreVisibility ?? 'NEVER',
      answerVisibility: assignment.answerVisibility ?? 'NEVER',
      hideWrongAnswers: Boolean(assignment.hideCorrectAnswerOnWrong),
    })
    setSettingsOpen(true)
  }
  const handleResultSettingsChange = ({ target }) => {
    setResultSettings((current) => ({
      ...current,
      [target.name]: target.type === 'checkbox' ? target.checked : target.value,
    }))
  }
  const submitComment = () => {
    const item = editing
    setEditing(null)
    void saveComment(item, comment).then((success) => { if (success) messageApi.success('Đã lưu nhận xét.') })
      .catch((error) => messageApi.error(error.response?.data?.message || error.message || 'Không thể lưu nhận xét. Đã khôi phục nhận xét trước đó.'))
  }
  const stats = query.data?.stats
  return <DashboardLayout>{context}<div className="mx-auto max-w-[1600px] pb-6">
    <Link to={back} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"><ArrowLeft size={17} />Quay lại danh sách đề thi</Link>
    {config.isLoading ? <FrogLoading label="Đang tải thông tin đợt giao..." className="p-6" /> : config.errorMessage ? <p role="alert" className="p-6 text-red-600">{config.errorMessage}<button type="button" onClick={() => config.refetch()} className="ml-3 underline">Thử lại</button></p> : !assignment ? <p role="alert">Không tìm thấy đợt giao trong đề thi này.</p> : <div className="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm xl:sticky xl:top-20">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><FileText size={21} /></span>
          <div className="min-w-0">
            <h1 className="break-words text-base font-bold leading-6 text-[#18301D]">{config.data.basicInfo.title}</h1>
            <p className="mt-1 text-xs font-semibold text-emerald-700">{config.data.code} · Đợt #{assignmentId}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3 text-xs text-slate-600">
          <p className="flex gap-2"><CalendarDays size={17} className="shrink-0" />Tạo đề: {config.data.createdAt ? formatExamDateTime(config.data.createdAt) : '—'}</p>
          <p className="flex gap-2"><UserRound size={17} className="shrink-0" />Người tạo: {config.data.creator?.fullName || '—'}</p>
          <p className="flex gap-2"><Clock size={17} className="shrink-0" />{assignment.timeLimit ?? config.data.basicInfo.timeLimit} phút · {(assignment.maxAttempts ?? config.data.basicInfo.maxAttempts) === 0 ? 'Không giới hạn lượt' : `${assignment.maxAttempts ?? config.data.basicInfo.maxAttempts} lượt / HS`}</p>
          <p>Mở: {assignment.openTime ? formatExamDateTime(assignment.openTime) : 'Không giới hạn'}</p><p>Đóng: {assignment.closeTime ? formatExamDateTime(assignment.closeTime) : 'Không giới hạn'}</p>
          <p>{config.data.basicInfo.gradeLevel} · {config.data.basicInfo.subjectName}</p>
          <p className="flex gap-2"><Users size={17} className="shrink-0" />{classId ? assignment.classrooms?.find((item) => String(item.id) === classId)?.name || `Lớp #${classId}` : assignment.assignmentType === 'ALL' ? 'Tất cả lớp của giáo viên' : assignment.classrooms?.map((item) => item.name).join(', ') || 'Giao riêng cho học sinh'}</p>
          <Link to={`/teacher/exams/${examId}`} className="block rounded-xl border border-emerald-200 px-3 py-2.5 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">Xem nội dung đề</Link>
          {config.data.status === 'PUBLISHED' && <button type="button" onClick={openResultSettings} className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"><Settings2 size={16} />Cài đặt hiển thị kết quả</button>}
          <div className="space-y-2 rounded-xl bg-emerald-50 p-3">
            <p className="font-semibold text-emerald-800">Thống kê điểm đã chấm</p>
            <p>Điểm trung bình: <strong>{stats?.averageScore == null ? '—' : `${stats.averageScore}/${config.data.maxScore}`}</strong></p>
            <p>Mốt: <strong>{stats?.averageScore == null ? '—' : stats.modes?.length ? stats.modes.join(', ') : 'Không có mốt'}</strong></p>
            <p className="text-[11px] text-slate-500">Tính trên {stats?.graded ?? 0} bài đã chấm trong phạm vi đang xem, không gồm bài chờ chấm. Các điểm không lặp lại thì không có mốt.</p>
          </div>
        </div>
        <nav aria-label="Menu đợt giao" className="mt-4 space-y-2 border-t border-slate-100 pt-4">{[['students', 'Danh sách học sinh', Users], ['statistics', 'Thống kê', BarChart3], ['ranking', 'Bảng xếp hạng', Trophy]].map(([id, label, Icon]) => <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onMouseEnter={id !== 'students' ? prefetchInsights : undefined} onFocus={id !== 'students' ? prefetchInsights : undefined} onClick={() => setTab(id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${tab === id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={19} />{label}</button>)}</nav>
      </aside>
      <main className="min-w-0 space-y-4">
        {tab !== 'students' ? <AssignmentInsights assignmentId={assignmentId} classId={classId} maxScore={config.data.maxScore} tab={tab} onView={(item) => navigate(reviewPath(item))} /> : <>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-bold text-[#18301D]"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><ClipboardCheck size={19} /></span>Danh sách học sinh {stats ? `(${stats.total})` : ''}</h2><button type="button" disabled={exporting} onClick={() => void exportGrades(config.data.basicInfo.title, config.data.maxScore).catch((error) => messageApi.error(error.response?.data?.message || error.message || 'Không thể xuất bảng điểm.'))} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Download size={17} />{exporting ? 'Đang xuất...' : 'Xuất bảng điểm'}</button></div><p className="mt-3 text-xs text-slate-500">Xuất Excel điểm tăng dần, kèm thống kê · Chưa làm tính 0 · Toàn bộ học sinh trong phạm vi đang xem</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">{[['Tổng', stats?.total, 'bg-slate-100 text-slate-700'], ['Chưa làm', stats?.notStarted, 'bg-slate-50 text-slate-600'], ['Đang làm', stats?.inProgress, 'bg-blue-50 text-blue-700'], ['Chờ chấm', stats?.pendingGrading, 'bg-amber-50 text-amber-700'], ['Đã chấm', stats?.graded, 'bg-emerald-50 text-emerald-700']].map(([label, count, tone]) => <span key={label} className={`rounded-lg px-2.5 py-1.5 font-medium ${tone}`}>{label}: <strong>{count ?? '—'}</strong></span>)}</div>
          <div className="mt-4 flex flex-col gap-2.5 lg:flex-row"><div className="relative min-w-0 flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input maxLength={200} aria-label="Tìm học sinh" value={filters.q} onChange={(event) => change('q', event.target.value)} placeholder="Tên, mã học sinh hoặc email..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50" /></div><select aria-label="Trạng thái bài làm" value={filters.status} onChange={(event) => change('status', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"><option value="">Tất cả trạng thái</option><option value="NOT_STARTED">Chưa làm</option><option value="IN_PROGRESS">Đang làm</option><option value="SUBMITTED">Chờ chấm tự luận</option><option value="GRADED">Đã chấm</option></select><select aria-label="Sắp xếp bài làm" value={filters.sort} onChange={(event) => change('sort', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="name">Tên A → Z</option><option value="score_desc">Điểm cao → thấp</option><option value="score_asc">Điểm thấp → cao</option></select></div>
        </div>
        {query.isError && query.data && <p role="alert" className="text-sm text-amber-700">Chưa cập nhật được dữ liệu mới. <button type="button" onClick={() => query.refetch()} className="underline">Thử lại</button></p>}
        {query.isLoading ? <FrogLoading label="Đang tải học sinh..." className="p-6" /> : query.errorMessage ? <p role="alert" className="text-red-600">{query.errorMessage}<button type="button" onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button></p> : <>
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{query.data?.items.map((item) => <AssignmentStudentCard key={item.studentId} item={item} maxScore={config.data.maxScore} onView={(row) => navigate(reviewPath(row))} onPrefetch={(row) => prefetch(reviewPath(row))} saving={saving || query.isPlaceholderData} onComment={(row) => { setEditing(row); setComment(row.teacherComment || '') }} />)}</div>
          {!query.data?.items.length && <p className="rounded-2xl bg-white p-10 text-center text-slate-500">{stats?.total ? 'Không có học sinh phù hợp bộ lọc.' : 'Chưa có học sinh trong phạm vi giao đề này.'}</p>}
          <div className="flex items-center justify-between gap-3 text-sm text-slate-600"><span>{query.data?.totalElements ?? 0} học sinh phù hợp · Trang {filters.page + 1}</span><div className="flex gap-2"><button type="button" disabled={filters.page === 0 || query.isPlaceholderData} onClick={() => change('page', filters.page - 1)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 disabled:opacity-40">Trước</button><button type="button" disabled={query.isPlaceholderData || (filters.page + 1) * 12 >= (query.data?.totalElements ?? 0)} onMouseEnter={prefetchNext} onFocus={prefetchNext} onClick={() => change('page', filters.page + 1)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 disabled:opacity-40">Sau</button></div></div>
        </>}
        </>}
      </main>
    </div>}
    <Modal
      title="Cài đặt hiển thị kết quả"
      open={settingsOpen}
      onCancel={() => { if (!resultSettingsMutation.isPending) setSettingsOpen(false) }}
      onOk={() => resultSettingsMutation.mutate(resultSettings)}
      okText="Lưu cài đặt"
      cancelText="Hủy"
      confirmLoading={resultSettingsMutation.isPending}
      closable={!resultSettingsMutation.isPending}
      keyboard={!resultSettingsMutation.isPending}
      maskClosable={!resultSettingsMutation.isPending}
      width={1000}
      destroyOnHidden
    >
      {resultSettings && <>
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Thay đổi này áp dụng ngay cho học sinh của đợt giao hiện tại. Điểm đã chấm và các đợt giao khác không bị thay đổi.
        </p>
        <ExamResultSettingsSection form={resultSettings} onChange={handleResultSettingsChange} />
      </>}
    </Modal>
    <Modal title={`Nhận xét · ${editing?.fullName ?? ''}`} open={Boolean(editing)} onCancel={() => setEditing(null)} onOk={submitComment} okText="Lưu nhận xét" cancelText="Hủy"><textarea aria-label="Nhận xét của giáo viên" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={20000} rows={6} className="mt-3 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-emerald-400" /><p className="text-xs text-slate-500">Để trống để xóa nhận xét. Điểm bài làm được giữ nguyên.</p></Modal>
  </div></DashboardLayout>
}
