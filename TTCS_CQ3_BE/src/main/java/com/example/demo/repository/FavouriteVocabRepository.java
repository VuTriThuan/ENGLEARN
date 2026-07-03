package com.example.demo.repository;

import com.example.demo.entity.FavouriteVocabEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavouriteVocabRepository extends JpaRepository<FavouriteVocabEntity, Long> {

    List<FavouriteVocabEntity> findByUser_UserId(Long userId);

    Optional<FavouriteVocabEntity> findByUser_UserIdAndVocab_VocabId(Long userId, Long vocabId);

    boolean existsByUser_UserIdAndVocab_VocabId(Long userId, Long vocabId);

    void deleteByVocab_Lesson_Topic_TopicId(Long topicId);

    void deleteByVocab_Lesson_LessonId(Long lessonId);

    void deleteByVocab_VocabId(Long vocabId);

    void deleteByUser_UserId(Long userId);

}
