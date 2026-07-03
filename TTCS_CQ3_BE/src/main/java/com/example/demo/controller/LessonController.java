package com.example.demo.controller;

import java.util.List;

import com.example.demo.dto.response.VocabularyResponseDTO;
import com.example.demo.service.VocabularyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.request.LessonRequestDTO;
import com.example.demo.dto.response.LessonResponseDTO;
import com.example.demo.service.LessonService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
public class LessonController {
    private final LessonService lessonService;
    private final VocabularyService vocabularyService;

    @PostMapping
    public ResponseEntity<LessonResponseDTO> createLesson(@RequestBody LessonRequestDTO request){

        return ResponseEntity.status(HttpStatus.CREATED).body(lessonService.createLesson(request));
    }

    @GetMapping
    public ResponseEntity<List<LessonResponseDTO>> getAllLessons(){

        return ResponseEntity.ok(lessonService.getAllLessons());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LessonResponseDTO> getLessonById(@PathVariable Long id){

        return ResponseEntity.ok(lessonService.getLessonById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LessonResponseDTO> updateLesson(@PathVariable Long id, @RequestBody LessonRequestDTO request){
        return ResponseEntity.ok(lessonService.updateLesson(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long id){

        lessonService.deleteLesson(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/vocabularies")
    public ResponseEntity<List<VocabularyResponseDTO>> getVocabsByLessonId(@PathVariable("id") Long lessonId) {

        return ResponseEntity.ok(vocabularyService.getVocabsByLessonId(lessonId));
    }
}
