import { toast } from "react-hot-toast";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  X,
  Filter,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Eye,
  Check,
  ChevronRight,
  Copy,
  FolderInput,
  LogOut,
  MoreVertical,
  Gamepad2,
  ChevronDown,
  Settings,
  AlertTriangle,
  Upload,
} from "lucide-react";
import VocabTable from "../components/VocabTable";
import SearchBar from "../components/SearchBar";
import ConfirmModal from "../components/ConfirmModal";
import ModalWrapper from "../components/ModalWrapper";
import FilterDropdown from "../components/FilterDropdown";
import {
  fetchTopics,
  fetchTopicById,
  createTopic as apiCreateTopic,
  updateTopic as apiUpdateTopic,
  deleteTopic as apiDeleteTopic,
  fetchTopicVocabularies,
  uploadTopicImage,
} from "../utils/services/topicService";
import {
  fetchLessons,
  fetchLessonById,
  createLesson as apiCreateLesson,
  updateLesson as apiUpdateLesson,
  deleteLesson as apiDeleteLesson,
  fetchLessonVocabularies,
} from "../utils/services/lessonService";
import {
  updateVocabulary,
  deleteVocabulary,
  fetchVocabularyById,
  adminImportVocabulariesCsv,
} from "../utils/services/vocabService";
import { formatWordType } from "../utils/wordFormatters";

