package com.example.demo.service;

import com.example.demo.dto.response.LeaderboardResponseDTO;

public interface LeaderboardService {

    LeaderboardResponseDTO getLeaderboard(String sortBy, String timeFilter, int limit, Long userId);
}
