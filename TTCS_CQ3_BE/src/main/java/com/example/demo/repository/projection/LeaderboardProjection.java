package com.example.demo.repository.projection;

public interface LeaderboardProjection {

    Long getUserId();

    String getUsername();
    
    String getFullName();

    String getEmail();

    String getAvatarUrl();

    Long getTotalScore();

    Integer getCurrentStreak();
}
