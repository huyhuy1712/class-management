import { Search } from 'lucide-react'
import { sortByText } from '../../../../utils/sortByText'

export default function StudentExamFilters({ filters, onChange, classes, classesLoading, classesError, onRetryClasses }) {
  const inputStyle = 'min-w-0 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50'
  return <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-white p-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">
    <label className="relative"><Search size={19} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" /><input aria-label="Tìm đề thi" value={filters.search} onChange={(event) => onChange('search', event.target.value)} placeholder="Tìm theo tên hoặc mã đề thi..." className={`${inputStyle} pl-10`} /></label>
    <select aria-label="Lọc theo lớp" disabled={classesLoading || Boolean(classesError)} value={filters.classId} onChange={(event) => onChange('classId', event.target.value)} className={inputStyle}><option value="">{classesLoading ? 'Đang tải lớp học...' : 'Tất cả lớp học'}</option>{sortByText(classes, (item) => item.name).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <label><span className="sr-only">Ngày giao đề</span><input type="date" value={filters.date} onChange={(event) => onChange('date', event.target.value)} className={inputStyle} /></label>
    <select aria-label="Sắp xếp đề thi" value={filters.order} onChange={(event) => onChange('order', event.target.value)} className={inputStyle}><option value="NEWEST">Mới nhất</option><option value="OLDEST">Cũ nhất</option></select>
    {filters.date && <button type="button" onClick={() => onChange('date', '')} className="text-left text-sm text-emerald-700">Bỏ lọc ngày</button>}
    {classesError && <p role="alert" className="text-sm text-red-600 lg:col-span-4">{classesError} <button type="button" onClick={onRetryClasses} className="underline">Thử lại</button></p>}
  </div>
}
