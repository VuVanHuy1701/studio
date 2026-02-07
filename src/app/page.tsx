"use client";

import { TaskProvider, useTasks } from '@/app/context/TaskContext';
import { Navbar } from '@/components/layout/Navbar';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Calendar, 
  Download, 
  Upload, 
  Database,
  ArrowRight,
  ShieldCheck,
  User,
  AlertCircle
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { useSettings } from '@/app/context/SettingsContext';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Task } from '@/app/lib/types';

function DashboardContent() {
  const { tasks, getOverdueTasks, exportTasks, importTasks } = useTasks();
  const { t } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const todayTasks = tasks.filter(t => isToday(new Date(t.dueDate)));
  
  const sortTasks = (taskList: Task[]) => {
    return [...taskList].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  };

  const adminTasks = sortTasks(todayTasks.filter(t => t.createdBy === 'admin-id'));
  const personalTasks = sortTasks(todayTasks.filter(t => t.createdBy !== 'admin-id'));
  
  const completedToday = todayTasks.filter(t => t.completed).length;
  const totalToday = todayTasks.length;
  const progress = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;
  
  const overdue = getOverdueTasks();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await importTasks(file);
      if (success) {
        toast({ title: t('importSuccess') });
      } else {
        toast({ title: t('importError'), variant: 'destructive' });
      }
    }
  };

  const isAdmin = user?.role === 'admin';

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen pb-32 md:pb-10 md:pt-10">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">{t('todaysCompass')}</h1>
            <p className="text-muted-foreground font-medium">{format(new Date(), 'EEEE, MMMM do')}</p>
          </div>
          {user && (
            <div className="text-left sm:text-right bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-dashed border-primary/20">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('welcome')}</p>
              <p className="font-bold text-primary">{user.displayName}</p>
            </div>
          )}
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <CardContent className="p-4 sm:p-5">
              <h3 className="text-[10px] font-bold uppercase opacity-80 mb-1">{t('dailyFocus')}</h3>
              <div className="text-3xl font-bold mb-2">{completedToday}/{totalToday}</div>
              <Progress value={progress} className="h-1.5 bg-white/20" />
              <p className="text-[10px] mt-2 opacity-80 font-medium">{t('tasksCompleted')}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wider">{t('weeklySummary')}</h3>
              <div className="text-3xl font-bold text-primary">12</div>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">{t('tasksFinishedWeek')}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm border-l-4 border-l-destructive sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-5">
              <h3 className="text-[10px] font-bold text-destructive uppercase mb-1 tracking-wider">{t('overdue')}</h3>
              <div className="text-3xl font-bold text-destructive">{overdue.length}</div>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">{t('needsAttention')}</p>
            </CardContent>
          </Card>
        </section>

        {overdue.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-xl font-bold">Overdue Tasks</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {overdue.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {t('upcomingToday')}
            </h2>
            <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5" asChild>
              <Link href="/tasks">
                View All <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className={cn(
            "grid gap-8",
            isAdmin ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
          )}>
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {isAdmin ? "Tasks Assigned to Users" : "From Administrator"}
                </h3>
              </div>
              <div className="grid gap-4">
                {adminTasks.length > 0 ? (
                  adminTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-10 border-2 border-dashed rounded-2xl border-primary/5 bg-muted/20">
                    <p className="text-sm text-muted-foreground italic">
                      {isAdmin ? "No tasks assigned for today" : "No admin tasks today"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {!isAdmin && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Personal Tasks</h3>
                </div>
                <div className="grid gap-4">
                  {personalTasks.length > 0 ? (
                    personalTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-2xl border-primary/5 bg-muted/20">
                      <p className="text-sm text-muted-foreground italic">No personal tasks today</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {todayTasks.length === 0 && overdue.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed text-muted-foreground flex flex-col items-center gap-4 shadow-sm">
              <div className="bg-primary/10 p-4 rounded-full">
                <CheckCircle2 className="w-10 h-10 text-primary opacity-40" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-foreground">{t('noTasksToday')}</p>
                <p className="text-sm">{t('enjoyClearDay')}</p>
              </div>
            </div>
          )}
        </section>

        <section className="pt-8">
          <Card className="border-none shadow-sm bg-muted/40 rounded-3xl overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold flex items-center gap-3 text-primary">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Database className="w-5 h-5" />
                  </div>
                  {t('dataManagement')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Backup your tasks or sync with your personal storage. Your data is kept locally for maximum privacy and performance.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={exportTasks} variant="outline" className="flex-1 rounded-xl h-12 font-bold">
                  <Download className="mr-2 w-4 h-4 text-primary" />
                  {t('exportJson')}
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1 rounded-xl h-12 font-bold">
                  <Upload className="mr-2 w-4 h-4 text-primary" />
                  {t('importJson')}
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json"
                  onChange={handleImport}
                />
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground bg-white/60 p-4 rounded-2xl border border-dashed border-primary/20">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span className="uppercase tracking-widest">{t('syncStatus')}</span>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <TaskForm />
    </div>
  );
}

export default function Home() {
  return (
    <TaskProvider>
      <DashboardContent />
    </TaskProvider>
  );
}