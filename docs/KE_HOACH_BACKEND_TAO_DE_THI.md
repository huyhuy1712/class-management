# Kế hoạch Backend: lưu đề thi hoàn chỉnh

Ngày cập nhật: 08/10/2026. Nhánh mặc định: `AH`.

Đây là kế hoạch đề xuất, không phải lệnh tự động sửa code, pull, deploy hay tiếp tục các phase. Repo thực tế là nguồn xác định cấu trúc. Những quyết định nghiệp vụ ghi là “cần chốt” phải được xác nhận trước khi triển khai phần phụ thuộc.

## 1. Phạm vi và kết quả

Hoàn thiện BE để giáo viên upload media, lưu toàn bộ đề, mở lại, sửa DRAFT, publish và xóa. Chưa triển khai học sinh làm bài hoặc chấm bài, nhưng dữ liệu phải hỗ trợ các luồng đó.

FE giữ nháp local, upload media riêng khi cần và gửi một request lưu toàn bộ đề. Không lưu từng section/question bằng các HTTP request riêng. Một lần tạo hoặc sửa cấu trúc dùng một transaction DB. Response tạo/sửa chỉ trả ID, status, maxScore, updatedAt và thông tin media cần thiết; không tải lại cả cây nếu FE không cần.

Không serialize entity, không lưu binary/Base64 trong DB hoặc JSON, không query từng ID trong loop. Không đổi package hiện tại hoặc thêm bảng chỉ để mirror `answerGroups` của FE.

## 2. Hiện trạng đã đối chiếu với AH local

| Thành phần | Hiện trạng | Việc cần làm |
|---|---|---|
| Exam API | GET list, PUT metadata, DELETE với force | Thêm create/detail/publish và update cấu trúc |
| Domain | Exam, Assignment, targets, Section, Question, Answer, Option, ScoringRule đã có | Reuse mapping/repository, kiểm tra constraint |
| Migration | V29–V45 xây module đề hiện tại | Chỉ thêm migration mới khi có gap |
| maxAttempts | Exam và Assignment chấp nhận NULL hoặc > 0 | Cần migration nếu chọn 0 = unlimited |
| Mã đề | V44 có UNIQUE(teacher_id, code) | Validate trước và xử lý conflict DB khi concurrent |
| Scoring | V46 chuyển cấu hình chấm và rule xuống Answer; mỗi Answer là một nhóm | Chốt điểm từng nhóm với builder |
| Media | StorageService có upload/delete/getUrl; local và Supabase | Bổ sung vòng đời temp và quyền sử dụng |
| Cột media | Một số cột/entity hiện mang tên image_url/audio_url | Có thể lưu object path vào cột hiện tại; không đổi tên schema chỉ vì DTO dùng Path |
| Storage URL | getUrl hiện ghép URL, không gọi HTTP | Giữ việc map DTO không gọi provider cho từng file |
| JPA | open-in-view=false; ddl-auto=update | Kiểm tra migration bằng môi trường test ddl-auto=validate |
| Tests | Chưa thấy backend/src/test | Thêm kiểm tra nghiệp vụ và integration có ý nghĩa |

Đây chưa phải audit đầy đủ hoặc xác nhận schema DB đang chạy. Khi bắt đầu code: kiểm tra working tree, branch, migrations/entities và contract FE mới nhất. Không ghi đè thay đổi đang có. Fetch remote để so sánh khi cần; không tự merge/pull vào checkout có thay đổi.

## 3. Các quyết định nghiệp vụ cần chốt

