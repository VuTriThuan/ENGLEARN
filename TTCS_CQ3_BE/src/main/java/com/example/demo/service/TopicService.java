package com.example.demo.service;

import java.util.List;
import java.io.IOException;

import org.springframework.web.multipart.MultipartFile;
import com.example.demo.dto.request.TopicRequestDTO;
import com.example.demo.dto.response.TopicResponseDTO;

public interface TopicService {
    TopicResponseDTO createTopic(TopicRequestDTO request);
    List<TopicResponseDTO> getAllTopics();
    TopicResponseDTO getTopicById(Long id);
    TopicResponseDTO updateTopic(Long id, TopicRequestDTO request);
    void deleteTopic(Long id);
    String uploadTopicImage(Long id, MultipartFile file) throws IOException;
}
