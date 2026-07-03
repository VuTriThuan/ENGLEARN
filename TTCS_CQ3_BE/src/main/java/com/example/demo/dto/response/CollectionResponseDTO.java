package com.example.demo.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CollectionResponseDTO {

    private Long collectionId;
    private String collectionName;
    private LocalDateTime createdAt;
    private Integer vocabCount;
}
