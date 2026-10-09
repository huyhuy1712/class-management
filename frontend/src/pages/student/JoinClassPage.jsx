import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
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

function getTeacherName(teacher) {
  return teacher.fullName || teacher.username || "Giáo viên";
}

function filterTeachers(teachers, searchTerm) {
  const keyword = searchTerm.trim().toLocaleLowerCase();
  if (!keyword) return [];

  return teachers.filter((teacher) =>
    [
      getTeacherName(teacher),
      teacher.username,
      teacher.email,
      teacher.teacherCode,
    ].some((value) =>
      String(value || "").toLocaleLowerCase().includes(keyword),
    ),
  );
}

function JoinClassPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [joinedClassIds, setJoinedClassIds] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [classesError, setClassesError] = useState("");
  const [teachersError, setTeachersError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      classroomService.getAll(),
      userService.getTeachers(),
      userService.getMyStudentDashboard(),
    ]).then(([classesResult, teachersResult, dashboardResult]) => {
      if (cancelled) return;

      if (classesResult.status === "fulfilled") {
        setClasses(classesResult.value);
      } else {
        setClassesError("Không thể tải danh sách lớp học.");
      }

      if (teachersResult.status === "fulfilled") {
        setTeachers(
          teachersResult.value.filter((teacher) => teacher.role === "TEACHER"),
        );
      } else {
        setTeachersError("Không thể tải danh sách giáo viên.");
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
    if (!selectedClass) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !sendingRequest) {
        setSelectedClass(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedClass, sendingRequest]);

  const matchingTeachers = filterTeachers(teachers, searchTerm);
  const visibleClasses = selectedTeacher
    ? classes.filter(
        (classroom) => String(classroom.teacherId) === String(selectedTeacher.id),
      )
    : classes;

  const resetClassDialog = () => {
    setSelectedClass(null);
    setRequestMessage("");
    setRequestSent(false);
    setRequestError("");
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setSelectedTeacher(null);
    resetClassDialog();
  };

  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    resetClassDialog();
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
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-[#102d22]">Vào lớp học</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tìm giáo viên, chọn lớp phù hợp và gửi yêu cầu tham gia.
          </p>
        </div>

        <section className="mb-8 rounded-2xl border border-[#dcefe3] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#effbf3]">
              <Search size={20} className="text-[#159447]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#102d22]">Tìm giáo viên</h2>
              <p className="text-xs text-gray-500">
                Tìm theo họ tên, username, email hoặc mã giáo viên
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
              placeholder="Nhập tên, email hoặc mã giáo viên..."
              aria-label="Tìm kiếm giáo viên"
              className="w-full rounded-xl border border-[#dcefe3] bg-[#f9fdfb] py-3.5 pl-12 pr-4 text-sm text-[#102d22] outline-none transition focus:border-[#159447] focus:ring-2 focus:ring-[#159447]/10"
            />
          </div>

          {teachersError && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {teachersError}
            </p>
          )}

          {searchTerm.trim() && (
            <div className="mt-5">
              <h3 className="mb-3 text-sm font-semibold text-[#102d22]">
                Giáo viên phù hợp
              </h3>
              {loading ? (
                <p className="text-sm text-gray-500">Đang tìm giáo viên...</p>
              ) : matchingTeachers.length === 0 ? (
                <p className="rounded-xl bg-[#f9fdfb] p-4 text-sm text-gray-500">
                  Không tìm thấy giáo viên phù hợp.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {matchingTeachers.map((teacher) => {
                    const teacherClasses = classes.filter(
                      (classroom) =>
                        String(classroom.teacherId) === String(teacher.id),
                    );

                    return (
                      <button
                        key={teacher.id}
                        type="button"
                        onClick={() => handleSelectTeacher(teacher)}
                        className={`rounded-xl border p-4 text-left transition hover:border-[#9bdab4] hover:shadow-sm ${
                          selectedTeacher?.id === teacher.id
                            ? "border-[#159447] bg-[#effbf3]"
                            : "border-[#dcefe3] bg-white"
                        }`}
                      >
                        <span className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dff5e7] text-[#159447]">
                            <UserRound size={21} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-[#102d22]">
                              {getTeacherName(teacher)}
                            </span>
                            <span className="mt-1 block truncate text-xs text-gray-500">
                              {teacher.email || teacher.username}
                            </span>
                            <span className="mt-2 block text-xs text-[#159447]">
                              {teacher.teacherCode || `ID giáo viên: ${teacher.id}`}
                              {" · "}
                              {teacherClasses.length} lớp
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {selectedTeacher && (
          <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#dcefe3] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dff5e7] text-[#159447]">
                <GraduationCap size={25} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#159447]">
                  Giáo viên đã chọn
                </p>
                <h2 className="font-bold text-[#102d22]">
                  {getTeacherName(selectedTeacher)}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedTeacher.email || selectedTeacher.username}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTeacher(null)}
              className="self-start rounded-lg px-3 py-2 text-sm font-medium text-[#159447] hover:bg-[#effbf3] sm:self-auto"
            >
              Xem tất cả lớp
            </button>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold text-[#102d22]">
                {selectedTeacher
                  ? `Lớp học của ${getTeacherName(selectedTeacher)}`
                  : "Tất cả lớp học"}
              </h2>
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
                {selectedTeacher
                  ? "Giáo viên này chưa có lớp học."
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
