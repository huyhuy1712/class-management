
# Tài liệu API

**Base URL local:** `http://localhost:8080`

**Xác thực:** Chỉ `POST /api/auth/signup` và `POST /api/auth/login` không cần JWT. Các API còn lại dùng header `Authorization: Bearer <accessToken>`.

## Danh sách API

| STT | Method | Endpoint | Chức năng |
|---:|---|---|---|
| 1 | POST | `/api/auth/signup` | Đăng ký |
| 2 | POST | `/api/auth/login` | Đăng nhập |
| 3 | GET | `/api/classes` | Lấy tất cả lớp |
| 4 | GET | `/api/classes/my` | Lấy lớp của giáo viên hiện tại |
| 5 | POST | `/api/classes` | Tạo lớp |
| 6 | PUT | `/api/classes/{id}` | Cập nhật lớp |
| 7 | PATCH | `/api/classes/{id}/archive` | Lưu trữ lớp |
| 8 | PATCH | `/api/classes/{id}/activate` | Kích hoạt lại lớp đã lưu trữ |
| 9 | DELETE | `/api/classes/{id}` | Xóa lớp |
| 10 | GET | `/api/classes/students/import-template` | Tải file Excel mẫu để import học sinh |
| 11 | POST | `/api/classes/{classroomId}/students` | Thêm học sinh vào lớp |
| 12 | POST | `/api/classes/{classroomId}/students/import` | Import danh sách học sinh từ file Excel |
| 13 | GET | `/api/classes/{classroomId}/students` | Lấy học sinh trong lớp |
| 14 | POST | `/api/classes/{classroomId}/lessons` | Tạo buổi học cho lớp |
| 15 | GET | `/api/classes/{classroomId}/lessons?date=YYYY-MM-DD` | Lấy buổi học của lớp theo ngày |
| 16 | PUT | `/api/classes/{classroomId}/lessons/{lessonId}` | Cập nhật buổi học |
| 17 | GET | `/api/requests/join-class/received` | Lấy yêu cầu tham gia lớp đang chờ |
| 18 | PATCH | `/api/requests/{requestId}/approve` | Chấp nhận yêu cầu tham gia lớp |
| 19 | PATCH | `/api/requests/{requestId}/reject` | Từ chối yêu cầu tham gia lớp |
| 20 | POST | `/api/notifications/request-approved/{requestId}` | Tạo thông báo yêu cầu được chấp nhận |
| 21 | POST | `/api/notifications/request-rejected/{requestId}` | Tạo thông báo yêu cầu bị từ chối |
| 22 | DELETE | `/api/classes/{classroomId}/students/{studentId}` | Xóa học sinh khỏi lớp |
| 23 | POST | `/api/classes/{classroomId}/attendances` | Tạo điểm danh |
| 24 | GET | `/api/classes/{classroomId}/attendances` | Lấy lịch sử điểm danh của lớp |
| 25 | GET | `/api/classes/{classroomId}/attendances/export?date=YYYY-MM-DD` | Xuất điểm danh theo ngày ra Excel |
| 26 | DELETE | `/api/classes/{classroomId}/attendances/students/{studentId}?date=YYYY-MM-DD` | Xóa điểm danh của học sinh trong một ngày |
| 27 | PATCH | `/api/classes/{classroomId}/attendances/{attendanceId}` | Cập nhật bản ghi điểm danh |
| 28 | GET | `/api/subjects` | Lấy danh sách môn học |
| 29 | GET | `/api/users` | Lấy người dùng, có thể lọc theo role |
| 30 | GET | `/api/users/{userId}` | Lấy người dùng theo ID |
| 31 | GET | `/api/users/my-students` | Lấy học sinh của giáo viên hiện tại |
| 32 | GET | `/api/exams` | Lấy danh sách đề thi của giáo viên hiện tại |
| 33 | DELETE | `/api/exams/{examId}?force=false` | Xóa đề thi |
| 34 | PUT | `/api/exams/{examId}` | Cập nhật đề thi |
| 35 | PUT | `/api/users/me` | Cập nhật hồ sơ hiện tại |
| 36 | PUT | `/api/users/me/password` | Đổi mật khẩu hiện tại |
| 37 | POST | `/api/users/me/avatar` | Tải avatar |
| 38 | DELETE | `/api/users/me/avatar` | Xóa avatar |

## Xác thực

### 1. POST `/api/auth/signup` | Đăng ký tài khoản

```http
Authorization: Bearer <accessToken>
```

**Headers:**

```http
Content-Type: application/json
```

**Request body mẫu:**

```json
{
	"username": "nguyenvana",
	"password": "matkhau123",
	"email": "nguyenvana@gmail.com",
	"fullName": "Nguyễn Văn A",
	"phone": "0901234567",
	"avatar": "avatar",
	"role": "STUDENT"
}
```

Trong đó:

- `username`: Tên đăng nhập, bắt buộc, từ 4 đến 50 ký tự và không được trùng.
- `password`: Mật khẩu, bắt buộc, từ 8 đến 100 ký tự.
- `email`: Bắt buộc, phải có định dạng `ten@gmail.com` và không được trùng.
- `fullName`: Họ và tên, bắt buộc, tối đa 100 ký tự.
- `phone`: Không bắt buộc; nếu có nhập phải gồm đúng 10 chữ số và không được trùng.
- `avatar`: Không bắt buộc, tối đa 500 ký tự.
- `role`: Vai trò, bắt buộc, chỉ nhận `TEACHER` hoặc `STUDENT`. Không thể đăng ký tài khoản `ADMIN`.

**Response thành công `201 Created`:**

```json
{
	"id": 3,
	"username": "nguyenvana",
	"email": "nguyenvana@gmail.com",
	"fullName": "Nguyễn Văn A",
	"role": "STUDENT",
    "avatar": "avatar",
	"studentCode": "ST-3",
	"teacherCode": null,
	"status": "ACTIVE"
}
```

Tài khoản có role `STUDENT` được tạo với status `ACTIVE` và mã `studentCode` theo dạng `ST-<UserID>`. Tài khoản có role `TEACHER` được tạo với status `PENDING` để chờ duyệt và mã `teacherCode` theo dạng `TC-<UserID>`. Backend tự sinh mã sau khi tạo user; không gửi `studentCode` hoặc `teacherCode` trong request. Response chỉ có mã tương ứng với role, mã còn lại là `null`.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Thiếu trường bắt buộc hoặc dữ liệu không hợp lệ.
- Username đã tồn tại: Đổi `username` sang tên khác rồi gửi lại.
- Email đã tồn tại: Sử dụng email khác.
- Phone đã tồn tại: Sử dụng số điện thoại khác hoặc bỏ qua trường `phone`.
- Role không hợp lệ hoặc là `ADMIN`: Chỉ sử dụng `TEACHER` hoặc `STUDENT`.

### 2. POST `/api/auth/login` | Đăng nhập

**Headers:**

```http
Content-Type: application/json
```

**Request body mẫu:**

```json
{
	"username": "nguyenvana",
	"password": "matkhau123"
}
```

**Cách test bằng cURL:**

