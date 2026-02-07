
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task } from '@/app/lib/types';
import { useAuth } from '@/app/context/AuthContext';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  getOverdueTasks: () => Task[];
  exportTasks: () => void;
  importTasks: (file: File) => Promise<boolean>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const savedTasks = localStorage.getItem('task_compass_tasks');
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        setTasks(parsed.map((t: any) => ({ 
          ...t, 
          dueDate: new Date(t.dueDate),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
          assignedTo: Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo || 'Me'],
          progress: t.progress ?? (t.completed ? 100 : 0)
        })));
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('task_compass_tasks', JSON.stringify(tasks));
    }
  }, [tasks, isHydrated]);

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask = { ...task, id: uuidv4() };
    setTasks(prev => [...prev, newTask]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => {
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
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const wasNotCompleted = !task.completed;
        const isNowCompleted = updates.completed !== undefined ? updates.completed : task.completed;
        
        let completedAt = task.completedAt;
        if (wasNotCompleted && isNowCompleted) {
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
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const isOwner = task.createdBy === user?.uid;
    const isAdmin = user?.role === 'admin';
    
    if (isAdmin || isOwner) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const getVisibleTasks = () => {
    if (!user) return [];
    
    if (user.role === 'admin') {
      return tasks.filter(t => t.createdBy === user.uid);
    }
    
    return tasks.filter(t => 
      t.createdBy === user.uid || 
      t.assignedTo.includes(user.displayName || '') || 
      t.assignedTo.includes(user.email || '') ||
      t.assignedTo.includes(user.uid) ||
      t.assignedTo.includes('Me')
    );
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return getVisibleTasks().filter(task => !task.completed && new Date(task.dueDate) < now);
  };

  const exportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
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
        setTasks(validatedTasks);
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
      importTasks
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

function uuidv4() {
  return Math.random().toString(36).substring(2, 9);
}
