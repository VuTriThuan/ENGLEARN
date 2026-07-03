package com.example.demo.service;

import java.util.List;

import com.example.demo.dto.response.VocabularyResponseDTO;

public interface ReviewService {
    List<VocabularyResponseDTO> getSmartReview(Long userId, int limit);
    void resetPForget(Long userId, Long vocabId);
}
