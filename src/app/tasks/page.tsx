"use client";

import { TaskProvider, useTasks } from '@/app/context/TaskContext';
import { Navbar } from '@/components/layout/Navbar';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isToday, addDays } from 'date-fns';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Task } from '@/app/lib/types';

function TasksContent() {
  const { tasks } = useTasks();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dayTasks = tasks.filter(t => {
    const d = new Date(t.dueDate);
    const s = selectedDate;
    return d.getDate() === s.getDate() && 
           d.getMonth() === s.getMonth() && 
           d.getFullYear() === s.getFullYear();
  });

  const isAdmin = user?.role === 'admin';

  // Sorting: Unfinished tasks first, then by date
  const sortTasks = (taskList: Task[]) => {
    return [...taskList].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  };

  const adminTasks = sortTasks(dayTasks.filter(t => t.createdBy === 'admin-id'));
  const personalTasks = sortTasks(dayTasks.filter(t => t.createdBy !== 'admin-id'));

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const TaskList = ({ items, title, icon: Icon, colorClass }: { items: Task[], title: string, icon: any, colorClass: string }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Icon className={cn("w-4 h-4", colorClass)} />
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
        <Badge variant="outline" className="ml-auto text-[10px] h-4">{items.length}</Badge>
      </div>
      <div className="grid gap-3">
        {items.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 md:pt-20">
      <Navbar />
      
      <main className="max-w-screen-md mx-auto px-4 py-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-primary">Schedule</h1>
          
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border shadow-sm">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 px-4 font-medium text-sm min-w-[150px] justify-center">
              <CalendarIcon className="w-4 h-4 text-primary" />
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM do, yyyy')}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="list">Daily View</TabsTrigger>
            <TabsTrigger value="hourly">Hourly View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-8">
            {dayTasks.length > 0 ? (
              <>
                {adminTasks.length > 0 && (
                  <TaskList 
                    items={adminTasks} 
                    title={isAdmin ? "Assigned Tasks" : "From Administrator"} 
                    icon={ShieldCheck} 
                    colorClass="text-accent" 
                  />
                )}
                
                {!isAdmin && personalTasks.length > 0 && (
                  <TaskList 
                    items={personalTasks} 
                    title="Personal Tasks" 
                    icon={User} 
                    colorClass="text-primary" 
                  />
                )}

                {isAdmin && adminTasks.length === 0 && (
                   <div className="text-center py-20 bg-white rounded-xl border border-dashed text-muted-foreground">
                    You haven't assigned any tasks for this day.
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed text-muted-foreground">
                No tasks for this day.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="hourly" className="relative space-y-0 bg-white rounded-xl border shadow-sm p-4">
            {hours.map((hour) => {
              const hourlyTasks = sortTasks(dayTasks.filter(t => new Date(t.dueDate).getHours() === hour));
              return (
                <div key={hour} className="group flex gap-4 border-b last:border-0 py-4 min-h-[80px]">
                  <div className="w-16 text-xs font-bold text-muted-foreground pt-1 sticky left-0 bg-white">
                    {format(new Date().setHours(hour, 0), 'HH:mm')}
                  </div>
                  <div className="flex-1 space-y-2">
                    {hourlyTasks.length > 0 ? (
                      hourlyTasks.map(task => (
                        <div key={task.id} className="scale-95 origin-left">
                          <TaskCard task={task} />
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center">
                        <div className="w-full h-[1px] bg-muted/30 group-hover:bg-primary/20 transition-colors" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>

      <TaskForm />
    </div>
  );
}

export default function TasksPage() {
  return (
    <TaskProvider>
      <TasksContent />
    </TaskProvider>
  );
}
