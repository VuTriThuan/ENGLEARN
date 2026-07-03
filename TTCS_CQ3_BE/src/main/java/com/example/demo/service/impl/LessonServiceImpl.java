package com.example.demo.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.request.LessonRequestDTO;
import com.example.demo.dto.response.LessonResponseDTO;
import com.example.demo.entity.LessonEntity;
import com.example.demo.entity.TopicEntity;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.TopicRepository;
import com.example.demo.repository.VocabularyRepository;
import com.example.demo.repository.UserVocabProgressRepository;
import com.example.demo.repository.FavouriteVocabRepository;
import com.example.demo.repository.GameLogRepository;
import com.example.demo.repository.CollectionVocabRepository;
import com.example.demo.service.LessonService;
import com.example.demo.exception.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class LessonServiceImpl implements LessonService {
        private final LessonRepository lessonRepository;
        private final TopicRepository topicRepository;
        private final VocabularyRepository vocabularyRepository;
        private final UserVocabProgressRepository userVocabProgressRepository;
        private final FavouriteVocabRepository favouriteVocabRepository;
        private final GameLogRepository gameLogRepository;
        private final CollectionVocabRepository collectionVocabRepository;

        @Override
        public LessonResponseDTO createLesson(LessonRequestDTO request) {
                TopicEntity topic = topicRepository.findById(request.getTopicId())
                                .orElseThrow(() -> new NotFoundException("Không tìm thấy topic"));

                LessonEntity lesson = new LessonEntity();
                lesson.setLessonName(request.getLessonName());
                lesson.setDifficulty(request.getDifficulty());
                lesson.setTopic(topic);

                lesson = lessonRepository.save(lesson);

                return LessonResponseDTO.builder()
                                .lessonId(lesson.getLessonId())
                                .lessonName(lesson.getLessonName())
                                .difficulty(lesson.getDifficulty())
                                .topicId(lesson.getTopic().getTopicId())
                                .topicName(lesson.getTopic().getTopicName())
                                .topicImage(lesson.getTopic().getImage())
                                .build();
        }

        @Override
        public List<LessonResponseDTO> getAllLessons() {
                List<LessonEntity> lessons = lessonRepository.findAll();
                return lessons.stream()
                                .map(lesson -> LessonResponseDTO.builder()
                                                .lessonId(lesson.getLessonId())
                                                .lessonName(lesson.getLessonName())
                                                .difficulty(lesson.getDifficulty())
                                                .topicId(lesson.getTopic().getTopicId())
                                                .topicName(lesson.getTopic().getTopicName())
                                                .topicImage(lesson.getTopic().getImage())
                                                .build())
                                .collect(Collectors.toList());
        }

        @Override
        public LessonResponseDTO getLessonById(Long id) {
                LessonEntity lesson = lessonRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Không tìm thấy lesson"));
                return LessonResponseDTO.builder()
                                .lessonId(lesson.getLessonId())
                                .lessonName(lesson.getLessonName())
                                .difficulty(lesson.getDifficulty())
                                .topicId(lesson.getTopic().getTopicId())
                                .topicName(lesson.getTopic().getTopicName())
                                .topicImage(lesson.getTopic().getImage())
                                .build();
        }

        @Override
        public LessonResponseDTO updateLesson(Long id, LessonRequestDTO request) {
                LessonEntity lesson = lessonRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Không tìm thấy lesson"));
                TopicEntity topic = topicRepository.findById(request.getTopicId())
                                .orElseThrow(() -> new NotFoundException("Không tìm thấy topic"));

                lesson.setLessonName(request.getLessonName());
                lesson.setDifficulty(request.getDifficulty());
                lesson.setTopic(topic);

                lesson = lessonRepository.save(lesson);

                return LessonResponseDTO.builder()
                                .lessonId(lesson.getLessonId())
                                .lessonName(lesson.getLessonName())
                                .difficulty(lesson.getDifficulty())
                                .topicId(lesson.getTopic().getTopicId())
                                .topicName(lesson.getTopic().getTopicName())
                                .topicImage(lesson.getTopic().getImage())
                                .build();
        }

        @Override
        public void deleteLesson(Long id) {
                LessonEntity lesson = lessonRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Không tìm thấy lesson"));

                // Xóa các bảng có liên kết foreign key tới lesson
                userVocabProgressRepository.deleteByVocab_Lesson_LessonId(id);
                favouriteVocabRepository.deleteByVocab_Lesson_LessonId(id);
                gameLogRepository.deleteByVocab_Lesson_LessonId(id);
                collectionVocabRepository.deleteByVocab_Lesson_LessonId(id);

                vocabularyRepository.deleteByLesson(lesson);

                lessonRepository.deleteById(id);
        }

        @Override
        public List<LessonResponseDTO> getLessonsByTopicId(Long topicId) {
                List<LessonEntity> lessons = lessonRepository.findByTopic_TopicId(topicId);
                return lessons.stream()
                                .map(lesson -> LessonResponseDTO.builder()
                                                .lessonId(lesson.getLessonId())
                                                .lessonName(lesson.getLessonName())
                                                .difficulty(lesson.getDifficulty())
                                                .topicId(lesson.getTopic().getTopicId())
                                                .topicName(lesson.getTopic().getTopicName())
                                                .topicImage(lesson.getTopic().getImage())
                                                .build())
                                .collect(Collectors.toList());
        }
}
