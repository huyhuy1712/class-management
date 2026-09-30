
## Xác thực bằng JWT

Hai API `/api/auth/signup` và `/api/auth/login` không cần JWT. Tất cả API còn lại phải gửi JWT trong header `Authorization`:

```http
Authorization: Bearer <accessToken>
```

Lấy giá trị `accessToken` từ response của API login rồi sử dụng giá trị đó cho các request tiếp theo.

### POST - Đăng ký tài khoản

**Endpoint:** `POST /api/auth/signup`

**Headers:**

```http
Content-Type: application/json
```

**Request body mẫu:**

```json
{
	"username": "nguyenvana",
	"password": "matkhau123",
	"email": "nguyenvana@example.com",
	"fullName": "Nguyễn Văn A",
	"phone": "0901234567",
    "avatar": "avatar",
	"role": "STUDENT"
}
```

Trong đó:

- `username`: Tên đăng nhập, bắt buộc, từ 4 đến 50 ký tự và không được trùng.
- `password`: Mật khẩu, bắt buộc, từ 8 đến 100 ký tự.
- `email`: Email, bắt buộc, phải đúng định dạng và không được trùng.
- `fullName`: Họ và tên, bắt buộc, tối đa 100 ký tự.
- `phone`: Số điện thoại, không bắt buộc, tối đa 20 ký tự và không được trùng nếu có nhập.
- `role`: Vai trò, bắt buộc, chỉ nhận `TEACHER` hoặc `STUDENT`. Không thể đăng ký tài khoản `ADMIN`.

**Response thành công `201 Created`:**

```json
{
	"id": 3,
	"username": "nguyenvana",
	"email": "nguyenvana@example.com",
	"fullName": "Nguyễn Văn A",
	"role": "STUDENT",
    "avatar": "avatar",
	"status": "ACTIVE"
}
```

Tài khoản có role `STUDENT` được tạo với status `ACTIVE`. Tài khoản có role `TEACHER` được tạo với status `PENDING` để chờ duyệt.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Thiếu trường bắt buộc hoặc dữ liệu không hợp lệ.
- Username đã tồn tại: Đổi `username` sang tên khác rồi gửi lại.
- Email đã tồn tại: Sử dụng email khác.
- Phone đã tồn tại: Sử dụng số điện thoại khác hoặc bỏ qua trường `phone`.
- Role không hợp lệ hoặc là `ADMIN`: Chỉ sử dụng `TEACHER` hoặc `STUDENT`.

### POST - Đăng nhập

**Endpoint:** `POST /api/auth/login`

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

### POST - Tạo lớp học

**Endpoint:** `POST /api/classes`

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

### PUT - Sửa thông tin lớp học

**Endpoint:** `PUT /api/classes/{id}`

Trong đó, `{id}` là ID của lớp học cần sửa.

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

### PATCH - Lưu trữ lớp học

**Endpoint:** `PATCH /api/classes/{id}/archive`

Trong đó, `{id}` là ID của lớp học cần lưu trữ.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

API này không yêu cầu request body. Khi gọi thành công, lớp học được chuyển sang status `ARCHIVED`.

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

### DELETE - Xóa lớp học

**Endpoint:** `DELETE /api/classes/{id}`

Trong đó, `{id}` là ID của lớp học cần xóa.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

API này không yêu cầu request body và xóa vĩnh viễn lớp học khỏi database.

**Response thành công `204 No Content`:**

Response không có body.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy lớp học với `id` đã cung cấp.

### POST - Thêm học sinh vào lớp

**Endpoint:** `POST /api/classes/{classroomId}/students`

Trong đó, `{classroomId}` là ID của lớp học cần thêm học sinh.

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

### GET - Lấy danh sách học sinh theo lớp

**Endpoint:** `GET /api/classes/{classroomId}/students`

Trong đó, `{classroomId}` là ID của lớp học cần xem danh sách học sinh.

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

### DELETE - Xóa học sinh khỏi lớp

**Endpoint:** `DELETE /api/classes/{classroomId}/students/{studentId}`

Trong đó:

- `{classroomId}`: ID của lớp học.
- `{studentId}`: ID của học sinh cần xóa khỏi lớp.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

API này không yêu cầu request body.

**Cách test bằng cURL:**

```bash
curl -X DELETE http://localhost:8080/api/classes/1/students/5 \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `204 No Content`:**

Response không có body. Học sinh được xóa khỏi lớp nhưng tài khoản học sinh vẫn tồn tại trong hệ thống.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy lớp học hoặc học sinh.
- `400 Bad Request`: Học sinh không thuộc lớp học này.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### POST - Thêm điểm danh cho lớp

**Endpoint:** `POST /api/classes/{classroomId}/attendances`

Trong đó, `{classroomId}` là ID của lớp học cần điểm danh.

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
		"fullName": "Trần Văn Bình",
		"date": "2026-09-30",
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
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### GET - Lấy danh sách lớp học

**Endpoint:** `GET /api/classes`

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

### GET - Lấy danh sách lớp của giáo viên hiện tại

**Endpoint:** `GET /api/classes/my`

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

### GET - Lấy danh sách môn học

**Endpoint:** `GET http://localhost:8080/api/subjects`

**Headers:**

```http
Authorization: Bearer <accessToken>
```

Response example:
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

### GET - Lấy danh sách người dùng

**Endpoint:** `GET http://localhost:8080/api/users`

Có thể truyền query parameter `role` để lọc người dùng theo vai trò:

- `GET http://localhost:8080/api/users?role=STUDENT`: Chỉ lấy học sinh.
- `GET http://localhost:8080/api/users?role=TEACHER`: Chỉ lấy giáo viên.
- Không truyền `role`: Lấy tất cả user, ngoại trừ tài khoản `ADMIN`.
- `role` chỉ nhận `STUDENT` hoặc `TEACHER`; không thể dùng `ADMIN`.

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

API trả về danh sách người dùng theo `role` nếu có lọc. Khi không truyền `role`, tài khoản có role `ADMIN` sẽ không được trả về. Mật khẩu không được trả về trong response.

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

### GET - Lấy thông tin người dùng theo ID

**Endpoint:** `GET http://localhost:8080/api/users/{userId}`

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
	"role": "STUDENT",
	"status": "ACTIVE"
}
```

Mật khẩu không được trả về trong response.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy người dùng với `userId` đã cung cấp.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.

### PUT - Cập nhật thông tin cá nhân

**Endpoint:** `PUT /api/users/me`

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

### POST - Tải ảnh đại diện

**Endpoint:** `POST /api/users/me/avatar`

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

### DELETE - Xóa ảnh đại diện

**Endpoint:** `DELETE /api/users/me/avatar`

API tự xác định người dùng hiện tại từ JWT, xóa file ảnh đại diện đang lưu và đặt trường `avatar` của hồ sơ thành `null`.

**Headers:**

```http
Authorization: Bearer <accessToken>
```

API này không yêu cầu request body.

**Cách test bằng cURL:**

```bash
curl -X DELETE http://localhost:8080/api/users/me/avatar \
	-H "Authorization: Bearer <accessToken>"
```

**Response thành công `204 No Content`:**

Response không có body. Gọi API khi người dùng chưa có avatar vẫn trả về `204 No Content`.

**Một số trường hợp lỗi:**

- `400 Bad Request`: Không tìm thấy người dùng hiện tại.
- `401 Unauthorized`: Thiếu hoặc Bearer token không hợp lệ.