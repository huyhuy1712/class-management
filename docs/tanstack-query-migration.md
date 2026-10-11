# Chuyển FE sang TanStack Query trên nhánh AH

Axios/service tiếp tục gọi API; Query quản lý cache server; Zustand giữ đăng nhập và state UI. Form/draft, timer và bộ lọc giữ state riêng. Không sửa BE trong lượt này.

Cache mặc định fresh 60 giây và giữ 10 phút sau khi không còn observer. Môn học fresh 30 phút. Thông báo/request/lesson fresh 15 giây, polling 60 giây khi đang quan sát và refresh khi focus nếu stale. Quay lại trang dùng cache; chỉ màn hình chưa có dữ liệu mới có loading ban đầu. Khi refresh nền lỗi, dữ liệu đã có vẫn được giữ.

Key chứa role, tài khoản và phiên. Đăng nhập/logout hủy queries, clear cache, tăng phiên. Các GET nhận AbortSignal. Response API và setter cache của phiên cũ bị chặn. Không persist dữ liệu server ra localStorage.

Read/delete thông báo cập nhật optimistic và rollback nếu thất bại. Với điểm danh, giao đề, approve/reject và các thao tác ghi khác, chỉ xác nhận thành công sau response BE. API layer invalidate các query liên quan sau write thành công; không chờ refetch để hoàn tất thao tác UI.

Danh sách đề học sinh vẫn dùng preview đã được yêu cầu trước đó; không tự tạo API BE mới.

## Vị trí cụ thể

