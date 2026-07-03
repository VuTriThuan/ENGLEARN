package com.example.demo.dto.internal;

import com.example.demo.entity.VocabularyEntity;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FeatureDTO {
    private VocabularyEntity vocab;
    private int correctCount;
    private int incorrectCount;
    private double rememberRate;
    private int daysSinceLastLearn;
    private double responseTime;
    private Double dbPForget;
    private Long progressId;
}
