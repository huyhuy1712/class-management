# Kế hoạch BE: import một đề từ PDF nhiều đề

Trạng thái: kế hoạch triển khai, chưa phải tính năng đã được code.

## 1. Mục tiêu và phạm vi đã chốt

Giáo viên chọn một file PDF và một số đề. Hệ thống chỉ import nội dung, phần, câu hỏi, lựa chọn, đáp án, lời giải, hình ảnh và công thức của đúng đề đó. Giáo viên kiểm tra bản xem trước, chỉnh sửa, tự nhập điểm và hoàn thiện cấu hình trước khi lưu thành đề nháp.

Yêu cầu bắt buộc:

- Mỗi lần chỉ một `examNumber`, không nhận mảng, khoảng số đề hoặc chế độ import tất cả.
- Trước import chỉ cần file và số đề. `requestId` do FE tự sinh để chống gửi trùng; không phải trường giáo viên phải nhập.
- Không yêu cầu môn, khối, điểm hoặc cấu hình giao bài trước import.
- Không tự chia điểm và không gán điểm 0. Các field điểm trong preview là `null`.
- Công thức phải qua nhận dạng LaTeX, kiểm tra cú pháp và render, đồng thời có vùng PDF gốc để đối chiếu.
- Không tự giải toán để suy ra đáp án thiếu hoặc sửa đáp án nguồn.
- Không ghi ngay vào các bảng đề/câu hỏi khi upload hoặc xem preview.
- Sau import phải sửa tay được; phần chỉ có ảnh phải được ghi rõ là ảnh, không giả vờ là công thức/văn bản đã chỉnh sửa được.
- Khi lưu vẫn tuân thủ API tạo đề và validation hiện có; đề được tạo ở trạng thái `DRAFT`.

Bản đầu hỗ trợ bố cục tương tự file mẫu, gồm SINGLE_CHOICE, TRUE_FALSE và SHORT_ANSWER. Không tuyên bố hỗ trợ mọi PDF hoặc mọi loại câu ngay từ đầu. DOCX, PDF scan toàn bộ, MULTIPLE_CHOICE, FILL_BLANK và ESSAY là phạm vi mở rộng sau khi có mẫu kiểm chứng riêng.

### Kiến trúc mở rộng bố cục (áp dụng ngay từ bước 1–2)

- Tách bộ nhận diện `PdfExamLayout` khỏi đọc PDF và mô hình preview chung. Bộ mẫu hiện tại là `vi-three-part-v1`; không coi đó là quy tắc của mọi PDF.
- Một chỉ mục giữ bộ nhận diện đã chọn; xác định phạm vi đề và tách cấu trúc phải dùng cùng bộ, tránh trộn quy tắc giữa các mẫu. Việc chọn bộ thuộc BE; giáo viên vẫn chỉ chọn file và số đề.
- Các mẫu khác nhãn tiêu đề/phần/câu/phương án có thể thêm bộ nhận diện và fixture riêng, dùng lại đọc chữ, tọa độ, cảnh báo, LaTeX, media, preview và lưu. Không tự thử lần lượt rồi lấy kết quả đầu tiên.
- Chưa có tự động chọn bộ nhận diện. Khi triển khai phải đánh giá bằng dấu hiệu và báo không hỗ trợ/mơ hồ nếu không chọn được duy nhất; không fallback âm thầm.
- Giai đoạn hiện tại vẫn đọc theo dòng một cột và yêu cầu lời giải ngay sau từng đề. Hai cột cần bộ dựng thứ tự đọc; scan cần OCR; đáp án cuối tài liệu cần chiến lược ghép phạm vi độc lập. Các phần này phải triển khai và có mẫu kiểm thử trước khi tuyên bố hỗ trợ, không thể chỉ đổi regex.
- Đầu ra các chiến lược phải giữ vùng nguồn riêng cho câu hỏi và lời giải; không đưa vùng chứa đáp án vào ảnh câu hỏi. Điểm luôn chờ giáo viên nhập và LaTeX luôn phải kiểm tra.

## 2. Quy ước BE

