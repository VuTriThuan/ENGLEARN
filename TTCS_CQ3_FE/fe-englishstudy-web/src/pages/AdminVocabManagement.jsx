import { toast } from "react-hot-toast";
import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  Filter,
  Plus,
  Trash2,
  Edit2,
  MoreVertical,
} from "lucide-react";
import VocabTable from "../components/VocabTable";
import SearchBar from "../components/SearchBar";
import ConfirmModal from "../components/ConfirmModal";
import FilterDropdown from "../components/FilterDropdown";
import {
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
} from "../utils/services/vocabService";
import {
  fetchTopics,
  fetchTopicVocabularies,
} from "../utils/services/topicService";
import { fetchLessons } from "../utils/services/lessonService";
import { formatWordType } from "../utils/wordFormatters";

const FILTER_OPTIONS = {
  types: ["Danh từ", "Động từ", "Tính từ", "Trạng từ"],
  levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
};

const INT_TO_LEVEL = { 1: "A1", 2: "A2", 3: "B1", 4: "B2", 5: "C1", 6: "C2" };

const getTopicId = (topic) => topic?.id ?? topic?.topicId ?? topic?.topic_id;
const getLessonId = (lesson) =>
  lesson?.id ?? lesson?.lessonId ?? lesson?.lesson_id;

