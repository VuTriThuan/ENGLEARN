package com.example.demo.service.impl;

import com.example.demo.entity.UserVocabProgressEntity;
import com.example.demo.enums.VocabStatus;

final class VocabStatusResolver {
    private static final double MASTERED_P_FORGET_THRESHOLD = 0.2d;

    private VocabStatusResolver() {
    }

    static VocabStatus resolve(UserVocabProgressEntity progress) {
        if (progress == null) {
            return VocabStatus.NEW;
        }

        int correctCount = progress.getCorrectCount() != null ? progress.getCorrectCount() : 0;
        int incorrectCount = progress.getIncorrectCount() != null ? progress.getIncorrectCount() : 0;
        return resolve(correctCount + incorrectCount, progress.getPForget());
    }

    static VocabStatus resolve(int totalAttempts, Double pForget) {
        if (totalAttempts <= 0) {
            return VocabStatus.NEW;
        }

        if (pForget != null && pForget < MASTERED_P_FORGET_THRESHOLD) {
            return VocabStatus.MASTERED;
        }

        return VocabStatus.LEARNING;
    }
}
