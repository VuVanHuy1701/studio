
"use client";

import { useState } from 'react';
import { useTasks } from '@/app/context/TaskContext';
import { Category, Task } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar as CalendarIcon, UserPlus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSettings } from '@/app/context/SettingsContext';
import { useAuth } from '@/app/context/AuthContext';

export function TaskForm() {
  const { addTask } = useTasks();
  const { t } = useSettings();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Work');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('12:00');
  const [assignedTo, setAssignedTo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    const [hours, minutes] = time.split(':');
    const dueDate = new Date(date);
    dueDate.setHours(parseInt(hours), parseInt(minutes));

    addTask({
      title,
      description,
      category,
      dueDate,
      completed: false,
      priority,
      assignedTo: user?.role === 'admin' ? assignedTo : user?.displayName || user?.email || 'Me',
      createdBy: user?.uid
    });

    setTitle('');
    setDescription('');
    setAssignedTo('');
    setOpen(false);
  };

  const categories: Category[] = ['Work', 'Personal', 'Fitness', 'Health', 'Urgent', 'Other'];
  const priorities: Task['priority'][] = ['Low', 'Medium', 'High'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-24 right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-lg z-50">
          <Plus className="w-8 h-8" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user?.role === 'admin' ? 'Assign New Task' : t('newTask')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('taskTitle')}</Label>
            <Input 
              id="title" 
              placeholder={t('titlePlaceholder')} 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {user?.role === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="assign" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Assign to User
              </Label>
              <Input 
                id="assign" 
                placeholder="User email or name..." 
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea 
              id="description" 
              placeholder={t('descPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('category')}</Label>
              <Select value={category} onValueChange={(v: Category) => setCategory(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{t(cat.toLowerCase() as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t('priority')}</Label>
              <Select value={priority} onValueChange={(v: Task['priority']) => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(p => (
                    <SelectItem key={p} value={p}>{t(p.toLowerCase() as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('date')} & Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>{t('time')}</Label>
              <Input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {user?.role === 'admin' ? 'Assign Task' : t('createTask')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
