'use client';

import { useState, useEffect } from 'react';
import { CheckSquare } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Task } from '@/lib/types';

export default function CollabTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(d => { setTasks(d.tasks || []); setLoading(false); });
  }, []);

  async function updateStatus(taskId: number, status: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...task, status }) });
    if (res.ok) { const d = await res.json(); setTasks(prev => prev.map(t => t.id === taskId ? d.task : t)); toast.success('Task aggiornato'); }
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">I miei Task</h1>
        <p className="text-zinc-500 text-sm mt-1">{tasks.filter(t => t.status !== 'done').length} task aperti</p>
      </div>

      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-4 w-fit">
        {[['all', 'Tutti'], ['todo', 'Da fare'], ['in_progress', 'In corso'], ['review', 'Review'], ['done', 'Fatto']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${filter === val ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>{label}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
        : filtered.length === 0 ? <div className="text-center py-16 text-zinc-600"><CheckSquare size={48} className="mx-auto mb-4 opacity-30" /><p>{filter === 'done' ? 'Nessun task completato' : 'Nessun task 🎉'}</p></div>
        : <div className="space-y-2">
          {filtered.map(task => (
            <div key={task.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap"><span className="font-medium text-white">{task.title}</span><StatusBadge status={task.status} /></div>
                {task.description && <p className="text-xs text-zinc-500 mb-2">{task.description}</p>}
                <div className="flex items-center gap-3 text-xs text-zinc-600">
                  <span>📁 {task.project_name}</span>
                  {task.due_date && <span className={new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-400 font-medium' : ''}>📅 {format(new Date(task.due_date), 'd MMM', { locale: it })}</span>}
                </div>
              </div>
              <Select value={task.status} onValueChange={v => updateStatus(task.id, v)}>
                <SelectTrigger className="w-28 h-8 text-xs bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">{['todo', 'in_progress', 'review', 'done'].map(s => <SelectItem key={s} value={s} className="text-white text-xs">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