```bash
curl -X POST http://localhost:8080/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{
		"username": "nguyenvana",
		"password": "matkhau123"
	}'
```

Trong đó:

- `username`: Tên đăng nhập, bắt buộc.
- `password`: Mật khẩu, bắt buộc.

**Response thành công `200 OK`:**

```json
{
	"accessToken": "eyJhbGciOiJIUzI1NiJ9...",
	"tokenType": "Bearer",
	"id": 3,
	"username": "nguyenvana",
	"email": "nguyenvana@example.com",
	"fullName": "Nguyễn Văn A",
	"phone": "0901234567",
	"avatar": "avatar",
	"studentCode": "ST-3",
	"teacherCode": null,
	"role": "STUDENT",
	"status": "ACTIVE"
}
```

Sau khi đăng nhập thành công, copy giá trị `accessToken` và gửi kèm header sau khi gọi các API cần xác thực:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Một số trường hợp lỗi:**

- `400 Bad Request`: Thiếu `username` hoặc `password`.
- `401 Unauthorized`: Username hoặc password không chính xác.
- `403 Forbidden`: Tài khoản giáo viên đang chờ admin duyệt hoặc tài khoản đã bị khóa.

## Đề thi

### 32. GET `/api/exams` | Lấy danh sách đề thi của giáo viên hiện tại

Lấy toàn bộ đề thi do giáo viên đang đăng nhập tạo. API không nhận tham số query hoặc request body; danh sách được xác định dựa trên tài khoản trong JWT.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X GET http://localhost:8080/api/exams \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `200 OK`:**

```json
[
	{
		"id": 1,
		"subjectId": 2,
		"subjectName": "Lập trình Java",
		"title": "Kiểm tra giữa kỳ Java",
		"code": "JAVA-MIDTERM-2026",
		"description": "Đề kiểm tra kiến thức Java cơ bản",
		"gradeLevel": "K21",
		"purpose": "Giữa kỳ",
		"submittedCount": 18,
		"status": "PUBLISHED",
		"assignedClassCount": 2,
		"createdAt": "2026-10-06T20:30:00"
	}
]
```

Trong đó:

- `id`: ID đề thi.
- `subjectId`: ID môn học.
- `subjectName`: Tên môn học.
- `title`: Tên đề thi.
- `code`: Mã đề thi.
- `description`: Mô tả đề thi.
- `gradeLevel`: Khối/lớp.
- `purpose`: Mục đích đề thi.
- `submittedCount`: Số lượt làm bài đã ở trạng thái `SUBMITTED` hoặc `GRADED`.
- `status`: Trạng thái đề thi, nhận một trong `DRAFT`, `PUBLISHED` hoặc `CLOSED`.
- `assignedClassCount`: Số lớp được giao đề; mỗi lớp chỉ được tính một lần.
- `createdAt`: Thời điểm tạo đề thi, định dạng `YYYY-MM-DDTHH:mm:ss`.

Nếu giáo viên chưa có đề thi, API trả về `200 OK` với danh sách rỗng:

```json
[]
```

**Một số trường hợp lỗi:**

- `401 Unauthorized`: Thiếu hoặc token không hợp lệ.

### 33. DELETE `/api/exams/{examId}` | Xóa đề thi

Xóa đề thi do giáo viên hiện tại tạo. API mặc định không cho xóa đề thi đã có học sinh làm bài để tránh mất dữ liệu bài làm và kết quả. Có thể dùng `force=true` khi đã xác nhận muốn xóa cả dữ liệu liên quan.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Query parameters:**

- `force`: Không bắt buộc, mặc định là `false`.
  - `false`: Từ chối xóa nếu đề thi đã có bài làm.
  - `true`: Cho phép xóa đề thi dù đã có bài làm; toàn bộ bài làm và kết quả liên quan sẽ bị xóa theo.

**Cách test bằng cURL khi đề thi chưa có bài làm:**

```bash
curl -X DELETE "http://localhost:8080/api/exams/1" \
	-H "Authorization: Bearer <accessToken>"
```

**Cách test bằng cURL khi đã xác nhận xóa cả bài làm:**

```bash
curl -X DELETE "http://localhost:8080/api/exams/1?force=true" \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `204 No Content`:**

API không trả về response body. Đề thi và các dữ liệu liên quan được xóa thành công.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy đề thi hoặc đề thi không thuộc giáo viên đang đăng nhập.
- `401 Unauthorized`: Thiếu hoặc token không hợp lệ.
- `409 Conflict`: Đề thi đã có học sinh làm bài và `force=false`. Gọi lại với `force=true` chỉ sau khi đã xác nhận muốn xóa toàn bộ bài làm và kết quả liên quan.

### 34. PUT `/api/exams/{examId}` | Cập nhật đề thi

Cập nhật môn học và thông tin mô tả của đề thi do giáo viên hiện tại tạo. API này chỉ cho phép sửa `subjectId`, `title`, `description`, `gradeLevel` và `purpose`; mã đề, thời gian làm bài và số lần làm bài không bị thay đổi.

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Request body mẫu:**

```json
{
	"subjectId": 2,
	"title": "Kiểm tra giữa kỳ Java - Cập nhật",
	"description": "Đề kiểm tra kiến thức Java cơ bản",
	"gradeLevel": "K21",
	"purpose": "Giữa kỳ"
}
```

Trong đó:

- `subjectId`: ID môn học, bắt buộc. Môn học phải tồn tại.
- `title`: Tên đề thi, bắt buộc, tối đa 255 ký tự.
- `description`: Mô tả đề thi, không bắt buộc. Chuỗi rỗng sau khi trim được lưu thành `null`.
- `gradeLevel`: Khối/lớp, không bắt buộc, tối đa 30 ký tự.
- `purpose`: Mục đích đề thi, không bắt buộc, tối đa 50 ký tự.

Trạng thái `status` không được cập nhật qua API này; hệ thống giữ nguyên trạng thái hiện tại của đề thi.

**Cách test bằng cURL:**

```bash
curl -X PUT http://localhost:8080/api/exams/1 \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <accessToken>" \
	-d '{
		"subjectId": 2,
		"title": "Kiểm tra giữa kỳ Java - Cập nhật",
		"description": "Đề kiểm tra kiến thức Java cơ bản",
		"gradeLevel": "K21",
		"purpose": "Giữa kỳ"
	}'
