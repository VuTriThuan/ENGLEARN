package com.example.demo.service;

import java.util.List;

import com.example.demo.dto.request.VocabularyRequestDTO;
import com.example.demo.dto.response.VocabularyResponseDTO;


public interface VocabularyService {
    VocabularyResponseDTO createVocab(VocabularyRequestDTO request);
    List<VocabularyResponseDTO> getVocabsByLessonId(Long lessonId);
    VocabularyResponseDTO getVocabById(Long id);
    VocabularyResponseDTO updateVocab(Long id, VocabularyRequestDTO request);
    void deleteVocab(Long id);

    List<VocabularyResponseDTO> getVocabsByTopicId(Long topicId);
    List<VocabularyResponseDTO> getVocabsByCreatedBy(Long createdBy);
}
