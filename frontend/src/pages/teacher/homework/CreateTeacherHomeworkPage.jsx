import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ClipboardCheck, Plus } from 'lucide-react'
import DashboardLayout from '../../../layouts/DashboardLayout'
import useResourceQuery from '../../../query/useResourceQuery'
import homeworkService from '../../../services/homeworkService'
import { sortByText } from '../../../utils/sortByText'
import { GRADE_OPTIONS } from '../exams/create/helpers/examFormConstants'

const emptyForm = {
  title: '',
  instructions: '',
  subjectId: '',
  gradeLevel: '',
  purpose: '',
  assignmentType: 'ALL',
  classIds: [],
  studentIds: [],
  classId: '',
  dueAt: '',
  maxScore: '10',
  file: null,
  audioFile: null,
}

export default function CreateTeacherHomeworkPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const classId = searchParams.get('classId')
  const subjectsQuery = useResourceQuery('subjects')
  const classesQuery = useResourceQuery('teacherClasses')
  const studentsQuery = useResourceQuery('teacherStudents')
  const [form, setForm] = useState(() => classId
    ? { ...emptyForm, assignmentType: 'CLASS', classIds: [Number(classId)] }
    : emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const classes = classesQuery.data?.filter((item) => item.status === 'ACTIVE') ?? []
  const students = studentsQuery.data ?? []
  const subjects = subjectsQuery.data ?? []
  const availableStudents = students.filter((student) =>
    student.classes?.some((classroom) => String(classroom.id) === String(form.classId)))
  const listPath = `/teacher/homework${classId ? `?classId=${classId}` : ''}`

  const toggleId = (field, id) => setForm((current) => ({
    ...current,
    [field]: current[field].some((value) => String(value) === String(id))
      ? current[field].filter((value) => String(value) !== String(id))
      : [...current[field], id],
  }))

  const save = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.title.trim()) return setError('Vui lòng nhập tên bài tập.')
    if (!form.subjectId) return setError('Vui lòng chọn môn học.')
    if (!form.gradeLevel) return setError('Vui lòng chọn khối / cấp độ.')
    if (form.purpose.length > 50) return setError('Mục đích tạo bài tập tối đa 50 ký tự.')
    if (!form.instructions.trim() && !form.file && !form.audioFile) return setError('Nhập nội dung hoặc đính kèm tệp đề bài/âm thanh.')
    if (form.assignmentType === 'CLASS' && !form.classIds.length) return setError('Chọn ít nhất một lớp.')
    if (form.assignmentType === 'STUDENT' && !form.studentIds.length) return setError('Chọn ít nhất một học sinh.')
    if (form.assignmentType === 'ALL' && !classes.length) return setError('Bạn cần có lớp đang hoạt động và học sinh để giao bài.')
    if (form.file && form.file.size > 10 * 1024 * 1024) return setError('Tệp không được vượt quá 10 MB.')
    if (form.audioFile && !/\.(mp3|wav|m4a|aac|ogg|webm)$/i.test(form.audioFile.name)) return setError('Tệp âm thanh chỉ hỗ trợ MP3, WAV, M4A, AAC, OGG hoặc WEBM.')
    if (form.audioFile && form.audioFile.size > 10 * 1024 * 1024) return setError('Tệp âm thanh không được vượt quá 10 MB.')
    setSaving(true)
    try {
      await homeworkService.create({
        ...form,
        classIds: form.assignmentType === 'CLASS' ? form.classIds : [],
        studentIds: form.assignmentType === 'STUDENT' ? form.studentIds : [],
      })
      navigate(listPath, { replace: true })
    } catch (failure) {
      setError(failure.response?.data?.message || failure.message || 'Không thể giao bài tập.')
    } finally {
      setSaving(false)
    }
  }

  return <DashboardLayout>
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-8">
      <Link to={listPath} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><ArrowLeft size={17} />Quay lại danh sách bài tập</Link>
      <header className="flex items-center gap-4 border-b border-emerald-100 pb-5">
        <span className="rounded-2xl bg-emerald-100 p-4 text-emerald-700"><ClipboardCheck size={28} /></span>
        <div><h1 className="text-2xl font-bold text-slate-900">Tạo bài tập</h1><p className="mt-1 text-sm text-slate-500">Nhập nội dung, chọn người nhận và thiết lập hạn nộp.</p></div>
      </header>

      {classId && <Link to={`/teacher/classes/${classId}/homework`} className="inline-flex text-sm font-semibold text-emerald-700 underline">Quay lại tab bài tập của lớp</Link>}

      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
        <form onSubmit={save} className="grid gap-5 lg:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Tên bài tập
            <input required maxLength={255} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700">Môn học <span className="text-red-500">*</span>
            <select required value={form.subjectId} onChange={(event) => setForm({ ...form, subjectId: event.target.value })} disabled={subjectsQuery.isLoading || Boolean(subjectsQuery.errorMessage) || subjects.length === 0} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-normal">
              <option value="">{subjectsQuery.isLoading ? 'Đang tải môn học...' : subjectsQuery.errorMessage ? 'Không thể tải môn học' : subjects.length === 0 ? 'Chưa có môn học' : 'Chọn môn học'}</option>
              {sortByText(subjects, (subject) => subject.name).map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
            {!subjectsQuery.isLoading && (subjectsQuery.errorMessage || subjects.length === 0) && <span className="mt-1 block text-xs font-normal text-red-600">{subjectsQuery.errorMessage || 'Chưa có môn học trong hệ thống.'}<button type="button" onClick={() => subjectsQuery.refetch()} className="ml-2 font-semibold underline">Tải lại</button></span>}
          </label>
          <label className="text-sm font-semibold text-slate-700">Khối / Cấp độ <span className="text-red-500">*</span>
            <select required value={form.gradeLevel} onChange={(event) => setForm({ ...form, gradeLevel: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-normal">
              <option value="">Chọn khối / cấp độ</option>
              {GRADE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Mục đích tạo bài tập
            <input maxLength={50} value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} placeholder="Ví dụ: Luyện tập, bài tập về nhà..." className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700">Điểm tối đa
            <input type="number" min="0" max="1000" step="0.001" value={form.maxScore} onChange={(event) => setForm({ ...form, maxScore: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700 lg:col-span-2">Nội dung / hướng dẫn
            <textarea rows={4} maxLength={50000} value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700">Tệp đề bài (tùy chọn)
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] ?? null })} className="mt-1.5 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 font-normal" />
            <span className="mt-1 block text-xs font-normal text-slate-500">{form.file?.name ?? 'PDF, DOC/DOCX, JPG/PNG · tối đa 10 MB'}</span>
          </label>
          <label className="text-sm font-semibold text-slate-700">Tệp âm thanh (tùy chọn)
            <input type="file" accept=".mp3,.wav,.m4a,.aac,.ogg,.webm" onChange={(event) => setForm({ ...form, audioFile: event.target.files?.[0] ?? null })} className="mt-1.5 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 font-normal" />
            <span className="mt-1 block text-xs font-normal text-slate-500">{form.audioFile?.name ?? 'MP3, WAV, M4A, AAC, OGG, WEBM · tối đa 10 MB'}</span>
          </label>
          <label className="text-sm font-semibold text-slate-700">Hạn nộp (không bắt buộc)
            <input type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-normal" />
          </label>

          <fieldset className="lg:col-span-2">
            <legend className="mb-2 text-sm font-semibold text-slate-700">Phạm vi giao</legend>
            <div className="flex flex-wrap gap-2">
              {[['ALL', 'Tất cả lớp'], ['CLASS', 'Chọn lớp'], ['STUDENT', 'Chọn học sinh']].map(([value, label]) =>
                <button key={value} type="button" onClick={() => setForm({ ...form, assignmentType: value, classIds: [], studentIds: [], classId: '' })} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${form.assignmentType === value ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600'}`}>{label}</button>)}
            </div>
            {['CLASS', 'STUDENT'].includes(form.assignmentType) && <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-slate-100 p-3">
              {classesQuery.isLoading ? <p className="text-sm text-slate-500">Đang tải lớp...</p> : classesQuery.errorMessage ? <p role="alert" className="text-sm text-red-600">{classesQuery.errorMessage}</p> : form.assignmentType === 'CLASS' ?
                classes.map((classroom) => <label key={classroom.id} className="flex items-center gap-2 py-1.5 text-sm"><input type="checkbox" checked={form.classIds.some((id) => String(id) === String(classroom.id))} onChange={() => toggleId('classIds', classroom.id)} />{classroom.name}</label>)
                : <div>
                  <select value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value, studentIds: [] })} className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Chọn lớp để lọc học sinh</option>{classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}</select>
                  {availableStudents.map((student) => <label key={student.id} className="flex items-center gap-2 py-1.5 text-sm"><input type="checkbox" checked={form.studentIds.some((id) => String(id) === String(student.id))} onChange={() => toggleId('studentIds', student.id)} />{student.fullName} {student.studentCode && <span className="text-slate-400">({student.studentCode})</span>}</label>)}
                </div>}
            </div>}
            {form.assignmentType === 'ALL' && <p className="mt-2 text-sm text-slate-500">Giao cho học sinh thuộc các lớp đang hoạt động của bạn.</p>}
            {classesQuery.errorMessage && <p role="alert" className="mt-2 text-sm text-red-600">{classesQuery.errorMessage}</p>}
            {form.assignmentType === 'STUDENT' && studentsQuery.errorMessage && <p role="alert" className="mt-2 text-sm text-red-600">{studentsQuery.errorMessage}</p>}
          </fieldset>

          {error && <p role="alert" className="lg:col-span-2 text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <button disabled={saving || subjectsQuery.isLoading || Boolean(subjectsQuery.errorMessage) || subjects.length === 0 || classesQuery.isLoading || (form.assignmentType === 'STUDENT' && studentsQuery.isLoading)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50"><Plus size={17} />{saving ? 'Đang giao...' : 'Giao bài tập'}</button>
            <Link to={listPath} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600">Hủy</Link>
          </div>
        </form>
      </section>
    </main>
  </DashboardLayout>
}
