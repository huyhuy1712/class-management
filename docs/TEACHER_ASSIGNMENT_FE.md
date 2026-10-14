# Trang chi tiết đợt giao của giáo viên

Con mắt trong tab đề của lớp mở `/teacher/exams/:examId/assignments/:assignmentId?classId=:classId`; bản nháp vẫn dùng nút bút để vào builder. Trang chi tiết có sidebar thông tin đề/người tạo/ngày tạo/lịch/giới hạn lượt/lớp, thống kê và lưới thẻ HS, tìm tên/mã/email, lọc trạng thái, sort theo BE và phân trang 12 thẻ.

API dùng lại: GET `/exams/:examId/configuration`; GET `/exam-assignments/:assignmentId/attempts` với classId/page/size/q/status/sort; PATCH `/exam-attempts/:attemptId/grades` khi sửa nhận xét, chỉ gửi attemptNumber/revision/teacherComment, không gửi grades. Nhận xét rỗng để xóa; giữ nguyên điểm. HS NOT_STARTED với attemptId=null vẫn hiện, không cho sửa nhận xét; IN_PROGRESS cũng không nhận xét vì BE chỉ cho cập nhật bài đã nộp. Mỗi thẻ hiện điểm tạm/chính thức, thời gian/nộp, rời tab, nhận xét.

TanStack Query theo account/assignment/class/page/filter; GET giữ cache khi refetch nền, focus refetch, poll 60 giây/stale 15 giây; tìm kiếm chờ 300ms; placeholder chỉ giữ dữ liệu trong cùng account/assignment/class. Hover/focus con mắt tải trước configuration, trang danh sách và chunk; hover/focus nút Sau tải trước trang tiếp. Mutation PATCH cập nhật nhận xét ngay trên các trang cache của đợt giao, rollback riêng nhận xét nếu lỗi (không đè điểm/dữ liệu khác), cập nhật revision theo BE và invalidate. Guard sessionVersion trên request, optimistic update, rollback, success và invalidation; không ghi cache cũ sau logout. Không tạo service/API BE mới. Form nhận xét/filter/page là client state.

Phạm vi này là trang danh sách đợt giao và nhận xét. Chưa thêm màn hình chấm từng câu essay, xuất file, xóa bài hoặc các menu tham khảo không có yêu cầu/API tương ứng.

## File/dòng sửa

- frontend/src/services/examService.js:4 — đọc attempts và PATCH grades trong service cũ.
- frontend/src/query/resourceOptions.js:32 — reader với toàn bộ tham số, signal; :45 — freshness.
- frontend/src/query/mutationResources.js:6 — revalidation chấm/submit/assignment; :12 — đổi đề/targets.
- frontend/src/query/prefetchRoutes.js:2 — route/keys khớp trang, giữ classId khi prefetch.
- frontend/src/query/useRoutePrefetch.js:14 — preload chunk chi tiết.
- frontend/src/routes/AppRoutes.jsx:23 — lazy page; :86 — route mới.
- frontend/src/pages/teacher/classroom/tabs/AssignmentsTab.jsx:89 — nút con mắt điều hướng đúng assignment/class.
- frontend/src/pages/teacher/exams/TeacherAssignmentDetailPage.jsx:11 — page/route scope; :18 — cấu hình, filters, cards, modal nhận xét và paging.
- frontend/src/pages/teacher/exams/hooks/useAssignmentAttempts.js:11 — query và mutation/rollback/session guard/prefetch page.
- frontend/src/pages/teacher/exams/components/AssignmentStudentCard.jsx:6 — card HS và nút sửa nhận xét.
- frontend/src/pages/teacher/exams/helpers/assignmentAttemptHelpers.js:1 — trạng thái/quyền nhận xét/patch rollback/time.
- frontend/tests/assignmentAttempts.test.mjs:1 — nhận xét bài chưa làm/đang làm và rollback giữ sửa đổi khác.
- frontend/tests/examServices.test.mjs:19 — params/class/cancellation và comment-only PATCH giữ điểm.
- frontend/tests/queryEnhancements.test.js:20 — prefetch theo assignment/class và invalidation.

Kiểm tra: 78 FE tests pass, lint không lỗi (warnings cũ), production build pass. Chưa kiểm thử trình duyệt với API/DB thật; cần BE đang chạy bản mới có classId và recipients chưa làm. Không sửa BE/migration trong lần này.
