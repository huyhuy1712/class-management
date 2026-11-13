import { useNavigate } from 'react-router-dom'

const columns = [
  'Bài kiểm tra',
  'Lớp / Môn',
  'Lượt',
  'Ngày nộp',
  'Điểm',
  'Trạng thái',
]

function GradeHistoryRow({ attempt }) {
  const navigate = useNavigate()
  const resultPath = `/student/exam-attempts/${attempt.attemptId}/result`

  const handleClick = (event) => {
    if (event.target.closest('a, button, input, select, textarea')) return
    navigate(resultPath)
  }

  const handleKeyDown = (event) => {
    if (
      event.target !== event.currentTarget ||
      !['Enter', ' '].includes(event.key)
    ) {
      return
    }

    event.preventDefault()
    navigate(resultPath)
  }

  const scoreTone =
    attempt.score == null
      ? 'text-slate-400'
      : attempt.score < 5
        ? 'text-rose-600'
        : 'text-emerald-700'
  const statusTone =
    attempt.status === 'GRADED'
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-amber-50 text-amber-700'

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={`Xem chi tiết bài kiểm tra ${attempt.title}, lượt ${attempt.attemptNumber}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="cursor-pointer border-t border-slate-100 outline-none transition-colors hover:bg-emerald-50/50 focus-visible:bg-emerald-50/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
    >
      <td className="p-3">
        <p className="font-semibold text-[#18301D]">{attempt.title}</p>
        <p className="mt-1 text-xs text-slate-400">
          {attempt.code} · Đợt #{attempt.assignmentId}
        </p>
      </td>
      <td className="p-3 text-slate-500">
        <p>{attempt.classroom}</p>
        <p className="mt-1 text-xs">{attempt.subject}</p>
      </td>
      <td className="p-3 text-slate-500">{attempt.attemptNumber}</td>
      <td className="p-3 text-slate-500">
        {attempt.date.split('-').reverse().join('/')}
      </td>
      <td className={`p-3 font-bold ${scoreTone}`}>
        {attempt.score == null ? '—' : `${attempt.score}/10`}
      </td>
      <td className="p-3">
        <span
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}
        >
          {attempt.status === 'GRADED' ? 'Đã chấm' : 'Chờ chấm'}
        </span>
      </td>
    </tr>
  )
}

export default function GradeHistoryTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-400">
          <tr>
            {columns.map((title, index) => (
              <th key={`${title}-${index}`} className="p-3 font-semibold">
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((attempt) => (
            <GradeHistoryRow key={attempt.id} attempt={attempt} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
