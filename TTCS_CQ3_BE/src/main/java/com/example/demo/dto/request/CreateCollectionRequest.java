package com.example.demo.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCollectionRequest {

    @NotBlank(message = "Tên collection không được để trống")
    @JsonAlias("name")
    private String collectionName;

    public String getName() {
        return collectionName;
    }
}
