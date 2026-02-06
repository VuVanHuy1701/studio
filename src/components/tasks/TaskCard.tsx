
"use client";

import { Task } from '@/app/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Clock, 
  Tag, 
  User, 
  ShieldCheck, 
  Lock, 
  Edit3, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/app/context/TaskContext';
import { format, isPast } from 'date-fns';
import { useSettings } from '@/app/context/SettingsContext';
import { useAuth } from '@/app/context/AuthContext';
import { TaskForm } from './TaskForm';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { toggleTask, deleteTask, updateTask } = useTasks();
  const { t } = useSettings();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [isUrgentDeadline, setIsUrgentDeadline] = useState(false);

  const isOverdue = !task.completed && isPast(new Date(task.dueDate));

  useEffect(() => {
    const checkUrgency = () => {
      if (task.completed) {
        setIsUrgentDeadline(false);
        return;
      }
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const diffMs = dueDate.getTime() - now.getTime();
      const twoHoursInMs = 2 * 60 * 60 * 1000;
      setIsUrgentDeadline(diffMs > 0 && diffMs <= twoHoursInMs);
    };

    checkUrgency();
    const interval = setInterval(checkUrgency, 60000);
    return () => clearInterval(interval);
  }, [task.dueDate, task.completed]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Medium': return 'bg-accent/10 text-accent border-accent/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const isAdminCreated = task.createdBy === 'admin-id' || task.createdBy === 'admin';
  const isOwner = task.createdBy === user?.uid;
  const isAdmin = user?.role === 'admin';
  
  const leadAssignee = task.assignedTo?.[0] || 'Me';
  const isLead = leadAssignee === user?.displayName || leadAssignee === user?.email || leadAssignee === user?.uid || (leadAssignee === 'Me' && isAdmin);
  
  const canDelete = isAdmin || isOwner;
  const canEdit = isAdmin || isOwner;
  const canToggle = !isAdminCreated || isLead || isAdmin;

  const handleToggleAttempt = () => {
    if (!canToggle) return;

    if (!task.completed) {
      if (isAdminCreated && !isAdmin && isLead) {
        setProgressDialogOpen(true);
      } else {
        toggleTask(task.id);
      }
    } else {
      toggleTask(task.id);
    }
  };

  const handleMarkComplete = () => {
    updateTask(task.id, { completed: true });
    setProgressDialogOpen(false);
  };

  const handleNotCompleted = () => {
    setShowNotesInput(true);
  };

  const handleSaveNotes = () => {
    updateTask(task.id, { notes: notes, completed: false });
    setProgressDialogOpen(false);
    setShowNotesInput(false);
  };

  return (
    <>
      <Card className={cn(
        "group relative overflow-hidden transition-all hover:shadow-md border-l-4",
        task.completed ? "opacity-60 grayscale-[0.5] border-l-muted" : "border-l-primary",
        isAdminCreated && !isAdmin && "bg-accent/[0.07] border-l-accent ring-1 ring-accent/20",
        isUrgentDeadline && !isOverdue && "border-l-destructive bg-destructive/5 ring-1 ring-destructive/30 animate-pulse-slow",
        isOverdue && "border-l-destructive bg-destructive/10 ring-2 ring-destructive/40"
      )}>
        <CardContent className="p-4 flex items-start gap-4">
          <div className="pt-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Checkbox 
                      checked={task.completed} 
                      onCheckedChange={handleToggleAttempt}
                      disabled={!canToggle}
                      className={cn(
                        "w-5 h-5 rounded-full",
                        !canToggle && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  </div>
                </TooltipTrigger>
                {!canToggle && (
                  <TooltipContent>
                    <p className="text-xs">Only the Lead Assignee ({leadAssignee}) can complete this task.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cn(
                  "font-semibold text-lg leading-tight transition-all",
                  task.completed && "line-through text-muted-foreground",
                  (isUrgentDeadline || isOverdue) && "text-destructive font-bold"
                )}>
                  {task.title}
                </h3>
                {isAdminCreated && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 flex gap-1 items-center bg-accent/20 text-accent-foreground border-accent/30 font-bold uppercase tracking-tighter">
                    <ShieldCheck className="w-3 h-3" />
                    Admin
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1.5 flex gap-1 items-center bg-destructive text-destructive-foreground font-black uppercase">
                    <AlertCircle className="w-3 h-3" />
                    Overdue
                  </Badge>
                )}
                {isUrgentDeadline && !isOverdue && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1.5 flex gap-1 items-center animate-bounce">
                    <AlertTriangle className="w-3 h-3" />
                    Due Soon
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

            {task.notes && (
              <div className="mt-2 p-2 rounded bg-muted/50 border border-dashed text-xs text-muted-foreground">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <MessageSquare className="w-3 h-3" /> User Notes:
                </p>
                {task.notes}
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
              <span className={cn(
                "flex items-center gap-1",
                (isUrgentDeadline || isOverdue) && "text-destructive"
              )}>
                <Clock className="w-3 h-3" />
                {format(new Date(task.dueDate), 'HH:mm - MMM dd')}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {t(task.category.toLowerCase() as any)}
              </span>
              {task.assignedTo && task.assignedTo.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  <div className="flex flex-wrap gap-1">
                    {task.assignedTo.map((name, i) => (
                      <span key={name} className={cn(
                        "px-1.5 rounded-sm border",
                        i === 0 ? (isAdminCreated ? "bg-accent/20 border-accent/30 text-accent" : "bg-primary/20 border-primary/30 text-primary") : "bg-muted border-muted-foreground/20"
                      )}>
                        {name === 'Me' && isAdmin ? "Admin (Lead)" : (i === 0 ? `${name} (Lead)` : name)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {canEdit && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:bg-primary/10"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
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
              <div className="text-muted-foreground/30 px-2 flex items-center gap-1" title="Locked: Admin assigned">
                <Lock className="w-4 h-4" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              Work Progress Review
            </DialogTitle>
          </DialogHeader>
          
          <div className="bg-muted/30 p-3 rounded-lg border mb-4">
             <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Lead Assignee Responsibility</p>
             <p className="text-sm font-medium">As the primary responsible party, you must report the progress for this team task.</p>
          </div>

          {!showNotesInput ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                How is the progress on this task assigned by the Administrator?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={handleMarkComplete}
                  className="h-24 flex flex-col gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-8 h-8" />
                  <span>Completed</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleNotCompleted}
                  className="h-24 flex flex-col gap-2 border-accent text-accent hover:bg-accent/5"
                >
                  <XCircle className="w-8 h-8" />
                  <span>Not Completed</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <p className="text-sm font-medium">Please provide notes for the Administrator:</p>
              <Textarea 
                placeholder="Why is the task not completed? Any challenges for the team?" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px]"
              />
              <Button onClick={handleSaveNotes} className="w-full bg-accent text-accent-foreground">
                Submit Progress Notes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isEditing && (
        <TaskForm 
          taskToEdit={task} 
          open={isEditing} 
          onOpenChange={setIsEditing} 
        />
      )}
    </>
  );
}
