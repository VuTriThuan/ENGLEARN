package com.example.demo.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import com.example.demo.service.CloudinaryService;
import org.springframework.stereotype.Service;

import com.example.demo.dto.request.VocabularyRequestDTO;
import com.example.demo.dto.response.VocabularyResponseDTO;
import com.example.demo.entity.CollectionEntity;
import com.example.demo.entity.CollectionVocabEntity;
import com.example.demo.entity.LessonEntity;
import com.example.demo.entity.UserVocabProgressEntity;
import com.example.demo.entity.VocabularyEntity;
import com.example.demo.repository.CollectionRepository;
import com.example.demo.repository.CollectionVocabRepository;
import com.example.demo.repository.GameLogRepository;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.FavouriteVocabRepository;
import com.example.demo.repository.UserVocabProgressRepository;
import com.example.demo.repository.VocabularyRepository;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.VocabularyService;

import jakarta.transaction.Transactional;

import com.example.demo.exception.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor //tạo constructor cho final
public class VocabularyServiceImpl implements VocabularyService {

    private final VocabularyRepository vocabularyRepository;
    private final LessonRepository lessonRepository;
    private final CloudinaryService cloudinaryService;
    private final CollectionRepository collectionRepository;
    private final CollectionVocabRepository collectionVocabRepository;
    private final UserVocabProgressRepository userVocabProgressRepository;
    private final FavouriteVocabRepository favouriteVocabRepository;
    private final GameLogRepository gameLogRepository;

    private VocabularyResponseDTO toResponseDTO(VocabularyEntity vocab) {
        UserVocabProgressEntity progress = getCurrentUserProgress(vocab.getVocabId());
        return VocabularyResponseDTO.builder()
                .vocabId(vocab.getVocabId())
                .word(vocab.getWord())
                .wordType(vocab.getWordType())
                .meaning(vocab.getMeaning())
                .pronunciation(vocab.getPronunciation())
                .example(vocab.getExample())
                .level(vocab.getLevel())
                .lessonId(vocab.getLesson() != null ? vocab.getLesson().getLessonId() : null)
                .lessonName(vocab.getLesson() != null ? vocab.getLesson().getLessonName() : null)
                .status(VocabStatusResolver.resolve(progress))
                .pForget(progress != null ? progress.getPForget() : null)
                .build();
    }

    private UserVocabProgressEntity getCurrentUserProgress(Long vocabId) {
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            return null;
        }

        return userVocabProgressRepository
                .findFirstByUser_EmailAndVocab_VocabIdOrderByCreatedAtDesc(userDetails.getUsername(), vocabId)
                .orElse(null);
    }


    @Override
    public VocabularyResponseDTO createVocab(VocabularyRequestDTO request){
        LessonEntity lesson = null;
        if (request.getLessonId() != null) {
            lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lesson"));
        }

        VocabularyEntity vocab = new VocabularyEntity();
        vocab.setLesson(lesson);
        vocab.setWord(request.getWord());
        vocab.setWordType(request.getWordType());
        vocab.setMeaning(request.getMeaning());
        vocab.setPronunciation(request.getPronunciation());
        vocab.setExample(request.getExample());
        vocab.setLevel(request.getLevel());

        // Extract user id from SecurityContext
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof com.example.demo.security.CustomUserDetails) {
            Long userId = ((com.example.demo.security.CustomUserDetails) authentication.getPrincipal()).getUser().getUserId();
            vocab.setCreatedBy(userId);
        }

        vocab = vocabularyRepository.save(vocab);
        final VocabularyEntity savedVocab = vocab;

        // Tự động thêm từ vào bộ "Từ vựng của tôi" nếu user tạo (không thuộc lesson nào)
        if (lesson == null && savedVocab.getCreatedBy() != null) {
            collectionRepository.findByUser_UserIdAndCollectionName(savedVocab.getCreatedBy(), "Từ vựng của tôi")
                .ifPresent(collection -> {
                    CollectionVocabEntity colVocab = new CollectionVocabEntity();
                    colVocab.setCollection(collection);
                    colVocab.setVocab(savedVocab);
                    collectionVocabRepository.save(colVocab);
                });
        }

        return toResponseDTO(vocab);
    }

    @Override
    public List<VocabularyResponseDTO> getVocabsByLessonId(Long lessonId){
        return vocabularyRepository.findByLesson_LessonId(lessonId)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public VocabularyResponseDTO getVocabById(Long id){
        VocabularyEntity vocab = vocabularyRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy vocabulary"));

        return toResponseDTO(vocab);
    }

    @Override
    public VocabularyResponseDTO updateVocab(Long id, VocabularyRequestDTO request){
        VocabularyEntity vocab = vocabularyRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy vocabulary"));

        if (request.getLessonId() != null) {
            LessonEntity lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lesson"));
            vocab.setLesson(lesson);
        }

        vocab.setExample(request.getExample());
        vocab.setLevel(request.getLevel());
        vocab.setMeaning(request.getMeaning());
        vocab.setPronunciation(request.getPronunciation());
        vocab.setWord(request.getWord());
        vocab.setWordType(request.getWordType());

        vocab = vocabularyRepository.save(vocab);

        return toResponseDTO(vocab);
    }

    @Override
    @Transactional
    public void deleteVocab(Long id){

        VocabularyEntity vocab = vocabularyRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy vocabulary"));

        userVocabProgressRepository.deleteByVocab_VocabId(id);
        favouriteVocabRepository.deleteByVocab_VocabId(id);
        collectionVocabRepository.deleteByVocab_VocabId(id);
        gameLogRepository.deleteByVocab_VocabId(id);

        vocabularyRepository.deleteById(id);
    }

    @Override
    public List<VocabularyResponseDTO> getVocabsByTopicId(Long topicId) {

        List<VocabularyEntity> res = vocabularyRepository.findByLesson_Topic_TopicId(topicId);

        return res.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<VocabularyResponseDTO> getVocabsByCreatedBy(Long createdBy) {
        return vocabularyRepository.findByCreatedBy(createdBy)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
}
