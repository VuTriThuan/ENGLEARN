import React, { useState, useRef, useEffect } from 'react';
import { Filter } from 'lucide-react';

export default function FilterDropdown({ 
  label = 'Bộ lọc',
  activeCount = 0,
  onClear,
  dropdownWidth = 'w-64',
  position = 'right-0',
  title = 'Lọc dữ liệu',
  children
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-medium outline-none transition-colors ${
          activeCount > 0
            ? 'border-cyan-400 bg-cyan-50 text-cyan-700'
            : 'border-gray-200 text-gray-700 hover:border-cyan-300'
        }`}
      >
        <Filter size={15} />
        {activeCount > 0 
          ? (typeof label === 'function' ? label(activeCount) : `${activeCount} đã chọn`) 
          : (typeof label === 'function' ? label(0) : label)}
      </button>
      
      {isOpen && (
        <div className={`absolute top-full mt-2 ${position} ${dropdownWidth} bg-white border border-gray-200 rounded-2xl shadow-xl z-50 py-2 overflow-hidden flex flex-col max-h-[60vh]`}>
          <div className="px-3 pb-2 pt-1 border-b border-gray-100 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
            {activeCount > 0 && onClear && (
              <button onClick={onClear} className="text-xs text-red-500 font-bold hover:underline transition-colors">
                Xóa lọc
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}