import FieldLabel from './ui/FieldLabel'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-50'

function ExamSettingsSection({
  form,
  onChange,
}) {
  return (
<section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">      <div className="mb-6">
        <h2 className="font-bold text-[#18301D]">
          Thiết lập bài thi
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Thiết lập thời gian, số lần làm và
          thang điểm.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div>
          <FieldLabel>
            Thời gian làm bài
          </FieldLabel>

          <div className="relative">
            <input
              type="number"
              min="0"
              name="timeLimit"
              value={form.timeLimit}
              onChange={onChange}
              className={`${inputClass} pr-16`}
            />

            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              phút
            </span>
          </div>

          <p className="mt-1.5 text-xs text-slate-400">
            Nhập 0 nếu không giới hạn thời gian.
          </p>
        </div>

        <div>
          <FieldLabel>
            Số lần làm tối đa
          </FieldLabel>

          <input
            type="number"
            min="1"
            name="maxAttempts"
            value={form.maxAttempts}
            onChange={onChange}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel>
            Điểm tối đa
          </FieldLabel>

          <input
            type="number"
            min="0"
            step="0.5"
            name="maxScore"
            value={form.maxScore}
            onChange={onChange}
            className={inputClass}
          />
        </div>
      </div>
    </section>
  )
}

export default ExamSettingsSection