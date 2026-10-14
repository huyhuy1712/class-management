# Bổ sung phạm vi lớp và học sinh chưa làm

| File / dòng | Thay đổi |
| --- | --- |
| [backend/src/main/java/com/classmanagement/backend/controller/ExamAssignmentController.java:29](D:/class-management/backend/src/main/java/com/classmanagement/backend/controller/ExamAssignmentController.java:29) | GET attempts nhận classId tùy chọn. |
| [backend/src/main/java/com/classmanagement/backend/service/exam/ExamAttemptService.java:145](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamAttemptService.java:145) | Validate classId, kiểm tra ownership/target trước query danh sách. |
| [backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptDataRepository.java:174](D:/class-management/backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptDataRepository.java:174) | Một query EXISTS kiểm tra lớp theo ALL/CLASS/STUDENT và chủ đề. |
| [backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptDataRepository.java:184](D:/class-management/backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptDataRepository.java:184) | LEFT JOIN người nhận hiện tại + bài đã có; filter lớp theo loại phân công; nullable attempt; query thống kê dùng cùng phạm vi. |
| [backend/src/test/java/com/classmanagement/backend/service/exam/ExamAttemptServiceTest.java:88](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/ExamAttemptServiceTest.java:88) | Test classId hợp lệ, ID âm/0, sai lớp; cập nhật mock/signature list. |
| [backend/src/test/java/com/classmanagement/backend/service/exam/ExamSubmissionListTest.java:73](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/ExamSubmissionListTest.java:73) | Test mapping chưa làm, class scope cả hai query, sort/escape/page; thêm kiểm tra query classAllowed. |
| [docs/api.md:2753](D:/class-management/docs/api.md:2753) | Contract classId, danh sách chưa làm, stats và giới hạn lịch sử lớp. |

Reuse GET /api/exam-assignments/{assignmentId}/attempts; không endpoint mới, không migration, không ghi attempt khi đọc. Hai query dữ liệu cho trang/count/stats, thêm một query authorization nếu có classId, ngoài kiểm tra user/assignment hiện có. EXISTS tránh nhân bản theo membership. Không đọc từng bài/câu hỏi.

Toàn assignment gồm người nhận hiện tại và bài đã có (kể cả đã rời lớp). classId cho ALL/CLASS dựa membership hiện tại; STUDENT dựa lớp ngữ cảnh lưu. Chưa có attempt trả ID/điểm/revision/thời gian null, status NOT_STARTED; studentId là key ổn định.

Kiểm tra: Maven offline test PASS (248 tests, không failure/error/skip). Chưa chạy SQL/PostgreSQL integration hoặc HTTP thật; không restart BE, không sửa FE. Checklist sau restart: ALL/CLASS/STUDENT; HS chưa bắt đầu; nhiều membership không trùng; stats theo lớp không theo q/status; lớp sai 404; HS rời lớp vẫn có bài ở toàn assignment.
