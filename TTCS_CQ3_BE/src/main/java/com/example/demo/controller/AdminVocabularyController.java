package com.example.demo.controller;

import com.example.demo.service.CsvImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.example.demo.security.CustomUserDetails;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/vocabularies")
@RequiredArgsConstructor
public class AdminVocabularyController {

    private final CsvImportService csvImportService;

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importAdminVocab(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "topicId", required = false) Long topicId,
            @RequestParam(value = "lessonId", required = false) Long lessonId,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        try {
            Long adminId = customUserDetails.getUser().getUserId();
            Map<String, Object> result = csvImportService.importForAdmin(file, topicId, lessonId, adminId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
