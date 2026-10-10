import { Clock3, School } from 'lucide-react'

export default function StudentClassStats({ joinedCount, loading, error }) {
  const cards = [
    { label: 'Lớp đã tham gia', value: loading ? '...' : error ? '--' : joinedCount, Icon: School },
    { label: 'Lớp đang chờ duyệt', value: '--', Icon: Clock3, note: 'Chưa có dữ liệu' },
  ]

  return (
    <section aria-label="Thống kê lớp học" className="mb-7 grid gap-4 sm:grid-cols-2">
      {cards.map(({ label, value, Icon, note }) => (
        <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-[#18301D]">{value}</p>
            {note && <p className="mt-1 text-xs text-gray-400">{note}</p>}
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Icon size={22} />
          </div>
        </div>
      ))}
    </section>
  )
}
