
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task } from '@/app/lib/types';
import { useAuth } from '@/app/context/AuthContext';
import { getTasksFromFile, persistTasksToFile } from '@/app/actions/task-actions';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  getOverdueTasks: () => Task[];
  exportTasks: () => void;
  importTasks: (file: File) => Promise<boolean>;
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [idsLoaded, setIdsLoaded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(new Set());
  const [notifiedCompletedIds, setNotifiedCompletedIds] = useState<Set<string>>(new Set());

  const refreshTasks = useCallback(async () => {
    try {
      const serverTasks = await getTasksFromFile();
      setAllTasks(serverTasks);
      localStorage.setItem('task_compass_tasks', JSON.stringify(serverTasks));
    } catch (e) {
      console.warn("Failed to fetch tasks from server, falling back to local storage", e);
      const savedTasks = localStorage.getItem('task_compass_tasks');
      if (savedTasks) {
        setAllTasks(JSON.parse(savedTasks).map((t: any) => ({
          ...t,
          dueDate: new Date(t.dueDate),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined
        })));
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    refreshTasks();
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const interval = setInterval(refreshTasks, 10000);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshTasks();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshTasks]);

  useEffect(() => {
    if (user) {
      setIdsLoaded(false);
      const savedNew = localStorage.getItem(`task_compass_notified_ids_${user.uid}`);
      const savedCompleted = localStorage.getItem(`task_compass_notified_comp_ids_${user.uid}`);
      
      if (savedNew) {
        try { setNotifiedTaskIds(new Set(JSON.parse(savedNew))); } catch (e) {}
      } else {
        setNotifiedTaskIds(new Set());
      }

      if (savedCompleted) {
        try { setNotifiedCompletedIds(new Set(JSON.parse(savedCompleted))); } catch (e) {}
      } else {
        setNotifiedCompletedIds(new Set());
      }
      setIdsLoaded(true);
    }
  }, [user]);

  const getVisibleTasks = useCallback(() => {
    if (!user) return [];
    return allTasks.filter(t => {
      if (t.createdBy === user.uid || t.createdBy === 'admin-id' && user.role === 'admin') return true;
      const isAssignedToMe = t.assignedTo.some(assignee => 
        assignee === user.displayName || 
        assignee === user.email || 
        assignee === user.uid ||
        (user.username && assignee === user.username) ||
        (assignee === 'Me' && t.createdBy === user.uid)
      );
      return isAssignedToMe;
    });
  }, [allTasks, user]);

  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return getVisibleTasks().filter(task => !task.completed && new Date(task.dueDate) < now);
  }, [getVisibleTasks]);

  useEffect(() => {
    if (!isHydrated || !user || !idsLoaded || allTasks.length === 0) return;

    const newTasksToNotify = allTasks.filter(t => {
      const isAssignedToMe = t.assignedTo.some(assignee => 
        assignee === user.displayName || 
        assignee === user.email || 
        assignee === user.uid ||
        (user.username && assignee === user.username) ||
        (assignee === 'Me' && t.createdBy === user.uid)
      );
      
      return isAssignedToMe && !notifiedTaskIds.has(t.id) && !t.completed;
    });

    if (newTasksToNotify.length > 0) {
      newTasksToNotify.forEach(t => {
        const dueStr = format(new Date(t.dueDate), 'HH:mm - MMM dd');
        const importance = t.priority;
        const variant = t.priority.toLowerCase() as 'low' | 'medium' | 'high';

        toast({
          title: "New task assigned",
          description: (
            <div className="flex flex-col gap-0.5 mt-1">
              <div className="text-sm font-bold leading-tight">{t.title}</div>
              <div className="text-sm leading-tight opacity-90">{t.description || "No content"}</div>
              <div className="text-[11px] opacity-80 mt-1">
                {dueStr}; Importance: <span className="font-bold">{importance}</span>
              </div>
            </div>
          ),
          variant: variant,
          duration: 86400000, 
        });

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification("New task assigned", {
            body: `${t.title}\n${t.description || 'No content'}\n${dueStr}; Importance: ${importance}`,
            icon: 'https://picsum.photos/seed/taskicon/192/192',
            requireInteraction: true 
          });
        }
      });

      setNotifiedTaskIds(prev => {
        const next = new Set(prev);
        newTasksToNotify.forEach(t => next.add(t.id));
        localStorage.setItem(`task_compass_notified_ids_${user.uid}`, JSON.stringify(Array.from(next)));
        return next;
      });
    }

    if (user.role === 'admin') {
      const completedTasksToNotify = allTasks.filter(t => 
        t.completed && 
        !notifiedCompletedIds.has(t.id) && 
        t.completedBy && 
        t.completedBy !== user.displayName &&
        (t.createdBy === 'admin-id' || t.createdBy === 'admin')
      );

      if (completedTasksToNotify.length > 0) {
        completedTasksToNotify.forEach(t => {
          const compTimeStr = t.completedAt ? format(new Date(t.completedAt), 'HH:mm - MMM dd') : 'Unknown';
          
          toast({
            title: "Task completed",
            variant: "low",
            duration: 86400000,
            description: (
              <div className="flex flex-col gap-0.5 mt-1">
                <div className="text-sm font-bold leading-tight">{t.title}</div>
                <div className="text-[11px] leading-tight opacity-90 italic">"{t.description || 'No description'}"</div>
                <div className="text-[11px] mt-1">Finished: <span className="font-medium">{compTimeStr}</span></div>
                <div className="text-[11px] bg-white/40 p-1 rounded mt-1">Notes: {t.notes || 'No notes provided'}</div>
                <div className="text-[11px] mt-1 font-bold">Completed by: {t.completedBy}</div>
              </div>
            ),
          });

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification("Task Status Update", {
              body: `Task completed\n${t.title}\nFinished: ${compTimeStr}\nBy: ${t.completedBy}`,
              icon: 'https://picsum.photos/seed/taskdone/192/192',
              requireInteraction: true 
            });
          }
        });

        setNotifiedCompletedIds(prev => {
          const next = new Set(prev);
          completedTasksToNotify.forEach(t => next.add(t.id));
          localStorage.setItem(`task_compass_notified_comp_ids_${user.uid}`, JSON.stringify(Array.from(next)));
          return next;
        });
      }
    }
  }, [allTasks, user, isHydrated, idsLoaded, notifiedTaskIds, notifiedCompletedIds, toast]);

  useEffect(() => {
    if (!isHydrated || !user) return;

    const checkScheduledNotifications = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      const is7AM = hours === 7 && minutes >= 0 && minutes < 5;
      const is7PM = hours === 19 && minutes >= 0 && minutes < 5;
      
      if (is7AM || is7PM) {
        const slotKey = is7AM ? 'AM' : 'PM';
        const dateKey = format(now, 'yyyy-MM-dd');
        const storageKey = `task_compass_scheduled_summary_${user.uid}_${dateKey}_${slotKey}`;
        
        if (!localStorage.getItem(storageKey)) {
          const visibleTasks = getVisibleTasks();
          const unfinished = visibleTasks.filter(t => !t.completed).length;
          const overdueCount = getOverdueTasks().length;

          if (unfinished > 0 || overdueCount > 0) {
            toast({
              title: "Tasks to be completed",
              description: (
                <div className="flex flex-col gap-0.5 mt-1">
                  <div className="text-sm font-bold leading-tight">Unfinished tasks: {unfinished}</div>
                  <div className="text-sm font-bold leading-tight">Overdue tasks: {overdueCount}</div>
                </div>
              ),
              variant: overdueCount > 0 ? "high" : "medium",
              duration: 86400000, 
            });

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification("Task Compass Summary", {
                body: `Tasks to be completed\nUnfinished tasks: ${unfinished}\nOverdue tasks: ${overdueCount}`,
                requireInteraction: true
              });
            }

            localStorage.setItem(storageKey, 'sent');
          }
        }
      }
    };

    const intervalId = setInterval(checkScheduledNotifications, 60000);
    checkScheduledNotifications();
    return () => clearInterval(intervalId);
  }, [isHydrated, user, getVisibleTasks, getOverdueTasks, toast]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('task_compass_tasks', JSON.stringify(allTasks));
      persistTasksToFile(allTasks).catch(err => {
        console.warn('System file sync failed:', err);
      });
    }
  }, [allTasks, isHydrated]);

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask: Task = { 
      ...task, 
      id: Math.random().toString(36).substring(2, 9),
      progress: task.progress ?? 0,
      assignedTo: task.assignedTo || ['Me']
    };
    setAllTasks(prev => [...prev, newTask]);
  };

  const toggleTask = (id: string) => {
    setAllTasks(prev => prev.map(task => {
      if (task.id === id) {
        const isNowCompleted = !task.completed;
        return { 
          ...task, 
          completed: isNowCompleted,
          completedAt: isNowCompleted ? new Date() : undefined,
          completedBy: isNowCompleted ? (user?.displayName || user?.username || 'Unknown User') : undefined,
          progress: isNowCompleted ? 100 : task.progress
        };
      }
      return task;
    }));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setAllTasks(prev => prev.map(task => {
      if (task.id === id) {
        const isNowCompleted = updates.completed !== undefined ? updates.completed : task.completed;
        let completedAt = task.completedAt;
        let completedBy = task.completedBy;

        if (!task.completed && isNowCompleted) {
          completedAt = new Date();
          completedBy = user?.displayName || user?.username || 'Unknown User';
        } else if (isNowCompleted === false) {
          completedAt = undefined;
          completedBy = undefined;
        }

        let progress = updates.progress !== undefined ? updates.progress : task.progress;
        if (isNowCompleted) progress = 100;

        return { ...task, ...updates, completedAt, completedBy, progress };
      }
      return task;
    }));
  };

  const deleteTask = (id: string) => {
    setAllTasks(prev => prev.filter(t => t.id !== id));
  };

  const exportTasks = () => {
    const dataStr = JSON.stringify(allTasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `task-compass-backup-${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  };

  const importTasks = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const importedTasks = JSON.parse(text);
      if (Array.isArray(importedTasks)) {
        const validatedTasks = importedTasks.map((t: any) => ({
          ...t,
          dueDate: new Date(t.dueDate),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
          assignedTo: Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo || 'Me'],
          progress: t.progress ?? (t.completed ? 100 : 0)
        }));
        setAllTasks(validatedTasks);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  };

  return (
    <TaskContext.Provider value={{ 
      tasks: getVisibleTasks(), 
      addTask, 
      toggleTask, 
      deleteTask, 
      updateTask,
      getOverdueTasks,
      exportTasks,
      importTasks,
      refreshTasks
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
