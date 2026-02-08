import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { taskService } from '../api/services';
import { Plus, Trash2, Search, FileCode, PlayCircle } from 'lucide-react';

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      // 这里的 getList 已经在 services.ts 里配好了
      const res = await taskService.getList({ page: 1, page_size: 20 });
      setTasks(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleCreate = async () => {
    console.log("🚀 正在创建任务, 名称:", newTaskName);
    if (!newTaskName) return;
    try {
      // 👉 修复点：直接传字符串，不要包对象
      const res = await taskService.create(newTaskName);
      setIsModalOpen(false);
      navigate(`/task/${res.data.id}`);
    } catch (err) {
      alert("Create failed");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        // 这里的 delete 也在 services.ts 里补上了
        await taskService.delete(id);
        fetchTasks();
        
      } catch (e) {
        console.error("Delete not implemented in backend yet");
        // 暂时只是前端移除效果
        setTasks(tasks.filter(t => t.id !== id));
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'running': return 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
      case 'stopped': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Audit Missions</h1>
            <p className="text-slate-500 mt-1">Manage and track your smart contract audits</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" /> New Mission
          </button>
        </div>

        {/* Task Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading missions...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/task/${task.id}`)}
                className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDelete(e, task.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-start justify-between mb-4">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(task.status)}`}>
                    {task.status}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors truncate">
                  {task.name}
                </h3>

                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                  <FileCode className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">{task.contract_name || 'No contract uploaded'}</span>
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                   <div className="text-xs text-slate-400">
                     ID: {task.id.substring(0, 8)}
                   </div>
                   <div className="text-indigo-600 text-sm font-medium flex items-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                     View Details <PlayCircle className="w-4 h-4 ml-1" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Create New Mission</h3>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Uniswap V4 Audit"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md shadow-indigo-200"
                  >
                    Create Mission
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}