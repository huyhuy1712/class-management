import { sortByText } from '../../../../../utils/sortByText'
import Checkbox from './ui/Checkbox'
import SearchBox from './ui/SearchBox'

function ClassSelector({
  classes,
  selectedClasses,
  search,
  onSearchChange,
  onToggle,
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-100 bg-slate-50/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[#18301D]">
              Chọn lớp được làm bài
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Đã chọn {selectedClasses.length} lớp
            </p>
          </div>

          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder="Tìm kiếm lớp..."
          />
        </div>
      </div>

      <div className="grid max-h-[360px] grid-cols-1 gap-3 overflow-y-auto p-4 lg:grid-cols-2">
        {sortByText(classes, (item) => item.name).map((classroom) => {
          const checked = selectedClasses.includes(classroom.id)
          const active = classroom.status === 'ACTIVE'

          return (
            <button
              key={classroom.id}
              type="button"
              onClick={() =>
                onToggle(classroom.id)
              }
              className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition ${
                active
                  ? checked
                    ? 'border-green-400 bg-green-50'
                    : 'border-green-200 bg-white hover:bg-green-50/40'
                  : checked
                    ? 'border-red-400 bg-red-50'
                    : 'border-red-200 bg-white hover:bg-red-50/40'
              }`}
            >
              <Checkbox checked={checked} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-700">
                  {classroom.name}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{classroom.code} · {classroom.studentCount ?? 0} học sinh</span>
                  <span className={`inline-flex items-center gap-1 font-medium ${active ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
                    {active ? 'Đang hoạt động' : 'Đã vô hiệu'}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ClassSelector