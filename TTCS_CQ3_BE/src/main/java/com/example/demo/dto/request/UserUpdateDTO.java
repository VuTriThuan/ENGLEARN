package com.example.demo.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateDTO {

    private String username;

    private String fullName;

    @Email(message = "Email không hợp lệ")
    private String email;

    @JsonProperty("date_of_birth")
    private String dateOfBirth; //đổi sang String tráng lỗi parse JSON

    @JsonProperty("avatarUrl")
    private String avatarUrl;
}