- Reuse API, service, repository, validation, media và storage hiện có nếu phù hợp.
- Không tạo một service cho mỗi công đoạn nhỏ. Chỉ thêm thành phần mới khi có trách nhiệm thực sự khác biệt.
- Theo cấu trúc package của project: controller, dto/exam, service/exam, entity, repository/exam, db/migration.
- Tránh N+1: không SELECT/HTTP riêng từng câu, từng option hoặc từng vùng công thức.
- Một upload tạo tác vụ; một endpoint đọc trạng thái/preview; dùng API tạo/sửa đề hiện có để lưu.
- Không giữ transaction DB trong lúc đọc PDF, render ảnh hoặc gọi bộ nhận dạng công thức.
- Chỉ xử lý sâu và render vùng của đề được chọn; việc đọc chỉ mục cả file không đồng nghĩa import tất cả đề.
- Báo file, dòng sửa, nội dung thay đổi và kết quả kiểm tra sau từng đợt triển khai.
- Không tự chạy migration, restart BE hoặc ghi storage ngoài trong quá trình lập kế hoạch. Các hành động này thực hiện theo quy trình được người dùng cho phép.
- File MD này được tạo theo yêu cầu riêng của người dùng; không mặc định tiếp tục tạo các MD ghi thay đổi khác.

## 3. Căn cứ từ file mẫu đã khảo sát

File nguồn: `C:/Users/anhhu/Downloads/10-de-on-tap-cuoi-hoc-ki-1-toan-10-ctst-cau-truc-trac-nghiem-moi.pdf`.

File khoảng 4,57 MB, 145 trang vật lý, 10 đề. Có lớp chữ nhưng nhiều ký hiệu toán bị mất hoặc đảo vị trí khi trích xuất text thông thường. Phần đáp án một lựa chọn có đánh dấu nền vàng trong nội dung trang; không chỉ là annotation PDF. Hình gồm cả ảnh nhúng và đường vẽ/vector.

Phạm vi đã nhận diện để dùng làm dữ liệu chuẩn kiểm thử:

| Số đề | Trang nội dung thi | Trang lời giải |
| --- | --- | --- |
| 1 | 1–4 | 5–16 |
| 2 | 17–19 | 20–29 |
| 3 | 30–33 | 34–44 |
| 4 | 45–47 | 48–58 |
| 5 | 59–62 | 63–72 |
| 6 | 73–76 | 77–86 |
| 7 | 87–90 | 91–100 |
| 8 | 101–104 | 105–114 |
| 9 | 115–118 | 119–129 |
| 10 | 130–133 | 134–145 |

Đây là số trang vật lý PDF, không phải số in ở chân trang. Ranh giới trên là dữ liệu đối chiếu cho file mẫu, tuyệt đối không hard-code vào parser production.

Đề 1 có 12 câu một lựa chọn, 4 câu đúng/sai và 6 câu trả lời ngắn. Số câu bắt đầu lại theo từng phần. Không coi số lượng này là quy luật bắt buộc cho mọi file; lấy số lượng công bố trong tiêu đề từng phần và đối chiếu thực tế.

## 4. Luồng tổng thể

```text
FE: chọn PDF + một số đề
    ↓
POST import: xác thực → kiểm tra file → chống trùng → lưu nguồn riêng → tạo tác vụ
    ↓ 202 + importId
Worker: chỉ mục tiêu đề → xác định vùng đề/lời giải → đọc tọa độ
    ↓
Tách phần/câu/options → ghép đáp án/lời giải → nhận dạng/kiểm tra LaTeX
    ↓
Xử lý ảnh → mapping preview không có điểm → tổng hợp issues
    ↓
GET import: READY_FOR_REVIEW + preview + nguồn đối chiếu
    ↓
FE builder: giáo viên kiểm tra/sửa → tự nhập điểm → bổ sung cấu hình
    ↓
POST /api/exams hiện có → validation đầy đủ → tạo DRAFT
    ↓
GET chi tiết / PUT content hiện có để chỉnh sửa tiếp
```

## 5. API mới

### 5.1. Tạo tác vụ

```http
POST /api/exams/imports/pdf
Content-Type: multipart/form-data
```

| Field | Kiểu | Quy tắc |
| --- | --- | --- |
| file | MultipartFile | PDF hợp lệ, nằm trong giới hạn tài nguyên |
| examNumber | Integer | Số nguyên dương, chỉ một giá trị |
| requestId | UUID | FE sinh một lần cho một thao tác upload; retry giữ nguyên |

Chỉ TEACHER ACTIVE được gọi. Lấy owner từ phiên đăng nhập, không nhận userId/teacherId từ client.

Response dự kiến:

```json
{
  "importId": "86ad42a4-a5d7-43cd-bca0-5bb8e9138d87",
  "examNumber": 2,
  "status": "QUEUED",
  "stage": "WAITING",
  "pollAfterMs": 3000,
  "expiresAt": "2026-10-16T10:00:00+07:00"
}
```

HTTP 202. Thời hạn trên chỉ minh họa; TTL thực tế dùng cấu hình.

Idempotency:

