package com.example.demo.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TopicRequestDTO {
    @NotBlank(message = "Topic name không được để trống")
    private String topicName;
    private String image;
}
