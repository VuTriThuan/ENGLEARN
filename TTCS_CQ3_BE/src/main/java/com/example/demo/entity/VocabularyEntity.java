package com.example.demo.entity;

import com.example.demo.enums.VocabLevel;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "vocabulary")

public class VocabularyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vocab_id")
    private Long vocabId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private LessonEntity lesson;

    @Column(name = "word", nullable = false)
    private String word;

    @Column(name = "word_type")
    private String wordType;

    @Column(name = "meaning")
    private String meaning;

    @Column(name = "pronunciation")
    private String pronunciation;

    @Lob
    @Column(name = "example", columnDefinition = "TEXT")
    private String example;

    @Enumerated(EnumType.STRING)
    @Column(name = "level")
    private VocabLevel level;

    @Column(name = "created_by")
    private Long createdBy;
}
