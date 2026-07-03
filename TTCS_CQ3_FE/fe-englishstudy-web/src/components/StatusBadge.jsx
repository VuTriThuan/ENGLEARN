import React from 'react';

export default function StatusBadge({ status }) {
  switch (status) {
    case 'NEW': 
      return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold border border-blue-200">Chưa học</span>;
    case 'LEARNING': 
      return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-bold border border-orange-200">Đang học</span>;
    case 'MASTERED': 
      return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200">Đã thuộc</span>;
    default: 
      return null;
  }
}