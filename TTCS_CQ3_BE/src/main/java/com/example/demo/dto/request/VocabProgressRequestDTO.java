package com.example.demo.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class VocabProgressRequestDTO {

    @NotNull(message = "Thiếu ID của từ vựng")
    private Long vocabId;

    @NotNull(message = "Hãy chọn đáp án")
    private Boolean isCorrect;

    private Integer responseTime;
}
