import {
  ChevronDown,
  Search,
} from 'lucide-react'

function Header() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-green-100 bg-white px-8">
      {/* Search */}
      <div className="relative w-80">
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
      <div className="flex items-center gap-5">
        <button className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-gray-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 font-bold text-green-700">
            GV
          </div>

          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800">
              Nguyễn Văn A
            </p>

            <p className="text-xs text-gray-400">
              Giáo viên
            </p>
          </div>

          <ChevronDown size={16} className="text-gray-400" />
        </button>
      </div>
    </header>
  )
}

export default Header