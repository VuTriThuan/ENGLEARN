package com.example.demo.repository;

import com.example.demo.entity.LessonEntity;
import com.example.demo.entity.TopicEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<LessonEntity, Long> {

    Optional<LessonEntity> findByLessonNameAndTopic(String lessonName, TopicEntity topic);

    void deleteByTopic(TopicEntity topic);

    List<LessonEntity> findByTopic_TopicId(Long topicId);
}
