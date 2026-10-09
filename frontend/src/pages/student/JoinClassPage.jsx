import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Search,
  Send,
  UserRound,
  Users,
  X,
} from "lucide-react";

import StudentDashboardLayout from "../../layouts/StudentDashboardLayout";
import classroomService from "../../services/classroomService";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showTeacherSearch, setShowTeacherSearch] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState("");
  const [classes, setClasses] = useState([]);
  const [joinedClassIds, setJoinedClassIds] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [classesError, setClassesError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      classroomService.getAll(),
      userService.getMyStudentDashboard(),
    ]).then(([classesResult, dashboardResult]) => {
      if (cancelled) return;

      if (classesResult.status === "fulfilled") {
        setClasses(classesResult.value);
      } else {
        setClassesError("Không thể tải danh sách lớp học.");
      }

      if (dashboardResult.status === "fulfilled") {
        setJoinedClassIds(
          (dashboardResult.value.classes || []).map((classroom) =>
            String(classroom.id),
          ),
        );
      } else {
        setDashboardError("Không thể kiểm tra các lớp bạn đã tham gia.");
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

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
        (classroom) => String(classroom.teacherId) === String(selectedTeacher.id),
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
    setShowTeacherSearch(true);
  };

  const handleBackToClasses = () => {
    setShowTeacherSearch(false);
    setSelectedTeacher(null);
    setTeacherSearchTerm("");
  };

  const handleSelectClass = (classroom) => {
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
      <main className="min-h-screen bg-[#f7fbf8] px-4 pb-12 pt-5 sm:px-8 sm:pt-8">
        {showTeacherSearch ? (
          <>
            <button
              type="button"
              onClick={handleBackToClasses}
              className="mb-16 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-[#102d22] transition hover:bg-white"
            >
              <ChevronLeft size={19} />
              Quay lại
            </button>

            <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
              <label
                htmlFor="teacher-search"
                className="mb-3 block font-semibold text-[#102d22]"
              >
                Xin vào lớp: Nhập email hoặc số điện thoại giáo viên
              </label>
              <div className="relative max-w-xl">
                <input
                  id="teacher-search"
                  type="search"
                  value={teacherSearchTerm}
                  onChange={(event) => {
                    setTeacherSearchTerm(event.target.value);
                    setSelectedTeacher(null);
                  }}
                  placeholder="Email hoặc số điện thoại"
                  aria-label="Email hoặc số điện thoại giáo viên"
                  className="w-full rounded-lg border border-[#dce3ee] bg-white py-3 pl-4 pr-12 text-sm text-[#102d22] outline-none transition focus:border-[#159447] focus:ring-2 focus:ring-[#159447]/10"
                />
                <Search
                  size={20}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#102d22]"
                />
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
                <div className="mt-5 max-w-xl space-y-2">
                  {matchingTeachers.length ? (
                    matchingTeachers.map((teacher) => (
                      <button
                        key={teacher.id}
                        type="button"
                        onClick={() => setSelectedTeacher(teacher)}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition hover:border-[#9bdab4] ${
                          selectedTeacher?.id === teacher.id
                            ? "border-[#159447] bg-[#effbf3]"
                            : "border-[#e5eaf0] bg-white"
                        }`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#effbf3] text-[#159447]">
                          <UserRound size={20} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-[#102d22]">
                            {getTeacherName(teacher)}
                          </span>
                          <span className="block truncate text-sm text-gray-500">
                            {teacher.email || teacher.phone}
                            {teacher.email && teacher.phone
                              ? ` · ${teacher.phone}`
                              : ""}
                          </span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="rounded-lg bg-[#f7f9fc] p-4 text-sm text-gray-500">
                      Không tìm thấy giáo viên với thông tin này.
                    </p>
                  )}
                </div>
              )}
            </section>

            {selectedTeacher && (
              <section className="mt-6 max-w-4xl">
                <h2 className="mb-3 font-semibold text-[#102d22]">
                  Lớp học của {getTeacherName(selectedTeacher)}
                </h2>
                {classesError ? (
                  <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    {classesError}
                  </p>
                ) : loading ? (
                  <p className="text-sm text-gray-500">Đang tải lớp học...</p>
                ) : selectedTeacherClasses.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedTeacherClasses.map((classroom) => (
                      <button
                        key={classroom.id}
                        type="button"
                        onClick={() => handleSelectClass(classroom)}
                        className="flex items-center gap-3 rounded-xl border border-[#dcefe3] bg-white p-4 text-left transition hover:border-[#9bdab4] hover:shadow-sm"
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
                  <p className="rounded-lg bg-white p-4 text-sm text-gray-500">
                    Giáo viên chưa có lớp học.
                  </p>
                )}
              </section>
            )}
          </>
        ) : (
          <>
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#102d22]">Vào lớp học</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Tìm lớp học phù hợp và gửi yêu cầu tham gia.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenTeacherSearch}
                className="inline-flex items-center gap-2 rounded-xl border border-[#159447] bg-white px-4 py-2.5 text-sm font-semibold text-[#159447] transition hover:bg-[#effbf3]"
              >
                <Search size={17} />
                Tìm giáo viên
              </button>
            </div>

            <section className="mb-8 rounded-2xl border border-[#dcefe3] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#effbf3]">
                  <Search size={20} className="text-[#159447]" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#102d22]">Tìm lớp học</h2>
                  <p className="text-xs text-gray-500">
                    Tìm theo tên lớp, mã lớp, môn học, năm học hoặc giáo viên
                  </p>
                </div>
              </div>

              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Nhập tên lớp, mã lớp, môn học hoặc giáo viên..."
                  aria-label="Tìm kiếm lớp học"
                  className="w-full rounded-xl border border-[#dcefe3] bg-[#f9fdfb] py-3.5 pl-12 pr-4 text-sm text-[#102d22] outline-none transition focus:border-[#159447] focus:ring-2 focus:ring-[#159447]/10"
                />
              </div>
            </section>

            <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold text-[#102d22]">Danh sách lớp học</h2>
              <p className="mt-1 text-xs text-gray-500">
                {loading
                  ? "Đang tải lớp học..."
                  : `${visibleClasses.length} lớp trong database`}
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
                  : "Chưa có lớp học nào trong hệ thống."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleClasses.map((classroom) => {
                const isJoined = joinedClassIds.includes(String(classroom.id));

                return (
                  <button
                    key={classroom.id}
                    type="button"
                    onClick={() => handleSelectClass(classroom)}
                    className="group rounded-2xl border border-[#dcefe3] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#9bdab4] hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#effbf3] text-[#159447]">
                        <BookOpen size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[#159447]">
                          {classroom.code}
                        </p>
                        <h3 className="mt-1 font-semibold text-[#102d22]">
                          {classroom.name}
                        </h3>
                        <p className="mt-2 truncate text-sm text-gray-500">
                          {classroom.subjectName || "Chưa cập nhật môn học"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf3ef] pt-4 text-xs">
                      <span className="text-gray-500">
                        {classroom.teacherName || "Chưa cập nhật giáo viên"}
                      </span>
                      <span
                        className={
                          isJoined
                            ? "font-medium text-[#159447]"
                            : classroom.status === "ACTIVE"
                              ? "text-[#159447]"
                              : "text-gray-400"
                        }
                      >
                        {isJoined
                          ? "Đã tham gia"
                          : classroom.status === "ACTIVE"
                            ? "Đang hoạt động"
                            : "Đã lưu trữ"}
                      </span>
                    </div>
                  </button>
                );
              })}
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
