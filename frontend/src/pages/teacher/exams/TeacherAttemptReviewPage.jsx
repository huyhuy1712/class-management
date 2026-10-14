import FrogLoading from '../../../utils/FrogLoading'
import { useRef, useState } from 'react'
import defaultAvatar from '../../../assets/images/avatar_default.png'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Modal, message } from 'antd'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import DashboardLayout from '../../../layouts/DashboardLayout'
import useResourceQuery from '../../../query/useResourceQuery'
import { getSessionVersion } from '../../../query/queryClient'
import examService from '../../../services/examService'
import ExamAnswerReview from '../../student/exams/components/ExamAnswerReview'
import { attemptDuration, scoreTone } from './helpers/assignmentAttemptHelpers'
import { formatExamDateTime } from './helpers/examHelpers'

export default function TeacherAttemptReviewPage() {
  const { examId, assignmentId, attemptId } = useParams()
  const [params] = useSearchParams()
  const classId = params.get('classId')
  const query = useResourceQuery('teacherAttemptReview', [attemptId], { staleTime: 0 })
  const back = `/teacher/exams/${examId}/assignments/${assignmentId}${classId ? `?classId=${classId}` : ''}`
  return <DashboardLayout><div className="mx-auto max-w-[1600px] pb-8"><Link to={back} className="mb-5 flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={18} />Quay lại kết quả đợt giao</Link>
    {query.isLoading ? <FrogLoading label="Đang tải bài làm..." /> : query.errorMessage ? <p role="alert" className="text-red-600">{query.errorMessage}<button type="button" onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button></p>
      : String(query.data.exam.id) !== examId || String(query.data.assignmentId) !== assignmentId ? <p role="alert">Bài làm không thuộc đợt giao này.</p>
        : <ReviewEditor key={`${attemptId}:${query.data.result.attemptNumber}`} query={query} back={back} />}
  </div></DashboardLayout>
}

