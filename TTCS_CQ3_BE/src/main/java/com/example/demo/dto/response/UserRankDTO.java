package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRankDTO {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String avatarUrl;
    private Integer totalScore;
    private Integer streak;
    private Integer rank;
    private Boolean isCurrentUser;
}
