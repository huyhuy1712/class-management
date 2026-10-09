package com.classmanagement.backend.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.security.authentication.BadCredentialsException;
import org.hibernate.TransientPropertyValueException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({org.springframework.orm.ObjectOptimisticLockingFailureException.class,
            jakarta.persistence.OptimisticLockException.class})
    public ResponseEntity<?> handleExamRevisionConflict() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "Đề thi đã thay đổi, vui lòng tải lại trước khi lưu."));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErrorResponse.builder()
                .timestamp(LocalDateTime.now()).status(404).error("Không tìm thấy")
                .message(ex.getMessage()).path(request.getRequestURI()).build());
    }

    @ExceptionHandler({org.springframework.http.converter.HttpMessageNotReadableException.class,
            ExamPayloadTooLargeException.class})
    public ResponseEntity<ErrorResponse> handleUnreadableBody(Exception ex, HttpServletRequest request) {
        boolean tooLarge = false;
        for (Throwable cause = ex; cause != null; cause = cause.getCause()) {
            if (cause instanceof ExamPayloadTooLargeException) { tooLarge = true; break; }
        }
        int status = tooLarge ? 413 : 400;
        return ResponseEntity.status(status).body(ErrorResponse.builder()
                .timestamp(LocalDateTime.now()).status(status).error("Yêu cầu không hợp lệ")
                .message(tooLarge ? "Request đề thi vượt quá dung lượng cho phép" : "JSON hoặc kiểu dữ liệu không hợp lệ")
                .path(request.getRequestURI()).build());
    }

    @ExceptionHandler(ExamValidationException.class)
    public ResponseEntity<ErrorResponse> handleExamValidation(
            ExamValidationException ex, HttpServletRequest request) {
        return ResponseEntity.badRequest().body(ErrorResponse.builder()
                .timestamp(LocalDateTime.now()).status(400).error("Yêu cầu không hợp lệ")
                .message(ex.getMessage()).validationErrors(ex.getValidationErrors())
                .path(request.getRequestURI()).build());
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleUploadSize(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(ErrorResponse.builder()
                .timestamp(LocalDateTime.now()).status(413).error("Tệp quá lớn")
                .message("Tệp hoặc request vượt quá dung lượng upload cho phép")
                .path(request.getRequestURI()).build());
    }

    @ExceptionHandler(ExamMediaException.class)
    public ResponseEntity<ErrorResponse> handleExamMedia(
            ExamMediaException ex, HttpServletRequest request) {
        return ResponseEntity.status(ex.getStatus()).body(ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(ex.getStatus().value())
                .error(ex.getStatus().getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build());
    }

    // Các lỗi nghiệp vụ hiện tại:
    // username tồn tại, email tồn tại, signup ADMIN...
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request) {

        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Yêu cầu không hợp lệ")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    // Lỗi từ @Valid
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        Map<String, String> errors = new LinkedHashMap<>();

        ex.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        errors.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Yêu cầu không hợp lệ")
                .message("Dữ liệu không hợp lệ")
                .path(request.getRequestURI())
                .validationErrors(errors)
                .build();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

        @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex,
            HttpServletRequest request) {

        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .error("Chưa xác thực")
                .message("Tên đăng nhập hoặc mật khẩu không chính xác")
                .path(request.getRequestURI())
                .build();

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(response);
    }

        @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(
            IllegalStateException ex,
            HttpServletRequest request) {

        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.FORBIDDEN.value())
                .error("Không có quyền truy cập")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(response);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<?> handleConflictException(
                    ConflictException ex) {
            return ResponseEntity
                            .status(HttpStatus.CONFLICT)
                            .body(Map.of(
                                            "message", ex.getMessage()));
    }

    @ExceptionHandler(TransientPropertyValueException.class)
    public ResponseEntity<ErrorResponse> handleTransientProperty(
            TransientPropertyValueException ex,
            HttpServletRequest request) {

        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error("Dữ liệu liên kết không hợp lệ")
                .message("Không thể lưu dữ liệu vì bản ghi liên kết chưa tồn tại")
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }
}
