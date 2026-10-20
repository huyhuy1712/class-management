import FrogLoading from '../../utils/FrogLoading'
import useStudentDashboard from "../../pages/student/hooks/useStudentDashboard";
import {
  AlarmClock,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  BookOpen,
  Search,
  BarChart3,
  FileCheck,
  ArrowUpRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useRoutePrefetch from '../../query/useRoutePrefetch'
import { formatExamDateTime } from "../../pages/teacher/exams/helpers/examHelpers";

const features = [
  {
    title: "Lớp học",
    description: "Truy cập các lớp học đang tham gia",
    icon: BookOpen,
    path: "/student/classes",
  },
  {
    title: "Tra cứu giáo viên",
    description: "Tìm kiếm và xem thông tin giáo viên",
    icon: Search,
    path: "/student/teachers",
  },
  {
    title: "Thông tin điểm số",
    description: "Xem điểm số và kết quả học tập",
    icon: BarChart3,
    path: "/student/grades",
  },
  
  {
    title: "Bài kiểm tra",
    description: "Xem và thực hiện các bài kiểm tra",
    icon: FileCheck,
    path: "/student/exams",
  },
];

function StudentDashboard() {
  const prefetch = useRoutePrefetch()
  const navigate = useNavigate()
  const { studentName, classCount, loading, classError, error, completedExamCount, examCountLoading, examCountError, unstartedExams, unstartedExamsError } = useStudentDashboard();
  const [activeExamIndex, setActiveExamIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const activeExams = unstartedExams
  const currentExamIndex = activeExams.length ? activeExamIndex % activeExams.length : 0
  useEffect(() => {
    if (paused || activeExams.length < 2) return undefined
    const timer = window.setInterval(() => {
      setActiveExamIndex((index) => (index + 1) % activeExams.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [activeExams.length, paused])
  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="min-h-screen bg-[#F4F6F8] px-8 pb-12 pt-8">

      {/* Welcome Banner */}
      <section className="relative mb-8 overflow-hidden rounded-[25px] bg-gradient-to-r from-[#126b3c] to-[#20a84e] px-9 py-8 text-white shadow-sm">

        {/* Background decoration */}
        <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/5" />

        <div className="absolute right-24 top-10 h-28 w-28 rounded-full bg-white/10" />

        <div className="relative z-10">

          <p className="mb-2 text-sm font-medium text-white/80">
            {today}
          </p>

          <h1 className="mb-3 text-3xl font-bold">
            Xin chào, {studentName}
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-white/80">
            Chúc bạn có một buổi học hiệu quả.
            Hãy kiểm tra lịch học, điểm danh và các thông báo mới
            từ lớp của bạn.
          </p>

        </div>
      </section>

      {!unstartedExamsError && activeExams.length > 0 && (
        <section
          aria-label="Bài kiểm tra chưa làm"
          aria-roledescription="carousel"
          className="mb-8 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 shadow-sm"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
          }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-amber-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-amber-100 p-2.5 text-amber-700"><AlarmClock size={21} /></span>
              <div>
                <h2 className="font-bold text-amber-950">Bạn có bài kiểm tra chưa làm</h2>
                <p className="text-sm text-amber-800/75">{unstartedExams.length} bài đang trong thời gian có thể làm</p>
              </div>
            </div>
            {activeExams.length > 1 && (
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Bài kiểm tra trước" onClick={() => setActiveExamIndex((index) => (index - 1 + activeExams.length) % activeExams.length)} className="rounded-lg p-2 text-amber-800 hover:bg-amber-100"><ChevronLeft size={20} /></button>
                <span className="min-w-12 text-center text-xs font-semibold text-amber-800">{currentExamIndex + 1} / {activeExams.length}</span>
                <button type="button" aria-label="Bài kiểm tra tiếp theo" onClick={() => setActiveExamIndex((index) => (index + 1) % activeExams.length)} className="rounded-lg p-2 text-amber-800 hover:bg-amber-100"><ChevronRight size={20} /></button>
              </div>
            )}
          </div>
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-700 ease-in-out motion-reduce:transition-none" style={{ transform: `translateX(-${currentExamIndex * 100}%)` }}>
              {activeExams.map((exam) => {
                const target = `/student/exams/${exam.assignmentId}`
                return (
                  <article key={exam.assignmentId} aria-roledescription="slide" className="flex w-full flex-none flex-col justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-slate-900">{exam.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{exam.classes?.map((item) => item.name).join(", ") || "Bài kiểm tra được giao riêng"}</p>
                      <p className="mt-2 text-xs font-medium text-amber-800">
                        {exam.closeTime ? `Hạn làm bài: ${formatExamDateTime(exam.closeTime)}` : "Không giới hạn thời gian làm bài"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(target)}
                      onMouseEnter={() => prefetch(target)}
                      onFocus={() => prefetch(target)}
                      className="shrink-0 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    >
                      Làm bài ngay
                    </button>
                  </article>
                )
              })}
            </div>
          </div>
          {activeExams.length > 1 && (
            <div className="flex justify-center gap-1.5 pb-4" aria-label="Chọn bài kiểm tra">
              {activeExams.map((exam, index) => (
                <button key={exam.assignmentId} type="button" aria-label={`Hiện bài ${index + 1}: ${exam.title}`} aria-current={index === currentExamIndex ? "true" : undefined} onClick={() => setActiveExamIndex(index)} className={`h-1.5 rounded-full transition-all ${index === currentExamIndex ? "w-6 bg-amber-600" : "w-1.5 bg-amber-300 hover:bg-amber-400"}`} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Statistics */}
      <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* Card 1 */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm">
          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-emerald-600">
              <BookOpen
                size={24}
                className="text-emerald-600"
              />
            </div>

            <div>
              <p className="text-2xl font-bold text-emerald-700">
                {loading ? <FrogLoading compact label="" /> : classError ? "--" : classCount}
              </p>

              <p className="text-sm text-gray-400">
                Lớp đang tham gia
              </p>
            </div>

          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-6 shadow-sm">
          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-violet-600">
              <ClipboardCheck
                size={24}
                className="text-violet-600"
              />
            </div>

            <div>
              <p className="text-2xl font-bold text-violet-700">
                {examCountLoading ? <FrogLoading compact label="" /> : examCountError ? "--" : completedExamCount}
              </p>

              <p className="text-sm text-gray-400">
                Bài kiểm tra đã nộp
              </p>
            </div>

          </div>
        </div>

      </section>

      {/* Quick Access */}
      <section>

        <div className="mb-5">
          <h2 className="text-2xl font-bold text-[#102d22]">
            Học tập của tôi
          </h2>

        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          {features.map((feature) => {

            const Icon = feature.icon;
            const isImplementedRoute = [
              "/student/classes",
              "/student/teachers",
              "/student/exams",
              "/student/grades",
            ].includes(feature.path);
            const FeatureLink = isImplementedRoute ? Link : "a";
            const destinationProps = isImplementedRoute
              ? { to: feature.path }
              : { href: feature.path };

            return (
              <FeatureLink
                key={feature.title}
                {...destinationProps}
                onMouseEnter={() => { if (isImplementedRoute) prefetch(feature.path) }}
                onFocus={() => { if (isImplementedRoute) prefetch(feature.path) }}
                className="group relative rounded-2xl border border-[#dcefe3] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#a9dfbe] hover:shadow-md"
              >

                {/* Icon */}
                <div className="mb-7 flex items-start justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#effbf3]">
                    <Icon
                      size={24}
                      className="text-[#159447]"
                    />
                  </div>

                  <ArrowUpRight
                    size={20}
                    className="text-gray-300 transition group-hover:text-[#159447]"
                  />

                </div>

                <h3 className="mb-2 text-lg font-semibold text-[#102d22]">
                  {feature.title}
                </h3>

                <p className="text-sm leading-6 text-gray-400">
                  {feature.description}
                </p>

              </FeatureLink>
            );
          })}

        </div>

      </section>

      {(error || classError || examCountError || unstartedExamsError) && (
        <p role="alert" className="mt-8 text-sm text-red-600">
          {error || (classError ? "Không thể tải số lớp đang tham gia." : examCountError ? "Không thể tải số bài kiểm tra đã nộp." : "Không thể kiểm tra bài thi chưa làm.")}
        </p>
      )}

    </main>
  );
}

export default StudentDashboard;
