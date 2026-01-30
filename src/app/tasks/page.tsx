
"use client";

import { TaskProvider, useTasks } from '@/app/context/TaskContext';
import { Navbar } from '@/components/layout/Navbar';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isToday, addDays, startOfDay, endOfDay } from 'date-fns';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

function TasksContent() {
  const { tasks } = useTasks();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dayTasks = tasks.filter(t => {
    const d = t.dueDate;
    return d.getDate() === selectedDate.getDate() && 
           d.getMonth() === selectedDate.getMonth() && 
           d.getFullYear() === selectedDate.getFullYear();
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

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
          
          <TabsContent value="list" className="space-y-4">
            <div className="grid gap-3">
              {dayTasks.length > 0 ? (
                dayTasks
                  .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                  .map(task => (
                  <TaskCard key={task.id} task={task} />
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed text-muted-foreground">
                  No tasks for this day.
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="hourly" className="relative space-y-0 bg-white rounded-xl border shadow-sm p-4">
            {hours.map((hour) => {
              const hourlyTasks = dayTasks.filter(t => t.dueDate.getHours() === hour);
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
