//Giao diện trang chủ 

import { toast } from "react-hot-toast";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Home,
  Heart,
  Library,
  LayoutGrid,
  Gamepad2,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Zap,
  BookOpen,
  User,
  Flame,
  ChevronDown,
  ChevronsUpDown,
  X,
  Mail,
  Calendar,
  Pencil,
  Download,
  LogOut,
  Cake,
  Camera,
  Save,
  ArrowLeft,
  Eye,
  MoreVertical,
  FolderPlus,
  Search,
} from "lucide-react";
import ProfileModal from "../components/ProfileModal";
import FavoritePage from "./FavoritePage";
import CollectionPage from "./CollectionPage";
import VocabularyPage from "./VocabularyPage";
import LeaderboardPage from "./LeaderboardPage";
import PracticePage from "./PracticePage";
import VocabTable from "../components/VocabTable";
import AddToCollectionModal from "../components/AddToCollectionModal";
import FlashcardLearning from "../components/FlashcardLearning";
import { getMe } from "../utils/services/authService";
import { updateMyProfile } from "../utils/services/userService";
import {
  fetchTopics,
  fetchTopicVocabularies,
} from "../utils/services/topicService";
import { fetchLessons, fetchLessonVocabularies } from "../utils/services/lessonService";
import {
  fetchCollections,
  addVocabToCollection,
} from "../utils/services/collectionService";
import {
  addFavorite,
  removeFavorite,
  fetchFavorites,
} from "../utils/services/favouriteService";
import { getLearnedVocabStats, getLessonStatusSummary } from "../utils/services/progressService";

const TOPIC_COLORS = [
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-yellow-100 text-yellow-700",
  "bg-purple-100 text-purple-700",
  "bg-red-100 text-red-700",
  "bg-indigo-100 text-indigo-700",
];

const mapPrincipalToUserData = (principal) => {
  const u = principal.user || principal;

  let joinDateFormatted =
    u.createdAt || u.created_at || u.joinDate || u.join_date || "";
  if (joinDateFormatted && joinDateFormatted.includes("T")) {
    joinDateFormatted = joinDateFormatted.split("T")[0];
  }

  return {
    username: u.username ?? u.userName ?? principal.username ?? "",
    fullName: u.fullName ?? u.full_name ?? "",
    email: u.email ?? principal.username ?? "",
    date_of_birth: u.dateOfBirth ?? u.date_of_birth ?? "",
    joinDate: joinDateFormatted,
    streak: u.streak?.currentStreak ?? u.streak ?? principal.streak ?? 0,
    bestStreak:
      u.streak?.longestStreak ??
      u.bestStreak ??
      u.best_streak ??
      principal.bestStreak ??
      0,
    lastStudyDate:
      u.streak?.lastStudyDate ??
      u.streak?.lastStudy ??
      u.lastStudyDate ??
      u.last_study_date ??
      u.lastActiveDate ??
      u.last_active_date ??
      "",
    totalXP: u.totalXP ?? u.totalScore ?? u.score ?? principal.totalXP ?? 0,
    avatarChar: (u.fullName ?? u.username ?? principal.username ?? "U")
      .slice(0, 1)
      .toUpperCase(),
    avatarUrl: u.avatarUrl ?? u.avatar_url ?? principal.avatarUrl ?? null,
  };
};

