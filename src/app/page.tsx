
"use client";

import { TaskProvider, useTasks } from '@/app/context/TaskContext';
import { Navbar } from '@/components/layout/Navbar';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Calendar, 
  AlertCircle, 
  Download, 
  Upload, 
  Database,
  ArrowRight
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { useSettings } from '@/app/context/SettingsContext';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

function DashboardContent() {
  const { tasks, getOverdueTasks, exportTasks, importTasks } = useTasks();
  const { t } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayTasks = tasks.filter(t => isToday(t.dueDate));
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

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <CardHeader className="p-4">
              <CardTitle className="text-xs font-bold uppercase opacity-80">{t('dailyFocus')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold mb-2">{completedToday}/{totalToday}</div>
              <Progress value={progress} className="h-1.5 bg-white/20" />
              <p className="text-[10px] mt-2 opacity-80">{t('tasksCompleted')}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase">{t('weeklySummary')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">12</div>
              <p className="text-[10px] text-muted-foreground mt-1">{t('tasksFinishedWeek')}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm border-l-4 border-l-destructive">
            <CardHeader className="p-4">
              <CardTitle className="text-xs font-bold text-destructive uppercase">{t('overdue')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">{overdue.length}</div>
              <p className="text-[10px] text-muted-foreground mt-1">{t('needsAttention')}</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {t('upcomingToday')}
            </h2>
            <Button variant="ghost" size="sm" className="text-primary font-bold">
              View All <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          <div className="grid gap-3">
            {todayTasks.length > 0 ? (
              todayTasks
                .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                .map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 opacity-20" />
                <p>{t('noTasksToday')}</p>
                <p className="text-xs">{t('enjoyClearDay')}</p>
              </div>
            )}
          </div>
        </section>

        <section className="pt-8">
          <Card className="border-none shadow-sm bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                {t('dataManagement')}
              </CardTitle>
              <CardDescription>
                Backup your tasks or sync with your personal Google Drive storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