- Unique `(owner_id, request_id)`.
- Cùng key + cùng hash file + cùng examNumber: trả tác vụ cũ, không tạo worker/media mới.
- Cùng key nhưng khác đầu vào: 409.
- Chống race bằng constraint DB, không chỉ kiểm tra trong Java.
- Không tin hash client gửi; BE tính hash trong lúc đọc stream có giới hạn.
- FE không tự động retry bằng UUID mới khi mất kết nối.

### 5.2. Đọc trạng thái hoặc kết quả

```http
GET /api/exams/imports/{importId}
```

Chỉ chủ tác vụ được xem; người khác nhận 404. GET không khởi động lại parser hoặc render lại PDF.

Response khi đang chạy có status, stage, pollAfterMs, thời gian cập nhật và số công đoạn đã hoàn tất. Không đưa phần trăm/ETA giả nếu chưa tính được.

Khi có kết quả:

```json
{
  "importId": "86ad42a4-a5d7-43cd-bca0-5bb8e9138d87",
  "examNumber": 2,
  "status": "READY_FOR_REVIEW",
  "draftToken": "93a2a440-e9d2-49af-8a53-665dd21921dc",
  "sourceRanges": {
    "questionStartPage": 17,
    "solutionStartPage": 20,
    "endPage": 29
  },
  "counts": {
    "sections": 3,
    "questions": 22,
    "unresolvedAnswers": 0,
    "latexReviewRequired": 2
  },
  "preview": { "sections": [] },
  "issues": [],
  "requiresPoints": true
}
```

Số lượng và trang trong ví dụ không phải hợp đồng cố định cho mọi file. sourceRanges thực tế cần thêm tọa độ bắt đầu/kết thúc nếu ranh giới nằm giữa trang.

Không thêm API lưu câu, ảnh hoặc đáp án riêng cho từng phần tử. Nếu cần ảnh đối chiếu riêng tư, ưu tiên truy cập có xác thực hoặc URL ngắn hạn theo khả năng storage hiện có; không trả đường dẫn vật lý máy chủ.

### 5.3. Quy ước lỗi

| HTTP / trạng thái | Trường hợp |
| --- | --- |
| 400 | Thiếu tham số, số đề không hợp lệ, metadata không đúng |
| 403 | Sai role/tài khoản không ACTIVE theo security của project |
| 404 | Tác vụ không tồn tại/không thuộc owner |
| 409 | requestId trùng nhưng khác đầu vào; xung đột tác vụ |
| 413 | Quá giới hạn dung lượng |
| 415 | Không phải PDF hợp lệ |
| 429 | Quá số tác vụ đang xử lý cho một người/hệ thống |
| FAILED + errorCode | Lỗi phát hiện sau khi đã nhận 202, ví dụ không tìm thấy đề, trùng đề, file scan chưa hỗ trợ |

Không trả 200 với preview rỗng và coi là import thành công. Không trả stack trace hoặc nội dung bí mật trong lỗi.

## 6. Dữ liệu tác vụ và migration

Đề xuất một bảng `exam_import_jobs`, migration lấy số tiếp theo tại thời điểm code, không mặc định một version hiện đã dùng.

| Field dự kiến | Mục đích |
| --- | --- |
| id UUID | ID tác vụ không đoán được |
| owner_id | Chủ tác vụ |
| request_id UUID | Chống trùng theo owner |
| source_hash | Đối chiếu retry |
| source_path | File nguồn trong vùng riêng tư |
| source_size / page_count | Giới hạn và chẩn đoán |
| selected_exam_number | Đúng một đề |
| status / stage | Trạng thái nghiệp vụ và công đoạn |
| draft_token UUID | Liên kết media tạm với builder |
| result_payload | Preview + nguồn + issues, JSON có giới hạn kích thước |
| error_code / error_message | Lỗi an toàn để FE hiển thị |
| parser_version | Truy vết phiên bản parser |
| revision | Kiểm soát cập nhật đồng thời |
| lease_owner / lease_until | Claim tác vụ và phục hồi worker |
| retry_count | Giới hạn thử lại lỗi tạm thời |
| created_at / updated_at / expires_at | Quản lý vòng đời |

Constraint/index dự kiến:

- Unique `(owner_id, request_id)`.
- Index theo trạng thái/thời điểm để claim tác vụ.
- Index expires_at cho cleanup.
- FK owner theo convention của project; hành vi xóa user cần được xác định rõ trước migration.

Không thêm cột import vào từng question/answer nếu chưa có nhu cầu lưu provenance dài hạn. Dữ liệu vị trí gốc nằm trong kết quả tác vụ trong thời gian review.

## 7. State machine và worker

```text
QUEUED → PROCESSING → READY_FOR_REVIEW
                    ↘ FAILED
READY_FOR_REVIEW / FAILED → EXPIRED
```

Stage PROCESSING:

