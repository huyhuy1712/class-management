package com.classmanagement.backend.exception;

public class LateAttendanceReasonRequiredException extends RuntimeException {
    public LateAttendanceReasonRequiredException() {
        super("Bạn đã đi trễ buổi này, hãy nhập lý do trễ.");
    }
}
