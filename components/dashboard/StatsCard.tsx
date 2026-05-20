import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  accent?: boolean;
}

export function StatsCard({ title, value, subtitle, icon: Icon, accent }: StatsCardProps) {
  return (
    <div className={cn(
      'bg-zinc-900 border rounded-xl p-5 transition-all hover:border-zinc-700',
      accent ? 'border-red-600/40 bg-red-950/20' : 'border-zinc-800'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-zinc-500 font-medium mb-1">{title}</p>
          <p className={cn('text-3xl font-bold', accent ? 'text-red-400' : 'text-white')}>{value}</p>
          {subtitle && <p className="text-xs text-zinc-500 mt-1.5">{subtitle}</p>}
        </div>
        <div className={cn(
          'p-2.5 rounded-lg',
          accent ? 'bg-red-600/20 text-red-400' : 'bg-zinc-800 text-zinc-400'
        )}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
