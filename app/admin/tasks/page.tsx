'use client';

import { useState, useEffect } from 'react';
import { Search, CheckSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Task } from '@/lib/types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(d => { setTasks(d.tasks || []); setLoading(false); });
  }, []);

  async function handleStatusChange(taskId: number, status: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...task, status }) });
    if (res.ok) { const d = await res.json(); setTasks(prev => prev.map(t => t.id === taskId ? d.task : t)); toast.success('Status aggiornato'); }
  }

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.project_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || t.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Task</h1>
        <p className="text-zinc-500 text-sm mt-1">{tasks.length} task totali</p>
      </div>

      <div className="flex gap-3 mb-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Cerca task..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-zinc-900 border-zinc-800 text-white" />
        </div>
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {[['all', 'Tutti'], ['todo', 'Da fare'], ['in_progress', 'In corso'], ['review', 'Review'], ['done', 'Fatto']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${filter === val ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-600"><CheckSquare size={48} className="mx-auto mb-4 opacity-30" /><p>Nessun task</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div key={task.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-white">{task.title}</span>
                  <StatusBadge status={task.status} />
                </div>
                {task.description && <p className="text-xs text-zinc-500 mb-2">{task.description}</p>}
                <div className="flex items-center gap-4 text-xs text-zinc-600">
                  <span>📁 {task.project_name}</span>
                  {task.assigned_name && <span>👤 {task.assigned_name}</span>}
                  {task.due_date && <span className={new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-400' : ''}>📅 {format(new Date(task.due_date), 'd MMM', { locale: it })}</span>}
                </div>
              </div>
              <Select value={task.status} onValueChange={v => handleStatusChange(task.id, v)}>
                <SelectTrigger className="w-28 h-8 text-xs bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {['todo', 'in_progress', 'review', 'done'].map(s => <SelectItem key={s} value={s} className="text-white text-xs">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