| File và dòng | Thay đổi |
| --- | --- |
| [frontend/package.json](</D:/class-management/frontend/package.json:15>) | Thêm dependency TanStack Query; package-lock.json cập nhật phiên bản khóa. |
| [frontend/src/main.jsx](</D:/class-management/frontend/src/main.jsx:12>) | Bọc ứng dụng bằng QueryClientProvider dùng một client ổn định. |
| [frontend/src/query/queryClient.js](</D:/class-management/frontend/src/query/queryClient.js:3>) | Cache 60 giây, giữ 10 phút; không retry lỗi quyền/validation hoặc mutation. Reset phiên, hủy query và chặn ghi cache cũ. |
| [frontend/src/query/queryKeys.js](</D:/class-management/frontend/src/query/queryKeys.js:1>) | Key chứa vai trò, ID tài khoản, phiên đăng nhập, resource và tham số lớp/đề/ngày. |
| [frontend/src/query/useResourceQuery.js](</D:/class-management/frontend/src/query/useResourceQuery.js:7>) | Hook truy vấn chung; setter cập nhật cache từ response; chỉ loading toàn phần khi chưa có dữ liệu. |
| [frontend/src/query/resourceOptions.js](</D:/class-management/frontend/src/query/resourceOptions.js:10>) | Registry queryFn tái sử dụng service Axios; truyền AbortSignal. Lesson/thông báo/request fresh 15 giây, polling 60 giây; môn học 30 phút. |
| [frontend/src/query/mutationResources.js](</D:/class-management/frontend/src/query/mutationResources.js:2>) | Phân loại write API và invalidate đúng resource; giới hạn điểm danh/lesson theo lớp và chi tiết đề theo examId. |
| [frontend/src/query/notificationUpdates.js](</D:/class-management/frontend/src/query/notificationUpdates.js:1>) | Helper optimistic read/delete và rollback có xử lý xóa toàn bộ thành công một phần. |
| [frontend/src/query/useRoutePrefetch.js](</D:/class-management/frontend/src/query/useRoutePrefetch.js:16>) | Tải trước query khi hover/focus menu; chỉ lấy tài khoản hiện tại lúc tương tác. |
| [frontend/src/services/api.js](</D:/class-management/frontend/src/services/api.js:22>) | Chặn response của phiên cũ; write thành công làm mới query liên quan ở nền sau khi caller cập nhật cache. |
| [frontend/src/stores/authStore.js](</D:/class-management/frontend/src/stores/authStore.js:34>) | Reset cache khi đăng nhập/đổi tài khoản và logout; profile UI vẫn dùng Zustand. |
| [frontend/src/services/classroomService.js](</D:/class-management/frontend/src/services/classroomService.js:4>) | Các GET lớp và học sinh nhận options để truyền signal. |
| [frontend/src/services/userService.js](</D:/class-management/frontend/src/services/userService.js:4>) | GET lớp/dashboard/count và danh sách người dùng nhận options/signal. |
| [frontend/src/services/examService.js](</D:/class-management/frontend/src/services/examService.js:8>) | GET list/detail/configuration nhận options/signal; payload write hiện có được giữ. |
| [frontend/src/services/attendanceService.js](</D:/class-management/frontend/src/services/attendanceService.js:8>) | GET lịch sử điểm danh nhận options/signal. |
| [frontend/src/services/lessonService.js](</D:/class-management/frontend/src/services/lessonService.js:4>) | GET lesson giữ params.date, thêm signal. |
| [frontend/src/services/notificationService.js](</D:/class-management/frontend/src/services/notificationService.js:4>) | GET nhận signal; write cho phép optimistic hook tự invalidate để tránh request trùng. |
| [frontend/src/services/requestService.js](</D:/class-management/frontend/src/services/requestService.js:8>) | GET yêu cầu lớp nhận options/signal. |
| [frontend/src/services/subjectService.js](</D:/class-management/frontend/src/services/subjectService.js:4>) | GET môn học nhận options/signal. |
| [frontend/src/components/dashboard/Sidebar.jsx](</D:/class-management/frontend/src/components/dashboard/Sidebar.jsx:94>) | Prefetch dữ liệu trang giáo viên từ menu. |
| [frontend/src/components/dashboard/StudentSidebar.jsx](</D:/class-management/frontend/src/components/dashboard/StudentSidebar.jsx:111>) | Prefetch dữ liệu trang học sinh từ menu. |
| [frontend/src/components/dashboard/FeatureCard.jsx](</D:/class-management/frontend/src/components/dashboard/FeatureCard.jsx:16>) | Prefetch dữ liệu trước khi mở thẻ chức năng. |
| [frontend/src/pages/teacher/classroom/hooks/useClassrooms.js](</D:/class-management/frontend/src/pages/teacher/classroom/hooks/useClassrooms.js:16>) | Danh sách lớp và các response create/update/archive/delete dùng cache chung. |
| [frontend/src/pages/teacher/classroom/hooks/useTeacherClassDetail.js](</D:/class-management/frontend/src/pages/teacher/classroom/hooks/useTeacherClassDetail.js:4>) | Dùng danh sách lớp giáo viên đã cache, chia sẻ query học sinh với StudentsTab; số lượng lấy từ query. |
| [frontend/src/pages/teacher/classroom/ClassroomDetailPage.jsx](</D:/class-management/frontend/src/pages/teacher/classroom/ClassroomDetailPage.jsx:11>) | Tách tải dữ liệu lớp sang hook, bỏ GET toàn bộ lớp và waterfall tải lại học sinh. |
| [frontend/src/pages/teacher/classroom/tabs/StudentsTab.jsx](</D:/class-management/frontend/src/pages/teacher/classroom/tabs/StudentsTab.jsx:51>) | Danh sách học sinh dùng cache; các thao tác cập nhật cache, import tự làm mới query liên quan. |
| [frontend/src/pages/teacher/classroom/tabs/AttendanceTab.jsx](</D:/class-management/frontend/src/pages/teacher/classroom/tabs/AttendanceTab.jsx:41>) | Lịch sử điểm danh dùng cache; đánh vắng cập nhật response vào bảng trước khi tải nền. |
| [frontend/src/pages/teacher/classroom/StudentDetailPage.jsx](</D:/class-management/frontend/src/pages/teacher/classroom/StudentDetailPage.jsx:22>) | Chia sẻ lịch sử điểm danh với tab lớp, lọc học sinh tại UI. |
| [frontend/src/pages/teacher/classroom/modals/ClassroomFormModal.jsx](</D:/class-management/frontend/src/pages/teacher/classroom/modals/ClassroomFormModal.jsx:60>) | Danh sách môn học dùng cache; form nhập liệu giữ state riêng. |
| [frontend/src/pages/teacher/classroom/tabs/students/modals/AddStudentModal.jsx](</D:/class-management/frontend/src/pages/teacher/classroom/tabs/students/modals/AddStudentModal.jsx:16>) | Danh sách tìm học sinh dùng query khi mở modal. |
| [frontend/src/pages/teacher/classroom/tabs/students/modals/ImportStudentsModal.jsx](</D:/class-management/frontend/src/pages/teacher/classroom/tabs/students/modals/ImportStudentsModal.jsx:133>) | Callback cập nhật sau import là tùy chọn; API layer đã invalidate cache học sinh. |
| [frontend/src/pages/teacher/classroom/tabs/attendance/useAttendanceSession.js](</D:/class-management/frontend/src/pages/teacher/classroom/tabs/attendance/useAttendanceSession.js:13>) | Dùng query lesson chung, kiểm tra mới khi mở phiên; create/update vẫn chờ BE. |
| [frontend/src/pages/teacher/TeacherDashboard.jsx](</D:/class-management/frontend/src/pages/teacher/TeacherDashboard.jsx:53>) | Dashboard dùng chung cache lớp/học sinh; không hiển thị 0 giả khi chưa tải. |
| [frontend/src/pages/teacher/hooks/useTeacherExamCount.js](</D:/class-management/frontend/src/pages/teacher/hooks/useTeacherExamCount.js:3>) | Count đề thi dùng cùng query với trang danh sách. |
| [frontend/src/pages/student/hooks/useStudentClassList.js](</D:/class-management/frontend/src/pages/student/hooks/useStudentClassList.js:3>) | Lớp đã tham gia, lớp tìm giáo viên và dashboard tải độc lập; không chờ tất cả để hiện lớp. |
| [frontend/src/pages/student/hooks/useStudentDashboard.js](</D:/class-management/frontend/src/pages/student/hooks/useStudentDashboard.js:5>) | Dùng chung cache lớp/dashboard/count; cập nhật tên vào Zustand khi đổi. |
| [frontend/src/pages/student/JoinClassPage.jsx](</D:/class-management/frontend/src/pages/student/JoinClassPage.jsx:55>) | Danh sách giáo viên dùng cache; tạo request cập nhật query liên quan ở nền. |
| [frontend/src/pages/student/classroom/hooks/useStudentClassDetail.js](</D:/class-management/frontend/src/pages/student/classroom/hooks/useStudentClassDetail.js:3>) | Thông tin và kiểm tra active dùng query lớp; count học sinh tải riêng. |
| [frontend/src/pages/student/classroom/hooks/useStudentAttendance.js](</D:/class-management/frontend/src/pages/student/classroom/hooks/useStudentAttendance.js:8>) | Lịch sử dùng cache theo lớp/tài khoản; lọc học sinh hiện tại, count theo ngày và cập nhật response POST thành công. |
| [frontend/src/pages/student/hooks/useAttendanceAvailability.js](</D:/class-management/frontend/src/pages/student/hooks/useAttendanceAvailability.js:9>) | useQueries chia sẻ lesson; giữ tính giờ hiện tại; refresh/focus do Query quản lý. |
| [frontend/src/pages/student/hooks/useStudentAttendanceOverview.js](</D:/class-management/frontend/src/pages/student/hooks/useStudentAttendanceOverview.js:8>) | Trang điểm danh tổng hợp dùng API lớp và query lịch sử theo lớp, chỉ lấy bản ghi của tài khoản hiện tại. |
| [frontend/src/pages/student/StudentAttendancePage.jsx](</D:/class-management/frontend/src/pages/student/StudentAttendancePage.jsx:30>) | Bỏ gọi method getMyAttendances không tồn tại; dữ liệu qua hook cache. |
| [frontend/src/components/dashboard/NotificationBell.jsx](</D:/class-management/frontend/src/components/dashboard/NotificationBell.jsx:20>) | Yêu cầu của giáo viên chia sẻ cache; approve/reject cập nhật danh sách sau khi server xác nhận. |
| [frontend/src/components/dashboard/hooks/useStudentNotifications.js](</D:/class-management/frontend/src/components/dashboard/hooks/useStudentNotifications.js:13>) | Đọc/xóa phản hồi optimistic; rollback khi lỗi; xóa toàn bộ chỉ khôi phục các mục chưa xóa được. |
| [frontend/src/pages/profile/hooks/useProfileActivity.js](</D:/class-management/frontend/src/pages/profile/hooks/useProfileActivity.js:3>) | Hồ sơ dùng cache lớp và count thay vì gọi lại API. |
| [frontend/src/pages/teacher/exams/hooks/useExams.jsx](</D:/class-management/frontend/src/pages/teacher/exams/hooks/useExams.jsx:3>) | Query danh sách đề, không che bảng khi refetch nền. |
| [frontend/src/pages/teacher/exams/hooks/useExamResource.js](</D:/class-management/frontend/src/pages/teacher/exams/hooks/useExamResource.js:3>) | Query detail/configuration theo examId; retry thủ công không xóa nội dung cũ. |
| [frontend/src/pages/teacher/exams/hooks/useExamTargetOptions.js](</D:/class-management/frontend/src/pages/teacher/exams/hooks/useExamTargetOptions.js:4>) | Hook dùng chung môn học/lớp/học sinh cho cả tạo và sửa đề; giữ lọc active và count. |
| [frontend/src/pages/teacher/exams/create/CreateExamPage.jsx](</D:/class-management/frontend/src/pages/teacher/exams/create/CreateExamPage.jsx:23>) | Thay effect tải options bằng hook; chặn tiếp tục khi dữ liệu mục tiêu lỗi/chưa tải. |
| [frontend/src/pages/teacher/exams/components/EditExamModal.jsx](</D:/class-management/frontend/src/pages/teacher/exams/components/EditExamModal.jsx:19>) | Sửa cấu hình dùng các query options chung; draft/form nhập không chuyển vào Query. |
| [frontend/src/pages/teacher/exams/modals/EditExamModal.jsx](</D:/class-management/frontend/src/pages/teacher/exams/modals/EditExamModal.jsx:15>) | Modal sửa cũ cũng dùng cache môn học. |
| [frontend/src/pages/teacher/exams/ExamManagementPage.jsx](</D:/class-management/frontend/src/pages/teacher/exams/ExamManagementPage.jsx:104>) | Xóa thành công cập nhật cache ngay, không chờ thêm GET; sửa dùng response để cập nhật hàng. |
| [frontend/src/pages/student/exams/hooks/useStudentExams.js](</D:/class-management/frontend/src/pages/student/exams/hooks/useStudentExams.js:8>) | Danh sách đề mẫu/API loader dùng useQuery; key preview riêng; bộ lọc vẫn là state UI. |
| [frontend/src/pages/student/exams/hooks/useStudentExamClasses.js](</D:/class-management/frontend/src/pages/student/exams/hooks/useStudentExamClasses.js:3>) | Select lớp dùng query studentClasses chung. |
| [frontend/src/pages/student/exams/StudentExamListPage.jsx](</D:/class-management/frontend/src/pages/student/exams/StudentExamListPage.jsx:12>) | Phân biệt cache preview và danh sách được giao; mock trước đó vẫn giữ đến khi có API học sinh. |
| [frontend/src/routes/AppRoutes.jsx](</D:/class-management/frontend/src/routes/AppRoutes.jsx:18>) | Lazy load detail/builder để không tải trình soạn đề trong bundle ban đầu. |
| [frontend/tests/queryCache.test.js](</D:/class-management/frontend/tests/queryCache.test.js:12>) | 7 kiểm tra cache/request chung, refetch nền, tách account/role/class, logout/cancel, invalidation, optimistic rollback và retry. |

