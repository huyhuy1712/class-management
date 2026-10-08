package com.classmanagement.backend.exception;

public class ExamPayloadTooLargeException extends RuntimeException {
    public ExamPayloadTooLargeException() {
        super("Request đề thi vượt quá dung lượng cho phép");
    }
}
