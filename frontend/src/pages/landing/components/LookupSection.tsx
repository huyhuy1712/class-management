import { AlertCircle, Calendar, Check, ChevronRight, Eye, FileCheck2, GraduationCap, Loader2, Mail, Phone, Search, School, User, X } from 'lucide-react'
import defaultAvatar from '../../../assets/images/avatar_default.png'
import type { ClassItem, ExamRecord, HomeworkRecord, StudentProfile } from '../types'

interface Props {
  studentCodeInput: string
  onCodeChange: (value: string) => void
  onSearch: (event: React.FormEvent) => void
  isLoading: boolean
  hasSearched: boolean
  errorMessage: string
  onClearError: () => void
  student: StudentProfile | null
  classes: ClassItem[]
  selectedClass: ClassItem | null
  classDetailLoading: boolean
  exams: ExamRecord[]
  homeworks: HomeworkRecord[]
  onSelectClass: (classItem: ClassItem) => void
  onOpenAbsence: (classItem: ClassItem) => void
}

export default function LookupSection(props: Props) {
  const { studentCodeInput, onCodeChange, onSearch, isLoading, hasSearched, errorMessage, onClearError, student, classes, selectedClass, classDetailLoading, exams, homeworks, onSelectClass, onOpenAbsence } = props
  return (
    <section id="lookup-section" className="scroll-mt-20 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-center"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#D8F3DC] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F3822]"><Search size={13} /> Tra cứu công khai</span><h2 className="mt-3 text-2xl font-extrabold text-[#0F3822] sm:text-3xl">Tra cứu kết quả học tập &amp; chuyên cần</h2><p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">Nhập mã số học sinh để xem thông tin học viên, lớp học phần, bài thi và bài tập.</p></div>
        <div className="mt-8 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm sm:p-7">
          <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1"><label htmlFor="lookup-student-code" className="mb-2 block text-sm font-semibold text-[#0F3822]">Mã số học sinh</label><div className="relative"><input id="lookup-student-code" value={studentCodeInput} onChange={(event) => onCodeChange(event.target.value)} placeholder="Nhập mã số học sinh..." disabled={isLoading} className="w-full rounded-xl border border-emerald-900/15 bg-[#F8FAF9] px-4 py-3.5 text-sm outline-none focus:border-[#10B981] disabled:opacity-60" />{studentCodeInput && <button type="button" aria-label="Xóa nội dung nhập" onClick={() => onCodeChange('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"><X size={16} /></button>}</div></div>
            <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 px-7 py-3.5 text-sm font-semibold text-white disabled:opacity-60">{isLoading ? <><Loader2 size={18} className="animate-spin" /> Đang tìm...</> : <><Search size={18} /> Tra cứu</>}</button>
          </form>
        </div>
        {isLoading && <div className="mt-8 flex flex-col items-center rounded-2xl border border-emerald-900/10 bg-white p-12 text-center shadow-sm"><Loader2 size={36} className="animate-spin text-[#10B981]" /><p className="mt-3 font-semibold text-[#0F3822]">Đang tra cứu dữ liệu từ hệ thống máy chủ...</p></div>}
        {!isLoading && hasSearched && errorMessage && <div role="alert" className="mt-6 flex items-start gap-3.5 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"><AlertCircle size={22} /><div><p className="font-bold">{errorMessage}</p><p className="mt-1 text-sm">Vui lòng đối chiếu lại mã học viên đã được cấp.</p><button type="button" onClick={onClearError} className="mt-2 text-xs underline">Đóng</button></div></div>}
        {!isLoading && hasSearched && student && <LookupResults student={student} classes={classes} selectedClass={selectedClass} classDetailLoading={classDetailLoading} exams={exams} homeworks={homeworks} onSelectClass={onSelectClass} onOpenAbsence={onOpenAbsence} />}
      </div>
    </section>
  )
}

function LookupResults({ student, classes, selectedClass, classDetailLoading, exams, homeworks, onSelectClass, onOpenAbsence }: Omit<Props, 'studentCodeInput' | 'onCodeChange' | 'onSearch' | 'isLoading' | 'hasSearched' | 'errorMessage' | 'onClearError'> & { student: StudentProfile }) {
  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center"><div className="flex items-center gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0F3822] text-xl font-bold text-[#D8F3DC]"><img src={student.avatar || defaultAvatar} alt="" className="h-full w-full rounded-2xl object-cover" /></div><div><div className="flex flex-wrap items-center gap-2.5"><h3 className="text-xl font-extrabold text-[#0F3822]">{student.fullName}</h3><span className="rounded-full bg-[#D8F3DC] px-3 py-0.5 text-xs font-bold text-[#0F3822]"><Check size={13} className="mr-1 inline" />Học viên chính thức</span></div><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500"><span><User size={14} className="mr-1 inline text-[#10B981]" />Mã số: <strong className="text-[#0F3822]">{student.studentCode}</strong></span>{student.email && <span><Mail size={14} className="mr-1 inline text-[#10B981]" />{student.email}</span>}{student.phone && <span><Phone size={14} className="mr-1 inline text-[#10B981]" />{student.phone}</span>}</div></div></div><div className="flex items-center gap-2 rounded-xl bg-[#F8FAF9] px-4 py-2.5 text-xs font-bold text-[#0F3822]"><GraduationCap size={20} className="text-[#10B981]" />{classes.length} lớp học phần tham gia</div></div>
        <div className="mt-6"><h4 className="text-base font-bold text-[#0F3822] sm:text-lg">Danh sách lớp học phần</h4>{classes.length === 0 ? <div className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">Học sinh này hiện chưa tham gia lớp học phần nào.</div> : <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{classes.map((classItem) => <ClassCard key={classItem.id} classItem={classItem} selected={String(classItem.id) === String(selectedClass?.id)} onSelect={onSelectClass} onOpenAbsence={onOpenAbsence} />)}</div>}</div>
      </div>
      {classDetailLoading && <div className="flex items-center justify-center rounded-2xl border bg-white p-8"><Loader2 size={24} className="animate-spin text-[#10B981]" /><span className="ml-2 text-sm font-semibold">Đang tải dữ liệu lớp học...</span></div>}
      {!classDetailLoading && selectedClass && <PerformanceTables classItem={selectedClass} exams={exams} homeworks={homeworks} />}
    </div>
  )
}

function ClassCard({ classItem, selected, onSelect, onOpenAbsence }: { classItem: ClassItem; selected: boolean; onSelect: (item: ClassItem) => void; onOpenAbsence: (item: ClassItem) => void }) {
  return <div role="button" tabIndex={0} onClick={() => onSelect(classItem)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(classItem) }} className={`group cursor-pointer rounded-xl p-5 ${selected ? 'border-2 border-[#10B981] bg-[#D8F3DC]/25 shadow-md' : 'border border-emerald-900/10 bg-[#F8FAF9]'}`}><div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected ? 'bg-[#0F3822] text-[#D8F3DC]' : 'bg-[#D8F3DC] text-[#0F3822]'}`}><School size={20} /></div><span className="rounded-md bg-white px-2 py-0.5 text-[11px] text-gray-500">{selected ? 'Đang xem' : classItem.code}</span></div><h5 className="mt-3.5 text-base font-bold text-[#0F3822]">{classItem.name}</h5><p className="mt-1 text-xs text-gray-500">{classItem.academicYear || 'Năm học 2026 - 2027'}</p>{classItem.teacherName && <p className="mt-0.5 text-xs text-gray-600">Giảng viên: <strong>{classItem.teacherName}</strong></p>}<div className="mt-3.5 flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-xs"><span><Calendar size={13} className="mr-1 inline text-[#10B981]" />Vắng: <strong className={(classItem.absentCount || 0) > 0 ? 'text-red-600' : 'text-[#10B981]'}>{classItem.absentCount || 0} buổi</strong></span><button type="button" onClick={(event) => { event.stopPropagation(); onOpenAbsence(classItem) }} className="rounded-lg bg-[#D8F3DC] px-2 py-0.5 font-bold text-[#0F3822]"><Eye size={12} className="mr-1 inline" />Chi tiết</button></div><div className="mt-4 flex justify-between border-t border-gray-100 pt-3 text-xs font-semibold text-gray-400"><span>{selected ? 'Đang hiển thị dữ liệu' : 'Bấm xem điểm & vắng'}</span><ChevronRight size={16} className={selected ? 'rotate-90 text-[#10B981]' : ''} /></div></div>
}

function scoreBadgeClass(score: number | string | null | undefined) {
  const isMissing = score === null || score === undefined || (typeof score === 'string' && !score.trim())
  const numericScore = isMissing ? null : Number(score)
  const color =
    numericScore !== null && Number.isFinite(numericScore) && numericScore < 5
      ? 'bg-rose-100 text-rose-800'
      : 'bg-[#D8F3DC] text-[#0F3822]'

  return `rounded-xl px-3 py-1.5 font-extrabold ${color}`
}

function PerformanceTables({ classItem, exams, homeworks }: { classItem: ClassItem; exams: ExamRecord[]; homeworks: HomeworkRecord[] }) {
  return (
    <div className="space-y-6">
      <DataTable
        title={`Bảng điểm bài thi & đánh giá — ${classItem.name}`}
        count={`${exams.length} bài kiểm tra`}
        empty="Chưa có dữ liệu bài kiểm tra cho lớp này"
      >
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#F8FAF9] text-xs font-bold uppercase">
              <th className="p-4">Thời gian</th>
              <th className="p-4">Tên bài kiểm tra / Dạng bài</th>
              <th className="p-4 text-center">Điểm</th>
              <th className="p-4">Nhận xét</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {exams.map((item) => (
              <tr key={item.id}>
                <td className="p-4 text-xs">{item.date || item.createdAt || 'Đã hoàn thành'}</td>
                <td className="p-4 font-semibold">{item.examTitle || item.title || item.name}</td>
                <td className="p-4 text-center">
                  <span className={scoreBadgeClass(item.score)}>
                    {item.score ?? '—'} / {item.maxScore ?? 10}
                  </span>
                </td>
                <td className="p-4 text-xs">
                  {item.teacherComment || item.comment || 'Hoàn thành bài kiểm tra theo đúng quy định'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>

      <DataTable
        title={`Danh sách bài tập — ${classItem.name}`}
        count={`${homeworks.length} bài tập`}
        empty="Chưa có bài tập được giao cho lớp này"
      >
        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#F8FAF9] text-xs font-bold uppercase">
              <th className="p-4">Tên bài tập</th>
              <th className="p-4">Hạn nộp</th>
              <th className="p-4 text-center">Điểm</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4">Nhận xét</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {homeworks.map((item) => {
              const submitted = item.status === 'GRADED' || item.status === 'SUBMITTED'
              const label =
                item.status === 'GRADED'
                  ? 'Đã chấm'
                  : item.status === 'SUBMITTED'
                    ? 'Đã nộp, chờ chấm'
                    : item.status === 'REOPENED'
                      ? 'Đã mở lại'
                      : 'Chưa làm'

              return (
                <tr key={item.id}>
                  <td className="p-4">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-[11px] text-gray-500">
                      {item.subjectName || 'Bài tập'}
                      {item.createdDate ? ` • Giao ngày ${item.createdDate}` : ''}
                    </p>
                  </td>
                  <td className="p-4 text-xs">{item.dueDate || 'Không giới hạn'}</td>
                  <td className="p-4 text-center">
                    <span className={scoreBadgeClass(item.score)}>
                      {item.score ?? '—'} / {item.maxScore ?? 10}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${submitted ? 'bg-[#D8F3DC]' : 'bg-amber-50 text-amber-700'}`}
                    >
                      {label}
                    </span>
                  </td>
                  <td className="p-4 text-xs">
                    {item.teacherComment || (submitted ? 'Chưa có nhận xét' : 'Học sinh chưa làm bài')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </DataTable>
    </div>
  )
}

function DataTable({ title, count, empty, children }: { title: string; count: string; empty: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm"><div className="flex justify-between gap-2 border-b border-gray-100 pb-4"><h4 className="text-lg font-bold text-[#0F3822]">{title}</h4><span className="rounded-xl bg-[#F8FAF9] px-3 py-1.5 text-xs font-semibold">{count}</span></div><div className="mt-3 w-full overflow-x-auto">{count.startsWith('0') ? <div className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-500"><FileCheck2 size={32} className="mx-auto mb-2 text-[#10B981]/60" />{empty}</div> : children}</div></div>
}
