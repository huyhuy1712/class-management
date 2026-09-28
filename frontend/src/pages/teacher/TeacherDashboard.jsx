import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  ClipboardCheck,
  FileText,
  School,
  Users,
  CalendarDays,
  GraduationCap,
  Clock3,
  ArrowRight,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import FeatureCard from '../../components/dashboard/FeatureCard'

const features = [
  {
    title: 'Lớp học',
    description: 'Quản lý các lớp đang giảng dạy',
    icon: School,
    path: '/teacher/classes',
  },
  {
    title: 'Học sinh',
    description: 'Xem và quản lý học sinh trong lớp',
    icon: Users,
    path: '/teacher/students',
  },
  {
    title: 'Điểm danh',
    description: 'Theo dõi chuyên cần theo ngày',
    icon: ClipboardCheck,
    path: '/teacher/attendance',
  },
  {
    title: 'Bảng điểm',
    description: 'Quản lý kết quả học tập',
    icon: ChartNoAxesColumnIncreasing,
    path: '/teacher/grades',
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

const statistics = [
  {
    title: 'Lớp đang dạy',
    value: '6',
    icon: School,
  },
  {
    title: 'Tổng học sinh',
    value: '182',
    icon: GraduationCap,
  },
  {
    title: 'Đề thi',
    value: '12',
    icon: FileText,
  },
  {
    title: 'Buổi học tuần này',
    value: '8',
    icon: CalendarDays,
  },
]

function TeacherDashboard() {
  return (
    <DashboardLayout>
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#14532D] via-[#15803D] to-[#16A34A] px-8 py-8 text-white shadow-lg shadow-green-900/10">
        
        {/* decoration */}
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute right-32 top-12 h-32 w-32 rounded-full bg-lime-300/10" />

        <div className="relative z-10">
          <p className="text-sm font-medium text-green-100">
            Chủ nhật, 28 tháng 9
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Chào buổi chiều, Nguyễn Văn A 👋
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-green-100/80">
            Chúc bạn một ngày giảng dạy hiệu quả.
            Cùng quản lý lớp học và theo dõi tiến độ học tập của học sinh.
          </p>
        </div>
      </section>

      {/* Statistics */}
      <section className="mt-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statistics.map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.title}
                className="flex items-center gap-4 rounded-2xl border border-green-100 bg-white p-5 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
                  <Icon size={22} strokeWidth={1.8} />
                </div>

                <div>
                  <p className="text-2xl font-bold text-[#18301D]">
                    {item.value}
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
      <section className="mt-10">
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

      {/* Bottom section */}
      <section className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-3">
        
        {/* Recent activity */}
        <div className="xl:col-span-2 rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#18301D]">
                Hoạt động gần đây
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Những hoạt động mới nhất của bạn
              </p>
            </div>

            <button className="flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800">
              Xem tất cả
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-6 space-y-1">
            <ActivityItem
              icon={ClipboardCheck}
              title="Điểm danh lớp SE1840"
              description="Đã hoàn thành điểm danh 32 học sinh"
              time="10 phút trước"
            />

            <ActivityItem
              icon={FileText}
              title="Tạo đề kiểm tra mới"
              description="Kiểm tra 15 phút - Chương 2"
              time="2 giờ trước"
            />

            <ActivityItem
              icon={BookOpen}
              title="Đăng tài liệu mới"
              description="Bài giảng Java Spring Boot"
              time="Hôm qua"
            />
          </div>
        </div>

        {/* Upcoming */}
        <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-[#18301D]">
            Sắp tới
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Lịch giảng dạy gần nhất
          </p>

          <div className="mt-6 rounded-xl bg-green-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
              <Clock3 size={15} />
              14:00 - 15:30
            </div>

            <h3 className="mt-3 font-semibold text-gray-800">
              Lập trình Web
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Lớp SE1840
            </p>
          </div>

          <div className="mt-3 rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Clock3 size={15} />
              16:00 - 17:30
            </div>

            <h3 className="mt-3 font-semibold text-gray-800">
              Java Web
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Lớp SE1832
            </p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  )
}

function ActivityItem({
  icon: Icon,
  title,
  description,
  time,
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl p-3 transition hover:bg-green-50/60">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-700">
          {title}
        </p>

        <p className="mt-0.5 truncate text-sm text-gray-400">
          {description}
        </p>
      </div>

      <span className="whitespace-nowrap text-xs text-gray-400">
        {time}
      </span>
    </div>
  )
}

export default TeacherDashboard