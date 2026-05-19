import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  // Project
  active: { label: 'Attivo', className: 'bg-green-900/50 text-green-400 border-green-700/50' },
  paused: { label: 'Pausa', className: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50' },
  completed: { label: 'Completato', className: 'bg-blue-900/50 text-blue-400 border-blue-700/50' },
  cancelled: { label: 'Cancellato', className: 'bg-red-900/50 text-red-400 border-red-700/50' },
  // Task
  todo: { label: 'Da fare', className: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  in_progress: { label: 'In corso', className: 'bg-blue-900/50 text-blue-400 border-blue-700/50' },
  review: { label: 'In revisione', className: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50' },
  done: { label: 'Fatto', className: 'bg-green-900/50 text-green-400 border-green-700/50' },
  // Content
  draft: { label: 'Bozza', className: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  approved: { label: 'Approvato', className: 'bg-green-900/50 text-green-400 border-green-700/50' },
  published: { label: 'Pubblicato', className: 'bg-purple-900/50 text-purple-400 border-purple-700/50' },
  // Invoice
  pending: { label: 'In attesa', className: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50' },
  paid: { label: 'Pagata', className: 'bg-green-900/50 text-green-400 border-green-700/50' },
  overdue: { label: 'Scaduta', className: 'bg-red-900/50 text-red-400 border-red-700/50' },
  // Quote
  sent: { label: 'Inviato', className: 'bg-blue-900/50 text-blue-400 border-blue-700/50' },
  accepted: { label: 'Accettato', className: 'bg-green-900/50 text-green-400 border-green-700/50' },
  rejected: { label: 'Rifiutato', className: 'bg-red-900/50 text-red-400 border-red-700/50' },
  expired: { label: 'Scaduto', className: 'bg-zinc-800 text-zinc-500 border-zinc-700' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', config.className)}>
      {config.label}
    </span>
  );
}
