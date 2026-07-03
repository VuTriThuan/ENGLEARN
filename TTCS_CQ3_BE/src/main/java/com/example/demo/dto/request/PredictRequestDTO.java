package com.example.demo.dto.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PredictRequestDTO {
    private double responseTime;
    private int correctCount;
    private int incorrectCount;
    private double rememberRate;
    private int daysSinceLastLearn;
}
