
export type Category = 'Work' | 'Personal' | 'Fitness' | 'Health' | 'Urgent' | 'Other';

export type UserRole = 'admin' | 'user';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  username?: string; 
  photoURL: string | null;
  role: UserRole;
}

export interface UserAccount extends AppUser {
  username: string;
  password?: string; // Only stored for management purposes in this prototype
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: Category;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date; 
  completedBy?: string; // Name or UID of the person who completed the task
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: string[]; 
  createdBy?: string;
  notes?: string; 
  additionalTimeAllocated?: boolean; 
  progress?: number; 
}

export interface ProgressStats {
  date: string;
  completed: number;
  total: number;
}
