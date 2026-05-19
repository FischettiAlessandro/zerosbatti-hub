'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, CheckSquare, FileText, Users, Trash2, Edit, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { CommentBox } from '@/components/forms/CommentBox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskOpen, setTaskOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', status: 'todo', due_date: '' });
  const [contentForm, setContentForm] = useState({ title: '', type: 'copy', link_url: '', description: '', status: 'draft', scheduled_date: '' });

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then(r => r.json()),
      fetch('/api/users?role=collaborator').then(r => r.json()),
    ]).then(([projData, usersData]) => {
      setProject(projData.project);
      setTasks(projData.tasks || []);
      setContent(projData.content || []);
      setTeam(projData.team || []);
      setCollaborators(usersData.users || []);
      setLoading(false);
    });
  }, [id]);

  async function handleCreateTask() {
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...taskForm, project_id: id, assigned_to: taskForm.assigned_to || undefined }) });
    if (res.ok) { toast.success('Task creato!'); setTaskOpen(false); const d = await res.json(); setTasks(t => [d.task, ...t]); setTaskForm({ title: '', description: '', assigned_to: '', status: 'todo', due_date: '' }); }
    else toast.error('Errore');
  }

  async function handleTaskStatus(taskId: number, status: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...task, status }) });
    if (res.ok) { const d = await res.json(); setTasks(t => t.map(task => task.id === taskId ? d.task : task)); }
  }

  async function handleCreateContent() {
    const res = await fetch('/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...contentForm, project_id: id }) });
    if (res.ok) { toast.success('Contenuto aggiunto!'); setContentOpen(false); const d = await res.json(); setContent(c => [d.item, ...c]); setContentForm({ title: '', type: 'copy', link_url: '', description: '', status: 'draft', scheduled_date: '' }); }
    else toast.error('Errore');
  }

  async function handleContentStatus(contentId: number, status: string) {
    const item = content.find(c => c.id === contentId);
    if (!item) return;
    const res = await fetch(`/api/content/${contentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, status }) });
    if (res.ok) { const d = await res.json(); setContent(c => c.map(i => i.id === contentId ? d.item : i)); }
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>;
  if (!project) return <div className="text-center py-16 text-zinc-600">Progetto non trovato</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/projects"><Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white"><ArrowLeft size={18} /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          <p className="text-zinc-500 text-sm">{project.client_name} · {project.client_company || project.client_email}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {project.description && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-zinc-400">{project.description}</p>
        </div>
      )}

      <Tabs defaultValue="tasks">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
          <TabsTrigger value="tasks" className="data-[state=active]:bg-zinc-700"><CheckSquare size={14} className="mr-1.5" />Task ({tasks.length})</TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-zinc-700"><FileText size={14} className="mr-1.5" />Contenuti ({content.length})</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-zinc-700"><Users size={14} className="mr-1.5" />Team ({team.length})</TabsTrigger>
          <TabsTrigger value="comments" className="data-[state=active]:bg-zinc-700">💬 Commenti</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-white">Task</h2>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 gap-1.5" onClick={() => setTaskOpen(true)}><Plus size={14} />Nuovo task</Button>
          </div>
          <div className="space-y-2">
            {tasks.length === 0 ? <p className="text-sm text-zinc-600 py-6 text-center">Nessun task</p> : tasks.map(task => (
              <div key={task.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm">{task.title}</span>
                    <StatusBadge status={task.status} />
                  </div>
                  {task.description && <p className="text-xs text-zinc-500 mb-2">{task.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-zinc-600">
                    {task.assigned_name && <span>👤 {task.assigned_name}</span>}
                    {task.due_date && <span>📅 {format(new Date(task.due_date), 'd MMM', { locale: it })}</span>}
                  </div>
                </div>
                <Select value={task.status} onValueChange={v => handleTaskStatus(task.id, v)}>
                  <SelectTrigger className="w-28 h-7 text-xs bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {['todo', 'in_progress', 'review', 'done'].map(s => <SelectItem key={s} value={s} className="text-white text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-white">Contenuti</h2>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 gap-1.5" onClick={() => setContentOpen(true)}><Plus size={14} />Aggiungi</Button>
          </div>
          <div className="space-y-2">
            {content.length === 0 ? <p className="text-sm text-zinc-600 py-6 text-center">Nessun contenuto</p> : content.map(item => (
              <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-white text-sm">{item.title}</span>
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{item.type}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  {item.description && <p className="text-xs text-zinc-500 mb-2">{item.description}</p>}
                  {item.link_url && (
                    <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                      <ExternalLink size={10} />Apri link
                    </a>
                  )}
                  {item.scheduled_date && <span className="text-xs text-zinc-600 block mt-1">📅 {format(new Date(item.scheduled_date), 'd MMM', { locale: it })}</span>}
                </div>
                <Select value={item.status} onValueChange={v => handleContentStatus(item.id, v)}>
                  <SelectTrigger className="w-28 h-7 text-xs bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {['draft', 'review', 'approved', 'published'].map(s => <SelectItem key={s} value={s} className="text-white text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="space-y-2">
            {team.length === 0 ? <p className="text-sm text-zinc-600 py-6 text-center">Nessun collaboratore assegnato</p> : team.map(member => (
              <div key={member.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600/20 border border-blue-600/30 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-white text-sm">{member.name}</div>
                  <div className="text-xs text-zinc-500">{member.email} · {member.role_in_project || member.role}</div>
                </div>
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

      {/* Task dialog */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Nuovo task</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label className="text-zinc-300 mb-1.5 block">Titolo *</Label><Input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div><Label className="text-zinc-300 mb-1.5 block">Descrizione</Label><Textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" rows={2} /></div>
            <div><Label className="text-zinc-300 mb-1.5 block">Assegna a</Label>
              <Select value={taskForm.assigned_to} onValueChange={v => setTaskForm(f => ({ ...f, assigned_to: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Nessuno" /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">{collaborators.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-white">{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-zinc-300 mb-1.5 block">Scadenza</Label><Input type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <Button onClick={handleCreateTask} className="w-full bg-red-600 hover:bg-red-700">Crea task</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content dialog */}
      <Dialog open={contentOpen} onOpenChange={setContentOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Aggiungi contenuto</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label className="text-zinc-300 mb-1.5 block">Titolo *</Label><Input value={contentForm.title} onChange={e => setContentForm(f => ({ ...f, title: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div><Label className="text-zinc-300 mb-1.5 block">Tipo</Label>
              <Select value={contentForm.type} onValueChange={v => setContentForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">{['copy', 'video', 'script', 'creative', 'campaign_material'].map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-zinc-300 mb-1.5 block">Link esterno</Label><Input value={contentForm.link_url} onChange={e => setContentForm(f => ({ ...f, link_url: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" placeholder="https://drive.google.com/..." /></div>
            <div><Label className="text-zinc-300 mb-1.5 block">Descrizione</Label><Textarea value={contentForm.description} onChange={e => setContentForm(f => ({ ...f, description: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" rows={2} /></div>
            <div><Label className="text-zinc-300 mb-1.5 block">Data programmata</Label><Input type="date" value={contentForm.scheduled_date} onChange={e => setContentForm(f => ({ ...f, scheduled_date: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <Button onClick={handleCreateContent} className="w-full bg-red-600 hover:bg-red-700">Aggiungi contenuto</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
