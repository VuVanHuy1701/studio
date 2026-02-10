
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  ChevronLeft
} from 'lucide-react';
import { useState, useEffect } from 'react';
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

export default function UserManagementPage() {
  const { user, managedUsers, addUser, updateUser, deleteUser } = useAuth();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user || user.role !== 'admin') {
    if (mounted && user?.role !== 'admin') {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-destructive font-bold">Unauthorized Access</p>
        </div>
      );
    }
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

  const handleSubmit = (e: React.FormEvent) => {
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
      toast({ title: "User updated successfully" });
    } else {
      addUser(accountData);
      toast({ title: "User added successfully" });
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="min-h-screen pb-24 md:pb-10 md:pt-10">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest mb-2">
              <ChevronLeft className="w-3 h-3" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-primary tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8" />
              User Management
            </h1>
            <p className="text-muted-foreground font-medium">Create and manage access for your team members</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="h-12 rounded-2xl font-bold uppercase tracking-widest gap-2 bg-primary px-6 shadow-lg shadow-primary/20">
                <UserPlus className="w-5 h-5" />
                Add New Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">
                  {editingUser ? 'Edit Account' : 'New User Account'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username</Label>
                    <Input 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder="jdoe" 
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
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="John Doe" 
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
                    placeholder="john@example.com" 
                    required 
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Role</Label>
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
                    {editingUser ? 'Save Changes' : 'Create Account'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managedUsers.map((u) => (
            <Card key={u.uid} className="border-none shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden group">
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    {u.role === 'admin' ? <ShieldCheck className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary" onClick={() => handleEdit(u)}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" 
                      disabled={u.uid === 'admin-id'}
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${u.displayName}?`)) {
                          deleteUser(u.uid);
                          toast({ title: "User deleted" });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <CardTitle className="text-lg font-bold truncate">{u.displayName}</CardTitle>
                  <Badge variant="outline" className="mt-1 text-[9px] font-black uppercase tracking-tighter border-primary/20 text-primary">
                    @{u.username}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Lock className="w-3.5 h-3.5" />
                    <span>••••••••</span>
                  </div>
                </div>
                <div className="pt-2">
                  {u.role === 'admin' ? (
                    <Badge className="bg-primary text-[8px] h-4 px-2 font-black uppercase tracking-widest">Administrator</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[8px] h-4 px-2 font-black uppercase tracking-widest">Standard User</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
