import { Search } from 'lucide-react'
import { gradeInputStyle } from '../helpers/gradeUi'

export default function GradeHistoryFilters({ filters, onChange }) {
  return (
    <div className="my-5 flex flex-col gap-3 sm:flex-row">
      <label className="relative flex-1">
        <span className="sr-only">Tìm bài kiểm tra</span>
        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 text-slate-400"
        />
        <input
          aria-label="Tìm bài kiểm tra"
          value={filters.search}
          onChange={(event) => onChange('search', event.target.value)}
          placeholder="Tìm tên hoặc mã đề..."
          className={`${gradeInputStyle} w-full pl-10`}
        />
      </label>

      <label>
        <span className="sr-only">Lọc trạng thái lịch sử</span>
        <select
          aria-label="Trạng thái lịch sử"
          value={filters.status}
          onChange={(event) => onChange('status', event.target.value)}
          className={gradeInputStyle}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="GRADED">Đã chấm</option>
          <option value="SUBMITTED">Chờ chấm</option>
        </select>
      </label>

      <label>
        <span className="sr-only">Sắp xếp lịch sử</span>
        <select
          aria-label="Sắp xếp lịch sử"
          value={filters.order}
          onChange={(event) => onChange('order', event.target.value)}
          className={gradeInputStyle}
        >
          <option value="newest">Mới nhất</option>
          <option value="score">Điểm cao nhất</option>
        </select>
      </label>
    </div>
  )
}