```

**Response thành công `200 OK`:**

```json
{
	"id": 1,
	"subjectId": 2,
	"subjectName": "Lập trình Java",
	"title": "Kiểm tra giữa kỳ Java - Cập nhật",
	"description": "Đề kiểm tra kiến thức Java cơ bản",
	"gradeLevel": "K21",
	"purpose": "Giữa kỳ",
	"status": "PUBLISHED"
}
```

**Một số trường hợp lỗi:**

- `400 Bad Request`: Thiếu `subjectId` hoặc `title`, giá trị vượt quá giới hạn ký tự, môn học không tồn tại, hoặc dữ liệu không hợp lệ.
- `400 Bad Request`: Không tìm thấy đề thi với `examId` đã cung cấp hoặc đề thi không thuộc giáo viên đang đăng nhập.
- `401 Unauthorized`: Thiếu hoặc token không hợp lệ.

## Lớp học

### 10. GET `/api/classes/students/import-template` | Tải file Excel mẫu import học sinh

Tải file `.xlsx` mẫu dùng cho API import học sinh. File có sheet đầu tiên với tiêu đề `Mã học sinh` tại ô A1; nhập mỗi mã học sinh vào một dòng bên dưới.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Response thành công `200 OK`:** File Excel `mau-import-hoc-sinh.xlsx`.

**Một số trường hợp lỗi:**

- `401 Unauthorized`: Thiếu hoặc token không hợp lệ.

### 5. POST `/api/classes` | Tạo lớp

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Request body mẫu:**

```json
{
	"name": "Lập trình Java K21",
	"code": "JAVA-K21",
	"subjectId": 1,
	"teacherId": 1,
	"description": "Lớp học Java cơ bản cho sinh viên khóa K21"
}
```

Trong đó:

- `name`: Tên lớp, bắt buộc, tối đa 100 ký tự.
- `code`: Mã lớp, bắt buộc, tối đa 50 ký tự và không được trùng.
- `subjectId`: ID môn học đã tồn tại trong database.
- `teacherId`: ID người dùng đã tồn tại và phải có role `TEACHER`.
- `description`: Mô tả lớp học, không bắt buộc.

**Response thành công `201 Created`:**

```json
{
	"id": 1,
	"name": "Lập trình Java K21",
	"code": "JAVA-K21",
	"subjectId": 1,
	"subjectName": "Lập trình Java",
	"teacherId": 2,
	"teacherName": "Nguyễn Văn An",
	"description": "Lớp học Java cơ bản cho sinh viên khóa K21",
	"status": "ACTIVE",
	"createdAt": "2026-09-28T10:30:00",
	"updatedAt": "2026-09-28T10:30:00"
}
```

**Một số trường hợp lỗi:**

- `400 Bad Request`: Thiếu trường bắt buộc hoặc dữ liệu không hợp lệ.
- Mã lớp đã tồn tại: Đổi `code` sang một mã khác rồi gửi lại.
- Không tìm thấy môn học hoặc giáo viên: Kiểm tra lại `subjectId` và `teacherId`.
- `teacherId` không thuộc người dùng có role `TEACHER`: Chọn đúng tài khoản giáo viên.

### 6. PUT `/api/classes/{id}` | Cập nhật lớp

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Request body mẫu:**

```json
{
	"name": "Lập trình Java K21 - Cập nhật",
	"code": "JAVA-K21-UPDATED",
	"subjectId": 1,
	"teacherId": 2,
	"academicYear": "2026-2027",
	"description": "Mô tả lớp học sau khi cập nhật"
}
```

Trong đó:

- `name`: Tên lớp, bắt buộc, tối đa 100 ký tự.
- `code`: Mã lớp, bắt buộc, tối đa 50 ký tự và không được trùng với lớp khác.
- `subjectId`: ID môn học đã tồn tại trong database, bắt buộc.
- `teacherId`: ID người dùng có role `TEACHER` và status `ACTIVE`, bắt buộc.
- `academicYear`: Năm học, không bắt buộc, tối đa 9 ký tự.
- `description`: Mô tả lớp học, không bắt buộc.

**Response thành công `200 OK`:**

```json
{
	"id": 1,
	"name": "Lập trình Java K21 - Cập nhật",
	"code": "JAVA-K21-UPDATED",
	"subjectId": 1,
	"subjectName": "Lập trình Java",
	"teacherId": 2,
	"teacherName": "Nguyễn Văn An",
	"academicYear": "2026-2027",
	"description": "Mô tả lớp học sau khi cập nhật",
	"status": "ACTIVE",
	"createdAt": "2026-09-28T10:30:00",
	"updatedAt": "2026-09-29T10:30:00"
}
```

**Một số trường hợp lỗi:**

- `400 Bad Request`: Thiếu trường bắt buộc hoặc dữ liệu không hợp lệ.
- Không tìm thấy lớp học: Kiểm tra lại `id` trên URL.
- Mã lớp đã tồn tại: Đổi `code` sang mã khác.
- Không tìm thấy môn học hoặc giáo viên: Kiểm tra lại `subjectId` và `teacherId`.
- Giáo viên không hợp lệ: Người dùng phải có role `TEACHER` và status `ACTIVE`.

### 7. PATCH `/api/classes/{id}/archive` | Lưu trữ lớp

**Headers:**

```http
Authorization: Bearer <accessToken>
```

Lớp được chuyển sang status `ARCHIVED`.

**Response thành công `200 OK`:**

```json
{
	"id": 1,
	"name": "Lập trình Java K21",
	"code": "JAVA-K21",
	"subjectId": 1,
	"teacherId": 2,
	"academicYear": "2026-2027",
	"description": "Lớp học Java cơ bản cho sinh viên khóa K21",
	"status": "ARCHIVED"
}
```

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy lớp học với `id` đã cung cấp.
- `403 Forbidden`: Lớp học đã được lưu trữ trước đó.

### 8. PATCH `/api/classes/{id}/activate` | Kích hoạt lớp

Khôi phục lớp về status `ACTIVE`. Gọi lại với lớp đang hoạt động vẫn trả về thông tin lớp hiện tại.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Response thành công `200 OK`:** response có cùng cấu trúc với API lấy lớp, trong đó `status` là `ACTIVE`.

### 9. DELETE `/api/classes/{id}` | Xóa lớp

**Headers:**

```http
Authorization: Bearer <accessToken>
```

Xóa vĩnh viễn lớp học khỏi database.

**Response thành công `204 No Content`:**

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy lớp học với `id` đã cung cấp.

### 11. POST `/api/classes/{classroomId}/students` | Thêm học sinh vào lớp

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Request body mẫu:**

```json
{
	"studentId": 5
}
```

Trong đó:

- `studentId`: ID người dùng cần thêm vào lớp, bắt buộc. Người dùng phải có role `STUDENT` và status `ACTIVE`.

**Response thành công `201 Created`:**

```json
{
	"id": 5,
	"studentCode": "SV2026005",
	"username": "nguyenvana",
	"fullName": "Nguyễn Văn A",
	"email": "nguyenvana@example.com",
	"phone": "0901234567",
	"avatar": "avatar",
	"joinedAt": "2026-09-30T10:30:00"
}
```

**Một số trường hợp lỗi:**

- `400 Bad Request`: Thiếu `studentId` hoặc không tìm thấy lớp học/học sinh.
- Học sinh không hợp lệ: Người dùng được chọn không có role `STUDENT` hoặc tài khoản không ở status `ACTIVE`.
- `403 Forbidden`: Học sinh đã có trong lớp học này.

### 12. POST `/api/classes/{classroomId}/students/import` | Import học sinh từ file Excel

Thêm nhiều học sinh vào lớp bằng danh sách mã học sinh trong file Excel. Các tài khoản học sinh phải tồn tại trong hệ thống; thao tác thêm mỗi học sinh áp dụng cùng quy tắc như API thêm một học sinh.

**Headers:**

```http
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Tham số đường dẫn:**

