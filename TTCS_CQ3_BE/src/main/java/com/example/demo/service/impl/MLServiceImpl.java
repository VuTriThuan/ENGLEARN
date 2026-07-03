package com.example.demo.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.demo.dto.request.PredictRequestDTO;
import com.example.demo.dto.response.PredictResponseDTO;
import com.example.demo.service.MLService;
import org.springframework.beans.factory.annotation.Value;

@Service
public class MLServiceImpl implements MLService {
    @Value("${ml.api.url}")
    private String url;
    private final RestTemplate restTemplate = new RestTemplate(); //cầu nối giữa ứng dụng Spring Boot và ML API, giúp gửi HTTP request và nhận response
    @Override
    public PredictResponseDTO predict(PredictRequestDTO request) {
        try {
            PredictResponseDTO response = restTemplate.postForObject( //gửi POST request đến ML API với URL và body là request, và nhận về response dưới dạng PredictResponseDTO
                url, //gửi đi đâu   
                request, //gửi cái gì
                PredictResponseDTO.class //mong đợi nhận về kiểu dữ liệu gì
            );

            System.out.println("RESPONSE: " + response);

            return response;

        } catch (Exception e) {
            System.out.println("=== ML API ERROR ===");
            e.printStackTrace();

            // fallback tránh crash hệ thống
            return PredictResponseDTO.builder()
                    .p_forget(0.5f) //giả định xác suất quên là 50% nếu có lỗi
                    .build();
        }
    }
}
