"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [notifiedNoteIds, setNotifiedNoteIds] = useState<Map<string, string>>(new Map());

  const lastStateRef = useRef<Map<string, { completed: boolean, notes: string, progress: number }>>(new Map());

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
    const interval = setInterval(refreshTasks, 10000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshTasks();
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
      const savedNotes = localStorage.getItem(`task_compass_notified_notes_${user.uid}`);
      
      try { if (savedNew) setNotifiedTaskIds(new Set(JSON.parse(savedNew))); } catch (e) { setNotifiedTaskIds(new Set()); }
      try { if (savedCompleted) setNotifiedCompletedIds(new Set(JSON.parse(savedCompleted))); } catch (e) { setNotifiedCompletedIds(new Set()); }
      try { if (savedNotes) setNotifiedNoteIds(new Map(Object.entries(JSON.parse(savedNotes)))); } catch (e) { setNotifiedNoteIds(new Map()); }
      setIdsLoaded(true);
    }
  }, [user]);

  const getVisibleTasks = useCallback(() => {
    if (!user) return [];
    return allTasks.filter(t => {
      if (t.createdBy === user.uid || (t.createdBy === 'admin-id' && user.role === 'admin')) return true;
      return t.assignedTo.some(assignee => 
        assignee === user.displayName || 
        assignee === user.email || 
        assignee === user.uid ||
        (user.username && assignee === user.username) ||
        (assignee === 'Me' && t.createdBy === user.uid)
      );
    });
  }, [allTasks, user]);

  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return getVisibleTasks().filter(task => !task.completed && new Date(task.dueDate) < now);
  }, [getVisibleTasks]);

  useEffect(() => {
    if (!isHydrated || !user || !idsLoaded || allTasks.length === 0) return;

    // 1. User Assignment Notifications
    const newTasksToNotify = allTasks.filter(t => {
      const isAssignedToMe = t.assignedTo.some(assignee => 
        assignee === user.displayName || 
        assignee === user.email || 
        assignee === user.uid ||
        (user.username && assignee === user.username) ||
        (assignee === 'Me' && t.createdBy === user.uid)
      );
      return isAssignedToMe && !notifiedTaskIds.has(t.id) && !t.completed && t.createdBy !== user.uid;
    });

    if (newTasksToNotify.length > 0) {
      newTasksToNotify.forEach(t => {
        const dueStr = format(new Date(t.dueDate), 'HH:mm - MMM dd');
        toast({
          variant: t.priority === 'High' ? 'high' : t.priority === 'Medium' ? 'medium' : 'low',
          title: "New task assigned",
          description: `Line 1: New task assigned\nLine 2: Task: ${t.title}\nLine 3: Note: ${t.description || 'No description'} - Progress: ${t.progress || 0}%\nLine 4: Deadline: ${dueStr}`,
        });
      });

      setNotifiedTaskIds(prev => {
        const next = new Set(prev);
        newTasksToNotify.forEach(t => next.add(t.id));
        localStorage.setItem(`task_compass_notified_ids_${user.uid}`, JSON.stringify(Array.from(next)));
        return next;
      });
    }

    // 2. Administrator Notifications
    if (user.role === 'admin') {
      allTasks.forEach(t => {
        const isAdminCreated = t.createdBy === 'admin-id' || t.createdBy === 'admin';
        if (!isAdminCreated) return;

        const lastState = lastStateRef.current.get(t.id);
        const deadlineStr = format(new Date(t.dueDate), 'HH:mm - MMM dd');
        const whoStr = t.completedBy || t.assignedTo?.[0] || 'Unknown User';

        // Completion (Green Border)
        if (t.completed && (!lastState || !lastState.completed) && !notifiedCompletedIds.has(t.id)) {
          const compTimeStr = t.completedAt ? format(new Date(t.completedAt), 'HH:mm - MMM dd') : 'Just now';
          
          toast({
            variant: "success",
            title: "Task completed",
            description: `Line 1: Task completed\nLine 2: Task: ${t.title}\nLine 3: Note: ${t.notes || 'No note'} - Progress: 100%\nLine 4: Deadline: ${deadlineStr} - Done: ${compTimeStr}\nLine 5: User: ${whoStr}`,
          });

          setNotifiedCompletedIds(prev => {
            const next = new Set(prev);
            next.add(t.id);
            localStorage.setItem(`task_compass_notified_comp_ids_${user.uid}`, JSON.stringify(Array.from(next)));
            return next;
          });
        } 
        
        // Progress Updated (Yellow Border) - Triggered when notes or progress changes but task is not complete
        else if (!t.completed && ((t.notes && t.notes !== lastState?.notes) || (t.progress !== lastState?.progress))) {
           toast({
            variant: "warning",
            title: "Progress updated",
            description: `Line 1: Progress updated\nLine 2: Task: ${t.title}\nLine 3: Note: ${t.notes || 'No note'} - Progress: ${t.progress || 0}%\nLine 4: Deadline: ${deadlineStr}\nLine 5: Reported by: ${whoStr}`,
          });

          setNotifiedNoteIds(prev => {
            const next = new Map(prev);
            next.set(t.id, t.notes || '');
            localStorage.setItem(`task_compass_notified_notes_${user.uid}`, JSON.stringify(Object.fromEntries(next)));
            return next;
          });
        }
      });
    }

    const newState = new Map();
    allTasks.forEach(t => newState.set(t.id, { completed: t.completed, notes: t.notes || '', progress: t.progress || 0 }));
    lastStateRef.current = newState;

  }, [allTasks, user, isHydrated, idsLoaded, notifiedTaskIds, notifiedCompletedIds, notifiedNoteIds, toast]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('task_compass_tasks', JSON.stringify(allTasks));
      persistTasksToFile(allTasks).catch(err => console.warn('Sync failed:', err));
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

  const deleteTask = (id: string) => setAllTasks(prev => prev.filter(t => t.id !== id));

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
        setAllTasks(importedTasks.map((t: any) => ({
          ...t,
          dueDate: new Date(t.dueDate),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
          createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
          assignedTo: Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo || 'Me'],
          progress: t.progress ?? (t.completed ? 100 : 0)
        })));
        return true;
      }
      return false;
    } catch (e) {
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
  if (context === undefined) throw new Error('useTasks must be used within a TaskProvider');
  return context;
}
