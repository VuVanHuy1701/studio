
"use client";

import { TaskProvider, useTasks } from '@/app/context/TaskContext';
import { Navbar } from '@/components/layout/Navbar';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, addDays } from 'date-fns';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ShieldCheck, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Task } from '@/app/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

function TasksContent() {
  const { tasks, getOverdueTasks } = useTasks();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setIsLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const dayTasks = tasks.filter(t => {
    const d = new Date(t.dueDate);
    const s = selectedDate;
    return d.getDate() === s.getDate() && 
           d.getMonth() === s.getMonth() && 
           d.getFullYear() === s.getFullYear();
  });

  const sortTasks = (taskList: Task[]) => {
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    return [...taskList].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const weightA = priorityWeight[a.priority] || 0;
      const weightB = priorityWeight[b.priority] || 0;
      if (weightA !== weightB) return weightB - weightA;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  };

  const overdue = sortTasks(getOverdueTasks());
  const isAdmin = user?.role === 'admin';

  const adminTasks = sortTasks(dayTasks.filter(t => t.createdBy === 'admin-id'));
  const personalTasks = sortTasks(dayTasks.filter(t => t.createdBy !== 'admin-id'));

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  const TaskList = ({ items, title, icon: Icon, colorClass }: { items: Task[], title: string, icon: any, colorClass: string }) => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Icon className={cn("w-4 h-4", colorClass)} />
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
        <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-2 bg-primary/5 text-primary border-primary/10">{items.length}</Badge>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map(task => (
          <motion.div key={task.id} variants={itemVariants}>
            <TaskCard task={task} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen pb-24 md:pb-10 md:pt-10">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-primary tracking-tight"
          >
            Schedule
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 border shadow-sm self-start md:self-auto"
          >
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 px-6 font-bold text-sm min-w-[180px] justify-center text-primary">
              <CalendarIcon className="w-4 h-4" />
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM do, yyyy')}
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </header>

        <AnimatePresence>
          {!isLoaded ? (
            <div className="space-y-6">
              <Skeleton className="h-40 w-full rounded-3xl" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {overdue.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 bg-destructive/[0.03] p-6 rounded-3xl border border-destructive/10"
                >
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-5 h-5" />
                    <h2 className="text-sm font-bold uppercase tracking-widest">Overdue Tasks</h2>
                    <Badge variant="destructive" className="ml-auto font-black">{overdue.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {overdue.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </motion.div>
              )}

              <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/30 p-1 rounded-2xl h-12">
                  <TabsTrigger value="list" className="rounded-xl font-bold data-[state=active]:shadow-sm">Daily View</TabsTrigger>
                  <TabsTrigger value="hourly" className="rounded-xl font-bold data-[state=active]:shadow-sm">Hourly View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="list" className="space-y-12">
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
                         <div className="text-center py-24 bg-white/50 rounded-3xl border border-dashed border-primary/10 text-muted-foreground shadow-sm">
                          <p className="font-medium">You haven't assigned any tasks for this day.</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-24 bg-white/50 rounded-3xl border border-dashed border-primary/10 text-muted-foreground shadow-sm">
                      <p className="font-medium">No tasks for this day.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="hourly" className="relative space-y-0 bg-white/80 backdrop-blur-sm rounded-3xl border shadow-sm p-6">
                  {hours.map((hour) => {
                    const hourlyTasks = sortTasks(dayTasks.filter(t => new Date(t.dueDate).getHours() === hour));
                    return (
                      <div key={hour} className="group flex gap-6 border-b border-primary/5 last:border-0 py-5 min-h-[90px]">
                        <div className="w-16 text-xs font-black text-primary/60 pt-1 sticky left-0 uppercase tracking-tighter">
                          {format(new Date().setHours(hour, 0), 'HH:mm')}
                        </div>
                        <div className="flex-1">
                          {hourlyTasks.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {hourlyTasks.map(task => (
                                <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="scale-[0.98] origin-left hover:scale-100 transition-transform">
                                  <TaskCard task={task} />
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full flex items-center">
                              <div className="w-full h-[1px] bg-muted/20 group-hover:bg-primary/10 transition-colors" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </AnimatePresence>
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
