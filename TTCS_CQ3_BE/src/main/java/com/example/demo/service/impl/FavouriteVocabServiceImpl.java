package com.example.demo.service.impl;

import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.response.FavouriteVocabResponse;
import com.example.demo.entity.FavouriteVocabEntity;
import com.example.demo.entity.UserEntity;
import com.example.demo.entity.VocabularyEntity;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.FavouriteVocabRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.VocabularyRepository;
import com.example.demo.service.FavouriteVocabService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FavouriteVocabServiceImpl implements FavouriteVocabService {

    private final FavouriteVocabRepository favouriteVocabRepository;
    private final UserRepository userRepository;
    private final VocabularyRepository vocabularyRepository;

    @Override
    @Transactional
    public void addFavourite(Long userId, Long vocabId) {

        if (favouriteVocabRepository.existsByUser_UserIdAndVocab_VocabId(userId, vocabId)) {
            throw new RuntimeException("Từ vựng đã có trong danh sách yêu thích");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));

        VocabularyEntity vocab = vocabularyRepository.findById(vocabId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy từ vựng"));

        FavouriteVocabEntity favourite = FavouriteVocabEntity.builder()
                .user(user)
                .vocab(vocab)
                .addedAt(LocalDateTime.now())
                .build();
        favouriteVocabRepository.save(favourite);
    }

    @Override
    @Transactional
    public void removeFavourite(Long userId, Long vocabId) {

        FavouriteVocabEntity favourite = favouriteVocabRepository
                .findByUser_UserIdAndVocab_VocabId(userId, vocabId)
                .orElseThrow(() -> new NotFoundException("Từ vựng không có trong danh sách yêu thích"));
        favouriteVocabRepository.delete(favourite);
    }

    @Override
    public List<FavouriteVocabResponse> getFavourites(Long userId) {

        List<FavouriteVocabEntity> favourites = favouriteVocabRepository.findByUser_UserId(userId);
        return favourites.stream()
                .map(fav -> {
                    VocabularyEntity v = fav.getVocab();
                    return FavouriteVocabResponse.builder()
                            .vocabId(v.getVocabId())
                            .word(v.getWord())
                            .wordType(v.getWordType())
                            .meaning(v.getMeaning())
                            .pronunciation(v.getPronunciation())
                            .example(v.getExample())
                            .level(v.getLevel())
                            .lessonId(v.getLesson() != null ? v.getLesson().getLessonId() : null)
                            .lessonName(v.getLesson() != null ? v.getLesson().getLessonName() : null)
                            .addedAt(fav.getAddedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public boolean isFavourite(Long userId, Long vocabId) {

        return favouriteVocabRepository.existsByUser_UserIdAndVocab_VocabId(userId, vocabId);
    }

}
