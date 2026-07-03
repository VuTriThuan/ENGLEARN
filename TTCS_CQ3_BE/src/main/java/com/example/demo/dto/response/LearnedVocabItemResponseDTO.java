package com.example.demo.dto.response;

import java.time.LocalDateTime;

import com.example.demo.enums.VocabLevel;
import com.example.demo.enums.VocabStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LearnedVocabItemResponseDTO {
    private Long vocabId;
    private String word;
    private String meaning;
    private String wordType;
    private String pronunciation;
    private String example;
    private String audio;
    private VocabLevel level;
    private Long lessonId;
    private String lessonName;
    private VocabStatus status;
    private Integer correctCount;
    private Integer incorrectCount;
    private Double pForget;
    private LocalDateTime lastLearn;
}
