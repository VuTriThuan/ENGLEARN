package com.example.demo.controller;

import com.example.demo.dto.response.LearnedVocabStatsResponseDTO;
import com.example.demo.dto.response.VocabStatusSummaryDTO;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.UserVocabProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final UserVocabProgressService progressService;

    @PostMapping("/update")
    public String updateProgress(
            @RequestParam Long userId,
            @RequestParam Long vocabId,
            @RequestParam boolean isCorrect
    ) {
        progressService.updateProgress(userId, vocabId, isCorrect);
        return "Update thành công!";
    }

    @GetMapping("/learned-statistics")
    public ResponseEntity<LearnedVocabStatsResponseDTO> getLearnedVocabStats(@RequestParam Long userId) {
        return ResponseEntity.ok(progressService.getLearnedVocabStats(userId));
    }

    @GetMapping("/summary/collection/{collectionId}")
    public ResponseEntity<VocabStatusSummaryDTO> getCollectionSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long collectionId) {
        Long userId = userDetails.getUser().getUserId();
        return ResponseEntity.ok(progressService.getStatusSummaryForCollection(userId, collectionId));
    }

    @GetMapping("/summary/lesson/{lessonId}")
    public ResponseEntity<VocabStatusSummaryDTO> getLessonSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long lessonId) {
        Long userId = userDetails.getUser().getUserId();
        return ResponseEntity.ok(progressService.getStatusSummaryForLesson(userId, lessonId));
    }
}