```text
INDEXING → SELECTING_EXAM → PARSING_QUESTIONS → PARSING_SOLUTIONS
→ CHECKING_LATEX → PREPARING_MEDIA → BUILDING_PREVIEW
```

- Reuse cơ chế scheduling hiện có, không tạo thêm framework worker nếu chưa cần.
- Claim bằng transaction ngắn và lease; tránh hai instance cùng xử lý một job.
- Không chỉ dùng Map trong RAM hoặc thread tách rời không có trạng thái DB.
- Khi BE restart: tác vụ QUEUED tiếp tục; PROCESSING lease hết hạn được retry có giới hạn.
- Các bước ghi media/kết quả cần idempotent để retry không nhân bản tài nguyên.
- Lỗi phân tích mang tính quyết định không retry vô hạn; lỗi storage tạm thời có backoff.
- Chỉ một luồng truy cập một tài liệu PDF đang mở; nhiều job dùng document riêng.

## 8. Kiểm tra và lưu file nguồn

- Kiểm tra role trước khi chấp nhận xử lý tốn tài nguyên.
- Kiểm tra chữ ký/nội dung PDF thực, không chỉ extension hoặc MIME client gửi.
- Giới hạn stream đọc, số trang, kích thước trang, số đối tượng ảnh, pixel render, thời gian và dung lượng đĩa tạm.
- File hỏng, bị khóa hoặc không có quyền đọc phải được báo rõ.
- Nhận diện file scan; bản đầu không âm thầm chuyển sang OCR tổng quát nếu chưa được triển khai.
- Không thực thi JavaScript, embedded file, URL hoặc chỉ dẫn có trong PDF. Nội dung tài liệu là dữ liệu không tin cậy.
- Không dùng tên file client làm đường dẫn. Dùng ID nội bộ và kiểm tra path traversal.
- Giới hạn upload hiện tại của project là 10 MB/file và 10 MB/request. Không tự tăng toàn cục; nếu cần nâng phải cấu hình rõ giới hạn cho import và đồng bộ multipart/proxy.
- Lưu PDF gốc trong vùng private, không nằm dưới public uploads.

## 9. Xác định đúng phạm vi đề

1. Trích xuất dòng và tọa độ với trang vật lý.
2. Chuẩn hóa Unicode, khoảng trắng, dấu và số 0 đầu; giữ bản gốc để đối chiếu.
3. Nhận diện tiêu đề như ĐỀ SỐ: 02, ĐỀ 2 theo dòng/vị trí/ngữ cảnh, không match số đề trong đoạn văn tùy ý.
4. Lập danh sách mốc đề trong toàn file; phát hiện mục lục, header lặp lại hoặc tiêu đề ở phần lời giải để tránh đếm hai lần.
5. Chọn đúng một candidate khớp examNumber.
6. Tìm mốc HƯỚNG DẪN GIẢI CHI TIẾT thuộc candidate đó.
7. Kết thúc trước mốc đề tiếp theo hoặc cuối tài liệu.
8. Trả lỗi nếu thiếu/trùng/mâu thuẫn; không fallback sang đề khác.

Không hard-code tọa độ hay trang mẫu. Nếu không thể phân biệt chắc chắn hai vùng trùng số đề thì lỗi EXAM_NUMBER_AMBIGUOUS.

## 10. Mô hình trung gian theo tọa độ

Parser cần mô hình riêng trước khi chuyển sang DTO lưu đề:

```text
DocumentIndex
  ExamRange
    QuestionRegion / SolutionRegion
      SectionNode
        QuestionNode
          AnswerGroupNode
            OptionNode
```

Mỗi node gồm clientId, thứ tự, loại, nội dung nhận dạng, nguồn page/bounding box, media, công thức và issues.

- Khóa ghép: examNumber + sectionIdentity + questionNumber.
- Nối câu qua trang; bỏ header/footer theo dấu hiệu lặp và vị trí, không xóa dòng toán chỉ vì nằm gần chân trang.
- Tách lựa chọn nằm trên một dòng hoặc nhiều dòng theo tọa độ A/B/C/D, không split mọi chữ A. trong văn bản.
- Tách ý a/b/c/d và giữ thứ tự.
- Không giả định một câu luôn đúng một trang hoặc một ảnh.

## 11. Ghép đáp án và lời giải

### SINGLE_CHOICE

- Xác định vùng phương án trong phần lời giải.
- Đọc vùng tô vàng/đánh dấu, gồm cả rectangle/path trên content stream và annotation nếu có.
- Liên hệ vị trí vùng tô với phương án, tránh coi mọi vùng vàng là đáp án.
- Dùng nhãn kết luận như Chọn B làm bằng chứng bổ sung nếu có.
- Hai dấu hiệu bất đồng hoặc nhiều phương án cùng được đánh dấu: ANSWER_CONFLICT.

