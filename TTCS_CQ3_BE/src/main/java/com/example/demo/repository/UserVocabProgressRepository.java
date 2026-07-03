package com.example.demo.repository;

import com.example.demo.entity.UserEntity;
import com.example.demo.entity.UserVocabProgressEntity;
import com.example.demo.entity.VocabularyEntity;
import com.example.demo.enums.VocabStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserVocabProgressRepository extends JpaRepository<UserVocabProgressEntity, Long> {

    // Tìm tiến trình cũ của 1 user cụ thể trên 1 từ vựng cụ thể
    Optional<UserVocabProgressEntity> findByUser_EmailAndVocab_VocabId(String email, Long vocabId);

    // Lấy từ theo trạng thái cụ thể user, ưu tiên thẻ chưa học xếp lên trên
    List<UserVocabProgressEntity> findByUser_EmailAndStatusInOrderByLastLearnAsc(String email,
            List<VocabStatus> status);

    UserVocabProgressEntity findTopByUserAndVocabOrderByCreatedAtDesc(UserEntity user, VocabularyEntity vocab);

    void deleteByVocab_Lesson_Topic_TopicId(Long topicId);

    // lấy vocab dự đoán xác suất quên từ vựng
    @Query("""
            SELECT p FROM UserVocabProgressEntity p
            WHERE p.user = :user
            AND p.createdAt = (
                SELECT MAX(p2.createdAt)
                FROM UserVocabProgressEntity p2
                WHERE p2.user = :user
                AND p2.vocab = p.vocab
            )
            """)
    List<UserVocabProgressEntity> findLatestByUser(@Param("user") UserEntity user);

    void deleteByVocab_Lesson_LessonId(Long lessonId);

    void deleteByVocab_VocabId(Long vocabId);

    void deleteByUser_UserId(Long userId);

    @Query("""
            SELECT p.vocab.vocabId, p.status, p.pForget, p.correctCount, p.incorrectCount
            FROM UserVocabProgressEntity p
            WHERE p.user = :user
            AND p.vocab.vocabId IN (
                SELECT cv.vocab.vocabId FROM CollectionVocabEntity cv
                WHERE cv.collection.collectionId = :collectionId
            )
            AND p.createdAt = (
                SELECT MAX(p2.createdAt) FROM UserVocabProgressEntity p2
                WHERE p2.user = :user AND p2.vocab = p.vocab
            )
            """)
    List<Object[]> findLatestProgressInCollection(
            @Param("user") UserEntity user,
            @Param("collectionId") Long collectionId);

    @Query("SELECT COUNT(cv) FROM CollectionVocabEntity cv WHERE cv.collection.collectionId = :collectionId")
    long countVocabsInCollection(@Param("collectionId") Long collectionId);

    @Query("""
            SELECT p.vocab.vocabId, p.status, p.pForget, p.correctCount, p.incorrectCount
            FROM UserVocabProgressEntity p
            WHERE p.user = :user
            AND p.vocab.lesson.lessonId = :lessonId
            AND p.createdAt = (
                SELECT MAX(p2.createdAt) FROM UserVocabProgressEntity p2
                WHERE p2.user = :user AND p2.vocab = p.vocab
            )
            """)
    List<Object[]> findLatestProgressInLesson(
            @Param("user") UserEntity user,
            @Param("lessonId") Long lessonId);

    @Query("SELECT COUNT(v) FROM VocabularyEntity v WHERE v.lesson.lessonId = :lessonId")
    long countVocabsInLesson(@Param("lessonId") Long lessonId);

    @Query("""
            SELECT p.vocab.vocabId, p.status, p.pForget, p.correctCount, p.incorrectCount
            FROM UserVocabProgressEntity p
            WHERE p.user = :user
            AND p.vocab.vocabId IN :vocabIds
            AND p.createdAt = (
                SELECT MAX(p2.createdAt) FROM UserVocabProgressEntity p2
                WHERE p2.user = :user AND p2.vocab = p.vocab
            )
            """)
    List<Object[]> findLatestProgressForVocabIds(
            @Param("user") UserEntity user,
            @Param("vocabIds") List<Long> vocabIds);

    Optional<UserVocabProgressEntity> findFirstByUser_EmailAndVocab_VocabIdOrderByCreatedAtDesc(String email, Long vocabId);

    Optional<UserVocabProgressEntity> findFirstByUser_UserIdAndVocab_VocabIdOrderByCreatedAtDesc(Long userId, Long vocabId);

    void deleteByUser_UserIdAndVocab_VocabId(Long userId, Long vocabId);
}
