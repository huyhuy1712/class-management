import ClassroomOverviewCard from './ClassroomOverviewCard'

function ClassDetailHeader({ classroom, studentCount = 0 }) {
  return (
    <ClassroomOverviewCard
      classroom={classroom}
      studentCount={studentCount}
      backTo="/teacher/classes"
      backLabel="Quay lại danh sách lớp"
    />
  )
}

export default ClassDetailHeader