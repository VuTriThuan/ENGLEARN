package com.example.demo.repository;

import com.example.demo.repository.projection.LeaderboardProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.entity.UserEntity;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LeaderboardRepository extends JpaRepository<UserEntity, Long> {

    @Query(value = """
            SELECT
                u.user_id        AS userId,
                u.username       AS username,
                u.full_name      AS fullName,
                u.email          AS email,
                u.avatar         AS avatarUrl,
                COALESCE(SUM(gs.score), 0)  AS totalScore,
                COALESCE(us.current_streak, 0) AS currentStreak
            FROM `user` u
            LEFT JOIN game_session gs
                ON gs.user_id = u.user_id
                AND (
                    :startDate IS NULL
                    OR gs.start_at >= :startDate
                )
                AND (
                    :endDate IS NULL
                    OR gs.start_at <= :endDate
                )
            LEFT JOIN user_streak us ON us.user_id = u.user_id
            WHERE u.role = 'USER'
            GROUP BY u.user_id, u.username, u.full_name, u.email, u.avatar, us.current_streak
            ORDER BY totalScore DESC, currentStreak DESC
            LIMIT :limit
            """,
            nativeQuery = true)
    List<LeaderboardProjection> findTopByScore(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("limit") int limit
    );

    @Query(value = """
            SELECT
                u.user_id        AS userId,
                u.username       AS username,
                u.full_name      AS fullName,
                u.email          AS email,
                u.avatar         AS avatarUrl,
                COALESCE(SUM(gs.score), 0)  AS totalScore,
                COALESCE(us.current_streak, 0) AS currentStreak
            FROM `user` u
            LEFT JOIN game_session gs ON gs.user_id = u.user_id
            LEFT JOIN user_streak us ON us.user_id = u.user_id
            WHERE u.role = 'USER'
            GROUP BY u.user_id, u.username, u.full_name, u.email, u.avatar, us.current_streak
            ORDER BY currentStreak DESC, totalScore DESC
            LIMIT :limit
            """,
            nativeQuery = true)
    List<LeaderboardProjection> findTopByStreak(@Param("limit") int limit);

    @Query(value = """
            SELECT COUNT(*) + 1
            FROM (
                SELECT u.user_id, COALESCE(SUM(gs.score), 0) AS totalScore
                FROM `user` u
                LEFT JOIN game_session gs
                    ON gs.user_id = u.user_id
                    AND (:startDate IS NULL OR gs.start_at >= :startDate)
                    AND (:endDate IS NULL   OR gs.start_at <= :endDate)
                WHERE u.role = 'USER'
                GROUP BY u.user_id
            ) ranked
            WHERE ranked.totalScore > (
                SELECT COALESCE(SUM(gs2.score), 0)
                FROM game_session gs2
                WHERE gs2.user_id = :userId
                  AND (:startDate IS NULL OR gs2.start_at >= :startDate)
                  AND (:endDate IS NULL   OR gs2.start_at <= :endDate)
            )
            """,
            nativeQuery = true)
    int findCurrentUserRankByScore(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query(value = """
            SELECT COUNT(*) + 1
            FROM user_streak us
            JOIN `user` u ON u.user_id = us.user_id
            WHERE u.role = 'USER'
              AND us.current_streak > (
                  SELECT COALESCE(current_streak, 0)
                  FROM user_streak
                  WHERE user_id = :userId
              )
            """,
            nativeQuery = true)
    int findCurrentUserRankByStreak(@Param("userId") Long userId);
}
