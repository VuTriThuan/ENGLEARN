package com.example.demo.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.request.TopicRequestDTO;
import com.example.demo.dto.response.TopicResponseDTO;
import com.example.demo.entity.TopicEntity;
import com.example.demo.repository.TopicRepository;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.VocabularyRepository;
import com.example.demo.repository.GameLogRepository;
import com.example.demo.repository.FavouriteVocabRepository;
import com.example.demo.repository.UserVocabProgressRepository;
import com.example.demo.repository.CollectionVocabRepository;
import com.example.demo.service.TopicService;
import com.example.demo.service.CloudinaryService;
import com.example.demo.exception.NotFoundException;

import lombok.RequiredArgsConstructor;
import java.io.IOException;

@Service
@RequiredArgsConstructor
@Transactional
public class TopicServiceImpl implements TopicService {
        private final TopicRepository topicRepository;
        private final LessonRepository lessonRepository;
        private final VocabularyRepository vocabularyRepository;
        private final GameLogRepository gameLogRepository;
        private final FavouriteVocabRepository favouriteVocabRepository;
        private final UserVocabProgressRepository userVocabProgressRepository;
        private final CollectionVocabRepository collectionVocabRepository;
        private final CloudinaryService cloudinaryService;

        @Override
        public TopicResponseDTO createTopic(TopicRequestDTO request) {
                TopicEntity topic = new TopicEntity();
                topic.setTopicName(request.getTopicName());
                topic.setImage(request.getImage());
                topic = topicRepository.save(topic);
                return TopicResponseDTO.builder()
                                .topicId(topic.getTopicId())
                                .topicName(topic.getTopicName())
                                .image(topic.getImage())
                                .totalVocabulary(0) // Khi tao topic thi totalVocabulary = 0
                                .build();
        }

        @Override
        public List<TopicResponseDTO> getAllTopics() {
                List<TopicEntity> topics = topicRepository.findAll();
                return topics.stream()
                        .map(topic -> TopicResponseDTO.builder() // mỗi TopicEntity -> TopicResponseDTO
                                        .topicId(topic.getTopicId())
                                        .topicName(topic.getTopicName())
                                        .image(topic.getImage())

                                        .totalVocabulary(vocabularyRepository
                                                        .countByLesson_Topic_TopicId(topic.getTopicId()))
                                        // Bo sung tinh tong so tu vung trong moi topic
                                        .build())
                        .collect(Collectors.toList()); // biến stream thành List<TopicResponseDTO>
        }

        @Override
        public TopicResponseDTO getTopicById(Long id) {
                TopicEntity topic = topicRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Không tìm thấy topic"));
                return TopicResponseDTO.builder()
                                .topicId(topic.getTopicId())
                                .topicName(topic.getTopicName())
                                .image(topic.getImage())

                                .totalVocabulary(vocabularyRepository.countByLesson_Topic_TopicId(topic.getTopicId()))
                                // Bo sung tinh tong so tu vung trong moi topic
                                .build();
        }

        @Override
        public TopicResponseDTO updateTopic(Long id, TopicRequestDTO request) {
                TopicEntity topic = topicRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Không tìm thấy topic"));
                topic.setTopicName(request.getTopicName());
                topic.setImage(request.getImage());
                topic = topicRepository.save(topic);
                return TopicResponseDTO.builder()
                                .topicName(topic.getTopicName())
                                .topicId(topic.getTopicId())
                                .image((topic.getImage()))

                                .totalVocabulary(vocabularyRepository.countByLesson_Topic_TopicId(topic.getTopicId()))
                                // Bo sung tinh tong so tu vung trong moi topic
                                .build();
        }

        @Override
        public void deleteTopic(Long id) {

                TopicEntity topic = topicRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Không tìm thấy topic"));

                // Xóa các bảng phụ thuộc vào vocabs trước
                userVocabProgressRepository.deleteByVocab_Lesson_Topic_TopicId(id);
                favouriteVocabRepository.deleteByVocab_Lesson_Topic_TopicId(id);
                collectionVocabRepository.deleteByVocab_Lesson_Topic_TopicId(id);
                gameLogRepository.deleteByVocab_Lesson_Topic_TopicId(id);

                // Xóa vocab và lesson trước khi xóa topic
                vocabularyRepository.deleteByLesson_Topic_TopicId(id);
                lessonRepository.deleteByTopic(topic);
                topicRepository.deleteById(id);
        }

        @Override
        public String uploadTopicImage(Long id, MultipartFile file) throws IOException {
                TopicEntity topic = topicRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Không tìm thấy topic"));

                String fileName = "topic_" + id + "_" + System.currentTimeMillis();
                String imageUrl = cloudinaryService.uploadImage(file, fileName);

                topic.setImage(imageUrl);
                topicRepository.save(topic);

                return imageUrl;
        }
}
