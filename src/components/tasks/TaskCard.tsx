"use client";

import { Task } from '@/app/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Clock, Tag, User, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/app/context/TaskContext';
import { format } from 'date-fns';
import { useSettings } from '@/app/context/SettingsContext';
import { useAuth } from '@/app/context/AuthContext';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { toggleTask, deleteTask } = useTasks();
  const { t } = useSettings();
  const { user } = useAuth();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Medium': return 'bg-accent/10 text-accent border-accent/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const isAdminCreated = task.createdBy === 'admin-id';
  const isOwner = task.createdBy === user?.uid;
  const isAdmin = user?.role === 'admin';
  const canDelete = isAdmin || isOwner;

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all hover:shadow-md border-l-4",
      task.completed ? "opacity-60 grayscale-[0.5] border-l-muted" : "border-l-primary",
      isAdminCreated && !isAdmin && "bg-primary/5 border-l-accent"
    )}>
      <CardContent className="p-4 flex items-start gap-4">
        <div className="pt-1">
          <Checkbox 
            checked={task.completed} 
            onCheckedChange={() => toggleTask(task.id)}
            className="w-5 h-5 rounded-full"
          />
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "font-semibold text-lg leading-tight transition-all",
                task.completed && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              {isAdminCreated && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 flex gap-1 items-center bg-accent/20 text-accent-foreground border-accent/30">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getPriorityColor(task.priority))}>
                {t(task.priority.toLowerCase() as any)}
              </Badge>
            </div>
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(task.dueDate), 'HH:mm - MMM dd')}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {t(task.category.toLowerCase() as any)}
            </span>
            {task.assignedTo && (
              <span className="flex items-center gap-1 text-primary">
                <User className="w-3 h-3" />
                {task.assignedTo === user?.displayName ? "Me" : task.assignedTo}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center">
          {canDelete ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          ) : (
            <div className="text-muted-foreground/30 px-2">
              <Lock className="w-4 h-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
