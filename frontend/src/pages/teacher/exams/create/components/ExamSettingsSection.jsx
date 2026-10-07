import FieldLabel from './ui/FieldLabel'

const inputClass =
  'w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:ring-4'
const fieldClass = (error) =>
  `${inputClass} ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-slate-200 focus:border-green-400 focus:ring-green-50'}`

function ExamSettingsSection({ form, errors = {}, onChange }) {
  const fields = [
    { name: 'timeLimit', label: 'Thời gian làm bài', min: 1, suffix: 'phút' },
    { name: 'maxAttempts', label: 'Số lần làm tối đa', min: 0 },
    { name: 'maxScore', label: 'Điểm tối đa', min: 1, step: '0.5' },
  ]

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
      <div className="mb-6">
        <h2 className="font-bold text-[#18301D]">Thiết lập bài thi</h2>
        <p className="mt-1 text-sm text-slate-400">Thiết lập thời gian, số lần làm và thang điểm.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {fields.map(({ name, label, min, step, suffix }) => (
          <div key={name}>
            <FieldLabel required>{label}</FieldLabel>
            <div className="relative">
              <input
                type="number"
                min={min}
                step={step}
                name={name}
                value={form[name]}
                onChange={onChange}
                className={`${fieldClass(errors[name])} ${suffix ? 'pr-16' : ''}`}
              />
              {suffix && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  {suffix}
                </span>
              )}
            </div>
            {name === 'maxAttempts' && !errors[name] && (
              <p className="mt-1.5 text-xs text-slate-400">Nhập 0 để không giới hạn số lần làm.</p>
            )}
            {errors[name] && (
              <p className="mt-1.5 text-xs font-medium text-red-500">{errors[name]}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default ExamSettingsSection
