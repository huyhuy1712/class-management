import FrogLoading from '../../utils/FrogLoading'
import useResourceQuery from '../../query/useResourceQuery'
import useTeacherExamCount from './hooks/useTeacherExamCount'
import {
  BookOpen,
  FileText,
  School,
  GraduationCap,
} from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import FeatureCard from '../../components/dashboard/FeatureCard'
import useAuthStore from '../../stores/authStore'

const features = [
  {
    title: 'Lớp học',
    description: 'Quản lý các lớp đang giảng dạy',
    icon: School,
    path: '/teacher/classes',
  },
  {
    title: 'Đề thi',
    description: 'Tạo và quản lý bài kiểm tra',
    icon: FileText,
    path: '/teacher/exams',
  },
  {
    title: 'Tài liệu',
    description: 'Bài giảng, tài liệu và thông báo',
    icon: BookOpen,
    path: '/teacher/materials',
  },
]
function TeacherDashboard() {
  const user = useAuthStore((state) => state.user)
  const examCount = useTeacherExamCount()
  const classesQuery = useResourceQuery('teacherClasses')
  const studentsQuery = useResourceQuery('teacherStudents')
  const classCount = classesQuery.data?.length ?? (classesQuery.isError ? '--' : '...')
  const studentCount = studentsQuery.data?.length ?? (studentsQuery.isError ? '--' : '...')

  const statistics = [
    { title: 'Lớp đang dạy', value: classCount, icon: School, color: 'border-emerald-100 bg-emerald-50', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
    { title: 'Tổng học sinh', value: studentCount, icon: GraduationCap, color: 'border-sky-100 bg-sky-50', iconColor: 'text-sky-600', valueColor: 'text-sky-700' },
    { title: 'Đề thi', value: examCount, icon: FileText, color: 'border-violet-100 bg-violet-50', iconColor: 'text-violet-600', valueColor: 'text-violet-700' },
  ]
    
    const today = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

    const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Chào buổi sáng'
    if (hour < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
    }

  return (
    <DashboardLayout>
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#14532D] via-[#15803D] to-[#16A34A] px-5 py-6 text-white shadow-lg shadow-green-900/10 sm:rounded-3xl sm:px-8 sm:py-8">
        
        {/* decoration */}
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute right-32 top-12 h-32 w-32 rounded-full bg-lime-300/10" />

        <div className="relative z-10">
         <p className="text-sm font-medium text-green-100 capitalize">
              {today}
        </p>

        <h1 className="mt-2 break-words text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          {getGreeting()}, {user?.fullName || user?.username} sama
        </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-green-100/80">
            Chúc bạn một ngày giảng dạy hiệu quả.
            Cùng quản lý lớp học và theo dõi tiến độ học tập của học sinh.
          </p>
        </div>
      </section>

      {/* Statistics */}
      <section className="mt-6 sm:mt-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {statistics.map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.title}
                className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm sm:gap-4 sm:p-5 ${item.color}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white sm:h-12 sm:w-12 ${item.iconColor}`}>
                  <Icon size={22} strokeWidth={1.8} />
                </div>

                <div>
                  <p className={`text-2xl font-bold ${item.valueColor}`}>
                    {item.value === '...' ? <FrogLoading compact label="" /> : item.value}
                  </p>

                  <p className="mt-0.5 text-sm text-gray-400">
                    {item.title}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Main functions */}
      <section className="mt-8 sm:mt-10">
        <div>
          <h2 className="text-xl font-bold text-[#18301D]">
            Quản lý giảng dạy
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Truy cập nhanh các chức năng thường dùng
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              {...feature}
            />
          ))}
        </div>
      </section>

    </DashboardLayout>
  )
}

export default TeacherDashboard
