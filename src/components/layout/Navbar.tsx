"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, CheckCircle2, BarChart3, Moon, Sun, Globe, LogIn, LogOut, User, ShieldCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/app/context/SettingsContext';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from "@/components/ui/badge";
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
  const { user, loginWithGoogle, loginWithCredentials, logout } = useAuth();
  const { toast } = useToast();
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await loginWithCredentials(loginUsername, loginPassword);
    if (success) {
      toast({ title: "Logged in successfully" });
      setLoginDialogOpen(false);
      setLoginUsername('');
      setLoginPassword('');
    } else {
      toast({ title: "Invalid username or password", variant: "destructive" });
    }
  };

  const navItems = [
    { name: t('dashboard'), href: '/', icon: Compass },
    { name: t('myTasks'), href: '/tasks', icon: CheckCircle2 },
    { name: t('progress'), href: '/progress', icon: BarChart3 },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Users', href: '/admin/users', icon: Users });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-t shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.1)] md:bottom-auto md:top-0 md:border-t-0 md:border-b transition-all duration-300 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-5xl mx-auto px-4 h-20 md:h-16 flex items-center justify-between">
        <div className="flex flex-1 justify-around md:justify-start items-center gap-1 md:gap-4">
          <Link href="/" className="hidden md:flex items-center gap-2 mr-6 text-primary font-black uppercase tracking-tighter text-lg">
            <Compass className="w-6 h-6" />
            <span>Compass</span>
          </Link>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-2 md:py-1.5 rounded-2xl md:rounded-xl transition-all duration-300 group",
                  isActive 
                    ? "text-primary bg-primary/10 font-bold" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5 font-medium"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "stroke-[2.5px] scale-110")} />
                <span className="text-[10px] md:text-sm font-bold uppercase md:capitalize tracking-wider md:tracking-normal whitespace-nowrap">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-l border-primary/10 pl-4 ml-2 md:pl-6">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border-2 border-primary/10 hover:border-primary/30 transition-colors">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} />
                    <AvatarFallback className="bg-primary/5">
                      {user.role === 'admin' ? <ShieldCheck className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-xl border-primary/10">
                <div className="flex items-center justify-start gap-3 p-3 bg-primary/5 rounded-xl mb-2">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} />
                    <AvatarFallback>
                      {user.role === 'admin' ? <ShieldCheck className="w-5 h-5 text-primary" /> : <User className="w-5 h-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold leading-none tracking-tight">{user.displayName}</p>
                      {user.role === 'admin' && <Badge className="bg-primary text-[8px] h-3.5 px-1 py-0 font-black uppercase tracking-tighter">Admin</Badge>}
                    </div>
                    <p className="text-[10px] leading-none text-muted-foreground font-medium">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-primary/5" />
                <DropdownMenuItem onClick={toggleTheme} className="rounded-xl py-2.5 cursor-pointer">
                  {theme === 'light' ? <Moon className="mr-3 h-4 w-4" /> : <Sun className="mr-3 h-4 w-4" />}
                  <span className="font-bold text-xs uppercase tracking-wider">Appearance</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="rounded-xl py-2.5 cursor-pointer">
                    <Globe className="mr-3 h-4 w-4" />
                    <span className="font-bold text-xs uppercase tracking-wider">Language</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="rounded-2xl p-1.5 shadow-xl border-primary/10">
                      <DropdownMenuItem onClick={() => setLanguage('en')} className={cn("rounded-xl py-2 font-bold text-xs", language === 'en' && "bg-primary/10 text-primary")}>
                        English
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLanguage('vi')} className={cn("rounded-xl py-2 font-bold text-xs", language === 'vi' && "bg-primary/10 text-primary")}>
                        Tiếng Việt
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator className="bg-primary/5" />
                <DropdownMenuItem onClick={logout} className="rounded-xl py-2.5 text-destructive font-bold cursor-pointer hover:bg-destructive/5">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">{t('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 border-2 border-primary/10 hover:bg-primary/5">
                  <LogIn className="w-5 h-5 text-primary" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px] rounded-3xl p-8">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-black text-center tracking-tight">Welcome Back</DialogTitle>
                </DialogHeader>
                <div className="space-y-8">
                  <form onSubmit={handleCredentialsLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-user" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username</Label>
                      <Input 
                        id="login-user" 
                        className="h-12 rounded-xl border-2 bg-muted/30 focus:bg-background transition-all" 
                        value={loginUsername} 
                        onChange={(e) => setLoginUsername(e.target.value)} 
                        placeholder="your_username" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-pass" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                      <Input 
                        id="login-pass" 
                        type="password" 
                        className="h-12 rounded-xl border-2 bg-muted/30 focus:bg-background transition-all" 
                        value={loginPassword} 
                        onChange={(e) => setLoginPassword(e.target.value)} 
                        placeholder="••••••••" 
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-widest bg-primary hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20">
                      Sign In
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                      <span className="bg-background px-3 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button onClick={loginWithGoogle} variant="outline" className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl border-2 hover:bg-primary/5 transition-all group">
                    <svg className="w-6 h-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="font-black uppercase tracking-widest text-xs">Google Login</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </nav>
  );
}
