import React, { useState, useEffect } from 'react';
import { Volume2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import Pagination from './Pagination';
import { playAudio } from '../utils/audio';

const ITEMS_PER_PAGE = 10;

const LEVEL_LABEL = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2' };

function VocabTable({ 
  words, 
  searchTerm, 
  isSelectMode, 
  selectedIds, 
  onToggleSelect, 
  onSelectAll, 
  ActionColumn,
  showTopicColumn = false,
  showLessonColumn = false,
  showActionColumn = true
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [openExampleId, setOpenExampleId] = useState(null);
  
  const [sortConfig, setSortConfig] = useState({ key: 'word', direction: 'asc' });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);

  
  let processedWords = words.filter(item => 
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  );


  processedWords.sort((a, b) => {
    if (sortConfig.key === 'word') {
      return sortConfig.direction === 'asc' 
        ? a.word.localeCompare(b.word) 
        : b.word.localeCompare(a.word);
    } 
    
    if (sortConfig.key === 'level') {
      return sortConfig.direction === 'asc' ? a.level - b.level : b.level - a.level;
    }
    return 0;
  });

  
  const totalPages = Math.ceil(processedWords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentWords = processedWords.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };


  const SortArrows = ({ columnKey }) => {
    const isActive = sortConfig.key === columnKey;
    return (
      <div className="flex flex-col ml-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
        <ChevronUp 
          size={14} 
          className={`-mb-1 ${isActive && sortConfig.direction === 'asc' ? 'text-cyan-900 font-black' : 'text-gray-300'}`} 
          strokeWidth={isActive && sortConfig.direction === 'asc' ? 3 : 2}
        />
        <ChevronDown 
          size={14} 
          className={isActive && sortConfig.direction === 'desc' ? 'text-cyan-900 font-black' : 'text-gray-300'} 
          strokeWidth={isActive && sortConfig.direction === 'desc' ? 3 : 2}
        />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[1.25rem] shadow-sm border border-cyan-100 flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cyan-50 border-b border-cyan-100 text-cyan-900 text-sm uppercase tracking-wider [&>th:first-child]:rounded-tl-2xl [&>th:last-child]:rounded-tr-2xl">
              <th className="p-4 font-semibold w-16 text-center">STT</th>
              
              <th 
                className="p-4 font-semibold cursor-pointer hover:bg-cyan-100/50 transition-colors select-none group"
                onClick={() => handleSort('word')}
              >
                <div className="flex items-center">
                  Từ vựng <SortArrows columnKey="word" />
                </div>
              </th>
              
              <th className="p-4 font-semibold">Phiên âm</th>
              <th className="p-4 font-semibold whitespace-nowrap">Loại từ</th>
              <th className="p-4 font-semibold">Nghĩa</th>
              
              <th 
                className="p-4 font-semibold text-center cursor-pointer hover:bg-cyan-100/50 transition-colors select-none group w-28"
                onClick={() => handleSort('level')}
              >
                <div className="flex items-center justify-center">
                  Cấp độ <SortArrows columnKey="level" />
                </div>
              </th>
              
              {showTopicColumn && <th className="p-4 font-semibold w-32">Chủ đề</th>}
              {showLessonColumn && <th className="p-4 font-semibold">Bài học</th>}

              <th className="p-4 font-semibold text-center">Audio</th>
              
              {showActionColumn && (!isSelectMode ? (
                <th className="p-4 font-semibold text-center min-w-[120px]">Hành động</th>
              ) : (
                <th className="p-4 font-semibold text-center w-20">
                  <input 
                    type="checkbox" 
                    checked={currentWords.length > 0 && currentWords.every(v => selectedIds.includes(v.id))}
                    onChange={() => onSelectAll(currentWords)}
                    className="w-5 h-5 text-[#0e7490] rounded border-gray-300 focus:ring-[#0e7490] cursor-pointer"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {currentWords.map((item, index) => (
              <React.Fragment key={item.id}>
                <tr className="border-b border-gray-50 hover:bg-cyan-50/40 transition-colors group/row">
                  <td className="p-4 text-center text-gray-400 font-medium">{startIndex + index + 1}</td>
                  
                  <td className="p-4">
                    <span className="font-bold text-cyan-950 text-lg block">{item.word}</span>
                    <button 
                      onClick={() => setOpenExampleId(openExampleId === item.id ? null : item.id)}
                      className="text-xs text-cyan-600 bg-cyan-50 border border-cyan-100 px-2.5 py-1 rounded mt-1.5 hover:bg-cyan-100 transition-colors font-medium flex items-center w-fit gap-1"
                    >
                      {openExampleId === item.id ? 'Đóng ví dụ' : 'Xem ví dụ'}
                      {openExampleId === item.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                    </button>
                  </td>
                  
                  <td className="p-4 text-gray-500">{item.pronunciation}</td>
                  <td className="p-4 whitespace-nowrap"><span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-sm font-medium whitespace-nowrap">{item.word_type || item.wordType || ''}</span></td>
                  <td className="p-4 font-medium max-w-[200px] truncate" title={item.meaning}>{item.meaning}</td>
                  <td className="p-4 text-center"><span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{LEVEL_LABEL[item.level] || item.level}</span></td>
                  
                  {showTopicColumn && (
                    <td className="p-4 text-gray-600 font-medium max-w-[150px] truncate" title={item.topic || ''}>
                      {item.topic || <span className="text-gray-300">Chưa có</span>}
                    </td>
                  )}
                  {showLessonColumn && (
                    <td className="p-4 text-gray-600 font-medium whitespace-nowrap">
                      {item.lesson || item.lessonName || <span className="text-gray-300">Chưa phân</span>}
                    </td>
                  )}

                  <td className="p-4 text-center">
                    <button onClick={() => playAudio(item.word)} className="p-2 text-cyan-600 hover:bg-cyan-100 rounded-full transition-colors">
                      <Volume2 size={20} />
                    </button>
                  </td>

                  {showActionColumn && (!isSelectMode ? (
                    <td className="p-4 text-center">
                      {ActionColumn && <ActionColumn item={item} />}
                    </td>
                  ) : (
                    <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(item.id)}
                          onChange={() => onToggleSelect(item.id)}
                          className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer"
                        />
                    </td>
                  ))}
                </tr>

                {openExampleId === item.id && (
                  <tr className="bg-slate-50/50 border-b border-gray-100">
                    <td colSpan={8 + (showTopicColumn ? 1 : 0) + (showLessonColumn ? 1 : 0)} className="p-4 px-12">
                      <div className="border-l-4 border-cyan-400 pl-4 py-2">
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Ví dụ sử dụng:</p>
                        <p className="text-gray-800 italic font-medium">"{item.example}"</p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        
        {currentWords.length === 0 && (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center">
             <Search size={48} className="text-gray-200 mb-4" />
            <p className="text-lg">Không tìm thấy từ vựng nào.</p>
          </div>
        )}
      </div>


      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={processedWords.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        itemName="từ vựng"
        showPageNumbers={true}
      />
    </div>
  );
}

export default VocabTable;