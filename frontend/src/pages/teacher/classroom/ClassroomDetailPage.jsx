import { Outlet, useParams } from 'react-router-dom'

import DashboardLayout from '../../../layouts/DashboardLayout'
import ClassDetailHeader from '../../../components/classroom/detail/ClassDetailHeader'
import ClassDetailSidebar from '../../../components/classroom/detail/ClassDetailSidebar'
import useTeacherClassDetail from './hooks/useTeacherClassDetail'

function ClassDetailPage() {
  const { classId } = useParams()

  const { classroom, studentCount, loading, error, handleActivate, activating } = useTeacherClassDetail(classId)

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-green-100 bg-white text-sm text-gray-400">
          Đang tải thông tin lớp học...
        </div>
      ) : error ? (
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-red-100 bg-white text-sm text-red-500">
          {error}
        </div>
      ) : (
        <>
          <ClassDetailHeader
            classroom={classroom}
            studentCount={studentCount}
          />

          <div className="mt-6 flex flex-col gap-6 lg:flex-row">
            <ClassDetailSidebar studentCount={studentCount} />

            <main className="min-w-0 flex-1">
              <Outlet
                context={{
                  classroom,
                  activating,
                  onActivate: handleActivate,
                }}
              />
            </main>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

export default ClassDetailPage
