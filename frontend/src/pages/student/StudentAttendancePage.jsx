import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  XCircle,
} from "lucide-react";

import attendanceService from "../../services/attendanceService";
import userService from "../../services/userService";
import StudentDashboardLayout from "../../layouts/StudentDashboardLayout";

const statusLabels = {
  PRESENT: "Có mặt",
  ABSENT: "Vắng mặt",
  LATE: "Đi muộn",
};

function formatDate(date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function StudentAttendancePage() {
  const [classes, setClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      userService.getMyStudentDashboard(),
      attendanceService.getMyAttendances(),
    ])
      .then(([dashboard, attendanceRecords]) => {
        if (cancelled) return;
        const studentClasses = dashboard.classes || [];
        setClasses(studentClasses);
        setRecords(attendanceRecords || []);
        setSelectedClassId(studentClasses[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải dữ liệu điểm danh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedClass = classes.find(
    (classroom) => classroom.id === selectedClassId,
  );
  const selectedRecords = records.filter(
    (record) => record.classroomId === selectedClassId,
  );
  const attendedCount = records.filter(
    (record) => record.status === "PRESENT" || record.status === "LATE",
  ).length;
  const attendanceRate = records.length
    ? Math.round((attendedCount / records.length) * 100)
    : 0;

  return (
    <StudentDashboardLayout>
      <main className="min-h-screen bg-[#f7fbf8] px-4 pb-12 pt-[120px] sm:px-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-[#102d22]">Điểm danh</h1>
          <p className="mt-1 text-sm text-gray-500">
            Lớp học và lịch sử điểm danh của bạn
          </p>
        </div>

        {error && (
          <p role="alert" className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#dcefe3] bg-white p-5">
            <p className="text-2xl font-bold text-[#102d22]">
              {loading ? "..." : classes.length}
            </p>
            <p className="mt-1 text-sm text-gray-500">Lớp đã tham gia</p>
          </div>
          <div className="rounded-xl border border-[#dcefe3] bg-white p-5">
            <p className="text-2xl font-bold text-[#102d22]">
              {loading ? "..." : records.length}
            </p>
            <p className="mt-1 text-sm text-gray-500">Buổi đã điểm danh</p>
          </div>
          <div className="rounded-xl border border-[#dcefe3] bg-white p-5">
            <p className="text-2xl font-bold text-[#102d22]">
              {loading ? "..." : `${attendanceRate}%`}
            </p>
            <p className="mt-1 text-sm text-gray-500">Tỷ lệ có mặt</p>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <section className="rounded-xl border border-[#dcefe3] bg-white p-5">
            <div className="mb-4 flex items-center gap-3">
              <BookOpen size={20} className="text-[#159447]" />
              <h2 className="font-semibold text-[#102d22]">Lớp học của tôi</h2>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">Đang tải lớp học...</p>
            ) : classes.length === 0 ? (
              <p className="text-sm text-gray-500">Bạn chưa tham gia lớp học nào.</p>
            ) : (
              <div className="space-y-2">
                {classes.map((classroom) => {
                  const isSelected = classroom.id === selectedClassId;
                  const classRecordCount = records.filter(
                    (record) => record.classroomId === classroom.id,
                  ).length;

                  return (
                    <button
                      key={classroom.id}
                      type="button"
                      onClick={() => setSelectedClassId(classroom.id)}
                      className={`w-full rounded-lg border p-4 text-left transition ${
                        isSelected
                          ? "border-[#159447] bg-[#effbf3]"
                          : "border-[#e5eee8] hover:border-[#a9dfbe]"
                      }`}
                    >
                      <span className="block font-semibold text-[#102d22]">
                        {classroom.name}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {classroom.code} · {classRecordCount} buổi
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#dcefe3] bg-white p-5 sm:p-7">
            {selectedClass ? (
              <>
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-[#edf3ef] pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#159447]">
                      {selectedClass.code}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-[#102d22]">
                      {selectedClass.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Năm học {selectedClass.academicYear}
                    </p>
                  </div>
                  <ClipboardCheck size={24} className="text-[#159447]" />
                </div>

                <h3 className="mb-4 font-semibold text-[#102d22]">
                  Lịch sử điểm danh
                </h3>

                {loading ? (
                  <p className="text-sm text-gray-500">Đang tải lịch sử...</p>
                ) : selectedRecords.length === 0 ? (
                  <div className="rounded-lg bg-[#f7fbf8] p-6 text-center">
                    <CalendarDays className="mx-auto mb-2 text-gray-400" size={24} />
                    <p className="text-sm text-gray-500">
                      Chưa có bản ghi điểm danh cho lớp này.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#edf3ef]">
                    {selectedRecords.map((record) => {
                      const isAbsent = record.status === "ABSENT";
                      const StatusIcon = isAbsent ? XCircle : CheckCircle2;

                      return (
                        <article
                          key={record.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
                        >
                          <div className="flex items-center gap-3">
                            <StatusIcon
                              size={20}
                              className={isAbsent ? "text-red-500" : "text-[#159447]"}
                            />
                            <div>
                              <p className="font-medium text-[#102d22]">
                                {statusLabels[record.status] || record.status}
                              </p>
                              {record.note && (
                                <p className="mt-1 text-sm text-gray-500">
                                  {record.note}
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock3 size={15} />
                            {formatDate(record.date)}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-48 items-center justify-center text-center text-sm text-gray-500">
                {loading ? "Đang tải dữ liệu điểm danh..." : "Chưa có lớp để hiển thị."}
              </div>
            )}
          </section>
        </div>
      </main>
    </StudentDashboardLayout>
  );
}

export default StudentAttendancePage;
