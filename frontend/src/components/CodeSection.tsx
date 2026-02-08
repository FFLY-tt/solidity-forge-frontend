// src/components/CodeSection.tsx

import React, { useState } from 'react';
// import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'; // 暂时注释防白屏
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Code2, GitCompare } from 'lucide-react';

interface CodeSectionProps {
  originalCode: string;
  fixedCode: string;
  contractName: string;
}

export const CodeSection: React.FC<CodeSectionProps> = ({ originalCode, fixedCode, contractName }) => {
  const [mode, setMode] = useState<'CODE' | 'DIFF'>('CODE');
  const [version, setVersion] = useState<'v1' | 'v2'>('v1');

  const currentCode = version === 'v1' ? (originalCode || '// No V1 code') : (fixedCode || '// No V2 code (Fixing...)');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 uppercase">{contractName || 'Contract'}</span>
          {mode === 'CODE' && (
             <select 
               value={version} 
               onChange={(e) => setVersion(e.target.value as any)}
               className="text-xs border border-slate-300 rounded px-2 py-0.5 bg-white outline-none"
             >
               <option value="v1">v1 (Original)</option>
               <option value="v2">v2 (Fixed)</option>
             </select>
          )}
        </div>
        <div className="flex bg-slate-200 rounded p-0.5">
          <button onClick={() => setMode('CODE')} className={`px-3 py-1 rounded text-xs font-medium flex items-center ${mode === 'CODE' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>
            <Code2 className="w-3 h-3 mr-1" /> Code
          </button>
          <button onClick={() => setMode('DIFF')} className={`px-3 py-1 rounded text-xs font-medium flex items-center ${mode === 'DIFF' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>
            <GitCompare className="w-3 h-3 mr-1" /> Diff
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#1e1e1e] relative">
        {mode === 'CODE' ? (
          <SyntaxHighlighter language="solidity" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1.5rem', minHeight: '100%', fontSize: '12px' }} showLineNumbers={true}>
            {currentCode}
          </SyntaxHighlighter>
        ) : (
          <div className="p-4 text-slate-500 text-xs">
            Diff Viewer temporarily disabled.
          </div>
        )}
      </div>
    </div>
  );
};