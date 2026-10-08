package com.classmanagement.backend.exception;

import lombok.Getter;
import java.util.Map;

@Getter
public class ExamValidationException extends RuntimeException {
    private final Map<String, String> validationErrors;

    public ExamValidationException(Map<String, String> errors) {
        super("Dữ liệu đề thi không hợp lệ");
        this.validationErrors = Map.copyOf(errors);
    }
}
