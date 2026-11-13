import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { message } from 'antd'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout'
import FrogLoading from '../../../utils/FrogLoading'
import useResourceQuery from '../../../query/useResourceQuery'
import { getSessionVersion } from '../../../query/queryClient'
import examService from '../../../services/examService'
import ExamAnswerReview from '../../student/exams/components/ExamAnswerReview'
import AttemptReviewSidebar from './components/AttemptReviewSidebar'
import AttemptEssayGrading from './components/AttemptEssayGrading'
import ResetAttemptDialog from './components/ResetAttemptDialog'

export default function TeacherAttemptReviewPage() {
  const { examId, assignmentId, attemptId } = useParams()
  const [params] = useSearchParams()
  const classId = params.get('classId')
  const query = useResourceQuery('teacherAttemptReview', [attemptId], {
    staleTime: 0,
  })
  const back = `/teacher/exams/${examId}/assignments/${assignmentId}${
    classId ? `?classId=${classId}` : ''
  }`

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1600px] pb-8">
        <Link
          to={back}
          className="mb-5 flex items-center gap-2 text-sm text-slate-500"
        >
          <ArrowLeft size={18} />
          Quay lại kết quả đợt giao
        </Link>

        {query.isLoading ? (
          <FrogLoading label="Đang tải bài làm..." />
        ) : query.errorMessage ? (
          <p role="alert" className="text-red-600">
            {query.errorMessage}
            <button
              type="button"
              onClick={() => query.refetch()}
              className="ml-3 underline"
            >
              Thử lại
            </button>
          </p>
        ) : String(query.data.exam.id) !== examId ||
          String(query.data.assignmentId) !== assignmentId ? (
          <p role="alert">Bài làm không thuộc đợt giao này.</p>
        ) : (
          <ReviewEditor
            key={`${attemptId}:${query.data.result.attemptNumber}`}
            query={query}
            back={back}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

function ReviewEditor({ query, back }) {
  const { data } = query
  const { result } = data
  const navigate = useNavigate()
  const [messageApi, context] = message.useMessage()
  const [grades, setGrades] = useState({})
  const [comment, setComment] = useState(null)
  const [revision, setRevision] = useState(null)
  const [resetMode, setResetMode] = useState(null)
  const actionLock = useRef(false)

  const mutation = useMutation({
    mutationFn: ({ mode, body, version }) => {
      if (version !== getSessionVersion()) {
        throw new Error('Phiên đăng nhập đã thay đổi.')
      }

      return mode
        ? examService.resetAttempt(result.attemptId, body)
        : examService.updateAttemptGrades(result.attemptId, body)
    },
    onSuccess: (response, { mode, version }) => {
      if (version !== getSessionVersion()) return

      if (mode) {
        setResetMode(null)
        navigate(back)
        return
      }

      query.setData((current) => ({ ...current, result: response }))
      setGrades({})
      setComment(null)
      setRevision(null)
      messageApi.success('Đã lưu điểm và nhận xét.')
    },
  })

  const perform = async (mode = null) => {
    if (actionLock.current) return

    actionLock.current = true
    try {
      const body = {
        attemptNumber: result.attemptNumber,
        revision: revision ?? result.revision,
      }

      if (mode) {
        body.mode = mode
      } else {
        const answerById = new Map(
          result.sections
            .flatMap((section) => section.questions)
            .flatMap((question) => question.answers)
            .map((answer) => [String(answer.id), answer]),
        )

        body.grades = Object.entries(grades)
          .filter(([, score]) => score !== '')
          .map(([answerId, score]) => {
            const answer = answerById.get(answerId)
            const value = Number(score)

            if (
              !Number.isFinite(value) ||
              value < 0 ||
              value > Number(answer.points) ||
              !/^\d+(\.\d{1,3})?$/.test(String(score))
            ) {
              throw new Error(
                `Điểm câu tự luận phải từ 0 đến ${answer.points}, tối đa 3 chữ số thập phân.`,
              )
            }

            return { answerId: Number(answerId), score: value }
          })
        body.teacherComment = comment ?? result.teacherComment ?? ''
      }

      await mutation.mutateAsync({
        mode,
        body,
        version: getSessionVersion(),
      })
    } catch (error) {
      messageApi.error(
        error.response?.data?.message ||
          error.message ||
          'Không thể lưu. Hãy tải lại dữ liệu nếu bài đã thay đổi.',
      )
    } finally {
      actionLock.current = false
    }
  }

  const handleCommentChange = (value) => {
    setRevision((current) => current ?? result.revision)
    setComment(value)
  }

  const handleGradeChange = (answerId, value) => {
    setRevision((current) => current ?? result.revision)
    setGrades((current) => ({ ...current, [answerId]: value }))
  }

  return (
    <>
      {context}
      <div className="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <AttemptReviewSidebar
          data={data}
          result={result}
          comment={comment}
          isSaving={mutation.isPending}
          onCommentChange={handleCommentChange}
          onSave={() => perform()}
          onReset={setResetMode}
        />

        <main className="min-w-0">
          <h2 className="text-xl font-bold text-[#18301D]">
            {data.exam.title}
          </h2>
          {query.isError && (
            <p role="alert" className="mt-3 text-amber-700">
              Chưa tải được dữ liệu mới.{' '}
              <button
                type="button"
                onClick={() => query.refetch()}
                className="underline"
              >
                Thử lại
              </button>
            </p>
          )}
          <ExamAnswerReview
            result={result}
            renderGrading={(question) => (
              <AttemptEssayGrading
                question={question}
                result={result}
                grades={grades}
                isSaving={mutation.isPending}
                onGradeChange={handleGradeChange}
              />
            )}
          />
        </main>
      </div>

      <ResetAttemptDialog
        resetMode={resetMode}
        isPending={mutation.isPending}
        onCancel={() => setResetMode(null)}
        onConfirm={() => perform(resetMode)}
      />
    </>
  )
}
