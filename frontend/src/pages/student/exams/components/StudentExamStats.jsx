import { CheckCircle2, Clock3, FileText } from 'lucide-react'

const metrics = [
  { key: 'DONE', label: 'Số bài đã làm', Icon: CheckCircle2, card: 'border-emerald-100 bg-emerald-50/60', tone: 'text-emerald-600 bg-white', value: 'text-emerald-700' },
  { key: 'TODO', label: 'Số bài chưa làm', Icon: FileText, card: 'border-sky-100 bg-sky-50/60', tone: 'text-sky-600 bg-white', value: 'text-sky-700' },
  { key: 'PENDING', label: 'Số bài chờ chấm', Icon: Clock3, card: 'border-amber-100 bg-amber-50/60', tone: 'text-amber-600 bg-white', value: 'text-amber-700' },
]

export default function StudentExamStats({ counts, unavailable }) {
  return <div className="grid gap-4 md:grid-cols-3">{metrics.map(({ key, label, Icon, tone, card, value }) =>
    <div key={key} className={`flex items-center justify-between rounded-2xl border p-6 shadow-sm ${card}`}>
      <div><p className="text-sm text-slate-500">{label}</p><p className={`mt-3 text-3xl font-bold ${value}`}>{unavailable ? '—' : counts[key]}</p></div>
      <span className={`rounded-2xl p-3 ${tone}`}><Icon size={25} /></span>
    </div>)}</div>
}
