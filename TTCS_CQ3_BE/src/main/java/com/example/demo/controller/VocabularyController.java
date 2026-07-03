package com.example.demo.controller;

import com.example.demo.security.CustomUserDetails;
import java.util.List;
import java.util.Map;

import com.example.demo.service.CsvImportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.example.demo.dto.request.VocabularyRequestDTO;
import com.example.demo.dto.response.VocabularyResponseDTO;
import com.example.demo.service.VocabularyService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/vocabularies")
@RequiredArgsConstructor
public class VocabularyController {
    private final VocabularyService vocabularyService;
    private final CsvImportService csvImportService;

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importUserVocab(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "collectionId", required = false) Long collectionId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userId = userDetails.getUser().getUserId();

            java.util.Map<String, Object> result = csvImportService.importForUser(file, collectionId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<VocabularyResponseDTO> createVocab(@RequestBody VocabularyRequestDTO request) {

        return ResponseEntity.status(HttpStatus.CREATED).body(vocabularyService.createVocab(request));
    }

    @GetMapping("/user")
    public ResponseEntity<List<VocabularyResponseDTO>> getUserVocabularies() {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (authentication != null
                && authentication.getPrincipal() instanceof com.example.demo.security.CustomUserDetails) {
            Long userId = ((com.example.demo.security.CustomUserDetails) authentication.getPrincipal()).getUser()
                    .getUserId();
            return ResponseEntity.ok(vocabularyService.getVocabsByCreatedBy(userId));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<VocabularyResponseDTO> getVocabById(@PathVariable Long id) {

        return ResponseEntity.ok(vocabularyService.getVocabById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VocabularyResponseDTO> updateVocab(@PathVariable Long id,
            @RequestBody VocabularyRequestDTO request) {

        return ResponseEntity.ok(vocabularyService.updateVocab(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVocab(@PathVariable Long id) {

        vocabularyService.deleteVocab(id);
        return ResponseEntity.noContent().build();
    }

}
