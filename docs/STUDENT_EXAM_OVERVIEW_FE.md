# Hai biểu đồ kết quả học sinh trong lớp (GV)

GET `/classes/:classId/students/:studentId/exam-results` qua examService cũ, signal hỗ trợ cancel. Lấy tối đa 100 dòng mỗi request và đọc các trang còn lại để phân bố điểm tính trên toàn bộ dữ liệu, không riêng trang đầu. Không gọi theo từng đề. Summary trung bình/cao nhất/thấp nhất lấy nguyên từ BE.

Biểu đồ tròn trạng thái dùng summary.notStarted/inProgress/pendingGrading/graded (không cộng submitted lần nữa vì đã gồm các bài nộp). Biểu đồ điểm chia scoreOnTen thành dưới 5, 5–<6.5, 6.5–<8, >=8; chỉ GRADED có scoreOnTen. Chưa có điểm hiển thị —, không thay bằng 0. Legend có số và tỷ lệ, vòng tròn trống màu xám. CSS conic-gradient, không thêm dependency/service. Bảng chi tiết 10 dòng/trang dùng dữ liệu cache, có liên kết đợt giao scoped classId và prefetch.

Query theo account/class/student; focus refetch, stale 15s, poll 60s, giữ cache khi tải nền; mutations chấm/nộp/giao đề/lớp invalidate; route chi tiết HS prefetch cùng query. Đây là đọc dữ liệu, không có mutation cần optimistic update.

File/dòng:
- frontend/src/services/examService.js:4 — API và đọc tất cả trang.
- frontend/src/query/resourceOptions.js:31 — resource reader.
- frontend/src/query/mutationResources.js:6 — chấm/nộp; :11 — lớp; :12 — giao đề.
- frontend/src/query/prefetchRoutes.js:3 — prefetch chi tiết HS.
- frontend/src/pages/teacher/classroom/StudentDetailPage.jsx:139 — thay hai placeholder bằng overview, bỏ imports icon cũ.
- frontend/src/pages/teacher/classroom/components/StudentExamOverview.jsx:7 — donut/legend; :18 — query, summary/phân bố/bảng/paging.
- frontend/tests/examServices.test.mjs:19 — đảm bảo đọc hết trang và giữ summary/cancellation.

Kiểm tra: 80 FE tests, build và lint không lỗi (warnings cũ). Chưa kiểm thử API/DB thật. Không sửa BE/migration.
