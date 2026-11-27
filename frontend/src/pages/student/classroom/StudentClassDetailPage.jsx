import FrogLoading from '../../../utils/FrogLoading'
import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import StudentDashboardLayout from '../../../layouts/StudentDashboardLayout'
import useStudentClassDetail from './hooks/useStudentClassDetail'
import StudentClassInfo from './components/StudentClassInfo'
import StudentClassTabs from './components/StudentClassTabs'

export default function StudentClassDetailPage() {
  const { classId } = useParams()
  const location = useLocation()
  const detail = useStudentClassDetail(classId)
  const [tab, setTab] = useState(() => (
    ['announcements', 'attendance', 'grades'].includes(location.state?.tab)
      ? location.state.tab
      : 'students'
  ))
  return (
    <StudentDashboardLayout>
      <main className="p-4 sm:p-8">
        {detail.loading ? <FrogLoading label="Đang tải lớp học..." className="text-sm text-slate-500" /> : detail.error ? <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-600">{detail.error}</p> : (
          <div className="flex flex-col gap-5 sm:gap-6">
            <StudentClassInfo classroom={detail.classroom} studentCount={detail.studentCount} />
            <StudentClassTabs selected={tab} onSelect={setTab} classId={classId} />
          </div>
        )}
      </main>
    </StudentDashboardLayout>
  )
}
