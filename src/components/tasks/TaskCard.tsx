"use client";

import { Task } from '@/app/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Clock, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/app/context/TaskContext';
import { format } from 'date-fns';
import { useSettings } from '@/app/context/SettingsContext';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { toggleTask, deleteTask } = useTasks();
  const { t } = useSettings();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Medium': return 'bg-accent/10 text-accent border-accent/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all hover:shadow-md border-l-4",
      task.completed ? "opacity-60 grayscale-[0.5] border-l-muted" : "border-l-primary"
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
            <h3 className={cn(
              "font-semibold text-lg leading-tight transition-all",
              task.completed && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h3>
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
          
          <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(task.dueDate, 'HH:mm')}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {t(task.category.toLowerCase() as any)}
            </span>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => deleteTask(task.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
