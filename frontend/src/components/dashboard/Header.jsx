import {
  ChevronDown,
  Menu,
  Search,
} from 'lucide-react'
import useAuthStore from '../../stores/authStore'

function Header({ onMenuClick }) {
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
        <button className="flex items-center gap-2 rounded-xl px-0 py-1.5 transition hover:bg-gray-50 sm:gap-3 sm:px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-sm font-bold text-green-700 sm:h-10 sm:w-10">
            GV
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-gray-800">
              {user?.fullName || user?.username || 'Người dùng'}
            </p>

            <p className="text-xs text-gray-400">
              {user?.role === 'TEACHER' ? 'Giáo viên' : user?.role || ''}
            </p>
          </div>

          <ChevronDown size={16} className="hidden text-gray-400 sm:block" />
        </button>
      </div>
    </header>
  )
}

export default Header