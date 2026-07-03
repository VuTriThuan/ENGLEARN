package com.example.demo.repository;

import com.example.demo.entity.CollectionEntity;
import com.example.demo.entity.UserEntity;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollectionRepository extends JpaRepository<CollectionEntity, Long> {
    List<CollectionEntity> findByUser(UserEntity user);
    List<CollectionEntity> findByUser_UserId(Long userId);
    Optional<CollectionEntity> findByCollectionIdAndUser_UserId(Long collectionId, Long userId);
    Optional<CollectionEntity> findByUser_UserIdAndCollectionName(Long userId, String collectionName);
    void deleteByUser_UserId(Long userId);
}
