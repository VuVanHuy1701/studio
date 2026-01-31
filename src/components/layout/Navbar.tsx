"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, CheckCircle2, BarChart3, Moon, Sun, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/app/context/SettingsContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, language, setLanguage, t } = useSettings();

  const navItems = [
    { name: t('myTasks'), href: '/tasks', icon: CheckCircle2 },
    { name: t('dashboard'), href: '/', icon: Compass },
    { name: t('progress'), href: '/progress', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] transition-all duration-300">
      <div className="max-w-screen-md mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex flex-1 justify-around items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 group",
                  isActive 
                    ? "text-primary bg-primary/15 font-bold scale-105" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5 font-medium"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "stroke-[2.5px]")} />
                <span className="text-sm whitespace-nowrap">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1 border-l pl-4 ml-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full w-9 h-9">
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
                <Globe className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-muted">
              <DropdownMenuItem onClick={() => setLanguage('en')} className={cn("rounded-lg", language === 'en' && "bg-primary/10 text-primary")}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('vi')} className={cn("rounded-lg", language === 'vi' && "bg-primary/10 text-primary")}>
                Tiếng Việt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
