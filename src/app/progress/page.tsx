
"use client";

import { TaskProvider, useTasks } from '@/app/context/TaskContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

function ProgressContent() {
  const { tasks } = useTasks();

  // Mock historical data generation for demonstration
  const generateStats = (days: number) => {
    return Array.from({ length: days }).map((_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      const dayTasks = tasks.filter(t => isSameDay(t.dueDate, date));
      return {
        date: format(date, 'MMM dd'),
        completed: dayTasks.filter(t => t.completed).length,
        total: dayTasks.length,
        rate: dayTasks.length > 0 ? (dayTasks.filter(t => t.completed).length / dayTasks.length) * 100 : 0
      };
    });
  };

  const dailyStats = generateStats(7);
  const monthlyStats = generateStats(30);

  return (
    <div className="min-h-screen pb-24 md:pt-20">
      <Navbar />
      
      <main className="max-w-screen-md mx-auto px-4 py-8 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-primary">Progress Review</h1>
          <p className="text-muted-foreground">Analyze your task completion trends</p>
        </header>

        <Tabs defaultValue="weekly" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Daily Completion</CardTitle>
                <CardDescription>Number of tasks completed over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase">AVG Completion Rate</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-bold">
                    {Math.round(dailyStats.reduce((acc, curr) => acc + curr.rate, 0) / 7)}%
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Best Performance</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-bold text-accent">
                    {Math.max(...dailyStats.map(s => s.completed))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Tasks in a day</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Completion Trend</CardTitle>
                <CardDescription>Visualizing your productivity over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-primary/5">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">Monthly Insights</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <span>Total tasks handled: <strong>{monthlyStats.reduce((acc, curr) => acc + curr.total, 0)}</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <span>Consistently active days: <strong>{monthlyStats.filter(s => s.total > 0).length}</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <span>Your peak performance was around <strong>{monthlyStats.sort((a,b) => b.completed - a.completed)[0]?.date}</strong></span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <TaskProvider>
      <ProgressContent />
    </TaskProvider>
  );
}
