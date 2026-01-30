
"use client";

import { TaskProvider, useTasks } from '@/app/context/TaskContext';
import { Navbar } from '@/components/layout/Navbar';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, startOfWeek, endOfWeek, isWithinInterval, isToday } from 'date-fns';
import { CheckCircle2, AlertCircle, Clock, Calendar as CalendarIcon } from 'lucide-react';

function DashboardContent() {
  const { tasks, getOverdueTasks } = useTasks();
  
  const todayTasks = tasks.filter(t => isToday(t.dueDate));
  const completedToday = todayTasks.filter(t => t.completed).length;
  const progressPercent = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;

  const overdue = getOverdueTasks();

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const weeklyTasks = tasks.filter(t => isWithinInterval(t.dueDate, { start: weekStart, end: weekEnd }));
  const completedWeekly = weeklyTasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen pb-24 md:pt-20">
      <Navbar />
      
      <main className="max-w-screen-md mx-auto px-4 py-8 space-y-8">
        <header className="space-y-2 text-center md:text-left">
          <h1 className="text-4xl font-bold text-primary tracking-tight">Today's Compass</h1>
          <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM do')}</p>
        </header>

        {/* Today's Progress Card */}
        <Card className="border-none shadow-sm bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Daily Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="text-3xl font-bold">{completedToday}/{todayTasks.length}</div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="w-4 h-4" />
                WEEKLY SUMMARY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedWeekly} / {weeklyTasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Tasks finished this week</p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-accent" />
                OVERDUE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{overdue.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Needs immediate attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Unfinished / Overdue Tasks List */}
        {overdue.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-accent" />
                Unfinished Tasks
              </h2>
            </div>
            <div className="grid gap-3">
              {overdue.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        {/* Today's Tasks */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Upcoming Today
            </h2>
          </div>
          <div className="grid gap-3">
            {todayTasks.length > 0 ? (
              todayTasks
                .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                .map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed text-muted-foreground">
                <p>No tasks scheduled for today.</p>
                <p className="text-sm">Enjoy your clear compass!</p>
              </div>
            )}
          </div>
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
