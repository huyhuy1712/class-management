# Các thay đổi cho API cập nhật nội dung đề thi

Endpoint mới: PUT /api/exams/{examId}/content. Sửa trực tiếp local nhánh AH. Không sửa FE, không chạy BE, không truy cập DB/storage thật.

| File | Thay đổi |
|---|---|
| [ExamController.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/controller/ExamController.java) | Thêm endpoint PUT content, xác thực bằng tài khoản từ cookie. |
| [UpdateExamContentRequest.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/dto/exam/UpdateExamContentRequest.java) | Request revision/draftToken/cây đầy đủ; ID cũ/clientId mới; chuyển sang DTO tạo đề để reuse validation. |
| [UpdateExamContentResponse.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/dto/exam/UpdateExamContentResponse.java) | Response nhỏ: code/status/maxScore/revision/updatedAt và mapping ID cho phần tử mới. |
| [ExamContentUpdateService.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamContentUpdateService.java) | Transaction, khóa đề, quyền/trạng thái/lượt làm/revision, ngưỡng assignment, media, flush và response. |
| [ExamContentPlan.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamContentPlan.java) | Đọc từng nhóm của cây theo lô; tạo kế hoạch đồng bộ và kiểm tra ID cha-con trước khi ghi. |
| [ExamContentLayer.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamContentLayer.java) | Helper thuần bộ nhớ kiểm tra ID/clientId, tính phần bỏ, parking thứ tự và mapping ID mới. |
| [ExamContentWriter.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamContentWriter.java) | Bulk xóa theo nhóm, parking/flush trước insert, giữ entity cũ, persist entity mới và tính điểm section. |
| [ExamStructureValidator.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamStructureValidator.java) | Tách validateContent dùng chung cho POST và PUT; giữ các quy tắc scoring/điểm/media/giới hạn, tránh lặp bean validation trong POST. |
| [ExamMediaLifecycle.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamMediaLifecycle.java) | Claim cho content: chấp nhận ATTACHED của chính đề và TEMP hợp lệ; batch lock; kiểm tra cả nhóm trước claim. |
| [ExamMediaRepository.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/repository/exam/ExamMediaRepository.java) | Bulk queue media ATTACHED của đề không còn dùng; worker cũ tiếp tục xóa file sau commit. |
| [Exam.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/entity/Exam.java) | Thêm revision @Version mặc định 0. |
| [V52__add_exam_revision.sql](D:/class-management/backend/src/main/resources/db/migration/V52__add_exam_revision.sql) | Thêm cột revision NOT NULL DEFAULT 0 và constraint không âm; chưa chạy migration. |
| [ExamConfigurationResponse.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/dto/exam/ExamConfigurationResponse.java) | GET configuration thêm revision. |
| [ExamDetailResponse.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/dto/exam/ExamDetailResponse.java) | GET detail thêm revision. |
| [ExamConfigurationService.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamConfigurationService.java) | Map revision của entity vào GET configuration. |
| [ExamDetailService.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamDetailService.java) | Reuse revision từ configuration khi dựng GET detail. |
| [UpdateExamRequest.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/dto/exam/UpdateExamRequest.java) | PUT configuration thêm revision tùy chọn, giữ tương thích body cũ. |
| [ExamConfigurationUpdateService.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/service/exam/ExamConfigurationUpdateService.java) | Kiểm tra revision khi client gửi; @Version cập nhật revision khi sửa cấu hình. |
| [GlobalExceptionHandler.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/exception/GlobalExceptionHandler.java) | Chuyển optimistic lock conflict thành 409. |
| [ExamRequestSizeFilter.java](D:/class-management/backend/src/main/java/com/classmanagement/backend/security/ExamRequestSizeFilter.java) | Áp dụng giới hạn body hiện có cho PUT content, kể cả không có Content-Length. |
| [ExamContentUpdateServiceTest.java](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/ExamContentUpdateServiceTest.java) | Luồng ghi/mapping/xóa, quyền/revision/threshold, media giữ/bỏ, đọc 1/100 câu theo cùng số lượt, parking trước insert, Spring rollback. |
| [ExamContentLayerTest.java](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/ExamContentLayerTest.java) | Identity, clientId, cha-con, hoán đổi vị trí, parking lớn hơn cả vị trí cũ và mới. |
| [ExamMediaLifecycleTest.java](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/ExamMediaLifecycleTest.java) | Media ATTACHED reuse trong cùng đề; không reuse đề khác; TEMP đúng/sai token. |
| [ExamRequestSizeFilterTest.java](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/ExamRequestSizeFilterTest.java) | Giới hạn PUT content với và không có Content-Length. |
| [ExamConfigurationUpdateServiceTest.java](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/ExamConfigurationUpdateServiceTest.java) | Điều chỉnh constructor request; thêm test revision cấu hình cũ. |
| [ExamDetailServiceTest.java](D:/class-management/backend/src/test/java/com/classmanagement/backend/service/exam/ExamDetailServiceTest.java) | Điều chỉnh fixture response có revision. |
| [api.md](D:/class-management/docs/api.md:2138) | Thêm API mục 44, contract, response, validation, media, revision, lỗi và checklist test; cập nhật ghi chú PUT configuration. |
| [EXAM_CONTENT_UPDATE_CHANGES.md](D:/class-management/docs/EXAM_CONTENT_UPDATE_CHANGES.md) | Bảng thay đổi này để rà soát toàn bộ file. |

Kiểm tra: biên dịch toàn bộ source/test bằng Java 21 và thư viện đã có trong cache; 103 unit test pass; git diff --check sạch. File arguments/runner/output kiểm tra nằm trong backend/target, không phải source sản phẩm.

Giới hạn bằng chứng: số lượt đọc repository đã kiểm tra theo fixture, chưa đo SQL thật hay thời gian Railway/Supabase. Test rollback kiểm tra Spring transaction interception, chưa chứng minh PostgreSQL rollback thực tế. Migration/cascade/unique khi reorder và lifecycle file cần test integration sau khi restart. IDENTITY còn INSERT từng record mới; không công bố batch insert. FE chưa nối API content.
