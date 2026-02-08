import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/services';
import { Shield } from 'lucide-react';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        // 注册逻辑：直接传 JSON
        await authService.register({
          email: formData.email,
          password: formData.password,
          username: formData.username || formData.email.split('@')[0] // 如果没填用户名，默认用邮箱前缀
        });
        alert('Registered! Please login.');
        setIsRegister(false);
      } else {
        // 登录逻辑：👉 必须转换为 FormData 才能通过 OAuth2 验证
        const loginData = new FormData();
        // 注意：FastAPI 的 OAuth2PasswordRequestForm 强制要求字段名为 "username" 和 "password"
        // 即使用户是用邮箱登录，字段名也得叫 "username"
        loginData.append('username', formData.email); 
        loginData.append('password', formData.password);

        const res = await authService.login(loginData);
        localStorage.setItem('token', res.access_token);
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || 'Operation failed.';
      alert(`Error: ${errorMsg}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center text-white mb-2">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-400 text-center mb-8">
          SoliForge Smart Contract Audit Platform
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
              <input
                type="text"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Your username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              type="email"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-900/50"
          >
            {isRegister ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}