import { toast } from "react-hot-toast";
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Gamepad2,
  BookOpen,
  Brain,
  HelpCircle,
  History,
  BarChart2,
  Search,
  CheckSquare,
  X,
  Play,
  Clock,
  RotateCcw,
  Target,
  Trophy,
  Flame,
  ChevronRight,
  Volume2,
  Heart,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import FilterBox from "../components/FilterBox";
import VocabResultList from "../components/VocabResultList";
import Pagination from "../components/Pagination";
import { playAudio } from "../utils/audio";
import { initGame, finishGame } from "../utils/services/practiceService";
import { fetchTopics } from "../utils/services/topicService";
import { fetchLessons } from "../utils/services/lessonService";
import { fetchCollections } from "../utils/services/collectionService";
import {
  getCollectionStatusSummary,
  getLessonStatusSummary,
} from "../utils/services/progressService";
import {
  addFavorite,
  removeFavorite,
} from "../utils/services/favouriteService";
import { getSmartReview, resetPForget } from "../utils/services/reviewService";
import { getMe } from "../utils/services/authService";
import { formatWordType } from "../utils/wordFormatters";

const STATUS_OPTIONS = [
  { id: "MASTERED", name: "Đã thuộc" },
  { id: "LEARNED", name: "Đã học" },
  { id: "LEARNING", name: "Chưa thuộc" },
  { id: "NEW", name: "Chưa học" },
];

const MIN_SMART_P_FORGET = 0.5;
const SMART_REVIEW_FETCH_LIMIT = 1000;
const SMART_WORDS_PER_PAGE = 10;
const HIDDEN_SMART_REVIEW_WORDS_KEY = "hiddenSmartReviewWordIds";
const GAME_HISTORY_STORAGE_KEY = "englishstudy_game_history";

const getGameHistoryStorageKey = (userId) =>
  userId ? `${GAME_HISTORY_STORAGE_KEY}_${userId}` : null;

const getUserIdFromPrincipal = (principal) => {
  const user = principal?.user ?? principal;
  return user?.userId ?? user?.user_id ?? user?.id ?? user?.email ?? null;
};