export default function AdminVocabManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  const [vocabularies, setVocabularies] = useState([]);
  const [topicsData, setTopicsData] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
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

        if (!cancelled && Array.isArray(topicsList) && topicsList.length > 0) {
          const formattedTopics = topicsList.map((t) => {
            const id = getTopicId(t);
            const title = t.topicName ?? t.title ?? t.name ?? "";
            const topicLessons = Array.isArray(lessonsList)
              ? lessonsList
                  .filter(
                    (l) => (l.topicId ?? l.topic_id ?? l.topic?.id) === id,
                  )
                  .map((l) => ({
                    id: getLessonId(l),
                    name: l.name ?? l.title ?? "",
                    difficulty: l.difficulty ?? l.level ?? 1,
                  }))
              : [];
            return {
              id,
              title,
              name: title,
              totalVocab: t.totalVocab ?? t.total_vocab ?? 0,
              color: "bg-gray-100 text-gray-700",
              imageUrl:
                t.image ??
                t.imageUrl ??
                t.image_url ??
                "https://cdn-icons-png.flaticon.com/512/616/616408.png",
              lessons: topicLessons,
            };
          });
          setTopicsData(formattedTopics);

          const vocabPromises = formattedTopics.map((t) =>
            fetchTopicVocabularies(t.id).catch(() => []),
          );
          const vocabResults = await Promise.all(vocabPromises);

          let allVocabs = [];
          vocabResults.forEach((res, idx) => {
            const list = Array.isArray(res)
              ? res
              : (res?.items ?? res?.data ?? []);
            const topicId = formattedTopics[idx].id;
            const topicName = formattedTopics[idx].name;
            const mapped = list.map((v) => ({
              ...v,
              id: v.id ?? v.vocabId ?? v.vocab_id,
              topicId,
              lessonId: v.lessonId ?? v.lesson_id ?? v.lesson?.id,
              lessonName: v.lessonName ?? v.lesson_name ?? v.lesson?.name,
              topic: topicName,
              word_type: formatWordType(
                v.word_type ?? v.wordType ?? v.type ?? "Danh từ",
              ),
            }));
            allVocabs = [...allVocabs, ...mapped];
          });

          if (!cancelled) {
            setVocabularies(allVocabs);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const defaultDraftRow = {
    id: Date.now(),
    word: "",
    pronunciation: "",
    word_type: "Danh từ",
    meaning: "",
    level: 1,
    example: "",
    topic: "",
    topicId: null,
    lesson: "",
    lessonId: null,
  };
  const [draftWords, setDraftWords] = useState([{ ...defaultDraftRow }]);
  const [isSaving, setIsSaving] = useState(false);

  const [showEditWordModal, setShowEditWordModal] = useState(false);
  const [editingWords, setEditingWords] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [wordToDelete, setWordToDelete] = useState(null);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openFilterDropdown, setOpenFilterDropdown] = useState(null);
  const [filterSearch, setFilterSearch] = useState({ topics: "", lessons: "" });

  const initialFilters = { topics: [], lessons: [], types: [], levels: [] };
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);

  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleDraftFilter = (category, value) => {
    setDraftFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((v) => v !== value)
        : [...prev[category], value],
    }));
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

  const applyFilters = () => {
    setActiveFilters(draftFilters);
    setShowFilterModal(false);
    setOpenFilterDropdown(null);
  };

  const clearFilters = () => {
    setDraftFilters(initialFilters);
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

    if (activeFilters.topics.length > 0) {
      if (!activeFilters.topics.includes(word.topicId ?? null)) return false;
    }

    if (activeFilters.lessons.length > 0) {
      if (!activeFilters.lessons.includes(word.lessonId ?? null)) return false;
    }

    return true;
  });

  const handleAddDraftRow = () =>
    setDraftWords([...draftWords, { ...defaultDraftRow, id: Date.now() }]);
  const handleRemoveDraftRow = (id) =>
    setDraftWords(draftWords.filter((w) => w.id !== id));
  const handleDraftChange = (id, field, value) => {
    setDraftWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
    );
  };

  const handleCloseAddModal = () => {
    const hasUnsavedData = draftWords.some(
      (w) => w.word.trim() || w.meaning.trim(),
    );
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
  };

  const handleSaveNewWords = async () => {
    const wordsToProcess = draftWords.filter((w) => w.word.trim() !== "");

    if (wordsToProcess.length === 0) {
      toast.error("⚠️ Vui lòng nhập ít nhất 1 từ vựng!");
      return;
    }

    const hasIncompleteRow = wordsToProcess.some(
      (w) =>
        !w.topic ||
        !w.lesson ||
        !w.word.trim() ||
        !w.pronunciation.trim() ||
        !w.word_type ||
        !w.meaning.trim() ||
        !w.example.trim(),
    );

    if (hasIncompleteRow) {
      toast.error(
        "⚠️ LỖI: Vui lòng điền ĐẦY ĐỦ tất cả các cột (Chủ đề, Bài học, Từ vựng, Phiên âm, Nghĩa, Ví dụ) cho các từ bạn muốn lưu!",
      );
      return;
    }

    setIsSaving(true);

    let addedCount = 0;
    let duplicateCount = 0;
    let formatErrorCount = 0;
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
        const created = await createVocabulary({
          word: wordTrimmed,
          pronunciation: newWord.pronunciation?.trim() || "",
          wordType: formatWordType(newWord.word_type || ""),
          meaning: newWord.meaning?.trim() || "",
          level: INT_TO_LEVEL[newWord.level] ?? newWord.level ?? "A1",
          example: newWord.example || "",
          topicId: newWord.topicId,
          lessonId: newWord.lessonId,
        });

        currentVocabs.unshift({
          ...newWord,
          word: created?.word ?? wordTrimmed,
          id: created?.id ?? Date.now() + Math.random(),
          topicId: newWord.topicId,
          lessonId: newWord.lessonId,
          created_by: created?.created_by ?? created?.createdBy,
        });
        addedCount++;
      } catch {
        currentVocabs.unshift({
          ...newWord,
          word: wordTrimmed,
          id: Date.now() + Math.random(),
          topicId: newWord.topicId,
          lessonId: newWord.lessonId,
        });
        addedCount++;
      }
    }

    setVocabularies(currentVocabs);
    setIsSaving(false);

    if (addedCount > 0 && duplicateCount + formatErrorCount === 0) {
      toast.success(`✅ Thành công: Thêm ${addedCount} từ mới.`);
    } else {
      let alertMsg = `KẾT QUẢ THÊM TỪ VỰNG:\n\n`;
      if (addedCount > 0)
        alertMsg += `✅ Thành công: Thêm ${addedCount} từ mới.\n`;
      if (duplicateCount > 0)
        alertMsg += `⚠️ Bỏ qua: ${duplicateCount} từ (Đã có sẵn trong hệ thống).\n`;
      if (formatErrorCount > 0)
        alertMsg += `❌ Lỗi định dạng: ${formatErrorCount} từ (Có chứa số/kí tự lạ hoặc phiên âm thiếu dấu / /).\n`;
      toast(alertMsg);
    }

    if (addedCount > 0) forceCloseAddModal();
  };

  const handleOpenEditModal = (wordsToEdit) => {
    setEditingWords(JSON.parse(JSON.stringify(wordsToEdit)));
    setShowEditWordModal(true);
  };

  const handleEditWordChange = (id, field, value) => {
    setEditingWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
    );
  };

  const handleSaveEditedWords = async () => {
    const wordRegex = /^[a-zA-Z\s-]+$/;
    const pronunRegex = /^\/.*\/$/;
    let formatErrorCount = 0;
    let duplicateCount = 0;
    let emptyCount = 0;

    for (const word of editingWords) {
      const wordTrimmed = word.word.trim();

      if (!wordTrimmed || !word.meaning.trim()) {
        emptyCount++;
        continue;
      }

      if (!wordRegex.test(wordTrimmed)) {
        formatErrorCount++;
        continue;
      }
      if (
        word.pronunciation &&
        word.pronunciation.trim() !== "" &&
        !pronunRegex.test(word.pronunciation.trim())
      ) {
        formatErrorCount++;
        continue;
      }

      const exists = vocabularies.some(
        (v) =>
          v.id !== word.id &&
          v.word.toLowerCase() === wordTrimmed.toLowerCase(),
      );
      if (exists) {
        duplicateCount++;
        continue;
      }
    }

    if (emptyCount > 0 || formatErrorCount > 0 || duplicateCount > 0) {
      toast.error(
        `LỖI KIỂM TRA DỮ LIỆU:\n\n${emptyCount > 0 ? `- Có ${emptyCount} từ bị bỏ trống Từ tiếng Anh hoặc Nghĩa.\n` : ""}${formatErrorCount > 0 ? `- Có ${formatErrorCount} từ sai định dạng (Từ chỉ chứa chữ cái, Phiên âm phải bọc trong / /).\n` : ""}${duplicateCount > 0 ? `- Có ${duplicateCount} từ bị trùng lặp với từ khác trong hệ thống.\n` : ""}\nVui lòng kiểm tra và sửa lại!`,
      );
      return;
    }

    let hasError = false;
    await Promise.all(
      editingWords.map(async (w) => {
        try {
          await updateVocabulary(w.id, {
            word: w.word,
            pronunciation: w.pronunciation,
            wordType: formatWordType(w.word_type),
            meaning: w.meaning,
            level: INT_TO_LEVEL[w.level] ?? w.level ?? "A1",
            example: w.example,
            lessonId: w.lessonId ?? null,
          });
        } catch {
          hasError = true;
        }
      }),
    );

    if (hasError) {
      toast.error(
        "Một số từ cập nhật thất bại. Vui lòng kiểm tra kết nối và thử lại.",
      );
      return;
    }

    setVocabularies((prev) =>
      prev.map((cw) => {
        const edited = editingWords.find((ew) => ew.id === cw.id);
        return edited ? edited : cw;
      }),
    );

    toast.success("✅ Đã cập nhật thông tin từ vựng thành công!");
    setShowEditWordModal(false);
  };

  const handleOpenDeleteModal = (word = null) => {
    setWordToDelete(word);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!wordToDelete) return;
    try {
      await deleteVocabulary(wordToDelete.id).catch(() => {});
      setVocabularies(vocabularies.filter((v) => v.id !== wordToDelete.id));
    } finally {
      setShowDeleteModal(false);
      setWordToDelete(null);
    }
  };

  const AdminActionColumn = ({ item }) => {
    return (
      <div className="relative flex justify-center">
        {openMenuId === item.id && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpenMenuId(null)}
          />
        )}

        <button
          onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
          className="p-2 text-gray-400 hover:text-cyan-700 hover:bg-cyan-50 rounded-full transition-colors"
        >
          <MoreVertical size={20} />
        </button>

        {openMenuId === item.id && (
          <div className="absolute right-8 top-0 w-36 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-50 text-left">
            <button
              onClick={() => {
                handleOpenEditModal([item]);
                setOpenMenuId(null);
              }}
              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 text-left font-medium flex items-center gap-2"
            >
              <Edit2 size={16} /> Chỉnh sửa
            </button>
            <button
              onClick={() => {
                handleOpenDeleteModal(item);
                setOpenMenuId(null);
              }}
              className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left font-medium flex items-center gap-2"
            >
              <Trash2 size={16} /> Xóa từ
            </button>
          </div>
        )}
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
            onClear={() => {
              const empty = { topics: [], lessons: [], types: [], levels: [] };
              setActiveFilters(empty);
              setDraftFilters(empty);
            }}
            dropdownWidth="w-72"
            position="right-0"
            title="Lọc từ vựng"
          >
            <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
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
            {(topicsData ?? [])
              .filter((t) =>
                (t?.name ?? "")
                  .toLowerCase()
                  .includes((filterSearch?.topics ?? "").toLowerCase()),
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
                        ? activeFilters.topics.filter((id) => id !== topic.id)
                        : [...activeFilters.topics, topic.id];

                      let newLessons = activeFilters.lessons;

                      if (!newTopics.includes(topic.id)) {
                        const topicLessonIds = (topic.lessons ?? []).map(
                          (l) => l.id,
                        );
                        newLessons = newLessons.filter(
                          (lid) => !topicLessonIds.includes(lid),
                        );
                      }

                      setActiveFilters({
                        ...activeFilters,
                        topics: newTopics,
                        lessons: newLessons,
                      });
                    }}
                    className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                  />

                  <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                    {topic.name ?? ""}
                  </span>
                </label>
              ))}
            <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-2">
              Bài học
            </div>
            {activeFilters.topics.length === 0 ? (
              <div className="px-4 py-2 text-xs text-gray-400 italic">
                Vui lòng chọn chủ đề trước
              </div>
            ) : (
              <>
                <div className="px-3 pb-2">
                  <div className="relative">
                    <Search
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={14}
                    />
                    <input
                      type="text"
                      placeholder="Tìm bài học..."
                      value={filterSearch.lessons}
                      onChange={(e) =>
                        setFilterSearch({
                          ...filterSearch,
                          lessons: e.target.value,
                        })
                      }
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                </div>
                {topicsData
                  .filter((t) => activeFilters.topics.includes(t.id))
                  .flatMap((t) => t.lessons)
                  .filter((l) =>
                    l.name
                      .toLowerCase()
                      .includes(filterSearch.lessons.toLowerCase()),
                  )
                  .map((lesson) => (
                    <label
                      key={lesson.id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-cyan-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={activeFilters.lessons.includes(lesson.id)}
                        onChange={() => {
                          const newLessons = activeFilters.lessons.includes(
                            lesson.id,
                          )
                            ? activeFilters.lessons.filter(
                                (id) => id !== lesson.id,
                              )
                            : [...activeFilters.lessons, lesson.id];
                          setActiveFilters({
                            ...activeFilters,
                            lessons: newLessons,
                          });
                        }}
                        className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                        {lesson.name}
                      </span>
                    </label>
                  ))}
              </>
            )}

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
        ActionColumn={AdminActionColumn}
        showTopicColumn={true}
        showLessonColumn={true}
      />

      {showAddWordModal && (
        <div className="fixed inset-0 bg-cyan-950/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-7xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200 border border-gray-100 relative overflow-hidden">
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
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-cyan-50/50 border-b border-gray-200 text-cyan-900 text-xs uppercase tracking-wider">
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3 w-32">
                        Chủ đề <span className="text-red-500">*</span>
                      </th>
                      <th className="p-3 w-32">
                        Bài học <span className="text-red-500">*</span>
                      </th>
                      <th className="p-3 w-32">
                        Từ vựng <span className="text-red-500">*</span>
                      </th>
                      <th className="p-3 w-32">
                        Phiên âm <span className="text-red-500">*</span>
                      </th>
                      <th className="p-3 w-32">
                        Loại từ <span className="text-red-500">*</span>
                      </th>
                      <th className="p-3 w-40">
                        Nghĩa <span className="text-red-500">*</span>
                      </th>
                      <th className="p-3 w-24 text-center">
                        Cấp độ <span className="text-red-500">*</span>
                      </th>
                      <th className="p-3 w-48">
                        Ví dụ <span className="text-red-500">*</span>
                      </th>
                      <th className="p-3 w-32">
                        LEARNING <span className="text-red-500">*</span>
                      </th>
                      <th className="p-3 w-32">
                        MASTERED <span className="text-red-500">*</span>
                      </th>
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
                          <select
                            value={word.topicId ?? ""}
                            onChange={(e) => {
                              const selectedTopic = topicsData.find(
                                (t) => String(t.id) === e.target.value,
                              );
                              handleDraftChange(
                                word.id,
                                "topic",
                                selectedTopic?.name ?? "",
                              );
                              handleDraftChange(
                                word.id,
                                "topicId",
                                selectedTopic?.id ?? null,
                              );
                              handleDraftChange(word.id, "lesson", "");
                              handleDraftChange(word.id, "lessonId", null);
                            }}
                            className="w-full px-2 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-gray-700 bg-white"
                          >
                            <option value="">-- Chọn --</option>
                            {topicsData.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="p-3">
                          {(() => {
                            const selectedTopic = topicsData.find(
                              (t) => t.id === word.topicId,
                            );
                            const availableLessons = selectedTopic
                              ? selectedTopic.lessons
                              : [];
                            return (
                              <select
                                value={word.lessonId ?? ""}
                                onChange={(e) => {
                                  const selectedLesson = availableLessons.find(
                                    (l) => String(l.id) === e.target.value,
                                  );
                                  handleDraftChange(
                                    word.id,
                                    "lesson",
                                    selectedLesson?.name ?? "",
                                  );
                                  handleDraftChange(
                                    word.id,
                                    "lessonId",
                                    selectedLesson?.id ?? null,
                                  );
                                }}
                                disabled={!word.topicId}
                                className={`w-full px-2 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm bg-white ${
                                  !word.topicId
                                    ? "opacity-50 cursor-not-allowed text-gray-400"
                                    : "text-gray-700"
                                }`}
                              >
                                <option value="">-- Chọn --</option>
                                {availableLessons.map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.name}
                                  </option>
                                ))}
                              </select>
                            );
                          })()}
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Apple"
                            value={word.word}
                            onChange={(e) =>
                              handleDraftChange(word.id, "word", e.target.value)
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
                          <select
                            value={word.word_type}
                            onChange={(e) =>
                              handleDraftChange(
                                word.id,
                                "word_type",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-gray-600 bg-white"
                          >
                            <option value="Danh từ">Danh từ</option>
                            <option value="Động từ">Động từ</option>
                            <option value="Tính từ">Tính từ</option>
                            <option value="Trạng từ">Trạng từ</option>
                          </select>
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
                          <select
                            value={word.level}
                            onChange={(e) =>
                              handleDraftChange(
                                word.id,
                                "level",
                                parseInt(e.target.value),
                              )
                            }
                            className="w-full px-2 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm font-bold text-blue-600 bg-white text-center"
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
                className={`px-8 py-2.5 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 ${
                  isSaving
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-[#65a30d] hover:bg-[#4d7c0f] text-white hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                {isSaving ? "Đang kiểm tra dữ liệu..." : "Lưu từ vựng"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showExitWarning}
        onClose={() => setShowExitWarning(false)}
        onConfirm={forceCloseAddModal}
        title="Bạn có chắc chắn muốn thoát?"
        message="Các thông tin bạn vừa nhập sẽ không được lưu lại."
        confirmText="Thoát và Hủy bỏ"
        cancelText="Ở lại"
        isDanger={true}
      />

      {showEditWordModal && (
        <div className="fixed inset-0 bg-cyan-950/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-7xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200 border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
              <h2 className="text-xl font-bold text-cyan-950 flex items-center gap-2">
                <Edit2 className="text-cyan-600" /> Chỉnh sửa{" "}
                {editingWords.length} từ vựng
              </h2>
              <button
                onClick={() => setShowEditWordModal(false)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-cyan-50/50 border-b border-gray-200 text-cyan-900 text-xs uppercase tracking-wider">
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3 w-32">
                        Từ vựng <span className="text-red-500">*</span>
                      </th>
                      <th className="p-3 w-32">Phiên âm</th>
                      <th className="p-3 w-32">Loại từ</th>
                      <th className="p-3 w-40">
                        Nghĩa <span className="text-red-500">*</span>
                      </th>
                      <th className="p-3 w-24 text-center">Cấp độ</th>
                      <th className="p-3 w-48">Ví dụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingWords.map((word, index) => (
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
                            value={word.word}
                            onChange={(e) =>
                              handleEditWordChange(
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
                            value={word.pronunciation}
                            onChange={(e) =>
                              handleEditWordChange(
                                word.id,
                                "pronunciation",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-gray-600"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={word.word_type}
                            onChange={(e) =>
                              handleEditWordChange(
                                word.id,
                                "word_type",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-gray-600 bg-white"
                          >
                            <option value="Danh từ">Danh từ</option>
                            <option value="Động từ">Động từ</option>
                            <option value="Tính từ">Tính từ</option>
                            <option value="Trạng từ">Trạng từ</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={word.meaning}
                            onChange={(e) =>
                              handleEditWordChange(
                                word.id,
                                "meaning",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm font-medium"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={word.level}
                            onChange={(e) =>
                              handleEditWordChange(
                                word.id,
                                "level",
                                parseInt(e.target.value),
                              )
                            }
                            className="w-full px-2 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm font-bold text-blue-600 bg-white text-center"
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
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={word.example}
                            onChange={(e) =>
                              handleEditWordChange(
                                word.id,
                                "example",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-gray-600 italic"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0 rounded-b-[1.5rem]">
              <button
                onClick={() => setShowEditWordModal(false)}
                className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 font-bold rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditedWords}
                className="px-8 py-2.5 font-bold rounded-xl shadow-lg transition-all bg-[#0e7490] hover:bg-[#164e63] text-white"
              >
                Xác nhận Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa khỏi hệ thống?"
        message={
          <span className="flex flex-wrap items-center gap-1.5">
            Bạn có chắc chắn muốn xóa từ <strong>"{wordToDelete?.word}"</strong>{" "}
            vĩnh viễn khỏi hệ thống không?
          </span>
        }
        confirmText="Xóa ngay"
        cancelText="Hủy"
        isDanger={true}
      />
    </div>
  );
}
