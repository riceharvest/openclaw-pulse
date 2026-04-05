'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  Settings, 
  Cpu, 
  Zap, 
  MessagesSquare, 
  Hammer, 
  Fingerprint, 
  ShieldAlert,
  Terminal,
  Home
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Models & Providers', href: '/config/models', icon: Cpu },
  { name: 'Agents', href: '/config/agents', icon: Zap },
  { name: 'Channels', href: '/config/channels', icon: MessagesSquare },
  { name: 'Tools & Media', href: '/config/tools', icon: Hammer },
  { name: 'Security & Auth', href: '/config/auth', icon: ShieldAlert },
  { name: 'Skills & Plugins', href: '/config/skills', icon: Activity },
  { name: 'Gateway', href: '/config/gateway', icon: Terminal },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
            OC
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 font-outfit">OpenClaw</h1>
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group",
                  isActive 
                    ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 transition-colors",
                  isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                )} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-zinc-800 bg-zinc-950/50">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] anim-pulse"></div>
          <span className="text-xs font-medium text-zinc-400">Gateway Active</span>
        </div>
      </div>
    </aside>
  );
}
