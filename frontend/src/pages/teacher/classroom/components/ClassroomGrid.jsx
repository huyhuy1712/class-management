import { School } from 'lucide-react'

import ClassroomCard from './ClassroomCard'

function ClassroomGrid({
  loading,
  error,
  classrooms,
  onView,
  onEdit,
  onArchive,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="mt-4 flex min-h-80 items-center justify-center rounded-2xl border border-green-100 bg-white text-sm text-gray-400">
        Đang tải danh sách lớp học...
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-4 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-6 text-center">
        <h3 className="font-semibold text-red-600">{error}</h3>
        <p className="mt-1 text-sm text-gray-400">Vui lòng thử lại sau.</p>
      </div>
    )
  }

  if (classrooms.length === 0) {
    return (
      <div className="mt-4 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-green-200 bg-white">
        <School size={42} className="text-green-200" />
        <h3 className="mt-4 font-semibold text-gray-700">
          Không tìm thấy lớp học
        </h3>
        <p className="mt-1 text-sm text-gray-400">
          Thử thay đổi từ khóa tìm kiếm.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {classrooms.map((classroom) => (
        <ClassroomCard
          key={classroom.id}
          classroom={classroom}
          onView={onView}
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export default ClassroomGrid
