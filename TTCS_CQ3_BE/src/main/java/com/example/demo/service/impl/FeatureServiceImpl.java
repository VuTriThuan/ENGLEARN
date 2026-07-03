package com.example.demo.service.impl;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.dto.internal.FeatureDTO;
import com.example.demo.entity.UserEntity;
import com.example.demo.entity.UserVocabProgressEntity;
import com.example.demo.entity.VocabularyEntity;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserVocabProgressRepository;
import com.example.demo.service.FeatureService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FeatureServiceImpl implements FeatureService {
    private final UserRepository userRepository;
    private final UserVocabProgressRepository progressRepository;

    @Override 
    public List<FeatureDTO> getFeatures(Long userId){
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        
        List<UserVocabProgressEntity> progresses = progressRepository.findLatestByUser(user);

        List<FeatureDTO> result = new ArrayList<>();
        for(UserVocabProgressEntity progress : progresses){
            VocabularyEntity vocab = progress.getVocab();
            int correctCount = progress.getCorrectCount() != null ? progress.getCorrectCount() : 0;
            int incorrectCount = progress.getIncorrectCount() != null ? progress.getIncorrectCount() : 0;
            double rememberRate = normalizeRememberRate(progress.getRememberRate());
            int days = (int) ChronoUnit.DAYS.between(progress.getCreatedAt(), LocalDateTime.now());
            double responseTime = 3.0; //để mặc định 3.0

            Double dbPForget = progress.getPForget();

            result.add(new FeatureDTO(vocab, correctCount, incorrectCount, rememberRate, days, responseTime, dbPForget, progress.getId()));
        }

        return result;
    }

    private double normalizeRememberRate(Float rememberRate) {
        if (rememberRate == null) {
            return 0;
        }

        return rememberRate > 1 ? rememberRate / 100 : rememberRate;
    }
}
