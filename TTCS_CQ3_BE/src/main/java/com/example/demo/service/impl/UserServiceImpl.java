package com.example.demo.service.impl;

import com.example.demo.dto.request.*;
import com.example.demo.dto.response.UserResponseDTO;
import com.example.demo.dto.response.VocabularyResponseDTO;
import com.example.demo.entity.UserEntity;
import com.example.demo.entity.UserVocabProgressEntity;
import com.example.demo.entity.VocabularyEntity;
import com.example.demo.enums.Role;
import com.example.demo.enums.VocabStatus;
import com.example.demo.repository.UserRepository;
import com.example.demo.entity.UserStreakEntity;
import com.example.demo.repository.GameSessionRepository;
import com.example.demo.repository.CollectionVocabRepository;
import com.example.demo.repository.FavouriteVocabRepository;
import com.example.demo.repository.GameLogRepository;
import com.example.demo.repository.UserStreakRepository;
import com.example.demo.repository.UserVocabProgressRepository;
import com.example.demo.repository.VocabularyRepository;
import com.example.demo.entity.CollectionEntity;
import com.example.demo.repository.CollectionRepository;
import com.example.demo.service.UserService;
import com.example.demo.service.CloudinaryService;
import com.example.demo.service.UserVocabProgressService;
import com.example.demo.exception.NotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.sound.midi.VoiceStatus;
import java.lang.reflect.Array;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserStreakRepository userStreakRepository;
    private final PasswordEncoder passwordEncoder;
    private final VocabularyRepository vocabularyRepository;
    private final UserVocabProgressRepository userVocabProgressRepository;
    private final CloudinaryService cloudinaryService;
    private final CollectionRepository collectionRepository;
    private final UserVocabProgressService userVocabProgressService;
    private final GameSessionRepository gameSessionRepository;
    private final CollectionVocabRepository collectionVocabRepository;
    private final FavouriteVocabRepository favouriteVocabRepository;
    private final GameLogRepository gameLogRepository;

    private UserResponseDTO toResponseDTO(UserEntity user) {
        Long totalScore = gameSessionRepository.sumScoreByUserId(user.getUserId());
        return toResponseDTO(user, toIntegerScore(totalScore));
    }

    private UserResponseDTO toResponseDTO(UserEntity user, Integer totalScore) {
        Integer currentStreak = 0;
        if (user.getStreak() != null && user.getStreak().getCurrentStreak() != null) {
            currentStreak = user.getStreak().getCurrentStreak();
        }
        return UserResponseDTO.builder()
            .userId(user.getUserId())
            .username(user.getUsername())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .dateOfBirth(
                user.getDateOfBirth() != null 
                ? user.getDateOfBirth().toString() 
                : null
            )
            .avatarUrl(user.getAvatarUrl())
            .role(user.getRole() != null ? user.getRole().name() : "USER")
            .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
            .totalScore(totalScore)
            .currentStreak(currentStreak)
            .build();
    }

    private Integer toIntegerScore(Object score) {
        if (score instanceof Number number) {
            return number.intValue();
        }
        return 0;
    }

    @Transactional  //dam bao toan ven du lieu khi xay ra cac theo tac lam thay doi DB
    @Override
    public UserResponseDTO register(UserRegisterDTO request) {
    //Ly do tra ve UserResponseDTO la de frontend co the dung duoc du lieu nay ngay khi user dang ki xong
    //Ngoai ra, no ho tro dang nhap ngay; hoac tao mot cao popup chao mung nguoi moi dang ky tai khoan
        if(userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dung trước đây");
        }

        if(!request.getPassword().equals(request.getRetypePassword())) {
            throw new IllegalArgumentException("Mật khẩu nhập lại không khớp");
        }

        UserEntity user = UserEntity.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .dateOfBirth(request.getDateOfBirth())
                .role(Role.USER)  //mặc định là user
                // .totalScore(0)
                .build();

        UserEntity savedUser = userRepository.save(user);


        UserStreakEntity streak = new UserStreakEntity();
        streak.setUser(savedUser);
        userStreakRepository.save(streak);

        CollectionEntity defaultCollection = new CollectionEntity();
        defaultCollection.setUser(savedUser);
        defaultCollection.setCollectionName("Từ vựng của tôi");
        collectionRepository.save(defaultCollection);

        //Dung dto de tra ve, khong tra thang entity, vi chua thong tin nhay cam (password)
        return toResponseDTO(savedUser);

    }

    @Override
    public UserResponseDTO login(UserLoginDTO request) {

        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new NotFoundException("Email sai hoặc mật khẩu không chính xác"));

        if(!passwordEncoder.matches(request.getPassword(), user.getPassword())) { //Cai nay khong dung equals() duoc vi password da duoc ma hoa
            throw new IllegalArgumentException("Email hoặc mật khẩu không chính xác");
        }

        return toResponseDTO(user);
    }

    @Transactional
    @Override
    public void changePassword(String email, ChangePasswordDTO request) {

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Người dùng chưa đăng kí tài khoản"));

        if(!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại chưa chính xác");
        }

        if(!request.getNewPassword().equals(request.getRetypePassword())) {
            throw new IllegalArgumentException("Mật khẩu nhập lại không khớp");
        }

        //Lưu ý: Chỗ này phải viết theo quy định: plaintext(mk nhập vào) trước, rồi mới đến mk lấy từ DB
        if(passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu mới không được trùng với mật khẩu cũ");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    @Override
    public UserResponseDTO update(String email, UserUpdateDTO request) {

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Người dùng chưa đăng ký tài khoản"));
        if (request.getUsername() != null) {
            user.setUsername(request.getUsername());
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }

        if (request.getDateOfBirth() != null) {
            String dateOfBirth = request.getDateOfBirth().trim();
            user.setDateOfBirth(dateOfBirth.isEmpty() ? null : LocalDate.parse(dateOfBirth));
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        return toResponseDTO(userRepository.save(user));
    }

    @Transactional
    @Override
    public String uploadAvatar(String email, org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Người dùng chưa đăng ký tài khoản"));

        String fileName = "avatar_" + user.getUserId() + "_" + System.currentTimeMillis();
        String avatarUrl = cloudinaryService.uploadImage(file, fileName);
        
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        
        return avatarUrl;
    }

    @Override
    public List<UserResponseDTO> getAllUsers() {

        List<UserEntity> users = userRepository.findAll(); //lấy tất cả UserEntity từ DB, trả về List<UserEntity>
        List<Long> userIds = users.stream()
                .map(UserEntity::getUserId)
                .collect(Collectors.toList());

        Map<Long, Integer> scoreByUserId = userIds.isEmpty()
                ? Map.of()
                : gameSessionRepository.sumScoresByUserIds(userIds)
                        .stream()
                        .collect(Collectors.toMap(
                                row -> ((Number) row[0]).longValue(),
                                row -> toIntegerScore(row[1])
                        ));

        return users.stream() //chuyển List thành Stream để xử lý từng phần tử
                .map(user -> toResponseDTO(user, scoreByUserId.getOrDefault(user.getUserId(), 0))) //goi hàm toResponseDTO để chuyển thành UserResponseDTO (bảo mật)
                .collect(Collectors.toList()); //gom kết quả lại rồi trả về
    }

    @Override
    public UserResponseDTO getUserById(Long id) {

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Người dùng chưa đăng ký tài khoản"));
        return toResponseDTO(user);

    }

    @Transactional
    @Override
    public void deleteUser(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Người dùng chưa đăng ký tài khoản"));

        List<Long> createdVocabIds = vocabularyRepository.findByCreatedBy(id).stream()
                .map(VocabularyEntity::getVocabId)
                .collect(Collectors.toList());

        userVocabProgressRepository.deleteByUser_UserId(id);
        favouriteVocabRepository.deleteByUser_UserId(id);
        collectionVocabRepository.deleteByCollection_User_UserId(id);
        collectionRepository.deleteByUser_UserId(id);
        gameLogRepository.deleteBySession_User_UserId(id);
        gameSessionRepository.deleteByUser_UserId(id);

        for (Long vocabId : createdVocabIds) {
            userVocabProgressRepository.deleteByVocab_VocabId(vocabId);
            favouriteVocabRepository.deleteByVocab_VocabId(vocabId);
            collectionVocabRepository.deleteByVocab_VocabId(vocabId);
            gameLogRepository.deleteByVocab_VocabId(vocabId);
            vocabularyRepository.deleteById(vocabId);
        }

        userRepository.delete(user);
    }

    @Transactional
    @Override
    public void updateVocabProgress(String email, VocabProgressRequestDTO request) {

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));

        userVocabProgressService.updateProgress(
                user.getUserId(),
                request.getVocabId(),
                request.getIsCorrect(),
                request.getResponseTime()
        );
    }

    @Override
    public List<VocabularyResponseDTO> getVocabsForReview(String email) {

        // Lấy những từ đang trong trạng thái chưa master
        List<VocabStatus> statuses = Arrays.asList(
                VocabStatus.LEARNING // Từ đang học dở hoặc cần ôn tập
        ); // Trạng thái NEW sẽ được lấy từ API "Học bài mới" (theo Lesson/Topic)

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));

        List<UserVocabProgressEntity> review = userVocabProgressRepository.findLatestByUser(user)
                .stream()
                .filter(progress -> statuses.contains(VocabStatusResolver.resolve(progress)))
                .sorted((a, b) -> {
                    LocalDateTime left = a.getLastLearn() != null ? a.getLastLearn() : a.getCreatedAt();
                    LocalDateTime right = b.getLastLearn() != null ? b.getLastLearn() : b.getCreatedAt();
                    if (left == null && right == null) {
                        return 0;
                    }
                    if (left == null) {
                        return -1;
                    }
                    if (right == null) {
                        return 1;
                    }
                    return left.compareTo(right);
                })
                .collect(Collectors.toList());

        return review.stream()
                .map(progress -> {
                        VocabularyEntity entity = progress.getVocab();
                        return VocabularyResponseDTO.builder()
                                .vocabId(entity.getVocabId())
                                .word(entity.getWord())
                                .wordType(entity.getWordType())
                                .meaning(entity.getMeaning())
                                .pronunciation(entity.getPronunciation())
                                .example(entity.getExample())
                                .level(entity.getLevel())
                                .status(VocabStatusResolver.resolve(progress))
                                .pForget(progress.getPForget())
                                .build();
                })
                .collect(Collectors.toList());
    }
}
