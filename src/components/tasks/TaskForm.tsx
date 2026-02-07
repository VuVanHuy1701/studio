
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTasks } from '@/app/context/TaskContext';
import { Category, Task } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Plus, UserPlus, Save, Search, User, Check, X, Calendar as CalendarIcon, Clock, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSettings } from '@/app/context/SettingsContext';
import { useAuth } from '@/app/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface TaskFormProps {
  taskToEdit?: Task;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TaskForm({ taskToEdit, open: externalOpen, onOpenChange: setExternalOpen }: TaskFormProps) {
  const { addTask, updateTask } = useTasks();
  const { t } = useSettings();
  const { user, knownUsers } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen || setInternalOpen;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Work');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [dateString, setDateString] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('16:30');
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [additionalTimeAllocated, setAdditionalTimeAllocated] = useState(false);
  const [progress, setProgress] = useState(0);

  const filteredUsers = useMemo(() => {
    const search = userSearch.toLowerCase().trim();
    return knownUsers.filter(u => u.name.toLowerCase().includes(search));
  }, [userSearch, knownUsers]);

  useEffect(() => {
    if (taskToEdit && open) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setCategory(taskToEdit.category);
      setPriority(taskToEdit.priority);
      const d = new Date(taskToEdit.dueDate);
      setDateString(format(d, 'yyyy-MM-dd'));
      setTime(format(d, 'HH:mm'));
      setAssignedUsers(taskToEdit.assignedTo || []);
      setAdditionalTimeAllocated(taskToEdit.additionalTimeAllocated || false);
      setProgress(taskToEdit.progress || 0);
    } else if (!taskToEdit && open) {
      setAssignedUsers(user?.role === 'admin' ? [] : [user?.displayName || 'Me']);
      setDateString(format(new Date(), 'yyyy-MM-dd'));
      setTime('16:30');
      setAdditionalTimeAllocated(false);
      setProgress(0);
      setTitle('');
      setDescription('');
    }
  }, [taskToEdit, open, user]);

  const toggleUserSelection = (userName: string) => {
    setAssignedUsers(prev => 
      prev.includes(userName) 
        ? prev.filter(u => u !== userName) 
        : [...prev, userName]
    );
  };

  const removeUser = (userName: string) => {
    setAssignedUsers(prev => prev.filter(u => u !== userName));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateString) return;

    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const dueDate = new Date(year, month - 1, day, hours, minutes);

    const finalAssigned = assignedUsers.length > 0 ? assignedUsers : ['Me'];

    if (taskToEdit) {
      updateTask(taskToEdit.id, {
        title,
        description,
        category,
        dueDate,
        priority,
        assignedTo: finalAssigned,
        additionalTimeAllocated,
        progress,
        completed: progress === 100
      });
    } else {
      addTask({
        title,
        description,
        category,
        dueDate,
        completed: progress === 100,
        priority,
        assignedTo: finalAssigned,
        createdBy: user?.uid,
        additionalTimeAllocated,
        progress
      });
    }

    setOpen(false);
  };

  const categories: Category[] = ['Work', 'Personal', 'Fitness', 'Health', 'Urgent', 'Other'];
  const priorities: Task['priority'][] = ['Low', 'Medium', 'High'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!taskToEdit && (
        <DialogTrigger asChild>
          <Button className="fixed bottom-24 right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-lg z-50">
            <Plus className="w-8 h-8" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {taskToEdit ? `Edit Task` : (user?.role === 'admin' ? 'Assign New Task' : t('newTask'))}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-bold uppercase text-muted-foreground">{t('taskTitle')}</Label>
            <Input 
              id="title" 
              placeholder={t('titlePlaceholder')} 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-9"
            />
          </div>

          {user?.role === 'admin' && (
            <div className="space-y-2 bg-muted/30 p-2.5 rounded-lg border border-dashed">
              <Label className="flex items-center gap-2 mb-0.5 text-xs font-bold uppercase text-muted-foreground">
                <UserPlus className="w-3.5 h-3.5 text-primary" />
                Assign Users
              </Label>
              
              {assignedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-background rounded-md border mb-1.5 max-h-20 overflow-y-auto">
                  {assignedUsers.map((u, idx) => (
                    <Badge key={u} variant="secondary" className={cn(
                      "flex items-center gap-1 py-0.5 px-1.5 text-[10px]",
                      idx === 0 && "bg-primary text-primary-foreground"
                    )}>
                      {idx === 0 && <Check className="w-2.5 h-2.5" />}
                      {u}
                      <button type="button" onClick={() => removeUser(u)} className="ml-0.5 hover:text-destructive">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search and select users..."
                  className="pl-8 h-8 text-xs bg-background"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              
              <ScrollArea className="h-24 rounded-md border bg-background">
                <div className="p-0.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => toggleUserSelection('Me')}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition-colors",
                      assignedUsers.includes('Me') ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      Me (Admin)
                    </div>
                    {assignedUsers.includes('Me') && <Check className="w-3 h-3" />}
                  </button>
                  {filteredUsers.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUserSelection(u.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition-colors",
                        assignedUsers.includes(u.name) ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        {u.name}
                      </div>
                      {assignedUsers.includes(u.name) && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              {assignedUsers.length > 0 && (
                <p className="text-[9px] text-muted-foreground italic leading-none mt-1">
                  * First user is the Lead Assignee.
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-bold uppercase text-muted-foreground">{t('description')}</Label>
            <Textarea 
              id="description" 
              placeholder={t('descPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-16 text-sm"
            />
          </div>

          <div className="space-y-2 py-1 px-1">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                <Percent className="w-3.5 h-3.5 text-primary" />
                Progress
              </Label>
              <span className="text-xs font-bold text-primary">{progress}%</span>
            </div>
            <Slider 
              value={[progress]} 
              onValueChange={(val) => setProgress(val[0])} 
              max={100} 
              step={1} 
              className="py-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">{t('category')}</Label>
              <Select value={category} onValueChange={(v: Category) => setCategory(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-xs">{t(cat.toLowerCase() as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">{t('priority')}</Label>
              <Select value={priority} onValueChange={(v: Task['priority']) => setPriority(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(p => (
                    <SelectItem key={p} value={p} className="text-xs">{t(p.toLowerCase() as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="due-date" className="text-xs font-bold uppercase text-muted-foreground">{t('date')}</Label>
              <Input 
                id="due-date" 
                type="date" 
                value={dateString} 
                onChange={(e) => setDateString(e.target.value)} 
                className="h-9 text-xs w-full"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="due-time" className="text-xs font-bold uppercase text-muted-foreground">{t('time')}</Label>
              <Input 
                id="due-time"
                type="time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)} 
                className="h-9 text-xs w-full"
              />
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="flex items-center justify-between p-2 bg-accent/5 rounded-lg border border-accent/20">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <Label htmlFor="extended-time" className="text-[10px] font-bold uppercase text-accent tracking-tighter">
                  {t('additionalTimeLabel')}
                </Label>
              </div>
              <Switch 
                id="extended-time"
                checked={additionalTimeAllocated}
                onCheckedChange={setAdditionalTimeAllocated}
                className="scale-75"
              />
            </div>
          )}

          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-10 text-sm font-bold uppercase">
            {taskToEdit ? (
              <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</span>
            ) : (
              user?.role === 'admin' ? 'Assign Task' : t('createTask')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
