# Xem/chấm bài và xóa kết quả cho thi lại

Thẻ bài đã nộp/đã chấm mở `/teacher/exams/:examId/assignments/:assignmentId/attempts/:attemptId?classId=...` bằng chuột/Enter. HS chưa làm/đang làm không có liên kết kết quả. Nút sửa nhận xét trên thẻ vẫn độc lập. Trang chi tiết hiển thị HS, điểm/tổng, tự động/tự luận/từng phần, thời gian nộp, số rời tab, nhật ký, đề/đáp án/giải thích và ô điểm ESSAY. Dùng lại ExamAnswerReview/StudentQuestionCard/MathRenderer/ExamMedia; không thêm service.

GET `/api/exam-attempts/{id}/teacher-review` → `{assignmentId,exam,student,result}`. Giáo viên ACTIVE phải sở hữu đề, bài phải đã nộp; trả đề/đáp án đầy đủ theo quyền teacher, không đổi policy HS.

PATCH grades hiện có: `{attemptNumber,revision,grades:[{answerId,score}],teacherComment}`. FE chỉ gửi các ô điểm đã sửa (blank giữ điểm cũ); điểm từ 0 đến điểm group, tối đa 2 số thập phân. Câu essay không có nội dung tính 0, khóa nhập; BE tiếp tục kiểm tra loại/điểm/blank. Nhận xét có thể xóa bằng chuỗi rỗng. Chấm điểm chờ BE xác nhận, không optimistic giả điểm; trạng thái pending ở nút, giấy thi giữ nguyên. Revision được giữ từ lúc bắt đầu chỉnh, xung đột BE từ chối.

POST `/api/exam-attempts/{id}/reset`, body `{attemptNumber,revision,mode:"RETAKE"|"BLOCK"}`. Có modal xác nhận rõ dữ liệu bị xóa. Chỉ teacher sở hữu, chỉ bài đã nộp, khóa theo thứ tự hiện có và kiểm tra generation/revision. Xóa student_answers/section scores/events, reset điểm/nhận xét/timestamps, trạng thái NOT_STARTED. Giữ ID và attemptCount để các request cũ không trùng thế hệ lượt mới; flush tăng revision. Không xóa đề/assignment/HS hay những người khác.

RETAKE: đợt PUBLISHED và OPEN/SCHEDULED, chưa qua closeTime; reset completed_at/exempt_at của chính HS, nâng giới hạn cá nhân lên ít nhất attemptCount+1 khi hữu hạn, giữ unlimited=0. Lượt kế tiếp tăng attemptCount; HS vẫn phải thuộc đối tượng và đáp ứng giờ mở/đóng. Đây là xóa kết quả hiện tại và cấp quyền làm tiếp, không khôi phục lịch sử lượt đã bị reset. Đợt đóng cần mở đợt mới. results_released_at đã công bố không bị thu hồi; người đã xem đáp án không thể quên đáp án.

BLOCK: xóa kết quả và teacher_blocked=true, StudentExamReadRepository trả attemptStatus/blockedReason=TEACHER_BLOCKED; service start từ chối. Chỉ chặn trong assignment này. Hiện không có luồng gỡ chặn riêng; GV có thể mở assignment mới. Bản ghi attempt giữ lại, nên không làm đề có lượt thi trở thành đề được phép sửa/về nháp.

V62 thêm teacher_blocked và attempt_limit_override. DTO danh sách GV/kết quả lớp không hiển thị điểm 0 giả sau reset: chỉ đưa total_score cho SUBMITTED/GRADED. Query theo account/attempt, focus refetch; hover/focus thẻ tải trước data/chunk. Ghi qua useMutation, guard sessionVersion, invalidate các list/result/overview để thống kê tự cập nhật. Form điểm/nhận xét/modal là client state. Reset không optimistic dữ liệu xóa vì phải kiểm tra lịch/quyền/revision ở BE.

## File/dòng

- backend/src/main/java/com/classmanagement/backend/controller/ExamAttemptController.java:15 — teacher-review; :19 — reset.
- backend/src/main/java/com/classmanagement/backend/service/exam/ExamAttemptService.java:32 — reset; :57 — teacher review.
- backend/src/main/java/com/classmanagement/backend/dto/exam/ExamAttemptPayload.java:22 — ResetMode/Reset request.
- backend/src/main/java/com/classmanagement/backend/dto/exam/ExamAttemptResponse.java:12 — StudentInfo/TeacherReview.
- backend/src/main/java/com/classmanagement/backend/entity/ExamAttempt.java:20 — blocked/override.
- backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptDataRepository.java:180 — resetCompletion; :204 và :249 — ẩn totalScore sau reset.
- backend/src/main/java/com/classmanagement/backend/repository/exam/StudentExamReadRepository.java:41 — override; :43 — blocked status.
- backend/src/main/java/com/classmanagement/backend/service/exam/StudentExamReadService.java:72 — blocked reason.
- backend/src/main/resources/db/migration/V62__add_attempt_teacher_reset.sql:1 — migration.
- frontend/src/services/examService.js:4 — GET review/POST reset dùng service cũ.
- frontend/src/query/resourceOptions.js:31 — reader.
- frontend/src/query/mutationResources.js:6 — invalidation review sau grades/reset, cùng resources cũ.
- frontend/src/query/prefetchRoutes.js:3 — key review; frontend/src/query/useRoutePrefetch.js:14 — chunk.
- frontend/src/routes/AppRoutes.jsx:24 — lazy page; :88 — route.
- frontend/src/pages/teacher/exams/components/AssignmentStudentCard.jsx:8 — mở/prefetch bài đã nộp.
- frontend/src/pages/teacher/exams/TeacherAssignmentDetailPage.jsx:22 — path; :74 — callbacks thẻ.
- frontend/src/pages/teacher/exams/TeacherAttemptReviewPage.jsx:15 — page; :30 — editor/mutation/validation/giấy thi và xác nhận reset.
- frontend/src/pages/student/exams/components/ExamAnswerReview.jsx:9 — renderGrading tùy chọn; :21 — vị trí ô điểm; UI HS không truyền callback nên giữ nguyên.
- frontend/src/pages/student/exams/helpers/studentExamHelpers.js:8 — thông báo blocked.
- backend/src/test/java/com/classmanagement/backend/service/exam/ExamAttemptServiceTest.java:251 — retake/generation; :263 — block/closed/owner/revision; :277 — teacher review.
- frontend/tests/examServices.test.mjs:19 — API review/reset contract.
- frontend/tests/queryEnhancements.test.js:21 — prefetch/invalidation review/reset.

Kiểm tra: BE full unit tests pass; 81 FE tests pass; lint không lỗi (warnings cũ), production build pass. Chưa kiểm thử API/PostgreSQL/trình duyệt thật. Restart BE để Flyway chạy V62 trước khi thử các API mới.
