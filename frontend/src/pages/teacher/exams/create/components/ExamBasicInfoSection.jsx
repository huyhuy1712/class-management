import { sortByText } from '../../../../../utils/sortByText'
import { BookOpen, GraduationCap, Settings2 } from 'lucide-react'

import { GRADE_OPTIONS } from '../helpers/examFormConstants'
import FieldLabel from './ui/FieldLabel'

const inputClass =
  'w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4'
const fieldClass = (error) =>
  `${inputClass} ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-slate-200 focus:border-green-400 focus:ring-green-50'}`
const ErrorText = ({ children }) =>
  children ? <p className="mt-1.5 text-xs font-medium text-red-500">{children}</p> : null

function ExamBasicInfoSection({
  form,
  errors = {},
  onChange,
  subjects = [],
  subjectsLoading = false,
  subjectsError = '',
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
      <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
          <Settings2 size={20} />
        </div>
        <div>
          <h2 className="font-bold text-[#18301D]">Cấu hình chung</h2>
          <p className="mt-0.5 text-xs text-slate-400">Thông tin cơ bản của đề thi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <FieldLabel required>Tên đề thi</FieldLabel>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="Ví dụ: Kiểm tra giữa kỳ - Lập trình Java"
            className={fieldClass(errors.title)}
          />
          <ErrorText>{errors.title}</ErrorText>
        </div>

        <div>
          <FieldLabel required>Môn học</FieldLabel>
          <div className="relative">
            <BookOpen size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              name="subjectId"
              value={form.subjectId}
              onChange={onChange}
              disabled={subjectsLoading}
              className={`${fieldClass(errors.subjectId)} pl-11`}
            >
              <option value="">{subjectsLoading ? 'Đang tải môn học...' : 'Chọn môn học'}</option>
              {sortByText(subjects, (item) => item.name).map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
          <ErrorText>{errors.subjectId || subjectsError}</ErrorText>
        </div>

        <div>
          <FieldLabel required>Khối / Cấp độ</FieldLabel>
          <div className="relative">
            <GraduationCap size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              name="gradeLevel"
              value={form.gradeLevel}
              onChange={onChange}
              className={`${fieldClass(errors.gradeLevel)} pl-11`}
            >
              <option value="">Chọn khối / cấp độ</option>
              {GRADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <ErrorText>{errors.gradeLevel}</ErrorText>
        </div>

        <div className="lg:col-span-2">
          <FieldLabel>Mục đích tạo đề</FieldLabel>
          <input
            name="purpose"
            value={form.purpose}
            onChange={onChange}
            placeholder="Ví dụ: Kiểm tra giữa kỳ, luyện tập..."
            className={fieldClass()}
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
            className={`${fieldClass()} resize-none`}
          />
        </div>
      </div>
    </section>
  )
}

export default ExamBasicInfoSection