## Kiểm tra

- Build Vite thành công; exam builder được tách thành chunk riêng khoảng 882 KB chưa nén.
- Toàn bộ 54 tests pass, trong đó 7 tests mới về cache và mutation.
- Lint src: 0 error; còn warnings ở các form/effect và code hiện có.
- Chưa đo latency trên production hoặc kiểm tra với DB thật. Request lần đầu và API ghi vẫn cần thời gian server xử lý.

## Cách thêm truy vấn sau này

Thêm reader trong resourceOptions.js rồi gọi useResourceQuery(resource, params). Các thành phần dùng cùng resource/params tự chia sẻ dữ liệu. Nếu thêm API write, bổ sung mapping trong mutationResources.js; với optimistic mutation riêng có thể truyền skipQueryInvalidation và tự invalidate sau khi settled. Dữ liệu riêng tài khoản không được dùng query key chung thiếu accountScope.


## Chuyển thao tác ghi sang useMutation cho teacher và student

Đã sửa ngay các hook/component cũ, không thêm service hoặc dependency. Thao tác gọi một tham số truyền trực tiếp service vào mutationFn; thao tác nhiều tham số dùng một mảng đối số, giữ nguyên hợp đồng API. Dùng isPending thay state saving/deleting/busy và bỏ các setter/finally chỉ để bật tắt loading. Form, validation, modal và thông báo vẫn là state UI. Thông báo HS đã dùng mutation ở lượt trước và giữ nguyên.

