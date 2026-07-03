package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import com.example.demo.enums.SourceType;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_session")
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class GameSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Long sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type")
    private SourceType sourceType;

    @Column(name = "source_id")
    private Long sourceId;      //null khi sourceType = "SMART_REVIEW"

    @Column(name = "game_type")
    private String gameType;

    @Column(name = "score")
    private Integer score = 0;

    @Column(name = "time_limit")
    private Integer timeLimit = 0;

    @Column(name = "time_spent")
    private Integer timeSpent = 0;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "is_finish")
    private boolean isFinish;

}
