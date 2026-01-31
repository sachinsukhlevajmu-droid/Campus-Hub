import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  User,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  action?: 'scroll-tasks' | 'scroll-flashcards' | 'scroll-timer';
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { icon: CheckSquare, label: 'Tasks', path: '/dashboard', action: 'scroll-tasks' },
  { icon: Timer, label: 'Timer', path: '/dashboard', action: 'scroll-timer' },
  { icon: BookOpen, label: 'Study', path: '/dashboard', action: 'scroll-flashcards' },
  { icon: User, label: 'Profile', path: '/profile-settings' },
];

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (item: NavItem) => {
    if (item.action) {
      // Scroll to specific section
      const scrollTargets: Record<string, string> = {
        'scroll-tasks': '[data-section="tasks"]',
        'scroll-flashcards': '[data-section="study"]',
        'scroll-timer': '[data-section="timer"]',
      };
      
      const target = document.querySelector(scrollTargets[item.action]);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (location.pathname !== item.path) {
        navigate(item.path);
      }
    } else {
      navigate(item.path);
    }
  };

  const isActive = (item: NavItem) => {
    if (item.path === '/profile-settings') {
      return location.pathname === '/profile-settings';
    }
    return location.pathname === '/dashboard' && !item.action;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 sm:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all min-w-[60px]",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                active && "bg-primary/10"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
