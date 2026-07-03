import React from 'react';
import { Settings, X } from 'lucide-react';

export default function GameSettingsModal({ isOpen, onClose, settings, onSettingsChange, onSave }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-cyan-950/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-cyan-50/50">
          <h3 className="font-black text-xl text-cyan-900 flex items-center gap-2"><Settings size={22}/> Cài đặt Game</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="flex justify-between font-bold text-gray-700 mb-2">
              <span>Thời gian mỗi câu (giây)</span> <span className="text-cyan-600">{settings.timePerQuestion}s</span>
            </label>
            <input type="range" min="5" max="30" step="1" value={settings.timePerQuestion} onChange={e => onSettingsChange({...settings, timePerQuestion: e.target.value})} className="w-full accent-cyan-600"/>
          </div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-bold text-gray-700">Tự động chuyển câu (Khi đúng)</span>
            <input type="checkbox" checked={settings.autoNext} onChange={e => onSettingsChange({...settings, autoNext: e.target.checked})} className="w-5 h-5 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"/>
          </label>
          {settings.autoNext && (
            <div className="pl-4 border-l-2 border-cyan-200">
              <label className="flex justify-between font-bold text-gray-600 mb-2 text-sm">
                <span>Thời gian chờ chuyển (giây)</span> <span className="text-cyan-600">{settings.autoNextDelay}s</span>
              </label>
              <input type="range" min="0" max="5" step="0.5" value={settings.autoNextDelay} onChange={e => onSettingsChange({...settings, autoNextDelay: e.target.value})} className="w-full accent-cyan-500"/>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-xl">Hủy</button>
          <button onClick={onSave} className="px-6 py-2 bg-cyan-600 text-white font-bold hover:bg-cyan-700 rounded-xl shadow-md">Lưu cài đặt</button>
        </div>
      </div>
    </div>
  );
}