package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TopicResponseDTO {

    private Long topicId;
    private String topicName;
    private String image;

    private Integer totalVocabulary;
}
