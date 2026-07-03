package com.example.demo.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor

public class GameFinishRequestDTO {

    private String gameType;  // "QUIZ", "MATCH", "LISTEN"
    private Integer totalScore;
    private Integer timeSpent;

    private Integer extraData;

    // Danh sach tra loi dung/sai de kiem tra diem so
    private List<GameLogDTO> logs;

    @Data
    public static class GameLogDTO {
        private Long vocabId;
        private Boolean isCorrect;
        private Integer timeSpent;
        private Integer pointsEarned;
    }
}
