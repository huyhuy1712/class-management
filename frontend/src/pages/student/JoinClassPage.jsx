import { sortByText } from '../../utils/sortByText'
import useStudentClassList from './hooks/useStudentClassList';
import TeacherSearchCard from './components/TeacherSearchCard';
import StudentClassSearch from './components/StudentClassSearch';
import StudentClassCard from './components/StudentClassCard';
import StudentClassStats from './components/StudentClassStats';
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Search,
  School,
  Send,
  UserRound,
  Users,
  X,
} from "lucide-react";

import StudentDashboardLayout from "../../layouts/StudentDashboardLayout";


import requestService from "../../services/requestService";
import userService from "../../services/userService";

function filterClasses(classes, searchTerm) {
  const keyword = searchTerm.trim().toLocaleLowerCase();
  if (!keyword) return classes;

  return classes.filter((classroom) =>
    [
      classroom.name,
      classroom.code,
      classroom.subjectName,
      classroom.academicYear,
      classroom.teacherName,
    ].some((value) =>
      String(value || "").toLocaleLowerCase().includes(keyword),
    ),
  );
}

function getTeacherName(teacher) {
  return teacher.fullName || teacher.username || "Giáo viên";
}

function JoinClassPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const showTeacherSearch = pathname === "/student/teachers";
  const [searchTerm, setSearchTerm] = useState("");
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState("");
  const { classes, joinedClassIds, classesError, dashboardError, pendingCount, pendingError, loading } = useStudentClassList(showTeacherSearch);

  const [selectedClass, setSelectedClass] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestError, setRequestError] = useState("");
  useEffect(() => {
    if (!showTeacherSearch || teachers.length > 0) return undefined;

    let cancelled = false;

    userService.getTeachers()
      .then((results) => {
        if (!cancelled) {
          setTeachers(results.filter((teacher) => teacher.role === "TEACHER"));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTeachersError("Không thể tải danh sách giáo viên.");
        }
      })
      .finally(() => {
        if (!cancelled) setTeachersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showTeacherSearch, teachers.length]);

  useEffect(() => {
    if (!selectedClass) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !sendingRequest) {
        setSelectedClass(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedClass, sendingRequest]);

  const visibleClasses = filterClasses(classes, searchTerm);
  const matchingTeachers = teachers.filter((teacher) => {
    const keyword = teacherSearchTerm.trim().toLocaleLowerCase();
    if (!keyword) return false;

    const teacherCode = String(teacher.teacherCode || "").trim();
    return teacherCode.toLocaleLowerCase() === keyword;
  });
  const selectedTeacherClasses = selectedTeacher
    ? classes.filter(
        (classroom) => classroom.status === "ACTIVE" && String(classroom.teacherId) === String(selectedTeacher.id),
      )
    : [];

  const resetClassDialog = () => {
    setSelectedClass(null);
    setRequestMessage("");
    setRequestSent(false);
    setRequestError("");
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    resetClassDialog();
  };

  const handleOpenTeacherSearch = () => {
    setSelectedTeacher(null);
    setTeacherSearchTerm("");
    setTeachersLoading(teachers.length === 0);
    setTeachersError("");
    navigate("/student/teachers");
  };

  const handleBackToClasses = () => {
    navigate("/student/classes");
    setSelectedTeacher(null);
    setTeacherSearchTerm("");
  };

  const handleSelectClass = (classroom) => {
    if (classroom.status !== 'ACTIVE') return;
    if (joinedClassIds.includes(String(classroom.id))) {
      navigate(`/student/classes/${classroom.id}`);
      return;
    }
    setSelectedClass(classroom);
    setRequestMessage("");
    setRequestSent(false);
    setRequestError("");
  };

  const handleSendRequest = async (event) => {
    event.preventDefault();
    if (!selectedClass || sendingRequest || requestSent) return;

    setSendingRequest(true);
    setRequestError("");

    try {
      await requestService.createJoinClassRequest(
        selectedClass.id,
        requestMessage.trim(),
      );
      setRequestSent(true);
    } catch (error) {
      setRequestError(
        error.response?.data?.message ||
          "Không thể gửi yêu cầu vào lớp. Vui lòng thử lại.",
      );
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <StudentDashboardLayout>
      <main className="min-h-screen bg-[#F4F6F8] px-4 pb-12 pt-5 sm:px-8 sm:pt-8">
        {showTeacherSearch ? (
          <>
            <button
              type="button"
              onClick={handleBackToClasses}
              className="mb-5 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#102d22] transition hover:bg-white hover:text-[#159447]"
            >
              <ChevronLeft size={19} />
              Quay lại danh sách lớp
            </button>

            <section className="relative overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-sm sm:p-8">
              <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-emerald-100/60" />
              <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-sky-100/50" />
              <div className="relative max-w-3xl">
                <div className="mb-5 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                    <UserRound size={27} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                      Tham gia lớp học
                    </p>
                    <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#102d22] sm:text-3xl">
                      Tìm giáo viên của bạn
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                      Nhập mã giáo viên để xem các lớp đang mở và gửi yêu cầu tham gia.
                    </p>
                  </div>
                </div>

                <label
                  htmlFor="teacher-search"
                  className="mb-2 block text-sm font-bold text-[#102d22]"
                >
                  Mã giáo viên
                </label>
                <div className="relative max-w-2xl">
                <input
                  id="teacher-search"
                  type="search"
                  value={teacherSearchTerm}
                  onChange={(event) => {
                    setTeacherSearchTerm(event.target.value);
                    setSelectedTeacher(null);
                  }}
                  placeholder="Nhập mã giáo viên..."
                  aria-label="Mã giáo viên"
                  className="w-full rounded-2xl border border-emerald-200 bg-white py-3.5 pl-4 pr-12 text-sm text-[#102d22] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#159447] focus:ring-4 focus:ring-[#159447]/10"
                />
                <Search
                  size={20}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#102d22]"
                />
              </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Tìm kiếm nhanh theo mã
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen size={14} className="text-sky-600" />
                    Chọn lớp để gửi yêu cầu
                  </span>
                </div>
              </div>

              {teachersError && (
                <p role="alert" className="mt-4 text-sm text-red-700">
                  {teachersError}
                </p>
              )}
              {teachersLoading && (
                <p className="mt-4 text-sm text-gray-500">
                  Đang tìm giáo viên...
                </p>
              )}
              {!teachersLoading && teacherSearchTerm.trim() && (
                <div className="relative mt-5 max-w-2xl space-y-2">
                  {matchingTeachers.length ? (
                    sortByText(matchingTeachers, (item) => item.fullName).map((teacher) => (
                      <TeacherSearchCard
                        key={teacher.id}
                        teacher={teacher}
                        selected={selectedTeacher?.id === teacher.id}
                        onSelect={setSelectedTeacher}
                      />
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-600">
                      Không tìm thấy giáo viên với thông tin này.
                    </p>
                  )}
                </div>
              )}
            </section>

            {selectedTeacher && (
              <section className="mt-6 max-w-4xl rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Lớp học đang phụ trách
                    </p>
                    <h2 className="font-bold text-[#102d22]">
                      {getTeacherName(selectedTeacher)}
                    </h2>
                  </div>
                </div>
                {classesError ? (
                  <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    {classesError}
                  </p>
                ) : loading ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Đang tải lớp học...</p>
                ) : selectedTeacherClasses.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sortByText(selectedTeacherClasses, (item) => item.name).map((classroom) => (
                      <button
                        key={classroom.id}
                        type="button"
                        onClick={() => handleSelectClass(classroom)}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-[#9bdab4] hover:bg-emerald-50/40 hover:shadow-sm"
                      >
                        <BookOpen size={20} className="shrink-0 text-[#159447]" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-[#102d22]">
                            {classroom.name}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {classroom.code} · {classroom.subjectName || "Chưa cập nhật môn học"}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    Giáo viên chưa có lớp học.
                  </p>
                )}
              </section>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-emerald-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <School size={24} />
                </div>
                <div>
                <h1 className="text-2xl font-bold text-[#102d22]">Lớp học</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Tìm lớp học phù hợp và gửi yêu cầu tham gia.
                </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleOpenTeacherSearch}
                className="inline-flex items-center gap-2 rounded-xl border border-[#159447] bg-white px-4 py-2.5 text-sm font-semibold text-[#159447] transition hover:bg-[#effbf3]"
              >
                <Search size={17} />
                Tìm giáo viên
              </button>
              </div>
            </div>

            <StudentClassStats joinedCount={new Set(joinedClassIds).size} pendingCount={pendingCount} pendingError={pendingError} loading={loading} error={dashboardError} />

            <StudentClassSearch value={searchTerm} onChange={handleSearchChange} />

            <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold text-[#102d22]">Danh sách lớp học</h2>
              <p className="mt-1 text-xs text-gray-500">
                {loading
                  ? "Đang tải lớp học..."
                  : <>Hiển thị <span className="font-semibold text-[#18301D]">{visibleClasses.length}</span> / {classes.length} lớp</>}
              </p>
            </div>
            <span className="hidden items-center gap-2 text-xs text-gray-500 sm:flex">
              <Users size={15} />
              Chọn lớp để xem chi tiết
            </span>
          </div>

          {classesError ? (
            <div role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-700">
              {classesError}
            </div>
          ) : loading ? (
            <div className="rounded-2xl border border-[#dcefe3] bg-white py-16 text-center text-sm text-gray-500">
              Đang tải danh sách lớp học...
            </div>
          ) : visibleClasses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#b9dfc8] bg-white py-14 text-center">
              <BookOpen className="mx-auto text-[#159447]" size={28} />
              <p className="mt-3 font-medium text-[#102d22]">
                {searchTerm.trim()
                  ? "Không tìm thấy lớp học phù hợp."
                  : "Bạn chưa tham gia lớp học nào."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortByText(visibleClasses, (item) => item.name).map((classroom) => (
                <StudentClassCard
                  key={classroom.id}
                  classroom={classroom}
                  isJoined={joinedClassIds.includes(String(classroom.id))}
                  onView={handleSelectClass}
                />
              ))}
            </div>
          )}
            </section>

            {dashboardError && (
              <p role="alert" className="mt-4 text-sm text-amber-700">
                {dashboardError}
              </p>
            )}
          </>
        )}

        {selectedClass && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !sendingRequest) {
                resetClassDialog();
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="join-class-dialog-title"
              className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <header className="flex items-start justify-between border-b border-[#edf3ef] p-5 sm:p-6">
                <div>
                  <p className="text-xs font-medium text-[#159447]">
                    {selectedClass.code}
                  </p>
                  <h2
                    id="join-class-dialog-title"
                    className="mt-1 text-xl font-bold text-[#102d22]"
                  >
                    {selectedClass.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedClass.teacherName || "Chưa cập nhật giáo viên"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetClassDialog}
                  disabled={sendingRequest}
                  aria-label="Đóng thông tin lớp"
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="space-y-4 p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#f7fbf8] p-4">
                    <p className="text-xs text-gray-500">Môn học</p>
                    <p className="mt-1 font-medium text-[#102d22]">
                      {selectedClass.subjectName || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#f7fbf8] p-4">
                    <p className="flex items-center gap-2 text-xs text-gray-500">
                      <CalendarDays size={14} />
                      Năm học
                    </p>
                    <p className="mt-1 font-medium text-[#102d22]">
                      {selectedClass.academicYear || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                {selectedClass.description && (
                  <div>
                    <p className="text-xs text-gray-500">Mô tả</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#102d22]">
                      {selectedClass.description}
                    </p>
                  </div>
                )}

                {joinedClassIds.includes(String(selectedClass.id)) ? (
                  <div className="rounded-xl bg-[#effbf3] p-4 text-sm font-medium text-[#145c3f]">
                    Bạn đã tham gia lớp học này.
                  </div>
                ) : selectedClass.status !== "ACTIVE" ? (
                  <div className="rounded-xl bg-gray-100 p-4 text-sm text-gray-600">
                    Lớp học đã lưu trữ và không nhận yêu cầu tham gia.
                  </div>
                ) : requestSent ? (
                  <div className="flex gap-3 rounded-xl bg-[#effbf3] p-4">
                    <CheckCircle2
                      size={21}
                      className="shrink-0 text-[#159447]"
                    />
                    <div>
                      <p className="font-semibold text-[#145c3f]">
                        Đã gửi yêu cầu tham gia lớp
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Giáo viên sẽ xem xét yêu cầu của bạn.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendRequest}>
                    <label
                      htmlFor="join-class-message"
                      className="mb-2 block text-sm font-medium text-[#102d22]"
                    >
                      Lời nhắn cho giáo viên{" "}
                      <span className="font-normal text-gray-500">
                        (không bắt buộc)
                      </span>
                    </label>
                    <textarea
                      id="join-class-message"
                      value={requestMessage}
                      onChange={(event) => setRequestMessage(event.target.value)}
                      maxLength={500}
                      rows={4}
                      placeholder="Nhập lời nhắn khi xin tham gia lớp..."
                      className="w-full resize-y rounded-xl border border-[#dcefe3] bg-[#f9fdfb] p-3 text-sm text-[#102d22] outline-none transition placeholder:text-gray-400 focus:border-[#159447] focus:ring-2 focus:ring-[#159447]/10"
                    />
                    <p className="mt-1 text-right text-xs text-gray-500">
                      {requestMessage.length}/500
                    </p>
                    {requestError && (
                      <p role="alert" className="mt-3 text-sm text-red-700">
                        {requestError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={sendingRequest}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#159447] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#117c3b] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send size={17} />
                      {sendingRequest ? "Đang gửi..." : "Gửi yêu cầu vào lớp"}
                    </button>
                  </form>
                )}
              </div>

              {requestSent && (
                <footer className="border-t border-[#edf3ef] p-5 text-right sm:px-6">
                  <button
                    type="button"
                    onClick={resetClassDialog}
                    className="rounded-xl bg-[#159447] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#117c3b]"
                  >
                    Đóng
                  </button>
                </footer>
              )}
            </section>
          </div>
        )}
      </main>
    </StudentDashboardLayout>
  );
}

export default JoinClassPage;
