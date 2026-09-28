import {
  House,
  School,
  Users,
  ClipboardCheck,
  ChartNoAxesColumnIncreasing,
  FileText,
  BookOpen,
  Settings,
  Leaf,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const menuItems = [
  { label: 'Trang chủ', icon: House, path: '/teacher', end: true },
  { label: 'Lớp học', icon: School, path: '/teacher/classes' },
  { label: 'Học sinh', icon: Users, path: '/teacher/students' },
  { label: 'Điểm danh', icon: ClipboardCheck, path: '/teacher/attendance' },
  { label: 'Bảng điểm', icon: ChartNoAxesColumnIncreasing, path: '/teacher/grades' },
  { label: 'Đề thi', icon: FileText, path: '/teacher/exams' },
  { label: 'Tài liệu', icon: BookOpen, path: '/teacher/materials' },
]

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-[#123524] text-white shadow-xl">
      
      {/* Logo */}
      <div className="flex h-24 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#84CC16] shadow-lg shadow-black/10">
          <Leaf size={25} strokeWidth={2} className="text-[#123524]" />
        </div>

        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">
            Class Management
          </h1>
          <p className="mt-1 text-xs text-green-200/70">
            Education System
          </p>
        </div>
      </div>

      {/* Menu title */}
      <div className="px-5 pb-2 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-green-200/50">
          Quản lý
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#DCFCE7] text-[#14532D] shadow-sm'
                    : 'text-green-50/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 p-3">
        <NavLink
          to="/teacher/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              isActive
                ? 'bg-[#DCFCE7] text-[#14532D]'
                : 'text-green-50/75 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <Settings size={20} strokeWidth={1.8} />
          <span>Cài đặt</span>
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar