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
import { format, subDays, isSameDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useSettings } from '@/app/context/SettingsContext';
import { useState, useEffect } from 'react';

const chartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--primary))",
  },
  trend: {
    label: "Trend",
    color: "hsl(var(--accent))",
  }
} satisfies ChartConfig;

function ProgressContent() {
  const { tasks } = useTasks();
  const { t } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);

  useEffect(() => {
    if (mounted) {
      const generateStats = (days: number) => {
        return Array.from({ length: days }).map((_, i) => {
          const date = subDays(new Date(), days - 1 - i);
          const dayTasks = tasks.filter(t => isSameDay(new Date(t.dueDate), date));
          return {
            date: format(date, 'MMM dd'),
            completed: dayTasks.filter(t => t.completed).length,
            total: dayTasks.length,
            rate: dayTasks.length > 0 ? (dayTasks.filter(t => t.completed).length / dayTasks.length) * 100 : 0
          };
        });
      };
      setDailyStats(generateStats(7));
      setMonthlyStats(generateStats(30));
    }
  }, [mounted, tasks]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen pb-24 md:pb-10 md:pt-10">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-primary tracking-tight">{t('progressReview')}</h1>
          <p className="text-muted-foreground font-medium">{t('analyzeTrends')}</p>
        </header>

        <Tabs defaultValue="weekly" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 rounded-2xl h-12 max-w-md">
            <TabsTrigger value="weekly" className="rounded-xl font-bold">{t('weeklyView')}</TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-xl font-bold">{t('monthlyView')}</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm lg:col-span-2 rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold">{t('dailyCompletion')}</CardTitle>
                  <CardDescription>Number of tasks completed over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] p-6 pt-2">
                  <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" opacity={0.4} />
                        <XAxis dataKey="date" tick={{ fontWeight: 600, fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontWeight: 600, fontSize: 12 }} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="completed" fill="var(--color-completed)" radius={[6, 6, 0, 0]} barSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <Card className="border-none shadow-sm rounded-3xl bg-primary/5">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-xs font-black text-primary uppercase tracking-widest">{t('avgCompletionRate')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="text-5xl font-black text-primary">
                      {dailyStats.length > 0 ? Math.round(dailyStats.reduce((acc, curr) => acc + curr.rate, 0) / 7) : 0}%
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm rounded-3xl bg-accent/5">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-xs font-black text-accent uppercase tracking-widest">{t('bestPerformance')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="text-5xl font-black text-accent">
                      {dailyStats.length > 0 ? Math.max(...dailyStats.map(s => s.completed)) : 0}
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mt-1 tracking-tighter">Tasks in a single day</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm lg:col-span-2 rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold">{t('completionTrend')}</CardTitle>
                  <CardDescription>Visualizing your productivity over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] p-6 pt-2">
                  <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyStats} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" opacity={0.4} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontWeight: 600, fontSize: 10 }} 
                          axisLine={false} 
                          tickLine={false} 
                          interval={4}
                          dy={10}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontWeight: 600, fontSize: 12 }} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="completed" 
                          stroke="var(--color-trend)" 
                          strokeWidth={4}
                          dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-primary/[0.03] rounded-3xl border border-primary/10">
                <CardContent className="p-8">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <BarChart data={[]} className="w-4 h-4 text-primary" />
                    </div>
                    {t('monthlyInsights')}
                  </h3>
                  <ul className="space-y-6">
                    <li className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total tasks handled</p>
                      <p className="text-2xl font-bold text-primary">{monthlyStats.reduce((acc, curr) => acc + curr.total, 0)}</p>
                    </li>
                    <li className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Consistently active days</p>
                      <p className="text-2xl font-bold text-primary">{monthlyStats.filter(s => s.total > 0).length}</p>
                    </li>
                    <li className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Peak performance date</p>
                      <p className="text-2xl font-bold text-accent">{monthlyStats.length > 0 ? [...monthlyStats].sort((a,b) => b.completed - a.completed)[0]?.date : '...'}</p>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
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