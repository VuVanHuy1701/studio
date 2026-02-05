
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, CheckCircle2, BarChart3, Moon, Sun, Globe, LogIn, LogOut, User, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/app/context/SettingsContext';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from '@/hooks/use-toast';

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, language, setLanguage, t } = useSettings();
  const { user, loginWithGoogle, loginAsAdmin, logout } = useAuth();
  const { toast } = useToast();
  
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await loginAsAdmin(adminUsername, adminPassword);
    if (success) {
      toast({ title: "Admin logged in successfully" });
      setLoginDialogOpen(false);
    } else {
      toast({ title: "Invalid credentials", variant: "destructive" });
    }
  };

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
                    <AvatarFallback>
                      {user.role === 'admin' ? <ShieldCheck className="w-4 h-4 text-primary" /> : <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      {user.role === 'admin' && <ShieldCheck className="w-3 h-3 text-primary" />}
                    </div>
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
            <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
                  <LogIn className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="text-center">Sign In</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <Button onClick={loginWithGoogle} variant="outline" className="w-full flex items-center justify-center gap-2 h-12">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {t('login')}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or Admin Login</span></div>
                  </div>

                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-user">Username</Label>
                      <Input id="admin-user" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="admin" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-pass">Password</Label>
                      <Input id="admin-pass" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <Button type="submit" className="w-full">Login as Administrator</Button>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </nav>
  );
}
