"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task } from '@/app/lib/types';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  getOverdueTasks: () => Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

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

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter(task => !task.completed && task.dueDate < now);
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, toggleTask, deleteTask, getOverdueTasks }}>
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

// Minimal uuid helper to avoid extra dependency since it is not in package.json
function uuidv4() {
  return Math.random().toString(36).substring(2, 9);
}
