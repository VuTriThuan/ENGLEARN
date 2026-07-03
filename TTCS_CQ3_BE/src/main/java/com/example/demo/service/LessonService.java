package com.example.demo.service;

import java.util.List;

import com.example.demo.dto.request.LessonRequestDTO;
import com.example.demo.dto.response.LessonResponseDTO;

public interface LessonService {
    LessonResponseDTO createLesson(LessonRequestDTO request);

    List<LessonResponseDTO> getAllLessons();

    LessonResponseDTO getLessonById(Long id);

    LessonResponseDTO updateLesson(Long id, LessonRequestDTO request);

    void deleteLesson(Long id);

    List<LessonResponseDTO> getLessonsByTopicId(Long topicId);
}
