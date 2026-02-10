"use client";

import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  User, 
  Mail, 
  Lock,
  ChevronLeft,
  Search,
  X
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { UserAccount, UserRole } from '@/app/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserManagementPage() {
  const { user, managedUsers, addUser, updateUser, deleteUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authorized
  useEffect(() => {
    if (mounted && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [mounted, user, router]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return managedUsers;
    
    return managedUsers.filter(u => 
      u.displayName?.toLowerCase().includes(query) || 
      u.username.toLowerCase().includes(query) || 
      u.email?.toLowerCase().includes(query)
    );
  }, [managedUsers, searchQuery]);

  if (!mounted || !user || user.role !== 'admin') {
    return null;
  }

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setDisplayName('');
    setEmail('');
    setRole('user');
    setEditingUser(null);
  };

  const handleEdit = (u: UserAccount) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword(u.password || '');
    setDisplayName(u.displayName || '');
    setEmail(u.email || '');
    setRole(u.role);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const accountData = {
      username,
      password,
      displayName,
      email,
      role,
      photoURL: editingUser?.photoURL || null
    };

    if (editingUser) {
      updateUser(editingUser.uid, accountData);
      toast({ title: "User updated and synced to JSON" });
    } else {
      addUser(accountData);
      toast({ title: "User created and synced to JSON" });
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="min-h-screen pb-24 md:pb-10 md:pt-10">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-1 text-[10px] font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest mb-2">
              <ChevronLeft className="w-3 h-3" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-primary tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8" />
              Manage Personnel
            </h1>
            <p className="text-muted-foreground font-medium text-sm">Control access and roles. Changes sync to system file.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
            <div className="relative flex-1 sm:min-w-[280px] w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search personnel..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-white/50 border-primary/10 focus:border-primary/30 transition-all text-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="h-10 rounded-xl font-bold uppercase tracking-widest gap-2 bg-primary px-5 shadow-md shadow-primary/10 text-xs w-full sm:w-auto">
                  <UserPlus className="w-4 h-4" />
                  New Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight">
                    {editingUser ? 'Edit User' : 'Register New User'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username</Label>
                      <Input 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="e.g. jsmith" 
                        required 
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                      <Input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••" 
                        required 
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Display Name</Label>
                    <Input 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                      placeholder="John Smith" 
                      required 
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="john@taskcompass.com" 
                      required 
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Permission</Label>
                    <Select value={role} onValueChange={(v: UserRole) => setRole(v)}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="user">Standard User</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-widest">
                      {editingUser ? 'Apply Updates' : 'Create Account'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredUsers.map((u) => (
              <Card key={u.uid} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] overflow-hidden group bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-dashed border-primary/5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10">
                        {u.role === 'admin' ? <ShieldCheck className="w-6 h-6 text-primary" /> : <User className="w-6 h-6 text-primary" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-black tracking-tight leading-tight">{u.displayName}</CardTitle>
                        <div className="flex gap-1.5 mt-1">
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-black uppercase tracking-tighter border-primary/20 bg-primary/5 text-primary">
                            @{u.username}
                          </Badge>
                          {u.role === 'admin' ? (
                            <Badge className="bg-primary text-[8px] h-4 px-1.5 font-black uppercase tracking-widest border-none shadow-sm">Admin</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[8px] h-4 px-1.5 font-black uppercase tracking-widest">User</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary" onClick={() => handleEdit(u)}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full hover:bg-destructive/10 text-destructive" 
                        disabled={u.uid === 'admin-id'}
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${u.displayName}?`)) {
                            deleteUser(u.uid);
                            toast({ title: "User removed and file updated" });
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5 p-2 bg-muted/30 rounded-xl border border-transparent hover:border-primary/10 transition-colors">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-bold text-muted-foreground truncate">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-2 bg-muted/30 rounded-xl border border-transparent hover:border-primary/10 transition-colors">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-bold text-muted-foreground tracking-widest">••••••••</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white/50 rounded-[2rem] border-2 border-dashed border-primary/10 flex flex-col items-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-lg">No personnel found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search query for "{searchQuery}"</p>
            </div>
            <Button variant="outline" onClick={() => setSearchQuery('')} className="rounded-xl font-bold">
              Clear Search
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
