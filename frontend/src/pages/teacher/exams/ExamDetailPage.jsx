import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Pencil,
  Plus,
  Send,
  UsersRound,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import ExamStatusBadge from './components/ExamStatusBadge'

function ExamDetailPage() {
  const navigate = useNavigate()
  const { examId } = useParams()

  // MOCK DATA
  // Sau này GET /exams/{examId}
  const exam = {
    id: Number(examId),
    code: 'JAVA-MID-01',
    title: 'Kiểm tra giữa kỳ - Lập trình Java',
    description:
      'Đề kiểm tra kiến thức giữa kỳ môn Lập trình Java.',
    status: 'PUBLISHED',

    submissionCount: 32,
    assignedClassCount: 2,
    questionCount: 20,

    duration: 45,

    createdAt: '06/10/2026 08:30',
  }

  return (
    <div className="min-h-screen bg-[#F7F9F7] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">

        {/* BACK */}
        <button
          type="button"
          onClick={() => navigate('/teacher/exams')}
          className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-green-700"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách đề thi
        </button>

        {/* HEADER */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

            <div className="flex min-w-0 gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <FileText size={26} />
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-[#18301D]">
                    {exam.title}
                  </h1>

                  <ExamStatusBadge status={exam.status} />
                </div>

                <p className="text-sm font-medium text-slate-400">
                  Mã đề: {exam.code}
                </p>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                  {exam.description}
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Pencil size={17} />
                Chỉnh sửa
              </button>

              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                <Send size={17} />
                Giao đề
              </button>
            </div>
          </div>
        </div>

        {/* STATISTICS */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={FileText}
            label="Số câu hỏi"
            value={exam.questionCount}
          />

          <StatCard
            icon={CheckCircle2}
            label="Bài đã nộp"
            value={exam.submissionCount}
          />

          <StatCard
            icon={UsersRound}
            label="Lớp đã giao"
            value={exam.assignedClassCount}
          />

          <StatCard
            icon={Clock3}
            label="Thời gian làm bài"
            value={`${exam.duration} phút`}
          />

        </div>

        {/* MAIN CONTENT */}
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">

          {/* QUESTIONS */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#18301D]">
                  Câu hỏi
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Danh sách câu hỏi trong đề thi
                </p>
              </div>

              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                <Plus size={17} />
                Thêm câu hỏi
              </button>
            </div>

            {/* EMPTY TEMP */}
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <FileText size={25} />
              </div>

              <h3 className="mt-4 font-bold text-[#18301D]">
                Chưa hiển thị câu hỏi
              </h3>

              <p className="mt-1 max-w-md text-sm leading-6 text-slate-400">
                Khu vực này sẽ dùng để quản lý các câu hỏi
                thuộc đề thi.
              </p>
            </div>
          </div>

          {/* RIGHT INFO */}
          <div className="space-y-5">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-[#18301D]">
                Thông tin đề thi
              </h3>

              <div className="mt-5 space-y-5">

                <InfoRow
                  icon={CalendarDays}
                  label="Thời gian tạo"
                  value={exam.createdAt}
                />

                <InfoRow
                  icon={Clock3}
                  label="Thời gian làm bài"
                  value={`${exam.duration} phút`}
                />

                <InfoRow
                  icon={FileText}
                  label="Mã đề thi"
                  value={exam.code}
                />

              </div>
            </div>

            {/* RESULT */}
            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-green-200 hover:bg-green-50/30"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <BarChart3 size={21} />
              </div>

              <div>
                <p className="font-semibold text-[#18301D]">
                  Kết quả bài thi
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Xem điểm và bài làm học sinh
                </p>
              </div>
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
          <Icon size={21} />
        </div>

        <div>
          <p className="text-sm text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-xl font-bold text-[#18301D]">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-slate-400">
        <Icon size={18} />
      </div>

      <div>
        <p className="text-xs font-medium text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  )
}

export default ExamDetailPage