package com.example.demo.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.dto.response.CollectionResponseDTO;
import com.example.demo.dto.response.CollectionVocabResponse;
import com.example.demo.entity.CollectionEntity;
import com.example.demo.entity.CollectionVocabEntity;
import com.example.demo.entity.UserEntity;
import com.example.demo.entity.VocabularyEntity;
import com.example.demo.repository.CollectionRepository;
import com.example.demo.repository.CollectionVocabRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.VocabularyRepository;
import com.example.demo.service.CollectionService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CollectionServiceImpl implements CollectionService {

        private final CollectionRepository collectionRepository;
        private final CollectionVocabRepository collectionVocabRepository;
        private final UserRepository userRepository;
        private final VocabularyRepository vocabularyRepository;

        @Override
        public List<CollectionResponseDTO> getUserCollections(Long userId) {
                UserEntity user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

                List<CollectionEntity> collections = collectionRepository.findByUser_UserId(userId);

                final String DEFAULT_NAME = "Từ vựng của tôi";
                boolean hasDefault = collections.stream()
                                .anyMatch(c -> DEFAULT_NAME.equals(c.getCollectionName()));
                if (!hasDefault) {
                        CollectionEntity defaultCollection = CollectionEntity.builder()
                                        .user(user)
                                        .collectionName(DEFAULT_NAME)
                                        .build();
                        collectionRepository.save(defaultCollection);
                        collections = collectionRepository.findByUser_UserId(userId);
                }

                return collections.stream()
                                .map(c -> CollectionResponseDTO.builder()
                                                .collectionId(c.getCollectionId())
                                                .collectionName(c.getCollectionName())
                                                .createdAt(c.getCreatedAt())
                                                .vocabCount(collectionVocabRepository.countByCollection(c))
                                                .build())
                                .collect(Collectors.toList());
        }

        @Override
        public CollectionResponseDTO createCollection(Long userId, String collectionName) {
                UserEntity user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
                CollectionEntity collection = CollectionEntity.builder()
                                .user(user)
                                .collectionName(collectionName)
                                .build();
                collection = collectionRepository.save(collection);
                return CollectionResponseDTO.builder()
                                .collectionId(collection.getCollectionId())
                                .collectionName(collection.getCollectionName())
                                .createdAt(collection.getCreatedAt())
                                .vocabCount(0)
                                .build();
        }

        @Override
        public void deleteCollection(Long userId, Long collectionId) {
                CollectionEntity collection = collectionRepository
                                .findByCollectionIdAndUser_UserId(collectionId, userId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy collection"));
                if ("Từ vựng của tôi".equals(collection.getCollectionName())) {
                        throw new RuntimeException("Không thể xóa bộ từ vựng mặc định này");
                }
                collectionRepository.delete(collection);
        }

        @Override
        public void addVocabToCollection(Long userId, Long collectionId, Long vocabId) {
                CollectionEntity collection = collectionRepository
                                .findByCollectionIdAndUser_UserId(collectionId, userId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy collection"));
                VocabularyEntity vocab = vocabularyRepository.findById(vocabId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy từ vựng"));
                if (collectionVocabRepository.existsByCollection_CollectionIdAndVocab_VocabId(collectionId, vocabId)) {
                        return; // already exists, skip
                }
                CollectionVocabEntity cv = CollectionVocabEntity.builder()
                                .collection(collection)
                                .vocab(vocab)
                                .build();
                collectionVocabRepository.save(cv);
        }

        @Override
        public List<CollectionVocabResponse> getVocabsInCollection(Long userId, Long collectionId) {
                CollectionEntity collection = collectionRepository
                                .findByCollectionIdAndUser_UserId(collectionId, userId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy collection"));

                List<CollectionVocabEntity> list = collectionVocabRepository.findByCollection(collection);

                return list.stream()
                                .map(cv -> {
                                        VocabularyEntity v = cv.getVocab();
                                        return CollectionVocabResponse.builder()
                                                        .vocabId(v.getVocabId())
                                                        .word(v.getWord())
                                                        .meaning(v.getMeaning())
                                                        .pronunciation(v.getPronunciation())
                                                        .build();
                                })
                                .collect(Collectors.toList());
        }

        @Override
        public void removeVocabFromCollection(Long userId, Long collectionId, Long vocabId) {
                CollectionEntity collection = collectionRepository
                                .findByCollectionIdAndUser_UserId(collectionId, userId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy collection"));
                CollectionVocabEntity collectionVocab = collectionVocabRepository
                                .findByCollection_CollectionIdAndVocab_VocabId(collectionId, vocabId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy từ vựng trong collection"));
                collectionVocabRepository.delete(collectionVocab);
        }

        @Override
        public CollectionResponseDTO updateCollectionName(Long userId, Long collectionId, String newName) {
                CollectionEntity collection = collectionRepository
                                .findByCollectionIdAndUser_UserId(collectionId, userId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy collection"));
                collection.setCollectionName(newName);
                collection = collectionRepository.save(collection);
                return CollectionResponseDTO.builder()
                                .collectionId(collection.getCollectionId())
                                .collectionName(collection.getCollectionName())
                                .createdAt(collection.getCreatedAt())
                                .vocabCount(collectionVocabRepository.countByCollection(collection))
                                .build();
        }
}