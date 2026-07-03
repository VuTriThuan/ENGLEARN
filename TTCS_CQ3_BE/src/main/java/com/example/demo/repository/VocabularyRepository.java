package com.example.demo.repository;

import com.example.demo.entity.LessonEntity;
import com.example.demo.entity.VocabularyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyRepository extends JpaRepository<VocabularyEntity, Long> {

    Optional<VocabularyEntity> findByWordAndLesson(String word, LessonEntity lesson);

    List<VocabularyEntity> findByLesson_LessonId(Long lessonId);

    List<VocabularyEntity> findByLesson_Topic_TopicId(long topicId);

    List<VocabularyEntity> findByCreatedBy(Long createdBy);

    int countByLesson_Topic_TopicId(Long topicId);

    void deleteByLesson(LessonEntity lesson);

    void deleteByLesson_Topic_TopicId(Long topicId);

    Optional<VocabularyEntity> findByWord(String word); // Kiem tra tu trung lap khi them bang csv

    Optional<VocabularyEntity> findByWordAndCreatedBy(String word, Long createdBy); // Kiem tra tu trung lap theo user
}
