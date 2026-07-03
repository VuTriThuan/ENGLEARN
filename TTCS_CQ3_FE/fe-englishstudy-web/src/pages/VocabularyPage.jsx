import { toast } from "react-hot-toast";
import React, { useState, useRef, useEffect } from "react";
import {
  FolderPlus,
  Search,
  X,
  Filter,
  Heart,
  Plus,
  Upload,
  FileText,
  Zap,
  ChevronDown,
  Trash2,
  HelpCircle,
  Download,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import VocabTable from "../components/VocabTable";
import AddToCollectionModal from "../components/AddToCollectionModal";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import {
  downloadVocabImportTemplate,
  importVocabulariesCsv,
  fetchUserVocabularies,
  createVocabulary,
} from "../utils/services/vocabService";
import {
  addFavorite,
  removeFavorite,
  fetchFavorites,
} from "../utils/services/favouriteService";
import {
  addVocabToCollection,
  fetchCollections,
  fetchCollectionVocabs,
} from "../utils/services/collectionService";
import { getLearnedVocabStats } from "../utils/services/progressService";
import {
  fetchTopics,
  fetchTopicVocabularies,
} from "../utils/services/topicService";
import { fetchLessons } from "../utils/services/lessonService";
import { getMe } from "../utils/services/authService";
import { formatWordType } from "../utils/wordFormatters";


const FILTER_OPTIONS = {
  statuses: ["Đã thuộc", "Đã học", "Chưa thuộc", "Chưa học"],
  types: ["Danh từ", "Động từ", "Tính từ", "Trạng từ"],
  levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
};

const ITEMS_PER_PAGE = 10;

function VocabularyPage({ initialFilter }) {
  const [searchTerm, setSearchTerm] = useState("");

  const [showAddToCollectionModal, setShowAddToCollectionModal] =
    useState(false);
  const [wordToAdd, setWordToAdd] = useState(null);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [selectedCollectionIds, setSelectedCollectionIds] = useState([]);

  const [vocabularies, setVocabularies] = useState([]);
  const [collectionVocabDB, setCollectionVocabDB] = useState([]);
  const [favoriteVocabDB, setFavoriteVocabDB] = useState([]);
  const [collections, setCollections] = useState([]);
  const [topicsList, setTopicsList] = useState([]);
  
  const [collectionVocabMap, setCollectionVocabMap] = useState({});
  const [isLoadingCollectionVocabs, setIsLoadingCollectionVocabs] = useState(false);

  
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [addWordTab, setAddWordTab] = useState("manual");
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const fileInputRef = useRef(null);



  const defaultDraftRow = {
    id: Date.now(),
    word: "",
    pronunciation: "",
    word_type: "",
    meaning: "",
    level: 1,
    example: "",
  };
  const [draftWords, setDraftWords] = useState([{ ...defaultDraftRow }]);

  const [pasteText, setPasteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openFilterDropdown, setOpenFilterDropdown] = useState(null);
  const [filterSearch, setFilterSearch] = useState({
    collections: "",
    topics: "",
  });

  const initialFilters = {
    collections: [],
    topics: [],
    statuses: [],
    types: [],
    levels: [],
  };
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);


  useEffect(() => {
    const baseFilters = {
      collections: [],
      topics: [],
      statuses: [],
      types: [],
      levels: [],
    };

    if (initialFilter) {
      let statusesToSet = [initialFilter];
      if (initialFilter === "Tổng từ đã học") {
        statusesToSet = ["Đã thuộc", "Đã học", "Chưa thuộc"];
      }

      const newFilters = { ...baseFilters, statuses: statusesToSet };
      setActiveFilters(newFilters);
      setDraftFilters(newFilters);
    } else {
      setActiveFilters(baseFilters);
      setDraftFilters(baseFilters);
    }
  }, [initialFilter]);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        
        let userId = null;
        try {
          const principal = await getMe();
          const u = principal?.user || principal;
          userId = u?.userId ?? u?.user_id ?? u?.id ?? null;
        } catch {
          
        }

        
        const apiCalls = [
          fetchUserVocabularies(),
          fetchCollections(),
          fetchTopics(),
          fetchLessons(),
          fetchFavorites(),
        ];
        if (userId) apiCalls.push(getLearnedVocabStats(userId));
        const [vocabRes, collRes, topicsRes, lessonsRes, favRes, statsRes] =
          await Promise.allSettled(apiCalls);

        
        const userVocabList =
          vocabRes.status === "fulfilled"
            ? Array.isArray(vocabRes.value)
              ? vocabRes.value
              : (vocabRes.value?.items ?? vocabRes.value?.data ?? [])
            : [];

        
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

        const topicVocabResults = await Promise.allSettled(
          topicsList.map((t) => fetchTopicVocabularies(t.topicId ?? t.id)),
        );

        
        const adminVocabList = [];
        topicsList.forEach((t, idx) => {
          const res = topicVocabResults[idx];
          if (res.status === "fulfilled" && Array.isArray(res.value)) {
            const tid = t.topicId ?? t.id;
            res.value.forEach((v) => {
              v.topicId = tid;
              v._isUserCreated = false; 
            });
            adminVocabList.push(...res.value);
          }
        });

        
        
        userVocabList.forEach((v) => {
          const hasTopic = v.topicId != null || v.topic_id != null;
          const hasLesson =
            v.lessonId != null || v.lesson_id != null || v.lessonName != null;
          v._isUserCreated = !hasTopic && !hasLesson;
        });

        
        
        const seen = new Set();
        const allVocabList = [];
        for (const w of [...userVocabList, ...adminVocabList]) {
          const vid = w.vocabId ?? w.id;
          if (vid && !seen.has(vid)) {
            seen.add(vid);
            allVocabList.push(w);
          }
        }

        
        const statusMap = {};
        if (statsRes?.status === "fulfilled" && statsRes.value) {
          const statsData = statsRes.value;
          const learnedItems = Array.isArray(statsData?.learnedVocabs)
            ? statsData.learnedVocabs
            : (statsData?.items ?? statsData?.data ?? []);
          console.log("Learned vocab stats:", learnedItems);
          learnedItems.forEach((item) => {
            const vid = item.vocabId ?? item.id;
            if (vid) statusMap[vid] = item.status ?? "NEW";
          });
        }

        const STATUS_MAP = {
          NEW: "Chưa học",
          LEARNING: "Chưa thuộc",
          MASTERED: "Đã thuộc",
        };
        const LEVEL_MAP = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
        
        const favIds =
          favRes.status === "fulfilled"
            ? (Array.isArray(favRes.value)
              ? favRes.value
              : (favRes.value?.items ?? favRes.value?.data ?? [])
            )
              .map((f) => f.vocabId ?? f.id)
              .filter(Boolean)
            : [];
        if (!cancelled) setFavoriteVocabDB(favIds);

        
        const topicNameMap = {};
        topicsList.forEach((t) => {
          topicNameMap[t.topicId ?? t.id] =
            t.topicName ?? t.name ?? t.title ?? "";
        });

        
        const lessonTopicMap = {};
        
        if (lessonsList.length > 0) {
          lessonsList.forEach((l) => {
            const lid = l.lessonId ?? l.id ?? l.lesson_id;
            const tid = l.topicId ?? l.topic_id ?? l.topic?.id;
            if (lid != null && tid != null) lessonTopicMap[String(lid)] = tid;
          });
        } else {
          
          topicsList.forEach((t) => {
            const tid = t.topicId ?? t.id;
            const lessons = Array.isArray(t.lessons)
              ? t.lessons
              : Array.isArray(t.lessonList)
                ? t.lessonList
                : [];
            lessons.forEach((l) => {
              const lid = l.lessonId ?? l.id ?? l.lesson_id;
              if (lid != null) lessonTopicMap[String(lid)] = tid;
            });
          });
        }

        const formattedData = allVocabList.map((word) => {
          const vid = word.vocabId || word.id;
          const backendStatus = statusMap[vid] ?? word.status ?? "NEW";
          const resolvedTopicId =
            word.topicId ??
            (word.lessonId ? lessonTopicMap[String(word.lessonId)] : null) ??
            null;
          return {
            id: vid,
            word: word.word || "",
            word_type: formatWordType(word.wordType || word.word_type || ""),
            pronunciation: word.pronunciation || "",
            meaning: word.meaning || "",
            example: word.example || "",
            level: LEVEL_MAP[word.level] ?? word.level ?? 1,
            status: STATUS_MAP[backendStatus] || backendStatus || "Chưa học",
            pForget: word.pForget ?? null,
            isFavorite: favIds.includes(vid),
            isUserCreated: word._isUserCreated ?? false,
            topicId: resolvedTopicId,
            topic: topicNameMap[resolvedTopicId] || null,
            lessonId: word.lessonId ?? null,
            lesson: word.lessonName ?? null,
            lessonName: word.lessonName ?? null,
          };
        });
        if (!cancelled) setVocabularies(formattedData);

        
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
            const userCreatedCount = formattedData.filter(
              (w) => w.isUserCreated,
            ).length;
            const myIdx = mapped.findIndex((c) => c.name === myVocabName);
            if (myIdx !== -1) {
              const myVocab = mapped.splice(myIdx, 1)[0];
              myVocab.wordCount = userCreatedCount;
              setCollections([myVocab, ...mapped]);
            } else {
              setCollections([
                { id: 0, name: myVocabName, wordCount: userCreatedCount },
                ...mapped,
              ]);
            }
          }
        }

        
        if (!cancelled && Array.isArray(topicsList)) {
          setTopicsList(
            topicsList.map((t) => ({
              id: t.topicId ?? t.id,
              name: t.topicName ?? t.name ?? t.title ?? "",
            })),
          );
        }
      } catch (error) {
        toast.error("Lỗi khi tải danh sách từ vựng của bạn.");
        console.error(error);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDraftFilter = (category, value) => {
    setDraftFilters((prev) => {
      let newCategoryValues = prev[category].includes(value)
        ? prev[category].filter((v) => v !== value)
        : [...prev[category], value];

      if (category === "statuses") {
        if (value === "Đã học" && !prev[category].includes("Đã học")) {
          if (!newCategoryValues.includes("Đã thuộc"))
            newCategoryValues.push("Đã thuộc");
          if (!newCategoryValues.includes("Chưa thuộc"))
            newCategoryValues.push("Chưa thuộc");
        }

        const hasDaThuoc = newCategoryValues.includes("Đã thuộc");
        const hasChuaThuoc = newCategoryValues.includes("Chưa thuộc");
        const hasDaHoc = newCategoryValues.includes("Đã học");

        if (hasDaThuoc && hasChuaThuoc && !hasDaHoc) {
          newCategoryValues.push("Đã học");
        }
        if (hasDaHoc && (!hasDaThuoc || !hasChuaThuoc) && value !== "Đã học") {
          newCategoryValues = newCategoryValues.filter((v) => v !== "Đã học");
        }
      }

      return {
        ...prev,
        [category]: newCategoryValues,
      };
    });
  };

  const toggleAllDraftFilter = (category, allValues) => {
    setDraftFilters((prev) => ({
      ...prev,
      [category]:
        prev[category].length === allValues.length && allValues.length > 0
          ? []
          : allValues,
    }));
  };

  const clearFilters = () => {
    const emptyFilters = {
      collections: [],
      topics: [],
      statuses: [],
      types: [],
      levels: [],
    };
    setActiveFilters(emptyFilters);
    setDraftFilters(emptyFilters);
  };

  const LEVEL_STR_TO_INT = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

  const filteredVocabularies = vocabularies.filter((word) => {
    if (
      activeFilters.types.length > 0 &&
      !activeFilters.types.includes(word.word_type)
    )
      return false;
    if (activeFilters.levels.length > 0) {
      const levelInts = activeFilters.levels
        .map((l) => LEVEL_STR_TO_INT[l])
        .filter(Boolean);
      if (!levelInts.includes(word.level)) return false;
    }

    const wordStatus = word.status ?? "Chưa học";
    if (
      activeFilters.statuses.length > 0 &&
      !activeFilters.statuses.includes(wordStatus)
    )
      return false;

    if (activeFilters.collections.length > 0) {
      const myVocabColl = collections.find((c) => c.name === "Từ vựng của tôi");
      const myVocabCollId = myVocabColl?.id;
      const isMatch = activeFilters.collections.some((filterId) => {
        
        const isMyVocabColl =
          myVocabColl && String(filterId) === String(myVocabCollId);
        if (isMyVocabColl) return word.isUserCreated;
        const wColls = word.collectionIds || [];
        return wColls.some((id) => String(id) === String(filterId));
      });
      if (!isMatch) return false;
    }
    if (activeFilters.topics.length > 0) {
      if (
        !activeFilters.topics.some((id) => String(id) === String(word.topicId))
      )
        return false;
    }

    return true;
  });

  const handleAddDraftRow = () =>
    setDraftWords([...draftWords, { ...defaultDraftRow, id: Date.now() }]);
  const handleRemoveDraftRow = (id) =>
    setDraftWords(draftWords.filter((w) => w.id !== id));
  const handleDraftChange = (id, field, value) => {
    setDraftWords(
      draftWords.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
    );
  };

  
  const handleCloseAddModal = () => {
    const hasUnsavedData =
      addWordTab === "manual"
        ? draftWords.some((w) => w.word.trim() || w.meaning.trim())
        : pasteText.trim().length > 0;

    if (hasUnsavedData) {
      setShowExitWarning(true);
    } else {
      forceCloseAddModal();
    }
  };

  const forceCloseAddModal = () => {
    setShowAddWordModal(false);
    setShowExitWarning(false);
    setDraftWords([{ ...defaultDraftRow }]);
    setPasteText("");
    setAddWordTab("manual");
  };

  
  const handleSaveNewWords = async () => {
    let wordsToProcess = [];
    if (addWordTab === "manual") {
      wordsToProcess = draftWords.filter(
        (w) => w.word.trim() && w.meaning.trim(),
      );
    } else {
      const lines = pasteText.split("\n");
      const LEVEL_TO_INT = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
      wordsToProcess = lines
        .map((line, idx) => {
          const parts = line.split("|").map((p) => p.trim());
          if (parts.length >= 2 && parts[0] && parts[3]) {
            return {
              id: Date.now() + idx,
              word: parts[0],
              pronunciation: parts[1] || "",
              word_type: formatWordType(parts[2] || ""),
              meaning: parts[3] || "",
              level: LEVEL_TO_INT[parts[4]] || 1,
              example: parts[5] || "",
              isFavorite: false,
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    if (wordsToProcess.length === 0) {
      toast.error(
        "Vui lòng nhập ít nhất 1 từ vựng có đủ TỪ TIẾNG ANH và NGHĨA!",
      );
      return;
    }

    setIsSaving(true);

    let addedCount = 0;
    let duplicateCount = 0;
    let formatErrorCount = 0;
    let apiErrorCount = 0;
    const currentVocabs = [...vocabularies];

    const wordRegex = /^[a-zA-Z\s-]+$/;
    const pronunRegex = /^\/.*\/$/;

    for (const newWord of wordsToProcess) {
      const wordTrimmed = newWord.word.trim();

      
      if (!wordRegex.test(wordTrimmed)) {
        formatErrorCount++;
        continue;
      }
      if (
        newWord.pronunciation &&
        !pronunRegex.test(newWord.pronunciation.trim())
      ) {
        formatErrorCount++;
        continue;
      }

      
      const exists = currentVocabs.some(
        (v) => v.word.toLowerCase() === wordTrimmed.toLowerCase(),
      );
      if (exists) {
        duplicateCount++;
        continue;
      }

      
      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${wordTrimmed}`,
        );
        if (!response.ok) {
          apiErrorCount++;
          continue;
        }
      } catch (error) {
        console.warn("Lỗi kết nối API từ điển, tạm bỏ qua check ngữ nghĩa.");
      }

      
      try {
        const INT_TO_LEVEL = {
          1: "A1",
          2: "A2",
          3: "B1",
          4: "B2",
          5: "C1",
          6: "C2",
        };
        const created = await createVocabulary({
          word: wordTrimmed,
          pronunciation: newWord.pronunciation?.trim() || "",
          wordType: formatWordType(newWord.word_type || ""),
          meaning: newWord.meaning?.trim() || "",
          level: INT_TO_LEVEL[newWord.level] ?? newWord.level ?? "A1",
          example: newWord.example || "",
        });

        currentVocabs.unshift({
          ...newWord,
          word: created?.word ?? wordTrimmed,
          id: created?.vocabId ?? created?.id ?? Date.now() + Math.random(),
          createdBy: created?.createdBy,
        });
        addedCount++;
      } catch (err) {
        console.error("Lỗi lưu từ vựng:", wordTrimmed, err);
        apiErrorCount++;
      }
    }

    setVocabularies(currentVocabs);
    setIsSaving(false);

    
    if (
      addedCount > 0 &&
      duplicateCount + formatErrorCount + apiErrorCount === 0
    ) {
      toast.success(`Thành công: Thêm ${addedCount} từ mới.`);
    } else {
      let alertMsg = `KẾT QUẢ THÊM TỪ VỰNG:\n\n`;
      if (addedCount > 0)
        alertMsg += `✅ Thành công: Thêm ${addedCount} từ mới.\n`;
      if (duplicateCount > 0)
        alertMsg += `⚠️ Bỏ qua: ${duplicateCount} từ (Đã có sẵn trong hệ thống).\n`;
      if (formatErrorCount > 0)
        alertMsg += `❌ Lỗi định dạng: ${formatErrorCount} từ (Có chứa số/kí tự lạ hoặc phiên âm thiếu dấu / /).\n`;
      if (apiErrorCount > 0)
        alertMsg += `❌ Lỗi lưu: ${apiErrorCount} từ (Không tìm thấy trong từ điển hoặc từ đã tồn tại trong hệ thống).\n`;
      toast(alertMsg);
    }

    if (addedCount > 0) forceCloseAddModal();
  };

  
  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadVocabImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vocab-import.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Tải template thất bại. Vui lòng thử lại.");
    }
  };
  const triggerFileInput = () => {
    setShowImportDropdown(false);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e) => {
    if (e.target.files.length === 0) return;
    const file = e.target.files[0];
    e.target.value = null;
    setShowImportDropdown(false);

    const toastId = toast.loading("⏳ Đang import từ vựng...");
    try {
      const result = await importVocabulariesCsv(file);
      const successCount = result?.successCount ?? 0;
      const errorCount = result?.errorCount ?? 0;

      toast.dismiss(toastId);
      if (successCount === 0 && errorCount > 0) {
        toast.error(`Import thất bại: ${errorCount} từ bị lỗi. Kiểm tra lại file CSV.`);
      } else if (errorCount === 0) {
        toast.success(`Import thành công ${successCount} từ vựng vào bộ từ của bạn!`);
      } else {
        toast(`📋 Import ${successCount} từ thành công, bỏ qua ${errorCount} từ lỗi.`);
      }

      if (successCount > 0) {
        
        try {
          const freshVocabs = await fetchUserVocabularies();
          const newItems = Array.isArray(freshVocabs)
            ? freshVocabs
            : (freshVocabs?.items ?? freshVocabs?.data ?? []);
          const LEVEL_MAP = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
          const newFormatted = newItems
            .filter((v) => !v.topicId && !v.lessonId && !v.lessonName)
            .map((v) => ({
              id: v.vocabId ?? v.id,
              word: v.word || "",
              word_type: formatWordType(v.wordType || v.word_type || ""),
              pronunciation: v.pronunciation || "",
              meaning: v.meaning || "",
              example: v.example || "",
              level: LEVEL_MAP[v.level] ?? v.level ?? 1,
              status: "Chưa học",
              pForget: null,
              isFavorite: false,
              isUserCreated: true,
              topicId: null,
              topic: null,
              lessonId: null,
              lesson: null,
              lessonName: null,
            }));
          setVocabularies((prev) => {
            const existingIds = new Set(prev.map((w) => w.id));
            const brand = newFormatted.filter((w) => !existingIds.has(w.id));
            return [...brand, ...prev];
          });
        } catch {
          
        }
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Import file thất bại. Vui lòng kiểm tra định dạng CSV.");
      console.error(err);
    }
  };



  const toggleFavorite = async (id) => {
    const isFav = favoriteVocabDB.includes(id);
    try {
      if (isFav) {
        await removeFavorite(id);
      } else {
        await addFavorite(id);
      }
      setFavoriteVocabDB((prev) =>
        prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id],
      );
    } catch {
      toast.error("Cập nhật yêu thích thất bại.");
    }
  };

  
  const modalFilteredCollections = collections.filter((c) =>
    c.name !== "Từ vựng của tôi" &&
    c.name.toLowerCase().includes(modalSearchTerm.toLowerCase()),
  );

  const handleOpenAddToCollectionModal = async (word) => {
    setWordToAdd(word);
    setSelectedCollectionIds([]);
    setModalSearchTerm("");
    setShowAddToCollectionModal(true);

    
    const collectionsToFetch = collections.filter(
      (c) => c.name !== "Từ vựng của tôi" && !(c.id in collectionVocabMap)
    );
    if (collectionsToFetch.length === 0) return;

    setIsLoadingCollectionVocabs(true);
    try {
      const results = await Promise.allSettled(
        collectionsToFetch.map((c) => fetchCollectionVocabs(c.id))
      );
      setCollectionVocabMap((prev) => {
        const next = { ...prev };
        collectionsToFetch.forEach((c, idx) => {
          const res = results[idx];
          if (res.status === "fulfilled") {
            const list = Array.isArray(res.value)
              ? res.value
              : (res.value?.items ?? res.value?.data ?? []);
            next[c.id] = new Set(list.map((v) => v.vocabId ?? v.id));
          } else {
            next[c.id] = new Set();
          }
        });
        return next;
      });
    } catch {
      
    } finally {
      setIsLoadingCollectionVocabs(false);
    }
  };

  const toggleModalCollectionSelect = (id) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAllModalCollections = () => {
    if (
      selectedCollectionIds.length === modalFilteredCollections.length &&
      modalFilteredCollections.length > 0
    ) {
      setSelectedCollectionIds([]);
    } else {
      setSelectedCollectionIds(modalFilteredCollections.map((c) => c.id));
    }
  };

  const handleConfirmAddToCollections = async (targetCollectionIds) => {
    let addedCount = 0;
    let duplicateCount = 0;
    const successIds = [];

    for (const cId of targetCollectionIds) {
      try {
        await addVocabToCollection(cId, wordToAdd.id);
        addedCount++;
        successIds.push(cId);
      } catch {
        duplicateCount++;
      }
    }

    
    if (successIds.length > 0 && wordToAdd?.id) {
      setCollectionVocabMap((prev) => {
        const next = { ...prev };
        successIds.forEach((cId) => {
          const existing = next[cId] ?? new Set();
          next[cId] = new Set([...existing, wordToAdd.id]);
        });
        return next;
      });
    }

    if (addedCount > 0 && duplicateCount === 0) {
      toast.success(`Đã thêm từ "${wordToAdd?.word}" vào ${addedCount} bộ từ thành công!`);
    } else if (addedCount > 0 && duplicateCount > 0) {
      toast(`Thêm vào ${addedCount} bộ thành công, bỏ qua ${duplicateCount} bộ (từ đã tồn tại).`);
    } else {
      toast.error(`Từ "${wordToAdd?.word}" đã tồn tại trong tất cả các bộ được chọn!`);
    }

    setShowAddToCollectionModal(false);
  };

  
  const VocabularyActionColumn = ({ item }) => {
    const isFav = favoriteVocabDB.includes(item.id);

    return (
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => handleOpenAddToCollectionModal(item)}
          className="px-3 py-1.5 bg-white border border-cyan-200 text-cyan-700 rounded-lg text-xs font-bold shadow-sm hover:bg-cyan-50 transition-colors whitespace-nowrap"
        >
          + Bộ từ
        </button>
        <button
          onClick={() => toggleFavorite(item.id)}
          className="p-2 rounded-full transition-all hover:scale-110 hover:bg-red-50"
        >
          <Heart
            size={22}
            fill={isFav ? "currentColor" : "none"}
            className={`transition-colors duration-300 ${isFav ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}
          />
        </button>

      </div>
    );
  };

  const renderFilterDropdown = (
    title,
    category,
    options,
    isObject = false,
    searchKey = null,
  ) => {
    const isOpen = openFilterDropdown === category;
    let displayOptions = options;

    if (searchKey) {
      displayOptions = options.filter((opt) =>
        (isObject ? opt.name : opt)
          .toLowerCase()
          .includes(filterSearch[searchKey].toLowerCase()),
      );
    }

    const allValues = options.map((opt) => (isObject ? opt.id : opt));
    const isAllSelected =
      draftFilters[category].length === allValues.length &&
      allValues.length > 0;

    return (
      <div className="col-span-1 flex flex-col justify-start">
        <label className="block text-sm font-bold text-gray-700 mb-1.5">
          {title}
        </label>
        <div className="relative">
          <div
            onClick={() => setOpenFilterDropdown(isOpen ? null : category)}
            className={`w-full px-4 py-2.5 border rounded-xl cursor-pointer flex justify-between items-center transition-colors ${isOpen ? "bg-cyan-50 border-cyan-400" : "bg-white border-gray-300 hover:border-cyan-400"}`}
          >
            <span className="text-gray-700 font-medium truncate pr-2">
              {draftFilters[category].length === 0
                ? "Tất cả"
                : draftFilters[category].length === allValues.length
                  ? "Đã chọn tất cả"
                  : `Đã chọn (${draftFilters[category].length})`}
            </span>
            <ChevronDown
              size={18}
              className={`text-gray-400 transition-transform ${isOpen ? "rotate-180 text-cyan-600" : ""}`}
            />
          </div>

          {isOpen && (
            <div className="absolute z-[100] top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 flex flex-col overflow-hidden">
              {searchKey && (
                <div className="p-2 border-b border-gray-100 shrink-0">
                  <div className="relative">
                    <Search
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={14}
                    />
                    <input
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={filterSearch[searchKey]}
                      onChange={(e) =>
                        setFilterSearch({
                          ...filterSearch,
                          [searchKey]: e.target.value,
                        })
                      }
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                </div>
              )}
              <div className="overflow-y-auto p-2 flex-1 scrollbar-thin">
                <label className="flex items-center gap-3 p-2.5 hover:bg-cyan-50 rounded-lg cursor-pointer border-b border-gray-50 group">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => toggleAllDraftFilter(category, allValues)}
                    className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="font-bold text-cyan-900 group-hover:text-cyan-700">
                    Chọn tất cả
                  </span>
                </label>
                {displayOptions.length > 0 ? (
                  displayOptions.map((opt) => {
                    const val = isObject ? opt.id : opt;
                    const label = isObject ? opt.name : opt;
                    return (
                      <label
                        key={val}
                        className="flex items-center gap-3 p-2.5 hover:bg-cyan-50 rounded-lg cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={draftFilters[category].includes(val)}
                          onChange={() => toggleDraftFilter(category, val)}
                          className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer shrink-0"
                        />
                        <span className="text-gray-700 font-medium group-hover:text-cyan-900 truncate">
                          {label}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    Không tìm thấy kết quả.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">

      <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-200 p-4 mb-6 flex justify-between items-center transition-all">
        <div className="flex gap-4 items-center w-full max-w-xl">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm từ vựng..."
            className="flex-1"
          />
          <FilterDropdown
            label={(count) => (count > 0 ? `${count} bộ lọc` : "Bộ lọc")}
            activeCount={Object.values(activeFilters).reduce(
              (sum, arr) => sum + arr.length,
              0,
            )}
            onClear={clearFilters}
            dropdownWidth="w-72"
            position="right-0"
            title="Lọc từ vựng"
          >
            <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Trạng thái
            </div>
            {FILTER_OPTIONS.statuses.map((status) => (
              <label
                key={status}
                className="flex items-center gap-3 px-4 py-2 hover:bg-cyan-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={activeFilters.statuses.includes(status)}
                  onChange={() => {
                    let newStatuses = activeFilters.statuses.includes(status)
                      ? activeFilters.statuses.filter((s) => s !== status)
                      : [...activeFilters.statuses, status];

                    
                    if (
                      status === "Đã học" &&
                      !activeFilters.statuses.includes("Đã học")
                    ) {
                      if (!newStatuses.includes("Đã thuộc"))
                        newStatuses.push("Đã thuộc");
                      if (!newStatuses.includes("Chưa thuộc"))
                        newStatuses.push("Chưa thuộc");
                    }
                    
                    if (
                      status === "Đã học" &&
                      activeFilters.statuses.includes("Đã học")
                    ) {
                      newStatuses = newStatuses.filter(
                        (s) => s !== "Đã thuộc" && s !== "Chưa thuộc",
                      );
                    }

                    const hasDaThuoc = newStatuses.includes("Đã thuộc");
                    const hasChuaThuoc = newStatuses.includes("Chưa thuộc");
                    const hasDaHoc = newStatuses.includes("Đã học");

                    
                    if (hasDaThuoc && hasChuaThuoc && !hasDaHoc) {
                      newStatuses.push("Đã học");
                    }
                    
                    if (
                      hasDaHoc &&
                      (!hasDaThuoc || !hasChuaThuoc) &&
                      status !== "Đã học"
                    ) {
                      newStatuses = newStatuses.filter((s) => s !== "Đã học");
                    }

                    setActiveFilters({
                      ...activeFilters,
                      statuses: newStatuses,
                    });
                  }}
                  className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">
                  {status}
                </span>
              </label>
            ))}

            <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-2">
              Loại từ
            </div>
            {FILTER_OPTIONS.types.map((type) => (
              <label
                key={type}
                className="flex items-center gap-3 px-4 py-2 hover:bg-cyan-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={activeFilters.types.includes(type)}
                  onChange={() => {
                    const newTypes = activeFilters.types.includes(type)
                      ? activeFilters.types.filter((t) => t !== type)
                      : [...activeFilters.types, type];
                    setActiveFilters({ ...activeFilters, types: newTypes });
                  }}
                  className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">
                  {type}
                </span>
              </label>
            ))}

            <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-2">
              Cấp độ
            </div>
            {FILTER_OPTIONS.levels.map((level) => (
              <label
                key={level}
                className="flex items-center gap-3 px-4 py-2 hover:bg-cyan-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={activeFilters.levels.includes(level)}
                  onChange={() => {
                    const newLevels = activeFilters.levels.includes(level)
                      ? activeFilters.levels.filter((l) => l !== level)
                      : [...activeFilters.levels, level];
                    setActiveFilters({ ...activeFilters, levels: newLevels });
                  }}
                  className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">
                  {level}
                </span>
              </label>
            ))}

            <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-2">
              Bộ từ vựng
            </div>
            <div className="px-3 pb-2">
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Tìm bộ từ..."
                  value={filterSearch.collections}
                  onChange={(e) =>
                    setFilterSearch({
                      ...filterSearch,
                      collections: e.target.value,
                    })
                  }
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
            </div>
            {collections
              .filter((c) =>
                c.name
                  .toLowerCase()
                  .includes(filterSearch.collections.toLowerCase()),
              )
              .map((coll) => (
                <label
                  key={coll.id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-cyan-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.collections.includes(coll.id)}
                    onChange={() => {
                      const newColls = activeFilters.collections.includes(
                        coll.id,
                      )
                        ? activeFilters.collections.filter((c) => c !== coll.id)
                        : [...activeFilters.collections, coll.id];
                      setActiveFilters({
                        ...activeFilters,
                        collections: newColls,
                      });
                    }}
                    className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                    {coll.name}
                  </span>
                </label>
              ))}

            <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-2">
              Chủ đề
            </div>
            <div className="px-3 pb-2">
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Tìm chủ đề..."
                  value={filterSearch.topics}
                  onChange={(e) =>
                    setFilterSearch({ ...filterSearch, topics: e.target.value })
                  }
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
            </div>
            {topicsList
              .filter((t) =>
                t.name
                  .toLowerCase()
                  .includes(filterSearch.topics.toLowerCase()),
              )
              .map((topic) => (
                <label
                  key={topic.id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-cyan-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.topics.includes(topic.id)}
                    onChange={() => {
                      const newTopics = activeFilters.topics.includes(topic.id)
                        ? activeFilters.topics.filter((t) => t !== topic.id)
                        : [...activeFilters.topics, topic.id];
                      setActiveFilters({ ...activeFilters, topics: newTopics });
                    }}
                    className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                    {topic.name}
                  </span>
                </label>
              ))}
          </FilterDropdown>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={() => setShowAddWordModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-sm transition-colors mr-2"
          >
            <Plus size={20} /> Thêm từ
          </button>
        </div>
      </div>

      <VocabTable
        words={filteredVocabularies}
        searchTerm={searchTerm}
        ActionColumn={VocabularyActionColumn}
        showTopicColumn={true}
        showLessonColumn={true}
      />


      <AddToCollectionModal
        isOpen={showAddToCollectionModal}
        onClose={() => setShowAddToCollectionModal(false)}
        wordToAdd={wordToAdd}
        collections={modalFilteredCollections}
        collectionVocabMap={collectionVocabMap}
        isLoadingVocabs={isLoadingCollectionVocabs}
        onConfirm={handleConfirmAddToCollections}
      />


      {showAddWordModal && (
        <div className="fixed inset-0 bg-cyan-950/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200 border border-gray-100 relative overflow-hidden">
            <div className="p-5 border-b border-gray-100 shrink-0 bg-white z-20">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-2xl font-black text-cyan-950">
                  Thêm từ vựng mới
                </h2>
                <button
                  onClick={handleCloseAddModal}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex gap-3 items-center">
                <div className="relative">
                  <button
                    onClick={() => setShowImportDropdown(!showImportDropdown)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0e7490] hover:bg-[#164e63] text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <Upload size={18} /> Nhập file{" "}
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${showImportDropdown ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showImportDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50">
                      <button
                        onClick={triggerFileInput}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-cyan-50 text-gray-700 font-medium text-sm transition-colors"
                      >
                        <FileSpreadsheet
                          size={18}
                          className="text-emerald-600"
                        />{" "}
                        Nhập file CSV (.csv)
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".csv"
                  />
                </div>

                <button
                  onClick={() => setShowGuideModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-bold rounded-lg transition-colors shadow-sm"
                >
                  <HelpCircle size={18} className="text-cyan-600" /> Hướng dẫn
                </button>




              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">

              {addWordTab === "manual" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-cyan-50/50 border-b border-gray-200 text-cyan-900 text-xs uppercase tracking-wider">
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3 w-1/6">
                          Từ vựng <span className="text-red-500">*</span>
                        </th>
                        <th className="p-3 w-1/6">Phiên âm</th>
                        <th className="p-3 w-32">Loại từ</th>
                        <th className="p-3 w-1/6">
                          Nghĩa <span className="text-red-500">*</span>
                        </th>
                        <th className="p-3 w-28 text-center">Cấp độ</th>
                        <th className="p-3">Ví dụ</th>
                        <th className="p-3 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftWords.map((word, index) => (
                        <tr
                          key={word.id}
                          className="border-b border-gray-100 hover:bg-gray-50/50"
                        >
                          <td className="p-3 text-center text-gray-400 font-bold">
                            {index + 1}
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="Apple"
                              value={word.word}
                              onChange={(e) =>
                                handleDraftChange(
                                  word.id,
                                  "word",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm font-bold text-cyan-950"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="/ˈæp.əl/"
                              value={word.pronunciation}
                              onChange={(e) =>
                                handleDraftChange(
                                  word.id,
                                  "pronunciation",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-gray-600"
                            />
                          </td>
                          <td className="p-3">
                            <div className="relative">
                              <select
                                value={word.word_type}
                                onChange={(e) =>
                                  handleDraftChange(
                                    word.id,
                                    "word_type",
                                    e.target.value,
                                  )
                                }
                                className="w-full pl-3 pr-9 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-gray-600 bg-white appearance-none cursor-pointer"
                              >
                                <option value="">Chọn</option>
                                <option value="Danh từ">Danh từ</option>
                                <option value="Động từ">Động từ</option>
                                <option value="Tính từ">Tính từ</option>
                                <option value="Trạng từ">Trạng từ</option>
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <ChevronDown size={14} />
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="Quả táo"
                              value={word.meaning}
                              onChange={(e) =>
                                handleDraftChange(
                                  word.id,
                                  "meaning",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm font-medium"
                            />
                          </td>
                          <td className="p-3">
                            <div className="relative">
                              <select
                                value={word.level}
                                onChange={(e) =>
                                  handleDraftChange(
                                    word.id,
                                    "level",
                                    parseInt(e.target.value),
                                  )
                                }
                                className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm font-bold text-blue-600 bg-white appearance-none cursor-pointer text-center"
                              >
                                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                                  <option key={lvl} value={lvl}>
                                    {lvl === 1
                                      ? "A1"
                                      : lvl === 2
                                        ? "A2"
                                        : lvl === 3
                                          ? "B1"
                                          : lvl === 4
                                            ? "B2"
                                            : lvl === 5
                                              ? "C1"
                                              : "C2"}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
                                <ChevronDown size={14} />
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="I eat an apple."
                              value={word.example}
                              onChange={(e) =>
                                handleDraftChange(
                                  word.id,
                                  "example",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-gray-600 italic"
                            />
                          </td>
                          <td className="p-3 text-center">
                            {draftWords.length > 1 && (
                              <button
                                onClick={() => handleRemoveDraftRow(word.id)}
                                className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={handleAddDraftRow}
                    className="w-full py-3 bg-gray-50 hover:bg-cyan-50 text-cyan-700 text-sm font-bold flex justify-center items-center gap-2 border-t border-gray-200 transition-colors"
                  >
                    <Plus size={18} /> Thêm dòng
                  </button>
                </div>
              )}


              {addWordTab === "paste" && (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 flex gap-3">
                    <div className="bg-purple-200/50 p-2 rounded-lg h-fit text-purple-700">
                      <Zap size={20} fill="currentColor" />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900 mb-1 text-sm">
                        Hướng dẫn dùng AI (ChatGPT, Gemini) để tạo từ vựng:
                      </h4>
                      <p className="text-sm text-gray-700 mb-2">
                        Hãy copy đoạn lệnh (prompt) dưới đây và dán vào AI cùng
                        danh sách từ của bạn. Sau đó copy kết quả dán vào ô bên
                        dưới.
                      </p>
                      <div className="bg-white border border-purple-100 p-3 rounded-lg flex items-center justify-between group">
                        <code className="text-xs text-purple-800 font-medium">
                          Hãy tạo bảng từ vựng với các cột cách nhau bằng dấu
                          '|' theo thứ tự: Từ vựng | Phiên âm | Loại từ | Nghĩa
                          tiếng Việt | Cấp độ (A1-C2) | Câu ví dụ. Dưới đây là
                          danh sách từ của tôi: [Điền từ của bạn vào đây]
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 relative">
                    <span className="absolute top-3 left-4 text-xs font-bold text-gray-400 uppercase tracking-wider z-10">
                      Định dạng: Từ vựng | Phiên âm | Loại từ | Nghĩa | Cấp độ |
                      Ví dụ
                    </span>
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder="apple | /ˈæp.əl/ | Danh từ | quả táo | A1 | I eat an apple&#10;determine | /dɪˈtɜː.mɪn/ | Động từ | xác định | B1 | Determine your goal"
                      className="w-full h-full min-h-[300px] p-4 pt-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none font-mono text-sm leading-relaxed text-gray-700 shadow-inner"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0 rounded-b-[1.5rem]">
              <button
                onClick={handleCloseAddModal}
                className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 font-bold rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveNewWords}
                disabled={isSaving}
                className={`px-8 py-2.5 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 ${isSaving
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-[#65a30d] hover:bg-[#4d7c0f] text-white hover:shadow-xl hover:-translate-y-0.5"
                  }`}
              >
                {isSaving ? <>Đang kiểm tra dữ liệu...</> : <>Lưu từ vựng</>}
              </button>
            </div>
          </div>
        </div>
      )}


      {showGuideModal && (
        <div className="fixed inset-0 bg-cyan-950/70 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-cyan-50/30">
              <h3 className="text-xl font-bold text-cyan-950 flex items-center gap-2">
                <HelpCircle className="text-cyan-600" /> Hướng dẫn nhập từ vựng
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-sm text-gray-700 space-y-4">
              <p>
                Hệ thống hỗ trợ nhập dữ liệu hàng loạt qua file{" "}
                <strong>CSV (.csv)</strong>.
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <strong className="text-cyan-800">Cấu trúc bảng:</strong> Mỗi
                  cột tương ứng với một thuộc tính.
                </li>
                <li>
                  <strong className="text-cyan-800">
                    Thứ tự cột (Bắt buộc đúng thứ tự):
                  </strong>
                  <ol className="list-decimal pl-5 mt-1 space-y-1 text-gray-600 font-medium">
                    <li>
                      <span className="text-red-500"></span>{" "}
                      <strong className="text-gray-800">Word</strong> - Từ tiếng
                      Anh
                    </li>
                    <li>
                      <strong>Pronunciation</strong> - Phiên âm
                    </li>
                    <li>
                      <strong>Type</strong> - Loại từ (Danh từ, Động từ...)
                    </li>
                    <li>
                      <span className="text-red-500"></span>{" "}
                      <strong className="text-gray-800">Meaning</strong> - Nghĩa
                      tiếng Việt
                    </li>
                    <li>
                      <strong>Level</strong> - Cấp độ (A1, A2, B1, B2, C1, C2)
                    </li>
                    <li>
                      <strong>Example:</strong><br></br> Apple,/ˈæp.l/,Danh từ,Quả táo,A1,I eat an apple every day
                    </li>
                  </ol>
                </li>
                <li>
                  <strong className="text-cyan-800">Dòng đầu tiên:</strong> Là dòng hướng dẫn thứ tự các cột, hãy sắp xếp đúng thứ tự.
                </li>
              </ul>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#84cc16] hover:bg-[#65a30d] text-white font-bold rounded-lg shadow-md transition-colors"
                >
                  <Download size={18} /> Tải file mẫu (Template)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExitWarning && (
        <div className="fixed inset-0 bg-cyan-950/80 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-cyan-950 mb-3">
              Xác nhận thoát
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn đang có dữ liệu chưa lưu. Bạn có chắc chắn muốn thoát và hủy
              bỏ toàn bộ dữ liệu này không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExitWarning(false)}
                className="px-5 py-2.5 bg-[#84cc16] hover:bg-[#65a30d] text-white font-bold rounded-xl shadow-sm transition-colors"
              >
                Ở lại
              </button>
              <button
                onClick={forceCloseAddModal}
                className="px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-colors"
              >
                Thoát luôn
              </button>
            </div>
          </div>
        </div>
      )}




    </div>
  );
}

export default VocabularyPage;