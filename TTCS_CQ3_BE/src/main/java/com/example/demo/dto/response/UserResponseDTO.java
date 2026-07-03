package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {
    private Long userId;
    private String fullName;
    private String username;
    private String email;

    @JsonProperty("date_of_birth")
    private String dateOfBirth;

    private String role;
    private String createdAt;
    private Integer totalScore;
    private Integer rank;
    private Integer currentStreak;

    @JsonProperty("avatarUrl")
    private String avatarUrl;
}
