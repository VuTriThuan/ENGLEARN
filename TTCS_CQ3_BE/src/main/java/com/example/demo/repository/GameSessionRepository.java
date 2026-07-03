package com.example.demo.repository;

import com.example.demo.entity.GameSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSessionEntity, Long> {

    @Query("""
            SELECT COALESCE(SUM(gs.score), 0)
            FROM GameSessionEntity gs
            WHERE gs.user.userId = :userId
            """)
    Long sumScoreByUserId(@Param("userId") Long userId);

    @Query("""
            SELECT gs.user.userId, COALESCE(SUM(gs.score), 0)
            FROM GameSessionEntity gs
            WHERE gs.user.userId IN :userIds
            GROUP BY gs.user.userId
            """)
    List<Object[]> sumScoresByUserIds(@Param("userIds") List<Long> userIds);

    @Query("""
            SELECT COALESCE(SUM(gs.score), 0)
            FROM GameSessionEntity gs
            WHERE gs.user.userId = :userId
              AND gs.startAt >= :startOfDay
              AND gs.startAt < :startOfNextDay
            """)
    Long sumScoreByUserIdAndStartAtBetween(
            @Param("userId") Long userId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("startOfNextDay") LocalDateTime startOfNextDay
    );

    void deleteByUser_UserId(Long userId);
}
