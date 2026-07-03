package com.example.demo.controller;

import com.example.demo.dto.request.CreateCollectionRequest;
import com.example.demo.dto.request.UpdateCollectionRequest;
import com.example.demo.dto.response.CollectionResponseDTO;
import com.example.demo.dto.response.CollectionVocabResponse;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.CollectionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    @GetMapping
    public ResponseEntity<List<CollectionResponseDTO>> getCollections(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getUser().getUserId();
        return ResponseEntity.ok(collectionService.getUserCollections(userId));
    }

    @PostMapping
    public ResponseEntity<CollectionResponseDTO> createCollection(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateCollectionRequest request) {

        Long userId = userDetails.getUser().getUserId();
        CollectionResponseDTO collection = collectionService.createCollection(userId, request.getName());

        return ResponseEntity.status(HttpStatus.CREATED).body(collection);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCollection(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {

        Long userId = userDetails.getUser().getUserId();
        collectionService.deleteCollection(userId, id);
        return ResponseEntity.noContent().build(); // 204
    }

    @GetMapping("/{id}/vocabs")
    public ResponseEntity<List<CollectionVocabResponse>> getVocabs(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {

        Long userId = userDetails.getUser().getUserId();
        List<CollectionVocabResponse> vocabs = collectionService.getVocabsInCollection(userId, id);

        return ResponseEntity.ok(vocabs);
    }

    @PostMapping("/{id}/vocabs/{vocabId}")
    public ResponseEntity<Void> addVocab(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @PathVariable Long vocabId) {

        Long userId = userDetails.getUser().getUserId();
        collectionService.addVocabToCollection(userId, id, vocabId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<CollectionResponseDTO> updateCollection(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCollectionRequest request) {

        Long userId = userDetails.getUser().getUserId();
        CollectionResponseDTO updatedCollection = collectionService.updateCollectionName(userId, id, request.getName());
        return ResponseEntity.ok(updatedCollection);
    }

    @DeleteMapping("/{id}/vocabs/{vocabId}")
    public ResponseEntity<Void> removeVocab(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @PathVariable Long vocabId) {

        Long userId = userDetails.getUser().getUserId();
        collectionService.removeVocabFromCollection(userId, id, vocabId);
        return ResponseEntity.noContent().build();
    }

}
