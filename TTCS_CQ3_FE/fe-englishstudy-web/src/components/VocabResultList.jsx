import React from "react";
import { XCircle, CheckCircle2, Volume2, Heart } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { playAudio } from "../utils/audio";

export default function VocabResultList({
  logs,
  favoriteIds,
  onToggleFavorite,
  toggleFavoriteLoading,
}) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="space-y-8">

      <div>
        <h3 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
          <XCircle size={20} /> Các từ làm sai (
          {logs.filter((l) => !l.isCorrect).length})
        </h3>
        <div className="grid gap-4">
          {logs
            .filter((l) => !l.isCorrect)
            .map((log, idx) => (
              <div
                key={idx}
                className="flex justify-between items-start p-5 bg-red-50 rounded-xl border border-red-100 shadow-sm"
              >
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    {log.q.word}
                  </p>
                  <div className="flex items-center gap-3 text-gray-500 mt-1 mb-2 text-sm">
                    <span>{log.q.pronunciation}</span>
                    <span className="px-2 py-0.5 bg-white border border-red-200 rounded text-xs font-semibold">
                      {log.q.type}
                    </span>
                    <StatusBadge status={log.q.status} />
                  </div>
                  <p className="text-base text-red-800 font-medium">
                    {log.q.meaning}
                  </p>
                  {log.q.example && (
                    <p className="text-gray-600 italic text-sm mt-1">
                      VD: "{log.q.example}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-red-500 bg-red-100 px-3 py-1 rounded-lg border border-red-200">
                    +0 điểm
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => playAudio(log.q.word)}
                      className="p-2 bg-white rounded-full hover:bg-red-100 text-red-700 transition-colors shadow-sm"
                    >
                      <Volume2 size={18} />
                    </button>
                    <button
                      onClick={() => onToggleFavorite(log.q.id)}
                      disabled={toggleFavoriteLoading === log.q.id}
                      className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {toggleFavoriteLoading === log.q.id ? (
                        <div className="w-4.5 h-4.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                      ) : (
                        <Heart
                          size={18}
                          className={
                            favoriteIds.includes(log.q.id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400"
                          }
                        />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          {logs.filter((l) => !l.isCorrect).length === 0 && (
            <p className="text-gray-400 italic">Không có từ nào làm sai!</p>
          )}
        </div>
      </div>


      <div>
        <h3 className="text-lg font-bold text-green-600 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
          <CheckCircle2 size={20} /> Các từ làm đúng (
          {logs.filter((l) => l.isCorrect).length})
        </h3>
        <div className="grid gap-4">
          {logs
            .filter((l) => l.isCorrect)
            .map((log, idx) => (
              <div
                key={idx}
                className="flex justify-between items-start p-5 bg-green-50 rounded-xl border border-green-100 shadow-sm"
              >
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    {log.q.word}
                  </p>
                  <div className="flex items-center gap-3 text-gray-500 mt-1 mb-2 text-sm">
                    <span>{log.q.pronunciation}</span>
                    <span className="px-2 py-0.5 bg-white border border-green-200 rounded text-xs font-semibold">
                      {log.q.type}
                    </span>
                    <StatusBadge status={log.q.status} />
                  </div>
                  <p className="text-base text-green-800 font-medium">
                    {log.q.meaning}
                  </p>
                  {log.q.example && (
                    <p className="text-gray-600 italic text-sm mt-1">
                      VD: "{log.q.example}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {log.errors > 0 && (
                    <span className="text-xs text-red-500 font-medium bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 flex items-center gap-1">
                      <span>Sai {log.errors} lần</span>
                      <span className="opacity-80">
                        (-{log.deduction}/{log.originalPoints})
                      </span>
                    </span>
                  )}
                  <span className="font-bold text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
                    +{log.pointsEarned} điểm
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => playAudio(log.q.word)}
                      className="p-2 bg-white rounded-full hover:bg-green-100 text-green-700 transition-colors shadow-sm"
                    >
                      <Volume2 size={18} />
                    </button>
                    <button
                      onClick={() => onToggleFavorite(log.q.id)}
                      disabled={toggleFavoriteLoading === log.q.id}
                      className="p-2 bg-white rounded-full hover:bg-green-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {toggleFavoriteLoading === log.q.id ? (
                        <div className="w-4.5 h-4.5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                      ) : (
                        <Heart
                          size={18}
                          className={
                            favoriteIds.includes(log.q.id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400"
                          }
                        />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}