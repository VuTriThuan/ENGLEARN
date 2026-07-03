package com.example.demo.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LessonResponseDTO {

    private Long lessonId;
    private Long topicId;
    private String topicName;
    private String topicImage;
    @JsonProperty("name")
    private String lessonName;
    private Integer difficulty;
}
