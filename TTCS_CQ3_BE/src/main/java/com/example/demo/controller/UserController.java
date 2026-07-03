package com.example.demo.controller;

import com.example.demo.dto.request.*;
import com.example.demo.dto.response.UserResponseDTO;
import com.example.demo.dto.response.VocabularyResponseDTO;
import com.example.demo.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/me/change-password") //User tu doi mat khau
    public ResponseEntity<String> changePassword(Authentication authentication, @Valid @RequestBody ChangePasswordDTO request) {

        String email = authentication.getName();
        userService.changePassword(email, request);
        return ResponseEntity.ok("Đổi mật khẩu thành công");
    }

    @PutMapping("/me/update-profile")
    public ResponseEntity<UserResponseDTO> update(Authentication authentication, @Valid @RequestBody UserUpdateDTO request) {

        String email = authentication.getName();
        return ResponseEntity.ok(userService.update(email, request));
    }

    @PostMapping("/me/avatar")
    public ResponseEntity<String> uploadAvatar(Authentication authentication, @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            String email = authentication.getName();
            String avatarUrl = userService.uploadAvatar(email, file);
            return ResponseEntity.ok(avatarUrl);
        } catch (java.io.IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi khi tải ảnh lên");
        }
    }

    @PostMapping("/me/vocab-progress")
    public ResponseEntity<String> updateVocabProgress(Authentication authentication, @Valid @RequestBody VocabProgressRequestDTO request) {
        String email = authentication.getName();
        userService.updateVocabProgress(email, request);
        return ResponseEntity.ok("Đã lưu tiến trình học thành công");
    }

    @GetMapping("/me/vocab-review")
    public ResponseEntity<List<VocabularyResponseDTO>> getVocabsForReview(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getVocabsForReview(email));
    }
}
