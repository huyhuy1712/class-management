import {
  EXAM_STATUS,
  EXAM_STATUS_LABEL,
} from '../helpers/examConstants'

function ExamStatusBadge({ status }) {
  const styles = {
    [EXAM_STATUS.DRAFT]:
      'border-slate-200 bg-slate-50 text-slate-600',

    [EXAM_STATUS.PUBLISHED]:
      'border-green-200 bg-green-50 text-green-700',

    [EXAM_STATUS.CLOSED]:
      'border-red-200 bg-red-50 text-red-600',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[status] ||
        styles[EXAM_STATUS.DRAFT]
      }`}
    >
      {EXAM_STATUS_LABEL[status] || status}
    </span>
  )
}

export default ExamStatusBadge