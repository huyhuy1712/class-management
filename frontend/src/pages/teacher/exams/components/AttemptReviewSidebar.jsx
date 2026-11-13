import { Save, Trash2 } from 'lucide-react'
import defaultAvatar from '../../../../assets/images/avatar_default.png'
import FrogLoading from '../../../../utils/FrogLoading'
import { attemptDuration, scoreTone } from '../helpers/assignmentAttemptHelpers'
import { formatExamDateTime } from '../helpers/examHelpers'

export default function AttemptReviewSidebar({
  data,
  result,
  comment,
  isSaving,
  onCommentChange,
  onSave,
  onReset,
}) {
  return (
    <aside
      tabIndex={0}
      aria-label="Thông tin và chức năng chấm bài"
      className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto xl:overscroll-contain"
    >
      <div className="flex items-center gap-3">
        <img
          src={data.student.avatarUrl || defaultAvatar}
          alt=""
          className="h-12 w-12 rounded-full object-cover"
        />
        <h1 className="text-lg font-bold text-[#18301D]">
          {data.student.fullName}
        </h1>
      </div>
      <p className="text-sm text-slate-500">
        {data.student.studentCode} · Lượt {result.attemptNumber}
      </p>
      <p
        className={`text-2xl font-bold ${scoreTone(
          result.totalScore,
          data.exam.maxScore,
        )}`}
      >
        {result.totalScore}/{data.exam.maxScore} điểm
      </p>
      <p className="text-xs text-slate-500">
        {result.isFinal ? 'Đã chấm xong' : 'Điểm tạm tính · Chờ chấm tự luận'}
      </p>
      <p className="text-sm">
        Thời gian: {attemptDuration(result.durationSeconds)}
      </p>
      <p className="text-sm">Nộp: {formatExamDateTime(result.submittedAt)}</p>
      <p className="text-sm">Rời tab: {result.tabSwitchCount}</p>

      <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs">
        <p>
          Tự động: <strong>{result.autoScore}</strong> · Tự luận:{' '}
          <strong>{result.manualScore}</strong>
        </p>
        {result.sectionScores.map((score) => {
          const section = result.sections.find(
            (item) => item.id === score.sectionId,
          )
          const maximum = section
            ? section.questions.reduce(
                (sum, question) =>
                  sum + Math.round(Number(question.points) * 1000),
                0,
              ) / 1000
            : null

          return (
            <p
              key={score.sectionId}
              className="flex justify-between gap-2"
            >
              <span>{section?.title || `Phần ${score.sectionId}`}</span>
              <strong>{score.totalScore}/{maximum ?? '—'}</strong>
            </p>
          )
        })}
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer">
          Nhật ký vi phạm ({result.events?.length ?? 0})
        </summary>
        {result.events?.map((event) => (
          <p key={event.eventId} className="mt-2 text-xs text-slate-500">
            {event.type === 'TAB_HIDDEN' ? 'Rời tab' : 'Quay lại tab'} ·{' '}
            {formatExamDateTime(event.receivedAt)}
          </p>
        ))}
      </details>

      <label className="block text-sm font-semibold">
        Nhận xét
        <textarea
          aria-label="Nhận xét bài thi"
          maxLength={20000}
          rows={4}
          disabled={isSaving}
          value={comment ?? result.teacherComment ?? ''}
          onChange={(event) => onCommentChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
        />
      </label>

      <button
        type="button"
        disabled={isSaving}
        onClick={onSave}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 p-3 font-semibold text-white disabled:opacity-50"
      >
        <Save size={17} />
        {isSaving ? (
          <FrogLoading compact label="Đang lưu..." />
        ) : (
          'Lưu điểm và nhận xét'
        )}
      </button>
      <button
        type="button"
        disabled={isSaving}
        onClick={() => onReset('RETAKE')}
        className="flex items-center gap-2 text-sm text-red-600"
      >
        <Trash2 size={16} />
        Xóa kết quả và cho thi lại
      </button>
      <button
        type="button"
        disabled={isSaving}
        onClick={() => onReset('BLOCK')}
        className="flex items-center gap-2 text-sm text-red-600"
      >
        <Trash2 size={16} />
        Xóa kết quả và chặn thi lại
      </button>
    </aside>
  )
}
