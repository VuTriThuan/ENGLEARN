import { toast } from 'react-hot-toast';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import VocabTable from '../components/VocabTable';
import AddToCollectionModal from '../components/AddToCollectionModal';
import FlashcardLearning from '../components/FlashcardLearning';
import SearchBar from '../components/SearchBar';
import ConfirmModal from '../components/ConfirmModal';
import ModalWrapper from '../components/ModalWrapper';
import FilterDropdown from '../components/FilterDropdown';
import { Plus, Edit2, Eye, Trash2, X, Check, Search, FolderClosed, AlertTriangle, Bookmark, Volume2, ChevronDown, ChevronUp, MoreVertical, Heart, FolderPlus, ChevronRight, Filter } from 'lucide-react';
import { fetchCollections, createCollection as apiCreateCollection, deleteCollection as apiDeleteCollection, fetchCollectionVocabs, addVocabToCollection, updateCollectionName, removeVocabFromCollection } from '../utils/services/collectionService';
import { addFavorite, removeFavorite, fetchFavorites } from '../utils/services/favouriteService';
import { fetchVocabularyById, updateVocabulary, deleteVocabulary, fetchUserVocabularies } from '../utils/services/vocabService';
import { formatWordType } from '../utils/wordFormatters';

const COLLECTION_NAME_LIMIT = 50;
const MY_VOCAB_NAME = 'Từ vựng của tôi';


