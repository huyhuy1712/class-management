import { sortByText } from '../../../../utils/sortByText'
import { LoaderCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import subjectService from '../../../../services/subjectService'

function EditExamModal({
  open,
  exam,
  loading = false,
  error = '',
  onClose,
  onSubmit,
}) {
  const [subjects, setSubjects] = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [subjectsError, setSubjectsError] = useState('')
  const [form, setForm] = useState({
    subjectId: '',
    title: '',
    description: '',
    gradeLevel: '',
    purpose: '',
  })

  useEffect(() => {
    if (!open || !exam) return

    setForm({
      subjectId: exam.subjectId ?? '',
      title: exam.title ?? '',
      description: exam.description ?? '',
      gradeLevel: exam.gradeLevel ?? '',
      purpose: exam.purpose ?? '',
    })

    let cancelled = false
    const loadSubjects = async () => {
      try {
        setSubjectsLoading(true)
        setSubjectsError('')
        const data = await subjectService.getAll()
        if (!cancelled) setSubjects(Array.isArray(data) ? data : [])
      } catch (loadError) {
        console.error('Get subjects for exam edit error:', loadError)
        if (!cancelled) setSubjectsError('Không thể tải danh sách môn học.')
      } finally {
        if (!cancelled) setSubjectsLoading(false)
      }
    }

    loadSubjects()
    return () => {
      cancelled = true
    }
  }, [exam, open])

  if (!open || !exam) return null

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({
      subjectId: Number(form.subjectId),
      title: form.title.trim(),
      description: form.description.trim(),
      gradeLevel: form.gradeLevel.trim(),
      purpose: form.purpose.trim(),
    })
  }

  const invalid = !form.subjectId || !form.title.trim()

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose?.()
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl overflow-hidden rounded-[24px] bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-[#18301D]">Sửa đề thi</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cập nhật môn học và thông tin hiển thị của đề thi.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-12rem)] space-y-4 overflow-y-auto px-6 py-6">
          {(error || subjectsError) && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error || subjectsError}
            </div>
          )}

          <label className="block text-sm font-semibold text-slate-700">
            Môn học
            <select
              name="subjectId"
              value={form.subjectId}
              onChange={handleChange}
              disabled={loading || subjectsLoading}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50"
            >
              <option value="">
                {subjectsLoading ? 'Đang tải môn học...' : 'Chọn môn học'}
              </option>
              {sortByText(subjects, (item) => item.name).map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Tên đề thi
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              disabled={loading}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Mô tả
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Khối/lớp
              <input
                name="gradeLevel"
                value={form.gradeLevel}
                onChange={handleChange}
                disabled={loading}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Mục đích
              <input
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                disabled={loading}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || subjectsLoading || invalid}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <LoaderCircle size={17} className="animate-spin" />}
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditExamModal
