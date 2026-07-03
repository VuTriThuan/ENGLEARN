import { toast } from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import VocabTable from '../components/VocabTable';
import AddToCollectionModal from '../components/AddToCollectionModal';
import SearchBar from '../components/SearchBar';
import {
  fetchCollections,
  addVocabToCollection,
  fetchCollectionVocabs,
} from '../utils/services/collectionService';
import { fetchFavorites, removeFavorite } from '../utils/services/favouriteService';
import { formatWordType } from '../utils/wordFormatters';

function FavoritePage({ onFavoriteChange }) {
  const [favorites, setFavorites] = useState([]);
  const [collections, setCollections] = useState([]);

  
  const [collectionVocabMap, setCollectionVocabMap] = useState({});
  const [isLoadingCollectionVocabs, setIsLoadingCollectionVocabs] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [favData, collData] = await Promise.allSettled([
          fetchFavorites(),
          fetchCollections(),
        ]);

        if (favData.status === 'fulfilled') {
          const favList = Array.isArray(favData.value)
            ? favData.value
            : (favData.value?.items ?? favData.value?.data ?? []);
          const LEVEL_MAP = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
          if (!cancelled && Array.isArray(favList)) {
            setFavorites(
              favList.map((w) => ({
                id: w.vocabId ?? w.id,
                word: w.word ?? '',
                pronunciation: w.pronunciation ?? '',
                word_type: formatWordType(w.wordType ?? w.word_type ?? ''),
                meaning: w.meaning ?? '',
                example: w.example ?? '',
                level: LEVEL_MAP[w.level] ?? w.level ?? 1,
                isFavorite: true,
              }))
            );
          }
        }

        if (collData.status === 'fulfilled') {
          const list = Array.isArray(collData.value)
            ? collData.value
            : (collData.value?.items ?? collData.value?.data ?? []);
          if (!cancelled && Array.isArray(list)) {
            
            setCollections(
              list
                .map((c) => ({
                  id: c.collectionId ?? c.id,
                  name: c.collectionName ?? c.name ?? '',
                  wordCount: c.vocabCount ?? c.wordCount ?? 0,
                }))
                .filter((c) => c.name !== 'Từ vựng của tôi')
            );
          }
        }
      } catch {
        
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, []);

  const [searchTerm, setSearchTerm] = useState('');

  
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false);
  const [wordToAdd, setWordToAdd] = useState(null);

  
  const modalCollections = collections;

  const handleOpenAddToCollectionModal = async (word) => {
    setWordToAdd(word);
    setShowAddToCollectionModal(true);

    
    const collectionsToFetch = collections.filter((c) => !(c.id in collectionVocabMap));
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
          if (res.status === 'fulfilled') {
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
      toast.success(`✅ Đã thêm từ "${wordToAdd?.word}" vào ${addedCount} bộ từ thành công!`);
    } else if (addedCount > 0 && duplicateCount > 0) {
      toast(`Thêm vào ${addedCount} bộ thành công, bỏ qua ${duplicateCount} bộ (từ đã tồn tại).`);
    } else {
      toast.error(`❌ Từ "${wordToAdd?.word}" đã tồn tại trong tất cả các bộ được chọn!`);
    }

    setShowAddToCollectionModal(false);
  };

  const handleRemoveSingle = async (id) => {
    try {
      await removeFavorite(id);
      setFavorites((prev) => prev.filter((item) => item.id !== id));
      onFavoriteChange?.(id, false);
      toast.success('Đã bỏ yêu thích!');
    } catch {
      toast.error('Không thể bỏ yêu thích. Vui lòng thử lại.');
    }
  };

  const filteredFavorites = favorites.filter((item) =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const FavoriteActionColumn = ({ item }) => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const btnRef = useRef(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

    const handleToggle = () => {
      if (openMenuId === item.id) { setOpenMenuId(null); return; }
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
              <button
                onClick={() => { closeMenu(); handleOpenAddToCollectionModal(item); }}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 text-left font-medium"
              >
                Thêm vào bộ từ...
              </button>
              <button
                onClick={() => { closeMenu(); handleRemoveSingle(item.id); }}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
              >
                Bỏ yêu thích
              </button>
            </div>
          </>,
          document.body
        )}
      </div>
    );
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-cyan-950">Từ vựng yêu thích</h1>
          <p className="text-gray-500 mt-1">Quản lý và ôn tập các từ vựng bạn đã đánh dấu</p>
        </div>
        <div className="flex gap-4 items-center">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm từ vựng..."
            className="w-64"
          />
        </div>
      </div>

      <VocabTable
        words={filteredFavorites}
        searchTerm={searchTerm}
        ActionColumn={FavoriteActionColumn}
      />


      <AddToCollectionModal
        isOpen={showAddToCollectionModal}
        onClose={() => setShowAddToCollectionModal(false)}
        wordToAdd={wordToAdd}
        collections={modalCollections}
        collectionVocabMap={collectionVocabMap}
        isLoadingVocabs={isLoadingCollectionVocabs}
        onConfirm={handleConfirmAddToCollections}
      />
    </div>
  );
}

export default FavoritePage;