- `ALL` là toàn bộ học sinh thuộc các lớp do giáo viên quản lý hay phạm vi khác? Không hiểu mặc định là mọi học sinh trong hệ thống.
- DRAFT có bắt buộc đủ câu hỏi/đáp án đúng ngay khi lưu không? Đề xuất bản đầu: lưu complete DRAFT phải hợp lệ và có ít nhất một câu hỏi; nếu cần nháp chưa hoàn chỉnh, tách validation save/publish rõ ràng.
- `maxAttempts`: đề xuất 0 = không giới hạn, số dương = giới hạn; Assignment NULL = kế thừa Exam. Exam phải có giá trị rõ ràng khi tạo mới. Kiểm tra các dữ liệu/luồng cũ trước migration.
- `timeLimit`: đề xuất Exam >= 1 phút; Assignment NULL = kế thừa. Không dùng cùng một giá trị vừa biểu thị unlimited vừa inherit.
- Thời gian mở/đóng: DTO cần contract timezone rõ ràng vì schema hiện dùng TIMESTAMP không timezone. Không tự chuyển schema; chốt cách chuyển đổi trước khi nối FE.
- Bản đầu tạo một Assignment DRAFT cùng Exam. Publish Exam chỉ khóa nội dung; không tự OPEN Assignment. Lịch giao đề là hành vi riêng.
- Student targets phải là STUDENT và thuộc phạm vi giáo viên được phép giao đề, xác minh bằng quan hệ DB; không chỉ kiểm tra user tồn tại.

## 4. API và tương thích

| API | Mục đích |
|---|---|
| POST /api/exam-media | Upload một ảnh/audio tạm |
| DELETE /api/exam-media/{mediaId} | Xóa media tạm còn thuộc draft |
| POST /api/exams | Tạo toàn bộ đề và assignment |
| GET /api/exams/{id} | Teacher lấy toàn bộ cấu trúc để sửa |
| PUT /api/exams/{id} | Giữ contract metadata đang có; thêm DRAFT guard |
| PUT /api/exams/{id}/content | Đề xuất thay toàn bộ cấu trúc và cấu hình draft trong một transaction |
| PATCH /api/exams/{id}/publish | Validate lại và khóa nội dung |
| DELETE /api/exams/{id} | Giữ rule attempts/force và cleanup media sau commit |

Endpoint `/content` là đề xuất để không phá PUT metadata hiện tại; chốt contract sau audit FE. Reuse API subjects, teacher classes/students, list và delete. Không thêm endpoint cho từng child trong lần lưu đầu.

Upload trả `mediaId`, `path`, `url`, loại và kích thước. Create/update dùng mediaId để chứng minh file đã được BE upload, không tin path tùy ý do client gửi. Có thể giữ path trong DTO để tương thích nhưng phải resolve qua dữ liệu media do server quản lý.

## 5. DTO và validation

CreateCompleteExamRequest gồm basicInfo, assignment, draftToken và sections. BasicInfo có title, subjectId, gradeLevel, description, purpose, timeLimit, maxAttempts. Code do BE tự sinh EX-<TeacherID>-<6 chữ cái A–Z>, không lấy từ FE. Assignment có type, targets, visibility, threshold và thời gian nếu UI hỗ trợ. Sections chứa questions; mỗi question chứa answers/options/scoringRules.

DTO phải biểu diễn đầy đủ dữ liệu: Answer.points/scoringType, correctAnswerText, caseSensitive; Option.isCorrect/points và nội dung; ScoringRule.correctCount/score. Mỗi answerGroup FE map thành một Answer; items của CHOICE/TRUE_FALSE map thành AnswerOption. SHORT_ANSWER/FILL_BLANK/ESSAY giữ nội dung đáp án ở Answer. Không flatten nhiều nhóm thành một nhóm và không thêm bảng answer_groups. Cột correct_boolean cũ tạm giữ để không xóa dữ liệu ngoài phạm vi; TRUE_FALSE theo nhóm dùng answer_options.is_correct làm giá trị đáp án Đúng/Sai từng ý.

Bean Validation kiểm tra required, độ dài theo cột, ID dương, enum hợp lệ và nested @Valid. Đặt giới hạn cấu hình cho tổng section/question/answer/option, độ dài text, tổng media và kích thước request; kiểm tra tổng toàn cây, không chỉ từng list. Từ chối phần tử null và ID trùng. Giới hạn cụ thể phải được chọn theo nhu cầu và đo tải.

Business validator kiểm tra:

