import {
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  Mail,
  Phone,
  UserRound,
  CalendarCheck,
  CircleCheck,
  CircleX,
  Clock3,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import defaultAvatar from '../../../assets/images/avatar_default.png'

function StudentDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { classId, studentId } = useParams()

  // Student được truyền từ StudentsTab qua navigate()
  const student = location.state?.student

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(`/teacher/classes/${classId}`)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-800"
      >
        <ArrowLeft size={18} />
        Quay lại danh sách học sinh
      </button>

      {/* Student header */}
      <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-100 via-lime-50 to-amber-50 p-6 shadow-sm shadow-emerald-950/5 sm:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <img
              src={student?.avatar || defaultAvatar}
              alt={student?.fullName || 'Học sinh'}
              className="h-20 w-20 shrink-0 rounded-2xl border-4 border-white/80 object-cover shadow-sm"
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = defaultAvatar
              }}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                Học sinh
              </p>

              <h1 className="mt-1 break-words text-2xl font-bold text-[#18301D] sm:text-3xl">
                {student?.fullName || `Học sinh #${studentId}`}
              </h1>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                <span>@{student?.username || '---'}</span>
              </div>
            </div>
          </div>

          <span className="w-fit rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-800">
            Đang học
          </span>
        </div>

        {/* Contact */}
        {student && (
          <div className="mt-6 grid gap-5 border-t border-emerald-200/80 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
                <Mail size={18} />
              </span>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Email</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                  {student.email || 'Chưa cập nhật'}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <Phone size={18} />
              </span>

              <div>
                <p className="text-xs font-medium text-slate-500">Số điện thoại</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {student.phone || 'Chưa cập nhật'}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-200/70 text-emerald-900">
                <UserRound size={18} />
              </span>

              <div>
                <p className="text-xs font-medium text-slate-500">Mã học sinh</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {student?.studentCode || '---'}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Placeholder */}
      <div className="grid gap-5 lg:grid-cols-2">

                {/* Result statistics */}
        <section className="rounded-2xl border border-sky-200 bg-white p-6 shadow-sm shadow-sky-950/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sky-900">
              <BookOpenCheck size={19} />
            </div>

            <div>
              <h2 className="font-bold text-[#18301D]">
                Kết quả học tập
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Bài tập và đề thi của học sinh
              </p>
            </div>
          </div>

          <div className="mt-6 flex min-h-40 items-center justify-center border-t border-sky-200 text-center">
            <p className="text-sm text-slate-500">
              Sẽ kết nối API ở bước sau
            </p>
          </div>
        </section>

        {/* Grade statistics */}
        <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm shadow-amber-950/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-200/70 text-amber-900">
              <BarChart3 size={19} />
            </div>

            <div>
              <h2 className="font-bold text-[#18301D]">
                Tổng quan điểm số
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Thống kê kết quả của học sinh
              </p>
            </div>
          </div>

          <div className="mt-6 flex min-h-40 items-center justify-center border-t border-amber-200 text-center">
            <p className="text-sm text-slate-500">
              Sẽ kết nối API ở bước sau
            </p>
          </div>
        </section>

        {/* Attendance statistics */}
  <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm shadow-emerald-950/5">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
        <CalendarCheck size={19} />
      </div>

      <div>
        <h2 className="font-bold text-[#18301D]">
          Tình trạng học
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Thống kê tình hình điểm danh của học sinh
        </p>
      </div>
    </div>

<div className="mt-6 grid gap-4 border-t border-emerald-100 pt-6 sm:grid-cols-3">
  {/* Đã học */}
  <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-center">
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
        <CircleCheck size={19} />
      </div>
      <span className="text-sm font-semibold text-slate-700">Đã học</span>
    </div>

    <div className="flex items-baseline gap-1.5">
      <p className="text-2xl font-bold leading-none text-emerald-700">0</p>
      <p className="text-xs text-slate-500">buổi</p>
    </div>
  </div>

  {/* Vắng */}
  <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/70 p-4 text-center">
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
        <CircleX size={19} />
      </div>
      <span className="text-sm font-semibold text-slate-700">Vắng</span>
    </div>

    <div className="flex items-baseline gap-1.5">
      <p className="text-2xl font-bold leading-none text-red-600">0</p>
      <p className="text-xs text-slate-500">buổi</p>
    </div>
  </div>

  {/* Đi trễ */}
  <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-center">
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
        <Clock3 size={19} />
      </div>
      <span className="text-sm font-semibold text-slate-700">Đi trễ</span>
    </div>

    <div className="flex items-baseline gap-1.5">
      <p className="text-2xl font-bold leading-none text-amber-600">0</p>
      <p className="text-xs text-slate-500">buổi</p>
    </div>
  </div>
</div>
  </section>

      </div>
    </div>
  )
}

export default StudentDetailPage