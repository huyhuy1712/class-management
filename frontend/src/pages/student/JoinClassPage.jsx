import { useEffect, useState } from "react";
import {
  Search,
  User,
  BookOpen,
  Users,
  CalendarDays,
  Send,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

import StudentDashboardLayout from "../../layouts/StudentDashboardLayout";
import classroomService from "../../services/classroomService";
import userService from "../../services/userService";

function filterTeacherList(teachers, searchTerm) {
  const keyword = searchTerm.toLowerCase().trim();
  if (!keyword) return teachers;

  return teachers.filter((teacher) => {
    const searchableValues = [
      teacher.name,
      teacher.username,
      teacher.email,
      teacher.teacherCode,
      teacher.subject,
      ...teacher.classes.flatMap((classroom) => [classroom.name, classroom.code]),
    ];

    return searchableValues.some((value) =>
      value?.toLowerCase().includes(keyword),
    );
  });
}

function JoinClassPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [joinedClassIds, setJoinedClassIds] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [requestSent, setRequestSent] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      classroomService.getAll(),
      userService.getTeachers(),
    ])
      .then(([allClasses, teacherUsers]) => {
        if (cancelled) return;

        const teachersFromDatabase = teacherUsers
          .filter((teacher) => teacher.role === "TEACHER")
          .map((teacher) => {
            const teacherClasses = allClasses.filter(
              (classroom) => classroom.teacherId === teacher.id,
            );
            const subjects = [...new Set(
              teacherClasses
                .map((classroom) => classroom.subjectName)
                .filter(Boolean),
            )];

            return {
              ...teacher,
              name: teacher.fullName || teacher.username,
              subject: subjects.join(", ") || "Chưa có lớp đang mở",
              classes: teacherClasses,
            };
          });

        setTeachers(teachersFromDatabase);

        userService.getMyStudentDashboard()
          .then((dashboard) => {
            if (!cancelled) {
              setJoinedClassIds(
                (dashboard.classes || []).map((classroom) => classroom.id),
              );
            }
          })
          .catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải danh sách lớp học.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ========================================
  // TÌM GIÁO VIÊN
  // ========================================
  const filteredTeachers = filterTeacherList(teachers, searchTerm);
  const displayedTeacher = selectedTeacher || (
    searchTerm.trim() && filteredTeachers.length === 1
      ? filteredTeachers[0]
      : null
  );


  // ========================================
  // CHỌN GIÁO VIÊN
  // ========================================
  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedClass(null);
    setRequestSent(false);
    setRequestMessage("");
    setRequestError("");
  };


  // ========================================
  // CHỌN LỚP
  // ========================================
  const handleSelectClass = (classItem) => {
    setSelectedClass(classItem);
    setRequestSent(false);
    setRequestMessage("");
    setRequestError("");
  };


  // ========================================
  // GỬI YÊU CẦU
  // ========================================
  const handleSendRequest = async () => {
    if (selectedClass && joinedClassIds.includes(selectedClass.id)) return;
    if (!selectedClass) return;

    setSendingRequest(true);
    setRequestError("");

    try {
      await classroomService.requestToJoin(
        selectedClass.id,
        requestMessage.trim(),
      );
      setRequestSent(true);
    } catch (error) {
      setRequestError(
        error.response?.data?.message || "Không thể gửi yêu cầu vào lớp. Vui lòng thử lại.",
      );
    } finally {
      setSendingRequest(false);
    }
  };


  return (
    <StudentDashboardLayout>

      <main className="min-h-screen bg-[#f7fbf8] px-8 pb-12 pt-[120px]">

        {/* ===================================
            HEADER
        =================================== */}
        <div className="mb-7">

          <h1 className="text-2xl font-bold text-[#102d22]">
            Vào lớp học
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Tìm giáo viên và gửi yêu cầu tham gia lớp học
          </p>

        </div>


        {/* ===================================
            THANH TÌM KIẾM GIÁO VIÊN
        =================================== */}
        <section className="mb-6 rounded-2xl border border-[#dcefe3] bg-white p-6 shadow-sm">

          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#effbf3]">
              <Search
                size={20}
                className="text-[#159447]"
              />
            </div>

            <div>
              <h2 className="font-semibold text-[#102d22]">
                Tìm kiếm giáo viên
              </h2>

              <p className="text-xs text-gray-400">
                Tìm theo tên, username, email hoặc mã giáo viên
              </p>
            </div>

          </div>


          <div className="relative">

            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);

                // Khi tìm kiếm lại thì bỏ lựa chọn cũ
                setSelectedTeacher(null);
                setSelectedClass(null);
              }}
              placeholder="Nhập tên, email hoặc mã giáo viên..."
              className="w-full rounded-xl border border-[#dcefe3] bg-[#f9fdfb] py-3.5 pl-12 pr-4 text-sm text-[#102d22] outline-none transition focus:border-[#159447] focus:ring-2 focus:ring-[#159447]/10"
            />

          </div>

        </section>


        {/* ===================================
            KẾT QUẢ
        =================================== */}
        {!displayedTeacher ? (

          <section>

            <div className="mb-4 flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-[#102d22]">
                  Giáo viên
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  {loading
                    ? "Đang tải danh sách lớp..."
                    : `${filteredTeachers.length} giáo viên có lớp phù hợp`}
                </p>
              </div>

            </div>


            {error ? (
              <div role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            ) : loading ? (
              <div className="rounded-2xl border border-[#dcefe3] bg-white py-16 text-center text-sm text-gray-500">
                Đang tải danh sách lớp học...
              </div>
            ) : filteredTeachers.length === 0 ? (

              <div className="rounded-2xl border border-[#dcefe3] bg-white py-16 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#effbf3]">
                  <Search
                    size={25}
                    className="text-[#159447]"
                  />
                </div>

                <h3 className="mt-4 font-semibold text-[#102d22]">
                  Không tìm thấy lớp học phù hợp
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Thử từ khóa khác hoặc kiểm tra lại sau.
                </p>

              </div>

            ) : (

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

                {filteredTeachers.map((teacher) => (

                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() =>
                      handleSelectTeacher(teacher)
                    }
                    className="group rounded-2xl border border-[#dcefe3] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#9bdab4] hover:shadow-md"
                  >

                    <div className="flex items-start gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dff5e7]">
                        <User
                          size={23}
                          className="text-[#159447]"
                        />
                      </div>


                      <div className="min-w-0 flex-1">

                        <h3 className="font-semibold text-[#102d22]">
                          {teacher.name}
                        </h3>

                        <p className="mt-1 text-xs text-[#159447]">
                          {teacher.teacherCode || `ID giáo viên: ${teacher.id}`}
                        </p>

                        <p className="mt-2 flex items-center gap-1.5 truncate text-xs text-gray-400">
                          <BookOpen size={13} />
                          {teacher.subject}
                        </p>

                      </div>

                    </div>


                    <div className="mt-5 flex items-center justify-between border-t border-[#edf3ef] pt-4">

                      <span className="text-xs text-gray-400">
                        {teacher.subject}
                      </span>

                      <span className="flex items-center gap-1 text-xs font-medium text-[#159447]">
                        {teacher.classes.length} lớp
                        <span className="transition group-hover:translate-x-1">
                          →
                        </span>
                      </span>

                    </div>

                  </button>

                ))}

              </div>

            )}

          </section>

        ) : (

          /* ===================================
             GIÁO VIÊN ĐÃ CHỌN
          =================================== */
          <section>

            {/* Nút quay lại */}
            <button
              type="button"
              onClick={() => {
                setSelectedTeacher(null);
                setSelectedClass(null);
              }}
              className="mb-5 text-sm font-medium text-[#159447] hover:underline"
            >
              ← Quay lại danh sách giáo viên
            </button>


            {/* Thông tin giáo viên */}
            <div className="mb-6 rounded-2xl border border-[#dcefe3] bg-white p-6 shadow-sm">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dff5e7]">
                    <GraduationCap
                      size={27}
                      className="text-[#159447]"
                    />
                  </div>

                  <div>

                    <p className="text-xs font-medium uppercase tracking-wide text-[#159447]">
                      Giáo viên
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-[#102d22]">
                      {displayedTeacher.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                      {displayedTeacher.teacherCode || `ID giáo viên: ${displayedTeacher.id}`}
                    </p>

                  </div>

                </div>


                <div className="rounded-xl bg-[#effbf3] px-4 py-3 text-sm">

                  <span className="text-gray-400">
                    Môn phụ trách:{" "}
                  </span>

                  <span className="font-semibold text-[#159447]">
                    {displayedTeacher.subject}
                  </span>

                </div>

              </div>

            </div>


            {/* ===================================
                DANH SÁCH LỚP
            =================================== */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">


              {/* Danh sách */}
              <div>

                <div className="mb-4">

                  <h2 className="font-semibold text-[#102d22]">
                    Các lớp đang giảng dạy
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    Chọn một lớp để xem thông tin chi tiết
                  </p>

                </div>


                <div className="space-y-3">

                  {displayedTeacher.classes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#b9dfc8] bg-white p-6 text-sm text-gray-500">
                      Giáo viên này hiện chưa có lớp đang hoạt động để tham gia.
                    </div>
                  ) : displayedTeacher.classes.map((classItem) => {

                    const isSelected =
                      selectedClass?.id === classItem.id;

                    return (
                      <button
                        key={classItem.id}
                        type="button"
                        onClick={() =>
                          handleSelectClass(classItem)
                        }
                        className={`
                          w-full rounded-2xl border bg-white p-5
                          text-left transition-all
                          ${
                            isSelected
                              ? "border-[#159447] bg-[#effbf3] shadow-sm"
                              : "border-[#dcefe3] hover:border-[#9bdab4] hover:shadow-sm"
                          }
                        `}
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div className="flex items-start gap-4">

                            <div
                              className={`
                                flex h-12 w-12 shrink-0
                                items-center justify-center
                                rounded-xl
                                ${
                                  isSelected
                                    ? "bg-[#159447] text-white"
                                    : "bg-[#effbf3] text-[#159447]"
                                }
                              `}
                            >
                              <BookOpen size={22} />
                            </div>


                            <div>

                              <p className="text-xs font-medium text-[#159447]">
                                {classItem.code}
                              </p>

                              <h3 className="mt-1 font-semibold text-[#102d22]">
                                {classItem.name}
                              </h3>

                              <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1.5">
                                  <CalendarDays size={13} />
                                  Năm học {classItem.academicYear}
                                </span>
                                <span>
                                  {joinedClassIds.includes(classItem.id)
                                    ? "Đã tham gia"
                                    : classItem.status === "ACTIVE"
                                      ? "Đang hoạt động"
                                      : "Đã lưu trữ"}
                                </span>
                              </div>

                            </div>

                          </div>


                          {isSelected && (
                            <CheckCircle2
                              size={20}
                              className="shrink-0 text-[#159447]"
                            />
                          )}

                        </div>


                        {classItem.description && (
                          <p className="mt-4 border-t border-[#edf3ef] pt-3 text-xs leading-5 text-gray-500">
                            {classItem.description}
                          </p>
                        )}

                      </button>
                    );
                  })}

                </div>

              </div>


              {/* ===================================
                  CHI TIẾT LỚP
              =================================== */}
              <div>

                {!selectedClass ? (

                  <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#b9dfc8] bg-white p-8 text-center">

                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#effbf3]">
                      <BookOpen
                        size={28}
                        className="text-[#159447]"
                      />
                    </div>

                    <h3 className="mt-5 font-semibold text-[#102d22]">
                      Chọn một lớp học
                    </h3>

                    <p className="mt-2 max-w-xs text-sm leading-6 text-gray-400">
                      Chọn lớp ở danh sách bên trái để xem thông tin và gửi yêu cầu tham gia.
                    </p>

                  </div>

                ) : (

                  <div className="rounded-2xl border border-[#dcefe3] bg-white p-6 shadow-sm">

                    {/* Header */}
                    <div className="border-b border-[#edf3ef] pb-5">

                      <p className="text-xs font-medium text-[#159447]">
                        {selectedClass.code}
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-[#102d22]">
                        {selectedClass.name}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-gray-400">
                        {selectedClass.description}
                      </p>

                    </div>


                    {/* Thông tin */}
                    <div className="space-y-4 py-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#effbf3]">
                          <BookOpen
                            size={17}
                            className="text-[#159447]"
                          />
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">
                            Môn học
                          </p>

                          <p className="text-sm font-medium text-[#102d22]">
                            {displayedTeacher.subject}
                          </p>
                        </div>

                      </div>


                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#effbf3]">
                          <CalendarDays
                            size={17}
                            className="text-[#159447]"
                          />
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">
                            Năm học
                          </p>

                          <p className="text-sm font-medium text-[#102d22]">
                            {selectedClass.academicYear}
                          </p>
                        </div>

                      </div>


                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#effbf3]">
                          <Users
                            size={17}
                            className="text-[#159447]"
                          />
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">
                            Trạng thái
                          </p>

                          <p className="text-sm font-medium text-[#102d22]">
                            {joinedClassIds.includes(selectedClass.id)
                              ? "Đã tham gia"
                              : selectedClass.status === "ACTIVE"
                                ? "Đang hoạt động"
                                : "Đã lưu trữ"}
                          </p>
                        </div>

                      </div>

                    </div>


                    {/* Gửi yêu cầu */}
                    <div className="border-t border-[#edf3ef] pt-5">

                      {requestSent ? (

                        <div className="rounded-xl bg-[#effbf3] p-4">

                          <div className="flex items-start gap-3">

                            <CheckCircle2
                              size={21}
                              className="mt-0.5 shrink-0 text-[#159447]"
                            />

                            <div>

                              <p className="font-semibold text-[#145c3f]">
                                Yêu cầu đã được lưu
                              </p>

                              <p className="mt-1 text-xs leading-5 text-gray-400">
                                Yêu cầu đang chờ giáo viên xem xét.
                              </p>
                              {requestMessage.trim() && (
                                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-[#102d22]">
                                  {requestMessage}
                                </p>
                              )}

                            </div>

                          </div>

                        </div>

                      ) : (
                        <>
                          <label
                            htmlFor="join-class-message"
                            className="mb-2 block text-sm font-medium text-[#102d22]"
                          >
                            Lời nhắn cho giáo viên
                            <span className="ml-1 font-normal text-gray-400">
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
                            className="mb-4 w-full resize-y rounded-xl border border-[#dcefe3] bg-[#f9fdfb] p-3 text-sm text-[#102d22] outline-none transition placeholder:text-gray-400 focus:border-[#159447] focus:ring-2 focus:ring-[#159447]/10"
                          />
                          <p className="-mt-3 mb-4 text-right text-xs text-gray-400">
                            {requestMessage.length}/500
                          </p>
                          {requestError && (
                            <p role="alert" className="mb-4 text-sm text-red-600">
                              {requestError}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={handleSendRequest}
                            disabled={
                              sendingRequest ||
                              joinedClassIds.includes(selectedClass.id) ||
                              selectedClass.status !== "ACTIVE"
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#159447] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#117c3b] hover:shadow-md"
                          >
                            <Send size={18} />
                            {joinedClassIds.includes(selectedClass.id)
                              ? "Bạn đã tham gia lớp này"
                              : selectedClass.status !== "ACTIVE"
                                ? "Lớp đã lưu trữ"
                                : sendingRequest
                                  ? "Đang gửi..."
                                  : "Gửi yêu cầu vào lớp"}
                          </button>
                        </>
                      )}

                    </div>

                  </div>

                )}

              </div>

            </div>

          </section>

        )}

      </main>

    </StudentDashboardLayout>
  );
}


export default JoinClassPage;