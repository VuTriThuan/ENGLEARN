package com.example.demo.service;

import com.example.demo.dto.request.UserLoginDTO;
import com.example.demo.dto.request.UserRegisterDTO;
import com.example.demo.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(UserRegisterDTO request);
    AuthResponse login(UserLoginDTO request);
    AuthResponse refreshToken(String refreshToken);
}