import useResourceQuery from '../../../query/useResourceQuery'

export default function useStudentClassList(teacherSearch) {
  const joined = useResourceQuery('studentClasses')
  const available = useResourceQuery('allClasses', [], { enabled: teacherSearch })
  const dashboard = useResourceQuery('dashboard')
  const list = teacherSearch ? available : joined
  return {
    classes: list.data ?? [],
    joinedClassIds: (joined.data ?? []).map((item) => String(item.id)),
    pendingCount: dashboard.data?.pendingJoinClassCount ?? null,
    pendingError: dashboard.isError || (!dashboard.isLoading && dashboard.data?.pendingJoinClassCount == null),
    classesError: list.errorMessage ? 'Không thể tải danh sách lớp học.' : '',
    dashboardError: joined.errorMessage ? 'Không thể tải các lớp bạn đã tham gia.' : '',
    loading: list.isLoading || joined.isLoading,
  }
}
