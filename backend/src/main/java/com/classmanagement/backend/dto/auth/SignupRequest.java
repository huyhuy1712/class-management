package com.classmanagement.backend.dto.auth;

import com.classmanagement.backend.entity.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {

    @NotBlank(message = "Vui lòng nhập tên đăng nhập")
    @Size(min = 4, max = 50, message = "Tên đăng nhập phải có từ 4 đến 50 ký tự")
    private String username;

    @NotBlank(message = "Vui lòng nhập mật khẩu")
    @Size(min = 8, max = 100, message = "Mật khẩu phải có ít nhất 8 ký tự")
    private String password;

    @NotBlank(message = "Vui lòng nhập email")
    @Email(message = "Email phải có đuôi @gmail.com")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@gmail\\.com$", 
    message = "Email phải có định dạng xxxxx@gmail.com")
    private String email;

    @NotBlank(message = "Vui lòng nhập họ và tên")
    @Size(max = 100)
    private String fullName;

        @Pattern(
            regexp = "^$|^[0-9]{10}$",
            message = "Số điện thoại phải gồm đúng 10 chữ số"
        )
    private String phone;

    @Size(max = 500)
    private String avatar;

    @NotNull(message = "Vui lòng chọn vai trò")
    private UserRole role;
}