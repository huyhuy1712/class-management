# Media đề thi — checkpoint upload tạm

Chỉ giáo viên ACTIVE đã đăng nhập được dùng. Dùng lại StorageService local/Supabase; không có API tạo folder hay bucket. Chưa nối FE và chưa có API lưu complete Exam.

## Upload

POST `/api/exam-media`, multipart/form-data:

| Field | Giá trị |
|---|---|
| draftToken | UUID do FE tạo một lần và giữ cùng bản nháp |
| type | IMAGE hoặc AUDIO |
| file | Một file |

Response 201:

```json
{
  "mediaId": "550e8400-e29b-41d4-a716-446655440000",
  "draftToken": "550e8400-e29b-41d4-a716-446655440001",
  "path": "exam-media/gv_14/550e8400-e29b-41d4-a716-446655440001/550e8400-e29b-41d4-a716-446655440000.png",
  "url": "http://localhost:8080/uploads/exam-media/gv_14/550e8400-e29b-41d4-a716-446655440001/550e8400-e29b-41d4-a716-446655440000.png",
  "type": "IMAGE",
  "contentType": "image/png",
  "sizeBytes": 1024,
  "expiresAt": "2026-10-09T10:00:00"
}
```

Path/filename do BE tạo. Draft token được namespace theo teacher, không phải quyền truy cập độc lập. FE giữ mediaId/path/url, không lưu binary vào localStorage. Path ổn định khi gắn đề, không copy/rename trên storage. Complete create sau này gửi mediaId; claim theo batch trong transaction lưu đề, không gọi provider từng file. Cùng mediaId dùng nhiều nơi trong một đề được deduplicate.

## Xóa media tạm

DELETE `/api/exam-media/{mediaId}` trả 202: đã ghi yêu cầu xóa, không hứa storage đã xóa ngay. Worker xử lý sau. Không xóa trực tiếp media ATTACHED hoặc đang UPLOADING. Gọi lại DELETE khi còn DELETE_PENDING không thay đổi lịch retry; sau khi worker xóa registry, gọi lại trả 404.

## Định dạng và giới hạn

- JPEG/PNG/WebP: tối đa 5 MiB, 16 triệu pixel; MIME và extension phải phù hợp. JPEG/PNG đọc kích thước rồi decode trong memory. WebP kiểm tra RIFF/chunks/header/kích thước, không decode toàn bộ bitstream; không nhận animated WebP.
- Audio bản đầu: MP3, MIME audio/mpeg, tối đa 8 MiB. Kiểm tra ID3 nếu có và hai frame MPEG Layer III liên tiếp đầy đủ. Đây là kiểm tra cấu trúc, không xác nhận giải mã toàn bộ audio. M4A/AAC/WAV chưa hỗ trợ, trả 400.
- Không nhận SVG/HTML, URL ngoài hệ thống hoặc đường dẫn do client chọn.
- Multipart framework vẫn giới hạn file và toàn request 10MB như cấu hình hiện tại. File vượt giới hạn trả 413; sai dữ liệu 400; sai role/status 403; không thuộc quyền 404; đang dùng 409; lỗi storage 502.
- Thời gian registry dùng LocalDateTime theo timezone server giống convention hiện có. Khi nhiều instance phải dùng cùng timezone; contract thời gian toàn module cần chuẩn hóa trước production.

## Vòng đời và cleanup

V48 tạo bảng exam_media: owner/draft/path/type/size/status, hạn dùng, exam reference và lịch retry. Reservation UPLOADING được commit trước provider call. Sau upload thành công mới chuyển TEMP; mặc định TEMP 24h, UPLOADING quá 1h được cleanup. Nếu process dừng giữa upload, reservation vẫn còn để cleanup.

Worker chạy mỗi 60 giây, đọc tối đa 10 candidate, khóa row để chuyển DELETE_PENDING và tạo lease 5 phút. Storage delete chạy ngoài transaction. Lỗi xóa giữ registry và retry với backoff tối đa 1h; retry vẫn còn khi BE restart. ATTACHED có exam không bị cleanup theo tuổi file. Khi exam bị xóa, FK SET NULL giữ registry cho worker cleanup sau đó. Update bỏ media sẽ cần đánh dấu cleanup trong transaction update ở checkpoint tiếp theo.

Batch claim và worker cùng dùng khóa row để tránh xóa file khi đang gắn đề. Chưa kiểm chứng race bằng PostgreSQL; unit tests không thay thế kiểm tra transaction/lock thực tế.

## Local và Supabase

Local không cần tạo thủ công: StorageService tạo folder khi upload. Nếu chạy từ backend, mặc định uploads nằm dưới backend; nên cấu hình STORAGE_LOCAL_DIR tuyệt đối trong workspace nếu muốn cố định vị trí. STORAGE_LOCAL_BASE_URL phải là URL BE trình duyệt truy cập được.

Supabase hiện dùng bucket được cấu hình chung với avatar và getUrl ghép URL public. Chưa tự tạo bucket mới hoặc thay bucket vì có thể ảnh hưởng avatar cũ. Khi tới kiểm tra Supabase sẽ hướng dẫn người dùng tạo/cấu hình; private bucket/signed preview chưa triển khai, không dùng chế độ public hiện tại cho nội dung cần giữ kín.

## Kiểm tra của checkpoint

Đã thêm unit tests cho validation, quyền sở hữu, hạn dùng, claim, queue/retry cleanup. Không kết nối DB hoặc Supabase trong các tests này. Người dùng tự restart BE để chạy V48 trên DB development, rồi thử upload thật qua Swagger, xem preview, DELETE và chờ cleanup. Chưa khẳng định Flyway/JPA startup, HTTP integration hoặc provider integration đã pass.
