"use client";

import { Task } from '@/app/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Trash2, 
  Clock, 
  Tag, 
  ShieldCheck, 
  Lock, 
  Edit3, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  AlertCircle,
  CalendarClock,
  Activity,
  Percent,
  BarChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/app/context/TaskContext';
import { format, isPast } from 'date-fns';
import { useSettings } from '@/app/context/SettingsContext';
import { useAuth } from '@/app/context/AuthContext';
import { TaskForm } from './TaskForm';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');
  const [localProgress, setLocalProgress] = useState(task.progress || 0);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [isUrgentDeadline, setIsUrgentDeadline] = useState(false);

  const isOverdue = !task.completed && isPast(new Date(task.dueDate));
  const hasNotesAndInProgress = !!task.notes && !task.completed;

  useEffect(() => {
    const checkUrgency = () => {
      if (task.completed) {
        setIsUrgentDeadline(false);
        return;
      }
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const diffMs = dueDate.getTime() - now.getTime();
      const oneHourInMs = 1 * 60 * 60 * 1000;
      setIsUrgentDeadline(diffMs > 0 && diffMs <= oneHourInMs);
    };

    checkUrgency();
    const interval = setInterval(checkUrgency, 60000);
    return () => clearInterval(interval);
  }, [task.dueDate, task.completed]);

  useEffect(() => {
    if (progressDialogOpen) {
      setNotes(task.notes || '');
      setLocalProgress(task.progress || 0);
      setShowNotesInput(false);
    }
  }, [progressDialogOpen, task.notes, task.progress]);

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
        toast({ title: "Task Completed" });
      }
    } else {
      toggleTask(task.id);
    }
  };

  const handleMarkComplete = () => {
    updateTask(task.id, { completed: true, progress: 100 });
    setProgressDialogOpen(false);
    toast({ title: "Task Completed" });
  };

  const handleNotCompleted = () => {
    setShowNotesInput(true);
  };

  const handleSaveNotes = () => {
    updateTask(task.id, { 
      notes: notes, 
      completed: localProgress === 100, 
      progress: localProgress 
    });
    setProgressDialogOpen(false);
    setShowNotesInput(false);
    toast({ title: "Progress Updated" });
  };

  return (
    <>
      <Card className={cn(
        "group relative overflow-hidden transition-all hover:shadow-md border-l-4",
        task.completed ? "opacity-60 grayscale-[0.5] border-l-muted" : "border-l-primary",
        isAdminCreated && !isAdmin && !hasNotesAndInProgress && "bg-accent/[0.04] border-l-accent ring-1 ring-accent/10",
        hasNotesAndInProgress && "bg-green-50/80 dark:bg-green-950/20 border-l-green-500 ring-1 ring-green-500/20 shadow-sm",
        isUrgentDeadline && !isOverdue && "border-l-destructive bg-destructive/[0.03] ring-1 ring-destructive/20 animate-pulse-slow",
        isOverdue && "border-l-destructive bg-destructive/[0.05] ring-1 ring-destructive/30"
      )}>
        <CardContent className="p-3 md:p-4 flex items-start gap-3 md:gap-4">
          <div className="pt-0.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Checkbox 
                      checked={task.completed} 
                      onCheckedChange={handleToggleAttempt}
                      disabled={!canToggle}
                      className={cn(
                        "w-4 h-4 md:w-5 md:h-5 rounded-full",
                        !canToggle && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  </div>
                </TooltipTrigger>
                {!canToggle && (
                  <TooltipContent>
                    <p className="text-[10px] md:text-xs">Only the Lead Assignee ({leadAssignee}) can complete this task.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex-1 space-y-1.5 md:space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                <h3 className={cn(
                  "font-semibold text-sm md:text-lg leading-tight transition-all",
                  task.completed && "line-through text-muted-foreground",
                  (isUrgentDeadline || isOverdue) && "text-destructive font-bold"
                )}>
                  {task.title}
                </h3>
                {isAdminCreated && (
                  <Badge variant="secondary" className="text-[8px] md:text-[10px] h-3.5 md:h-4 px-1.5 flex gap-1 items-center bg-accent/20 text-accent-foreground border-accent/30 font-bold uppercase tracking-tighter">
                    <ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    Admin
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive" className="text-[8px] md:text-[10px] h-3.5 md:h-4 px-1.5 flex gap-1 items-center bg-destructive text-destructive-foreground font-black uppercase">
                    <AlertCircle className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    Overdue
                  </Badge>
                )}
                {isUrgentDeadline && !isOverdue && (
                  <Badge variant="destructive" className="text-[8px] md:text-[10px] h-3.5 md:h-4 px-1.5 flex gap-1 items-center animate-bounce">
                    <AlertTriangle className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    Due Soon
                  </Badge>
                )}
                {hasNotesAndInProgress && (
                  <Badge variant="secondary" className="text-[8px] md:text-[10px] h-3.5 md:h-4 px-1.5 flex gap-1 items-center bg-green-200 text-green-800 border-green-300 font-bold uppercase tracking-tighter">
                    <Activity className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    Reported
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 font-bold uppercase tracking-tighter", getPriorityColor(task.priority))}>
                  {t(task.priority.toLowerCase() as any)}
                </Badge>
              </div>
            </div>
            
            {task.description && (
              <p className="text-[11px] md:text-sm text-muted-foreground line-clamp-1 md:line-clamp-2">
                {task.description}
              </p>
            )}

            {!task.completed && task.progress !== undefined && (
              <div className="space-y-1 py-0.5">
                <div className="flex items-center justify-between text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" />
                    Progress
                  </span>
                  <span>{task.progress}%</span>
                </div>
                <Progress value={task.progress} className={cn("h-0.5 md:h-1", hasNotesAndInProgress && "[&>div]:bg-green-500")} />
              </div>
            )}

            {task.additionalTimeAllocated && !task.completed && (
              <div className="mt-1 flex items-center gap-1.5 p-1.5 rounded bg-accent/10 border border-accent/30 text-[8px] md:text-[10px] font-bold text-accent">
                <CalendarClock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span>{t('additionalTimeMessage')}</span>
              </div>
            )}

            {task.notes && (
              <div className={cn(
                "mt-1 p-1.5 rounded border border-dashed text-[10px] md:text-xs text-muted-foreground whitespace-pre-wrap",
                hasNotesAndInProgress ? "bg-green-100/50 border-green-300 text-green-900" : "bg-muted/50 border-muted-foreground/30"
              )}>
                <p className="font-bold flex items-center gap-1 mb-0.5">
                  <MessageSquare className="w-2.5 h-2.5 md:w-3 md:h-3" /> User Notes:
                </p>
                {task.notes}
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[9px] md:text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
              <span className={cn(
                "flex items-center gap-1 flex-wrap",
                (isUrgentDeadline || isOverdue) && "text-destructive"
              )}>
                <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                {format(new Date(task.dueDate), 'HH:mm - MMM dd')}
                {task.completed && task.completedAt && (
                  <span className="text-green-600 dark:text-green-400 ml-1 font-bold whitespace-nowrap">
                    (Done: {format(new Date(task.completedAt), 'HH:mm')})
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="w-2.5 h-2.5 md:w-3 md:h-3" />
                {t(task.category.toLowerCase() as any)}
              </span>
              <span className="flex items-center gap-1">
                <BarChart className="w-2.5 h-2.5 md:w-3 md:h-3" />
                {t(task.priority.toLowerCase() as any)}
              </span>
              {task.assignedTo && task.assignedTo.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <div className="flex flex-wrap gap-1">
                    {task.assignedTo.slice(0, 2).map((name, i) => (
                      <span key={name} className={cn(
                        "px-1 rounded-sm border text-[8px] md:text-[9px]",
                        i === 0 ? (isAdminCreated ? "bg-accent/20 border-accent/30 text-accent" : "bg-primary/20 border-primary/30 text-primary") : "bg-muted border-muted-foreground/20"
                      )}>
                        {name === 'Me' && isAdmin ? "Admin" : name}
                      </span>
                    ))}
                    {task.assignedTo.length > 2 && <span className="text-[8px] opacity-60">+{task.assignedTo.length - 2}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            {canEdit && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsEditing(true)}
                className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:bg-primary/10 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
            )}
            {canDelete ? (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => deleteTask(task.id)}
                className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
            ) : (
              <div className="text-muted-foreground/30 px-1 md:px-2 flex items-center gap-1" title="Locked: Admin assigned">
                <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
            <div className="space-y-6 py-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                    <Percent className="w-3.5 h-3.5 text-primary" />
                    Updated Progress
                  </Label>
                  <span className="text-sm font-black text-primary">{localProgress}%</span>
                </div>
                <Slider 
                  value={[localProgress]} 
                  onValueChange={(val) => setLocalProgress(val[0])} 
                  max={100} 
                  step={1} 
                  className="py-1"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Progress Notes for Administrator:</Label>
                <Textarea 
                  placeholder="Why is the task not completed? Any challenges for the team?" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <Button onClick={handleSaveNotes} className="w-full bg-accent text-accent-foreground font-bold h-12 uppercase tracking-wide">
                Submit Progress & Notes
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