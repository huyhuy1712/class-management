import { Link } from 'react-router-dom'
import defaultAvatar from '../../../../../assets/images/avatar_default.png'
import { formatExamDateTime } from '../../../exams/helpers/examHelpers'

const formatScore = (value) =>
  value == null ? '—' : Number(Number(value).toFixed(3))

const averageScoreTone = (score) => {
  if (score == null) return 'text-slate-400'
  return score < 5 ? 'text-red-600' : 'text-emerald-700'
}

function getGradePresentation(cell, column) {
  if (cell.status === 'GRADED') {
    return {
      label: `${formatScore(cell.totalScore)}/${formatScore(column.maxScore)}`,
      tone: Number(cell.scoreOnTen) < 5 ? 'text-red-600' : 'text-emerald-700',
    }
  }

  if (cell.status === 'SUBMITTED') {
    return { label: 'Chờ chấm', tone: 'text-amber-600' }
  }

  if (cell.status === 'IN_PROGRESS') {
    return { label: 'Đang làm', tone: 'text-slate-400' }
  }

  return { label: 'Chưa làm', tone: 'text-slate-400' }
}

function GradeCell({ cell, column, classId, prefetch }) {
  if (!cell?.assigned) {
    return <span className="text-xs text-slate-400">Không được giao</span>
  }

  const { label, tone } = getGradePresentation(cell, column)
  const reviewPath = `/teacher/exams/${column.examId}/assignments/${column.assignmentId}/attempts/${cell.attemptId}?classId=${classId}`
  const canReview =
    cell.attemptId && ['GRADED', 'SUBMITTED'].includes(cell.status)

  if (!canReview) {
    return <span className={`text-xs ${tone}`}>{label}</span>
  }

  return (
    <Link
      title="Xem bài làm"
      to={reviewPath}
      onMouseEnter={() => prefetch(reviewPath)}
      onFocus={() => prefetch(reviewPath)}
      className={`font-semibold hover:underline ${tone}`}
    >
      {label}
    </Link>
  )
}

function GradeTableHeader({ columns, sort }) {
  return (
    <thead className="bg-slate-50 text-slate-600">
      <tr>
        <th className="sticky left-0 z-10 min-w-[240px] bg-slate-50 p-4">
          Họ và tên
        </th>
        <th className="min-w-[120px] border-l border-slate-200 p-4">
          Mã học sinh
        </th>
        {columns.map((column) => (
          <th
            key={column.assignmentId}
            className="min-w-[180px] max-w-[230px] border-l border-slate-200 p-4"
          >
            <p title={column.title} className="line-clamp-2">
              {column.title}
            </p>
            <p className="mt-1 text-xs font-normal text-slate-400">
              {column.code} · Đợt #{column.assignmentId}
            </p>
          </th>
        ))}
        <th className="min-w-[150px] border-l border-slate-200 p-4 text-center">
          Trung bình /10 {sort === 'asc' ? '↑' : '↓'}
        </th>
      </tr>
    </thead>
  )
}

function GradeStudentRow({ student, columns, classId, prefetch, navigate }) {
  const cellsByAssignment = new Map(
    student.cells.map((cell) => [String(cell.assignmentId), cell]),
  )
  const studentPath = `/teacher/classes/${classId}/students/${student.studentId}`

  const handleRowClick = (event) => {
    if (
      event.target.closest(
        'a, button, input, select, textarea, [role="button"], [role="link"]',
      )
    ) {
      return
    }

    navigate(studentPath)
  }

  const handleRowKeyDown = (event) => {
    if (
      event.target !== event.currentTarget ||
      !['Enter', ' '].includes(event.key)
    ) {
      return
    }

    event.preventDefault()
    navigate(studentPath)
  }

  return (
    <tr
      tabIndex={0}
      aria-label={`Xem chi tiết học sinh ${student.fullName}`}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      onMouseEnter={() => prefetch(studentPath)}
      onFocus={() => prefetch(studentPath)}
      className="group cursor-pointer border-t border-slate-200 outline-none transition-colors hover:bg-emerald-50/50 focus-visible:bg-emerald-50/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
    >
      <td className="sticky left-0 z-10 bg-white p-4 group-hover:bg-emerald-50/50">
        <div className="flex items-center gap-3">
          <img
            src={student.avatarUrl || defaultAvatar}
            alt=""
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = defaultAvatar
            }}
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
          <div>
            <Link
              to={studentPath}
              onMouseEnter={() => prefetch(studentPath)}
              onFocus={() => prefetch(studentPath)}
              className="font-bold text-slate-800 hover:text-emerald-700"
            >
              {student.fullName}
            </Link>
            <p className="mt-1 text-xs text-slate-400">
              Tham gia:{' '}
              {student.joinedAt
                ? formatExamDateTime(student.joinedAt)
                : '—'}
            </p>
          </div>
        </div>
      </td>

      <td className="border-l border-slate-100 p-4 text-slate-500">
        {student.studentCode || '—'}
      </td>

      {columns.map((column) => (
        <td
          key={column.assignmentId}
          className="border-l border-slate-100 p-4 text-center"
        >
          <GradeCell
            cell={cellsByAssignment.get(String(column.assignmentId))}
            column={column}
            classId={classId}
            prefetch={prefetch}
          />
        </td>
      ))}

      <td
        className={`border-l border-slate-100 p-4 text-center font-bold ${averageScoreTone(
          student.averageScoreOnTen,
        )}`}
      >
        {formatScore(student.averageScoreOnTen)}
      </td>
    </tr>
  )
}

export default function GradeTable({
  rows,
  columns,
  sort,
  classId,
  prefetch,
  navigate,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <GradeTableHeader columns={columns} sort={sort} />
        <tbody>
          {rows.map((student) => (
            <GradeStudentRow
              key={student.studentId}
              student={student}
              columns={columns}
              classId={classId}
              prefetch={prefetch}
              navigate={navigate}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
