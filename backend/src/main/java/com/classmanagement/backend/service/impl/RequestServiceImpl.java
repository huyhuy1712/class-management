package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.request.JoinClassRequestResponse;
import com.classmanagement.backend.entity.ClassJoinRequestDetail;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Request;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.ClassroomStatus;
import com.classmanagement.backend.entity.enums.RequestStatus;
import com.classmanagement.backend.entity.enums.RequestType;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.request.ClassJoinRequestDetailRepository;
import com.classmanagement.backend.repository.request.RequestRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.RequestService;
import com.classmanagement.backend.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RequestServiceImpl implements RequestService {


    private final ClassJoinRequestDetailRepository classJoinRequestDetailRepository;

    private final StorageService storageService;
    private final RequestRepository requestRepository;
    private final ClassStudentRepository classStudentRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;

@Override
@Transactional
public void createJoinClassRequest(
            Long classroomId,
            String username,
            String message) {

        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy người dùng"));

        if (student.getRole() != UserRole.STUDENT) {
            throw new IllegalStateException(
                    "Chỉ học sinh mới có thể gửi yêu cầu tham gia lớp");
        }

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy lớp học"));

        if (classroom.getStatus() != ClassroomStatus.ACTIVE) {
            throw new IllegalArgumentException(
                    "Lớp học không nhận yêu cầu tham gia");
        }

        if (classStudentRepository.existsByClassroomIdAndStudentId(
                classroomId,
                student.getId())) {
            throw new IllegalArgumentException(
                    "Bạn đã tham gia lớp học này");
        }

        if (classJoinRequestDetailRepository
                .existsByClassroom_IdAndRequest_Sender_IdAndRequest_Status(
                        classroomId,
                        student.getId(),
                        RequestStatus.PENDING)) {
            throw new IllegalArgumentException(
                    "Bạn đã gửi yêu cầu tham gia lớp này");
        }

        Request request = requestRepository.save(Request.builder()
                .sender(student)
                .receiver(classroom.getTeacher())
                .type(RequestType.JOIN_CLASS)
                .status(RequestStatus.PENDING)
                .title("Yêu cầu tham gia lớp " + classroom.getName())
                .message(message)
                .build());

        classJoinRequestDetailRepository.save(ClassJoinRequestDetail.builder()
                .request(request)
                .classroom(classroom)
                .build());
}

@Override
@Transactional(readOnly = true)
public List<JoinClassRequestResponse> getPendingJoinClassRequests(
            String username) {

        List<ClassJoinRequestDetail> details = classJoinRequestDetailRepository
                .findAllByRequest_Receiver_UsernameAndRequest_TypeAndRequest_StatusOrderByRequest_CreatedAtDesc(
                        username,
                        RequestType.JOIN_CLASS,
                        RequestStatus.PENDING);

        return details.stream()
                .map(this::toJoinClassRequestResponse)
                .toList();
    }

private JoinClassRequestResponse toJoinClassRequestResponse(
            ClassJoinRequestDetail detail) {

        Request request = detail.getRequest();
        User student = request.getSender();
        Classroom classroom = detail.getClassroom();

        String avatarUrl = null;

        if (student.getAvatar() != null && !student.getAvatar().isBlank()) {
            avatarUrl = storageService.getUrl(student.getAvatar());
        }

        return JoinClassRequestResponse.builder()
                .requestId(request.getId())

                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .fullName(student.getFullName())
                .avatar(avatarUrl)
                .username(student.getUsername())
                
                .classroomId(classroom.getId())
                .classroomName(classroom.getName())
                .classroomCode(classroom.getCode())

                .message(request.getMessage())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())

                .build();
    }

@Override
@Transactional
public void rejectJoinClassRequest(Long requestId, String username) {

    Request request = requestRepository.findById(requestId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Không tìm thấy yêu cầu"));

    if (request.getType() != RequestType.JOIN_CLASS) {
        throw new IllegalArgumentException(
                "Yêu cầu này không phải yêu cầu tham gia lớp"
        );
    }

    if (!request.getReceiver().getUsername().equals(username)) {
        throw new IllegalStateException(
                "Bạn không có quyền xử lý yêu cầu này"
        );
    }

    if (request.getStatus() != RequestStatus.PENDING) {
        throw new IllegalArgumentException(
                "Yêu cầu này đã được xử lý"
        );
    }

    request.setStatus(RequestStatus.REJECTED);
    request.setResponseMessage("Yêu cầu tham gia lớp đã bị từ chối");
    request.setRespondedAt(LocalDateTime.now());

    requestRepository.save(request);
}

@Override
@Transactional
public void approveJoinClassRequest(Long requestId, String username) {

    ClassJoinRequestDetail detail = classJoinRequestDetailRepository
            .findByRequest_Id(requestId)
            .orElseThrow(() -> new IllegalArgumentException(
                    "Không tìm thấy yêu cầu tham gia lớp"));

    Request request = detail.getRequest();

    if (request.getType() != RequestType.JOIN_CLASS) {
        throw new IllegalArgumentException(
                "Yêu cầu này không phải yêu cầu tham gia lớp");
    }

    if (!request.getReceiver().getUsername().equals(username)) {
        throw new IllegalStateException(
                "Bạn không có quyền xử lý yêu cầu này");
    }

    if (request.getStatus() != RequestStatus.PENDING) {
        throw new IllegalArgumentException(
                "Yêu cầu này đã được xử lý");
    }

    request.setStatus(RequestStatus.APPROVED);
    request.setResponseMessage(
            "Yêu cầu tham gia lớp đã được chấp nhận");
    request.setRespondedAt(LocalDateTime.now());

    requestRepository.save(request);
}


}