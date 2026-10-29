import { useState } from 'react'
import { X } from 'lucide-react'
import MaterialAssignmentFields from './MaterialAssignmentFields'
import FrogLoading from '../../../../utils/FrogLoading'

const emptyForm = {
  title: '',
  content: '',
  targetType: 'ALL',
  classIds: [],
  studentIds: [],
  file: null,
  files: [],
}

function getFileTitle(file) {
  return file.name.replace(/\.[^.]+$/, '') || file.name
}

export default function MaterialEditorModal({ material, classes, students, targetError, targetLoading = false, retryTargets, saving, onClose, onSave }) {
  const [form, setForm] = useState(() => material ? {
    ...material,
    content: material.content ?? '',
    classIds: [...(material.classIds ?? [])],
    studentIds: [...(material.studentIds ?? [])],
    file: null,
    files: [],
  } : emptyForm)
  const [selectedStudentClassId, setSelectedStudentClassId] = useState(() => {
    const existingClassId = material?.studentClassIds
      ? Object.values(material.studentClassIds)[0]
      : ''
    return existingClassId == null ? '' : String(existingClassId)
  })
  const [classSearch, setClassSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [error, setError] = useState('')

  const toggleId = (field, id) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].some((item) => String(item) === String(id))
        ? current[field].filter((item) => String(item) !== String(id))
        : [...current[field], id],
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if ((!form.files.length || form.files.length === 1 || material) && !form.title.trim()) {
      setError('Vui lòng nhập tên tài liệu.')
      return
    }
    if (!material && !form.files.length) {
      setError('Vui lòng chọn ít nhất một tệp tài liệu để tải lên.')
      return
    }
    if (form.files.some((file) => file.size > 10 * 1024 * 1024)) {
      setError('Tệp tài liệu không được vượt quá 10 MB.')
      return
    }
    if (form.files.reduce((total, file) => total + file.size, 0) > 35 * 1024 * 1024) {
      setError('Tổng dung lượng tài liệu được tải cùng lúc không được vượt quá 35 MB.')
      return
    }
    if (form.targetType === 'CLASS' && !form.classIds.length) {
      setError('Vui lòng chọn ít nhất một lớp.')
      return
    }
    if (form.targetType === 'STUDENT' && !form.studentIds.length) {
      setError('Vui lòng chọn ít nhất một học sinh.')
      return
    }

    setError('')
    const result = await onSave({
      ...form,
      id: material?.id,
      source: material?.source ?? 'UPLOAD',
      title: form.title.trim(),
      content: form.content.trim(),
      fileName: form.files[0]?.name ?? material?.fileName ?? '',
      fileSize: form.files[0]?.size ?? material?.fileSize ?? null,
      file: form.files[0] ?? material?.file ?? null,
      files: !material && form.files.length > 1 ? form.files : [],
      fileUrl: form.files.length ? '' : material?.fileUrl ?? '',
      classIds: form.targetType === 'CLASS' ? form.classIds : [],
      studentIds: form.targetType === 'STUDENT' ? form.studentIds : [],
      excludedClassIds: [],
      students,
    })
    if (result?.success === false) {
      setError(result.message)
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="material-editor-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 id="material-editor-title" className="text-lg font-bold text-[#18301D]">{material ? 'Chỉnh sửa tài liệu' : 'Đăng tài liệu mới'}</h2>
            <p className="mt-1 text-xs text-slate-500">Tài liệu sẽ được lưu trên máy chủ và phân phối theo lựa chọn bên dưới.</p>
          </div>
          <button type="button" aria-label="Đóng" disabled={saving} onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"><X size={19} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {(material || form.files.length <= 1) ? (
            <label className="block text-sm font-semibold text-slate-700">
              Tên tài liệu <span className="text-red-500">*</span>
              <input
                autoFocus
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                maxLength={255}
                placeholder="Ví dụ: Bài giảng chương 1"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
              />
            </label>
          ) : (
            <p className="rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
              Đã chọn {form.files.length} tệp. Mỗi tài liệu sẽ dùng tên tệp làm tiêu đề.
            </p>
          )}

          <label className="block text-sm font-semibold text-slate-700">
            Mô tả
            <textarea
              rows={3}
              value={form.content}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
              placeholder="Mô tả ngắn về tài liệu..."
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Tệp tài liệu {!material && <span className="text-red-500">*</span>}
            <input
              type="file"
              disabled={Boolean(material)}
              multiple={!material}
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.zip"
              onChange={(event) => setForm((current) => ({
                ...current,
                files: [...(event.target.files ?? [])],
                file: event.target.files?.[0] ?? null,
              }))}
              className="mt-1.5 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm font-normal text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-semibold file:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <span className="mt-1.5 block text-xs font-normal text-slate-500">
              {material
                ? material.fileName ?? 'Chọn một tệp'
                : 'Chọn nhiều tệp cùng lúc · PDF, Word, PowerPoint, Excel, TXT hoặc ZIP · tối đa 10 MB mỗi tệp, 35 MB tổng cộng'}
            </span>
            {form.files.length > 0 && (
              <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs font-normal text-slate-600">
                {form.files.map((file) => (
                  <li key={`${file.name}:${file.size}:${file.lastModified}`} className="flex justify-between gap-3">
                    <span className="truncate">{form.files.length > 1 ? getFileTitle(file) : file.name}</span>
                    <span className="shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </li>
                ))}
              </ul>
            )}
          </label>

          <fieldset disabled={targetLoading}>
            <MaterialAssignmentFields
              targetType={form.targetType}
              onTargetTypeChange={(targetType) => setForm((current) => ({ ...current, targetType }))}
              targetError={targetError}
              retryTargets={retryTargets}
              classes={classes}
              students={students}
              classIds={form.classIds}
              studentIds={form.studentIds}
              onToggleClass={(id) => toggleId('classIds', id)}
              onToggleStudent={(id) => toggleId('studentIds', id)}
              selectedStudentClassId={selectedStudentClassId}
              onStudentClassChange={setSelectedStudentClassId}
              classSearch={classSearch}
              onClassSearchChange={setClassSearch}
              studentSearch={studentSearch}
              onStudentSearchChange={setStudentSearch}
            />
          </fieldset>
          {targetLoading && <FrogLoading compact label="Đang tải danh sách lớp và học sinh..." className="text-sm text-slate-500" />}

          {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Hủy</button>
            <button type="submit" disabled={saving || targetLoading} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">
              {saving
                ? <FrogLoading compact label={material ? 'Đang cập nhật...' : 'Đang thêm...'} />
                : targetLoading
                  ? <FrogLoading compact label="Đang tải..." />
                  : material ? 'Lưu thay đổi' : 'Đăng tài liệu'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
