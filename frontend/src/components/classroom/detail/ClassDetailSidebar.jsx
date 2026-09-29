import {
  Bell,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Users,
} from 'lucide-react'
import { NavLink, useParams } from 'react-router-dom'

function ClassDetailSidebar() {
  const { classId } = useParams()

  const menuItems = [
    {
      label: 'Học sinh',
      icon: Users,
      to: `/teacher/classes/${classId}`,
      end: true,
    },
    {
      label: 'Bài tập & Đề thi',
      icon: FileText,
      to: `/teacher/classes/${classId}/assignments`,
    },
    {
      label: 'Bảng tin',
      icon: Bell,
      to: `/teacher/classes/${classId}/announcements`,
    },
    {
      label: 'Bảng điểm',
      icon: GraduationCap,
      to: `/teacher/classes/${classId}/grades`,
    },
    {
      label: 'Điểm danh',
      icon: ClipboardCheck,
      to: `/teacher/classes/${classId}/attendance`,
    },
  ]

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-2xl border border-green-100 bg-white p-3 shadow-sm">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-[#18301D]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      <Icon size={18} />
                    </div>

                    {item.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default ClassDetailSidebar