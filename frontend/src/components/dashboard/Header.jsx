import {
  Menu,
  Search,
} from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'


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

      {/* Search */}
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100 sm:py-2.5 sm:pl-11 sm:pr-4"
        />
      </div>

      {/* User */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-5">
        <button
          type="button"
          onClick={() => navigate('/teacher/profile')}
          className="group flex items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-green-50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 font-bold text-green-700 transition group-hover:bg-green-200">
            {user?.fullName
              ?.trim()
              .split(/\s+/)
              .slice(-2)
              .map((item) => item[0])
              .join('')
              .toUpperCase() || 'GV'}
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[#18301D]">
              {user?.fullName || user?.username}
            </p>

            <p className="mt-0.5 text-xs text-gray-400">
              Giáo viên
            </p>
          </div>
      </button>
      </div>
    </header>
  )
}

export default Header