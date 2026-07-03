import React, { useState, useEffect } from 'react';
import { Search, X, CheckCircle2, Loader2, FolderOpen } from 'lucide-react';


export default function AddToCollectionModal({
  isOpen,
  onClose,
  wordToAdd,
  collections = [],
  collectionVocabMap = {},
  isLoadingVocabs = false,
  onConfirm,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const wordId = wordToAdd?.id;

  
  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAlreadyIn = (collId) => {
    const vocabSet = collectionVocabMap[collId];
    if (!vocabSet) return false; 
    return vocabSet.has(wordId);
  };

  const availableCollections = filteredCollections.filter((c) => !isAlreadyIn(c.id));
  const existingCollections  = filteredCollections.filter((c) =>  isAlreadyIn(c.id));

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allAvailableIds = availableCollections.map((c) => c.id);
    const allSelected =
      allAvailableIds.length > 0 &&
      allAvailableIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : allAvailableIds);
  };

  const handleSubmit = () => {
    if (selectedIds.length > 0) onConfirm(selectedIds);
  };

  const allAvailableIds = availableCollections.map((c) => c.id);
  const allAvailableSelected =
    allAvailableIds.length > 0 &&
    allAvailableIds.every((id) => selectedIds.includes(id));

  return (
    <div className="fixed inset-0 bg-cyan-950/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 flex flex-col max-h-[88vh] animate-in zoom-in duration-200">


        <div className="flex justify-between items-start p-5 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-cyan-950">Lưu vào bộ từ</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Từ:{' '}
              <span className="font-bold text-cyan-700">{wordToAdd?.word}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors ml-2 shrink-0"
          >
            <X size={20} />
          </button>
        </div>


        <div className="p-4 border-b border-gray-50 shrink-0 bg-gray-50/50">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Tìm kiếm bộ từ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
              />
            </div>

            {availableCollections.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer shrink-0" title="Chọn tất cả bộ chưa có từ này">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tất cả</span>
                <input
                  type="checkbox"
                  checked={allAvailableSelected}
                  onChange={handleSelectAll}
                  className="w-5 h-5 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                />
              </label>
            )}
          </div>
        </div>


        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">


          {isLoadingVocabs && (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-cyan-600 font-medium bg-cyan-50/60 rounded-lg mx-1 mb-2">
              <Loader2 size={16} className="animate-spin" />
              Đang kiểm tra trùng lặp...
            </div>
          )}

          {filteredCollections.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <FolderOpen size={36} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Không tìm thấy bộ từ nào.</p>
              <p className="text-xs mt-1 text-gray-300">Hãy tạo bộ từ mới trong trang Bộ từ vựng.</p>
            </div>
          ) : (
            <>

              {availableCollections.length > 0 && (
                <div className="mb-1">
                  {existingCollections.length > 0 && (
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5">
                      Chưa có từ này
                    </p>
                  )}
                  {availableCollections.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center justify-between p-3 hover:bg-cyan-50 rounded-xl cursor-pointer transition-colors group"
                    >
                      <span className="text-gray-700 font-medium group-hover:text-cyan-900 truncate pr-3 text-sm">
                        {c.name}
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="w-5 h-5 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer shrink-0"
                      />
                    </label>
                  ))}
                </div>
              )}


              {existingCollections.length > 0 && (
                <div className="mt-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5 border-t border-gray-100 pt-3">
                    Đã có từ này
                  </p>
                  {existingCollections.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 opacity-70 cursor-not-allowed"
                    >
                      <span className="text-gray-500 font-medium truncate pr-3 text-sm line-through">
                        {c.name}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full shrink-0 whitespace-nowrap">
                        <CheckCircle2 size={13} />
                        Đã có
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>


        <div className="p-4 border-t border-gray-100 flex justify-between items-center gap-3 shrink-0 bg-gray-50/50 rounded-b-2xl">
          <p className="text-xs text-gray-400">
            {selectedIds.length > 0
              ? `Đã chọn ${selectedIds.length} bộ`
              : 'Chưa chọn bộ nào'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedIds.length === 0}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
                selectedIds.length > 0
                  ? 'bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Thêm ({selectedIds.length})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}