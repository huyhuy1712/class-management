import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import StudentDashboardLayout from '../../../layouts/StudentDashboardLayout'
import useResourceQuery from '../../../query/useResourceQuery'
import homeworkService from '../../../services/homeworkService'

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_AUDIO_SIZE = 10 * 1024 * 1024
const MAX_FILES = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024
const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|aac|ogg|webm)$/i
const FILE_EXTENSIONS = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|csv)$/i

export default function StudentHomeworkDetailPage() {
  const { homeworkId } = useParams()
  const query = useResourceQuery('studentHomework', [homeworkId])
  const [answerText, setAnswerText] = useState(null)
  const [images, setImages] = useState([])
  const [files, setFiles] = useState([])
  const [audio, setAudio] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const item = query.data
  const assignment = item?.assignment
  const deadlinePassed = assignment?.dueAt && new Date(assignment.dueAt).getTime() <= now
  const canSubmit = item && item.submissionStatus !== 'GRADED'
    && (item.submissionStatus === 'REOPENED' || (assignment.status === 'OPEN' && !deadlinePassed))

  const chooseImages = (event) => {
    const next = [...(event.target.files ?? [])]
    if (next.length > MAX_IMAGES) setError(`Mỗi lần nộp tối đa ${MAX_IMAGES} ảnh.`)
    else if (next.some((file) => file.size > MAX_IMAGE_SIZE)) setError('Mỗi ảnh không được vượt quá 5 MB.')
    else if (next.some((file) => !['image/jpeg', 'image/png'].includes(file.type))) setError('Chỉ chấp nhận ảnh JPG hoặc PNG.')
    else {
      setError('')
      setImages(next)
    }
  }

  const chooseFiles = (event) => {
    const next = [...(event.target.files ?? [])]
    if (next.length > MAX_FILES) setError(`Mỗi lần nộp tối đa ${MAX_FILES} tệp.`)
    else if (next.some((file) => file.size > MAX_FILE_SIZE)) setError('Mỗi tệp bài làm không được vượt quá 10 MB.')
    else if (next.some((file) => !FILE_EXTENSIONS.test(file.name))) setError('Tệp bài làm chỉ hỗ trợ PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR hoặc CSV.')
    else {
      setError('')
      setFiles(next)
    }
  }

  const chooseAudio = (event) => {
    const next = event.target.files?.[0] ?? null
    if (next && !AUDIO_EXTENSIONS.test(next.name)) setError('Tệp âm thanh chỉ hỗ trợ MP3, WAV, M4A, AAC, OGG hoặc WEBM.')
    else if (next && next.size > MAX_AUDIO_SIZE) setError('Tệp âm thanh không được vượt quá 10 MB.')
    else {
      setError('')
      setAudio(next)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    setError('')
    setSuccess('')
    const currentAnswer = answerText ?? item.answerText ?? ''
    if (!currentAnswer.trim() && !images.length && !files.length && !audio) {
      setError('Nhập câu trả lời hoặc chọn ảnh, tệp hoặc âm thanh bài làm.')
      return
    }
    setSaving(true)
    try {
      await homeworkService.submit(homeworkId, currentAnswer, images, files, audio)
      setImages([])
      setFiles([])
      setAudio(null)
      setAnswerText(null)
      formElement.reset()
      await query.refetch()
      setSuccess(item.submissionStatus === 'NOT_SUBMITTED' ? 'Nộp bài tập thành công.' : 'Nộp lại bài tập thành công.')
    } catch (failure) {
      setError(failure.response?.data?.message || failure.message || 'Không thể nộp bài.')
    } finally {
      setSaving(false)
    }
  }

  return <StudentDashboardLayout><main className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-8">
    <Link to="/student/homework" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><ArrowLeft size={17} />Danh sách bài tập</Link>
    {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">✓ {success}</p>}
    {query.isLoading ? <p className="text-slate-500">Đang tải bài tập...</p> : query.errorMessage ? <p role="alert" className="text-red-600">{query.errorMessage}</p> : item && <>
      <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{[assignment.subjectName, assignment.gradeLevel, assignment.purpose].filter(Boolean).join(' · ')}</p>
        {assignment.createdAt && <p className="mt-1 text-xs text-slate-400">Tạo lúc {new Date(assignment.createdAt).toLocaleString('vi-VN')}</p>}
        {assignment.instructions && <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">{assignment.instructions}</p>}
        {assignment.attachmentUrl && <a href={assignment.attachmentUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block font-semibold text-emerald-700 underline">Mở tệp đề: {assignment.attachmentName}</a>}
        {assignment.audioUrl && <div className="mt-4"><p className="mb-2 text-sm font-semibold text-slate-700">Âm thanh đề bài: {assignment.audioName}</p><audio controls preload="none" src={assignment.audioUrl} className="w-full" /></div>}
        <p className="mt-4 text-sm text-slate-500">{assignment.dueAt ? `Hạn nộp: ${new Date(assignment.dueAt).toLocaleString('vi-VN')}` : 'Không có hạn nộp'} · Điểm tối đa {assignment.maxScore}</p>
      </section>

      {item.submissionStatus !== 'NOT_SUBMITTED' && <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-slate-900">{item.submissionStatus === 'GRADED' ? 'Bài đã được trả' : item.submissionStatus === 'REOPENED' ? 'Bài đã được mở lại' : 'Bài đã nộp'}</h2>
        {item.submittedAt && <p className="mt-1 text-xs text-slate-400">Nộp lúc {new Date(item.submittedAt).toLocaleString('vi-VN')} · {item.submissionStatus === 'GRADED' ? 'Đã chấm' : item.submissionStatus === 'REOPENED' ? 'Đã mở lại, chờ học sinh nộp' : 'Đã nộp, chờ chấm'}</p>}
        {item.answerText && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item.answerText}</p>}
        {item.images?.length > 0 && <div className="mt-4 flex flex-wrap gap-3">{item.images.map((image) => <a key={image.url} href={image.url} target="_blank" rel="noreferrer" aria-label={`Mở ảnh ${image.name}`}><img src={image.url} alt={image.name} className="h-32 max-w-48 rounded-lg border border-slate-200 object-contain" /></a>)}</div>}
        {item.files?.length > 0 && <div className="mt-4 space-y-2">{item.files.map((file) => <a key={file.url} href={file.url} target="_blank" rel="noreferrer" download className="block rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-slate-50">Tải tệp: {file.name}</a>)}</div>}
        {item.audioUrl && <div className="mt-4"><p className="mb-2 text-sm font-semibold text-slate-700">Âm thanh bài làm: {item.audioName}</p><audio controls preload="none" src={item.audioUrl} className="w-full" /></div>}        {item.submissionStatus === 'GRADED' && <div className="mt-4 rounded-xl bg-emerald-50 p-4"><p className="font-bold text-emerald-800">Điểm: {item.score}/{assignment.maxScore}</p>{item.teacherComment && <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-900">{item.teacherComment}</p>}</div>}
      </section>}

      {canSubmit ? <form onSubmit={submit} className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">{item.submissionStatus === 'NOT_SUBMITTED' ? 'Nộp bài' : 'Chỉnh sửa / nộp lại'}</h2>
        <label className="block text-sm font-semibold text-slate-700">Câu trả lời bằng văn bản
          <textarea rows={7} maxLength={50000} value={answerText ?? item.answerText ?? ''} onChange={(event) => setAnswerText(event.target.value)} placeholder="Nhập câu trả lời..." className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-normal" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">Hoặc gửi ảnh bài làm
          <input type="file" multiple accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={chooseImages} className="mt-1.5 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 font-normal" />
          <span className="mt-1 block text-xs font-normal text-slate-500">{images.length ? images.map((image) => image.name).join(', ') : 'Tối đa 5 ảnh JPG/PNG, mỗi ảnh không quá 5 MB. Có thể kết hợp ảnh và văn bản.'}</span>
        </label>
        <label className="block text-sm font-semibold text-slate-700">Hoặc gửi tệp bài làm
          <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv" onChange={chooseFiles} className="mt-1.5 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 font-normal" />
          <span className="mt-1 block text-xs font-normal text-slate-500">{files.length ? files.map((file) => file.name).join(', ') : 'Tối đa 5 tệp PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, ZIP, RAR hoặc CSV; mỗi tệp tối đa 10 MB.'}</span>
        </label>
        <label className="block text-sm font-semibold text-slate-700">Hoặc gửi file âm thanh
          <input type="file" accept=".mp3,.wav,.m4a,.aac,.ogg,.webm" onChange={chooseAudio} className="mt-1.5 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 font-normal" />
          <span className="mt-1 block text-xs font-normal text-slate-500">{audio?.name ?? (item.audioName ? `Đang lưu: ${item.audioName} · chọn tệp mới nếu muốn thay thế` : 'MP3, WAV, M4A, AAC, OGG, WEBM · tối đa 10 MB')}</span>
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Đang gửi...' : item.submissionStatus === 'NOT_SUBMITTED' ? 'Gửi bài' : 'Lưu và nộp lại'}</button>
      </form> : <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{item.submissionStatus === 'GRADED' ? 'Bài đã được chấm. Nếu cần nộp lại, hãy liên hệ giáo viên để được mở lại.' : 'Đã quá hạn hoặc bài tập đã đóng nên hiện không nhận bài.'}</p>}
    </>}
  </main></StudentDashboardLayout>
}
