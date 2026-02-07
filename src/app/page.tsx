
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
import { useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Task } from '@/app/lib/types';

function DashboardContent() {
  const { tasks, getOverdueTasks, exportTasks, importTasks } = useTasks();
  const { t } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="min-h-screen pb-32 md:pt-10">
      <Navbar />
      
      <main className="max-w-screen-md mx-auto px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">{t('todaysCompass')}</h1>
            <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM do')}</p>
          </div>
          {user && (
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-muted-foreground uppercase">{t('welcome')}</p>
              <p className="font-semibold">{user.displayName}</p>
            </div>
          )}
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <CardContent className="p-4">
              <h3 className="text-[10px] font-bold uppercase opacity-80 mb-1">{t('dailyFocus')}</h3>
              <div className="text-2xl font-bold mb-1">{completedToday}/{totalToday}</div>
              <Progress value={progress} className="h-1 bg-white/20" />
              <p className="text-[9px] mt-1.5 opacity-80">{t('tasksCompleted')}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{t('weeklySummary')}</h3>
              <div className="text-2xl font-bold">12</div>
              <p className="text-[9px] text-muted-foreground mt-0.5">{t('tasksFinishedWeek')}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm border-l-4 border-l-destructive">
            <CardContent className="p-4">
              <h3 className="text-[10px] font-bold text-destructive uppercase mb-1">{t('overdue')}</h3>
              <div className="text-2xl font-bold">{overdue.length}</div>
              <p className="text-[9px] text-muted-foreground mt-0.5">{t('needsAttention')}</p>
            </CardContent>
          </Card>
        </section>

        {overdue.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-xl font-bold">Overdue Tasks</h2>
            </div>
            <div className="grid gap-3">
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
            <Button variant="ghost" size="sm" className="text-primary font-bold" asChild>
              <Link href="/tasks">
                View All <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className={cn(
            "grid gap-6",
            isAdmin ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
          )}>
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {isAdmin ? "Tasks Assigned to Users" : "From Administrator"}
                </h3>
              </div>
              <div className="grid gap-3">
                {adminTasks.length > 0 ? (
                  adminTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic py-4 text-center border rounded-lg border-dashed">
                    {isAdmin ? "No tasks assigned for today" : "No admin tasks today"}
                  </p>
                )}
              </div>
            </div>

            {!isAdmin && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Personal Tasks</h3>
                </div>
                <div className="grid gap-3">
                  {personalTasks.length > 0 ? (
                    personalTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-4 text-center border rounded-lg border-dashed">No personal tasks today</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {todayTasks.length === 0 && overdue.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 opacity-20" />
              <p>{t('noTasksToday')}</p>
              <p className="text-xs">{t('enjoyClearDay')}</p>
            </div>
          )}
        </section>

        <section className="pt-8">
          <Card className="border-none shadow-sm bg-muted/30">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  {t('dataManagement')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Backup your tasks or sync with your personal Google Drive storage
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={exportTasks} variant="outline" className="flex-1 min-w-[150px]">
                  <Download className="mr-2 w-4 h-4" />
                  {t('exportJson')}
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1 min-w-[150px]">
                  <Upload className="mr-2 w-4 h-4" />
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white p-3 rounded-lg border border-dashed">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>{t('syncStatus')}</span>
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
