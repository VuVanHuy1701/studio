
export type Category = 'Work' | 'Personal' | 'Fitness' | 'Health' | 'Urgent' | 'Other';

export type UserRole = 'admin' | 'user';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: Category;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date; // Added to track when the task was finished
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: string[]; // List of UIDs or Names, ordered by rank
  createdBy?: string;
  notes?: string; // Feedback for uncompleted admin tasks
  additionalTimeAllocated?: boolean; // New flag for extended deadlines
  progress?: number; // Task completion percentage (0-100)
}

export interface ProgressStats {
  date: string;
  completed: number;
  total: number;
}
