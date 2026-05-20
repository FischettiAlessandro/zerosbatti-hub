'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Inserisci email e password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Errore di accesso');
        return;
      }

      setUser(data.user);
      toast.success(`Benvenuto, ${data.user.name}!`);
      router.push(data.redirectTo);
    } catch {
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          <div className="grid grid-cols-8 grid-rows-8 h-full">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="border border-zinc-700/20" />
            ))}
          </div>
        </div>

        {/* Accent line */}
        <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-gradient-to-b from-transparent via-red-600 to-transparent" />

        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8 flex justify-center">
            <Image
              src="https://www.zerosbattisocial.it/wp-content/uploads/2025/09/ZeroSbatti-Social.png"
              alt="ZeroSbatti Social"
              width={220}
              height={60}
              className="h-14 w-auto object-contain brightness-0 invert"
              unoptimized
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
            Client Hub
          </h1>
          <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
            La piattaforma centralizzata per la gestione completa di clienti, contenuti e campagne.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Clienti', emoji: '👥' },
              { label: 'Contenuti', emoji: '📱' },
              { label: 'Campagne', emoji: '📊' },
            ].map(item => (
              <div key={item.label} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/30">
                <div className="text-2xl mb-2">{item.emoji}</div>
                <div className="text-sm text-zinc-400 font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex justify-center">
            <Image
              src="https://www.zerosbattisocial.it/wp-content/uploads/2025/09/ZeroSbatti-Social.png"
              alt="ZeroSbatti Social"
              width={160}
              height={44}
              className="h-10 w-auto object-contain brightness-0 invert"
              unoptimized
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Accedi</h2>
            <p className="text-zinc-500 text-sm">Inserisci le tue credenziali per continuare</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-zinc-300 text-sm mb-1.5 block">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome@esempio.it"
                className="bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-red-600 focus:ring-red-600/20 h-11"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-zinc-300 text-sm mb-1.5 block">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-red-600 focus:ring-red-600/20 h-11 pr-10"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-11 text-sm gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Accedi
                </>
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Credenziali Demo</p>
            <div className="space-y-2">
              {[
                { role: 'Admin', email: 'admin@zerosbatti.it', password: 'Admin123!', color: 'text-red-400' },
                { role: 'Collaboratore', email: 'collaborator@zerosbatti.it', password: 'Collab123!', color: 'text-blue-400' },
                { role: 'Cliente', email: 'cliente@demo.it', password: 'Client123!', color: 'text-zinc-400' },
              ].map(cred => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => { setEmail(cred.email); setPassword(cred.password); }}
                  className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors group"
                >
                  <span className={`text-xs font-semibold ${cred.color}`}>{cred.role}</span>
                  <span className="text-xs text-zinc-600 group-hover:text-zinc-400 font-mono">{cred.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-zinc-700 mt-6">
            ZeroSbatti Social Client Hub © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
