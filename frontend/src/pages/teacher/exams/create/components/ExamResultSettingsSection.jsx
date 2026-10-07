import { Eye, EyeOff } from 'lucide-react'

const RadioOption = ({ name, value, checked, onChange, label }) => (
  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 cursor-pointer accent-emerald-600"
    />
    {label}
  </label>
)

function ExamResultSettingsSection({ form, onChange }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Eye size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Điểm và đáp án khi làm xong</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Thiết lập nội dung học sinh được xem sau khi hoàn thành bài thi.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-800">Cho xem điểm</p>
            <p className="mt-1 text-xs text-slate-400">Thời điểm học sinh được xem điểm.</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <RadioOption name="scoreVisibility" value="NEVER" checked={form.scoreVisibility === 'NEVER'} onChange={onChange} label="Không" />
            <RadioOption name="scoreVisibility" value="AFTER_SUBMIT" checked={form.scoreVisibility === 'AFTER_SUBMIT'} onChange={onChange} label="Khi làm bài xong" />
            <RadioOption name="scoreVisibility" value="AFTER_EXAM" checked={form.scoreVisibility === 'AFTER_EXAM'} onChange={onChange} label="Khi tất cả thi xong" />
          </div>
        </div>

        <div className="border-t border-slate-100" />

        <div className="grid gap-4 lg:grid-cols-[260px_1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-800">Cho xem đề thi và đáp án</p>
            <p className="mt-1 text-xs text-slate-400">Thời điểm công khai đề thi và đáp án.</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <RadioOption name="answerVisibility" value="NEVER" checked={form.answerVisibility === 'NEVER'} onChange={onChange} label="Không" />
            <RadioOption name="answerVisibility" value="AFTER_SUBMIT" checked={form.answerVisibility === 'AFTER_SUBMIT'} onChange={onChange} label="Khi làm bài xong" />
            <RadioOption name="answerVisibility" value="AFTER_EXAM" checked={form.answerVisibility === 'AFTER_EXAM'} onChange={onChange} label="Khi tất cả thi xong" />
            <RadioOption name="answerVisibility" value="AFTER_SCORE" checked={form.answerVisibility === 'AFTER_SCORE'} onChange={onChange} label="Khi đạt đến số điểm nhất định" />
          </div>
        </div>

        <div className="border-t border-slate-100" />

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div>
            <p className="text-sm font-semibold text-slate-800">Ẩn đáp án cho câu trả lời sai</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Không hiển thị đáp án đúng khi học sinh trả lời sai.
            </p>
          </div>

          <div>
            <label className="inline-flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="hideWrongAnswers"
                checked={form.hideWrongAnswers}
                onChange={onChange}
                className="peer sr-only"
              />
              <span className="relative h-7 w-12 rounded-full bg-slate-200 transition peer-checked:bg-emerald-600">
                <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
              </span>
              <span className="text-sm font-medium text-slate-600">
                {form.hideWrongAnswers ? 'Đang bật' : 'Đang tắt'}
              </span>
            </label>
          </div>
        </div>

        {form.hideWrongAnswers && (
          <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
            <EyeOff size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <p className="text-sm leading-6 text-emerald-800">
              Câu trả lời sai chỉ được thông báo là chưa chính xác, không hiển thị đáp án đúng.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default ExamResultSettingsSection
