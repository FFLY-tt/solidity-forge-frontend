// src/components/Layout.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Shield, User as UserIcon } from 'lucide-react';
import { authService } from '../api/services'; // 引入 API

interface LayoutProps {
  children: React.ReactNode;
}

// 定义用户接口
interface UserProfile {
  username: string;
  email: string;
  role: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);

  // 👇 加载用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authService.getMe();
        setUser(userData);
      } catch (err) {
        console.error("Failed to fetch user info", err);
        // 如果 Token 过期，可以在这里自动登出
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    { label: 'Mission Control', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e1e1e] text-white flex flex-col shrink-0 transition-all duration-300">
        
        {/* 1. Logo Area */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">SoliForge</span>
        </div>

        {/* 👇👇👇 2. User Profile Area (新增用户卡片) 👇👇👇 */}
        <div className="px-4 py-6">
          <div className="bg-gray-800/50 rounded-xl p-3 flex items-center gap-3 border border-gray-700/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
               {/* 如果没有头像，用首字母代替 */}
               <span className="font-bold text-sm">
                 {user?.username ? user.username.substring(0, 2).toUpperCase() : <UserIcon className="w-5 h-5"/>}
               </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.username || 'Loading...'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email || '...'}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-2">
            Platform
          </div>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* 4. Logout Area */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative">
         {children}
      </main>
    </div>
  );
};

export default Layout;