package com.example.demo.service.impl;

import com.example.demo.dto.request.GameFinishRequestDTO;
import com.example.demo.dto.request.GameInitRequestDTO;
import com.example.demo.dto.response.QuestionResponseDTO;
import com.example.demo.entity.*;
import com.example.demo.enums.VocabStatus;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.*;
import com.example.demo.service.GameService;
import com.example.demo.service.UserStreakService;
import com.example.demo.service.UserVocabProgressService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service

public class GameServiceImpl implements GameService{
    private final VocabularyRepository vocabularyRepository;
    private final UserRepository userRepository;
    private final GameSessionRepository gameSessionRepository;
    private final UserVocabProgressRepository userVocabProgressRepository;
    private final GameLogRepository gameLogRepository;
    private final CollectionVocabRepository collectionVocabRepository;
    private final CollectionRepository collectionRepository;
    private final UserVocabProgressService userVocabProgressService;
    private final UserStreakService userStreakService;

    public GameServiceImpl(VocabularyRepository vocabularyRepository,
                           UserRepository userRepository,
                           GameSessionRepository gameSessionRepository,
                           UserVocabProgressRepository userVocabProgressRepository,
                           GameLogRepository gameLogRepository,
                           CollectionVocabRepository collectionVocabRepository,
                           CollectionRepository collectionRepository,
                           UserVocabProgressService userVocabProgressService,
                           UserStreakService userStreakService) {
        this.vocabularyRepository = vocabularyRepository;
        this.userRepository = userRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.userVocabProgressRepository = userVocabProgressRepository;
        this.gameLogRepository = gameLogRepository;
        this.collectionVocabRepository = collectionVocabRepository;
        this.collectionRepository = collectionRepository;
        this.userVocabProgressService = userVocabProgressService;
        this.userStreakService = userStreakService;
    }

    public List<QuestionResponseDTO> generateQuestions(String email, String gameType, GameInitRequestDTO request) {

        List<VocabularyEntity> vocabs = getVocabsByRequest(request);
        boolean hasExplicitVocabIds = request.getVocabIds() != null && !request.getVocabIds().isEmpty();
        List<VocabStatus> requestedStatuses = parseStatuses(request.getStatuses());
        if (!requestedStatuses.isEmpty()) {
            vocabs = vocabs.stream()
                    .filter(vocab -> requestedStatuses.contains(resolveStatus(email, vocab.getVocabId())))
                    .collect(Collectors.toList());
        }

        if (!hasExplicitVocabIds) {
            Collections.shuffle(vocabs);
        }

        // Lay theo so luong tu nguoi dung yeu cau
        int requestedWordCount = request.getWordCount() != null ? request.getWordCount() : vocabs.size();
        int limit = Math.min(vocabs.size(), requestedWordCount);
        List<VocabularyEntity> selectedVocabs = vocabs.subList(0, limit);

        // Lay tat ca nghia trong database de lam dap an sai
        List<String> allMeanings = vocabularyRepository.findAll()
                .stream()
                .map(VocabularyEntity::getMeaning)
                .collect(Collectors.toList());

        List<QuestionResponseDTO> result = new ArrayList<>();

        for(VocabularyEntity vocab : selectedVocabs){

            QuestionResponseDTO.QuestionResponseDTOBuilder builder = QuestionResponseDTO.builder()
                    .vocabId(vocab.getVocabId())
                    .word(vocab.getWord())
                    .meaning(vocab.getMeaning())
                    .pronunciation(vocab.getPronunciation())
                    .wordType(vocab.getWordType())
                    .status(resolveStatus(email, vocab.getVocabId()).name());

            // Truong hop la game trac nghiem -> Sinh 4 dap an
            if("QUIZ".equalsIgnoreCase(gameType)) {
                List<String> options = new ArrayList<>();
                options.add(vocab.getMeaning()); // Dua dap an dung vao List truoc

                Collections.shuffle(allMeanings); // Xao tron cac tu sai
                for(String wrongMeaning : allMeanings){
                    if(options.size() == 4) break;
                    // Loc de khong lay trung dap an dung, va khong bi trung nhau
                    if(!wrongMeaning.equals(vocab.getMeaning()) && !options.contains(wrongMeaning)) {
                        options.add(wrongMeaning);
                    }
                }

                // Tron them 1 lan nua de dap an dung nam o vi tri bat ki -> Lua User
                Collections.shuffle(options);

                builder.options(options);
                builder.correctIndex(options.indexOf(vocab.getMeaning()));
            }
            result.add(builder.build());
        }
        return result;
    }

