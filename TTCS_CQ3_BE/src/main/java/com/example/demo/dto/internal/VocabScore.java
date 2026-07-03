package com.example.demo.dto.internal;

import com.example.demo.entity.VocabularyEntity;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VocabScore {
    private VocabularyEntity vocab;
    private double score;
    private double mlScore;
}
