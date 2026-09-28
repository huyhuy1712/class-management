import {
  BookOpen,
  CalendarDays,
  EllipsisVertical,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react'

function ClassCard({
  classroom,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <article className="group rounded-2xl border border-green-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-900/5">
      
      {/* Top */}
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <BookOpen size={22} strokeWidth={1.8} />
        </div>

        <div className="group/menu relative">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <EllipsisVertical size={19} />
          </button>

          {/* Menu */}
          <div className="invisible absolute right-0 top-10 z-20 w-40 translate-y-1 rounded-xl border border-gray-100 bg-white p-1.5 opacity-0 shadow-xl transition-all group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100">
            <button
              type="button"
              onClick={() => onEdit(classroom)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-green-50 hover:text-green-700"
            >
              <Pencil size={16} />
              Chỉnh sửa
            </button>

            <button
              type="button"
              onClick={() => onDelete(classroom)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Xóa lớp
            </button>
          </div>
        </div>
      </div>

      {/* Class */}
      <div className="mt-5">
        <h3 className="text-lg font-bold text-[#18301D]">
          {classroom.name}
        </h3>

        <span className="mt-2 inline-block rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
          {classroom.code}
        </span>
      </div>

      {/* Information */}
      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BookOpen size={17} className="text-green-600" />
          {classroom.subject}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CalendarDays size={17} className="text-green-600" />
          {classroom.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users size={17} className="text-green-600" />
          {classroom.studentCount} học sinh
        </div>
      </div>

      <button
        type="button"
        onClick={() => onView(classroom)}
        className="mt-5 w-full rounded-xl bg-[#14532D] py-2.5 text-sm font-semibold text-white transition hover:bg-[#166534]"
      >
        Xem lớp học
      </button>
    </article>
  )
}

export default ClassCard