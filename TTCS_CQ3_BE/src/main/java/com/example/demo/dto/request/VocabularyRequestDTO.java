package com.example.demo.dto.request;

import com.example.demo.enums.VocabLevel;
import lombok.Data;

@Data
public class VocabularyRequestDTO {
    private Long lessonId;
    private String word;
    private String wordType;
    private String meaning;
    private String pronunciation;
    private String example;
    private String audio;
    private VocabLevel level;
}
