# API kết quả học sinh trong lớp

| File / dòng | Thay đổi |
| --- | --- |
| [backend/src/main/java/com/classmanagement/backend/controller/ClassroomController.java:39](D:/class-management/backend/src/main/java/com/classmanagement/backend/controller/ClassroomController.java:39) | Endpoint một request cho hai ô, nhận page/size và phiên đăng nhập. |
| [backend/src/main/java/com/classmanagement/backend/service/exam/ExamAttemptService.java:181](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamAttemptService.java:181) | Reuse service: validate ID/page/size, TEACHER ACTIVE, chủ lớp và membership trước đọc kết quả. |
| [backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptDataRepository.java:222](D:/class-management/backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptDataRepository.java:222) | EXISTS kiểm tra giáo viên chủ lớp và học sinh có membership/role STUDENT. |
| [backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptDataRepository.java:230](D:/class-management/backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptDataRepository.java:230) | Hai query: danh sách phân trang và aggregate toàn bộ; scope ALL/CLASS/STUDENT, LEFT JOIN bài làm, chuẩn hóa thang 10 chỉ GRADED. |
| [backend/src/main/java/com/classmanagement/backend/dto/exam/StudentClassExamResultsResponse.java:9](D:/class-management/backend/src/main/java/com/classmanagement/backend/dto/exam/StudentClassExamResultsResponse.java:9) | DTO response gồm items/page/size/totalElements/summary, điểm gốc và điểm thang 10. |
| [backend/src/test/java/com/classmanagement/backend/service/exam/ExamAttemptServiceTest.java:69](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/ExamAttemptServiceTest.java:69) | Kiểm tra chủ lớp, membership, role, ID/page/size; mock repository endpoint mới. |
| [backend/src/test/java/com/classmanagement/backend/service/exam/StudentClassExamResultsTest.java:14](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/StudentClassExamResultsTest.java:14) | Kiểm tra mapping chưa làm, thống kê toàn tập, scope SQL, hai query và null khi chưa có điểm. |
| [docs/api.md:2745](D:/class-management/docs/api.md:2745) | Document endpoint/response, phân quyền, scope, công thức thống kê và checklist tích hợp. |

Validation: Maven offline test BUILD SUCCESS — 252 tests, 0 failures/errors/skips. Chưa chạy PostgreSQL/HTTP integration. Không restart BE, không chạy Flyway hoặc sửa FE.

Không thêm service/repository/migration; chỉ DTO mới. Một request FE, hai query dữ liệu cho page và summary, ngoài query user và EXISTS authorization. Không query mỗi đề/câu. Chỉ điểm GRADED với maxScore > 0 tham gia mean/max/min thang 10, thiếu điểm trả null. Chỉ giữ lượt cuối, mỗi assignment trọng số bằng nhau.

Giới hạn: membership hiện tại, scope phân công hiện tại và đề không DRAFT; không phục dựng lịch sử lớp/target đã xóa. STUDENT cần class_id ngữ cảnh đúng; ALL/CLASS lớp archive chỉ trả assignment đã có attempt.
