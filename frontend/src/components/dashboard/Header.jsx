import { Menu } from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logos/logo.png'
import defaultAvatar from '../../assets/images/avatar_default.png'


function Header({ onMenuClick }) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  return (
    <header className="flex min-h-16 items-center justify-between gap-2 border-b border-green-100 bg-white px-3 py-2 sm:min-h-20 sm:gap-3 sm:px-8 sm:py-3">
      <button
        type="button"
        aria-label="Mở menu"
        onClick={onMenuClick}
        className="shrink-0 rounded-xl p-1.5 text-gray-600 transition hover:bg-green-50 hover:text-green-700 sm:p-2 lg:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-green-100 bg-green-50 p-1.5 shadow-sm shadow-green-900/5 sm:h-12 sm:w-12">
          <img src={logo} alt="FrogH" className="h-full w-full object-contain" />
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-lg font-extrabold text-[#18301D] sm:text-xl">
            FrogH
          </h1>
          <span className="hidden h-6 w-px bg-green-100 sm:block" />
          <span className="hidden text-xs font-semibold uppercase text-green-700 sm:block">
            Tôi tạo ra web này chỉ dành cho cô ấy mặc dù cô ấy đã có bồ mới và cần web này để dạy học nên tôi làm miễn phí cho cô ấy
          </span>
        </div>
      </div>

      {/* User */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-5">
        <button
          type="button"
          onClick={() => navigate('/teacher/profile')}
          className="group flex items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-green-50"
        >
          {/* avatar */}
      <img
        src={user?.avatar || defaultAvatar}
        alt="Avatar"
        className="h-12 w-12 rounded-xl object-cover"
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src = defaultAvatar
        }}
      />

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[#18301D]">
              {user?.fullName || user?.username}
            </p>
          </div>
      </button>
      </div>
    </header>
  )
}

export default Header