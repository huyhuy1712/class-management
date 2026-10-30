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
```

## Setup model nhận dạng công thức cho import PDF

Sau khi clone/pull nhánh có chức năng import PDF, cài model trên từng máy hoặc server chạy backend. Model không được lưu trong Git.

### 1. Chuẩn bị

- Python **3.10, 3.11 hoặc 3.12**, có hỗ trợ `venv` và `pip`.
- Node.js **20 trở lên**, kèm npm, có trong `PATH`.
- Internet cho lần setup đầu để tải dependency và model.
- Backend vẫn cần Java 21 và cấu hình database như bình thường.

Model chạy bằng ONNX Runtime trên CPU; không cần cài PyTorch hoặc CUDA.

### 2. Chạy setup

Mở terminal tại thư mục gốc `class-management`:

```powershell
python --version
node --version
npm --version

python backend/tools/formula/setup_runtime.py
```

Trên Windows, nếu lệnh `python` không trỏ tới phiên bản được hỗ trợ, có thể dùng Python Launcher, ví dụ:

```powershell
py -3.11 backend/tools/formula/setup_runtime.py
```

Trên Linux, có thể dùng:

```bash
python3.11 backend/tools/formula/setup_runtime.py
```

Nếu Linux báo thiếu `venv` hoặc `ensurepip`, cài gói venv tương ứng với phiên bản Python của hệ điều hành rồi chạy lại.

Script sẽ tự thực hiện:

1. Tạo môi trường Python riêng tại `backend/.venv-formula/` nếu chưa có.
2. Cài dependency từ `backend/tools/formula/requirements.txt`.
3. Cài bộ kiểm tra LaTeX bằng `npm ci`, theo `package-lock.json`.
4. Tải model Pix2Text ONNX đúng phiên bản đã cố định vào `backend/formula-models/`.
5. Kiểm tra file model, nạp model trên CPU và kiểm tra cú pháp/render LaTeX.

Khi thành công, terminal hiển thị:

```text
ONNX CPU model and tokenizer initialization OK
LaTeX checker OK. Formula runtime is ready; no model files should be committed.
```

### 3. Kiểm tra và chạy backend

Kiểm tra lại cài đặt mà không tải model hoặc cài thêm dependency:

```powershell
python backend/tools/formula/setup_runtime.py --check
```

Dùng cùng cách gọi Python đã chọn ở bước setup (`python`, `py -3.11` hoặc `python3.11`).

Sau đó chạy backend từ thư mục `backend` như bình thường. Backend tự sử dụng Python trong `.venv-formula`; không cần kích hoạt môi trường bằng tay. Nếu chạy backend từ thư mục khác, đặt biến môi trường `EXAM_IMPORT_BACKEND_DIR` thành đường dẫn tuyệt đối tới thư mục `backend` trên máy đó.

Nhận dạng công thức chạy tại máy/server và không gửi PDF ra ngoài. Chỉ bước setup cần tải các gói và model từ Internet. Kiểm tra LaTeX xác nhận cú pháp/render, giáo viên vẫn cần đối chiếu công thức với nguồn PDF.

### 4. Sau những lần pull code tiếp theo

- Nếu thay đổi dependency hoặc phiên bản model, chạy lại `setup_runtime.py`.
- Nếu chỉ đổi nhánh trong cùng thư mục và phiên bản model không đổi, có thể dùng lại model hiện có; chạy `--check` để xác nhận.
- Máy mới, thư mục clone mới hoặc server production cần chạy setup riêng. Chỉ deploy source code lên production chưa đủ để có model.
- Nếu setup bị gián đoạn hoặc báo thiếu file/sai phiên bản model, chạy lại lệnh setup rồi kiểm tra bằng `--check`.

### 5. Những file đưa lên Git

Giữ source nhận dạng, `setup_runtime.py`, `setup_models.py`, `requirements.txt`, `package.json`, `package-lock.json` và các test trong `backend/tools/formula/`.

Các thư mục/file sau đã được `.gitignore` loại trừ, không dùng `git add -f` để đưa chúng lên repo:

```text
backend/formula-models/
backend/.venv-formula/
backend/tools/formula/node_modules/
**/__pycache__/
*.pyc
**/.private/
```

Giữ nguyên `requirements.txt`, `package-lock.json` và revision model trong `setup_models.py` để các máy cài cùng phiên bản.

.\mvnw.cmd clean compile