package com.example.demo.repository;

import com.example.demo.entity.GameLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameLogRepository extends JpaRepository<GameLogEntity, Long> {

    void deleteBySession_User_UserId(Long userId);

    void deleteByVocab_Lesson_Topic_TopicId(Long topicId);

    void deleteByVocab_Lesson_LessonId(Long lessonId);

    void deleteByVocab_VocabId(Long vocabId);
}
