package com.example.demo.controller;

import com.example.demo.dto.request.GameFinishRequestDTO;
import com.example.demo.dto.request.GameInitRequestDTO;
import com.example.demo.dto.response.QuestionResponseDTO;
import com.example.demo.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor

public class GameController {

    private final GameService gameService;

    @PostMapping("/{gameType}/init")
    public ResponseEntity<List<QuestionResponseDTO>> initGame(@PathVariable String gameType,  // "quiz", "match", "listen"
                                                              @RequestBody GameInitRequestDTO request,
                                                              Authentication authentication) {

        String email = authentication.getName();
        List<QuestionResponseDTO> questions = gameService.generateQuestions(email, gameType, request);
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/{gameType}/finish")
    public ResponseEntity<String> finishGame(@PathVariable String gameType,
                                             @RequestBody GameFinishRequestDTO request,
                                             Authentication authentication) {

        String email = authentication.getName();

        // Backend luu lai Session, Log va Update trang thai vocab (New -> Learning)
        gameService.processGameResult(email, gameType, request);
        return ResponseEntity.ok("Đã lưu kết quả thành công!");
    }
}