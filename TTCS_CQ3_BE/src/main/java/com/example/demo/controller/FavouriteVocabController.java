package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.demo.dto.response.FavouriteVocabResponse;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.FavouriteVocabService;

import lombok.RequiredArgsConstructor;
import java.util.List;

@RestController
@RequestMapping("/api/favourites")
@RequiredArgsConstructor

public class FavouriteVocabController {

    private final FavouriteVocabService favouriteVocabService;

    @GetMapping
    public ResponseEntity<List<FavouriteVocabResponse>> getFavourites(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getUser().getUserId();
        return ResponseEntity.ok(favouriteVocabService.getFavourites(userId));
    }

    @PostMapping("/{vocabId}")
    public ResponseEntity<String> addFavourite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long vocabId) {

        Long userId = userDetails.getUser().getUserId();
        favouriteVocabService.addFavourite(userId, vocabId);
        return ResponseEntity.status(HttpStatus.CREATED).body("Đã thêm vào danh sách yêu thích");
    }

    @DeleteMapping("/{vocabId}")
    public ResponseEntity<String> removeFavourite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long vocabId) {

        Long userId = userDetails.getUser().getUserId();
        favouriteVocabService.removeFavourite(userId, vocabId);
        return ResponseEntity.ok("Đã xóa khỏi danh sách yêu thích");
    }

    @GetMapping("/{vocabId}/check")
    public ResponseEntity<Boolean> isFavourite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long vocabId) {
        Long userId = userDetails.getUser().getUserId();
        return ResponseEntity.ok(favouriteVocabService.isFavourite(userId, vocabId));
    }

}
