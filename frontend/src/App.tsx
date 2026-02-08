import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ExecutionPage from './pages/ExecutionPage';
import SearchPage from './pages/SearchPage'; // 👇 引入新页面

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* 首页：Dashboard */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

        {/* 👇 新增查询页路由 */}
        <Route 
          path="/search" 
          element={
            <PrivateRoute>
              <SearchPage />
            </PrivateRoute>
          } 
        />
        
        {/* 详情页 */}
        <Route 
          path="/task/:id" 
          element={
            <PrivateRoute>
              <ExecutionPage />
            </PrivateRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;