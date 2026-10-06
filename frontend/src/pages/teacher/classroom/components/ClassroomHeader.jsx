import { Plus, School } from 'lucide-react'

function ClassroomHeader({ onCreate }) {
  return (
    <div className="flex flex-col justify-between gap-5 border-b border-emerald-100 pb-6 md:flex-row md:items-center">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
          <School size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#18301D]">Lớp học</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý các lớp học bạn đang phụ trách
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-800 sm:w-auto"
      >
        <Plus size={18} />
        Tạo lớp
      </button>
    </div>
  )
}

export default ClassroomHeader
