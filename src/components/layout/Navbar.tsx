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
    { name: t('dashboard'), href: '/', icon: Compass },
    { name: t('myTasks'), href: '/tasks', icon: CheckCircle2 },
    { name: t('progress'), href: '/progress', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="hidden md:flex items-center gap-2 font-bold text-primary text-xl">
            <Compass className="w-6 h-6" />
            <span>{t('appName')}</span>
          </Link>
          
          <div className="flex flex-1 justify-around md:justify-end md:gap-4 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 rounded-lg transition-colors text-[10px] md:text-sm font-medium",
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

            <div className="flex items-center gap-1 border-l pl-4 ml-4">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Globe className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage('en')} className={cn(language === 'en' && "bg-primary/10")}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('vi')} className={cn(language === 'vi' && "bg-primary/10")}>
                    Tiếng Việt
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
