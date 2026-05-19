'use client';

import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Comment } from '@/lib/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const roleColors: Record<string, string> = {
  admin: 'bg-red-600',
  collaborator: 'bg-blue-600',
  client: 'bg-zinc-600',
};

interface CommentBoxProps {
  projectId?: number;
  contentItemId?: number;
}

export function CommentBox({ projectId, contentItemId }: CommentBoxProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    const url = `/api/comments?${projectId ? `project_id=${projectId}` : `content_item_id=${contentItemId}`}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments || []);
    }
  }

  async function handleSubmit() {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, content_item_id: contentItemId, message }),
      });
      if (res.ok) {
        setMessage('');
        fetchComments();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Commenti</h3>
      <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-zinc-600 text-center py-4">Nessun commento ancora. Sii il primo!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                roleColors[comment.author_role || 'client']
              )}>
                {comment.author_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{comment.author_name}</span>
                  <span className="text-xs text-zinc-600">
                    {format(new Date(comment.created_at), 'dd MMM, HH:mm', { locale: it })}
                  </span>
                </div>
                <div className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300">
                  {comment.message}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Scrivi un commento..."
          className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 resize-none min-h-[60px]"
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
        />
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || loading}
          className="self-end bg-red-600 hover:bg-red-700"
        >
          <Send size={16} />
        </Button>
      </div>
      <p className="text-xs text-zinc-600 mt-1">Ctrl+Enter per inviare</p>
    </div>
  );
}