Axios layer hiện có tiếp tục invalidate cache sau write thành công; không thêm invalidate trùng trong từng mutation. API lỗi không làm mất dữ liệu cache. Không tự retry mutation, đặc biệt tạo đề và điểm danh. Hai luồng lưu đề bao toàn bộ tải media trước khi POST/PUT; không mở lại nút trong lúc tải ảnh. Luồng HS đi trễ vẫn chờ lý do rồi gửi lại; chỉ báo thành công sau xác nhận BE.

Student logout trước đây chỉ xóa state FE; hiện cũng gọi service logout có sẵn để đóng cookie session, đồng thời giữ xóa cache theo tài khoản. Danh sách/làm đề thi HS vẫn theo trạng thái tích hợp API hiện có, không tự bổ sung API hay giả lập POST mới.

| File và dòng | Thay đổi của lượt useMutation |
| --- | --- |
| [useClassrooms.js](</D:/class-management/frontend/src/pages/teacher/classroom/hooks/useClassrooms.js:15>) | Tạo, sửa, vô hiệu và xóa lớp; pending thay thế các state loading riêng. |
| [useTeacherClassDetail.js](</D:/class-management/frontend/src/pages/teacher/classroom/hooks/useTeacherClassDetail.js:6>) | Kích hoạt lớp qua mutation; truyền pending cho tab học sinh. |
| [StudentsTab.jsx](</D:/class-management/frontend/src/pages/teacher/classroom/tabs/StudentsTab.jsx:49>) | Thêm/xóa học sinh, xóa toàn bộ và điểm danh thủ công; dùng pending của mutation. |
| [AttendanceTab.jsx](</D:/class-management/frontend/src/pages/teacher/classroom/tabs/AttendanceTab.jsx:40>) | Đánh vắng và xuất Excel; giữ cập nhật cache sau thành công. |
| [useAttendanceActions.js](</D:/class-management/frontend/src/pages/teacher/classroom/tabs/attendance/useAttendanceActions.js:10>) | Sửa/xóa bản ghi điểm danh; giữ thông báo lỗi và modal hiện có. |
| [useAttendanceSession.js](</D:/class-management/frontend/src/pages/teacher/classroom/tabs/attendance/useAttendanceSession.js:14>) | Tạo/cập nhật phiên; kiểm tra tải phiên hoàn tất trước khi gửi. |
| [ImportStudentsModal.jsx](</D:/class-management/frontend/src/pages/teacher/classroom/tabs/students/modals/ImportStudentsModal.jsx:42>) | Import Excel và tải mẫu; bỏ state importing/downloading riêng. |
| [useUpdateExam.js](</D:/class-management/frontend/src/pages/teacher/exams/hooks/useUpdateExam.js:15>) | Sửa đề qua mutation và giữ mapping lỗi từ BE. |
| [useDeleteExam.jsx](</D:/class-management/frontend/src/pages/teacher/exams/hooks/useDeleteExam.jsx:36>) | Xóa đề qua mutation; giữ xác nhận xóa cưỡng chế khi BE trả 409. |
| [useSaveExamConfiguration.js](</D:/class-management/frontend/src/pages/teacher/exams/hooks/useSaveExamConfiguration.js:8>) | Lưu cấu hình; giữ lỗi từng field và khóa gửi trùng. |
| [ExamManagementPage.jsx](</D:/class-management/frontend/src/pages/teacher/exams/ExamManagementPage.jsx:24>) | Mutation xóa đề; cập nhật cache danh sách sau BE xác nhận. |
| [useSubmitAttendance.js](</D:/class-management/frontend/src/pages/student/classroom/hooks/useSubmitAttendance.js:6>) | Mutation điểm danh HS; giữ bước mật khẩu → lý do trễ, thông báo thành công và khóa gửi trùng. |
| [JoinClassPage.jsx](</D:/class-management/frontend/src/pages/student/JoinClassPage.jsx:51>) | Gửi yêu cầu tham gia qua mutation; pending thay sendingRequest. |
| [AccountProfilePage.jsx](</D:/class-management/frontend/src/pages/profile/AccountProfilePage.jsx:29>) | Cập nhật hồ sơ, ảnh, xóa ảnh, đổi mật khẩu cho cả hai vai trò; pending tải ảnh gồm bước tối ưu ảnh. |
| [NotificationBell.jsx](</D:/class-management/frontend/src/components/dashboard/NotificationBell.jsx:20>) | Duyệt/từ chối qua mutation; ID đang xử lý lấy từ variables thay state riêng. |
| [useSaveExam.js](</D:/class-management/frontend/src/pages/teacher/exams/builder/hooks/useSaveExam.js:16>) | Mutation bao toàn bộ kiểm tra/tải media/lưu đề; giữ draft và cơ chế xử lý kết quả chưa chắc chắn; không tự retry. |
| [useSaveExamContent.js](</D:/class-management/frontend/src/pages/teacher/exams/builder/hooks/useSaveExamContent.js:15>) | Mutation bao tải media và lưu nội dung; giữ revision/ID mapping; khóa nút suốt quá trình. |
| [LoginPage.jsx](</D:/class-management/frontend/src/pages/auth/LoginPage.jsx:24>) | Đăng nhập qua mutation, pending thay loading; setAuth vẫn reset cache phiên. |
| [SignupPage.jsx](</D:/class-management/frontend/src/pages/auth/SignupPage.jsx:29>) | Đăng ký qua mutation, giữ validation và điều hướng hiện có. |
| [Sidebar.jsx](</D:/class-management/frontend/src/components/dashboard/Sidebar.jsx:34>) | Đăng xuất giáo viên qua mutation; settled xóa auth/cache và điều hướng. |
| [StudentSidebar.jsx](</D:/class-management/frontend/src/components/dashboard/StudentSidebar.jsx:51>) | Đăng xuất HS gọi service logout hiện có để đóng cookie session BE, rồi xóa auth/cache. |
| [StudentLogoutModal.jsx](</D:/class-management/frontend/src/components/dashboard/modals/StudentLogoutModal.jsx:3>) | Nhận pending để khóa xác nhận/đóng và hiện trạng thái đang đăng xuất. |
| [ClassroomDetailPage.jsx](</D:/class-management/frontend/src/pages/teacher/classroom/ClassroomDetailPage.jsx:11>) | Truyền pending kích hoạt từ hook vào Outlet, bỏ loading trùng trong tab. |

