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
        try {
          const parsed = JSON.parse(savedTasks);
          setAllTasks(parsed.map((t: any) => ({
            ...t,
            dueDate: new Date(t.dueDate),
            completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
            createdAt: t.createdAt ? new Date(t.createdAt) : undefined
          })));
        } catch (err) {}
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
        try { setNotifiedTaskIds(new Set(JSON.parse(savedNew))); } catch (e) { setNotifiedTaskIds(new Set()); }
      } else {
        setNotifiedTaskIds(new Set());
      }

      if (savedCompleted) {
        try { setNotifiedCompletedIds(new Set(JSON.parse(savedCompleted))); } catch (e) { setNotifiedCompletedIds(new Set()); }
      } else {
        setNotifiedCompletedIds(new Set());
      }
      setIdsLoaded(true);
    }
  }, [user]);

  const getVisibleTasks = useCallback(() => {
    if (!user) return [];
    return allTasks.filter(t => {
      if (t.createdBy === user.uid || (t.createdBy === 'admin-id' && user.role === 'admin')) return true;
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

  const triggerSystemNotification = useCallback(async (title: string, body: string, taskId?: string) => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (Notification.permission === 'granted') {
          registration.showNotification(title, {
            body,
            icon: 'https://picsum.photos/seed/taskicon192/192/192',
            badge: 'https://picsum.photos/seed/taskbadge96/96/96',
            requireInteraction: true,
            tag: taskId || `notification-${Date.now()}`,
            data: {
              url: taskId ? `${window.location.origin}/tasks?taskId=${taskId}` : window.location.origin
            }
          });
        }
      } catch (err) {
        console.warn('System notification failed:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || !user || !idsLoaded || allTasks.length === 0) return;

    // Logic for New Task Notifications
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
        // Redesign structural requirements:
        // Line 1: Header/Context
        // Line 2: Task Name
        // Line 3: Task Time
        triggerSystemNotification(
          "New task assigned", 
          `New task\nTask: ${t.title}\nTime: ${dueStr}`,
          t.id
        );
      });

      setNotifiedTaskIds(prev => {
        const next = new Set(prev);
        newTasksToNotify.forEach(t => next.add(t.id));
        localStorage.setItem(`task_compass_notified_ids_${user.uid}`, JSON.stringify(Array.from(next)));
        return next;
      });
    }

    // Logic for Task Completion Notifications (for Administrators)
    if (user.role === 'admin') {
      const completedTasksToNotify = allTasks.filter(t => 
        t.completed && 
        !notifiedCompletedIds.has(t.id) && 
        t.completedBy && 
        t.completedBy !== user.displayName &&
        t.completedBy !== user.username &&
        (t.createdBy === 'admin-id' || t.createdBy === 'admin' || t.assignedTo.includes('Me'))
      );

      if (completedTasksToNotify.length > 0) {
        completedTasksToNotify.forEach(t => {
          const compTimeStr = t.completedAt ? format(new Date(t.completedAt), 'HH:mm - MMM dd') : 'Unknown';
          
          // Redesign structural requirements for Admin:
          // Line 1: Header/Status
          // Line 2: Task Name
          // Line 3: Completion Time
          triggerSystemNotification(
            "Task Completed",
            `Task Completed\nTask: ${t.title}\nTime: ${compTimeStr}`,
            t.id
          );
        });

        setNotifiedCompletedIds(prev => {
          const next = new Set(prev);
          completedTasksToNotify.forEach(t => next.add(t.id));
          localStorage.setItem(`task_compass_notified_comp_ids_${user.uid}`, JSON.stringify(Array.from(next)));
          return next;
        });
      }
    }
  }, [allTasks, user, isHydrated, idsLoaded, notifiedTaskIds, notifiedCompletedIds, triggerSystemNotification]);

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
      assignedTo: task.assignedTo || ['Me'],
      createdAt: new Date()
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
          createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
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