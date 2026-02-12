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
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(new Set());

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

    const interval = setInterval(refreshTasks, 30000);
    return () => clearInterval(interval);
  }, [refreshTasks]);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`task_compass_notified_ids_${user.uid}`);
      if (saved) {
        try {
          setNotifiedTaskIds(new Set(JSON.parse(saved)));
        } catch (e) {
          console.error("Error parsing notified IDs", e);
        }
      } else {
        setNotifiedTaskIds(new Set());
      }
    }
  }, [user]);

  useEffect(() => {
    if (!isHydrated || !user || allTasks.length === 0) return;

    const tasksToNotify = allTasks.filter(t => {
      const isAssignedToMe = t.assignedTo.some(assignee => 
        assignee === user.displayName || 
        assignee === user.email || 
        assignee === user.uid ||
        (user.username && assignee === user.username) ||
        (assignee === 'Me' && t.createdBy === user.uid)
      );
      
      return isAssignedToMe && !notifiedTaskIds.has(t.id) && !t.completed;
    });

    if (tasksToNotify.length > 0) {
      tasksToNotify.forEach(t => {
        const dueStr = format(new Date(t.dueDate), 'HH:mm - MMM dd');
        const importance = t.priority;
        const description = `${t.title} - Time: ${dueStr} | Importance: ${importance}`;
        
        const variant = t.priority.toLowerCase() as 'low' | 'medium' | 'high';

        // 1. In-app Persistent Toast (Manually dismissed)
        toast({
          title: "New task received",
          description: description,
          variant: variant,
          duration: 86400000, // Set to 24 hours to ensure it doesn't auto-dismiss
        });

        // 2. System Push Notification (PWA)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const notificationOptions: NotificationOptions = {
            body: description,
            icon: 'https://picsum.photos/seed/taskicon192/192/192',
            badge: 'https://picsum.photos/seed/taskbadge/96/96',
            tag: t.id,
            data: { url: window.location.origin + '/tasks' },
            vibrate: [200, 100, 200],
            requireInteraction: true // Keeps the notification visible until user clicks or closes it
          };

          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification("New task received", notificationOptions);
            });
          } else {
            new Notification("New task received", notificationOptions);
          }
        }
      });

      setNotifiedTaskIds(prev => {
        const next = new Set(prev);
        tasksToNotify.forEach(t => next.add(t.id));
        localStorage.setItem(`task_compass_notified_ids_${user.uid}`, JSON.stringify(Array.from(next)));
        return next;
      });
    }
  }, [allTasks, user, isHydrated, notifiedTaskIds, toast]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('task_compass_tasks', JSON.stringify(allTasks));
      persistTasksToFile(allTasks).catch(err => {
        console.warn('System file sync skipped or failed:', err);
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
        if (!task.completed && isNowCompleted) {
          completedAt = new Date();
        } else if (isNowCompleted === false) {
          completedAt = undefined;
        }

        let progress = updates.progress !== undefined ? updates.progress : task.progress;
        if (isNowCompleted) progress = 100;

        return { ...task, ...updates, completedAt, progress };
      }
      return task;
    }));
  };

  const deleteTask = (id: string) => {
    setAllTasks(prev => prev.filter(t => t.id !== id));
  };

  const getVisibleTasks = () => {
    if (!user) return [];
    
    return allTasks.filter(t => {
      if (t.createdBy === user.uid) return true;

      const isAssignedToMe = t.assignedTo.some(assignee => 
        assignee === user.displayName || 
        assignee === user.email || 
        assignee === user.uid ||
        (user.username && assignee === user.username) ||
        (assignee === 'Me' && t.createdBy === user.uid)
      );

      return isAssignedToMe;
    });
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return getVisibleTasks().filter(task => !task.completed && new Date(task.dueDate) < now);
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