const loadGameHistory = (userId) => {
  const storageKey = getGameHistoryStorageKey(userId);
  if (!storageKey) return [];

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function PracticePage({
  onBack,
  initialFilters,
  onGameFinished,
}) {
  const [activeMode, setActiveMode] = useState("topic");
  const [activeTab, setActiveTab] = useState("history");
  const [instructionGame, setInstructionGame] = useState(null);

  const [selectedCollections, setSelectedCollections] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [wordCount, setWordCount] = useState(20);

  const toggleStatus = (newStatuses) => {
    setSelectedStatuses((prev) => {
      let updated = newStatuses;

      const hasLearned = updated.includes("LEARNED");
      const hasMastered = updated.includes("MASTERED");
      const hasLearning = updated.includes("LEARNING");

      
      if (hasLearned && !prev.includes("LEARNED")) {
        if (!updated.includes("MASTERED")) updated = [...updated, "MASTERED"];
        if (!updated.includes("LEARNING")) updated = [...updated, "LEARNING"];
      }

      
      if (!hasLearned && prev.includes("LEARNED")) {
        updated = updated.filter((s) => s !== "MASTERED" && s !== "LEARNING");
      }

      
      const hasMasteredNow = updated.includes("MASTERED");
      const hasLearningNow = updated.includes("LEARNING");
      if (hasMasteredNow && hasLearningNow && !updated.includes("LEARNED")) {
        updated = [...updated, "LEARNED"];
      }

      
      if (updated.includes("LEARNED") && (!hasMasteredNow || !hasLearningNow)) {
        updated = updated.filter((s) => s !== "LEARNED");
      }

      return updated;
    });
  };

  const [collections, setCollections] = useState([]);
  const [topics, setTopics] = useState([]);

  
  const [statusSummary, setStatusSummary] = useState(null); 
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const [smartReviewWords, setSmartReviewWords] = useState([]);
  const [selectedSmartWordIds, setSelectedSmartWordIds] = useState([]);
  const [smartReviewPage, setSmartReviewPage] = useState(1);
  const [hiddenSmartWordIds, setHiddenSmartWordIds] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(HIDDEN_SMART_REVIEW_WORDS_KEY)) ?? []
      );
    } catch {
      return [];
    }
  });
  const [isSmartLoading, setIsSmartLoading] = useState(false);

  const [gameSettings, setGameSettings] = useState({
    timePerQuestion: 15,
    autoNext: true,
    autoNextDelay: 2,
  });

  const [activeGame, setActiveGame] = useState(null);
  const [quizState, setQuizState] = useState("playing");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAns, setSelectedAns] = useState(null);
  const [quizLog, setQuizLog] = useState([]);

  const [matchLives, setMatchLives] = useState(5);
  const [matchItems, setMatchItems] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [matchFeedback, setMatchFeedback] = useState(null);
  const [matchErrors, setMatchErrors] = useState({});
  const [errorFlash, setErrorFlash] = useState([]); 

  const [listenInput, setListenInput] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealedIndices, setRevealedIndices] = useState([]);

  const [quizData, setQuizData] = useState([]);
  const [hasSubmittedResult, setHasSubmittedResult] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [toggleFavoriteLoading, setToggleFavoriteLoading] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [historyLogView, setHistoryLogView] = useState(null);
  const feedbackRef = useRef(null);
  const questionStartedAtRef = useRef(performance.now());

  useEffect(() => {
    let cancelled = false;

    getMe()
      .then((principal) => {
        if (cancelled) return;
        setCurrentUserId(getUserIdFromPrincipal(principal));
      })
      .catch(() => {
        if (cancelled) return;
        setCurrentUserId(null);
        setGameHistory([]);
        setIsHistoryLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setHistoryLogView(null);
    setGameHistory(loadGameHistory(currentUserId));
    setIsHistoryLoaded(Boolean(currentUserId));
  }, [currentUserId]);

  useEffect(() => {
    const storageKey = getGameHistoryStorageKey(currentUserId);
    if (!storageKey || !isHistoryLoaded) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(gameHistory));
    } catch {
      
    }
  }, [currentUserId, gameHistory, isHistoryLoaded]);
  const gameStartedAtRef = useRef(performance.now());

  const markGameStart = () => {
    const now = performance.now();
    gameStartedAtRef.current = now;
    questionStartedAtRef.current = now;
  };

  const markQuestionStart = () => {
    questionStartedAtRef.current = performance.now();
  };

  const getElapsedSeconds = (startedAt = questionStartedAtRef.current) =>
    Math.max(1, Math.round((performance.now() - startedAt) / 1000));

  useEffect(() => {
    if (selectedAns !== null || matchFeedback !== null) {
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [selectedAns, matchFeedback]);

  const toggleFavorite = async (id) => {
    setToggleFavoriteLoading(id);
    try {
      const isFavorite = favoriteIds.includes(id);
      if (isFavorite) {
        await removeFavorite(id);
        setFavoriteIds((prev) => prev.filter((fId) => fId !== id));
      } else {
        await addFavorite(id);
        setFavoriteIds((prev) => [...prev, id]);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật yêu thích:", error);
    } finally {
      setToggleFavoriteLoading(null);
    }
  };

  useEffect(() => {
    if (initialFilters) {
      setActiveMode(initialFilters.mode);
      if (initialFilters.mode === "collection") {
        setSelectedCollections([initialFilters.collectionId]);
        setSelectedTopics([]);
        setSelectedLessons([]);
      } else if (initialFilters.mode === "topic") {
        setSelectedTopics([initialFilters.topicId]);
        setSelectedLessons([initialFilters.lessonId]);
        setSelectedCollections([]);
      } else if (initialFilters.mode === "smart") {
        setSelectedCollections([]);
        setSelectedTopics([]);
        setSelectedLessons([]);
      }
      setSelectedStatuses([]);
    }
  }, [initialFilters]);

  useEffect(() => {
    let cancelled = false;
    const loadTopics = async () => {
      try {
        const [topicsRes, lessonsRes, collRes] = await Promise.allSettled([
          fetchTopics(),
          fetchLessons(),
          fetchCollections(),
        ]);

        const topicsList =
          topicsRes.status === "fulfilled"
            ? Array.isArray(topicsRes.value)
              ? topicsRes.value
              : (topicsRes.value?.items ?? topicsRes.value?.data ?? [])
            : [];

        const lessonsList =
          lessonsRes.status === "fulfilled"
            ? Array.isArray(lessonsRes.value)
              ? lessonsRes.value
              : (lessonsRes.value?.items ?? lessonsRes.value?.data ?? [])
            : [];

        
        if (collRes.status === "fulfilled") {
          const collList = Array.isArray(collRes.value)
            ? collRes.value
            : (collRes.value?.items ?? collRes.value?.data ?? []);
          if (!cancelled && Array.isArray(collList)) {
            const mapped = collList.map((c) => ({
              id: c.collectionId ?? c.id,
              name: c.collectionName ?? c.name ?? "",
              wordCount: c.vocabCount ?? c.wordCount ?? 0,
            }));
            
            const myVocabName = "Từ vựng của tôi";
            const myIdx = mapped.findIndex((c) => c.name === myVocabName);
            if (myIdx !== -1) {
              const myVocab = mapped.splice(myIdx, 1)[0];
              setCollections([myVocab, ...mapped]);
            } else {
              setCollections([
                { id: 0, name: myVocabName, wordCount: 0 },
                ...mapped,
              ]);
            }
          }
        }

        const mappedTopics = topicsList.map((t) => {
          const topicId = t.id ?? t.topicId ?? t.topic_id;
          const title = t.topicName ?? t.title ?? t.name ?? "";
          const topicLessons = Array.isArray(t.lessons)
            ? t.lessons
            : Array.isArray(t.lessonList)
              ? t.lessonList
              : lessonsList.filter(
                  (l) => (l.topicId ?? l.topic_id ?? l.topic?.id) === topicId,
                );

          return {
            ...t,
            id: topicId,
            title,
            name: title,
            lessons: Array.isArray(topicLessons)
              ? topicLessons.map((l) => ({
                  ...l,
                  id: l.id ?? l.lessonId ?? l.lesson_id,
                  name:
                    l.name ?? l.title ?? l.lessonName ?? l.lesson?.name ?? "",
                  difficulty: l.difficulty ?? l.level ?? 1,
                  
                  wordCount:
                    l.wordCount ??
                    l.vocabCount ??
                    l.vocab_count ??
                    l.totalVocab ??
                    0,
                }))
              : [],
          };
        });

        if (!cancelled && Array.isArray(mappedTopics)) setTopics(mappedTopics);
      } catch (err) {
        if (!cancelled) setTopics([]);
      }
    };
    loadTopics();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (activeMode !== "smart") return;
      if (!currentUserId) return;

      setIsSmartLoading(true);
      try {
        const numericUserId = Number(currentUserId);
        if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
          throw new Error(
            "Không xác định được userId để gọi ôn tập thông minh",
          );
        }

        const res = await getSmartReview(
          numericUserId,
          SMART_REVIEW_FETCH_LIMIT,
        );
        

        const list = Array.isArray(res) ? res : (res?.items ?? res?.data ?? []);
        if (!cancelled && Array.isArray(list)) {
          setSmartReviewWords(list);
          setSelectedSmartWordIds([]);
          setSmartReviewPage(1);

          
          
          const returnedIds = new Set(
            list.map((w) => w.vocabId ?? w.id).filter(Boolean),
          );
          setHiddenSmartWordIds((prev) => {
            const next = prev.filter((id) => !returnedIds.has(id));
            if (next.length !== prev.length) {
              try {
                localStorage.setItem(
                  HIDDEN_SMART_REVIEW_WORDS_KEY,
                  JSON.stringify(next),
                );
              } catch {
                
              }
            }
            return next;
          });
        }
      } catch {
        if (!cancelled) {
          setSmartReviewWords([]);
          setSelectedSmartWordIds([]);
          setSmartReviewPage(1);
          toast.error("Không tải được danh sách ôn tập thông minh từ ML");
        }
      } finally {
        if (!cancelled) setIsSmartLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [activeMode, currentUserId]);

  const availableLessons = useMemo(() => {
    return topics
      .filter((t) => selectedTopics.includes(t.id))
      .flatMap((t) => t.lessons ?? []);
  }, [selectedTopics, topics]);

  const getSmartWordId = (word) => word.vocabId ?? word.id;

  const getPForgetValue = (word) => {
    const raw = word.pForget ?? word.pforget ?? word.p_forget;
    if (raw === null || raw === undefined || raw === "") return null;
    const value = Number(raw);
    if (Number.isNaN(value)) return null;
    return value > 1 ? value / 100 : value;
  };

  const formatPForgetPercent = (word) => {
    const value = getPForgetValue(word);
    if (value === null) return "--";
    return `${Math.round(value * 100)}%`;
  };

  const sortedSmartReviewWords = useMemo(() => {
    const reviewableWords = smartReviewWords.filter((word) => {
      const pForget = getPForgetValue(word);
      const wordId = getSmartWordId(word);
      
      return (
        pForget !== null &&
        pForget > MIN_SMART_P_FORGET &&
        !hiddenSmartWordIds.includes(wordId)
      );
    });

    return reviewableWords.sort((a, b) => {
      const left = getPForgetValue(a) ?? -1;
      const right = getPForgetValue(b) ?? -1;
      return right - left;
    });
  }, [hiddenSmartWordIds, smartReviewWords]);

  const selectedSmartWords = useMemo(() => {
    const selectedSet = new Set(selectedSmartWordIds);
    return sortedSmartReviewWords.filter((word) =>
      selectedSet.has(getSmartWordId(word)),
    );
  }, [selectedSmartWordIds, sortedSmartReviewWords]);

  const smartGameWords = useMemo(() => {
    if (selectedSmartWords.length > 0) return selectedSmartWords;
    
    return sortedSmartReviewWords.slice(0, 10);
  }, [selectedSmartWords, sortedSmartReviewWords]);

  const smartReviewTotalPages = Math.max(
    1,
    Math.ceil(sortedSmartReviewWords.length / SMART_WORDS_PER_PAGE),
  );

  const paginatedSmartReviewWords = useMemo(() => {
    const startIndex = (smartReviewPage - 1) * SMART_WORDS_PER_PAGE;
    
    return sortedSmartReviewWords.slice(
      startIndex,
      startIndex + SMART_WORDS_PER_PAGE,
    );
  }, [smartReviewPage, sortedSmartReviewWords]);

  useEffect(() => {
    if (smartReviewPage > smartReviewTotalPages) {
      setSmartReviewPage(smartReviewTotalPages);
    }
  }, [smartReviewPage, smartReviewTotalPages]);

  const toggleSmartWord = (wordId) => {
    if (wordId === null || wordId === undefined) return;
    setSelectedSmartWordIds((prev) =>
      prev.includes(wordId)
        ? prev.filter((id) => id !== wordId)
        : [...prev, wordId],
    );
  };

  const toggleAllSmartWords = () => {
    const selectableIds = paginatedSmartReviewWords
      .map(getSmartWordId)
      .filter((id) => id !== null && id !== undefined);
    const allSelected =
      selectableIds.length > 0 &&
      selectableIds.every((id) => selectedSmartWordIds.includes(id));
    setSelectedSmartWordIds(allSelected ? [] : selectableIds);
  };

  const removeSmartWord = async (targetWordId) => {
    if (targetWordId === null || targetWordId === undefined) return;

    try {
      await resetPForget(targetWordId);
      setSmartReviewWords((prev) =>
        prev.filter((word) => getSmartWordId(word) !== targetWordId),
      );
      setSelectedSmartWordIds((prev) =>
        prev.filter((id) => id !== targetWordId),
      );
      setHiddenSmartWordIds((prev) => {
        if (prev.includes(targetWordId)) return prev;
        const next = [...prev, targetWordId];
        localStorage.setItem(
          HIDDEN_SMART_REVIEW_WORDS_KEY,
          JSON.stringify(next),
        );
        return next;
      });
    } catch {
      toast.error("Không thể cập nhật xác suất quên của từ vựng.");
    }
  };

  
  useEffect(() => {
    let cancelled = false;
    const fetchSummary = async () => {
      
      setStatusSummary(null);

      if (activeMode === "collection" && selectedCollections.length === 1) {
        setIsSummaryLoading(true);
        try {
          const data = await getCollectionStatusSummary(selectedCollections[0]);
          if (!cancelled) setStatusSummary(data);
        } catch {
          
        } finally {
          if (!cancelled) setIsSummaryLoading(false);
        }
      } else if (activeMode === "topic" && selectedLessons.length === 1) {
        setIsSummaryLoading(true);
        try {
          const data = await getLessonStatusSummary(selectedLessons[0]);
          if (!cancelled) setStatusSummary(data);
        } catch {
          
        } finally {
          if (!cancelled) setIsSummaryLoading(false);
        }
      }
    };
    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [activeMode, selectedCollections, selectedLessons]);

  const availableCount = useMemo(() => {
    
    if (statusSummary) {
      const total = statusSummary.totalCount ?? 0;
      if (selectedStatuses.length === 0) return total;
      
      let count = 0;
      if (selectedStatuses.includes("NEW"))
        count += statusSummary.newCount ?? 0;
      if (selectedStatuses.includes("LEARNING"))
        count += statusSummary.learningCount ?? 0;
      if (selectedStatuses.includes("MASTERED"))
        count += statusSummary.masteredCount ?? 0;
      return count;
    }

    
    let total = 0;
    if (activeMode === "collection") {
      total = collections
        .filter((c) => selectedCollections.includes(c.id))
        .reduce((sum, c) => sum + (c.wordCount ?? 0), 0);
    } else if (activeMode === "topic") {
      total = availableLessons
        .filter((l) => selectedLessons.includes(l.id))
        .reduce((sum, l) => sum + (l.wordCount ?? 0), 0);
    } else {
      total = smartGameWords.length;
    }
    return total;
  }, [
    activeMode,
    selectedCollections,
    selectedLessons,
    selectedStatuses,
    availableLessons,
    smartGameWords.length,
    collections,
    statusSummary,
  ]);

  const avgDifficulty = useMemo(() => {
    if (activeMode === "topic" && selectedLessons.length > 0) {
      const selectedL = availableLessons.filter((l) =>
        selectedLessons.includes(l.id),
      );
      const totalDiff = selectedL.reduce(
        (sum, l) => sum + (l.difficulty || 3),
        0,
      );
      return totalDiff / selectedL.length;
    }
    return 3;
  }, [activeMode, selectedLessons, availableLessons]);

  useEffect(() => {
    setWordCount(availableCount);
  }, [availableCount]);

  useEffect(() => {
    let timer;
    const isPlayingMatch =
      activeGame === "match" &&
      quizState === "playing" &&
      matchFeedback === null;
    const isPlayingQuiz =
      activeGame === "quiz" && quizState === "playing" && selectedAns === null;
    const isPlayingListen =
      activeGame === "listen" &&
      quizState === "playing" &&
      selectedAns === null;

    if ((isPlayingQuiz || isPlayingMatch || isPlayingListen) && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (
      timeLeft === 0 &&
      (isPlayingQuiz || isPlayingMatch || isPlayingListen)
    ) {
      if (activeGame === "quiz") handleAnswer(-1);
      else if (activeGame === "match") setMatchLives(0);
      else if (activeGame === "listen") handleListenSubmit(true);
    }
    return () => clearInterval(timer);
  }, [activeGame, quizState, selectedAns, matchFeedback, timeLeft]);

  
  
  
  
  
  

  const handleAnswer = (index) => {
    if (selectedAns !== null) return;
    setSelectedAns(index);
    const currentQ = quizData[currentQIndex];
    const isCorrect = index === currentQ.correct;
    const responseTime = getElapsedSeconds();

    
    
    
    let points = 0;
    if (isCorrect) {
      if (currentQ.status === "NEW") points = 10;
      else if (currentQ.status === "LEARNING") points = 5;
      else if (currentQ.status === "MASTERED") points = 3;
      else points = 5; 
    }

    setQuizLog((prev) => [
      ...prev,
      { q: currentQ, isCorrect, pointsEarned: points, timeSpent: responseTime },
    ]);
  };

  const handleNextQuestion = () => {
    if (currentQIndex < quizData.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedAns(null);
      setListenInput("");
      setHintsUsed(0);
      setRevealedIndices([]);
      setTimeLeft(gameSettings.timePerQuestion || 15);
      markQuestionStart();
    } else {
      setQuizState("result");
    }
  };

  const handleRetryGame = (gameId, nextQuizData = quizData) => {
    const normalizedGameId = typeof gameId === "string" ? gameId : activeGame;
    setQuizState("playing");
    setCurrentQIndex(0);
    setSelectedAns(null);
    setQuizLog([]);
    setHasSubmittedResult(false);
    markGameStart();
    if (normalizedGameId === "match") {
      setMatchLives(5);
      setMatchedIds([]);
      setSelectedMatch(null);
      setMatchFeedback(null);
      setMatchErrors({});
      setTimeLeft((gameSettings.timePerQuestion || 15) * nextQuizData.length);
      const leftItems = nextQuizData
        .map((q) => ({ id: q.id, text: q.word, type: "word" }))
        .sort(() => Math.random() - 0.5);
      const rightItems = nextQuizData
        .map((q) => ({ id: q.id, text: q.meaning, type: "meaning" }))
        .sort(() => Math.random() - 0.5);
      setMatchItems({ left: leftItems, right: rightItems });
    } else if (normalizedGameId === "listen") {
      setListenInput("");
      setHintsUsed(0);
      setRevealedIndices([]);
      setTimeLeft(gameSettings.timePerQuestion || 15);
    } else {
      setTimeLeft(gameSettings.timePerQuestion || 15);
    }
  };

  
  const handleStartGame = (gameId) => {
    
    if (activeMode === "collection" && selectedCollections.length === 0) {
      toast.error("Vui lòng chọn ít nhất một Bộ từ vựng để bắt đầu ôn tập!");
      return;
    }
    
    if (
      activeMode === "topic" &&
      (selectedTopics.length === 0 || selectedLessons.length === 0)
    ) {
      toast.error(
        "Vui lòng chọn ít nhất một Chủ đề và một Bài học để bắt đầu ôn tập!",
      );
      return;
    }
    
    if (availableCount === 0) {
      toast.error(
        "Không có từ vựng nào thỏa mãn điều kiện lọc. Vui lòng chọn lại!",
      );
      return;
    }

    if (gameId === "quiz" || gameId === "match" || gameId === "listen") {
      (async () => {
        let preparedQuestions = [];
        try {
          
          const MODE_MAP = {
            topic: "TOPIC",
            collection: "COLLECTION",
            smart: "SMART_REVIEW",
          };
          let backendMode = MODE_MAP[activeMode] ?? "TOPIC";
          let sourceId = null;
          if (activeMode === "topic") {
            sourceId = selectedLessons[0] ?? selectedTopics[0] ?? null;
            backendMode = selectedLessons[0] ? "LESSON" : "TOPIC";
          } else if (activeMode === "collection")
            sourceId = selectedCollections[0] ?? null;
          const smartVocabIds =
            activeMode === "smart"
              ? smartGameWords
                  .map(getSmartWordId)
                  .filter((id) => id !== null && id !== undefined)
              : [];

          const initPayload = {
            mode: backendMode,
            sourceId: sourceId,
            wordCount:
              activeMode === "smart" ? smartVocabIds.length : wordCount,
            vocabIds:
              activeMode === "smart" && smartVocabIds.length > 0
                ? smartVocabIds
                : undefined,
            statuses:
              selectedStatuses.length > 0
                ? selectedStatuses.filter((s) => s !== "LEARNED")
                : undefined,
          };
          const questions = await initGame(gameId, initPayload);
          const list = Array.isArray(questions)
            ? questions
            : (questions?.items ?? questions?.data ?? []);
          if (Array.isArray(list) && list.length > 0) {
            const mapped = list.map((q, idx) => ({
              id: q.vocabId ?? q.id ?? idx + 1,
              word: q.word ?? "",
              pronunciation: q.pronunciation ?? "",
              type: formatWordType(q.wordType ?? q.word_type ?? ""),
              meaning: q.meaning ?? "",
              example: q.example ?? "",
              options: q.options ?? [],
              correct: q.correctIndex ?? 0,
              isFavorite: false,
              status: q.status ?? "NEW",
            }));
            preparedQuestions = mapped;
            setQuizData(mapped);
            setFavoriteIds([]);
          } else {
            setQuizData([]);
          }
        } catch {
          setQuizData([]);
        } finally {
          setActiveGame(gameId);
          handleRetryGame(gameId, preparedQuestions);
        }
      })();
    } else {
      toast.error("Tính năng này đang được phát triển!");
    }
  };

  
  const handleMatchClick = (item) => {
    if (selectedMatch === null) {
      setSelectedMatch(item);
    } else {
      if (selectedMatch.id === item.id && selectedMatch.type !== item.type) {
        
        setMatchedIds((prev) => [...prev, item.id]);
        const currentQ = quizData.find((q) => q.id === item.id);
        setMatchFeedback(currentQ);

        
        if (matchedIds.length + 1 === quizData.length) {
          setTimeout(() => {
            setMatchFeedback(null);
            setQuizState("result");
          }, 3000); 
        }

        let points = 0;
        if (currentQ.status === "NEW") points = 10;
        else if (currentQ.status === "LEARNING") points = 5;
        else if (currentQ.status === "MASTERED") points = 3;
        else points = 5; 
        const originalPoints = points;
        const deduction = 0;
        const errors = matchErrors[item.id] || 0;

        const responseTime = getElapsedSeconds();
        
        
        
        setQuizLog((prev) => [
          ...prev,
          {
            q: currentQ,
            isCorrect: true,
            pointsEarned: points,
            timeSpent: responseTime,
            originalPoints,
            deduction,
            errors,
          },
        ]);
        setSelectedMatch(null);
      } else if (
        selectedMatch.id === item.id &&
        selectedMatch.type === item.type
      ) {
        setSelectedMatch(null);
      } else {
        
        const flashItems = [
          { id: selectedMatch.id, type: selectedMatch.type },
          { id: item.id, type: item.type },
        ];
        setErrorFlash(flashItems);
        setTimeout(() => setErrorFlash([]), 1500);

        setMatchLives((prev) => prev - 1);
        setSelectedMatch(null);

        
        setMatchErrors((prev) => ({
          ...prev,
          [selectedMatch.id]: (prev[selectedMatch.id] || 0) + 1,
          [item.id]: (prev[item.id] || 0) + 1,
        }));
      }
    }
  };

  const handleMatchNext = () => {
    markQuestionStart();
    setMatchFeedback(null);
    if (matchedIds.length === quizData.length) {
      setQuizState("result");
    }
  };

  
  const handleListenSubmit = (isTimeout = false) => {
    if (selectedAns !== null) return;
    const currentQ = quizData[currentQIndex];
    const isCorrect =
      !isTimeout &&
      listenInput.trim().toLowerCase() === currentQ.word.toLowerCase();
    const responseTime = getElapsedSeconds();

    
    
    

    setSelectedAns(isCorrect ? 1 : 0);
    let points = 0;
    if (isCorrect) {
      if (currentQ.status === "NEW") points = 10;
      else if (currentQ.status === "LEARNING") points = 5;
      else if (currentQ.status === "MASTERED") points = 3;
      else points = 5; 
    }
    setQuizLog((prev) => [
      ...prev,
      { q: currentQ, isCorrect, pointsEarned: points, timeSpent: responseTime },
    ]);
  };

  const handleUseHint = () => {
    const word = quizData[currentQIndex].word;
    if (hintsUsed >= 3 || revealedIndices.length >= word.length) return;

    let unrevealed = [];
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== " " && word[i] !== "-" && !revealedIndices.includes(i))
        unrevealed.push(i);
    }
    if (unrevealed.length > 0) {
      const randomIdx =
        unrevealed[Math.floor(Math.random() * unrevealed.length)];
      setRevealedIndices((prev) => [...prev, randomIdx]);
      setHintsUsed((prev) => prev + 1);
    }
  };

  const getMaskedWord = (word) => {
    if (hintsUsed === 0) return "";
    let masked = "";
    for (let i = 0; i < word.length; i++) {
      if (word[i] === " " || word[i] === "-") masked += word[i] + " ";
      else if (revealedIndices.includes(i)) masked += word[i] + " ";
      else masked += "_ ";
    }
    return masked.trim();
  };

  const getMaskedExample = (example, word) => {
    if (!example) return "";
    const regex = new RegExp(word, "gi");
    return example.replace(regex, "______");
  };

  useEffect(() => {
    
    if (activeGame === "match" && matchLives === 0 && quizState === "playing") {
      const timeForCurrentQ = getElapsedSeconds();
      const allFailedLogs = quizData.map((q) => ({
        q,
        isCorrect: false,
        pointsEarned: 0,
        timeSpent: timeForCurrentQ,
      }));
      setQuizLog(allFailedLogs);
      setQuizState("result");
    }
  }, [matchLives, activeGame, quizState, quizData]);

  const getGameDisplayName = (gameId) => {
    if (gameId === "quiz") return "Trắc nghiệm";
    if (gameId === "match") return "Nối từ";
    if (gameId === "listen") return "Nghe - Viết";
    return "Luyện tập";
  };

  const getHistoryGameIcon = (gameId) => {
    switch (gameId) {
      case "quiz":
        return {
          icon: CheckSquare,
          bg: "bg-blue-100",
          text: "text-blue-600",
        };

      case "match":
        return {
          icon: Gamepad2,
          bg: "bg-purple-100",
          text: "text-purple-600",
        };

      case "listen":
        return {
          icon: () => <div className="font-bold text-xl">🎧</div>,
          bg: "bg-orange-100",
          text: "text-orange-600",
        };

      default:
        return {
          icon: Gamepad2,
          bg: "bg-gray-100",
          text: "text-gray-600",
        };
    }
  };

  const formatHistoryDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return timestamp;
    }
  };

  useEffect(() => {
    if (!activeGame) return;
    if (quizState !== "result") return;
    if (hasSubmittedResult) return;
    if (quizLog.length === 0) return;

    const correctAnswers = quizLog.filter((log) => log.isCorrect).length;
    const totalScore = quizLog.reduce(
      (sum, log) => sum + (log.pointsEarned || 0),
      0,
    );
    const finishPayload = {
      gameType:
        { quiz: "QUIZ", match: "MATCH", listen: "LISTEN" }[activeGame] ??
        "QUIZ",
      totalScore,
      timeSpent: getElapsedSeconds(gameStartedAtRef.current),
      logs: quizLog.map((l) => ({
        vocabId: l.q?.id,
        isCorrect: l.isCorrect,
        timeSpent: l.timeSpent ?? 1,
        pointsEarned: l.pointsEarned ?? 0,
      })),
    };

    setGameHistory((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: currentUserId,
        gameId: activeGame,
        gameName: getGameDisplayName(activeGame),
        timestamp: new Date().toISOString(),
        correctAnswers,
        wrongAnswers: quizLog.length - correctAnswers,
        totalQuestions: quizLog.length,
        score: totalScore,
        timeSpent: getElapsedSeconds(gameStartedAtRef.current),
        logs: quizLog,
      },
      ...prev,
    ]);
    setHasSubmittedResult(true);
    finishGame(activeGame, finishPayload)
      .then(() => onGameFinished?.())
      .catch(() => {});
  }, [
    activeGame,
    quizState,
    quizLog,
    hasSubmittedResult,
    activeMode,
    currentUserId,
    onGameFinished,
  ]);

  
  if (activeGame === "quiz") {
    const currentQ = quizData[currentQIndex];
    if (!currentQ && quizState === "playing") {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold">Đang tải câu hỏi...</p>
          </div>
        </div>
      );
    }
    const correctAnswers = quizLog.filter((log) => log.isCorrect).length;
    const totalScore = quizLog.reduce(
      (sum, log) => sum + (log.pointsEarned || 0),
      0,
    );

    let resultMessage = "";
    if (correctAnswers === quizData.length)
      resultMessage = "Hoàn hảo! Bạn thật xuất sắc! 🎉";
    else if (correctAnswers >= quizData.length / 2)
      resultMessage = "Khá lắm! Hãy tiếp tục phát huy nhé! 💪";
    else resultMessage = "Đừng nản chí! Hãy ôn tập lại và thử sức lần nữa! 📚";

    return (
      <div className="min-h-screen bg-gray-50 pb-20 p-6 animate-in fade-in duration-300">
        <div className="max-w-3xl mx-auto space-y-6">
          {quizState === "playing" && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-500 font-bold">
                  Câu {currentQIndex + 1} / {quizData.length}
                </span>
                <button
                  onClick={() => setActiveGame(null)}
                  className="text-gray-400 hover:text-red-500 font-bold flex items-center gap-1"
                >
                  <X size={20} /> Thoát
                </button>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full mb-8 overflow-hidden">
                <div
                  className="bg-cyan-500 h-full transition-all duration-300"
                  style={{
                    width: `${(currentQIndex / quizData.length) * 100}%`,
                  }}
                ></div>
              </div>

              <div className="flex flex-col items-center mb-8">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mb-4 border-4 transition-colors ${timeLeft <= 5 ? "border-red-500 text-red-500" : "border-cyan-500 text-cyan-600"}`}
                >
                  {timeLeft}
                </div>
                <h2 className="text-3xl font-extrabold text-gray-800 text-center">
                  Nghĩa của từ{" "}
                  <span className="text-cyan-600">"{currentQ.word}"</span> là
                  gì?
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {currentQ.options.map((opt, idx) => {
                  let btnStyle =
                    "bg-white border-2 border-gray-200 text-gray-700 hover:border-cyan-500 hover:bg-cyan-50";
                  if (selectedAns !== null) {
                    if (idx === currentQ.correct)
                      btnStyle =
                        "bg-green-100 border-2 border-green-500 text-green-800";
                    else if (idx === selectedAns)
                      btnStyle =
                        "bg-red-100 border-2 border-red-500 text-red-800";
                    else
                      btnStyle =
                        "bg-gray-50 border-2 border-gray-200 text-gray-400 opacity-50";
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedAns !== null}
                      className={`p-5 rounded-2xl text-lg font-bold transition-all text-left ${btnStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {selectedAns !== null && (
                <div
                  ref={feedbackRef}
                  className={`mt-8 p-6 rounded-2xl border-2 ${selectedAns === currentQ.correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} animate-in fade-in zoom-in-95`}
                >
                  <h3
                    className={`text-3xl font-black mb-4 ${selectedAns === currentQ.correct ? "text-green-600" : "text-red-600"}`}
                  >
                    {selectedAns === currentQ.correct
                      ? "Tuyệt vời!"
                      : "Sai rồi!"}
                  </h3>

                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start">
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900">
                        {currentQ.word}
                      </h4>
                      <div className="flex items-center gap-3 text-gray-500 mt-1 mb-3">
                        <span>{currentQ.pronunciation}</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-sm font-semibold">
                          {currentQ.type}
                        </span>
                        <StatusBadge status={currentQ.status} />
                      </div>
                      <p className="text-cyan-800 font-medium text-lg mb-2">
                        {currentQ.meaning}
                      </p>
                      {currentQ.example && (
                        <p className="text-gray-600 italic text-sm">
                          VD: "{currentQ.example}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => playAudio(currentQ.word)}
                        className="p-2 bg-gray-100 rounded-full hover:bg-cyan-100 text-cyan-700 transition-colors"
                      >
                        <Volume2 size={24} />
                      </button>
                      <button
                        onClick={() => toggleFavorite(currentQ.id)}
                        disabled={toggleFavoriteLoading === currentQ.id}
                        className="p-2 bg-gray-100 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {toggleFavoriteLoading === currentQ.id ? (
                          <div className="w-6 h-6 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <Heart
                            size={24}
                            className={
                              favoriteIds.includes(currentQ.id)
                                ? "fill-red-500 text-red-500"
                                : "text-gray-400"
                            }
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleNextQuestion}
                      className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
                    >
                      Tiếp tục <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {quizState === "result" && (
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 text-center animate-in zoom-in-95">
              <div className="w-24 h-24 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy size={48} />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">
                Hoàn thành bài tập!
              </h2>
              <p className="text-gray-500 mb-8">{resultMessage}</p>

              <div className="flex justify-center gap-8 mb-10">
                <div className="bg-gray-50 p-6 rounded-2xl min-w-[150px]">
                  <p className="text-gray-500 font-bold mb-1">Số câu đúng</p>
                  <p className="text-4xl font-black text-green-600">
                    {correctAnswers}
                    <span className="text-2xl text-gray-400">
                      /{quizData.length}
                    </span>
                  </p>
                </div>
                <div className="bg-cyan-50 p-6 rounded-2xl min-w-[150px]">
                  <p className="text-cyan-700 font-bold mb-1">Tổng điểm</p>
                  <p className="text-4xl font-black text-cyan-600">
                    +{totalScore}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <button
                  onClick={() => setQuizState("detail")}
                  className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors"
                >
                  Xem chi tiết lượt chơi
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleRetryGame}
                    className="flex-1 py-4 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold rounded-2xl transition-colors flex justify-center items-center gap-2"
                  >
                    <RotateCcw size={20} /> Chơi lại
                  </button>
                  <button
                    onClick={() => setActiveGame(null)}
                    className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-2xl shadow-lg transition-colors"
                  >
                    Thoát
                  </button>
                </div>
              </div>
            </div>
          )}

          {quizState === "detail" && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-in slide-in-from-right">
              <div className="flex items-center mb-8">
                <button
                  onClick={() => setQuizState("result")}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 mr-4"
                >
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-black text-gray-800">
                  Chi tiết lượt chơi
                </h2>
              </div>
              <div className="mt-8">
                <VocabResultList
                  logs={quizLog}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                  toggleFavoriteLoading={toggleFavoriteLoading}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  
  if (activeGame === "match") {
    if (quizData.length === 0 && quizState === "playing") {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold">Đang tải câu hỏi...</p>
          </div>
        </div>
      );
    }
    const correctAnswers = quizLog.filter((log) => log.isCorrect).length;
    const totalScore = quizLog.reduce(
      (sum, log) => sum + (log.pointsEarned || 0),
      0,
    );

    let resultMessage = "";
    if (correctAnswers === quizData.length)
      resultMessage = "Hoàn hảo! Bạn tinh mắt quá! 🎉";
    else if (matchLives === 0)
      resultMessage = "Rất tiếc! Bạn đã hết mạng. Hãy thử lại nhé! 💔";
    else resultMessage = "Khá lắm! Hãy tiếp tục luyện tập nhé! 💪";

    return (
      <div className="min-h-screen bg-gray-50 pb-20 p-6 animate-in fade-in duration-300">
        <div className="max-w-3xl mx-auto space-y-6">
          {quizState === "playing" && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-500 font-bold">
                  Tiến độ: {matchedIds.length} / {quizData.length}
                </span>
                <button
                  onClick={() => setActiveGame(null)}
                  className="text-gray-400 hover:text-red-500 font-bold flex items-center gap-1"
                >
                  <X size={20} /> Thoát
                </button>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full mb-8 overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all duration-300"
                  style={{
                    width: `${(matchedIds.length / quizData.length) * 100}%`,
                  }}
                ></div>
              </div>

              <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-6">
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 font-bold text-sm mb-2">
                    Thời gian
                  </span>
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border-4 transition-colors ${timeLeft <= 10 ? "border-red-500 text-red-500" : "border-purple-500 text-purple-600"}`}
                  >
                    {timeLeft}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 font-bold text-sm mb-2">
                    Mạng ({matchLives}/5)
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((heart) => (
                      <Heart
                        key={heart}
                        size={28}
                        className={
                          heart <= matchLives
                            ? "fill-red-500 text-red-500"
                            : "text-gray-200"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">

                <div className="flex flex-col gap-4">
                  {(matchItems.left ?? [])
                    .filter((item) => !matchedIds.includes(item.id))
                    .map((item, idx) => {
                      const isSelected =
                        selectedMatch &&
                        selectedMatch.id === item.id &&
                        selectedMatch.type === item.type;
                      const isError = errorFlash.some(
                        (e) => e.id === item.id && e.type === item.type,
                      );
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMatchClick(item)}
                          className={`p-5 rounded-2xl text-lg font-bold transition-all text-center border-2 ${
                            isError
                              ? "bg-red-50 border-red-500 text-red-700 shadow-md"
                              : isSelected
                                ? "bg-purple-100 border-purple-500 text-purple-800 shadow-md scale-105"
                                : "bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm"
                          }`}
                        >
                          {item.text}
                        </button>
                      );
                    })}
                </div>


                <div className="flex flex-col gap-4">
                  {(matchItems.right ?? [])
                    .filter((item) => !matchedIds.includes(item.id))
                    .map((item, idx) => {
                      const isSelected =
                        selectedMatch &&
                        selectedMatch.id === item.id &&
                        selectedMatch.type === item.type;
                      const isError = errorFlash.some(
                        (e) => e.id === item.id && e.type === item.type,
                      );
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMatchClick(item)}
                          className={`p-5 rounded-2xl text-lg font-bold transition-all text-center border-2 ${
                            isError
                              ? "bg-red-50 border-red-500 text-red-700 shadow-md"
                              : isSelected
                                ? "bg-purple-100 border-purple-500 text-purple-800 shadow-md scale-105"
                                : "bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm"
                          }`}
                        >
                          {item.text}
                        </button>
                      );
                    })}
                </div>
              </div>


              {matchFeedback && (
                <div
                  ref={feedbackRef}
                  className="sticky bottom-4 z-50 mt-4 animate-in slide-in-from-bottom duration-300"
                >
                  <div className="bg-white border-2 border-green-400 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={22} className="text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xl font-black text-gray-900">
                            {matchFeedback.word}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {matchFeedback.pronunciation}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold text-gray-600">
                            {matchFeedback.type}
                          </span>
                          <StatusBadge status={matchFeedback.status} />
                        </div>
                        <p className="text-green-700 font-semibold text-sm mt-0.5 truncate">
                          {matchFeedback.meaning}
                        </p>
                        {matchFeedback.example && (
                          <p className="text-gray-500 italic text-xs mt-0.5 truncate">
                            VD: "{matchFeedback.example}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => playAudio(matchFeedback.word)}
                        className="p-2 bg-gray-50 rounded-full hover:bg-green-50 text-green-700 transition-colors"
                      >
                        <Volume2 size={18} />
                      </button>
                      <button
                        onClick={() => toggleFavorite(matchFeedback.id)}
                        disabled={toggleFavoriteLoading === matchFeedback.id}
                        className="p-2 bg-gray-50 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {toggleFavoriteLoading === matchFeedback.id ? (
                          <div className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                        ) : (
                          <Heart
                            size={18}
                            fill={
                              favoriteIds.includes(matchFeedback.id)
                                ? "#ef4444"
                                : "none"
                            }
                            className={
                              favoriteIds.includes(matchFeedback.id)
                                ? "text-red-500"
                                : "text-gray-400"
                            }
                          />
                        )}
                      </button>
                      <button
                        onClick={handleMatchNext}
                        className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 text-sm"
                      >
                        Bỏ qua <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {quizState === "result" && (
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 text-center animate-in zoom-in-95">
              <div className="w-24 h-24 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy size={48} />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">
                Hoàn thành bài tập!
              </h2>
              <p className="text-gray-500 mb-8">{resultMessage}</p>

              <div className="flex justify-center gap-8 mb-10">
                <div className="bg-gray-50 p-6 rounded-2xl min-w-[150px]">
                  <p className="text-gray-500 font-bold mb-1">Số câu đúng</p>
                  <p className="text-4xl font-black text-green-600">
                    {correctAnswers}
                    <span className="text-2xl text-gray-400">
                      /{quizData.length}
                    </span>
                  </p>
                </div>
                <div className="bg-purple-50 p-6 rounded-2xl min-w-[150px]">
                  <p className="text-purple-700 font-bold mb-1">Tổng điểm</p>
                  <p className="text-4xl font-black text-purple-600">
                    +{totalScore}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <button
                  onClick={() => setQuizState("detail")}
                  className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors"
                >
                  Xem chi tiết lượt chơi
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRetryGame("match")}
                    className="flex-1 py-4 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-2xl transition-colors flex justify-center items-center gap-2"
                  >
                    <RotateCcw size={20} /> Chơi lại
                  </button>
                  <button
                    onClick={() => setActiveGame(null)}
                    className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg transition-colors"
                  >
                    Thoát
                  </button>
                </div>
              </div>
            </div>
          )}

          {quizState === "detail" && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-in slide-in-from-right">
              <div className="flex items-center mb-8">
                <button
                  onClick={() => setQuizState("result")}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 mr-4"
                >
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-black text-gray-800">
                  Chi tiết lượt chơi
                </h2>
              </div>
              <div className="mt-8">
                <VocabResultList
                  logs={quizLog}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                  toggleFavoriteLoading={toggleFavoriteLoading}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  
  if (activeGame === "listen") {
    const currentQ = quizData[currentQIndex];
    if (!currentQ && quizState === "playing") {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold">Đang tải câu hỏi...</p>
          </div>
        </div>
      );
    }
    const correctAnswers = quizLog.filter((log) => log.isCorrect).length;
    const totalScore = quizLog.reduce(
      (sum, log) => sum + (log.pointsEarned || 0),
      0,
    );

    let resultMessage =
      correctAnswers === quizData.length
        ? "Tuyệt đỉnh! Đôi tai của bạn quá nhạy bén! 🎧"
        : correctAnswers >= quizData.length / 2
          ? "Làm tốt lắm! Hãy tiếp tục luyện nghe nhé! 💪"
          : "Đừng nản chí! Nghe nhiều sẽ quen thôi! 📚";

    return (
      <div className="min-h-screen bg-gray-50 pb-20 p-6 animate-in fade-in duration-300">
        <div className="max-w-3xl mx-auto space-y-6">
          {quizState === "playing" && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">

              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-500 font-bold">
                  Câu {currentQIndex + 1} / {quizData.length}
                </span>
                <button
                  onClick={() => setActiveGame(null)}
                  className="text-gray-400 hover:text-red-500 font-bold flex items-center gap-1"
                >
                  <X size={20} /> Thoát
                </button>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full mb-8 overflow-hidden">
                <div
                  className="bg-orange-500 h-full transition-all duration-300"
                  style={{
                    width: `${(currentQIndex / quizData.length) * 100}%`,
                  }}
                ></div>
              </div>


              <div className="flex flex-col items-center mb-8 border-b border-gray-100 pb-8">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black mb-6 border-4 transition-colors ${timeLeft <= 5 ? "border-red-500 text-red-500" : "border-orange-500 text-orange-600"}`}
                >
                  {timeLeft}
                </div>

                <button
                  onClick={() => playAudio(currentQ.word)}
                  className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shadow-sm hover:scale-105 hover:bg-orange-200 transition-all mb-6"
                >
                  <Volume2 size={48} />
                </button>

                <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-bold text-gray-500 mb-4">
                  {currentQ.type}
                </span>
                {currentQ.example && (
                  <p className="text-xl text-gray-700 font-medium text-center italic max-w-lg">
                    "{getMaskedExample(currentQ.example, currentQ.word)}"
                  </p>
                )}

                <div className="mt-4 h-8 text-2xl font-black tracking-widest text-orange-600 uppercase">
                  {getMaskedWord(currentQ.word)}
                </div>
              </div>


              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  autoFocus
                  disabled={selectedAns !== null}
                  value={listenInput}
                  onChange={(e) => setListenInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleListenSubmit(false)
                  }
                  placeholder="Nhập từ bạn nghe được..."
                  className="w-full p-5 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-200 rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all disabled:opacity-50"
                />
                <div className="flex justify-between">
                  <button
                    onClick={handleUseHint}
                    disabled={hintsUsed >= 3 || selectedAns !== null}
                    className="px-6 py-3 bg-yellow-50 text-yellow-600 font-bold rounded-xl hover:bg-yellow-100 border border-yellow-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lightbulb size={20} /> Gợi ý ({3 - hintsUsed})
                  </button>
                  <button
                    onClick={() => handleListenSubmit(false)}
                    disabled={
                      listenInput.trim().length === 0 || selectedAns !== null
                    }
                    className="px-10 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Kiểm tra
                  </button>
                </div>
              </div>


              {selectedAns !== null && (
                <div
                  ref={feedbackRef}
                  className={`mt-8 p-6 rounded-2xl border-2 ${selectedAns === 1 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} animate-in fade-in zoom-in-95`}
                >
                  <h3
                    className={`text-3xl font-black mb-4 ${selectedAns === 1 ? "text-green-600" : "text-red-600"}`}
                  >
                    {selectedAns === 1
                      ? "Tuyệt vời!"
                      : `Sai rồi! Đáp án là: ${currentQ.word}`}
                  </h3>
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start">
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900">
                        {currentQ.word}
                      </h4>
                      <div className="flex items-center gap-3 text-gray-500 mt-1 mb-3">
                        <span>{currentQ.pronunciation}</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-sm font-semibold">
                          {currentQ.type}
                        </span>
                        <StatusBadge status={currentQ.status} />
                      </div>
                      <p className="text-orange-800 font-medium text-lg mb-2">
                        {currentQ.meaning}
                      </p>
                      {currentQ.example && (
                        <p className="text-gray-600 italic text-sm">
                          VD: "{currentQ.example}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => playAudio(currentQ.word)}
                        className="p-2 bg-gray-100 rounded-full hover:bg-orange-100 text-orange-700 transition-colors"
                      >
                        <Volume2 size={24} />
                      </button>
                      <button
                        onClick={() => toggleFavorite(currentQ.id)}
                        disabled={toggleFavoriteLoading === currentQ.id}
                        className="p-2 bg-gray-100 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {toggleFavoriteLoading === currentQ.id ? (
                          <div className="w-6 h-6 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <Heart
                            size={24}
                            className={
                              favoriteIds.includes(currentQ.id)
                                ? "fill-red-500 text-red-500"
                                : "text-gray-400"
                            }
                          />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleNextQuestion}
                      className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
                    >
                      Tiếp tục <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}


          {quizState === "result" && (
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 text-center animate-in zoom-in-95">
              <div className="w-24 h-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy size={48} />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">
                Hoàn thành bài tập!
              </h2>
              <p className="text-gray-500 mb-8">{resultMessage}</p>
              <div className="flex justify-center gap-8 mb-10">
                <div className="bg-gray-50 p-6 rounded-2xl min-w-[150px]">
                  <p className="text-gray-500 font-bold mb-1">Số câu đúng</p>
                  <p className="text-4xl font-black text-green-600">
                    {correctAnswers}
                    <span className="text-2xl text-gray-400">
                      /{quizData.length}
                    </span>
                  </p>
                </div>
                <div className="bg-orange-50 p-6 rounded-2xl min-w-[150px]">
                  <p className="text-orange-700 font-bold mb-1">Tổng điểm</p>
                  <p className="text-4xl font-black text-orange-600">
                    +{totalScore}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <button
                  onClick={() => setQuizState("detail")}
                  className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors"
                >
                  Xem chi tiết lượt chơi
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRetryGame("listen")}
                    className="flex-1 py-4 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-2xl transition-colors flex justify-center items-center gap-2"
                  >
                    <RotateCcw size={20} /> Chơi lại
                  </button>
                  <button
                    onClick={() => setActiveGame(null)}
                    className="flex-1 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-lg transition-colors"
                  >
                    Thoát
                  </button>
                </div>
              </div>
            </div>
          )}

          {quizState === "detail" && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-in slide-in-from-right">
              <div className="flex items-center mb-8">
                <button
                  onClick={() => setQuizState("result")}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 mr-4"
                >
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-black text-gray-800">
                  Chi tiết lượt chơi
                </h2>
              </div>
              <div className="mt-8">
                <VocabResultList
                  logs={quizLog}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                  toggleFavoriteLoading={toggleFavoriteLoading}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-slate-50 p-8 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-cyan-950 flex items-center gap-3">
              <Gamepad2 className="text-[#0e7490]" size={32} /> Khu vực Luyện
              tập
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              Tùy chỉnh bộ lọc và chọn game để bắt đầu ôn tập.
            </p>
          </div>
        </div>


        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex gap-2">
          {[
            { id: "collection", icon: BookOpen, label: "Bộ từ vựng" },
            { id: "topic", icon: CheckSquare, label: "Chủ đề" },
            { id: "smart", icon: Brain, label: "Ôn tập thông minh" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                activeMode === mode.id
                  ? "bg-cyan-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <mode.icon size={20} /> {mode.label}
            </button>
          ))}
        </div>


        {activeMode !== "smart" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-cyan-950 mb-4">
              Thiết lập dữ liệu học
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeMode === "collection" ? (
                <>
                  <FilterBox
                    title="Chọn Bộ từ vựng"
                    options={collections}
                    selectedIds={selectedCollections}
                    onChange={setSelectedCollections}
                    placeholder="Tìm bộ từ..."
                    singleSelect
                  />
                  <FilterBox
                    title="Trạng thái từ vựng"
                    options={STATUS_OPTIONS}
                    selectedIds={selectedStatuses}
                    onChange={toggleStatus}
                    placeholder="Tìm trạng thái..."
                  />
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 flex flex-col justify-center items-center">
                    <label className="font-bold text-cyan-900 mb-4">
                      Số lượng từ muốn ôn
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={availableCount}
                      value={wordCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setWordCount(
                          val > availableCount ? availableCount : val,
                        );
                      }}
                      className="w-32 text-center text-3xl font-black text-cyan-700 bg-white border-2 border-cyan-200 rounded-xl py-3 focus:border-cyan-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-2 italic">
                      Tối đa: {availableCount} từ
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <FilterBox
                    title="Chọn Chủ đề"
                    options={topics}
                    selectedIds={selectedTopics}
                    onChange={(ids) => {
                      setSelectedTopics(ids);
                      setSelectedLessons([]);
                    }}
                    placeholder="Tìm chủ đề..."
                    singleSelect
                  />
                  <FilterBox
                    title="Chọn Bài học"
                    options={availableLessons}
                    selectedIds={selectedLessons}
                    onChange={setSelectedLessons}
                    placeholder="Tìm bài học..."
                    singleSelect
                  />
                  <div className="space-y-6">
                    <FilterBox
                      title="Trạng thái từ vựng"
                      options={STATUS_OPTIONS}
                      selectedIds={selectedStatuses}
                      onChange={toggleStatus}
                      placeholder="Tìm trạng thái..."
                    />
                  </div>
                </>
              )}
            </div>

            {activeMode === "topic" && (
              <div className="mt-6 flex items-center justify-between bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                <span className="font-bold text-cyan-800">
                  Số lượng từ vựng cần chọn:
                </span>
                {selectedLessons.length === 1 ? (
                  <span className="px-4 py-1.5 bg-white rounded-lg font-bold text-gray-600 border border-cyan-200 shadow-sm">
                    Cố định theo bài học ({availableCount} từ)
                  </span>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-cyan-700">Tùy chỉnh:</span>
                    <input
                      type="number"
                      min="20"
                      max={availableCount}
                      value={wordCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setWordCount(
                          val > availableCount ? availableCount : val,
                        );
                      }}
                      className="w-24 px-3 py-1.5 rounded-lg border border-cyan-200 outline-none text-center font-bold"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {activeMode === "smart" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-cyan-950 mb-2">
                  Ôn tập thông minh
                </h2>
                <p className="text-gray-500 font-medium">
                  Chọn từ muốn luyện hoặc để trống để chơi với 10 từ có xác suất
                  quên cao nhất.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg border border-cyan-100">
                  Đã chọn: {selectedSmartWordIds.length}
                </span>
                <span className="px-3 py-1.5 bg-[#84cc16]/10 text-[#65a30d] rounded-lg border border-[#84cc16]/20">
                  Sẽ chơi: {smartGameWords.length}
                </span>
              </div>
            </div>
            {isSmartLoading && (
              <div className="mt-4 text-sm font-bold text-gray-400">
                Đang tải danh sách từ cần ôn...
              </div>
            )}
            {!isSmartLoading && sortedSmartReviewWords.length === 0 && (
              <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm font-bold text-gray-400">
                Chưa có từ vựng nào có xác suất quên trên 50%.
              </div>
            )}
            {!isSmartLoading && sortedSmartReviewWords.length > 0 && (
              <div className="mt-5 overflow-hidden rounded-xl border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-14 px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={
                              paginatedSmartReviewWords.length > 0 &&
                              paginatedSmartReviewWords
                                .map(getSmartWordId)
                                .filter((id) => id !== null && id !== undefined)
                                .every((id) =>
                                  selectedSmartWordIds.includes(id),
                                )
                            }
                            onChange={toggleAllSmartWords}
                            className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                            aria-label="Chọn tất cả từ cần ôn"
                          />
                        </th>
                        <th className="w-16 px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-gray-500">
                          STT
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                          Từ vựng
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                          Phiên âm
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                          Loại từ
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                          Nghĩa
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-gray-500">
                          Cấp độ
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-gray-500">
                          Audio
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-gray-500">
                          Xác suất quên
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-gray-500">
                          Xoá
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {paginatedSmartReviewWords.map((item, index) => {
                        const wordId = getSmartWordId(item);
                        const selected = selectedSmartWordIds.includes(wordId);
                        const pForgetValue = getPForgetValue(item);
                        const orderNumber =
                          (smartReviewPage - 1) * SMART_WORDS_PER_PAGE +
                          index +
                          1;
                        return (
                          <tr
                            key={wordId}
                            onClick={() => toggleSmartWord(wordId)}
                            className={`cursor-pointer transition-colors ${
                              selected ? "bg-cyan-50/70" : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleSmartWord(wordId)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                aria-label={`Chọn từ ${item.word ?? ""}`}
                              />
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-bold text-gray-400">
                              {orderNumber}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-black text-cyan-950">
                                {item.word}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-500">
                              {item.pronunciation
                                ? `${item.pronunciation}`
                                : "--"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                                {formatWordType(
                                  item.wordType ?? item.word_type,
                                )}
                              </span>
                            </td>
                            <td className="max-w-md px-4 py-3 text-sm font-semibold text-gray-600">
                              {item.meaning}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                                {item.level ?? "--"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playAudio(item.word);
                                }}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 transition-colors hover:bg-cyan-100"
                                title="Nghe phát âm"
                                aria-label={`Nghe phát âm từ ${item.word ?? ""}`}
                              >
                                <Volume2 size={18} />
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`inline-flex min-w-16 justify-center rounded-lg px-3 py-1.5 text-sm font-black ${
                                  pForgetValue === null
                                    ? "bg-gray-100 text-gray-400"
                                    : pForgetValue >= 0.7
                                      ? "bg-red-50 text-red-600"
                                      : pForgetValue >= 0.4
                                        ? "bg-yellow-50 text-yellow-700"
                                        : "bg-green-50 text-green-700"
                                }`}
                              >
                                {formatPForgetPercent(item)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSmartWord(wordId);
                                }}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                                title="Xoá khỏi danh sách ôn tập"
                                aria-label={`Xoá từ ${item.word ?? ""}`}
                              >
                                <X size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={smartReviewPage}
                  totalPages={smartReviewTotalPages}
                  totalItems={sortedSmartReviewWords.length}
                  itemsPerPage={SMART_WORDS_PER_PAGE}
                  onPageChange={setSmartReviewPage}
                  itemName="từ vựng"
                  showPageNumbers={true}
                />
              </div>
            )}
          </div>
        )}


        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-cyan-950">Chọn Game</h2>
            </div>

            {isSummaryLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm font-bold">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                Đang tải...
              </div>
            ) : statusSummary ? (
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg border border-gray-200">
                  Chưa học: {statusSummary.newCount ?? 0}
                </span>
                <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
                  Đang học: {statusSummary.learningCount ?? 0}
                </span>
                <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200">
                  Đã thuộc: {statusSummary.masteredCount ?? 0}
                </span>
                <span className="px-3 py-1.5 bg-[#84cc16]/10 text-[#65a30d] rounded-lg border border-[#84cc16]/20">
                  Sẵn sàng: {availableCount}
                </span>
              </div>
            ) : (
              <div className="px-4 py-2 bg-[#84cc16]/10 text-[#65a30d] rounded-xl font-bold border border-[#84cc16]/20 transition-all">
                Sẵn sàng: {availableCount} từ vựng
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: "quiz",
                name: "Trắc nghiệm",
                icon: CheckSquare,
                color:
                  "bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-500",
                baseModifier: 1,
              },
              {
                id: "match",
                name: "Nối từ",
                icon: Gamepad2,
                color:
                  "bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-500",
                baseModifier: 1.2,
              },
              {
                id: "listen",
                name: "Nghe - Viết",
                icon: () => <div className="font-bold text-2xl">🎧</div>,
                color:
                  "bg-orange-50 text-orange-600 border-orange-200 hover:border-orange-500",
                baseModifier: 1.5,
              },
            ].map((game) => (
              <div
                key={game.id}
                className={`relative flex flex-col items-center p-8 rounded-2xl border-2 transition-all cursor-pointer group ${game.color} hover:-translate-y-1 hover:shadow-xl`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInstructionGame(game);
                  }}
                  className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-cyan-600 bg-white rounded-full shadow-sm z-10"
                  title="Hướng dẫn chơi"
                >
                  <HelpCircle size={20} />
                </button>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  {typeof game.icon === "function" ? (
                    <game.icon />
                  ) : (
                    <game.icon size={40} />
                  )}
                </div>
                <h3 className="text-xl font-black mb-4">{game.name}</h3>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartGame(game.id);
                  }}
                  className="mb-6 px-6 py-2 bg-white text-cyan-700 font-bold rounded-xl shadow-sm border border-gray-100 hover:bg-cyan-600 hover:text-white hover:shadow-md hover:scale-105 hover:border-cyan-600 transition-all duration-200 flex items-center gap-2"
                >
                  <Play size={18} /> Chơi ngay
                </button>

                <span className="mt-auto px-4 py-1.5 bg-white/60 rounded-lg text-sm font-bold backdrop-blur-sm border border-white transition-all">
                  Từ 3-10 điểm / câu
                </span>
              </div>
            ))}
          </div>
        </div>


        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <div className="flex-1 flex items-center justify-center gap-2 py-4 font-bold text-lg border-b-2 border-cyan-600 text-cyan-700 bg-cyan-50/30">
              <History size={20} /> Lịch sử chơi
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {gameHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                  Chưa có lịch sử chơi. Hãy bắt đầu một lượt luyện tập để xem
                  kết quả ở đây.
                </div>
              ) : (
                gameHistory.slice(0, 3).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {(() => {
                        const GameIcon = getHistoryGameIcon(record.gameId);

                        return (
                          <div
                            className={`w-12 h-12 ${GameIcon.bg} ${GameIcon.text} rounded-xl flex items-center justify-center`}
                          >
                            <GameIcon.icon size={24} />
                          </div>
                        );
                      })()}
                      <div>
                        <h4 className="font-bold text-cyan-950">
                          {record.gameName}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />{" "}
                            {formatHistoryDate(record.timestamp)}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
                            {record.totalQuestions} câu
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm font-bold text-green-600">
                          {record.correctAnswers} Đúng
                        </div>
                        <div className="text-sm font-bold text-red-500">
                          {record.wrongAnswers} Sai
                        </div>
                      </div>
                      <div className="w-px h-8 bg-gray-200"></div>
                      <div className="text-center w-20">
                        <div className="text-xs text-gray-500 uppercase font-bold">
                          Điểm
                        </div>
                        <div className="text-lg font-black text-yellow-600">
                          +{record.score}
                        </div>
                      </div>
                      <button
                        onClick={() => setHistoryLogView(record.logs)}
                        className="px-4 py-2 bg-white border border-gray-200 text-cyan-700 font-bold rounded-lg hover:bg-cyan-50 transition-colors text-sm"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>




      {instructionGame && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md text-3xl">
                {instructionGame.id === "quiz"
                  ? "📝"
                  : instructionGame.id === "match"
                    ? "🧩"
                    : "🎧"}
              </div>
              <h3 className="text-2xl font-black text-cyan-950 mb-4">
                Cách chơi: {instructionGame.name}
              </h3>
              <div className="text-left space-y-4 text-gray-600 font-medium">
                {instructionGame.id === "quiz" && (
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Hệ thống sẽ đưa ra một từ tiếng Anh/Nghĩa.</li>
                    <li>Bạn có 4 đáp án để lựa chọn.</li>
                    <li>Chọn đáp án đúng nhất trong thời gian quy định.</li>
                  </ul>
                )}
                {instructionGame.id === "match" && (
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      Nối các cặp Từ tiếng Anh và Nghĩa tiếng Việt tương ứng.
                    </li>
                    <li>Lần lượt click vào 2 ô để ghép cặp.</li>
                    <li>
                      Ghép đúng toàn bộ trong thời gian ngắn nhất để đạt điểm
                      cao.
                    </li>
                  </ul>
                )}
                {instructionGame.id === "listen" && (
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Nghe âm thanh phát ra của từ vựng.</li>
                    <li>Nhập chính xác từ bạn nghe được vào ô trống.</li>
                    <li>Gợi ý sẽ xuất hiện nếu bạn nhập sai nhiều lần.</li>
                  </ul>
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
              <button
                onClick={() => setInstructionGame(null)}
                className="px-10 py-3 bg-cyan-600 text-white font-bold rounded-2xl hover:bg-cyan-700 shadow-lg transition-all"
              >
                Đã rõ!
              </button>
            </div>
          </div>
        </div>
      )}


      {historyLogView && (
        <div className="fixed inset-0 bg-cyan-950/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-2xl font-black text-cyan-950 flex items-center gap-2">
                <History size={24} /> Chi tiết lượt chơi trước
              </h3>
              <button
                onClick={() => setHistoryLogView(null)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              <VocabResultList
                logs={historyLogView}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                toggleFavoriteLoading={toggleFavoriteLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}