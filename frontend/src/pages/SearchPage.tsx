import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { taskService } from '../api/services';
import { Search, RotateCcw, FileCode, Clock } from 'lucide-react';

export default function SearchPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    keyword: '',
    creator_name: '',
    status: '',
    start_date: '',
    end_date: ''
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await taskService.getList({
        page: 1,
        page_size: 50,
        ...filters 
      });
      setTasks(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleReset = () => {
    setFilters({ keyword: '', creator_name: '', status: '', start_date: '', end_date: '' });
    // setTimeout 确保在状态更新后执行查询
    setTimeout(() => {
        // 由于闭包问题，这里直接调可能会用旧状态，实际项目中建议用 useEffect 监听 filters 变化或分开处理
        // 简单处理：刷新页面
        window.location.reload(); 
    }, 100); 
  };

  const getStatusBadge = (status: string) => {
      const styles: any = {
        completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        failed: 'bg-red-100 text-red-700 border-red-200',
        running: 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse',
        created: 'bg-slate-100 text-slate-600 border-slate-200',
        uploaded: 'bg-purple-100 text-purple-700 border-purple-200',
      };
      return <span className={`px-2 py-0.5 rounded text-xs border ${styles[status] || styles.created}`}>{status}</span>;
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Task Query</h1>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 grid grid-cols-6 gap-4">
            <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">Task Name</label>
                <input type="text" className="w-full border rounded p-2 text-sm" placeholder="Search name..." 
                       value={filters.keyword} onChange={e => setFilters({...filters, keyword: e.target.value})} />
            </div>
            <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">Creator</label>
                <input type="text" className="w-full border rounded p-2 text-sm" placeholder="Creator name..."
                       value={filters.creator_name} onChange={e => setFilters({...filters, creator_name: e.target.value})} />
            </div>
            <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                <select className="w-full border rounded p-2 text-sm" 
                        value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                    <option value="">All Status</option>
                    <option value="created">Created</option>
                    <option value="uploaded">Uploaded</option>
                    <option value="running">Running</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                </select>
            </div>
            <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                <input type="date" className="w-full border rounded p-2 text-sm"
                       value={filters.start_date} onChange={e => setFilters({...filters, start_date: e.target.value})} />
            </div>
            <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">End Date</label>
                <input type="date" className="w-full border rounded p-2 text-sm"
                       value={filters.end_date} onChange={e => setFilters({...filters, end_date: e.target.value})} />
            </div>
            <div className="col-span-1 flex items-end gap-2">
                <button onClick={fetchTasks} className="flex-1 bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 flex justify-center items-center gap-1">
                    <Search className="w-4 h-4"/> Search
                </button>
                <button onClick={handleReset} className="px-3 bg-slate-100 text-slate-600 p-2 rounded hover:bg-slate-200">
                    <RotateCcw className="w-4 h-4"/>
                </button>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Task Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Creator</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Contract</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {tasks.map(task => (
                    <tr key={task.id} onClick={() => navigate(`/task/${task.id}`)} className="hover:bg-slate-50 cursor-pointer">
                        <td className="px-6 py-4 font-medium text-slate-800">{task.name}</td>
                        <td className="px-6 py-4 text-indigo-600 font-medium">{task.owner_name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-slate-500 flex items-center gap-1">
                           <FileCode className="w-4 h-4"/> {task.contract_name || '-'}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{new Date(task.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3"/> {task.duration > 0 ? `${task.duration}s` : '-'}
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}