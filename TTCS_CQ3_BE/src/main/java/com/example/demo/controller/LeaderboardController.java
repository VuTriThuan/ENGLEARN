package com.example.demo.controller;

import com.example.demo.dto.response.LeaderboardResponseDTO;
import com.example.demo.entity.UserEntity;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<LeaderboardResponseDTO> getLeaderboard(
            @RequestParam(defaultValue = "score")  String sortBy,
            @RequestParam(defaultValue = "all")    String timeFilter,
            @RequestParam(defaultValue = "100")    int limit,
            Authentication authentication  // Spring inject null tự động nếu chưa đăng nhập
    ) {
        if (limit <= 0 || limit > 200) {
            limit = 100;
        }

        if (!sortBy.equalsIgnoreCase("score") && !sortBy.equalsIgnoreCase("streak")) {
            sortBy = "score";
        }

        if (!timeFilter.matches("day|week|month|year|all")) {
            timeFilter = "all";
        }

        Long currentUserId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            Optional<UserEntity> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                currentUserId = userOpt.get().getUserId();
            }
        }

        LeaderboardResponseDTO response = leaderboardService.getLeaderboard(sortBy, timeFilter, limit, currentUserId);
        return ResponseEntity.ok(response);
    }
}
