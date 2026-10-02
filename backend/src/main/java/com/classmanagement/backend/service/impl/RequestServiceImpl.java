package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.request.JoinClassRequestResponse;
import com.classmanagement.backend.entity.ClassJoinRequestDetail;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Request;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.RequestStatus;
import com.classmanagement.backend.entity.enums.RequestType;
import com.classmanagement.backend.repository.ClassJoinRequestDetailRepository;
import com.classmanagement.backend.repository.ClassStudentRepository;
import com.classmanagement.backend.repository.RequestRepository;
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