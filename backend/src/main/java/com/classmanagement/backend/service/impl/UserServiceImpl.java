package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.user.ChangePasswordRequest;
import com.classmanagement.backend.dto.user.StudentClassResponse;
import com.classmanagement.backend.dto.user.TeacherStudentResponse;
import com.classmanagement.backend.dto.user.UpdateProfileRequest;
import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.entity.ClassStudent;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.ClassStudentRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.StorageService;
import com.classmanagement.backend.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ClassStudentRepository classStudentRepository;
    private final StorageService storageService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<UserResponse> getAllUsers(UserRole role) {

        if (role == UserRole.ADMIN) {
            throw new IllegalArgumentException(
                    "Không được phép lấy tài khoản quản trị viên");
        }
        List<User> users;

        if (role == null) {
            users = userRepository.findAllByRoleNot(UserRole.ADMIN);
        } else {
            users = userRepository.findAllByRole(role);
        }

        return users
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private UserResponse toResponse(User user) {
        String avatarUrl = null;

        if (user.getAvatar() != null && !user.getAvatar().isBlank()) {
            avatarUrl = storageService.getUrl(user.getAvatar());
        }

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatar(avatarUrl)
                .studentCode(user.getStudentCode())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }


    @Transactional
    @Override
    public UserResponse updateMyProfile(
                    String username,
                    UpdateProfileRequest request) {
            User user = userRepository.findByUsername(username)
                            .orElseThrow(() -> new IllegalArgumentException(
                                            "Không tìm thấy người dùng"));

            if (request.getFullName() != null) {
                    String fullName = request.getFullName().trim();

                    if (fullName.length() < 2) {
                            throw new IllegalArgumentException(
                                            "Họ tên phải có ít nhất 2 ký tự");
                    }

                    user.setFullName(fullName);
            }

            if (request.getEmail() != null) {
                    String email = request.getEmail()
                                    .trim()
                                    .toLowerCase();

                    if (userRepository.existsByEmailAndIdNot(
                                    email,
                                    user.getId())) {
                            throw new IllegalArgumentException(
                                            "Email đã được sử dụng bởi tài khoản khác");
                    }

                    user.setEmail(email);
            }

            if (request.getPhone() != null) {
                    String phone = request.getPhone().trim();

                    if (phone.isEmpty()) {
                            user.setPhone(null);
                    } else {
                            if (userRepository.existsByPhoneAndIdNot(
                                            phone,
                                            user.getId())) {
                                    throw new IllegalArgumentException(
                                                    "Số điện thoại đã được sử dụng bởi tài khoản khác");
                            }

                            user.setPhone(phone);
                    }
            }

            User updatedUser = userRepository.save(user);

            return toResponse(updatedUser);
    }

@Override
@Transactional(readOnly = true)
public UserResponse getUserById(Long userId) {

    User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException(
                    "Không tìm thấy người dùng có ID: " + userId));

    return toResponse(user);
}

@Override
@Transactional(readOnly = true)
public List<TeacherStudentResponse> getMyStudents(String username) {

    User teacher = userRepository.findByUsername(username)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Không tìm thấy người dùng"
                    )
            );

    if (teacher.getRole() != UserRole.TEACHER) {
        throw new IllegalStateException(
                "Chỉ giáo viên mới được xem danh sách học sinh của mình"
        );
    }

    List<ClassStudent> classStudents = 
    classStudentRepository
                    .findAllByClassroom_Teacher_Id(
                            teacher.getId()
                    );

    Map<Long, TeacherStudentResponse> students =
            new LinkedHashMap<>();

    for (ClassStudent classStudent : classStudents) {

        User student = classStudent.getStudent();
        Classroom classroom = classStudent.getClassroom();

        TeacherStudentResponse response =
                students.computeIfAbsent(
                        student.getId(),
                        id -> TeacherStudentResponse.builder()
                                .id(student.getId())
                                .username(student.getUsername())
                                .email(student.getEmail())
                                .fullName(student.getFullName())
                                .phone(student.getPhone())
                                .studentCode(student.getStudentCode())
                                .status(student.getStatus())
                                .avatar(
                                        storageService.getUrl(
                                                student.getAvatar()
                                        )
                                )
                                .classes(new ArrayList<>())
                                .build()
                );

        response.getClasses().add(
                StudentClassResponse.builder()
                        .id(classroom.getId())
                        .name(classroom.getName())
                        .code(classroom.getCode())
                        .academicYear(
                                classroom.getAcademicYear()
                        )
                        .status(classroom.getStatus())
                        .build()
        );
    }

    return new ArrayList<>(students.values());
}

@Override
@Transactional
public void changePassword(
        String username,
        ChangePasswordRequest request
) {
    User user = userRepository.findByUsername(username)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Không tìm thấy người dùng"
                    )
            );

    // Kiểm tra mật khẩu hiện tại
    if (!passwordEncoder.matches(
            request.getCurrentPassword(),
            user.getPasswordHash()
    )) {
        throw new IllegalArgumentException(
                "Mật khẩu hiện tại không chính xác"
        );
    }

    // Không cho đổi sang chính mật khẩu đang dùng
    if (passwordEncoder.matches(
            request.getNewPassword(),
            user.getPasswordHash()
    )) {
        throw new IllegalArgumentException(
                "Mật khẩu mới không được trùng với mật khẩu hiện tại"
        );
    }

    // Hash mật khẩu mới
    String newPasswordHash =
            passwordEncoder.encode(
                    request.getNewPassword()
            );

    user.setPasswordHash(newPasswordHash);

    userRepository.save(user);
}

}