- Teacher đang hoạt động và ownership; teacherId lấy từ principal, không từ payload.
- Subject tồn tại; mã đề tự sinh bằng SecureRandom và kiểm tra theo teacher, retry tối đa 10 candidate. UNIQUE(teacher_id, code) DB vẫn là lớp bảo vệ cuối; collision concurrent trả 409 và rollback, không retry trong transaction đã lỗi.
- ALL không nhận targets dư; CLASS có classIds, không studentIds; STUDENT có studentIds, không classIds. Batch query quyền sở hữu/quan hệ bằng IN và tập ID.
- Order trong mỗi parent không trùng, ổn định; đề xuất server chuẩn hóa liên tiếp từ thứ tự array. Không nhận hai nguồn thứ tự mâu thuẫn.
- SINGLE_CHOICE có ít nhất hai options và đúng một đáp án đúng; MULTIPLE_CHOICE có ít nhất hai options và ít nhất một đúng. Chính sách điểm phần đúng/sai phải chốt trước triển khai chấm bài.
- TRUE_FALSE có correctBoolean; SHORT_ANSWER/FILL_BLANK có đáp án hợp lệ theo representation hiện có; ESSAY không buộc đáp án tự động. Từ chối field không phù hợp với loại đáp án.
- Cấu hình chấm nằm ở từng Answer. PER_ANSWER không có scoringRules; CORRECT_COUNT của nhóm TRUE_FALSE đếm các ý (AnswerOption) trả lời đúng. Một question được trộn nhiều nhóm với cấu hình khác nhau, kể cả nhóm tự luận; ESSAY không dùng CORRECT_COUNT.
- AFTER_SCORE yêu cầu threshold >= 0 và <= maxScore; các chế độ khác không nhận threshold dư. ScoreVisibility chỉ NEVER/AFTER_SUBMIT/AFTER_EXAM; AFTER_SCORE chỉ thuộc AnswerVisibility.

Lỗi có đường dẫn field như sections[0].questions[1].answers[2], message tiếng Việt. Dùng 400 cho input, 401 cho thiếu xác thực, 403 cho sai role, 404 cho exam không thuộc quyền truy cập theo convention thống nhất, 409 cho conflict/status/concurrent change, 413 cho payload lớn. Không map mọi lỗi storage thành 403 và không leak SQL.

## 6. Một nguồn tính điểm

Dùng BigDecimal, tối đa hai chữ số thập phân, không làm tròn âm thầm và không dùng double. Kiểm tra mọi giá trị và tổng phù hợp DECIMAL(6,2), tối đa 9999.99.

Đề xuất công thức:

- PER_ANSWER ở nhóm TRUE_FALSE: điểm nhóm bằng tổng Option.points; chọn sai và bỏ trống được 0 cho ý đó. Với CHOICE cần chốt cách chấm nhiều lựa chọn trước implementation; không tự cộng điểm các phương án sai. SHORT_ANSWER/ESSAY có điểm tối đa tại Answer.points.
- CORRECT_COUNT ở nhóm TRUE_FALSE: rules phủ count 0..N của N options; count không trùng, score không âm, score tăng không giảm, count 0 có score 0. Answer.points = score tại N. Đây là quy tắc validation đề xuất cần chốt, chưa phải chức năng đã triển khai.
- Question.points = tổng Answer.points; điểm question FE gửi phải khớp. Không chia đều điểm hoặc làm tròn âm thầm nếu builder thiếu điểm nhóm.
- Exam.maxScore = tổng Question.points; section total chỉ derive để hiển thị.

FE có thể gửi points/maxScore để hiển thị nhưng BE derive giá trị lưu. Nếu nhận giá trị dư thì kiểm tra khớp, không âm thầm chấp nhận hai nguồn khác nhau. Công thức trên là đề xuất cần đối chiếu cách chia điểm builder; không áp đặt khi FE dùng semantics khác.

## 7. Media: ưu tiên path ổn định

Đề xuất thay phương án chuyển mọi file sau commit bằng path UUID ổn định:

`exam-media/gv_{teacherId}/{uploadToken}/{uuid}.{ext}`

