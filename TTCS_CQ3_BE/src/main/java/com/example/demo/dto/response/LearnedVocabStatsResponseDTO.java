package com.example.demo.dto.response;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LearnedVocabStatsResponseDTO {
    private Long userId;
    private Integer totalLearned;
    private Integer learningCount;
    private Integer masteredCount;
    private Integer totalCorrectCount;
    private Integer totalIncorrectCount;
    private List<LearnedVocabItemResponseDTO> learnedVocabs;
}