Kiểm tra: build thành công, 54 tests pass, lint src không có error (còn warnings hiện có). Chưa xác minh các thao tác với backend/DB thật trên trình duyệt.

## Bổ sung prefetch chi tiết, optimistic và đồng bộ hồ sơ

Giữ nguyên các service; bổ sung getProfile vào userService để gọi GET /api/users/{userId} đã có trong UserController. Không sửa BE và không thêm dependency. Header và trang hồ sơ chia sẻ cùng query profile theo tài khoản/ID; dữ liệu mới đồng bộ vào snapshot đăng nhập, có kiểm tra phiên để chặn dữ liệu cũ sau logout. Update hồ sơ/ảnh cập nhật cache ngay sau response thành công và tự revalidate. Form đang sửa được giữ nguyên khi refetch nền.

Hover/focus vào lớp, tab điểm danh giáo viên, dòng đề thi hoặc hồ sơ sẽ prefetch query tương ứng. Chi tiết đề cũng tải trước module giao diện. Chỉ prefetch lớp HS đã tham gia và ACTIVE; lesson dùng ngày Việt Nam phía HS. Prefetch lớp HS dùng staleTime 15 giây giống trang chi tiết. Không prefetch dữ liệu làm bài/mock hoặc tạo route/API không tồn tại.

