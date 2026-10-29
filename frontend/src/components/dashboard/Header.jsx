import { Menu } from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logos/logo.png'
import defaultAvatar from '../../assets/images/avatar_default.png'
import NotificationBell from '../dashboard/NotificationBell'
import StudentNotificationBell from './StudentNotificationBell'
import useProfileSync from '../../pages/profile/hooks/useProfileSync'
import useRoutePrefetch from '../../query/useRoutePrefetch'


function Header({ onMenuClick }) {
  useProfileSync()
  const prefetch = useRoutePrefetch()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b border-green-100 bg-white px-3 sm:gap-3 sm:px-6">
      <button
        type="button"
        aria-label="Mở menu"
        onClick={onMenuClick}
        className="shrink-0 rounded-xl p-1.5 text-gray-600 transition hover:bg-green-50 hover:text-green-700 sm:p-2 lg:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden sm:gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-green-100 bg-green-50 p-1 shadow-sm shadow-green-900/5">
          <img src={logo} alt="FrogH" className="h-full w-full object-contain" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
          <h1 className="shrink-0 text-lg font-extrabold text-[#18301D]">
            FrogH
          </h1>
          <span className="hidden h-5 w-px shrink-0 bg-green-100 sm:block" />
          <span className="hidden min-w-0 flex-1 truncate text-xs font-semibold uppercase text-green-700 sm:block">
            Tôi tạo ra web này chỉ dành cho cô ấy mặc dù cô ấy đã có bồ mới và cần web này để dạy học nên tôi làm miễn phí cho cô ấy
          </span>
        </div>
      </div>

{/* Notification + User */}
<div className="flex shrink-0 items-center gap-2 sm:gap-3">
  {/* Notification */}
        {user?.role === 'STUDENT' ? <StudentNotificationBell /> : <NotificationBell />}

  {/* User profile */}
  <button
    type="button"
    onClick={() => navigate(user?.role === 'STUDENT' ? '/student/profile' : '/teacher/profile')}
    onMouseEnter={() => prefetch(user?.role === 'STUDENT' ? '/student/profile' : '/teacher/profile')}
    onFocus={() => prefetch(user?.role === 'STUDENT' ? '/student/profile' : '/teacher/profile')}
    className="group flex items-center gap-2 rounded-xl px-1.5 py-1 text-left transition hover:bg-green-50 sm:px-2"
  >
    <img
      src={user?.avatar || defaultAvatar}
      alt="Avatar"
      className="h-9 w-9 shrink-0 rounded-xl object-cover"
      onError={(e) => {
        e.currentTarget.onerror = null
        e.currentTarget.src = defaultAvatar
      }}
    />

    <div className="hidden sm:block">
      <p className="max-w-[160px] truncate text-sm font-semibold text-[#18301D]">
        {user?.fullName || user?.username}
      </p>
      {(user?.role === 'TEACHER' || user?.role === 'STUDENT') && (
        <p className="text-xs font-medium text-green-700">
          {user.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
        </p>
      )}
    </div>
  </button>
</div>
    </header>
  )
}

export default Header
