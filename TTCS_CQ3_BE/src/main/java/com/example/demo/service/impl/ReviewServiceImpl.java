package com.example.demo.service.impl;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.internal.FeatureDTO;
import com.example.demo.dto.internal.VocabScore;
import com.example.demo.dto.request.PredictRequestDTO;
import com.example.demo.dto.response.PredictResponseDTO;
import com.example.demo.dto.response.VocabularyResponseDTO;

import com.example.demo.entity.VocabularyEntity;
import com.example.demo.repository.UserVocabProgressRepository;
import com.example.demo.service.FeatureService;
import com.example.demo.service.MLService;
import com.example.demo.service.ReviewService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
    private static final double MIN_SMART_P_FORGET = 0.5D;

    private final FeatureService featureService;
    private final MLService mlService;
    private final UserVocabProgressRepository userVocabProgressRepository;

    @Transactional
    @Override
    public List<VocabularyResponseDTO> getSmartReview(Long userId, int limit){
        List<FeatureDTO> features = featureService.getFeatures(userId);
        List<VocabScore> scores = new ArrayList<>();

        for (FeatureDTO feature : features) {

            Double dbPForget = feature.getDbPForget();
            boolean markedByDb = dbPForget != null && dbPForget > MIN_SMART_P_FORGET;

            double mlPForget;
            try {
                PredictRequestDTO req = PredictRequestDTO.builder()
                    .responseTime(feature.getResponseTime())
                    .correctCount(feature.getCorrectCount())
                    .incorrectCount(feature.getIncorrectCount())
                    .rememberRate(feature.getRememberRate())
                    .daysSinceLastLearn(feature.getDaysSinceLastLearn())
                    .build();

                PredictResponseDTO res = mlService.predict(req);
                mlPForget = (res != null) ? res.getP_forget() : (dbPForget != null ? dbPForget : 0.0);
            } catch (Exception e) {

                mlPForget = (dbPForget != null) ? dbPForget : 0.0;
            }


            if (feature.getProgressId() != null) {
                final double pForgetToSave = mlPForget;
                userVocabProgressRepository.findById(feature.getProgressId())
                    .ifPresent(progress -> {
                        progress.setPForget(pForgetToSave);
                        userVocabProgressRepository.save(progress);
                    });
            }

            double finalScore;
            if (markedByDb) {
                finalScore = Math.max(dbPForget, mlPForget);
            } else {
                finalScore = mlPForget;
            }

            scores.add(new VocabScore(feature.getVocab(), finalScore, mlPForget));
        }


        scores.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        return scores.stream()
            .filter(s -> s.getScore() > MIN_SMART_P_FORGET)
            .limit(limit)
            .map(s -> {
                VocabularyEntity v = s.getVocab();
                // pForget hiển thị ra UI = giá trị đã lưu vào DB (mlPForget)
                return VocabularyResponseDTO.builder()
                    .lessonId(v.getLesson() != null ? v.getLesson().getLessonId() : null)
                    .lessonName(v.getLesson() != null ? v.getLesson().getLessonName() : null)
                    .vocabId(v.getVocabId())
                    .word(v.getWord())
                    .wordType(v.getWordType())
                    .meaning(v.getMeaning())
                    .pronunciation(v.getPronunciation())
                    .example(v.getExample())
                    .level(v.getLevel())
                    .status(VocabStatusResolver.resolve(1, s.getScore()))
                    .pForget(s.getMlScore())  // giá trị mlPForget đã lưu vào DB
                    .build();
            })
            .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    @Override
    public void resetPForget(Long userId, Long vocabId) {

        userVocabProgressRepository.deleteByUser_UserIdAndVocab_VocabId(userId, vocabId);
    }
}
