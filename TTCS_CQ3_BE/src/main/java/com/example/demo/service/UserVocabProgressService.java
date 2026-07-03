package com.example.demo.service;

import com.example.demo.dto.response.LearnedVocabStatsResponseDTO;
import com.example.demo.dto.response.VocabStatusSummaryDTO;

public interface UserVocabProgressService {
    void updateProgress(Long userId, Long vocabId, boolean is_correct);

    void updateProgress(Long userId, Long vocabId, boolean is_correct, Integer responseTime);

    LearnedVocabStatsResponseDTO getLearnedVocabStats(Long userId);

    VocabStatusSummaryDTO getStatusSummaryForCollection(Long userId, Long collectionId);

    VocabStatusSummaryDTO getStatusSummaryForLesson(Long userId, Long lessonId);
}