Upload tạm và media đã gắn đề dùng cùng object path. “Tạm/chính thức” là trạng thái quản lý, không bắt buộc là vị trí file. Lưu DB reference cùng transaction với Exam, không rename/copy file và không update hàng loạt path sau commit. Như vậy create không gọi Supabase cho từng file và không có cửa sổ DB trỏ tới file vừa bị chuyển.

Cần registry media do BE quản lý để xác minh tồn tại, owner, draft và lifecycle. Đây là bổ sung schema có lý do, cần giải thích trước khi code: metadata upload, trạng thái TEMP/ATTACHED, timestamps và liên kết exam. Nếu một media được dùng nhiều nơi trong cùng đề, chỉ claim một lần; muốn chia sẻ giữa nhiều đề cần reference model riêng.

Claim TEMP -> ATTACHED và lưu đề nằm trong một transaction, có khóa/điều kiện cập nhật để cleanup không xóa file đang được claim. Upload hoàn tất rồi mới trả mediaId. Upload storage thành công nhưng registry fail phải compensation delete, log lỗi cleanup để xử lý lại. Không gọi storage để kiểm tra từng path lúc lưu đề.

Nếu bắt buộc folder chứa examId: dùng finalize job bền vững có retry, giữ path nguồn hợp lệ tới khi copy thành công và DB đổi reference; chỉ xóa nguồn sau commit. Phương án này phức tạp và nhiều provider calls hơn nên không mặc định dùng.

Validate file bằng size, whitelist extension/MIME và nhận diện signature/nội dung; không chỉ tin Content-Type. Image: JPEG/PNG/WebP, giới hạn kích thước ảnh/pixel; không nhận SVG/HTML. Audio: MP3/M4A/AAC khi bộ kiểm tra hỗ trợ đúng container; chưa hỗ trợ thì reject rõ ràng. UUID filename, đường dẫn do server sinh, chặn traversal và không nhận URL ngoài hệ thống.

StorageService vẫn dùng chung local/Supabase. Thêm khả năng riêng chỉ khi cần, tránh thiết kế abstraction quá rộng. getUrl không đọc binary hoặc gọi provider từng item. Trước khi phục vụ đề kín cho học sinh phải chốt private storage và URL hết hạn; batch sign khi provider hỗ trợ, không mặc định public vĩnh viễn cho nội dung cần bảo mật.

## 8. Transaction, cạnh tranh và persistence

Create: resolve principal -> batch validate targets -> validate cây/scoring/media -> build entities -> persist theo tầng cha/con -> claim media -> commit -> trả response nhỏ. Không SELECT lại mỗi child vừa tạo, không saveAndFlush trong mỗi vòng lặp, không xóa thủ công để giả lập rollback.

INSERT tăng theo số record là bình thường; yêu cầu không N+1 áp dụng SELECT validation/load. Entities hiện dùng GenerationType.IDENTITY: saveAll không bảo đảm JDBC insert batching. Chỉ đổi sequence/batch strategy khi đã đo lợi ích và có migration phù hợp; không hứa số INSERT cố định.

Update/publish/delete cùng khóa row Exam trong transaction hoặc dùng version với điều kiện cập nhật. Đề xuất khóa row Exam để reuse schema trước; mọi API metadata/content/publish/delete phải dùng cùng cơ chế. Tránh update và publish chạy đồng thời làm thay nội dung sau publish. Khi thêm optimistic version để chống mất chỉnh sửa giữa hai tab, phải có migration và contract version rõ ràng.

Update complete có thể replace tree khi chưa có attempts và semantics ID cho phép; nếu giữ IDs, batch load/validate mọi child thuộc đề. Với replace: bulk delete đúng thứ tự hoặc cascade DB đã kiểm chứng, flush tại ranh giới cần thiết để tránh UNIQUE order khi insert mới, không delete/save từng child. Không được làm mất attempts; DRAFT nhưng đã có dữ liệu attempt bất thường phải từ chối hoặc xử lý theo rule đã chốt.

Publish chỉ DRAFT -> PUBLISHED, validate cấu trúc và media đã ATTACHED; không trở lại DRAFT. CLOSED là hành vi đóng riêng nếu được triển khai, không phải kết quả DELETE. Delete xóa row; có attempt và force=false trả 409, force=true giữ hành vi hiện tại.

## 9. GET detail và hiệu năng

Load theo tầng bằng IN: Exam + subject; assignments + targets; sections; questions; answers; options; scoringRules; media metadata nếu cần. Ghép DTO bằng Map trong memory và thứ tự ổn định. Không giant fetch join nhiều collections. Query count bounded theo tầng trong giới hạn payload; danh sách lớn có thể cần chia IN thành chunks và phải đo thực tế.

Audit list exams hiện tại: subject lazy đang được đọc ở mapper, cần fetch/projection phù hợp. Thống kê attempts dùng COUNT/GROUP BY khi chỉ cần count, không tải toàn bộ attempts. List cần pagination khi dữ liệu lớn. Student DTO sau này tách khỏi Teacher DTO, không gửi isCorrect, correctAnswerText, correctBoolean hoặc scoring bí mật.

Browser tải media trực tiếp từ storage/CDN theo quyền truy cập; JSON chỉ text/metadata/URL. FE dùng lazy image và audio preload metadata. Resize/compress ảnh chỉ thêm khi đo thấy cần, có giới hạn tài nguyên xử lý.

## 10. Cleanup đáng tin cậy

TEMP quá TTL cấu hình, đề xuất 24h, được đưa sang trạng thái cleanup dưới khóa/điều kiện atomic; create chỉ claim TEMP chưa hết hạn. Cleanup không xóa media ATTACHED chỉ vì file cũ. Draft mở lâu cần contract gia hạn hoặc thông báo upload lại.

Khi update bỏ media hoặc delete Exam: đánh dấu/tạo cleanup job trong transaction DB, sau commit worker xóa storage và retry với backoff. Job/reference cleanup không bị cascade mất trước khi worker đọc. Xóa file thất bại không phục hồi Exam. Không chỉ dựa vào event trong memory vì process có thể dừng sau commit. Có audit định kỳ để phát hiện orphan do upload/storage/DB lệch nhau.

## 11. Checkpoints triển khai

| Nhóm | Công việc | Điều kiện hoàn thành |
|---|---|---|
| A — Audit/contract | Đối chiếu schema, FE builder, quyền giao đề, scoring, limits, API | Gap list + quyết định cần chốt + DTO contract |
| B — Domain | Migration maxAttempts nếu chọn 0, media registry/job nếu chọn phương án ổn định | PostgreSQL migrations chạy và ddl-auto=validate thành công |
| C — Media | Local/Supabase upload, validation, registry, claim/cleanup | Test file hợp lệ/sai, owner, race cleanup, retry |
| D — Create | DTO, validator, batch ownership, persistence transaction | 201 + tree đầy đủ; child fail rollback cả aggregate |
| E — Read/update | Detail theo tầng, complete update, metadata DRAFT guard | Round-trip không mất nội dung; quyền/status/concurrency đúng |
| F — Publish/delete | Publish guard, attempt/force, cleanup job | Race update/publish và delete/storage failure được kiểm tra |
| G — FE contract | Tài liệu request/response và error field | FE có thể nối lưu, mở lại, sửa, publish với ít lượt gọi |

Đi tiếp khi kiểm tra của nhóm trước đạt và phù hợp phạm vi người dùng đã giao. Không yêu cầu người dùng báo “done” sau từng bước kỹ thuật đã được ủy quyền.

## 12. Kiểm chứng và Definition of Done

- Integration với PostgreSQL thật/test container hoặc DB test riêng để kiểm tra Flyway, constraint, rollback và cascade; không dùng DB production. Test khởi động với ddl-auto=validate.
- Happy path cho từng AnswerType và cả hai scoring types; visibility/timing/inheritance khớp contract.
- Rollback do lỗi DB sau khi đã insert parent, không chỉ test reject trước persistence.
- Ownership: khác teacher, sai role, class/student ngoài phạm vi, media giả hoặc hết hạn đều bị từ chối.
- Duplicate code đồng thời, ID/order trùng, null child, payload/precision vượt giới hạn có lỗi rõ ràng.
- Race update/publish, claim/cleanup; storage delete lỗi và restart worker vẫn retry được.
- Đo SQL sau khi cô lập fixture: so sánh 10/100 câu hỏi, SELECT không tăng theo từng node; đo riêng INSERT, thời gian, memory và provider calls. Không bật show-sql production.
- GET -> PUT -> GET giữ nội dung, media, scoring và thứ tự; PUT metadata cũ vẫn hoạt động khi DRAFT.
- PUBLISHED không sửa bằng bất kỳ API nào; không trở về DRAFT; delete giữ force rule.
- Response chỉ DTO và dữ liệu cần thiết; media ngoài JSON; không gọi provider khi map public URL.
- Tài liệu API có ví dụ request/response cho create, content update, upload và lỗi, thông tin migration và cấu hình môi trường.

## 13. Báo cáo sau mỗi lần sửa repo

Nêu cụ thể thay đổi, lý do/hành vi trước-sau, từng file đã sửa kèm link/dòng liên quan, migration/API/config và ảnh hưởng FE, kiểm tra đã chạy/kết quả, phần chưa xác minh và quyết định còn chờ. Không kết luận hiệu năng chỉ từ đọc code hoặc số dòng thay đổi.

Mọi API mới phải có hướng dẫn trong docs/api.md: method/endpoint, xác thực, quyền, request, response, lỗi và cách thử. Tài liệu riêng chỉ bổ sung, không thay thế api.md. Luôn kiểm tra reuse API hiện có và báo trước khi tạo endpoint mới.

## 14. Tiến độ nền tảng domain

Đã viết V46 chuyển rule từ question_id sang answer_id, cấu hình chấm sang Answer, thêm Option.points và StudentAnswerOption.booleanValue. V47 cho phép max_attempts = 0 ở Exam/Assignment. Chưa chạy migration vào DB. V46 chủ động dừng nếu answers hoặc rules có dữ liệu, vì chưa có cách chuyển nhóm cũ chắc chắn; không được xóa dữ liệu để vượt guard.

Repository bổ sung batch theo parent IDs cho questions/answers/options/rules/student answer values. Số query thực tế cần kiểm chứng khi có service detail/chấm bài; chỉ thêm repository chưa chứng minh hết N+1.

Không tạo API mới trong checkpoint này. Trước mọi API mới phải báo endpoint, mục đích, lý do không reuse API hiện tại và ảnh hưởng FE. Chỉ sửa trong workspace D:\class-management; không tự kết nối DB, chạy migration hoặc sửa file bên ngoài workspace khi người dùng đã giới hạn như vậy.

Checkpoint media tiếp theo đã viết V48 registry, POST /api/exam-media và DELETE /api/exam-media/{mediaId} (202 queue), validation ảnh/MP3, reservation, batch claim và cleanup retry bền vững. Đã báo trước API mới; reuse StorageService. Contract và giới hạn ở EXAM_MEDIA_API.md. Chưa chạy migration/HTTP/provider integration; M4A/AAC và private signed URL chưa triển khai.

Checkpoint create: đã báo trước POST /api/exams và viết DTO/validator/transaction persistence, batch targets, claim media trong transaction và response nhỏ. Người dùng đã chốt multiple choice all-or-nothing, SHORT_ANSWER dùng đáp án chuẩn, TEXT là ESSAY chấm tay. Contract và checklist thủ công nằm ở docs/api.md mục 39. Chưa nối FE; rollback PostgreSQL và SQL count vẫn cần kiểm chứng thực tế. Không thêm migration mới ở checkpoint create.

DELETE hiện có được bổ sung khóa Exam và bulk queue toàn bộ media theo exam_id trong cùng transaction xóa. Reuse cascade và worker persistent retry; file và registry được dọn sau commit, không xóa storage trước DB. Hướng dẫn ở docs/api.md mục 40. Không thêm API/migration và chưa chạy DB integration.
