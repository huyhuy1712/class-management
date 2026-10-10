import { Search } from 'lucide-react'

export default function StudentClassSearch({ value, onChange }) {
  return (
    <div className="relative mb-6">
      <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        aria-label="Tìm kiếm lớp học"
        placeholder="Tìm kiếm theo tên hoặc mã lớp..."
        className="w-full rounded-xl border border-emerald-100 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  )
}
