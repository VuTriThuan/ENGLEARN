package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PredictResponseDTO {
    private double p_correct;
    private double p_forget;
}
