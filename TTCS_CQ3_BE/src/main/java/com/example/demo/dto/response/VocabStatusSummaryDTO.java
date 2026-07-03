package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VocabStatusSummaryDTO {
    private long newCount;
    private long learningCount;
    private long masteredCount;
    private long totalCount;
}