### TRUE_FALSE

- Ưu tiên bảng kết luận từng ý khi nhận diện được.
- Đọc kết luận Đúng/Sai theo từng ý, không nhặt chữ Đúng/Sai từ lời giải bất kỳ.
- Ý không xác định được là unresolved; tuyệt đối không biến thiếu dữ liệu thành false.
- Điểm và scoringType do giáo viên thiết lập sau import; parser không áp quy tắc chấm mặc định.

### SHORT_ANSWER

- Đọc nhãn Trả lời/Đáp án và vùng giá trị; giữ cả giá trị gốc lẫn giá trị chuẩn hóa có kiểm soát.
- Kiểm tra dấu âm, dấu phẩy thập phân, đơn vị và yêu cầu làm tròn.
- Không chuyển đổi ý nghĩa, tự tính kết quả hoặc tự thêm đáp án tương đương nếu chưa có cơ chế chấm hỗ trợ.

### Lời giải

- Ghép theo cùng đề/phần/câu.
- Giữ text sửa được và media lời giải có công thức/hình.
- Không chép đáp án hoặc vùng có đánh dấu đúng vào nội dung đề thi cho học sinh.
- Bất đồng trong tài liệu nguồn được báo để giáo viên xử lý, không được âm thầm tự sửa.

## 12. Pipeline LaTeX bắt buộc

```text
Phát hiện vùng toán → nhận dạng LaTeX → chuẩn hóa không đổi nghĩa
→ kiểm tra cú pháp → render → đối chiếu với PDF gốc → review khi cần
```

Phải phân biệt ba mức:

1. Đọc được ký tự hoặc có ảnh vùng toán.
2. LaTeX hợp lệ và render được.
3. Công thức khớp nội dung nguồn.

Mức 2 không chứng minh mức 3. Không tuyên bố đã kiểm tra đúng toán chỉ vì renderer không báo lỗi.

Kết quả từng vùng công thức dự kiến:

```text
formulaId, sourceRegion, sourceImage,
recognizedLatex, syntaxStatus, renderStatus,
reviewRequired, issues
```

Cần thử nghiệm bộ nhận dạng trên các phân số, căn, vectơ, hệ phương trình, bảng biến thiên và công thức trong phương án của file mẫu trước khi chốt công nghệ. PDFBox không tự thực hiện đầy đủ chuyển PDF toán sang LaTeX.

Nếu dùng dịch vụ ngoài/model để nhận dạng:

- Phải chốt provider, chi phí, nơi gửi dữ liệu và quyền sử dụng trước triển khai.
- Gửi theo batch vùng liên quan, không một HTTP request mỗi ký hiệu.
- Có timeout, giới hạn concurrency, cache theo hash vùng + phiên bản bộ nhận dạng.
- Chặn lệnh/chỉ dẫn từ tài liệu tác động tới thao tác hệ thống.
- Không nhận kết quả trả về là đáp án đáng tin cậy nếu bộ nhận dạng tự suy luận thêm.

Chưa chọn provider trong kế hoạch này. Đây là dependency quyết định trước khi triển khai bước nhận dạng công thức. Fallback ảnh chỉ giữ hình thức; không đáp ứng yêu cầu sửa LaTeX nếu không có recognizedLatex và review thích hợp.

## 13. Hình ảnh và media

- Đọc ảnh nhúng và vùng vẽ vector.
- Render/crop theo nguồn câu hỏi, không lấy câu từ bản lời giải có tô đáp án.
- Tách question image, option image và explanation image theo model đang có.
- Với nhiều vùng cần gắn vào một field ảnh hiện có, dùng ảnh ghép có thứ tự và giới hạn pixel; giữ metadata nguồn trong preview. Không giả định DB đang hỗ trợ nhiều media tùy ý trong một field.
- Tránh lặp cùng nội dung đầy đủ ở cả text và ảnh khi FE render.
- Reuse validation định dạng/kích thước, storage và lifecycle media tạm.
- Bổ sung entry point nội bộ nhận bytes/stream nếu cần; không dùng HTTP loopback và không lệ thuộc MockMultipartFile của test ở production.
- Không tự tạo pipeline reserve/complete/delete song song với ExamMediaLifecycle hiện có.
- Giới hạn pixel/chiều dài khi nối vùng qua nhiều trang; vượt giới hạn trả issue thay vì tạo ảnh không kiểm soát.
- Ảnh nguồn đối chiếu có đáp án chỉ dành giáo viên; việc cấp URL phải giữ được quyền xem. Không mặc định đưa mọi ảnh đối chiếu lên media công khai.

