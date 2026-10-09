import { Archive, CheckCircle2, School } from 'lucide-react'

function ClassroomStats({ total, active, archived }) {
  const stats = [
    { label: 'Tổng số lớp', value: total, icon: School, tone: 'emerald' },
    { label: 'Đang hoạt động', value: active, icon: CheckCircle2, tone: 'emerald' },
    { label: 'Đã vô hiệu', value: archived, icon: Archive, tone: 'rose' },
  ]

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className={`flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm shadow-emerald-950/5 ${
            tone === 'rose' ? 'border-rose-100' : 'border-emerald-100'
          }`}
        >
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p
              className={`mt-2 text-3xl font-bold ${
                tone === 'rose' ? 'text-rose-600' : 'text-[#18301D]'
              }`}
            >
              {value}
            </p>
          </div>
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              tone === 'rose'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            <Icon size={21} />
          </span>
        </div>
      ))}
    </div>
  )
}

export default ClassroomStats
