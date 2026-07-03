package com.example.demo.dto.request;

import com.example.demo.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordDTO {

    @NotBlank(message = "Yêu cầu nhập mật khẩu cũ")
    private String oldPassword;

    @NotBlank(message = "Yêu cầu nhập mật khẩu mới cho tài khoản")
    @Size(min = 6, message = "Mật khẩu mới cần dài ít nhất 6 kí tự")
    private String newPassword;

    @NotBlank(message = "Yêu cầu nhập lại mật khẩu mới")
    private String retypePassword;
}
