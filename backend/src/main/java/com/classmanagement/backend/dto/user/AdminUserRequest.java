package com.classmanagement.backend.dto.user;

import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUserRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(max = 50, message = "Tên đăng nhập không được vượt quá 50 ký tự")
    private String username;

    @NotBlank(message = "Họ tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ tên phải từ 2 đến 100 ký tự")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 255, message = "Email không được vượt quá 255 ký tự")
    private String email;

    @Pattern(
            regexp = "^$|^(0[35789])[0-9]{8}$",
            message = "Số điện thoại không đúng định dạng"
    )
    private String phone;

    @NotNull(message = "Vai trò không được để trống")
    private UserRole role;

    @NotNull(message = "Trạng thái không được để trống")
    private UserStatus status;

    @Pattern(regexp = "^$|^.{8,72}$", message = "Mật khẩu phải từ 8 đến 72 ký tự")
    private String password;
}