Sửa thông tin lớp và kích hoạt/vô hiệu lớp cập nhật cache trước response. Rollback chỉ khôi phục field còn mang giá trị của thao tác thất bại, giữ các hàng/field khác; không tái tạo hàng đã xóa. Modal sửa/vô hiệu đóng ngay; lỗi sửa mở lại form giữ các giá trị đã nhập, lỗi vô hiệu hiển thị toast. Đọc/xóa thông báo HS tiếp tục optimistic như trước. Điểm danh, tạo đề, tải media và xóa dữ liệu vẫn chờ BE xác nhận; không giả lập thành công. Prefetch và cache không cam kết lần tải đầu không có loading.

| File và dòng | Thay đổi |
| --- | --- |
| [prefetchRoutes.js](/D:/class-management/frontend/src/query/prefetchRoutes.js:1) | Helper xác định resource/params cho trang chính, chi tiết lớp, điểm danh, đề thi và hồ sơ. |
| [useRoutePrefetch.js](/D:/class-management/frontend/src/query/useRoutePrefetch.js:10) | Dùng kế hoạch prefetch; tải module chi tiết đề; giữ account key, ngày và staleTime phù hợp. |
| [ClassroomCard.jsx](/D:/class-management/frontend/src/pages/teacher/classroom/components/ClassroomCard.jsx:143) | Hover/focus nút vào lớp giáo viên tải trước danh sách học sinh. |
| [StudentClassCard.jsx](/D:/class-management/frontend/src/pages/student/components/StudentClassCard.jsx:9) | Hover/focus lớp đã tham gia ACTIVE tải dữ liệu chi tiết và điểm danh. |
| [ClassDetailSidebar.jsx](/D:/class-management/frontend/src/components/classroom/detail/ClassDetailSidebar.jsx:66) | Hover/focus tab giáo viên prefetch điểm danh khi phù hợp. |
| [ExamTable.jsx](/D:/class-management/frontend/src/pages/teacher/exams/components/ExamTable.jsx:68) | Hover/focus dòng đề thi tải detail/configuration. |
| [optimisticUpdates.js](/D:/class-management/frontend/src/query/optimisticUpdates.js:23) | Callback dùng chung cho optimistic patch, rollback và bảo vệ phiên tài khoản. |
| [useClassrooms.js](/D:/class-management/frontend/src/pages/teacher/classroom/hooks/useClassrooms.js:21) | Sửa/vô hiệu lớp optimistic; sửa lỗi mở lại form giữ nội dung nhập. |
| [useTeacherClassDetail.js](/D:/class-management/frontend/src/pages/teacher/classroom/hooks/useTeacherClassDetail.js:8) | Kích hoạt lớp optimistic, khôi phục nếu BE từ chối. |
| [userService.js](/D:/class-management/frontend/src/services/userService.js:4) | Thêm reader GET hồ sơ vào service cũ; nhận signal và kiểm tra ID response. |
| [resourceOptions.js](/D:/class-management/frontend/src/query/resourceOptions.js:12) | Resource profile gọi reader có sẵn trong userService. |
| [mutationResources.js](/D:/class-management/frontend/src/query/mutationResources.js:11) | Write hồ sơ/ảnh tự invalidate query profile. |
| [useProfileSync.js](/D:/class-management/frontend/src/pages/profile/hooks/useProfileSync.js:6) | Hook chia sẻ profile query và đồng bộ snapshot Zustand có kiểm tra ID/phiên. |
| [Header.jsx](/D:/class-management/frontend/src/components/dashboard/Header.jsx:13) | Đồng bộ hồ sơ ở cả hai layout; hover/focus nút hồ sơ tải trước cache. |
| [AccountProfilePage.jsx](/D:/class-management/frontend/src/pages/profile/AccountProfilePage.jsx:30) | Dùng query hồ sơ, cập nhật cache sau save/avatar; dirty guard bảo vệ form đang nhập. |
| [queryEnhancements.test.js](/D:/class-management/frontend/tests/queryEnhancements.test.js:9) | 5 tests kế hoạch prefetch, rollback, phản hồi cache trước API, cô lập phiên và invalidation hồ sơ. |

