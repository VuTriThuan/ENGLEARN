package com.example.demo.service;

import com.example.demo.dto.request.PredictRequestDTO;
import com.example.demo.dto.response.PredictResponseDTO;

public interface MLService {
    PredictResponseDTO predict(PredictRequestDTO request);
}
