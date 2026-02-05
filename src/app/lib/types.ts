
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
  priority: 'Low' | 'Medium' | 'High';
  assignedTo?: string; // UID or Name of the user
  createdBy?: string;
}

export interface ProgressStats {
  date: string;
  completed: number;
  total: number;
}
