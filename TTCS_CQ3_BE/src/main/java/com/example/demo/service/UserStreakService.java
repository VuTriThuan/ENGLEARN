package com.example.demo.service;

import com.example.demo.entity.UserEntity;
import com.example.demo.entity.UserStreakEntity;

public interface UserStreakService {

    UserStreakEntity refreshCurrentStreak(UserEntity user);

}