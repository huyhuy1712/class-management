package com.classmanagement.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ExamMediaException extends RuntimeException {
    private final HttpStatus status;

    public ExamMediaException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }
}