- `classroomId`: ID lớp cần thêm học sinh.

**Form data:**

| Tên trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `file` | File `.xlsx` | Có | File Excel danh sách học sinh. |

File chỉ cần một cột mã học sinh. Sheet đầu tiên phải có dòng tiêu đề ở dòng 1:

| Cột A |
|---|
| `Mã học sinh` |

Tên tiêu đề không phân biệt chữ hoa/chữ thường. Mã học sinh được đọc từ cột A; không cần cột STT hoặc họ tên. Mỗi dòng từ dòng 2 trở đi chứa một mã học sinh. Các dòng trống được bỏ qua.

**Cách test bằng cURL:**

```bash
curl -X POST http://localhost:8080/api/classes/1/students/import \
	-H "Authorization: Bearer <accessToken>" \
	-F "file=@danh-sach-hoc-sinh.xlsx"
```

Không tự đặt `Content-Type` trong lệnh cURL; `-F` sẽ tạo `multipart/form-data` kèm boundary cần thiết.

**Response thành công `200 OK`:**

```json
{
	"total": 3,
	"success": 2,
	"failed": 1,
	"errors": [
		{
			"row": 3,
			"studentCode": "ST-999",
			"message": "Không tìm thấy học sinh với mã ST-999"
		}
	]
}
```

- `total`: Tổng số dòng dữ liệu không trống đã xử lý.
- `success`: Số học sinh được thêm thành công.
- `failed`: Số dòng không thêm được; bằng số phần tử trong `errors`.
- `errors`: Danh sách lỗi theo từng dòng Excel. `row` là số dòng tính từ 1, bao gồm dòng tiêu đề; `studentCode` và `message` cho biết mã học sinh và nguyên nhân lỗi.

Lỗi của một dòng không làm dừng import các dòng tiếp theo. Ví dụ, học sinh không tồn tại, mã học sinh để trống hoặc học sinh đã thuộc lớp sẽ được trả về trong `errors`.

**Một số trường hợp lỗi toàn bộ request:**

- `400 Bad Request`: Không có file, file rỗng, file không phải `.xlsx`, không đọc được Excel hoặc tiêu đề/sheet đầu tiên không đúng mẫu.
- `400 Bad Request`: Không tìm thấy lớp theo `classroomId`.
- `401 Unauthorized`: Thiếu hoặc token không hợp lệ.

### 13. GET `/api/classes/{classroomId}/students` | Học sinh trong lớp

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X GET http://localhost:8080/api/classes/1/students \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `200 OK`:**

```json
[
	{
		"id": 5,
		"studentCode": "SV2026005",
		"username": "sinhvien01",
		"fullName": "Trần Văn Bình",
		"email": "sinhvien01@example.com",
		"phone": "0912345678",
		"avatar": "avatar",
		"joinedAt": "2026-09-30T10:30:00"
	}
]
```

Nếu lớp chưa có học sinh, API trả về:

```json
[]
```

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy lớp học với `classroomId` đã cung cấp.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### 17. GET `/api/requests/join-class/received` | Lấy yêu cầu tham gia lớp đang chờ

Lấy các yêu cầu tham gia lớp có trạng thái `PENDING` được gửi đến tài khoản đang đăng nhập, sắp xếp theo thời gian tạo mới nhất trước. API không cần tham số path, query hoặc request body.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X GET http://localhost:8080/api/requests/join-class/received \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `200 OK`:**

```json
[
	{
		"requestId": 12,
		"studentId": 5,
		"studentCode": "SV2026005",
		"fullName": "Nguyễn Văn A",
		"username": "nguyenvana",
		"avatar": "http://localhost:8080/uploads/avatars/avatar.png",
		"classroomId": 1,
		"classroomName": "Lập trình Java K21",
		"classroomCode": "JAVA-K21",
		"message": "Em muốn tham gia lớp học.",
		"status": "PENDING",
		"createdAt": "2026-10-02T10:30:00"
	}
]
```

Nếu tài khoản hiện tại không có yêu cầu đang chờ, API trả về `[]`. Trường `avatar` có thể là `null` nếu học sinh chưa có avatar; `message` cũng có thể là `null` nếu yêu cầu không có lời nhắn.

**Một số trường hợp lỗi:**

- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### 18. PATCH `/api/requests/{requestId}/approve` | Chấp nhận yêu cầu tham gia lớp

Chấp nhận yêu cầu tham gia lớp đang ở trạng thái `PENDING` và được gửi đến tài khoản hiện tại. `{requestId}` là ID lấy từ response của `GET /api/requests/join-class/received`. API không cần request body. Sau khi PATCH thành công, gọi `POST /api/notifications/request-approved/{requestId}` để tạo thông báo cho học sinh gửi yêu cầu.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X PATCH http://localhost:8080/api/requests/12/approve \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `204 No Content`:** Không có response body.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy yêu cầu, yêu cầu không thuộc loại tham gia lớp hoặc yêu cầu đã được xử lý.
- `403 Forbidden`: Yêu cầu không được gửi đến tài khoản đang đăng nhập.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### 20. POST `/api/notifications/request-approved/{requestId}` | Tạo thông báo yêu cầu được chấp nhận

Tạo thông báo cho học sinh đã gửi yêu cầu tham gia lớp vừa được chấp nhận. Chỉ người nhận yêu cầu (giáo viên) mới được tạo thông báo. API không cần request body; chỉ gọi sau khi `PATCH /api/requests/{requestId}/approve` thành công.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X POST http://localhost:8080/api/notifications/request-approved/12 \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `204 No Content`:** Không có response body.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy yêu cầu, yêu cầu không phải yêu cầu tham gia lớp hoặc chưa được chấp nhận. Mỗi lần gọi thành công tạo một notification mới.
- `403 Forbidden`: Tài khoản hiện tại không phải người nhận yêu cầu.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### 19. PATCH `/api/requests/{requestId}/reject` | Từ chối yêu cầu tham gia lớp

Từ chối yêu cầu đang ở trạng thái `PENDING` và được gửi đến tài khoản hiện tại. `{requestId}` là ID lấy từ response của `GET /api/requests/join-class/received`. API không cần request body. Sau khi PATCH thành công, gọi `POST /api/notifications/request-rejected/{requestId}` để tạo thông báo cho học sinh gửi yêu cầu.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X PATCH http://localhost:8080/api/requests/12/reject \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `204 No Content`:** Không có response body.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy yêu cầu, yêu cầu không thuộc loại tham gia lớp hoặc yêu cầu đã được xử lý.
- `403 Forbidden`: Yêu cầu không được gửi đến tài khoản đang đăng nhập.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### 21. POST `/api/notifications/request-rejected/{requestId}` | Tạo thông báo yêu cầu bị từ chối

