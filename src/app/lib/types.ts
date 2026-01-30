
export type Category = 'Work' | 'Personal' | 'Fitness' | 'Health' | 'Urgent' | 'Other';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: Category;
  dueDate: Date;
  completed: boolean;
  priority: 'Low' | 'Medium' | 'High';
}

export interface ProgressStats {
  date: string;
  completed: number;
  total: number;
}
