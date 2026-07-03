package com.example.demo.service;

import com.example.demo.dto.request.*;
import com.example.demo.dto.response.UserResponseDTO;
import com.example.demo.dto.response.VocabularyResponseDTO;

import java.util.List;

public interface UserService {

    //Phần này là các chức năng User được quyền
    UserResponseDTO register(UserRegisterDTO request);
    UserResponseDTO login(UserLoginDTO request);
    void changePassword(String email, ChangePasswordDTO request);
    UserResponseDTO update(String email, UserUpdateDTO request);
    String uploadAvatar(String email, org.springframework.web.multipart.MultipartFile file) throws java.io.IOException;

    //Phần này là các chức năng Admin được quyền
    List<UserResponseDTO> getAllUsers();
    UserResponseDTO getUserById(Long id);
    void deleteUser(Long id);

    //Cập nhật tiến trình học
    void updateVocabProgress(String email, VocabProgressRequestDTO request);

    //Lấy danh sách flashcard mang ra ôn tập
    List<VocabularyResponseDTO> getVocabsForReview(String email);
}
