import ClassroomOverviewCard from '../../../../components/classroom/detail/ClassroomOverviewCard'

export default function StudentClassInfo({ classroom, studentCount }) {
  return (
    <ClassroomOverviewCard
      classroom={classroom}
      studentCount={studentCount ?? 'Không thể tải'}
      backTo="/student/classes"
      backLabel="Quay lại danh sách lớp"
    />
  )
}