## 14. Preview và lỗi cần kiểm tra

Preview DTO khác payload CreateCompleteExamRequest vì chưa có điểm/môn/khối/cấu hình đầy đủ. Không bỏ annotation bắt buộc của DTO lưu đề chỉ để preview đi qua.

Mỗi issue gồm:

```text
code, severity, path, examNumber, sectionNumber,
questionNumber, sourceRegions, message, suggestedAction
```

Mã dự kiến:

- EXAM_NOT_FOUND, EXAM_NUMBER_AMBIGUOUS, SOLUTION_BOUNDARY_MISSING.
- SECTION_UNRECOGNIZED, QUESTION_BOUNDARY_UNCERTAIN, QUESTION_COUNT_MISMATCH.
- OPTION_MISSING, ANSWER_NOT_FOUND, ANSWER_CONFLICT, TRUE_FALSE_ITEM_UNRESOLVED.
- LATEX_INVALID, LATEX_RENDER_FAILED, LATEX_REVIEW_REQUIRED.
- IMAGE_REGION_UNCERTAIN, MEDIA_LIMIT_EXCEEDED.
- POINTS_REQUIRED.

Phân loại:

- FATAL: không thể tạo preview đáng tin cậy; job FAILED.
- BLOCKING: có preview nhưng cần sửa trước khi lưu.
- WARNING: cần giáo viên xem xét, không tự chứng minh nội dung đúng.

Mức severity được xác định theo lỗi cụ thể, không gán confidence phần trăm không có căn cứ.

## 15. Giáo viên chỉnh sửa và lưu

FE nhận preview rồi dùng builder hiện có để:

1. Đối chiếu câu với vùng PDF gốc.
2. Sửa text/LaTeX/ảnh/lựa chọn/đáp án/lời giải.
3. Tự nhập điểm từng nhóm/câu/ý; cấu hình chấm đúng/sai sau import.
4. Điền môn, khối, thời lượng, số lượt và phân công/quyền xem kết quả như luồng tạo đề.
5. Chạy validation trước lưu và POST /api/exams hiện có.

Điểm câu bằng tổng điểm nhóm, điểm section và maxScore được tính theo validation hiện có. Không tạo điểm tạm trong DB hoặc dùng -1 làm giá trị báo thiếu.

LaTeX do giáo viên chỉnh sửa phải được kiểm tra lại cú pháp/render trong luồng xác thực tương ứng trước khi được coi là đã kiểm tra. Việc giáo viên xác nhận nội dung là một hành động có chủ ý, không phải bằng chứng máy đã chứng minh công thức tương đương.

Khi save cần kiểm tra owner/draftToken/media còn hạn. Nếu bổ sung liên kết importId vào request tạo đề để kiểm tra nguồn/trạng thái, field này phải tùy chọn cho luồng tạo tay và kiểm tra ownership server-side. Không tin flag verified do client tự gửi để bỏ qua kiểm tra kỹ thuật.

Sau khi lưu, GET chi tiết và PUT content hiện có vẫn là nguồn dữ liệu chuẩn. Không tiếp tục dùng preview hết hạn làm bản chính.

## 16. Cleanup và lỗi giữa chừng

- File gốc/preview hết TTL được dọn qua worker có giới hạn mỗi lượt.
- Không xóa file của tác vụ đang có lease hợp lệ.
- Media tạm bỏ dở hoặc upload lỗi được xử lý bằng lifecycle hiện có.
- Media đã gắn vào đề thành công không được xóa chỉ vì job hết hạn.
- Job fail không được để lại Exam/Question/Answer dở dang.
- Dọn file và DB không nằm cùng một transaction nguyên tử: cần trạng thái retry/compensation, không tuyên bố rollback DB sẽ hoàn tác storage.
- Chỉ ghi log ID, stage, thời gian, lỗi an toàn; không log PDF nguyên văn, toàn bộ đáp án hoặc token.

## 17. Transaction và hiệu năng

Các transaction ngắn riêng biệt: tạo job, claim lease, cập nhật stage/checkpoint, ghi kết quả/failure, lưu đề cuối qua API hiện có.

Không bọc cả pipeline trong @Transactional. Không gọi phương thức @Transactional qua self-invocation rồi cho rằng có transaction mới; reuse cơ chế transaction/lifecycle phù hợp của project.

Giới hạn cấu hình cần có trước production:

- Dung lượng file, số trang, số job chờ/đang chạy mỗi owner.
- Worker concurrency, lease timeout, tổng thời gian xử lý, retry/backoff.
- DPI render, pixel tối đa/vùng, ảnh tối đa, dung lượng media và preview.
- TTL file/job, batch cleanup.
- Batch size và thời gian chờ của nhận dạng công thức nếu có.

