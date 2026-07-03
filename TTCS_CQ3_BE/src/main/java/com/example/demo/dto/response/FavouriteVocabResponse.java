package com.example.demo.dto.response;

import java.time.LocalDateTime;

import com.example.demo.enums.VocabLevel;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FavouriteVocabResponse {

    private Long vocabId;
    private String word;
    private String wordType;
    private String meaning;
    private String pronunciation;
    private String example;
    private String audio;
    private VocabLevel level;
    private Long lessonId;
    private String lessonName;
    private LocalDateTime addedAt;

}