Tạo thông báo cho học sinh đã gửi yêu cầu tham gia lớp vừa bị từ chối. Chỉ người nhận yêu cầu (giáo viên) mới được tạo thông báo. API không cần request body; chỉ gọi sau khi `PATCH /api/requests/{requestId}/reject` thành công.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X POST http://localhost:8080/api/notifications/request-rejected/12 \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `204 No Content`:** Không có response body.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy yêu cầu, yêu cầu không phải yêu cầu tham gia lớp hoặc chưa bị từ chối. Mỗi lần gọi thành công tạo một notification mới.
- `403 Forbidden`: Tài khoản hiện tại không phải người nhận yêu cầu.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### 22. DELETE `/api/classes/{classroomId}/students/{studentId}` | Xóa học sinh khỏi lớp

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X DELETE http://localhost:8080/api/classes/1/students/5 \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `204 No Content`:**

Học sinh bị gỡ khỏi lớp; tài khoản vẫn tồn tại.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy lớp học hoặc học sinh.
- `400 Bad Request`: Học sinh không thuộc lớp học này.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### 14. POST `/api/classes/{classroomId}/lessons` | Tạo buổi học

Tạo một buổi học trong lớp. Chỉ giáo viên phụ trách lớp mới được tạo buổi học.

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Request body mẫu:**

```json
{
	"title": "Buổi 1 - Giới thiệu Java",
	"lessonDate": "2026-10-05",
	"attendanceCode": "JAVA101",
	"startTime": "2026-10-05T08:00:00",
	"lateTime": "2026-10-05T08:15:00",
	"endTime": "2026-10-05T10:00:00"
}
```

Trong đó:

- `title`: Tên buổi học, bắt buộc và không được để trống.
- `lessonDate`: Ngày học, bắt buộc, định dạng `YYYY-MM-DD`.
- `attendanceCode`: Mã điểm danh, bắt buộc và không được để trống.
- `startTime`: Thời gian bắt đầu, bắt buộc, định dạng `YYYY-MM-DDTHH:mm:ss`.
- `lateTime`: Thời điểm bắt đầu tính đi trễ, bắt buộc, cùng định dạng.
- `endTime`: Thời gian kết thúc, bắt buộc, cùng định dạng.
- Ngày của `startTime`, `lateTime` và `endTime` phải trùng với `lessonDate`; thứ tự phải là `startTime <= lateTime <= endTime`.

**Cách test bằng cURL:**

```bash
curl -X POST http://localhost:8080/api/classes/1/lessons \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <accessToken>" \
	-d '{
		"title": "Buổi 1 - Giới thiệu Java",
		"lessonDate": "2026-10-05",
		"attendanceCode": "JAVA101",
		"startTime": "2026-10-05T08:00:00",
		"lateTime": "2026-10-05T08:15:00",
		"endTime": "2026-10-05T10:00:00"
	}'
```

**Response thành công `201 Created`:**

```json
{
	"id": 1,
	"classroomId": 1,
	"classroomName": "Lập trình Java K21",
	"title": "Buổi 1 - Giới thiệu Java",
	"lessonDate": "2026-10-05",
	"attendanceCode": "JAVA101",
	"startTime": "2026-10-05T08:00:00",
	"lateTime": "2026-10-05T08:15:00",
	"endTime": "2026-10-05T10:00:00",
	"createdAt": "2026-10-03T19:30:00"
}
```

**Một số trường hợp lỗi:**

- `400 Bad Request`: Thiếu hoặc để trống trường bắt buộc, sai định dạng ngày/giờ, hoặc thời gian không đúng thứ tự/ngày học.
- `400 Bad Request`: Không tìm thấy lớp học với `classroomId` đã cung cấp.
- `401 Unauthorized`: Thiếu hoặc token không hợp lệ.
- `403 Forbidden`: Người dùng hiện tại không phải giáo viên phụ trách lớp.

### 15. GET `/api/classes/{classroomId}/lessons?date=YYYY-MM-DD` | Lấy buổi học theo ngày

Lấy danh sách buổi học thuộc lớp và ngày được chỉ định. Chỉ giáo viên phụ trách lớp mới được xem danh sách. Kết quả được sắp xếp theo `startTime` tăng dần.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Query parameters:**

- `date`: Bắt buộc, ngày cần tra cứu, định dạng `YYYY-MM-DD`.
- `{classroomId}`: ID lớp cần tra cứu, truyền trong URL.

**Cách test bằng cURL:**

```bash
curl -X GET "http://localhost:8080/api/classes/1/lessons?date=2026-10-05" \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `200 OK`:**

```json
[
	{
		"id": 1,
		"classroomId": 1,
		"classroomName": "Lập trình Java K21",
		"title": "Buổi 1 - Giới thiệu Java",
		"lessonDate": "2026-10-05",
		"attendanceCode": "JAVA101",
		"startTime": "2026-10-05T08:00:00",
		"lateTime": "2026-10-05T08:15:00",
		"endTime": "2026-10-05T10:00:00",
		"createdAt": "2026-10-03T19:30:00"
	}
]
```

Nếu ngày đó không có buổi học, API trả về `200 OK` với danh sách rỗng `[]`.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Thiếu `date` hoặc ngày không đúng định dạng `YYYY-MM-DD`.
- `400 Bad Request`: Không tìm thấy lớp học với `classroomId` đã cung cấp.
- `401 Unauthorized`: Thiếu hoặc token không hợp lệ.
- `403 Forbidden`: Người dùng hiện tại không phải giáo viên phụ trách lớp.

### 16. PUT `/api/classes/{classroomId}/lessons/{lessonId}` | Cập nhật buổi học

Cập nhật thông tin buổi học trong lớp. Chỉ giáo viên phụ trách lớp mới được cập nhật. API yêu cầu gửi đầy đủ các trường trong request body; các trường không gửi hoặc để `null` không được xem là cập nhật một phần.

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Request body mẫu:**

```json
{
	"title": "Buổi 1 - Java cơ bản (cập nhật)",
	"lessonDate": "2026-10-05",
	"attendanceCode": "JAVA101-UPDATED",
	"startTime": "2026-10-05T08:30:00",
	"lateTime": "2026-10-05T08:45:00",
	"endTime": "2026-10-05T10:30:00"
}
```

Trong đó, các trường `title`, `lessonDate`, `attendanceCode`, `startTime`, `lateTime` và `endTime` đều bắt buộc; định dạng và quy tắc thời gian giống API tạo buổi học. Ngày của cả ba mốc thời gian phải trùng với `lessonDate`, theo thứ tự `startTime <= lateTime <= endTime`.

**Cách test bằng cURL:**

```bash
curl -X PUT http://localhost:8080/api/classes/1/lessons/1 \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <accessToken>" \
	-d '{
		"title": "Buổi 1 - Java cơ bản (cập nhật)",
		"lessonDate": "2026-10-05",
		"attendanceCode": "JAVA101-UPDATED",
		"startTime": "2026-10-05T08:30:00",
		"lateTime": "2026-10-05T08:45:00",
		"endTime": "2026-10-05T10:30:00"
	}'
