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
