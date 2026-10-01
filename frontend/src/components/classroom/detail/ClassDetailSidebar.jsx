import {
  Bell,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Users,
} from 'lucide-react'
import { NavLink, useLocation, useParams } from 'react-router-dom'

function ClassDetailSidebar({ studentCount = 0 }) {
  const { classId } = useParams()
  const { pathname } = useLocation()

  const isItemActive = (item, routeIsActive) => {
    if (!item.showCount) return routeIsActive

    return (
      pathname === item.to ||
      pathname.startsWith(`${item.to}/students/`)
    )
  }

  const menuItems = [
    {
      label: 'Học sinh',
      icon: Users,
      to: `/teacher/classes/${classId}`,
      end: true,
      showCount: true,
    },
    {
      label: 'Đề thi',
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
                    isItemActive(item, isActive)
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-[#18301D]'
                  }`
                }
              >
                {({ isActive }) => {
                  const active = isItemActive(item, isActive)

                  return (
                    <>
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-50 text-gray-400'
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span>{item.label}</span>

                        {item.showCount && (
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-green-700 shadow-sm">
                            {studentCount}
                          </span>
                        )}
                      </span>
                    </>
                  )
                }}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default ClassDetailSidebar