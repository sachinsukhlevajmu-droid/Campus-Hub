import { useState, useEffect } from 'react';
import { Bell, Calendar, BookOpen, CheckCircle, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'task_due' | 'study_reminder' | 'task_overdue';
  title: string;
  message: string;
  time: string;
  read: boolean;
  taskId?: string;
}

export const NotificationsDropdown = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  // Fetch tasks and generate notifications
  useEffect(() => {
    if (!user) return;

    const fetchTasksAndGenerateNotifications = async () => {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .not('due_date', 'is', null);

      if (!tasks) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const newNotifications: Notification[] = [];

      tasks.forEach((task) => {
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          // Overdue
          newNotifications.push({
            id: `overdue-${task.id}`,
            type: 'task_overdue',
            title: 'Task Overdue!',
            message: `"${task.title}" was due ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`,
            time: task.due_date,
            read: false,
            taskId: task.id,
          });
        } else if (diffDays === 0) {
          // Due today
          newNotifications.push({
            id: `today-${task.id}`,
            type: 'task_due',
            title: 'Due Today!',
            message: `"${task.title}" is due today`,
            time: 'Today',
            read: false,
            taskId: task.id,
          });
        } else if (diffDays === 1) {
          // Due tomorrow
          newNotifications.push({
            id: `tomorrow-${task.id}`,
            type: 'task_due',
            title: 'Due Tomorrow',
            message: `"${task.title}" is due tomorrow`,
            time: 'Tomorrow',
            read: false,
            taskId: task.id,
          });
        } else if (diffDays <= 3) {
          // Due within 3 days
          newNotifications.push({
            id: `upcoming-${task.id}`,
            type: 'task_due',
            title: 'Upcoming Deadline',
            message: `"${task.title}" is due in ${diffDays} days`,
            time: `In ${diffDays} days`,
            read: false,
            taskId: task.id,
          });
        }
      });

      // Add study reminder based on time of day
      const hour = new Date().getHours();
      if (hour >= 9 && hour < 12) {
        newNotifications.unshift({
          id: 'study-morning',
          type: 'study_reminder',
          title: 'Morning Study Session',
          message: 'Great time for focused learning! Start your study session.',
          time: 'Now',
          read: false,
        });
      } else if (hour >= 14 && hour < 17) {
        newNotifications.unshift({
          id: 'study-afternoon',
          type: 'study_reminder',
          title: 'Afternoon Review',
          message: 'Perfect time to review your flashcards!',
          time: 'Now',
          read: false,
        });
      } else if (hour >= 19 && hour < 22) {
        newNotifications.unshift({
          id: 'study-evening',
          type: 'study_reminder',
          title: 'Evening Study',
          message: 'End your day with a quick revision session.',
          time: 'Now',
          read: false,
        });
      }

      setNotifications(newNotifications);
    };

    fetchTasksAndGenerateNotifications();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchTasksAndGenerateNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_due':
        return <Calendar className="h-4 w-4 text-warning" />;
      case 'task_overdue':
        return <Clock className="h-4 w-4 text-destructive" />;
      case 'study_reminder':
        return <BookOpen className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full hover:bg-primary/10 relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 sm:w-80" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-0",
                  !notification.read && "bg-primary/5"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className={cn(
                  "p-2 rounded-full shrink-0",
                  notification.type === 'task_overdue' ? 'bg-destructive/10' :
                  notification.type === 'task_due' ? 'bg-warning/10' : 'bg-primary/10'
                )}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    notification.read && "text-muted-foreground"
                  )}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.time}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(notification.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
