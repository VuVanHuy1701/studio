'use server';

import fs from 'fs/promises';
import path from 'path';
import { Task } from '@/app/lib/types';

const filePath = path.join(process.cwd(), 'src', 'app', 'lib', 'tasks.json');

/**
 * Fetches the master list of tasks from the server-side JSON file.
 */
export async function getTasksFromFile(): Promise<Task[]> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return (parsed.tasks || []).map((t: any) => ({
      ...t,
      dueDate: new Date(t.dueDate),
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
    }));
  } catch (error) {
    console.error('Error reading tasks.json:', error);
    return [];
  }
}

/**
 * Persists the master list of tasks back to the server-side JSON file.
 */
export async function persistTasksToFile(tasks: Task[]) {
  try {
    const data = JSON.stringify({ tasks }, null, 2);
    await fs.writeFile(filePath, data, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Error writing to tasks.json:', error);
    return { success: false, error: 'Failed to sync tasks to server.' };
  }
}
