import React, { useState, useEffect } from 'react';
import { LayoutGrid, Users, BookOpen, LogOut, ShieldCheck, Library, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import LeaderboardPage from './LeaderboardPage';
import UserManagement from './UserManagement';
import AdminVocabManagement from './AdminVocabManagement';
import AdminTopicManagement from './AdminTopicManagement';
import { fetchAllUsers } from '../utils/services/adminUserService';
import { fetchTopics } from '../utils/services/topicService';

export default function AdminHomePage({ onLogout }) {
  const getInitialTab = () => {
    const path = window.location.pathname;
    if (path.includes('users')) return 'users';
    if (path.includes('vocabs')) return 'vocabs';
    if (path.includes('topics')) return 'topics';
    if (path.includes('leaderboard')) return 'leaderboard';
    return 'dashboard';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [totalUsers, setTotalUsers] = useState('—');
  const [totalVocabs, setTotalVocabs] = useState('—');

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const [usersRes, topicsRes] = await Promise.allSettled([
          fetchAllUsers(),
          fetchTopics()
        ]);

        
        if (usersRes.status === 'fulfilled') {
          const list = Array.isArray(usersRes.value) ? usersRes.value : (usersRes.value?.items ?? usersRes.value?.data ?? []);
          if (!cancelled && Array.isArray(list)) {
            const userCount = list.filter(u => String(u.role ?? 'USER').toUpperCase() === 'USER').length;
            setTotalUsers(userCount);
          }
        }

        
        if (topicsRes.status === 'fulfilled') {
          const topicsList = Array.isArray(topicsRes.value) ? topicsRes.value : (topicsRes.value?.items ?? topicsRes.value?.data ?? []);
          if (!cancelled && Array.isArray(topicsList)) {
            const totalVocab = topicsList.reduce((sum, t) => sum + (t.totalVocabulary ?? t.totalVocab ?? t.total_vocab ?? 0), 0);
            setTotalVocabs(totalVocab);
          }
        }

      } catch (err) {
        
      }
    };
    if (activeTab === 'dashboard') {
      fetchStats();
    }
    return () => { cancelled = true; };
  }, [activeTab]);

  useEffect(() => {
    const routeMap = {
      'dashboard': { path: '/admin/dashboard', title: 'Dashboard - Admin EngLearn' },
      'users': { path: '/admin/users', title: 'Quản lý User - Admin EngLearn' },
      'vocabs': { path: '/admin/vocabs', title: 'Quản lý Từ vựng - Admin EngLearn' },
      'topics': { path: '/admin/topics', title: 'Quản lý Chủ đề - Admin EngLearn' },
      'leaderboard': { path: '/admin/leaderboard', title: 'Bảng xếp hạng - Admin EngLearn' },
    };
    
    const route = routeMap[activeTab];
    if (route) {
      document.title = route.title;
      if (window.location.pathname !== route.path) {
        window.history.pushState({ tab: activeTab }, '', route.path);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = (e) => {
       if (e.state && e.state.tab) {
           setActiveTab(e.state.tab);
       } else {
           const p = window.location.pathname;
           if (p.includes('users')) setActiveTab('users');
           else if (p.includes('vocabs')) setActiveTab('vocabs');
           else if (p.includes('topics')) setActiveTab('topics');
           else if (p.includes('leaderboard')) setActiveTab('leaderboard');
           else setActiveTab('dashboard');
       }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const stats = [
    { label: 'Tổng người dùng', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Từ vựng hệ thống', value: totalVocabs, icon: BookOpen, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  const renderNavBtn = (id, icon, label) => {
    const Icon = icon;
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center p-3 rounded-xl transition-colors ${
          isActive 
            ? 'bg-[#164e63] text-[#38bdf8] font-semibold' 
            : 'text-gray-300 hover:bg-[#164e63] hover:text-white'
        } ${!isSidebarOpen && 'justify-center'}`}
        title={!isSidebarOpen ? label : ''}
      >
        <div className="flex-shrink-0"><Icon size={22} /></div>
        {isSidebarOpen && <span className="ml-4 truncate text-left w-full">{label}</span>}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-gray-800">

      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#083344] text-white transition-all duration-300 flex flex-col relative shadow-xl z-20 sticky top-0 h-screen shrink-0`}
      >
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-6 bg-[#0e7490] rounded-full p-1 text-white hover:bg-[#164e63] shadow-md z-30"
        >
          {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        <div className="h-20 flex items-center justify-center font-extrabold text-2xl tracking-wide border-b border-[#164e63]">
          {isSidebarOpen ? <span className="text-white">EngLearn <span className="text-xs bg-cyan-600 px-2 py-1 rounded ml-1 align-middle">ADMIN</span></span> : 'E'}
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
          {renderNavBtn('dashboard', LayoutGrid, 'Dashboard')}
          {renderNavBtn('users', Users, 'Quản lý User')}
          {renderNavBtn('vocabs', BookOpen, 'Quản lý Từ vựng')}
          {renderNavBtn('topics', Library, 'Quản lý Chủ đề')}
          {renderNavBtn('leaderboard', Trophy, 'Bảng xếp hạng')}
        </nav>
        <div className="p-4 border-t border-[#164e63]">
          <button 
            onClick={onLogout} 
            className={`flex items-center w-full p-3 hover:bg-red-900/30 text-red-400 rounded-xl font-bold transition-colors ${!isSidebarOpen && 'justify-center'}`}
            title={!isSidebarOpen ? 'Đăng xuất' : ''}
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && <span className="ml-4 truncate">Đăng xuất</span>}
          </button>
        </div>
      </aside>


      <main className="flex-1 overflow-y-auto">


        {activeTab === 'dashboard' && (
          <div className="p-8">
            <header className="flex justify-between items-center mb-8">
              <div>
                <div className="flex items-center gap-2 text-cyan-700 mb-1">
                  <ShieldCheck size={18} />
                  <span className="font-bold text-sm uppercase tracking-wider">Hệ thống quản trị</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900">Chào mừng quay trở lại, Admin!</h2>
                <p className="text-slate-500 font-medium">Đây là trang chủ dành riêng cho quản trị viên hệ thống.</p>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}><stat.icon size={28} /></div>
                  <div><p className="text-sm font-bold text-slate-400 uppercase tracking-tight">{stat.label}</p><p className="text-3xl font-black text-slate-800">{stat.value}</p></div>
                </div>
              ))}
            </div>


          </div>
        )}


        {activeTab === 'leaderboard' && (
          <div className="bg-slate-50">
            <LeaderboardPage isAdmin={true} />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-slate-50 h-full">
            <UserManagement />
          </div>
        )}

        {activeTab === 'vocabs' && (
          <div className="bg-slate-50 h-full">
            <AdminVocabManagement />
          </div>
        )}

        {activeTab === 'topics' && (
          <div className="bg-slate-50 h-full">
            <AdminTopicManagement />
          </div>
        )}


        {[''].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center h-[80vh] text-slate-300">
            <Library size={80} className="mb-6 opacity-40" />
            <h2 className="text-2xl font-bold text-slate-400">Giao diện tính năng đang được phát triển...</h2>
          </div>
        )}

      </main>
    </div>
  );
}