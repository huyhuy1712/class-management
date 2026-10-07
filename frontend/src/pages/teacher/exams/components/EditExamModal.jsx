import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import subjectService from '../../../../services/subjectService'

function EditExamModal({ exam, open, saving, error, onClose, onSave }) {
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ title: '', description: '', gradeLevel: '', purpose: '', subjectId: '' })

  useEffect(() => {
    if (!open || !exam) return
    setForm({
      title: exam.title ?? '',
      description: exam.description ?? '',
      gradeLevel: exam.gradeLevel ?? '',
      purpose: exam.purpose ?? '',
      subjectId: exam.subjectId ?? '',
    })
    subjectService.getAll().then(setSubjects).catch(() => setSubjects([]))
  }, [open, exam])

  if (!open || !exam) return null

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const submit = (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.subjectId) return
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      gradeLevel: form.gradeLevel.trim(),
      purpose: form.purpose.trim(),
      subjectId: Number(form.subjectId),
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div><h2 className="text-lg font-bold text-[#18301D]">Chỉnh sửa đề thi</h2><p className="mt-1 text-sm text-slate-400">Cập nhật thông tin cơ bản của đề thi.</p></div>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Tên đề thi *</span><input name="title" value={form.title} onChange={change} required className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-green-400"/></label>
          <label><span className="mb-1.5 block text-sm font-semibold text-slate-700">Môn học *</span><select name="subjectId" value={form.subjectId} onChange={change} required className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-green-400"><option value="">Chọn môn học</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
          <label><span className="mb-1.5 block text-sm font-semibold text-slate-700">Khối / lớp</span><input name="gradeLevel" value={form.gradeLevel} onChange={change} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-green-400"/></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Mục đích</span><input name="purpose" value={form.purpose} onChange={change} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-green-400"/></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Mô tả</span><textarea name="description" value={form.description} onChange={change} rows={4} className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-green-400"/></label>
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} disabled={saving} className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Hủy</button><button type="submit" disabled={saving} className="cursor-pointer rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>
      </form>
    </div>
  )
}
export default EditExamModal
