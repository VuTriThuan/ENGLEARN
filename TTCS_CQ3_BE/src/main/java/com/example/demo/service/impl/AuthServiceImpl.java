package com.example.demo.service.impl;

import com.example.demo.dto.request.UserLoginDTO;
import com.example.demo.dto.request.UserRegisterDTO;
import com.example.demo.dto.response.AuthResponse;
import com.example.demo.entity.CollectionEntity;
import com.example.demo.entity.UserEntity;
import com.example.demo.entity.UserStreakEntity;
import com.example.demo.enums.Role;
import com.example.demo.repository.CollectionRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserStreakRepository;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.AuthService;
import com.example.demo.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserStreakRepository userStreakRepository;
    private final CollectionRepository collectionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Override
    @Transactional
    public AuthResponse register(UserRegisterDTO request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new IllegalArgumentException("Email đã được sử dụng");

        String username = request.getEmail().split("@")[0];

        UserEntity user = UserEntity.builder()
                .username(username)
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .dateOfBirth(request.getDateOfBirth())
                .role(Role.USER)
                .build();
        userRepository.save(user);

        UserEntity savedUser = userRepository.save(user);
        UserStreakEntity streak = UserStreakEntity.builder()
                .user(savedUser)
                .currentStreak(0)
                .longestStreak(0)
                .build();
        userStreakRepository.save(streak);

        // Tự động tạo collection mặc định "Từ vựng của tôi" cho mỗi user mới
        CollectionEntity defaultCollection = CollectionEntity.builder()
                .user(savedUser)
                .collectionName("Từ vựng của tôi")
                .build();
        collectionRepository.save(defaultCollection);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        return buildAuthResponse(userDetails, user);
    }

    @Override
    public AuthResponse login(UserLoginDTO request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return buildAuthResponse(userDetails, userDetails.getUser());
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        String email = jwtUtil.extractUsername(refreshToken);
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User không tồn tại"));
        CustomUserDetails userDetails = new CustomUserDetails(user);
        if (!jwtUtil.isTokenValid(refreshToken, userDetails))
            throw new IllegalArgumentException("Refresh token không hợp lệ");
        return buildAuthResponse(userDetails, user);
       
    }

    private AuthResponse buildAuthResponse(CustomUserDetails userDetails, UserEntity user) {
        return AuthResponse.builder()
                .accessToken(jwtUtil.generateToken(userDetails))
                .refreshToken(jwtUtil.generateRefreshToken(userDetails))
                .tokenType("Bearer")
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}