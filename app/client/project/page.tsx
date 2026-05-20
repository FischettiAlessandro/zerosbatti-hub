'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { CommentBox } from '@/components/forms/CommentBox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Project, Task, ContentItem } from '@/lib/types';

export default function ClientProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(async d => {
      const projects = d.projects || [];
      if (projects.length > 0) {
        const proj = projects[0];
        const detail = await fetch(`/api/projects/${proj.id}`).then(r => r.json());
        setProject(detail.project);
        setTasks(detail.tasks || []);
        setContent(detail.content || []);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>;
  if (!project) return (
    <div className="text-center py-16 text-zinc-600">
      <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
      <p>Nessun progetto attivo</p>
    </div>
  );

  const progress = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{project.name}</h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-zinc-500 text-sm">{project.description}</p>
          <StatusBadge status={project.status} />
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-zinc-400">Avanzamento progetto</h2>
            <span className="text-sm font-bold text-white">{progress}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div className="bg-red-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-zinc-600 mt-2">{tasks.filter(t => t.status === 'done').length} di {tasks.length} task completati</p>
        </div>
      )}

      <Tabs defaultValue="content">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
          <TabsTrigger value="content" className="data-[state=active]:bg-zinc-700">📄 Contenuti ({content.length})</TabsTrigger>
          <TabsTrigger value="comments" className="data-[state=active]:bg-zinc-700">💬 Commenti</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <div className="space-y-2">
            {content.length === 0 ? <p className="text-sm text-zinc-600 py-6 text-center">Nessun contenuto ancora</p> : content.map(item => (
              <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-white">{item.title}</span>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{item.type}</span>
                  <StatusBadge status={item.status} />
                </div>
                {item.description && <p className="text-xs text-zinc-500 mb-2">{item.description}</p>}
                <div className="flex items-center gap-3">
                  {item.link_url && <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><ExternalLink size={10} />Apri link</a>}
                  {item.scheduled_date && <span className="text-xs text-zinc-600">📅 {format(new Date(item.scheduled_date), 'd MMM yyyy', { locale: it })}</span>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comments">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <CommentBox projectId={project.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
