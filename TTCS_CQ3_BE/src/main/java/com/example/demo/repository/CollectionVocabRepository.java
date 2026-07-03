package com.example.demo.repository;

import com.example.demo.entity.CollectionEntity;
import com.example.demo.entity.CollectionVocabEntity;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface CollectionVocabRepository extends JpaRepository<CollectionVocabEntity, Long> {

        List<CollectionVocabEntity> findByCollection(CollectionEntity collection);

        int countByCollection(CollectionEntity collection);

        boolean existsByCollection_CollectionIdAndVocab_VocabId(Long collectionId, Long vocabId);

        @Query("""
                        SELECT CASE WHEN COUNT(cv) > 0 THEN true ELSE false END
                        FROM CollectionVocabEntity cv
                        WHERE cv.collection.collectionId = :collectionId
                        AND LOWER(cv.vocab.word) = LOWER(:word)
                        """)
        boolean existsByCollectionIdAndWordIgnoreCase(@Param("collectionId") Long collectionId,
                        @Param("word") String word);

        void deleteByVocab_Lesson_Topic_TopicId(Long topicId);

        Optional<CollectionVocabEntity> findByCollection_CollectionIdAndVocab_VocabId(Long collectionId, long vocabId);

        void deleteByVocab_Lesson_LessonId(Long lessonId);

        void deleteByVocab_VocabId(Long vocabId);

        void deleteByCollection_User_UserId(Long userId);

        List<CollectionVocabEntity> findByCollection_CollectionId(Long collectionId);
}
