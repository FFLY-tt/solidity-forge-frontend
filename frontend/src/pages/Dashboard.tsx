import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { taskService, authService } from '../api/services'; // 引入 authService
import { Plus, Trash2, FileCode, Clock } from 'lucide-react';

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 初始化加载：先获取用户，再获取该用户的任务
  useEffect(() => {
    const init = async () => {
      try {
        const user = await authService.getMe();
        setCurrentUser(user);
        await fetchTasks(user.id); // 传入 owner_id
      } catch (err) {
        console.error("Init failed", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchTasks = async (ownerId?: number) => {
    try {
      // 传入 owner_id 只查自己的任务
      const res = await taskService.getList({ page: 1, page_size: 20, owner_id: ownerId });
      setTasks(res.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!newTaskName) return;
    try {
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
        await taskService.delete(id);
        // 重新拉取列表 (使用当前列表状态中的 owner_id 逻辑，这里简化直接刷新页面或重新过滤)
        setTasks(tasks.filter(t => t.id !== id));
      } catch (e) {
        alert("Delete failed");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      running: 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse',
      stopped: 'bg-amber-100 text-amber-700 border-amber-200',
      created: 'bg-slate-100 text-slate-600 border-slate-200',
      uploaded: 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${styles[status] || styles.created}`}>
        {status}
      </span>
    );
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Missions</h1>
            <p className="text-slate-500 mt-1">Manage your own audit tasks</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" /> New Mission
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contract</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading...</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">No missions found.</td></tr>
              ) : (
                tasks.map((task) => (
                  <tr 
                    key={task.id} 
                    onClick={() => navigate(`/task/${task.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {task.name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {task.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FileCode className="w-4 h-4 text-slate-400" />
                        {task.contract_name || <span className="text-slate-400 italic">Pending</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                       <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.duration ? `${task.duration}s` : '-'}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(task.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => handleDelete(e, task.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                  <button onClick={handleCreate} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">Create</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}