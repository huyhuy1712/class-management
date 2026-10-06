import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  BookOpen,
  Search,
  Send,
  BarChart3,
  Bell,
  FileCheck,
  ArrowUpRight,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import userService from "../../services/userService";
import useAuthStore from "../../stores/authStore";

const features = [
  {
    title: "Điểm danh",
    description: "Theo dõi tình trạng điểm danh của bạn",
    icon: ClipboardCheck,
    path: "/student/attendance",
  },
  {
    title: "Vào lớp học",
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
    title: "Gửi yêu cầu vào lớp",
    description: "Gửi yêu cầu tham gia một lớp học",
    icon: Send,
    path: "/student/join-request",
  },
  {
    title: "Thông tin điểm số",
    description: "Xem điểm số và kết quả học tập",
    icon: BarChart3,
    path: "/student/grades",
  },
  
  {
    title: "Làm bài kiểm tra",
    description: "Xem và thực hiện các bài kiểm tra",
    icon: FileCheck,
    path: "/student/exams",
  },
];

function StudentDashboard() {
  const storedUser = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    userService.getMyStudentDashboard()
      .then((data) => {
        if (!cancelled) {
          setDashboard(data);
          updateUser({ fullName: data.fullName });
        }
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải dữ liệu học tập.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [updateUser]);

  const studentName = dashboard?.fullName || storedUser?.fullName || "Học sinh";
  const classes = dashboard?.classes || [];
  const activeClasses = classes.filter((classroom) => classroom.status === "ACTIVE");
  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-8 pb-12 pt-[120px]">

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

      {/* Statistics */}
      <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* Card 1 */}
        <div className="rounded-2xl border border-[#dcefe3] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#effbf3]">
              <BookOpen
                size={24}
                className="text-[#159447]"
              />
            </div>

            <div>
              <p className="text-2xl font-bold text-[#102d22]">
                {loading ? "..." : activeClasses.length}
              </p>

              <p className="text-sm text-gray-400">
                Lớp đang tham gia
              </p>
            </div>

          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-[#dcefe3] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#effbf3]">
              <ClipboardCheck
                size={24}
                className="text-[#159447]"
              />
            </div>

            <div>
              <p className="text-2xl font-bold text-[#102d22]">
                {loading ? "..." : `${Math.round(dashboard?.attendanceRate || 0)}%`}
              </p>

              <p className="text-sm text-gray-400">
                Tỷ lệ điểm danh
              </p>
            </div>

          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-[#dcefe3] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#effbf3]">
              <Bell
                size={24}
                className="text-[#159447]"
              />
            </div>

            <div>
              <p className="text-2xl font-bold text-[#102d22]">
                {loading ? "..." : dashboard?.attendanceCount || 0}
              </p>

              <p className="text-sm text-gray-400">
                Buổi điểm danh
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

          <p className="mt-1 text-sm text-gray-400">
            Truy cập nhanh các chức năng dành cho học sinh
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          {features.map((feature) => {

            const Icon = feature.icon;
            const isImplementedRoute = [
              "/student/attendance",
              "/student/classes",
            ].includes(feature.path);
            const FeatureLink = isImplementedRoute ? Link : "a";
            const destinationProps = isImplementedRoute
              ? { to: feature.path }
              : { href: feature.path };

            return (
              <FeatureLink
                key={feature.title}
                {...destinationProps}
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

      {error && (
        <p role="alert" className="mt-8 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Enrolled classes */}
      <section className="mt-10">

        <div className="mb-5">
          <h2 className="text-2xl font-bold text-[#102d22]">
            Lớp học của tôi
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Các lớp học đã được ghi danh
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <p className="text-sm text-gray-500">Đang tải lớp học...</p>
          ) : activeClasses.length === 0 ? (
            <p className="text-sm text-gray-500">Bạn chưa tham gia lớp học nào.</p>
          ) : activeClasses.map((classroom) => (
            <article
              key={classroom.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#dcefe3] bg-white p-6 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#effbf3]">
                  <Users size={24} className="text-[#159447]" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-[#102d22]">
                    {classroom.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {classroom.code} · {classroom.academicYear}
                  </p>
                </div>
              </div>
              <Link
                to="/student/classes"
                className="shrink-0 rounded-xl bg-[#159447] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117c3b]"
              >
                Vào lớp
              </Link>
            </article>
          ))}
        </div>

      </section>

    </main>
  );
}

export default StudentDashboard;