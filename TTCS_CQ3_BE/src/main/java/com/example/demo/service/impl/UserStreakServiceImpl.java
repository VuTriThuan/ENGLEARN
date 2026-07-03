package com.example.demo.service.impl;

import com.example.demo.entity.UserEntity;
import com.example.demo.entity.UserStreakEntity;
import com.example.demo.repository.GameSessionRepository;
import com.example.demo.repository.UserStreakRepository;
import com.example.demo.service.UserStreakService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserStreakServiceImpl implements UserStreakService {

    private static final int DAILY_STREAK_GOAL = 100;

    private final GameSessionRepository gameSessionRepository;
    private final UserStreakRepository userStreakRepository;

    @Override
    @Transactional
    public UserStreakEntity refreshCurrentStreak(UserEntity user) {
        LocalDate today = LocalDate.now();

        UserStreakEntity streak = userStreakRepository.findById(user.getUserId())
                .orElseGet(() -> UserStreakEntity.builder()
                        .user(user)
                        .currentStreak(0)
                        .longestStreak(0)
                        .build());

        int currentStreak = calculateCurrentStreak(user.getUserId(), today);

        streak.setCurrentStreak(currentStreak);

        streak.setLongestStreak(
                Math.max(
                        streak.getLongestStreak() != null
                                ? streak.getLongestStreak()
                                : 0,
                        currentStreak
                )
        );

        if (getDailyScore(user.getUserId(), today) >= DAILY_STREAK_GOAL) {
            streak.setLastStudy(LocalDateTime.now());
        }

        UserStreakEntity savedStreak = userStreakRepository.save(streak);

        user.setStreak(savedStreak);

        return savedStreak;
    }

    private int calculateCurrentStreak(Long userId, LocalDate today) {

        LocalDate streakEndDate =
                getDailyScore(userId, today) >= DAILY_STREAK_GOAL
                        ? today
                        : today.minusDays(1);

        int currentStreak = 0;

        LocalDate cursor = streakEndDate;

        while (getDailyScore(userId, cursor) >= DAILY_STREAK_GOAL) {
            currentStreak++;
            cursor = cursor.minusDays(1);
        }

        return currentStreak;
    }

    private long getDailyScore(Long userId, LocalDate date) {

        Long score = gameSessionRepository.sumScoreByUserIdAndStartAtBetween(
                userId,
                date.atStartOfDay(),
                date.plusDays(1).atStartOfDay()
        );

        return score != null ? score : 0;
    }
}