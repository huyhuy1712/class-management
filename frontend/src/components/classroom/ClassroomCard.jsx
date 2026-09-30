import {
  BookOpen,
  CalendarDays,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
  CircleOff,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function ClassCard({
  classroom,
  onView,
  onEdit,
  onArchive,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined

    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [menuOpen])

  return (
    <article className="group rounded-2xl border border-green-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-900/5">
      
      {/* Top */}
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <BookOpen size={22} strokeWidth={1.8} />
        </div>

        <div ref={menuRef} className="group/menu relative">
          <button
            type="button"
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <MoreVertical size={19} />
          </button>

          {/* Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
            <button
              type="button"
              onClick={() => {
                onEdit(classroom)
                setMenuOpen(false)
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              <Pencil size={17} />
              Chỉnh sửa
            </button>

            {classroom.status !== 'ARCHIVED' && (
              <button
                type="button"
                onClick={() => {
                  onArchive(classroom)
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-orange-500 transition hover:bg-orange-50"
              >
                <CircleOff size={17} />
                Vô hiệu
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onDelete(classroom)
                setMenuOpen(false)
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-50"
            >
              <Trash2 size={17} />
              Xóa lớp
            </button>
            </div>
          )}
        </div>
      </div>

      {/* Class */}
      <div className="mt-5">
        <h3 className="text-lg font-bold text-[#18301D]">
          {classroom.name}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            {classroom.code}
          </span>

          {classroom.status === 'ARCHIVED' && (
            <span className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">
              Đã vô hiệu
            </span>
          )}
        </div>
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
        Vào lớp học
      </button>
    </article>
  )
}

export default ClassCard