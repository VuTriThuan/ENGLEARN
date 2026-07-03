package com.example.demo.service;

import com.example.demo.dto.response.CollectionVocabResponse;
import com.example.demo.dto.response.CollectionResponseDTO;

import java.util.List;

public interface CollectionService {

    List<CollectionResponseDTO> getUserCollections(Long userId);

    CollectionResponseDTO createCollection(Long userId, String collectionName);

    void deleteCollection(Long userId, Long collectionId);

    void addVocabToCollection(Long userId, Long collectionId, Long vocabId);

    List<CollectionVocabResponse> getVocabsInCollection(Long userId, Long collectionId);

    CollectionResponseDTO updateCollectionName(Long userId, Long collectionId, String newName);

    void removeVocabFromCollection(Long userId, Long collectionId, Long vocabId);
}
