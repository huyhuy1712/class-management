import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Repeat2,
  Target,
  TrendingUp,
} from 'lucide-react'

const formatScore = (value) =>
  value == null ? '—' : Number(Number(value).toFixed(3))

function getSummaryCards(stats) {
  return [
    {
      label: 'Điểm trung bình',
      value: formatScore(stats.average),
      Icon: Target,
      tone: 'text-emerald-700 bg-emerald-50',
      note: 'Từ các lượt đã chấm',
    },
    {
      label: 'Điểm cao nhất',
      value: formatScore(stats.highest),
      Icon: ArrowUpRight,
      tone: 'text-sky-700 bg-sky-50',
      note: 'Kết quả tốt nhất của bạn',
    },
    {
      label: 'Điểm thấp nhất',
      value: formatScore(stats.lowest),
      Icon: ArrowDownRight,
      tone: 'text-rose-600 bg-rose-50',
      note: 'Theo bộ lọc đang chọn',
    },
    {
      label: 'Mốt',
      value: stats.gradedCount
        ? stats.modes?.length
          ? stats.modes.join(' · ')
          : 'Không có'
        : '—',
      Icon: Repeat2,
      tone: 'text-violet-700 bg-violet-50',
      note: 'Điểm xuất hiện nhiều nhất',
    },
  ]
}

function getProgressItems(stats) {
  return [
    {
      label: 'Lượt đã chấm',
      value: stats.gradedCount ?? '—',
      Icon: CheckCircle2,
    },
    {
      label: 'Đạt từ 5 điểm',
      value: stats.gradedCount
        ? `${Math.round(Number(stats.passRate))}%`
        : '—',
      Icon: TrendingUp,
    },
    {
      label: 'Chờ chấm tự luận',
      value: stats.pendingGradingCount ?? '—',
      Icon: Clock3,
    },
  ]
}

export default function GradeSummary({ stats }) {
  const cards = getSummaryCards(stats)
  const progressItems = getProgressItems(stats)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, Icon, tone, note }) => (
          <section
            key={label}
            className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <span className={`rounded-xl p-2.5 ${tone}`}>
                <Icon size={20} />
              </span>
            </div>
            <p className="mt-4 break-words text-3xl font-extrabold tracking-tight text-[#18301D]">
              {value}
              {typeof value === 'number' && (
                <span className="ml-1 text-sm font-normal text-slate-400">
                  /10
                </span>
              )}
            </p>
            <p className="mt-2 text-xs text-slate-400">{note}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:grid-cols-3">
        {progressItems.map(({ label, value, Icon }) => (
          <div key={label} className="flex items-center gap-3 p-2">
            <Icon size={21} className="text-emerald-600" />
            <span className="text-sm text-slate-500">{label}</span>
            <strong className="ml-auto text-lg text-emerald-800">
              {value}
            </strong>
          </div>
        ))}
      </div>
    </>
  )
}
