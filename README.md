# Class Management

Class Management System built with React and Spring Boot.

## Tech Stack

### Backend
- Java 21
- Spring Boot
- Spring Data JPA
- Spring Security
- Flyway
- PostgreSQL
- Springdoc OpenAPI 3.1.1
- Swagger UI

### link sưagger
http://localhost:8080/swagger-ui.html

## Hướng dẫn test API bằng Swagger

1. Khởi động backend.
2. Mở [Swagger UI](http://localhost:8080/swagger-ui.html).
3. Tìm nhóm `classroom-controller` và mở API `POST /api/classes`.
4. Bấm `Try it out`.
5. Nhập request body mẫu bên dưới rồi bấm `Execute`.

### POST - Tạo lớp học

**Endpoint:** `POST /api/classes`

**Headers:**

```http
Content-Type: application/json
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

### GET - Lấy danh sách lớp học

**Endpoint:** `GET /api/classes`

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
### GET http://localhost:8080/api/subjects
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

### Frontend
- React
- Vite

### Database
- PostgreSQL
- Supabase (Cloud Database)
- PostgreSQL Local (Development)

---

## Prerequisites

Before running the project, make sure the following tools are installed.

| Tool | Required Version | Current Development Version |
|------|------------------|-----------------------------|
| Java JDK | 21 LTS | 21.0.12 |
| Node.js | 20.x LTS | 20.19.5 |
| npm | 10.x | 10.8.2 |
| Git | 2.x or later | 2.52.0 |
| VS Code | Latest stable | Latest stable |

### Verify Installation

Run the following commands:

```bash
java --version
node -v
npm -v
git --version