function HomePage({ onLogout, onNavigateToPractice }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [topicWordSearchTerm, setTopicWordSearchTerm] = useState("");

  
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [activeLearningTopic, setActiveLearningTopic] = useState(null);
  const [learningSearchTerm, setLearningSearchTerm] = useState("");
  const [learningDifficultyFilter, setLearningDifficultyFilter] =
    useState("all");

  const [activeFlashcardSession, setActiveFlashcardSession] = useState(null);

  const handleOpenLearning = async (topic) => {
    
    setActiveLearningTopic(topic);
    setLearningSearchTerm("");
    setLearningDifficultyFilter("all");
    setShowLearningModal(true);

    
    try {
      const lessonIds = (topic.lessons ?? []).map((l) => l.id);
      if (lessonIds.length === 0) return;

      const [vocabResults, progressResults] = await Promise.all([
        Promise.allSettled(lessonIds.map((id) => fetchLessonVocabularies(id))),
        Promise.allSettled(lessonIds.map((id) => getLessonStatusSummary(id))),
      ]);

      const lessonsWithStats = topic.lessons.map((lesson, index) => {
        const vocabResult = vocabResults[index];
        const progressResult = progressResults[index];

        const wordCount =
          vocabResult.status === 'fulfilled'
            ? (Array.isArray(vocabResult.value)
                ? vocabResult.value.length
                : (vocabResult.value?.items ?? vocabResult.value?.data ?? []).length)
            : (lesson.wordCount ?? 0);

        const summary = progressResult.status === 'fulfilled' ? progressResult.value : null;
        const masteredCount = summary?.masteredCount ?? 0;
        const learningCount = summary?.learningCount ?? 0;
        const newCount = summary?.newCount ?? 0;

        return { ...lesson, wordCount, masteredCount, learningCount, newCount };
      });

      const updatedTopic = { ...topic, lessons: lessonsWithStats };
      setActiveLearningTopic(updatedTopic);
      
      setTopics((prev) => prev.map((t) => (t.id === topic.id ? updatedTopic : t)));
    } catch {
      
    }
  };

  const [topics, setTopics] = useState([]);
  const [collections, setCollections] = useState([]);

  const getInitialMenu = () => {
    const path = window.location.pathname;
    if (path.includes("favorites")) return "Yêu thích";
    if (path.includes("collections")) return "Bộ từ vựng";
    if (path.includes("vocabulary")) return "Từ vựng";
    if (path.includes("topics")) return "Chủ đề";
    if (path.includes("practice")) return "Luyện tập";
    if (path.includes("leaderboard")) return "Bảng xếp hạng";
    return "Trang chủ";
  };
  const [activeMenu, setActiveMenu] = useState(getInitialMenu);

  useEffect(() => {
    const routeMap = {
      "Trang chủ": { path: "/home", title: "Trang chủ - EngLearn" },
      "Yêu thích": { path: "/home/favorites", title: "Yêu thích - EngLearn" },
      "Bộ từ vựng": {
        path: "/home/collections",
        title: "Bộ từ vựng - EngLearn",
      },
      "Từ vựng": { path: "/home/vocabulary", title: "Từ vựng - EngLearn" },
      "Chủ đề": { path: "/home/topics", title: "Chủ đề - EngLearn" },
      "Luyện tập": { path: "/home/practice", title: "Luyện tập - EngLearn" },
      "Bảng xếp hạng": {
        path: "/home/leaderboard",
        title: "Bảng xếp hạng - EngLearn",
      },
    };

    const route = routeMap[activeMenu];
    if (route) {
      document.title = route.title;
      if (window.location.pathname !== route.path) {
        window.history.pushState({ menu: activeMenu }, "", route.path);
      }
    }
  }, [activeMenu]);

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.menu) {
        setActiveMenu(e.state.menu);
      } else {
        const p = window.location.pathname;
        if (p.includes("favorites")) setActiveMenu("Yêu thích");
        else if (p.includes("collections")) setActiveMenu("Bộ từ vựng");
        else if (p.includes("vocabulary")) setActiveMenu("Từ vựng");
        else if (p.includes("topics")) setActiveMenu("Chủ đề");
        else if (p.includes("practice")) setActiveMenu("Luyện tập");
        else if (p.includes("leaderboard")) setActiveMenu("Bảng xếp hạng");
        else setActiveMenu("Trang chủ");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [vocabFilter, setVocabFilter] = useState(null);
  const [practiceInitialFilters, setPracticeInitialFilters] = useState(null);

  const navigateToVocabWithFilter = (status) => {
    setVocabFilter(status);
    setActiveMenu("Từ vựng");
  };

  const [userData, setUserData] = useState({
    username: "",
    fullName: "",
    email: "",
    date_of_birth: "",
    joinDate: "",
    streak: 0,
    bestStreak: 0,
    totalXP: 0,
    avatarChar: "U",
    avatarUrl: null,
  });

  const refreshUserData = useCallback(async () => {
    const principal = await getMe();
    if (!principal) return;
    setUserData(mapPrincipalToUserData(principal));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const principal = await getMe();
        if (cancelled || !principal) return;
        setUserData(mapPrincipalToUserData(principal));
      } catch {
        
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTopicsFromServer = async () => {
      try {
        const [topicsRes, lessonsRes] = await Promise.allSettled([
          fetchTopics(),
          fetchLessons(),
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

        if (cancelled) return;

        const mappedTopics = topicsList
          .map((t) => {
            const id = t.id ?? t.topicId ?? t.topic_id;
            const title = t.topicName ?? t.title ?? t.name ?? "";
            if (id === undefined || id === null) return null;

            const topicLessons = Array.isArray(lessonsList)
              ? lessonsList
                  .filter(
                    (l) => (l.topicId ?? l.topic_id ?? l.topic?.id) === id,
                  )
                  .map((l) => ({
                    id: l.id ?? l.lessonId ?? l.lesson_id,
                    name: l.name ?? l.lessonName ?? l.title ?? "",
                    difficulty: l.difficulty ?? l.level ?? 1,
                  }))
              : [];

            return {
              id,
              title,
              name: title,
              totalVocab:
                t.totalVocabulary ?? t.totalVocab ?? t.total_vocab ?? 0,
              masteredVocab: t.masteredVocab ?? t.mastered_vocab ?? 0,
              color: "bg-gray-100 text-gray-700",
              imageUrl:
                t.image ??
                t.imageUrl ??
                t.image_url ??
                "https://cdn-icons-png.flaticon.com/512/616/616408.png",
              lessons: topicLessons,
            };
          })
          .filter(Boolean);

        setTopics(mappedTopics);
      } catch {
        
      }
    };

    loadTopicsFromServer();
    return () => {
      cancelled = true;
    };
  }, []);

  
  useEffect(() => {
    let cancelled = false;
    const loadCollections = async () => {
      try {
        const collData = await fetchCollections();
        const collList = Array.isArray(collData)
          ? collData
          : (collData?.items ?? collData?.data ?? []);
        if (!cancelled && Array.isArray(collList)) {
          setCollections(
            collList.map((c) => ({
              id: c.collectionId ?? c.id,
              name: c.collectionName ?? c.name ?? "",
              wordCount: c.vocabCount ?? c.wordCount ?? 0,
            })),
          );
        }
      } catch {
        
      }
    };
    loadCollections();
    return () => {
      cancelled = true;
    };
  }, []);

  const [favoriteVocabDB, setFavoriteVocabDB] = useState([]);
  const favoriteCount = favoriteVocabDB.length;
  const [collectionVocabDB, setCollectionVocabDB] = useState([]);
  const [vocabStats, setVocabStats] = useState({
    totalLearned: 0,
    masteredCount: 0,
    learningCount: 0,
  });

  
  const refreshFavoriteCount = useCallback(async () => {
    try {
      const data = await fetchFavorites();
      const list = Array.isArray(data)
        ? data
        : (data?.items ?? data?.data ?? []);
      if (Array.isArray(list)) {
        setFavoriteVocabDB(
          list.map((f) => f.vocabId ?? f.id).filter(Boolean),
        );
      }
    } catch {
      
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await fetchFavorites();
        const list = Array.isArray(data)
          ? data
          : (data?.items ?? data?.data ?? []);
        if (!cancelled && Array.isArray(list)) {
          setFavoriteVocabDB(
            list.map((f) => f.vocabId ?? f.id).filter(Boolean),
          );
        }
      } catch {
        
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  
  useEffect(() => {
    if (activeMenu === "Trang chủ") {
      refreshFavoriteCount();
    }
  }, [activeMenu, refreshFavoriteCount]);

  
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const principal = await getMe();
        const u = principal?.user || principal;
        const userId = u?.userId ?? u?.user_id ?? u?.id;
        if (!userId) return;
        const stats = await getLearnedVocabStats(userId);
        console.log("API stats:", stats);

        if (!cancelled && stats) {
          setVocabStats({
            totalLearned: stats.totalLearned ?? 0,
            masteredCount: stats.masteredCount ?? 0,
            learningCount: stats.learningCount ?? 0,
          });
        }
      } catch {
        
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const [showTopicWordListModal, setShowTopicWordListModal] = useState(false);
  const [activeTopic, setActiveTopic] = useState(null);
  const [topicWords, setTopicWords] = useState([]);

  const [showLessonFilter, setShowLessonFilter] = useState(false);
  const [lessonSearchTerm, setLessonSearchTerm] = useState("");
  const [selectedLessonIds, setSelectedLessonIds] = useState([]);

  const [showAddToCollectionModal, setShowAddToCollectionModal] =
    useState(false);
  const [wordToAdd, setWordToAdd] = useState(null);

  const openTopicWordList = async (topic) => {
    setActiveTopic(topic);
    const allLessonIds = (topic.lessons ?? []).map((l) => l.id);
    setSelectedLessonIds(allLessonIds);
    setShowTopicWordListModal(true);
    setShowLessonFilter(false);
    setTopicWordSearchTerm("");
    setTopicWords([]);

    try {
      const rawWords = await fetchTopicVocabularies(topic.id);
      const wordsList = Array.isArray(rawWords)
        ? rawWords
        : (rawWords?.items ?? rawWords?.data ?? []);
      setTopicWords(
        wordsList.map((w) => ({
          ...w,
          id: w.id ?? w.vocabId ?? w.vocab_id,
          lessonId: w.lessonId ?? w.lesson_id ?? w.lesson?.id,
          lessonName: w.lessonName ?? w.lesson_name ?? w.lesson?.name,
          topicId: topic.id,
        })),
      );
    } catch {
      
    }
  };

  const closeTopicWordList = () => {
    setShowTopicWordListModal(false);
    setActiveTopic(null);
  };

  const handleOpenAddToCollection = (word) => {
    setWordToAdd(word);
    setShowAddToCollectionModal(true);
  };

  const handleConfirmAddToCollections = async (targetCollectionIds) => {
    let added = 0,
      duplicate = 0;

    for (const cId of targetCollectionIds) {
      try {
        await addVocabToCollection(cId, wordToAdd.id);
        added++;
      } catch {
        duplicate++;
      }
    }

    if (added > 0 && duplicate === 0) {
      toast.success(`✅ Đã thêm từ vào ${added} bộ từ thành công!`);
    } else if (added > 0) {
      toast(`Thêm ${added} thành công, bỏ qua ${duplicate} (đã tồn tại).`);
    } else {
      toast(`⚠️ Từ đã tồn tại trong các bộ được chọn.`);
    }
    setShowAddToCollectionModal(false);
  };

  const topicsRef = useRef(null);
  const mainRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const scrollToTopics = () => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    isScrollingRef.current = true;

    topicsRef.current?.scrollIntoView({ behavior: "smooth" });

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 800);
  };

  const scrollToTop = () => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    isScrollingRef.current = true;

    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 800);
  };
  const handleScroll = () => {
    if (isScrollingRef.current) return;
    if (!mainRef.current || !topicsRef.current) return;
    const mainRect = mainRef.current.getBoundingClientRect();
    const topicsRect = topicsRef.current.getBoundingClientRect();
    const distance = topicsRect.top - mainRect.top;

    setActiveMenu((prevMenu) => {
      if (prevMenu !== "Trang chủ" && prevMenu !== "Chủ đề") return prevMenu;
      const targetMenu = distance <= 300 ? "Chủ đề" : "Trang chủ";
      return prevMenu !== targetMenu ? targetMenu : prevMenu;
    });
  };

  const menuItems = [
    {
      name: "Trang chủ",
      icon: <Home size={22} />,
      active: activeMenu === "Trang chủ",
      onClick: () => {
        setActiveMenu("Trang chủ");
        scrollToTop();
      },
    },
    {
      name: "Yêu thích",
      icon: <Heart size={22} />,
      active: activeMenu === "Yêu thích",
      onClick: () => setActiveMenu("Yêu thích"),
    },
    {
      name: "Bộ từ vựng",
      icon: <Library size={22} />,
      active: activeMenu === "Bộ từ vựng",
      onClick: () => setActiveMenu("Bộ từ vựng"),
    },
    {
      name: "Từ vựng",
      icon: <BookOpen size={22} />,
      active: activeMenu === "Từ vựng",
      onClick: () => {
        setActiveMenu("Từ vựng");
        setVocabFilter(null);
      },
    },

    {
      name: "Chủ đề",
      icon: <LayoutGrid size={22} />,
      active: activeMenu === "Chủ đề",
      onClick: () => {
        setActiveMenu("Chủ đề");
        setTimeout(() => {
          scrollToTopics();
        }, 100);
      },
    },
    {
      name: "Luyện tập",
      icon: <Gamepad2 size={22} />,
      active: activeMenu === "Luyện tập",
      onClick: () => {
        setPracticeInitialFilters(null);
        setActiveMenu("Luyện tập");
      },
    },
    {
      name: "Bảng xếp hạng",
      icon: <Trophy size={22} />,
      active: activeMenu === "Bảng xếp hạng",
      onClick: () => setActiveMenu("Bảng xếp hạng"),
    },
  ];

  const currentStreak = userData.streak ?? 0;
  const bestStreak = userData.bestStreak ?? 0;

  const streakDigits = String(currentStreak).length;
  const streakNumberClass = streakDigits >= 3 ? "text-5xl" : "text-6xl";
  const streakUnitClass = streakDigits >= 3 ? "text-2xl ml-2" : "text-3xl ml-3";

  
  const TopicWordActionColumn = ({ item }) => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const isFav = favoriteVocabDB.includes(item.id);
    const btnRef = useRef(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

    const handleToggle = () => {
      if (openMenuId === item.id) {
        setOpenMenuId(null);
        return;
      }
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.left - 180 });
      }
      setOpenMenuId(item.id);
    };
    const closeMenu = () => setOpenMenuId(null);

    return (
      <div className="flex justify-center">
        <button
          ref={btnRef}
          onClick={handleToggle}
          className="p-2 text-gray-400 hover:text-cyan-700 hover:bg-cyan-50 rounded-full transition-colors"
        >
          <MoreVertical size={20} />
        </button>
        {openMenuId === item.id &&
          createPortal(
            <>
              <div className="fixed inset-0 z-[9998]" onClick={closeMenu} />
              <div
                className="fixed w-48 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-[9999] text-left"
                style={{ top: menuPos.top, left: menuPos.left }}
              >
                <button
                  onClick={() => {
                    closeMenu();
                    handleOpenAddToCollection(item);
                  }}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 font-medium flex items-center gap-2"
                >
                  <FolderPlus size={16} /> Thêm vào bộ từ
                </button>
                <button
                  onClick={async () => {
                    closeMenu();
                    try {
                      if (isFav) {
                        await removeFavorite(item.id);
                      } else {
                        await addFavorite(item.id);
                      }
                      setFavoriteVocabDB((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((v) => v !== item.id)
                          : [...prev, item.id],
                      );
                    } catch {
                      toast.error("Cập nhật yêu thích thất bại.");
                    }
                  }}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 font-medium flex justify-between items-center"
                >
                  Yêu thích{" "}
                  <Heart
                    size={16}
                    fill={isFav ? "currentColor" : "none"}
                    className={isFav ? "text-red-500" : "text-gray-400"}
                  />
                </button>
              </div>
            </>,
            document.body,
          )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-gray-800">

      <aside
        className={`${isSidebarOpen ? "w-64" : "w-20"} bg-[#083344] text-white transition-all duration-300 flex flex-col relative shadow-xl z-20`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-6 bg-[#0e7490] rounded-full p-1 text-white hover:bg-[#164e63] shadow-md"
        >
          {isSidebarOpen ? (
            <ChevronLeft size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </button>

        <div className="h-20 flex items-center justify-center font-extrabold text-2xl tracking-wide border-b border-[#164e63]">
          {isSidebarOpen ? (
            <span className="text-white">
              Eng<span className="text-[#38bdf8]">Learn</span>
            </span>
          ) : (
            "E"
          )}
        </div>

        <div className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={`flex items-center p-3 rounded-xl transition-colors ${
                item.active
                  ? "bg-[#164e63] text-[#38bdf8] font-semibold"
                  : "text-gray-300 hover:bg-[#164e63] hover:text-white"
              } ${!isSidebarOpen && "justify-center"}`}
              title={!isSidebarOpen ? item.name : ""}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              {isSidebarOpen && (
                <span className="ml-4 truncate">{item.name}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-[#164e63]">
          <div
            className={`flex items-center cursor-pointer hover:bg-[#164e63] p-2 rounded-xl transition-colors ${!isSidebarOpen && "justify-center"}`}
            onClick={() => setIsProfileModalOpen(true)}
          >
            <div className="w-10 h-10 rounded-full bg-[#0e7490] text-white flex items-center justify-center font-bold shadow-md overflow-hidden shrink-0">
              {userData.avatarUrl ? (
                <img
                  src={userData.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                userData.avatarChar
              )}
            </div>
            {isSidebarOpen && (
              <div className="ml-3 truncate">
                <p className="font-semibold text-sm truncate">
                  {userData.fullName}
                </p>
                <p className="text-xs text-[#38bdf8]">Nhấn để xem hồ sơ</p>
              </div>
            )}
          </div>
        </div>
      </aside>


      <main
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto h-screen scroll-smooth"
      >
        {(activeMenu === "Trang chủ" || activeMenu === "Chủ đề") && (
          <div className="max-w-7xl mx-auto p-8">
            <div className="flex justify-end items-center mb-8 gap-4"></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <div
                onClick={() => {
                  setPracticeInitialFilters({ mode: "smart" });
                  setActiveMenu("Luyện tập");
                }}
                className="bg-gradient-to-br from-[#0e7490] to-[#164e63] rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between relative overflow-hidden group cursor-pointer"
              >
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2">Ôn tập thông minh</h3>
                  <p className="text-[#bae6fd] text-sm leading-relaxed max-w-[80%]">
                    AI đã chuẩn bị sẵn các từ vựng bạn sắp quên. Ôn tập ngay để
                    nhớ lâu hơn!
                  </p>
                </div>
                <button className="mt-6 bg-white text-[#0e7490] w-fit px-6 py-2.5 rounded-full font-bold shadow-md hover:scale-105 hover:shadow-xl transition-all z-10">
                  Bắt đầu ôn tập
                </button>
                <Zap
                  className="absolute -bottom-6 -right-6 text-white opacity-10 group-hover:scale-110 transition-transform duration-500"
                  size={120}
                />
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col">
                <h3 className="text-lg font-bold text-[#083344] mb-4">
                  Thống kê từ vựng
                </h3>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div
                    onClick={() => navigateToVocabWithFilter("Tổng từ đã học")}
                    className="bg-blue-50 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:-translate-y-1 hover:shadow-md cursor-pointer transition-all"
                  >
                    <span className="text-blue-600 font-bold text-xl">
                      {vocabStats.totalLearned ?? "—"}
                    </span>
                    <span className="text-sm text-gray-500 font-medium mt-1">
                      Tổng từ đã học
                    </span>
                  </div>

                  <div
                    onClick={() => navigateToVocabWithFilter("Đã thuộc")}
                    className="bg-green-50 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:-translate-y-1 hover:shadow-md cursor-pointer transition-all"
                  >
                    <span className="text-green-600 font-bold text-xl">
                      {vocabStats.masteredCount ?? "—"}
                    </span>
                    <span className="text-sm text-gray-500 font-medium mt-1">
                      Đã thuộc (Mastered)
                    </span>
                  </div>

                  <div
                    onClick={() => navigateToVocabWithFilter("Chưa thuộc")}
                    className="bg-orange-50 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:-translate-y-1 hover:shadow-md cursor-pointer transition-all"
                  >
                    <span className="text-orange-500 font-bold text-xl">
                      {vocabStats.learningCount ?? "—"}
                    </span>
                    <span className="text-sm text-gray-500 font-medium mt-1 leading-tight">
                      Chưa thuộc (Learning)
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveMenu("Yêu thích")}
                    className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center border border-gray-100 text-center hover:-translate-y-1 hover:shadow-md cursor-pointer transition-all"
                  >
                    <span className="text-yellow-500 font-bold text-xl">
                      {favoriteCount}
                    </span>

                    <span className="text-sm text-gray-600 font-medium mt-1">
                      Yêu thích
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-center items-center relative overflow-hidden">
                <h3 className="text-sm font-bold mb-3 opacity-90 uppercase tracking-wider z-10 text-center">
                  Chuỗi học của bạn
                </h3>

                <div className="flex items-center gap-6 mb-6 z-10">
                  <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center shadow-inner">
                    {currentStreak === 0 ? (
                      <Flame
                        size={38}
                        fill="currentColor"
                        className="text-white"
                      />
                    ) : (
                      <div className="relative w-12 h-12 drop-shadow-sm">
                        <Flame
                          size={48}
                          fill="currentColor"
                          className="absolute inset-0 m-auto text-orange-500"
                        />
                        <Flame
                          size={34}
                          fill="currentColor"
                          className="absolute inset-0 m-auto text-yellow-200"
                          style={{ transform: "translateY(2px)" }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <div
                      className={`${streakNumberClass} font-black leading-none whitespace-nowrap`}
                    >
                      {currentStreak === 0 ? (
                        <span className="text-red-900 drop-shadow-sm">0</span>
                      ) : (
                        <span className="text-orange-300 drop-shadow-sm">
                          {currentStreak}
                        </span>
                      )}
                      <span
                        className={`${streakUnitClass} font-bold opacity-90`}
                      >
                        ngày
                      </span>
                    </div>
                    <div className="text-lg font-semibold opacity-95 mt-2">
                      Kỷ lục: <span className="font-black">{bestStreak}</span>{" "}
                      ngày
                    </div>
                  </div>
                </div>

                <div className="text-sm opacity-80 z-10 text-center flex items-center justify-center gap-1.5">
                  <span>Ngày học gần nhất:</span>
                  <span className="font-bold">
                    {userData.lastStudyDate
                      ? new Date(userData.lastStudyDate).toLocaleDateString(
                          "vi-VN",
                        )
                      : "Chưa có dữ liệu"}
                  </span>
                </div>

                <Flame
                  className="absolute -bottom-10 -right-4 text-white opacity-10 pointer-events-none"
                  size={150}
                />
              </div>
            </div>


            <div className="mb-10">
              <h2 className="text-xl font-bold text-[#083344] mb-4 text-center">
                Truy cập nhanh
              </h2>
              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={() => {
                    setActiveMenu("Chủ đề");
                    scrollToTopics();
                  }}
                  className="flex items-center px-6 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-[#0e7490] hover:shadow-md transition-all group min-w-[200px]"
                >
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
                    <BookOpen size={24} />
                  </div>
                  <div className="ml-4 text-left">
                    <p className="font-bold text-gray-800">Học bài</p>
                    <p className="text-xs text-gray-500">Khám phá chủ đề</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPracticeInitialFilters(null);
                    setActiveMenu("Luyện tập");
                  }}
                  className="flex items-center px-6 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-purple-500 hover:shadow-md transition-all group min-w-[200px]"
                >
                  <div className="bg-purple-100 p-3 rounded-full text-purple-600 group-hover:scale-110 transition-transform">
                    <Gamepad2 size={24} />
                  </div>
                  <div className="ml-4 text-left">
                    <p className="font-bold text-gray-800">Luyện tập</p>
                    <p className="text-xs text-gray-500">Flashcard & Game</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveMenu("Bảng xếp hạng")}
                  className="flex items-center px-6 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-yellow-500 hover:shadow-md transition-all group min-w-[200px]"
                >
                  <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 group-hover:scale-110 transition-transform">
                    <Trophy size={24} />
                  </div>
                  <div className="ml-4 text-left">
                    <p className="font-bold text-gray-800">Xếp hạng</p>
                    <p className="text-xs text-gray-500">Xem thành tích</p>
                  </div>
                </button>
              </div>
            </div>


            <div ref={topicsRef} className="pt-8">
              <h2 className="text-2xl font-bold text-[#083344] mb-6 border-b-2 border-gray-200 pb-2 inline-block">
                Chủ đề từ vựng
              </h2>

              {topics.length === 0 && (
                <p className="text-gray-400 text-center py-8">
                  Chưa có chủ đề nào. Dữ liệu sẽ tải từ server.
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {topics.map((topic, topicIdx) => (
                  <div
                    key={topic.id}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[14rem]"
                  >
                    <div
                      className={topic.totalVocab > 0 ? "cursor-pointer" : ""}
                      onClick={() => {
                        if (topic.totalVocab > 0) handleOpenLearning(topic);
                      }}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 p-1 ${TOPIC_COLORS[topicIdx % TOPIC_COLORS.length]}`}
                      >
                        {topic.imageUrl ? (
                          <img
                            src={topic.imageUrl}
                            alt={topic.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-2xl font-bold">
                            {(topic.title ?? "?").slice(0, 1)}
                          </span>
                        )}
                      </div>
                      <h3
                        className="font-bold text-gray-800 mb-3 line-clamp-1"
                        title={topic.title}
                      >
                        {topic.title}
                      </h3>

                      <div className="flex flex-col gap-2.5 mb-4">
                        <span className="text-xs text-gray-600 font-medium bg-gray-100/80 px-3 py-1.5 rounded-lg w-fit">
                          Số từ: {topic.totalVocab} từ
                        </span>

                        {topic.masteredVocab === topic.totalVocab ? (
                          <span className="text-[11px] font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg w-fit">
                            Đã hoàn thành
                          </span>
                        ) : topic.masteredVocab === 0 ? (
                          <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg w-fit">
                            Chưa học
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1.5 w-full pr-4 mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500"
                                style={{
                                  width: `${(topic.masteredVocab / topic.totalVocab) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-[10px] text-gray-500 font-bold">
                              {topic.masteredVocab}/{topic.totalVocab} đã thuộc
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center gap-2">
                      <button
                        onClick={() => openTopicWordList(topic)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-cyan-700 hover:bg-cyan-50 border border-cyan-100 transition-colors shrink-0 shadow-sm"
                      >
                        <Eye size={16} /> Xem từ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-40"></div>
          </div>
        )}

        {activeMenu === "Yêu thích" && (
          <FavoritePage
            onFavoriteChange={(vocabId, added) => {
              setFavoriteVocabDB((prev) =>
                added
                  ? prev.includes(vocabId) ? prev : [...prev, vocabId]
                  : prev.filter((id) => id !== vocabId)
              );
            }}
          />
        )}

        {activeMenu === "Bộ từ vựng" && (
          <CollectionPage
            onNavigateToPractice={(filters) => {
              setPracticeInitialFilters(filters);
              setActiveMenu("Luyện tập");
            }}
          />
        )}

        {activeMenu === "Từ vựng" && (
          <VocabularyPage initialFilter={vocabFilter} />
        )}

        {activeMenu === "Luyện tập" && (
          <PracticePage
            initialFilters={practiceInitialFilters}
            onBack={() => setActiveMenu("Trang chủ")}
            onGameFinished={refreshUserData}
          />
        )}

        {activeMenu === "Bảng xếp hạng" && <LeaderboardPage />}
      </main>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={{
          ...userData,
          streak: userData.streak,
          xp: userData.totalXP ?? 0,
          join_date: userData.joinDate,
        }}
        isEditable={true}
        onSave={async (updatedData) => {
          try {
            const payload = {
              username: updatedData.username,
              fullName: updatedData.fullName,
              email: updatedData.email,
              date_of_birth: updatedData.date_of_birth,
              avatarUrl: updatedData.avatarUrl,
            };
            const saved = await updateMyProfile(payload).catch(() => null);
            setUserData({
              ...updatedData,
              username: saved?.username ?? updatedData.username,
              fullName:
                saved?.fullName ?? saved?.full_name ?? updatedData.fullName,
              email: saved?.email ?? updatedData.email,
              date_of_birth:
                saved?.date_of_birth ??
                saved?.dateOfBirth ??
                updatedData.date_of_birth,
              avatarUrl:
                saved?.avatarUrl ?? saved?.avatar_url ?? updatedData.avatarUrl,
            });
          } catch {
            
            setUserData(updatedData);
          } finally {
            setIsProfileModalOpen(false);
          }
        }}
        onLogout={onLogout}
      />




      {showTopicWordListModal && activeTopic && (
        <div className="fixed inset-0 bg-cyan-950/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-6xl w-full border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-cyan-950 flex items-center gap-2">
                  <BookOpen className="text-cyan-600" /> Chủ đề:{" "}
                  {activeTopic.title}
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-56">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Tìm từ vựng..."
                    value={topicWordSearchTerm}
                    onChange={(e) => setTopicWordSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all outline-none"
                  />
                </div>


                <div className="relative">
                  <button
                    onClick={() => setShowLessonFilter(!showLessonFilter)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 text-gray-700"
                  >
                    Lọc bài học ({selectedLessonIds.length}/
                    {activeTopic.lessons.length}) <ChevronDown size={16} />
                  </button>
                  {showLessonFilter && (
                    <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search
                            size={14}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            placeholder="Tìm bài học..."
                            value={lessonSearchTerm}
                            onChange={(e) =>
                              setLessonSearchTerm(e.target.value)
                            }
                            className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-2 scrollbar-thin">
                        <label className="flex items-center gap-2 p-2 hover:bg-cyan-50 rounded cursor-pointer font-bold text-cyan-900 text-sm border-b border-gray-50">
                          <input
                            type="checkbox"
                            checked={
                              selectedLessonIds.length ===
                                activeTopic.lessons.length &&
                              activeTopic.lessons.length > 0
                            }
                            onChange={() =>
                              setSelectedLessonIds(
                                selectedLessonIds.length ===
                                  activeTopic.lessons.length
                                  ? []
                                  : activeTopic.lessons.map((l) => l.id),
                              )
                            }
                            className="rounded text-cyan-600 w-4 h-4 cursor-pointer"
                          />
                          Chọn tất cả bài học
                        </label>
                        {activeTopic.lessons
                          .filter((l) =>
                            l.name
                              .toLowerCase()
                              .includes(lessonSearchTerm.toLowerCase()),
                          )
                          .map((lesson) => (
                            <label
                              key={lesson.id}
                              className="flex items-center gap-2 p-2 hover:bg-cyan-50 rounded cursor-pointer text-sm font-medium text-gray-700"
                            >
                              <input
                                type="checkbox"
                                checked={selectedLessonIds.includes(lesson.id)}
                                onChange={() =>
                                  setSelectedLessonIds((prev) =>
                                    prev.includes(lesson.id)
                                      ? prev.filter((id) => id !== lesson.id)
                                      : [...prev, lesson.id],
                                  )
                                }
                                className="rounded text-cyan-600 w-4 h-4 cursor-pointer"
                              />
                              {lesson.name}
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-px h-8 bg-gray-200 mx-1"></div>
                <button
                  onClick={closeTopicWordList}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <VocabTable
                words={topicWords.filter((w) =>
                  selectedLessonIds.includes(w.lessonId),
                )}
                searchTerm={topicWordSearchTerm}
                ActionColumn={TopicWordActionColumn}
              />
            </div>
          </div>
        </div>
      )}


      <AddToCollectionModal
        isOpen={showAddToCollectionModal}
        onClose={() => setShowAddToCollectionModal(false)}
        wordToAdd={wordToAdd}
        collections={collections}
        onConfirm={handleConfirmAddToCollections}
      />


      {showLearningModal && activeLearningTopic && (
        <div className="fixed inset-0 bg-cyan-950/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-gray-100 flex flex-col max-h-[85vh] animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0 bg-cyan-50/50 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-black text-cyan-950 flex items-center gap-3">
                  <Gamepad2 className="text-[#0e7490]" size={28} />
                  Vào học: {activeLearningTopic.title}
                </h2>
                <p className="text-gray-500 mt-1 font-medium">
                  Chọn một bài học dưới đây để bắt đầu quá trình luyện tập.
                </p>
              </div>
              <button
                onClick={() => setShowLearningModal(false)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors self-start"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 flex gap-4 bg-white shrink-0">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài học..."
                  value={learningSearchTerm}
                  onChange={(e) => setLearningSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all outline-none"
                />
              </div>
              <div className="relative w-48">
                <select
                  value={learningDifficultyFilter}
                  onChange={(e) => setLearningDifficultyFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-cyan-900 focus:ring-2 focus:ring-cyan-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="all">Tất cả độ khó</option>
                  <option value="1">A1 - Cơ bản</option>
                  <option value="2">A2 - Sơ cấp</option>
                  <option value="3">B1 - Trung cấp</option>
                  <option value="4">B2 - Thượng cấp</option>
                  <option value="5">C1 - Nâng cao</option>
                  <option value="6">C2 - Thành thạo</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-700 pointer-events-none"
                  size={16}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 scrollbar-thin">
              {activeLearningTopic.lessons
                .filter((lesson) =>
                  lesson.name
                    .toLowerCase()
                    .includes(learningSearchTerm.toLowerCase()),
                )
                .filter(
                  (lesson) =>
                    learningDifficultyFilter === "all" ||
                    lesson.difficulty === parseInt(learningDifficultyFilter),
                )
                .map((lesson, index) => {
                  const difficultyLabels = {
                    1: "A1",
                    2: "A2",
                    3: "B1",
                    4: "B2",
                    5: "C1",
                    6: "C2",
                  };
                  const wordCount = lesson.wordCount ?? 0;
                  const masteredCount = lesson.masteredCount ?? 0;
                  const learningCount = lesson.learningCount ?? 0;
                  const progressPct = wordCount > 0
                    ? Math.round((masteredCount / wordCount) * 100)
                    : 0;

                  return (
                    <div
                      key={lesson.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:border-cyan-400 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold border border-cyan-100 shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 text-lg group-hover:text-cyan-700 transition-colors truncate">
                              {lesson.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">

                              <span className="text-[11px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md shrink-0">
                                Độ khó: {difficultyLabels[lesson.difficulty]}
                              </span>

                              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">
                                 {wordCount} từ
                              </span>

                              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                                 {masteredCount} đã thuộc
                              </span>

                              {learningCount > 0 && (
                                <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md shrink-0">
                                  ⟳ {learningCount} đang học
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setShowLearningModal(false);
                            setActiveFlashcardSession({
                              topic: activeLearningTopic,
                              lesson,
                            });
                          }}
                          className="px-6 py-2.5 bg-white border-2 border-cyan-500 text-cyan-600 font-bold rounded-xl group-hover:bg-gradient-to-r group-hover:from-cyan-600 group-hover:to-[#0e7490] group-hover:text-white group-hover:border-transparent group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all duration-300 shrink-0"
                        >
                          Học bài
                        </button>
                      </div>


                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-gray-400 font-medium">Tiến độ học</span>
                          <span
                            className={`text-[11px] font-bold ${
                              progressPct === 100 ? 'text-emerald-600' :
                              progressPct > 50 ? 'text-cyan-600' : 'text-amber-600'
                            }`}
                          >
                            {progressPct === 100 ? 'Hoàn thành!' : `${progressPct}%`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${progressPct}%`,
                              background: progressPct === 100
                                ? 'linear-gradient(90deg,#10b981,#059669)'
                                : progressPct > 50
                                ? 'linear-gradient(90deg,#06b6d4,#0891b2)'
                                : progressPct > 0
                                ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                                : '#e5e7eb',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

              {activeLearningTopic.lessons.filter((lesson) =>
                lesson.name
                  .toLowerCase()
                  .includes(learningSearchTerm.toLowerCase()),
              ).length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <p>Không tìm thấy bài học nào phù hợp với bộ lọc.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {activeFlashcardSession && (
        <FlashcardLearning
          topic={activeFlashcardSession.topic}
          lesson={activeFlashcardSession.lesson}
          onExit={() => {
            setActiveFlashcardSession(null);
            setShowLearningModal(true);
          }}
          onNextLesson={(nextLesson) =>
            setActiveFlashcardSession({
              topic: activeFlashcardSession.topic,
              lesson: nextLesson,
            })
          }
          onPrevLesson={(prevLesson) =>
            setActiveFlashcardSession({
              topic: activeFlashcardSession.topic,
              lesson: prevLesson,
            })
          }
          onPractice={() => {
            setPracticeInitialFilters({
              mode: "topic",
              topicId: activeFlashcardSession.topic.id,
              lessonId: activeFlashcardSession.lesson.id,
            });
            setActiveFlashcardSession(null);
            setActiveMenu("Luyện tập");
          }}
        />
      )}
    </div>
  );
}
export default HomePage;