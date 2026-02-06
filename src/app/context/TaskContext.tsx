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
        setTasks(parsed.map((t: any) => ({ ...t, dueDate: new Date(t.dueDate) })));
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
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Permissions check
    const isOwner = task.createdBy === user?.uid;
    const isAdmin = user?.role === 'admin';
    
    if (isAdmin || isOwner) {
      setTasks(prev => prev.filter(t => t.id !== id));
    } else {
      console.warn("Permission denied: Cannot delete tasks assigned by Admin.");
    }
  };

  const getVisibleTasks = () => {
    if (!user) return [];
    
    // Administrator only sees tasks they created (assigned tasks)
    // They cannot see user-defined private tasks
    if (user.role === 'admin') {
      return tasks.filter(t => t.createdBy === user.uid);
    }
    
    // Regular users see tasks they created OR tasks assigned to them
    return tasks.filter(t => 
      t.createdBy === user.uid || 
      t.assignedTo === user.displayName || 
      t.assignedTo === user.email ||
      t.assignedTo === user.uid
    );
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return getVisibleTasks().filter(task => !task.completed && new Date(task.dueDate) < now);
  };

  const exportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `task-compass-backup-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importTasks = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const importedTasks = JSON.parse(text);
      if (Array.isArray(importedTasks)) {
        const validatedTasks = importedTasks.map((t: any) => ({
          ...t,
          dueDate: new Date(t.dueDate)
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