import {
  BookOpen,
  GraduationCap,
  Settings2,
} from 'lucide-react'

import {
  GRADE_OPTIONS,
} from '../helpers/examFormConstants'
import FieldLabel from './ui/FieldLabel'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-50'

function ExamBasicInfoSection({
  form,
  onChange,
  subjects = [],
  subjectsLoading = false,
  subjectsError = '',
}) {
  return (
  <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">      <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
          <Settings2 size={20} />
        </div>

        <div>
          <h2 className="font-bold text-[#18301D]">
            Cấu hình chung
          </h2>

          <p className="mt-0.5 text-xs text-slate-400">
            Thông tin cơ bản của đề thi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <FieldLabel required>
            Tên đề thi
          </FieldLabel>

          <input
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="Ví dụ: Kiểm tra giữa kỳ - Lập trình Java"
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel required>
            Môn học
          </FieldLabel>

          <div className="relative">
            <BookOpen
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              name="subjectId"
              value={form.subjectId}
              onChange={onChange}
              disabled={subjectsLoading}
              className={`${inputClass} pl-11`}
            >
              <option value="">
                {subjectsLoading ? 'Đang tải môn học...' : 'Chọn môn học'}
              </option>

              {subjects.map(
                (subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>
                ),
              )}
            </select>
          </div>
          {subjectsError && (
            <p className="mt-1.5 text-xs text-red-500">
              {subjectsError}
            </p>
          )}
        </div>

        <div>
          <FieldLabel>
            Khối / Cấp độ
          </FieldLabel>

          <div className="relative">
            <GraduationCap
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              name="gradeLevel"
              value={form.gradeLevel}
              onChange={onChange}
              className={`${inputClass} pl-11`}
            >
              <option value="">
                Chọn khối / cấp độ
              </option>

              {GRADE_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        <div className="lg:col-span-2">
          <FieldLabel>
            Mục đích tạo đề
          </FieldLabel>

          <input
            name="purpose"
            value={form.purpose}
            onChange={onChange}
            placeholder="Ví dụ: Kiểm tra giữa kỳ, luyện tập..."
            className={inputClass}
          />
        </div>

        <div className="lg:col-span-2">
          <FieldLabel>Mô tả</FieldLabel>

          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={4}
            placeholder="Nhập mô tả hoặc hướng dẫn cho đề thi..."
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>
    </section>
  )
}

export default ExamBasicInfoSection