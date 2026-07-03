package com.example.demo.service;

import java.util.List;

import com.example.demo.dto.internal.FeatureDTO;

public interface FeatureService {
    List<FeatureDTO> getFeatures (Long userId);
}
