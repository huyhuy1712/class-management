# Mapping chấm điểm theo nhóm Answer

## Cấu trúc sau V46

Question -> Answer (một nhóm chấm độc lập) -> AnswerOption (phương án/ý).
QuestionScoringRule giữ tên Java/table hiện tại để giảm phạm vi đổi tên, nhưng FK là answer_id. UNIQUE(answer_id, correct_count) phân biệt quy luật của các nhóm.

ScoringType.PER_ANSWER giữ giá trị enum hiện có để tránh đổi tên toàn bộ; từ V46 cấu hình này thuộc Answer. Với nhóm TRUE_FALSE nó biểu thị cộng điểm từng ý; CORRECT_COUNT biểu thị tra rule theo số ý đúng. Rule cho loại khác chưa được chốt, không tự suy diễn.

## Lưu đáp án học sinh

- StudentAnswer: một record cho attempt/question.
- StudentAnswerValue: một record cho StudentAnswer/Answer, giữ điểm nhóm.
- StudentAnswerOption: record cho AnswerValue/Option.
- CHOICE: record hiện diện nghĩa là đã chọn; booleanValue = null.
- TRUE_FALSE: record hiện diện và booleanValue khác null nghĩa là đã trả lời Đúng/Sai. Không có record nghĩa là bỏ trống, không được coi là chọn Sai.
- TRUE_FALSE đáp án chuẩn của ý nằm ở AnswerOption.correct: false là đáp án Sai hợp lệ. Không validate rằng một nhóm phải có ít nhất một correct=true.

Tại service phải batch kiểm tra Option thuộc Answer, Answer thuộc Question và Question thuộc đề của attempt; các FK riêng hiện không đảm bảo toàn bộ chuỗi này. Không nhận score/isCorrect do học sinh gửi. Chỉ BE tính điểm.

## Điểm

Điểm tối đa của câu là tổng điểm tối đa các Answer, điểm đề là tổng các câu. BigDecimal, DECIMAL(6,2), không round âm thầm. Builder cần bổ sung/chuẩn hóa điểm nhóm trước khi hoàn thiện DTO lưu đề. Multiple choice partial credit, TEXT -> ESSAY hay kiểu khác, và representation nhiều đáp án ngắn còn phải chốt.

Khi triển khai chấm bài hỗn hợp, tính điểm cuối từ từng StudentAnswerValue. StudentAnswer.manualScore hiện là override toàn câu theo getFinalScore(), không được cộng autoScore vào manualScore một cách máy móc. Cần giữ semantics override hoặc thiết kế aggregation rõ ràng tại service trước khi chấm tự luận.

## Migration và kiểm chứng

V46 không chạy nếu có Answer hoặc rule cũ vì không thể biết ranh giới nhóm chắc chắn. DB có dữ liệu cũ cần migration chuyển đổi riêng dựa trên dữ liệu thật; không sửa migration đã chạy, không tự chọn Answer đầu tiên và không xóa dữ liệu.

Đây là nền tảng schema/entity/repository, chưa có service save/detail/grade, chưa có API mới. Migration chưa được chạy trên DB bởi yêu cầu chỉ làm trong workspace. Compile và diff check không thay thế kiểm tra Flyway/PostgreSQL hoặc đo N+1.
