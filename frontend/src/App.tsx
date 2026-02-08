// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ExecutionPage from './pages/ExecutionPage'; // 👈 确保这行没有报红

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* 首页 */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        
        {/* 👇👇👇 关键：必须有这行！如果没有，或者写成了 /execution/:id，都会导致跳回首页 👇👇👇 */}
        <Route 
          path="/task/:id" 
          element={
            <PrivateRoute>
              <ExecutionPage />
            </PrivateRoute>
          } 
        />
        
        {/* 兜底路由：任何不匹配的路径都会跳回首页 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;