import React, { useState } from 'react';
import { ShieldCheck, Bug, XCircle, CheckCircle, Terminal } from 'lucide-react';

// 定义用例的数据结构
export interface TestCase {
  id: string;
  source: 'SLITHER' | 'FUZZER' | 'RED_TEAM';
  status: 'FAILING' | 'PASSING' | 'PENDING';
  name: string;
  description: string;
  code: string; // 具体的攻击代码
}

interface MatrixProps {
  cases: TestCase[];
  onSelectCase: (testCase: TestCase) => void;
}

export const ImmunityMatrix: React.FC<MatrixProps> = ({ cases, onSelectCase }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-700 flex items-center">
          <ShieldCheck className="w-5 h-5 mr-2 text-indigo-600" />
          Attack Matrix
        </h3>
        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
          {cases.filter(c => c.status === 'PASSING').length} / {cases.length} BLOCKED
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-6 gap-2">
          {cases.map((testCase) => (
            <button
              key={testCase.id}
              onClick={() => onSelectCase(testCase)}
              className={`
                aspect-square rounded-md transition-all duration-300 transform hover:scale-105 relative group
                ${testCase.status === 'FAILING' ? 'bg-red-500 shadow-red-200' : ''}
                ${testCase.status === 'PASSING' ? 'bg-emerald-500 shadow-emerald-200' : ''}
                ${testCase.status === 'PENDING' ? 'bg-slate-200' : ''}
                shadow-md border border-white/20
              `}
            >
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap pointer-events-none z-10 transition-opacity">
                {testCase.id}: {testCase.source}
              </div>
            </button>
          ))}
          
          {/* 占位符：模拟正在生成的方块 */}
          <div className="aspect-square rounded-md bg-slate-100 border-2 border-dashed border-slate-300 animate-pulse flex items-center justify-center">
             <span className="text-slate-300 text-xs">...</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-100 flex gap-4 text-xs text-slate-500">
        <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded mr-1"></div> Active Threat</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-emerald-500 rounded mr-1"></div> Mitigated</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-slate-200 rounded mr-1"></div> Pending</div>
      </div>
    </div>
  );
};

// 抽屉详情组件
export const MatrixDrawer: React.FC<{ testCase: TestCase | null; onClose: () => void }> = ({ testCase, onClose }) => {
  if (!testCase) return null;

  return (
    <div className="absolute inset-y-0 right-0 w-1/3 bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 z-50 flex flex-col">
      <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
        <div>
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            {testCase.status === 'FAILING' ? <XCircle className="text-red-500 w-5 h-5"/> : <CheckCircle className="text-emerald-500 w-5 h-5"/>}
            Case #{testCase.id}
          </h4>
          <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1 block">
            Source: {testCase.source}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <XCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-6">
          <h5 className="text-sm font-semibold text-slate-700 mb-2">Description</h5>
          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {testCase.description}
          </p>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
            <Terminal className="w-4 h-4 mr-1" /> Exploit Code (PoC)
          </h5>
          <pre className="bg-[#1e1e1e] text-slate-300 p-3 rounded-lg text-xs font-mono overflow-x-auto">
            <code>{testCase.code}</code>
          </pre>
        </div>

        <div className="mt-6 p-3 rounded-lg border border-l-4 text-xs ${testCase.status === 'FAILING' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-emerald-50 border-emerald-500 text-emerald-700'}">
          <strong>Status:</strong> {testCase.status === 'FAILING' ? 'Attack Successful (Vulnerability Confirmed)' : 'Attack Blocked (Safe)'}
        </div>
      </div>
    </div>
  );
};