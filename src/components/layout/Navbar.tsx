
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, CheckCircle2, BarChart3, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Compass },
  { name: 'My Tasks', href: '/tasks', icon: CheckCircle2 },
  { name: 'Progress', href: '/progress', icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="hidden md:flex items-center gap-2 font-bold text-primary text-xl">
            <Compass className="w-6 h-6" />
            <span>Task Compass</span>
          </Link>
          
          <div className="flex flex-1 justify-around md:justify-end md:gap-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 rounded-lg transition-colors text-xs md:text-sm font-medium",
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
