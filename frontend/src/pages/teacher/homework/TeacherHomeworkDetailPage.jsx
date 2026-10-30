import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ClipboardCheck, RefreshCw, Search, Users } from 'lucide-react'
import DashboardLayout from '../../../layouts/DashboardLayout'
import useResourceQuery from '../../../query/useResourceQuery'
import homeworkService from '../../../services/homeworkService'
import defaultAvatar from '../../../assets/images/avatar_default.png'

function SubmissionRow({ homeworkId, submission, maxScore, refresh }) {
  const [score, setScore] = useState(submission.score ?? '')
  const [comment, setComment] = useState(submission.teacherComment ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const numericScore = Number(score)
  const scoreError = score !== ''
    && (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > Number(maxScore))

  const grade = async () => {
    if (!score || scoreError) return
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

  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={submission.studentAvatarUrl || defaultAvatar}
          alt={`Ảnh đại diện của ${submission.studentName || 'học sinh'}`}
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = defaultAvatar
          }}
          className="h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-slate-200"
        />
        <div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{submission.studentName}</h3><p className="text-xs text-slate-500">{submission.studentCode || '—'} · {submission.status === 'NOT_SUBMITTED' ? 'Chưa nộp' : submission.status === 'GRADED' ? 'Đã chấm' : submission.status === 'REOPENED' ? 'Đã mở lại' : 'Đã nộp'}{submission.submittedAt ? ` · ${new Date(submission.submittedAt).toLocaleString('vi-VN')}` : ''}</p></div>
      </div>
      {submission.status === 'GRADED' && <button type="button" disabled={busy} onClick={reopen} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50"><RefreshCw size={15} />Mở lại để nộp</button>}
    </header>
    {submission.answerText && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{submission.answerText}</p>}
    {submission.images?.length > 0 && <div className="mt-4 flex flex-wrap gap-3">{submission.images.map((image) => <a key={image.url} href={image.url} target="_blank" rel="noreferrer" aria-label={`Mở ảnh ${image.name}`}><img src={image.url} alt={image.name} className="h-32 max-w-48 rounded-lg border border-slate-200 object-contain" /></a>)}</div>}
    {submission.files?.length > 0 && <div className="mt-4 space-y-2">{submission.files.map((file) => <a key={file.url} href={file.url} target="_blank" rel="noreferrer" download className="block rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-slate-50">Tải bài làm: {file.name}</a>)}</div>}
    {submission.audioUrl && <div className="mt-4"><p className="mb-2 text-sm font-semibold text-slate-700">Âm thanh bài làm: {submission.audioName}</p><audio controls preload="none" src={submission.audioUrl} className="w-full" /></div>}        {submission.status === 'GRADED' && <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm">
      <p className="font-semibold text-emerald-900">Điểm: {submission.score ?? '—'} / {maxScore}</p>
      <p className="mt-2 whitespace-pre-wrap text-slate-700">{submission.teacherComment || 'Không có nhận xét.'}</p>
    </div>}
    {submission.status === 'SUBMITTED' && <div className="mt-5 grid gap-3 sm:grid-cols-[140px_1fr_auto]">
      <label className="text-xs font-semibold text-slate-600">Điểm / {maxScore}
        <input type="number" min="0" max={maxScore} step="0.001" value={score} onChange={(event) => {
          setScore(event.target.value)
          setError('')
        }} disabled={busy} aria-invalid={scoreError} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${scoreError ? 'border-red-400' : 'border-slate-200'}`} />
      </label>
      <label className="text-xs font-semibold text-slate-600">Nhận xét
        <input value={comment} onChange={(event) => {
          setComment(event.target.value)
          setError('')
        }} disabled={busy} maxLength={10000} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      </label>
      <button type="button" onClick={grade} disabled={busy || !score || scoreError} className="self-end rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Trả bài'}</button>
    </div>}
    {scoreError && <p role="alert" className="mt-2 text-sm text-red-600">Điểm phải nằm trong khoảng 0 đến {maxScore}.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {submission.status === 'SUBMITTED' && <p className="mt-3 text-xs font-semibold text-blue-700">Đã nộp, chờ chấm</p>}
    {submission.status === 'REOPENED' && <p className="mt-3 text-xs font-semibold text-amber-700">Đã mở lại, chờ học sinh nộp</p>}
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
  const [studentSearch, setStudentSearch] = useState('')

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
  const filteredSubmissions = useMemo(() => {
    const keyword = studentSearch.trim().toLocaleLowerCase()
    if (!keyword) return classSubmissions
    return classSubmissions.filter((submission) =>
      [submission.studentName, submission.studentCode]
        .some((value) => String(value ?? '').toLocaleLowerCase().includes(keyword)))
  }, [classSubmissions, studentSearch])
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
  return <DashboardLayout><main className="mx-auto max-w-[1500px] space-y-5 bg-slate-50/70 px-4 py-6 sm:px-8">
    <Link to={classId ? `/teacher/classes/${classId}/homework` : '/teacher/homework'} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"><ArrowLeft size={17} />{classId ? 'Bài tập của lớp' : 'Danh sách bài tập'}</Link>
    {assignment.isLoading ? <p className="text-slate-500">Đang tải...</p> : assignment.errorMessage ? <p role="alert" className="text-red-600">{assignment.errorMessage}</p> : item && <>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.7fr)]">
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-violet-50 p-3 text-violet-700"><ClipboardCheck size={22} /></span>
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Nội dung bài tập</p>
        <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{[item.subjectName, item.gradeLevel, item.purpose].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        {item.createdAt && <p className="mt-1 text-xs text-slate-400">Tạo lúc {new Date(item.createdAt).toLocaleString('vi-VN')}</p>}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Hướng dẫn</p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.instructions || 'Không có nội dung hướng dẫn.'}</p>
        </div>
        {item.attachmentUrl && <a href={item.attachmentUrl} target="_blank" rel="noreferrer" title={item.attachmentName} className="block min-w-0 max-w-full overflow-hidden rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"><span className="block">Tải tệp đề:</span><span className="block truncate">{item.attachmentName}</span></a>}
        {item.audioUrl && <div className="rounded-xl border border-slate-100 p-4"><p className="mb-2 text-sm font-semibold text-slate-700">Âm thanh đề bài: {item.audioName}</p><audio controls preload="none" src={item.audioUrl} className="w-full" /></div>}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-violet-50 p-3"><p className="text-xs text-violet-700">Điểm tối đa</p><p className="mt-1 font-bold text-violet-900">{item.maxScore}</p></div>
          <div className="rounded-xl bg-sky-50 p-3"><p className="text-xs text-sky-700">Hạn nộp</p><p className="mt-1 font-semibold text-slate-700">{item.dueAt ? new Date(item.dueAt).toLocaleString('vi-VN') : 'Không có hạn'}</p></div>
          <div className="rounded-xl bg-amber-50 p-3"><p className="text-xs text-amber-700">Đã nộp</p><p className="mt-1 font-bold text-amber-900">{submittedCount ?? 0}/{recipientCount ?? 0}</p></div>
          <div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Đã chấm</p><p className="mt-1 font-bold text-emerald-900">{gradedCount ?? 0}</p></div>
        </div>
        <form onSubmit={extendDeadline} className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
          <label className="text-sm font-semibold text-slate-600">Gia hạn hạn nộp
            <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 font-normal" />
          </label>
          <button disabled={savingDeadline} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{savingDeadline ? 'Đang lưu...' : 'Cập nhật / mở lại bài tập'}</button>
          {message && <p role="status" className="basis-full text-sm text-emerald-700">{message}</p>}
        </form>
      </section>
      <section className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-sky-50 p-3 text-sky-700"><Users size={21} /></span><div><h2 className="text-lg font-bold text-slate-900">{studentId ? 'Bài làm của học sinh' : 'Danh sách học sinh'}</h2><p className="text-sm text-slate-500">{classSubmissions.length} học sinh trong danh sách</p></div></div>
            <button type="button" onClick={refresh} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"><RefreshCw size={15} />Làm mới</button>
          </div>
          {!studentId && <div className="relative mt-4">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Tìm theo tên hoặc mã học sinh..." aria-label="Tìm kiếm học sinh" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50" />
          </div>}
        </div>
        {submissions.isLoading ? <p className="text-slate-500">Đang tải danh sách học sinh...</p>
          : submissions.errorMessage ? <p role="alert" className="text-red-600">{submissions.errorMessage}</p>
            : studentId ? selectedSubmission ? <div className="space-y-4">
              <Link to={detailPath} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><ArrowLeft size={16} />Quay lại danh sách học sinh</Link>
              <SubmissionRow key={`${selectedSubmission.studentId}-${selectedSubmission.status}`} homeworkId={homeworkId} submission={selectedSubmission} maxScore={item.maxScore} refresh={refresh} />
            </div> : <p role="alert" className="text-sm text-red-600">Không tìm thấy thông tin bài nộp của học sinh này.</p>
              : filteredSubmissions.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredSubmissions.map((submission) => {
                  const studentPath = `/teacher/homework/${homeworkId}/submissions/${submission.studentId}${classId ? `?classId=${classId}` : ''}`
                  const status = submission.status === 'NOT_SUBMITTED' ? 'Chưa nộp' : submission.status === 'GRADED' ? 'Đã chấm' : submission.status === 'REOPENED' ? 'Đã mở lại' : 'Đã nộp'
                  return <Link key={submission.studentId} to={studentPath} className="group flex min-h-40 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-900/5">
                    <div className="flex items-start gap-3">
                      <img
                        src={submission.studentAvatarUrl || defaultAvatar}
                        alt={`Ảnh đại diện của ${submission.studentName || 'học sinh'}`}
                        onError={(event) => {
                          event.currentTarget.onerror = null
                          event.currentTarget.src = defaultAvatar
                        }}
                        className="h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-slate-200"
                      />
                      <div className="min-w-0"><h3 className="truncate font-bold text-slate-900 transition group-hover:text-sky-800">{submission.studentName}</h3><p className="mt-1 text-sm text-slate-500">{submission.studentCode || 'Chưa có mã học sinh'}</p></div>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${submission.status === 'GRADED' ? 'bg-emerald-100 text-emerald-800' : submission.status === 'NOT_SUBMITTED' ? 'bg-slate-100 text-slate-600' : submission.status === 'REOPENED' ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'}`}>{status}</span><span className="text-xs font-semibold text-slate-500">{submission.submittedAt ? `Nộp ${new Date(submission.submittedAt).toLocaleString('vi-VN')}` : submission.status === 'NOT_SUBMITTED' ? 'Chưa có bài nộp' : 'Xem bài làm'}</span></div>
                  </Link>
                })}
              </div> : <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">{classSubmissions.length ? 'Không tìm thấy học sinh phù hợp.' : 'Chưa có học sinh trong danh sách bài tập này.'}</p>}
      </section>
      </div>
    </>}
  </main></DashboardLayout>
}
