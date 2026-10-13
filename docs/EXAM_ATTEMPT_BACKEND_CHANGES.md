# Thay đổi BE bài thi học sinh

Các dòng dưới đây là vị trí bắt đầu phần sửa hoặc lớp mới. Chỉ liệt kê phần bài làm của lần triển khai này; không bao gồm chỉnh sửa FE/BE khác đang có trong workspace.

| File / dòng | Thay đổi |
| --- | --- |
| [backend/src/main/java/com/classmanagement/backend/controller/ExamAssignmentController.java:21](D:/class-management/backend/src/main/java/com/classmanagement/backend/controller/ExamAssignmentController.java:21) | Reuse controller: start/resume và danh sách bài cho giáo viên. |
| [backend/src/main/java/com/classmanagement/backend/controller/ExamAttemptController.java:13](D:/class-management/backend/src/main/java/com/classmanagement/backend/controller/ExamAttemptController.java:13) | Controller bài làm: GET, lưu, nộp, kết quả, chấm tự luận. |
| [backend/src/main/java/com/classmanagement/backend/dto/exam/ExamAttemptPayload.java:10](D:/class-management/backend/src/main/java/com/classmanagement/backend/dto/exam/ExamAttemptPayload.java:10) | Payload nhóm đáp án, UUID, revision và validation giới hạn. |
| [backend/src/main/java/com/classmanagement/backend/dto/exam/ExamAttemptResponse.java:8](D:/class-management/backend/src/main/java/com/classmanagement/backend/dto/exam/ExamAttemptResponse.java:8) | Response bài an toàn, kết quả có kiểm soát và phân trang. |
| [backend/src/main/java/com/classmanagement/backend/service/exam/ExamAttemptService.java:19](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamAttemptService.java:19) | Service nghiệp vụ bài làm: quyền, transaction, retry, deadline, điểm, cohort. |
| [backend/src/main/java/com/classmanagement/backend/service/exam/ExamScoringCalculator.java:11](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamScoringCalculator.java:11) | Hàm chấm thuần, không query/network; kiểm tra option và tính điểm nhóm/câu/phần. |
| [backend/src/main/java/com/classmanagement/backend/service/exam/ExamAttemptExpiryJob.java:11](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamAttemptExpiryJob.java:11) | Scheduler mỏng gọi service kết thúc bài quá hạn. |
| [backend/src/main/java/com/classmanagement/backend/service/exam/ExamDetailService.java:53](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamDetailService.java:53) | Tách loader cây đề dùng lại; giữ kiểm tra quyền GET giáo viên. |
| [backend/src/main/java/com/classmanagement/backend/service/exam/ExamPublishService.java:83](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamPublishService.java:83) | Chốt cohort sau publish; clearCohort khi về nháp (dòng 107). |
| [backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptDataRepository.java:16](D:/class-management/backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptDataRepository.java:16) | JDBC batch đáp án/điểm/events, cohort và projection danh sách; không SELECT mỗi câu. |
| [backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptRepository.java:17](D:/class-management/backend/src/main/java/com/classmanagement/backend/repository/exam/ExamAttemptRepository.java:17) | Khóa lượt, batch khóa và INSERT ON CONFLICT cho start đồng thời. |
| [backend/src/main/java/com/classmanagement/backend/repository/exam/ExamRepository.java:14](D:/class-management/backend/src/main/java/com/classmanagement/backend/repository/exam/ExamRepository.java:14) | Khóa đọc exam phối hợp publish/delete; batch cho expiry. |
| [backend/src/main/java/com/classmanagement/backend/repository/exam/StudentExamReadRepository.java:19](D:/class-management/backend/src/main/java/com/classmanagement/backend/repository/exam/StudentExamReadRepository.java:19) | Reuse điều kiện ALL/CLASS/STUDENT cho quyền và cohort. |
| [backend/src/main/java/com/classmanagement/backend/entity/ExamAttempt.java:21](D:/class-management/backend/src/main/java/com/classmanagement/backend/entity/ExamAttempt.java:21) | Mapping revision, startRequestId, deadlineAt. |
| [backend/src/main/java/com/classmanagement/backend/entity/ExamAssignment.java:22](D:/class-management/backend/src/main/java/com/classmanagement/backend/entity/ExamAssignment.java:22) | Mapping mốc mở kết quả cố định. |
| [backend/src/main/java/com/classmanagement/backend/entity/ExamAttemptEvent.java:18](D:/class-management/backend/src/main/java/com/classmanagement/backend/entity/ExamAttemptEvent.java:18) | Mapping UUID chống đếm lại sự kiện. |
| [backend/src/main/resources/db/migration/V57__exam_attempt_runtime_and_completion_cohort.sql:1](D:/class-management/backend/src/main/resources/db/migration/V57__exam_attempt_runtime_and_completion_cohort.sql:1) | Migration runtime/cohort/index và backfill đề cũ; chưa chạy DB. |
| [backend/src/main/java/com/classmanagement/backend/security/ExamRequestSizeFilter.java:26](D:/class-management/backend/src/main/java/com/classmanagement/backend/security/ExamRequestSizeFilter.java:26) | Reuse giới hạn body cho bốn endpoint ghi mới. |
| [backend/src/main/resources/application.properties:11](D:/class-management/backend/src/main/resources/application.properties:11) | Bật PostgreSQL driver tối ưu INSERT batch. |
| [backend/src/test/java/com/classmanagement/backend/service/exam/ExamAttemptServiceTest.java:16](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/ExamAttemptServiceTest.java:16) | 18 test runtime: retry, quyền, revision, hết giờ, retake, điểm/đáp án. |
| [backend/src/test/java/com/classmanagement/backend/service/exam/ExamScoringCalculatorTest.java:11](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/ExamScoringCalculatorTest.java:11) | 10 test các loại câu, explicit false, Unicode, option ngoài đề và tự luận. |
| [backend/src/test/java/com/classmanagement/backend/service/exam/ExamPublishServiceTest.java:16](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/ExamPublishServiceTest.java:16) | Cập nhật dependency mock và kiểm tra cohort publish/unpublish. |
| [backend/src/test/java/com/classmanagement/backend/service/exam/ExamRequestSizeFilterTest.java:8](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/ExamRequestSizeFilterTest.java:8) | Thêm kiểm tra 413 trên các endpoint ghi bài làm. |
| [docs/api.md:2743](D:/class-management/docs/api.md:2743) | Bảy API, payload/response, quy tắc tích hợp và checklist DB. |

Compile toàn bộ main/test Java bằng JDK 21 và chạy 225 unit checks: PASS. Chưa chạy Spring HTTP integration, PostgreSQL SQL/rollback/concurrency hoặc Flyway. Không restart BE và không tích hợp FE trong lần này.

SELECT cây nội dung theo nhóm bảng; đáp án đọc bằng JOIN/batch, ghi bằng UPSERT/batch; expiry đọc nhiều lượt cùng lúc và cache cây đề theo exam trong một batch. Số record ghi vẫn tăng theo số đáp án, không hứa thời gian xử lý cố định. Nút nộp cần một POST duy nhất; không cần gọi tất cả API cho mỗi lần nộp.

Quy trình tiếp theo: người dùng rebuild/restart BE để Flyway V57 chạy, thực hiện checklist cuối docs/api.md, sau đó nối FE vào các API bài làm.
