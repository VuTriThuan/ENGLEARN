package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CollectionVocabResponse {

    private Long vocabId;
    private String word;
    private String meaning;
    private String pronunciation;
}