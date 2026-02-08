import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { taskService } from '../api/services';
import { CodeSection } from '../components/CodeSection';
import { Play, Square, ArrowLeft, UploadCloud, Terminal, ShieldAlert, Loader2, AlertCircle, FileCode, Bug, ChevronRight, X, ChevronLeft } from 'lucide-react';

type ModalView = 'LIST' | 'DETAIL';

export default function ExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<ModalView>('LIST');
  const [selectedCase, setSelectedCase] = useState<any>(null);

  const fetchTaskDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await taskService.getDetail(id);
      setTask(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load task details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTaskDetail();
    const interval = setInterval(async () => {
      if (!id || !task) return;
      if (task.status === 'running' || task.status === 'created') {
        try {
          const logRes = await taskService.getLogs(id);
          setLogs(logRes.data);
          fetchTaskDetail();
        } catch (e) { console.error(e); }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [id, fetchTaskDetail, task?.status]);

  useEffect(() => {
    let timer: any;
    if (task?.status === 'running' && task.started_at) {
      const start = new Date(task.started_at).getTime();
      timer = setInterval(() => {
        const now = new Date().getTime();
        setElapsedTime(Math.max(0, Math.floor((now - start) / 1000)));
      }, 1000);
    } else if (task?.duration) {
      setElapsedTime(task.duration);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(timer);
  }, [task?.status, task?.started_at, task?.duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!id) return;
    setIsStarting(true);
    try {
      await taskService.start(id);
      setTimeout(() => { fetchTaskDetail(); setIsStarting(false); }, 500);
    } catch (err) { alert("Start failed"); setIsStarting(false); }
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
    } catch (err) { alert("Upload failed"); setLoading(false); }
  };

  const matrix = task?.matrix_cases || [];
  const failedCases = matrix.filter((c: any) => c.status === 'FAILING');
  const activeThreats = failedCases.length;
  const totalCases = matrix.length;
  const coverage = totalCases > 0 ? Math.round(((totalCases - activeThreats) / totalCases) * 100) : 0;

  const openFailureList = () => { if (activeThreats > 0) { setModalView('LIST'); setIsModalOpen(true); } };
  const openCaseDetail = (caseItem: any) => { setSelectedCase(caseItem); setModalView('DETAIL'); };
  const goBackToList = () => { setModalView('LIST'); setSelectedCase(null); };
  const closeModal = () => { setIsModalOpen(false); setModalView('LIST'); setSelectedCase(null); };

  const renderActionButtons = () => {
    if (!task) return null;
    if (task.status === 'running') {
      return <button onClick={handleStop} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium animate-pulse"><Square className="w-4 h-4" /> Stop</button>;
    }
    const hasContract = !!task.contract_name;
    const isReadyToStart = hasContract && !isStarting;
    return (
      <div className="flex gap-2">
        <label className={`flex items-center gap-2 px-3 py-2 border rounded-lg font-medium cursor-pointer text-xs ${hasContract ? 'bg-white text-slate-600 border-slate-300' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
          <UploadCloud className="w-4 h-4" /> {hasContract ? 'Re-upload' : 'Upload'}
          <input type="file" className="hidden" accept=".sol" onChange={handleFileUpload} />
        </label>
        <button onClick={handleStart} disabled={!isReadyToStart} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white text-xs ${!isReadyToStart ? 'bg-slate-300' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
          {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {task.status === 'created' || task.status === 'uploaded' ? 'Start' : 'Restart'}
        </button>
      </div>
    );
  };

  if (loading) return <Layout><div className="flex h-screen items-center justify-center text-slate-500 gap-2"><Loader2 className="animate-spin" /> Loading Mission...</div></Layout>;
  if (error) return <Layout><div className="p-10 text-center text-red-500">{error}</div></Layout>;

  return (
    <Layout>
      <div className="h-full flex flex-col bg-slate-50 relative">
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-3">
              {task?.name}
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase border ${task?.status === 'running' ? 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{task?.status}</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-6 mr-4 border-r border-slate-100 pr-6">
              <div className="text-center"><div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Time</div><div className="text-lg font-mono font-bold text-slate-700">{formatTime(elapsedTime)}</div></div>
              <div className="text-center"><div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Threats</div><div className={`text-lg font-bold ${activeThreats > 0 ? 'text-red-600' : 'text-slate-700'}`}>{activeThreats}</div></div>
              <div className="text-center"><div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Pass Rate</div><div className="text-lg font-bold text-slate-700">{coverage}%</div></div>
            </div>
            {renderActionButtons()}
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-4 flex gap-4">
          <div className="w-1/4 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2 text-sm"><ShieldAlert className="w-4 h-4 text-orange-500" /> Risk Discovery</div>
            <div className="flex-1 overflow-auto p-4 space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex justify-between">Static Analysis <span className="text-[10px] bg-slate-100 px-1.5 rounded text-slate-500">Slither</span></h4>
                {!task?.slither_report ? <div className="text-xs text-slate-400 italic text-center p-3 border border-dashed border-slate-200 rounded bg-slate-50">No Analysis Report</div> : <div className="text-xs text-slate-600 bg-orange-50 p-2 rounded border border-orange-100 whitespace-pre-wrap max-h-60 overflow-auto font-mono">{task.slither_report}</div>}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex justify-between">Dynamic Fuzzing <span className="text-[10px] bg-slate-100 px-1.5 rounded text-slate-500">Agent</span></h4>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-3"><span className="text-xs font-bold text-slate-700">Current Session</span><span className="text-[10px] text-slate-400">Latest</span></div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Failures / Total:</span>
                    <div className="flex items-center gap-1 font-mono">
                      <button onClick={openFailureList} disabled={activeThreats === 0} className={`text-lg font-bold px-2 py-0.5 rounded transition-all ${activeThreats > 0 ? 'text-red-600 bg-red-100 hover:bg-red-200 underline decoration-dotted cursor-pointer' : 'text-emerald-600'}`}>{activeThreats}</button>
                      <span className="text-slate-400 text-sm">/</span><span className="text-slate-700 font-bold text-sm">{totalCases}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-2/4 flex flex-col gap-4">
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-md flex flex-col overflow-hidden relative">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="font-bold text-slate-700 text-sm flex items-center gap-2"><Bug className="w-4 h-4 text-indigo-500" /> Attack Matrix Visualization</div>
                <div className="text-xs text-slate-500 font-mono">{activeThreats} Threats / {totalCases} Total</div>
              </div>
              <div className="flex-1 bg-slate-50/50 p-6 overflow-y-auto">
                {totalCases === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    {task?.status === 'running' ? <><Loader2 className="w-10 h-10 mb-3 animate-spin text-indigo-400" /><p className="text-sm font-medium">Scanning...</p></> : <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-white/50"><Bug className="w-12 h-12 mx-auto text-slate-300 mb-2" /><p className="text-sm font-medium">Ready to start</p></div>}
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-3 content-start">
                    {matrix.map((c: any, idx: number) => <div key={c.id || idx} className={`aspect-square rounded-lg border-2 shadow-sm transition-all transform hover:scale-110 flex items-center justify-center ${c.status === 'FAILING' ? 'bg-red-500 border-red-600' : 'bg-emerald-500 border-emerald-600'}`}><div className="w-2 h-2 rounded-full bg-white/30" /></div>)}
                  </div>
                )}
              </div>
            </div>
            <div className="h-40 bg-[#1e1e1e] rounded-xl border border-slate-800 flex flex-col overflow-hidden">
              <div className="px-3 py-1.5 border-b border-gray-800 flex items-center gap-2 bg-[#252526]"><Terminal className="w-3 h-3 text-slate-400" /><span className="text-[10px] font-bold text-slate-300 uppercase">System Output</span></div>
              <div className="flex-1 overflow-auto p-2 font-mono text-[10px] space-y-1">
                {logs.map((log, i) => <div key={i} className="flex gap-2"><span className="text-gray-500">[{new Date(log.time).toLocaleTimeString([], { hour12: false })}]</span><span className={log.level === 'ERROR' ? 'text-red-400' : 'text-emerald-400'}>{log.content}</span></div>)}
              </div>
            </div>
          </div>
          <div className="w-1/4 h-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 font-bold text-slate-700 text-sm"><FileCode className="w-4 h-4 text-slate-500" /> Contract Source</div>
            <div className="flex-1 overflow-hidden relative">
              <CodeSection originalCode={task?.codes?.original || ''} fixedCode={task?.codes?.fix || ''} contractName={task?.contract_name || ''} isUploaded={!!task?.contract_name} hasFix={!!task?.codes?.fix} />
              {!task?.codes?.original && <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50/50">Waiting for upload...</div>}
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                {modalView === 'DETAIL' && <button onClick={goBackToList} className="p-1 hover:bg-slate-200 rounded"><ChevronLeft className="w-5 h-5" /></button>}
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">{modalView === 'LIST' ? <><AlertCircle className="w-5 h-5 text-red-500" /> Failed Test Cases ({activeThreats})</> : <><Bug className="w-5 h-5 text-red-500" /> #{selectedCase?.name}</>}</h3>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-auto bg-white">
              {modalView === 'LIST' ? (
                <div className="divide-y divide-slate-100">
                  {failedCases.map((c: any, i: number) => <div key={i} onClick={() => openCaseDetail(c)} className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center group"><div className="flex items-start gap-3"><div className="mt-1 w-2 h-2 rounded-full bg-red-500" /><div><div className="font-mono text-sm font-bold text-slate-700 group-hover:text-indigo-600">{c.name}</div><div className="text-xs text-slate-500 mt-1">{c.description || 'AI Attack Vector'}</div></div></div><ChevronRight className="w-4 h-4 text-slate-300" /></div>)}
                </div>
              ) : (
                <div className="flex flex-col h-full"><div className="p-4 bg-red-50 border-b border-red-100"><div className="text-xs font-bold text-red-800 uppercase mb-1">Type</div><div className="text-sm text-red-900">Logic Error / Re-entrancy</div></div><div className="flex-1 bg-[#1e1e1e] p-4 overflow-auto"><pre className="font-mono text-xs text-green-400 whitespace-pre-wrap">{selectedCase?.code || '// Code not available'}</pre></div></div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}