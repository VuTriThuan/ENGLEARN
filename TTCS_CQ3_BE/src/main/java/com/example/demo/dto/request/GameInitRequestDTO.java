package com.example.demo.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GameInitRequestDTO {

    private String mode;  // "TOPIC", "LESSON", "COLLECTION", "SMART_REVIEW"
    private Long sourceId;  // ID cua topic/lesson
    private Integer wordCount; // So luong cau hoi
    private List<Long> vocabIds; // Danh sach vocab cu the user chon tu frontend
    private List<String> statuses;  // "NEW", "LEARNING", "REVIEW", "MASTERED"
}
