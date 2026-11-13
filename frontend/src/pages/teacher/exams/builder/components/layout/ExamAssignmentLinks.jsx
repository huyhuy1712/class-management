import { ArrowUpRight, ClipboardCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const assignmentStatusLabels = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã xuất bản',
  CLOSED: 'Đã đóng',
}

export default function ExamAssignmentLinks({ examId, assignments = [] }) {
  return (
    <nav
      aria-label="Các đợt giao của đề thi"
      className="mb-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <ClipboardCheck size={18} className="text-emerald-700" />
        <h2 className="font-bold text-[#18301D]">Các đợt giao của đề thi</h2>
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-slate-500">
          Đề thi này chưa có đợt giao.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <Link
                to={`/teacher/exams/${examId}/assignments/${assignment.id}`}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <span className="text-sm font-semibold text-slate-800">
                  Đợt giao #{assignment.id}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 group-hover:bg-white">
                  {assignmentStatusLabels[assignment.status] ??
                    assignment.status ??
                    'Không rõ trạng thái'}
                </span>
                <span className="text-xs font-medium text-emerald-700">
                  Xem học sinh & kết quả
                </span>
                <ArrowUpRight
                  size={15}
                  className="text-emerald-700"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
