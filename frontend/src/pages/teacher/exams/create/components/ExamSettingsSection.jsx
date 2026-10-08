import FieldLabel from './ui/FieldLabel'

const inputClass =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:ring-2'
const fieldClass = (error) =>
  `${inputClass} ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-slate-200 focus:border-green-400 focus:ring-green-50'}`

const fields = [
  { name: 'timeLimit', label: 'Thời gian làm bài (phút)', min: 1 },
  { name: 'maxAttempts', label: 'Số lần làm tối đa', min: 0, hint: 'Nhập 0 để không giới hạn số lần làm.' },
]

function ExamSettingsSection({ form, errors = {}, onChange }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
      <div className="mb-4">
        <h2 className="font-bold text-[#18301D]">Thiết lập bài thi</h2>
        <p className="mt-1 text-sm text-slate-400">Thiết lập thời gian và số lần làm. Tổng điểm được tính từ nội dung đề thi.</p>
      </div>

      <div className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(({ name, label, min, hint }) => (
          <div key={name}>
            <FieldLabel required>{label}</FieldLabel>
            <input
              type="number"
              min={min}
              step={1}
              name={name}
              value={form[name]}
              onChange={onChange}
              aria-invalid={Boolean(errors[name])}
              aria-describedby={errors[name] || hint ? `${name}-message` : undefined}
              className={fieldClass(errors[name])}
            />
            {(errors[name] || hint) && (
              <p id={`${name}-message`} className={`mt-1.5 text-xs ${errors[name] ? 'font-medium text-red-500' : 'text-slate-400'}`}>
                {errors[name] || hint}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default ExamSettingsSection
