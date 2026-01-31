import { useState, useEffect } from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { NotificationsDropdown } from './NotificationsDropdown';
import { ProfileDropdown } from './ProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';

export const WelcomeHeader = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const { profile, user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, [currentTime]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get display name with fallbacks
  const displayName = profile?.display_name || 
    user?.user_metadata?.full_name || 
    user?.email?.split('@')[0] || 
    'Student';

  return (
    <div className="gradient-hero rounded-xl sm:rounded-2xl p-3 sm:p-6 lg:p-8 mb-4 sm:mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 gradient-primary opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      {/* Top right controls */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex items-center gap-1 sm:gap-2">
        <NotificationsDropdown />
        <ThemeSwitcher />
      </div>
      
      <div className="relative z-10 pr-16 sm:pr-0">
        <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
          {/* Profile Dropdown Avatar */}
          <ProfileDropdown />
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 text-primary mb-0.5">
              <Sparkles className="w-3 h-3 sm:w-5 sm:h-5 shrink-0" />
              <span className="text-[10px] sm:text-sm font-medium">Student Dashboard</span>
            </div>
            <h1 className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight">
              {greeting}, <span className="text-gradient truncate">{displayName}!</span>
            </h1>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground text-[10px] sm:text-sm">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{formatDate(currentTime)}</span>
          </div>
          <div className="text-sm sm:text-xl lg:text-2xl font-mono font-semibold text-primary">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>
    </div>
  );
};
