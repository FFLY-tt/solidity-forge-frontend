import React from 'react';
import { AlertTriangle, Zap, Check } from 'lucide-react';

interface RiskPanelProps {
  slitherReport: string;
  fuzzerStats: { total: number; passed: number };
}

export const RiskPanel: React.FC<RiskPanelProps> = ({ slitherReport, fuzzerStats }) => {
  // 简单解析 Slither 文本，提取 Issue
  // 假设格式包含 "High:", "Medium:" 或直接的列表
  const issues = slitherReport 
    ? slitherReport.split('\n').filter(line => line.includes('High') || line.includes('Medium') || line.includes('Low')).slice(0, 5)
    : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
        Risk Discovery
      </h3>

      {/* 1. 静态扫描部分 */}
      <div className="mb-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Static Analysis (Slither)</h4>
        <div className="space-y-2">
          {issues.length > 0 ? (
            issues.map((issue, idx) => (
              <div key={idx} className="p-2 bg-amber-50 border border-amber-100 rounded-md text-xs text-amber-800 flex items-start cursor-pointer hover:bg-amber-100 transition-colors">
                <span className="mr-2 mt-0.5">●</span>
                <span className="break-all">{issue.substring(0, 60)}...</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 italic">No static issues found yet...</div>
          )}
        </div>
      </div>

      {/* 2. 动态扫描部分 */}
      <div className="flex-1">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dynamic Fuzzing</h4>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-600 font-medium">Test Cases</span>
            <span className="text-xs font-mono font-bold text-slate-700">
              <span className="text-emerald-600">{fuzzerStats.passed}</span> / {fuzzerStats.total}
            </span>
          </div>
          {/* 进度条 */}
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${fuzzerStats.total > 0 ? (fuzzerStats.passed / fuzzerStats.total) * 100 : 0}%` }}
            ></div>
          </div>
          
          <div className="flex gap-2 mt-3">
             <div className="flex-1 bg-white p-2 rounded border border-slate-200 text-center">
                <div className="text-[10px] text-slate-400">Coverage</div>
                <div className="text-sm font-bold text-indigo-600">--%</div>
             </div>
             <div className="flex-1 bg-white p-2 rounded border border-slate-200 text-center">
                <div className="text-[10px] text-slate-400">Crashes</div>
                <div className="text-sm font-bold text-red-500">{fuzzerStats.total - fuzzerStats.passed}</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};