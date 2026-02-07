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
import { format, isToday, startOfWeek } from 'date-fns';
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

  // Calculate tasks finished this week (starting Monday)
  const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const completedThisWeek = tasks.filter(t => 
    t.completed && 
    t.completedAt && 
    new Date(t.completedAt) >= startOfThisWeek
  ).length;

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
      
      <main className="max-w-5xl mx-auto px-4 py-4 md:py-8 space-y-6 md:space-y-8">
        <header className="flex flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-primary tracking-tight leading-none">{t('todaysCompass')}</h1>
            <p className="text-[10px] md:text-sm text-muted-foreground font-medium mt-1">{format(new Date(), 'EEEE, MMMM do')}</p>
          </div>
          {user && (
            <div className="text-right bg-white/50 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-dashed border-primary/20">
              <p className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Welcome</p>
              <p className="font-bold text-primary text-xs md:text-base">{user.displayName}</p>
            </div>
          )}
        </header>

        <section className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2 md:p-3 opacity-10">
              <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12" />
            </div>
            <CardContent className="p-3 md:p-4">
              <h3 className="text-[8px] md:text-[10px] font-bold uppercase opacity-80 mb-0.5 md:mb-1">{t('dailyFocus')}</h3>
              <div className="text-xl md:text-3xl font-bold mb-1 md:mb-2">{completedToday}/{totalToday}</div>
              <Progress value={progress} className="h-1 bg-white/20" />
              <p className="text-[8px] md:text-[10px] mt-1.5 md:mt-2 opacity-80 font-medium">{t('tasksCompleted')}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-3 md:p-4">
              <h3 className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase mb-0.5 md:mb-1 tracking-wider">{t('weeklySummary')}</h3>
              <div className="text-xl md:text-3xl font-bold text-primary">{completedThisWeek}</div>
              <p className="text-[8px] md:text-[10px] text-muted-foreground mt-1 font-medium">{t('tasksFinishedWeek')}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm border-l-4 border-l-destructive col-span-2 md:col-span-1">
            <CardContent className="p-3 md:p-4">
              <h3 className="text-[8px] md:text-[10px] font-bold text-destructive uppercase mb-0.5 md:mb-1 tracking-wider">{t('overdue')}</h3>
              <div className="text-xl md:text-3xl font-bold text-destructive">{overdue.length}</div>
              <p className="text-[8px] md:text-[10px] text-muted-foreground mt-1 font-medium">{t('needsAttention')}</p>
            </CardContent>
          </Card>
        </section>

        {overdue.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <h2 className="text-sm md:text-lg font-bold">Overdue Tasks</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {overdue.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-xl font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              {t('upcomingToday')}
            </h2>
            <Button variant="ghost" size="sm" className="h-8 md:h-9 text-[10px] md:text-sm text-primary font-bold hover:bg-primary/5" asChild>
              <Link href="/tasks">
                View All <ArrowRight className="ml-1 w-3 h-3 md:w-4 md:h-4" />
              </Link>
            </Button>
          </div>

          <div className={cn(
            "grid gap-6 md:gap-8",
            isAdmin ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
          )}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-primary/10 pb-1.5 md:pb-2">
                <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-accent" />
                <h3 className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {isAdmin ? "Tasks Assigned to Users" : "From Administrator"}
                </h3>
              </div>
              <div className="grid gap-3 md:gap-4">
                {adminTasks.length > 0 ? (
                  adminTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-6 md:py-10 border-2 border-dashed rounded-2xl border-primary/5 bg-muted/20">
                    <p className="text-[10px] md:text-sm text-muted-foreground italic">
                      {isAdmin ? "No tasks assigned for today" : "No admin tasks today"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {!isAdmin && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-primary/10 pb-1.5 md:pb-2">
                  <User className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                  <h3 className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Personal Tasks</h3>
                </div>
                <div className="grid gap-3 md:gap-4">
                  {personalTasks.length > 0 ? (
                    personalTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  ) : (
                    <div className="text-center py-6 md:py-10 border-2 border-dashed rounded-2xl border-primary/5 bg-muted/20">
                      <p className="text-[10px] md:text-sm text-muted-foreground italic">No personal tasks today</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {todayTasks.length === 0 && overdue.length === 0 && (
            <div className="text-center py-10 md:py-16 bg-white rounded-3xl border border-dashed text-muted-foreground flex flex-col items-center gap-3 md:gap-4 shadow-sm">
              <div className="bg-primary/10 p-3 md:p-4 rounded-full">
                <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-primary opacity-40" />
              </div>
              <div className="space-y-1">
                <p className="text-sm md:text-lg font-bold text-foreground">{t('noTasksToday')}</p>
                <p className="text-xs md:text-sm">{t('enjoyClearDay')}</p>
              </div>
            </div>
          )}
        </section>

        <section className="pt-4 md:pt-8">
          <Card className="border-none shadow-sm bg-muted/40 rounded-2xl md:rounded-3xl overflow-hidden">
            <CardContent className="p-5 md:p-8 space-y-4 md:space-y-6">
              <div className="space-y-1 md:space-y-2">
                <h3 className="text-base md:text-xl font-bold flex items-center gap-2 md:gap-3 text-primary">
                  <div className="bg-primary/10 p-1.5 md:p-2 rounded-lg">
                    <Database className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  {t('dataManagement')}
                </h3>
                <p className="text-[10px] md:text-sm text-muted-foreground leading-relaxed">
                  Backup your tasks or sync with your personal storage. Your data is kept locally for maximum privacy and performance.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <Button onClick={exportTasks} variant="outline" className="h-10 md:h-12 text-xs md:text-sm font-bold flex-1">
                  <Download className="mr-1.5 w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                  {t('exportJson')}
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="h-10 md:h-12 text-xs md:text-sm font-bold flex-1">
                  <Upload className="mr-1.5 w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
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
              <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[11px] font-bold text-muted-foreground bg-white/60 p-3 md:p-4 rounded-xl md:rounded-2xl border border-dashed border-primary/20">
                <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
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
