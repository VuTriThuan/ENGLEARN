import React from 'react';
import { Ghost, Home } from 'lucide-react';

const NotFoundPage = ({ onNavigateHome }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600">
            <Ghost size={64} />
          </div>
        </div>
        <h1 className="text-6xl font-black text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Oops! Trang không tồn tại</h2>
        <p className="text-gray-500 mb-8">
          Có vẻ như bạn đã đi lạc. Trang bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.
        </p>
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <Home size={20} />
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;