function ReviewEditor({ query, back }) {
  const data = query.data, result = data.result
  const navigate = useNavigate()
  const [messageApi, context] = message.useMessage()
  const [grades, setGrades] = useState({})
  const [comment, setComment] = useState(null)
  const [revision, setRevision] = useState(null)
  const [resetMode, setResetMode] = useState(null)
  const actionLock = useRef(false)
  const mutation = useMutation({
    mutationFn: ({ mode, body, version }) => {
      if (version !== getSessionVersion()) throw new Error('Phiên đăng nhập đã thay đổi.')
      return mode ? examService.resetAttempt(result.attemptId, body) : examService.updateAttemptGrades(result.attemptId, body)
    },
    onSuccess: (response, { mode, version }) => {
      if (version !== getSessionVersion()) return
      if (mode) { setResetMode(null); navigate(back); return }
      query.setData((current) => ({ ...current, result: response }))
      setGrades({}); setComment(null); setRevision(null)
      messageApi.success('Đã lưu điểm và nhận xét.')
    },
  })
  const perform = async (mode = null) => {
    if (actionLock.current) return
    actionLock.current = true
    try {
      const body = { attemptNumber: result.attemptNumber, revision: revision ?? result.revision }
      if (mode) body.mode = mode
      else {
        body.grades = Object.entries(grades).filter(([, score]) => score !== '').map(([answerId, score]) => {
          const group = result.sections.flatMap((section) => section.questions).flatMap((question) => question.answers).find((item) => String(item.id) === answerId)
          const value = Number(score)
          if (!Number.isFinite(value) || value < 0 || value > Number(group.points) || !/^\d+(\.\d{1,2})?$/.test(String(score))) throw new Error(`Điểm câu tự luận phải từ 0 đến ${group.points}, tối đa 2 chữ số thập phân.`)
          return { answerId: Number(answerId), score: value }
        })
        body.teacherComment = comment ?? result.teacherComment ?? ''
      }
      await mutation.mutateAsync({ mode, body, version: getSessionVersion() })
    } catch (error) { messageApi.error(error.response?.data?.message || error.message || 'Không thể lưu. Hãy tải lại dữ liệu nếu bài đã thay đổi.') }
    finally { actionLock.current = false }
  }
  return <>{context}<div className="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
    <aside tabIndex={0} aria-label="Thông tin và chức năng chấm bài" className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto xl:overscroll-contain">
      <div className="flex items-center gap-3"><img src={data.student.avatarUrl || defaultAvatar} alt="" className="h-12 w-12 rounded-full object-cover" /><h1 className="text-lg font-bold text-[#18301D]">{data.student.fullName}</h1></div><p className="text-sm text-slate-500">{data.student.studentCode} · Lượt {result.attemptNumber}</p>
      <p className={`text-2xl font-bold ${scoreTone(result.totalScore, data.exam.maxScore)}`}>{result.totalScore}/{data.exam.maxScore} điểm</p><p className="text-xs text-slate-500">{result.isFinal ? 'Đã chấm xong' : 'Điểm tạm tính · Chờ chấm tự luận'}</p>
      <p className="text-sm">Thời gian: {attemptDuration(result.durationSeconds)}</p><p className="text-sm">Nộp: {formatExamDateTime(result.submittedAt)}</p><p className="text-sm">Rời tab: {result.tabSwitchCount}</p>
      <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs"><p>Tự động: <strong>{result.autoScore}</strong> · Tự luận: <strong>{result.manualScore}</strong></p>{result.sectionScores.map((score) => {
        const section = result.sections.find((item) => item.id === score.sectionId)
        const maximum = section ? section.questions.reduce((sum, question) => sum + Math.round(Number(question.points) * 100), 0) / 100 : null
        return <p key={score.sectionId} className="flex justify-between gap-2"><span>{section?.title || `Phần ${score.sectionId}`}</span><strong>{score.totalScore}/{maximum ?? '—'}</strong></p>
      })}</div>
      <details className="text-sm"><summary className="cursor-pointer">Nhật ký vi phạm ({result.events?.length ?? 0})</summary>{result.events?.map((event) => <p key={event.eventId} className="mt-2 text-xs text-slate-500">{event.type === 'TAB_HIDDEN' ? 'Rời tab' : 'Quay lại tab'} · {formatExamDateTime(event.receivedAt)}</p>)}</details>
      <label className="block text-sm font-semibold">Nhận xét<textarea aria-label="Nhận xét bài thi" maxLength={20000} rows={4} disabled={mutation.isPending} value={comment ?? result.teacherComment ?? ''} onChange={(event) => { setRevision((value) => value ?? result.revision); setComment(event.target.value) }} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
      <button type="button" disabled={mutation.isPending} onClick={() => perform()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 p-3 font-semibold text-white disabled:opacity-50"><Save size={17} />{mutation.isPending ? <FrogLoading compact label="Đang lưu..." /> : 'Lưu điểm và nhận xét'}</button>
      <button type="button" disabled={mutation.isPending} onClick={() => setResetMode('RETAKE')} className="flex items-center gap-2 text-sm text-red-600"><Trash2 size={16} />Xóa kết quả và cho thi lại</button>
      <button type="button" disabled={mutation.isPending} onClick={() => setResetMode('BLOCK')} className="flex items-center gap-2 text-sm text-red-600"><Trash2 size={16} />Xóa kết quả và chặn thi lại</button>
    </aside>
    <main className="min-w-0"><h2 className="text-xl font-bold text-[#18301D]">{data.exam.title}</h2>{query.isError && <p role="alert" className="mt-3 text-amber-700">Chưa tải được dữ liệu mới. <button type="button" onClick={() => query.refetch()} className="underline">Thử lại</button></p>}
      <ExamAnswerReview result={result} renderGrading={(question) => {
        if (question.type !== 'ESSAY') return null
        const answer = result.answers.find((item) => item.answerId === question.id)
        const blank = !answer?.text?.trim()
        const review = result.review.find((item) => item.answerId === question.id)
        return <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><label className="flex flex-wrap items-center gap-3 font-semibold">Điểm tự luận<input type="number" aria-label={`Điểm câu ${question.displayNumber}`} min={0} max={question.points} step="0.01" disabled={blank || mutation.isPending} value={blank ? 0 : grades[question.id] ?? review?.score ?? ''} onChange={(event) => { setRevision((value) => value ?? result.revision); setGrades((current) => ({ ...current, [question.id]: event.target.value })) }} className="w-24 rounded-lg border border-amber-200 bg-white p-2" />/ {question.points}</label>{blank && <p className="mt-2 text-xs text-slate-500">Câu bỏ trống được tính 0 điểm, không chấm thủ công.</p>}</div>
      }} />
    </main>
  </div><Modal title={resetMode === 'RETAKE' ? 'Xóa kết quả và cho thi lại?' : 'Xóa kết quả và chặn thi lại?'} open={Boolean(resetMode)} onCancel={() => { if (!mutation.isPending) setResetMode(null) }} onOk={() => perform(resetMode)} confirmLoading={mutation.isPending} okText="Xác nhận xóa" cancelText="Hủy" okButtonProps={{ danger: true }} closable={!mutation.isPending} maskClosable={!mutation.isPending}><p>Đáp án đã nộp, điểm, nhận xét và nhật ký của lượt hiện tại sẽ bị xóa. Hành động không thể hoàn tác.</p><p className="mt-3">{resetMode === 'RETAKE' ? 'Học sinh được thêm quyền làm lại, vẫn phải đáp ứng lịch thi và quyền tham gia lớp. Đáp án đã được công bố trước đó không thể thu hồi.' : 'Học sinh bị chặn thi lại trong đợt giao này, không ảnh hưởng các đợt khác.'}</p></Modal></>
}
