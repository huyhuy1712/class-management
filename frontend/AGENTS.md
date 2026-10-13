# Quy ước frontend

- Dùng TanStack Query cho server state: đọc dữ liệu qua query, ghi dữ liệu qua `useMutation`, đồng bộ cache sau thao tác thành công.
- Tái sử dụng `query/useResourceQuery`, query keys theo tài khoản và các service hiện có. Không tạo thêm service dư thừa.
- Không giữ bản sao loading hoặc dữ liệu API trong `useState`/Zustand. State form, bộ lọc và trạng thái mở modal vẫn là client state.
- Chia code theo hooks, components/modals và helpers; không nhồi xử lý API vào giao diện.
- Phân biệt đang tải, API lỗi và dữ liệu rỗng. Không dùng danh sách đã lọc tìm kiếm để xác định tổng số dữ liệu.
- Khi báo kết quả, nêu file và vị trí dòng cụ thể đã sửa.
- Luôn theo cấu trúc hiện có của project, reuse file/API/service trước khi thêm abstraction mới; không sinh service rác hoặc wrapper dư thừa.
- Background refetch: khi quay lại tab trình duyệt, kiểm tra dữ liệu mới bằng TanStack Query; giữ dữ liệu cache trên màn hình trong lúc tải nền, không thay cả danh sách bằng loading.
- Automatic revalidation: mutation cập nhật cache hoặc invalidate đúng query liên quan để các màn hình tự đồng bộ; form và danh sách không gọi trực tiếp nhau để tải lại API.
- Prefetching: dùng query keys/options chung để tải trước dữ liệu trang hoặc chi tiết khi hover/focus vào liên kết, tái sử dụng cache khi điều hướng.
- Optimistic UI: phản hồi giao diện ngay cho thao tác có thể dự đoán và hoàn tác; cập nhật cache trong onMutate, rollback khi lỗi và đồng bộ với response BE. Không báo thành công giả cho bắt đầu lượt thi, nộp bài hoặc chấm điểm trước khi BE xác nhận; giữ nội dung hiển thị và phản hồi tại nút trong lúc chờ.
- Bốn nguyên tắc trên áp dụng cho server state. Dữ liệu nhập form/đáp án chưa gửi, bộ lọc và modal là client state, không đưa vào query cache chỉ để thay useState.
- Cache phải tách theo tài khoản; khi logout/đổi tài khoản, hủy request và xóa cache, không để response cũ ghi vào phiên mới.
