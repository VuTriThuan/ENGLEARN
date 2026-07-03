package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor

public class QuestionResponseDTO {

    private Long vocabId;
    private String word;
    private String meaning;
    private String pronunciation;
    private String wordType;
    private String audio;
    private String status;

    // Tao mang 4 dap an trac nghiem
    private List<String> options;

    private Integer correctIndex;
}
