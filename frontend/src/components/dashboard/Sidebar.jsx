import {
  House,
  School,
  Users,
  ClipboardCheck,
  ChartNoAxesColumnIncreasing,
  FileText,
  BookOpen,
  LogOut 
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'
import { logout as logoutRequest } from '../../services/authService'
import logo from '../../assets/logos/logo.png'

const menuItems = [
  { label: 'Trang chủ', icon: House, path: '/teacher', end: true },
  { label: 'Lớp học', icon: School, path: '/teacher/classes' },
  { label: 'Học sinh', icon: Users, path: '/teacher/students' },
  { label: 'Bảng điểm', icon: ChartNoAxesColumnIncreasing, path: '/teacher/grades' },
  { label: 'Đề thi', icon: FileText, path: '/teacher/exams' },
  { label: 'Tài liệu', icon: BookOpen, path: '/teacher/materials' },
]

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    logoutRequest()
      .catch((error) => console.error('Logout error:', error))
      .finally(() => {
        logout()
        setShowLogoutModal(false)
        onClose?.()
        navigate('/login', { replace: true })
      })
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng menu"
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden ${
          isOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-72 max-w-[calc(100vw-3rem)] flex-col bg-[#123524] text-white shadow-xl transition-transform duration-300 lg:w-64 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      
      {/* Logo */}
      <Link to="/teacher" onClick={onClose} aria-label="Về trang chủ" className="flex h-24 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-black/10">
          <img src={logo} alt="Class Management" className="h-14 w-14 object-contain" />
        </div>

        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">
            FrogH
          </h1>
          <p className="mt-1 text-xs text-green-200/70">
            Education System
          </p>
        </div>
      </Link>

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
              onClick={onClose}
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
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-green-50/75 transition-all hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={20} strokeWidth={1.8} />
              <span>Đăng xuất</span>
            </button>
        </div>
      </aside>

      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <LogOut size={22} className="text-red-500" />
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold text-[#18301D]">
                Xác nhận đăng xuất
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại?
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                <LogOut size={17} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar