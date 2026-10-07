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
        {classes.map((classroom) => {
          const checked =
            selectedClasses.includes(
              classroom.id,
            )

          return (
            <button
              key={classroom.id}
              type="button"
              onClick={() =>
                onToggle(classroom.id)
              }
              className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition ${
                checked
                  ? 'border-green-300 bg-green-50'
                  : 'border-slate-200 bg-white hover:border-green-200 hover:bg-green-50/30'
              }`}
            >
              <Checkbox checked={checked} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-700">
                  {classroom.name}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {classroom.code} ·{' '}
                  {classroom.studentCount}{' '}
                  học sinh
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ClassSelector