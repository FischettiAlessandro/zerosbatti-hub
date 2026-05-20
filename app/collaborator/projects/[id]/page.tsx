'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { CommentBox } from '@/components/forms/CommentBox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Project, Task, ContentItem } from '@/lib/types';

export default function CollabProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(d => {
      setProject(d.project); setTasks(d.tasks || []); setContent(d.content || []); setLoading(false);
    });
  }, [id]);

  async function updateTaskStatus(taskId: number, status: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...task, status }) });
    if (res.ok) { const d = await res.json(); setTasks(prev => prev.map(t => t.id === taskId ? d.task : t)); toast.success('Task aggiornato'); }
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>;
  if (!project) return <div className="text-center py-16 text-zinc-600">Progetto non trovato</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/collaborator/projects"><Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white"><ArrowLeft size={18} /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          <p className="text-zinc-500 text-sm">{project.client_name}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <Tabs defaultValue="tasks">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
          <TabsTrigger value="tasks" className="data-[state=active]:bg-zinc-700">Task ({tasks.length})</TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-zinc-700">Contenuti ({content.length})</TabsTrigger>
          <TabsTrigger value="comments" className="data-[state=active]:bg-zinc-700">💬 Commenti</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <div className="space-y-2">
            {tasks.length === 0 ? <p className="text-sm text-zinc-600 py-6 text-center">Nessun task</p> : tasks.map(task => (
              <div key={task.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><span className="font-medium text-white text-sm">{task.title}</span><StatusBadge status={task.status} /></div>
                  {task.description && <p className="text-xs text-zinc-500 mb-2">{task.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-zinc-600">
                    {task.assigned_name && <span>👤 {task.assigned_name}</span>}
                    {task.due_date && <span className={new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-400' : ''}>📅 {format(new Date(task.due_date), 'd MMM', { locale: it })}</span>}
                  </div>
                </div>
                <Select value={task.status} onValueChange={v => updateTaskStatus(task.id, v)}>
                  <SelectTrigger className="w-28 h-7 text-xs bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">{['todo', 'in_progress', 'review', 'done'].map(s => <SelectItem key={s} value={s} className="text-white text-xs">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="space-y-2">
            {content.length === 0 ? <p className="text-sm text-zinc-600 py-6 text-center">Nessun contenuto</p> : content.map(item => (
              <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-white text-sm">{item.title}</span>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{item.type}</span>
                  <StatusBadge status={item.status} />
                </div>
                {item.description && <p className="text-xs text-zinc-500 mb-2">{item.description}</p>}
                {item.link_url && <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><ExternalLink size={10} />Apri link</a>}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comments">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <CommentBox projectId={Number(id)} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
