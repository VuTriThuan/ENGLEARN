package com.example.demo.config;

import com.example.demo.entity.UserEntity;
import com.example.demo.entity.UserStreakEntity;
import com.example.demo.enums.Role;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserStreakRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final UserStreakRepository userStreakRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (!userRepository.existsByUsername("superadmin")) {
            UserEntity admin = UserEntity.builder()
                    .username("superadmin")
                    .email("superadmin@gmail.com")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Administrator")
                    .dateOfBirth(LocalDate.of(2000, 1, 1))
                    .role(Role.ADMIN)
                    .build();

            UserEntity savedAdmin = userRepository.save(admin);
            
            UserStreakEntity streak = UserStreakEntity.builder()
                    .user(savedAdmin)
                    .currentStreak(0)
                    .longestStreak(0)
                    .build();
            userStreakRepository.save(streak);
            
            System.out.println("========== TÀI KHOẢN ADMIN ĐÃ ĐƯỢC TẠO ==========");
            System.out.println("Email: superadmin@gmail.com");
            System.out.println("Mật khẩu: admin123");
            System.out.println("=================================================");
        } else {
            System.out.println("========== TÀI KHOẢN ADMIN ĐÃ TỒN TẠI ==========");
            System.out.println("Vui lòng đăng nhập với tài khoản superadmin@gmail.com");
            System.out.println("=================================================");
        }
    }
}
