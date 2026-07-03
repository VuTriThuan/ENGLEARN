import React, { useState, useEffect } from 'react';
import { Volume2, X, ChevronLeft, ChevronRight, CheckCircle2, Gamepad2, RotateCcw, ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import { playAudio as playGlobalAudio } from '../utils/audio';
import { fetchLessonVocabularies } from '../utils/services/lessonService';
import { fetchCollectionVocabs } from '../utils/services/collectionService';
import { fetchVocabularyById, fetchUserVocabularies } from '../utils/services/vocabService';
import { saveVocabProgress } from '../utils/services/userService';
import { addFavorite, removeFavorite, fetchFavorites } from '../utils/services/favouriteService';
import { formatWordType } from '../utils/wordFormatters';

const MY_VOCAB_NAME = 'Từ vựng của tôi';

export default function FlashcardLearning({ topic, lesson, collection, onExit, onNextLesson, onPrevLesson, onPractice }) {
  const [localWords, setLocalWords] = React.useState([]);
  const [favIds, setFavIds] = React.useState([]);
  
  React.useEffect(() => {
    const run = async () => {
      let vocabList = [];
      let isCollectionSource = false;

      
      if (!collection && lesson?.id) {
        try {
          const res = await fetchLessonVocabularies(lesson.id);
          const list = Array.isArray(res) ? res : (res?.items ?? res?.data ?? []);
          if (Array.isArray(list)) vocabList = list;
        } catch {  }
      } else if (collection) {
        const isMyVocab = collection.name === MY_VOCAB_NAME;
        const apiId = collection.backendId ?? collection.id;

        try {
          let res;
          if (isMyVocab) {
            
            res = await fetchUserVocabularies();
            
            const rawList = Array.isArray(res) ? res : (res?.items ?? res?.data ?? []);
            vocabList = rawList.filter(w => {
              const hasTopic = w.topicId != null || w.topic_id != null;
              const hasLesson = w.lessonId != null || w.lesson_id != null || w.lessonName != null;
              return !hasTopic && !hasLesson;
            });
            
          } else {
            isCollectionSource = true;
            res = await fetchCollectionVocabs(apiId);
            const list = Array.isArray(res) ? res : (res?.items ?? res?.data ?? []);
            if (Array.isArray(list)) vocabList = list;
          }
        } catch {  }
      }

      
      let loadedFavIds = [];
      try {
        const favRes = await fetchFavorites();
        const favList = Array.isArray(favRes) ? favRes : (favRes?.items ?? favRes?.data ?? []);
        loadedFavIds = favList.map(f => f.vocabId ?? f.id).filter(Boolean);
      } catch {  }

      if (Array.isArray(vocabList) && vocabList.length > 0) {
        
        
        let detailedList = vocabList;
        if (isCollectionSource) {
          const detailResults = await Promise.allSettled(
            vocabList.map(w => fetchVocabularyById(w.vocabId ?? w.id))
          );
          detailedList = vocabList.map((w, idx) => {
            const detail = detailResults[idx]?.status === 'fulfilled' ? detailResults[idx].value : null;
            return detail ? { ...w, ...detail } : w;
          });
        }

        const LEVEL_MAP = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
        const mapped = detailedList.map((w, idx) => ({
          id: w.vocabId ?? w.id ?? `${lesson?.id ?? collection?.id}-${idx}`,
          word: w.word ?? '',
          pronunciation: w.pronunciation ?? '',
          word_type: formatWordType(w.wordType ?? w.word_type ?? ''),
          meaning: w.meaning ?? '',
          example: w.example ?? '',
          level: LEVEL_MAP[w.level] ?? w.level ?? 1,
          isFavorite: loadedFavIds.includes(w.vocabId ?? w.id),
          status: w.status ?? 'LEARNING'
        }));
        setLocalWords(mapped);
      } else {
        setLocalWords([]);
      }
      setFavIds(loadedFavIds);
      setCurrentIndex(0);
      setIsFinished(false);
      setIsFlipped(false);
    };

    run();
  }, [lesson, collection]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentWord = localWords[currentIndex] || localWords[0] || {};

  const toggleLocalFavorite = async (id) => {
    const isFav = favIds.includes(id);
    try {
      if (isFav) {
        await removeFavorite(id);
      } else {
        await addFavorite(id);
      }
      setFavIds(prev => prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]);
      setLocalWords(prev => prev.map(w => w.id === id ? { ...w, isFavorite: !w.isFavorite } : w));
    } catch {  }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFinished) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFinished]);

  const handleNext = () => {
    if (currentIndex < localWords.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150); 
    } else {
      setIsFinished(true); 
    }
  };

  useEffect(() => {
    if (!isFinished) return;
    if (collection) return;
    if (!lesson?.id) return;

    
    Promise.all(
      localWords.map((w) =>
        saveVocabProgress({
          vocabId: w.id,
          isCorrect: true,
          responseTime: 1
        }).catch(() => {})
      )
    ).catch(() => {});
  }, [isFinished, localWords, lesson, topic, collection]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  const playAudio = (e) => {
    e.stopPropagation(); 
    playGlobalAudio(currentWord?.word);
  };

  const currentLessonIndex = (topic && lesson) ? topic.lessons.findIndex(l => l.id === lesson.id) : -1;
  const hasNextLesson = topic && currentLessonIndex < topic.lessons.length - 1;
  const hasPrevLesson = topic && currentLessonIndex > 0;
  
  return (
    <div className="fixed inset-0 z-[999] bg-slate-50 flex flex-col items-center pt-8 overflow-y-auto animate-in fade-in duration-300">
      

      <div className="w-full max-w-4xl px-4 flex items-center justify-between bg-white rounded-full shadow-sm border border-gray-200 py-3 mb-10 shrink-0">

        <div className="flex items-center gap-4 pl-4 w-48 text-cyan-900 font-bold">
          <span className="text-xl">{isFinished ? localWords.length : currentIndex + 1} / {localWords.length}</span>
        </div>


        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-sm font-bold text-gray-400 mb-1.5 truncate max-w-lg text-center">
            {collection ? (
              <span className="text-cyan-700 font-extrabold">{collection.name}</span>
            ) : (
              <>{topic?.title} <span className="mx-2 text-gray-300">|</span> <span className="text-cyan-700">{lesson?.name}</span></>
            )}
          </div>
          <div className="w-full max-w-lg bg-gray-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#84cc16] h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(isFinished ? 100 : ((currentIndex + 1) / localWords.length) * 100)}%` }}
            ></div>
          </div>
        </div>


        <div className="flex justify-end pr-2 w-48">
          <button 
            onClick={onExit}
            className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full font-bold transition-colors"
          >
            Thoát <X size={20} />
          </button>
        </div>
      </div>


      {!isFinished ? (
        <div className="w-full max-w-3xl flex flex-col items-center">
          

          <div 
            className="relative w-full h-[400px] cursor-pointer group"
            style={{ perspective: '1000px' }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div 
              className="w-full h-full transition-all duration-500 rounded-[2rem] shadow-xl"
              style={{ 
                transformStyle: 'preserve-3d', 
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
              }}
            >

              <div 
                className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-white"
                style={{ backfaceVisibility: 'hidden' }}
              >

                <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10 pointer-events-none">
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className={`pointer-events-auto cursor-default px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border shadow-sm ${
                      currentWord?.status === 'MASTERED' 
                        ? 'bg-green-500/20 border-green-400 text-green-300' 
                        : 'bg-orange-500/20 border-orange-400 text-orange-300'
                    }`}
                  >
                    {currentWord?.status === 'MASTERED' ? 'Đã thuộc' : 'Đang học'}
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLocalFavorite(currentWord.id); }}
                    className="pointer-events-auto p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  >
                    <Heart size={24} fill={currentWord?.isFavorite ? "currentColor" : "none"} className={currentWord?.isFavorite ? "text-red-400" : "text-white/70"} />
                  </button>
                </div>

                <span className="text-sm font-bold tracking-widest text-white/40 uppercase mt-4">Từ tiếng Anh</span>
                
                <h2 className="text-6xl font-black mb-6 text-center drop-shadow-md">{currentWord.word}</h2>
                <span className="bg-white/20 px-6 py-2 rounded-full font-bold tracking-wider mb-6 border border-white/30 backdrop-blur-sm shadow-sm">
                  {currentWord.word_type}
                </span>
                <div className="flex items-center gap-4 bg-black/10 px-6 py-2.5 rounded-full">
                  <button onClick={playAudio} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                    <Volume2 size={24} />
                  </button>
                  <span className="text-2xl font-medium italic text-white/90 pr-2">{currentWord.pronunciation}</span>
                </div>
                
                <span className="absolute bottom-8 text-sm font-medium text-white/60 flex items-center gap-2">
                  👆 Nhấn Space hoặc click để lật
                </span>
              </div>


              <div 
                className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-white"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >

                <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10 pointer-events-none" style={{ transform: 'rotateY(0deg)' }}>
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className={`pointer-events-auto cursor-default px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border shadow-sm ${
                      currentWord?.status === 'MASTERED' 
                        ? 'bg-green-500/20 border-green-400 text-green-300' 
                        : 'bg-orange-500/20 border-orange-400 text-orange-300'
                    }`}
                  >
                    {currentWord?.status === 'MASTERED' ? 'Đã thuộc' : 'Đang học'}
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLocalFavorite(currentWord.id); }}
                    className="pointer-events-auto p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  >
                    <Heart size={24} fill={currentWord?.isFavorite ? "currentColor" : "none"} className={currentWord?.isFavorite ? "text-red-400" : "text-white/70"} />
                  </button>
                </div>

                <span className="text-sm font-bold tracking-widest text-white/40 uppercase mt-4">Nghĩa tiếng Việt</span>
                
                <h2 className="text-5xl font-black mb-8 text-center drop-shadow-md">{currentWord.meaning}</h2>
                
                <div className="w-full bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm mb-4">
                  <p className="text-xl italic font-medium text-center">"{currentWord.example}"</p>
                </div>

                <span className="absolute bottom-8 text-sm font-medium text-white/60 flex items-center gap-2">
                  👆 Nhấn Space hoặc click để lật lại
                </span>
              </div>
            </div>
          </div>


          <div className="flex justify-between items-center w-full mt-10 px-8">
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className={`flex flex-col items-center gap-1 ${currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-cyan-600 transition-colors text-gray-500'}`}
            >
              <div className="flex items-center gap-2 font-bold text-lg"><ChevronLeft size={24} /> Trước</div>
              <span className="text-xs font-medium text-gray-400">Phím ←</span>
            </button>

            <button onClick={handleNext} className="flex flex-col items-center gap-1.5 hover:text-cyan-600 transition-colors text-gray-500">
              <div className="flex items-center gap-2 font-bold text-xl">{currentIndex === localWords.length - 1 ? 'Hoàn thành' : 'Tiếp'} <ChevronRight size={24} /></div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Phím →</span>
            </button>
          </div>
        </div>

      ) : (

        
        <div className="w-full max-w-2xl bg-white rounded-3xl p-10 shadow-xl border border-gray-100 flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-black text-cyan-950 mb-2 text-center">Tuyệt vời!</h2>
          <p className="text-gray-500 mb-10 text-center text-lg">
            Bạn mới học xong {collection ? 'bộ từ vựng' : 'bài học'} <strong>"{collection ? collection.name : lesson?.name}"</strong> với {localWords.length} từ vựng.
          </p>
          
          <div className="grid grid-cols-2 gap-4 w-full mb-6">
             <button 
                onClick={onPractice}
                className="col-span-2 py-4 bg-[#84cc16] hover:bg-[#65a30d] text-white rounded-2xl font-bold text-lg flex justify-center items-center gap-2 shadow-lg hover:-translate-y-1 transition-all"
             >
               <Gamepad2 size={24} /> Bắt đầu Luyện tập ngay
             </button>

             <button 
                onClick={() => { setIsFinished(false); setCurrentIndex(0); }}
                className="py-3.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors border border-cyan-100"
             >
               <RotateCcw size={20} /> Học lại bài này
             </button>

             <button onClick={onExit} className="py-3.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors border border-gray-200">
               <X size={20} /> {collection ? 'Thoát ra Bộ từ vựng' : 'Thoát ra Chủ đề'}
             </button>
          </div>


          {!collection && (
            <div className="flex w-full justify-between pt-6 border-t border-gray-100">
              {hasPrevLesson ? (
                <button onClick={() => onPrevLesson(topic.lessons[currentLessonIndex - 1])} className="flex items-center gap-2 text-gray-500 hover:text-cyan-700 font-bold transition-colors">
                  <ArrowLeft size={18}/> Bài học trước
                </button>
              ) : <div></div>}

              {hasNextLesson && (
                <button onClick={() => onNextLesson(topic.lessons[currentLessonIndex + 1])} className="flex items-center gap-2 text-cyan-600 hover:text-cyan-800 font-bold transition-colors">
                  Bài học tiếp theo <ArrowRight size={18}/>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}