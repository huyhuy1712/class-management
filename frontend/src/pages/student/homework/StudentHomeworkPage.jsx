import StudentDashboardLayout from '../../../layouts/StudentDashboardLayout'
import StudentHomeworkList from './StudentHomeworkList'

export default function StudentHomeworkPage() {
  return <StudentDashboardLayout><main className="px-4 py-6 sm:px-8"><StudentHomeworkList heading="h1" /></main></StudentDashboardLayout>
}
