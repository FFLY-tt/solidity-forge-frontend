import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { taskService } from '../api/services';
import { CodeSection } from '../components/CodeSection';
import { Play, Square, ArrowLeft, UploadCloud, Terminal, ShieldAlert, RotateCcw, Loader2, AlertCircle, FileCode, Bug, ChevronRight, X, ChevronLeft } from 'lucide-react';

// 定义弹窗视图类型
type ModalView = 'LIST' | 'DETAIL';

export default function ExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // --- 状态管理 ---
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  
  // ⏱️ 计时器状态 (需求2)
  const [elapsedTime, setElapsedTime] = useState(0);

  // 🪟 弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<ModalView>('LIST');
  const [selectedCase, setSelectedCase] = useState<any>(null);

  // --- API 交互 ---
  const fetchTaskDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await taskService.getDetail(id);
      setTask(res.data);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load task details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 轮询日志与状态
  useEffect(() => {
    fetchTaskDetail();
    const interval = setInterval(async () => {
       if(!id || !task) return;
       try {
         const logRes = await taskService.getLogs(id);
         setLogs(logRes.data);
       } catch(e) { console.error(e); }

       // 仅在运行或创建状态下频繁刷新详情
       if (task.status === 'running' || task.status === 'created') {
          fetchTaskDetail();
       }
    }, 3000);
    return () => clearInterval(interval);
  }, [id, fetchTaskDetail, task?.status]);

  // ⏱️ 计时器核心逻辑 (需求2)
  useEffect(() => {
    let timer: any;
    if (task?.status === 'running' && task.started_at) {
        // 如果正在运行，计算：当前时间 - 开始时间
        const start = new Date(task.started_at).getTime();
        timer = setInterval(() => {
            const now = new Date().getTime();
            // 防止本地时间偏差导致负数
            const diff = Math.max(0, Math.floor((now - start) / 1000));
            setElapsedTime(diff);
        }, 1000);
    } else if (task?.duration) {
        // 如果任务结束，直接显示后端存的总耗时
        setElapsedTime(task.duration);
    } else {
        // 还没开始
        setElapsedTime(0);
    }
    return () => clearInterval(timer);
  }, [task]);

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- 按钮操作 ---
  const handleStart = async () => {
    if (!id) return;
    setIsStarting(true);
    try { 
      await taskService.start(id); 
      // 稍微延迟一下，给后端写入 started_at 的时间
      setTimeout(() => {
          fetchTaskDetail();
          setIsStarting(false);
      }, 500);
    } catch (err) { 
      alert("Start failed"); 
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    if (!id) return;
    try { await taskService.stop(id); fetchTaskDetail(); } catch (err) { alert("Stop failed"); }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !id) return;
    try {
      setLoading(true);
      await taskService.upload(id, e.target.files[0]);
      await fetchTaskDetail();
    } catch (err) { 
      alert("Upload failed"); 
      setLoading(false);
    }
  };

  // --- 统计计算 ---
  const matrix = task?.matrix_cases || [];
  const failedCases = matrix.filter((c: any) => c.status === 'FAILING');
  const activeThreats = failedCases.length;
  const totalCases = matrix.length;
  const passedCases = totalCases - activeThreats;
  const coverage = totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 0;

  // --- 弹窗逻辑 ---
  const openFailureList = () => {
    if (activeThreats === 0) return;
    setModalView('LIST');
    setIsModalOpen(true);
  };

  const openCaseDetail = (caseItem: any) => {
    setSelectedCase(caseItem);
    setModalView('DETAIL');
  };

  const goBackToList = () => {
    setModalView('LIST');
    setSelectedCase(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalView('LIST');
    setSelectedCase(null);
  };

  // --- 渲染操作区 ---
  const renderActionButtons = () => {
    if (!task) return null;
    if (task.status === 'running') {
      return (
        <button onClick={handleStop} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium shadow-sm transition-all animate-pulse">
          <Square className="w-4 h-4" /> Stop
        </button>
      );
    }
    const hasContract = !!task.contract_name;
    const isReadyToStart = hasContract && !isStarting;
    return (
      <div className="flex gap-2">
        <label className={`flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg font-medium cursor-pointer transition-all text-xs ${hasContract ? 'bg-white text-slate-600 hover:bg-slate-50' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'}`}>
          <UploadCloud className="w-4 h-4" /> {hasContract ? 'Re-upload' : 'Upload'}
          <input type="file" className="hidden" accept=".sol" onChange={handleFileUpload} />
        </label>
        <button onClick={handleStart} disabled={!isReadyToStart} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm text-white transition-all text-xs ${!isReadyToStart ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>
          {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {task.status === 'created' || task.status === 'uploaded' ? 'Start' : 'Restart'}
        </button>
      </div>
    );
  };

  if (loading) return <Layout><div className="flex h-screen items-center justify-center text-slate-500 gap-2"><Loader2 className="animate-spin"/> Loading Mission...</div></Layout>;
  if (error) return <Layout><div className="p-10 text-center text-red-500">{error}</div></Layout>;

  return (
    <Layout>
      <div className="h-full flex flex-col bg-slate-50 relative">
        
        {/* === Header === */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
               <h1 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                 {task?.name}
                 <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide border ${task?.status === 'running' ? 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                   {task?.status}
                 </span>
               </h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* 统计指标 */}
            <div className="flex gap-6 mr-4 border-r border-slate-100 pr-6">
               <div className="text-center">
                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Time</div>
                 {/* 👇 动态时间显示 */}
                 <div className="text-lg font-mono font-bold text-slate-700">{formatTime(elapsedTime)}</div>
               </div>
               <div className="text-center">
                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Threats</div>
                 <div className={`text-lg font-bold ${activeThreats > 0 ? 'text-red-600' : 'text-slate-700'}`}>{activeThreats}</div>
               </div>
               <div className="text-center">
                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Coverage</div>
                 <div className="text-lg font-bold text-slate-700">{coverage}%</div>
               </div>
            </div>
            {renderActionButtons()}
          </div>
        </div>

        {/* === Main Content === */}
        <div className="flex-1 overflow-hidden p-4 flex gap-4">
           
           {/* 1. Left: Risk Discovery */}
           <div className="w-1/4 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm">
              <div className="p-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2 text-sm">
                 <ShieldAlert className="w-4 h-4 text-orange-500" /> Risk Discovery
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-6">
                
                {/* Static Analysis */}
                <div className="pb-4 border-b border-slate-100">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                     Static Analysis
                     <span className="text-[10px] bg-slate-100 px-1.5 rounded text-slate-500">Slither</span>
                   </h4>
                   {/* 👇 需求3：没报告时显示友好提示 */}
                   {!task?.slither_report ? (
                      <div className="text-xs text-slate-400 italic text-center p-3 border border-dashed border-slate-200 rounded bg-slate-50">
                        No Analysis Report
                      </div>
                   ) : (
                      <div className="space-y-2">
                         <div className="text-xs text-slate-600 bg-orange-50 p-2 rounded border border-orange-100 whitespace-pre-wrap max-h-40 overflow-auto scrollbar-thin">
                            {task.slither_report}
                         </div>
                      </div>
                   )}
                </div>

                {/* Dynamic Fuzzing */}
                <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex justify-between">
                     Dynamic Fuzzing
                     <span className="text-[10px] bg-slate-100 px-1.5 rounded text-slate-500">Agent</span>
                   </h4>
                   <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-700">Current Session</span>
                        <span className="text-[10px] text-slate-400">v1.0</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-500">Pass / Total:</span>
                         <div className="flex gap-1 font-mono font-bold">
                            <span className="text-emerald-600">{passedCases}</span>
                            <span className="text-slate-400">/</span>
                            <span 
                               onClick={openFailureList}
                               className={`cursor-pointer underline decoration-dotted underline-offset-2 ${totalCases > 0 ? 'text-slate-800' : 'text-slate-400'}`}
                            >
                               {totalCases}
                            </span>
                         </div>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-2">
                         <span className="text-slate-500">Failures:</span>
                         <span 
                            onClick={openFailureList}
                            className={`font-mono font-bold cursor-pointer px-2 py-0.5 rounded transition-colors ${activeThreats > 0 ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-slate-100 text-slate-400'}`}
                         >
                            {activeThreats} Issues
                         </span>
                      </div>
                   </div>
                   <div className="text-[10px] text-slate-400 text-center italic">
                      Click numbers to view failure details
                   </div>
                </div>
              </div>
           </div>

           {/* 2. Center: Attack Matrix & Logs */}
           <div className="w-2/4 flex flex-col gap-4">
              <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-md flex flex-col overflow-hidden relative">
                 <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                       <Bug className="w-4 h-4 text-indigo-500" /> Attack Matrix Visualization
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                       {activeThreats} Active Threats / {totalCases} Total
                    </div>
                 </div>
                 
                 <div className="flex-1 bg-slate-50/50 p-6 overflow-y-auto relative">
                    {/* 👇 需求4：优化初始状态显示 */}
                    {totalCases === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center text-slate-400">
                          {task?.status === 'created' || task?.status === 'uploaded' ? (
                             <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                                <Bug className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                                <p className="text-sm font-medium text-slate-600">Ready to start audit</p>
                                <p className="text-xs mt-1 text-slate-400">Click the "Start" button above to launch the Red Team agent.</p>
                             </div>
                          ) : task?.status === 'running' ? (
                             <>
                                <Loader2 className="w-10 h-10 mb-3 animate-spin text-indigo-400" />
                                <p className="text-sm font-medium">Fuzzing Engine Active...</p>
                                <p className="text-xs text-slate-400 mt-1">Generating attack vectors</p>
                             </>
                          ) : (
                             <p className="text-sm">No cases generated.</p>
                          )}
                       </div>
                    ) : (
                       <div className="grid grid-cols-6 gap-3 content-start">
                          {matrix.map((c: any, idx: number) => (
                            <div 
                              key={c.id || idx} 
                              title={`${c.name} - ${c.status}`}
                              className={`
                                aspect-square rounded-lg border-2 shadow-sm transition-all duration-300 transform hover:scale-110 cursor-help flex items-center justify-center relative
                                ${c.status === 'FAILING' ? 'bg-red-500 border-red-600 shadow-red-200' : 'bg-emerald-500 border-emerald-600 shadow-emerald-200'}
                              `}
                            >
                               <div className="w-2 h-2 rounded-full bg-white/30" />
                            </div>
                          ))}
                          {task.status === 'running' && (
                             <div className="aspect-square rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 animate-pulse flex items-center justify-center">
                                <span className="text-slate-300 text-xs">...</span>
                             </div>
                          )}
                       </div>
                    )}
                 </div>
                 
                 <div className="p-2 border-t border-slate-100 bg-white flex justify-center gap-6 text-[10px] text-slate-500 uppercase tracking-wide">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500"></div> Mitigated</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500"></div> Active Threat</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border border-dashed border-slate-300 bg-slate-50"></div> Pending</div>
                 </div>
              </div>

              {/* Logs */}
              <div className="h-40 bg-[#1e1e1e] rounded-xl border border-slate-800 flex flex-col shadow-inner overflow-hidden shrink-0">
                  <div className="px-3 py-1.5 border-b border-gray-800 flex items-center gap-2 bg-[#252526]">
                    <Terminal className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">System Output</span>
                  </div>
                  <div className="flex-1 overflow-auto p-2 font-mono text-[10px] space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
                    {logs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-gray-500 shrink-0">[{new Date(log.time).toLocaleTimeString([], {hour12: false})}]</span>
                        <span className={`${log.level === 'ERROR' ? 'text-red-400' : 'text-emerald-400'} break-all`}>
                          {log.content}
                        </span>
                      </div>
                    ))}
                    <div id="log-end" /> 
                  </div>
              </div>
           </div>

           {/* 3. Right: Code Section */}
           <div className="w-1/4 h-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 font-bold text-slate-700 text-sm">
                 <FileCode className="w-4 h-4 text-slate-500" /> Contract Source
              </div>
              <div className="flex-1 overflow-hidden relative">
                 {/* 👇 需求4：传递 isUploaded 和 hasFix 以控制下拉框 */}
                 <CodeSection 
                   originalCode={task?.codes?.original || ''} 
                   fixedCode={task?.codes?.fix || ''} 
                   contractName={task?.contract_name || ''}
                   isUploaded={!!task?.contract_name}
                   hasFix={!!task?.codes?.fix}
                 />
                 {!task?.codes?.original && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50/50 backdrop-blur-sm">
                       <div className="text-center">
                          <p>Waiting for upload...</p>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* === Drill-Down Modal === */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div className="flex items-center gap-2">
                    {modalView === 'DETAIL' && (
                       <button onClick={goBackToList} className="p-1 hover:bg-slate-200 rounded transition-colors mr-1">
                          <ChevronLeft className="w-5 h-5 text-slate-600" />
                       </button>
                    )}
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                       {modalView === 'LIST' ? (
                          <><AlertCircle className="w-5 h-5 text-red-500" /> Failed Test Cases ({activeThreats})</>
                       ) : (
                          <><Bug className="w-5 h-5 text-red-500" /> Attack Details: #{selectedCase?.name || 'Unknown'}</>
                       )}
                    </h3>
                 </div>
                 <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                 </button>
              </div>

              <div className="flex-1 overflow-auto p-0 bg-white">
                 {modalView === 'LIST' ? (
                    <div className="divide-y divide-slate-100">
                       {failedCases.map((c: any, i: number) => (
                          <div 
                             key={i} 
                             onClick={() => openCaseDetail(c)}
                             className="p-4 hover:bg-slate-50 cursor-pointer transition-colors group flex justify-between items-center"
                          >
                             <div className="flex items-start gap-3">
                                <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                <div>
                                   <div className="font-mono text-sm font-bold text-slate-700 group-hover:text-indigo-600">
                                      {c.name || `Case #${i+1}`}
                                   </div>
                                   <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                                      {c.description || 'AI Generated Attack Vector...'}
                                   </div>
                                </div>
                             </div>
                             <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                          </div>
                       ))}
                       {failedCases.length === 0 && (
                          <div className="p-10 text-center text-slate-400 italic">No failed cases found. Good job!</div>
                       )}
                    </div>
                 ) : (
                    <div className="flex flex-col h-full">
                       <div className="p-4 bg-red-50 border-b border-red-100">
                          <div className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Vulnerability Type</div>
                          <div className="text-sm text-red-900">Logic Error / Re-entrancy (Detected by Agent)</div>
                       </div>
                       <div className="flex-1 bg-[#1e1e1e] p-4 overflow-auto">
                          <pre className="font-mono text-xs text-green-400 whitespace-pre-wrap leading-relaxed">
                             {selectedCase?.code || '// Code not available'}
                          </pre>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
}