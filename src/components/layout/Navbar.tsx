
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, CheckCircle2, BarChart3, Moon, Sun, Globe, LogIn, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/app/context/SettingsContext';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, language, setLanguage, t } = useSettings();
  const { user, loginWithGoogle, logout } = useAuth();

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
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} />
                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme} className="rounded-lg">
                  {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                  <span>Theme</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="rounded-lg">
                    <Globe className="mr-2 h-4 w-4" />
                    <span>Language</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="rounded-xl">
                      <DropdownMenuItem onClick={() => setLanguage('en')} className={cn("rounded-lg", language === 'en' && "bg-primary/10 text-primary")}>
                        English
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLanguage('vi')} className={cn("rounded-lg", language === 'vi' && "bg-primary/10 text-primary")}>
                        Tiếng Việt
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="rounded-lg text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={loginWithGoogle} className="rounded-lg font-bold text-primary">
                  <LogIn className="mr-2 h-4 w-4" />
                  {t('login')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme} className="rounded-lg">
                  {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                  <span>Theme</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')} className={cn("rounded-lg", language === 'en' && "bg-primary/10 text-primary")}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('vi')} className={cn("rounded-lg", language === 'vi' && "bg-primary/10 text-primary")}>
                  Tiếng Việt
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}

// Re-importing DropdownMenuSub etc to fix the Navbar code
import {
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
