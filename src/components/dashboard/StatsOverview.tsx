import { BookOpen, CheckCircle2, Clock, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Task, ClassSchedule } from '@/types/dashboard';

export const StatsOverview = () => {
  const [tasks] = useLocalStorage<Task[]>('student-tasks', []);
  const [classes] = useLocalStorage<ClassSchedule[]>('student-classes', []);

  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const upcomingDeadlines = tasks.filter(t => {
    if (!t.dueDate || t.completed) return false;
    const due = new Date(t.dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // Within 7 days
  }).length;

  const stats = [
    {
      icon: CheckCircle2,
      label: 'Completed',
      value: completedTasks,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: pendingTasks,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: Target,
      label: 'Due Soon',
      value: upcomingDeadlines,
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-500/10',
    },
    {
      icon: BookOpen,
      label: 'Classes',
      value: classes.length,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label} className="gradient-card border shadow-soft hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
