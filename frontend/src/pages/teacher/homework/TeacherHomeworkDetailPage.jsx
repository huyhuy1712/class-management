import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import DashboardLayout from '../../../layouts/DashboardLayout'
import useResourceQuery from '../../../query/useResourceQuery'
import homeworkService from '../../../services/homeworkService'

function SubmissionRow({ homeworkId, submission, maxScore, refresh }) {
  const [score, setScore] = useState(submission.score ?? '')
  const [comment, setComment] = useState(submission.teacherComment ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const grade = async () => {
    setBusy(true)
    setError('')
    try {
      await homeworkService.gradeSubmission(homeworkId, submission.studentId, score, comment)
      await refresh()
    } catch (failure) {
      setError(failure.response?.data?.message || failure.message || 'Không thể lưu điểm.')
    } finally {
      setBusy(false)
    }
  }
  const reopen = async () => {
    setBusy(true)
    setError('')
    try {
      await homeworkService.reopenSubmission(homeworkId, submission.studentId)
      await refresh()
    } catch (failure) {
      setError(failure.response?.data?.message || failure.message || 'Không thể mở lại bài nộp.')
    } finally {
      setBusy(false)
    }
  }

  return <article className="rounded-2xl border border-slate-200 bg-white p-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="font-bold text-slate-900">{submission.studentName}</h3><p className="text-xs text-slate-500">{submission.studentCode || '—'} · {submission.status === 'NOT_SUBMITTED' ? 'Chưa nộp' : submission.status === 'GRADED' ? 'Đã chấm' : submission.status === 'REOPENED' ? 'Đã mở lại' : 'Đã nộp'}{submission.submittedAt ? ` · ${new Date(submission.submittedAt).toLocaleString('vi-VN')}` : ''}</p></div>
      {submission.status === 'GRADED' && <button type="button" disabled={busy} onClick={reopen} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50"><RefreshCw size={15} />Mở lại để nộp</button>}
    </header>
    {submission.answerText && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{submission.answerText}</p>}
    {submission.images?.length > 0 && <div className="mt-4 flex flex-wrap gap-3">{submission.images.map((image) => <a key={image.url} href={image.url} target="_blank" rel="noreferrer" aria-label={`Mở ảnh ${image.name}`}><img src={image.url} alt={image.name} className="h-32 max-w-48 rounded-lg border border-slate-200 object-contain" /></a>)}</div>}
    {submission.audioUrl && <div className="mt-4"><p className="mb-2 text-sm font-semibold text-slate-700">Âm thanh bài làm: {submission.audioName}</p><audio controls preload="none" src={submission.audioUrl} className="w-full" /></div>}
    {submission.status !== 'NOT_SUBMITTED' && <div className="mt-5 grid gap-3 sm:grid-cols-[140px_1fr_auto]">
      <label className="text-xs font-semibold text-slate-600">Điểm / {maxScore}
        <input type="number" min="0" max={maxScore} step="0.001" value={score} onChange={(event) => setScore(event.target.value)} disabled={submission.status === 'REOPENED' || busy} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      </label>
      <label className="text-xs font-semibold text-slate-600">Nhận xét
        <input value={comment} onChange={(event) => setComment(event.target.value)} disabled={submission.status === 'REOPENED' || busy} maxLength={10000} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      </label>
      {submission.status !== 'REOPENED' && <button type="button" onClick={grade} disabled={busy || !score} className="self-end rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Trả bài'}</button>}
    </div>}
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {submission.resubmissionCount > 0 && <p className="mt-3 text-xs text-slate-400">Đã nộp lại {submission.resubmissionCount} lần.</p>}
  </article>
}

export default function TeacherHomeworkDetailPage() {
  const { homeworkId, studentId } = useParams()
  const [searchParams] = useSearchParams()
  const classId = searchParams.get('classId')
  const assignment = useResourceQuery('teacherHomework', [homeworkId])
  const submissions = useResourceQuery('homeworkSubmissions', [homeworkId, classId ?? ''])
  const [dueAt, setDueAt] = useState('')
  const [savingDeadline, setSavingDeadline] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = async () => {
    await Promise.all([assignment.refetch(), submissions.refetch()])
  }
  const extendDeadline = async (event) => {
    event.preventDefault()
    setSavingDeadline(true)
    setMessage('')
    try {
      await homeworkService.updateDeadline(homeworkId, dueAt)
      setDueAt('')
      setMessage('Đã cập nhật hạn nộp và mở lại bài tập.')
      await assignment.refetch()
    } catch (failure) {
      setMessage(failure.response?.data?.message || failure.message || 'Không thể cập nhật hạn nộp.')
    } finally {
      setSavingDeadline(false)
    }
  }

  const item = assignment.data
  const classSubmissions = submissions.data ?? []
  const selectedSubmission = studentId
    ? classSubmissions.find((row) => String(row.studentId) === String(studentId))
    : null
  const detailPath = `/teacher/homework/${homeworkId}${classId ? `?classId=${classId}` : ''}`
  const recipientCount = classId ? classSubmissions.length : item?.recipientCount
  const submittedCount = classId
    ? classSubmissions.filter((row) => row.status !== 'NOT_SUBMITTED').length
    : item?.submittedCount
  const gradedCount = classId
    ? classSubmissions.filter((row) => row.status === 'GRADED').length
    : item?.gradedCount
  return <DashboardLayout><main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-8">
    <Link to={classId ? `/teacher/classes/${classId}/homework` : '/teacher/homework'} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><ArrowLeft size={17} />{classId ? 'Bài tập của lớp' : 'Danh sách bài tập'}</Link>
    {assignment.isLoading ? <p className="text-slate-500">Đang tải...</p> : assignment.errorMessage ? <p role="alert" className="text-red-600">{assignment.errorMessage}</p> : item && <>
      <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{[item.subjectName, item.gradeLevel, item.purpose].filter(Boolean).join(' · ')}</p>
        {item.createdAt && <p className="mt-1 text-xs text-slate-400">Tạo lúc {new Date(item.createdAt).toLocaleString('vi-VN')}</p>}
        {item.instructions && <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">{item.instructions}</p>}
        {item.attachmentUrl && <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block font-semibold text-emerald-700 underline">Tải tệp đề: {item.attachmentName}</a>}
        {item.audioUrl && <div className="mt-4"><p className="mb-2 text-sm font-semibold text-slate-700">Âm thanh đề bài: {item.audioName}</p><audio controls preload="none" src={item.audioUrl} className="w-full" /></div>}
        <p className="mt-4 text-sm text-slate-500">Điểm tối đa {item.maxScore} · {submittedCount ?? 0}/{recipientCount ?? 0} đã nộp · {gradedCount ?? 0} đã chấm · {item.dueAt ? `Hạn ${new Date(item.dueAt).toLocaleString('vi-VN')}` : 'Không có hạn nộp'}</p>
        <form onSubmit={extendDeadline} className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
          <label className="text-sm font-semibold text-slate-600">Gia hạn hạn nộp
            <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 font-normal" />
          </label>
          <button disabled={savingDeadline} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{savingDeadline ? 'Đang lưu...' : 'Cập nhật / mở lại bài tập'}</button>
          {message && <p role="status" className="basis-full text-sm text-emerald-700">{message}</p>}
        </form>
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">{studentId ? 'Bài làm của học sinh' : 'Danh sách học sinh'}</h2><button type="button" onClick={refresh} className="text-sm font-semibold text-emerald-700 underline">Làm mới</button></div>
        {submissions.isLoading ? <p className="text-slate-500">Đang tải danh sách học sinh...</p>
          : submissions.errorMessage ? <p role="alert" className="text-red-600">{submissions.errorMessage}</p>
            : studentId ? selectedSubmission ? <div className="space-y-4">
              <Link to={detailPath} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><ArrowLeft size={16} />Quay lại danh sách học sinh</Link>
              <SubmissionRow key={selectedSubmission.studentId} homeworkId={homeworkId} submission={selectedSubmission} maxScore={item.maxScore} refresh={refresh} />
            </div> : <p role="alert" className="text-sm text-red-600">Không tìm thấy thông tin bài nộp của học sinh này.</p>
              : classSubmissions.length ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
                {classSubmissions.map((submission) => {
                  const studentPath = `/teacher/homework/${homeworkId}/submissions/${submission.studentId}${classId ? `?classId=${classId}` : ''}`
                  const status = submission.status === 'NOT_SUBMITTED' ? 'Chưa nộp' : submission.status === 'GRADED' ? 'Đã chấm' : submission.status === 'REOPENED' ? 'Đã mở lại' : 'Đã nộp'
                  return <Link key={submission.studentId} to={studentPath} className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-emerald-50/50">
                    <div><h3 className="font-semibold text-slate-900">{submission.studentName}</h3><p className="mt-1 text-sm text-slate-500">{submission.studentCode || '—'}{submission.submittedAt ? ` · Nộp lúc ${new Date(submission.submittedAt).toLocaleString('vi-VN')}` : ''}</p></div>
                    <div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${submission.status === 'GRADED' ? 'bg-emerald-100 text-emerald-800' : submission.status === 'NOT_SUBMITTED' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'}`}>{status}</span><span className="text-sm font-semibold text-emerald-700">{submission.status === 'NOT_SUBMITTED' ? 'Xem thông tin' : 'Xem bài làm'}</span></div>
                  </Link>
                })}
              </div> : <p className="text-sm text-slate-500">Chưa có học sinh trong danh sách bài tập này.</p>}
      </section>
    </>}
  </main></DashboardLayout>
}