function CollectionPage({ onNavigateToPractice }) {
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadCollections = async () => {
      setIsLoading(true);
      try {
        const data = await fetchCollections();
        const list = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
        if (!cancelled && Array.isArray(list)) {
          const mapped = list.map(c => ({
            id: c.collectionId ?? c.id,
            name: c.collectionName ?? c.name ?? '',
            wordCount: c.vocabCount ?? c.wordCount ?? 0,
            masteredVocab: c.masteredVocab ?? 0
          }));

          
          const myVocabIdx = mapped.findIndex(c => c.name === MY_VOCAB_NAME);
          let myVocabCollection;
          const otherCollections = [];

          if (myVocabIdx !== -1) {
            
            const found = mapped[myVocabIdx];
            myVocabCollection = { ...found, backendId: found.id, id: 0 };
            mapped.forEach((c, i) => { if (i !== myVocabIdx) otherCollections.push(c); });
          } else {
            
            myVocabCollection = { id: 0, backendId: null, name: MY_VOCAB_NAME, wordCount: 0, masteredVocab: 0 };
            otherCollections.push(...mapped);
          }

          
          setCollections([myVocabCollection, ...otherCollections]);

          
          fetchUserVocabularies().then(userVocabs => {
            if (cancelled) return;
            const list = Array.isArray(userVocabs) ? userVocabs : (userVocabs?.items ?? userVocabs?.data ?? []);
            
            const actualCount = list.filter(w => {
              const hasTopic = w.topicId != null || w.topic_id != null;
              const hasLesson = w.lessonId != null || w.lesson_id != null || w.lessonName != null;
              return !hasTopic && !hasLesson;
            }).length;
            setCollections(prev => prev.map(c =>
              c.name === MY_VOCAB_NAME ? { ...c, wordCount: actualCount } : c
            ));
          }).catch(() => { });
        }
      } catch {
        
        if (!cancelled) setCollections([{ id: 0, backendId: null, name: MY_VOCAB_NAME, wordCount: 0, masteredVocab: 0 }]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadCollections();
    return () => { cancelled = true; };
  }, []);



  
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState('');

  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [openWordListId, setOpenWordListId] = useState(null);

  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');


  const [searchTerm, setSearchTerm] = useState('');

  
  const [activeCollection, setActiveCollection] = useState(null);
  const [showWordListModal, setShowWordListModal] = useState(false);
  const [collectionWords, setCollectionWords] = useState([]);
  const [wordListSearchTerm, setWordListSearchTerm] = useState('');
  const [selectedWordLevels, setSelectedWordLevels] = useState([]);
  const [selectedWordTypes, setSelectedWordTypes] = useState([]);
  const [showWordFilterDropdown, setShowWordFilterDropdown] = useState(false);


  const [showWordDeleteModal, setShowWordDeleteModal] = useState(false);
  const [wordToDelete, setWordToDelete] = useState(null);


  const [activeFlashcardSession, setActiveFlashcardSession] = useState(null);

  
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false);
  const [wordToAdd, setWordToAdd] = useState(null);
  const [addModalSearchTerm, setAddModalSearchTerm] = useState('');
  const [selectedTargetCollectionIds, setSelectedTargetCollectionIds] = useState([]);
  
  const [collectionVocabMap, setCollectionVocabMap] = useState({});
  const [isLoadingVocabMap, setIsLoadingVocabMap] = useState(false);

  
  const [showEditWordModal, setShowEditWordModal] = useState(false);
  const [editingWords, setEditingWords] = useState([]);

  const handleOpenEditModal = (wordsToEdit) => {
    setEditingWords(JSON.parse(JSON.stringify(wordsToEdit)));
    setShowEditWordModal(true);
  };

  const handleEditWordChange = (id, field, value) => {
    setEditingWords(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
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
        emptyCount++; continue;
      }


      if (!wordRegex.test(wordTrimmed)) {
        formatErrorCount++; continue;
      }
      if (word.pronunciation && word.pronunciation.trim() !== '' && !pronunRegex.test(word.pronunciation.trim())) {
        formatErrorCount++; continue;
      }


      const exists = collectionWords.some(v => v.id !== word.id && v.word.toLowerCase() === wordTrimmed.toLowerCase());
      if (exists) {
        duplicateCount++; continue;
      }
    }


    if (emptyCount > 0 || formatErrorCount > 0 || duplicateCount > 0) {
      toast.error(`LỖI KIỂM TRA DỮ LIỆU:\n\n${emptyCount > 0 ? `- Có ${emptyCount} từ bị bỏ trống Từ tiếng Anh hoặc Nghĩa.\n` : ''}${formatErrorCount > 0 ? `- Có ${formatErrorCount} từ sai định dạng (Từ chỉ chứa chữ cái, Phiên âm phải bọc trong / /).\n` : ''}${duplicateCount > 0 ? `- Có ${duplicateCount} từ bị trùng lặp với từ khác trong hệ thống.\n` : ''}\nVui lòng kiểm tra và sửa lại!`);
      return;
    }

    const INT_TO_LEVEL = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2' };

    try {
      await Promise.all(editingWords.map(word => {
        return updateVocabulary(word.id, {
          word: word.word.trim(),
          pronunciation: word.pronunciation,
          wordType: formatWordType(word.word_type),
          meaning: word.meaning,
          example: word.example,
          level: INT_TO_LEVEL[word.level] || 'A1'
        });
      }));

      setCollectionWords(prev => prev.map(cw => {
        const edited = editingWords.find(ew => ew.id === cw.id);
        return edited ? edited : cw;
      }));

      toast.success("Đã cập nhật thông tin từ vựng thành công!");
      setShowEditWordModal(false);
    } catch (error) {
      toast.error("Cập nhật từ vựng thất bại!");
    }
  };

  const handleOpenAddToCollectionModal = async (word) => {
    setWordToAdd(word);
    setSelectedTargetCollectionIds([]);
    setAddModalSearchTerm('');
    setShowAddToCollectionModal(true);

    
    const targetColls = collections.filter(c => c.name !== MY_VOCAB_NAME && c.id !== 0);
    if (targetColls.length === 0) return;

    setIsLoadingVocabMap(true);
    try {
      const results = await Promise.allSettled(
        targetColls.map(c => fetchCollectionVocabs(c.backendId ?? c.id))
      );
      const newMap = {};
      results.forEach((res, idx) => {
        const cId = targetColls[idx].id;
        if (res.status === 'fulfilled') {
          const list = Array.isArray(res.value) ? res.value : (res.value?.items ?? res.value?.data ?? []);
          newMap[cId] = new Set(list.map(v => v.vocabId ?? v.id).filter(Boolean));
        } else {
          newMap[cId] = new Set();
        }
      });
      setCollectionVocabMap(newMap);
    } catch {
      
    } finally {
      setIsLoadingVocabMap(false);
    }
  };

  const targetFilteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(addModalSearchTerm.toLowerCase()) && c.name !== 'Từ vựng của tôi'
  );

  const handleConfirmAddToCollections = async (targetCollectionIds) => {
    let addedCount = 0;
    let duplicateCount = 0;

    for (const cId of targetCollectionIds) {
      try {
        await addVocabToCollection(cId, wordToAdd.id);
        addedCount++;
      } catch (err) {
        if (err?.status === 409 || err?.body?.includes?.('already')) {
          duplicateCount++;
        } else {
          duplicateCount++;
        }
      }
    }

    if (addedCount > 0) {
      setCollections(prev => prev.map(c =>
        targetCollectionIds.includes(c.id) ? { ...c, wordCount: c.wordCount + 1 } : c
      ));
    }

    if (addedCount > 0 && duplicateCount === 0) {
      toast.success(`Đã thêm từ vào ${addedCount} bộ từ thành công!`);
    } else if (addedCount > 0 && duplicateCount > 0) {
      toast(`Thêm ${addedCount} thành công, bỏ qua ${duplicateCount} (đã tồn tại).`);
    } else {
      toast.error(`Từ đã tồn tại trong tất cả các bộ được chọn.`);
    }

    setShowAddToCollectionModal(false);
  };




  const toggleFavorite = async (id) => {
    const word = collectionWords.find(w => w.id === id);
    if (!word) return;
    try {
      if (word.isFavorite) {
        await removeFavorite(id);
      } else {
        await addFavorite(id);
      }
      setCollectionWords(collectionWords.map(w => w.id === id ? { ...w, isFavorite: !w.isFavorite } : w));
    } catch {
      toast.error('Cập nhật yêu thích thất bại.');
    }
  };


  const handleCreateCollection = async (e) => {
    e.preventDefault();
    const trimmedName = newCollectionName.trim();
    if (!trimmedName) return;

    
    const isDuplicateName = collections.some(
      c => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicateName) {
      toast.error(`Bộ từ “${trimmedName}” đã tồn tại. Vui lòng chọn tên khác.`);
      return;
    }

    try {
      const created = await apiCreateCollection(trimmedName);
      const newCollection = {
        id: created?.collectionId ?? created?.id ?? Date.now(),
        name: created?.collectionName ?? trimmedName,
        wordCount: created?.vocabCount ?? 0,
        masteredVocab: 0
      };
      setCollections([...collections, newCollection]);
      toast.success('Tạo bộ từ mới thành công!');
    } catch {
      toast.error('Tạo bộ từ thất bại. Vui lòng thử lại.');
    }

    setShowCreateModal(false);
    setNewCollectionName('');
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewCollectionName('');
  };





  const handleWordListClick = (id) => {
    setOpenWordListId(openWordListId === id ? null : id);
  };

  const startEditing = (collection) => {
    setOpenWordListId(null);
    setEditingId(collection.id);
    setTempName(collection.name);
  };

  const saveRename = async () => {
    if (!tempName.trim()) return;
    try {
      await updateCollectionName(editingId, tempName.trim());
      setCollections(collections.map(c =>
        c.id === editingId ? { ...c, name: tempName.trim() } : c
      ));
      toast.success('Đổi tên bộ từ thành công!');
    } catch {
      toast.error('Đổi tên thất bại. Vui lòng thử lại.');
    }
    setEditingId(null);
    setTempName('');
  };

  const cancelRename = () => {
    setEditingId(null);
  };



  const openDeleteModal = (collection) => {
    setCollectionToDelete(collection);
    setShowDeleteModal(true);
  };

  const confirmSingleDelete = async () => {
    try {
      await apiDeleteCollection(collectionToDelete.id);
      setCollections(collections.filter(c => c.id !== collectionToDelete.id));
      toast.success('Đã xóa bộ từ thành công!');
    } catch {
      toast.error('Xóa bộ từ thất bại. Vui lòng thử lại.');
    }
    setShowDeleteModal(false);
    setCollectionToDelete(null);
  };

  const openWordList = async (collection) => {
    setActiveCollection(collection);
    setCollectionWords([]);
    setShowWordListModal(true);
    setWordListSearchTerm('');
    setSelectedWordLevels([]);
    setSelectedWordTypes([]);
    setShowWordFilterDropdown(false);

    try {
      const isMyVocab = collection.name === MY_VOCAB_NAME;
      const apiId = collection.backendId ?? collection.id; 

      let vocabPromise;
      if (isMyVocab) {
        
        
        vocabPromise = fetchUserVocabularies();
      } else {
        vocabPromise = fetchCollectionVocabs(apiId);
      }

      const [data, favData] = await Promise.allSettled([
        vocabPromise,
        fetchFavorites(),
      ]);
      let list = data.status === 'fulfilled'
        ? (Array.isArray(data.value) ? data.value : (data.value?.items ?? data.value?.data ?? []))
        : [];

      
      if (isMyVocab) {
        list = list.filter(w => {
          const hasTopic = w.topicId != null || w.topic_id != null;
          const hasLesson = w.lessonId != null || w.lesson_id != null || w.lessonName != null;
          return !hasTopic && !hasLesson;
        });
      }
      const favIds = favData.status === 'fulfilled'
        ? (Array.isArray(favData.value) ? favData.value : (favData.value?.items ?? favData.value?.data ?? [])).map(f => f.vocabId ?? f.id)
        : [];

      if (Array.isArray(list) && list.length > 0) {
        
        
        const needsDetail = !isMyVocab;
        let detailResults = [];
        if (needsDetail) {
          detailResults = await Promise.allSettled(
            list.map(w => fetchVocabularyById(w.vocabId ?? w.id))
          );
        }
        const LEVEL_MAP = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
        setCollectionWords(list.map((w, idx) => {
          const detail = needsDetail && detailResults[idx]?.status === 'fulfilled' ? detailResults[idx].value : w;
          const vid = w.vocabId ?? w.id;
          return {
            id: vid,
            word: detail?.word ?? w.word ?? '',
            pronunciation: detail?.pronunciation ?? w.pronunciation ?? '',
            word_type: formatWordType(detail?.wordType ?? w.wordType ?? w.word_type ?? ''),
            meaning: detail?.meaning ?? w.meaning ?? '',
            example: detail?.example ?? w.example ?? '',
            level: LEVEL_MAP[detail?.level] ?? LEVEL_MAP[w.level] ?? w.level ?? 1,
            isFavorite: favIds.includes(vid)
          };
        }));
      }

      
      const actualCount = Array.isArray(list) ? list.length : 0;
      setCollections(prev => prev.map(c =>
        c.id === collection.id ? { ...c, wordCount: actualCount } : c
      ));
    } catch {
      
    }
  };



  const closeWordList = () => {
    setShowWordListModal(false);
    setActiveCollection(null);
  };



  const handleWordDeleteClick = (word = null) => {
    setWordToDelete(word);
    setShowWordDeleteModal(true);
  };

  const confirmWordDelete = async () => {
    if (!wordToDelete) return;

    try {
      if (activeCollection?.name === 'Từ vựng của tôi') {
        await deleteVocabulary(wordToDelete.id);
      } else {
        await removeVocabFromCollection(activeCollection.id, wordToDelete.id);
      }
      let updatedWords = collectionWords.filter(w => w.id !== wordToDelete.id);
      let deletedCount = 1;

      setCollectionWords(updatedWords);

      setCollections(collections.map(c => {
        if (c.id === activeCollection.id) {
          const newWordCount = Math.max(0, c.wordCount - deletedCount);
          const newMastered = Math.min(c.masteredVocab || 0, newWordCount);
          return { ...c, wordCount: newWordCount, masteredVocab: newMastered };
        }
        return c;
      }));
      toast.success('Đã xóa từ khỏi bộ từ!');
    } catch {
      toast.error('Xóa từ thất bại. Vui lòng thử lại.');
    }

    setShowWordDeleteModal(false);
    setWordToDelete(null);
  };


  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const filteredCollectionWords = collectionWords.filter(w => {
    if (selectedWordLevels.length > 0 && !selectedWordLevels.includes(w.level)) return false;
    if (selectedWordTypes.length > 0 && !selectedWordTypes.includes(w.word_type)) return false;
    return true;
  });

  
  const CollectionWordActionColumn = ({ item }) => {
    const [openMenuId, setOpenMenuId] = useState(null);
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

        {openMenuId === item.id && createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={closeMenu} />
            <div
              className="fixed w-48 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-[9999] text-left"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              {activeCollection?.name === 'Từ vựng của tôi' && (
                <button
                  onClick={() => { closeMenu(); handleOpenEditModal([item]); }}
                  className="w-full px-4 py-2 text-sm text-cyan-700 hover:bg-cyan-50 text-left font-medium flex items-center gap-2 border-b border-gray-100"
                >
                  <Edit2 size={16} /> Chỉnh sửa
                </button>
              )}
              <button
                onClick={() => { closeMenu(); handleOpenAddToCollectionModal(item); }}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 text-left font-medium"
              >
                Thêm vào bộ từ...
              </button>
              <button
                onClick={() => { closeMenu(); toggleFavorite(item.id); }}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 text-left font-medium flex justify-between items-center"
              >
                Yêu thích <Heart size={16} fill={item.isFavorite ? "currentColor" : "none"} className={item.isFavorite ? "text-red-500" : "text-gray-400"} />
              </button>
              <button
                onClick={() => { closeMenu(); handleWordDeleteClick(item); }}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
              >
                {activeCollection?.name === 'Từ vựng của tôi' ? 'Xóa khỏi hệ thống' : 'Xóa khỏi bộ từ này'}
              </button>
            </div>
          </>,
          document.body
        )}
      </div>
    );
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen relative">


      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-cyan-950">Bộ từ vựng</h1>
            <p className="text-gray-500 mt-1">Quản lý và ôn tập từ vựng theo chủ đề cá nhân</p>
          </div>


          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus size={20} /> Tạo bộ từ mới
          </button>
        </div>


        <div className="flex gap-4 items-center">

          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bộ từ..."
            className="w-72"
          />

        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
        {filteredCollections.map((collection, idx) => {
          
          const displayIndex = filteredCollections
            .slice(0, idx)
            .filter(c => c.name !== MY_VOCAB_NAME).length + 1;
          return (
            <div
              key={collection.name === MY_VOCAB_NAME ? 'my-vocab' : collection.id}
              className={`relative bg-white rounded-2xl shadow-sm border p-5 flex flex-col justify-between min-h-[14rem] transition-all group hover:shadow-lg hover:-translate-y-1 ${collection.name === MY_VOCAB_NAME ? 'border-orange-200 ring-1 ring-orange-100' : 'border-cyan-100'}`}
            >


              <div className={collection.wordCount > 0 && collection.name !== MY_VOCAB_NAME ? "cursor-pointer" : ""} onClick={() => { if (collection.wordCount > 0 && collection.name !== MY_VOCAB_NAME) setActiveFlashcardSession({ collection }); }}>

                <div className="flex items-center gap-3 mb-4">
                  {collection.name === 'Từ vựng của tôi' ? (
                    <span className="flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-500 rounded-xl">
                      <Bookmark size={24} fill="currentColor" />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center w-12 h-12 bg-cyan-100/50 text-cyan-600 font-bold text-xl rounded-xl">
                      {displayIndex < 10 ? `0${displayIndex}` : displayIndex}
                    </span>
                  )}
                </div>


                {editingId === collection.id ? (
                  <div className="flex gap-2 items-center -ml-1 mb-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => {
                          if (e.target.value.length <= COLLECTION_NAME_LIMIT) setTempName(e.target.value);
                        }}
                        className="w-full px-3 py-1.5 pr-16 border border-cyan-500 rounded-lg outline-none text-lg font-bold text-cyan-950 focus:ring-2 focus:ring-cyan-200 transition-all shadow-inner"
                        autoFocus
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                        {tempName.length}/{COLLECTION_NAME_LIMIT}
                      </span>
                    </div>
                    <button onClick={saveRename} className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"><Check size={18} /></button>
                    <button onClick={cancelRename} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"><X size={18} /></button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-start group/title mb-3 pr-8 relative">
                    <h3 title={collection.name} className="text-lg font-bold text-cyan-950 line-clamp-2 flex-1 mt-1 leading-snug">
                      {collection.name}
                    </h3>
                    {collection.name !== 'Từ vựng của tôi' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); startEditing(collection); }}
                        className="p-1.5 text-cyan-600 hover:bg-cyan-100 rounded-full opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0 absolute right-0 top-1"
                        title="Đổi tên"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                )}


                <div className="flex flex-col gap-2.5 mb-4">
                  <span className="text-xs text-gray-600 font-medium bg-gray-100/80 px-3 py-1.5 rounded-lg w-fit">
                    Số từ: {collection.wordCount} từ
                  </span>

                  {collection.wordCount === 0 ? (
                    <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg w-fit">Trống</span>
                  ) : collection.masteredVocab === collection.wordCount ? (
                    <span className="text-[11px] font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg w-fit">Đã hoàn thành</span>
                  ) : collection.masteredVocab === 0 ? (
                    <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg w-fit">Chưa học</span>
                  ) : (
                    <div className="flex flex-col gap-1.5 w-full pr-4 mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(collection.masteredVocab / collection.wordCount) * 100}%` }}></div>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold">{collection.masteredVocab}/{collection.wordCount} đã thuộc</span>
                    </div>
                  )}
                </div>
              </div>


              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center gap-2">
                <button
                  onClick={() => openWordList(collection)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-cyan-700 hover:bg-cyan-50 border border-cyan-100 transition-colors shrink-0 shadow-sm"
                >
                  <Eye size={16} /> Xem từ
                </button>

                {collection.name !== 'Từ vựng của tôi' && (
                  <button
                    onClick={() => openDeleteModal(collection)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-red-500 hover:bg-red-50 border border-red-100 transition-colors shrink-0 shadow-sm"
                  >
                    <Trash2 size={16} /> Xóa
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>


      {filteredCollections.length === 0 && (
        <div className="text-center p-16 mt-16 bg-white rounded-2xl border border-dashed border-cyan-200">
          <FolderClosed className="mx-auto text-cyan-200" size={64} />
          <p className="text-gray-400 mt-6 text-lg">Bạn chưa có bộ từ vựng nào hoặc không tìm thấy bộ từ vựng.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-colors shadow-sm mx-auto mt-6"
          >
            <Plus size={20} /> Tạo bộ từ ngay
          </button>
        </div>
      )}


      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCollectionToDelete(null);
        }}
        onConfirm={confirmSingleDelete}
        title="Xác nhận xóa bộ từ vựng?"
        message={
          <span className="flex flex-wrap items-center gap-1.5">
            Bạn có chắc chắn muốn xóa bộ từ vựng
            <span title={collectionToDelete?.name} className="inline-block px-2 py-0.5 bg-gray-100 rounded text-cyan-950 font-bold max-w-[200px] truncate">
              "{collectionToDelete?.name}"
            </span>
            không? Hành động này không thể hoàn tác.
          </span>
        }
        confirmText="Xác nhận, xóa vĩnh viễn"
        cancelText="Hủy không xóa"
        isDanger={true}
      />

      <ModalWrapper isOpen={showCreateModal} zIndex="z-[100]">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-cyan-950">Tạo bộ từ mới</h2>
          <button onClick={closeCreateModal} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreateCollection}>
          <div className="mb-8 relative">
            <label className="block text-sm font-bold text-gray-700 mb-2">Tên bộ từ vựng</label>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => {
                if (e.target.value.length <= COLLECTION_NAME_LIMIT) {
                  setNewCollectionName(e.target.value);
                }
              }}
              placeholder="Ví dụ: Luyện thi TOEIC 600+..."
              className={`w-full px-4 py-3 pr-16 border rounded-lg focus:ring-2 outline-none transition-all text-cyan-950 font-medium ${
                collections.some(c => c.name.trim().toLowerCase() === newCollectionName.trim().toLowerCase() && newCollectionName.trim())
                  ? 'border-red-400 focus:ring-red-300 focus:border-red-400 bg-red-50/30'
                  : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
              autoFocus
            />
            <span className="absolute right-4 top-[2.4rem] text-xs font-medium text-gray-400">
              {newCollectionName.length}/{COLLECTION_NAME_LIMIT}
            </span>

            {newCollectionName.trim() && collections.some(c => c.name.trim().toLowerCase() === newCollectionName.trim().toLowerCase()) && (
              <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                Bộ từ này đã tồn tại, vui lòng chọn tên khác.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={closeCreateModal}
              className="px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={
                !newCollectionName.trim() ||
                collections.some(c => c.name.trim().toLowerCase() === newCollectionName.trim().toLowerCase())
              }
              className={`px-6 py-2.5 rounded-lg font-bold transition-all shadow-md ${
                newCollectionName.trim() && !collections.some(c => c.name.trim().toLowerCase() === newCollectionName.trim().toLowerCase())
                  ? 'bg-cyan-600 text-white hover:bg-cyan-700 hover:shadow-cyan-500/50 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Tạo bộ từ
            </button>
          </div>
        </form>
      </ModalWrapper>

      <ModalWrapper isOpen={showWordListModal && activeCollection} zIndex="z-[100]" className="rounded-2xl p-6 w-full max-w-6xl flex flex-col max-h-[90vh]">


        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-cyan-950 flex items-center gap-2">
              <FolderClosed className="text-cyan-600" />
              {activeCollection?.name}
            </h2>
            <p className="text-gray-500 mt-1 text-sm">Đang quản lý {collectionWords.length} từ vựng trong bộ này</p>
          </div>


          <div className="flex items-center gap-4">


            <SearchBar
              value={wordListSearchTerm}
              onChange={(e) => setWordListSearchTerm(e.target.value)}
              placeholder="Tìm từ vựng..."
              className="w-56"
            />


            <FilterDropdown
              label={(count) => count > 0 ? `${count} bộ lọc` : 'Bộ lọc'}
              activeCount={selectedWordLevels.length + selectedWordTypes.length}
              onClear={() => { setSelectedWordLevels([]); setSelectedWordTypes([]); }}
              dropdownWidth="w-64"
              position="right-0"
              title="Lọc từ vựng"
            >
              <label className="flex items-center gap-3 px-4 py-2.5 hover:bg-cyan-50 cursor-pointer transition-colors border-b border-gray-100">
                <input
                  type="checkbox"
                  checked={selectedWordLevels.length === 0 && selectedWordTypes.length === 0}
                  onChange={() => { setSelectedWordLevels([]); setSelectedWordTypes([]); }}
                  className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-cyan-700">Tất cả từ vựng</span>
              </label>

              <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cấp độ</div>
              {[1, 2, 3, 4, 5, 6].map(lvl => {
                const lvlLabel = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2' }[lvl];
                return (
                  <label key={lvl} className="flex items-center gap-3 px-4 py-2 hover:bg-cyan-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedWordLevels.includes(lvl)}
                      onChange={() => setSelectedWordLevels(prev =>
                        prev.includes(lvl) ? prev.filter(l => l !== lvl) : [...prev, lvl]
                      )}
                      className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">{lvlLabel}</span>
                  </label>
                );
              })}

              <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-2">Loại từ</div>
              {['Danh từ', 'Động từ', 'Tính từ', 'Trạng từ'].map(type => (
                <label key={type} className="flex items-center gap-3 px-4 py-2 hover:bg-cyan-50 cursor-pointer transition-colors mb-1">
                  <input
                    type="checkbox"
                    checked={selectedWordTypes.includes(type)}
                    onChange={() => setSelectedWordTypes(prev =>
                      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                    )}
                    className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">{type}</span>
                </label>
              ))}
            </FilterDropdown>





            <button onClick={closeWordList} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>


        <div className="flex-1 overflow-y-auto mt-2">
          {collectionWords.length > 0 ? (
            filteredCollectionWords.length > 0 ? (
              <VocabTable
                words={filteredCollectionWords}
                searchTerm={wordListSearchTerm}
                ActionColumn={CollectionWordActionColumn}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <p className="text-lg">Không tìm thấy từ vựng nào phù hợp với bộ lọc.</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
              <FolderClosed size={64} className="text-cyan-100 mb-6" />
              <p className="text-lg">Bộ từ vựng này hiện đang trống.</p>
            </div>
          )}
        </div>
      </ModalWrapper>


      <ConfirmModal
        isOpen={showWordDeleteModal}
        onClose={() => setShowWordDeleteModal(false)}
        onConfirm={confirmWordDelete}
        title={activeCollection?.name === 'Từ vựng của tôi' ? 'Xác nhận xóa khỏi hệ thống?' : 'Xác nhận xóa từ vựng?'}
        message={
          <>
            Bạn có chắc chắn muốn xóa từ <strong>"{wordToDelete?.word}"</strong> khỏi {activeCollection?.name === 'Từ vựng của tôi' ? 'hệ thống' : 'bộ từ vựng này'} không?
          </>
        }
        confirmText="Xóa ngay"
        cancelText="Hủy"
        isDanger={true}
      />


      <AddToCollectionModal
        isOpen={showAddToCollectionModal}
        onClose={() => setShowAddToCollectionModal(false)}
        wordToAdd={wordToAdd}
        collections={collections.filter(c => c.id !== activeCollection?.id)}
        collectionVocabMap={collectionVocabMap}
        isLoadingVocabs={isLoadingVocabMap}
        onConfirm={handleConfirmAddToCollections}
      />


      <ModalWrapper isOpen={showEditWordModal} zIndex="z-[200]" className="rounded-[1.5rem] w-full max-w-6xl flex flex-col max-h-[90vh] overflow-hidden">


        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
          <h2 className="text-xl font-bold text-cyan-950 flex items-center gap-2">
            <Edit2 className="text-cyan-600" /> Chỉnh sửa {editingWords.length} từ vựng
          </h2>
          <button onClick={() => setShowEditWordModal(false)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"><X size={24} /></button>
        </div>


        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cyan-50/50 border-b border-gray-200 text-cyan-900 text-xs uppercase tracking-wider">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3 w-1/6">Từ vựng <span className="text-red-500">*</span></th>
                  <th className="p-3 w-1/6">Phiên âm</th>
                  <th className="p-3 w-32">Loại từ</th>
                  <th className="p-3 w-1/6">Nghĩa <span className="text-red-500">*</span></th>
                  <th className="p-3 w-28 text-center">Cấp độ</th>
                  <th className="p-3">Ví dụ</th>
                </tr>
              </thead>
              <tbody>
                {editingWords.map((word, index) => (
                  <tr key={word.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-3 text-center text-gray-400 font-bold">{index + 1}</td>
                    <td className="p-3"><input type="text" value={word.word} onChange={(e) => handleEditWordChange(word.id, 'word', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm font-bold text-cyan-950" /></td>
                    <td className="p-3"><input type="text" value={word.pronunciation} onChange={(e) => handleEditWordChange(word.id, 'pronunciation', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-gray-600" /></td>
                    <td className="p-3">
                      <select value={word.word_type} onChange={(e) => handleEditWordChange(word.id, 'word_type', e.target.value)} className="w-full px-2 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-gray-600 bg-white cursor-pointer">
                        <option value="Danh từ">Danh từ</option>
                        <option value="Động từ">Động từ</option>
                        <option value="Tính từ">Tính từ</option>
                        <option value="Trạng từ">Trạng từ</option>
                      </select>
                    </td>
                    <td className="p-3"><input type="text" value={word.meaning} onChange={(e) => handleEditWordChange(word.id, 'meaning', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm font-medium" /></td>
                    <td className="p-3">
                      <select value={word.level} onChange={(e) => handleEditWordChange(word.id, 'level', parseInt(e.target.value))} className="w-full px-2 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm font-bold text-blue-600 bg-white cursor-pointer text-center">
                        {[1, 2, 3, 4, 5, 6].map(lvl => (
                          <option key={lvl} value={lvl}>{lvl === 1 ? 'A1' : lvl === 2 ? 'A2' : lvl === 3 ? 'B1' : lvl === 4 ? 'B2' : lvl === 5 ? 'C1' : 'C2'}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3"><input type="text" value={word.example} onChange={(e) => handleEditWordChange(word.id, 'example', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm text-gray-600 italic" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0 rounded-b-[1.5rem]">
          <button onClick={() => setShowEditWordModal(false)} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 font-bold rounded-xl transition-colors">Hủy</button>
          <button onClick={handleSaveEditedWords} className="px-8 py-2.5 font-bold rounded-xl shadow-lg transition-all bg-[#0e7490] hover:bg-[#164e63] text-white">Xác nhận Lưu</button>
        </div>
      </ModalWrapper>


      {activeFlashcardSession && (
        <FlashcardLearning
          collection={activeFlashcardSession.collection}
          onExit={() => setActiveFlashcardSession(null)}
          onPractice={() => {
            const currentCollectionId = activeFlashcardSession.collection.id;
            setActiveFlashcardSession(null);
            if (onNavigateToPractice) {
              onNavigateToPractice({ mode: 'collection', collectionId: currentCollectionId });
            }
          }}
        />
      )}

    </div>
  );
}

export default CollectionPage;