Kiểm tra bổ sung: 59 tests pass; build thành công; lint src không có error, còn warnings ở code hiện có. Chưa kiểm tra API với DB thật hoặc đo thời gian trên production.
# Rà soát nút thao tác FE ngày 11/10/2026

Rà các handler, lời gọi service và state loading/data trong toàn bộ `frontend/src` của teacher/student, auth/profile. Các API đang được tích hợp dùng Query/Mutation; không thêm service. Đây là kiểm tra mã nguồn, lint, build và unit test, chưa phải kiểm thử từng nút với BE trên production.

- `frontend/src/pages/student/JoinClassPage.jsx:110`: bỏ setter loading/error đã bị xóa, khôi phục chuyển đến trang tìm giáo viên.
- `frontend/src/pages/teacher/classroom/tabs/attendance/useAttendanceSession.js`: dùng `lessonsQuery.isFetching`, `isError`, `data`; cập nhật cache lesson sau create/update; bỏ state server trùng lặp và chặn mở/đóng khi đang xử lý.
- `frontend/src/pages/teacher/classroom/tabs/students/modals/AddStudentModal.jsx`: lấy học sinh phù hợp trực tiếp từ query; hiện lỗi query đúng nội dung, không báo không tìm thấy khi API lỗi; chặn submit lúc tải/lỗi.
- `frontend/src/pages/teacher/exams/ExamManagementPage.jsx`, `ExamDetailPage.jsx`: bỏ override trạng thái đề từ Zustand, dùng dữ liệu query.
- `frontend/src/pages/teacher/exams/components/ExamTable.jsx`: khóa nút xuất bản/về nháp vì BE chưa có API đổi trạng thái; không giả lập lưu thành công.
- Xóa hook `useUpdateExam.js` và modal `modals/EditExamModal.jsx` không còn được import; hook cũ gọi `examService.updateExam` đã không tồn tại. Modal cấu hình hiện hành trong `components/EditExamModal.jsx` và `useSaveExamConfiguration.js` được giữ nguyên.
- Xóa `useExamUiSession.js` và test riêng của store preview đã bỏ.
- `frontend/.oxlintrc.json`: bật `no-undef` và môi trường browser để bắt setter/hàm chưa khai báo.
- `frontend/package.json:9`: lint phạm vi `src`, tránh kiểm tra code thư viện trong node_modules.

