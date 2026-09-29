import {
  ChevronDown,
  Menu,
  Search,
} from 'lucide-react'

function Header({ onMenuClick }) {
  return (
    <header className="flex min-h-20 items-center justify-between gap-3 border-b border-green-100 bg-white px-4 py-3 sm:px-8">
      <button
        type="button"
        aria-label="Mở menu"
        onClick={onMenuClick}
        className="shrink-0 rounded-xl p-2 text-gray-600 transition hover:bg-green-50 hover:text-green-700 lg:hidden"
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
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100"
        />
      </div>

      {/* User */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-5">
        <button className="flex items-center gap-2 rounded-xl px-1 py-1.5 transition hover:bg-gray-50 sm:gap-3 sm:px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 font-bold text-green-700">
            GV
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-gray-800">
              Nguyễn Văn A
            </p>

            <p className="text-xs text-gray-400">
              Giáo viên
            </p>
          </div>

          <ChevronDown size={16} className="hidden text-gray-400 sm:block" />
        </button>
      </div>
    </header>
  )
}

export default Header