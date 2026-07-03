package com.example.demo.service.impl;

import com.example.demo.dto.response.LeaderboardResponseDTO;
import com.example.demo.dto.response.UserRankDTO;
import com.example.demo.repository.LeaderboardRepository;
import com.example.demo.repository.projection.LeaderboardProjection;
import com.example.demo.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderboardServiceImpl implements LeaderboardService {

    private final LeaderboardRepository leaderboardRepository;

    @Override
    public LeaderboardResponseDTO getLeaderboard(String sortBy, String timeFilter, int limit, Long userId) {

        // Tính khoảng thời gian filter (chỉ dùng khi sortBy = "score")
        LocalDateTime startDate = resolveStartDate(timeFilter);
        LocalDateTime endDate   = LocalDateTime.now();

        // Lấy danh sách từ DB theo loại sort
        List<LeaderboardProjection> projections;
        if ("streak".equalsIgnoreCase(sortBy)) {

            projections = leaderboardRepository.findTopByStreak(limit);
        } else {
            LocalDateTime effectiveStart = "all".equalsIgnoreCase(timeFilter) ? null : startDate;
            LocalDateTime effectiveEnd   = "all".equalsIgnoreCase(timeFilter) ? null : endDate;
            projections = leaderboardRepository.findTopByScore(effectiveStart, effectiveEnd, limit);
        }

        List<UserRankDTO> users = new ArrayList<>();
        for (int i = 0; i < projections.size(); i++) {
            LeaderboardProjection p = projections.get(i);
            int rank = i + 1;

            UserRankDTO dto = UserRankDTO.builder()
                    .id(p.getUserId())
                    .username(p.getUsername())
                    .fullName(p.getFullName())
                    .email(p.getEmail())
                    .avatarUrl(p.getAvatarUrl())
                    .totalScore(p.getTotalScore() != null ? p.getTotalScore().intValue() : 0)
                    .streak(p.getCurrentStreak() != null ? p.getCurrentStreak() : 0)
                    .rank(rank)
                    .isCurrentUser(userId != null && userId.equals(p.getUserId()))
                    .build();

            users.add(dto);
        }

        // Tính rank của user hiện tại
        int currentUserRank = 0;
        if (userId != null) {
            if ("streak".equalsIgnoreCase(sortBy)) {
                currentUserRank = leaderboardRepository.findCurrentUserRankByStreak(userId);
            } else {
                LocalDateTime effectiveStart = "all".equalsIgnoreCase(timeFilter) ? null : startDate;
                LocalDateTime effectiveEnd   = "all".equalsIgnoreCase(timeFilter) ? null : endDate;
                currentUserRank = leaderboardRepository.findCurrentUserRankByScore(userId, effectiveStart, effectiveEnd);
            }
        }

        return LeaderboardResponseDTO.builder()
                .users(users)
                .totalUsers(users.size())
                .currentUserRank(currentUserRank)
                .build();
    }

    private LocalDateTime resolveStartDate(String timeFilter) {
        LocalDateTime now = LocalDateTime.now();
        return switch (timeFilter.toLowerCase()) {
            case "day"   -> now.toLocalDate().atStartOfDay();
            case "week"  -> now.toLocalDate().atStartOfDay()
                              .minusDays(now.getDayOfWeek().getValue() - 1);
            case "month" -> now.withDayOfMonth(1).toLocalDate().atStartOfDay();
            case "year"  -> now.withDayOfYear(1).toLocalDate().atStartOfDay();
            default      -> null;
        };
    }
}
