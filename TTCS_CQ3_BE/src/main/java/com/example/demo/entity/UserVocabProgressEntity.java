package com.example.demo.entity;

import com.example.demo.enums.VocabStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "user_vocab_progress")
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class UserVocabProgressEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vocab_id")
    private VocabularyEntity vocab;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private VocabStatus status = VocabStatus.NEW;

    @Column(name = "remember_rate")
    private Float rememberRate = 0F;

    @Column(name = "p_forget")
    private Double pForget;

//    @Column(name = "review_count")
//    private Integer reviewCount = 0;

    @Column(name = "correct_count")
    private Integer correctCount;

    @Column(name = "incorrect_count")
    private Integer incorrectCount;

    @Column(name = "last_learn")
    private LocalDateTime lastLearn;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
