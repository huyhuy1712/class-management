# Điểm và thống kê đợt giao

Điểm thẻ GV hiển thị score/maxScore: dưới 50% đỏ, từ 50% xanh; thiếu điểm/tổng điểm dùng màu trung tính. Tổng điểm lấy configuration.maxScore, không cố định thang 10. Điểm tạm tính vẫn ghi rõ tạm tính.

Sidebar có trung bình (làm tròn 2 chữ số) và mốt; BE bổ sung stats.averageScore/stats.modes vào API attempts hiện có, tính trên GRADED trong toàn bộ scope assignment/classId, không bị ảnh hưởng trang/search/status. Loại SUBMITTED và người chưa nộp; không coi thiếu điểm là 0. Không có điểm lặp thì không có mốt; nhiều mốt cùng tần suất cao nhất thì trả tất cả. Schema hiện giữ lượt hiện tại/student/assignment nên đây là thống kê lượt hiện tại, không lịch sử lượt đã bị reset. Vẫn hai query đọc cho danh sách; không thêm service/API hay migration. Cache/refetch/invalidation dùng query hiện có.

File/dòng:
- frontend/src/pages/teacher/exams/components/AssignmentStudentCard.jsx:6 — nhận maxScore; :11 — score/max và màu.
- frontend/src/pages/teacher/exams/helpers/assignmentAttemptHelpers.js:3 — quy tắc ngưỡng màu.
- frontend/src/pages/teacher/exams/TeacherAssignmentDetailPage.jsx:54 — thống kê sidebar; :70 — truyền maxScore cho card.
- backend/src/main/java/com/classmanagement/backend/dto/exam/ExamAttemptResponse.java:36 — thêm averageScore/modes, giữ constructor cũ.
- backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptDataRepository.java:205 — CTE thống kê toàn scope, mapping null/multiple modes.
- backend/src/test/java/com/classmanagement/backend/service/exam/ExamSubmissionListTest.java:23 — fixture mới; :71 — kiểm tra thiếu điểm/mốt và giữ hai query.
- frontend/tests/assignmentAttempts.test.mjs:5 — kiểm tra 0, dưới/bằng/trên nửa tổng điểm và thiếu tổng điểm.

Chạy unit tests BE/FE và FE build; chưa chạy aggregate SQL trên PostgreSQL thật. Restart BE để response có fields mới.
