package com.example.demo.controller;

import java.util.List;
import java.io.IOException;

import com.example.demo.dto.response.VocabularyResponseDTO;
import com.example.demo.service.VocabularyService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.request.TopicRequestDTO;
import com.example.demo.dto.response.TopicResponseDTO;
import com.example.demo.service.TopicService;
import com.example.demo.service.LessonService;
import com.example.demo.dto.response.LessonResponseDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;
    private final VocabularyService vocabularyService;
    private final LessonService lessonService;

    @PostMapping
    public ResponseEntity<TopicResponseDTO> createTopic(@Valid @RequestBody TopicRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(topicService.createTopic(request));
    }

    @GetMapping
    public ResponseEntity<List<TopicResponseDTO>> getAllTopics() {

        return ResponseEntity.ok(topicService.getAllTopics());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TopicResponseDTO> getTopicById(@PathVariable Long id) {

        return ResponseEntity.ok(topicService.getTopicById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TopicResponseDTO> updateTopic(@PathVariable Long id, @RequestBody TopicRequestDTO request) {

        return ResponseEntity.ok(topicService.updateTopic(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTopic(@PathVariable Long id) {

        topicService.deleteTopic(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadTopicImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = topicService.uploadTopicImage(id, file);
            return ResponseEntity.ok(imageUrl);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi khi tải ảnh lên");
        }
    }

    @GetMapping("/{id}/vocabularies")
    public ResponseEntity<List<VocabularyResponseDTO>> getVocabsByTopicId(@PathVariable("id") String topicId) {
        Long parsedTopicId = parseTopicId(topicId);
        return ResponseEntity.ok(vocabularyService.getVocabsByTopicId(parsedTopicId));
    }

    @GetMapping("/{id}/lessons")
    public ResponseEntity<List<LessonResponseDTO>> getLessonsByTopicId(@PathVariable("id") String topicId) {
        Long parsedTopicId = parseTopicId(topicId);
        return ResponseEntity.ok(lessonService.getLessonsByTopicId(parsedTopicId));
    }

    private Long parseTopicId(String topicId) {
        if (topicId == null || topicId.isBlank() || "undefined".equalsIgnoreCase(topicId)) {
            throw new IllegalArgumentException("Topic ID không hợp lệ");
        }

        try {
            Long parsedTopicId = Long.valueOf(topicId);
            if (parsedTopicId <= 0) {
                throw new IllegalArgumentException("Topic ID không hợp lệ");
            }
            return parsedTopicId;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Topic ID không hợp lệ");
        }
    }
}