```

**Response thành công `200 OK`:**

```json
{
	"id": 1,
	"classroomId": 1,
	"classroomName": "Lập trình Java K21",
	"title": "Buổi 1 - Java cơ bản (cập nhật)",
	"lessonDate": "2026-10-05",
	"attendanceCode": "JAVA101-UPDATED",
	"startTime": "2026-10-05T08:30:00",
	"lateTime": "2026-10-05T08:45:00",
	"endTime": "2026-10-05T10:30:00",
	"createdAt": "2026-10-03T19:30:00"
}
```

**Một số trường hợp lỗi:**

- `400 Bad Request`: Thiếu hoặc để trống trường bắt buộc, sai định dạng ngày/giờ hoặc thời gian không hợp lệ.
- `400 Bad Request`: Không tìm thấy lớp học, không tìm thấy buổi học, hoặc buổi học không thuộc lớp chỉ định.
- `401 Unauthorized`: Thiếu hoặc token không hợp lệ.
- `403 Forbidden`: Người dùng hiện tại không phải giáo viên phụ trách lớp.

## Điểm danh

### 23. POST `/api/classes/{classroomId}/attendances` | Tạo điểm danh

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Request body mẫu:**

```json
{
	"date": "2026-09-30",
	"students": [
		{
			"studentId": 5,
			"status": "PRESENT",
			"note": "Có mặt đúng giờ"
		},
		{
			"studentId": 6,
			"status": "LATE",
			"note": "Đến muộn 10 phút"
		}
	]
}
```

Trong đó:

- `date`: Ngày điểm danh, bắt buộc, định dạng `YYYY-MM-DD`.
- `students`: Danh sách điểm danh, bắt buộc và không được rỗng.
- `studentId`: ID học sinh, bắt buộc. Học sinh phải thuộc lớp đang điểm danh.
- `status`: Trạng thái điểm danh, bắt buộc. Chỉ nhận `PRESENT`, `ABSENT` hoặc `LATE`.
- `note`: Ghi chú, không bắt buộc.

Backend tự tìm buổi học trong đúng lớp có `lessonDate` trùng với `date`:

- Nếu tìm thấy đúng một buổi học, bản ghi điểm danh được liên kết với buổi học đó (`lessonId`).
- Nếu không có buổi học phù hợp, `lessonId` là `null`.
- Nếu có nhiều buổi học cùng ngày trong lớp, API trả `400 Bad Request`; cần xử lý để ngày đó chỉ có một buổi học trước khi điểm danh.

**Cách test bằng cURL:**

```bash
curl -X POST http://localhost:8080/api/classes/1/attendances \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <accessToken>" \
	-d '{
		"date": "2026-09-30",
		"students": [
			{
				"studentId": 5,
				"status": "PRESENT",
				"note": "Có mặt đúng giờ"
			}
		]
	}'
```

**Response thành công `201 Created`:**

```json
[
	{
		"id": 1,
		"studentId": 5,
		"studentCode": "SV2026005",
		"studentAvatar": "http://localhost:8080/uploads/avatars/avatar_user_5.jpg",
		"fullName": "Trần Văn Bình",
		"date": "2026-09-30",
		"lessonId": 2,
		"createdAt": "2026-10-03T20:00:00",
		"status": "PRESENT",
		"note": "Có mặt đúng giờ"
	}
]
```

**Một số trường hợp lỗi:**

- `400 Bad Request`: Thiếu ngày, danh sách học sinh hoặc trạng thái điểm danh không hợp lệ.
- `400 Bad Request`: Không tìm thấy lớp học hoặc học sinh.
- `400 Bad Request`: Học sinh không thuộc lớp học này.
- `400 Bad Request`: Học sinh đã được điểm danh trong ngày đã chọn.
- `400 Bad Request`: Có nhiều buổi học trong lớp cùng ngày nên không thể tự động liên kết điểm danh.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### 24. GET `/api/classes/{classroomId}/attendances` | Lịch sử điểm danh

`{classroomId}` là ID lớp cần xem. Kết quả được sắp xếp theo ngày mới nhất trước.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X GET http://localhost:8080/api/classes/1/attendances \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `200 OK`:**

```json
[
	{
		"id": 1,
		"studentId": 5,
		"studentCode": "SV2026005",
		"studentAvatar": "http://localhost:8080/uploads/avatars/avatar_user_5.jpg",
		"fullName": "Trần Văn Bình",
		"date": "2026-09-30",
		"lessonId": 2,
		"createdAt": "2026-10-03T20:00:00",
		"status": "PRESENT",
		"note": "Có mặt đúng giờ"
	}
]
```

`studentAvatar` là URL ảnh đại diện theo cấu hình storage hiện tại; nếu học sinh chưa có ảnh, giá trị là `null`. Nếu lớp chưa có dữ liệu điểm danh, API trả về `200 OK` với danh sách `[]`.

**Lỗi:**

- `400 Bad Request`: Không tìm thấy lớp học với `classroomId` đã cung cấp.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### 25. GET `/api/classes/{classroomId}/attendances/export` | Xuất điểm danh ra Excel

Xuất danh sách học sinh hiện có trong lớp và trạng thái điểm danh của ngày được chọn thành file Excel `.xlsx`. Mỗi học sinh có một dòng; nếu học sinh chưa có bản ghi điểm danh trong ngày đó thì trạng thái xuất ra là `ABSENT`. File chỉ gồm mã học sinh, họ tên và trạng thái điểm danh; ghi chú điểm danh không được đưa vào file.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Query params:**

| Tên | Bắt buộc | Định dạng | Mô tả |
|---|---|---|---|
| `date` | Có | `YYYY-MM-DD` | Ngày cần xuất điểm danh, ví dụ `2026-09-30`. |

**Cách test bằng cURL:**

```bash
curl -L "http://localhost:8080/api/classes/1/attendances/export?date=2026-09-30" \
	-H "Authorization: Bearer <accessToken>" \
	-o "diemdanh_Lap_trinh_Java_K21_30-09-2026.xlsx"
```

`-o` lưu file response với tên do người gọi chỉ định. Để `curl` tự dùng tên file trong header `Content-Disposition`, thay `-o <ten-file>` bằng `-OJ`. API trả tên file theo dạng `diemdanh_<ten-lop>_<dd-MM-yyyy>.xlsx`; tên lớp được cắt khoảng trắng đầu/cuối, khoảng trắng ở giữa đổi thành `_`, và các ký tự `\ / : * ? " < > |` đổi thành `_`.

**Response thành công `200 OK`:** Nội dung file Excel, MIME type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

Sheet `Điểm danh` có các cột:

| Cột | Nội dung |
|---|---|
| `Mã học sinh` | Mã học sinh trong lớp |
| `Họ và tên` | Họ tên học sinh |
| `Điểm danh` | `PRESENT`, `ABSENT` hoặc `LATE` |

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy lớp học với `classroomId` đã cung cấp, thiếu `date` hoặc `date` không đúng định dạng `YYYY-MM-DD`.
- `401 Unauthorized`: Thiếu hoặc token không hợp lệ.

### 26. DELETE `/api/classes/{classroomId}/attendances/students/{studentId}` | Xóa điểm danh

API xóa một bản ghi điểm danh theo `studentId` và ngày `date`. Dữ liệu điểm danh cần phải thuộc đúng lớp học và đúng ngày mới được xóa.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Query params:**