Nguyên tắc query/request:

- Scan tiêu đề toàn file một lượt, xử lý sâu đúng đề được chọn.
- Không mở lại PDF cho mỗi ký tự hoặc mỗi GET trạng thái.
- Không SELECT từng question/answer khi mapping preview.
- Media persistence tiếp tục dùng các bước cần thiết của lifecycle; không hứa chỉ một INSERT cho toàn bộ ảnh.
- Một POST upload, GET polling có khoảng chờ do BE trả, dừng khi terminal state.
- Refresh preview có thể reuse importId, không upload lại PDF.
- Khi lưu đề vẫn một POST hoàn chỉnh, không POST riêng từng câu.

## 18. Tổ chức code dự kiến

Tên lớp mới dưới đây là đề xuất; khi code phải kiểm tra catalog project để tránh tạo trùng chức năng.

| Thành phần | Hướng thực hiện |
| --- | --- |
| ExamController | Thêm POST/GET import, không controller riêng nếu chưa cần |
| dto/exam | DTO request/status/preview/issues/source region; không dùng DTO lưu bắt buộc cho dữ liệu thiếu điểm |
| ExamCreationService | Reuse lưu đề cuối, không đưa toàn bộ đọc PDF vào transaction tạo đề |
| service/exam | Một thành phần điều phối import và worker kỹ thuật mỏng |
| Module parser | Các lớp thuần cho indexing/layout/answer/formula; không mỗi hàm một @Service |
| ExamStructureValidator | Reuse kiểm tra dữ liệu hoàn chỉnh; giữ ràng buộc hiện có |
| ExamMediaService/ExamMediaLifecycle/StorageService | Reuse media và dọn file; chỉ mở rộng API nội bộ cần thiết |
| ExamContentUpdateService/ExamDetailService | Reuse chỉnh sửa/tải đề sau lưu |
| entity + repository/exam | Job entity/repository cho trạng thái bền vững và claim task |
| pom.xml | PDFBox; dependency nhận dạng/render LaTeX chỉ sau khi chọn và kiểm chứng |
| db/migration | Bảng job, constraint/index; chọn version chưa dùng tại lúc code |

Không đổi schema nghiệp vụ đề/câu/đáp án nếu mapping hiện có đã đáp ứng. Mọi thay đổi media/DTO ngoài phạm vi phải nêu lý do và kiểm tra tương thích.

## 19. Lộ trình triển khai theo cổng nghiệm thu

### Đợt 1: phạm vi đề

- Prototype PDFBox đọc tiêu đề và tọa độ.
- Xác định riêng đúng 10 đề của file mẫu và mốc lời giải.
- Kiểm tra số 02/2, trùng tiêu đề, footer reset, đề không tồn tại và ranh giới giữa trang.
- Chưa lưu media, chưa tạo Exam.
- Chỉ qua đợt 2 khi bảng phạm vi khớp đối chiếu.

### Đợt 2: cấu trúc câu

- Tách ba loại câu của mẫu và câu qua trang.
- Tạo IR/provenance, nhận diện lựa chọn/ý đúng sai và đoạn dùng chung.
- Đối chiếu số câu theo tiêu đề từng phần và thực tế.
- Chưa coi import có đáp án là hoàn tất.

### Đợt 3: đáp án/lời giải

- Đọc tô vàng, kết luận, bảng đúng/sai, trả lời ngắn.
- Ghép theo đề/phần/câu; gắn issues khi thiếu/mâu thuẫn.
- Đối chiếu thủ công toàn bộ đáp án của ít nhất một đề trước khi mở rộng cả 10.

### Đợt 4: hình và LaTeX

- Chọn bộ nhận dạng qua thử nghiệm, triển khai syntax/render/nguồn đối chiếu.
- Xử lý ảnh nhúng/vector/vùng qua trang và media riêng của lời giải.
- Kiểm tra không lộ đánh dấu đáp án trên nội dung thi.
- Đánh dấu rõ vùng chưa đạt, không tuyên bố tự động chính xác 100%.

### Đợt 5: job/API

- Migration job, POST nhận tác vụ, worker claim/retry, GET status/preview.
- Kiểm thử ownership, requestId race, restart, TTL và cleanup.
- Không gộp xử lý PDF vào request dài dễ timeout.

### Đợt 6: nối builder và save

- FE nhận preview, chỉnh tay, nhập điểm và cấu hình còn thiếu.
- Validation cuối và POST tạo đề hiện có.
- GET/PUT sau lưu giữ nguyên nội dung, ảnh, LaTeX, lời giải và đáp án.
- Phần này cần phối hợp FE, không thể khẳng định BE đơn lẻ đã hoàn thành UX chỉnh sửa.