    private List<VocabularyEntity> getVocabsByRequest(GameInitRequestDTO request) {
        String mode = request.getMode() != null ? request.getMode().toUpperCase(Locale.ROOT) : "";
        Long sourceId = request.getSourceId();
        List<Long> vocabIds = request.getVocabIds();

        if (vocabIds != null && !vocabIds.isEmpty()) {
            // Khi frontend gui vocabIds, game phai chi dung dung cac tu user da tick, khong lay them tu nguon khac.
            Map<Long, VocabularyEntity> vocabById = vocabularyRepository.findAllById(vocabIds)
                    .stream()
                    .collect(Collectors.toMap(VocabularyEntity::getVocabId, Function.identity()));

            // Giu thu tu theo payload frontend de ket qua on tap nhat quan voi danh sach da chon.
            return vocabIds.stream()
                    .distinct()
                    .map(vocabById::get)
                    .filter(vocab -> vocab != null)
                    .collect(Collectors.toList());
        }

        if ("TOPIC".equals(mode) && sourceId != null) {
            return vocabularyRepository.findByLesson_Topic_TopicId(sourceId);
        }
        if ("LESSON".equals(mode) && sourceId != null) {
            return vocabularyRepository.findByLesson_LessonId(sourceId);
        }
        if ("COLLECTION".equals(mode) && sourceId != null) {
            CollectionEntity coll = collectionRepository.findById(sourceId).orElse(null);
            // Nếu collection là "Từ vựng của tôi", lấy từ vocabulary do user tự tạo
            if (coll != null && "Từ vựng của tôi".equals(coll.getCollectionName()) && coll.getUser() != null) {
                return vocabularyRepository.findByCreatedBy(coll.getUser().getUserId());
            }
            return collectionVocabRepository.findByCollection_CollectionId(sourceId)
                    .stream()
                    .map(CollectionVocabEntity::getVocab)
                    .collect(Collectors.toList());
        }

        return vocabularyRepository.findAll();
    }

    private List<VocabStatus> parseStatuses(List<String> statuses) {
        if (statuses == null) {
            return List.of();
        }

        return statuses.stream()
                .map(status -> {
                    try {
                        return VocabStatus.valueOf(status.toUpperCase(Locale.ROOT));
                    } catch (IllegalArgumentException ex) {
                        return null;
                    }
                })
                .filter(status -> status != null)
                .collect(Collectors.toList());
    }

    private VocabStatus resolveStatus(String email, Long vocabId) {
        return VocabStatusResolver.resolve(userVocabProgressRepository
                .findFirstByUser_EmailAndVocab_VocabIdOrderByCreatedAtDesc(email, vocabId)
                .orElse(null));
    }

    @Override
    @Transactional  // Dam bao neu loi xay ra giua chung thi roll-back Database, khong luu nua voi
    public void processGameResult(String email, String gameType, GameFinishRequestDTO request) {

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NullPointerException("Không tìm thấy người dùng"));

        int sessionScore = request.getTotalScore() != null ? request.getTotalScore() : 0;

        // Luu lai game session
        GameSessionEntity session = GameSessionEntity.builder()
                .user(user)
                .gameType(gameType.toUpperCase())
                .score(sessionScore)
                .timeSpent(request.getTimeSpent())
                .startAt(LocalDateTime.now())
                .build();

        GameSessionEntity savedSession = gameSessionRepository.save(session);

        // Duyet tung log cau hoi => Luu vao DB va cap nhat tien trinh
        List<GameLogEntity> logsToSave = new ArrayList<>();

        for(GameFinishRequestDTO.GameLogDTO logDTO : request.getLogs()){

            VocabularyEntity vocab = vocabularyRepository.findById(logDTO.getVocabId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy từ vựng"));

            // Tao dong Log luu lai dap an van game nay
            GameLogEntity gameLog = GameLogEntity.builder()
                    .session(savedSession)
                    .vocab(vocab)
                    .isCorrect(logDTO.getIsCorrect())
                    .responseTime(logDTO.getTimeSpent())
                    .createdAt(LocalDateTime.now())
                    .build();
            logsToSave.add(gameLog);

            userVocabProgressService.updateProgress(
                    user.getUserId(),
                    vocab.getVocabId(),
                    logDTO.getIsCorrect(),
                    logDTO.getTimeSpent()
            );
        }

        gameLogRepository.saveAll(logsToSave);

        user.setTotalScore((user.getTotalScore() != null ? user.getTotalScore() : 0) + sessionScore);
        userStreakService.refreshCurrentStreak(user);
    }
}
