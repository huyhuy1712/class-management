import {
  ClipboardCheck,
  FileText,
  Pencil,
  Trash2,
  UsersRound,
} from 'lucide-react'

import { formatExamDateTime } from '../helpers/examHelpers'
import ExamEmptyState from './ExamEmptyState'
import ExamStatusBadge from './ExamStatusBadge'

function ExamTable({
  exams = [],
  onView,
  onEdit,
  onDelete,
  
}) {
  if (!exams.length) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ExamEmptyState />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tên đề thi
              </th>

              <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                Số bài đã nộp
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Trạng thái
              </th>

              <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                Số lớp đã giao
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Thời gian tạo
              </th>

              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Hành động
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {exams.map((exam) => (
              <tr
                key={exam.id}
                onClick={() => onView?.(exam)}
                className="cursor-pointer transition hover:bg-green-50/30"
              >
                {/* TÊN ĐỀ */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                      <FileText size={20} />
                    </div>
                <div className="min-w-0">
                <p className="block max-w-[330px] truncate text-sm font-semibold text-[#18301D]">
                    {exam.title}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                    Mã đề: {exam.code || '---'}
                </p>
                </div>
                  </div>
                </td>

                {/* SỐ BÀI ĐÃ NỘP */}
                <td className="px-5 py-5 text-center">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ClipboardCheck
                      size={17}
                      className="text-green-600"
                    />

                    {exam.submittedCount  ?? 0}
                  </div>
                </td>

                {/* STATUS */}
                <td className="px-5 py-5">
                  <ExamStatusBadge
                    status={exam.status}
                  />
                </td>

                {/* SỐ LỚP */}
                <td className="px-5 py-5 text-center">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <UsersRound
                      size={17}
                      className="text-slate-400"
                    />

                    {exam.assignedClassCount ?? 0}
                  </div>
                </td>

                {/* CREATED AT */}
                <td className="px-5 py-5">
                  <span className="text-sm font-medium text-slate-600">
                    {formatExamDateTime(
                      exam.createdAt,
                    )}
                  </span>
                </td>

                {/* ACTION */}
                <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-1">
                        <button
                        type="button"
                        title="Chỉnh sửa"
                        onClick={(event) => {
                            event.stopPropagation()
                            onEdit?.(exam)
                        }}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                        <Pencil size={18} />
                        </button>

                        <button
                        type="button"
                        title="Xóa đề thi"
                        onClick={(event) => {
                            event.stopPropagation()
                            onDelete?.(exam)
                        }}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        >
                        <Trash2 size={18} />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ExamTable