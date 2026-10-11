import { Clock3, School } from 'lucide-react'

export default function StudentClassStats({ joinedCount, pendingCount, pendingError, loading, error }) {
  const cards = [
    { label: 'Lớp đã tham gia', value: loading ? '...' : error ? '--' : joinedCount, Icon: School, card: 'border-emerald-100 bg-emerald-50/60', icon: 'bg-white text-emerald-600', countColor: 'text-emerald-700' },
    { label: 'Lớp đang chờ duyệt', value: loading ? '...' : pendingError ? '--' : pendingCount, Icon: Clock3, card: 'border-amber-100 bg-amber-50/60', icon: 'bg-white text-amber-600', countColor: 'text-amber-700', note: !loading && pendingError ? 'Không thể tải số lớp chờ duyệt' : null },
  ]

  return (
    <section aria-label="Thống kê lớp học" className="mb-7 grid gap-4 sm:grid-cols-2">
      {cards.map(({ label, value, Icon, note, card, icon, countColor }) => (
        <div key={label} className={`flex items-center justify-between gap-4 rounded-2xl border p-5 shadow-sm ${card}`}>
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className={`mt-2 text-3xl font-bold ${countColor}`}>{value}</p>
            {note && <p className="mt-1 text-xs text-gray-400">{note}</p>}
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${icon}`}>
            <Icon size={22} />
          </div>
        </div>
      ))}
    </section>
  )
}