## 20. Kế hoạch kiểm thử

### Unit

- Chuẩn hóa số đề, match tiêu đề có ngữ cảnh, từ chối mơ hồ.
- Ranh giới lời giải và câu/phần qua trang.
- Ghép số câu lặp theo phần; thứ tự options/ý.
- Đáp án tô vàng, bảng Đúng/Sai, thiếu ý khác false.
- Trả lời ngắn dấu âm/dấu phẩy/đơn vị/làm tròn.
- Điểm null trong preview, không tự phân điểm.
- LaTeX invalid/render fail và issue không chắc chắn.
- Idempotency, quyền truy cập, state transition và limits.

### Parser integration với PDF

- Chạy cả 10 đề của file mẫu, đối chiếu phạm vi và các vùng nguồn.
- Câu có ảnh vector, công thức dài, lựa chọn cùng dòng, câu qua trang.
- Đáp án không có text explicit, lời giải dài nhiều trang và nguồn mâu thuẫn.
- Không lấy nhầm tiêu đề trong lời giải/mục lục hoặc số trang footer.

### DB/storage integration

- Claim job đồng thời, retry sau crash và unique requestId.
- Media fail giữa chừng, hết hạn, save trước cleanup và retry cleanup.
- Save lỗi không tạo Exam dở dang; nguồn riêng tư không truy cập bằng URL public.
- Không chạy những kiểm thử ghi DB/storage thật nếu chưa có môi trường và quyền phù hợp.

### End-to-end

- Upload/chọn một đề → status → preview → sửa công thức/đáp án → tự nhập điểm → lưu DRAFT.
- Tải lại và sửa bằng API cũ.
- Publish và làm thử để kiểm chứng nội dung/đáp án/điểm sau import.
- HS không đọc được job, PDF nguồn hoặc preview của giáo viên.

Không đưa file có bản quyền vào repository nếu chưa có quyền; ưu tiên fixture PDF nhỏ tự tạo và file mẫu local để kiểm thử đối chiếu.

## 21. Tiêu chí hoàn thành

Chức năng chỉ được coi là đạt khi:

1. Mỗi tác vụ chỉ tạo preview của một đề đã chọn, không lẫn câu/đáp án đề khác.
2. Đủ cấu trúc và hình theo phạm vi hỗ trợ; lỗi không được che thành thành công.
3. Đáp án ghép đúng hoặc được đánh dấu cần sửa, không tự suy luận thay.
4. Công thức qua bước LaTeX và có cơ chế review đối chiếu; không âm thầm mất ký hiệu.
5. Không tự cho điểm; lưu bị chặn khi cấu hình/điểm/đáp án bắt buộc còn thiếu.
6. Giáo viên sửa và lưu được bằng luồng hiện có; tải lại không mất dữ liệu.
7. Có chống trùng, ownership, limits, restart recovery và cleanup.
8. Không N+1 query/HTTP theo từng câu, không giữ transaction dài.
9. Có bằng chứng kiểm thử parser, API và save; phân biệt rõ unit pass với PostgreSQL/storage/FE integration đã chạy hay chưa.

## 22. Các quyết định kỹ thuật còn phải chứng minh

- Bộ nhận dạng công thức và renderer LaTeX phù hợp công thức trong file mẫu; chưa chốt provider chỉ từ việc PDF có lớp chữ.
- Cách lưu/trả ảnh nguồn private với storage đang cấu hình.
- Giới hạn tài nguyên và concurrency sau benchmark, không đoán thời gian import.
- Mức bảo toàn bố cục khi nhiều vùng ảnh/text phải mapping vào field media hiện có.
- Cách tái kiểm tra công thức giáo viên đã sửa và liên kết provenance import khi lưu mà không làm hỏng luồng tạo tay.

Không cần hỏi lại các quyết định nghiệp vụ đã chốt: chỉ một đề, không điểm/môn/khối trước import, giáo viên tự cho điểm sau import và bắt buộc kiểm tra LaTeX.

## 23. Tham chiếu kỹ thuật

- [Apache PDFBox FAQ: text extraction, rendering và giới hạn bộ nhớ](https://pdfbox.apache.org/3.0/faq.html).
- File mẫu local và các trang vật lý trong mục 3 là căn cứ đối chiếu bố cục.
- Luồng hiện có cần reuse: ExamCreationService, ExamStructureValidator, ExamContentUpdateService, ExamDetailService, ExamMediaServiceImpl, ExamMediaLifecycle và StorageService.

File này là kế hoạch, không xác nhận API/import/migration đã được triển khai. Bước code đầu tiên là chứng minh bộ xác định phạm vi đề hoạt động đúng trên file mẫu.