Kiểm tra: build thành công, 58 unit tests pass (bỏ 1 test của store preview đã xóa), lint không lỗi, còn 8 cảnh báo. Danh sách đề học sinh vẫn là UI mock theo yêu cầu trước; tab/chức năng chưa nối API không được tuyên bố đã tích hợp.

# Chặn giao ALL khi chưa có lớp ngày 11/10/2026

Chọn ALL khi không có lớp ACTIVE hiện "Chưa có lớp nào", khóa tạo/lưu và kiểm tra lại danh sách lớp qua TanStack Query trước POST/PUT. Không dùng kết quả tìm kiếm để xác định số lớp. Chỉ sửa FE; các assignment đã có trong DB không được chỉnh sửa/xóa. ALL vẫn gửi classIds rỗng theo hợp đồng API hiện tại.

| File và vị trí | Thay đổi |
| --- | --- |
| [ExamAccessSection.jsx:97](/D:/class-management/frontend/src/pages/teacher/exams/create/components/ExamAccessSection.jsx:97) | Hiển thị loading, lỗi hoặc chưa có lớp cho ALL. |
| [useExamTargetOptions.js:14](/D:/class-management/frontend/src/pages/teacher/exams/hooks/useExamTargetOptions.js:14) | Truyền trạng thái query lớp. |
| [CreateExamPage.jsx:177](/D:/class-management/frontend/src/pages/teacher/exams/create/CreateExamPage.jsx:177) | Tổng lớp chưa lọc, khóa tạo và chặn handler nhập file. |
| [CreateMethodSection.jsx:26](/D:/class-management/frontend/src/pages/teacher/exams/create/components/CreateMethodSection.jsx:26) | Disabled hai nút tạo. |
| [EditExamModal.jsx:31](/D:/class-management/frontend/src/pages/teacher/exams/components/EditExamModal.jsx:31) | Cùng trạng thái ALL và khóa lưu cấu hình. |
| [examFormValidation.js:5](/D:/class-management/frontend/src/pages/teacher/exams/create/helpers/examFormValidation.js:5) | Helper kiểm tra ALL có lớp ACTIVE. |
| [useCreateExamForm.js:112](/D:/class-management/frontend/src/pages/teacher/exams/create/hooks/useCreateExamForm.js:112) | Áp dụng validation chung create/edit. |
| [useSaveExam.js:44](/D:/class-management/frontend/src/pages/teacher/exams/builder/hooks/useSaveExam.js:44) | Đọc lại query trước lưu đề, chặn bản nháp cũ. |
| [useSaveExamConfiguration.js:13](/D:/class-management/frontend/src/pages/teacher/exams/hooks/useSaveExamConfiguration.js:13) | Đọc lại query trước PUT cấu hình. |
| [examCreation.test.mjs:18](/D:/class-management/frontend/tests/examCreation.test.mjs:18) | Kiểm tra rỗng, archived, active, và phạm vi CLASS/STUDENT. |
| [AGENTS.md:3](/D:/class-management/frontend/AGENTS.md:3) | Ghi quy ước TanStack Query, server/client state và code theo hooks/helpers/modals. |

Kiểm tra: 60 tests pass, build thành công, lint không lỗi (8 cảnh báo còn có), git diff --check sạch. Chưa thử tạo/lưu với BE thực tế.

