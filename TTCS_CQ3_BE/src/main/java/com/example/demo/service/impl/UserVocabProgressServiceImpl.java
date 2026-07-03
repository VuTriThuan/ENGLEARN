package com.example.demo.service.impl;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.dto.request.PredictRequestDTO;
import com.example.demo.dto.response.LearnedVocabItemResponseDTO;
import com.example.demo.dto.response.LearnedVocabStatsResponseDTO;
import com.example.demo.dto.response.PredictResponseDTO;
import com.example.demo.dto.response.VocabStatusSummaryDTO;
import com.example.demo.entity.UserEntity;
import com.example.demo.entity.UserVocabProgressEntity;
import com.example.demo.entity.VocabularyEntity;
import com.example.demo.enums.VocabStatus;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserVocabProgressRepository;
import com.example.demo.repository.VocabularyRepository;
import com.example.demo.repository.CollectionRepository;
import com.example.demo.service.MLService;
import com.example.demo.service.UserVocabProgressService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserVocabProgressServiceImpl implements UserVocabProgressService {
    private final UserVocabProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final VocabularyRepository vocabRepository;
    private final CollectionRepository collectionRepository;
    private final MLService mlService;

    @Override
    public LearnedVocabStatsResponseDTO getLearnedVocabStats(Long userId) {
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy user"));

        List<UserVocabProgressEntity> progresses = progressRepository.findLatestByUser(user);
        List<LearnedVocabItemResponseDTO> learnedVocabs = new ArrayList<>();

        int learningCount = 0;
        int masteredCount = 0;
        int totalCorrectCount = 0;
        int totalIncorrectCount = 0;

        for (UserVocabProgressEntity progress : progresses) {
            VocabStatus status = VocabStatusResolver.resolve(progress);
            if (status != VocabStatus.LEARNING && status != VocabStatus.MASTERED) {
                continue;
            }

            if (status == VocabStatus.LEARNING) {
                learningCount++;
            } else {
                masteredCount++;
            }

            VocabularyEntity vocab = progress.getVocab();
            int correctCount = progress.getCorrectCount() != null ? progress.getCorrectCount() : 0;
            int incorrectCount = progress.getIncorrectCount() != null ? progress.getIncorrectCount() : 0;
            LocalDateTime lastLearn = progress.getLastLearn() != null ? progress.getLastLearn() : progress.getCreatedAt();

            totalCorrectCount += correctCount;
            totalIncorrectCount += incorrectCount;

            learnedVocabs.add(LearnedVocabItemResponseDTO.builder()
                .vocabId(vocab.getVocabId())
                .word(vocab.getWord())
                .meaning(vocab.getMeaning())
                .wordType(vocab.getWordType())
                .pronunciation(vocab.getPronunciation())
                .example(vocab.getExample())
                .level(vocab.getLevel())
                .lessonId(vocab.getLesson() != null ? vocab.getLesson().getLessonId() : null)
                .lessonName(vocab.getLesson() != null ? vocab.getLesson().getLessonName() : null)
                .status(status)
                .correctCount(correctCount)
                .incorrectCount(incorrectCount)
                .pForget(progress.getPForget())
                .lastLearn(lastLearn)
                .build());
        }

        int totalLearned = learnedVocabs.size();

        return LearnedVocabStatsResponseDTO.builder()
            .userId(user.getUserId())
            .totalLearned(totalLearned)
            .learningCount(learningCount)
            .masteredCount(masteredCount)
            .totalCorrectCount(totalCorrectCount)
            .totalIncorrectCount(totalIncorrectCount)
            .learnedVocabs(learnedVocabs)
            .build();
    }

    @Override
    @Transactional
    public void updateProgress(Long userId, Long vocabId, boolean isCorrect) {
        updateProgress(userId, vocabId, isCorrect, 1);
    }

    @Override
    @Transactional
    public void updateProgress(Long userId, Long vocabId, boolean isCorrect, Integer responseTime) {
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        VocabularyEntity vocab = vocabRepository.findById(vocabId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy vocab"));

        UserVocabProgressEntity last = progressRepository.findTopByUserAndVocabOrderByCreatedAtDesc(user, vocab);

        int correctCount = 0;
        int incorrectCount = 0;
        int daysSinceLastLearn = 0;

        if (last != null) {
            correctCount = last.getCorrectCount() != null ? last.getCorrectCount() : 0;
            incorrectCount = last.getIncorrectCount() != null ? last.getIncorrectCount() : 0;
            daysSinceLastLearn = (int) ChronoUnit.DAYS.between(last.getCreatedAt(), LocalDateTime.now());
        }

        if (isCorrect) correctCount++;
        else incorrectCount++;

        int total = correctCount + incorrectCount;
        float alpha = Math.max(1f, 6f - total);
        float prior = 0.45f;
        float rememberRate = (correctCount + alpha * prior) / (total + alpha);
        if (!isCorrect) {
            rememberRate *= 0.85f;
        }

        float safeResponseTime = responseTime != null && responseTime > 0 ? responseTime.floatValue() : 1f;

        PredictRequestDTO request = PredictRequestDTO.builder()
            .responseTime(safeResponseTime)
            .correctCount(correctCount)
            .incorrectCount(incorrectCount)
            .rememberRate(rememberRate)
            .daysSinceLastLearn(daysSinceLastLearn)
            .build();

        PredictResponseDTO response = mlService.predict(request);
        double pForget = response.getP_forget();
        VocabStatus status = VocabStatusResolver.resolve(total, pForget);

        UserVocabProgressEntity newProgress = UserVocabProgressEntity.builder()
            .user(user)
            .vocab(vocab)
            .correctCount(correctCount)
            .incorrectCount(incorrectCount)
            .rememberRate(rememberRate)
            .pForget(pForget)
            .status(status)
            .lastLearn(LocalDateTime.now())
            .createdAt(LocalDateTime.now())
            .build();

        progressRepository.save(newProgress);
    }

    @Override
    public VocabStatusSummaryDTO getStatusSummaryForCollection(Long userId, Long collectionId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy user"));

        // Kiểm tra nếu đây là "Từ vựng của tôi" → dùng từ do user tự tạo
        var collection = collectionRepository.findById(collectionId).orElse(null);
        if (collection != null && "Từ vựng của tôi".equals(collection.getCollectionName())) {
            long totalCount = vocabRepository.findByCreatedBy(userId).size();
            List<Long> userVocabIds = vocabRepository.findByCreatedBy(userId)
                    .stream().map(v -> v.getVocabId()).collect(java.util.stream.Collectors.toList());
            List<Object[]> rows = userVocabIds.isEmpty() ? java.util.Collections.emptyList()
                    : progressRepository.findLatestProgressForVocabIds(user, userVocabIds);
            return buildSummary(totalCount, rows);
        }

        long totalCount = progressRepository.countVocabsInCollection(collectionId);
        List<Object[]> rows = progressRepository.findLatestProgressInCollection(user, collectionId);

        return buildSummary(totalCount, rows);
    }

    @Override
    public VocabStatusSummaryDTO getStatusSummaryForLesson(Long userId, Long lessonId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy user"));

        long totalCount = progressRepository.countVocabsInLesson(lessonId);
        List<Object[]> rows = progressRepository.findLatestProgressInLesson(user, lessonId);

        return buildSummary(totalCount, rows);
    }

    private VocabStatusSummaryDTO buildSummary(long totalCount, List<Object[]> rows) {
        long learningCount = 0;
        long masteredCount = 0;

        for (Object[] row : rows) {
            Integer correctCount  = row[3] != null ? ((Number) row[3]).intValue() : 0;
            Integer incorrectCount = row[4] != null ? ((Number) row[4]).intValue() : 0;
            Double pForget = row[2] != null ? ((Number) row[2]).doubleValue() : null;
            int totalAttempts = correctCount + incorrectCount;

            VocabStatus resolvedStatus = VocabStatusResolver.resolve(totalAttempts, pForget);
            if (resolvedStatus == VocabStatus.MASTERED) {
                masteredCount++;
            } else if (resolvedStatus == VocabStatus.LEARNING) {
                learningCount++;
            }
        }

        long newCount = Math.max(0, totalCount - learningCount - masteredCount);

        return VocabStatusSummaryDTO.builder()
                .totalCount(totalCount)
                .newCount(newCount)
                .learningCount(learningCount)
                .masteredCount(masteredCount)
                .build();
    }
}