```http
date=2026-09-30
```

**Cách test bằng cURL:**

```bash
curl -X DELETE "http://localhost:8080/api/classes/1/attendances/students/5?date=2026-09-30" \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `204 No Content`:**

Không có body trả về. Nếu bản ghi điểm danh tồn tại, backend sẽ xóa và trả về `204 No Content`.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy dữ liệu điểm danh của học sinh trong ngày đã chọn.
- `400 Bad Request`: Lớp học hoặc học sinh không hợp lệ.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### 27. PATCH `/api/classes/{classroomId}/attendances/{attendanceId}` | Cập nhật điểm danh

API cập nhật một bản ghi điểm danh đã tồn tại. Chỉ các trường được gửi trong body mới được thay đổi; các trường còn lại giữ nguyên. Nếu thay đổi `date`, backend tự liên kết lại với buổi học duy nhất trong lớp vào ngày mới; `lessonId` được trả về trong response. Nếu ngày mới có nhiều buổi học, API trả `400 Bad Request`.

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Request body mẫu:**

```json
{
	"date": "2026-09-30",
	"status": "LATE",
	"note": "Đến muộn 10 phút nhưng đã giải thích"
}
```

Trong đó:

- `date`: Ngày điểm danh mới, không bắt buộc. Nếu có, phải là ngày hợp lệ và không trùng với dữ liệu điểm danh của học sinh đó trong cùng lớp.
- `status`: Trạng thái mới, không bắt buộc. Chỉ nhận `PRESENT`, `ABSENT` hoặc `LATE`.
- `note`: Ghi chú mới, không bắt buộc. Nếu gửi `null`, backend giữ nguyên note cũ hoặc xóa note tùy theo logic hiện tại.

**Cách test bằng cURL:**

```bash
curl -X PATCH http://localhost:8080/api/classes/1/attendances/10 \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <accessToken>" \
	-d '{
		"date": "2026-09-30",
		"status": "LATE",
		"note": "Đến muộn 10 phút nhưng đã giải thích"
	}'
```

**Response thành công `200 OK`:**

```json
{
	"id": 10,
	"studentId": 5,
	"studentCode": "SV2026005",
	"studentAvatar": "http://localhost:8080/uploads/avatars/avatar_user_5.jpg",
	"fullName": "Trần Văn Bình",
	"date": "2026-09-30",
	"lessonId": 2,
	"createdAt": "2026-10-03T20:00:00",
	"status": "LATE",
	"note": "Đến muộn 10 phút nhưng đã giải thích"
}
```

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy dữ liệu điểm danh với `attendanceId` đã cung cấp.
- `400 Bad Request`: Dữ liệu điểm danh không thuộc lớp học này.
- `400 Bad Request`: Học sinh đã có dữ liệu điểm danh trong ngày mới chọn.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

## Tra cứu lớp học

### 3. GET `/api/classes` | Tất cả lớp

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Response thành công `200 OK`:**

```json
[
	{
		"id": 1,
		"name": "Lập trình Java K21",
		"code": "JAVA-K21",
		"subjectId": 1,
		"subjectName": "Lập trình Java",
		"teacherId": 2,
		"teacherName": "Nguyễn Văn An",
		"description": "Lớp học Java cơ bản cho sinh viên khóa K21",
		"status": "ACTIVE",
		"createdAt": "2026-09-28T10:30:00",
		"updatedAt": "2026-09-28T10:30:00"
	}
]
```

Nếu database chưa có lớp học, API sẽ trả về danh sách rỗng:

```json
[]
```

### 4. GET `/api/classes/my` | Lớp của giáo viên hiện tại

API lấy giáo viên từ JWT, không cần truyền `teacherId`. Chỉ tài khoản có role `TEACHER` mới được gọi. Danh sách gồm các lớp được gán cho giáo viên, không lọc theo trạng thái lớp.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X GET http://localhost:8080/api/classes/my \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `200 OK`:**

```json
[
	{
		"id": 1,
		"name": "Lập trình Java K21",
		"code": "JAVA-K21",
		"subjectId": 1,
		"subjectName": "Lập trình Java",
		"teacherId": 2,
		"teacherName": "Nguyễn Văn An",
		"academicYear": "2026-2027",
		"description": "Lớp học Java cơ bản cho sinh viên khóa K21",
		"status": "ACTIVE",
		"createdAt": "2026-09-28T10:30:00",
		"updatedAt": "2026-09-28T10:30:00"
	}
]
```

Nếu giáo viên chưa được gán lớp nào, API trả về `200 OK` với danh sách rỗng `[]`.

**Một số trường hợp lỗi:**

- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.
- `403 Forbidden`: Người dùng hiện tại không có role `TEACHER`.
- `400 Bad Request`: Không tìm thấy người dùng ứng với tài khoản hiện tại.

## Môn học

### 28. GET `/api/subjects` | Danh sách môn học

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Response mẫu `200 OK`:**
```json
[
  {
    "code": "MATH",
    "description": "Môn Toán học",
    "id": 1,
    "name": "Toán"
  },
  {
    "code": "ENGLISH",
    "description": "Môn Tiếng Anh",
    "id": 2,
    "name": "Tiếng Anh"
  },
  {
    "code": "PHYSICS",
    "description": "Môn Vật lý",
    "id": 3,
    "name": "Vật lý"
  }
]
```

## Người dùng

### 29. GET `/api/users` | Danh sách người dùng

Query parameter `role` nhận `STUDENT` hoặc `TEACHER`. Không truyền `role` để lấy tất cả người dùng trừ `ADMIN`.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X GET http://localhost:8080/api/users \
	-H "Authorization: Bearer <accessToken>"
```

Ví dụ lấy danh sách học sinh:

```bash
curl -X GET "http://localhost:8080/api/users?role=STUDENT" \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `200 OK`:**

```json
[
	{
		"id": 2,
		"username": "giaovien01",
		"email": "giaovien01@example.com",
		"fullName": "Nguyễn Văn An",
		"phone": "0901234567",
		"avatar": "avatar",
		"studentCode": null,
		"teacherCode": "GV000002",
		"role": "TEACHER",
		"status": "ACTIVE"
	},
	{
		"id": 5,
		"username": "sinhvien01",
		"email": "sinhvien01@example.com",
		"fullName": "Trần Văn Bình",
		"phone": "0912345678",
		"avatar": "avatar",
		"studentCode": "SV2026005",
		"teacherCode": null,
		"role": "STUDENT",
		"status": "ACTIVE"
	}
]
```

Nếu chưa có người dùng (ngoài tài khoản `ADMIN`), API trả về:

```json
[]
```

**Một số trường hợp lỗi:**

- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.
- `403 Forbidden`: Token không có quyền truy cập tài nguyên.
- `400 Bad Request`: Giá trị `role` không hợp lệ. Chỉ sử dụng `STUDENT` hoặc `TEACHER`; không được sử dụng `ADMIN`.

### 31. GET `/api/users/my-students` | Học sinh của giáo viên hiện tại

API xác định giáo viên từ JWT, không cần truyền `teacherId`. Chỉ tài khoản có role `TEACHER` mới được gọi. Response gồm các học sinh thuộc lớp của giáo viên; mỗi học sinh chỉ xuất hiện một lần và có mảng `classes` liệt kê các lớp liên quan. Các lớp được trả về không lọc theo trạng thái.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X GET http://localhost:8080/api/users/my-students \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `200 OK`:**

```json
[
	{
		"id": 5,
		"username": "sinhvien01",
		"email": "sinhvien01@gmail.com",
		"fullName": "Trần Văn Bình",
		"phone": "0912345678",
		"avatar": "https://example.com/uploads/avatars/student-5.png",
		"studentCode": "SV2026005",
		"status": "ACTIVE",
		"classes": [
			{
				"id": 1,
				"name": "Lập trình Java K21",
				"code": "JAVA-K21",
				"academicYear": "2026-2027",
				"status": "ACTIVE"
			}
		]
	}
]
```

Nếu giáo viên chưa có học sinh thuộc lớp nào, API trả về danh sách rỗng `[]`.

**Một số trường hợp lỗi:**

- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.
- `403 Forbidden`: Người dùng hiện tại không có role `TEACHER`.
- `400 Bad Request`: Không tìm thấy người dùng ứng với tài khoản hiện tại.

### 30. GET `/api/users/{userId}` | Người dùng theo ID

Trong đó, `{userId}` là ID của người dùng cần xem.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X GET http://localhost:8080/api/users/5 \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `200 OK`:**

```json
{
	"id": 5,
	"username": "sinhvien01",
	"email": "sinhvien01@example.com",
	"fullName": "Trần Văn Bình",
	"phone": "0912345678",
	"avatar": "avatar",
	"studentCode": "SV2026005",
	"teacherCode": null,
	"role": "STUDENT",
	"status": "ACTIVE"
}
```

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy người dùng với `userId` đã cung cấp.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### 35. PUT `/api/users/me` | Cập nhật hồ sơ hiện tại

API tự xác định người dùng cần cập nhật từ JWT trong header, không cần truyền `userId`.

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Request body mẫu:**

```json
{
	"fullName": "Nguyễn Văn An cập nhật",
	"email": "nguyenvanan.moi@example.com",
	"phone": "0901234567"
}
```

Tất cả các trường đều không bắt buộc. Chỉ các trường có giá trị khác `null` mới được cập nhật; bỏ qua field hoặc gửi `null` sẽ giữ nguyên giá trị hiện tại. Gửi `{}` sẽ không thay đổi thông tin:

- `fullName`: Họ tên, từ 2 đến 100 ký tự, không được chỉ chứa khoảng trắng. Giá trị được cắt khoảng trắng ở đầu và cuối trước khi lưu.
- `email`: Email đúng định dạng, tối đa 255 ký tự và không được trùng tài khoản khác. Giá trị được cắt khoảng trắng ở đầu và cuối, sau đó chuyển thành chữ thường trước khi lưu.
- `phone`: Để trống field hoặc gửi `null` sẽ giữ nguyên số hiện tại. Gửi chuỗi rỗng `""` để xóa số điện thoại. Số điện thoại Việt Nam hợp lệ gồm 10 chữ số, bắt đầu bằng `03`, `05`, `07`, `08` hoặc `09`, và không được trùng tài khoản khác.

API này chỉ cập nhật `fullName`, `email` và `phone`. Không thể thay đổi `username`, `role`, `status`, `studentCode` hoặc `avatar` bằng API này.

Để thay đổi avatar, sử dụng riêng `POST /api/users/me/avatar`. Để xóa avatar, sử dụng `DELETE /api/users/me/avatar`.

**Cách test bằng cURL:**

```bash
curl -X PUT http://localhost:8080/api/users/me \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <accessToken>" \
	-d '{
		"fullName": "Nguyễn Văn An cập nhật",
		"phone": "0901234567"
	}'
```

**Response thành công `200 OK`:**

```json
{
	"id": 2,
	"username": "giaovien01",
	"email": "nguyenvanan.moi@example.com",
	"fullName": "Nguyễn Văn An cập nhật",
	"phone": "0901234567",
	"avatar": "https://example.com/avatar-cu.png",
	"studentCode": null,
	"role": "TEACHER",
	"status": "ACTIVE"
}
```

**Một số trường hợp lỗi:**

- `400 Bad Request`: Dữ liệu không hợp lệ, email hoặc số điện thoại đã được tài khoản khác sử dụng.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.
- `400 Bad Request`: Không tìm thấy người dùng hiện tại.

### 36. PUT `/api/users/me/password` | Đổi mật khẩu

API xác định tài khoản hiện tại từ JWT. Mật khẩu mới phải dài từ 8 đến 100 ký tự và không được trùng mật khẩu hiện tại.

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Request body:**

```json
{
	"currentPassword": "matkhaucu123",
	"newPassword": "matkhaumoi456"
}
```

**Cách test bằng cURL:**

```bash
curl -X PUT http://localhost:8080/api/users/me/password \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <accessToken>" \
	-d '{
		"currentPassword": "matkhaucu123",
		"newPassword": "matkhaumoi456"
	}'
```

**Response thành công `204 No Content`:** Không có response body.

**Lỗi:**

- `400 Bad Request`: Thiếu mật khẩu, mật khẩu hiện tại không đúng, mật khẩu mới không dài 8–100 ký tự hoặc trùng mật khẩu hiện tại.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

## Avatar

### 37. POST `/api/users/me/avatar` | Tải avatar

API tự xác định người dùng hiện tại từ JWT, không cần truyền `userId`. Ảnh tải lên sẽ thay avatar hiện tại.

**Headers:**

```http
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Form-data:**

- Key: `file`
- Type: `File`
- Giá trị: Chọn một ảnh JPG, PNG hoặc WebP hợp lệ, dung lượng tối đa 2 MB. Server xác thực nội dung file, không chỉ dựa vào tên hoặc phần mở rộng.

**Cách test bằng cURL:**

```bash
curl -X POST http://localhost:8080/api/users/me/avatar \
	-H "Authorization: Bearer <accessToken>" \
	-F "file=@C:/path/to/avatar.png"
```

**Response thành công `200 OK`:**

```json
{
	"avatar": "http://localhost:8080/uploads/avatars/avatar_user_5.png?v=1727685000000"
}
```

Trường `avatar` trong response là URL của ảnh vừa tải lên và được lưu vào hồ sơ người dùng.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không chọn file, file rỗng hoặc nội dung không phải ảnh JPG/PNG/WebP hợp lệ.
- File vượt quá giới hạn 2 MB sẽ bị server từ chối.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### 38. DELETE `/api/users/me/avatar` | Xóa avatar

API tự xác định người dùng hiện tại từ JWT, xóa file ảnh đại diện đang lưu và đặt trường `avatar` của hồ sơ thành `null`.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

**Cách test bằng cURL:**

```bash
curl -X DELETE http://localhost:8080/api/users/me/avatar \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `204 No Content`:**

Gọi API khi chưa có avatar vẫn trả về `204 No Content`.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy người dùng hiện tại.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.