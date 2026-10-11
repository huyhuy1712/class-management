# Quy ước frontend

- Dùng TanStack Query cho server state: đọc dữ liệu qua query, ghi dữ liệu qua `useMutation`, đồng bộ cache sau thao tác thành công.
- Tái sử dụng `query/useResourceQuery`, query keys theo tài khoản và các service hiện có. Không tạo thêm service dư thừa.
- Không giữ bản sao loading hoặc dữ liệu API trong `useState`/Zustand. State form, bộ lọc và trạng thái mở modal vẫn là client state.
- Chia code theo hooks, components/modals và helpers; không nhồi xử lý API vào giao diện.
- Phân biệt đang tải, API lỗi và dữ liệu rỗng. Không dùng danh sách đã lọc tìm kiếm để xác định tổng số dữ liệu.
- Khi báo kết quả, nêu file và vị trí dòng cụ thể đã sửa.
