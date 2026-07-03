package com.example.demo.service;

import com.example.demo.dto.request.GameFinishRequestDTO;
import com.example.demo.dto.request.GameInitRequestDTO;
import com.example.demo.dto.response.QuestionResponseDTO;

import java.util.List;

public interface GameService {

    List<QuestionResponseDTO> generateQuestions(String email, String gameType, GameInitRequestDTO request);

    void processGameResult(String email, String gameType, GameFinishRequestDTO request);
}
