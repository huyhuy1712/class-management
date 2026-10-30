import FrogLoading from '../../utils/FrogLoading'
import useResourceQuery from '../../query/useResourceQuery'
import useTeacherExamCount from './hooks/useTeacherExamCount'
import {
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  Coins,
  FileText,
  Gem,
  RefreshCw,
  School,
  GraduationCap,
} from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import FeatureCard from '../../components/dashboard/FeatureCard'
import useAuthStore from '../../stores/authStore'
import { Link } from 'react-router-dom'

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
    title: 'Bài tập',
    description: 'Giao bài và theo dõi bài nộp của học sinh',
    icon: ClipboardCheck,
    path: '/teacher/homework',
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
  const billingQuery = useResourceQuery('billing')
  const classCount = classesQuery.data?.length ?? (classesQuery.isError ? '--' : '...')
  const studentCount = studentsQuery.data?.length ?? (studentsQuery.isError ? '--' : '...')
  const billing = billingQuery.data
  const pointBalance = billing?.pointsBalance
  const latestLedgerEntry = billing?.recentLedger?.[0]

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

      <div className="mt-6 grid items-start gap-6 sm:mt-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {/* Statistics */}
          <section>
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

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  {...feature}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm shadow-emerald-950/5">
          <div className="flex items-center justify-between border-b border-emerald-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Coins size={20} />
              </span>
              <div>
                <h2 className="font-bold text-slate-900">Point của bạn</h2>
                <p className="text-xs text-slate-500">Số dư tài khoản giáo viên</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => billingQuery.refetch()}
              disabled={billingQuery.isFetching}
              aria-label="Làm mới số dư Point"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-emerald-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={billingQuery.isFetching ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="p-5">
            {billingQuery.isLoading ? (
              <div className="flex min-h-28 items-center justify-center">
                <FrogLoading compact label="Đang tải số dư..." />
              </div>
            ) : billingQuery.errorMessage ? (
              <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                <p>{billingQuery.errorMessage}</p>
                <button type="button" onClick={() => billingQuery.refetch()} className="mt-2 font-semibold underline">
                  Thử tải lại
                </button>
              </div>
            ) : billing ? (
              <>
                <div className="rounded-xl bg-gradient-to-br from-amber-50 via-orange-50 to-white p-4">
                  <p className="text-sm font-medium text-amber-800">Tổng Point hiện có</p>
                  <p className="mt-2 flex items-center gap-2 text-3xl font-extrabold tracking-tight text-slate-900">
                    {new Intl.NumberFormat('vi-VN').format(pointBalance)}
                    <Coins size={22} className="text-amber-500" />
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <Gem size={16} className="text-violet-500" />
                    Gói VIP
                  </span>
                  <span className="text-right text-sm font-semibold text-slate-800">
                    {billing.vipTier || 'Chưa kích hoạt'}
                  </span>
                </div>

                <div className="py-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Giao dịch gần nhất</p>
                  {latestLedgerEntry ? (
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="truncate text-sm text-slate-600">
                        {latestLedgerEntry.reason.replaceAll('_', ' ')}
                      </span>
                      <span className={`shrink-0 text-sm font-bold ${latestLedgerEntry.entryType === 'CREDIT' ? 'text-emerald-700' : 'text-orange-700'}`}>
                        {latestLedgerEntry.entryType === 'CREDIT' ? '+' : '-'}
                        {new Intl.NumberFormat('vi-VN').format(latestLedgerEntry.points)}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">Chưa có giao dịch Point.</p>
                  )}
                </div>
              </>
            ) : null}

            <Link
              to="/teacher/billing"
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Quản lý Point và VIP
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </aside>
      </div>

    </DashboardLayout>
  )
}

export default TeacherDashboard
