package com.example.demo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.example.demo.dto.response.VocabularyResponseDTO;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.ReviewService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/smart")
    public List<VocabularyResponseDTO> getSmartReview(@RequestParam Long userId, @RequestParam(defaultValue = "20") int limit) {
        return reviewService.getSmartReview(userId, limit);
    }

    @PatchMapping("/{vocabId}/p-forget/reset")
    public ResponseEntity<String> resetPForget(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long vocabId) {
        Long userId = userDetails.getUser().getUserId();
        reviewService.resetPForget(userId, vocabId);
        return ResponseEntity.ok("Đã cập nhật xác suất quên về 0");
    }
}
