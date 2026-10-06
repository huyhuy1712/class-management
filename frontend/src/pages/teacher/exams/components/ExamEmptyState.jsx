import { FileQuestion } from 'lucide-react'

function ExamEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
        <FileQuestion size={26} />
      </div>

      <h3 className="mt-4 text-base font-bold text-[#18301D]">
        Không tìm thấy đề thi
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-400">
        Chưa có đề thi phù hợp với điều kiện tìm kiếm.
      </p>
    </div>
  )
}

export default ExamEmptyState