export default function AdminTopicManagement() {
  const [topics, setTopics] = useState([]);
  const [allWords, setAllWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
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
          const mappedTopics = topicsList.map((t) => {
            const id = t.id ?? t.topicId ?? t.topic_id;
            const title = t.topicName ?? t.title ?? t.name ?? "";
            const imageUrl = t.image ?? t.imageUrl ?? t.image_url ?? "";
            const topicLessons = Array.isArray(lessonsList)
              ? lessonsList
                  .filter(
                    (l) => (l.topicId ?? l.topic_id ?? l.topic?.id) === id,
                  )
                  .map((l) => ({
                    id: l.id ?? l.lessonId ?? l.lesson_id,
                    name: l.name ?? l.title ?? "",
                    difficulty: l.difficulty ?? l.level ?? 1,
                    wordCount: l.wordCount ?? l.totalVocabulary ?? l.totalVocab ?? l.total_vocab ?? 0,
                  }))
              : [];
            return {
              id,
              title,
              totalVocab: t.totalVocabulary ?? t.totalVocab ?? t.total_vocab ?? 0,
              color: "bg-gray-100 text-gray-700",
              imageUrl:
                imageUrl ||
                "https://cdn-icons-png.flaticon.com/512/616/616408.png",
              lessons: topicLessons,
            };
          });
          setTopics(mappedTopics);
        }
      } catch {
        
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicImage, setNewTopicImage] = useState(""); 
  const [newTopicImageFile, setNewTopicImageFile] = useState(null); 
  const [newTopicImageTab, setNewTopicImageTab] = useState("url"); 
  const topicImageFileRef = useRef(null);

  const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);
  const [newLessonName, setNewLessonName] = useState("");
  const [newLessonDifficulty, setNewLessonDifficulty] = useState(1);

  
  const [showConfirmDeleteTopic, setShowConfirmDeleteTopic] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [showConfirmDeleteWord, setShowConfirmDeleteWord] = useState(false);
  const [wordToDelete, setWordToDelete] = useState(null);

  
  const [showTopicWordsModal, setShowTopicWordsModal] = useState(false);
  const [activeTopic, setActiveTopic] = useState(null);

  const [showTopicLessonsModal, setShowTopicLessonsModal] = useState(false);

  const [showLessonWordsModal, setShowLessonWordsModal] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);

  
  const [modalWords, setModalWords] = useState([]);
  const [wordSearchTerm, setWordSearchTerm] = useState("");

  
  const [selectedLessonFilters, setSelectedLessonFilters] = useState([]);
  const [showLessonFilterDropdown, setShowLessonFilterDropdown] =
    useState(false);

  
  const [showMoveWordModal, setShowMoveWordModal] = useState(false);
  const [movingWords, setMovingWords] = useState([]);
  const [moveTargetTopicId, setMoveTargetTopicId] = useState("");
  const [moveTargetLessonId, setMoveTargetLessonId] = useState("");
  const [moveMode, setMoveMode] = useState("full");

  
  const [showEditWordModal, setShowEditWordModal] = useState(false);
  const [editingWords, setEditingWords] = useState([]);

  
  const lessonCsvFileRef = useRef(null);

  
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editLessonName, setEditLessonName] = useState("");
  const [editLessonDifficulty, setEditLessonDifficulty] = useState(1);

  
  const [openMenuId, setOpenMenuId] = useState(null);
  
  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleToggleMenu = (id, event) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      setMenuAnchor(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setMenuAnchor({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
      setOpenMenuId(id);
    }
  };

  const closeMenu = () => {
    setOpenMenuId(null);
    setMenuAnchor(null);
  };

  const handleEditWordChange = (id, field, value) => {
    setEditingWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
    );
  };

  const handleSaveEditedWords = async () => {
    const INT_TO_LEVEL = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2' };
    let hasError = false;
    await Promise.all(
      editingWords.map(async (w) => {
        try {
          await updateVocabulary(w.id, {
            word: w.word,
            pronunciation: w.pronunciation,
            wordType: formatWordType(w.word_type),
            meaning: w.meaning,
            level: INT_TO_LEVEL[w.level] ?? w.level ?? 'A1',
            example: w.example,
            lessonId: w.lessonId ?? null,
          });
        } catch {
          hasError = true;
        }
      }),
    );
    if (hasError) {
      toast.error("Một số từ cập nhật thất bại. Vui lòng thử lại.");
      return;
    }
    setAllWords((prev) =>
      prev.map((cw) => {
        const edited = editingWords.find((ew) => ew.id === cw.id);
        return edited ? edited : cw;
      }),
    );
    setModalWords((prev) =>
      prev.map((cw) => {
        const edited = editingWords.find((ew) => ew.id === cw.id);
        return edited ? edited : cw;
      }),
    );
    toast.success("Đã lưu thay đổi từ vựng!");
    setShowEditWordModal(false);
    setEditingWords([]);
  };

  
  const filteredTopics = topics
    .filter((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDeleteTopicConfirm = async () => {
    if (!topicToDelete) return;
    try {
      await apiDeleteTopic(topicToDelete.id);
      setTopics(topics.filter((t) => t.id !== topicToDelete.id));
      setTopicToDelete(null);
    } catch {
      toast.error("Xóa chủ đề thất bại. Vui lòng thử lại.");
    } finally {
      setShowConfirmDeleteTopic(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return;

    
    const isDuplicate = topics.some(
      (t) => t.title.trim().toLowerCase() === newTopicName.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.error(`Chủ đề "${newTopicName.trim()}" đã tồn tại. Vui lòng chọn tên khác!`);
      return;
    }

    try {
      
      const created = await apiCreateTopic({
        topicName: newTopicName,
        image: newTopicImageFile ? "" : newTopicImage, 
      }).catch(() => null);
      const newId = created?.id ?? created?.topicId ?? null;

      let finalImageUrl = created?.image ?? created?.imageUrl ?? newTopicImage.trim();

      
      if (newId && newTopicImageFile) {
        try {
          const uploadedUrl = await uploadTopicImage(newId, newTopicImageFile);
          finalImageUrl = uploadedUrl;
        } catch {
          toast.error("Tạo topic thành công nhưng upload ảnh thất bại.");
        }
      }

      setTopics([
        ...topics,
        {
          id: newId ?? Date.now(),
          title: created?.topicName ?? created?.title ?? newTopicName,
          totalVocab: created?.totalVocab ?? 0,
          color: "bg-gray-100 text-gray-700",
          imageUrl:
            finalImageUrl ||
            "https://cdn-icons-png.flaticon.com/512/616/616408.png",
          lessons: [],
        },
      ]);
      toast.success(`Đã tạo chủ đề "${newTopicName.trim()}" thành công!`);
      setNewTopicName("");
      setNewTopicImage("");
      setNewTopicImageFile(null);
      setNewTopicImageTab("url");
      setShowCreateTopicModal(false);
    } catch {
      toast.error("Tạo chủ đề thất bại.");
    }
  };

  const handleTopicImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewTopicImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setNewTopicImage(ev.target.result); 
    reader.readAsDataURL(file);
  };

  const handleEditTopic = async () => {
    if (!newTopicName.trim() || !editingTopic) return;

    
    const isDuplicate = topics.some(
      (t) =>
        t.id !== editingTopic.id &&
        t.title.trim().toLowerCase() === newTopicName.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.error(`Chủ đề "${newTopicName.trim()}" đã tồn tại. Vui lòng chọn tên khác!`);
      return;
    }

    try {
      let finalImageUrl = newTopicImage;

      
      if (newTopicImageFile) {
        try {
          finalImageUrl = await uploadTopicImage(editingTopic.id, newTopicImageFile);
        } catch {
          toast.error("Upload ảnh thất bại, tên chủ đề vẫn được cập nhật.");
        }
      }

      await apiUpdateTopic(editingTopic.id, {
        topicName: newTopicName,
        image: finalImageUrl,
      }).catch(() => null);
      setTopics(
        topics.map((t) =>
          t.id === editingTopic.id
            ? {
                ...t,
                title: newTopicName,
                imageUrl: finalImageUrl || t.imageUrl,
              }
            : t,
        ),
      );
      setEditingTopic(null);
      setNewTopicName("");
      setNewTopicImage("");
      setNewTopicImageFile(null);
      setShowEditTopicModal(false);
    } catch {
      toast.error("Cập nhật chủ đề thất bại.");
    }
  };

  const handleCreateLesson = async () => {
    if (!newLessonName.trim() || !activeTopic) return;
    try {
      const created = await apiCreateLesson({
        lessonName: newLessonName,
        difficulty: newLessonDifficulty,
        topicId: activeTopic.id,
      }).catch(() => null);
      const newLessonId = created?.id ?? created?.lessonId ?? Date.now();
      const updatedTopics = topics.map((t) => {
        if (t.id === activeTopic.id) {
          return {
            ...t,
            lessons: [
              ...t.lessons,
              {
                id: newLessonId,
                name: created?.name ?? newLessonName,
                difficulty: created?.difficulty ?? newLessonDifficulty,
                wordCount: 0,
              },
            ],
          };
        }
        return t;
      });
      setTopics(updatedTopics);
      setActiveTopic(updatedTopics.find((t) => t.id === activeTopic.id));
      setNewLessonName("");
      setNewLessonDifficulty(1);
      setShowCreateLessonModal(false);
    } catch {
      toast.error("Tạo bài học thất bại.");
    }
  };

  
  const handleLessonCsvImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeLesson || !activeTopic) return;
    try {
      const result = await adminImportVocabulariesCsv(file, {
        topicId: activeTopic.id,
        lessonId: activeLesson.id,
      });

      
      const successCount = result?.successCount ?? 0;
      const errorCount = result?.errorCount ?? 0;
      const errors = Array.isArray(result?.errors) ? result.errors : [];

      if (successCount === 0 && errorCount > 0) {
        
        toast.error(
          `Import thất bại! ${errorCount} từ đã tồn tại hoặc có lỗi. Không có từ nào được thêm mới.`,
          { duration: 5000 }
        );
        
        if (errors.length > 0 && errors.length <= 10) {
          errors.forEach((err) => toast.error(err, { duration: 4000 }));
        }
        
        e.target.value = null;
        return;
      }

      if (successCount > 0 && errorCount > 0) {
        
        toast(
          `Đã thêm ${successCount} từ mới. ${errorCount} từ bị bỏ qua do trùng lặp hoặc lỗi.`,
          { icon: "⚠️", duration: 5000 }
        );
        if (errors.length > 0 && errors.length <= 5) {
          errors.forEach((err) => toast.error(err, { duration: 4000 }));
        }
      } else if (successCount > 0) {
        
        toast.success(
          `Đã import thành công ${successCount} từ vào bài học "${activeLesson.name}"!`
        );
      }

      
      const words = await fetchLessonVocabularies(activeLesson.id);
      const list = Array.isArray(words)
        ? words
        : (words?.items ?? words?.data ?? []);
      const mappedList = Array.isArray(list) && list.length > 0
        ? list.map((w) => ({
            id: w.id ?? w.vocabId ?? w.vocab_id,
            word: w.word ?? "",
            pronunciation: w.pronunciation ?? "",
            word_type: formatWordType(w.word_type ?? w.type ?? ""),
            meaning: w.meaning ?? "",
            example: w.example ?? "",
            level: { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }[w.level] ?? w.level ?? 1,
            topicId: activeTopic.id,
            lessonId: activeLesson.id,
            lessonName: activeLesson.name,
          }))
        : [];

      
      setModalWords(mappedList);

      const newWordCount = mappedList.length;

      
      setTopics((prevTopics) =>
        prevTopics.map((t) => {
          if (t.id !== activeTopic.id) return t;
          const updatedLessons = t.lessons.map((l) =>
            l.id === activeLesson.id ? { ...l, wordCount: newWordCount } : l
          );
          
          const newTotalVocab = updatedLessons.reduce(
            (sum, l) => sum + (l.wordCount ?? 0),
            0
          );
          return { ...t, lessons: updatedLessons, totalVocab: newTotalVocab };
        })
      );

      
      setActiveTopic((prev) => {
        if (!prev || prev.id !== activeTopic.id) return prev;
        const updatedLessons = prev.lessons.map((l) =>
          l.id === activeLesson.id ? { ...l, wordCount: newWordCount } : l
        );
        const newTotalVocab = updatedLessons.reduce(
          (sum, l) => sum + (l.wordCount ?? 0),
          0
        );
        return { ...prev, lessons: updatedLessons, totalVocab: newTotalVocab };
      });

      
      setActiveLesson((prev) =>
        prev ? { ...prev, wordCount: newWordCount } : prev
      );
    } catch {
      toast.error("Import CSV thất bại. Vui lòng kiểm tra định dạng file.");
    } finally {
      e.target.value = null;
    }
  };

  
  const handleOpenEditLesson = async (lesson, topic) => {
    setEditingLesson(lesson);
    setEditLessonName(lesson.name);
    setEditLessonDifficulty(lesson.difficulty ?? 1);
    setShowEditLessonModal(true);
    try {
      const detail = await fetchLessonById(lesson.id);
      if (detail) {
        setEditLessonName(detail.name ?? detail.title ?? lesson.name);
        setEditLessonDifficulty(
          detail.difficulty ?? detail.level ?? lesson.difficulty ?? 1,
        );
        setEditingLesson({
          ...lesson,
          name: detail.name ?? detail.title ?? lesson.name,
          difficulty:
            detail.difficulty ?? detail.level ?? lesson.difficulty ?? 1,
        });
      }
    } catch {
      
    }
  };

  const handleEditLesson = async () => {
    if (!editLessonName.trim() || !editingLesson) return;
    try {
      await apiUpdateLesson(editingLesson.id, {
        lessonName: editLessonName,
        difficulty: editLessonDifficulty,
        topicId: activeTopic?.id,
      }).catch(() => null);
      const updatedTopics = topics.map((t) => {
        if (t.id === activeTopic?.id) {
          return {
            ...t,
            lessons: t.lessons.map((l) =>
              l.id === editingLesson.id
                ? {
                    ...l,
                    name: editLessonName,
                    difficulty: editLessonDifficulty,
                  }
                : l,
            ),
          };
        }
        return t;
      });
      setTopics(updatedTopics);
      if (activeTopic) {
        setActiveTopic(updatedTopics.find((t) => t.id === activeTopic.id));
      }
      setShowEditLessonModal(false);
      setEditingLesson(null);
    } catch {
      toast.error("Cập nhật bài học thất bại.");
    }
  };

  
  const [showConfirmDeleteLesson, setShowConfirmDeleteLesson] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState(null);

  const handleDeleteLessonConfirm = async () => {
    try {
      if (lessonToDelete) {
        await apiDeleteLesson(lessonToDelete.id).catch(() => {});
        const updatedTopics = topics.map((t) => {
          if (t.id === activeTopic?.id) {
            return {
              ...t,
              lessons: t.lessons.filter((l) => l.id !== lessonToDelete.id),
            };
          }
          return t;
        });
        setTopics(updatedTopics);
        if (activeTopic) {
          setActiveTopic(updatedTopics.find((t) => t.id === activeTopic.id));
        }
      }
    } catch {
      toast.error("Xóa bài học thất bại.");
    } finally {
      setShowConfirmDeleteLesson(false);
      setLessonToDelete(null);
    }
  };

  
  const openTopicWords = async (topic) => {
    setActiveTopic(topic);
    try {
      const words = await fetchTopicVocabularies(topic.id);
      const list = Array.isArray(words)
        ? words
        : (words?.items ?? words?.data ?? []);
      if (Array.isArray(list) && list.length > 0) {
        setModalWords(
          list.map((w) => ({
            id: w.id ?? w.vocabId ?? w.vocab_id,
            word: w.word ?? "",
            pronunciation: w.pronunciation ?? "",
            word_type: formatWordType(w.word_type ?? w.wordType ?? w.type ?? ""),
            meaning: w.meaning ?? "",
            example: w.example ?? "",
            level: { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }[w.level] ?? w.level ?? 1,
            topicId: topic.id,
            lessonId: w.lessonId ?? w.lesson?.id,
            lessonName: w.lessonName ?? w.lesson?.name,
          })),
        );
      } else {
        setModalWords(allWords.filter((w) => w.topicId === topic.id));
      }
    } catch {
      setModalWords(allWords.filter((w) => w.topicId === topic.id));
    }
    setSelectedLessonFilters([]);
    setShowLessonFilterDropdown(false);
    setWordSearchTerm("");
    setShowTopicWordsModal(true);
  };

  const openTopicLessons = async (topic) => {
    setActiveTopic(topic);
    try {
      const lessonRequests = topic.lessons.map((lesson) => fetchLessonVocabularies(lesson.id));
      const lessonResults = await Promise.allSettled(lessonRequests);
      const lessonsWithCount = topic.lessons.map((lesson, index) => {
        const result = lessonResults[index];
        const count =
          result.status === 'fulfilled'
            ? (Array.isArray(result.value)
                ? result.value.length
                : (result.value?.items ?? result.value?.data ?? []).length)
            : 0;
        return {
          ...lesson,
          wordCount: count,
        };
      });
      const updatedTopic = { ...topic, lessons: lessonsWithCount };
      setActiveTopic(updatedTopic);
      setTopics((prevTopics) =>
        prevTopics.map((t) => (t.id === topic.id ? updatedTopic : t)),
      );
    } catch {
      
    }
    setShowTopicLessonsModal(true);
  };

  const openLessonWords = async (lesson, topic) => {
    setActiveLesson(lesson);
    setActiveTopic(topic);
    try {
      const words = await fetchLessonVocabularies(lesson.id);
      const list = Array.isArray(words) ? words : (words?.items ?? words?.data ?? []);
      if (Array.isArray(list) && list.length > 0) {
        setModalWords(
          list.map((w) => ({
            id: w.id ?? w.vocabId ?? w.vocab_id,
            word: w.word ?? "",
            pronunciation: w.pronunciation ?? "",
            word_type: formatWordType(w.word_type ?? w.wordType ?? w.type ?? ""),
            meaning: w.meaning ?? "",
            example: w.example ?? "",
            level: { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }[w.level] ?? w.level ?? 1,
            topicId: topic.id,
            lessonId: lesson.id,
            lessonName: lesson.name,
          }))
        );
      } else {
        setModalWords([]);
      }
    } catch {
      setModalWords([]);
    }
    setWordSearchTerm("");
    setShowTopicLessonsModal(false);
    setShowLessonWordsModal(true);
  };

  

  const handleDeleteWordConfirm = async () => {
    if (!wordToDelete) return;
    await deleteVocabulary(wordToDelete.id).catch(() => {});
    setAllWords((prev) => prev.filter((w) => w.id !== wordToDelete.id));
    setModalWords((prev) => prev.filter((w) => w.id !== wordToDelete.id));
    setWordToDelete(null);
    setShowConfirmDeleteWord(false);
  };

  const openMoveModal = (wordsToMove, lessonOnly = false) => {
    setMovingWords(wordsToMove);
    setMoveMode(lessonOnly ? "lesson-only" : "full");
    setMoveTargetTopicId(activeTopic ? String(activeTopic.id) : "");
    setMoveTargetLessonId("");
    setShowMoveWordModal(true);
  };

  const handleConfirmMove = () => {
    const targetTopicId = parseInt(
      moveMode === "full" ? moveTargetTopicId : activeTopic?.id,
    );
    const targetLessonId = parseInt(moveTargetLessonId);
    const targetLessonName =
      topics
        .find((t) => t.id === targetTopicId)
        ?.lessons.find((l) => l.id === targetLessonId)?.name || "";

    const wordIdsToMove = movingWords.map((w) => w.id);

    setAllWords((prev) =>
      prev.map((w) => {
        if (wordIdsToMove.includes(w.id)) {
          return {
            ...w,
            topicId: targetTopicId,
            lessonId: targetLessonId,
            lessonName: targetLessonName,
          };
        }
        return w;
      }),
    );

    setModalWords((prev) => prev.filter((w) => !wordIdsToMove.includes(w.id)));

    setShowMoveWordModal(false);
    setMovingWords([]);
    toast.success("Đã di chuyển thành công!");
  };

  
  const TopicActionColumn = ({ item }) => (
    <div className="flex justify-center">
      <button
        onClick={(e) => handleToggleMenu(item.id, e)}
        className="p-2 text-gray-400 hover:text-cyan-700 hover:bg-cyan-50 rounded-full transition-colors"
      >
        <MoreVertical size={20} />
      </button>
      {openMenuId === item.id &&
        menuAnchor &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: menuAnchor.top,
              right: menuAnchor.right,
            }}
            className="w-48 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-[9999] text-left"
          >
            <button
              onClick={async () => {
                closeMenu();
                setEditingWords([item]);
                setShowEditWordModal(true);
                try {
                  const detail = await fetchVocabularyById(item.id);
                  if (detail) {
                    setEditingWords([
                      {
                        ...item,
                        word: detail.word ?? item.word,
                        pronunciation:
                          detail.pronunciation ?? item.pronunciation,
                        word_type:
                          formatWordType(detail.word_type ?? detail.type ?? item.word_type),
                        meaning: detail.meaning ?? item.meaning,
                        level: detail.level ?? item.level,
                        example: detail.example ?? item.example,
                      },
                    ]);
                  }
                } catch {}
              }}
              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 font-medium flex items-center gap-2"
            >
              <Edit2 size={16} /> Chỉnh sửa
            </button>
            <button
              onClick={() => {
                closeMenu();
                openMoveModal([item], false);
              }}
              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 font-medium flex items-center gap-2"
            >
              <FolderInput size={16} /> Di chuyển
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={() => {
                closeMenu();
                setWordToDelete(item);
                setShowConfirmDeleteWord(true);
              }}
              className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
            >
              <Trash2 size={16} /> Xóa từ
            </button>
          </div>,
          document.body,
        )}
    </div>
  );

  
  const LessonActionColumn = ({ item }) => (
    <div className="flex justify-center">
      <button
        onClick={(e) => handleToggleMenu(item.id, e)}
        className="p-2 text-gray-400 hover:text-cyan-700 hover:bg-cyan-50 rounded-full transition-colors"
      >
        <MoreVertical size={20} />
      </button>
      {openMenuId === item.id &&
        menuAnchor &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: menuAnchor.top,
              right: menuAnchor.right,
            }}
            className="w-48 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-[9999] text-left"
          >
            <button
              onClick={async () => {
                closeMenu();
                setEditingWords([item]);
                setShowEditWordModal(true);
                try {
                  const detail = await fetchVocabularyById(item.id);
                  if (detail) {
                    setEditingWords([
                      {
                        ...item,
                        word: detail.word ?? item.word,
                        pronunciation:
                          detail.pronunciation ?? item.pronunciation,
                        word_type:
                          formatWordType(detail.word_type ?? detail.wordType ?? detail.type ?? item.word_type),
                        meaning: detail.meaning ?? item.meaning,
                        level: detail.level ?? item.level,
                        example: detail.example ?? item.example,
                      },
                    ]);
                  }
                } catch {}
              }}
              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 font-medium flex items-center gap-2"
            >
              <Edit2 size={16} /> Chỉnh sửa
            </button>
            <button
              onClick={() => {
                closeMenu();
                setWordToDelete(item);
                setShowConfirmDeleteWord(true);
              }}
              className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
            >
              <Trash2 size={16} /> Xóa từ
            </button>
          </div>,
          document.body,
        )}
    </div>
  );

  let finalTopicWords = modalWords;
  if (selectedLessonFilters.length > 0) {
    finalTopicWords = finalTopicWords.filter((w) =>
      selectedLessonFilters.includes(w.lessonId),
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">

      <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-200 p-4 mb-6 flex justify-between items-center">
        <div className="flex gap-4 items-center w-full max-w-xl">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm chủ đề..."
            className="flex-1"
          />
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setShowCreateTopicModal(true)}
            className="px-5 py-2.5 bg-[#0e7490] hover:bg-[#164e63] text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Tạo chủ đề
          </button>
        </div>
      </div>


      <div>
        <h2 className="text-2xl font-bold text-[#083344] mb-6 border-b-2 border-gray-200 pb-2 inline-block">
          Chủ đề từ vựng
        </h2>
        {isLoading && (
          <div className="mb-4 text-sm font-bold text-gray-400">
            Đang tải chủ đề...
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="relative bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all flex flex-col justify-between min-h-[14rem] group"
            >
              <div
                className="cursor-pointer"
                onClick={() => openTopicLessons(topic)}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 p-1 ${topic.color}`}
                >
                  <img
                    src={topic.imageUrl}
                    alt={topic.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex items-center gap-1.5 mb-3 pr-10">
                  <h3 className="font-bold text-gray-800 line-clamp-1">
                    {topic.title}
                  </h3>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setEditingTopic(topic);
                      setNewTopicName(topic.title);
                      setShowEditTopicModal(true);
                      try {
                        const detail = await fetchTopicById(topic.id);
                        if (detail) {
                          setNewTopicName(
                            detail.topicName ??
                              detail.title ??
                              detail.name ??
                              topic.title,
                          );
                          setNewTopicImage(
                            detail.image ??
                              detail.imageUrl ??
                              detail.image_url ??
                              topic.imageUrl ??
                              "",
                          );
                          setEditingTopic({
                            ...topic,
                            title:
                              detail.topicName ??
                              detail.title ??
                              detail.name ??
                              topic.title,
                            imageUrl:
                              detail.image ??
                              detail.imageUrl ??
                              detail.image_url ??
                              topic.imageUrl,
                          });
                        }
                      } catch {}
                    }}
                    className="shrink-0 p-1 text-gray-300 hover:text-cyan-600 hover:bg-cyan-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>
                <div className="flex flex-col gap-2.5 mb-4">
                  <span className="text-xs text-gray-600 font-medium bg-gray-100/80 px-3 py-1.5 rounded-lg w-fit">
                    Số từ: {topic.totalVocab} từ
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openTopicWords(topic);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-cyan-700 hover:bg-cyan-50 border border-cyan-100 transition-colors shrink-0 shadow-sm"
                >
                  <Eye size={16} /> Xem từ
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTopicToDelete(topic);
                    setShowConfirmDeleteTopic(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-red-500 hover:bg-red-50 border border-red-100 transition-colors shrink-0 shadow-sm"
                >
                  <Trash2 size={16} /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>


      <ModalWrapper isOpen={showCreateTopicModal} zIndex="z-[200]">
        <h3 className="text-xl font-bold text-cyan-950 mb-5 flex items-center gap-2">
          <Plus size={20} className="text-cyan-600" /> Tạo chủ đề mới
        </h3>


        <div className="mb-5">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Tên chủ đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:bg-white outline-none"
            placeholder="Nhập tên chủ đề..."
            autoFocus
          />
        </div>


        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Ảnh chủ đề
          </label>

          <div className="flex gap-4 items-start">

            <div className="flex-1">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={topicImageFileRef}
                    onChange={handleTopicImageFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => topicImageFileRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 hover:border-cyan-400 rounded-xl text-sm text-gray-500 hover:text-cyan-600 font-medium transition-colors bg-gray-50 hover:bg-cyan-50 text-left"
                  >
                    {newTopicImage
                      ? "✓ Đã chọn ảnh — nhấn để đổi"
                      : "📁 Nhấn để chọn file ảnh..."}
                  </button>
                </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Để trống sẽ dùng ảnh mặc định
              </p>
            </div>


            <div className="shrink-0 w-16 h-16 rounded-xl border-2 border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden">
              {newTopicImage ? (
                <img
                  src={newTopicImage}
                  alt="preview"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <img
                  src="https://cdn-icons-png.flaticon.com/512/616/616408.png"
                  alt="default"
                  className="w-10 h-10 object-contain opacity-30"
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowCreateTopicModal(false);
              setNewTopicName("");
              setNewTopicImage("");
              setNewTopicImageFile(null);
            }}
            className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleCreateTopic}
            disabled={!newTopicName.trim()}
            className="px-6 py-2.5 bg-[#0e7490] hover:bg-[#164e63] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Xác nhận
          </button>
        </div>
      </ModalWrapper>


      <ModalWrapper isOpen={showEditTopicModal} zIndex="z-[200]">
      <h3 className="text-xl font-bold text-cyan-950 mb-4">Chỉnh sửa chủ đề</h3>
        <div className="mb-5">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Tên chủ đề
          </label>
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:bg-white outline-none"
            autoFocus
          />
        </div>


        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Ảnh chủ đề
          </label>
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                ref={topicImageFileRef}
                onChange={handleTopicImageFileChange}
                className="hidden"
              />
              <button
                onClick={() => topicImageFileRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 hover:border-cyan-400 rounded-xl text-sm text-gray-500 hover:text-cyan-600 font-medium transition-colors bg-gray-50 hover:bg-cyan-50 text-left"
              >
                {newTopicImageFile
                  ? "✓ Đã chọn ảnh mới — nhấn để đổi"
                  : newTopicImage
                  ? "✓ Đang dùng ảnh hiện tại — nhấn để đổi"
                  : "📁 Nhấn để chọn file ảnh..."}
              </button>
              <p className="text-xs text-gray-400 mt-1.5">
                Để trống sẽ giữ nguyên ảnh cũ
              </p>
            </div>
            <div className="shrink-0 w-16 h-16 rounded-xl border-2 border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden">
              {newTopicImage ? (
                <img
                  src={newTopicImage}
                  alt="preview"
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <img
                  src="https://cdn-icons-png.flaticon.com/512/616/616408.png"
                  alt="default"
                  className="w-10 h-10 object-contain opacity-30"
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowEditTopicModal(false);
              setNewTopicImageFile(null);
            }}
            className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleEditTopic}
            disabled={!newTopicName.trim()}
            className="px-6 py-2.5 bg-[#0e7490] hover:bg-[#164e63] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Lưu thay đổi
          </button>
        </div>
      </ModalWrapper>


      <ModalWrapper isOpen={showCreateLessonModal} zIndex="z-[200]">
        <h3 className="text-xl font-bold text-cyan-950 mb-4">
          Tạo bài học mới
        </h3>
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Tên bài học
          </label>
          <input
            type="text"
            value={newLessonName}
            onChange={(e) => setNewLessonName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:bg-white outline-none"
            placeholder="Nhập tên bài học..."
            autoFocus
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Độ khó
          </label>
          <select
            value={newLessonDifficulty}
            onChange={(e) => setNewLessonDifficulty(parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:bg-white outline-none font-bold text-blue-600"
          >
            <option value={1}>A1</option>
            <option value={2}>A2</option>
            <option value={3}>B1</option>
            <option value={4}>B2</option>
            <option value={5}>C1</option>
            <option value={6}>C2</option>
          </select>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowCreateLessonModal(false)}
            className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleCreateLesson}
            disabled={!newLessonName.trim()}
            className="px-6 py-2.5 bg-[#0e7490] hover:bg-[#164e63] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Xác nhận tạo
          </button>
        </div>
      </ModalWrapper>


      <ModalWrapper
        isOpen={showTopicWordsModal && activeTopic}
        zIndex="z-[100]"
        className="rounded-2xl w-full max-w-6xl overflow-hidden flex flex-col h-[90vh]"
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-cyan-50/30">
          <h3 className="text-2xl font-bold text-cyan-950 flex items-center gap-3">
            <BookOpen className="text-cyan-600" /> Chủ đề: {activeTopic?.title}
          </h3>

          <div className="flex items-center gap-3">
            <div className="w-60">
              <SearchBar
                value={wordSearchTerm}
                onChange={(e) => setWordSearchTerm(e.target.value)}
                placeholder="Tìm từ vựng..."
              />
            </div>


            <FilterDropdown
              label="Lọc bài học"
              activeCount={selectedLessonFilters.length}
              onClear={() => setSelectedLessonFilters([])}
              dropdownWidth="w-60"
              position="left-0"
              title="Chọn bài học"
            >
              <label className="flex items-center gap-3 px-4 py-2.5 hover:bg-cyan-50 cursor-pointer transition-colors border-b border-gray-100">
                <input
                  type="checkbox"
                  checked={selectedLessonFilters.length === 0}
                  onChange={() => setSelectedLessonFilters([])}
                  className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-cyan-700">
                  Tất cả bài học
                </span>
              </label>
              {activeTopic?.lessons.map((l) => (
                <label
                  key={l.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-cyan-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedLessonFilters.includes(l.id)}
                    onChange={() =>
                      setSelectedLessonFilters((prev) =>
                        prev.includes(l.id)
                          ? prev.filter((id) => id !== l.id)
                          : [...prev, l.id],
                      )
                    }
                    className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {l.name}
                  </span>
                </label>
              ))}
            </FilterDropdown>


            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button
              onClick={() => setShowTopicWordsModal(false)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto bg-gray-50/30 flex-1">
          <VocabTable
            words={finalTopicWords}
            searchTerm={wordSearchTerm}
            ActionColumn={TopicActionColumn}
            showTopicColumn={false}
            showLessonColumn={true}
            showActionColumn={false}
          />
        </div>
      </ModalWrapper>


      <ModalWrapper
        isOpen={showTopicLessonsModal && activeTopic}
        zIndex="z-[100]"
        className="rounded-[1.5rem] w-full max-w-3xl flex flex-col h-[85vh]"
      >
        <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-cyan-50/50">
          <div>
            <h2 className="text-2xl font-black text-cyan-950 flex items-center gap-3">
              <Gamepad2 className="text-cyan-600" /> Danh sách bài học:{" "}
              {activeTopic?.title}
            </h2>
            <p className="text-gray-500 mt-2">
              Chọn một bài học dưới đây để xem danh sách từ vựng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateLessonModal(true)}
              className="px-4 py-2 bg-[#0e7490] hover:bg-[#164e63] text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Tạo bài học
            </button>
            <button
              onClick={() => setShowTopicLessonsModal(false)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <div className="space-y-4">
            {activeTopic?.lessons.map((lesson, idx) => {
              const lessonWordCount =
                lesson.wordCount ?? allWords.filter((w) => w.lessonId === lesson.id).length;
              const levelLabels = {
                1: "A1",
                2: "A2",
                3: "B1",
                4: "B2",
                5: "C1",
                6: "C2",
              };
              
              const lessonWords = allWords.filter(
                (w) => w.lessonId === lesson.id,
              );
              const avgLevel =
                lessonWords.length > 0
                  ? Math.round(
                      lessonWords.reduce((a, w) => a + w.level, 0) /
                        lessonWords.length,
                    )
                  : lesson.difficulty;
              return (
                <div
                  key={lesson.id}
                  className="bg-white p-5 rounded-[1.25rem] border border-cyan-100 hover:border-cyan-400 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-50 text-cyan-700 font-bold rounded-full flex items-center justify-center text-lg">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-cyan-950">
                        {lesson.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500 font-medium">
                          {lessonWordCount} từ vựng
                        </p>
                        {avgLevel && (
                          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {levelLabels[avgLevel]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditLesson(lesson, activeTopic)}
                      className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="Chỉnh sửa bài học"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setLessonToDelete(lesson);
                        setShowConfirmDeleteLesson(true);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa bài học"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => openLessonWords(lesson, activeTopic)}
                      className="px-6 py-2.5 bg-white border border-cyan-200 text-cyan-700 font-bold rounded-xl hover:bg-cyan-50 transition-colors shadow-sm"
                    >
                      Xem từ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ModalWrapper>


      <ModalWrapper
        isOpen={showLessonWordsModal && activeLesson}
        zIndex="z-[150]"
        className="rounded-2xl w-full max-w-6xl overflow-hidden flex flex-col h-[90vh]"
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-cyan-50/30">
          <div>
            <button
              onClick={() => {
                setShowLessonWordsModal(false);
                setShowTopicLessonsModal(true);
              }}
              className="text-cyan-700 hover:underline font-bold flex items-center gap-1 text-sm mb-1"
            >
              <ChevronRight size={14} className="rotate-180" /> Trở về danh sách
              bài học
            </button>
            <h3 className="text-2xl font-bold text-cyan-950 flex items-center gap-3">
              <BookOpen className="text-cyan-600" /> Bài học:{" "}
              {activeLesson?.name}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-64">
              <SearchBar
                value={wordSearchTerm}
                onChange={(e) => setWordSearchTerm(e.target.value)}
                placeholder="Tìm từ vựng..."
              />
            </div>


            <button
              onClick={() => lessonCsvFileRef.current?.click()}
              className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 text-sm flex items-center gap-2 transition-colors"
            >
              <Upload size={16} /> Import CSV
            </button>
            <input
              type="file"
              ref={lessonCsvFileRef}
              onChange={handleLessonCsvImport}
              className="hidden"
              accept=".csv"
            />

            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button
              onClick={() => setShowLessonWordsModal(false)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto bg-gray-50/30 flex-1">
          <VocabTable
            words={modalWords}
            searchTerm={wordSearchTerm}
            ActionColumn={LessonActionColumn}
            showTopicColumn={false}
            showLessonColumn={false}
          />
        </div>
      </ModalWrapper>


      <ModalWrapper isOpen={showMoveWordModal} zIndex="z-[200]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-cyan-950 flex items-center gap-2">
            <FolderInput className="text-cyan-600" /> Di chuyển từ vựng
          </h3>
          <button
            onClick={() => setShowMoveWordModal(false)}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-blue-50 text-blue-800 p-3 rounded-xl mb-6 font-medium text-sm">
          Bạn đang chọn di chuyển <strong>{movingWords.length}</strong> từ vựng.
        </div>

        <div className="space-y-4 mb-8">

          {moveMode === "full" && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Chọn chủ đề đích
              </label>
              <select
                value={moveTargetTopicId}
                onChange={(e) => {
                  setMoveTargetTopicId(e.target.value);
                  setMoveTargetLessonId("");
                }}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none font-medium"
              >
                <option value="">-- Chọn Chủ đề --</option>

                {topics
                  .filter((t) => t.id !== activeTopic?.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>
          )}


          {(moveMode === "full" ? moveTargetTopicId : true) && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {moveMode === "lesson-only"
                  ? `Chọn bài học khác (trong chủ đề: ${activeTopic?.title})`
                  : "Chọn bài học đích"}
              </label>
              <select
                value={moveTargetLessonId}
                onChange={(e) => setMoveTargetLessonId(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none font-medium"
              >
                <option value="">-- Chọn Bài học --</option>
                {(moveMode === "lesson-only"
                  ? activeTopic?.lessons
                  : topics.find((t) => t.id === parseInt(moveTargetTopicId))
                      ?.lessons
                )
                  ?.filter((l) => l.id !== activeLesson?.id)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowMoveWordModal(false)}
            className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirmMove}
            disabled={
              !moveTargetLessonId || (moveMode === "full" && !moveTargetTopicId)
            }
            className="px-6 py-2.5 bg-[#0e7490] hover:bg-[#164e63] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Xác nhận di chuyển
          </button>
        </div>
      </ModalWrapper>


      <ConfirmModal
        isOpen={showConfirmDeleteTopic}
        onClose={() => setShowConfirmDeleteTopic(false)}
        onConfirm={handleDeleteTopicConfirm}
        title="Xóa chủ đề"
        message={`Bạn có chắc chắn muốn xóa chủ đề "${topicToDelete?.title}" và TOÀN BỘ từ vựng bên trong không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa vĩnh viễn"
        isDanger={true}
      />

      <ConfirmModal
        isOpen={showConfirmDeleteWord}
        onClose={() => setShowConfirmDeleteWord(false)}
        onConfirm={handleDeleteWordConfirm}
        title="Xóa từ vựng"
        message={`Bạn có chắc chắn muốn xóa từ "${wordToDelete?.word}" khỏi hệ thống không?`}
        confirmText="Xóa vĩnh viễn"
        isDanger={true}
      />


      <ModalWrapper
        isOpen={showEditWordModal}
        zIndex="z-[200]"
        className="rounded-[1.5rem] w-full max-w-7xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
          <h2 className="text-xl font-bold text-cyan-950 flex items-center gap-2">
            <Edit2 className="text-cyan-600" /> Chỉnh sửa {editingWords.length}{" "}
            từ vựng
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
                          handleEditWordChange(word.id, "word", e.target.value)
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
      </ModalWrapper>


      <ModalWrapper isOpen={showEditLessonModal} zIndex="z-[200]">
        <h3 className="text-xl font-bold text-cyan-950 mb-4 flex items-center gap-2">
          <Edit2 className="text-cyan-600" /> Chỉnh sửa bài học
        </h3>
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Tên bài học
          </label>
          <input
            type="text"
            value={editLessonName}
            onChange={(e) => setEditLessonName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:bg-white outline-none"
            placeholder="Nhập tên bài học..."
            autoFocus
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Độ khó
          </label>
          <select
            value={editLessonDifficulty}
            onChange={(e) => setEditLessonDifficulty(parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:bg-white outline-none font-bold text-blue-600"
          >
            <option value={1}>A1</option>
            <option value={2}>A2</option>
            <option value={3}>B1</option>
            <option value={4}>B2</option>
            <option value={5}>C1</option>
            <option value={6}>C2</option>
          </select>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowEditLessonModal(false)}
            className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleEditLesson}
            disabled={!editLessonName.trim()}
            className="px-6 py-2.5 bg-[#0e7490] hover:bg-[#164e63] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Lưu thay đổi
          </button>
        </div>
      </ModalWrapper>


      <ConfirmModal
        isOpen={showConfirmDeleteLesson}
        onClose={() => setShowConfirmDeleteLesson(false)}
        onConfirm={handleDeleteLessonConfirm}
        title="Xóa bài học"
        message={
          lessonToDelete
            ? `Bạn có chắc chắn muốn xóa bài học "${lessonToDelete.name}" không? Các từ vựng trong bài học này sẽ không bị xóa.`
            : "Bạn có chắc chắn muốn xóa bài học này không?"
        }
        confirmText="Xóa vĩnh viễn"
        isDanger={true}
      />
    </div>
  );
}