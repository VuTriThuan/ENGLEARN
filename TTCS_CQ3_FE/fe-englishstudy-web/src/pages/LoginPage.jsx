import React, { useState } from 'react';
import { login as apiLogin, getMe } from '../utils/services/authService';
import { setTokens } from '../utils/tokenStorage';

function LoginPage({ onNavigateToRegister, onLoginSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  return (
    
    <div className="min-h-screen flex items-center justify-center bg-cyan-900">

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        

        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-cyan-950">EngLearn</h1>
          <p className="text-gray-500 mt-2">Học tiếng Anh mỗi ngày</p>
        </div>


        <form 
          className="space-y-6" 
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            setIsSubmitting(true);
            try {
              const email = e.target[0].value;
              const password = e.target[1].value;

              let role = null;
              try {
                await apiLogin({ email, password });
                const principal = await getMe().catch(() => null);
                const roles = principal?.roles ?? principal?.authorities ?? [];
                const rolesStr = Array.isArray(roles) ? roles.map(r => (typeof r === 'string' ? r : r?.authority ?? r?.role ?? '')).join(',') : String(roles);
                const isAdmin = /ADMIN/i.test(rolesStr);
                role = isAdmin ? 'admin' : 'user';
              } catch (err) {
                setError('Đăng nhập thất bại. Vui lòng kiểm tra email, mật khẩu hoặc kết nối đến server.');
              }
              if (role) onLoginSuccess(role);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div>
            <label className="block text-sm font-medium text-cyan-900 mb-1">Email</label>
            <input 
            type="email" 
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
            placeholder="Nhập email của bạn..."
            />  
          </div>

          <div>
            <label className="block text-sm font-medium text-[#164e63] mb-1">Mật khẩu</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0284c7] outline-none transition-all"
              placeholder="••••••••" required
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0e7490] hover:bg-[#164e63]'
            }`}
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm font-bold text-red-600 text-center">
            {error}
          </p>
        )}


        <p className="text-center text-sm text-gray-900 mt-6">
          Chưa có tài khoản? 
          <button 
            onClick={onNavigateToRegister} 
            className="text-blue-700 font-semibold hover:underline ml-1 focus:outline-none"
          >
            Đăng ký
          </button>
        </p>

      </div>
    </div>
  );
}

export default LoginPage;